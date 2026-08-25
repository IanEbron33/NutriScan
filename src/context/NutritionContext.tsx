import React, { createContext, useContext, useState } from 'react';

export interface MealLog {
  id: string;
  dish_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micronutrients?: {
    vitamin_c_mg?: number;
    iron_mg?: number;
    calcium_mg?: number;
    fiber_g?: number;
  };
  image_uri?: string;
  logged_at: string;
  source: 'ai_scan' | 'manual' | 'preset';
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
  addMealLog: (meal: Omit<MealLog, 'id' | 'logged_at'>) => void;
  resetDailyTotals: () => void;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Baseline initial metrics matching screenshot mockup (~1,648 kcal, 85g Protein, 190g Carbs, 52g Fat)
  const [todayCalories, setTodayCalories] = useState<number>(1648);
  const [todayProtein, setTodayProtein] = useState<number>(85);
  const [todayCarbs, setTodayCarbs] = useState<number>(190);
  const [todayFat, setTodayFat] = useState<number>(52);
  const [todayMicros, setTodayMicros] = useState({
    vitamin_c_mg: 75,
    iron_mg: 12.5,
    calcium_mg: 620,
  });
  const [loggedMeals, setLoggedMeals] = useState<MealLog[]>([]);

  const addMealLog = (newMeal: Omit<MealLog, 'id' | 'logged_at'>) => {
    const mealWithId: MealLog = {
      ...newMeal,
      id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      logged_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setLoggedMeals((prev) => [mealWithId, ...prev]);
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
  };

  const resetDailyTotals = () => {
    setTodayCalories(0);
    setTodayProtein(0);
    setTodayCarbs(0);
    setTodayFat(0);
    setLoggedMeals([]);
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
        addMealLog,
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
