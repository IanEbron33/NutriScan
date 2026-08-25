import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import {
  MuscleFlex,
  TrendingDown,
  Scale,
  Leaf,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Activity,
  UserIcon,
} from '../components/ui/LucideIcons';
import {
  calculateDailyTargets,
  NutritionCalculatorInputs,
} from '../utils/nutritionCalculator';
import { ActivityLevel, Gender, PrimaryGoal } from '../types/database';
import { ScrollWheelPickerModal } from '../components/ui/ScrollWheelPickerModal';

const { width } = Dimensions.get('window');

interface GoalOption {
  id: PrimaryGoal;
  title: string;
  description: string;
  icon: typeof MuscleFlex;
}

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'build_muscle',
    title: 'Build Muscle & Mass',
    description: 'Higher protein targets and calibrated surplus for optimal growth.',
    icon: MuscleFlex,
  },
  {
    id: 'fat_loss',
    title: 'Fat Loss & Cutting',
    description: 'Caloric deficit management while preserving lean mass.',
    icon: TrendingDown,
  },
  {
    id: 'maintain',
    title: 'Maintain Weight',
    description: 'Balanced macros for sustained energy and daily performance.',
    icon: Scale,
  },
  {
    id: 'micronutrient',
    title: 'Micronutrient Focus',
    description: 'Track vitamins and minerals over raw calorie counting.',
    icon: Leaf,
  },
];

interface ActivityOption {
  id: ActivityLevel;
  title: string;
  subtitle: string;
}

const ACTIVITY_OPTIONS: ActivityOption[] = [
  { id: 'sedentary', title: 'Sedentary', subtitle: 'Desk job' },
  { id: 'light', title: 'Light Active', subtitle: '1–3 days/wk' },
  { id: 'moderate', title: 'Moderate', subtitle: '3–5 days/wk' },
  { id: 'very_active', title: 'Very Active', subtitle: '6–7 days/wk' },
];

export const OnboardingScreen: React.FC = () => {
  const { completeOnboarding } = useAuth();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAgeModalOpen, setIsAgeModalOpen] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / 3)).current;

  // Step 1: Physical stats
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState<string>('21');
  const [heightCm, setHeightCm] = useState<string>('175');
  const [weightKg, setWeightKg] = useState<string>('72');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('light');

  // Step 2: Goal selection (default: Build Muscle matching the mockup)
  const [selectedGoal, setSelectedGoal] = useState<PrimaryGoal>('build_muscle');

  // Calculate live targets
  const calculatedTargets = useMemo(() => {
    const inputs: NutritionCalculatorInputs = {
      gender,
      age: parseInt(age, 10) || 21,
      height_cm: parseInt(heightCm, 10) || 170,
      weight_kg: parseFloat(weightKg) || 70,
      activity_level: activityLevel,
      primary_goal: selectedGoal,
    };
    return calculateDailyTargets(inputs);
  }, [gender, age, heightCm, weightKg, activityLevel, selectedGoal]);

  // Validation
  const isStep1Valid = useMemo(() => {
    const a = parseInt(age, 10);
    const h = parseInt(heightCm, 10);
    const w = parseFloat(weightKg);
    return a >= 12 && a <= 100 && h >= 90 && h <= 240 && w >= 30 && w <= 300;
  }, [age, heightCm, weightKg]);

  const goToStep = (targetStep: 1 | 2 | 3, direction: 'forward' | 'backward') => {
    const exitOffset = direction === 'forward' ? -26 : 26;
    const enterOffset = direction === 'forward' ? 26 : -26;

    // 1. Smoothly animate Progress Bar
    Animated.timing(progressAnim, {
      toValue: targetStep / 3,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 2. Slide and fade current step out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: exitOffset,
        duration: 100,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 3. Switch step state and position incoming step
      setCurrentStep(targetStep);
      slideAnim.setValue(enterOffset);

      // 4. Slide and fade new step in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleFinishOnboarding = async () => {
    try {
      setIsSubmitting(true);
      await completeOnboarding({
        gender,
        age: parseInt(age, 10) || 21,
        height_cm: parseInt(heightCm, 10) || 170,
        weight_kg: parseFloat(weightKg) || 70,
        activity_level: activityLevel,
        primary_goal: selectedGoal,
        daily_calorie_target: calculatedTargets.daily_calorie_target,
        daily_protein_target: calculatedTargets.daily_protein_target,
        daily_carbs_target: calculatedTargets.daily_carbs_target,
        daily_fat_target: calculatedTargets.daily_fat_target,
      });
    } catch (err) {
      console.warn('Failed to complete onboarding:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepLabels: Record<1 | 2 | 3, string> = {
    1: 'Profile',
    2: 'Goals',
    3: 'Targets',
  };

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Ambient background glow accents matching DESIGN.md */}
      <View style={styles.glowTopRight} pointerEvents="none" />
      <View style={styles.glowBottomLeft} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Indicator Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            {currentStep > 1 ? (
              <TouchableOpacity
                onPress={() => goToStep((currentStep - 1) as any, 'backward')}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ArrowLeft size={18} color="#2A1810" />
              </TouchableOpacity>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}

            <Text style={styles.stepTitle}>STEP {currentStep} OF 3</Text>
            <Text style={styles.categoryBadge}>{stepLabels[currentStep]}</Text>
          </View>

          {/* Animated Progress Bar */}
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { width: progressBarWidth },
              ]}
            />
          </View>
        </View>

        {/* Animated Container for Step Views */}
        <Animated.View
          style={[
            styles.animatedStepWrapper,
            {
              opacity: fadeAnim,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >

        {/* ------------------------------------------------------------- */}
        {/* STEP 1: Biological Profile & Activity                         */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 1 && (
          <View style={styles.stepContainer}>
            <View style={styles.titleSectionCompact}>
              <Text style={styles.mainHeading}>Tell us about yourself</Text>
            </View>

            {/* Biological Sex */}
            <Text style={styles.fieldLabel}>BIOLOGICAL SEX</Text>
            <View style={styles.genderRow}>
              {(['male', 'female', 'other'] as Gender[]).map((g) => {
                const active = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[styles.genderPill, active && styles.genderPillActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.genderText, active && styles.genderTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Numeric Inputs Grid */}
            <View style={styles.inputsGrid}>
              {/* Interactive Age Card with Scroll Picker Modal */}
              <TouchableOpacity
                style={styles.inputCard}
                onPress={() => setIsAgeModalOpen(true)}
                activeOpacity={0.75}
              >
                <Text style={styles.inputCardLabel}>AGE</Text>
                <View style={styles.inputCardRow}>
                  <Text style={styles.textInput}>{age}</Text>
                  <Text style={styles.inputUnit}>yrs</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.inputCard}>
                <Text style={styles.inputCardLabel}>HEIGHT</Text>
                <View style={styles.inputCardRow}>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    maxLength={3}
                    value={heightCm}
                    onChangeText={setHeightCm}
                  />
                  <Text style={styles.inputUnit}>cm</Text>
                </View>
              </View>

              <View style={styles.inputCard}>
                <Text style={styles.inputCardLabel}>WEIGHT</Text>
                <View style={styles.inputCardRow}>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    maxLength={4}
                    value={weightKg}
                    onChangeText={setWeightKg}
                  />
                  <Text style={styles.inputUnit}>kg</Text>
                </View>
              </View>
            </View>

            {/* Activity Level - 2x2 Grid */}
            <Text style={[styles.fieldLabel, { marginTop: 18 }]}>ACTIVITY LEVEL</Text>
            <View style={styles.activityGrid}>
              {ACTIVITY_OPTIONS.map((item) => {
                const active = activityLevel === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setActivityLevel(item.id)}
                    style={[styles.activityGridCard, active && styles.activityGridCardActive]}
                    activeOpacity={0.8}
                  >
                    <View style={styles.activityGridHeader}>
                      <Text style={[styles.activityGridTitle, active && styles.activityGridTitleActive]}>
                        {item.title}
                      </Text>
                      {active && <CheckCircle2 size={16} color="#FF5B00" />}
                    </View>
                    <Text style={styles.activityGridSubtitle}>{item.subtitle}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Continue CTA */}
            <TouchableOpacity
              style={[styles.primaryButton, !isStep1Valid && styles.primaryButtonDisabled]}
              disabled={!isStep1Valid}
              onPress={() => goToStep(2, 'forward')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Next: Choose Goal</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 2: Primary Focus / Goal (Exact Mockup Match)             */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 2 && (
          <View style={styles.stepContainer}>
            <View style={styles.titleSectionCompact}>
              <Text style={styles.mainHeading}>What's your primary focus?</Text>
            </View>

            {/* 4 Interactive Goal Selection Cards */}
            <View style={styles.goalCardsList}>
              {GOAL_OPTIONS.map((option) => {
                const active = selectedGoal === option.id;
                const IconComponent = option.icon;

                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => setSelectedGoal(option.id)}
                    style={[styles.goalCard, active && styles.goalCardActive]}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.goalIconContainer, active && styles.goalIconContainerActive]}>
                      <IconComponent
                        size={22}
                        color={active ? '#FFFFFF' : '#8C7B73'}
                      />
                    </View>

                    <View style={styles.goalTextContainer}>
                      <View style={styles.goalTitleRow}>
                        <Text style={[styles.goalTitle, active && styles.goalTitleActive]}>
                          {option.title}
                        </Text>
                        {active && (
                          <CheckCircle2
                            size={18}
                            color="#FF5B00"
                            style={{ marginLeft: 6 }}
                          />
                        )}
                      </View>
                      <Text style={styles.goalDescription}>{option.description}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Primary Action Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => goToStep(3, 'forward')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Review Your Targets</Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* ------------------------------------------------------------- */}
        {/* STEP 3: Targets Calculation Preview & Finish                  */}
        {/* ------------------------------------------------------------- */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            <View style={styles.titleSectionCompact}>
              <Text style={styles.mainHeading}>Your Custom Targets</Text>
            </View>

            {/* Calorie Headline Banner */}
            <View style={styles.calorieBanner}>
              <Text style={styles.calorieBannerLabel}>DAILY CALORIC BUDGET</Text>
              <View style={styles.calorieNumberRow}>
                <Text style={styles.calorieNumber}>
                  {calculatedTargets.daily_calorie_target.toLocaleString()}
                </Text>
                <Text style={styles.calorieUnit}>kcal / day</Text>
              </View>
              <View style={styles.calorieBadge}>
                <Sparkles size={14} color="#FF5B00" />
                <Text style={styles.calorieBadgeText}>
                  {selectedGoal === 'build_muscle' && 'Calibrated +12% Surplus'}
                  {selectedGoal === 'fat_loss' && 'Targeted -20% Deficit'}
                  {selectedGoal === 'maintain' && 'Balanced Maintenance'}
                  {selectedGoal === 'micronutrient' && 'Whole Food Optimal'}
                </Text>
              </View>
            </View>

            {/* Macro Breakdown Card */}
            <View style={styles.macroCard}>
              <Text style={styles.macroCardHeader}>MACRONUTRIENT RATIOS</Text>

              {/* Protein Row */}
              <View style={styles.macroRow}>
                <View style={styles.macroInfoCol}>
                  <View style={[styles.macroDot, { backgroundColor: '#E54D42' }]} />
                  <Text style={styles.macroName}>Protein</Text>
                </View>
                <Text style={[styles.macroGrams, { color: '#E54D42' }]}>
                  {calculatedTargets.daily_protein_target}g
                </Text>
              </View>
              <View style={styles.macroBarTrack}>
                <View
                  style={[
                    styles.macroBarFill,
                    {
                      backgroundColor: '#E54D42',
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((calculatedTargets.daily_protein_target * 4) /
                            calculatedTargets.daily_calorie_target) *
                            100
                        )
                      )}%`,
                    },
                  ]}
                />
              </View>

              {/* Carbs Row */}
              <View style={[styles.macroRow, { marginTop: 14 }]}>
                <View style={styles.macroInfoCol}>
                  <View style={[styles.macroDot, { backgroundColor: '#F39C12' }]} />
                  <Text style={styles.macroName}>Carbohydrates</Text>
                </View>
                <Text style={[styles.macroGrams, { color: '#F39C12' }]}>
                  {calculatedTargets.daily_carbs_target}g
                </Text>
              </View>
              <View style={styles.macroBarTrack}>
                <View
                  style={[
                    styles.macroBarFill,
                    {
                      backgroundColor: '#F39C12',
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((calculatedTargets.daily_carbs_target * 4) /
                            calculatedTargets.daily_calorie_target) *
                            100
                        )
                      )}%`,
                    },
                  ]}
                />
              </View>

              {/* Fats Row */}
              <View style={[styles.macroRow, { marginTop: 14 }]}>
                <View style={styles.macroInfoCol}>
                  <View style={[styles.macroDot, { backgroundColor: '#8B5A2B' }]} />
                  <Text style={styles.macroName}>Healthy Fats</Text>
                </View>
                <Text style={[styles.macroGrams, { color: '#8B5A2B' }]}>
                  {calculatedTargets.daily_fat_target}g
                </Text>
              </View>
              <View style={styles.macroBarTrack}>
                <View
                  style={[
                    styles.macroBarFill,
                    {
                      backgroundColor: '#8B5A2B',
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((calculatedTargets.daily_fat_target * 9) /
                            calculatedTargets.daily_calorie_target) *
                            100
                        )
                      )}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Smart Intelligence Callout */}
            <View style={styles.insightBox}>
              <Sparkles size={16} color="#FF5B00" style={{ marginTop: 2 }} />
              <Text style={styles.insightText}>
                NutriScan AI will automatically cross-reference your food photo scans against these exact macro thresholds.
              </Text>
            </View>

            {/* Final CTA: Continue to Dashboard */}
            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.primaryButtonDisabled]}
              disabled={isSubmitting}
              onPress={handleFinishOnboarding}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>
                {isSubmitting ? 'Saving Profile...' : 'Continue to Dashboard'}
              </Text>
              <ArrowRight size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
        </Animated.View>
      </ScrollView>

      {/* Scrollable Age Picker Modal */}
      <ScrollWheelPickerModal
        visible={isAgeModalOpen}
        title="Select Your Age"
        unit="Years old"
        selectedValue={parseInt(age, 10) || 21}
        minValue={14}
        maxValue={90}
        onConfirm={(val) => setAge(String(val))}
        onClose={() => setIsAgeModalOpen(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
  },
  glowTopRight: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFE2D1',
    opacity: 0.65,
  },
  glowBottomLeft: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FDECD2',
    opacity: 0.55,
  },

  // Header & Step Progress
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  backButtonPlaceholder: {
    width: 32,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 1,
  },
  categoryBadge: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF5B00',
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#EFE7DF',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF5B00',
    borderRadius: 3,
  },
  animatedStepWrapper: {
    flex: 1,
  },

  // Step Container & Text
  stepContainer: {
    flex: 1,
  },
  titleSection: {
    marginBottom: 20,
  },
  titleSectionCompact: {
    marginBottom: 16,
  },
  mainHeading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2A1810',
    lineHeight: 32,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#7D6E66',
    lineHeight: 20,
  },

  // Step 1: Profile Elements
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  genderPill: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  genderPillActive: {
    borderColor: '#FF5B00',
    backgroundColor: '#FFF0E6',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7D6E66',
  },
  genderTextActive: {
    color: '#FF5B00',
  },
  inputsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  inputCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    alignItems: 'center',
  },
  inputCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  inputCardRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  textInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A1810',
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
  },
  inputUnit: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8C7B73',
    marginLeft: 2,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  activityGridCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 11,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    minHeight: 58,
    justifyContent: 'center',
  },
  activityGridCardActive: {
    borderColor: '#FF5B00',
    backgroundColor: '#FFF8F5',
  },
  activityGridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityGridTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  activityGridTitleActive: {
    color: '#FF5B00',
  },
  activityGridSubtitle: {
    fontSize: 11.5,
    color: '#8C7B73',
  },

  // Step 2: Goal Cards
  goalCardsList: {
    gap: 14,
    marginBottom: 28,
  },
  goalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  goalCardActive: {
    borderColor: '#FF5B00',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F0E6DE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  goalIconContainerActive: {
    backgroundColor: '#FF5B00',
  },
  goalTextContainer: {
    flex: 1,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
  },
  goalTitleActive: {
    color: '#2A1810',
  },
  goalDescription: {
    fontSize: 13,
    color: '#7D6E66',
    lineHeight: 18,
  },

  // Step 3: Targets Breakdown
  calorieBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  calorieBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  calorieNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  calorieNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2A1810',
  },
  calorieUnit: {
    fontSize: 15,
    fontWeight: '700',
    color: '#8C7B73',
    marginLeft: 6,
  },
  calorieBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 6,
  },
  calorieBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5B00',
  },
  macroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  macroCardHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8C7B73',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroInfoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A1810',
  },
  macroGrams: {
    fontSize: 15,
    fontWeight: '800',
  },
  macroBarTrack: {
    height: 8,
    backgroundColor: '#F5ECE5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF0E6',
    borderRadius: 18,
    padding: 14,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#7D6E66',
    lineHeight: 18,
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#FF5B00',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
