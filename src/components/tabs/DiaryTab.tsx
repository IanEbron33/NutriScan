import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNutrition } from '../../context/NutritionContext';
import { getLocalMealsByDate } from '../../services/localDatabase';
import { DbMealLog } from '../../types/database';
import { MealDetailsModal } from '../modals/MealDetailsModal';
import {
  Calendar,
  UtensilsCrossed,
  Plus,
  Clock,
  ChevronRight,
} from '../ui/LucideIcons';

interface DiaryTabProps {
  onOpenScanner: () => void;
}

const { width } = Dimensions.get('window');

export const DiaryTab: React.FC<DiaryTabProps> = ({ onOpenScanner }) => {
  const { user, profile } = useAuth();
  const { loggedMeals: todayContextMeals, deleteMeal } = useNutrition();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateMeals, setDateMeals] = useState<DbMealLog[]>([]);
  const [selectedMealForDetails, setSelectedMealForDetails] = useState<DbMealLog | null>(null);
  const dateScrollRef = useRef<ScrollView>(null);

  const calorieTarget = profile?.daily_calorie_target || 2400;

  // Generate 14-day date window (-10 days up to +3 days from today)
  const dateStrip = useMemo(() => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = -10; i <= 3; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, []);

  const isToday = (d: Date) => {
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  // Auto-scroll date strip to center today on mount
  useEffect(() => {
    const todayIndex = dateStrip.findIndex((d) => isToday(d));
    if (todayIndex !== -1 && dateScrollRef.current) {
      setTimeout(() => {
        const scrollX = Math.max(0, todayIndex * 62 - (width / 2 - 31 - 20));
        dateScrollRef.current?.scrollTo({ x: scrollX, animated: true });
      }, 150);
    }
  }, [dateStrip]);

  // Load meals whenever selectedDate changes
  useEffect(() => {
    if (!user?.id) return;
    const meals = getLocalMealsByDate(user.id, selectedDate);
    setDateMeals(meals);
  }, [selectedDate, user?.id, todayContextMeals]);

  // Compute daily totals for the selected date
  const dayCalories = useMemo(() => {
    return dateMeals.reduce((acc, m) => acc + Number(m.calories || 0), 0);
  }, [dateMeals]);

  const dayProtein = useMemo(() => {
    return dateMeals.reduce((acc, m) => acc + Number(m.protein_g || 0), 0);
  }, [dateMeals]);

  const dayCarbs = useMemo(() => {
    return dateMeals.reduce((acc, m) => acc + Number(m.carbs_g || 0), 0);
  }, [dateMeals]);

  const dayFat = useMemo(() => {
    return dateMeals.reduce((acc, m) => acc + Number(m.fat_g || 0), 0);
  }, [dateMeals]);

  const remainingCalories = calorieTarget - dayCalories;
  const progressRatio = Math.min(1, dayCalories / calorieTarget);

  const handleDelete = async (mealId: string, dishName: string) => {
    await deleteMeal(mealId);
    if (user?.id) {
      setDateMeals((prev) => prev.filter((m) => m.id !== mealId));
    }
  };

  const formatDisplayTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatMonthYear = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatDayTitle = (d: Date) => {
    if (isToday(d)) return 'Today';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const jumpToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    const todayIndex = dateStrip.findIndex((d) => isToday(d));
    if (todayIndex !== -1 && dateScrollRef.current) {
      const scrollX = Math.max(0, todayIndex * 62 - (width / 2 - 31 - 20));
      dateScrollRef.current?.scrollTo({ x: scrollX, animated: true });
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Section */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>FOOD DIARY & HISTORY</Text>
          <Text style={styles.headerTitle}>{formatDayTitle(selectedDate)}</Text>
        </View>

        {!isToday(selectedDate) ? (
          <TouchableOpacity style={styles.todayPillButton} onPress={jumpToToday} activeOpacity={0.8}>
            <Calendar size={14} color="#FF5B00" />
            <Text style={styles.todayPillText}>Jump to Today</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBadge}>
            <Calendar size={18} color="#FF5B00" />
          </View>
        )}
      </View>

      {/* 2. Month Selector & Date Strip */}
      <View style={styles.dateSectionContainer}>
        <View style={styles.monthHeaderRow}>
          <Text style={styles.monthHeaderText}>{formatMonthYear(selectedDate)}</Text>
        </View>

        <ScrollView
          ref={dateScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStripScroll}
        >
          {dateStrip.map((d, index) => {
            const isSelected = isSameDay(d, selectedDate);
            const isCurrentToday = isToday(d);
            const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3).toUpperCase();
            const dayNum = d.getDate();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.datePill,
                  isSelected && styles.datePillSelected,
                  isCurrentToday && !isSelected && styles.datePillToday,
                ]}
                onPress={() => setSelectedDate(d)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.datePillDayName,
                    isSelected && styles.datePillTextSelected,
                    isCurrentToday && !isSelected && { color: '#FF5B00' },
                  ]}
                >
                  {dayOfWeek}
                </Text>
                <Text
                  style={[
                    styles.datePillDayNum,
                    isSelected && styles.datePillTextSelected,
                  ]}
                >
                  {dayNum}
                </Text>
                {isCurrentToday && (
                  <View
                    style={[
                      styles.todayIndicatorDot,
                      isSelected && { backgroundColor: '#FFFFFF' },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Option A: Redesigned Calories Consumed Card */}
      <View style={styles.summaryCard}>
        {/* Top Header Row with Status Badge */}
        <View style={styles.summaryTopRow}>
          <Text style={styles.summaryCardLabel}>CALORIES CONSUMED</Text>
          <View
            style={[
              styles.budgetBadge,
              remainingCalories >= 0 ? styles.budgetUnder : styles.budgetOver,
            ]}
          >
            <Text
              style={[
                styles.budgetText,
                remainingCalories >= 0 ? styles.budgetTextUnder : styles.budgetTextOver,
              ]}
            >
              {remainingCalories >= 0
                ? `${remainingCalories} kcal left`
                : `${Math.abs(remainingCalories)} kcal over`}
            </Text>
          </View>
        </View>

        {/* Hero Calorie Count */}
        <View style={styles.calorieHeroRow}>
          <Text style={styles.summaryCaloriesBig}>{Math.round(dayCalories)}</Text>
          <Text style={styles.summaryCaloriesTarget}> / {calorieTarget} kcal</Text>
        </View>

        {/* Clean Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(100, progressRatio * 100)}%`,
                backgroundColor: dayCalories > calorieTarget ? '#E54D42' : '#FF5B00',
              },
            ]}
          />
        </View>

        {/* 3 Balanced Vertical-Stacked Macro Cards */}
        <View style={styles.macroCardsRow}>
          <View style={[styles.macroCard, { backgroundColor: '#FFECEB' }]}>
            <Text style={[styles.macroCardValue, { color: '#E54D42' }]}>
              {Math.round(dayProtein)}g
            </Text>
            <Text style={styles.macroCardLabel}>Protein</Text>
          </View>

          <View style={[styles.macroCard, { backgroundColor: '#FEF6E9' }]}>
            <Text style={[styles.macroCardValue, { color: '#F39C12' }]}>
              {Math.round(dayCarbs)}g
            </Text>
            <Text style={styles.macroCardLabel}>Carbs</Text>
          </View>

          <View style={[styles.macroCard, { backgroundColor: '#F5EFEA' }]}>
            <Text style={[styles.macroCardValue, { color: '#8B5A2B' }]}>
              {Math.round(dayFat)}g
            </Text>
            <Text style={styles.macroCardLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* 4. Meal Log Timeline */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Logged Meals ({dateMeals.length})
        </Text>
      </View>

      {dateMeals.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconContainer}>
            <UtensilsCrossed size={32} color="#8C7B73" />
          </View>
          <Text style={styles.emptyTitle}>No Meals Logged</Text>
          <Text style={styles.emptySubtitle}>
            {isToday(selectedDate)
              ? "You haven't logged any food yet today. Snap a dish to get started!"
              : `No food intake records found for ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`}
          </Text>
          {isToday(selectedDate) && (
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={onOpenScanner}
              activeOpacity={0.85}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.emptyButtonText}>Log a Meal</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <View style={styles.mealList}>
          {dateMeals.map((meal) => (
            <TouchableOpacity
              key={meal.id}
              style={styles.horizonMealCard}
              onPress={() => setSelectedMealForDetails(meal)}
              activeOpacity={0.75}
            >
              {/* Left: Food Thumbnail */}
              {meal.image_uri ? (
                <Image
                  source={{ uri: meal.image_uri }}
                  style={styles.horizonMealThumb}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.horizonMealPlaceholder}>
                  <UtensilsCrossed size={22} color="#FF5B00" />
                </View>
              )}

              {/* Right: Main Info Content */}
              <View style={styles.horizonMealContent}>
                {/* Row 1: Dish Title (Left) + Calorie Badge (Right) */}
                <View style={styles.horizonTopRow}>
                  <Text style={styles.horizonTitle} numberOfLines={1}>
                    {meal.dish_name}
                  </Text>
                  <View style={styles.horizonCalorieWrap}>
                    <Text style={styles.horizonCalorieNumber}>{meal.calories}</Text>
                    <Text style={styles.horizonCalorieUnit}>kcal</Text>
                  </View>
                </View>

                {/* Row 2: Time */}
                <View style={styles.horizonTimeRow}>
                  <Clock size={11} color="#8C7B73" />
                  <Text style={styles.horizonTimeText}>
                    {formatDisplayTime(meal.logged_at)}
                  </Text>
                </View>

                {/* Row 3: Macro Tags (Left) + Navigation Chevron (Right) */}
                <View style={styles.horizonBottomRow}>
                  <View style={styles.horizonMacroPills}>
                    <View style={[styles.horizonMacroPill, { backgroundColor: '#FFECEB' }]}>
                      <Text style={[styles.horizonMacroText, { color: '#E54D42' }]}>
                        {meal.protein_g}g P
                      </Text>
                    </View>
                    <View style={[styles.horizonMacroPill, { backgroundColor: '#FEF6E9' }]}>
                      <Text style={[styles.horizonMacroText, { color: '#F39C12' }]}>
                        {meal.carbs_g}g C
                      </Text>
                    </View>
                    <View style={[styles.horizonMacroPill, { backgroundColor: '#F5EFEA' }]}>
                      <Text style={[styles.horizonMacroText, { color: '#8B5A2B' }]}>
                        {meal.fat_g}g F
                      </Text>
                    </View>
                  </View>

                  <ChevronRight size={14} color="#C4B5A5" />
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {/* Quick Log Button at the bottom */}
          <TouchableOpacity
            style={styles.logNextButton}
            onPress={onOpenScanner}
            activeOpacity={0.8}
          >
            <View style={styles.plusBox}>
              <Plus size={16} color="#FF5B00" strokeWidth={2.5} />
            </View>
            <Text style={styles.logNextText}>Log Another Meal</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Full Meal Details Modal */}
      <MealDetailsModal
        meal={selectedMealForDetails}
        visible={!!selectedMealForDetails}
        onClose={() => setSelectedMealForDetails(null)}
        onDelete={handleDelete}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF5B00',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#2A1810',
    marginTop: 2,
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  todayPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFE0CC',
    gap: 6,
  },
  todayPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5B00',
  },
  dateSectionContainer: {
    marginBottom: 18,
  },
  monthHeaderRow: {
    marginBottom: 8,
  },
  monthHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8C7B73',
    letterSpacing: 0.4,
  },
  dateStripScroll: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
    paddingRight: 20,
  },
  datePill: {
    width: 52,
    height: 70,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  datePillToday: {
    borderColor: '#FF5B00',
  },
  datePillSelected: {
    backgroundColor: '#FF5B00',
    borderColor: '#FF5B00',
    shadowColor: '#FF5B00',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  datePillDayName: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C7B73',
    letterSpacing: 0.5,
  },
  datePillDayNum: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1810',
    marginTop: 3,
  },
  datePillTextSelected: {
    color: '#FFFFFF',
  },
  todayIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FF5B00',
    marginTop: 3,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    marginBottom: 20,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8C7B73',
    letterSpacing: 0.8,
  },
  budgetBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  budgetUnder: {
    backgroundColor: '#E8F5E9',
  },
  budgetOver: {
    backgroundColor: '#FFEBEE',
  },
  budgetText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  budgetTextUnder: {
    color: '#2E7D32',
  },
  budgetTextOver: {
    color: '#C62828',
  },
  calorieHeroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  summaryCaloriesBig: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2A1810',
  },
  summaryCaloriesTarget: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8C7B73',
    marginLeft: 4,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#FAF6F0',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFE7DF',
    marginBottom: 16,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  macroCardsRow: {
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
  macroCardValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  macroCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C7B73',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2A1810',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
  },
  emptyIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2A1810',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8C7B73',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5B00',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 6,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mealList: {
    gap: 12,
  },
  horizonMealCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFE7DF',
    shadowColor: '#2A1810',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  horizonMealThumb: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FAF6F0',
  },
  horizonMealPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  horizonMealContent: {
    flex: 1,
    justifyContent: 'center',
  },
  horizonTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  horizonTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: '#2A1810',
  },
  horizonCalorieWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  horizonCalorieNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#2A1810',
  },
  horizonCalorieUnit: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8C7B73',
  },
  horizonTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    marginBottom: 6,
  },
  horizonTimeText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C7B73',
  },
  horizonBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  horizonMacroPills: {
    flexDirection: 'row',
    gap: 6,
  },
  horizonMacroPill: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
  },
  horizonMacroText: {
    fontSize: 10,
    fontWeight: '700',
  },
  logNextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FF5B00',
    borderStyle: 'dashed',
    borderRadius: 18,
    paddingVertical: 14,
    marginTop: 6,
    gap: 8,
  },
  plusBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF0E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logNextText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5B00',
  },
});
