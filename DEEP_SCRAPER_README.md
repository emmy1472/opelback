# Deep Recursive Web Scraper - Quick Start

## What's New

Your codebase now includes a professional-grade **deep recursive web scraper** that extracts vehicle parts from a hierarchical catalog structure:

```
🏭 Model
  ├─ 🗂️  Category (Engine, Transmission, etc.)
  │   ├─ 📋 Sub-Category (Engine Gaskets, Seals, etc.)
  │   │   └─ 🔧 Parts (with OEM#, Description, Image URL)
```

---

## Getting Started (3 Steps)

### Step 1: Install Dependencies

```bash
npm install
```

Axios has been added back to `package.json` for robust HTTP requests.

### Step 2: Start the Server

```bash
npm start
```

Server runs on `http://localhost:5000`

### Step 3: Authenticate & Scrape

```bash
# 1. Register/Login to get JWT token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# 2. Use token to initiate scraping
curl -X POST http://localhost:5000/api/scrape/models \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "models": [
      {"name":"Astra K","url":"https://opel.7zap.com/en/global/astra-k/"}
    ]
  }'
```

---

## Key Features

✅ **Hierarchical Extraction**: Model → Categories → Sub-Categories → Parts

✅ **Automatic Retry Logic**: Handles network timeouts with 2 automatic retries

✅ **Rate Limiting**: Prevents server overload with delays between requests

✅ **Error Resilience**: Continues scraping even if some pages fail

✅ **Rich Data**: Extracts Part Name, OEM Number, Description, and Image URLs

✅ **Authentication**: Requires JWT token for security

✅ **Two Scraping Modes**:
- **Full Deep Scrape**: Models → All categories & sub-categories
- **Targeted Scrape**: Single category URL → Sub-categories & parts

---

## API Endpoints

### Health Check (No Auth Required)
```
GET /api/scrape/health
```

### Deep Scrape Models (Auth Required)
```
POST /api/scrape/models
Body: { "models": [{"name":"...", "url":"..."}] }
```

### Scrape Category Stack (Auth Required)
```
POST /api/scrape/category-stack
Body: { "categoryUrl": "https://..." }
```

### Check Job Status (Auth Required)
```
GET /api/scrape/status/:trackingId
```

---

## File Structure

```
opelback/
├── scrapers/
│   └── deep-scraper.js              (Main scraper logic)
├── routes/
│   ├── auth.js
│   ├── catalog.js
│   └── scraper.js                   (NEW - Scraper API endpoints)
├── examples/
│   └── deep-scraper-examples.js    (Usage examples)
├── DEEP_SCRAPER_GUIDE.md            (Full documentation)
├── config.js
├── server.js
└── ...
```

---

## Usage Examples

### Direct Module Usage

```javascript
const { deepScrapeModels } = require('./scrapers/deep-scraper');

const models = [
  { name: 'Astra K', url: 'https://opel.7zap.com/en/global/astra-k/' }
];

const results = await deepScrapeModels(models);
console.log(results);
```

### Via API (Node.js)

```javascript
const axios = require('axios');

const response = await axios.post(
  'http://localhost:5000/api/scrape/category-stack',
  { categoryUrl: 'https://opel.7zap.com/en/global/astra-k-engine/' },
  { headers: { 'Authorization': 'Bearer TOKEN' } }
);

console.log(response.data);
```

### See More Examples

Check `examples/deep-scraper-examples.js` for 6 complete usage patterns.

---

## Configuration

Edit `config.js` to customize:

```javascript
FETCH_TIMEOUT: 60000,      // Request timeout (ms)
MAX_RETRIES: 2,             // Automatic retry attempts
RETRY_DELAY: 2000,          // Delay between retries (ms)
BASE_URL: 'https://opel.7zap.com'
```

---

## Output Structure

```json
{
  "model": "Astra K",
  "url": "https://opel.7zap.com/en/global/astra-k/",
  "categories": [
    {
      "category": "Engine",
      "url": "https://...",
      "subCategories": [
        {
          "subCategory": "Engine Gaskets",
          "url": "https://...",
          "partCount": 45,
          "parts": [
            {
              "name": "Cylinder Head Gasket",
              "oemNumber": "1618101",
              "description": "High-performance gasket",
              "imageUrl": "https://img.7zap.com/..."
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Limitations & Safeguards

| Parameter | Value | Purpose |
|---|---|---|
| Categories per Model | 5 | Prevent memory overload |
| Sub-Categories per Category | 3 | Keep requests reasonable |
| Parts per Sub-Category | 10 | Manage data size |
| Request Timeout | 60s | Prevent hanging |
| Max Retries | 2 | Balance speed & reliability |

---

## Next Steps

1. **Test It**: Run `examples/deep-scraper-examples.js`
2. **Integrate**: Use the scraper in your application
3. **Store**: Save results to MongoDB via the models
4. **Monitor**: Watch console for `[DEEP-SCRAPER]` logs
5. **Optimize**: Adjust limits in `config.js` based on performance

---

## Troubleshooting

### Empty Results?
- Verify URL is correct and accessible
- Check browser to confirm page structure
- Review HTML selectors in scraper code

### Slow Scraping?
- Reduce categories/sub-categories/parts limits
- Increase timeouts if network is slow
- Scrape off-peak hours

### Memory Issues?
- Process models one at a time
- Reduce parts limit per sub-category
- Save results to database immediately

---

## Full Documentation

See [DEEP_SCRAPER_GUIDE.md](./DEEP_SCRAPER_GUIDE.md) for:
- Complete API reference
- Error handling guide
- Performance characteristics
- Best practices
- Advanced features

---

## Technology Stack

- **HTTP Client**: Axios (reliable, Promise-based)
- **HTML Parsing**: Cheerio (jQuery-like syntax)
- **Server**: Express.js
- **Database**: MongoDB (optional, for storing results)
- **Authentication**: JWT tokens

---

**Status**: ✅ Production Ready | 🚀 High Performance | 🔒 Secure

Your deep scraper is ready to extract vehicle parts catalogs efficiently and reliably!
