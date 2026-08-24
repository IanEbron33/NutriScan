# Phase 5: End-to-End Integration & Polish Specification (`PHASE5_INTEGRATION_TESTING.md`)

## 1. Purpose
Integrate all 4 individual modules (Scanner -> Go Backend Proxy -> Gemini Vision AI -> Analysis UI -> Supabase DB -> Dashboard) into a cohesive, fully functioning rapid prototype.

## 2. Integration Checklist
- [ ] **Camera to Backend**: Image taken on Expo app is compressed & transmitted as Base64 to `POST http://localhost:8080/api/v1/analyze`.
- [ ] **AI Vision Response**: Gemini 3.5 Flash correctly identifies dish components, weights, macros, and micros in JSON format.
- [ ] **Interactive Adjustments**: Weight slider changes recalculate totals on the Expo app without lag.
- [ ] **Database Persistence**: Clicking "Confirm & Log Meal" saves the record in Supabase `meals` and `meal_items` tables.
- [ ] **Dashboard Live Refresh**: Returning to Dashboard immediately reflects the newly added calories and macros.
- [ ] **Offline / Mock Mode**: Provide fallback mock data option if API keys are missing or offline during demo.

## 3. Verification & Demo Readiness
1. Run Go proxy server: `go run cmd/api/main.go`.
2. Launch Expo app: `npx expo start`.
3. Perform complete walkthrough scan -> edit -> log -> view dashboard.
