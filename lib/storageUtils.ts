import { supabase } from './supabase';

/**
 * Get image URL from Supabase Storage
 * Since the bucket is private, we need to either:
 * 1. Use signed URLs (temporary, expire after a set time)
 * 2. Download and convert to base64
 * 
 * This function tries signed URL first, then falls back to download
 */
export async function getStorageImageUrl(
  filename: string | null,
  userId: string | null,
  bucket: string = 'tus'
): Promise<string | null> {
  if (!filename || !userId) return null;

  // Avoid duplicating the folder path if the filename already includes it
  const storagePath = filename.includes('applications/')
    ? filename
    : `applications/${userId}/store_photos/${filename}`;

  try {
    // Try to get a signed URL (valid for 1 hour)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (!signedError && signedData?.signedUrl) {
      return signedData.signedUrl;
    }

    // Fallback: Download and convert to base64
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
 * Get multiple image URLs (for batch processing)
 */
export async function getStorageImageUrls(
  filenames: (string | null)[],
  userId: string | null,
  bucket: string = 'tus'
): Promise<(string | null)[]> {
  const promises = filenames.map((filename) =>
    getStorageImageUrl(filename, userId, bucket)
  );
  return Promise.all(promises);
}

