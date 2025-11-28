import { getCurrentUser } from './authUtils';
import { supabase } from './supabase';

export type EngagementType = 'visit' | 'promotion_click' | 'favorite';

interface RecordEngagementParams {
  storeId?: string;
  promotionId?: string;
  engagement: EngagementType;
}

/**
 * Records an engagement event (visit, promotion click, or favorite)
 * Handles 24-hour deduplication for visits and promotion clicks
 * Handles unique constraint for favorites
 */
export async function recordEngagement({
  storeId,
  promotionId,
  engagement,
}: RecordEngagementParams): Promise<{ success: boolean; error?: any }> {
  try {
    // Get authenticated user (safely handles refresh token errors)
    const { user, error: authError } = await getCurrentUser();
    const userId = user?.id;

    if (authError || !userId) {
      return { success: false, error: authError || 'User not authenticated' };
    }

    // For visits and promotion clicks, check if there's a recent event (within 24 hours)
    if (engagement === 'visit' || engagement === 'promotion_click') {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const query = supabase
        .from('engagement_events')
        .select('id')
        .eq('user_id', userId)
        .eq('engagement', engagement)
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (engagement === 'visit' && storeId) {
        query.eq('store_id', storeId);
      } else if (engagement === 'promotion_click' && promotionId) {
        query.eq('promotion_id', promotionId);
      }

      const { data: recentEvents } = await query.limit(1);

      // If there's a recent event within 24 hours, don't record again
      if (recentEvents && recentEvents.length > 0) {
        return { success: true }; // Silently succeed - already recorded within 24h
      }
    }

    // Prepare the insert data
    const insertData: {
      user_id: string;
      store_id?: string;
      promotion_id?: string;
      engagement: EngagementType;
    } = {
      user_id: userId,
      engagement,
    };

    if (storeId) {
      insertData.store_id = storeId;
    }

    if (promotionId) {
      insertData.promotion_id = promotionId;
    }

    // Insert the engagement event
    const { error: insertError } = await supabase
      .from('engagement_events')
      .insert([insertData]);

    if (insertError) {
      // For favorites, if it's a unique constraint violation, it's okay (already favorited)
      if (engagement === 'favorite' && insertError.code === '23505') {
        return { success: true }; // Already favorited, that's fine
      }
      console.error('Error recording engagement:', insertError);
      return { success: false, error: insertError };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error recording engagement:', error);
    return { success: false, error };
  }
}

/**
 * Records a store visit (with 24-hour deduplication)
 */
export async function recordStoreVisit(storeId: string): Promise<void> {
  await recordEngagement({ storeId, engagement: 'visit' });
}

/**
 * Records a promotion click (with 24-hour deduplication)
 */
export async function recordPromotionClick(
  promotionId: string,
  storeId?: string
): Promise<void> {
  await recordEngagement({
    promotionId,
    storeId,
    engagement: 'promotion_click',
  });
}

/**
 * Records a favorite action (unique per user-store pair)
 */
export async function recordFavorite(storeId: string): Promise<void> {
  await recordEngagement({ storeId, engagement: 'favorite' });
}

/**
 * Removes a favorite action (unlike/unfavorite)
 * Deletes the engagement event from the database
 */
export async function unfavorite(storeId: string): Promise<{ success: boolean; error?: any }> {
  try {
    // Get authenticated user (safely handles refresh token errors)
    const { user, error: authError } = await getCurrentUser();
    const userId = user?.id;

    if (authError || !userId) {
      return { success: false, error: authError || 'User not authenticated' };
    }

    // Delete the favorite engagement event
    const { error: deleteError } = await supabase
      .from('engagement_events')
      .delete()
      .eq('user_id', userId)
      .eq('store_id', storeId)
      .eq('engagement', 'favorite');

    if (deleteError) {
      console.error('Error removing favorite:', deleteError);
      return { success: false, error: deleteError };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error removing favorite:', error);
    return { success: false, error };
  }
}

