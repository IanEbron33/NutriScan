export type PrimaryGoal = 'build_muscle' | 'fat_loss' | 'maintain' | 'micronutrient';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type Gender = 'male' | 'female' | 'other';

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
