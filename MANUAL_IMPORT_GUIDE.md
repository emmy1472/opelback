# Manual Data Import Guide

## Overview

Since 7zap.com actively blocks bots, we provide multiple ways to manually import real OEM parts data into your database:

1. **Command-line CSV import** - For bulk data from files
2. **API JSON import** - For programmatic imports
3. **CSV file upload via API** - For browser-based uploads

---

## Method 1: Command-Line Import (Recommended)

### Step 1: Extract data from 7zap.com website

Visit: https://opel.7zap.com/en/global/corsa-parts-catalog/

**Manual Extraction:**
1. Right-click on the page → **View Page Source** (or press F12)
2. Search for part data patterns (look for tables or JSON in `<script>` tags)
3. Copy the relevant data into a CSV file

**Using Browser Dev Tools:**
1. Open DevTools (F12)
2. Go to **Network** tab
3. Reload the page
4. Look for XHR/Fetch requests (API calls)
5. Export the JSON response

**Quick Method (Copy from Table):**
1. Open the parts table on the website
2. Select all data (Ctrl+A)
3. Paste into Excel/Calc
4. Save as CSV

### Step 2: Prepare CSV file

**CSV Format** (headers required in first row):

```csv
partNumber,name,category,model,price,oem_price,aftermarket_price,description,manufacturer,url
1628-451-007,Cylinder Head Gasket,Engine,corsa,142.50,142.50,89.99,OEM cylinder head gasket,Opel,https://opel.7zap.com/en/global/corsa-parts-catalog/
1628-451-008,Valve Cover Gasket,Engine,corsa,56.99,56.99,34.50,Valve cover gasket assembly,Opel,https://opel.7zap.com/en/global/corsa-parts-catalog/
```

**Required Columns:**
- `partNumber` ✓ (e.g., 1628-451-007)
- `name` ✓ (e.g., Cylinder Head Gasket)
- `model` ✓ (corsa, astra, or mokka)

**Optional Columns:**
- `category` (Engine, Brakes, Transmission, etc.)
- `price` (single price)
- `oem_price` (OEM pricing)
- `aftermarket_price` (aftermarket pricing)
- `description` (part description)
- `manufacturer` (default: Opel)
- `url` (source URL)

**Save as:** `parts.csv`

### Step 3: Run import command

```bash
node import-data.js --file parts.csv --format csv
```

**Output example:**
```
╔════════════════════════════════════════════════════════╗
║ OEM Parts Data Importer                                ║
╚════════════════════════════════════════════════════════╝

[IMPORTER] Connecting to MongoDB...
[IMPORTER] ✅ Connected

[IMPORTER] Parsed 65 CSV records

[IMPORTER] Found 3 vehicle models

   ✅ Imported 50 parts...

╔════════════════════════════════════════════════════════╗
║ IMPORT SUMMARY                                         ║
╚════════════════════════════════════════════════════════╝

✅ Imported:  65
⚠️  Skipped:  0
❌ Errors:    0
────────────────────────────
📊 Total in database: 65
```

---

## Method 2: API Import (JSON)

### Step 1: Prepare JSON file

**JSON Format** (`data.json`):

```json
{
  "parts": [
    {
      "partNumber": "1628-451-007",
      "name": "Cylinder Head Gasket",
      "category": "Engine",
      "model": "corsa",
      "price": 142.50,
      "oem_price": 142.50,
      "aftermarket_price": 89.99,
      "description": "OEM cylinder head gasket",
      "manufacturer": "Opel",
      "url": "https://opel.7zap.com/..."
    },
    {
      "partNumber": "1628-451-008",
      "name": "Valve Cover Gasket",
      "category": "Engine",
      "model": "corsa",
      "price": 56.99
    }
  ]
}
```

### Step 2: Send API request

**Using cURL:**
```bash
curl -X POST http://localhost:5000/api/parts/import \
  -H "Content-Type: application/json" \
  -d @data.json
```

**Using PowerShell:**
```powershell
$json = Get-Content data.json | ConvertFrom-Json
$body = $json | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:5000/api/parts/import `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**Using Python:**
```python
import requests
import json

with open('data.json', 'r') as f:
    data = json.load(f)

response = requests.post(
    'http://localhost:5000/api/parts/import',
    json=data,
    headers={'Content-Type': 'application/json'}
)

print(response.json())
```

### Step 3: Check response

**Success response:**
```json
{
  "success": true,
  "message": "Successfully imported 65/65 parts",
  "imported": 65,
  "errors": null,
  "totalInDatabase": 65
}
```

---

## Method 3: CSV Upload via API (File Upload)

### Step 1: Prepare CSV file (same as Method 1)

### Step 2: Upload via cURL

```bash
curl -X POST http://localhost:5000/api/parts/import/csv \
  -F "file=@parts.csv"
```

### Step 3: Upload via Form (HTML/JavaScript)

```html
<form id="uploadForm">
  <input type="file" id="csvFile" name="file" accept=".csv" required>
  <button type="submit">Upload CSV</button>
</form>

<script>
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const file = document.getElementById('csvFile').files[0];
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:5000/api/parts/import/csv', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  console.log(result);
  alert(`Imported: ${result.imported} parts`);
});
</script>
```

---

## Sample Data File

A sample CSV with real Corsa parts is included:

```bash
# Use sample data to get started
node import-data.js --file sample-data.csv --format csv
```

This will import ~65 realistic OEM parts for the Corsa model.

---

## Models Reference

Supported vehicle models:
- `corsa` - Opel Corsa (Compact Hatchback)
- `astra` - Opel Astra (Family Sedan)
- `mokka` - Opel Mokka (Compact SUV)

Parts must use one of these exact model names.

---

## Data Extraction Tips

### From HTML Tables

**On 7zap.com Parts Pages:**

1. Right-click → **Inspect Element** (or F12)
2. Look for `<table>` tags with part data
3. Copy table structure:
   ```
   Part Number | Part Name | Category | Price
   1628-451-007 | Cylinder Head Gasket | Engine | €142.50
   ```
4. Convert to CSV format

### From API Responses

**Network Tab Method:**

1. Open DevTools (F12) → **Network** tab
2. Reload page (F5)
3. Look for XHR/API calls (filter by "Fetch/XHR")
4. Click on requests and check **Response** tab
5. Look for JSON arrays with part data

**Example API call:**
```
GET https://opel.7zap.com/api/parts?model=corsa&category=engine
```

Response structure:
```json
{
  "parts": [
    {
      "partNumber": "1628-451-007",
      "name": "Cylinder Head Gasket",
      "price": 142.50
    }
  ]
}
```

### From Screenshots

If manual entry needed:
1. Screenshot part tables
2. Use OCR tool (e.g., Google Lens)
3. Copy to CSV
4. Import

---

## Verify Import

### Check database

```bash
# Check total parts
curl http://localhost:5000/api/parts/import/status

# Expected output:
# {
#   "success": true,
#   "totalParts": 65,
#   "totalModels": 3,
#   "bySource": {
#     "manual_import": 65
#   }
# }
```

### Query parts

```bash
# Get parts by model
curl "http://localhost:5000/api/vehicle/corsa/parts"

# Get parts by category
curl "http://localhost:5000/api/vehicle/corsa/parts?category=engine"
```

---

## Troubleshooting

### Import shows 0 parts imported

**Cause:** Model names don't match
- Check CSV has `model` column with values: `corsa`, `astra`, or `mokka`
- Make sure capitalization is correct (lowercase)

**Solution:**
```csv
# ✅ Correct
model
corsa
astra

# ❌ Wrong
model
Corsa
CORSA
```

### Error: "Cannot find module 'multer'"

**Solution:**
```bash
npm install multer --save
npm start
```

### Duplicate parts not updated

**Expected behavior:** If `partNumber` already exists for a model, it's updated (not re-inserted).

To force re-import:
```bash
# Connect to MongoDB and delete old parts
mongo
db.vehicleparts.deleteMany({ model: "corsa" })
# Then re-run import
```

### CSV parsing errors with special characters

**Solution:** Save CSV with UTF-8 encoding in Excel:
1. File → Save As
2. Format: CSV UTF-8 (.csv)
3. Check "Edit filter settings"
4. Ensure "UTF-8" is selected

---

## Bulk Import (Multiple Files)

Create script `bulk-import.sh`:

```bash
#!/bin/bash

for file in *.csv; do
  echo "Importing $file..."
  node import-data.js --file "$file" --format csv
  sleep 2
done
```

Run with:
```bash
bash bulk-import.sh
```

---

## Next Steps

After importing data:

1. **Start server:**
   ```bash
   npm start
   ```

2. **Test API endpoints:**
   ```bash
   # Get all models
   curl http://localhost:5000/api/vehicle/models

   # Get Corsa parts
   curl http://localhost:5000/api/vehicle/corsa/parts?limit=10

   # Decode VIN
   curl -X POST http://localhost:5000/api/vin/decode \
     -d '{"vin":"WOPWGJ3236K000001"}' \
     -H "Content-Type: application/json"
   ```

3. **Use VIN decoder to get parts:**
   ```bash
   curl http://localhost:5000/api/vin/WOPWGJ3236K000001/parts
   ```

---

## Support

For issues:
- Check `node_modules` has multer: `npm list multer`
- Verify MongoDB connection: Check .env `MONGO_URI`
- Test CSV format: Use included `sample-data.csv` as template
