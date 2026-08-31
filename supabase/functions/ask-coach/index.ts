// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({
        error: "GEMINI_API_KEY secret is not configured in Supabase Edge Function environment.",
        latency_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { userPrompt, context } = body;

    const {
      profile,
      todayCalories = 0,
      todayProtein = 0,
      todayCarbs = 0,
      todayFat = 0,
      calorieTarget = 2400,
      proteinTarget = 120,
      carbsTarget = 250,
      fatTarget = 70,
      remainingCals = 2400,
      remainingProt = 120,
      loggedMeals = [],
    } = context || {};

    const goal = profile?.primary_goal || "maintain";
    const mealSummary = loggedMeals.length > 0
      ? loggedMeals
          .map((m: any) => `- ${m.dish_name}: ${m.calories} kcal (${m.protein_g}g Protein, ${m.carbs_g}g Carbs, ${m.fat_g}g Fat)`)
          .join("\n")
      : "No meals logged yet today.";

    const systemInstruction = `You are NutriScan AI Coach, a world-class, encouraging, science-backed personal nutritionist.
You give direct, brief, friendly nutrition advice tailored specifically to the user's daily goals and today's intake.

USER PROFILE & REAL-TIME INTAKE:
- Name: ${profile?.full_name || "User"}
- Fitness Goal: ${goal}
- Daily Targets: ${calorieTarget} kcal | ${proteinTarget}g Protein | ${carbsTarget}g Carbs | ${fatTarget}g Fat
- Consumed Today: ${todayCalories} kcal | ${todayProtein}g Protein | ${todayCarbs}g Carbs | ${todayFat}g Fat
- Remaining Budget: ${remainingCals} kcal | ${remainingProt}g Protein
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

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`Gemini 3.5 Flash Lite API returned status ${response.status}: ${errData}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const latencyMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        reply: rawText,
        latency_ms: latencyMs,
        source: "edge_function",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to process AI coach request",
        latency_ms: latencyMs,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
