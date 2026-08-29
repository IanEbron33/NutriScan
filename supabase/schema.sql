-- ==============================================================================
-- NutriScan Production Database Schema (Optimized for High-Performance Fetching)
-- ==============================================================================
-- Run this script in your Supabase Dashboard -> SQL Editor to initialize all tables,
-- covering indexes, GIN JSON indexes, views, RPC functions, and RLS policies.

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- Table 1: profiles
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    is_onboarded BOOLEAN DEFAULT FALSE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    age INTEGER,
    height_cm NUMERIC,
    weight_kg NUMERIC,
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'very_active')),
    primary_goal TEXT CHECK (primary_goal IN ('build_muscle', 'fat_loss', 'maintain', 'micronutrient')),
    daily_calorie_target INTEGER DEFAULT 2400,
    daily_protein_target INTEGER DEFAULT 120,
    daily_carbs_target INTEGER DEFAULT 250,
    daily_fat_target INTEGER DEFAULT 70,
    streak_days INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Table 2: meal_logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.meal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    dish_name TEXT NOT NULL,
    calories NUMERIC NOT NULL DEFAULT 0,
    protein_g NUMERIC NOT NULL DEFAULT 0,
    carbs_g NUMERIC NOT NULL DEFAULT 0,
    fat_g NUMERIC NOT NULL DEFAULT 0,
    micronutrients JSONB DEFAULT '{}'::jsonb,
    detected_items JSONB DEFAULT '[]'::jsonb,
    image_uri TEXT,
    source TEXT DEFAULT 'ai_scan' CHECK (source IN ('ai_scan', 'manual', 'preset')),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- High-Performance Indexes
-- ==============================================================================

-- 1. Covering B-Tree Index for Index-Only Scans (0ms Heap Disk I/O)
CREATE INDEX IF NOT EXISTS idx_meal_logs_user_logged_at_covering 
ON public.meal_logs (user_id, logged_at DESC) 
INCLUDE (dish_name, calories, protein_g, carbs_g, fat_g, source);

-- 2. GIN Index for fast JSONB querying inside Micronutrients
CREATE INDEX IF NOT EXISTS idx_meal_logs_micros_gin 
ON public.meal_logs USING GIN (micronutrients);

-- 3. GIN Index for fast JSONB querying inside Detected Items breakdown
CREATE INDEX IF NOT EXISTS idx_meal_logs_detected_items_gin 
ON public.meal_logs USING GIN (detected_items);

-- ==============================================================================
-- High-Performance Daily Aggregations View (For Trends & History)
-- ==============================================================================
CREATE OR REPLACE VIEW public.v_daily_nutrition_summary AS
SELECT 
    user_id,
    date_trunc('day', logged_at)::date AS log_date,
    COUNT(id) AS meals_count,
    ROUND(SUM(calories), 0) AS total_calories,
    ROUND(SUM(protein_g), 1) AS total_protein,
    ROUND(SUM(carbs_g), 1) AS total_carbs,
    ROUND(SUM(fat_g), 1) AS total_fat
FROM public.meal_logs
GROUP BY user_id, date_trunc('day', logged_at)::date;

-- ==============================================================================
-- Single-Roundtrip Bootstrap RPC Function (Instant App Launch)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_daily_dashboard(p_date TIMESTAMPTZ DEFAULT NOW())
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_start_of_day TIMESTAMPTZ := date_trunc('day', p_date);
    v_end_of_day TIMESTAMPTZ := v_start_of_day + INTERVAL '1 day' - INTERVAL '1 millisecond';
    v_result JSON;
BEGIN
    SELECT json_build_object(
        'profile', (
            SELECT row_to_json(p) 
            FROM public.profiles p 
            WHERE p.id = v_user_id
        ),
        'summary', (
            SELECT json_build_object(
                'total_calories', COALESCE(SUM(calories), 0),
                'total_protein_g', COALESCE(SUM(protein_g), 0),
                'total_carbs_g', COALESCE(SUM(carbs_g), 0),
                'total_fat_g', COALESCE(SUM(fat_g), 0),
                'meal_count', COUNT(*)
            )
            FROM public.meal_logs
            WHERE user_id = v_user_id 
              AND logged_at >= v_start_of_day 
              AND logged_at <= v_end_of_day
        ),
        'meals', COALESCE((
            SELECT json_agg(m ORDER BY m.logged_at DESC)
            FROM public.meal_logs m
            WHERE m.user_id = v_user_id 
              AND m.logged_at >= v_start_of_day 
              AND m.logged_at <= v_end_of_day
        ), '[]'::json)
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- Row Level Security (RLS)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile" 
ON public.profiles FOR DELETE 
USING (auth.uid() = id);

-- Meal Logs Policies
DROP POLICY IF EXISTS "Users can view their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can view their own meal logs" 
ON public.meal_logs FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can insert their own meal logs" 
ON public.meal_logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can update their own meal logs" 
ON public.meal_logs FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can delete their own meal logs" 
ON public.meal_logs FOR DELETE 
USING (auth.uid() = user_id);

-- ==============================================================================
-- Triggers: Auto-create Profile & Auto-update Timestamps
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, is_onboarded)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
