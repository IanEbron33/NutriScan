import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { DbMealLog } from '../../types/database';
import { MealLog } from '../../context/NutritionContext';
import { CustomConfirmModal } from './CustomConfirmModal';
import { DraggableBottomSheet } from '../ui/DraggableBottomSheet';
import {
  MealNutritionSheetContent,
  MealNutritionSheetData,
} from './MealNutritionSheetContent';
import { Trash2, Clock } from '../ui/LucideIcons';

interface MealDetailsModalProps {
  meal: DbMealLog | MealLog | null;
  visible: boolean;
  onClose: () => void;
  onDelete?: (mealId: string, dishName: string) => void;
}

export const MealDetailsModal: React.FC<MealDetailsModalProps> = ({
  meal,
  visible,
  onClose,
  onDelete,
}) => {
  if (!meal) return null;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatDisplayDate = (isoString?: string) => {
    if (!isoString) return 'Logged Meal';
    try {
      const d = new Date(isoString);
      if (!isNaN(d.getTime())) {
        const datePart = d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        });
        const timePart = d.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
        return `${datePart} • ${timePart}`;
      }

      // If it's already a time format (e.g. "8:59 AM")
      if (isoString.includes('AM') || isoString.includes('PM') || isoString.includes(':')) {
        return `Today • ${isoString}`;
      }

      return isoString;
    } catch {
      return 'Logged Meal';
    }
  };

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false);
    onClose();
    if (onDelete) {
      onDelete(meal.id, meal.dish_name);
    }
  };

  const mappedData: MealNutritionSheetData = {
    dish_name: meal.dish_name,
    calories: meal.calories,
    protein_g: meal.protein_g,
    carbs_g: meal.carbs_g,
    fat_g: meal.fat_g,
    image_uri: meal.image_uri,
    detected_items: meal.detected_items?.map((item) => ({
      name: item.name,
      estimated_grams: item.estimated_grams,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
    })),
    micronutrients: meal.micronutrients,
    health_insight: meal.health_insight || (meal.micronutrients as any)?.health_insight,
    logged_at: meal.logged_at,
  };

  return (
    <>
      <DraggableBottomSheet
        visible={visible}
        onClose={onClose}
        maxHeight="94%"
        showHandle={true}
      >
        <MealNutritionSheetContent data={mappedData} onClose={onClose}>
          {/* Timestamp Info Pill */}
          <View style={styles.timestampPill}>
            <Clock size={13} color="#8C7B73" />
            <Text style={styles.timestampText}>
              Logged: {formatDisplayDate(meal.logged_at)}
            </Text>
          </View>

          {/* Delete Action Button */}
          {onDelete && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setShowDeleteConfirm(true)}
              activeOpacity={0.8}
            >
              <Trash2 size={18} color="#C62828" strokeWidth={2.2} />
              <Text style={styles.deleteButtonText}>Delete This Meal</Text>
            </TouchableOpacity>
          )}
        </MealNutritionSheetContent>
      </DraggableBottomSheet>

      {/* Confirmation Modal */}
      <CustomConfirmModal
        visible={showDeleteConfirm}
        title="Delete Meal Log"
        message={`Are you sure you want to remove "${meal.dish_name}"? This will deduct ${meal.calories} kcal from your daily totals.`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmStyle="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  timestampPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAF6F0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE7DF',
  },
  timestampText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 13,
    color: '#8C7B73',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: '#FCDAD7',
  },
  deleteButtonText: {
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 15,
    color: '#C62828',
  },
});
