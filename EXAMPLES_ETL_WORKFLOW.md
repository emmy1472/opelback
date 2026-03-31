# ETL Workflow: Data Pipeline Examples

## Overview
The system now follows this workflow:
1. **Extract**: Scraper pulls data from web (Category → Sub-Category → Parts)
2. **Transform**: Scraper organizes data into hierarchical structure with full context
3. **Load**: Scraper auto-saves all parts to MongoDB `ScrapedPart` collection
4. **Query**: Frontend fetches data from database via REST API (not from scraper directly)

---

## Step 1: Run the Scraper to Populate Database

### Example 1A: Deep Scrape Multiple Models
```bash
curl -X POST http://localhost:3000/api/scrape/models \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "models": [
      {
        "name": "Astra",
        "url": "https://opel.7zap.com/en/global/astra/"
      },
      {
        "name": "Corsa",
        "url": "https://opel.7zap.com/en/global/corsa/"
      }
    ]
  }'
```

**Response:**
```json
{
  "status": "completed",
  "message": "Deep scraping completed and data saved to database",
  "statistics": {
    "totalModels": 2,
    "totalCategories": 24,
    "totalParts": 1250,
    "savedParts": 1250,
    "failedParts": 0,
    "duplicateParts": 0,
    "errors": []
  }
}
```

**What's Happening:**
- Scraper fetches each model's categories
- For each category, it fetches sub-categories  
- For each sub-category, it extracts all parts
- **Automatically saves** each part to MongoDB with full hierarchy:
  ```json
  {
    "modelName": "Astra",
    "categoryName": "Engine",
    "subCategoryName": "Pistons",
    "partName": "Piston Ring Set",
    "oemNumber": "AR12345",
    "description": "Original equipment pistons...",
    "imageUrl": "https://...",
    "scrapedAt": "2024-01-15T10:30:00Z"
  }
  ```

### Example 1B: Scrape Specific Category Stack
```bash
curl -X POST http://localhost:3000/api/scrape/category-stack \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryUrl": "https://opel.7zap.com/en/global/astra-engine/",
    "modelName": "Astra",
    "categoryName": "Engine"
  }'
```

**Response:**
```json
{
  "status": "success",
  "message": "Category scraping completed and data saved to database",
  "statistics": {
    "savedCount": 150,
    "failedCount": 0,
    "errors": []
  },
  "data": {
    "url": "https://opel.7zap.com/en/global/astra-engine/",
    "subCategories": [
      {
        "subCategory": "Pistons",
        "url": "https://...",
        "parts": [...]
      }
    ]
  }
}
```

---

## Step 2: Query Data from Database (Frontend)

### Example 2A: Get All Scraped Models
```bash
curl http://localhost:3000/api/scraped-parts/models
```

**Response:**
```json
{
  "models": ["Astra", "Corsa", "Insignia"]
}
```

### Example 2B: Get Categories for a Model
```bash
curl http://localhost:3000/api/scraped-parts/Astra/categories
```

**Response:**
```json
{
  "modelName": "Astra",
  "categories": ["Engine", "Transmission", "Suspension", "Brakes", "Electrical"]
}
```

### Example 2C: Get Sub-Categories for Model/Category
```bash
curl http://localhost:3000/api/scraped-parts/Astra/Engine
```

**Response:**
```json
{
  "modelName": "Astra",
  "categoryName": "Engine",
  "subCategories": ["Pistons", "Spark Plugs", "Oil Filter", "Air Filter"]
}
```

### Example 2D: Get All Parts for a Specific Path (With Pagination)
```bash
curl "http://localhost:3000/api/scraped-parts/Astra/Engine/Pistons?skip=0&limit=50"
```

**Response:**
```json
{
  "modelName": "Astra",
  "categoryName": "Engine",
  "subCategoryName": "Pistons",
  "parts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "partName": "Piston Ring Set",
      "oemNumber": "AR12345",
      "description": "Original equipment piston rings",
      "imageUrl": "https://...",
      "scrapedAt": "2024-01-15T10:30:00Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "partName": "Piston Pins",
      "oemNumber": "AR12346",
      "description": "Precision piston pins",
      "imageUrl": "https://...",
      "scrapedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 127,
    "skip": 0,
    "limit": 50,
    "hasMore": true
  }
}
```

### Example 2E: Full-Text Search (By Part Name or Description)
```bash
curl "http://localhost:3000/api/scraped-parts/search?q=piston+ring&modelName=Astra&limit=20"
```

**Response:**
```json
{
  "query": "piston ring",
  "results": [
    {
      "partName": "Piston Ring Set",
      "oemNumber": "AR12345",
      "description": "Original equipment piston rings, high durability",
      "modelName": "Astra",
      "categoryName": "Engine",
      "subCategoryName": "Pistons",
      "score": 5.25
    },
    {
      "partName": "Piston Ring Compressor",
      "oemNumber": "AR12350",
      "description": "Tool for installing piston rings",
      "modelName": "Astra",
      "categoryName": "Engine",
      "subCategoryName": "Tools",
      "score": 4.80
    }
  ],
  "pagination": {
    "total": 43,
    "skip": 0,
    "limit": 20,
    "hasMore": true
  }
}
```

### Example 2F: Get Specific Part by OEM Number
```bash
curl http://localhost:3000/api/scraped-parts/by-oemNumber/AR12345
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "modelName": "Astra",
  "categoryName": "Engine",
  "subCategoryName": "Pistons",
  "partName": "Piston Ring Set",
  "oemNumber": "AR12345",
  "description": "Original equipment piston rings",
  "imageUrl": "https://...",
  "modelUrl": "https://opel.7zap.com/en/global/astra/",
  "categoryUrl": "https://opel.7zap.com/en/global/astra-engine/",
  "subCategoryUrl": "https://opel.7zap.com/en/global/astra-engine-pistons/",
  "scrapedAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

### Example 2G: Get Scraping Statistics
```bash
curl http://localhost:3000/api/scraped-parts/stats
```

**Response:**
```json
{
  "statistics": {
    "totalParts": 5847,
    "uniqueModels": 8,
    "uniqueCategories": 42,
    "lastScrapedAt": "2024-01-15T10:30:00Z"
  },
  "timestamp": "2024-01-15T11:45:23Z"
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    EXTRACTION PHASE                         │
│  Scraper fetches data from opel.7zap.com                   │
│  Model → Categories → Sub-Categories → Parts               │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    LOAD PHASE                               │
│  Scraper saves all parts to MongoDB                        │
│  ScrapedPart collection with full hierarchy                │
│  Automatic upsert on OEM number to prevent duplicates      │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  QUERY PHASE                                │
│  Frontend queries REST API endpoints:                       │
│  - GET /api/scraped-parts/models                           │
│  - GET /api/scraped-parts/:model/categories                │
│  - GET /api/scraped-parts/:model/:cat/:subcat              │
│  - GET /api/scraped-parts/search?q=query                   │
│  - GET /api/scraped-parts/by-oemNumber/:oem                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│              FRONTEND DISPLAYS                              │
│  - Browse models → categories → parts                       │
│  - Search for parts by name or description                 │
│  - Look up specific parts by OEM number                     │
│  - View scraping statistics                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Indices (For Performance)

The `ScrapedPart` collection has these indices:
- Single field indices: modelName, categoryName, subCategoryName, partName, oemNumber
- Compound indices:
  - `(modelName, categoryName)` - Fast category lookups 
  - `(modelName, categoryName, subCategoryName)` - Fast parts lookups
  - `(oemNumber, modelName)` - Fast OEM+Model lookups
  - `(partName, modelName)` - Fast name searches
- Full-text index: `(partName, description)` - Fast text search

---

## Key Features

### ✅ Auto-Save (No Manual Steps)
- Scraper automatically saves data to database
- No separate "save to DB" step needed
- Duplicate OEM numbers are handled gracefully (upsert)

### ✅ Efficient Queries
- Database indices enable fast lookups
- Pagination support for large result sets
- Full-text search across part names and descriptions

### ✅ Complete Context
- Every part stores full hierarchy: model → category → sub-category
- Reference URLs preserved for tracing back to source

### ✅ Rate Limiting & Resilience
- Built-in retry logic (max 2 retries on timeout)
- 500ms delay between requests to prevent rate limiting
- Graceful error handling (continues on individual failures)

### ✅ Multiple Access Patterns
1. Browse: Model → Categories → Sub-Categories → Parts
2. Search: Full-text search on part names/descriptions
3. Lookup: Direct OEM number lookup
4. Statistics: Coverage reporting

---

## Frontend Implementation Example

```javascript
// React component example
async function getAstraEnginePistons() {
  const response = await fetch(
    '/api/scraped-parts/Astra/Engine/Pistons?skip=0&limit=50'
  );
  const data = await response.json();
  
  return data.parts.map(part => ({
    name: part.partName,
    oemNumber: part.oemNumber,
    description: part.description,
    image: part.imageUrl
  }));
}

// Search example
async function searchParts(query) {
  const response = await fetch(
    `/api/scraped-parts/search?q=${encodeURIComponent(query)}&limit=50`
  );
  return response.json();
}

// Statistics example
async function getStats() {
  const response = await fetch('/api/scraped-parts/stats');
  return response.json();
}
```

---

## Monitoring & Debugging

### Check Scraping Progress
Look at console output during scraping:
```
[DEEP-SCRAPER] Processing Model: Astra
[DEEP-SCRAPER] Found 5 categories
[DEEP-SCRAPER] → Category: Engine
[DEEP-SCRAPER] Found 4 sub-categories
[DEEP-SCRAPER] → Sub-Category: Pistons
[DEEP-SCRAPER] ✅ Saved 12 parts to DB
```

### Verify Data Saved
```bash
# Check total parts count
curl http://localhost:3000/api/scraped-parts/stats

# Check specific model
curl http://localhost:3000/api/scraped-parts/Astra/categories

# Test search
curl "http://localhost:3000/api/scraped-parts/search?q=engine"
```

---

## Troubleshooting

**Q: Scraper completes but no data in database?**
- A: Check that MongoDB connection is working: `db.js` should show `✅ MongoDB connected`
- Verify authentication token is valid in request headers

**Q: Search returns zero results?**
- A: Ensure data has been scraped first - run `/api/scrape/models` endpoint
- Check that search query matches part names or descriptions

**Q: Getting duplicate parts on re-scrape?**
- A: This is handled automatically - OEM numbers are unique, so re-scraping updates existing records

**Q: Query endpoints returning empty?**
- A: Verify the exact spelling of model/category names - they are case-sensitive
- Use `/api/scraped-parts/models` to see available models

