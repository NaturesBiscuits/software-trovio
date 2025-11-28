-- Drop the old policy if it exists (in case it was created incorrectly)
DROP POLICY IF EXISTS "delete_own_engagement" ON public.engagement_events;

-- Create a new DELETE policy
-- This allows users to delete their own engagement events
CREATE POLICY "delete_own_engagement"
ON public.engagement_events
FOR DELETE
TO public
USING (auth.uid() = user_id);

