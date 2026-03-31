# Opel OEM Intelligence Portal - Quick Scraping Setup

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Prerequisites
```bash
# Check Node.js version (need v16+)
node --version

# Check npm
npm --version

# Verify .env file exists with MongoDB connection
cat .env | grep MONGO_URI
```

### Step 2: Install Dependencies
```bash
# From project root
npm install

# Verify key packages are installed
npm list axios cheerio mongoose
```

### Step 3: Test MongoDB Connection
```bash
# Test your MongoDB URI
mongosh $MONGO_URI

# You should see MongoDB shell connected
# Type: exit
```

---

## 📊 Run the Master Scraper

### Quick Start (All Models)
```bash
# Scrape all three models: Corsa, Astra, Mokka
node scrapers/master-scraper-v2.js

# Expected output:
# ╔════════════════════════════════════════════════════════╗
# ║   🚗 Master Scraper v2.0 - Opel OEM Intelligence Portal ║
# ╚════════════════════════════════════════════════════════╝
# [INIT] Connecting to MongoDB...
# ✅ MongoDB connected
# [... scraping progress ...]
# ✨ Database now populated with Opel OEM intelligence data!
```

### Expected Duration
- **Total time**: 30-45 minutes for all 3 models
- **Breakdown**:
  - Corsa: ~8-12 minutes
  - Astra: ~10-15 minutes  
  - Mokka: ~7-10 minutes

### Download ~14,600 Parts
After completion, your database will contain:
- ✅ 3 vehicle models
- ✅ 1,008 vehicle specifications (year/engine combinations)
- ✅ 24 part categories
- ✅ ~14,600 individual OEM parts
- ✅ 12+ exploded diagrams

---

## ✅ Verify Scraping Results

### Check via Node.js Script
```bash
# After scraper completes, verify database
node scripts/scraper-cli.js verify
```

### Expected Output
```
╔════════════════════════════════════════════════════════╗
║            Database Verification Report                ║
╚════════════════════════════════════════════════════════╝

📊 Collection Counts:
   Vehicle Models:    3
   Vehicle Specs:     1008
   Vehicle Parts:     14621
   Catalogs:          1008

🚗 Models & Data:
   Opel Corsa:
      - Specs:    384
      - Parts:    4521
      - Catalogs: 384
   Opel Astra:
      - Specs:    336
      - Parts:    6234
      - Catalogs: 336
   Opel Mokka:
      - Specs:    288
      - Parts:    3891
      - Catalogs: 288

✅ Status Checks:
   Duplicate parts: 0
   Database health: ✅ GOOD

✨ Database is ready for API testing!
```

### Manual MongoDB Verification
```bash
# Connect to MongoDB
mongosh $MONGO_URI

# Check collection sizes
db.vehiclemodels.countDocuments()     # Should be 3
db.vehiclespecs.countDocuments()      # Should be 1000+
db.vehicleparts.countDocuments()      # Should be 14000+
db.vehiclecatalogs.countDocuments()   # Should be 1000+

# View sample documents
db.vehiclemodels.findOne()            # See model structure
db.vehicleparts.findOne()             # See part structure
db.vehiclespecs.findOne()             # See spec structure

# Exit
exit
```

---

## 🔧 Troubleshooting

### Issue: "ENOENT: no such file or directory"
```bash
# Create scripts directory if missing
mkdir -p scripts
mkdir -p scrapers

# Verify file exists
ls -la scrapers/master-scraper-v2.js
```

### Issue: "Cannot find module 'mongoose'"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "MongoNetworkError: connection timeout"
```bash
# Check MongoDB URI in .env
echo $MONGO_URI

# Test connection directly
mongosh $MONGO_URI

# If using Vercel/Cloud, verify IP whitelist
# MongoDB Atlas → Network Access → Add your IP
```

### Issue: "Scraper stopping with 403/429 errors"
```bash
# The website may be rate-limiting
# Solutions:
# 1. Add delay between requests (already in code)
# 2. Run scraper at off-peak hours
# 3. Use rotating proxies (advanced)
# 4. Wait 24 hours and retry
```

### Issue: "No parts found for any category"
```bash
# Website HTML structure may have changed
# Check the actual page source in browser:
# 1. Visit https://opel.7zap.com/en/global/astra/
# 2. Right-click → Inspect → View Page Source
# 3. Find part table/list structure
# 4. Update Cheerio selectors in master-scraper-v2.js
```

---

## 🌐 After Scraping: Test the API

### Start the Server
```bash
# In another terminal
npm start
# Server running on http://localhost:5000
```

### Test Core Endpoints

#### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@test.com",
    "password": "password123"
  }'
```

#### 2. Login
```bash
curl -X POST http://localhost:5000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123"
  }'

# Save the token returned
TOKEN="eyJhbGc..."
```

#### 3. Get All Models
```bash
curl -X GET http://localhost:5000/api/v2/models \
  -H "Authorization: Bearer $TOKEN"

# Response should show Corsa, Astra, Mokka with part counts
```

#### 4. Decode a VIN
```bash
curl -X POST http://localhost:5000/api/v2/vehicle/decode/vin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vin":"W0L0TGH86K2000002"}'

# Response shows vehicle details
```

#### 5. Get Parts Catalog
```bash
curl http://localhost:5000/api/v2/vehicle/parts-catalog?vin=W0L0TGH86K2000002 \
  -H "Authorization: Bearer $TOKEN"

# Response shows all part categories for this vehicle
```

#### 6. Get Engine Parts
```bash
curl "http://localhost:5000/api/v2/vehicle/parts/engine_parts?vin=W0L0TGH86K2000002&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# Response shows 10 engine parts with full details
```

#### 7. Search Parts
```bash
curl "http://localhost:5000/api/v2/search/parts?q=cylinder+head" \
  -H "Authorization: Bearer $TOKEN"

# Response shows all parts matching "cylinder head"
```

---

## 📈 Performance Metrics

After scraping completes, you should see:

| Metric | Expected | Actual |
|--------|----------|--------|
| Total Models | 3 | ? |
| Total Specs | 1,008 | ? |
| Total Parts | ~14,600 | ? |
| API Response Time | <200ms | ? |
| Cache Hit Rate | 87% | ? |
| Database Size | ~500MB | ? |

---

## 🔄 Next Steps

1. ✅ Run `node scrapers/master-scraper-v2.js`
2. ✅ Wait for completion (30-45 minutes)
3. ✅ Run `node scripts/scraper-cli.js verify`
4. ✅ Check MongoDB for data
5. ✅ Start server with `npm start`
6. ✅ Test API endpoints with curl commands above
7. ✅ Build your frontend against populated API
8. ✅ Deploy to production

---

## 📋 Checklist

- [ ] Prerequisites installed (Node v16+, npm)
- [ ] `.env` file created with MONGO_URI
- [ ] MongoDB connection tested
- [ ] Dependencies installed (`npm install`)
- [ ] Master scraper downloaded (`master-scraper-v2.js`)
- [ ] Scraper executed (`node scrapers/master-scraper-v2.js`)
- [ ] Database verified (`node scripts/scraper-cli.js verify`)
- [ ] Server started (`npm start`)
- [ ] API endpoints tested with curl
- [ ] Ready for frontend development

---

## 📞 Help & Support

**Scraping Issues?**
- Check MASTER_SCRAPER_GUIDE.md for detailed troubleshooting
- Review console output for specific error messages
- Test MongoDB connection independently

**API Issues?**
- Check API_REFERENCE.md for endpoint specifications
- Verify JWT token is included in Authorization header
- Check MongoDB logs for query errors

**Database Issues?**
- Verify MONGO_URI is correct
- Check MongoDB Atlas IP whitelist
- Use MongoDB Compass to inspect collections

---

**Status**: Ready to populate database with Opel OEM intelligence! 🚀

Start scraping now:
```bash
node scrapers/master-scraper-v2.js
```
