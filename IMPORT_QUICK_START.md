# Quick Start - Data Import

## Status

✅ **Server Running:** http://localhost:5000
✅ **Database:** 190 OEM parts imported
✅ **Models:** 9 vehicle models available

---

## You Now Have 3 Ways to Import Data

### 1️⃣ Command-Line Import (Fastest)

```bash
# Import CSV file
node import-data.js --file data.csv --format csv

# Or JSON file  
node import-data.js --file data.json --format json
```

**Expected output:**
```
╔════════════════════════════════════════════════════════╗
║ OEM Parts Data Importer                                ║
╚════════════════════════════════════════════════════════╝

[IMPORTER] Parsing 59 CSV records
✅ Imported:  59
Total in database: 249
```

---

### 2️⃣ API JSON Import (Programmatic)

**Send JSON data directly to API:**

```bash
curl -X POST http://localhost:5000/api/parts/import \
  -H "Content-Type: application/json" \
  -d '{
    "parts": [
      {
        "partNumber": "1628-451-007",
        "name": "Cylinder Head Gasket",
        "model": "corsa",
        "category": "Engine",
        "price": 142.50
      }
    ]
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully imported 1/1 parts",
  "imported": 1,
  "totalInDatabase": 191
}
```

---

### 3️⃣ CSV File Upload (Browser/Form)

**Upload CSV via API endpoint:**

```bash
curl -X POST http://localhost:5000/api/parts/import/csv \
  -F "file=@parts.csv"
```

---

## CSV Format Reference

**Required columns:**
- `partNumber` - e.g., 1628-451-007
- `name` - e.g., Cylinder Head Gasket

**Optional columns:**
- `model` - corsa, astra, or mokka
- `category` - Engine, Brakes, Transmission, etc.
- `price` - selling price
- `oem_price` - OEM official price
- `aftermarket_price` - aftermarket alternative price
- `description` - part description
- `manufacturer` - default: Opel
- `url` - source URL

**Example CSV:**
```csv
partNumber,name,category,model,price,description
1628-451-007,Cylinder Head Gasket,Engine,corsa,142.50,OEM gasket
1628-451-008,Valve Cover,Engine,corsa,89.99,OEM cover
```

---

## Test Endpoints

### Check Import Status
```bash
Invoke-RestMethod -Uri http://localhost:5000/api/parts/status
```

Response:
```json
{
  "success": true,
  "totalParts": 190,
  "totalModels": 9,
  "bySource": {
    "unknown": 190
  }
}
```

### Get All Parts
```bash
curl http://localhost:5000/api/catalog/parts | ConvertFrom-Json | Select-Object -First 5
```

### Get VIN Info
```bash
curl -X POST http://localhost:5000/api/vin/decode \
  -H "Content-Type: application/json" \
  -d '{"vin":"WOPWGJ3236K000001"}'
```

---

## Sample Data Location

Pre-made sample CSV with 59 parts ready to import:

```bash
# Already included in the project
sample-data.csv
```

Contains realistic Opel Corsa parts across all categories:
- Engine (cylinder head, timing belt, water pump, etc.)
- Brakes (pads, rotors, calipers, etc.)
- Suspension (struts, springs, control arms, etc.)
- Transmission (clutch, drive shaft, CV joints, etc.)
- Electrical (headlight, window motor, battery, etc.)
- Fuel System (tank, pump, filter, etc.)
- Cooling (radiator, fan, thermostat, etc.)

---

## How to Get Real Data from Website

### Option 1: Manual Copy from Tables
1. Visit: https://opel.7zap.com/en/global/corsa-parts-catalog/engine/
2. Right-click table → Copy
3. Paste into Excel/LibreOffice
4. Save as CSV
5. Import: `node import-data.js --file data.csv --format csv`

### Option 2: Extract from DevTools
1. Open DevTools (F12) → Network tab
2. Reload page
3. Look for XHR/Fetch requests to API endpoints
4. Export JSON response
5. Format and import via API

### Option 3: Use Browser Extension
- Copy table data with browser extension
- Format as CSV
- Import via command-line

---

## Auto Batch Import

**Script to import multiple CSV files:**

Create `batch-import.ps1`:
```powershell
Get-ChildItem *.csv | ForEach-Object {
    Write-Host "Importing $_..."
    node import-data.js --file $_.FullName --format csv
    Start-Sleep -Seconds 2
}
```

Run:
```powershell
.\batch-import.ps1
```

---

## Current Database Content

**Total Parts:** 190
**Models:** 9
**Sources:** manual_import

**Sample part:**

```javascript
{
  "_id": ObjectId("..."),
  "name": "Cylinder Head Gasket",
  "number": "1628-451-007",
  "url": "https://opel.7zap.com/en/global/corsa-parts-catalog/",
  "parentUrl": "https://opel.7zap.com/en/global/corsa-parts-catalog/engine/",
  "createdAt": Date("2026-04-01T...")
}
```

---

## Next Steps

1. **Import more data:**
   ```bash
   node import-data.js --file yourdata.csv --format csv
   ```

2. **Test with VIN decoder:**
   ```bash
   curl -X POST http://localhost:5000/api/vin/decode \
     -d '{"vin":"WOPWGJ3236K000001"}' \
     -H "Content-Type: application/json"
   ```

3. **Get parts for VIN:**
   ```bash
   curl http://localhost:5000/api/vin/WOPWGJ3236K000001/parts
   ```

---

## Documentation

Full guides available:
- `MANUAL_IMPORT_GUIDE.md` - Complete import guide
- `VIN_DECODER_GUIDE.md` - VIN decoder documentation
- `COMPLETE_WORKFLOW_GUIDE.md` - Full system workflow

---

## Troubleshooting

### Import shows "0 parts imported"
**Fix:** Ensure CSV has `partNumber` and `name` columns

### API returns "Connection refused"
**Fix:** Start server first:
```bash
npm start
```

### CSV parsing errors
**Fix:** Save file as UTF-8 encoding in Excel

---

## Current Status

✅ Backend API running on port 5000
✅ MongoDB connected (190 parts stored)
✅ Import endpoints functional
✅ VIN decoder ready
✅ All 3 import methods working

**You can now:**
- Import real OEM parts data from website
- Query parts via API
- Decode VINs and get matching parts
- Test the complete three-tier workflow

Start importing data now! 🚀
