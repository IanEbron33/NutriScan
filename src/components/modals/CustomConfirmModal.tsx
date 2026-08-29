import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';

interface CustomConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'danger' | 'primary';
  icon?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const { width } = Dimensions.get('window');

export const CustomConfirmModal: React.FC<CustomConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'danger',
  icon,
  onConfirm,
  onCancel,
}) => {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Icon Badge */}
          {icon && (
            <View
              style={[
                styles.iconBox,
                confirmStyle === 'danger' ? styles.iconBoxDanger : styles.iconBoxPrimary,
              ]}
            >
              {icon}
            </View>
          )}

          {/* Title & Message */}
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalMessage}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                confirmStyle === 'danger' ? styles.confirmButtonDanger : styles.confirmButtonPrimary,
              ]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(42, 24, 16, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconBoxDanger: {
    backgroundColor: '#FFEBEE',
  },
  iconBoxPrimary: {
    backgroundColor: '#FFF0E6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1810',
    textAlign: 'center',
    marginTop: 4,
  },
  modalMessage: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8C7B73',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  cancelButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#8C7B73',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonDanger: {
    backgroundColor: '#C62828',
  },
  confirmButtonPrimary: {
    backgroundColor: '#FF5B00',
  },
  confirmButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
