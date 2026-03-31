# Deep Recursive Scraper - Usage Guide

## Overview

The Deep Recursive Scraper is a hierarchical web scraper that extracts vehicle parts catalog data with the following structure:

```
Model → Categories → Sub-Categories → Parts
```

Each part contains:
- **Part Name**: Display name of the part
- **OEM Number**: Official equipment manufacturer part number
- **Description**: Additional part information
- **Image URL**: Product image link (if available)

---

## Architecture

### Scraper Hierarchy

```
1. Fetch Model Page
   ↓
2. Extract All Category Links (e.g., Engine, Transmission, Electrical)
   ↓
3. For Each Category:
   - Fetch Category Page
   - Extract Sub-Category Links (e.g., Engine Parts, Engine Belts)
     ↓
4. For Each Sub-Category:
   - Fetch Sub-Category Page
   - Extract Parts Table/Data
   - Parse: Part Name, OEM Number, Description, Image URL
```

### Rate Limiting & Resilience

- **Timeout**: 60 seconds per request
- **Retry Logic**: Up to 2 automatic retries for timeout/network errors
- **Rate Limiting**: 500ms delay between category requests, 300ms between sub-category requests
- **Error Handling**: Graceful degradation - continues scraping even if some pages fail

---

## API Endpoints

### 1. Deep Scrape Models

**Endpoint**: `POST /api/scrape/models`

**Authentication**: Required (Bearer Token)

**Description**: Initiate a deep recursive scrape of multiple vehicle models

**Request Body**:
```json
{
  "models": [
    {
      "name": "Astra K",
      "url": "https://opel.7zap.com/en/global/astra-k/"
    },
    {
      "name": "Corsa E",
      "url": "https://opel.7zap.com/en/global/corsa-e/"
    }
  ]
}
```

**Response (Immediate)**:
```json
{
  "trackingId": "scrape_1704052800000",
  "message": "Deep scraping started",
  "modelsRequested": 2,
  "status": "in-progress",
  "warning": "This is a long-running operation. Results will be available shortly."
}
```

**Response Body (Full Result - After Completion)**:
```json
{
  "trackingId": "scrape_1704052800000",
  "results": [
    {
      "model": "Astra K",
      "url": "https://opel.7zap.com/en/global/astra-k/",
      "categories": [
        {
          "category": "Engine",
          "url": "https://opel.7zap.com/en/global/astra-k-engine/",
          "subCategories": [
            {
              "subCategory": "Engine Gaskets",
              "url": "https://opel.7zap.com/en/global/astra-k-engine-gaskets/",
              "partCount": 45,
              "parts": [
                {
                  "name": "Cylinder Head Gasket",
                  "oemNumber": "1618101",
                  "description": "High-performance gasket for cylinder head seal",
                  "imageUrl": "https://img.7zap.com/images/parts/1618101.webp"
                },
                {
                  "name": "Oil Pan Gasket",
                  "oemNumber": "1618102",
                  "description": "Replacement gasket for oil pan",
                  "imageUrl": "https://img.7zap.com/images/parts/1618102.webp"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

**Limits**:
- Max 5 categories per model
- Max 3 sub-categories per category
- Max 10 parts per sub-category

---

### 2. Scrape Category Stack

**Endpoint**: `POST /api/scrape/category-stack`

**Authentication**: Required (Bearer Token)

**Description**: Targeted scraping - scrape a specific category URL down to its parts (Sub-Categories → Parts)

**Request Body**:
```json
{
  "categoryUrl": "https://opel.7zap.com/en/global/astra-k-engine/"
}
```

**Response**:
```json
{
  "status": "success",
  "data": {
    "url": "https://opel.7zap.com/en/global/astra-k-engine/",
    "subCategories": [
      {
        "subCategory": "Engine Gaskets",
        "url": "https://opel.7zap.com/en/global/astra-k-engine-gaskets/",
        "parts": [
          {
            "name": "Cylinder Head Gasket",
            "oemNumber": "1618101",
            "description": "High-performance gasket for cylinder head seal",
            "imageUrl": "https://img.7zap.com/images/parts/1618101.webp"
          }
        ]
      }
    ]
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 3. Check Scraping Status

**Endpoint**: `GET /api/scrape/status/:trackingId`

**Authentication**: Required (Bearer Token)

**Description**: Check the status of a running/completed scraping job

**Response**:
```json
{
  "trackingId": "scrape_1704052800000",
  "status": "in-progress",
  "message": "Job is currently running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 4. Scraper Health Check

**Endpoint**: `GET /api/scrape/health`

**Authentication**: Not required

**Description**: Check if the scraper service is operational

**Response**:
```json
{
  "service": "deep-scraper",
  "status": "operational",
  "capabilities": [
    "model_deep_scraping",
    "category_stack_scraping",
    "hierarchical_part_extraction"
  ],
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## Usage Examples

### Example 1: Deep Scrape Multiple Models

```bash
curl -X POST http://localhost:5000/api/scrape/models \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "models": [
      {
        "name": "Astra K",
        "url": "https://opel.7zap.com/en/global/astra-k/"
      }
    ]
  }'
```

### Example 2: Scrape Specific Category

```bash
curl -X POST http://localhost:5000/api/scrape/category-stack \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categoryUrl": "https://opel.7zap.com/en/global/astra-k-engine/"
  }'
```

### Example 3: JavaScript/Node.js

```javascript
const axios = require('axios');

const token = 'YOUR_JWT_TOKEN';

// Deep scrape models
async function deepScrapeModels() {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/scrape/models',
      {
        models: [
          {
            name: 'Astra K',
            url: 'https://opel.7zap.com/en/global/astra-k/'
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Scraping started:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Scrape specific category
async function scrapeCategoryStack() {
  try {
    const response = await axios.post(
      'http://localhost:5000/api/scrape/category-stack',
      {
        categoryUrl: 'https://opel.7zap.com/en/global/astra-k-engine/'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log('Parts extracted:', response.data.data.subCategories);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

deepScrapeModels();
```

---

## Extraction Functions (Direct Usage)

The scraper also exports individual functions for granular control:

```javascript
const {
  fetchHTML,
  extractCategories,
  extractSubCategories,
  extractParts,
  deepScrapeModels,
  scrapeCategoryStack
} = require('./scrapers/deep-scraper');

// Example: Manual category extraction
const html = await fetchHTML('https://opel.7zap.com/en/global/astra-k/');
const categories = extractCategories(html, 'https://opel.7zap.com/en/global/astra-k/');
console.log(categories);
```

---

## Configuration Parameters

All parameters are defined in `config.js`:

```javascript
{
  FETCH_TIMEOUT: 60000,        // Per-request timeout (ms)
  CONNECT_TIMEOUT: 15000,      // Connection timeout (ms)
  MAX_RETRIES: 2,               // Retry attempts for failures
  RETRY_DELAY: 2000,            // Delay between retries (ms)
  USER_AGENT: '...',            // HTTP User-Agent header
  BASE_URL: 'https://opel.7zap.com'
}
```

---

## Performance Characteristics

### Scraping Speed

| Operation | Time | Details |
|---|---|---|
| Single Category Stack | 10-30s | 3 sub-categories × 3-5s per page + rate limiting |
| Single Model | 30-120s | 5 categories × (10-30s per category stack) |
| Multiple Models (5) | 3-10 min | Sequential processing with rate limiting |

### Data Limits

- **Categories per Model**: Limited to 5
- **Sub-Categories per Category**: Limited to 3
- **Parts per Sub-Category**: Limited to 10

These limits prevent excessive memory usage and API load.

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|---|---|---|
| 400 - Invalid models array | Missing or empty models array | Provide valid model objects with name and url |
| 401 - Unauthorized | Missing/invalid JWT token | Include valid Bearer token in Authorization header |
| 504 - Gateway Timeout | Scraping exceeded 2-minute limit | Scrape fewer categories or use category-stack endpoint |
| Network error | Target server unreachable | Check URL validity and internet connection |

### Automatic Retry

- Network timeouts automatically retry up to 2 times
- 2-second delay between retries
- Logs all retry attempts

---

## Best Practices

1. **Start Small**: Test with 1-2 models before scraping large batches
2. **Use Category Stack**: For targeted scraping, use category-stack endpoint to reduce time
3. **Monitor Logs**: Watch console logs for `[DEEP-SCRAPER]` prefix
4. **Respect Rate Limits**: Implement delays between API calls in your client
5. **Store Results**: Save scraping results to database immediately after completion
6. **Validate URLs**: Ensure URLs are valid before passing to scraper

---

## Troubleshooting

### Scraper returns empty results

**Cause**: Page structure doesn't match expected selectors

**Solution**:
1. Check page content using browser developer tools
2. Verify category/part selectors match actual HTML
3. Try scrapeCategoryStack with explicit URL

### High memory usage

**Cause**: Too many parts being extracted

**Solution**:
- Reduce model/category/part limits in config
- Process models sequentially instead of parallel
- Save results to database between models

### Slow scraping

**Cause**: Network latency or target server slowness

**Solution**:
- Increase FETCH_TIMEOUT in config
- Use fewer categories/sub-categories per model
- Scrape during off-peak hours

---

## Future Enhancements

- [ ] Background job queue (Bull/Kue)
- [ ] Result caching with Redis
- [ ] Webhook notifications on completion
- [ ] CSV/JSON export functionality
- [ ] Scheduled scraping jobs
- [ ] Rate limiting per user
- [ ] Web UI for scrape management

