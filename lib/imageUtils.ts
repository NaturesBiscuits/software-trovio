import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from "expo-file-system/legacy";
import { Image } from "expo-image";
import { Buffer } from "buffer";

/**
 * Compress an image before upload
 * @param uri - The image URI to compress
 * @param options - Compression options
 * @returns The compressed image URI
 */
export async function compressImage(
  uri: string,
  options: {
    compress?: number; // 0-1 (lower = smaller file, default 0.5)
    maxWidth?: number; // Optional max width to resize
    format?: ImageManipulator.SaveFormat;
  } = {}
): Promise<string> {
  const {
    compress = 0.5,
    maxWidth = 1024,
    format = ImageManipulator.SaveFormat.JPEG,
  } = options;

  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      maxWidth ? [{ resize: { width: maxWidth } }] : [],
      {
        compress,
        format,
      }
    );
    return result.uri;
  } catch (error) {
    console.error("Error compressing image:", error);
    // Return original URI if compression fails
    return uri;
  }
}

/**
 * Upload a compressed image to Supabase Storage
 * @param uri - The image URI (will be compressed first)
 * @param storagePath - The storage path in Supabase
 * @param bucket - The bucket name (default: 'tus')
 * @param compressOptions - Compression options
 * @returns The uploaded file path
 */
export async function uploadCompressedImage(
  uri: string,
  storagePath: string,
  bucket: string = "tus",
  compressOptions?: {
    compress?: number;
    maxWidth?: number;
  }
): Promise<string> {
  const { supabase } = await import("./supabase");

  // 1. Compress the image
  const compressedUri = await compressImage(uri, {
    compress: compressOptions?.compress ?? 0.5,
    maxWidth: compressOptions?.maxWidth ?? 1024,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  // 2. Convert to binary using FileSystem (works in React Native)
  try {
    // Primary: use Expo FileSystem to read file as base64 (reliable on Expo/React Native)
    const base64 = await FileSystem.readAsStringAsync(compressedUri, { encoding: 'base64' });
    const binary = Buffer.from(base64, 'base64');
    
    // 3. Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, binary, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    // 4. Clean up temp file if it's different from original
    if (compressedUri !== uri && compressedUri.startsWith("file://")) {
      try {
        await FileSystem.deleteAsync(compressedUri, { idempotent: true });
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp file:", cleanupError);
      }
    }

    return data?.path || (data as any)?.path;
  } catch (e) {
    console.warn('FileSystem base64 read failed, falling back to fetch:', e);
    
    // Fallback: try fetch -> arrayBuffer
    try {
      const res = await fetch(compressedUri);
      if (typeof (res as any).arrayBuffer === 'function') {
        const arrayBuffer = await (res as any).arrayBuffer();
        const uint8 = new Uint8Array(arrayBuffer);
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(storagePath, uint8, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (error) throw error;

        // Clean up temp file
        if (compressedUri !== uri && compressedUri.startsWith("file://")) {
          try {
            await FileSystem.deleteAsync(compressedUri, { idempotent: true });
          } catch (cleanupError) {
            console.warn("Failed to cleanup temp file:", cleanupError);
          }
        }

        return data?.path || (data as any)?.path;
      }
    } catch (fetchError) {
      console.error('Fetch fallback also failed:', fetchError);
      throw new Error('Failed to upload image: Unable to read file');
    }

    throw new Error('Failed to upload image: No compatible method found');
  }
}

/**
 * Clear image cache (memory and disk)
 * Call this after logout, after uploading multiple images, or when switching accounts
 */
export async function clearImageCache(): Promise<void> {
  try {
    // Clear expo-image cache
    Image.clearMemoryCache();
    Image.clearDiskCache();
    console.log("Image cache cleared successfully");
  } catch (error) {
    console.error("Error clearing image cache:", error);
  }
}

/**
 * Delete temporary files after upload
 * @param uri - The URI of the temp file to delete
 */
export async function deleteTempFile(uri: string): Promise<void> {
  if (!uri.startsWith("file://")) return;

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.warn("Failed to delete temp file:", error);
  }
}

/**
 * Get Supabase storage URL with cache busting
 * @param path - The storage path
 * @param bucket - The bucket name (default: 'tus')
 * @param transform - Optional transform options (e.g., width for resizing)
 * @returns The public URL with cache busting
 */
export async function getStorageUrlWithCacheBust(
  path: string,
  bucket: string = "tus",
  transform?: { width?: number; height?: number }
): Promise<string> {
  const { supabase } = await import("./supabase");
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: transform ? { width: transform.width, height: transform.height } : undefined,
  });
  
  // Add cache busting query parameter
  const cacheBuster = `?t=${Date.now()}`;
  return `${data.publicUrl}${cacheBuster}`;
}

