import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const CHUNK_SIZE = 1800; // Well below Android Keystore 2048-byte limit

/**
 * Chunked SecureStore Adapter to transparently split large Supabase auth tokens
 * and session metadata, completely eliminating the 2048-byte Keystore warning.
 */
const ChunkedSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      const chunksCountStr = await SecureStore.getItemAsync(`${key}_chunks_count`);
      if (chunksCountStr) {
        const count = parseInt(chunksCountStr, 10);
        let fullValue = '';
        for (let i = 0; i < count; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_chunk_${i}`);
          if (chunk) fullValue += chunk;
        }
        return fullValue.length > 0 ? fullValue : null;
      }
      // Fallback to legacy single key
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof value !== 'string') return;

      if (value.length <= CHUNK_SIZE) {
        await SecureStore.deleteItemAsync(`${key}_chunks_count`).catch(() => {});
        return await SecureStore.setItemAsync(key, value);
      }

      // Split into multiple sub-keys under 1800 bytes
      const chunks: string[] = [];
      for (let i = 0; i < value.length; i += CHUNK_SIZE) {
        chunks.push(value.slice(i, i + CHUNK_SIZE));
      }

      await SecureStore.setItemAsync(`${key}_chunks_count`, chunks.length.toString());
      for (let i = 0; i < chunks.length; i++) {
        await SecureStore.setItemAsync(`${key}_chunk_${i}`, chunks[i]);
      }
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch (err) {
      console.warn('SecureStore chunk write error:', err);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    try {
      const chunksCountStr = await SecureStore.getItemAsync(`${key}_chunks_count`);
      if (chunksCountStr) {
        const count = parseInt(chunksCountStr, 10);
        for (let i = 0; i < count; i++) {
          await SecureStore.deleteItemAsync(`${key}_chunk_${i}`).catch(() => {});
        }
        await SecureStore.deleteItemAsync(`${key}_chunks_count`).catch(() => {});
      }
      await SecureStore.deleteItemAsync(key).catch(() => {});
    } catch {}
  },
};

import { APP_CONFIG } from '../config/appConfig';

export const supabase = createClient(
  APP_CONFIG.SUPABASE_URL,
  APP_CONFIG.SUPABASE_ANON_KEY,
  {
    auth: {
      storage: ChunkedSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
