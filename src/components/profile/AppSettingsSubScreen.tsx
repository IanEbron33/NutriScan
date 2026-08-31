import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { DraggableBottomSheet } from '../ui/DraggableBottomSheet';
import {
  ArrowLeft,
  Clock,
  X,
  Check,
  Sliders,
} from '../ui/LucideIcons';

interface AppSettingsSubScreenProps {
  unitSystem: 'metric' | 'imperial';
  onUnitSystemChange: (unit: 'metric' | 'imperial') => void;
  breakfastEnabled: boolean;
  onBreakfastEnabledChange: (val: boolean) => void;
  breakfastTime: string;
  onBreakfastTimeChange: (time: string) => void;
  lunchEnabled: boolean;
  onLunchEnabledChange: (val: boolean) => void;
  lunchTime: string;
  onLunchTimeChange: (time: string) => void;
  dinnerEnabled: boolean;
  onDinnerEnabledChange: (val: boolean) => void;
  dinnerTime: string;
  onDinnerTimeChange: (time: string) => void;
  onBack: () => void;
}

const ITEM_HEIGHT = 40;
const WHEEL_HEIGHT = ITEM_HEIGHT * 3; // 120px (1 above, 1 selected in middle, 1 below)

const HOURS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const PERIODS = ['AM', 'PM'];

export const AppSettingsSubScreen: React.FC<AppSettingsSubScreenProps> = ({
  unitSystem,
  onUnitSystemChange,
  breakfastEnabled,
  onBreakfastEnabledChange,
  breakfastTime,
  onBreakfastTimeChange,
  lunchEnabled,
  onLunchEnabledChange,
  lunchTime,
  onLunchTimeChange,
  dinnerEnabled,
  onDinnerEnabledChange,
  dinnerTime,
  onDinnerTimeChange,
  onBack,
}) => {
  // Time Picker Modal State
  const [editingMealType, setEditingMealType] = useState<'breakfast' | 'lunch' | 'dinner' | null>(null);
  const [tempHour, setTempHour] = useState('08');
  const [tempMinute, setTempMinute] = useState('30');
  const [tempAmPm, setTempAmPm] = useState<'AM' | 'PM'>('AM');

  const hourListRef = useRef<FlatList<string>>(null);
  const minuteListRef = useRef<FlatList<string>>(null);
  const periodListRef = useRef<FlatList<string>>(null);

  const openTimePicker = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    let currentTime = breakfastTime;
    if (mealType === 'lunch') currentTime = lunchTime;
    if (mealType === 'dinner') currentTime = dinnerTime;

    const parts = currentTime.split(' ');
    const timeParts = (parts[0] || '08:00').split(':');
    const h = timeParts[0] ? timeParts[0].padStart(2, '0') : '08';
    const m = timeParts[1] ? timeParts[1].padStart(2, '0') : '00';
    const p = ((parts[1] as 'AM' | 'PM') || 'AM');

    setTempHour(h);
    setTempMinute(m);
    setTempAmPm(p);
    setEditingMealType(mealType);

    // Center wheels on initial values
    setTimeout(() => {
      const hIdx = HOURS.indexOf(h);
      if (hIdx !== -1) {
        hourListRef.current?.scrollToOffset({ offset: hIdx * ITEM_HEIGHT, animated: false });
      }

      // Snap to nearest 5-minute step
      let mIdx = MINUTES.indexOf(m);
      if (mIdx === -1) {
        const numM = parseInt(m, 10) || 0;
        const roundedM = String(Math.round(numM / 5) * 5 % 60).padStart(2, '0');
        mIdx = MINUTES.indexOf(roundedM);
      }
      if (mIdx !== -1) {
        minuteListRef.current?.scrollToOffset({ offset: mIdx * ITEM_HEIGHT, animated: false });
      }

      const pIdx = PERIODS.indexOf(p);
      if (pIdx !== -1) {
        periodListRef.current?.scrollToOffset({ offset: pIdx * ITEM_HEIGHT, animated: false });
      }
    }, 60);
  };

  const handleHourScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const bounded = Math.max(0, Math.min(index, HOURS.length - 1));
    const val = HOURS[bounded];
    if (val && val !== tempHour) {
      setTempHour(val);
    }
  };

  const handleMinuteScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const bounded = Math.max(0, Math.min(index, MINUTES.length - 1));
    const val = MINUTES[bounded];
    if (val && val !== tempMinute) {
      setTempMinute(val);
    }
  };

  const handlePeriodScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const bounded = Math.max(0, Math.min(index, PERIODS.length - 1));
    const val = PERIODS[bounded] as 'AM' | 'PM';
    if (val && val !== tempAmPm) {
      setTempAmPm(val);
    }
  };

  const saveCustomTime = () => {
    const formatted = `${tempHour.padStart(2, '0')}:${tempMinute.padStart(2, '0')} ${tempAmPm}`;
    if (editingMealType === 'breakfast') onBreakfastTimeChange(formatted);
    if (editingMealType === 'lunch') onLunchTimeChange(formatted);
    if (editingMealType === 'dinner') onDinnerTimeChange(formatted);
    setEditingMealType(null);
  };

  return (
    <View style={styles.container}>
      {/* Top Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={18} color="#2A1810" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>App Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Units of Measurement */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>UNITS OF MEASUREMENT</Text>
          <View style={styles.cardContainer}>
            <View style={styles.unitHeaderRow}>
              <View style={styles.settingIconBox}>
                <Sliders size={15} color="#FF5B00" />
              </View>
              <View style={styles.settingTextCol}>
                <Text style={styles.settingTitle}>Measurement Standard</Text>
                <Text style={styles.settingSubtitle}>
                  {unitSystem === 'metric' ? 'Metric (kg, cm, g)' : 'Imperial (lbs, ft, oz)'}
                </Text>
              </View>
            </View>

            <View style={styles.segmentedBar}>
              <TouchableOpacity
                style={[styles.segmentButton, unitSystem === 'metric' && styles.segmentButtonActive]}
                onPress={() => onUnitSystemChange('metric')}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, unitSystem === 'metric' && styles.segmentTextActive]}>
                  Metric (kg, cm)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentButton, unitSystem === 'imperial' && styles.segmentButtonActive]}
                onPress={() => onUnitSystemChange('imperial')}
                activeOpacity={0.8}
              >
                <Text style={[styles.segmentText, unitSystem === 'imperial' && styles.segmentTextActive]}>
                  Imperial (lbs, ft)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. Meal Reminder Notifications */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>MEAL REMINDER NOTIFICATIONS</Text>
          <View style={styles.cardContainer}>
            {/* Breakfast Reminder */}
            <View style={styles.reminderRow}>
              <Text style={styles.reminderMealName} numberOfLines={1}>
                Breakfast
              </Text>
              <TouchableOpacity
                style={styles.timeChip}
                onPress={() => openTimePicker('breakfast')}
                activeOpacity={0.75}
              >
                <Clock size={11} color="#FF5B00" />
                <Text style={styles.timeChipText}>{breakfastTime}</Text>
              </TouchableOpacity>
              <Switch
                value={breakfastEnabled}
                onValueChange={onBreakfastEnabledChange}
                trackColor={{ false: '#EFE7DF', true: '#FF5B00' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.itemDivider} />

            {/* Lunch Reminder */}
            <View style={styles.reminderRow}>
              <Text style={styles.reminderMealName} numberOfLines={1}>
                Lunch
              </Text>
              <TouchableOpacity
                style={styles.timeChip}
                onPress={() => openTimePicker('lunch')}
                activeOpacity={0.75}
              >
                <Clock size={11} color="#FF5B00" />
                <Text style={styles.timeChipText}>{lunchTime}</Text>
              </TouchableOpacity>
              <Switch
                value={lunchEnabled}
                onValueChange={onLunchEnabledChange}
                trackColor={{ false: '#EFE7DF', true: '#FF5B00' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.itemDivider} />

            {/* Dinner Reminder */}
            <View style={styles.reminderRow}>
              <Text style={styles.reminderMealName} numberOfLines={1}>
                Dinner
              </Text>
              <TouchableOpacity
                style={styles.timeChip}
                onPress={() => openTimePicker('dinner')}
                activeOpacity={0.75}
              >
                <Clock size={11} color="#FF5B00" />
                <Text style={styles.timeChipText}>{dinnerTime}</Text>
              </TouchableOpacity>
              <Switch
                value={dinnerEnabled}
                onValueChange={onDinnerEnabledChange}
                trackColor={{ false: '#EFE7DF', true: '#FF5B00' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Snap-to-Center Scroll Wheel Time Picker Modal */}
      <DraggableBottomSheet
        visible={editingMealType !== null}
        onClose={() => setEditingMealType(null)}
        maxHeight={480}
        backgroundColor="#FFFFFF"
        showHandle={true}
      >
        <View style={styles.modalContentWrapper}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Set {editingMealType === 'breakfast' ? 'Breakfast' : editingMealType === 'lunch' ? 'Lunch' : 'Dinner'} Time
            </Text>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setEditingMealType(null)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={15} color="#FF5B00" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Column Labels */}
          <View style={styles.columnLabelsRow}>
            <Text style={styles.columnLabel}>HOUR</Text>
            <View style={{ width: 14 }} />
            <Text style={styles.columnLabel}>MIN</Text>
            <View style={{ width: 14 }} />
            <Text style={styles.columnLabel}>PERIOD</Text>
          </View>

          {/* Snap-to-Center Wheel Stage with Background Box */}
          <View style={styles.wheelStage}>
            {/* Central Active Selection Highlight Bar across columns */}
            <View style={styles.centerHighlightBar} pointerEvents="none" />

            {/* 1. Hour Snap Wheel */}
            <View style={styles.wheelColumn}>
              <FlatList
                ref={hourListRef}
                data={HOURS}
                keyExtractor={(item) => item}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                onScroll={handleHourScroll}
                onMomentumScrollEnd={handleHourScroll}
                scrollEventThrottle={16}
                ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
                ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
                getItemLayout={(_, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
                renderItem={({ item }) => {
                  const isSelected = tempHour === item;
                  return (
                    <View style={styles.wheelItem}>
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>
                        {item}
                      </Text>
                    </View>
                  );
                }}
              />
            </View>

            <Text style={styles.stageColon}>:</Text>

            {/* 2. Minute Snap Wheel */}
            <View style={styles.wheelColumn}>
              <FlatList
                ref={minuteListRef}
                data={MINUTES}
                keyExtractor={(item) => item}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                onScroll={handleMinuteScroll}
                onMomentumScrollEnd={handleMinuteScroll}
                scrollEventThrottle={16}
                ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
                ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
                getItemLayout={(_, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
                renderItem={({ item }) => {
                  const isSelected = tempMinute === item;
                  return (
                    <View style={styles.wheelItem}>
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>
                        {item}
                      </Text>
                    </View>
                  );
                }}
              />
            </View>

            <View style={{ width: 6 }} />

            {/* 3. Period (AM/PM) Snap Wheel */}
            <View style={styles.wheelColumn}>
              <FlatList
                ref={periodListRef}
                data={PERIODS}
                keyExtractor={(item) => item}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                onScroll={handlePeriodScroll}
                onMomentumScrollEnd={handlePeriodScroll}
                scrollEventThrottle={16}
                ListHeaderComponent={<View style={{ height: ITEM_HEIGHT }} />}
                ListFooterComponent={<View style={{ height: ITEM_HEIGHT }} />}
                getItemLayout={(_, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
                renderItem={({ item }) => {
                  const isSelected = tempAmPm === item;
                  return (
                    <View style={styles.wheelItem}>
                      <Text style={[styles.wheelText, isSelected && styles.wheelTextSelected]}>
                        {item}
                      </Text>
                    </View>
                  );
                }}
              />
            </View>
          </View>

          {/* Modal Confirm Button */}
          <TouchableOpacity style={styles.modalSaveBtn} onPress={saveCustomTime} activeOpacity={0.85}>
            <Check size={15} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.modalSaveBtnText}>Set Time</Text>
          </TouchableOpacity>
        </View>
      </DraggableBottomSheet>
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
  sectionBlock: {
    marginBottom: 18,
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#8C7B73',
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.2,
    borderColor: '#EFE7DF',
  },
  unitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  settingIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextCol: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  settingSubtitle: {
    fontSize: 11.5,
    color: '#7D6E66',
    fontWeight: '500',
    marginTop: 1,
  },
  segmentedBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF6F0',
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: '#EFE7DF',
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentButtonActive: {
    backgroundColor: '#FF5B00',
    shadowColor: '#FF5B00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  segmentText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7D6E66',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  reminderMealName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2A1810',
    flex: 1,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE2D1',
    gap: 4,
    marginRight: 10,
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF5B00',
  },
  itemDivider: {
    height: 1,
    backgroundColor: '#F5EFEA',
    marginVertical: 8,
  },
  modalContentWrapper: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2A1810',
  },
  modalCloseBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnLabelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 6,
    paddingHorizontal: 8,
  },
  columnLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#8C7B73',
    letterSpacing: 0.5,
    textAlign: 'center',
    flex: 1,
  },
  wheelStage: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_HEIGHT,
    backgroundColor: '#FAF6F0',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE7DF',
    paddingHorizontal: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  centerHighlightBar: {
    position: 'absolute',
    top: ITEM_HEIGHT, // 40px down
    left: 8,
    right: 8,
    height: ITEM_HEIGHT,
    backgroundColor: '#FFF0E6',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: '#FFD4BF',
  },
  wheelColumn: {
    flex: 1,
    height: WHEEL_HEIGHT,
  },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C7B73',
  },
  wheelTextSelected: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FF5B00',
  },
  stageColon: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2A1810',
    marginHorizontal: 2,
  },
  modalSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF5B00',
    borderRadius: 18,
    paddingVertical: 11,
    gap: 6,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
});
