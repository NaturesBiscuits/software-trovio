# Admin Review Policy Setup

## Summary of Changes Made

### Frontend Changes ✅

1. **Updated Accept/Reject Functions**: Now records `reviewed_by` (admin user ID) and `reviewed_at` (timestamp) when accepting or rejecting applications
2. **Added Reviewer Display**: Shows who reviewed the application and when it was reviewed
3. **Status Updates**:
   - Accept → sets status to `"accepted"`
   - Reject → sets status to `"declined"`

### Required Database Policy

You need to add a **Row Level Security (RLS) policy** to allow admins to update any store application. Currently, only store owners can update their own applications.

## SQL Policy to Add

Run this SQL in your Supabase SQL Editor:

```sql
-- Policy: Allow admins to update any store application
CREATE POLICY "Admins can update any application"
ON public.store_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
  )
);
```

## Explanation

- **USING clause**: Checks if the current user is an admin before allowing the UPDATE operation
- **WITH CHECK clause**: Ensures the user is still an admin when the update is committed
- **profiles.type = 'admin'**: Verifies the user has admin privileges

## Alternative: If you want to allow admins to update status, reviewed_by, and reviewed_at only

If you want more granular control, you can create a policy that only allows updating specific fields:

```sql
-- More restrictive: Only allow updating status, reviewed_by, and reviewed_at
CREATE POLICY "Admins can update review fields"
ON public.store_applications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.type = 'admin'
  )
);
```

Note: This still allows updating all fields. If you need field-level restrictions, you'll need to use a database trigger or function.

## Testing

After adding the policy:

1. Log in as an admin user
2. Navigate to Review Applicants
3. Open an application
4. Click Accept or Reject
5. Verify the status updates and reviewer info is saved

## Current Policies Summary

Your current policies are:

- ✅ **SELECT**: Anyone can view all applications (public)
- ✅ **INSERT**: Users can submit applications (public)
- ⚠️ **UPDATE**: Only store owners can update their own store (needs admin policy added)

After adding the admin policy above, admins will be able to update any application to accept/reject it.
