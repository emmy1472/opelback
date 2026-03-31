/**
 * Deep Recursive Web Scraper for Vehicle Parts Catalog
 * 
 * Logic:
 * 1. Loop through JSON array of car models (name, url)
 * 2. For each model URL: Find all Category links
 * 3. For each Category: Find Sub-category links
 * 4. On final Sub-category page: Extract Parts (Part Name, OEM Number, Description, Image URL)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');
const { ScrapedPart } = require('../models');

// Configure axios with common headers and timeouts
const axiosInstance = axios.create({
    timeout: config.FETCH_TIMEOUT,
    headers: {
        'User-Agent': config.USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': config.BASE_URL
    }
});

/**
 * Fetch HTML content using Axios
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} HTML content
 */
async function fetchHTML(url, retryCount = 0) {
    try {
        console.log(`[DEEP-SCRAPER] Fetching: ${url.substring(0, 80)}...`);
        const response = await axiosInstance.get(url);
        console.log(`[DEEP-SCRAPER] ✅ Success (${response.data.length} bytes)`);
        return response.data;
    } catch (error) {
        console.error(`[DEEP-SCRAPER] ❌ Fetch error: ${error.message.substring(0, 100)}`);
        
        // Retry for network errors
        if (retryCount < config.MAX_RETRIES && (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED')) {
            console.log(`[DEEP-SCRAPER] Retrying... (${retryCount + 1}/${config.MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY));
            return fetchHTML(url, retryCount + 1);
        }
        
        throw error;
    }
}

/**
 * Extract category links from a model page
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative links
 * @returns {Array} Array of category objects {name, url}
 */
function extractCategories(html, baseUrl) {
    try {
        const $ = cheerio.load(html);
        const categories = [];

        // Look for common category selectors
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();

            // Filter for category-like links
            if (href && text && text.length > 2 && text.length < 50) {
                // Avoid common non-category links
                const isCategory = 
                    !['home', 'back', 'privacy', 'cookie', 'terms', 'login', 'about'].some(word => 
                        text.toLowerCase().includes(word)
                    ) &&
                    (href.toLowerCase().includes('category') || 
                     href.toLowerCase().includes('section') ||
                     href.toLowerCase().includes('type') ||
                     text.match(/^[A-Z][a-z\s]+$/) // Title case words
                    );

                if (isCategory) {
                    const fullUrl = new URL(href, baseUrl).href;
                    if (!categories.some(c => c.url === fullUrl)) {
                        categories.push({ name: text, url: fullUrl });
                    }
                }
            }
        });

        console.log(`[DEEP-SCRAPER] Found ${categories.length} categories`);
        return categories;
    } catch (error) {
        console.error('[DEEP-SCRAPER] Error extracting categories:', error.message);
        return [];
    }
}

/**
 * Extract sub-category links from a category page
 * @param {string} html - HTML content
 * @param {string} baseUrl - Base URL for resolving relative links
 * @returns {Array} Array of sub-category objects {name, url}
 */
function extractSubCategories(html, baseUrl) {
    try {
        const $ = cheerio.load(html);
        const subCategories = [];

        // Look for sub-category links (usually nested)
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();

            if (href && text && text.length > 2 && text.length < 50) {
                const isSubCategory = 
                    !['home', 'back', 'privacy', 'cookie'].some(word => text.toLowerCase().includes(word)) &&
                    (href.toLowerCase().includes('part') ||
                     href.toLowerCase().includes('item') ||
                     href.toLowerCase().includes('product') ||
                     href.includes('#') // Anchor links often point to parts
                    );

                if (isSubCategory) {
                    const fullUrl = new URL(href, baseUrl).href;
                    if (!subCategories.some(s => s.url === fullUrl)) {
                        subCategories.push({ name: text, url: fullUrl });
                    }
                }
            }
        });

        console.log(`[DEEP-SCRAPER] Found ${subCategories.length} sub-categories`);
        return subCategories;
    } catch (error) {
        console.error('[DEEP-SCRAPER] Error extracting sub-categories:', error.message);
        return [];
    }
}

/**
 * Extract parts data from a parts table
 * @param {string} html - HTML content
 * @param {string} pageUrl - Current page URL
 * @returns {Array} Array of part objects {name, oemNumber, description, imageUrl}
 */
function extractParts(html, pageUrl) {
    try {
        const $ = cheerio.load(html);
        const parts = [];

        // Try to extract from table
        $('table').each((tableIdx, table) => {
            const rows = $(table).find('tr');
            
            rows.each((rowIdx, row) => {
                if (rowIdx === 0) return; // Skip header row
                
                const cells = $(row).find('td');
                if (cells.length < 2) return;

                const $cells = cells.map((i, el) => $(el).text().trim());
                const partName = $cells[0] || '';
                const oemNumber = $cells[1] || '';
                const description = $cells[2] || '';
                
                // Extract image URL
                const $img = $(row).find('img');
                const imageUrl = $img.attr('src') ? 
                    new URL($img.attr('src'), pageUrl).href : null;

                if (partName && oemNumber) {
                    parts.push({
                        name: partName.substring(0, 100),
                        oemNumber: oemNumber.substring(0, 50),
                        description: description.substring(0, 200),
                        imageUrl: imageUrl
                    });
                }
            });
        });

        // Fallback: Extract from divs/cards if no table found
        if (parts.length === 0) {
            $('[class*="part"], [class*="item"], [class*="product"]').each((i, el) => {
                const $el = $(el);
                const name = $el.find('h2, h3, .name, .title').text().trim() || 
                            $el.find('a').first().text().trim();
                const oemNumber = $el.find('[class*="oem"], [class*="number"]').text().trim() ||
                                 $el.text().match(/[A-Z0-9\-]{4,20}/)?.[0];
                const description = $el.find('.description, p').text().trim();
                const imageUrl = $el.find('img').attr('src') ?
                                new URL($el.find('img').attr('src'), pageUrl).href : null;

                if (name && oemNumber) {
                    parts.push({
                        name: name.substring(0, 100),
                        oemNumber: oemNumber.substring(0, 50),
                        description: description.substring(0, 200),
                        imageUrl: imageUrl
                    });
                }
            });
        }

        // Remove duplicates by OEM number
        const unique = [...new Map(parts.map(p => [p.oemNumber, p])).values()];
        console.log(`[DEEP-SCRAPER] Extracted ${unique.length} unique parts`);
        return unique;
    } catch (error) {
        console.error('[DEEP-SCRAPER] Error extracting parts:', error.message);
        return [];
    }
}

/**
 * Deep recursive scraper: Model → Categories → Sub-Categories → Parts
 * Auto-saves all scraped parts to MongoDB ScrapedPart collection
 * @param {Array} models - Array of model objects {name, url}
 * @returns {Promise<Object>} Scraping statistics {totalModels, totalCategories, totalParts, savedParts, errors}
 */
async function deepScrapeModels(models) {
    const results = [];
    const stats = {
        totalModels: 0,
        totalCategories: 0,
        totalParts: 0,
        savedParts: 0,
        failedParts: 0,
        duplicateParts: 0,
        errors: []
    };

    for (const model of models) {
        console.log(`\n[DEEP-SCRAPER] ═══════════════════════════════════`);
        console.log(`[DEEP-SCRAPER] Processing Model: ${model.name}`);
        console.log(`[DEEP-SCRAPER] URL: ${model.url}`);

        try {
            // Step 1: Fetch model page and find categories
            const modelHTML = await fetchHTML(model.url);
            const categories = extractCategories(modelHTML, model.url);

            const modelData = {
                model: model.name,
                url: model.url,
                categories: []
            };

            stats.totalModels++;

            // Step 2: Process each category
            for (const category of categories.slice(0, 5)) { // Limit to 5 categories
                console.log(`\n[DEEP-SCRAPER] → Category: ${category.name}`);

                try {
                    const categoryHTML = await fetchHTML(category.url);
                    const subCategories = extractSubCategories(categoryHTML, category.url);

                    const categoryData = {
                        category: category.name,
                        url: category.url,
                        subCategories: []
                    };

                    stats.totalCategories++;

                    // Step 3: Process each sub-category
                    for (const subCategory of subCategories.slice(0, 3)) { // Limit to 3 sub-categories
                        console.log(`[DEEP-SCRAPER]   → Sub-Category: ${subCategory.name}`);

                        try {
                            const subCategoryHTML = await fetchHTML(subCategory.url);
                            const parts = extractParts(subCategoryHTML, subCategory.url);

                            stats.totalParts += parts.length;

                            // Build documents for database insertion with full hierarchy
                            const partDocuments = parts.map(part => ({
                                modelName: model.name,
                                categoryName: category.name,
                                subCategoryName: subCategory.name,
                                partName: part.name,
                                oemNumber: part.oemNumber,
                                description: part.description,
                                imageUrl: part.imageUrl,
                                modelUrl: model.url,
                                categoryUrl: category.url,
                                subCategoryUrl: subCategory.url,
                                scrapedAt: new Date()
                            }));

                            // Save to database using bulkWrite for upsert (handles duplicates)
                            if (partDocuments.length > 0) {
                                try {
                                    const bulkOps = partDocuments.map(doc => ({
                                        updateOne: {
                                            filter: { oemNumber: doc.oemNumber, modelName: doc.modelName },
                                            update: { $set: doc },
                                            upsert: true
                                        }
                                    }));

                                    const bulkWriteResult = await ScrapedPart.bulkWrite(bulkOps);
                                    stats.savedParts += bulkWriteResult.upsertedCount + bulkWriteResult.modifiedCount;
                                    stats.duplicateParts += bulkWriteResult.matchedCount - bulkWriteResult.modifiedCount;

                                    console.log(`[DEEP-SCRAPER] ✅ Saved ${bulkWriteResult.upsertedCount + bulkWriteResult.modifiedCount} parts to DB`);
                                } catch (dbError) {
                                    stats.failedParts += partDocuments.length;
                                    stats.errors.push(`Failed to save parts for ${category.name}/${subCategory.name}: ${dbError.message}`);
                                    console.error(`[DEEP-SCRAPER] ❌ DB Error: ${dbError.message}`);
                                }
                            }

                            categoryData.subCategories.push({
                                subCategory: subCategory.name,
                                url: subCategory.url,
                                partCount: parts.length,
                                parts: parts.slice(0, 10) // Limit to 10 parts per sub-category for response
                            });

                        } catch (error) {
                            console.warn(`[DEEP-SCRAPER] ⚠️ Error processing sub-category: ${error.message}`);
                            stats.errors.push(`Sub-category error: ${error.message}`);
                        }
                    }

                    modelData.categories.push(categoryData);

                } catch (error) {
                    console.warn(`[DEEP-SCRAPER] ⚠️ Error processing category: ${error.message}`);
                    stats.errors.push(`Category error: ${error.message}`);
                }

                // Rate limiting: wait between requests
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            results.push(modelData);

        } catch (error) {
            console.error(`[DEEP-SCRAPER] ❌ Error processing model ${model.name}: ${error.message}`);
            stats.errors.push(`Model error on ${model.name}: ${error.message}`);
            results.push({
                model: model.name,
                url: model.url,
                error: error.message,
                categories: []
            });
        }
    }

    console.log(`\n[DEEP-SCRAPER] ═══════════════════════════════════`);
    console.log(`[DEEP-SCRAPER] Scraping Complete`);
    console.log(`[DEEP-SCRAPER] Statistics:`, stats);

    return stats;
}

/**
 * Scrape a single URL stack (Category → Sub-Category → Parts)
 * Useful for targeted scraping of specific paths
 * Auto-saves all parts to MongoDB ScrapedPart collection
 * @param {string} categoryUrl - Starting category URL
 * @param {string} modelName - Model name for context (optional)
 * @param {string} categoryName - Category name for context (optional)
 * @returns {Promise<Object>} Result with saved count {subCategories: [], savedCount, errors}
 */
async function scrapeCategoryStack(categoryUrl, modelName = 'Unknown', categoryName = 'Unknown') {
    console.log(`[DEEP-SCRAPER] Starting category stack scrape: ${categoryUrl}`);

    const result = {
        url: categoryUrl,
        subCategories: [],
        savedCount: 0,
        failedCount: 0,
        errors: []
    };

    try {
        const categoryHTML = await fetchHTML(categoryUrl);
        const subCategories = extractSubCategories(categoryHTML, categoryUrl);

        for (const subCategory of subCategories.slice(0, 10)) {
            try {
                const subCategoryHTML = await fetchHTML(subCategory.url);
                const parts = extractParts(subCategoryHTML, subCategory.url);

                // Build documents for database insertion with full hierarchy
                const partDocuments = parts.map(part => ({
                    modelName: modelName,
                    categoryName: categoryName,
                    subCategoryName: subCategory.name,
                    partName: part.name,
                    oemNumber: part.oemNumber,
                    description: part.description,
                    imageUrl: part.imageUrl,
                    categoryUrl: categoryUrl,
                    subCategoryUrl: subCategory.url,
                    scrapedAt: new Date()
                }));

                // Save to database using bulkWrite for upsert
                if (partDocuments.length > 0) {
                    try {
                        const bulkOps = partDocuments.map(doc => ({
                            updateOne: {
                                filter: { oemNumber: doc.oemNumber, modelName: doc.modelName },
                                update: { $set: doc },
                                upsert: true
                            }
                        }));

                        const bulkWriteResult = await ScrapedPart.bulkWrite(bulkOps);
                        result.savedCount += bulkWriteResult.upsertedCount + bulkWriteResult.modifiedCount;

                        console.log(`[DEEP-SCRAPER] ✅ Saved ${bulkWriteResult.upsertedCount + bulkWriteResult.modifiedCount} parts from ${subCategory.name}`);
                    } catch (dbError) {
                        result.failedCount += partDocuments.length;
                        result.errors.push(`Failed to save parts for ${subCategory.name}: ${dbError.message}`);
                        console.error(`[DEEP-SCRAPER] ❌ DB Error: ${dbError.message}`);
                    }
                }

                result.subCategories.push({
                    subCategory: subCategory.name,
                    url: subCategory.url,
                    parts: parts
                });

                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                result.errors.push(`Error in sub-category ${subCategory.name}: ${error.message}`);
                console.warn(`[DEEP-SCRAPER] Error in sub-category: ${error.message}`);
            }
        }

        return result;
    } catch (error) {
        result.errors.push(`Error scraping category stack: ${error.message}`);
        console.error(`[DEEP-SCRAPER] Error scraping category stack: ${error.message}`);
        return result;
    }
}

module.exports = {
    fetchHTML,
    extractCategories,
    extractSubCategories,
    extractParts,
    deepScrapeModels,
    scrapeCategoryStack
};
