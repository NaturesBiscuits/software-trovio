# Trovio Product Backlog

Trovio is a location-based discovery and recommendation app for finding spaces such as storage areas, parking spots, and commercial spaces. The backlog below focuses on helping users discover, compare, save, and rent available spaces while improving recommendation quality through preferences, distance, and behavior.

## 15-Week Scope Decision

The project scope is realistic for a 15-week build because Sprint 1 focuses on discovery, filtering, onboarding, and space details before moving into rental requests, owner listing tools, admin review, and recommendation improvements. Larger production concerns such as payments, legal contracts, and complex dispute handling are outside the initial course scope.

## Story Summary

| ID | User Story | Priority | Points |
| --- | --- | --- | --- |
| ST-001 | As a user, I want to browse nearby available spaces in Discover so that I can quickly see useful options around me. | High | 5 |
| ST-002 | As a user, I want a personalized For You feed so that the app recommends spaces based on my location, preferences, and activity. | High | 8 |
| ST-003 | As a user, I want to filter spaces by category and tags so that I can narrow results to storage, parking, or commercial needs. | High | 5 |
| ST-004 | As a user, I want to view detailed space information so that I can decide whether a listing fits my requirements. | High | 5 |
| ST-005 | As a user, I want to save favorite spaces so that I can revisit promising listings later. | Med | 3 |
| ST-006 | As a user, I want to request or rent an available space so that I can reserve it for my intended use. | High | 8 |
| ST-007 | As a space owner, I want to create a space listing so that other users can discover and rent my available space. | High | 8 |
| ST-008 | As a space owner, I want to manage availability, pricing, and listing status so that my space information stays accurate. | Med | 5 |
| ST-009 | As a new user, I want onboarding for location and preferences so that Trovio can personalize recommendations from the start. | High | 5 |
| ST-010 | As a user, I want recommendations improved by similar user behavior so that I can discover spaces I may not search for directly. | Med | 8 |
| ST-011 | As a user, I want map-based search and distance information so that I can understand where each space is located. | Med | 5 |
| ST-012 | As an admin, I want to review submitted listings so that unsafe, incomplete, or invalid spaces are not published. | High | 5 |
| ST-013 | As a user, I want to see available dates and time slots for a space so that I can avoid requesting unavailable rental periods. | High | 5 |

## Acceptance Criteria

### ST-001: Browse Nearby Available Spaces

- Discover shows available spaces sorted by distance and popularity.
- Each result includes space name, category, distance, price or rate when available, and a primary image.
- Users with no prior activity still see meaningful nearby and popular spaces.
- Results exclude unavailable, rejected, or inactive listings.

### ST-002: Personalized For You Feed

- The For You feed ranks spaces using distance, user tags, category scores, and behavior signals.
- The feed updates after users save, view, or interact with spaces.
- If a user has no preferences or history, the feed falls back to nearby popular spaces.
- Ranking remains stable enough that users do not see random reshuffling on every refresh.

### ST-003: Category and Tag Filtering

- Users can filter listings by space category such as storage, parking, or commercial.
- Users can select multiple tags to refine results.
- Applied filters are visible and can be removed.
- Empty filter results show a clear empty state and allow users to reset filters.

### ST-004: Space Detail View

- A detail page shows images, location, category, tags, size or capacity, price, availability, and owner-provided notes.
- Users can see whether the space is currently available.
- Users can save or start a rental request from the detail page.
- Missing optional listing fields do not break the layout.

### ST-005: Saved Spaces

- Users can save and unsave spaces from cards and detail pages.
- Saved spaces appear in a dedicated saved list.
- Saved state persists after app restart and login.
- Removed spaces no longer appear in the saved list.

### ST-006: Request or Rent a Space

- Users can submit a rental request for an available space.
- The request includes intended date or time range, user contact information, and optional notes.
- Users receive a confirmation after submitting a request.
- Unavailable spaces cannot be requested.

### ST-007: Create a Space Listing

- Space owners can enter title, category, address or map location, availability, price, description, and images.
- Required fields are validated before submission.
- New listings are submitted for admin review before becoming public.
- Owners can preview listing information before submitting.

### ST-008: Manage Listing Availability and Pricing

- Space owners can edit availability, price, description, images, and listing status.
- Changes are saved and reflected in search and recommendation results.
- Owners can temporarily hide or deactivate a listing.
- Invalid price or availability values are blocked with validation messages.

### ST-009: User Onboarding for Location and Preferences

- New users are asked for location permission in a clear flow.
- Users can select preference tags and categories during onboarding.
- Users can skip preference selection and still use Discover.
- Selected preferences are saved to the user profile and used by For You.

### ST-010: Collaborative Filtering Recommendations

- The system stores user behavior events such as views, saves, and rental interest.
- Recommendation scores can include similar-user behavior as a boost.
- Collaborative filtering does not recommend unavailable or rejected listings.
- The system can refresh collaborative scores without requiring frontend changes.

### ST-011: Map-Based Search and Distance

- Users can view space results on a map.
- Selecting a map marker opens a preview of the space.
- Distance from the user's current or selected location is displayed.
- Users can move between map results and the detail page.

### ST-012: Admin Listing Review

- Admins can view submitted listings awaiting review.
- Admins can approve or reject listings with a reason.
- Approved listings become visible in Discover and For You.
- Rejected listings remain hidden from public results.

### ST-013: Availability Dates and Time Slots

- Space detail pages show available dates or time ranges when the owner has provided them.
- Users cannot submit a request for a date or time marked unavailable.
- Availability information is shown before the user starts a rental request.
- If availability has not been configured, the app shows a clear contact-owner or request-confirmation state.
