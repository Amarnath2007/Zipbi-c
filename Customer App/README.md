# ZipBi Customer App

**An AI-assisted café discovery and table-ordering platform initially targeting Coimbatore, Tamil Nadu.**

---

## 📱 About ZipBi

ZipBi connects customers with verified local cafés, starting with the college and commercial hub surrounding **PSG College of Arts and Science (PSG CAS), SITRA, Civil Aerodrome, and Avinashi Road** in Coimbatore.

Built with a native Flutter frontend and a unified Node.js/Prisma backend, the application delivers:
* **Accurate Haversine Distance Calculation:** Straight-line distances computed dynamically from the user's GPS coordinates, with a graceful fallback to PSG CAS / SITRA when location permission is not granted.
* **Verified Café Directory:** Curated from on-ground research and public sources (timings, genuine reviewer mentions, and official menus).
* **Text-Based Menu Browsing:** Strictly adheres to displaying **no individual food photographs in menus** (item name, description, category, price, and availability only). Café photography is preserved exclusively for café cover cards and detail profiles.
* **Table-Number Dine-In Ordering:** Customers browse menus, select their table number (manual entry or quick-pick), and place orders directly to the café kitchen.
* **Direct Counter Payments:** Supports cash and UPI payments directly at the counter; no mandatory online food payments.
* **Partner Status Moderation:** Enforces strict ordering boundaries (Unclaimed, Verification Pending, Verified, and Active Partner). Only active partner cafés accept customer orders.

---

## 🎨 UI Design System

The application strictly follows the provided 16-screen mobile reference design:
1. **Splash Screen:** Authentic ZipBi logo, brand title, and loading indicator.
2. **Onboarding (3 Screens):** Illustrated walkthroughs of café discovery, favorites, and ordering.
3. **Location Permission:** Clear explanation with Allow and Not Now (graceful PSG CAS fallback).
4. **Home Screen:** Location selector, search bar, category shortcuts, Featured Near You, and Popular Nearby.
5. **Search Screen:** Real-time search against café names, cuisines, areas, and food categories.
6. **Filters Screen:** Category chips, distance slider (0–5 km), rating filters, Open Now, and Has Menu toggles.
7. **Cafés List (Explore):** Full distance-sorted directory with opening status badges and verified ratings.
8. **Café Details:** High-resolution cover photo, verified phone number (tap-to-call), directions, Menu, About, and Reviews tabs.
9. **Menu Categories:** Categorized breakdown (Pasta, Snacks, Burgers, Sandwiches, Beverages).
10. **Menu Items (No Images):** Clean text-based item cards with price, dietary indicators (Veg/Non-Veg), and Add buttons.
11. **Favourites:** Local and cloud-persisted saved cafés.
12. **Customer Profile & Settings:** Profile editing, location preferences, dark mode toggle, and legal policies.
13. **Order History:** Past orders with live status badges.
14. **Cart & Table Selection:** Dine-in table entry, cooking instructions, bill breakdown (with 5% GST), and order confirmation.
15. **Order Tracking:** Real-time status progression from kitchen acceptance to table service.

---

## 🏗️ Project Structure

```
.
├── android/                 # Native Android build & manifest configuration
├── ios/                     # Native iOS build & Info.plist configuration
├── assets/
│   ├── images/
│   │   ├── logo/            # Authentic original ZipBi branding
│   │   └── cafes/           # High-resolution café photographs
│   └── data/
│       └── cafes.json       # Bundled offline-first Coimbatore dataset
├── backend/                 # Unified Node.js + Express + Prisma API
│   ├── prisma/              # Prisma schema & migrations
│   ├── src/                 # Controllers, routes, middleware, and services
│   ├── scripts/             # Database seed runner
│   └── tests/               # Backend unit & integration test suite
├── data/
│   ├── cafes.json           # Master structured café dataset
│   └── cafe-research-report.md # Comprehensive café research audit
├── docs/
│   ├── implementation-plan.md # Screen-by-screen architectural plan
│   ├── architecture.md      # Ecosystem and multi-app design
│   ├── database-schema.md   # PostgreSQL/Prisma relational schema
│   ├── api-documentation.md # REST API endpoint specifications
│   └── deployment-guide.md  # Android, iOS, and Backend release guide
├── lib/                     # Flutter customer application code
│   ├── core/                # Theme, constants, typography, Haversine engine
│   ├── data/                # Models, services, API client, storage
│   ├── providers/           # Provider state management (Cart, Location, Cafe, Order, Auth)
│   ├── screens/             # 16 UI reference screens + ordering & auth workflows
│   └── widgets/             # Reusable custom UI components
└── test/                    # Dart unit and widget tests
```

---

## 🚀 Getting Started

### 1. Prerequisites
* **Flutter SDK:** 3.41+ (Dart 3.11+)
* **Node.js:** v20+ or v24 LTS
* **npm:** v10+

### 2. Running the Backend API
```bash
cd backend
npm install

# Run automated tests
npm test

# Seed verified cafes
npm run seed

# Start API server (runs on http://localhost:5000)
npm start
```

### 3. Running the Flutter Customer App
```bash
# In the project root:
flutter pub get

# Run unit tests
flutter test

# Run app on connected emulator, desktop, or device
flutter run
```

---

## 🧪 Testing Suite

### Backend Tests
7 automated unit and integration tests covering:
* Haversine distance accuracy against verified PSG CAS, SITRA, and KMCH coordinates.
* Health-check endpoint.
* Customer registration, JWT issuance, and authentication middleware.
* Café distance-sorting and query filtering.
* Absence of individual food photographs in menu payloads.
* Business rule enforcement: Non-partner orders rejected with HTTP 403 Forbidden.
* Active partner table order creation and order history tracking.

Run:
```bash
cd backend && npm test
```

### Flutter Tests
Unit and widget tests covering:
* Client-side Haversine calculation and distance formatting.
* Cart calculations (quantities, item subtotals, 5% GST, grand total).
* Café model parsing and verification status checks.
* Splash screen UI rendering.

Run:
```bash
flutter test
```

---

## 📄 Documentation Reference

* **Implementation Plan:** [`docs/implementation-plan.md`](docs/implementation-plan.md)
* **Architecture Guide:** [`docs/architecture.md`](docs/architecture.md)
* **API Documentation:** [`docs/api-documentation.md`](docs/api-documentation.md)
* **Database Schema:** [`docs/database-schema.md`](docs/database-schema.md)
* **Deployment Guide:** [`docs/deployment-guide.md`](docs/deployment-guide.md)
* **Café Research Report:** [`data/cafe-research-report.md`](data/cafe-research-report.md)
