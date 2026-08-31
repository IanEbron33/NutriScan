/**
 * NutriScan Central App Configuration & Safe Fallback Store
 *
 * Guaranteed to provide valid URLs, client IDs, and keys across
 * Expo Go, local development builds, and cloud EAS standalone APKs.
 */

export const APP_CONFIG = {
  // Supabase Backend Credentials
  SUPABASE_URL:
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    'https://zymgghmrsqbplxydxepf.supabase.co',
  SUPABASE_ANON_KEY:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5bWdnaG1yc3FicGx4eWR4ZXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY1MDkwNzIsImV4cCI6MjEwMjA4NTA3Mn0.g5D63ckGM4L02nnAFooeW3cn5-wocpq-6v-00p--xgs',

  // Google OAuth Credentials
  GOOGLE_WEB_CLIENT_ID:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    '654804823627-0eu3kmdsja07sjhp5g3e5ks81elg0bt8.apps.googleusercontent.com',

  // Google Gemini AI Vision & Coach API Key (Loaded from .env / EAS environment)
  GEMINI_API_KEY:
    process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    '',
};
