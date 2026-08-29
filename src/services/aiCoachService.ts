import { supabase } from './supabase';
import { Profile } from '../types/database';
import { MealLog } from '../context/NutritionContext';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedMeal?: {
    dish_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    micronutrients?: {
      vitamin_c_mg?: number;
      iron_mg?: number;
      calcium_mg?: number;
    };
  };
}

interface CoachContext {
  profile: Profile | null;
  todayCalories: number;
  todayProtein: number;
  todayCarbs: number;
  todayFat: number;
  loggedMeals: MealLog[];
}

const GEMINI_DIRECT_API_KEY =
  process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  '';

/**
 * Sends conversation message to Gemini Nutrition Coach with full user context
 */
export const askNutritionCoach = async (
  userPrompt: string,
  history: ChatMessage[],
  context: CoachContext
): Promise<{ reply: string; suggestedMeal?: ChatMessage['suggestedMeal'] }> => {
  const { profile, todayCalories, todayProtein, todayCarbs, todayFat, loggedMeals } = context;

  const calorieTarget = profile?.daily_calorie_target || 2400;
  const proteinTarget = profile?.daily_protein_target || 120;
  const carbsTarget = profile?.daily_carbs_target || 250;
  const fatTarget = profile?.daily_fat_target || 70;
  const goal = profile?.primary_goal || 'maintain';
  const remainingCals = Math.max(0, calorieTarget - todayCalories);
  const remainingProt = Math.max(0, proteinTarget - todayProtein);
  const remainingCarbs = Math.max(0, carbsTarget - todayCarbs);
  const remainingFat = Math.max(0, fatTarget - todayFat);

  const mealSummary = loggedMeals.length > 0
    ? loggedMeals.map((m) => `- ${m.dish_name}: ${m.calories} kcal (${m.protein_g}g P, ${m.carbs_g}g C, ${m.fat_g}g F)`).join('\n')
    : 'No meals logged yet today.';

  const systemInstruction = `You are NutriScan AI Coach, a world-class, encouraging, science-backed clinical and sports nutritionist.
You give direct, actionable, concise nutrition advice tailored specifically to the user's daily goals and today's intake.

USER PROFILE & CONTEXT:
- Fitness Goal: ${goal}
- Target: ${calorieTarget} kcal | ${proteinTarget}g Protein | ${carbsTarget}g Carbs | ${fatTarget}g Fat
- Consumed Today: ${todayCalories} kcal | ${todayProtein}g Protein | ${todayCarbs}g Carbs | ${todayFat}g Fat
- Remaining Today: ${remainingCals} kcal | ${remainingProt}g Protein | ${remainingCarbs}g Carbs | ${remainingFat}g Fat
- Meals Eaten Today:
${mealSummary}

RULES:
1. Keep answers concise, clear, and easy to read on mobile screens (bullet points, short paragraphs).
2. NEVER use emojis as icons. Maintain a clean, professional, warm tone.
3. If recommending a specific meal or snack that the user can eat, include a JSON block at the very end formatted EXACTLY like this:
\`\`\`json
{
  "suggestedMeal": {
    "dish_name": "Name of Dish",
    "calories": 350,
    "protein_g": 28,
    "carbs_g": 35,
    "fat_g": 9,
    "micronutrients": {
      "vitamin_c_mg": 15,
      "iron_mg": 2.5,
      "calcium_mg": 120
    }
  }
}
\`\`\`
Only include the json block if you are proposing a concrete meal/snack that fits their remaining budget.`;

  // Try direct Gemini 2.5/2.0 API first
  if (GEMINI_DIRECT_API_KEY) {
    try {
      const contents = [
        ...history.slice(-6).map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }],
        })),
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_DIRECT_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return parseCoachResponse(rawText);
      }
    } catch (err) {
      console.warn('[AICoach] Direct Gemini call error, trying fallback:', err);
    }
  }

  // Fallback heuristic response if offline or API key unavailable
  return {
    reply: `Based on your remaining ${remainingCals} kcal and ${remainingProt}g protein target for today, I recommend a balanced meal high in lean protein and fiber. Consider grilled chicken breast with quinoa and steamed broccoli, or a Greek yogurt bowl with mixed seeds!`,
    suggestedMeal: {
      dish_name: 'Greek Yogurt & Mixed Berry Protein Bowl',
      calories: Math.min(remainingCals || 320, 320),
      protein_g: 26,
      carbs_g: 30,
      fat_g: 6,
      micronutrients: { vitamin_c_mg: 18, calcium_mg: 220, iron_mg: 1.2 },
    },
  };
};

/**
 * Helper to extract clean text and optional structured suggested meal JSON
 */
const parseCoachResponse = (
  rawText: string
): { reply: string; suggestedMeal?: ChatMessage['suggestedMeal'] } => {
  let cleanText = rawText;
  let suggestedMeal: ChatMessage['suggestedMeal'] | undefined;

  const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed?.suggestedMeal) {
        suggestedMeal = parsed.suggestedMeal;
        cleanText = rawText.replace(/```json\s*[\s\S]*?\s*```/, '').trim();
      }
    } catch (e) {
      console.warn('[AICoach] Failed to parse suggested meal json:', e);
    }
  }

  return { reply: cleanText, suggestedMeal };
};
