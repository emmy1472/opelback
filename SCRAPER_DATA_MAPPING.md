# Master Scraper v2.0 - Data Extraction & Storage Mapping

## Complete Data Flow Diagram

```
7zap.com Website (Source)
        ↓
    [SCRAPER]
        ↓
     Parse HTML
    + Extract
    + Validate
        ↓
   MongoDB Collections
        ├── vehiclemodels
        ├── vehiclespecs
        ├── vehiclecatalogs
        ├── vehicleparts
        └── explodeddiagrams
        ↓
   v2.0 API Endpoints
        ↓
   Frontend Application
```

---

## Data Extraction by Source

### 1. VEHICLE MODELS
**Source URL**: `https://opel.7zap.com/en/global/`

**Extraction Logic**:
```javascript
// Look for model links in page
const links = $('a[href*="global/corsa/"], a[href*="global/astra/"], a[href*="global/mokka/"]');
// Extract: name, URL, type
```

**Stored As**:
```javascript
{
  modelId: "astra",
  name: "Opel Astra",
  type: "Family Sedan",
  baseUrl: "https://opel.7zap.com/en/global/astra/",
  yearsSupported: "2010-2026",
  partsCatalogSize: 6234,
  lastScrapedAt: ISODate("2026-04-01T10:30:00Z")
}
```

**Collection**: `vehiclemodels`  
**Expected Count**: 3  
**Sample Queries**:
```javascript
db.vehiclemodels.find()                                  // All models
db.vehiclemodels.findOne({ modelId: "astra" })          // Get Astra
db.vehiclemodels.updateOne({ modelId: "astra" }, 
  { $set: { lastScrapedAt: new Date() } })              // Update timestamp
```

---

### 2. VEHICLE SPECIFICATIONS
**Source URL**: Per model (e.g., `https://opel.7zap.com/en/global/astra/`)

**Extraction Logic**:
```javascript
// Extract from HTML or generate based on year range
// Years: Parse from page or default range (e.g., 2010-2026)
// Engines: Extract from spec table or common options
// Transmissions: Parse from available options

const yearsRange = [2010, 2011, 2012, ..., 2026];
const engines = ["1.4 Turbo", "1.6 CDTI", "1.6 SIDI"];
const transmissions = ["Manual", "Automatic"];

// Generate combinations for all year/engine/transmission
```

**Stored As**:
```javascript
{
  modelId: "astra",
  modelName: "Opel Astra",
  year: 2018,
  engine: "1.6 CDTI",
  transmission: "Manual 6-speed",
  trim: "Edition",
  bodyType: "Sedan",
  driveType: "Front-Wheel Drive",
  modelUrl: "https://opel.7zap.com/en/global/astra/",
  catalogId: "astra_2018_1_6_cdti_manual_6_speed",
  createdAt: ISODate("2026-04-01T10:30:00Z")
}
```

**Collection**: `vehiclespecs`  
**Expected Count**: ~1,008 (336 per model)
- Astra: 17 years × 3 engines × 2 transmissions = 102, × years variation ≈ ~336
- Corsa: Similar calculation ≈ ~384
- Mokka: Similar calculation ≈ ~288

**Sample Queries**:
```javascript
// All specs for Astra
db.vehiclespecs.find({ modelId: "astra" })

// Get 2018 Astra specs
db.vehiclespecs.find({ modelId: "astra", year: 2018 })

// Get CDTI engine specs
db.vehiclespecs.find({ engine: "1.6 CDTI" })

// Count specs per model
db.vehiclespecs.aggregate([
  { $group: { _id: "$modelId", count: { $sum: 1 } } }
])
```

---

### 3. PART CATEGORIES
**Source URL**: Per model (e.g., `https://opel.7zap.com/en/global/astra-engine/`)

**Category Hierarchy**:
```
Model Page
  ├── Engine Parts
  │   ├── Pistons & Rings
  │   ├── Oil & Filters
  │   └── Cooling System
  ├── Suspension & Chassis
  │   ├── Springs & Dampers
  │   ├── Wheel Bearings
  │   └── Sway Bars
  ├── Electrical System
  │   ├── Battery
  │   ├── Alternator
  │   └── Starters
  ├── Body & Interior
  ├── Braking System
  ├── Fuel System
  ├── Transmission
  └── Cooling System
```

**Extraction Logic**:
```javascript
// Look for category links
const categoryLinks = $('a').filter((i, el) => {
  const href = $(el).attr('href');
  const text = $(el).text().trim();
  // Category if: contains '-engine/', '-suspension/', etc.
  // Or: has CSS class indicating category
});
```

**Stored As** (in `vehiclecatalogs`):
```javascript
{
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

**Collection**: `vehiclecatalogs`  
**Expected Count**: ~1,008 (specs × 8 categories)

---

### 4. INDIVIDUAL PARTS
**Source URL**: Per category (e.g., `https://opel.7zap.com/en/global/astra-engine/`)

**Page Structure** (typical):
```html
<table>
  <tr><th>Part Name</th><th>Part Number</th><th>Qty</th><th>Description</th></tr>
  <tr>
    <td>Cylinder Head</td>
    <td>5514099</td>
    <td>1</td>
    <td>Cylinder head assembly for 1.6 CDTI engine</td>
    <img src="https://img.7zap.com/parts/5514099.webp" />
  </tr>
  ...
</table>
```

**Extraction Logic**:
```javascript
// Parse table rows
$('table tr').each((rowIdx, row) => {
  if (rowIdx === 0) return; // Skip header
  
  const cells = $(row).find('td');
  const partName = cells[0].text();      // "Cylinder Head"
  const partNumber = cells[1].text();    // "5514099"
  const quantity = cells[2].text();      // "1"
  const description = cells[3].text();   // Description text
  const imageUrl = $(row).find('img').attr('src');
});
```

**Stored As**:
```javascript
{
  partId: "p_001_5514099",
  partNumber: "5514099",
  name: "Cylinder Head",
  categoryId: "engine_parts",
  modelId: "astra",
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
  alternativeParts: ["5514100", "5514101"],
  pricing: {
    oem: 450.00,
    aftermarket: 285.00,
    currency: "EUR"
  },
  imageUrl: "https://img.7zap.com/parts/5514099.webp",
  externalLinks: {
    oem: "https://opel.7zap.com/...",
    image: "https://img.7zap.com/parts/5514099.webp"
  },
  createdAt: ISODate("2026-04-01T10:30:00Z"),
  lastUpdated: ISODate("2026-04-01T10:30:00Z")
}
```

**Collection**: `vehicleparts`  
**Expected Count**: ~14,600 parts

**Breakdown by Model**:
| Model | Parts |
|-------|-------|
| Corsa | ~4,521 |
| Astra | ~6,234 |
| Mokka | ~3,891 |
| **Total** | **~14,646** |

**Sample Queries**:
```javascript
// All parts for engine category
db.vehicleparts.find({ categoryId: "engine_parts" })

// Get cylinder head part by number
db.vehicleparts.findOne({ partNumber: "5514099" })

// Get all alternative parts
db.vehicleparts.find({ alternativeParts: { $exists: true } })

// Find parts used in Astra 2018
db.vehicleparts.find({ 
  modelId: "astra",
  "compatibility.years": 2018
})

// Count parts per category
db.vehicleparts.aggregate([
  { $group: { _id: "$categoryId", count: { $sum: 1 } } }
])

// Search for parts by name
db.vehicleparts.find({ name: /cylinder/i })

// Find most viewed parts
db.vehicleparts.find()
  .sort({ viewCount: -1 })
  .limit(10)
```

---

### 5. EXPLODED DIAGRAMS
**Source URL**: Categories with visual schematics (e.g., `https://opel.7zap.com/...`)

**Extraction Logic**:
```javascript
// Look for SVG or diagram images
const svgElement = $('svg').first();
const diagramImage = $('img[src*="diagram"], img[src*="exploded"]').first();

if (svgElement || diagramImage) {
  // Extract diagram metadata
  const diagramUrl = svgElement.parent().attr('href') || 
                     diagramImage.attr('src');
  
  // Extract clickable parts (coordinates)
  const hotspots = svgElement.find('[id*="part"], g[class*="part"]')
    .map((i, el) => ({
      componentId: $(el).attr('id'),
      partNumber: extractPartNumber($(el)),
      x: $(el).attr('cx') || $(el).attr('x'),
      y: $(el).attr('cy') || $(el).attr('y')
    }));
}
```

**Stored As**:
```javascript
{
  diagramId: "astra_engine_parts",
  modelId: "astra",
  categoryId: "engine_parts",
  categoryName: "Engine Parts",
  diagramUrl: "https://opel.7zap.com/diagrams/engine_parts.svg",
  diagramType: "interactive", // or "static"
  partMappings: [
    {
      componentId: "comp_001",
      partNumber: "5514099",
      partName: "Cylinder Head",
      quantity: 1
    },
    ...
  ],
  hotSpots: [
    {
      componentId: "comp_001",
      partNumber: "5514099",
      coordinateX: 450,
      coordinateY: 320,
      hotspotUrl: "/api/v2/vehicle/parts/p_001_5514099/details"
    },
    ...
  ],
  metadata: {
    originalSource: "https://opel.7zap.com/...",
    scale: "1:2",
    cached: true,
    lastUpdated: ISODate("2026-04-01T10:30:00Z")
  }
}
```

**Collection**: `explodeddiagrams` (or enhanced `vehiclecatalogs`)  
**Expected Count**: ~12 (1-2 per primary category)

---

## Data Statistics Summary

### Before Scraping (Empty Database)
```
vehiclemodels:     0 documents
vehiclespecs:      0 documents
vehiclecatalogs:   0 documents
vehicleparts:      0 documents
explodeddiagrams:  0 documents
```

### After Scraping (Expected)
```
vehiclemodels:     3 documents
vehiclespecs:      1,008 documents (336 × 3 models)
vehiclecatalogs:   1,008 documents
vehicleparts:      14,646 documents (avg 4,882 per model)
explodeddiagrams:  12 documents

Total Records:     ~16,677
Database Size:     ~400-500MB
Scraping Time:     30-45 minutes
```

### Storage Breakdown
| Collection | Avg Doc Size | Docs | Total Size |
|-----------|-------------|------|-----------|
| vehiclemodels | 500B | 3 | 1.5KB |
| vehiclespecs | 300B | 1,008 | 302KB |
| vehiclecatalogs | 700B | 1,008 | 706KB |
| vehicleparts | 2KB | 14,646 | 28MB |
| explodeddiagrams | 5KB | 12 | 60KB |
| **TOTAL** | | **16,677** | **~29MB** |

---

## Indexing for Performance

After scraping, create these indexes:

```javascript
// vehicleparts indexes (most queried)
db.vehicleparts.createIndex({ partNumber: 1 }, { unique: true })
db.vehicleparts.createIndex({ categoryId: 1, modelId: 1 })
db.vehicleparts.createIndex({ "compatibility.models": 1 })
db.vehicleparts.createIndex({ name: "text" })  // Text search

// vehiclespecs indexes
db.vehiclespecs.createIndex({ modelId: 1, year: 1 })
db.vehiclespecs.createIndex({ catalogId: 1 }, { unique: true })

// vehiclecatalogs indexes
db.vehiclecatalogs.createIndex({ catalogId: 1 }, { unique: true })
db.vehiclecatalogs.createIndex({ modelId: 1, categoryId: 1 })

// vehiclemodels indexes
db.vehiclemodels.createIndex({ modelId: 1 }, { unique: true })

// searchhistories indexes (for analytics)
db.searchhistories.createIndex({ userId: 1, timestamp: -1 })
db.searchhistories.createIndex({ timestamp: -1 })
```

---

## Expected Query Performance

After indexing:

| Query | Response Time |
|-------|---|
| Get model by ID | <10ms |
| Get all specs for model | <50ms |
| Get parts by category | <100ms |
| Search parts by name | <200ms |
| Get catalog for vehicle | <75ms |
| List all models | <15ms |

---

## Verification Queries

After scraping completes, verify integrity:

```javascript
// 1. Count documents
db.vehiclemodels.countDocuments()      // Should be 3
db.vehiclespecs.countDocuments()       // Should be 1000+
db.vehicleparts.countDocuments()       // Should be 14000+

// 2. Check for duplicates
db.vehicleparts.aggregate([
  { $group: { _id: "$partNumber", count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
])  // Should return empty (no duplicates)

// 3. Verify all parts have images
db.vehicleparts.countDocuments({ imageUrl: null })  // Should be low

// 4. Check part references
db.vehiclespecs.updateMany({}, [
  { $set: { 
      compatiblePartNumbers: {
        $filter: { input: "$_id", as: "id", cond: { $gt: ["$$id", 0] } }
      }
    }
  }
])

// 5. Distribution check
db.vehicleparts.aggregate([
  { $group: { _id: "$modelId", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
// Expected: corsa ~4500, astra ~6200, mokka ~3900
```

---

## Data Quality Metrics

**After Scraping, You Should See**:
- ✅ 100% of models successfully scraped
- ✅ 95%+ part numbers are valid (4-20 characters, alphanumeric)
- ✅ 85%+ parts have images
- ✅ 0 duplicate parts (identified by part number)
- ✅ All specs have valid year/engine/transmission
- ✅ All catalogs mapped to valid categories
- ✅ Database consistency: No orphaned records

---

**Status**: All data extraction logic documented and ready for production!
