# JSON Data Quick Start

## ✅ What You Have Now

**File:** `parts-data.json` (21 KB)
- 59 OEM parts for Opel Corsa
- Metadata with version & timestamp
- Price data, descriptions, URLs
- Single JSON file - no database needed

---

## 🚀 Quick Commands

### Check Data
```bash
node json-data-loader.js stats
```

Output shows:
- Total parts: 59
- Categories: Engine, Brakes, Suspension, Transmission, Electrical, Fuel System, Cooling
- Price range: €12.50 - €1,199.99

### Query by Model
```bash
node json-data-loader.js byModel corsa
```

### Search Parts
```bash
node json-data-loader.js search "brake"
node json-data-loader.js search "cylinder"
node json-data-loader.js search "1628-451"
```

### Export Data
```bash
# Export to new JSON
node json-data-loader.js export-json output.json

# Export to CSV (for Excel)
node json-data-loader.js export-csv parts.csv
```

---

## 📝 Sample Results

**One part looks like:**
```json
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
}
```

---

## 📊 Data Breakdown

| Category | Count | Price Range |
|----------|-------|-------------|
| Engine | 11 | €12.50 - €189.99 |
| Brakes | 9 | €24.99 - €189.99 |
| Suspension | 12 | €69.99 - €199.99 |
| Transmission | 8 | €34.99 - €1,199.99 |
| Electrical | 9 | €34.99 - €189.99 |
| Fuel System | 3 | €24.99 - €299.99 |
| Cooling | 7 | €24.99 - €189.99 |

---

## 🔄 How to Add More Data

### From Website to JSON (3 steps)

**Step 1: Extract CSV**
- Visit: https://opel.7zap.com/en/global/astra-parts-catalog/
- Copy table → Paste to Excel
- Save as `astra-parts.csv`

**Step 2: Convert to JSON**
```bash
node csv-to-json.js --input astra-parts.csv --output astra-data.json
```

**Step 3: Result**
- New file: `astra-data.json` ready to use

---

## 💻 Use in Your Code

```javascript
const PartsDataLoader = require('./json-data-loader');
const loader = new PartsDataLoader('parts-data.json');

// Get results
const corsaParts = loader.getPartsByModel('corsa');
const engineParts = loader.getPartsByCategory('Engine');
const results = loader.search('cylinder');

console.log(`Found ${corsaParts.length} Corsa parts`);
corsaParts.forEach(p => {
  console.log(`${p.partNumber}: ${p.name} - €${p.price}`);
});
```

---

## 📁 Files Reference

| File | Purpose |
|------|---------|
| `parts-data.json` | **Your data** - 59 parts in JSON format |
| `csv-to-json.js` | Convert CSV → JSON |
| `json-data-loader.js` | Query & export tool |
| `sample-data.csv` | Original CSV (reference) |
| `JSON_DATA_STORAGE_GUIDE.md` | Full documentation |

---

## 🎯 Typical Workflow

```bash
# Day 1: Extract data
# Visit 7zap.com → Copy table → Save as astra-parts.csv

# Day 2: Convert & organize
node csv-to-json.js --input astra-parts.csv --output astra.json
node json-data-loader.js stats

# Day 3: Use data
node json-data-loader.js search "transmission"
node json-data-loader.js export-csv report.csv

# Day 4: Share
# Email parts-data.json to team
# File size: 21 KB (easy to share!)
```

---

## ❓ FAQ

**Q: Where is my data?**
A: In `parts-data.json` - single JSON file, 21 KB

**Q: Do I need MongoDB?**
A: No! Data is in JSON file, no database needed

**Q: Can I share this with my team?**
A: Yes! Just copy `parts-data.json` and share

**Q: How do I add Astra & Mokka parts?**
A: Extract from website → CSV → use csv-to-json.js → merge

**Q: Can I update parts?**
A: Yes, edit the JSON file directly or re-export from website

**Q: What if I need more than 59 parts?**
A: Repeat the extraction process for other categories/models

---

## ✨ Benefits

✅ **No database setup** - JSON file only  
✅ **Portable** - Copy/email anywhere  
✅ **Offline** - Works without internet  
✅ **Searchable** - Query tools included  
✅ **Exportable** - Convert to CSV/JSON anytime  
✅ **Lightweight** - 21 KB file size  
✅ **Version control** - Add to Git  

---

## 🔗 Next Steps

1. **Review the data:**
   ```bash
   node json-data-loader.js stats
   ```

2. **Try a search:**
   ```bash
   node json-data-loader.js search "brake"
   ```

3. **Export results:**
   ```bash
   node json-data-loader.js export-csv brakes.csv
   ```

4. **Share the file:**
   ```bash
   cp parts-data.json team-share/
   ```

---

**Your OEM parts data is ready to use! 🎉**
