# Sprint 1 Plan

## Sprint Goal

Build the first usable discovery flow for Trovio so users can set basic preferences, browse nearby spaces, filter results, inspect details, and understand location context.

## Sprint Scope

| Story ID | Story | Priority | Points | Owner | Sprint Outcome |
| --- | --- | --- | --- | --- | --- |
| ST-001 | Browse nearby available spaces in Discover | High | 5 | John Flores | Users can open Discover and see relevant available spaces. |
| ST-003 | Filter spaces by category and tags | High | 5 | John Flores | Users can narrow listings by need and preference. |
| ST-004 | View detailed space information | High | 5 | Juan Sapanaterm | Users can evaluate a space before saving or requesting it. |
| ST-009 | Onboarding for location and preferences | High | 5 | clydeee03 | New users can provide signals for recommendations. |
| ST-011 | Map-based search and distance information | Med | 5 | Juan Sapanaterm | Users can understand where listed spaces are located. |
| ST-013 | Show available dates and time slots | High | 5 | Art J | Users can avoid requesting unavailable rental periods. |

Total planned effort: 30 story points.

## Deliverables

- Discover feed with nearby available spaces.
- Category and tag filtering controls.
- Space detail page with listing information and availability.
- Availability date or time-slot display on the detail flow.
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

| Task | Owner | Related Story |
| --- | --- | --- |
| Confirm Discover data fields and accepted listing rules. | John Flores | ST-001 |
| Implement nearby listing query and fallback behavior. | clydeee03 | ST-001 |
| Build category and tag filter UI. | John Flores | ST-003 |
| Connect filters to listing results. | John Flores, clydeee03 | ST-003 |
| Build space detail screen layout and actions. | Juan Sapanaterm | ST-004 |
| Add onboarding preference selection flow. | clydeee03 | ST-009 |
| Store selected user tags and categories. | clydeee03 | ST-009 |
| Add map markers or distance context to result cards. | Juan Sapanaterm | ST-011 |
| Define and display availability dates or time slots. | Art J | ST-013 |
| Validate acceptance criteria and document issues. | Juan Sapanaterm | All Sprint 1 stories |

## Change Request Simulation

CR-001 adds ST-013 so users can see available dates or time slots before making a rental request. The story is added to Sprint 1 because it supports the space detail flow and reduces request conflicts, increasing the sprint plan from 25 to 30 story points.

## Sprint Review Checklist

- Demonstrate onboarding with selected preferences.
- Demonstrate Discover with nearby spaces.
- Apply and clear filters.
- Open a space detail page from Discover.
- Show available dates or time slots on a space detail page.
- Show distance or map context for a listed space.
- Review known limitations and backlog updates.
