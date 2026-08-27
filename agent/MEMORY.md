# NutriScan Project Memory & Current Progress

## 1. Project Overview & Environment
- **Framework**: Expo SDK 54 (`~54.0.37`), React Native 0.81.5, React 19.1.0 (`newArchEnabled: true`)
- **Key Dependencies**: `expo-camera` (`~17.0.10`), `expo-image-picker` (`~17.0.11`), `expo-image-manipulator` (`~14.0.8`), `@react-native-google-signin/google-signin` (`^13.1.0`), `@supabase/supabase-js` (`^2.49.1`), `lucide-react-native` (`^1.33.0`), `react-native-svg` (`15.12.1`).
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
  - Top app bar + personalized greeting + vector `Flame` streak badge.
  - 100% solid, smooth, unbroken circular calorie gauge with animated progress arc (`#8B4513`).
  - Animated Daily Macros Card (Protein `#E54D42`, Carbs `#F39C12`, Fats `#8B5A2B`).
  - Horizontal Micronutrients Snapshot (Vitamin C, Iron, Calcium).
  - 5-Tab floating bottom navigation bar with raised center `#FF5B00` camera button.
- **Phase 3 (AI Food Scanner & Result Sheet UX Upgrades)**:
  - **Embedded Live Camera Stream & Multi-Slot Dock**:
    - Full-bleed `CameraView` embedded under the transparent dashed reticle frame.
    - Completely eliminated hardcoded/mock fallback images for 100% authentic live camera captures.
    - 3-slot capture dock supporting multi-angle plate photos with delete actions.
  - **White Floating Bottom Scanner Loading Card**:
    - Non-blocking elevated white card (`#FFFFFF`) with 360° rotating dashed AI radar ring, cycling Lucide icons, dynamic step ticker, and 3-step progress bar.
    - Removed redundant `"NUTRISCAN AI VISION"` badge.
  - **Segmented Nutrition Result Modal (`NutritionResultModal.tsx`)**:
    - Smooth animated sliding capsule tab switcher with spring dampening physics (no icons on switcher pills).
    - **Circular SVG Donut Chart**: Multi-segment SVG donut gauge (`106×106px`) for macro distribution with vertical stacked legend on the right, completely resolving horizontal text clipping.
    - **Detected Items Breakdown**: Redesigned stacked meal item cards preventing title truncation on long names.
    - **Micronutrients Tab**: Clean 2-column minimalist typography cards with all icons removed.
  - **Manual Entry Form Overhaul**:
    - Resolved `PROTEIN (G)` line wrapping bug that previously caused jagged vertical misalignment across macro inputs.
    - 3 horizontally aligned, color-coded macro mini-cards (🔴 Protein, 🟡 Carbs, 🟤 Fats) with `"g"` unit tags.
    - Added leading Lucide icon containers for Meal / Dish Name (`UtensilsCrossed`) and Calories (`Flame`).
    - Cleaned up top bar mode pill (`Multi-Item Plate`) by removing the misleading dropdown chevron.
  - **Full-Bleed Centered App Icon Assets**:
    - Converted custom brand icon into 1024×1024 full-bleed PNGs (`icon.png`, `adaptive-icon.png`, `splash-icon.png`, `favicon.png`).
    - Centered emblem at `(512, 512)` with balanced margins for all Android adaptive launcher shapes.

## 5. Next Recommended Milestones
- **Phase 4**: "Today's Meals" Timeline & Diary History on the Dashboard.
- **Phase 5**: Barcode & Nutrition Label UPC scanner.
- **Phase 6**: Weekly / Monthly Nutrition Insights & Trends Charts.
