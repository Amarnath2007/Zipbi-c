# ZipBi Customer App — Implementation Plan

**Project:** ZipBi Customer App (AI-Assisted Café Discovery & Ordering Platform)  
**Initial Market:** Coimbatore, Tamil Nadu (Focus Area: PSG CAS / SITRA / Civil Aerodrome / Avinashi Road)  
**Author:** ZipBi Engineering Team  
**Date:** November 2026  
**Status:** Approved for Implementation  

---

## 1. Executive Summary & Vision

ZipBi is an AI-assisted café discovery and table-ordering platform designed to revolutionize the dining experience in Coimbatore, starting with the college and commercial hub surrounding PSG College of Arts & Science (PSG CAS) and SITRA. 

The **ZipBi Customer App** is a native Flutter mobile application providing:
1. Fast, location-aware café discovery with accurate straight-line Haversine distance calculations.
2. Verified café information (timings, genuine reviewer mentions, and official menus where published).
3. Text-based menu exploration (**strictly adhering to no individual food photographs in menu items**).
4. Seamless table-number-based dine-in ordering (supporting manual table entry and future QR scans).
5. Offline-first favorites persistence and customer profile management.
6. A modular backend architecture (Node.js, Express, Prisma, PostgreSQL/Supabase) designed to scale to the upcoming Merchant App and Admin Panel.

---

## 2. Technical Stack & Architecture

### 2.1 Technology Matrix

| Layer | Component | Technology | Rationale |
|---|---|---|---|
| **Mobile App** | Cross-Platform Framework | **Flutter 3.41+ (Dart 3.11+)** | High performance, single codebase for iOS and Android, pixel-perfect rendering of the reference UI. |
| **State Management** | App State & Reactive Flow | **Provider + ChangeNotifier** | Predictable, reactive, lightweight, decoupled business logic without boilerplate. |
| **Local Storage** | Client-side Persistence | **shared_preferences / flutter_secure_storage** | Local persistence for favorites, search history, auth tokens, and location settings. |
| **Location Services** | Geolocation & Coordinates | **geolocator** | High-accuracy GPS positioning with automatic graceful fallback to PSG CAS / SITRA. |
| **Backend API** | REST API Server | **Node.js (v24 LTS) + Express** | High throughput, asynchronous I/O, rapid endpoint development. |
| **Database & ORM** | Relational Database & ORM | **PostgreSQL (Supabase compatible) + Prisma ORM** | Type-safe queries, automated migrations, relational integrity for multi-tenant cafes, menus, and orders. |
| **Authentication** | Customer Identity & Sessions | **JWT (JSON Web Tokens) + bcryptjs** | Stateless, secure, password hashing with salt rounds, standard Bearer authorization. |
| **Push Notifications** | Device Notifications | **Firebase Cloud Messaging (FCM)** | Cross-platform push notifications for live order status updates. |

### 2.2 System Architecture Diagram

```
+---------------------------------------------------------------------------------+
|                               ZIPBI ECOSYSTEM                                   |
+---------------------------------------------------------------------------------+
|                                                                                 |
|   +--------------------------+    +-----------------------+    +-------------+  |
|   |    ZipBi Customer App    |    |  ZipBi Merchant App   |    | ZipBi Admin |  |
|   |      (Flutter Native)    |    |     (Future Phase)    |    |    Panel    |  |
|   +------------+-------------+    +-----------+-----------+    +------+------+  |
|                |                              |                       |         |
|                | HTTPS REST                   | HTTPS REST            | HTTPS   |
|                v                              v                       v         |
|   +-------------------------------------------------------------------------+   |
|   |                    ZipBi Unified Express API Gateway                    |   |
|   |  - Auth Middleware (JWT)                                                |   |
|   |  - Rate Limiter & Security Headers (Helmet, CORS)                       |   |
|   |  - Cafe Discovery & Spatial Sorting (Haversine)                         |   |
|   |  - Menu Service                                                         |   |
|   |  - Order Lifecycle Engine                                               |   |
|   +------------------------------------+------------------------------------+   |
|                                        |                                        |
|                                        | Prisma Client                          |
|                                        v                                        |
|   +-------------------------------------------------------------------------+   |
|   |                       PostgreSQL Relational DB                          |   |
|   |  (Users, Cafes, Categories, MenuItems, Tables, Orders, OrderItems)      |   |
|   +-------------------------------------------------------------------------+   |
+---------------------------------------------------------------------------------+
```

---

## 3. UI Design Specifications & Screen Structure

The app adheres strictly to the provided 16-screen reference design and implements the missing authentication and ordering workflows.

### 3.1 Design System & Tokens
* **Primary Emerald Green:** `#029349` (Accent `#02C553`, Deep Forest `#014829`)
* **Background:** `#FFFFFF`
* **Card & Surface Background:** `#FFFFFF` / Soft neutral `#F9FAFB`
* **Border Color:** `#E5E7EB`
* **Primary Text:** `#1F2937`
* **Secondary Text:** `#6B7280`
* **Status Colors:**
  * Open Badge: Background `#ECFDF5`, Text `#029349`
  * Closed Badge: Background `#FEF2F2`, Text `#EF4444`
  * Favorite Red: `#EF4444`
* **Typography:** Clean modern Sans-Serif with strict font hierarchy (Bold 24pt, Semi-bold 18pt, Medium 14pt, Regular 12pt).
* **Border Radius:** `16px` for cards, `24px` for pill buttons, `12px` for chips.

### 3.2 Screen Matrix

| # | Screen Name | Route | Key Features & Elements |
|---|---|---|---|
| **1** | **Splash Screen** | `/splash` | Original ZipBi logo (`public/ZipBi icon-logo.png`), brand title, tagline *"Discover great cafés around you"*, animated pulse/loader. |
| **2-4** | **Onboarding 1, 2, 3** | `/onboarding` | 3 swipeable slides, illustrated cards, skip button, active green dot indicators, "Next →" / "Get Started →" buttons. |
| **5** | **Location Permission** | `/location-permission` | Map pin graphic, explanation of distance-based discovery, "Allow Location" button, "Not Now" (graceful fallback). |
| **6** | **Home Screen** | `/home` | Location selector dropdown (default: *PSG CAS, Coimbatore*), search bar, category shortcuts (Cafés, Restaurants, Tea Shops, Bakeries, More), "Featured Near You" cards with photos and distance badges, "Popular Nearby" grid, 4-tab bottom navigation bar. |
| **7** | **Search Screen** | `/search` | Live search input against actual café names, areas, cuisines, and food items; Recent search history with "Clear All"; Popular suggested search tags. |
| **8** | **Filters Modal / Screen** | `/filters` | Category multi-select chips, Distance slider (0 to 5 km), Rating filter (Any, 4.0+, 4.5+), Open Now toggle, Has Menu toggle, Apply/Clear buttons. |
| **9** | **Café Listings (Explore)** | `/explore` | Full list of nearby cafés with thumbnail photos, distance in km, verified ratings, opening badges, tags, and map toggle. |
| **10** | **Café Details** | `/cafe-details` | Full-width cover photo, back/share/favorite buttons, name, address, distance, opening hours, verified phone with direct tap-to-call, directions link, tabs: [Menu], [About], [Reviews]. Partner status badge. |
| **11** | **Menu Categories** | `/menu-categories` | Horizontal category chips (All, Pasta, Snacks, Burgers, Beverages, etc.), category list with item counts. |
| **12** | **Menu Items (No Images!)** | `/menu-items` | **Strictly text-only menu cards**: Item name, description, verified price (e.g. ₹180), dietary badge (Veg/Non-veg), availability status, and "Add to Cart" button. |
| **13** | **Favourites** | `/favourites` | Saved cafés and items tab, persisted across sessions in local storage and backend sync. |
| **14** | **Customer Profile** | `/profile` | User avatar, name, email/phone, Edit Profile, Saved Cafés, Order History, Notifications, Help & Support, About ZipBi, Log Out. |
| **15** | **Settings** | `/settings` | Default location preference, Dark Mode toggle, Notification preferences, Language picker, Privacy Policy, Terms of Service. |
| **16** | **Order History** | `/orders` | Empty state illustration (*"No Orders Yet"*), past order cards with status badges (Received, Preparing, Ready, Completed, Cancelled). |
| **17** | **Customer Login** | `/login` | Phone/Email input, password/OTP field, validation, "Forgot Password?", "Sign Up" link. |
| **18** | **Customer Registration** | `/register` | Full name, phone number, email, password, terms acceptance. |
| **19** | **Cart & Order Review** | `/cart` | Item list with quantity steppers (`+`/`-`), special cooking instructions, table number input (manual entry supported), order bill breakdown (Item Total, Taxes, Net Amount). Notice: Direct cash/UPI payment at café counter. |
| **20** | **Order Confirmation & Tracking** | `/order-tracking` | Real-time status tracker (Order Placed -> Kitchen Accepted -> Preparing -> Ready to Serve), café contact, table number reminder. |

---

## 4. Location, Reference Points & Haversine Distance

### 4.1 Reference Location
* **PSG College of Arts and Science (PSG CAS) Main Gate:**  
  * Coordinates: `11.032688° N, 77.034577° E` (Avinashi Road, Civil Aerodrome Post, Coimbatore 641014)
* **Default Manual Fallback Area:**  
  * *PSG CAS / SITRA, Coimbatore* (`11.036875° N, 77.036211° E`)

### 4.2 Distance Calculation Formula (Haversine)
Straight-line distance $d$ in kilometers between two GPS points $(\phi_1, \lambda_1)$ and $(\phi_2, \lambda_2)$:
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$c = 2 \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c$$
Where $R = 6371.0\text{ km}$ (mean radius of Earth).

### 4.3 Rules for Distance Handling
1. If GPS is allowed, calculate distances dynamically from user's current latitude and longitude.
2. If GPS is denied or unavailable, use the selected reference point (PSG CAS / SITRA default) and display an *"approx. from SITRA"* label.
3. Distances are explicitly labeled as straight-line distance, not driving or walking distance.
4. Comprehensive unit tests verify distances against known reference points (e.g. PSG CAS to KMCH = ~1.08 km; PSG CAS to SITRA = ~0.49 km).

---

## 5. Café Verification & Partner Workflow

To prevent customer dissatisfaction, every café is assigned a verification status:

| Status | Ordering Allowed? | Display Behavior |
|---|---|---|
| **Active Partner** | **Yes** | Full ordering enabled. Real menu, table number selection, cart, direct transmission to merchant dashboard. |
| **Verified** | **No** | Information, timings, photos, and approximate cost verified. Menu shown as view-only directory; banner explains: *"Online ordering not yet active for this café"*. |
| **Verification Pending** | **No** | Listed with known details (e.g. from research PDF); unverified fields hidden or marked "Under Verification". |
| **Unclaimed** | **No** | Community listing; ordering disabled. |
| **Suspended** | **No** | Hidden from customer search. |

The backend enforces `is_ordering_enabled = true` and `verification_status = 'ACTIVE_PARTNER'` before accepting any order creation request.

---

## 6. Café Research & Import Strategy

### 6.1 Extracted Dataset from `List- Sitra and surroundings.pdf`
1. Primary 10 SITRA Cafés:
   * The German Cafe (Active Partner Candidate, 0.4 km, published magicpin prices + reviewer dishes)
   * Rest In Peace Cafe (Verified, 0.3 km, reviewer dishes)
   * Refresh Cafe (Verified, 0.25 km, reviewer dishes)
   * Zesty Mania Cafe (Verified, 0.5 km)
   * Cafe Talks (Verified, 0.5 km, 10-page photo menu noted)
   * Juice World Fresh 'N' Juicy (Verification Pending, branch location unconfirmed)
   * Friends Zone Cafe (Unclaimed, 0.9 km)
   * Dee Chill Cafe (Unclaimed, 0.9 km)
   * Terminal 2 (Verified, 1.1 km, 24/7 hours, 8-page photo menu noted)
   * Shadow Lights Cafe (Verified, 1.3 km, 9-page photo menu noted)
2. Very small SITRA Cafés (1-5 reviews):
   * Den Cafe (0.5 km, Masakalipalayam Rd)
   * Dark Knight (0.5 km, Avinashi Rd near Aroma Bakery, Batman-themed)
   * Rain Cafe (0.5 km, Ashok Layout)
   * Sandsha Cafe (0.7 km, TNHB Colony)
   * Kovai Brews (1.3 km, Avinashi Rd near KMCH)
3. Surrounding area eateries (labelled with reviewer-quoted prices only):
   * Bharath Mess, Pick 'N' Mix, Melt and Mingle, Downtown Bistro, Juicy Burger, Shaws Cafe, Martram's, Shake Boba, Mr Boba Shakes, Momo Zone.

### 6.2 Data Quality & Integrity Rules
* Never convert a reviewer's estimated dish price into an official published menu item unless confirmed.
* Mark official menus with `is_verified_menu: true`.
* For partner cafés (like The German Cafe), populate the authentic dishes and categories (Pasta, Snacks, Burgers, Sandwiches, Beverages) from the verified research.

---

## 7. Backend & API Architecture

### 7.1 Database Schema (Prisma PostgreSQL)
* **User:** `id`, `name`, `email`, `phone`, `password_hash`, `role` (CUSTOMER, MERCHANT, ADMIN), `created_at`
* **Cafe:** `id`, `name`, `slug`, `description`, `cover_image`, `address`, `area`, `latitude`, `longitude`, `phone`, `opening_hours`, `cost_for_two`, `verification_status`, `is_ordering_enabled`, `rating`, `review_count`
* **MenuCategory:** `id`, `cafe_id`, `name`, `sort_order`
* **MenuItem:** `id`, `category_id`, `name`, `description`, `price`, `is_veg`, `is_available`
* **CafeTable:** `id`, `cafe_id`, `table_number`, `qr_code_token`
* **Order:** `id`, `order_number`, `customer_id`, `cafe_id`, `table_number`, `status` (PENDING, ACCEPTED, PREPARING, READY, COMPLETED, CANCELLED), `total_amount`, `payment_method` (CASH_OR_UPI_AT_COUNTER), `special_notes`, `created_at`
* **OrderItem:** `id`, `order_id`, `menu_item_id`, `quantity`, `price_per_unit`, `item_name`

### 7.2 REST Endpoints
* `POST /api/v1/auth/register` — Customer account creation
* `POST /api/v1/auth/login` — Customer login & JWT generation
* `GET  /api/v1/auth/me` — Current customer profile
* `GET  /api/v1/cafes` — Filtered & distance-sorted café directory
* `GET  /api/v1/cafes/:id` — Café details & metadata
* `GET  /api/v1/cafes/:id/menu` — Structured categorized menu
* `POST /api/v1/orders` — Create new table order
* `GET  /api/v1/orders/my-orders` — Customer order history
* `GET  /api/v1/orders/:id` — Real-time order tracking details
* `GET  /api/v1/health` — Service health check

---

## 8. Testing & Deployment Strategy

### 8.1 Testing Strategy
1. **Dart Unit Tests:**
   * Haversine distance calculations and sorting.
   * Cart calculation (totals, quantities, removal).
   * Filter and search logic.
2. **Backend Integration Tests:**
   * Auth flow (registration, JWT generation, invalid passwords).
   * Order placement restriction on unverified/non-partner cafés.
   * Health endpoint.
3. **Flutter Widget & UI Tests:**
   * Bottom navigation switching.
   * Menu display (verifying absence of food image widgets).

### 8.2 Deployment Strategy
* **Backend:** Ready for deployment on Supabase/Render/Railway or standard Docker container.
* **Database:** Prisma migration scripts and automatic seed runner.
* **Flutter:** Android Release APK build configuration (`android/app/build.gradle`), native app icons with ZipBi branding, permissions setup in `AndroidManifest.xml` and `Info.plist`.

