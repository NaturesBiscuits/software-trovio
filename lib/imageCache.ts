import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const IMAGE_CACHE_KEY = '@trovio_image_cache';
const CACHE_EXPIRY_MS = 55 * 60 * 1000; // 55 minutes (signed URLs expire in 1 hour)

interface CachedImageUrl {
  url: string;
  expiresAt: number;
}

interface ImageCache {
  [key: string]: CachedImageUrl;
}

/**
 * Generate a cache key for an image
 */
function getCacheKey(filename: string, userId: string | null, bucket: string): string {
  return `${bucket}:${userId}:${filename}`;
}

/**
 * Load the image cache from AsyncStorage
 */
async function loadCache(): Promise<ImageCache> {
  try {
    const cached = await AsyncStorage.getItem(IMAGE_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Error loading image cache:', error);
  }
  return {};
}

/**
 * Save the image cache to AsyncStorage
 */
async function saveCache(cache: ImageCache): Promise<void> {
  try {
    await AsyncStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Error saving image cache:', error);
  }
}

/**
 * Clean expired entries from cache
 */
async function cleanExpiredCache(): Promise<void> {
  const cache = await loadCache();
  const now = Date.now();
  const cleaned: ImageCache = {};
  
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
 * Get cached image URL or fetch new one
 * This caches signed URLs to avoid re-fetching on every page visit
 */
export async function getCachedImageUrl(
  filename: string | null,
  userId: string | null,
  bucket: string = 'tus'
): Promise<string | null> {
  if (!filename || !userId) return null;

  // Clean expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to clean on each call
    await cleanExpiredCache();
  }

  const hasExplicitPath = filename.includes('/');
  const storagePath = hasExplicitPath
    ? filename
    : `applications/${userId}/store_photos/${filename}`;

  const cacheKey = getCacheKey(storagePath, userId, bucket);
  const cache = await loadCache();
  const cached = cache[cacheKey];

  // Return cached URL if still valid
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  // Fetch new signed URL
  try {
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (!signedError && signedData?.signedUrl) {
      // Cache the URL with expiration
      const newCache = { ...cache };
      newCache[cacheKey] = {
        url: signedData.signedUrl,
        expiresAt: Date.now() + CACHE_EXPIRY_MS,
      };
      await saveCache(newCache);
      return signedData.signedUrl;
    }

    // Fallback: Download and convert to base64 (don't cache base64, it's too large)
    const { data: downloadData, error: downloadError } = await supabase.storage
      .from(bucket)
      .download(storagePath);

    if (downloadError || !downloadData) {
      console.error('Error downloading image:', downloadError);
      return null;
    }

    // Convert blob to base64
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        console.error('Error converting image to base64');
        resolve(null);
      };
      reader.readAsDataURL(downloadData);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
}

/**
 * Get multiple cached image URLs
 */
export async function getCachedImageUrls(
  filenames: (string | null)[],
  userId: string | null,
  bucket: string = 'tus'
): Promise<(string | null)[]> {
  const promises = filenames.map((filename) =>
    getCachedImageUrl(filename, userId, bucket)
  );
  return Promise.all(promises);
}

/**
 * Clear the image cache (useful on logout or when cache is too large)
 */
export async function clearImageUrlCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(IMAGE_CACHE_KEY);
  } catch (error) {
    console.warn('Error clearing image cache:', error);
  }
}

/**
 * Get cache size (for debugging)
 */
export async function getCacheSize(): Promise<number> {
  const cache = await loadCache();
  return Object.keys(cache).length;
}

