import { supabase } from './supabase';
import { DbMealLog, Profile } from '../types/database';
import {
  getLocalTodayMeals,
  getLocalMealsByDate,
  getAllLocalMeals,
  saveLocalMeal,
  deleteLocalMeal as deleteLocalMealDb,
  getPendingSyncMeals,
  markMealSynced,
  purgeDeletedMeal,
  syncCloudMealsToLocal,
  getTodayDateRange,
  getDateRangeForDay,
  calculateLocalStreak,
} from './localDatabase';

/**
 * Loads today's meal logs with offline-first local SQLite fallback + background cloud sync
 */
export const loadTodayMealLogs = async (userId: string): Promise<DbMealLog[]> => {
  return loadMealsByDate(userId, new Date());
};

/**
 * Loads meals for any specific calendar date with instant SQLite cache + background Supabase sync
 */
export const loadMealsByDate = async (userId: string, date: Date): Promise<DbMealLog[]> => {
  // 1. Instant local read (0ms latency, 100% offline-ready)
  const localMeals = getLocalMealsByDate(userId, date);

  // 2. Try background sync with Supabase
  try {
    const { startOfDay, endOfDay } = getDateRangeForDay(date);

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', startOfDay)
      .lte('logged_at', endOfDay)
      .order('logged_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const cloudMeals: DbMealLog[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        dish_name: item.dish_name,
        calories: Number(item.calories || 0),
        protein_g: Number(item.protein_g || 0),
        carbs_g: Number(item.carbs_g || 0),
        fat_g: Number(item.fat_g || 0),
        micronutrients: item.micronutrients || {},
        detected_items: item.detected_items || [],
        image_uri: item.image_uri,
        source: item.source || 'ai_scan',
        logged_at: item.logged_at,
        created_at: item.created_at,
        sync_status: 'synced',
      }));

      // Cache fresh cloud records into SQLite
      syncCloudMealsToLocal(userId, cloudMeals);

      // Trigger background sync for any pending offline items
      syncPendingMealLogs(userId).catch(console.warn);

      // Return refreshed local records
      return getLocalMealsByDate(userId, date);
    }
  } catch (netErr) {
    // Offline or network error: return local SQLite data
    console.log('[NutritionService] Offline / network error loading cloud meals for date, using local cache:', netErr);
  }

  return localMeals;
};

/**
 * Syncs the past 30 days of meal logs from Supabase into local SQLite
 * Ensures historical days (like yesterday) are fully available offline.
 */
export const syncRecentMealLogs = async (userId: string, days: number = 30): Promise<DbMealLog[]> => {
  try {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', sinceDate)
      .order('logged_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      const cloudMeals: DbMealLog[] = data.map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        dish_name: item.dish_name,
        calories: Number(item.calories || 0),
        protein_g: Number(item.protein_g || 0),
        carbs_g: Number(item.carbs_g || 0),
        fat_g: Number(item.fat_g || 0),
        micronutrients: item.micronutrients || {},
        detected_items: item.detected_items || [],
        image_uri: item.image_uri,
        source: item.source || 'ai_scan',
        logged_at: item.logged_at,
        created_at: item.created_at,
        sync_status: 'synced',
      }));

      syncCloudMealsToLocal(userId, cloudMeals);
      return cloudMeals;
    }
  } catch (err) {
    console.warn('[NutritionService] Error syncing 30-day meal history:', err);
  }

  return getAllLocalMeals(userId, 100);
};

/**
 * Creates and persists a new food intake log
 * Writes immediately to SQLite, then commits to Supabase in real-time
 */
export const logFoodIntake = async (
  userId: string,
  meal: {
    dish_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    micronutrients?: Record<string, any>;
    detected_items?: any[];
    image_uri?: string | null;
    source?: 'ai_scan' | 'manual' | 'preset';
    logged_at?: string;
  }
): Promise<DbMealLog> => {
  const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = meal.logged_at || new Date().toISOString();

  const localEntry: DbMealLog = {
    id: localId,
    user_id: userId,
    dish_name: meal.dish_name,
    calories: Number(meal.calories || 0),
    protein_g: Number(meal.protein_g || 0),
    carbs_g: Number(meal.carbs_g || 0),
    fat_g: Number(meal.fat_g || 0),
    micronutrients: meal.micronutrients || {},
    detected_items: meal.detected_items || [],
    image_uri: meal.image_uri || null,
    source: meal.source || 'ai_scan',
    logged_at: nowIso,
    created_at: nowIso,
    sync_status: 'pending_insert',
  };

  // 1. Instant local SQLite persist
  saveLocalMeal(localEntry);

  // 2. Cloud insert to Supabase
  try {
    const { data, error } = await supabase
      .from('meal_logs')
      .insert({
        user_id: userId,
        dish_name: localEntry.dish_name,
        calories: localEntry.calories,
        protein_g: localEntry.protein_g,
        carbs_g: localEntry.carbs_g,
        fat_g: localEntry.fat_g,
        micronutrients: localEntry.micronutrients,
        detected_items: localEntry.detected_items,
        image_uri: localEntry.image_uri,
        source: localEntry.source,
        logged_at: localEntry.logged_at,
      })
      .select()
      .single();

    if (!error && data) {
      const cloudMeal: DbMealLog = {
        id: data.id,
        user_id: data.user_id,
        dish_name: data.dish_name,
        calories: Number(data.calories || 0),
        protein_g: Number(data.protein_g || 0),
        carbs_g: Number(data.carbs_g || 0),
        fat_g: Number(data.fat_g || 0),
        micronutrients: data.micronutrients || {},
        detected_items: data.detected_items || [],
        image_uri: data.image_uri,
        source: data.source || 'ai_scan',
        logged_at: data.logged_at,
        created_at: data.created_at,
        sync_status: 'synced',
      };

      // Mark SQLite record as synced
      markMealSynced(localId, cloudMeal);
      return cloudMeal;
    }
  } catch (err) {
    console.warn('[NutritionService] Offline: Queued meal for later cloud sync:', err);
  }

  return localEntry;
};

/**
 * Deletes a meal log from both SQLite and Supabase
 */
export const removeMealLog = async (userId: string, mealId: string): Promise<void> => {
  // 1. Delete or mark pending_delete locally
  deleteLocalMealDb(mealId);

  // 2. Cloud delete
  try {
    if (!mealId.startsWith('local_')) {
      const { error } = await supabase
        .from('meal_logs')
        .delete()
        .eq('id', mealId)
        .eq('user_id', userId);

      if (!error) {
        purgeDeletedMeal(mealId);
      }
    }
  } catch (err) {
    console.warn('[NutritionService] Error removing meal from cloud (queued for sync):', err);
  }
};

/**
 * Flushes all offline pending changes to Supabase
 */
export const syncPendingMealLogs = async (userId: string): Promise<void> => {
  const pendingItems = getPendingSyncMeals(userId);
  if (!pendingItems.length) return;

  for (const item of pendingItems) {
    try {
      if (item.sync_status === 'pending_insert') {
        const { data, error } = await supabase
          .from('meal_logs')
          .insert({
            user_id: userId,
            dish_name: item.dish_name,
            calories: item.calories,
            protein_g: item.protein_g,
            carbs_g: item.carbs_g,
            fat_g: item.fat_g,
            micronutrients: item.micronutrients,
            detected_items: item.detected_items,
            image_uri: item.image_uri,
            source: item.source,
            logged_at: item.logged_at,
          })
          .select()
          .single();

        if (!error && data) {
          markMealSynced(item.id, {
            ...item,
            id: data.id,
            sync_status: 'synced',
          });
        }
      } else if (item.sync_status === 'pending_delete') {
        if (!item.id.startsWith('local_')) {
          const { error } = await supabase
            .from('meal_logs')
            .delete()
            .eq('id', item.id)
            .eq('user_id', userId);

          if (!error) {
            purgeDeletedMeal(item.id);
          }
        } else {
          purgeDeletedMeal(item.id);
        }
      }
    } catch (err) {
      console.warn(`[NutritionService] Sync failed for item ${item.id}:`, err);
    }
  }
};
