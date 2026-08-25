import { ActivityLevel, Gender, PrimaryGoal } from '../types/database';

export interface NutritionCalculatorInputs {
  gender: Gender;
  age: number;
  weight_kg: number;
  height_cm: number;
  activity_level: ActivityLevel;
  primary_goal: PrimaryGoal;
}

export interface CalculatedMacroTargets {
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_carbs_target: number;
  daily_fat_target: number;
  bmr: number;
  tdee: number;
}

export function calculateDailyTargets(inputs: NutritionCalculatorInputs): CalculatedMacroTargets {
  const { gender, age, weight_kg, height_cm, activity_level, primary_goal } = inputs;

  // 1. Calculate Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
  } else if (gender === 'female') {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
  } else {
    bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 78;
  }
  bmr = Math.max(1000, Math.round(bmr));

  // 2. Calculate Total Daily Energy Expenditure (TDEE)
  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    very_active: 1.725,
  };
  const multiplier = activityMultipliers[activity_level] || 1.375;
  const tdee = Math.round(bmr * multiplier);

  // 3. Goal Adjustment & Macro Distribution
  let calories: number;
  let proteinGrams: number;
  let fatGrams: number;
  let carbsGrams: number;

  switch (primary_goal) {
    case 'build_muscle':
      calories = Math.round(tdee * 1.12); // +12% caloric surplus
      proteinGrams = Math.round(weight_kg * 2.0); // 2.0g per kg body weight
      fatGrams = Math.round((calories * 0.25) / 9); // 25% of calories from fat
      carbsGrams = Math.max(50, Math.round((calories - (proteinGrams * 4) - (fatGrams * 9)) / 4));
      break;

    case 'fat_loss':
      calories = Math.round(tdee * 0.80); // 20% caloric deficit
      proteinGrams = Math.round(weight_kg * 2.2); // 2.2g per kg (high to preserve lean mass)
      fatGrams = Math.round((calories * 0.25) / 9);
      carbsGrams = Math.max(40, Math.round((calories - (proteinGrams * 4) - (fatGrams * 9)) / 4));
      break;

    case 'micronutrient':
      calories = Math.round(tdee);
      proteinGrams = Math.round(weight_kg * 1.6);
      fatGrams = Math.round((calories * 0.30) / 9);
      carbsGrams = Math.max(50, Math.round((calories - (proteinGrams * 4) - (fatGrams * 9)) / 4));
      break;

    case 'maintain':
    default:
      calories = Math.round(tdee);
      proteinGrams = Math.round(weight_kg * 1.6);
      fatGrams = Math.round((calories * 0.28) / 9);
      carbsGrams = Math.max(50, Math.round((calories - (proteinGrams * 4) - (fatGrams * 9)) / 4));
      break;
  }

  // Safety floor for healthy minimum targets
  calories = Math.max(1200, calories);
  proteinGrams = Math.max(50, proteinGrams);
  fatGrams = Math.max(30, fatGrams);
  carbsGrams = Math.max(50, carbsGrams);

  return {
    daily_calorie_target: calories,
    daily_protein_target: proteinGrams,
    daily_carbs_target: carbsGrams,
    daily_fat_target: fatGrams,
    bmr,
    tdee,
  };
}
