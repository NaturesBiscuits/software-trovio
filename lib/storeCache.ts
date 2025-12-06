import AsyncStorage from '@react-native-async-storage/async-storage';

const STORE_CACHE_KEY = '@trovio_store_cache';
const CACHE_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

interface CachedStore {
  store: any;
  expiresAt: number;
}

interface StoreCache {
  [storeId: string]: CachedStore;
}

/**
 * Load the store cache from AsyncStorage
 */
async function loadCache(): Promise<StoreCache> {
  try {
    const cached = await AsyncStorage.getItem(STORE_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Error loading store cache:', error);
  }
  return {};
}

/**
 * Save the store cache to AsyncStorage
 */
async function saveCache(cache: StoreCache): Promise<void> {
  try {
    await AsyncStorage.setItem(STORE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Error saving store cache:', error);
  }
}

/**
 * Clean expired entries from cache
 */
async function cleanExpiredCache(): Promise<void> {
  const cache = await loadCache();
  const now = Date.now();
  const cleaned: StoreCache = {};
  
  for (const [key, value] of Object.entries(cache)) {
    if (value.expiresAt > now) {
      cleaned[key] = value;
    }
  }
  
  if (Object.keys(cleaned).length !== Object.keys(cache).length) {
    await saveCache(cleaned);
  }
}

/**
 * Get cached store data or return null if not cached/expired
 */
export async function getCachedStore(storeId: string): Promise<any | null> {
  if (!storeId) return null;

  // Clean expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean on each call
    await cleanExpiredCache();
  }

  const cache = await loadCache();
  const cached = cache[storeId];

  if (cached && cached.expiresAt > Date.now()) {
    return cached.store;
  }

  return null;
}

/**
 * Cache store data
 */
export async function cacheStore(storeId: string, store: any): Promise<void> {
  if (!storeId || !store) return;

  const cache = await loadCache();
  cache[storeId] = {
    store,
    expiresAt: Date.now() + CACHE_EXPIRY_MS,
  };
  await saveCache(cache);
}

/**
 * Cache multiple stores at once
 */
export async function cacheStores(stores: any[]): Promise<void> {
  if (!stores || stores.length === 0) return;

  const cache = await loadCache();
  const now = Date.now();

  stores.forEach((store) => {
    if (store?.id) {
      cache[store.id] = {
        store,
        expiresAt: now + CACHE_EXPIRY_MS,
      };
    }
  });

  await saveCache(cache);
}

/**
 * Get multiple cached stores
 */
export async function getCachedStores(storeIds: string[]): Promise<Map<string, any>> {
  const result = new Map<string, any>();
  if (!storeIds || storeIds.length === 0) return result;

  const cache = await loadCache();
  const now = Date.now();

  storeIds.forEach((id) => {
    const cached = cache[id];
    if (cached && cached.expiresAt > now) {
      result.set(id, cached.store);
    }
  });

  return result;
}

/**
 * Clear the store cache (useful on logout)
 */
export async function clearStoreCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORE_CACHE_KEY);
  } catch (error) {
    console.warn('Error clearing store cache:', error);
  }
}

