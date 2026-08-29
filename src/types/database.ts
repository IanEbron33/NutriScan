export type PrimaryGoal = 'build_muscle' | 'fat_loss' | 'maintain' | 'micronutrient';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type Gender = 'male' | 'female' | 'other';
export type SyncStatus = 'synced' | 'pending_insert' | 'pending_delete';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_onboarded?: boolean;
  gender?: Gender;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  activity_level?: ActivityLevel;
  primary_goal?: PrimaryGoal;
  daily_calorie_target: number;
  daily_protein_target: number;
  daily_carbs_target: number;
  daily_fat_target: number;
  streak_days: number;
  created_at?: string;
  updated_at?: string;
}

export interface MicronutrientsData {
  vitamin_c_mg?: number;
  iron_mg?: number;
  calcium_mg?: number;
  fiber_g?: number;
}

export interface DetectedFoodItem {
  name: string;
  category?: string;
  estimated_grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micros?: Record<string, any>;
}

export interface DbMealLog {
  id: string;
  user_id: string;
  dish_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micronutrients: MicronutrientsData;
  detected_items?: DetectedFoodItem[];
  image_uri?: string | null;
  source: 'ai_scan' | 'manual' | 'preset';
  logged_at: string;
  created_at?: string;
  sync_status?: SyncStatus;
}

export interface UserSession {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
      name?: string;
      picture?: string;
    };
  };
  access_token: string;
}

