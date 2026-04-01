/**
 * Real Web Scraper using Puppeteer
 * 
 * Bypasses bot detection using headless Chrome rendering
 * Scrapes actual data from opel.7zap.com
 * 
 * Usage:
 * node scrapers/real-scraper.js
 */

const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const config = require('../config');
require('dotenv').config();

// Import models
const {
  VehicleModel,
  VehicleSpec,
  VehicleCatalog,
  VehiclePart
} = require('../models');

// ===== PUPPETEER CONFIG =====
const PUPPETEER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-web-security',
  '--disable-features=IsolateOrigins,site-per-process',
  '--disable-blink-features=AutomationControlled',
  '--disable-client-side-phishing-detection',
  '--no-first-run',
  '--no-default-browser-check'
];

let browser;

async function initBrowser() {
  console.log('[REAL-SCRAPER] Initializing Puppeteer browser...');
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: PUPPETEER_ARGS,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });
    console.log('[REAL-SCRAPER] ✅ Browser initialized');
    return browser;
  } catch (error) {
    console.error('[REAL-SCRAPER] ❌ Failed to initialize browser:', error.message);
    throw error;
  }
}

async function closeBrowser() {
  if (browser) {
    await browser.close();
    console.log('[REAL-SCRAPER] ✅ Browser closed');
  }
}

async function fetchPageWithPuppeteer(url, options = {}) {
  const {
    waitForSelector = null,
    waitForNavigation = true,
    timeout = 30000,
    retries = 3
  } = options;

  for (let attempt = 0; attempt < retries; attempt++) {
    let page;
    try {
      console.log(`[REAL-SCRAPER] Fetching: ${url} (Attempt ${attempt + 1}/${retries})`);
      
      page = await browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      // Additional headers to avoid bot detection
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Referer': config.BASE_URL,
        'Accept-Encoding': 'gzip, deflate, br'
      });

      // Block images to speed up loading
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        if (['image', 'stylesheet', 'font'].includes(request.resourceType())) {
          request.abort();
        } else {
          request.continue();
        }
      });

      const navigationPromise = page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: timeout
      });

      if (waitForNavigation) {
        await navigationPromise;
      }

      // Wait for specific content if selector provided
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout: 10000 }).catch(() => {
          console.log(`[REAL-SCRAPER] ⚠️ Selector not found: ${waitForSelector}`);
        });
      }

      // Wait a bit for content to render
      await page.waitForTimeout(1000);

      const html = await page.content();
      await page.close();
      
      console.log(`[REAL-SCRAPER] ✅ Page fetched (${html.length} bytes)`);
      return html;
    } catch (error) {
      console.error(`[REAL-SCRAPER] ❌ Attempt ${attempt + 1} failed:`, error.message);
      if (page) {
        await page.close().catch(() => {});
      }
      
      if (attempt < retries - 1) {
        const delay = 2000 * (attempt + 1);
        console.log(`[REAL-SCRAPER] ⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

async function scrapeModels() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║ PHASE 1: Scraping Vehicle Models                   ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const models = [
    { name: 'Opel Corsa', id: 'corsa', path: 'corsa-parts-catalog', years: '2015-2026' },
    { name: 'Opel Astra', id: 'astra', path: 'astra-parts-catalog', years: '2010-2026' },
    { name: 'Opel Mokka', id: 'mokka', path: 'mokka-parts-catalog', years: '2012-2026' }
  ];

  for (const model of models) {
    try {
      console.log(`\n→ Processing: ${model.name}`);
      
      const vehicleModel = new VehicleModel({
        modelId: model.id,
        name: model.name,
        url: `${config.BASE_URL}/en/global/${model.path}/`,
        type: 'Vehicle Model',
        yearsSupported: model.years,
        lastScrapedAt: new Date()
      });

      await vehicleModel.save();
      console.log(`   ✅ Saved: ${model.name}`);
    } catch (error) {
      console.error(`   ❌ Error saving ${model.name}:`, error.message);
    }
  }
}

async function scrapeCategories() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║ PHASE 2: Scraping Category Listings                ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const models = await VehicleModel.find();
  const cheerio = require('cheerio');

  for (const model of models) {
    try {
      console.log(`\n→ Scraping categories for: ${model.name}`);
      
      const html = await fetchPageWithPuppeteer(model.url, {
        waitForSelector: 'a[href*="-catalog"]',
        timeout: 30000
      });

      const $ = cheerio.load(html);
      const categories = [];

      // Extract category links
      $('a[href*="-catalog"], a[href*="category"]').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().trim();

        if (href && text.length > 2 && !text.toLowerCase().includes('cookie')) {
          const fullUrl = href.startsWith('http') ? href : `${config.BASE_URL}${href}`;
          
          if (!categories.find(c => c.url === fullUrl)) {
            categories.push({
              modelId: model._id,
              name: text.substring(0, 100),
              url: fullUrl
            });
          }
        }
      });

      console.log(`   Found ${categories.length} categories`);

      for (const category of categories) {
        try {
          await VehicleCatalog.findOneAndUpdate(
            { modelId: category.modelId, name: category.name },
            category,
            { upsert: true }
          );
        } catch (e) {
          // Duplicate or error - continue
        }
      }

      console.log(`   ✅ Saved ${categories.length} categories`);
    } catch (error) {
      console.error(`   ❌ Error scraping categories for ${model.name}:`, error.message);
    }
  }
}

async function scrapeParts() {
  console.log('\n╔════════════════════════════════════════════════════╗');
  console.log('║ PHASE 3: Scraping OEM Parts Data                   ║');
  console.log('╚════════════════════════════════════════════════════╝\n');

  const catalogs = await VehicleCatalog.find().limit(50); // Start with first 50 categories
  const cheerio = require('cheerio');
  let partCount = 0;

  for (const catalog of catalogs) {
    try {
      console.log(`\n→ Scraping parts from: ${catalog.name}`);
      
      const html = await fetchPageWithPuppeteer(catalog.url, {
        waitForSelector: 'a[href*="part"], table, div[class*="part"]',
        timeout: 40000,
        retries: 2
      });

      const $ = cheerio.load(html);
      const parts = [];

      // Extract part information
      $('tr, div[class*="row"], li[class*="item"]').each((i, el) => {
        const row = $(el);
        
        // Try to extract part number, name, and price
        const partNumberEl = row.find('td:first, div[class*="number"], span[class*="part"]').first();
        const nameEl = row.find('td:nth-child(2), div[class*="name"], span[class*="title"]').first();
        const priceEl = row.find('td:nth-child(3), div[class*="price"], span[class*="price"]').first();

        const partNumber = partNumberEl.text().trim();
        const name = nameEl.text().trim();
        const priceText = priceEl.text().trim();

        if (partNumber && name && partNumber.length > 2 && name.length > 2) {
          const price = parseFloat(priceText.replace(/[^\d.]/g, '')) || null;

          parts.push({
            partNumber,
            name,
            categoryId: catalog._id,
            modelId: catalog.modelId,
            price: price,
            source: 'opel.7zap.com',
            url: catalog.url,
            scrapedAt: new Date()
          });
        }
      });

      console.log(`   Found ${parts.length} parts`);

      for (const part of parts) {
        try {
          await VehiclePart.findOneAndUpdate(
            { partNumber: part.partNumber, modelId: part.modelId },
            part,
            { upsert: true }
          );
          partCount++;
        } catch (e) {
          // Duplicate key or error - continue
        }
      }

      console.log(`   ✅ Processed ${parts.length} parts`);
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`   ❌ Error scraping parts from ${catalog.name}:`, error.message);
    }
  }

  return partCount;
}

async function main() {
  try {
    // Connect to MongoDB
    console.log('[REAL-SCRAPER] Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/opelback');
    console.log('[REAL-SCRAPER] ✅ Connected to MongoDB');

    // Initialize browser
    await initBrowser();

    // Run scraping phases
    await scrapeModels();
    await scrapeCategories();
    const partCount = await scrapeParts();

    // Print summary
    console.log('\n╔════════════════════════════════════════════════════╗');
    console.log('║ SCRAPING COMPLETE                                  ║');
    console.log('╚════════════════════════════════════════════════════╝\n');
    
    const models = await VehicleModel.countDocuments();
    const catalogs = await VehicleCatalog.countDocuments();
    const parts = await VehiclePart.countDocuments();
    
    console.log(`✅ Models: ${models}`);
    console.log(`✅ Categories: ${catalogs}`);
    console.log(`✅ Parts: ${parts}`);
    
  } catch (error) {
    console.error('[REAL-SCRAPER] ❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await closeBrowser();
    await mongoose.disconnect();
    console.log('[REAL-SCRAPER] Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  fetchPageWithPuppeteer,
  scrapeModels,
  scrapeCategories,
  scrapeParts,
  initBrowser,
  closeBrowser
};
