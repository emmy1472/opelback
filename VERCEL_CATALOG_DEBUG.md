# Vercel Catalog Endpoint Troubleshooting

## 🔍 Check Vercel Logs

1. Go to: https://vercel.com/dashboard
2. Select your `opelback` project
3. Go to **Deployments** tab
4. Click the latest deployment
5. Click **Runtime Logs**
6. Look for messages like `[SCRAPER]` or `[API]`

This will show you exactly what's failing.

---

## 🚨 Common Issues & Solutions

### Issue 1: "Network error: Cannot reach..."
**Cause**: Vercel can't access 7zap.com (IP block, firewall, or Cloudflare blocking)

**Solution**: 
- 7zap.com uses Cloudflare and blocks automated requests
- Your requests need to bypass Cloudflare

Try this command locally to test:
```bash
curl -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  -H "Accept: text/html" \
  -L "https://opel.7zap.com/en/catalog/cars/opel/global/astra-k-parts-catalog/"
```

If it works locally but not on Vercel, it's an IP whitelist issue.

---

### Issue 2: "Timeout" error
**Cause**: Request takes too long on Vercel (which is slower than local)

**Solution**: Already applied - timeout increased to 60 seconds with retries

---

### Issue 3: Empty results (200 OK but 0 categories)
**Cause**: HTML parsing not finding categories on scraped page

**Solution**: The site might have changed
- Check if page structure changed
- Try manually visiting: https://opel.7zap.com/en/catalog/cars/opel/global/astra-k-parts-catalog/

---

## ✅ Workaround: Use Cached Data Only

If scraping from Vercel keeps failing, switch to **cache-only mode**:

Update `/api/catalog` in `server.js`:

```javascript
app.get('/api/catalog', async (req, res) => {
    const { url } = req.query;
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    try {
        // Use ONLY cached data, don't scrape
        let categories = await VehicleCatalog.find({ parentUrl: url }, '-_id name url').lean();
        
        if (categories.length === 0) {
            // Return sample data if nothing cached yet
            categories = [
                { name: "Engine", url: "https://opel.7zap.com/en/global/astra-k-engine/" },
                { name: "Transmission", url: "https://opel.7zap.com/en/global/astra-k-transmission/" }
            ];
        }
        
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch catalog' });
    }
});
```

This way:
- ✅ Works immediately (no timeouts)
- ✅ Uses pre-stored data
- ✅ No external requests needed

---

## 🔧 Advanced: Check What's Being Sent

Add this temporary debug endpoint:

```javascript
app.get('/api/debug', async (req, res) => {
    res.json({
        nodeEnv: process.env.NODE_ENV,
        platform: process.platform,
        mongoConnected: !!mongoose.connection.readyState,
        catalogsInDB: await VehicleCatalog.countDocuments()
    });
});
```

Then visit: `https://opelback.vercel.app/api/debug`

This will show if MongoDB is connected and if any catalogs are cached.

---

## 📊 Next Steps

1. **Check Vercel Runtime Logs** (see section above)
2. **Share the error message** from logs
3. **Switch to cache-only mode** if scraping keeps failing
4. **Fall back to API-aggregator service** (see below)

---

## 🚀 Alternative: Use an API Aggregator Service

If 7zap.com is blocking your requests even with headers, use a service like:
- `api.scraperapi.com`
- `serpapi.com`
- `crawlbase.com`

Example with ScraperAPI:
```javascript
const scraperApiUrl = `http://api.scraperapi.com?api_key=YOUR_KEY&url=${encodeURIComponent(url)}`;
const response = await fetch(scraperApiUrl);
const html = await response.text();
// Parse HTML as before
```

---

**First, check your Vercel logs to see the exact error! 👆**
