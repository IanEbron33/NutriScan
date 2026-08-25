// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

declare const Deno: any;

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY") || "AIzaSyAwd-dKGr0PJHI7MwrNGE30bN_YRkii2SQ";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: any) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { imageBase64, imageMimeType = "image/jpeg" } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Missing imageBase64 in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are NutriScan AI, an expert clinical nutritionist. Analyze this food image and return a structured JSON object with:
{
  "dish_name": "Accurate concise dish name",
  "calories": integer estimated calories,
  "protein_g": integer grams of protein,
  "carbs_g": integer grams of carbohydrates,
  "fat_g": integer grams of healthy/total fat,
  "micronutrients": {
    "vitamin_c_mg": estimated mg or 0,
    "iron_mg": estimated mg or 0,
    "calcium_mg": estimated mg or 0,
    "fiber_g": estimated grams or 0
  },
  "health_insight": "One punchy 1-sentence nutritional highlight",
  "confidence_score": 0.95
}
Return ONLY valid JSON with no markdown backticks or explanation.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const geminiResp = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: imageMimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = await geminiResp.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = text ? JSON.parse(text.replace(/```json|```/g, "").trim()) : null;

    const latencyMs = Date.now() - startTime;

    if (!cleanJson) {
      throw new Error("Failed to parse Gemini model response as JSON");
    }

    return new Response(
      JSON.stringify({
        ...cleanJson,
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
        error: error?.message || "Failed to process food image scan",
        latency_ms: latencyMs,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
