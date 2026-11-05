# ZipBi Platform Architecture

## 1. Overview & Multi-App Vision

ZipBi is architected as a modular, unified food-and-beverage platform designed initially for the Coimbatore café ecosystem. The system is designed to support three distinct client applications powered by a single centralized backend and shared database:

1. **ZipBi Customer App (Mobile - Flutter):** Discovery, distance-aware listings, verified menus, and contactless table ordering.
2. **ZipBi Merchant App (Mobile/Web - Planned):** Real-time order reception, kitchen ticket management, menu stock toggles, table QR management, and billing reconciliation.
3. **ZipBi Admin Console (Web - Planned):** Directory moderation, café verification pipeline, dispute resolution, analytics, and platform governance.

---

## 2. Core Architecture Principles

* **Shared Relational Domain:** A single normalized PostgreSQL database stores all entities (Users, Cafes, Menus, Orders, Tables). This prevents data desynchronization between customer, merchant, and admin operations.
* **Stateless RESTful API:** Built on Node.js and Express with JWT Bearer authentication, allowing independent scaling of client apps.
* **Type-Safe Data Layer:** Prisma ORM provides compile-time type validation, transparent schema migrations, and clean relationship joins.
* **Separation of Concerns:** 
  * Presentation Layer: Declarative Flutter widgets with clear separation between state providers and UI components.
  * API Gateway: Input validation, rate limiting, and CORS handling.
  * Service Layer: Business logic (spatial distance calculation, order state transitions, partner verification enforcement).
  * Data Persistence: Indexed PostgreSQL relational tables with foreign keys and cascade rules.

---

## 3. Technology Stack Breakdown

```
+----------------------------------------------------------------------------------+
|                              CLIENT LAYER                                        |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  |                     ZipBi Customer App (Flutter 3.41+)                     |  |
|  |  - Provider (State Management)                                             |  |
|  |  - Geolocator (Positioning) + Haversine Engine                             |  |
|  |  - Dio / Http Client (REST Consumer with Interceptors)                     |  |
|  |  - Shared Preferences (Offline Cache, Local Auth, Favourites)              |  |
|  +----------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------+
                                        |
                                        | HTTPS / JSON
                                        v
+----------------------------------------------------------------------------------+
|                            BACKEND API GATEWAY                                   |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  |                         Node.js (LTS) + Express                            |  |
|  |  - Helmet & CORS Middleware                                                |  |
|  |  - Rate Limiter (express-rate-limit)                                       |  |
|  |  - JSON Web Token (JWT) Authenticator                                      |  |
|  |  - Controllers: AuthController, CafeController, OrderController           |  |
|  +----------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------+
                                        |
                                        | Prisma Query Engine
                                        v
+----------------------------------------------------------------------------------+
|                            DATA PERSISTENCE LAYER                                |
|                                                                                  |
|  +----------------------------------------------------------------------------+  |
|  |                    PostgreSQL Relational Database                          |  |
|  |  - Tables: users, cafes, menu_categories, menu_items, tables, orders       |  |
|  |  - Indexes: Spatial lat/lon, cafe slugs, order customer_id/status          |  |
|  +----------------------------------------------------------------------------+  |
+----------------------------------------------------------------------------------+
```

---

## 4. Security & Data Protection Architecture

1. **Authentication:**
   * Passwords hashed using `bcryptjs` with 10 salt rounds before storage.
   * Authentication tokens issued as signed JSON Web Tokens (HMAC SHA-256) with standard expiry.
   * Authorization middleware verifies roles (`CUSTOMER`, `MERCHANT`, `ADMIN`).
2. **Access Control (Row-Level Safety):**
   * Customer endpoints restrict order access strictly to orders belonging to `req.user.id`.
   * Merchant endpoints restrict order management strictly to the authenticated café.
3. **Input Sanitization & Validation:**
   * Express requests validated against schemas before reaching the database.
   * Parameterized Prisma queries completely mitigate SQL injection vectors.
4. **Environment Isolation:**
   * Sensitive secrets (`JWT_SECRET`, `DATABASE_URL`) managed strictly via environment variables; never hardcoded in client binaries.

---

## 5. Scalability & Cost Efficiency

* **Zero-Cost Development Baseline:**
  * Fully runnable in local development with SQLite/PostgreSQL and local Node.js.
  * Free-tier deployable on Supabase (PostgreSQL) and Render/Railway.
* **Spatial Efficiency:**
  * Straight-line distance calculated client-side and server-side using the Haversine formula, avoiding expensive third-party Matrix Routing API calls on every list render.
* **Offline Fallbacks:**
  * The Customer App maintains a bundled directory cache (`assets/data/cafes.json`) to allow exploration and menu browsing even when the network is degraded.

