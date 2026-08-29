import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNutrition } from '../../context/NutritionContext';
import { PrimaryGoal } from '../../types/database';
import { CustomConfirmModal } from '../modals/CustomConfirmModal';
import {
  UserIcon,
  Target,
  LogOut,
  Check,
  Dumbbell,
  TrendingDown,
  Scale,
  Leaf,
  Sliders,
  UtensilsCrossed,
  ChevronRight,
  Clock,
  X,
} from '../ui/LucideIcons';

export const ProfileTab: React.FC = () => {
  const { user, profile, completeOnboarding, signOut } = useAuth();
  const { refreshDailyTotals, resetDailyTotals } = useNutrition();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [calories, setCalories] = useState(String(profile?.daily_calorie_target || 2400));
  const [protein, setProtein] = useState(String(profile?.daily_protein_target || 120));
  const [carbs, setCarbs] = useState(String(profile?.daily_carbs_target || 250));
  const [fat, setFat] = useState(String(profile?.daily_fat_target || 70));
  const [goal, setGoal] = useState<PrimaryGoal>(profile?.primary_goal || 'build_muscle');

  // App Settings State
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');

  // Meal Reminder Times State
  const [breakfastEnabled, setBreakfastEnabled] = useState(true);
  const [breakfastTime, setBreakfastTime] = useState('08:30 AM');

  const [lunchEnabled, setLunchEnabled] = useState(true);
  const [lunchTime, setLunchTime] = useState('12:30 PM');

  const [dinnerEnabled, setDinnerEnabled] = useState(true);
  const [dinnerTime, setDinnerTime] = useState('07:00 PM');

  // Time Picker Modal State
  const [editingMealType, setEditingMealType] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [tempHour, setTempHour] = useState('08');
  const [tempMinute, setTempMinute] = useState('30');
  const [tempAmPm, setTempAmPm] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (profile) {
      setCalories(String(profile.daily_calorie_target || 2400));
      setProtein(String(profile.daily_protein_target || 120));
      setCarbs(String(profile.daily_carbs_target || 250));
      setFat(String(profile.daily_fat_target || 70));
      setGoal(profile.primary_goal || 'build_muscle');
    }
  }, [profile]);

  const handleSaveTargets = async () => {
    const calNum = parseInt(calories, 10) || 2400;
    const protNum = parseInt(protein, 10) || 120;
    const carbNum = parseInt(carbs, 10) || 250;
    const fatNum = parseInt(fat, 10) || 70;

    setIsSaving(true);
    try {
      await completeOnboarding({
        daily_calorie_target: calNum,
        daily_protein_target: protNum,
        daily_carbs_target: carbNum,
        daily_fat_target: fatNum,
        primary_goal: goal,
      });

      await refreshDailyTotals();
      setIsEditing(false);
      setSuccessMsg('Your daily nutrition targets have been saved successfully.');
    } catch (err) {
      console.warn('[ProfileTab] Error saving targets:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const openTimePicker = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    let currentTime = breakfastTime;
    if (mealType === 'lunch') currentTime = lunchTime;
    if (mealType === 'dinner') currentTime = dinnerTime;

    const parts = currentTime.split(' ');
    const timeParts = (parts[0] || '08:00').split(':');
    setTempHour(timeParts[0] || '08');
    setTempMinute(timeParts[1] || '00');
    setTempAmPm((parts[1] as 'AM' | 'PM') || 'AM');
    setEditingMealType(mealType);
  };

  const saveCustomTime = () => {
    const formatted = `${tempHour.padStart(2, '0')}:${tempMinute.padStart(2, '0')} ${tempAmPm}`;
    if (editingMealType === 'breakfast') setBreakfastTime(formatted);
    if (editingMealType === 'lunch') setLunchTime(formatted);
    if (editingMealType === 'dinner') setDinnerTime(formatted);
    setEditingMealType(null);
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

  const goalOptions: { id: PrimaryGoal; label: string; icon: React.ReactNode }[] = [
    { id: 'build_muscle', label: 'Build Muscle', icon: <Dumbbell size={15} color="#FF5B00" /> },
    { id: 'fat_loss', label: 'Fat Loss', icon: <TrendingDown size={15} color="#E54D42" /> },
    { id: 'maintain', label: 'Maintain Weight', icon: <Scale size={15} color="#8C7B73" /> },
    { id: 'micronutrient', label: 'Healthy Eating', icon: <Leaf size={15} color="#2E7D32" /> },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Clean Profile Header Card */}
      <View style={styles.profileHeaderCard}>
        <View style={styles.avatarRow}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <UserIcon size={28} color="#FF5B00" />
            </View>
          )}

          <View style={styles.profileInfoCol}>
            <Text style={styles.profileName} numberOfLines={1}>
              {profile?.full_name || user?.email?.split('@')[0] || 'NutriScan User'}
            </Text>
            <Text style={styles.profileEmail}>
              {user?.email || 'Authenticated User'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Daily Target Goals Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardIconBox}>
            <Target size={18} color="#FF5B00" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardTitle}>Daily Target Goals</Text>
            <Text style={styles.cardSubtitle}>Mifflin-St Jeor calculated targets</Text>
          </View>
          <TouchableOpacity
            style={styles.editToggleBtn}
            onPress={() => setIsEditing(!isEditing)}
            activeOpacity={0.7}
          >
            <Sliders size={14} color="#FF5B00" />
            <Text style={styles.editToggleText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Goal Selector */}
        <Text style={styles.fieldLabel}>PRIMARY FITNESS GOAL</Text>
        <View style={styles.goalsGrid}>
          {goalOptions.map((opt) => {
            const isSelected = goal === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.goalChip, isSelected && styles.goalChipSelected]}
                onPress={() => isEditing && setGoal(opt.id)}
                disabled={!isEditing}
                activeOpacity={0.75}
              >
                {opt.icon}
                <Text style={[styles.goalChipText, isSelected && styles.goalChipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Calorie Target Input */}
        <View style={styles.inputGroup}>
          <Text style={styles.fieldLabel}>DAILY CALORIES (KCAL)</Text>
          <TextInput
            style={[styles.numericInput, isEditing && styles.numericInputActive]}
            value={calories}
            onChangeText={setCalories}
            keyboardType="number-pad"
            editable={isEditing}
          />
        </View>

        {/* Macro Target Row */}
        <View style={styles.macrosRow}>
          <View style={styles.macroCol}>
            <Text style={[styles.macroLabel, { color: '#E54D42' }]}>PROTEIN (G)</Text>
            <TextInput
              style={[styles.numericInput, isEditing && styles.numericInputActive]}
              value={protein}
              onChangeText={setProtein}
              keyboardType="number-pad"
              editable={isEditing}
            />
          </View>

          <View style={styles.macroCol}>
            <Text style={[styles.macroLabel, { color: '#F39C12' }]}>CARBS (G)</Text>
            <TextInput
              style={[styles.numericInput, isEditing && styles.numericInputActive]}
              value={carbs}
              onChangeText={setCarbs}
              keyboardType="number-pad"
              editable={isEditing}
            />
          </View>

          <View style={styles.macroCol}>
            <Text style={[styles.macroLabel, { color: '#8B5A2B' }]}>FAT (G)</Text>
            <TextInput
              style={[styles.numericInput, isEditing && styles.numericInputActive]}
              value={fat}
              onChangeText={setFat}
              keyboardType="number-pad"
              editable={isEditing}
            />
          </View>
        </View>

        {isEditing && (
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveTargets}
            disabled={isSaving}
            activeOpacity={0.85}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.saveBtnText}>Save Nutrition Targets</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 3. App Settings & Preferences Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={[styles.cardIconBox, { backgroundColor: '#FFF0E6' }]}>
            <Sliders size={18} color="#FF5B00" />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.cardTitle}>App Settings</Text>
            <Text style={styles.cardSubtitle}>Preferences & meal reminders</Text>
          </View>
        </View>

        {/* Clean Full-Width Units of Measurement Block */}
        <View style={styles.unitSettingBlock}>
          <View style={styles.unitTextRow}>
            <Text style={styles.settingTitle}>Units of Measurement</Text>
            <Text style={styles.settingSubtitle}>
              {unitSystem === 'metric' ? 'Metric (kg, cm, g)' : 'Imperial (lbs, ft, oz)'}
            </Text>
          </View>
          <View style={styles.unitSegmentedBar}>
            <TouchableOpacity
              style={[styles.unitSegmentBtn, unitSystem === 'metric' && styles.unitSegmentBtnActive]}
              onPress={() => setUnitSystem('metric')}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitSegmentText, unitSystem === 'metric' && styles.unitSegmentTextActive]}>
                Metric (kg, cm)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitSegmentBtn, unitSystem === 'imperial' && styles.unitSegmentBtnActive]}
              onPress={() => setUnitSystem('imperial')}
              activeOpacity={0.8}
            >
              <Text style={[styles.unitSegmentText, unitSystem === 'imperial' && styles.unitSegmentTextActive]}>
                Imperial (lbs, ft)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Customizable Meal Reminder Notifications */}
        <Text style={styles.fieldLabel}>MEAL REMINDER NOTIFICATIONS</Text>

        {/* Breakfast Reminder Row */}
        <View style={styles.reminderRow}>
          <View style={styles.reminderInfoCol}>
            <Text style={styles.reminderLabel}>Breakfast</Text>
            <TouchableOpacity
              style={styles.timePickerChip}
              onPress={() => openTimePicker('breakfast')}
              activeOpacity={0.75}
            >
              <Clock size={13} color="#FF5B00" />
              <Text style={styles.timePickerChipText}>{breakfastTime}</Text>
            </TouchableOpacity>
          </View>
          <Switch
            value={breakfastEnabled}
            onValueChange={setBreakfastEnabled}
            trackColor={{ false: '#EFE7DF', true: '#FF5B00' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Lunch Reminder Row */}
        <View style={styles.reminderRow}>
          <View style={styles.reminderInfoCol}>
            <Text style={styles.reminderLabel}>Lunch</Text>
            <TouchableOpacity
              style={styles.timePickerChip}
              onPress={() => openTimePicker('lunch')}
              activeOpacity={0.75}
            >
              <Clock size={13} color="#FF5B00" />
              <Text style={styles.timePickerChipText}>{lunchTime}</Text>
            </TouchableOpacity>
          </View>
          <Switch
            value={lunchEnabled}
            onValueChange={setLunchEnabled}
            trackColor={{ false: '#EFE7DF', true: '#FF5B00' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Dinner Reminder Row */}
        <View style={styles.reminderRow}>
          <View style={styles.reminderInfoCol}>
            <Text style={styles.reminderLabel}>Dinner</Text>
            <TouchableOpacity
              style={styles.timePickerChip}
              onPress={() => openTimePicker('dinner')}
              activeOpacity={0.75}
            >
              <Clock size={13} color="#FF5B00" />
              <Text style={styles.timePickerChipText}>{dinnerTime}</Text>
            </TouchableOpacity>
          </View>
          <Switch
            value={dinnerEnabled}
            onValueChange={setDinnerEnabled}
            trackColor={{ false: '#EFE7DF', true: '#FF5B00' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.divider} />

        {/* Reset Tracker Button */}
        <TouchableOpacity
          style={styles.resetTrackerBtn}
          onPress={handleResetToday}
          activeOpacity={0.8}
        >
          <UtensilsCrossed size={15} color="#FF5B00" />
          <Text style={styles.resetTrackerText}>Reset Today's Daily Intake</Text>
        </TouchableOpacity>
      </View>

      {/* 4. Clean Account Actions Card (Clean Sign Out Row) */}
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.signOutRow}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <View style={styles.signOutIconBox}>
            <LogOut size={16} color="#C62828" />
          </View>
          <Text style={styles.signOutRowText}>Sign Out of NutriScan</Text>
          <ChevronRight size={18} color="#8C7B73" />
        </TouchableOpacity>
      </View>

      {/* 5. Interactive Time Picker Modal */}
      <Modal
        visible={editingMealType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingMealType(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Set {editingMealType === 'breakfast' ? 'Breakfast' : editingMealType === 'lunch' ? 'Lunch' : 'Dinner'} Time
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditingMealType(null)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color="#FF5B00" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.timeAdjusterRow}>
              {/* Hours */}
              <View style={styles.stepperCol}>
                <Text style={styles.stepperLabel}>HOUR</Text>
                <TextInput
                  style={styles.stepperInput}
                  value={tempHour}
                  onChangeText={(val) => {
                    const num = parseInt(val, 10);
                    if (val === '' || (num >= 1 && num <= 12)) setTempHour(val);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              <Text style={styles.timeColon}>:</Text>

              {/* Minutes */}
              <View style={styles.stepperCol}>
                <Text style={styles.stepperLabel}>MINUTE</Text>
                <TextInput
                  style={styles.stepperInput}
                  value={tempMinute}
                  onChangeText={(val) => {
                    const num = parseInt(val, 10);
                    if (val === '' || (num >= 0 && num <= 59)) setTempMinute(val);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>

              {/* AM / PM */}
              <View style={styles.amPmCol}>
                <Text style={styles.stepperLabel}>PERIOD</Text>
                <View style={styles.amPmToggleRow}>
                  <TouchableOpacity
                    style={[styles.amPmBtn, tempAmPm === 'AM' && styles.amPmBtnActive]}
                    onPress={() => setTempAmPm('AM')}
                  >
                    <Text style={[styles.amPmBtnText, tempAmPm === 'AM' && styles.amPmBtnTextActive]}>
                      AM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.amPmBtn, tempAmPm === 'PM' && styles.amPmBtnActive]}
                    onPress={() => setTempAmPm('PM')}
                  >
                    <Text style={[styles.amPmBtnText, tempAmPm === 'PM' && styles.amPmBtnTextActive]}>
                      PM
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={saveCustomTime}
              activeOpacity={0.85}
            >
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.modalSaveBtnText}>Set Reminder Time</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 6. Custom Warm Reset Intake Confirmation Modal */}
      <CustomConfirmModal
        visible={showResetConfirm}
        title="Reset Today's Intake"
        message="Are you sure you want to clear today's consumed calories and macro progress? This cannot be undone."
        confirmText="Reset Intake"
        cancelText="Cancel"
        confirmStyle="danger"
        icon={<UtensilsCrossed size={24} color="#C62828" />}
        onConfirm={confirmResetToday}
        onCancel={() => setShowResetConfirm(false)}
      />

      {/* 7. Custom Warm Sign Out Confirmation Modal */}
      <CustomConfirmModal
        visible={showSignOutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of NutriScan on this device?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmStyle="danger"
        icon={<LogOut size={24} color="#C62828" />}
        onConfirm={confirmSignOut}
        onCancel={() => setShowSignOutConfirm(false)}
      />

      {/* 8. Success Status Modal */}
      <CustomConfirmModal
        visible={!!successMsg}
        title="Targets Saved"
        message={successMsg || ''}
        confirmText="Done"
        cancelText="Close"
        confirmStyle="primary"
        icon={<Check size={24} color="#FF5B00" strokeWidth={2.5} />}
        onConfirm={() => setSuccessMsg(null)}
        onCancel={() => setSuccessMsg(null)}
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
    paddingTop: 12,
    paddingBottom: 110,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2A1810',
  },
  profileEmail: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8C7B73',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C7B73',
  },
  editToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  editToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5B00',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C7B73',
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 8,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    gap: 6,
  },
  goalChipSelected: {
    backgroundColor: '#FFF0E6',
    borderColor: '#FF5B00',
  },
  goalChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C7B73',
  },
  goalChipTextSelected: {
    color: '#FF5B00',
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 10,
  },
  numericInput: {
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  numericInputActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FF5B00',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroCol: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5B00',
    borderRadius: 18,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  unitSettingBlock: {
    marginVertical: 4,
  },
  unitTextRow: {
    marginBottom: 8,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A1810',
  },
  settingSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C7B73',
    marginTop: 2,
  },
  unitSegmentedBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  unitSegmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitSegmentBtnActive: {
    backgroundColor: '#FF5B00',
  },
  unitSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8C7B73',
  },
  unitSegmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#EFE7DF',
    marginVertical: 12,
  },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  reminderInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reminderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A1810',
    minWidth: 70,
  },
  timePickerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFE0CC',
    gap: 5,
  },
  timePickerChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5B00',
  },
  resetTrackerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0E6',
    borderRadius: 14,
    paddingVertical: 10,
    marginTop: 6,
    gap: 6,
  },
  resetTrackerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5B00',
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  signOutIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  signOutRowText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#C62828',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 24, 16, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
  },
  timeAdjusterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  stepperCol: {
    alignItems: 'center',
  },
  stepperLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8C7B73',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  stepperInput: {
    width: 56,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#FAF6F0',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#2A1810',
  },
  timeColon: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2A1810',
    marginTop: 14,
  },
  amPmCol: {
    alignItems: 'center',
    marginLeft: 6,
  },
  amPmToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    height: 50,
    alignItems: 'center',
  },
  amPmBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 11,
  },
  amPmBtnActive: {
    backgroundColor: '#FF5B00',
  },
  amPmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8C7B73',
  },
  amPmBtnTextActive: {
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5B00',
    borderRadius: 18,
    paddingVertical: 12,
    gap: 6,
  },
  modalSaveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
