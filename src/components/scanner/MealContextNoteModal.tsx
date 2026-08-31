import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { DraggableBottomSheet } from '../ui/DraggableBottomSheet';
import {
  FileText,
  X,
  Sparkles,
  Check,
  Trash2,
  Plus,
} from '../ui/LucideIcons';

interface MealContextNoteModalProps {
  visible: boolean;
  initialNote: string;
  onSave: (note: string) => void;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

const QUICK_SUGGESTIONS = [
  '48g protein shake',
  '1 scoop whey isolate',
  'Cooked in 1 tbsp olive oil',
  'Zero sugar / monk fruit',
  'Made with oat milk',
  'Half portion eaten',
  'No dressing / sauce',
];

export const MealContextNoteModal: React.FC<MealContextNoteModalProps> = ({
  visible,
  initialNote,
  onSave,
  onClose,
}) => {
  const [noteText, setNoteText] = useState(initialNote || '');

  useEffect(() => {
    if (visible) {
      setNoteText(initialNote || '');
    }
  }, [visible, initialNote]);

  const handleChipPress = (suggestion: string) => {
    setNoteText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) {
        return suggestion;
      }
      // Check if suggestion is already included
      if (trimmed.toLowerCase().includes(suggestion.toLowerCase())) {
        return trimmed;
      }
      return `${trimmed}, ${suggestion}`;
    });
  };

  const handleSave = () => {
    onSave(noteText.trim());
    onClose();
  };

  const handleClear = () => {
    setNoteText('');
    onSave('');
  };

  return (
    <DraggableBottomSheet
      visible={visible}
      onClose={onClose}
      maxHeight="86%"
      backgroundColor="#FFFFFF"
      keyboardAvoid
      showHandle={true}
    >
      {/* Top Header Action Row */}
      <View style={styles.sheetHeaderActionRow}>
        <TouchableOpacity
          style={styles.closeCircleBtn}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.75}
        >
          <X size={18} color="#FF5B00" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
            {/* Title Header */}
            <View style={styles.headerTitleRow}>
              <View style={styles.iconContainer}>
                <FileText size={20} color="#FF5B00" strokeWidth={2.2} />
              </View>
              <View style={styles.titleTextWrapper}>
                <Text style={styles.modalHeading}>Meal Context Note</Text>
                <Text style={styles.modalSubheading}>
                  Provide facts, exact protein, or hidden ingredients
                </Text>
              </View>
            </View>

            {/* Quick Suggestion Chips */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionLabel}>QUICK SUGGESTIONS</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsScrollContainer}
            >
              {QUICK_SUGGESTIONS.map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.chipButton}
                  onPress={() => handleChipPress(chip)}
                  activeOpacity={0.75}
                >
                  <Plus size={12} color="#FF5B00" strokeWidth={2.5} />
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Note Text Input Box */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeaderRow}>
                <Text style={styles.inputCardLabel}>YOUR NOTE FOR AI</Text>
                {noteText.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setNoteText('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.clearFieldText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.multilineTextInput}
                placeholder='e.g. "The protein shake contains 48 Gram of protein"'
                placeholderTextColor="#A89A92"
                multiline
                numberOfLines={3}
                maxLength={250}
                value={noteText}
                onChangeText={setNoteText}
                textAlignVertical="top"
              />

              <View style={styles.inputFooterRow}>
                <Text style={styles.charCountText}>
                  {noteText.length}/250 characters
                </Text>
              </View>
            </View>

            {/* AI Guidance Box */}
            <View style={styles.guidanceBox}>
              <Sparkles size={16} color="#FF5B00" strokeWidth={2} />
              <Text style={styles.guidanceText}>
                NutriScan AI uses your notes as authoritative constraints to calibrate exact portions and macros.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
                <Text style={styles.saveButtonText}>
                  {noteText.trim().length > 0 ? 'Apply Note' : 'Done'}
                </Text>
              </TouchableOpacity>

              {initialNote.trim().length > 0 && (
                <TouchableOpacity
                  style={styles.deleteNoteButton}
                  onPress={handleClear}
                  activeOpacity={0.8}
                >
                  <Trash2 size={16} color="#C62828" strokeWidth={2} />
                  <Text style={styles.deleteNoteText}>Remove Note</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
    </DraggableBottomSheet>
  );
};

const styles = StyleSheet.create({
  sheetHeaderActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 2,
    paddingBottom: 6,
  },
  closeCircleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFE0CC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE2D1',
  },
  titleTextWrapper: {
    flex: 1,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1810',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
  },
  modalSubheading: {
    fontSize: 12.5,
    color: '#7D6E66',
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeaderRow: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D6E66',
    letterSpacing: 0.5,
  },
  chipsScrollContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 14,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE7DF',
    gap: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2A1810',
  },
  inputCard: {
    backgroundColor: '#FAF6F0',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    padding: 14,
    marginBottom: 14,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7D6E66',
    letterSpacing: 0.5,
  },
  clearFieldText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5B00',
  },
  multilineTextInput: {
    fontSize: 14,
    color: '#2A1810',
    minHeight: 70,
    lineHeight: 20,
    fontWeight: '500',
  },
  inputFooterRow: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  charCountText: {
    fontSize: 11,
    color: '#A89A92',
    fontWeight: '500',
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF8F5',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#FFE5D6',
    marginBottom: 20,
  },
  guidanceText: {
    flex: 1,
    fontSize: 12,
    color: '#7D6E66',
    lineHeight: 17,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    gap: 10,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5B00',
    borderRadius: 24,
    paddingVertical: 13,
    gap: 8,
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '700',
  },
  deleteNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F5',
    borderRadius: 24,
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FFD4D4',
  },
  deleteNoteText: {
    color: '#C62828',
    fontSize: 13,
    fontWeight: '700',
  },
});
