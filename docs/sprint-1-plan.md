# Sprint 1 Plan

## Sprint Goal

Build the first usable discovery flow for Trovio so users can set basic preferences, browse nearby spaces, filter results, inspect details, and understand location context.

## Sprint Scope

| Story ID | Story | Priority | Points | Sprint Outcome |
| --- | --- | --- | --- | --- |
| ST-001 | Browse nearby available spaces in Discover | High | 5 | Users can open Discover and see relevant available spaces. |
| ST-003 | Filter spaces by category and tags | High | 5 | Users can narrow listings by need and preference. |
| ST-004 | View detailed space information | High | 5 | Users can evaluate a space before saving or requesting it. |
| ST-009 | Onboarding for location and preferences | High | 5 | New users can provide signals for recommendations. |
| ST-011 | Map-based search and distance information | Medium | 5 | Users can understand where listed spaces are located. |

Total planned effort: 25 story points.

## Deliverables

- Discover feed with nearby available spaces.
- Category and tag filtering controls.
- Space detail page with listing information and availability.
- New-user onboarding for location permission and preference tags.
- Map or location view with distance context for listings.

## Definition of Done

- Selected stories meet their acceptance criteria from `docs/backlog.md`.
- Main discovery paths work for new users and returning users.
- Empty, loading, and error states are handled.
- Screens remain usable on common mobile viewport sizes.
- Changes are reviewed before merging.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Location permission is denied by the user. | Fall back to popular spaces and allow manual location search later. |
| Listing data is incomplete. | Use validation and graceful placeholders for optional fields. |
| Filters make the result set empty. | Provide an empty state with a reset action. |
| Map implementation takes longer than expected. | Prioritize distance display and basic markers before advanced route features. |

## Sprint 1 Task Breakdown

| Task | Owner Role | Related Story |
| --- | --- | --- |
| Confirm Discover data fields and accepted listing rules. | Product Owner, Backend Lead | ST-001 |
| Implement nearby listing query and fallback behavior. | Backend Lead, Recommendation Engineer | ST-001 |
| Build category and tag filter UI. | Frontend Lead, UX/UI Designer | ST-003 |
| Connect filters to listing results. | Frontend Lead, Backend Lead | ST-003 |
| Build space detail screen layout and actions. | Frontend Lead | ST-004 |
| Add onboarding preference selection flow. | Frontend Lead, Product Owner | ST-009 |
| Store selected user tags and categories. | Backend Lead | ST-009 |
| Add map markers or distance context to result cards. | Frontend Lead | ST-011 |
| Validate acceptance criteria and document issues. | QA Tester | All Sprint 1 stories |

## Sprint Review Checklist

- Demonstrate onboarding with selected preferences.
- Demonstrate Discover with nearby spaces.
- Apply and clear filters.
- Open a space detail page from Discover.
- Show distance or map context for a listed space.
- Review known limitations and backlog updates.
