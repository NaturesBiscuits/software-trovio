# Trovio Risk Register

Risk score is calculated as Likelihood x Impact.

| Risk | Likelihood (1-5) | Impact (1-5) | Score | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- |
| Location permission is denied, reducing location-based discovery quality. | 4 | 4 | 16 | Provide fallback popular spaces and support manual location selection later. | John Flores |
| Supabase row-level security policies block valid app reads or writes. | 3 | 5 | 15 | Review policies per feature, test with user roles, and document required access rules. | Art J |
| Listing data is incomplete or inconsistent across owners. | 4 | 3 | 12 | Add required fields, validation, and admin review before public listing visibility. | clydeee03 |
| Recommendation ranking feels irrelevant for new users. | 3 | 4 | 12 | Use nearby and popular spaces as a cold-start fallback until preferences and behavior exist. | Juan Sapanaterm |
| Sprint 1 scope expands beyond team capacity after change requests. | 3 | 4 | 12 | Limit Sprint 1 to six stories, track added points, and move lower-priority work if needed. | John Flores |
| Image uploads or storage paths fail during listing creation. | 3 | 4 | 12 | Validate file types, compress images, store paths consistently, and test Supabase Storage access. | clydeee03 |
| Availability dates or time slots are inaccurate, causing request conflicts. | 3 | 5 | 15 | Require owners to update availability and prevent requests for unavailable time ranges. | Art J |
| Map or distance calculations are inaccurate due to missing coordinates. | 2 | 4 | 8 | Validate coordinates, show clear fallback location text, and test sample listings. | Juan Sapanaterm |
| Admin review delays prevent useful listings from appearing in Discover. | 2 | 3 | 6 | Keep review status visible and prioritize review tools after listing submission work. | John Flores |
| Git workflow is bypassed, causing unreviewed changes on the main branch. | 2 | 4 | 8 | Require all changes to go through pull requests with templates, review notes, and testing evidence. | John Flores |
