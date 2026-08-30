import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNutrition } from '../../context/NutritionContext';
import { PrimaryGoal } from '../../types/database';
import { CustomConfirmModal } from '../modals/CustomConfirmModal';
import { DailyGoalsSubScreen } from '../profile/DailyGoalsSubScreen';
import { AppSettingsSubScreen } from '../profile/AppSettingsSubScreen';
import {
  UserIcon,
  Target,
  LogOut,
  Sliders,
  UtensilsCrossed,
  ChevronRight,
} from '../ui/LucideIcons';

export const ProfileTab: React.FC = () => {
  const { user, profile, completeOnboarding, signOut } = useAuth();
  const { refreshDailyTotals, resetDailyTotals } = useNutrition();

  // Navigation Sub-Screen State
  const [currentScreen, setCurrentScreen] = useState<'menu' | 'goals' | 'settings'>('menu');

  // Confirmation Modals State
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // App Settings State
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  const [breakfastEnabled, setBreakfastEnabled] = useState(true);
  const [breakfastTime, setBreakfastTime] = useState('08:30 AM');
  const [lunchEnabled, setLunchEnabled] = useState(true);
  const [lunchTime, setLunchTime] = useState('12:30 PM');
  const [dinnerEnabled, setDinnerEnabled] = useState(true);
  const [dinnerTime, setDinnerTime] = useState('07:00 PM');

  const handleSaveGoals = async (data: {
    daily_calorie_target: number;
    daily_protein_target: number;
    daily_carbs_target: number;
    daily_fat_target: number;
    primary_goal: PrimaryGoal;
  }) => {
    await completeOnboarding(data);
    await refreshDailyTotals();
  };

  const handleResetToday = () => {
    setShowResetConfirm(true);
  };

  const confirmResetToday = () => {
    setShowResetConfirm(false);
    resetDailyTotals();
  };

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = async () => {
    setShowSignOutConfirm(false);
    await signOut();
  };

  // 1. Sub-screen: Daily Nutrition Goals
  if (currentScreen === 'goals') {
    return (
      <DailyGoalsSubScreen
        initialCalories={profile?.daily_calorie_target || 2400}
        initialProtein={profile?.daily_protein_target || 120}
        initialCarbs={profile?.daily_carbs_target || 250}
        initialFat={profile?.daily_fat_target || 70}
        initialGoal={profile?.primary_goal || 'build_muscle'}
        onSave={handleSaveGoals}
        onBack={() => setCurrentScreen('menu')}
      />
    );
  }

  // 2. Sub-screen: App Settings & Reminders
  if (currentScreen === 'settings') {
    return (
      <AppSettingsSubScreen
        unitSystem={unitSystem}
        onUnitSystemChange={setUnitSystem}
        breakfastEnabled={breakfastEnabled}
        onBreakfastEnabledChange={setBreakfastEnabled}
        breakfastTime={breakfastTime}
        onBreakfastTimeChange={setBreakfastTime}
        lunchEnabled={lunchEnabled}
        onLunchEnabledChange={setLunchEnabled}
        lunchTime={lunchTime}
        onLunchTimeChange={setLunchTime}
        dinnerEnabled={dinnerEnabled}
        onDinnerEnabledChange={setDinnerEnabled}
        dinnerTime={dinnerTime}
        onDinnerTimeChange={setDinnerTime}
        onBack={() => setCurrentScreen('menu')}
      />
    );
  }

  // 3. Main Menu View: Option C Grouped Inset Sections
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile & Settings</Text>
      </View>

      {/* Clean User Identity Row */}
      <View style={styles.profileIdentityRow}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <UserIcon size={26} color="#FF5B00" />
          </View>
        )}

        <View style={styles.profileInfoCol}>
          <Text style={styles.profileName} numberOfLines={1}>
            {profile?.full_name || user?.email?.split('@')[0] || 'NutriScan User'}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {user?.email || 'Authenticated User'}
          </Text>
        </View>
      </View>

      {/* Group 1 Inset Card: Preferences & Goals */}
      <View style={styles.groupedCard}>
        {/* Item 1: Daily Target Goals */}
        <TouchableOpacity
          style={styles.menuRowItem}
          onPress={() => setCurrentScreen('goals')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#FFF0E6' }]}>
            <Target size={16} color="#FF5B00" strokeWidth={2.2} />
          </View>

          <Text style={styles.menuItemTitle}>Daily Nutrition Goals</Text>
          <ChevronRight size={16} color="#B5A8A0" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.cardInnerDivider} />

        {/* Item 2: App Settings & Reminders */}
        <TouchableOpacity
          style={styles.menuRowItem}
          onPress={() => setCurrentScreen('settings')}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#FFF0E6' }]}>
            <Sliders size={16} color="#FF5B00" strokeWidth={2.2} />
          </View>

          <Text style={styles.menuItemTitle}>App Settings & Reminders</Text>
          <ChevronRight size={16} color="#B5A8A0" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Group 2 Inset Card: Intake & Account Actions */}
      <View style={styles.groupedCard}>
        {/* Item 3: Reset Daily Intake */}
        <TouchableOpacity
          style={styles.menuRowItem}
          onPress={handleResetToday}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#FFF5EB' }]}>
            <UtensilsCrossed size={16} color="#FF5B00" strokeWidth={2.2} />
          </View>

          <Text style={styles.menuItemTitle}>Reset Today's Intake</Text>
          <ChevronRight size={16} color="#B5A8A0" strokeWidth={2} />
        </TouchableOpacity>

        <View style={styles.cardInnerDivider} />

        {/* Item 4: Sign Out */}
        <TouchableOpacity
          style={styles.menuRowItem}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <View style={[styles.menuIconContainer, { backgroundColor: '#FFEBEE' }]}>
            <LogOut size={16} color="#C62828" strokeWidth={2.2} />
          </View>

          <Text style={[styles.menuItemTitle, { color: '#C62828' }]}>Sign Out</Text>
          <ChevronRight size={16} color="#B5A8A0" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* App Version Info */}
      <View style={styles.footerVersion}>
        <Text style={styles.footerBrand}>NutriScan AI v1.0.0</Text>
      </View>

      {/* Reset Intake Confirm Dialog */}
      <CustomConfirmModal
        visible={showResetConfirm}
        title="Reset Today's Intake?"
        message="This will clear all logged calories and macronutrients for today. Your historical diary logs for other days will remain safe."
        confirmText="Reset Intake"
        confirmStyle="danger"
        icon={<UtensilsCrossed size={24} color="#C62828" />}
        onConfirm={confirmResetToday}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* Sign Out Confirm Dialog */}
      <CustomConfirmModal
        visible={showSignOutConfirm}
        title="Sign Out of NutriScan?"
        message="You will need to sign back in with your Google account to access your saved meal logs."
        confirmText="Sign Out"
        confirmStyle="danger"
        icon={<LogOut size={24} color="#C62828" />}
        onConfirm={confirmSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 110,
  },
  header: {
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A1810',
  },
  profileIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
    gap: 12,
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#FF5B00',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.2,
    borderColor: '#FFE2D1',
  },
  profileInfoCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
  },
  profileEmail: {
    fontSize: 12.5,
    color: '#7D6E66',
    fontWeight: '500',
    marginTop: 2,
  },
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: '#EFE7DF',
    marginBottom: 14,
    overflow: 'hidden',
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  menuIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: '#2A1810',
  },
  cardInnerDivider: {
    height: 1,
    backgroundColor: '#F5EFEA',
    marginLeft: 60,
  },
  footerVersion: {
    alignItems: 'center',
    marginTop: 24,
    gap: 2,
  },
  footerBrand: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#A89A92',
  },
});
