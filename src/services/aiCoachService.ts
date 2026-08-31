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
      potassium_mg?: number;
      fiber_g?: number;
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

// Active Gemini Model
const GEMINI_MODEL = 'gemini-3.5-flash-lite';

/**
 * Builds a strict multi-turn contents payload starting with user turn and alternating roles
 */
const buildSanitizedContents = (
  userPrompt: string,
  history: ChatMessage[]
): { role: 'user' | 'model'; parts: { text: string }[] }[] => {
  const validHistory = history.filter((m) => m.text && m.text.trim().length > 0);
  const firstUserIdx = validHistory.findIndex((m) => m.sender === 'user');
  const relevantHistory = firstUserIdx !== -1 ? validHistory.slice(firstUserIdx) : [];

  const turns: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  for (const msg of relevantHistory.slice(-8)) {
    const role: 'user' | 'model' = msg.sender === 'user' ? 'user' : 'model';
    if (turns.length === 0) {
      if (role === 'user') {
        turns.push({ role: 'user', parts: [{ text: msg.text }] });
      }
    } else {
      const prevTurn = turns[turns.length - 1];
      if (prevTurn.role !== role) {
        turns.push({ role, parts: [{ text: msg.text }] });
      } else {
        prevTurn.parts[0].text += `\n${msg.text}`;
      }
    }
  }

  if (turns.length > 0 && turns[turns.length - 1].role === 'user') {
    turns[turns.length - 1].parts[0].text += `\n${userPrompt}`;
  } else {
    turns.push({ role: 'user', parts: [{ text: userPrompt }] });
  }

  return turns;
};

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
    ? loggedMeals
        .map(
          (m) =>
            `- ${m.dish_name}: ${m.calories} kcal (${m.protein_g}g Protein, ${m.carbs_g}g Carbs, ${m.fat_g}g Fat)`
        )
        .join('\n')
    : 'No meals logged yet today.';

  const systemInstruction = `You are NutriScan AI Coach, a world-class, encouraging, science-backed personal nutritionist.
You give direct, brief, friendly nutrition advice tailored specifically to the user's daily goals and today's intake.

USER PROFILE & REAL-TIME INTAKE:
- Name: ${profile?.full_name || 'User'}
- Fitness Goal: ${goal}
- Daily Targets: ${calorieTarget} kcal | ${proteinTarget}g Protein | ${carbsTarget}g Carbs | ${fatTarget}g Fat
- Consumed Today: ${todayCalories} kcal | ${todayProtein}g Protein | ${todayCarbs}g Carbs | ${todayFat}g Fat
- Remaining Budget: ${remainingCals} kcal | ${remainingProt}g Protein | ${remainingCarbs}g Carbs | ${remainingFat}g Fat
- Meals Eaten Today:
${mealSummary}

CRITICAL RULES:
1. STRICT BREVITY: Keep all answers very short, concise, and punchy (max 2 to 4 sentences or 2 to 3 bullet points). Do not write long paragraphs or walls of text.
2. SPARING BOLDING: Only use **bold** on significant individual keywords or numbers (e.g. **25g protein**, **hydration**, **spinach**). NEVER bold entire sentences, whole headers, or entire lines.
3. ZERO EMOJIS: Do not use emojis anywhere in your response.
4. NO UNSOLICITED FOOD RECOMMENDATIONS: Do NOT recommend a specific dish or include a JSON meal block UNLESS the user explicitly asks for food ideas, meal suggestions, recipes, or what to eat. If the user asks a general question, macro review, or fitness inquiry, answer directly without proposing food items or JSON.
5. EXPLICIT FOOD RECOMMENDATION JSON: ONLY when the user explicitly asks for a meal or snack suggestion/recipe, append a JSON block at the very end formatted EXACTLY like this:
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
If the user did not explicitly ask for a food recommendation, do NOT include the JSON block.`;

  // 1. Primary Direct Gemini API Call (gemini-3.5-flash-lite)
  if (GEMINI_DIRECT_API_KEY) {
    const contents = buildSanitizedContents(userPrompt, history);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_DIRECT_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_DIRECT_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents,
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 1000,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (rawText.trim().length > 0) {
          return parseCoachResponse(rawText);
        }
      } else {
        const errText = await response.text();
        console.warn(`[AICoach] ${GEMINI_MODEL} returned status ${response.status}:`, errText);
      }
    } catch (modelErr) {
      console.warn(`[AICoach] Error calling ${GEMINI_MODEL}:`, modelErr);
    }
  }

  // 2. Supabase Edge Function Fallback
  try {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('ask-coach', {
      body: {
        userPrompt,
        context: {
          profile,
          todayCalories,
          todayProtein,
          todayCarbs,
          todayFat,
          loggedMeals,
          calorieTarget,
          proteinTarget,
          remainingCals,
          remainingProt,
        },
      },
    });

    if (!edgeError && edgeData?.reply) {
      return parseCoachResponse(edgeData.reply);
    }
  } catch (edgeErr) {
    console.warn('[AICoach] Edge function call failed:', edgeErr);
  }

  // 3. Fallback when network is completely offline
  return {
    reply: `I'm having trouble connecting to the AI nutrition service right now. Please check your internet connection and verify that your Gemini API key is configured. In the meantime, you have ${remainingCals} kcal and ${remainingProt}g protein remaining today.`,
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
      const parsed = JSON.parse(jsonMatch[1].trim());
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
