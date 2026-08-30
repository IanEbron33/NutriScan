# NutriScan Project Memory & Current Progress

## 1. Project Overview & Environment
- **Framework**: Expo SDK 54 (`~54.0.37`), React Native 0.81.5, React 19.1.0 (`newArchEnabled: true`)
- **Key Dependencies**: `expo-camera` (`~17.0.10`), `expo-image-picker` (`~17.0.11`), `expo-image-manipulator` (`~14.0.8`), `@react-native-google-signin/google-signin` (`^13.1.0`), `@supabase/supabase-js` (`^2.49.1`), `lucide-react-native` (`^1.33.0`), `react-native-svg` (`15.12.1`), `expo-sqlite` (`~15.1.2`).
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

## 3. AI Food Scanner & Vision Engine
- **Vision Engine**: Google Gemini Flash-Lite Vision API (`gemini-2.5-flash-lite` / `gemini-2.0-flash`).
- **API Key**: Configured in `.env` (`EXPO_PUBLIC_GEMINI_API_KEY` & `GEMINI_API_KEY`).
- **Supabase Edge Function**: `supabase/functions/scan-food/index.ts` with latency benchmark timer.
- **Embedded Viewfinder**: Expo SDK 54 `CameraView` with real-time 60fps in-app preview, torch/flash toggle, transparent reticle frame, and direct in-app snapshot capture (`takePictureAsync`).
- **Client-Side Image Optimization**: `expo-image-manipulator` resizes photos to max 1080p with 70% JPEG compression before upload, cutting payload sizes by ~80% for sub-second responses.
- **AI Scanner Context Notes**:
  - `MealContextNoteModal.tsx`: Slide-up sheet allowing users to attach preparation notes, protein shake grams, or portion details prior to AI analysis.
  - 42x42 compact note trigger button + active indicator badge in `ScannerScreen.tsx`.
  - Injected as authoritative grounding constraints into Gemini prompt.
- **Dual Action Result Workflow**:
  - **"Add to Daily Tracker"** (`#FF5B00`): Commits calories & macros to today's intake and updates the Dashboard in real time.
  - **"Just Checking (Dismiss)"** (`#FFF0E6`): Inspects nutrition facts without touching the daily calorie budget.

## 4. Completed Milestones
- **Phase 1 (Authentication & Mandatory Onboarding Wizard)**:
  - 1-Tap Google Login UI with official 4-color Google vector SVG.
  - 3-Step Guided Wizard (Profile ➔ Goals ➔ Targets) with Mifflin-St Jeor TDEE & macro formula.
  - Scrollable Age Wheel Picker Modal (`ScrollWheelPickerModal.tsx`).
  - 60fps directional slide & fade wizard transitions with animated progress bar.
  - Official Lucide `MuscleFlex` SVG vector icon for *"Build Muscle & Mass"*.
- **Phase 2 (Live Animated Dashboard Screen)**:
  - Top app bar + dynamic 24h streak badge in header (`🔥 X Days`).
  - 100% solid circular calorie gauge with animated progress arc.
  - Animated Daily Macros Card (Protein `#E54D42`, Carbs `#F39C12`, Fats `#8B5A2B`).
  - Horizontal Micronutrients Snapshot (Vitamin C, Iron, Calcium).
  - 5-Tab floating bottom navigation bar with raised center `#FF5B00` camera button.
- **Phase 3 (Offline-First SQLite Sync & 24-Hour Streak Engine)**:
  - **30-Day Offline SQLite Sync (`nutritionService.ts` & `localDatabase.ts`)**: Background pull of past 30 days of meals from Supabase with SQLite upserting (past days like Aug 29 load instantly offline).
  - **ISO Timestamps**: Preserved strict ISO-8601 strings across `NutritionContext.tsx` and `MealDetailsModal.tsx` eliminating "Invalid Date" errors.
  - **24-Hour Calendar Streak Engine (`calculateLocalStreak`)**: Accurately counts consecutive active calendar days with a 24-hour grace period and resets to 0 upon missed days.
  - **Diary Skeleton Loading (`DiaryTab.tsx`)**: Themed pulsing placeholder cards during date transitions.
- **Phase 4 (Meta-Style Clean Profile & Dedicated Sub-Screens)**:
  - **Main Profile Tab (`ProfileTab.tsx`)**: Option C grouped inset cards with clean single-line rows, compact 13.5px typography, user identity card, and 110px bottom tab clearance.
  - **Daily Goals Sub-Screen (`DailyGoalsSubScreen.tsx`)**: Dedicated drill-down view with `MuscleFlex` bicep icon, 100% symmetric 2x2 goal grid, concise 1-line subtitle, and 120px bottom scroll clearance.
  - **App Settings Sub-Screen (`AppSettingsSubScreen.tsx`)**: Metric/Imperial units toggle, meal reminder notifications with zero switch clipping, and **Snap-to-Center Scroll Wheel Time Picker** (`ITEM_HEIGHT = 40`, center highlight band, automatic selection on scroll).
- **Phase 5 (Custom Modals & Horizon Meal Cards)**:
  - **Modern Horizon Meal Cards (Home & Diary)**: Dish title, calorie number, time subline, pastel macro pills (`#FFECEB`, `#FEF6E9`, `#F5EFEA`), and chevron.
  - **Interactive Full Meal Details Modal (`MealDetailsModal.tsx`)**: Large photo banner, macro breakdown bar, detected food items, micronutrients grid.
  - **Custom NutriScan Dialogs (`CustomConfirmModal.tsx`)**: Warm confirmation dialogs replacing OS alert popups for meal deletion, resetting intake, and signing out.

## 5. Next Recommended Milestones
- **Phase 6**: Barcode & Nutrition Label UPC scanner.
- **Phase 7**: Weekly / Monthly Nutrition Insights & Trends Charts.
- **Phase 8**: Custom Water Intake Tracker widget.
