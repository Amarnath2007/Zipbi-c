# ZipBi REST API Documentation

**Base URL:** `http://localhost:5000/api/v1` (Production: `https://api.zipbi.in/api/v1`)  
**Format:** JSON (`application/json`)  
**Authentication:** HTTP Bearer Token (`Authorization: Bearer <JWT_TOKEN>`)

---

## 1. System Endpoints

### 1.1 Health Check
* **Method:** `GET`
* **Route:** `/health`
* **Auth Required:** No
* **Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "ZipBi Unified API",
  "version": "1.0.0",
  "timestamp": "2026-11-04T12:00:00.000Z"
}
```

---

## 2. Authentication Endpoints

### 2.1 Customer Registration
* **Method:** `POST`
* **Route:** `/auth/register`
* **Auth Required:** No
* **Request Body:**
```json
{
  "fullName": "Amarnath B",
  "phone": "+919876543210",
  "email": "amarnath.b@example.com",
  "password": "SecurePassword123"
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOi...",
  "user": {
    "id": "usr-1234",
    "fullName": "Amarnath B",
    "phone": "+919876543210",
    "email": "amarnath.b@example.com",
    "role": "CUSTOMER"
  }
}
```

### 2.2 Customer Login
* **Method:** `POST`
* **Route:** `/auth/login`
* **Auth Required:** No
* **Request Body:**
```json
{
  "loginIdentifier": "+919876543210",
  "password": "SecurePassword123"
}
```
* **Response (200 OK):** Same payload as registration.

### 2.3 Get Current User Profile
* **Method:** `GET`
* **Route:** `/auth/me`
* **Auth Required:** Yes (`Bearer <token>`)
* **Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "usr-1234",
    "fullName": "Amarnath B",
    "phone": "+919876543210",
    "email": "amarnath.b@example.com",
    "role": "CUSTOMER"
  }
}
```

---

## 3. Café Discovery Endpoints

### 3.1 List & Search Cafés
* **Method:** `GET`
* **Route:** `/cafes`
* **Auth Required:** No
* **Query Parameters:**
  * `lat` (float, optional): User's current latitude (default: `11.0326883` - PSG CAS)
  * `lon` (float, optional): User's current longitude (default: `77.0345773` - PSG CAS)
  * `q` (string, optional): Search query matching name, cuisine, address, or dishes
  * `category` (string, optional): `Café`, `Restaurant`, `Tea Shop`, `Bakery`
  * `maxDistance` (float, optional): Max radius in km (e.g. `5.0`)
  * `minRating` (float, optional): e.g. `4.0`
  * `openNow` (boolean, optional): `true`
  * `hasMenu` (boolean, optional): `true`
* **Response (200 OK):**
```json
{
  "success": true,
  "count": 15,
  "userLocation": {
    "latitude": 11.0326883,
    "longitude": 77.0345773,
    "reference": "PSG College of Arts and Science Main Gate"
  },
  "cafes": [
    {
      "id": "cafe-the-german-cafe",
      "name": "The German Cafe",
      "slug": "the-german-cafe",
      "description": "A cosy café near SITRA known for its Italian dishes...",
      "coverImage": "assets/images/cafes/german_cafe.jpg",
      "category": "Café",
      "cuisineTags": ["Café", "Italian", "Fast Food"],
      "address": "C.R. Complex, Downstairs, Near Fly Gym, SITRA, Coimbatore",
      "area": "SITRA, Coimbatore",
      "latitude": 11.0358,
      "longitude": 77.0355,
      "distanceKm": 0.36,
      "openingHours": "11:00 AM – 3:00 AM",
      "phone": "+91 99760 18088",
      "rating": 4.3,
      "reviewCount": 120,
      "verificationStatus": "ACTIVE_PARTNER",
      "isOrderingEnabled": true,
      "hasPublishedMenu": true
    }
  ]
}
```

### 3.2 Get Café Details
* **Method:** `GET`
* **Route:** `/cafes/:id`
* **Auth Required:** No
* **Response (200 OK):** Returns detailed café profile object including contact info and operational attributes.

### 3.3 Get Café Menu
* **Method:** `GET`
* **Route:** `/cafes/:id/menu`
* **Auth Required:** No
* **Response (200 OK):**
```json
{
  "success": true,
  "cafeId": "cafe-the-german-cafe",
  "cafeName": "The German Cafe",
  "isOrderingEnabled": true,
  "categories": [
    {
      "id": "cat-pasta",
      "name": "Pasta",
      "itemCount": 6,
      "items": [
        {
          "id": "item-tgc-pasta-1",
          "name": "Pink Sauce Penne",
          "description": "Creamy pink sauce pasta with Italian herbs and garlic bread",
          "price": 180.00,
          "isVeg": true,
          "isAvailable": true
        }
      ]
    }
  ]
}
```

---

## 4. Ordering Endpoints

### 4.1 Place Table Order
* **Method:** `POST`
* **Route:** `/orders`
* **Auth Required:** Yes (`Bearer <token>`)
* **Business Rule:** Rejects orders if `cafe.isOrderingEnabled !== true` or `cafe.verificationStatus !== 'ACTIVE_PARTNER'`.
* **Request Body:**
```json
{
  "cafeId": "cafe-the-german-cafe",
  "tableNumber": "4",
  "specialNotes": "Less spicy pasta, please",
  "paymentMethod": "CASH_OR_UPI_AT_COUNTER",
  "items": [
    {
      "menuItemId": "item-tgc-pasta-1",
      "quantity": 1
    },
    {
      "menuItemId": "item-tgc-snack-1",
      "quantity": 2
    }
  ]
}
```
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Order placed successfully. Pay at counter.",
  "order": {
    "id": "ord-98213",
    "orderNumber": "ZPB-20261104-001",
    "cafeName": "The German Cafe",
    "tableNumber": "4",
    "status": "PENDING",
    "totalAmount": 420.00,
    "paymentMethod": "CASH_OR_UPI_AT_COUNTER",
    "paymentStatus": "PENDING",
    "createdAt": "2026-11-04T12:30:00.000Z",
    "items": [
      {
        "itemName": "Pink Sauce Penne",
        "quantity": 1,
        "pricePerUnit": 180.00,
        "subtotal": 180.00
      },
      {
        "itemName": "Crispy Corn",
        "quantity": 2,
        "pricePerUnit": 120.00,
        "subtotal": 240.00
      }
    ]
  }
}
```

### 4.2 Customer Order History
* **Method:** `GET`
* **Route:** `/orders/my-orders`
* **Auth Required:** Yes
* **Response (200 OK):** Array of previous orders sorted by newest first.

### 4.3 Get Order Details / Real-Time Tracking
* **Method:** `GET`
* **Route:** `/orders/:id`
* **Auth Required:** Yes
* **Response (200 OK):** Complete order details including status progression: `PENDING` -> `ACCEPTED` -> `PREPARING` -> `READY` -> `COMPLETED`.

---

## 5. Favourites Endpoints

### 5.1 Toggle Saved Café
* **Method:** `POST`
* **Route:** `/cafes/:id/favorite`
* **Auth Required:** Yes
* **Response (200 OK):** `{"success": true, "isFavorited": true}`

