import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { DraggableBottomSheet } from '../ui/DraggableBottomSheet';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
} from '../ui/LucideIcons';
import { MealLog } from '../../context/NutritionContext';

interface MicronutrientsDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  loggedMeals: MealLog[];
  todayMicros: {
    vitamin_c_mg: number;
    iron_mg: number;
    calcium_mg: number;
  };
}

interface NutrientItem {
  id: string;
  name: string;
  category: 'vitamins' | 'minerals' | 'fiber';
  current: number;
  target: number;
  unit: string;
}

const { height } = Dimensions.get('window');

const RDA_TARGETS = {
  vitamin_c: 90, // mg
  vitamin_a: 800, // mcg
  vitamin_d: 15, // mcg
  iron: 18, // mg
  calcium: 1000, // mg
  potassium: 3000, // mg
  magnesium: 350, // mg
  zinc: 11, // mg
  fiber: 28, // g
};

export const MicronutrientsDetailsModal: React.FC<MicronutrientsDetailsModalProps> = ({
  visible,
  onClose,
  loggedMeals,
  todayMicros,
}) => {
  // Aggregate all micronutrient values from logged meals
  let totalFiber = 0;
  let totalPotassium = 0;
  let totalMagnesium = 0;
  let totalZinc = 0;
  let totalVitA = 0;
  let totalVitD = 0;

  for (const m of loggedMeals) {
    if (m.micronutrients) {
      const extra = m.micronutrients as any;
      if (extra.fiber_g) totalFiber += Number(extra.fiber_g || 0);
      if (extra.potassium_mg) totalPotassium += Number(extra.potassium_mg || 0);
      if (extra.magnesium_mg) totalMagnesium += Number(extra.magnesium_mg || 0);
      if (extra.zinc_mg) totalZinc += Number(extra.zinc_mg || 0);
      if (extra.vitamin_a_mcg) totalVitA += Number(extra.vitamin_a_mcg || 0);
      if (extra.vitamin_d_mcg) totalVitD += Number(extra.vitamin_d_mcg || 0);
    }
  }

  const nutrientsList: NutrientItem[] = [
    {
      id: 'vitamin_c',
      name: 'Vitamin C',
      category: 'vitamins',
      current: Math.round(todayMicros.vitamin_c_mg * 10) / 10,
      target: RDA_TARGETS.vitamin_c,
      unit: 'mg',
    },
    {
      id: 'vitamin_a',
      name: 'Vitamin A',
      category: 'vitamins',
      current: Math.round(totalVitA),
      target: RDA_TARGETS.vitamin_a,
      unit: 'mcg',
    },
    {
      id: 'vitamin_d',
      name: 'Vitamin D',
      category: 'vitamins',
      current: Math.round(totalVitD * 10) / 10,
      target: RDA_TARGETS.vitamin_d,
      unit: 'mcg',
    },
    {
      id: 'iron',
      name: 'Iron',
      category: 'minerals',
      current: Math.round(todayMicros.iron_mg * 10) / 10,
      target: RDA_TARGETS.iron,
      unit: 'mg',
    },
    {
      id: 'calcium',
      name: 'Calcium',
      category: 'minerals',
      current: Math.round(todayMicros.calcium_mg),
      target: RDA_TARGETS.calcium,
      unit: 'mg',
    },
    {
      id: 'potassium',
      name: 'Potassium',
      category: 'minerals',
      current: Math.round(totalPotassium),
      target: RDA_TARGETS.potassium,
      unit: 'mg',
    },
    {
      id: 'magnesium',
      name: 'Magnesium',
      category: 'minerals',
      current: Math.round(totalMagnesium),
      target: RDA_TARGETS.magnesium,
      unit: 'mg',
    },
    {
      id: 'zinc',
      name: 'Zinc',
      category: 'minerals',
      current: Math.round(totalZinc * 10) / 10,
      target: RDA_TARGETS.zinc,
      unit: 'mg',
    },
    {
      id: 'fiber',
      name: 'Dietary Fiber',
      category: 'fiber',
      current: Math.round(totalFiber * 10) / 10,
      target: RDA_TARGETS.fiber,
      unit: 'g',
    },
  ];

  // Overall fulfillment calculation
  const totalPercentage = Math.round(
    (nutrientsList.reduce((acc, item) => acc + Math.min(100, (item.current / item.target) * 100), 0) /
      nutrientsList.length)
  );

  return (
    <DraggableBottomSheet
      visible={visible}
      onClose={onClose}
      maxHeight={height * 0.88}
      backgroundColor="#FAF6F0"
      showHandle={true}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconCircle}>
              <Activity size={20} color="#FF5B00" strokeWidth={2.2} />
            </View>
            <View>
              <Text style={styles.sheetTitle}>Daily Micronutrients</Text>
              <Text style={styles.sheetSubtitle}>Vitamins, minerals & fiber breakdown</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.75}
          >
            <X size={16} color="#8C7B73" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Summary Health Card */}
          <View style={styles.scoreCard}>
            <View style={styles.scoreLeft}>
              <Text style={styles.scoreLabel}>Micronutrient Index</Text>
              <Text style={styles.scoreValue}>{totalPercentage}%</Text>
              <Text style={styles.scoreDescription}>
                {totalPercentage >= 80
                  ? 'Excellent vitamin & mineral diversity today!'
                  : totalPercentage >= 40
                  ? 'Good progress! Include greens & fruits to hit 100%.'
                  : 'Log more nutrient-rich dishes to boost your levels.'}
              </Text>
            </View>
            <View style={styles.scoreBadgeCircle}>
              <ShieldCheck size={30} color="#FF5B00" strokeWidth={2} />
            </View>
          </View>

          {/* Detailed Nutrient Cards */}
          <Text style={styles.sectionHeading}>Essential Vitamins & Minerals</Text>

          <View style={styles.nutrientList}>
            {nutrientsList.map((item) => {
              const pct = Math.min(100, Math.round((item.current / item.target) * 100));
              const isOptimal = pct >= 90;
              const isOnTrack = pct >= 45;

              const statusColor = isOptimal ? '#2E7D32' : isOnTrack ? '#F39C12' : '#C62828';
              const statusBg = isOptimal ? '#E8F5E9' : isOnTrack ? '#FEF6E9' : '#FFEBEE';
              const statusText = isOptimal ? 'Optimal' : isOnTrack ? 'On Track' : 'Needs Boost';

              return (
                <View key={item.id} style={styles.nutrientCard}>
                  <View style={styles.nutrientTopRow}>
                    <View style={styles.nutrientNameGroup}>
                      <Text style={styles.nutrientName}>{item.name}</Text>
                      <Text style={styles.nutrientValues}>
                        {item.current} / {item.target} {item.unit}
                      </Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                      {isOptimal ? (
                        <CheckCircle2 size={12} color={statusColor} />
                      ) : (
                        <AlertTriangle size={12} color={statusColor} />
                      )}
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {statusText}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Bar */}
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: statusColor,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </DraggableBottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFE7DF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2A1810',
  },
  sheetSubtitle: {
    fontSize: 11.5,
    color: '#8C7B73',
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 70,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FFE0CC',
    marginBottom: 16,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  scoreLeft: {
    flex: 1,
    paddingRight: 12,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C7B73',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FF5B00',
    marginVertical: 2,
  },
  scoreDescription: {
    fontSize: 11.5,
    color: '#5C4E46',
    lineHeight: 16,
  },
  scoreBadgeCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE0CC',
  },
  sectionHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#8C7B73',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  nutrientList: {
    gap: 10,
  },
  nutrientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  nutrientTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  nutrientNameGroup: {
    flex: 1,
  },
  nutrientName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  nutrientValues: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C7B73',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#F5ECE5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});
