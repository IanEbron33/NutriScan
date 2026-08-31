import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Bell, UtensilsCrossed, Clock, Check, X } from '../ui/LucideIcons';

interface MealReminderAlertModalProps {
  visible: boolean;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'test';
  timeString?: string;
  onClose: () => void;
  onLogMeal?: () => void;
}

const { width } = Dimensions.get('window');

const MEAL_DETAILS = {
  breakfast: {
    title: 'Breakfast Reminder',
    subtitle: 'Fuel up for the day! Remember to log your healthy breakfast in NutriScan.',
  },
  lunch: {
    title: 'Lunch Reminder',
    subtitle: 'Stay energized and hit your protein target! Don\'t forget to scan your lunch.',
  },
  dinner: {
    title: 'Dinner Reminder',
    subtitle: 'Time for dinner! Track your final meal and wrap up your daily calorie goals.',
  },
  test: {
    title: 'Notification Alert Active',
    subtitle: 'Your meal reminder and vibration alert are working perfectly in NutriScan!',
  },
};

export const MealReminderAlertModal: React.FC<MealReminderAlertModalProps> = ({
  visible,
  mealType = 'test',
  timeString,
  onClose,
  onLogMeal,
}) => {
  if (!visible) return null;

  const info = MEAL_DETAILS[mealType] || MEAL_DETAILS.test;
  const isTest = mealType === 'test';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.modalCard}>
          {/* Top Close Button */}
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.75}
          >
            <X size={15} color="#8C7B73" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Hero Icon Badge */}
          <View style={styles.iconCircle}>
            {isTest ? (
              <Bell size={26} color="#FF5B00" strokeWidth={2.2} />
            ) : (
              <UtensilsCrossed size={26} color="#FF5B00" strokeWidth={2.2} />
            )}
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>{info.title}</Text>
          <Text style={styles.subtitle}>{info.subtitle}</Text>

          {/* Time Badge */}
          {timeString && (
            <View style={styles.timeBadge}>
              <Clock size={12} color="#FF5B00" strokeWidth={2.2} />
              <Text style={styles.timeBadgeText}>Scheduled for {timeString}</Text>
            </View>
          )}

          {/* Action Area (Stacked for spacious mobile ergonomics) */}
          <View style={styles.actionContainer}>
            {onLogMeal && !isTest ? (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    onClose();
                    onLogMeal();
                  }}
                  activeOpacity={0.85}
                >
                  <UtensilsCrossed size={16} color="#FFFFFF" strokeWidth={2.2} />
                  <Text style={styles.primaryButtonText}>Log Meal Now</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={styles.dismissButtonText}>Dismiss for Now</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={onClose}
                activeOpacity={0.85}
              >
                <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.primaryButtonText}>Got It</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 19, 13, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FAF6F0',
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE0CC',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE7DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE0CC',
    marginBottom: 16,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#2A1810',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 19,
    color: '#7D6E66',
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#FFE0CC',
    marginBottom: 20,
  },
  timeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5B00',
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF5B00',
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dismissButton: {
    width: '100%',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8C7B73',
  },
});
