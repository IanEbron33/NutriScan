# NutriScan Project Memory & Current Progress

## 1. Project Overview & Environment
- **Framework**: Expo SDK 54 (`~54.0.37`), React Native 0.81.5, React 19.1.0 (`newArchEnabled: true`)
- **App Name**: NutriScan
- **Android Package**: `com.nutriscan.app`
- **EAS Project ID**: `2fb438cf-c5b0-42c3-b0be-202024508f8a`
- **Keystore**: `@ianvincent__nutriscan.jks`

## 2. Authentication & Supabase Configuration
- **Supabase URL**: Configured in `.env` (`EXPO_PUBLIC_SUPABASE_URL`)
- **Google Cloud Platform OAuth**:
  - **Android Client ID**: Configured in `.env` (`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`)
  - **Web Client ID**: Configured in `.env` (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`)
  - **Client Secret**: Stored securely in Google Cloud Console & backend secrets (never in git)

## 3. Selected AI Food Analysis Architecture (Decided)
- **Selected Strategy**: **Option 2 (Supabase Edge Function Proxy for Gemini Flash)**
  - **Rationale**: Replaces sleeping container cold starts (Hugging Face free spaces) with low-latency (<1.5s) global Deno/Cloudflare edge execution.
  - **Security**: Keeps `GEMINI_API_KEY` 100% secret inside Supabase Secrets (never exposed in the client-side APK).
  - **Function Endpoint**: `supabase functions deploy scan-food`
  - **Client-Side Image Pre-Processing**: Expo Image Manipulator compresses dish photos to 1080p JPEG (`quality: 0.7`) before uploading to the Supabase Edge Function.

## 4. Current Milestone Status
- **Phase 1 (Authentication & Onboarding)**:
  - Simplified 1-Tap Google Login UI implemented with official 4-color Google "G" vector SVG.
  - Ambient warm glowing background accents (`#FFE2D1`, `#FDECD2`) matching `DESIGN.md`.
  - Pure Lucide SVG vector components (`LucideIcons.tsx`) without emoji icons.
  - Aligned dependencies to Expo SDK 54 (`react-native-svg@15.12.1`, `expo-auth-session@~7.0.11`, `react-native-safe-area-context@~5.6.0`).
- **Next Phase**: Phase 2 (Expo Camera Food Scanner Viewfinder & Shutter Controls).
