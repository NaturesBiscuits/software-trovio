-- Fix the ambiguous column reference "category" in update_user_category_scores_from_favorites function
-- The error occurs because the function joins multiple tables that may have a "category" column
-- without properly qualifying which table's column to use.

-- Drop the existing function to recreate it with proper table aliases
DROP FUNCTION IF EXISTS public.update_user_category_scores_from_favorites() CASCADE;

-- Recreate the function with explicit table aliases to avoid ambiguous column references
-- This function updates user category scores based on favorite stores
CREATE OR REPLACE FUNCTION public.update_user_category_scores_from_favorites()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_store_id uuid;
BEGIN
  -- Determine user_id and store_id based on trigger operation
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_store_id := OLD.store_id;
  ELSE
    v_user_id := NEW.user_id;
    v_store_id := NEW.store_id;
  END IF;

  -- Only process if we have both user_id and store_id, and engagement is 'favorite'
  IF v_user_id IS NULL OR v_store_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Recalculate category scores for the user based on all their favorite stores
  -- Using explicit table aliases (ee, sa, t) to avoid ambiguous column references
  -- The "category" column reference is now explicitly qualified with table aliases
  WITH favorite_stores AS (
    SELECT DISTINCT ee.store_id
    FROM engagement_events ee
    WHERE ee.user_id = v_user_id
      AND ee.engagement = 'favorite'
      AND ee.store_id IS NOT NULL
  ),
  store_categories AS (
    SELECT DISTINCT 
      unnest(t.categories) AS category_name
    FROM favorite_stores fs
    INNER JOIN store_applications sa ON sa.id = fs.store_id
    INNER JOIN tags t ON t.name = ANY(sa.tags)
    WHERE t.categories IS NOT NULL
  )
  INSERT INTO user_category_scores (user_id, category, score)
  SELECT 
    v_user_id,
    sc.category_name,
    COUNT(*)::integer AS score
  FROM store_categories sc
  GROUP BY sc.category_name
  ON CONFLICT (user_id, category)
  DO UPDATE SET
    score = EXCLUDED.score,
    updated_at = NOW();

  -- Remove categories that are no longer relevant (score becomes 0)
  DELETE FROM user_category_scores ucs
  WHERE ucs.user_id = v_user_id
    AND ucs.category NOT IN (
      SELECT DISTINCT unnest(t.categories)
      FROM favorite_stores fs
      INNER JOIN store_applications sa ON sa.id = fs.store_id
      INNER JOIN tags t ON t.name = ANY(sa.tags)
      WHERE t.categories IS NOT NULL
    );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Recreate the triggers that were dropped by CASCADE
CREATE TRIGGER trg_favorite_delete_categories
AFTER DELETE ON engagement_events 
FOR EACH ROW 
WHEN (OLD.engagement = 'favorite'::engagement_type)
EXECUTE FUNCTION update_user_category_scores_from_favorites();

CREATE TRIGGER trg_favorite_insert_categories
AFTER INSERT ON engagement_events 
FOR EACH ROW 
WHEN (NEW.engagement = 'favorite'::engagement_type)
EXECUTE FUNCTION update_user_category_scores_from_favorites();

CREATE TRIGGER trg_favorite_update_categories_update
AFTER UPDATE OF engagement ON engagement_events 
FOR EACH ROW 
WHEN (NEW.engagement = 'favorite'::engagement_type)
EXECUTE FUNCTION update_user_category_scores_from_favorites();

