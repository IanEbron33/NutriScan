import { supabase } from './supabase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

export interface FoodItemBreakdown {
  name: string;
  portion: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface FoodAnalysisResult {
  dish_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  detected_items?: FoodItemBreakdown[];
  micronutrients: {
    vitamin_c_mg?: number;
    iron_mg?: number;
    calcium_mg?: number;
    fiber_g?: number;
  };
  health_insight: string;
  confidence_score: number;
  image_uri?: string;
  image_uris?: string[];
  latency_ms: number;
  source: 'edge_function' | 'client_direct' | 'preset';
}

export type ImageInput = string | { uri: string; base64?: string };

/**
 * Compresses an image to 1080p max resolution and 70% JPEG quality
 * with safe dynamic loading and direct base64 preservation.
 */
export const compressImageTo1080p = async (
  input: ImageInput
): Promise<{ uri: string; base64: string }> => {
  const uri = typeof input === 'string' ? input : input.uri;
  const preloadedBase64 = typeof input === 'object' && input.base64 ? input.base64 : '';

  try {
    const ImageManipulator = require('expo-image-manipulator');
    const manipulateAsync = ImageManipulator?.manipulateAsync || ImageManipulator?.default?.manipulateAsync;
    const SaveFormat = ImageManipulator?.SaveFormat || ImageManipulator?.default?.SaveFormat;

    if (manipulateAsync) {
      const format = SaveFormat?.JPEG || 'jpeg';
      const manipulated = await manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }],
        {
          compress: 0.7,
          format: format,
          base64: true,
        }
      );
      return {
        uri: manipulated.uri,
        base64: manipulated.base64 || preloadedBase64,
      };
    }
  } catch (err) {
    console.warn('ImageManipulator notice, using existing image data:', err);
  }

  // If base64 was preloaded directly from ImagePicker
  if (preloadedBase64) {
    return { uri, base64: preloadedBase64 };
  }

  // Fallback for remote test URLs: fetch blob to base64
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    try {
      const resp = await fetch(uri);
      const blob = await resp.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          resolve(res ? res.replace(/^data:.+;base64,/, '') : '');
        };
        reader.onerror = () => resolve('');
        reader.readAsDataURL(blob);
      });
      return { uri, base64 };
    } catch {
      // ignore
    }
  }

  return { uri, base64: preloadedBase64 };
};

/**
 * Analyzes 1 to 3 multi-angle food images using Supabase Edge Function (with Supabase Secrets)
 * or Direct Gemini Vision API as client failover.
 */
export const analyzeFoodImages = async (
  images: ImageInput[]
): Promise<FoodAnalysisResult> => {
  const startTime = Date.now();

  const validInputs = images.filter((img) => {
    if (typeof img === 'string') return img.trim().length > 0;
    return img && typeof img.uri === 'string' && img.uri.trim().length > 0;
  });

  if (validInputs.length === 0) {
    throw new Error('At least 1 food image is required for analysis.');
  }

  // 1. Compress & resolve base64 for all images in parallel
  const compressedResults = await Promise.all(
    validInputs.map((input) => compressImageTo1080p(input))
  );

  const imageParts = compressedResults
    .filter((img) => img.base64 && img.base64.length > 0)
    .map((img) => ({
      inline_data: {
        mime_type: 'image/jpeg',
        data: img.base64.replace(/^data:image\/[a-z]+;base64,/, ''),
      },
    }));

  const allUris = compressedResults.map((r) => r.uri);
  const primaryImageUri = allUris[0];

  let edgeErrorMessage = '';

  // 2. Primary Engine: Supabase Edge Function (Secure Secret via Deno.env.get("GEMINI_API_KEY"))
  try {
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('scan-food', {
      body: {
        images: imageParts.map((p) => ({
          base64: p.inline_data.data,
          mimeType: p.inline_data.mime_type,
        })),
        imageBase64: imageParts[0]?.inline_data?.data,
        imageMimeType: 'image/jpeg',
      },
    });

    if (edgeError) {
      edgeErrorMessage = edgeError.message || JSON.stringify(edgeError);
    } else if (edgeData?.error) {
      edgeErrorMessage = edgeData.error;
    } else if (edgeData && edgeData.dish_name) {
      const latency = Date.now() - startTime;
      return {
        ...edgeData,
        image_uri: primaryImageUri,
        image_uris: allUris,
        latency_ms: latency,
        source: 'edge_function',
      };
    }
  } catch (edgeErr: any) {
    edgeErrorMessage = edgeErr?.message || 'Edge function connection failed';
  }

  // 3. Fallback: Direct Gemini Vision API if client key is available
  if (GEMINI_API_KEY && GEMINI_API_KEY.trim().length > 0 && imageParts.length > 0) {
    try {
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
    }
  ],
  "micronutrients": {
    "vitamin_c_mg": estimated mg or 0,
    "iron_mg": estimated mg or 0,
    "calcium_mg": estimated mg or 0,
    "fiber_g": estimated grams or 0
  },
  "health_insight": "One punchy 1-sentence nutritional highlight based on the detected items",
  "confidence_score": 0.96
}
Return ONLY valid JSON with no markdown backticks or explanation.`;

      const contentsPayload = [
        {
          parts: [
            { text: prompt },
            ...imageParts,
          ],
        },
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: contentsPayload,
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        const cleanJson = text ? JSON.parse(text.replace(/```json|```/g, '').trim()) : null;
        const latency = Date.now() - startTime;

        if (cleanJson && cleanJson.dish_name) {
          return {
            ...cleanJson,
            image_uri: primaryImageUri,
            image_uris: allUris,
            latency_ms: latency,
            source: 'client_direct',
          };
        }
      }
    } catch (apiErr) {
      console.warn('Gemini 3.5 Flash direct API call error:', apiErr);
    }
  }

  // 4. If all failed, throw a descriptive diagnostic error (No fake mock fallback!)
  const failureReason = edgeErrorMessage
    ? `Edge Function Error: ${edgeErrorMessage}`
    : 'Food scan failed. Please verify that GEMINI_API_KEY secret is set in your Supabase Edge Function environment.';

  throw new Error(failureReason);
};

/**
 * Single image backward compatibility wrapper
 */
export const analyzeFoodImage = async (image: ImageInput): Promise<FoodAnalysisResult> => {
  return analyzeFoodImages([image]);
};

