/**
 * Deep Scraper Example Usage
 * 
 * This file demonstrates how to use the deep recursive scraper
 * to extract vehicle parts from a catalog with hierarchical structure
 */

// Example 1: Using the scraper module directly
async function exampleDirectUsage() {
    const {
        deepScrapeModels,
        scrapeCategoryStack,
        extractCategories,
        fetchHTML
    } = require('./scrapers/deep-scraper');

    // Models to scrape
    const models = [
        {
            name: 'Astra K',
            url: 'https://opel.7zap.com/en/global/astra-k/'
        },
        {
            name: 'Corsa E',
            url: 'https://opel.7zap.com/en/global/corsa-e/'
        }
    ];

    try {
        console.log('[EXAMPLE] Starting deep scrape of models...\n');
        
        // Deep scrape all models
        const results = await deepScrapeModels(models);
        
        console.log('\n[EXAMPLE] ✅ Scraping complete!');
        console.log(JSON.stringify(results, null, 2));
        
        // Save results to file
        const fs = require('fs');
        fs.writeFileSync(
            './scraping-results.json',
            JSON.stringify(results, null, 2)
        );
        console.log('\n[EXAMPLE] Results saved to scraping-results.json');
        
    } catch (error) {
        console.error('[EXAMPLE] Error:', error.message);
    }
}

// Example 2: Targeted category scraping
async function exampleCategoryStackScraping() {
    const { scrapeCategoryStack } = require('./scrapers/deep-scraper');

    const categoryUrl = 'https://opel.7zap.com/en/global/astra-k-engine/';

    try {
        console.log(`[EXAMPLE] Scraping category: ${categoryUrl}\n`);
        
        const result = await scrapeCategoryStack(categoryUrl);
        
        console.log('[EXAMPLE] ✅ Scraping complete!');
        console.log(`\nFound ${result.subCategories.length} sub-categories:`);
        
        result.subCategories.forEach((subCat, idx) => {
            console.log(
                `  ${idx + 1}. ${subCat.subCategory}: ${subCat.parts.length} parts`
            );
        });
        
        // Display first few parts
        if (result.subCategories.length > 0) {
            const firstParts = result.subCategories[0].parts.slice(0, 3);
            console.log('\nSample parts from first sub-category:');
            firstParts.forEach(part => {
                console.log(`  - ${part.name} (${part.oemNumber})`);
            });
        }
        
    } catch (error) {
        console.error('[EXAMPLE] Error:', error.message);
    }
}

// Example 3: Using the API endpoints
async function exampleAPIUsage() {
    const axios = require('axios');

    const token = 'YOUR_JWT_TOKEN_HERE'; // Replace with actual token from login

    try {
        // First, get a token by logging in
        console.log('[EXAMPLE] Getting authentication token...\n');
        
        const loginResponse = await axios.post(
            'http://localhost:5000/api/auth/login',
            {
                email: 'user@example.com',
                password: 'your_password'
            }
        );
        
        const jwtToken = loginResponse.data.token;
        console.log('[EXAMPLE] ✅ Authenticated\n');

        // Check scraper health
        console.log('[EXAMPLE] Checking scraper health...\n');
        const healthResponse = await axios.get(
            'http://localhost:5000/api/scrape/health'
        );
        console.log('[EXAMPLE] Scraper Status:', healthResponse.data.status);
        console.log('[EXAMPLE] Capabilities:', healthResponse.data.capabilities);
        console.log();

        // Initiate deep scraping
        console.log('[EXAMPLE] Initiating deep scrape...\n');
        const scrapeResponse = await axios.post(
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
                    'Authorization': `Bearer ${jwtToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const trackingId = scrapeResponse.data.trackingId;
        console.log('[EXAMPLE] ✅ Scraping initiated!');
        console.log(`[EXAMPLE] Tracking ID: ${trackingId}`);
        console.log('[EXAMPLE] Status:', scrapeResponse.data.status);
        console.log('[EXAMPLE] Note:', scrapeResponse.data.warning);

    } catch (error) {
        console.error(
            '[EXAMPLE] Error:',
            error.response?.data || error.message
        );
    }
}

// Example 4: Processing scraping results
function exampleProcessResults(scrapingResults) {
    console.log('[EXAMPLE] Processing scraping results...\n');

    // Count total parts
    let totalParts = 0;
    let totalSubCategories = 0;
    let totalCategories = 0;

    scrapingResults.forEach(model => {
        console.log(`\n📦 Model: ${model.model}`);
        
        model.categories.forEach(category => {
            totalCategories++;
            console.log(`  📁 ${category.category}`);
            
            category.subCategories.forEach(subCat => {
                totalSubCategories++;
                const partCount = subCat.parts.length;
                totalParts += partCount;
                
                console.log(`    📄 ${subCat.subCategory}: ${partCount} parts`);
                
                // Show first 2 parts as example
                subCat.parts.slice(0, 2).forEach(part => {
                    console.log(`       - ${part.name}`);
                    console.log(`         OEM#: ${part.oemNumber}`);
                });
                
                if (subCat.parts.length > 2) {
                    console.log(`       ... and ${subCat.parts.length - 2} more`);
                }
            });
        });
    });

    console.log('\n' + '='.repeat(50));
    console.log('SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Models Processed: ${scrapingResults.length}`);
    console.log(`Total Categories Found: ${totalCategories}`);
    console.log(`Total Sub-Categories Found: ${totalSubCategories}`);
    console.log(`Total Parts Extracted: ${totalParts}`);
    console.log('='.repeat(50) + '\n');
}

// Example 5: Filtering and searching results
function exampleFilterResults(scrapingResults, searchTerm) {
    console.log(`[EXAMPLE] Searching for parts matching: "${searchTerm}"\n`);

    const matches = [];

    scrapingResults.forEach(model => {
        model.categories.forEach(category => {
            category.subCategories.forEach(subCat => {
                subCat.parts.forEach(part => {
                    if (
                        part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        part.oemNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        part.description.toLowerCase().includes(searchTerm.toLowerCase())
                    ) {
                        matches.push({
                            model: model.model,
                            category: category.category,
                            subCategory: subCat.subCategory,
                            part
                        });
                    }
                });
            });
        });
    });

    console.log(`Found ${matches.length} matching parts:\n`);
    matches.forEach(match => {
        console.log(`${match.model} → ${match.category} → ${match.subCategory}`);
        console.log(`  Name: ${match.part.name}`);
        console.log(`  OEM#: ${match.part.oemNumber}`);
        console.log(`  Desc: ${match.part.description}`);
        console.log();
    });
}

// Example 6: Export to CSV
function exampleExportToCSV(scrapingResults, filename = 'parts-catalog.csv') {
    const fs = require('fs');
    const csv = require('@fast-csv/format');

    const stream = fs.createWriteStream(filename);
    const csvStream = csv.format({ headers: true });

    csvStream.pipe(stream);

    scrapingResults.forEach(model => {
        model.categories.forEach(category => {
            category.subCategories.forEach(subCat => {
                subCat.parts.forEach(part => {
                    csvStream.write({
                        model: model.model,
                        category: category.category,
                        subCategory: subCat.subCategory,
                        partName: part.name,
                        oemNumber: part.oemNumber,
                        description: part.description,
                        imageUrl: part.imageUrl || 'N/A'
                    });
                });
            });
        });
    });

    csvStream.end();

    stream.on('finish', () => {
        console.log(`[EXAMPLE] ✅ Results exported to ${filename}`);
    });
}

// Run examples
if (require.main === module) {
    console.log('Deep Scraper Examples\n');
    console.log('=' .repeat(50));

    // Choose which example to run by uncommenting:
    
    // exampleDirectUsage();
    // exampleCategoryStackScraping();
    // exampleAPIUsage();
    
    // For these, you need actual results first:
    // const results = require('./scraping-results.json');
    // exampleProcessResults(results);
    // exampleFilterResults(results, 'gasket');
    // exampleExportToCSV(results);
}

module.exports = {
    exampleDirectUsage,
    exampleCategoryStackScraping,
    exampleAPIUsage,
    exampleProcessResults,
    exampleFilterResults,
    exampleExportToCSV
};
