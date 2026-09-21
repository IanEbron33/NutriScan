import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { FoodAnalysisResult } from '../../services/aiFoodScanner';
import { DraggableBottomSheet } from '../ui/DraggableBottomSheet';
import {
  MealNutritionSheetContent,
  MealNutritionSheetData,
} from '../modals/MealNutritionSheetContent';
import { Plus, Eye } from '../ui/LucideIcons';

interface NutritionResultModalProps {
  visible: boolean;
  result: FoodAnalysisResult | null;
  onAddToDailyTracker: () => void;
  onDismiss: () => void;
  onRetake?: () => void;
}

export const NutritionResultModal: React.FC<NutritionResultModalProps> = ({
  visible,
  result,
  onAddToDailyTracker,
  onDismiss,
  onRetake,
}) => {
  if (!result) return null;

  const mappedData: MealNutritionSheetData = {
    dish_name: result.dish_name,
    calories: result.calories,
    protein_g: result.protein_g,
    carbs_g: result.carbs_g,
    fat_g: result.fat_g,
    image_uri: result.image_uri,
    image_uris: result.image_uris,
    detected_items: result.detected_items?.map((item) => ({
      name: item.name,
      portion: item.portion,
      estimated_grams: parseInt(item.portion?.replace(/\D/g, '') || '0', 10) || undefined,
      calories: item.calories,
      protein_g: item.protein_g,
      carbs_g: item.carbs_g,
      fat_g: item.fat_g,
    })),
    micronutrients: result.micronutrients,
    health_insight: result.health_insight,
  };

  return (
    <DraggableBottomSheet
      visible={visible}
      onClose={onDismiss}
      maxHeight="94%"
      showHandle={true}
    >
      <MealNutritionSheetContent
        data={mappedData}
        onClose={onDismiss}
        onCameraPress={onRetake || onDismiss}
      >
        {/* Primary Action: Add to Daily Tracker */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onAddToDailyTracker}
          activeOpacity={0.85}
        >
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={styles.primaryButtonText}>Add to Daily Tracker</Text>
        </TouchableOpacity>

        {/* Secondary Action: Just Checking (Dismiss) */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={onDismiss}
          activeOpacity={0.8}
        >
          <Eye size={18} color="#8B4513" strokeWidth={2} />
          <Text style={styles.secondaryButtonText}>Just Checking (Dismiss)</Text>
        </TouchableOpacity>
      </MealNutritionSheetContent>
    </DraggableBottomSheet>
  );
};

const styles = StyleSheet.create({
  primaryButton: {
    backgroundColor: '#FF5B00',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 30,
    gap: 8,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Fredoka_700Bold',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#FFF0E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#FFE0CC',
  },
  secondaryButtonText: {
    color: '#8B4513',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 15,
  },
});
