# JSON Data Storage Guide

## Overview

Your OEM parts data is now stored in **JSON format** instead of the database. This gives you:

- ✅ **File-based storage** - No database required
- ✅ **Easy portability** - Share JSON files easily
- ✅ **Data independence** - Works offline
- ✅ **Query tools** - Built-in JSON query loader
- ✅ **Export/import** - Convert to CSV, JSON anytime

---

## Files Created

| File | Purpose | Size |
|------|---------|------|
| `parts-data.json` | **Main data file** - 59 OEM parts | 21.46 KB |
| `csv-to-json.js` | CSV to JSON converter | Tool |
| `json-data-loader.js` | Query & export tool | Tool |
| `sample-data.csv` | Source CSV (reference) | 4.2 KB |

---

## JSON File Structure

```json
{
  "metadata": {
    "version": "1.0",
    "createdAt": "2026-04-01T01:09:02.263Z",
    "source": "sample-data.csv",
    "recordCount": 59,
    "description": "OEM Parts Data - Opel Automotive Catalog"
  },
  "parts": [
    {
      "partNumber": "1628-451-007",
      "name": "Cylinder Head Gasket",
      "category": "Engine",
      "model": "corsa",
      "price": 142.5,
      "oem_price": 142.5,
      "aftermarket_price": 89.99,
      "description": "OEM cylinder head gasket for Opel Corsa",
      "manufacturer": "Opel",
      "url": "https://opel.7zap.com/en/global/corsa-parts-catalog/"
    },
    ...
  ]
}
```

---

## Query Tools

### 1️⃣ Command-Line Queries

```bash
# Get statistics
node json-data-loader.js stats

# Get all models
node json-data-loader.js models

# Get all categories
node json-data-loader.js categories

# Get parts by model
node json-data-loader.js byModel corsa
node json-data-loader.js byModel astra
node json-data-loader.js byModel mokka

# Get parts by category
node json-data-loader.js byCategory Engine
node json-data-loader.js byCategory Brakes
node json-data-loader.js byCategory Transmission

# Search parts
node json-data-loader.js search "cylinder"
node json-data-loader.js search "brake"
node json-data-loader.js search "1628-451"

# Export to JSON
node json-data-loader.js export-json corsa-parts.json

# Export to CSV
node json-data-loader.js export-csv parts.csv
```

### 2️⃣ Programmatic Usage (JavaScript)

```javascript
const PartsDataLoader = require('./json-data-loader');

// Create loader
const loader = new PartsDataLoader('parts-data.json');

// Get all parts
const allParts = loader.getAll();

// Query by model
const corsaParts = loader.getPartsByModel('corsa');

// Query by category
const engineParts = loader.getPartsByCategory('Engine');

// Query by model AND category
const corsaEngine = loader.getPartsByModelAndCategory('corsa', 'Engine');

// Search
const results = loader.search('cylinder head');

// Get statistics
const stats = loader.getStats();
console.log(stats);
// Output:
// {
//   totalParts: 59,
//   totalModels: 1,
//   totalCategories: 7,
//   byModel: { corsa: 59 },
//   byCategory: {
//     Engine: 11,
//     Brakes: 9,
//     Suspension: 12,
//     Transmission: 8,
//     Electrical: 9,
//     'Fuel System': 3,
//     Cooling: 7
//   },
//   priceRange: { min: 12.5, max: 1199.99, avg: '144.34' }
// }

// Export to JSON
loader.exportToJSON(corsaParts, 'corsa-only.json');

// Export to CSV
loader.exportToCSV(engineParts, 'engine-parts.csv');
```

---

## Data Statistics

```
Total Parts:       59
Total Models:      1 (Corsa)
Total Categories:  7

By Category:
  • Engine:          11 parts
  • Brakes:           9 parts
  • Suspension:      12 parts
  • Transmission:     8 parts
  • Electrical:       9 parts
  • Fuel System:      3 parts
  • Cooling:          7 parts

Price Range:
  • Min:  €12.50
  • Max:  €1,199.99
  • Avg:  €144.34
```

---

## Adding More Data

### Step 1: Prepare CSV from Website

**Extract from 7zap.com:**
1. Visit: https://opel.7zap.com/en/global/corsa-parts-catalog/engine/
2. Copy the parts table
3. Paste into Excel/LibreOffice
4. Save as `astra-parts.csv`

### Step 2: Convert to JSON

```bash
node csv-to-json.js --input astra-parts.csv --output astra-data.json
```

### Step 3: Merge Multiple JSON Files

Create `merge-json.js`:

```javascript
const fs = require('fs');

const files = [
  'parts-data.json',      // Corsa
  'astra-data.json',      // Astra
  'mokka-data.json'       // Mokka
];

let allParts = [];
files.forEach(file => {
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    allParts = allParts.concat(data.parts);
  }
});

const merged = {
  metadata: {
    version: "1.0",
    createdAt: new Date().toISOString(),
    recordCount: allParts.length,
    description: "OEM Parts Data - All Models"
  },
  parts: allParts
};

fs.writeFileSync('all-parts.json', JSON.stringify(merged, null, 2));
console.log(`✅ Merged ${allParts.length} parts into all-parts.json`);
```

Run:
```bash
node merge-json.js
```

---

## Backup & Distribution

### Backup JSON File

```bash
# Create backup
copy parts-data.json parts-data-backup.json

# Compress for storage
tar -czf parts-data.tar.gz parts-data.json
```

### Share JSON File

```bash
# Email/transfer
# File size: ~21 KB (very portable)

# Or host on GitHub/server and download:
curl https://your-server.com/parts-data.json > parts-data.json
```

### Version Control

Add to Git:
```bash
git add parts-data.json
git commit -m "Update OEM parts data: 59 Corsa parts"
git push
```

---

## Comparison: JSON vs Database

| Feature | JSON File | MongoDB |
|---------|-----------|---------|
| **Setup** | No setup needed | Requires MongoDB |
| **File Size** | Small (21 KB) | Large indexes |
| **Portability** | Easy - just copy file | Complex - export/import |
| **Offline** | ✅ Works offline | ❌ Requires server |
| **Scalability** | ~10K items max | Unlimited |
| **Real-time Sync** | Manual | Automatic |
| **Multi-user** | Read-only share | Full CRUD |
| **Query Speed** | Instant (small data) | Faster (large data) |

**Use JSON for:** Small datasets, portability, offline use, file distribution  
**Use Database for:** Large datasets, multi-user, real-time sync, complex queries

---

## API Integration (Optional)

If you want an API to serve JSON data:

Create `server-json.js`:

```javascript
const express = require('express');
const PartsDataLoader = require('./json-data-loader');

const app = express();
const loader = new PartsDataLoader('parts-data.json');

app.get('/api/parts', (req, res) => {
  res.json(loader.getAll());
});

app.get('/api/parts/by-model/:model', (req, res) => {
  res.json(loader.getPartsByModel(req.params.model));
});

app.get('/api/parts/by-category/:category', (req, res) => {
  res.json(loader.getPartsByCategory(req.params.category));
});

app.get('/api/search', (req, res) => {
  const query = req.query.q;
  res.json(loader.search(query));
});

app.get('/api/stats', (req, res) => {
  res.json(loader.getStats());
});

app.listen(3000, () => console.log('Server on :3000'));
```

Run:
```bash
node server-json.js
```

Then query:
```bash
curl http://localhost:3000/api/stats
curl http://localhost:3000/api/parts/by-model/corsa
curl http://localhost:3000/api/search?q=cylinder
```

---

## Management Workflow

### Daily Workflow

```bash
# 1. Query parts
node json-data-loader.js search "cylinder head"

# 2. Export results
node json-data-loader.js export-csv results.csv

# 3. Share CSV with team
# Send results.csv to workshop/team
```

### Adding New Models

```bash
# 1. Extract from website
# Visit https://opel.7zap.com/en/global/astra-parts-catalog/

# 2. Save as CSV
# Save table as astra-parts.csv

# 3. Convert to JSON
node csv-to-json.js --input astra-parts.csv --output astra-data.json

# 4. Merge datasets
node merge-json.js

# 5. Verify
node json-data-loader.js stats
```

---

## Troubleshooting

### "Cannot find parts-data.json"

Check file exists:
```bash
ls -la parts-data.json
```

If missing, recreate:
```bash
node csv-to-json.js --input sample-data.csv --output parts-data.json
```

### JSON parsing errors

Validate JSON syntax:
```bash
node -e "console.log(JSON.parse(require('fs').readFileSync('parts-data.json')))"
```

Fix corrupted file - restore from backup:
```bash
copy parts-data-backup.json parts-data.json
```

### Large file size

Compress JSON:
```bash
gzip -k parts-data.json
# Creates parts-data.json.gz (smaller)
```

---

## Summary

✅ **59 OEM parts** = `parts-data.json` (21 KB)  
✅ **Zero database setup** needed  
✅ **Query tools** included  
✅ **Easily portable** - copy/email file  
✅ **Offline compatible** - works anywhere  

**Start querying:**
```bash
node json-data-loader.js stats
node json-data-loader.js byModel corsa
node json-data-loader.js search "brake"
```

---

## Next Steps

1. **Review the JSON** - Open `parts-data.json` in editor
2. **Run queries** - Test the loader with different filters
3. **Extract more data** - Get Astra & Mokka parts from website
4. **Merge datasets** - Combine all models into one file
5. **Share with team** - Send JSON file or export CSV

🎉 Your OEM parts data is ready to use!
