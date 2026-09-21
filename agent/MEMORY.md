# NutriScan Project Memory & Current Progress

## 1. Project Overview & Environment
- **Framework**: Expo SDK 54 (`~54.0.37`), React Native 0.81.5, React 19.1.0 (`newArchEnabled: true`)
- **Key Dependencies**: `expo-camera` (`~17.0.10`), `expo-image-picker` (`~17.0.11`), `expo-image-manipulator` (`~14.0.8`), `expo-av` (`~16.0.8`), `expo-notifications` (`~0.32.17`), `@react-native-google-signin/google-signin` (`^13.1.0`), `@supabase/supabase-js` (`^2.49.1`), `lucide-react-native` (`^1.33.0`), `react-native-svg` (`15.12.1`), `expo-sqlite` (`~16.0.10`).
- **App Name**: NutriScan
- **Android Package**: `com.nutriscan.app`
- **EAS Project ID**: `2fb438cf-c5b0-42c3-b0be-202024508f8a`
- **Keystore**: `@ianvincent__nutriscan.jks`
- **Design Tokens**: Warm Orange (`#FF5B00`), Cream Canvas (`#FAF6F0`), Chocolate Text (`#2A1810`), Typography in Fredoka bold/semi-bold, 100% Lucide vector SVGs (zero emojis).

## 2. Authentication & Supabase Configuration
- **Central Configuration (`src/config/appConfig.ts`)**:
  - `SUPABASE_URL`: `https://zymgghmrsqbplxydxepf.supabase.co`
  - `SUPABASE_ANON_KEY`: Safe public anon key with hardware-backed chunked SecureStore storage adapter.
  - `GOOGLE_WEB_CLIENT_ID`: `654804823627-0eu3kmdsja07sjhp5g3e5ks81elg0bt8.apps.googleusercontent.com`
  - `GEMINI_API_KEY`: Loaded dynamically from `process.env.EXPO_PUBLIC_GEMINI_API_KEY` (stored securely in Expo Cloud Environment Variables) with zero raw keys exposed in Git.
- **Triple-Layer Onboarding Persistence**:
  1. `supabase.auth.updateUser` (Cloud User Metadata - permanent across all devices).
  2. `expo-secure-store` (Local encrypted hardware cache - instant offline verification).
  3. `profiles` table upsert (PostgreSQL database row sync).

## 3. AI Food Scanner & Vision Engine
- **Vision Engine**: Google Gemini Flash-Lite Vision API (`gemini-3.5-flash-lite` / `gemini-2.0-flash`).
- **API Key Management**: Loaded via `APP_CONFIG.GEMINI_API_KEY` through EAS Environment Variables.
- **Supabase Edge Function**: `supabase/functions/scan-food/index.ts` with latency benchmark timer.
- **Embedded Viewfinder**: Expo SDK 54 `CameraView` with real-time 60fps in-app preview, torch/flash toggle, transparent reticle frame, and direct in-app snapshot capture (`takePictureAsync`).
- **Client-Side Image Optimization**: `expo-image-manipulator` resizes photos to max 1080p with 70% JPEG compression before upload, cutting payload sizes by ~80% for sub-second responses.
- **AI Scanner Context Notes**:
  - `MealContextNoteModal.tsx`: Slide-up sheet allowing users to attach preparation notes, protein shake grams, or portion details prior to AI analysis.
  - 42x42 compact note trigger button + active indicator badge in `ScannerScreen.tsx`.
  - Injected as authoritative grounding constraints into Gemini prompt.
- **Balanced Scan Result Modal (`NutritionResultModal.tsx`)**:
  - Balanced 20px horizontal padding preventing edge-to-edge stretching.
  - Interactive Donut macro ratio chart + detected meal items cards.
  - **"Add to Daily Tracker"** (`#FF5B00`): Commits calories & macros to today's intake and plays upbeat success chime.
  - **"Just Checking (Dismiss)"** (`#FFF0E6`): Inspects nutrition facts without touching the daily calorie budget.

## 4. Audio & Notification Engine
- **Audio Feedback Engine (`expo-av`)**:
  - Guarded dynamic module loader (`getAudioModule`) inspecting `NativeModules.ExponentAV` for crash-proof APK boots across dev clients and standalone builds.
  - **`assets/sounds/meal_success.wav`**: 16-bit PCM 44.1kHz ascending 2-tone harmonic chime (E6 ➔ B6) triggered automatically via `playMealSuccessSound()` on any meal log, paired with a 40ms micro-haptic vibration.
  - **`assets/sounds/bell_chime.wav`**: 16-bit PCM crystal harmonic bell chime for meal reminder notifications and target hit milestones.
- **Target Hit Celebration Engine (`notificationService.ts` & `localDatabase.ts`)**:
  - **Sensory Feedback**: Combines the crystal bell chime (`bell_chime.wav`) with an upbeat double-pulse haptic vibration (`[0, 60, 50, 90]ms`) and a compact floating toast banner (`TargetHitToast.tsx`).
  - **Date-Stamped SQLite Persistence (`local_daily_celebrations`)**: Tracks `date_str`, `calories`, `protein`, `carbs`, `fats`.
  - **Single Daily Celebration & Startup Protection**: Silently marks targets already met upon startup so app launches never trigger duplicate celebrations. Celebrates only once per target per calendar day.
  - **Midnight Auto-Reset**: Keyed by local calendar date `YYYY-MM-DD`, resetting targets automatically every midnight with zero background cron jobs.
- **Meal Reminders & Native Push Notification Engine (`notificationService.ts`)**:
  - Safe Expo SDK 54 New Architecture (`newArchEnabled: true`) native module loader for `expo-notifications`.
  - Android notification channel `meal-reminders` configured with `AndroidImportance.MAX` for heads-up drop-down banners, vibration pattern `[0, 300, 200, 300]`, and `#FF5B00` light color.
  - Foreground notification presentation handler configured (`shouldShowBanner: true`, `shouldShowList: true`, `shouldPlaySound: true`).
  - Native offline recurring alarms scheduled via `SchedulableTriggerInputTypes.DAILY` (`hour`, `minute`, `channelId: 'meal-reminders'`).
  - Proactive runtime permission management (`checkNotificationPermissions`, `requestNotificationPermissions`) for Android 13+ (`POST_NOTIFICATIONS`).
  - **Instant Test Feature**: Interactive "Send Test Reminder" button in `AppSettingsSubScreen.tsx` for immediate verification of sounds, vibration, and banner on device.
  - Custom in-app alert modal (`MealReminderAlertModal.tsx`) as foreground fallback with 1-tap "Log Meal Now".

## 5. Dynamic Micronutrients & "View All" Sheet
- **Live Home Screen Snapshot**:
  - Vitamin C, Iron, and Calcium cards calculate real-time percentage intake vs RDA standards with progress bars and dynamic status badges (*Optimal*, *On Track*, *Needs Boost*).
- **Comprehensive Breakdown Sheet (`MicronutrientsDetailsModal.tsx`)**:
  - Built with `DraggableBottomSheet` with 88% screen height and 70px bottom scroll padding.
  - Displays complete breakdown of Vitamins (C, A, D), Minerals (Iron, Calcium, Potassium, Magnesium, Zinc), and Dietary Fiber.
  - Clean, minimal card styling with zero redundant icon boxes.

## 6. Completed Milestones
- **Phase 1 (Authentication & Mandatory Onboarding Wizard)**:
  - 1-Tap Google Login UI with official 4-color Google vector SVG.
  - 3-Step Guided Wizard (Profile ➔ Goals ➔ Targets) with Mifflin-St Jeor TDEE & macro formula.
  - Scrollable Age Wheel Picker Modal (`ScrollWheelPickerModal.tsx`).
  - 60fps directional slide & fade wizard transitions with animated progress bar.
- **Phase 2 (Live Animated Dashboard Screen)**:
  - Top app bar + dynamic 24h streak badge in header (`🔥 X Days`).
  - 100% solid circular calorie gauge with animated progress arc.
  - Animated Daily Macros Card (Protein `#E54D42`, Carbs `#F39C12`, Fats `#8B5A2B`).
  - Dynamic Horizontal Micronutrients Snapshot.
  - 5-Tab floating bottom navigation bar with raised center `#FF5B00` camera button.
- **Phase 3 (Offline-First SQLite Sync & 24-Hour Streak Engine)**:
  - **30-Day Offline SQLite Sync (`nutritionService.ts` & `localDatabase.ts`)**: Background pull of past 30 days of meals from Supabase with SQLite upserting (100% offline persistence).
  - **ISO Timestamps**: Strict ISO-8601 strings across contexts eliminating date errors.
  - **24-Hour Calendar Streak Engine (`calculateLocalStreak`)**: Accurately counts consecutive active calendar days with a 24-hour grace period.
  - **Diary Skeleton Loading (`DiaryTab.tsx`)**: Themed pulsing placeholder cards during date transitions.
- **Phase 4 (Meta-Style Clean Profile & Dedicated Sub-Screens)**:
  - **Main Profile Tab (`ProfileTab.tsx`)**: Option C grouped inset cards with clean single-line rows, compact 13.5px typography, user identity card, and 110px bottom tab clearance.
  - **Daily Goals Sub-Screen (`DailyGoalsSubScreen.tsx`)**: Dedicated drill-down view with `MuscleFlex` bicep icon, 100% symmetric 2x2 goal grid, concise 1-line subtitle.
  - **App Settings Sub-Screen (`AppSettingsSubScreen.tsx`)**: Metric/Imperial units toggle, meal reminder switches, and **Snap-to-Center Scroll Wheel Time Picker** (`ITEM_HEIGHT = 44`, center highlight band, automatic selection on scroll).
- **Phase 5 (Custom Modals & Horizon Meal Cards)**:
  - **Modern Horizon Meal Cards (Home & Diary)**: Dish title, calorie number, time subline, pastel macro pills (`#FFECEB`, `#FEF6E9`, `#F5EFEA`), and chevron.
  - **Interactive Full Meal Details Modal (`MealDetailsModal.tsx`)**: Large photo banner, macro breakdown bar, detected food items, micronutrients grid.
  - **Custom NutriScan Dialogs (`CustomConfirmModal.tsx`)**: Warm confirmation dialogs replacing OS alert popups for meal deletion, resetting intake, and signing out.
- **Phase 6 (Standalone APK Preparation & Native Audio Integration)**:
  - Full codebase audit: 100% zero default alert dialogs, zero emoji icons (all Lucide vectors), clean Metro transform AST, and complete EAS `preview` APK profile (`"buildType": "apk"`).
  - **Secure GitHub Workflow & Central Config (`src/config/appConfig.ts`)**: Removed raw API keys from git-tracked files, relying on EAS cloud environment variables and central fallback store.
  - **Custom `.easignore`**: Configured build archive rules to preserve necessary build files.
- **Phase 7 (Target Hit Daily Reset & Celebration Engine)**:
  - **SQLite Daily Celebrations Table (`local_daily_celebrations`)**: Persists daily celebrations by date string (`YYYY-MM-DD`).
  - **Startup Hydration Guard**: Automatically suppresses re-celebrations when reopening the app.
  - **Sensory Combination**: Bell chime (`bell_chime.wav`) + double-pulse vibration + compact single-line toast (`TargetHitToast.tsx`).
  - **Midnight Auto-Reset**: Resets targets automatically at midnight with no background workers needed.
  - **Visual Completion States**: Forest Green (`#2E7D32`) check badges, progress bars, and circular gauge arc transitions.
- **Phase 8 (Native Push Notifications & Meal Reminders Engine)**:
  - **Expo SDK 54 Native Architecture Compatibility**: Repaired module loader in `notificationService.ts` for React Native 0.81 New Architecture.
  - **Android Heads-Up Banners**: Configured `meal-reminders` channel with `AndroidImportance.MAX` and vibration.
  - **Proactive Permission Flow**: Automatically checks and prompts for Android 13+ `POST_NOTIFICATIONS` permission with in-app banner fallback.
  - **Instant Test Reminder Button**: Added interactive test trigger in `AppSettingsSubScreen.tsx` for immediate verification on device.

## 7. Next Recommended Milestones
- **Phase 9**: Barcode & Nutrition Label UPC scanner.
- **Phase 10**: Weekly / Monthly Nutrition Insights & Trends Charts.
- **Phase 11**: Custom Water Intake Tracker widget.

