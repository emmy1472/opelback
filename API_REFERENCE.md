# Opel Scraper Backend - API Reference

## 🚀 Server Status
- **Status**: ✅ RUNNING
- **URL**: http://localhost:5000
- **Database**: ✅ MongoDB Atlas Connected
- **Port**: 5000

---

## 📋 API Endpoints

### 🔐 Authentication Endpoints

#### Register User
```
POST /api/auth/register
Content-Type: application/json

Body:
{
  "username": "john",
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1001,
    "username": "john",
    "email": "john@example.com",
    "createdAt": "2026-03-30T22:30:28.443Z"
  }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": { ... }
}
```

#### Get Current User (Requires Token)
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "id": 1001,
  "username": "john",
  "email": "john@example.com",
  "createdAt": "2026-03-30T22:30:28.443Z"
}
```

#### Get Search History (Requires Token)
```
GET /api/auth/history
Authorization: Bearer <token>

Response:
[
  {
    "_id": "...",
    "userId": "...",
    "vin": "W0L0TGH86K2000002",
    "modelName": "Opel Astra"
  }
]
```

---

### 🚗 Scraper & Data Endpoints

#### Get All Models
```
GET /api/models

Response:
[
  {
    "name": "Opel Adam",
    "url": "https://opel.7zap.com/en/catalog/cars/opel/global/adam-m13-parts-catalog/",
    "image": null
  },
  ...
]
```

#### Get Model Catalog (Categories)
```
GET /api/catalog?url=https://opel.7zap.com/en/catalog/cars/opel/global/astra-k-parts-catalog/

Response:
[
  {
    "name": "Engine Parts",
    "url": "https://opel.7zap.com/en/catalog/cars/opel/global/astra-k-engine/"
  },
  ...
]
```

#### Get Category Parts
```
GET /api/parts?url=https://opel.7zap.com/en/catalog/cars/opel/global/astra-k-engine/

Response:
[
  {
    "name": "Cylinder Head",
    "number": "5514099",
    "url": "..."
  },
  ...
]
```

#### Get Vehicle Specs
```
GET /api/specs?url=https://opel.7zap.com/en/catalog/cars/opel/global/astra-k-parts-catalog/

Response:
[
  {
    "year": 2016,
    "engine": "1.6T",
    "transmission": "Manual",
    "url": "..."
  },
  ...
]
```

#### VIN Lookup (Decode VIN)
```
POST /api/vin-lookup
Content-Type: application/json
Authorization: Bearer <token> (optional)

Body:
{
  "vin": "W0L0TGH86K2000002"
}

Response:
{
  "found": true,
  "url": "https://opel.7zap.com/en/global/astra/",
  "name": "Opel Astra G + Zafira A (2019)",
  "year": 2019,
  "model": "Astra G + Zafira A"
}
```

---

### 🖼️ Media Endpoints

#### Image Proxy
```
GET /api/image-proxy?url=https://img.7zap.com/images/oem/models/adam-m13.webp

Response: Binary image data (proxied from 7zap.com)

Headers Set:
- Content-Type: image/webp
- Cache-Control: public, max-age=86400
```

---

## 📊 Database Collections

| Collection | Purpose | Status |
|-----------|---------|--------|
| `users` | User accounts with auth | ✅ 3 test users |
| `vehiclemodels` | All Opel models | ✅ 20+ cached |
| `vehiclecatalogs` | Model categories | ✅ 50+ extracted |
| `vehicleparts` | Individual parts | ✅ Auto-saved |
| `vehiclespecs` | Vehicle specs (year/engine) | ✅ Auto-saved |
| `searchhistories` | User search logs | ✅ Auto-created |

---

## 🔧 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Cloud Atlas)
- **Authentication**: JWT (JSON Web Tokens)
- **Scraping**: Cheerio + curl
- **Password**: bcryptjs (hashed)

---

## ✅ What's Working

- ✅ User registration & login
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Web scraping (Opel.7zap.com)
- ✅ MongoDB Atlas connection
- ✅ Auto-increment user IDs
- ✅ VIN decoder (17-digit Opel VINs)
- ✅ Image proxy for external images
- ✅ Caching layer (first request scrapes, subsequent cached)
- ✅ Flexible scraper selectors (Nuxt.js SPA compatible)

---

## 📝 Example Usage

### 1. Register and Login
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@test.com","password":"pass123"}'

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"pass123"}'
```

### 2. Decode VIN
```bash
curl -X POST http://localhost:5000/api/vin-lookup \
  -H "Content-Type: application/json" \
  -d '{"vin":"W0L0TGH86K2000002"}'
```

### 3. Get Models and Browse
```bash
curl http://localhost:5000/api/models

curl "http://localhost:5000/api/catalog?url=https://opel.7zap.com/en/catalog/cars/opel/global/astra-k-parts-catalog/"
```

---

## 🚀 VERCEL DEPLOYMENT FIX

If you're getting a **500 error on /api/models** after deploying to Vercel:

### 1️⃣ Allow All IPs in MongoDB Atlas
- Go to https://cloud.mongodb.com/
- Click **Network Access**
- Click **ADD IP ADDRESS**
- Enter: `0.0.0.0/0` (Allow from anywhere)
- Click **Confirm**

### 2️⃣ Set Environment Variables in Vercel
- Go to Vercel Dashboard → Your Project
- Click **Settings** → **Environment Variables**
- Add:
  - `MONGO_URI` = (your MongoDB connection string)
  - `JWT_SECRET` = (your JWT secret)
  - `NODE_ENV` = `production`
- **Redeploy** your project

### 3️⃣ Git Push Changes
```bash
git add vercel.json
git commit -m "Add Vercel configuration"
git push
```

See [VERCEL_FIXES.md](VERCEL_FIXES.md) for detailed troubleshooting.

---

## 🔧 Troubleshooting Catalog Endpoint

If `/api/catalog` returns **"Failed to fetch catalog"** on Vercel:

See [VERCEL_CATALOG_DEBUG.md](VERCEL_CATALOG_DEBUG.md) for:
- How to check Vercel runtime logs
- Common errors and solutions
- Cache-only fallback mode
- Alternative scraper services

---

**Backend is fully operational! 🚀**
