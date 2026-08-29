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

## 3. AI Food Scanner Architecture
- **Vision Engine**: Google Gemini Flash-Lite Vision API (`gemini-2.5-flash-lite` / `gemini-2.0-flash`).
- **API Key**: Configured in `.env` (`EXPO_PUBLIC_GEMINI_API_KEY` & `GEMINI_API_KEY`).
- **Supabase Edge Function**: `supabase/functions/scan-food/index.ts` with latency benchmark timer.
- **Embedded Viewfinder**: Expo SDK 54 `CameraView` with real-time 60fps in-app preview, torch/flash toggle, transparent reticle frame, and direct in-app snapshot capture (`takePictureAsync`).
- **Client-Side Image Optimization**: `expo-image-manipulator` resizes photos to max 1080p with 70% JPEG compression before upload, cutting payload sizes by ~80% for sub-second responses.
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
  - Top app bar + streak badge in header (`🔥 12 Days`).
  - 100% solid, smooth, unbroken circular calorie gauge with animated progress arc (`#8B4513`).
  - Animated Daily Macros Card (Protein `#E54D42`, Carbs `#F39C12`, Fats `#8B5A2B`).
  - Horizontal Micronutrients Snapshot (Vitamin C, Iron, Calcium).
  - 5-Tab floating bottom navigation bar with raised center `#FF5B00` camera button.
- **Phase 3 (AI Food Scanner & Result Sheet UX Upgrades)**:
  - Full-bleed `CameraView` embedded under transparent dashed reticle frame.
  - 3-slot capture dock supporting multi-angle plate photos with delete actions.
  - White floating bottom loading card with 360° rotating dashed radar ring.
  - Segmented Nutrition Result Modal (`NutritionResultModal.tsx`) with multi-segment SVG donut chart.
  - Manual entry form with color-coded macro cards and leading Lucide icons.
- **Phase 4 (Food Diary, AI Coach, Profile & Custom Modals Architecture)**:
  - **Diary Tab (`DiaryTab.tsx`)**:
    - Month header with `< Month Year >` indicator and centered 14-day horizontal date strip capsules (`52x70`) with auto-scroll to today.
    - Option A Calories Consumed card with hero calorie counter, horizontal progress bar, and 3 stacked macro cards.
  - **AI Nutrition Coach Tab (`AiCoachTab.tsx`)**:
    - Native `Keyboard.addListener` tracking exact `keyboardHeight` + 36px clearance above Android keyboard and bottom navigation.
    - Compact typography (`12.5px`), dynamic conversation context with user's remaining macros, instant preset food logging.
  - **Profile & Settings Tab (`ProfileTab.tsx`)**:
    - Full email display, removed verified green pill and offline sync box.
    - Customizable meal reminder times (Breakfast, Lunch, Dinner) with interactive Time Picker Modal.
    - Units selector (`Metric` vs `Imperial`) and clean Sign Out list row item.
  - **Modern Horizon Meal Cards (Home & Diary)**:
    - Clean 2-row information hierarchy: Dish title + Calorie count on top row, timestamp sub-line, pastel macro pills (`#FFECEB` Protein, `#FEF6E9` Carbs, `#F5EFEA` Fat) + navigation chevron on bottom row.
  - **Interactive Full Meal Details Modal (`MealDetailsModal.tsx`)**:
    - Slide-up bottom sheet with large photo banner, energy value callout, 3-part macro distribution bar, detected components itemization, and "Micronutrients Breakdown" grid.
    - High-visibility circular orange `X` close button (`#FFF0E6` background).
  - **Custom NutriScan Dialogs (`CustomConfirmModal.tsx`)**:
    - Bespoke warm confirmation dialog replacing all generic gray OS `Alert.alert` system popups across the app (meal deletion, resetting intake tracker, and signing out).
  - **Streamlined Home Header (`DashboardScreen.tsx`)**:
    - Removed greeting text, integrated streak badge (`🔥 12 Days`) directly into the top navigation header.

## 5. Next Recommended Milestones
- **Phase 5**: Barcode & Nutrition Label UPC scanner.
- **Phase 6**: Weekly / Monthly Nutrition Insights & Trends Charts.
- **Phase 7**: Custom Water Intake Tracker widget.
