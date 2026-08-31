import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import Constants, { AppOwnership, ExecutionEnvironment } from 'expo-constants';
import { supabase } from './supabase';
import { APP_CONFIG } from '../config/appConfig';

// Ensure any completed web auth session in Expo Go returns cleanly
WebBrowser.maybeCompleteAuthSession();

const webClientId = APP_CONFIG.GOOGLE_WEB_CLIENT_ID;

// Check if running inside standard Expo Go app
export const isExpoGo = (): boolean => {
  return (
    Constants.appOwnership === AppOwnership.Expo ||
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient
  );
};

// Safe native GoogleSignin accessor for standalone / development client builds
const getNativeGoogleSignin = () => {
  if (isExpoGo()) {
    return null;
  }
  try {
    const { GoogleSignin } = require('@react-native-google-signin/google-signin');
    return GoogleSignin;
  } catch (err) {
    console.warn('Native Google Sign-In module not available:', err);
    return null;
  }
};

export const configureGoogleSignIn = () => {
  if (isExpoGo()) {
    // No native setup required in Expo Go (browser OAuth is used)
    return;
  }

  const GoogleSignin = getNativeGoogleSignin();
  if (GoogleSignin) {
    GoogleSignin.configure({
      webClientId,
      scopes: ['profile', 'email'],
      offlineAccess: true,
    });
  }
};

/**
 * Universal Google Sign-In:
 * - Uses WebBrowser / AuthSession when running in Expo Go
 * - Uses Native Google Play Services One-Tap in Development Client APKs
 */
export const signInWithGoogle = async () => {
  // Option A1: Running inside Expo Go
  if (isExpoGo()) {
    const redirectUrl = AuthSession.makeRedirectUri({
      scheme: 'nutriscan',
      preferLocalhost: false,
    });

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) {
      throw error;
    }

    if (data?.url) {
      const authResult = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (authResult.type === 'success' && authResult.url) {
        // Extract auth tokens / URL fragments
        const urlFragment = authResult.url.includes('#')
          ? authResult.url.split('#')[1]
          : authResult.url.split('?')[1];

        if (urlFragment) {
          const params = new URLSearchParams(urlFragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (sessionError) throw sessionError;
            return sessionData;
          }
        }
      }
    }
    return null;
  }

  // Option A2: Running in Native Development Client / Standalone Build
  const GoogleSignin = getNativeGoogleSignin();
  if (!GoogleSignin) {
    throw new Error('Native Google Sign-In is only supported in custom development builds.');
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  const idToken = (response as any)?.data?.idToken || (response as any)?.idToken;

  if (!idToken) {
    throw new Error('Google Sign-In failed: No ID Token returned from Google.');
  }

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });

  if (error) {
    throw error;
  }

  return data;
};

export const signOutGoogle = async () => {
  try {
    const GoogleSignin = getNativeGoogleSignin();
    if (GoogleSignin) {
      await GoogleSignin.signOut();
    }
  } catch (error) {
    console.warn('Google native sign out warning:', error);
  } finally {
    await supabase.auth.signOut();
  }
};
