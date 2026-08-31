import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  loadTodayMealLogs,
  logFoodIntake,
  removeMealLog,
  syncPendingMealLogs,
  syncRecentMealLogs,
} from '../services/nutritionService';
import { calculateLocalStreak } from '../services/localDatabase';
import { playMealSuccessSound } from '../services/notificationService';
import { DbMealLog, MicronutrientsData, DetectedFoodItem } from '../types/database';

export interface MealLog {
  id: string;
  user_id?: string;
  dish_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micronutrients?: MicronutrientsData;
  detected_items?: DetectedFoodItem[];
  image_uri?: string | null;
  logged_at: string;
  source: 'ai_scan' | 'manual' | 'preset';
  sync_status?: string;
}

interface NutritionContextType {
  todayCalories: number;
  todayProtein: number;
  todayCarbs: number;
  todayFat: number;
  todayMicros: {
    vitamin_c_mg: number;
    iron_mg: number;
    calcium_mg: number;
  };
  loggedMeals: MealLog[];
  streakDays: number;
  isLoading: boolean;
  addMealLog: (meal: Omit<MealLog, 'id' | 'logged_at'>) => Promise<void>;
  deleteMeal: (mealId: string) => Promise<void>;
  refreshDailyTotals: () => Promise<void>;
  refreshStreak: () => void;
  resetDailyTotals: () => void;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [todayCalories, setTodayCalories] = useState<number>(0);
  const [todayProtein, setTodayProtein] = useState<number>(0);
  const [todayCarbs, setTodayCarbs] = useState<number>(0);
  const [todayFat, setTodayFat] = useState<number>(0);
  const [todayMicros, setTodayMicros] = useState({
    vitamin_c_mg: 0,
    iron_mg: 0,
    calcium_mg: 0,
  });
  const [loggedMeals, setLoggedMeals] = useState<MealLog[]>([]);
  const [streakDays, setStreakDays] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const refreshStreak = useCallback(() => {
    if (user?.id) {
      const streak = calculateLocalStreak(user.id);
      setStreakDays(streak);
    }
  }, [user?.id]);

  // Recalculate totals from an array of DbMealLogs
  const computeTotals = useCallback((meals: DbMealLog[]) => {
    let totalCals = 0;
    let totalProt = 0;
    let totalCarb = 0;
    let totalFats = 0;
    let vitC = 0;
    let iron = 0;
    let calc = 0;

    for (const m of meals) {
      totalCals += Number(m.calories || 0);
      totalProt += Number(m.protein_g || 0);
      totalCarb += Number(m.carbs_g || 0);
      totalFats += Number(m.fat_g || 0);
      if (m.micronutrients) {
        vitC += Number(m.micronutrients.vitamin_c_mg || 0);
        iron += Number(m.micronutrients.iron_mg || 0);
        calc += Number(m.micronutrients.calcium_mg || 0);
      }
    }

    setTodayCalories(Math.round(totalCals));
    setTodayProtein(Math.round(totalProt));
    setTodayCarbs(Math.round(totalCarb));
    setTodayFat(Math.round(totalFats));
    setTodayMicros({
      vitamin_c_mg: Math.round(vitC * 10) / 10,
      iron_mg: Math.round(iron * 10) / 10,
      calcium_mg: Math.round(calc * 10) / 10,
    });

    // Keep pure ISO string in logged_at to ensure valid parsing everywhere
    const displayList: MealLog[] = meals.map((m) => ({
      id: m.id,
      dish_name: m.dish_name,
      calories: m.calories,
      protein_g: m.protein_g,
      carbs_g: m.carbs_g,
      fat_g: m.fat_g,
      micronutrients: m.micronutrients,
      image_uri: m.image_uri || undefined,
      logged_at: m.logged_at,
      source: m.source,
      sync_status: m.sync_status,
    }));

    setLoggedMeals(displayList);
  }, []);

  // Fetch meals on startup or when user changes (loads local SQLite instantly, then cloud)
  const refreshDailyTotals = useCallback(async () => {
    if (!user?.id) {
      setLoggedMeals([]);
      setTodayCalories(0);
      setTodayProtein(0);
      setTodayCarbs(0);
      setTodayFat(0);
      setTodayMicros({ vitamin_c_mg: 0, iron_mg: 0, calcium_mg: 0 });
      setStreakDays(0);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Initial streak calculation from local SQLite
      refreshStreak();

      // 2. Fetch today's meals
      const meals = await loadTodayMealLogs(user.id);
      computeTotals(meals);

      // 3. Background 30-day sync to ensure offline history & streak are hydrated
      syncRecentMealLogs(user.id, 30)
        .then(() => {
          refreshStreak();
        })
        .catch(console.warn);
    } catch (err) {
      console.warn('[NutritionContext] Error refreshing today meals:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, computeTotals, refreshStreak]);

  useEffect(() => {
    refreshDailyTotals();
  }, [refreshDailyTotals]);

  // Add meal log (Optimistic UI + SQLite save + Supabase sync)
  const addMealLog = async (newMeal: Omit<MealLog, 'id' | 'logged_at'>) => {
    playMealSuccessSound();

    const userId = user?.id || 'guest_user';
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    const optimisticMeal: MealLog = {
      ...newMeal,
      id: tempId,
      logged_at: nowIso,
      sync_status: 'pending_insert',
    };

    // Optimistic UI state update
    setLoggedMeals((prev) => [optimisticMeal, ...prev]);
    setTodayCalories((prev) => prev + Number(newMeal.calories || 0));
    setTodayProtein((prev) => prev + Number(newMeal.protein_g || 0));
    setTodayCarbs((prev) => prev + Number(newMeal.carbs_g || 0));
    setTodayFat((prev) => prev + Number(newMeal.fat_g || 0));

    if (newMeal.micronutrients) {
      setTodayMicros((prev) => ({
        vitamin_c_mg: prev.vitamin_c_mg + (newMeal.micronutrients?.vitamin_c_mg || 0),
        iron_mg: prev.iron_mg + (newMeal.micronutrients?.iron_mg || 0),
        calcium_mg: prev.calcium_mg + (newMeal.micronutrients?.calcium_mg || 0),
      }));
    }

    // Persist to local SQLite and Supabase
    try {
      const persistedRecord = await logFoodIntake(userId, {
        dish_name: newMeal.dish_name,
        calories: newMeal.calories,
        protein_g: newMeal.protein_g,
        carbs_g: newMeal.carbs_g,
        fat_g: newMeal.fat_g,
        micronutrients: newMeal.micronutrients,
        image_uri: newMeal.image_uri,
        source: newMeal.source,
        logged_at: nowIso,
      });

      // Update optimistic ID with saved ID & sync status
      setLoggedMeals((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? {
                ...item,
                id: persistedRecord.id,
                sync_status: persistedRecord.sync_status,
              }
            : item
        )
      );

      // Recalculate streak
      refreshStreak();
    } catch (err) {
      console.warn('[NutritionContext] Error saving food intake:', err);
    }
  };

  // Delete a logged meal
  const deleteMeal = async (mealId: string) => {
    const userId = user?.id || 'guest_user';

    const target = loggedMeals.find((m) => m.id === mealId);
    if (target) {
      setTodayCalories((prev) => Math.max(0, prev - Number(target.calories || 0)));
      setTodayProtein((prev) => Math.max(0, prev - Number(target.protein_g || 0)));
      setTodayCarbs((prev) => Math.max(0, prev - Number(target.carbs_g || 0)));
      setTodayFat((prev) => Math.max(0, prev - Number(target.fat_g || 0)));
      if (target.micronutrients) {
        setTodayMicros((prev) => ({
          vitamin_c_mg: Math.max(0, prev.vitamin_c_mg - (target.micronutrients?.vitamin_c_mg || 0)),
          iron_mg: Math.max(0, prev.iron_mg - (target.micronutrients?.iron_mg || 0)),
          calcium_mg: Math.max(0, prev.calcium_mg - (target.micronutrients?.calcium_mg || 0)),
        }));
      }
    }

    setLoggedMeals((prev) => prev.filter((m) => m.id !== mealId));

    try {
      await removeMealLog(userId, mealId);
      refreshStreak();
    } catch (err) {
      console.warn('[NutritionContext] Error deleting meal:', err);
    }
  };

  const resetDailyTotals = () => {
    setTodayCalories(0);
    setTodayProtein(0);
    setTodayCarbs(0);
    setTodayFat(0);
    setTodayMicros({ vitamin_c_mg: 0, iron_mg: 0, calcium_mg: 0 });
    setLoggedMeals([]);
    setStreakDays(0);
  };

  return (
    <NutritionContext.Provider
      value={{
        todayCalories,
        todayProtein,
        todayCarbs,
        todayFat,
        todayMicros,
        loggedMeals,
        streakDays,
        isLoading,
        addMealLog,
        deleteMeal,
        refreshDailyTotals,
        refreshStreak,
        resetDailyTotals,
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (!context) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
};
