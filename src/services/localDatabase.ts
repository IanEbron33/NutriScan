import * as SQLite from 'expo-sqlite';
import { DbMealLog, Profile, SyncStatus } from '../types/database';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDb = (): SQLite.SQLiteDatabase => {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('nutriscan.db');
    initTables(dbInstance);
  }
  return dbInstance;
};

/**
 * Initializes local SQLite schema for offline caching and sync queues.
 */
const initTables = (db: SQLite.SQLiteDatabase) => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS local_meal_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        dish_name TEXT NOT NULL,
        calories REAL NOT NULL DEFAULT 0,
        protein_g REAL NOT NULL DEFAULT 0,
        carbs_g REAL NOT NULL DEFAULT 0,
        fat_g REAL NOT NULL DEFAULT 0,
        micronutrients TEXT,
        detected_items TEXT,
        image_uri TEXT,
        source TEXT DEFAULT 'ai_scan',
        logged_at TEXT NOT NULL,
        created_at TEXT,
        sync_status TEXT DEFAULT 'synced'
      );

      CREATE INDEX IF NOT EXISTS idx_local_meals_user_date 
      ON local_meal_logs (user_id, logged_at);

      CREATE TABLE IF NOT EXISTS local_profiles (
        id TEXT PRIMARY KEY,
        email TEXT,
        full_name TEXT,
        avatar_url TEXT,
        is_onboarded INTEGER DEFAULT 0,
        gender TEXT,
        age INTEGER,
        height_cm REAL,
        weight_kg REAL,
        activity_level TEXT,
        primary_goal TEXT,
        daily_calorie_target INTEGER DEFAULT 2400,
        daily_protein_target INTEGER DEFAULT 120,
        daily_carbs_target INTEGER DEFAULT 250,
        daily_fat_target INTEGER DEFAULT 70,
        streak_days INTEGER DEFAULT 1,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS local_coach_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        suggested_meal TEXT,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_coach_msgs_user 
      ON local_coach_messages (user_id, created_at);
    `);
  } catch (error) {
    console.warn('[LocalDB] Error initializing SQLite tables:', error);
  }
};

/**
 * Helper to get ISO date string range for current day in local timezone
 */
export const getTodayDateRange = () => {
  return getDateRangeForDay(new Date());
};

/**
 * Helper to get ISO date string range for a specific day in local timezone
 */
export const getDateRangeForDay = (date: Date) => {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0).toISOString();
  const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999).toISOString();
  return { startOfDay, endOfDay };
};

/**
 * Retrieves today's meals from local SQLite cache (instant 0ms offline query)
 */
export const getLocalTodayMeals = (userId: string): DbMealLog[] => {
  return getLocalMealsByDate(userId, new Date());
};

/**
 * Retrieves meals for any specific calendar date from local SQLite cache
 */
export const getLocalMealsByDate = (userId: string, date: Date): DbMealLog[] => {
  try {
    const db = getDb();
    const { startOfDay, endOfDay } = getDateRangeForDay(date);

    const rows = db.getAllSync<any>(
      `SELECT * FROM local_meal_logs 
       WHERE user_id = ? 
         AND logged_at >= ? 
         AND logged_at <= ? 
         AND sync_status != 'pending_delete'
       ORDER BY logged_at DESC;`,
      [userId, startOfDay, endOfDay]
    );

    return rows.map(mapRowToMealLog);
  } catch (error) {
    console.warn('[LocalDB] Error fetching local meals by date:', error);
    return [];
  }
};

/**
 * Retrieves all meals for a user from local SQLite cache
 */
export const getAllLocalMeals = (userId: string, limit: number = 50): DbMealLog[] => {
  try {
    const db = getDb();
    const rows = db.getAllSync<any>(
      `SELECT * FROM local_meal_logs 
       WHERE user_id = ? 
         AND sync_status != 'pending_delete'
       ORDER BY logged_at DESC 
       LIMIT ?;`,
      [userId, limit]
    );

    return rows.map(mapRowToMealLog);
  } catch (error) {
    console.warn('[LocalDB] Error fetching all local meals:', error);
    return [];
  }
};

/**
 * Saves or updates a single meal log in local SQLite
 */
export const saveLocalMeal = (meal: DbMealLog): void => {
  try {
    const db = getDb();
    db.runSync(
      `INSERT OR REPLACE INTO local_meal_logs (
        id, user_id, dish_name, calories, protein_g, carbs_g, fat_g,
        micronutrients, detected_items, image_uri, source, logged_at, created_at, sync_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        meal.id,
        meal.user_id,
        meal.dish_name,
        meal.calories,
        meal.protein_g,
        meal.carbs_g,
        meal.fat_g,
        JSON.stringify(meal.micronutrients || {}),
        JSON.stringify(meal.detected_items || []),
        meal.image_uri || null,
        meal.source || 'ai_scan',
        meal.logged_at,
        meal.created_at || new Date().toISOString(),
        meal.sync_status || 'synced',
      ]
    );
  } catch (error) {
    console.warn('[LocalDB] Error saving local meal:', error);
  }
};

/**
 * Marks a meal for deletion or removes immediately if not yet pushed to cloud
 */
export const deleteLocalMeal = (mealId: string): void => {
  try {
    const db = getDb();
    const row = db.getFirstSync<any>(
      `SELECT sync_status FROM local_meal_logs WHERE id = ?;`,
      [mealId]
    );

    if (!row) return;

    if (row.sync_status === 'pending_insert') {
      // Never went to cloud, delete locally directly
      db.runSync(`DELETE FROM local_meal_logs WHERE id = ?;`, [mealId]);
    } else {
      // Mark as pending delete so sync queue can notify Supabase
      db.runSync(`UPDATE local_meal_logs SET sync_status = 'pending_delete' WHERE id = ?;`, [mealId]);
    }
  } catch (error) {
    console.warn('[LocalDB] Error deleting local meal:', error);
  }
};

/**
 * Retrieves all offline pending actions waiting for cloud sync
 */
export const getPendingSyncMeals = (userId: string): DbMealLog[] => {
  try {
    const db = getDb();
    const rows = db.getAllSync<any>(
      `SELECT * FROM local_meal_logs WHERE user_id = ? AND sync_status != 'synced';`,
      [userId]
    );
    return rows.map(mapRowToMealLog);
  } catch (error) {
    console.warn('[LocalDB] Error fetching pending sync meals:', error);
    return [];
  }
};

/**
 * Returns summary counts of cached meals and pending sync items
 */
export const getLocalDatabaseStats = (userId: string): { totalCached: number; pendingSync: number } => {
  try {
    const db = getDb();
    const totalRow = db.getFirstSync<any>(
      `SELECT COUNT(*) as count FROM local_meal_logs WHERE user_id = ? AND sync_status != 'pending_delete';`,
      [userId]
    );
    const pendingRow = db.getFirstSync<any>(
      `SELECT COUNT(*) as count FROM local_meal_logs WHERE user_id = ? AND sync_status != 'synced';`,
      [userId]
    );

    return {
      totalCached: Number(totalRow?.count || 0),
      pendingSync: Number(pendingRow?.count || 0),
    };
  } catch (error) {
    console.warn('[LocalDB] Error getting database stats:', error);
    return { totalCached: 0, pendingSync: 0 };
  }
};

/**
 * Updates status of a synced record
 */
export const markMealSynced = (oldId: string, cloudMeal: DbMealLog): void => {
  try {
    const db = getDb();
    if (oldId !== cloudMeal.id) {
      db.runSync(`DELETE FROM local_meal_logs WHERE id = ?;`, [oldId]);
    }
    saveLocalMeal({ ...cloudMeal, sync_status: 'synced' });
  } catch (error) {
    console.warn('[LocalDB] Error marking meal as synced:', error);
  }
};

/**
 * Cleans up a deleted record after Supabase delete confirms
 */
export const purgeDeletedMeal = (mealId: string): void => {
  try {
    const db = getDb();
    db.runSync(`DELETE FROM local_meal_logs WHERE id = ?;`, [mealId]);
  } catch (error) {
    console.warn('[LocalDB] Error purging deleted meal:', error);
  }
};

/**
 * Upserts fresh cloud records into local SQLite cache without wiping other days
 */
export const syncCloudMealsToLocal = (userId: string, cloudMeals: DbMealLog[]): void => {
  try {
    const db = getDb();
    db.withTransactionSync(() => {
      for (const meal of cloudMeals) {
        saveLocalMeal({ ...meal, sync_status: 'synced' });
      }
    });
  } catch (error) {
    console.warn('[LocalDB] Error syncing cloud meals to local SQLite:', error);
  }
};

/**
 * Calculates the consecutive active calendar day streak for a user.
 * 24-hour streak rule:
 * - If user logged a meal today: streak starts at 1 and counts backwards consecutive days.
 * - If user hasn't logged today yet, but logged yesterday (within 24h grace period): streak keeps yesterday's streak.
 * - If neither today nor yesterday has a meal (missed 24h+): streak resets to 0.
 */
export const calculateLocalStreak = (userId: string): number => {
  try {
    const db = getDb();
    const rows = db.getAllSync<{ logged_at: string }>(
      `SELECT logged_at FROM local_meal_logs 
       WHERE user_id = ? AND sync_status != 'pending_delete'
       ORDER BY logged_at DESC;`,
      [userId]
    );

    if (!rows || rows.length === 0) return 0;

    // Extract unique YYYY-MM-DD local dates
    const uniqueDates = new Set<string>();
    for (const r of rows) {
      try {
        const d = new Date(r.logged_at);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          uniqueDates.add(`${yyyy}-${mm}-${dd}`);
        }
      } catch {
        // ignore invalid
      }
    }

    if (uniqueDates.size === 0) return 0;

    const now = new Date();
    const formatDate = (date: Date) => {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    const todayStr = formatDate(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    let streak = 0;
    let checkDate = new Date(now);

    if (uniqueDates.has(todayStr)) {
      // User has logged today
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 1);
      while (uniqueDates.has(formatDate(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else if (uniqueDates.has(yesterdayStr)) {
      // Grace period: User logged yesterday, streak stays alive for today
      streak = 1;
      checkDate.setDate(checkDate.getDate() - 2);
      while (uniqueDates.has(formatDate(checkDate))) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    } else {
      // Missed more than 24 hours (neither today nor yesterday) -> streak reset
      streak = 0;
    }

    return streak;
  } catch (error) {
    console.warn('[LocalDB] Error calculating streak:', error);
    return 0;
  }
};

/**
 * Saves user profile to local SQLite
 */
export const saveLocalProfile = (profile: Profile): void => {
  try {
    const db = getDb();
    db.runSync(
      `INSERT OR REPLACE INTO local_profiles (
        id, email, full_name, avatar_url, is_onboarded, gender, age,
        height_cm, weight_kg, activity_level, primary_goal,
        daily_calorie_target, daily_protein_target, daily_carbs_target, daily_fat_target,
        streak_days, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        profile.id,
        profile.email,
        profile.full_name,
        profile.avatar_url,
        profile.is_onboarded ? 1 : 0,
        profile.gender || null,
        profile.age || null,
        profile.height_cm || null,
        profile.weight_kg || null,
        profile.activity_level || null,
        profile.primary_goal || null,
        profile.daily_calorie_target || 2400,
        profile.daily_protein_target || 120,
        profile.daily_carbs_target || 250,
        profile.daily_fat_target || 70,
        profile.streak_days || 1,
        new Date().toISOString(),
      ]
    );
  } catch (error) {
    console.warn('[LocalDB] Error saving local profile:', error);
  }
};

/**
 * Retrieves user profile from local SQLite
 */
export const getLocalProfile = (userId: string): Profile | null => {
  try {
    const db = getDb();
    const row = db.getFirstSync<any>(
      `SELECT * FROM local_profiles WHERE id = ?;`,
      [userId]
    );
    if (!row) return null;

    return {
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      avatar_url: row.avatar_url,
      is_onboarded: row.is_onboarded === 1,
      gender: row.gender,
      age: row.age,
      height_cm: row.height_cm,
      weight_kg: row.weight_kg,
      activity_level: row.activity_level,
      primary_goal: row.primary_goal,
      daily_calorie_target: row.daily_calorie_target,
      daily_protein_target: row.daily_protein_target,
      daily_carbs_target: row.daily_carbs_target,
      daily_fat_target: row.daily_fat_target,
      streak_days: row.streak_days,
      updated_at: row.updated_at,
    };
  } catch (error) {
    console.warn('[LocalDB] Error fetching local profile:', error);
    return null;
  }
};

const mapRowToMealLog = (row: any): DbMealLog => ({
  id: row.id,
  user_id: row.user_id,
  dish_name: row.dish_name,
  calories: Number(row.calories || 0),
  protein_g: Number(row.protein_g || 0),
  carbs_g: Number(row.carbs_g || 0),
  fat_g: Number(row.fat_g || 0),
  micronutrients: typeof row.micronutrients === 'string' ? JSON.parse(row.micronutrients || '{}') : row.micronutrients || {},
  detected_items: typeof row.detected_items === 'string' ? JSON.parse(row.detected_items || '[]') : row.detected_items || [],
  image_uri: row.image_uri,
  source: row.source || 'ai_scan',
  logged_at: row.logged_at,
  created_at: row.created_at,
  sync_status: (row.sync_status as SyncStatus) || 'synced',
});

export interface LocalCoachMessageRecord {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedMeal?: any;
}

/**
 * Retrieves persisted chat history for AI Nutrition Coach
 */
export const getLocalCoachMessages = (userId: string, limit: number = 60): LocalCoachMessageRecord[] => {
  try {
    const db = getDb();
    const rows = db.getAllSync<any>(
      `SELECT * FROM local_coach_messages 
       WHERE user_id = ? 
       ORDER BY created_at ASC 
       LIMIT ?;`,
      [userId, limit]
    );

    return rows.map((r) => {
      let suggestedMeal = undefined;
      if (r.suggested_meal) {
        try {
          suggestedMeal = JSON.parse(r.suggested_meal);
        } catch {
          // ignore
        }
      }

      const dateObj = new Date(r.created_at);
      const timestamp = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

      return {
        id: r.id,
        sender: r.sender === 'user' ? 'user' : 'ai',
        text: r.text,
        timestamp,
        suggestedMeal,
      };
    });
  } catch (error) {
    console.warn('[LocalDB] Error fetching local coach messages:', error);
    return [];
  }
};

/**
 * Saves a single coach chat message to local SQLite
 */
export const saveLocalCoachMessage = (
  userId: string,
  msg: { id: string; sender: 'user' | 'ai'; text: string; suggestedMeal?: any }
): void => {
  try {
    const db = getDb();
    db.runSync(
      `INSERT OR REPLACE INTO local_coach_messages (
        id, user_id, sender, text, suggested_meal, created_at
      ) VALUES (?, ?, ?, ?, ?, ?);`,
      [
        msg.id,
        userId,
        msg.sender,
        msg.text,
        msg.suggestedMeal ? JSON.stringify(msg.suggestedMeal) : null,
        new Date().toISOString(),
      ]
    );
  } catch (error) {
    console.warn('[LocalDB] Error saving local coach message:', error);
  }
};

/**
 * Clears coach chat history for a user
 */
export const clearLocalCoachMessages = (userId: string): void => {
  try {
    const db = getDb();
    db.runSync(`DELETE FROM local_coach_messages WHERE user_id = ?;`, [userId]);
  } catch (error) {
    console.warn('[LocalDB] Error clearing local coach messages:', error);
  }
};

