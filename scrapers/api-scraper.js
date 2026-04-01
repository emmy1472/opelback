/**
 * API-Based Data Scraper for 7zap.com
 * 
 * This scraper attempts to extract data via:
 * 1. Reverse-engineering the 7zap.com API endpoints
 * 2. Parsing structured data from JSON embedded in HTML
 * 3. Direct curl-based requests with optimal headers
 * 
 * Run: node scrapers/api-scraper.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
const config = require('../config');
require('dotenv').config();

const execAsync = promisify(exec);

// Import models
const {
  VehicleModel,
  VehicleCatalog,
  VehiclePart
} = require('../models');

// API Endpoints for 7zap.com
const API_ENDPOINTS = {
  models: `${config.BASE_URL}/en/global/`,
  corsa: `${config.BASE_URL}/en/global/corsa-parts-catalog/`,
  astra: `${config.BASE_URL}/en/global/astra-parts-catalog/`,
  mokka: `${config.BASE_URL}/en/global/mokka-parts-catalog/`
};

// Axios with optimal headers
const client = axios.create({
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Cache-Control': 'no-cache'
  }
});

/**
 * Fetch page content with curl (handles redirects better)
 */
async function fetchWithCurl(url) {
  try {
    console.log(`[API-SCRAPER] Fetching: ${url}`);
    
    const curlCmd = `curl -s -L -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${url}"`;
    
    const { stdout, stderr } = await execAsync(curlCmd, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      encoding: 'utf8'
    });

    if (stderr && stderr.length > 0) {
      console.error(`[API-SCRAPER] Curl stderr: ${stderr.substring(0, 200)}`);
    }

    console.log(`[API-SCRAPER] ✅ Fetched ${stdout.length} bytes`);
    return stdout;
  } catch (error) {
    console.error(`[API-SCRAPER] ❌ Curl error: ${error.message}`);
    throw error;
  }
}

/**
 * Extract JSON data from HTML script tags
 */
function extractJsonFromHtml(html) {
  const results = [];
  
  // Find script tags with JSON-LD or appData
  const scriptRegex = /<script[^>]*type=['"]application\/json['"][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      results.push(json);
    } catch (e) {
      // Skip invalid JSON
    }
  }

  return results;
}

/**
 * Parse vehicle specs from HTML tables
 */
function parseVehicleSpecs(html, modelName) {
  const $ = cheerio.load(html);
  const specs = [];

  // Look for table rows with year, engine, transmission data
  $('table tbody tr, table tr, div[class*="spec"]').each((i, el) => {
    const cells = $(el).find('td, div[class*="cell"]');
    if (cells.length >= 3) {
      specs.push({
        year: $(cells[0]).text().trim(),
        engine: $(cells[1]).text().trim(),
        transmission: $(cells[2]).text().trim(),
        power: $(cells[3]).text().trim() || null,
        model: modelName
      });
    }
  });

  return specs;
}

/**
 * Parse parts from HTML
 */
function parseParts(html, modelId, categoryName) {
  const $ = cheerio.load(html);
  const parts = [];

  // Method 1: Table rows with part data
  $('table tbody tr, tr[data-part-id]').each((i, el) => {
    const cells = $(el).find('td');
    if (cells.length >= 2) {
      const partNumber = $(cells[0]).text().trim();
      const partName = $(cells[1]).text().trim();
      const price = $(cells[2]).text().trim();

      if (partNumber && partNumber.length > 2 && partName && partName.length > 2) {
        parts.push({
          partNumber,
          name: partName,
          price: parseFloat(price.replace(/[^\d.]/g, '')) || null,
          categoryId: categoryName,
          modelId
        });
      }
    }
  });

  // Method 2: div-based layout
  if (parts.length === 0) {
    $('div[class*="part-item"], li[class*="part"], div[class*="product"]').each((i, el) => {
      const partNumber = $(el).find('[class*="number"], [class*="code"]').text().trim();
      const partName = $(el).find('[class*="name"], [class*="title"], h3, h4').text().trim();
      const price = $(el).find('[class*="price"], [class*="cost"]').text().trim();

      if (partNumber && partName) {
        parts.push({
          partNumber,
          name: partName,
          price: parseFloat(price.replace(/[^\d.]/g, '')) || null,
          categoryId: categoryName,
          modelId
        });
      }
    });
  }

  return parts;
}

/**
 * Main scraping pipeline
 */
async function scrapeAllData() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║ API-Based 7zap.com Data Scraper                         ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    // Step 1: Connect to MongoDB
    console.log('[API-SCRAPER] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/opelback');
    console.log('[API-SCRAPER] ✅ Connected\n');

    // Step 2: Create vehicle models
    console.log('📍 STEP 1: Creating Vehicle Models');
    console.log('─'.repeat(50));
    
    const models = [
      { id: 'corsa', name: 'Opel Corsa', type: 'Compact Hatchback', url: API_ENDPOINTS.corsa },
      { id: 'astra', name: 'Opel Astra', type: 'Family Sedan', url: API_ENDPOINTS.astra },
      { id: 'mokka', name: 'Opel Mokka', type: 'Compact SUV', url: API_ENDPOINTS.mokka }
    ];

    let modelIds = {};
    for (const model of models) {
      try {
        const vehicleModel = await VehicleModel.findOneAndUpdate(
          { modelId: model.id },
          {
            modelId: model.id,
            name: model.name,
            url: model.url,
            type: model.type,
            yearsSupported: '2010-2026',
            lastScrapedAt: new Date()
          },
          { upsert: true, new: true }
        );
        modelIds[model.id] = vehicleModel._id;
        console.log(`✅ ${model.name}`);
      } catch (error) {
        console.error(`❌ Error with ${model.name}: ${error.message}`);
      }
    }

    // Step 3: Scrape category pages
    console.log('\n📍 STEP 2: Scraping Categories and Parts');
    console.log('─'.repeat(50));

    const categories = {
      corsa: ['Engine', 'Transmission', 'Suspension', 'Brakes', 'Electrical', 'Cooling', 'Fuel System'],
      astra: ['Engine', 'Transmission', 'Suspension', 'Brakes', 'Electrical', 'Cooling', 'Fuel System'],
      mokka: ['Engine', 'Transmission', 'Suspension', 'Brakes', 'Electrical', 'Cooling', 'Fuel System']
    };

    let totalParts = 0;

    for (const [modelKey, categoryList] of Object.entries(categories)) {
      const modelId = modelIds[modelKey];
      console.log(`\n→ Scraping ${modelKey}:`);

      for (const category of categoryList) {
        try {
          const categoryUrl = `${API_ENDPOINTS[modelKey]}${category.toLowerCase()}-parts/`;
          
          // Fetch page
          const html = await fetchWithCurl(categoryUrl);
          
          // Parse parts
          const parts = parseParts(html, modelId, category);
          console.log(`   ${category}: Found ${parts.length} parts`);

          // Save parts
          for (const part of parts) {
            try {
              await VehiclePart.findOneAndUpdate(
                { partNumber: part.partNumber, modelId: modelId },
                {
                  partNumber: part.partNumber,
                  name: part.name,
                  categoryId: category,
                  modelId,
                  price: part.price,
                  source: 'opel.7zap.com',
                  url: categoryUrl,
                  scrapedAt: new Date()
                },
                { upsert: true }
              );
              totalParts++;
            } catch (e) {
              // Duplicate - skip
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`   ❌ ${category} error: ${error.message}`);
        }
      }
    }

    // Step 4: Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║ SCRAPING COMPLETE                                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const modelCount = await VehicleModel.countDocuments();
    const partCount = await VehiclePart.countDocuments();

    console.log(`✅ Models created: ${modelCount}`);
    console.log(`✅ Total parts scraped: ${partCount}`);
    console.log(`✅ New parts in this run: ${totalParts}\n`);

  } catch (error) {
    console.error('[API-SCRAPER] ❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run scraper
if (require.main === module) {
  scrapeAllData().catch(console.error);
}

module.exports = { scrapeAllData, fetchWithCurl, parseParts };
