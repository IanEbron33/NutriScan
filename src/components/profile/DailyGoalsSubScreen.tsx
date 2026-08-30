import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { PrimaryGoal } from '../../types/database';
import {
  ArrowLeft,
  Check,
  MuscleFlex,
  TrendingDown,
  Scale,
  Leaf,
  Sparkles,
} from '../ui/LucideIcons';

interface DailyGoalsSubScreenProps {
  initialCalories: number;
  initialProtein: number;
  initialCarbs: number;
  initialFat: number;
  initialGoal: PrimaryGoal;
  onSave: (data: {
    daily_calorie_target: number;
    daily_protein_target: number;
    daily_carbs_target: number;
    daily_fat_target: number;
    primary_goal: PrimaryGoal;
  }) => Promise<void>;
  onBack: () => void;
}

export const DailyGoalsSubScreen: React.FC<DailyGoalsSubScreenProps> = ({
  initialCalories,
  initialProtein,
  initialCarbs,
  initialFat,
  initialGoal,
  onSave,
  onBack,
}) => {
  const [calories, setCalories] = useState(String(initialCalories || 2400));
  const [protein, setProtein] = useState(String(initialProtein || 120));
  const [carbs, setCarbs] = useState(String(initialCarbs || 250));
  const [fat, setFat] = useState(String(initialFat || 70));
  const [goal, setGoal] = useState<PrimaryGoal>(initialGoal || 'build_muscle');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const goalOptions: { id: PrimaryGoal; label: string; icon: React.ReactNode }[] = [
    { id: 'build_muscle', label: 'Build Muscle', icon: <MuscleFlex size={15} color="#FF5B00" /> },
    { id: 'fat_loss', label: 'Fat Loss', icon: <TrendingDown size={15} color="#E54D42" /> },
    { id: 'maintain', label: 'Maintain', icon: <Scale size={15} color="#8C7B73" /> },
    { id: 'micronutrient', label: 'Healthy Diet', icon: <Leaf size={15} color="#2E7D32" /> },
  ];

  const handleSave = async () => {
    const calNum = parseInt(calories, 10) || 2400;
    const protNum = parseInt(protein, 10) || 120;
    const carbNum = parseInt(carbs, 10) || 250;
    const fatNum = parseInt(fat, 10) || 70;

    setIsSaving(true);
    setSuccessMsg(null);
    try {
      await onSave({
        daily_calorie_target: calNum,
        daily_protein_target: protNum,
        daily_carbs_target: carbNum,
        daily_fat_target: fatNum,
        primary_goal: goal,
      });
      setSuccessMsg('Your nutrition targets have been saved.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      console.warn('[DailyGoalsSubScreen] Error saving:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#2A1810" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Daily Target Goals</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Success Alert Banner */}
        {successMsg && (
          <View style={styles.successBanner}>
            <Check size={14} color="#2E7D32" strokeWidth={2.5} />
            <Text style={styles.successText}>{successMsg}</Text>
          </View>
        )}

        {/* Concise 1-Line Intro Subtitle */}
        <Text style={styles.sectionSubtitle}>
          Personalize your daily calories and macronutrient targets.
        </Text>

        {/* 1. Primary Fitness Goal */}
        <View style={styles.fieldSection}>
          <Text style={styles.sectionLabel}>PRIMARY FITNESS GOAL</Text>
          <View style={styles.goalsGrid}>
            {goalOptions.map((opt) => {
              const isSelected = goal === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.goalChip, isSelected && styles.goalChipSelected]}
                  onPress={() => setGoal(opt.id)}
                  activeOpacity={0.75}
                >
                  <View style={styles.goalIconWrap}>{opt.icon}</View>
                  <Text style={[styles.goalChipText, isSelected && styles.goalChipTextSelected]} numberOfLines={1}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Daily Calorie Target */}
        <View style={styles.fieldSection}>
          <Text style={styles.sectionLabel}>DAILY CALORIE BUDGET</Text>
          <View style={styles.inputCard}>
            <View style={styles.inputWithUnitRow}>
              <TextInput
                style={styles.bigCalorieInput}
                value={calories}
                onChangeText={setCalories}
                keyboardType="number-pad"
                placeholder="2400"
                placeholderTextColor="#C4B5AC"
              />
              <Text style={styles.bigCalorieUnit}>kcal / day</Text>
            </View>
          </View>
        </View>

        {/* 3. Macronutrient Targets */}
        <View style={styles.fieldSection}>
          <Text style={styles.sectionLabel}>MACRONUTRIENT TARGETS</Text>
          <View style={styles.macrosRow}>
            {/* Protein */}
            <View style={[styles.macroColCard, { backgroundColor: '#FFF9F9', borderColor: '#FCDAD7' }]}>
              <View style={styles.macroColHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#E54D42' }]} />
                <Text style={[styles.macroName, { color: '#E54D42' }]}>Protein</Text>
              </View>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroTextInput}
                  value={protein}
                  onChangeText={setProtein}
                  keyboardType="number-pad"
                  placeholder="120"
                  placeholderTextColor="#C4B5AC"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>

            {/* Carbs */}
            <View style={[styles.macroColCard, { backgroundColor: '#FFFDF9', borderColor: '#FDEFD7' }]}>
              <View style={styles.macroColHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#F39C12' }]} />
                <Text style={[styles.macroName, { color: '#D97706' }]}>Carbs</Text>
              </View>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroTextInput}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="number-pad"
                  placeholder="250"
                  placeholderTextColor="#C4B5AC"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>

            {/* Fat */}
            <View style={[styles.macroColCard, { backgroundColor: '#FAF8F5', borderColor: '#EFE7DF' }]}>
              <View style={styles.macroColHeader}>
                <View style={[styles.macroDot, { backgroundColor: '#8B5A2B' }]} />
                <Text style={[styles.macroName, { color: '#8B5A2B' }]}>Fat</Text>
              </View>
              <View style={styles.macroInputRow}>
                <TextInput
                  style={styles.macroTextInput}
                  value={fat}
                  onChangeText={setFat}
                  keyboardType="number-pad"
                  placeholder="70"
                  placeholderTextColor="#C4B5AC"
                />
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tip Box */}
        <View style={styles.tipBox}>
          <Sparkles size={14} color="#FF5B00" />
          <Text style={styles.tipText}>
            Targets automatically synchronize your daily calorie and macronutrient rings.
          </Text>
        </View>

        {/* Save CTA Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.saveButtonText}>Save Nutrition Targets</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAF6F0',
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7DF',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  navTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  headerSpacer: {
    width: 34,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 120,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  successText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#7D6E66',
    lineHeight: 16,
    marginBottom: 16,
  },
  fieldSection: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8C7B73',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 10,
    height: 48,
    borderWidth: 1.2,
    borderColor: '#EFE7DF',
    gap: 8,
    width: '48.5%',
  },
  goalChipSelected: {
    backgroundColor: '#FFF0E6',
    borderColor: '#FF5B00',
  },
  goalIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#2A1810',
    flex: 1,
  },
  goalChipTextSelected: {
    color: '#FF5B00',
    fontWeight: '700',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1.2,
    borderColor: '#EFE7DF',
  },
  inputWithUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bigCalorieInput: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A1810',
    flex: 1,
    padding: 0,
  },
  bigCalorieUnit: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#8C7B73',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroColCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 9,
    height: 64,
    justifyContent: 'center',
  },
  macroColHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  macroDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  macroName: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  macroTextInput: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2A1810',
    padding: 0,
    minWidth: 30,
  },
  macroUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C7B73',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F5',
    borderRadius: 12,
    padding: 10,
    gap: 7,
    borderWidth: 1,
    borderColor: '#FFE5D6',
    marginBottom: 20,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: '#7D6E66',
    lineHeight: 15,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5B00',
    borderRadius: 20,
    paddingVertical: 12,
    gap: 6,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
