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
        error: "GEMINI_API_KEY secret is not configured in Supabase Edge Function environment. Please configure it in your Supabase project settings or via CLI.",
        latency_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { images, imageBase64, imageMimeType = "image/jpeg" } = body;

    // Collect all valid image parts (supports 1 to 3 photos)
    let imageParts = [];

    if (Array.isArray(images) && images.length > 0) {
      imageParts = images
        .filter((img: any) => img && (img.base64 || img.data))
        .map((img: any) => ({
          inline_data: {
            mime_type: img.mimeType || img.mime_type || "image/jpeg",
            data: (img.base64 || img.data).replace(/^data:image\/[a-z]+;base64,/, ""),
          },
        }));
    } else if (imageBase64) {
      imageParts = [
        {
          inline_data: {
            mime_type: imageMimeType,
            data: imageBase64.replace(/^data:image\/[a-z]+;base64,/, ""),
          },
        },
      ];
    }

    if (imageParts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing image data in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `You are NutriScan AI, an expert clinical nutritionist and food vision model.
Analyze the provided food image(s) (${imageParts.length} angle/perspective photo(s) of the meal).
Carefully detect and examine ALL visible dishes, sides, multiple items on the plate or table, eggs, beverages/shakes, condiments, and portion sizes across all photos to calculate accurate, clinical nutrition.

Return a structured JSON object strictly matching this schema:
{
  "dish_name": "Accurate, descriptive meal title listing all main components (e.g. Pancit Bihon with 3 Boiled Eggs & Chocolate Shake)",
  "calories": integer estimated total calories of the complete meal,
  "protein_g": integer total grams of protein,
  "carbs_g": integer total grams of carbohydrates,
  "fat_g": integer total grams of healthy/total fat,
  "detected_items": [
    {
      "name": "Specific name of item 1 (e.g. Pancit Bihon Noodles with Chicken)",
      "portion": "Estimated portion/count (e.g. 1 plate ~250g)",
      "calories": integer calories,
      "protein_g": integer grams,
      "carbs_g": integer grams,
      "fat_g": integer grams
    },
    {
      "name": "Specific name of item 2 (e.g. Hard Boiled Eggs)",
      "portion": "Estimated portion/count (e.g. 3 whole eggs ~150g)",
      "calories": integer calories,
      "protein_g": integer grams,
      "carbs_g": integer grams,
      "fat_g": integer grams
    }
  ],
  "micronutrients": {
    "potassium_mg": estimated mg or 0,
    "fiber_g": estimated grams or 0,
    "vitamin_c_mg": estimated mg or 0,
    "vitamin_b6_mg": estimated mg or 0,
    "magnesium_mg": estimated mg or 0,
    "iron_mg": estimated mg or 0,
    "calcium_mg": estimated mg or 0
  },
  "health_insight": "One punchy 1-sentence nutritional highlight based on the detected items",
  "confidence_score": 0.96
}
Return ONLY valid JSON with no markdown backticks or explanation.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              ...imageParts,
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      throw new Error(`Gemini 3.5 Flash Lite API returned status ${response.status}: ${errData}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const cleanJson = text ? JSON.parse(text.replace(/```json|```/g, "").trim()) : null;

    const latencyMs = Date.now() - startTime;

    if (!cleanJson || !cleanJson.dish_name) {
      throw new Error("Failed to parse Gemini 3.5 Flash Lite response as valid food analysis JSON");
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
