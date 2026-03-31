# Master Scraper v2.0 - Complete Data Population Guide

## Overview

The Master Scraper v2.0 is a comprehensive data collection tool that automatically populates your Opel OEM Intelligence Portal database with all necessary vehicle data according to the v2.0 API schema.

## What Gets Scraped

### 1. **Vehicle Models** (3 core models)
- Opel Corsa (Compact Hatchback)
- Opel Astra (Family Sedan)
- Opel Mokka (Compact SUV)

### 2. **Vehicle Specifications**
- Years supported per model (e.g., 2015-2026)
- Engine options (1.0T, 1.6 CDTI, etc.)
- Transmission types (Manual, Automatic)
- Body types and drive configurations
- Generated specifications for all year/engine combinations

### 3. **Part Categories**
- Engine Parts (⚙️)
- Suspension & Chassis (🚗)
- Electrical System (⚡)
- Body & Interior (🛠️)
- Braking System (🛑)
- Fuel System (⛽)
- Transmission & Drivetrain (🔧)
- Cooling System (❄️)

### 4. **Individual Parts with Details**
- Part numbers (OEM references like 5514099)
- Part names and descriptions
- Specifications (weight, material, warranty)
- Quantity required
- Image URLs
- Pricing placeholders (OEM vs aftermarket)
- Compatibility information

### 5. **Vehicle Catalogs** (Model-Category Mapping)
Hierarchical mapping of which parts belong to which model/year/engine combinations

### 6. **Exploded Diagrams**
Visual schema maps for interactive part identification with:
- Diagram URLs (SVG/images)
- Part hotspot coordinates
- Clickable part mappings

---

## Installation & Setup

### Prerequisites
```bash
# Ensure you have Node.js v16+ installed
node --version

# Ensure MongoDB Atlas connection is working
# Test with: mongosh $MONGO_URI
```

### Environment Variables (`.env`)
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/opelback?retryWrites=true
JWT_SECRET=your-jwt-secret-key
NODE_ENV=development
PORT=5000
```

### Install Dependencies
```bash
npm install axios cheerio mongoose dotenv
```

---

## Running the Master Scraper

### Option 1: Direct Execution
```bash
# From project root
node scrapers/master-scraper-v2.js
```

### Option 2: NPM Script
Add to `package.json`:
```json
{
  "scripts": {
    "scrape:master": "node scrapers/master-scraper-v2.js",
    "scrape:corsa": "node scrapers/master-scraper-v2.js corsa",
    "scrape:astra": "node scrapers/master-scraper-v2.js astra",
    "scrape:mokka": "node scrapers/master-scraper-v2.js mokka"
  }
}
```

Then run:
```bash
npm run scrape:master
```

### Option 3: Scheduled Task (Cron)
For automatic daily updates:
```bash
# Update database daily at 2 AM
0 2 * * * cd /path/to/opelback && npm run scrape:master >> logs/scraper.log 2>&1
```

---

## Scraping Output & Progress

### Console Output Example
```
╔════════════════════════════════════════════════════════╗
║   🚗 Master Scraper v2.0 - Opel OEM Intelligence Portal ║
╚════════════════════════════════════════════════════════╝

[INIT] Connecting to MongoDB...
✅ MongoDB connected

╔════════════════════════════════════════════════════════╗
║ PHASE 1: Scraping Core Vehicle Models                  ║
╚════════════════════════════════════════════════════════╝

→ Processing: Opel Corsa (Compact Hatchback)
   ✅ Saved: Opel Corsa

→ Processing: Opel Astra (Family Sedan)
   ✅ Saved: Opel Astra

→ Processing: Opel Mokka (Compact SUV)
   ✅ Saved: Opel Mokka

📊 Summary: Saved 3/3 models

════════════════════════════════════════════════════════
Processing: Opel Astra
════════════════════════════════════════════════════════

📋 Scraping specifications for: Opel Astra
   ✅ Saved 336 vehicle specifications for Opel Astra

🏷️  Scraping categories for: Opel Astra
   ✅ Found 8 categories for Opel Astra

   → Scraping parts from: Engine Parts
[MASTER-SCRAPER] Fetching: https://opel.7zap.com/en/global/astra-engine/
[MASTER-SCRAPER] ✅ Success (45234 bytes)
     ✅ Saved 145 parts from Engine Parts

[... continues for all categories ...]

✅ Completed: Opel Astra
   - Specs: 336
   - Categories: 8
   - Parts: 2456
   - Diagrams: 4

╔════════════════════════════════════════════════════════╗
║              📊 SCRAPING COMPLETE - SUMMARY             ║
╚════════════════════════════════════════════════════════╝

✅ Models Scraped:       3
✅ Specs Generated:      1008
✅ Categories Found:     24
✅ Parts Extracted:      14521
✅ Diagrams Scraped:     12

⚠️  Errors Encountered:  0

✨ Database now populated with Opel OEM intelligence data!
```

---

## Database Collections After Scraping

### `vehiclemodels`
```javascript
{
  _id: ObjectId(...),
  modelId: "astra",
  name: "Opel Astra",
  type: "Family Sedan",
  baseUrl: "https://opel.7zap.com/en/global/astra/",
  yearsSupported: "2010-2026",
  partsCatalogSize: 6234,
  lastScrapedAt: ISODate("2026-04-01T10:30:00Z")
}
```

### `vehiclespecs`
```javascript
{
  _id: ObjectId(...),
  modelId: "astra",
  modelName: "Opel Astra",
  year: 2018,
  engine: "1.6 CDTI",
  transmission: "Manual 6-speed",
  trim: "Edition",
  bodyType: "Sedan",
  driveType: "Front-Wheel Drive",
  catalogId: "astra_2018_1_6_cdti_manual_6_speed",
  modelUrl: "https://opel.7zap.com/en/global/astra/",
  createdAt: ISODate("2026-04-01T10:30:00Z")
}
```

### `vehicleparts`
```javascript
{
  _id: ObjectId(...),
  partNumber: "5514099",
  name: "Cylinder Head",
  modelId: "astra",
  categoryId: "engine_parts",
  description: "Cylinder head assembly for 1.6 CDTI engine",
  quantity: 1,
  specifications: {
    weight: "8.5 kg",
    material: "Aluminum",
    condition: "New",
    warranty: "24 months"
  },
  compatibility: {
    models: ["Opel Astra K"],
    years: [2016, 2017, 2018, 2019, 2020],
    engines: ["1.6 CDTI", "1.6 SIDI"],
    transmissions: ["Manual", "Automatic"]
  },
  pricing: {
    oem: 450.00,
    aftermarket: 285.00,
    currency: "EUR"
  },
  imageUrl: "https://img.7zap.com/...",
  externalLinks: {
    oem: "https://opel.7zap.com/...",
    image: "https://img.7zap.com/..."
  }
}
```

### `vehiclecatalogs`
```javascript
{
  _id: ObjectId(...),
  catalogId: "astra_2018_1_6_cdti_manual_6_speed_engine_parts",
  modelId: "astra",
  modelName: "Opel Astra",
  year: 2018,
  engine: "1.6 CDTI",
  transmission: "Manual 6-speed",
  categoryId: "engine_parts",
  categoryName: "Engine Parts",
  categoryUrl: "https://opel.7zap.com/en/global/astra-engine/",
  categoryIcon: "⚙️",
  description: "Engine components and assemblies",
  partsCount: 145,
  lastUpdated: ISODate("2026-04-01T10:30:00Z")
}
```

---

## Troubleshooting

### Issue: "MongoDB connection failed"
**Solution**:
```bash
# Test connection
mongosh $MONGO_URI

# Check .env file
cat .env | grep MONGO_URI

# Verify IP whitelist in MongoDB Atlas
# Add your IP or 0.0.0.0/0 for testing
```

### Issue: "Timeout fetching URL"
**Solution**:
```javascript
// Increase timeout in config.js
FETCH_TIMEOUT: 120000, // 2 minutes

// Or add retry logic
MAX_RETRIES: 5
RETRY_DELAY: 3000
```

### Issue: "No parts found for category"
**Solution**:
- Website HTML structure may have changed
- Update Cheerio selectors in scraper
- Check Network tab in browser to see actual page structure
- Use different class names or CSS selectors

### Issue: "Scraper running too slow"
**Solution**:
```javascript
// Add parallel processing
const pLimit = require('p-limit');
const limit = pLimit(5); // 5 concurrent requests

// Process categories in parallel
const categoryPromises = categories.map(cat => 
  limit(() => scrapeCategoryParts(model, cat))
);
```

---

## Expected Scraping Times

| Model | Categories | Specs | Parts | Duration |
|-------|-----------|-------|-------|----------|
| Corsa | 8 | 384 | ~4500 | 8-12 min |
| Astra | 8 | 336 | ~6200 | 10-15 min |
| Mokka | 8 | 288 | ~3900 | 7-10 min |
| **Total** | **24** | **1008** | **~14600** | **30-45 min** |

Times vary based on:
- Internet connection speed
- Website response time
- Number of retries needed
- Server load

---

## Data Validation

After scraping completes, verify data integrity:

```javascript
// Check total counts
db.vehiclemodels.countDocuments()           // Should be 3
db.vehiclespecs.countDocuments()            // Should be 1000+
db.vehiclecatalogs.countDocuments()         // Should be 1000+
db.vehicleparts.countDocuments()            // Should be 14000+

// Check for duplicates
db.vehicleparts.aggregate([
  { $group: { _id: "$partNumber", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])

// Verify indexes exist
db.vehicleparts.getIndexes()
db.vehiclespecs.getIndexes()
```

---

## Advanced: Incremental Scraping

Update only specific models or categories:

```javascript
// Modify master-scraper-v2.js

// Scrape only one model
const modelsToScrape = ['astra']; // Or ['corsa'], ['mokka']

// Scrape only specific categories
const categoriesToScrape = ['engine_parts', 'suspension_chassis'];

// Run with custom timeframe
const now = new Date();
const lastScrapedThreshold = new Date(now.getTime() - 24*60*60*1000); // 24 hours ago
```

---

## Monitoring & Logging

### Enable detailed logging:
```bash
# Run with verbose output
DEBUG=* node scrapers/master-scraper-v2.js

# Save output to file
node scrapers/master-scraper-v2.js > logs/scraper-$(date +%Y%m%d-%H%M%S).log 2>&1
```

### Monitor MongoDB collection sizes:
```bash
# Connect to your MongoDB
mongosh $MONGO_URI

# Check collection sizes
db.vehicleparts.stats()
db.vehiclespecs.stats()
db.vehiclecatalogs.stats()
```

---

## Next Steps

1. ✅ Run the master scraper to populate database
2. ✅ Verify data in MongoDB
3. ✅ Test v2.0 API endpoints with populated data
4. ✅ Deploy to production
5. ✅ Schedule automatic daily scrapes (optional)

---

## Integration with v2.0 API

Once scraped, these endpoints become fully functional:

```bash
# Get all models
curl http://localhost:5000/api/v2/models

# Decode VIN and get parts
curl -X POST http://localhost:5000/api/v2/vehicle/decode/vin \
  -H "Authorization: Bearer <token>" \
  -d '{"vin":"W0L0TGH86K2000002"}'

# Get engine parts for vehicle
curl http://localhost:5000/api/v2/vehicle/parts/engine_parts?vin=W0L0TGH86K2000002

# Search across all parts
curl http://localhost:5000/api/v2/search/parts?q=cylinder+head
```

See [API_REFERENCE.md](../API_REFERENCE.md) for all available endpoints.

---

## Support & Optimization

For issues or optimization:
1. Check console output for specific error messages
2. Review MongoDB query performance
3. Add database indexes if needed
4. Implement parallel scraping for faster processing
5. Cache results for repeated requests

**Status**: Master Scraper v2.0 Ready to Deploy ✅
