import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { DraggableBottomSheet } from './DraggableBottomSheet';
import { X, Check } from './LucideIcons';

interface ScrollWheelPickerModalProps {
  visible: boolean;
  title: string;
  unit?: string;
  selectedValue: number;
  minValue?: number;
  maxValue?: number;
  onConfirm: (value: number) => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 5;
const LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS; // 240px

export const ScrollWheelPickerModal: React.FC<ScrollWheelPickerModalProps> = ({
  visible,
  title,
  unit = 'years old',
  selectedValue,
  minValue = 14,
  maxValue = 90,
  onConfirm,
  onClose,
}) => {
  const [tempValue, setTempValue] = useState<number>(selectedValue);
  const flatListRef = useRef<FlatList<number>>(null);

  // Generate range array
  const data = useMemo(() => {
    const items: number[] = [];
    for (let i = minValue; i <= maxValue; i++) {
      items.push(i);
    }
    return items;
  }, [minValue, maxValue]);

  // Sync temp value when modal opens
  useEffect(() => {
    if (visible) {
      setTempValue(selectedValue);
      const index = data.indexOf(selectedValue);
      if (index !== -1) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({
            offset: index * ITEM_HEIGHT,
            animated: false,
          });
        }, 80);
      }
    }
  }, [visible, selectedValue, data]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const boundedIndex = Math.max(0, Math.min(index, data.length - 1));
    const value = data[boundedIndex];
    if (value && value !== tempValue) {
      setTempValue(value);
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const boundedIndex = Math.max(0, Math.min(index, data.length - 1));
    const value = data[boundedIndex];
    if (value) {
      setTempValue(value);
      flatListRef.current?.scrollToOffset({
        offset: boundedIndex * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const selectItemByIndex = (index: number) => {
    const value = data[index];
    if (value) {
      setTempValue(value);
      flatListRef.current?.scrollToOffset({
        offset: index * ITEM_HEIGHT,
        animated: true,
      });
    }
  };

  const handleConfirm = () => {
    onConfirm(tempValue);
    onClose();
  };

  return (
    <DraggableBottomSheet
      visible={visible}
      onClose={onClose}
      maxHeight={480}
      backgroundColor="#FFFFFF"
      showHandle={true}
    >
      <View style={styles.contentWrapper}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{unit}</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X size={18} color="#2A1810" />
          </TouchableOpacity>
        </View>

          {/* Wheel Picker Container */}
          <View style={styles.pickerContainer}>
            {/* Center Selection Spotlight Pill */}
            <View style={styles.selectionHighlight} pointerEvents="none" />

            <FlatList
              ref={flatListRef}
              data={data}
              keyExtractor={(item) => item.toString()}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onMomentumScrollEnd={handleScrollEnd}
              contentContainerStyle={{
                paddingVertical: (LIST_HEIGHT - ITEM_HEIGHT) / 2, // 96px top/bottom padding
              }}
              getItemLayout={(_, index) => ({
                length: ITEM_HEIGHT,
                offset: ITEM_HEIGHT * index,
                index,
              })}
              renderItem={({ item, index }) => {
                const isSelected = item === tempValue;
                const distance = Math.abs(item - tempValue);
                const opacity = isSelected ? 1 : distance === 1 ? 0.45 : 0.2;

                return (
                  <TouchableOpacity
                    style={styles.wheelItem}
                    onPress={() => selectItemByIndex(index)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.wheelText,
                        isSelected && styles.wheelTextSelected,
                        { opacity },
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Confirm CTA Button */}
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
            activeOpacity={0.85}
          >
            <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.confirmButtonText}>Confirm Age ({tempValue})</Text>
          </TouchableOpacity>
        </View>
    </DraggableBottomSheet>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2A1810',
  },
  subtitle: {
    fontSize: 12,
    color: '#8C7B73',
    fontWeight: '600',
    marginTop: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#EFE7DF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    height: LIST_HEIGHT,
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 20,
  },
  selectionHighlight: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: (LIST_HEIGHT - ITEM_HEIGHT) / 2,
    height: ITEM_HEIGHT,
    backgroundColor: '#FFF0E6',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FFDBC2',
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2A1810',
  },
  wheelTextSelected: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FF5B00',
  },
  confirmButton: {
    backgroundColor: '#FF5B00',
    borderRadius: 30,
    paddingVertical: 15,
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
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
