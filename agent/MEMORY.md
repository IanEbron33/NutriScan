# NutriScan Project Memory & Current Progress

## 1. Project Overview & Environment
- **Framework**: Expo SDK 54 (`~54.0.37`), React Native 0.81.5, React 19.1.0 (`newArchEnabled: true`)
- **App Name**: NutriScan
- **Android Package**: `com.nutriscan.app`
- **EAS Project ID**: `2fb438cf-c5b0-42c3-b0be-202024508f8a`
- **Keystore**: `@ianvincent__nutriscan.jks`
- **Design Tokens**: Warm Orange (`#FF5B00`), Cream Canvas (`#FAF6F0`), Chocolate Text (`#2A1810`), Typography in Fredoka bold/semi-bold, 100% Lucide vector SVGs (zero emojis).

## 2. Authentication & Supabase Configuration
- **Supabase URL**: Configured in `.env` (`EXPO_PUBLIC_SUPABASE_URL`)
- **Google Cloud Platform OAuth**:
  - **Android Client ID**: Configured in `.env` (`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`)
  - **Web Client ID**: Configured in `.env` (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)
- **Triple-Layer Onboarding Persistence**:
  1. `supabase.auth.updateUser` (Cloud User Metadata - permanent across all devices).
  2. `expo-secure-store` (Local encrypted hardware cache - instant offline verification).
  3. `profiles` table upsert (PostgreSQL database row sync).

## 3. AI Food Scanner Architecture
- **Vision Engine**: Google Gemini Flash-Lite Vision API (`gemini-2.5-flash-lite` / `gemini-2.0-flash`).
- **API Key**: Configured in `.env` (`EXPO_PUBLIC_GEMINI_API_KEY` & `GEMINI_API_KEY`).
- **Supabase Edge Function**: `supabase/functions/scan-food/index.ts` with latency benchmark timer.
- **Client-Side Image Optimization**: `expo-image-manipulator` resizes camera/gallery photos to max 1080p with 70% JPEG compression before upload, cutting payload sizes by ~80% for sub-second responses.
- **Dual Action Result Workflow**:
  - **"Add to Daily Tracker"** (`#FF5B00`): Commits calories & macros to today's intake and updates the Dashboard in real time.
  - **"Just Checking (Dismiss)"** (`#FFF0E6`): Inspects nutrition facts (menu browsing/recipe check) without touching the daily calorie budget.

## 4. Completed Milestones
- **Phase 1 (Authentication & Mandatory Onboarding Wizard)**:
  - 1-Tap Google Login UI with official 4-color Google vector SVG.
  - 3-Step Guided Wizard (Profile ➔ Goals ➔ Targets) with Mifflin-St Jeor TDEE & macro formula.
  - Scrollable Age Wheel Picker Modal (`ScrollWheelPickerModal.tsx`).
  - 60fps directional slide & fade wizard transitions with animated progress bar.
  - Official Lucide `biceps-flexed` SVG vector icon for *"Build Muscle & Mass"*.
- **Phase 2 (Live Animated Dashboard Screen)**:
  - Top app bar + personalized greeting + vector `Flame` streak badge.
  - 100% solid, smooth, unbroken circular calorie gauge with animated progress arc (`#8B4513`).
  - Animated Daily Macros Card (Protein `#E54D42`, Carbs `#F39C12`, Fats `#8B5A2B`).
  - Horizontal Micronutrients Snapshot (Vitamin C, Iron, Calcium).
  - 5-Tab floating bottom navigation bar with raised center `#FF5B00` camera button.
- **Phase 3 (AI Food Scanner & Dual-Mode Intake Tracker)**:
  - Dual-mode scanner screen (`ScannerScreen.tsx`): AI Camera capture + Photo Gallery upload + Quick test dish presets + Manual gram input.
  - Nutrition Result Sheet (`NutritionResultModal.tsx`) with latency benchmark badge (`⚡ ~500ms`).
  - Real-time `NutritionContext` syncing logged meals directly to the Dashboard.

## 5. Next Recommended Milestones
- **Phase 4**: "Today's Meals" Timeline & Diary History on the Dashboard.
- **Phase 5**: Barcode & Nutrition Label UPC scanner.
- **Phase 6**: Weekly / Monthly Nutrition Insights & Trends Charts.
