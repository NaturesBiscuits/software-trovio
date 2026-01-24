
Expo CLI
bash-  npm install -g expo-cli
install independencies - npm install



What is it all about ...

   Trovio is a location-based store discovery and recommendation platform designed to connect users with nearby businesses that match their interests, preferences, and behavior.
   The system combines geospatial ranking, content-based personalization, and collaborative filtering to produce meaningful, adaptive recommendations.

1. Application Overview

   Trovio provides two primary recommendation feeds:
   For You – a personalized feed tailored to each user
   Discover – a non-personalized, exploratory feed based on location and popularity
   
   The application is built with:
   Frontend: React Native (Expo)
   Backend: Supabase (PostgreSQL + Storage)
   Authentication: Supabase Auth
   Media Storage: Supabase Storage
   Recommendation Engine: SQL-based ranking with precomputed CF scores


2. Core Database Structure
   2.1 User-Related Tables
   
   auth.users - System authentication table (managed by Supabase).
   profiles - Stores public user information.

   | Column       | Purpose                          |
   | ------------ | -------------------------------- |
   | `id`         | User ID (FK → auth.users)        |
   | `username`   | Public username                  |
   | `full_name`  | Display name                     |
   | `avatar_url` | Path to profile image in storage |
   | `role`       | customer / proprietor            |
   | `type`       | user / admin                     |
   | `updated_at` | Profile update timestamp         |


2.2 Preference & Interaction Tables
   user_tags - Stores user-selected interest tags
   
   | Column    | Purpose       |
   | --------- | ------------- |
   | `user_id` | User          |
   | `tag_id`  | Tag reference |


tags Defines tags and their associated categories.

   | Column       | Purpose        |
   | ------------ | -------------- |
   | `name`       | Tag name       |
   | `categories` | Category array |


user_category_scores - Aggregated preference weights per user.

   | Column     | Purpose           |
   | ---------- | ----------------- |
   | `user_id`  | User              |
   | `category` | Category          |
   | `score`    | Preference weight |


engagement_events - Tracks user behavior.

   | Column       | Purpose                            |
   | ------------ | ---------------------------------- |
   | `user_id`    | User                               |
   | `store_id`   | Store                              |
   | `engagement` | visit / favorite / promotion_click |
   | `created_at` | Timestamp                          |

2.3 Store-Related Tables
store_applications - Holds store data and application status.

   | Column                   | Purpose                       |
   | ------------------------ | ----------------------------- |
   | `id`                     | Store ID                      |
   | `store_name`             | Store name                    |
   | `tags`                   | Store tags                    |
   | `latitude` / `longitude` | Location                      |
   | `status`                 | pending / accepted / rejected |

Only accepted stores are visible in recommendation feeds.


3. Recommendation Algorithms
4. 3.1 For You Algorithm (Personalized)

The For You feed is a hybrid recommendation algorithm combining:
   Location relevance
   Content-based personalization
   Collaborative filtering (optional boost)

Inputs
   User location
   User tags and categories
   Store tags and categories
   Engagement history
   CF similarity scores

Output
   Ordered list of store_id values (ranking preserved)
   

3.1.1 For You Scoring Components

   | Component      | Description                         |
   | -------------- | ----------------------------------- |
   | Distance Score | Penalizes far stores                |
   | Tag Score      | Overlap between user and store tags |
   | Category Score | Weighted category relevance         |
   | CF Score       | Boost from similar users’ behavior  |


3.1.2 For You Final Score
   FinalScoreu,s​=0.30⋅Ds​+0.35⋅Tu,s​+0.20⋅Cu,s​+0.15⋅CFu,s
      𝐷𝑠 = normalized distance score
      𝑇u,s = tag match score
      𝐶u,s = category relevance score
      𝐶𝐹u,s = collaborative filtering score'
      
3.2 Discover Algorithm (Exploratory)

The Discover feed is designed for exploration and cold-start resilience.
Discover Ranking Factors
   Distance from user
   Store popularity (favorites & visits)
   Active promotions
   Tag/category relevance (light weighting)
This ensures that even new users receive meaningful suggestions.


4. Collaborative Filtering (CF)
   
4.1 CF Design
   
   Trovio uses item-based collaborative filtering implemented via precomputation.
   
   CF answers the question:
   
   “What stores do users with similar behavior also like?”

4.2 CF Data Sources

   | Table                | Usage                     |
   | -------------------- | ------------------------- |
   | `engagement_events`  | Shared store interactions |
   | `user_tags`          | Behavioral similarity     |
   | `store_applications` | Store metadata            |


4.3 CF Precomputation Table

   | Column       | Purpose                    |
   | ------------ | -------------------------- |
   | `user_id`    | Target user                |
   | `store_id`   | Recommended store          |
   | `cf_score`   | Strength of recommendation |
   | `updated_at` | Refresh timestamp          |


4.4 CF Logic (Conceptual)
If:
   User A and User B like the same stores
   User B likes an additional store

Then:
   That store receives a positive CF boost for User A
Views contribute less weight than favorites.

5. Cold Start Strategy
Cold start is handled server-side:
   If a user has no tags AND no engagements:
   The system returns popular nearby stores
   Once the user interacts:
   The full For You algorithm takes over automatically
   No frontend logic is required.

6. Media & Profile Handling
   Profile images are uploaded to Supabase Storage
   Database stores storage paths, not public URLs
   Public URLs are generated dynamically at runtime
   Images are compressed client-side before upload

7. Data Flow Summary
   Frontend calls a single RPC function
   Database decides:
   Personalized feed OR fallback feed
   Returns ordered store IDs
   Frontend fetches full store records
   Order is preserved end-to-end

8. Design Principles
   SQL-first algorithms (transparent & debuggable)
   Precomputed CF (performance & scalability)
   Deterministic ranking (stable UX)
   Separation of concerns (routing vs ranking)

9. Why This Approach Works
   Personalized without overfitting
   Scales with user growth
   Cold-start safe
   Minimal frontend complexity
   Fully auditable recommendation logic​
​
