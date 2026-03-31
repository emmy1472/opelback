# Opel Automotive OEM Intelligence Portal - API Reference

## 🚀 Enterprise API Architecture

**Version**: 2.0  
**Status**: ✅ RUNNING  
**URL**: http://localhost:5000  
**Database**: ✅ MongoDB Atlas Connected  
**Port**: 5000

### 🎯 Core Workflow: License Plate → VIN → Vehicle Attributes → OEM Parts

---

## 📋 Optimized API Endpoints (v2.0)

### 1️⃣ AUTH & ACCOUNT MANAGEMENT

#### Register New Account
```
POST /api/v2/auth/register
Content-Type: application/json

Body:
{
  "username": "workshop_user",
  "email": "user@workshop.com",
  "password": "secure_pass_123",
  "accountType": "enterprise"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": 1001,
    "username": "workshop_user",
    "email": "user@workshop.com",
    "role": "user",
    "accountType": "enterprise",
    "parentAdminId": null,
    "createdAt": "2026-04-01T00:00:00.000Z"
  }
}
```

#### Login
```
POST /api/v2/auth/login
Content-Type: application/json

Body:
{
  "email": "user@workshop.com",
  "password": "secure_pass_123"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {...},
  "permissions": ["read_parts", "read_specs", "search_vin"]
}
```

#### Get Current User Profile
```
GET /api/v2/auth/profile
Authorization: Bearer <token>

Response:
{
  "id": 1001,
  "username": "workshop_user",
  "email": "user@workshop.com",
  "role": "user",
  "accountType": "enterprise",
  "parentAdminId": 1000,
  "permissions": ["read_parts", "read_specs", "search_vin"],
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

---

### 2️⃣ ADMIN DASHBOARD - User & Account Management

#### Create Sub-User Account (Admin Only)
```
POST /api/v2/admin/users/create-sub-user
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "username": "technician_1",
  "email": "tech1@workshop.com",
  "password": "temp_password_123",
  "role": "technician",
  "permissions": ["read_parts", "read_specs", "search_vin", "export_data"]
}

Response:
{
  "success": true,
  "subUserId": 1005,
  "username": "technician_1",
  "email": "tech1@workshop.com",
  "role": "technician",
  "parentAdminId": 1001,
  "createdAt": "2026-04-01T00:00:00.000Z"
}
```

#### List All Sub-Users (Admin Only)
```
GET /api/v2/admin/users/sub-users
Authorization: Bearer <admin_token>

Response:
[
  {
    "id": 1005,
    "username": "technician_1",
    "email": "tech1@workshop.com",
    "role": "technician",
    "permissions": ["read_parts", "read_specs"],
    "lastActive": "2026-04-01T10:30:00.000Z",
    "status": "active"
  },
  ...
]
```

#### Update Sub-User Permissions (Admin Only)
```
PUT /api/v2/admin/users/:subUserId/permissions
Authorization: Bearer <admin_token>
Content-Type: application/json

Body:
{
  "permissions": ["read_parts", "read_specs", "search_vin", "export_data", "manage_favorites"]
}

Response:
{
  "success": true,
  "subUserId": 1005,
  "updatedPermissions": ["read_parts", "read_specs", "search_vin", "export_data", "manage_favorites"]
}
```

#### Platform Statistics (Admin Only)
```
GET /api/v2/admin/analytics/dashboard
Authorization: Bearer <admin_token>

Response:
{
  "totalUsers": 8,
  "activeSubUsers": 6,
  "totalSearches": 1250,
  "totalPartsAccessedToday": 3420,
  "systemHealth": {
    "scrapeStatus": "healthy",
    "databaseConnected": true,
    "cacheHitRate": "87%"
  },
  "modelsTracked": {
    "corsa": 4521,
    "astra": 6234,
    "mokka": 3891
  }
}
```

---

### 3️⃣ PRIMARY WORKFLOW - Three-Tier Vehicle Data Pipeline

#### Tier 1: License Plate → VIN Lookup
```
POST /api/v2/vehicle/decode/license-plate
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "licensePlate": "ABC-123-XYZ",
  "country": "DE"
}

Response:
{
  "found": true,
  "vin": "W0L0TGH86K2000002",
  "confidence": "95%",
  "source": "registration_database"
}
```

#### Tier 2: VIN → Vehicle Attributes (Model, Year, Trim, Engine)
```
POST /api/v2/vehicle/decode/vin
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "vin": "W0L0TGH86K2000002"
}

Response:
{
  "found": true,
  "vin": "W0L0TGH86K2000002",
  "model": "Opel Astra K",
  "year": 2018,
  "trim": "Edition",
  "engine": "1.6 CDTI",
  "transmission": "Manual 6-speed",
  "bodyType": "Sedan",
  "driveType": "Front-Wheel Drive",
  "modelCatalogUrl": "https://opel.7zap.com/en/global/astra/",
  "catalogId": "astra_k_2018_1_6cdti"
}
```

#### Tier 3: Vehicle Attributes → OEM Parts Catalog
```
GET /api/v2/vehicle/parts-catalog
Authorization: Bearer <token>
Query Parameters:
  - vin: W0L0TGH86K2000002
  - OR modelCatalogId: astra_k_2018_1_6cdti

Response:
{
  "vehicle": {
    "modelName": "Opel Astra K",
    "year": 2018,
    "engine": "1.6 CDTI",
    "vin": "W0L0TGH86K2000002"
  },
  "categories": [
    {
      "categoryId": "engine_parts",
      "categoryName": "Engine Parts",
      "icon": "⚙️",
      "description": "Engine components and assemblies",
      "partsCount": 145,
      "url": "/api/v2/vehicle/parts/engine_parts",
      "explodedDiagramUrl": "/api/v2/vehicle/diagrams/engine_parts"
    },
    {
      "categoryId": "suspension_chassis",
      "categoryName": "Suspension & Chassis",
      "icon": "🚗",
      "description": "Suspension, wheels, and chassis components",
      "partsCount": 89,
      "url": "/api/v2/vehicle/parts/suspension_chassis",
      "explodedDiagramUrl": "/api/v2/vehicle/diagrams/suspension_chassis"
    },
    {
      "categoryId": "electrical_system",
      "categoryName": "Electrical System",
      "icon": "⚡",
      "description": "Wiring, alternator, starter, lights",
      "partsCount": 234,
      "url": "/api/v2/vehicle/parts/electrical_system",
      "explodedDiagramUrl": "/api/v2/vehicle/diagrams/electrical_system"
    },
    {
      "categoryId": "body_interior",
      "categoryName": "Body & Interior",
      "icon": "🛠️",
      "description": "Panels, trim, seats, dashboard",
      "partsCount": 312,
      "url": "/api/v2/vehicle/parts/body_interior",
      "explodedDiagramUrl": "/api/v2/vehicle/diagrams/body_interior"
    }
  ]
}
```

---

### 4️⃣ PARTS DISCOVERY - Granular Part Details

#### Get Parts by Category
```
GET /api/v2/vehicle/parts/:categoryId
Authorization: Bearer <token>
Query Parameters:
  - vin: W0L0TGH86K2000002
  - page: 1
  - limit: 50
  - sortBy: name|partNumber|popularity

Response:
{
  "category": "Engine Parts",
  "categoryId": "engine_parts",
  "vehicle": {
    "vin": "W0L0TGH86K2000002",
    "model": "Opel Astra K",
    "year": 2018
  },
  "parts": [
    {
      "partId": "p_001_5514099",
      "partNumber": "5514099",
      "name": "Cylinder Head",
      "manufacturer": "OEM",
      "description": "Cylinder head assembly for 1.6 CDTI engine",
      "quantity": 1,
      "applicableYears": [2016, 2017, 2018, 2019, 2020],
      "alternativeParts": ["5514100", "5514101"],
      "compatibleWith": ["Opel Astra K", "Opel Zafira C"],
      "pricing": {
        "oem": 450.00,
        "aftermarket": 285.00,
        "currency": "EUR"
      },
      "externalLinks": {
        "oem": "https://opel.7zap.com/...",
        "image": "https://cdn.7zap.com/images/parts/5514099.webp"
      }
    },
    ...
  ],
  "pagination": {
    "total": 145,
    "page": 1,
    "limit": 50,
    "pages": 3
  }
}
```

#### Get Part Details with History
```
GET /api/v2/vehicle/parts/:partId/details
Authorization: Bearer <token>

Response:
{
  "partId": "p_001_5514099",
  "partNumber": "5514099",
  "name": "Cylinder Head",
  "category": "Engine Parts",
  "description": "Cylinder head assembly for 1.6 CDTI engine",
  "specifications": {
    "weight": "8.5 kg",
    "material": "Aluminum",
    "condition": "New",
    "warranty": "24 months"
  },
  "compatibility": {
    "models": ["Astra K", "Zafira C"],
    "years": [2016, 2017, 2018, 2019, 2020],
    "engines": ["1.6 CDTI", "1.6 SIDI"],
    "transmissions": ["Manual", "Automatic"]
  },
  "alternatives": [
    {
      "partNumber": "5514100",
      "name": "Alternative Cylinder Head",
      "reason": "Direct OEM alternative"
    }
  ],
  "pricing": {
    "oem": 450.00,
    "aftermarket": 285.00,
    "suppliers": ["Parts Direct", "Auto Supply"]
  },
  "lastUpdated": "2026-04-01T08:00:00.000Z",
  "viewCount": 1234
}
```

---

### 5️⃣ EXPLODED VIEW DIAGRAMS & VISUAL SCHEMAS

#### Get Exploded Diagram for Category
```
GET /api/v2/vehicle/diagrams/:categoryId
Authorization: Bearer <token>
Query Parameters:
  - vin: W0L0TGH86K2000002
  - format: interactive|static|pdf

Response:
{
  "categoryId": "engine_parts",
  "categoryName": "Engine Parts",
  "vehicle": "Opel Astra K 2018",
  "diagramUrl": "https://opel.7zap.com/diagrams/engine_parts.svg",
  "diagramType": "interactive",
  "partsList": [
    {
      "componentId": "comp_001",
      "partNumber": "5514099",
      "partName": "Cylinder Head",
      "quantity": 1,
      "coordinateX": 450,
      "coordinateY": 320,
      "hotspotUrl": "/api/v2/vehicle/parts/p_001_5514099/details"
    },
    ...
  ],
  "metadata": {
    "originalSource": "https://opel.7zap.com/...",
    "scale": "1:2",
    "cached": true,
    "lastUpdated": "2026-04-01T00:00:00.000Z"
  }
}
```

#### Download Diagram as PDF
```
GET /api/v2/vehicle/diagrams/:categoryId/export
Authorization: Bearer <token>
Query Parameters:
  - vin: W0L0TGH86K2000002
  - format: pdf|png|svg

Response: Binary PDF/PNG/SVG file
Headers:
  - Content-Type: application/pdf
  - Content-Disposition: attachment; filename="Opel_Astra_K_Engine_Diagram.pdf"
```

---

### 6️⃣ SEARCH & HISTORY TRACKING

#### Search Across All Parts
```
GET /api/v2/search/parts
Authorization: Bearer <token>
Query Parameters:
  - q: "cylinder head"
  - category: "engine_parts"
  - model: "astra"
  - page: 1
  - limit: 20

Response:
{
  "query": "cylinder head",
  "resultsFound": 8,
  "results": [
    {
      "partNumber": "5514099",
      "partName": "Cylinder Head",
      "category": "Engine Parts",
      "compatibleModels": ["Astra K", "Zafira C"],
      "relevance": "95%"
    },
    ...
  ]
}
```

#### Get User Search History
```
GET /api/v2/user/search-history
Authorization: Bearer <token>
Query Parameters:
  - limit: 50
  - days: 30

Response:
[
  {
    "searchId": "search_001",
    "vin": "W0L0TGH86K2000002",
    "vehicleModel": "Opel Astra K",
    "category": "Engine Parts",
    "partSearched": "Cylinder Head",
    "timestamp": "2026-04-01T10:30:00.000Z"
  },
  ...
]
```

#### Save Favorite Part/Search
```
POST /api/v2/user/favorites
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "type": "part",
  "partId": "p_001_5514099",
  "partNumber": "5514099"
}

Response:
{
  "success": true,
  "favoriteId": "fav_001",
  "partNumber": "5514099",
  "savedAt": "2026-04-01T10:30:00.000Z"
}
```

#### Get User Favorites
```
GET /api/v2/user/favorites
Authorization: Bearer <token>

Response:
{
  "totalFavorites": 12,
  "favorites": [
    {
      "favoriteId": "fav_001",
      "type": "part",
      "partNumber": "5514099",
      "partName": "Cylinder Head",
      "savedAt": "2026-04-01T10:30:00.000Z"
    },
    ...
  ]
}
```

---

### 7️⃣ MODEL-SPECIFIC ENDPOINTS (Corsa, Astra, Mokka Focus)

#### List All Supported Models
```
GET /api/v2/models
Authorization: Bearer <token>

Response:
{
  "primaryModels": [
    {
      "modelId": "corsa",
      "modelName": "Opel Corsa",
      "type": "Compact Hatchback",
      "yearsSupported": "2015-2026",
      "partsCatalogSize": 4521,
      "icon": "🚙",
      "catalogUrl": "/api/v2/models/corsa/catalog"
    },
    {
      "modelId": "astra",
      "modelName": "Opel Astra",
      "type": "Family Sedan",
      "yearsSupported": "2010-2026",
      "partsCatalogSize": 6234,
      "icon": "🚗",
      "catalogUrl": "/api/v2/models/astra/catalog"
    },
    {
      "modelId": "mokka",
      "modelName": "Opel Mokka",
      "type": "Compact SUV",
      "yearsSupported": "2012-2026",
      "partsCatalogSize": 3891,
      "icon": "🚙",
      "catalogUrl": "/api/v2/models/mokka/catalog"
    }
  ]
}
```

#### Get Model-Specific Catalog
```
GET /api/v2/models/:modelId/catalog
Authorization: Bearer <token>
Query Parameters:
  - year: 2018

Response:
{
  "modelId": "astra",
  "modelName": "Opel Astra K",
  "year": 2018,
  "engineOptions": ["1.4 Turbo", "1.6 CDTI", "1.6 SIDI"],
  "transmissionOptions": ["Manual 5-speed", "Manual 6-speed", "Automatic 6-speed"],
  "categories": [
    {
      "categoryId": "engine_parts",
      "categoryName": "Engine Parts",
      "partsCount": 145
    },
    ...
  ]
}
```

---

### 8️⃣ DATA MANAGEMENT & EXPORTS

#### Export Search Results
```
POST /api/v2/export/search-results
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "vin": "W0L0TGH86K2000002",
  "category": "engine_parts",
  "format": "csv|excel|pdf"
}

Response: Binary file (CSV/Excel/PDF)
Headers:
  - Content-Type: text/csv or application/vnd.ms-excel
  - Content-Disposition: attachment; filename="Astra_EnginePartsExport.csv"
```

#### Export Favorite Parts List
```
GET /api/v2/export/favorites
Authorization: Bearer <token>
Query Parameters:
  - format: csv|excel|pdf

Response: Binary file with formatted favorites list
```

---

### 9️⃣ SYSTEM & STATUS ENDPOINTS

#### Health Check
```
GET /api/v2/health
Response:
{
  "status": "OK",
  "version": "2.0.0",
  "timestamp": "2026-04-01T10:30:00.000Z",
  "services": {
    "database": "connected",
    "scraper": "active",
    "cache": "healthy"
  },
  "uptime": "48.5h"
}
```

#### System Analytics (Admin)
```
GET /api/v2/admin/analytics/system
Authorization: Bearer <admin_token>

Response:
{
  "totalRequests": 54230,
  "requestsToday": 3421,
  "averageResponseTime": "120ms",
  "cacheHitRate": "87%",
  "databaseQueries": 45123,
  "scrapeOperations": 234,
  "topSearchedParts": ["5514099", "5514100", "5514101"],
  "topSearchedModels": ["astra", "corsa", "mokka"]
}
```

---

## 📊 Enhanced Database Schema

| Collection | Purpose | Key Fields | Status |
|-----------|---------|-----------|--------|
| `users` | Enterprise user accounts with role-based access | userId, username, email, role, accountType, permissions, parentAdminId | ✅ Multi-tier support |
| `subusers` | Sub-user accounts managed by admins | subUserId, parentAdminId, role, permissions, status | ✅ Enterprise ready |
| `vehiclemodels` | All Opel models (Corsa, Astra, Mokka focused) | modelId, name, type, yearsSupported, partsCatalogSize | ✅ 3 primary models |
| `vehiclespecs` | Vehicle specs indexed by VIN/model/year | vin, modelId, year, engine, transmission, trim, bodyType | ✅ VIN-indexed |
| `vehiclecatalogs` | Part categories per vehicle spec | catalogId, modelId, year, categoryId, categoryName | ✅ Hierarchical |
| `vehicleparts` | Individual OEM parts with details | partId, partNumber, name, categoryId, specifications, compatibility, pricing | ✅ Granular data |
| `explodeddiagrams` | Visual schema maps for part identification | diagramId, categoryId, modelId, diagramUrl, partMappings, hotSpots | ✅ Interactive |
| `searchhistories` | User search audit trail | userId, searchType, vin, model, category, query, timestamp | ✅ Analytics |
| `userfavorites` | Bookmarked parts and searches | userId, type, partId, favoriteId, savedAt | ✅ Personalized |

---

## 🔧 Tech Stack

- **Runtime**: Node.js v16+
- **Framework**: Express.js v4.18+
- **Database**: MongoDB Atlas (cloud-hosted)
- **Authentication**: JWT (JSON Web Tokens) + Role-Based Access Control
- **Web Scraping**: Cheerio + Axios/curl
- **Security**: bcryptjs (password hashing), CORS, input validation
- **Caching**: In-memory + MongoDB TTL indexes
- **Admin Dashboard**: Real-time analytics & user management
- **Export**: CSV, Excel, PDF support

---

## ✅ Key Features & Capabilities

### Core Functionality
- ✅ **Three-tier workflow**: License plate → VIN → Vehicle attributes → OEM parts
- ✅ **Multi-level authentication**: Admin, sub-users, regular users with role-based permissions
- ✅ **VIN decoding**: Full 17-digit Opel VIN to vehicle attributes mapping
- ✅ **Enterprise user management**: Create and manage sub-user accounts
- ✅ **Advanced search**: Cross-model part searches with filters

### Data & Visualization
- ✅ **Exploded diagrams**: Interactive part identification schematics
- ✅ **Granular part details**: Comprehensive specifications, compatibility, alternative parts, pricing
- ✅ **OEM catalog integration**: Direct mapping to Opel 7zap.com database
- ✅ **Model-specific catalogs**: Corsa, Astra, Mokka with full parts breakdowns
- ✅ **Historical data**: Year-range compatibility and part evolution tracking

### User Experience
- ✅ **Search history tracking**: Audit trail of user searches with timestamps
- ✅ **Favorite parts/searches**: Personalized bookmarks for quick access
- ✅ **Export functionality**: Download search results as CSV/Excel/PDF
- ✅ **Responsive design**: Desktop and mobile-optimized interface
- ✅ **Image proxy**: Cached vehicle and part images

### Admin & Analytics
- ✅ **Dashboard analytics**: Real-time user activity, search trends, system health
- ✅ **User management**: Create sub-accounts, manage permissions, track usage
- ✅ **Database optimization**: Indexed queries, caching layers, TTL cleanup
- ✅ **System monitoring**: Scraper health, database connection status, API performance
- ✅ **Access control**: Fine-grained permissions per user role

---

## 📝 End-to-End Usage Examples

### Workflow 1: Workshop User - VIN Lookup & Parts Discovery

```bash
# Step 1: Register workshop account
curl -X POST http://localhost:5000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "workshop_main",
    "email": "workshop@repairshop.de",
    "password": "secure_password_123",
    "accountType": "enterprise"
  }'

# Returns: { token: "eyJhbGc...", user: {...} }
TOKEN="eyJhbGc..."

# Step 2: Admin creates sub-user (technician)
curl -X POST http://localhost:5000/api/v2/admin/users/create-sub-user \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "tech_rosa",
    "email": "rosa@repairshop.de",
    "password": "tech_pass_456",
    "role": "technician",
    "permissions": ["read_parts", "read_specs", "search_vin", "export_data"]
  }'

# Step 3: Technician logs in
TECH_TOKEN=$(curl -X POST http://localhost:5000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rosa@repairshop.de","password":"tech_pass_456"}' \
  | jq -r '.token')

# Step 4: Decode customer's VIN
curl -X POST http://localhost:5000/api/v2/vehicle/decode/vin \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vin":"W0L0TGH86K2000002"}'

# Returns: { found: true, model: "Opel Astra K", year: 2018, engine: "1.6 CDTI", ... }

# Step 5: Get parts catalog for this vehicle
VIN="W0L0TGH86K2000002"
curl -X GET "http://localhost:5000/api/v2/vehicle/parts-catalog?vin=$VIN" \
  -H "Authorization: Bearer $TECH_TOKEN"

# Returns: Categories with exploded diagram links

# Step 6: Get engine parts for this specific vehicle
curl -X GET "http://localhost:5000/api/v2/vehicle/parts/engine_parts?vin=$VIN&limit=50" \
  -H "Authorization: Bearer $TECH_TOKEN"

# Returns: [ { partNumber: "5514099", name: "Cylinder Head", ... }, ... ]

# Step 7: View exploded engine diagram
curl -X GET "http://localhost:5000/api/v2/vehicle/diagrams/engine_parts?vin=$VIN&format=interactive" \
  -H "Authorization: Bearer $TECH_TOKEN"

# Returns: { diagramUrl: "...", partsList: [...] }

# Step 8: Save favorite part for future reference
curl -X POST http://localhost:5000/api/v2/user/favorites \
  -H "Authorization: Bearer $TECH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"part","partId":"p_001_5514099","partNumber":"5514099"}'

# Step 9: Export engine parts list as PDF
curl -X GET "http://localhost:5000/api/v2/export/search-results?vin=$VIN&category=engine_parts&format=pdf" \
  -H "Authorization: Bearer $TECH_TOKEN" \
  > Astra_Engine_Parts.pdf
```

### Workflow 2: Admin Dashboard - Platform Management

```bash
# Admin logs in
ADMIN_TOKEN=$(curl -X POST http://localhost:5000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@workshop.de","password":"admin_pass"}' \
  | jq -r '.token')

# View all sub-users
curl -X GET http://localhost:5000/api/v2/admin/users/sub-users \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# View platform analytics dashboard
curl -X GET http://localhost:5000/api/v2/admin/analytics/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# View system performance metrics
curl -X GET http://localhost:5000/api/v2/admin/analytics/system \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Update technician permissions
curl -X PUT http://localhost:5000/api/v2/admin/users/1005/permissions \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissions": ["read_parts", "read_specs", "search_vin", "export_data", "manage_favorites"]
  }'
```

### Workflow 3: Cross-Model Search

```bash
# Search for "cylinder head" across all models
curl -X GET "http://localhost:5000/api/v2/search/parts?q=cylinder%20head&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Search within specific model (Corsa)
curl -X GET "http://localhost:5000/api/v2/search/parts?q=cylinder%20head&model=corsa" \
  -H "Authorization: Bearer $TOKEN"

# Get all models available
curl -X GET http://localhost:5000/api/v2/models \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎯 API Design Principles

### 1. **RESTful Structure**
- `GET /api/v2/resource` - Retrieve data
- `POST /api/v2/resource` - Create data
- `PUT /api/v2/resource/:id` - Update data
- `DELETE /api/v2/resource/:id` - Delete data (with auth)

### 2. **Versioning**
- Current version: **v2**
- Paths always include version: `/api/v2/...`
- Backward compatibility maintained with `/api/` (legacy)

### 3. **Authentication & Authorization**
- All endpoints require `Authorization: Bearer <token>`
- Role-based access control (RBAC) enforced per endpoint
- Token format: JWT with user ID, role, and permissions

### 4. **Response Format**
```json
{
  "success": true,
  "data": { ... },
  "pagination": { "page": 1, "limit": 50, "total": 1000 }
}
```

### 5. **Error Handling**
```json
{
  "success": false,
  "error": "Descriptive error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

---

## 🚀 Deployment & Configuration

### Environment Variables Required
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/opelback?retryWrites=true
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=production
PORT=5000
```

### Database Indexes (Recommended)
```javascript
// For optimal query performance:
db.users.createIndex({ email: 1 }, { unique: true })
db.vehicleparts.createIndex({ partNumber: 1 })
db.vehicleparts.createIndex({ categoryId: 1, modelId: 1 })
db.searchhistories.createIndex({ userId: 1, timestamp: -1 })
db.userfavorites.createIndex({ userId: 1, favoriteId: 1 })
```

### Caching Strategy
- **First access**: Scrapes from 7zap.com, stores in MongoDB
- **Subsequent access**: Returns cached data with `lastUpdated` timestamp
- **TTL cleanup**: Stale data older than 90 days auto-deleted
- **Cache invalidation**: Manual trigger via admin endpoint

---

## 🔐 Security Considerations

✅ **JWT Authentication**: All protected endpoints verify tokens  
✅ **Password Security**: bcryptjs with salt rounds = 10  
✅ **CORS Protection**: Configured for production domains  
✅ **Input Validation**: All parameters validated before processing  
✅ **Rate Limiting**: Recommended for production deployment  
✅ **HTTPS Only**: Required for production (enforce via reverse proxy)  
✅ **Role-Based Access**: Fine-grained permission checks  
✅ **Audit Trail**: All searches and exports logged to database

---

## 🐛 Troubleshooting

---

## 🐛 Troubleshooting

### Issue: "Invalid token" or 401 Unauthorized
**Solution**: 
- Ensure `Authorization: Bearer <token>` header is present
- Token may have expired; call login endpoint again
- Verify JWT_SECRET environment variable matches production

### Issue: "Permission denied" on admin endpoints
**Solution**:
- Verify user role is "admin" via `/api/v2/auth/profile`
- Sub-users cannot access admin endpoints; use admin account
- Check individual permission grants via `/api/v2/admin/users/:id/permissions`

### Issue: VIN lookup returns "not found"
**Solution**:
- Verify VIN format is exactly 17 characters
- VIN must be valid Opel VIN starting with 'W', 'X', or 'Z'
- Try searching parts by model directly: `/api/v2/models/:modelId/catalog`
- Check if vehicle year is supported (see model page)

### Issue: "Catalog not found" for specific model  
**Solution**:
- Ensure model parameter matches ID: `corsa`, `astra`, or `mokka`
- Trigger manual scrape via admin endpoint if data is stale
- Check MongoDB connection; query system health: `/api/v2/health`

### Issue: Slow part search responses
**Solution**:
- Add pagination limit: `?limit=50` reduces payload
- Check database indexes are created (see Deployment section)
- Consider caching results on client side
- Monitor system load via admin analytics dashboard

### Issue: "MongoDB connection failed"
**Solution**:
- Verify MONGO_URI is correct in .env file
- Check MongoDB Atlas IP whitelist includes deployment server IP
- For Vercel: Add `0.0.0.0/0` to Network Access in MongoDB Atlas
- Test connection manually: `mongosh $MONGO_URI`

---

## 📞 Support & Resources

- **API Documentation**: This file (updated May 2026)
- **GitHub Issues**: Report bugs and feature requests
- **Database Backup**: MongoDB Atlas automated daily backup enabled
- **Status Page**: `/api/v2/health` for current system status

---

## 🎯 Implementation Roadmap

### Phase 1: Core (Current - v2.0)
- ✅ Three-tier vehicle identification pipeline
- ✅ Admin user management system
- ✅ Exploded diagram support
- ✅ Advanced search & filtering
- ✅ Export functionality

### Phase 2: Enhancement (v2.1)
- 📋 Real-time inventory sync (OEM pricing)
- 📋 Mobile app API (iOS/Android)
- 📋 WebSocket support for real-time updates
- 📋 Advanced analytics dashboard

### Phase 3: Integration (v3.0)
- 📋 Third-party supplier API integration
- 📋 Rest of Opel model coverage (beyond Corsa/Astra/Mokka)
- 📋 Multi-language support
- 📋 Regional part numbering systems
