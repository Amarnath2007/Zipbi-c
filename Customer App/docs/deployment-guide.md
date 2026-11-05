# ZipBi Deployment Guide

This guide details the end-to-end instructions for deploying the **ZipBi Backend API** and building the **ZipBi Customer Mobile App** for Android and iOS production.

---

## 1. Backend API Deployment

### 1.1 Requirements
* Node.js v20+ or v24 LTS
* PostgreSQL 15+ database instance (e.g. Supabase, Neon, or self-hosted)
* npm or pnpm

### 1.2 Environment Variables Configuration
Create a `.env` file in `backend/`:
```env
PORT=5000
NODE_ENV=production
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require"
JWT_SECRET="zipbi_super_secure_production_jwt_secret_2026_xYz"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
```

### 1.3 Database Migration & Seeding
From the `backend/` directory:
```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Seed verified Coimbatore cafes and menus
npm run seed
```

### 1.4 Running the Production Server
```bash
# Start server with Node
npm run start

# Or using PM2 process manager for continuous uptime
pm2 start src/server.js --name "zipbi-backend" --instances max
```

### 1.5 Docker Deployment (Optional Containerized Setup)
A production `Dockerfile` is provided in `backend/`:
```bash
cd backend
docker build -t zipbi-backend:1.0.0 .
docker run -d -p 5000:5000 --env-file .env --name zipbi-api zipbi-backend:1.0.0
```

---

## 2. Flutter Customer App Build & Release

### 2.1 Android Build Configuration
1. **Application ID:** `in.zipbi.customer`
2. **Minimum SDK:** 21 (Android 5.0 Lollipop)
3. **Target SDK:** 34 (Android 14)
4. **Permissions (`android/app/src/main/AndroidManifest.xml`):**
   * `android.permission.INTERNET` — Network communications with backend API.
   * `android.permission.ACCESS_FINE_LOCATION` — Exact GPS distance to cafés.
   * `android.permission.ACCESS_COARSE_LOCATION` — Approximate area distance.

### 2.2 Generating Release Android APK
From the root workspace directory:
```bash
# 1. Clean previous build artifacts
flutter clean

# 2. Get Dart dependencies
flutter pub get

# 3. Build standalone Release APK
flutter build apk --release

# Output path: build/app/outputs/flutter-apk/app-release.apk
```

### 2.3 Generating Google Play Store Android App Bundle (AAB)
```bash
flutter build appbundle --release
# Output path: build/app/outputs/bundle/release/app-release.aab
```

### 2.4 iOS Release Build (macOS Environment)
```bash
flutter build ipa --release
```

---

## 3. Post-Deployment Verification & Smoke Testing
1. **API Health:** Verify `curl -f http://<your-server-ip>:5000/api/v1/health` returns status `healthy`.
2. **Café Listing:** Ensure `GET /api/v1/cafes?lat=11.032688&lon=77.034577` outputs The German Cafe at ~0.4 km with status `ACTIVE_PARTNER`.
3. **Ordering Restriction Check:** Ensure unverified cafés cannot receive orders.
4. **App Launch:** Launch the compiled APK on an Android device or emulator; verify that the splash screen shows the authentic ZipBi logo, location permission prompts, home feed populates, and text-only menu cards render smoothly without errors.

