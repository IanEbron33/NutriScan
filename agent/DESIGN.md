# NutriScan UI/UX Design System (`DESIGN.md`)

This document defines the comprehensive UI design system, visual style guidelines, component specs, typography, and screen layouts for **NutriScan**, aligned with the production mobile application.

---

## 1. Core Color Palette & Tokens

| Semantic Role | Color Name | Hex Code | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | Warm Orange | `#FF5B00` / `#FF6B00` | Main CTA buttons, active tab indicators, camera shutter ring, brand accents. |
| **App Background** | Cream Warm Off-White | `#FAF6F0` / `#FFF8F5` | Primary screen background canvas. |
| **Ambient Glow 1** | Soft Peach Glow | `#FFE2D1` | Top-right ambient background depth circle (opacity: 0.65). |
| **Ambient Glow 2** | Warm Amber Glow | `#FDECD2` | Bottom-left ambient background depth circle (opacity: 0.55). |
| **Card Background** | Pure White / Peach Tint | `#FFFFFF` / `#FFF0E6` | Surface containers, feature cards, ingredient rows. |
| **Card Border** | Muted Warm Cream | `#EFE7DF` / `#F0E5DC` | 1.5px borders on all elevated cards and pills. |
| **Heading & Titles** | Dark Chocolate | `#2A1810` / `#1C130D` | Primary screen titles, dish names, numerical macro values. |
| **Subtext & Body** | Muted Warm Gray | `#7D6E66` / `#8C7B73` | Subtitles, descriptive text, unit labels (`g`, `kcal`). |
| **Protein Metric** | Warm Coral Red | `#E54D42` | Protein progress bar & macro indicator (`42g Protein`). |
| **Carbs Metric** | Vivid Warm Amber | `#F39C12` | Carbohydrate progress bar & macro indicator (`38g Carbs`). |
| **Fats Metric** | Dark Brown | `#8B5A2B` | Fat progress bar & macro indicator (`18g Fat`). |
| **Micro / Success** | Soft Forest Green | `#2E7D32` (`#E8F5E9` bg) | Optimal micronutrients, trust badges, streaks. |
| **Alert / Warning** | Crimson Red | `#C62828` (`#FFEBEE` bg) | Error alerts, micronutrients needing boost. |

---

## 2. Typography System: **Fredoka**

The app uses **Fredoka** as the core rounded, friendly, and modern typeface.

| Style Role | Font Weight | Token Name | Size | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | Bold (700) | `Fredoka_700Bold` | `28px` | `34px` | Screen main headings (`Welcome to NutriScan`, `Scan Your Meal`). |
| **Section Title** | SemiBold (600) | `Fredoka_600SemiBold` | `18px` | `24px` | Card headers, dish names, modal titles. |
| **Card Title** | SemiBold (600) | `Fredoka_600SemiBold` | `15px` | `20px` | Feature titles, ingredient item labels. |
| **Body Text** | Medium (500) | `Fredoka_500Medium` | `14px` | `20px` | Descriptions, instruction text, legal disclaimers. |
| **Micro Labels** | Bold (700) | `Fredoka_700Bold` | `11px` | `14px` | Brand badge pills (`NUTRISCAN AI`), section uppercase tags (`WHAT YOU GET INSIDE`). |
| **Macro Numbers** | Bold (700) | `Fredoka_700Bold` | `24px`–`32px` | `36px` | Calorie headline numbers, macro grams. |

---

## 3. Icon System Guidelines

* **Strict Rule**: **Zero Emojis** are used as UI icons.
* **Vector Standard**: All icons are rendered as native vector SVG components via **Lucide Icons** (`src/components/ui/LucideIcons.tsx`), styled with theme stroke colors and dedicated colored background containers.
  * **Brand / Food**: `UtensilsCrossed` in `#FF5B00` with `#FFEAD9` container.
  * **AI Food Scan**: `ScanLine` in `#FF5B00` with `#FFF0E6` container.
  * **Macro Analysis**: `PieChart` in `#F39C12` with `#FEF6E9` container.
  * **Goal Intelligence**: `Target` in `#2E7D32` with `#E8F5E9` container.
  * **Streak Indicator**: `Flame` in `#FF5B00` (solid fill).
  * **Trust / Security**: `ShieldCheck` in `#2E7D32`.
  * **Camera Shutter**: `Camera` in `#FF5B00`.

---

## 4. Component & Geometry Rules

* **Border Radii**:
  * Large Cards: `22px` to `26px`
  * Buttons & Floating Pills: `30px` (Full Pill)
  * Feature Icon Boxes: `12px` to `14px`
  * Sliders & Metric Bars: `12px`
* **Card Elevation & Shadows**:
  ```javascript
  shadowColor: '#2A1810',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.04,
  shadowRadius: 10,
  elevation: 2,
  borderWidth: 1.5,
  borderColor: '#EFE7DF',
  ```

---

## 5. Screen Specifications & Layout Breakdown

### Screen 0: Auth & Onboarding (`/auth`)
* **Background**: Ambient warm glow circles (`#FFE2D1` top-right, `#FDECD2` bottom-left) on `#FAF6F0` canvas.
* **Header**: Status-bar padded hero badge with `UtensilsCrossed` icon, `NUTRISCAN AI` pill with `Sparkles`, and Fredoka Bold headline.
* **Primary Action (Top)**: Full pill **"Continue with Google"** button with official 4-color Google "G" SVG vector, followed by `[ShieldCheck] 1-Tap Instant Sign-In • No Password Needed` trust badge.
* **Feature Highlights Card (Bottom)**: Elevated card labeled `WHAT YOU GET INSIDE` with 3 items (`Instant AI Food Scan`, `Smart Macro Breakdown`, `Daily Goal Intelligence`).

---

### Screen 1: Camera Scanner Viewfinder (`/scan`)
* **Viewfinder**: Full-bleed camera feed using `expo-camera`.
* **Dashed Frame**: Dashed rounded dish bounding box centered in the upper 60% of the screen with hint `"Keep dish centered in clear light"`.
* **Shutter Controls**:
  * **Center Shutter**: Dual-ring action button (Outer `#FF5B00` ring, inner white ring, solid `#FF5B00` core).
  * **Left Action**: Photo gallery picker icon (`expo-image-picker`).
  * **Right Action**: Flash toggle (`Zap` Lucide icon).
* **Client Compression**: Compresses photos to 1080p JPEG (`quality: 0.7`) before sending to Supabase Edge Function.

---

### Screen 2: Meal Breakdown & Sliders (`/results`)
* **Dish Header**: Compressed dish photo preview with top rounded corners.
* **Ingredient Item Rows**:
  * Food title and estimated weight (`Salmon Fillet - 180g`).
  * Interactive horizontal weight slider (`50g` to `400g`) with instant macro recalculation.
* **Hidden Additives Toggle**:
  * `"Cooked with Cooking Oil?"` (`+120 kcal`, `+14g Fat`) with Warm Orange switch.
* **Total Estimated Macros**:
  * Large calorie headline (`580 kcal`) with 3 macro progress bars (`Protein`, `Carbs`, `Fat`).
* **Micronutrient Summary**:
  * Cards for `Vitamin C`, `Iron`, and `Calcium` with RDA percentage pills.
* **Primary Action**:
  * Full-width `#FF5B00` pill button: `(✓) Confirm & Log Meal`.

---

### Screen 3: Daily Dashboard (`/dashboard`)
* **Header**: User avatar, greeting in Fredoka (`Hello, Alex!`), and flame streak badge (`🔥 12 Days`).
* **Circular Calorie Gauge**:
  * Multi-segment SVG arc showing consumed vs target (`1,850 / 2,400 kcal`).
* **Daily Macros Breakdown**:
  * Progress bars for Protein (`#E54D42`), Carbs (`#F39C12`), and Fats (`#8B5A2B`).
* **Bottom Navigation**: 5-Tab bar (`Home`, `Diary`, `Scan`, `Insights`, `Profile`) with floating raised center orange camera button.
