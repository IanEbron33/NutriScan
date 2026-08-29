import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../services/supabase';
import { configureGoogleSignIn, signInWithGoogle as performGoogleSignIn, signOutGoogle } from '../services/googleAuth';
import { Profile } from '../types/database';
import { getLocalProfile, saveLocalProfile } from '../services/localDatabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isGoogleLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  completeOnboarding: (data: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const fetchUserProfile = async (currentUser: User) => {
    try {
      // 1. Check local SQLite cache first (instant offline read)
      const localSqliteProfile = getLocalProfile(currentUser.id);

      // 2. Check local device SecureStore cache
      let localOnboarded = localSqliteProfile?.is_onboarded || false;
      let localData: Partial<Profile> | null = localSqliteProfile;
      try {
        const cached = await SecureStore.getItemAsync(`nutriscan_onboarded_${currentUser.id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          localOnboarded = localOnboarded || (parsed?.is_onboarded ?? false);
          localData = { ...localData, ...parsed };
        }
      } catch (storeErr) {
        console.warn('Could not read secure store cache:', storeErr);
      }

      // If we have local profile, set immediately for 0ms startup
      if (localSqliteProfile) {
        setProfile(localSqliteProfile);
      }

      // 3. Query Supabase profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      const meta = currentUser.user_metadata || {};
      const cloudOnboarded = meta.is_onboarded === true;
      const dbOnboarded = data?.is_onboarded === true;
      const isOnboarded = dbOnboarded || cloudOnboarded || localOnboarded;

      let resolvedProfile: Profile;

      if (data && !error) {
        resolvedProfile = {
          ...(data as Profile),
          is_onboarded: isOnboarded,
          daily_calorie_target: data.daily_calorie_target || meta.daily_calorie_target || localData?.daily_calorie_target || 2400,
          daily_protein_target: data.daily_protein_target || meta.daily_protein_target || localData?.daily_protein_target || 120,
          daily_carbs_target: data.daily_carbs_target || meta.daily_carbs_target || localData?.daily_carbs_target || 250,
          daily_fat_target: data.daily_fat_target || meta.daily_fat_target || localData?.daily_fat_target || 70,
        };
      } else {
        // Fallback to Google / Auth metadata and local SQLite cache
        resolvedProfile = {
          id: currentUser.id,
          email: currentUser.email || null,
          full_name: meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'User',
          avatar_url: meta.avatar_url || meta.picture || null,
          is_onboarded: isOnboarded,
          daily_calorie_target: meta.daily_calorie_target || localData?.daily_calorie_target || 2400,
          daily_protein_target: meta.daily_protein_target || localData?.daily_protein_target || 120,
          daily_carbs_target: meta.daily_carbs_target || localData?.daily_carbs_target || 250,
          daily_fat_target: meta.daily_fat_target || localData?.daily_fat_target || 70,
          gender: meta.gender || localData?.gender,
          age: meta.age || localData?.age,
          height_cm: meta.height_cm || localData?.height_cm,
          weight_kg: meta.weight_kg || localData?.weight_kg,
          activity_level: meta.activity_level || localData?.activity_level,
          primary_goal: meta.primary_goal || localData?.primary_goal,
          streak_days: 1,
        };
      }

      setProfile(resolvedProfile);
      // Cache profile into local SQLite
      saveLocalProfile(resolvedProfile);
    } catch (err) {
      console.warn('Could not fetch database profile, using session metadata fallback:', err);
    }
  };

  useEffect(() => {
    configureGoogleSignIn();

    // 1. Check existing session on load
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      const currentSession = data?.session ?? null;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user);
      }
      setIsLoading(false);
    });

    // 2. Listen to real-time auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: string, authSession: Session | null) => {
      setSession(authSession);
      setUser(authSession?.user ?? null);
      if (authSession?.user) {
        await fetchUserProfile(authSession.user);
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsGoogleLoading(true);
      const authData: any = await performGoogleSignIn();
      if (authData?.user) {
        await fetchUserProfile(authData.user);
      } else if (authData?.session?.user) {
        await fetchUserProfile(authData.session.user);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    if (data.user) {
      await fetchUserProfile(data.user);
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0],
        },
      },
    });
    if (error) throw error;
    if (data.user) {
      await fetchUserProfile(data.user);
    }
  };

  const signOut = async () => {
    await signOutGoogle();
    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user);
    }
  };

  const completeOnboarding = async (onboardingData: Partial<Profile>) => {
    if (!user) return;
    const updatedPayload: Partial<Profile> = {
      ...onboardingData,
      is_onboarded: true,
      updated_at: new Date().toISOString(),
    };

    // 1. Layer 1: Cloud Auth User Metadata (Permanent across all devices & logins)
    try {
      await supabase.auth.updateUser({
        data: {
          is_onboarded: true,
          gender: onboardingData.gender,
          age: onboardingData.age,
          height_cm: onboardingData.height_cm,
          weight_kg: onboardingData.weight_kg,
          activity_level: onboardingData.activity_level,
          primary_goal: onboardingData.primary_goal,
          daily_calorie_target: onboardingData.daily_calorie_target,
          daily_protein_target: onboardingData.daily_protein_target,
          daily_carbs_target: onboardingData.daily_carbs_target,
          daily_fat_target: onboardingData.daily_fat_target,
        },
      });
    } catch (authErr) {
      console.warn('Could not update user cloud auth metadata:', authErr);
    }

    // 2. Layer 2: Local Device SecureStore Cache (Immediate and offline-resilient)
    try {
      await SecureStore.setItemAsync(
        `nutriscan_onboarded_${user.id}`,
        JSON.stringify({ is_onboarded: true, ...onboardingData })
      );
    } catch (storeErr) {
      console.warn('Could not write to secure store:', storeErr);
    }

    // 3. Layer 3: Database Table Upsert & Local SQLite Save
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
          avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url,
          ...updatedPayload,
        })
        .select()
        .single();

      if (!error && data) {
        setProfile(data as Profile);
        saveLocalProfile(data as Profile);
      } else {
        const fallbackProfile = profile ? { ...profile, ...updatedPayload, is_onboarded: true } as Profile : null;
        setProfile(fallbackProfile);
        if (fallbackProfile) saveLocalProfile(fallbackProfile);
      }
    } catch (err) {
      console.warn('Error completing onboarding in database:', err);
      const fallbackProfile = profile ? { ...profile, ...updatedPayload, is_onboarded: true } as Profile : null;
      setProfile(fallbackProfile);
      if (fallbackProfile) saveLocalProfile(fallbackProfile);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isGoogleLoading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshProfile,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
