import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Dimensions,
} from 'react-native';
import { DbMealLog, DetectedFoodItem } from '../../types/database';
import { MealLog } from '../../context/NutritionContext';
import { CustomConfirmModal } from './CustomConfirmModal';
import {
  X,
  Flame,
  UtensilsCrossed,
  Trash2,
  Clock,
  PieChart,
  Leaf,
  CheckCircle2,
  Sparkles,
} from '../ui/LucideIcons';

interface MealDetailsModalProps {
  meal: DbMealLog | MealLog | null;
  visible: boolean;
  onClose: () => void;
  onDelete?: (mealId: string, dishName: string) => void;
}

const { width, height } = Dimensions.get('window');

export const MealDetailsModal: React.FC<MealDetailsModalProps> = ({
  meal,
  visible,
  onClose,
  onDelete,
}) => {
  if (!meal) return null;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDisplayDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Macro calculation percentages
  const proteinCals = Number(meal.protein_g || 0) * 4;
  const carbsCals = Number(meal.carbs_g || 0) * 4;
  const fatCals = Number(meal.fat_g || 0) * 9;
  const totalMacroCals = proteinCals + carbsCals + fatCals || meal.calories || 1;

  const proteinPct = Math.round((proteinCals / totalMacroCals) * 100);
  const carbsPct = Math.round((carbsCals / totalMacroCals) * 100);
  const fatPct = Math.round((fatCals / totalMacroCals) * 100);

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onClose();
    if (onDelete) {
      onDelete(meal.id, meal.dish_name);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          {/* Top Sheet Header with Drag Handle & High-Visibility 'X' Button */}
          <View style={styles.sheetTopBar}>
            <View style={styles.handleBar} />
            <TouchableOpacity
              style={styles.closeCircleBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.8}
            >
              <X size={18} color="#FF5B00" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. Dish Photo Banner with Warm Border */}
            {meal.image_uri ? (
              <View style={styles.imageBannerWrapper}>
                <Image
                  source={{ uri: meal.image_uri }}
                  style={styles.imageBanner}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <UtensilsCrossed size={36} color="#FF5B00" />
              </View>
            )}

            {/* 2. Dish Title & Timestamp */}
            <View style={styles.headerSection}>
              <Text style={styles.dishTitle}>{meal.dish_name}</Text>
              <View style={styles.timestampRow}>
                <Clock size={12} color="#8C7B73" />
                <Text style={styles.timestampText}>{formatDisplayDate(meal.logged_at)}</Text>
              </View>
            </View>

            {/* 3. Hero Calorie Callout Box */}
            <View style={styles.calorieBox}>
              <View style={styles.calorieLeft}>
                <View style={styles.flameIconBox}>
                  <Flame size={20} color="#FF5B00" />
                </View>
                <View>
                  <Text style={styles.calorieLabel}>ENERGY VALUE</Text>
                  <Text style={styles.calorieNumber}>
                    {meal.calories} <Text style={styles.calorieUnit}>kcal</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* 4. Macronutrient Breakdown Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <PieChart size={16} color="#FF5B00" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.sectionTitle}>Macronutrients</Text>
                  <Text style={styles.sectionSubtitle}>Caloric distribution</Text>
                </View>
              </View>

              {/* Stacked Macro Distribution Bar */}
              <View style={styles.macroDistributionTrack}>
                <View style={[styles.macroBarSegment, { width: `${proteinPct}%`, backgroundColor: '#E54D42' }]} />
                <View style={[styles.macroBarSegment, { width: `${carbsPct}%`, backgroundColor: '#F39C12' }]} />
                <View style={[styles.macroBarSegment, { width: `${fatPct}%`, backgroundColor: '#8B5A2B' }]} />
              </View>

              <View style={styles.macroGrid}>
                {/* Protein */}
                <View style={[styles.macroCard, { backgroundColor: '#FFECEB' }]}>
                  <Text style={[styles.macroCardVal, { color: '#E54D42' }]}>{meal.protein_g}g</Text>
                  <Text style={styles.macroCardName}>Protein</Text>
                  <Text style={[styles.macroCardPct, { color: '#E54D42' }]}>{proteinPct}%</Text>
                </View>

                {/* Carbs */}
                <View style={[styles.macroCard, { backgroundColor: '#FEF6E9' }]}>
                  <Text style={[styles.macroCardVal, { color: '#F39C12' }]}>{meal.carbs_g}g</Text>
                  <Text style={styles.macroCardName}>Carbs</Text>
                  <Text style={[styles.macroCardPct, { color: '#F39C12' }]}>{carbsPct}%</Text>
                </View>

                {/* Fat */}
                <View style={[styles.macroCard, { backgroundColor: '#F5EFEA' }]}>
                  <Text style={[styles.macroCardVal, { color: '#8B5A2B' }]}>{meal.fat_g}g</Text>
                  <Text style={styles.macroCardName}>Fat</Text>
                  <Text style={[styles.macroCardPct, { color: '#8B5A2B' }]}>{fatPct}%</Text>
                </View>
              </View>
            </View>

            {/* 5. Detected Food Items Breakdown (if available) */}
            {meal.detected_items && meal.detected_items.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <UtensilsCrossed size={16} color="#FF5B00" />
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.sectionTitle}>Detected Components</Text>
                    <Text style={styles.sectionSubtitle}>
                      {meal.detected_items.length} food items analyzed
                    </Text>
                  </View>
                </View>

                <View style={styles.detectedList}>
                  {meal.detected_items.map((item: DetectedFoodItem, idx: number) => (
                    <View key={idx} style={styles.detectedItemRow}>
                      <View style={styles.detectedBullet}>
                        <CheckCircle2 size={14} color="#FF5B00" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detectedItemName}>{item.name}</Text>
                        <Text style={styles.detectedItemGrams}>
                          {item.estimated_grams ? `${item.estimated_grams}g portion` : '1 serving'}
                        </Text>
                      </View>
                      <View style={styles.detectedItemCalPill}>
                        <Text style={styles.detectedItemCals}>{item.calories}</Text>
                        <Text style={styles.detectedItemCalUnit}>kcal</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 6. Micronutrients Breakdown Section */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <Leaf size={16} color="#2E7D32" />
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.sectionTitle}>Micronutrients Breakdown</Text>
                  <Text style={styles.sectionSubtitle}>Estimated vitamins & minerals per serving</Text>
                </View>
              </View>

              <View style={styles.microsGrid}>
                <View style={styles.microChip}>
                  <Text style={styles.microVal}>{meal.micronutrients?.fiber_g ?? 0}g</Text>
                  <Text style={styles.microLabel}>Dietary Fiber</Text>
                </View>
                <View style={styles.microChip}>
                  <Text style={styles.microVal}>{meal.micronutrients?.vitamin_c_mg ?? 0}mg</Text>
                  <Text style={styles.microLabel}>Vitamin C</Text>
                </View>
                <View style={styles.microChip}>
                  <Text style={styles.microVal}>{meal.micronutrients?.iron_mg ?? 0}mg</Text>
                  <Text style={styles.microLabel}>Iron</Text>
                </View>
                <View style={styles.microChip}>
                  <Text style={styles.microVal}>{meal.micronutrients?.calcium_mg ?? 0}mg</Text>
                  <Text style={styles.microLabel}>Calcium</Text>
                </View>
              </View>
            </View>

            {/* 7. Delete Button */}
            {onDelete && (
              <TouchableOpacity
                style={styles.deleteMealButton}
                onPress={() => setShowDeleteConfirm(true)}
                activeOpacity={0.8}
              >
                <Trash2 size={16} color="#C62828" />
                <Text style={styles.deleteMealButtonText}>Delete This Meal Log</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Custom Warm Confirmation Dialog */}
      <CustomConfirmModal
        visible={showDeleteConfirm}
        title="Delete Meal Log"
        message={`Are you sure you want to remove "${meal.dish_name}" from your diary?`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmStyle="danger"
        icon={<Trash2 size={24} color="#C62828" />}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 24, 16, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: height * 0.88,
    backgroundColor: '#FAF6F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 30,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  sheetTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    position: 'relative',
  },
  handleBar: {
    width: 44,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D1C7BD',
  },
  closeCircleBtn: {
    position: 'absolute',
    right: 18,
    top: -2,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE0CC',
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 20,
  },
  imageBannerWrapper: {
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageBanner: {
    width: '100%',
    height: 180,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 22,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FFE0CC',
  },
  headerSection: {
    marginBottom: 14,
  },
  dishTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2A1810',
    lineHeight: 26,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#8C7B73',
  },
  calorieBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 14,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  calorieLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flameIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#8C7B73',
    letterSpacing: 0.6,
  },
  calorieNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A1810',
  },
  calorieUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C7B73',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 14,
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2A1810',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C7B73',
    marginTop: 1,
  },
  macroDistributionTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: '#FAF6F0',
  },
  macroBarSegment: {
    height: '100%',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  macroCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  macroCardVal: {
    fontSize: 16,
    fontWeight: '700',
  },
  macroCardName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C7B73',
    marginTop: 2,
  },
  macroCardPct: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 3,
  },
  detectedList: {
    gap: 8,
  },
  detectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  detectedBullet: {
    marginRight: 8,
  },
  detectedItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2A1810',
  },
  detectedItemGrams: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C7B73',
    marginTop: 1,
  },
  detectedItemCalPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EFE7DF',
    gap: 2,
  },
  detectedItemCals: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  detectedItemCalUnit: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#8C7B73',
  },
  microsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  microChip: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  microVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  microLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#8C7B73',
    marginTop: 2,
  },
  deleteMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    borderRadius: 16,
    paddingVertical: 13,
    borderWidth: 1.5,
    borderColor: '#FFCDD2',
    gap: 6,
    marginTop: 4,
  },
  deleteMealButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C62828',
  },
});
