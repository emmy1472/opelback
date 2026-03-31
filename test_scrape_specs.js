/**
 * Test script to scrape vehicle spec data and populate database
 * Usage: node test_scrape_specs.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_USER = {
    username: 'scraper_test_' + Date.now(),
    email: 'scraper_test_' + Date.now() + '@test.com',
    password: 'TestPassword123!@#'
};

async function main() {
    try {
        console.log('[TEST] Starting spec data scraping test...\n');

        // Step 1: Register user
        console.log('[STEP 1] Registering test user...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, TEST_USER);
        console.log('✅ User registered:', registerRes.data.user.username);

        // Step 2: Login to get token
        console.log('\n[STEP 2] Logging in to get auth token...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        const token = loginRes.data.token;
        console.log('✅ Got auth token:', token.substring(0, 20) + '...');

        // Step 3: Scrape models (populate database with vehicle specs and parts)
        console.log('\n[STEP 3] Scraping Opel models with specs...');
        const modelsToScrape = [
            {
                name: 'Astra',
                url: 'https://opel.7zap.com/en/global/astra/'
            },
            {
                name: 'Corsa',
                url: 'https://opel.7zap.com/en/global/corsa/'
            },
            {
                name: 'Insignia',
                url: 'https://opel.7zap.com/en/global/insignia/'
            }
        ];

        console.log(`Scraping ${modelsToScrape.length} models...`);
        const scrapeRes = await axios.post(
            `${API_URL}/scrape/models`,
            { models: modelsToScrape },
            { 
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('\n✅ Scraping completed!');
        console.log('Statistics:', JSON.stringify(scrapeRes.data.statistics, null, 2));

        // Step 4: Query the scraped data
        console.log('\n[STEP 4] Querying scraped data...');
        
        // Get all models
        console.log('\n→ Getting all scraped models...');
        const modelsRes = await axios.get(`${API_URL}/scraped-parts/models`);
        console.log('Models in database:', modelsRes.data.models);

        // Get categories for first model
        if (modelsRes.data.models.length > 0) {
            const firstModel = modelsRes.data.models[0];
            console.log(`\n→ Getting categories for ${firstModel}...`);
            const catRes = await axios.get(`${API_URL}/scraped-parts/${firstModel}/categories`);
            console.log(`Categories for ${firstModel}:`, catRes.data.categories);

            // Get sub-categories for first category
            if (catRes.data.categories.length > 0) {
                const firstCat = catRes.data.categories[0];
                console.log(`\n→ Getting sub-categories for ${firstModel}/${firstCat}...`);
                const subcatRes = await axios.get(`${API_URL}/scraped-parts/${firstModel}/${firstCat}`);
                console.log(`Sub-categories:`, subcatRes.data.subCategories);

                // Get parts for first sub-category
                if (subcatRes.data.subCategories.length > 0) {
                    const firstSubcat = subcatRes.data.subCategories[0];
                    console.log(`\n→ Getting parts for ${firstModel}/${firstCat}/${firstSubcat}...`);
                    const partsRes = await axios.get(
                        `${API_URL}/scraped-parts/${firstModel}/${firstCat}/${firstSubcat}?limit=5`
                    );
                    console.log(`\nFirst 5 parts found:`);
                    partsRes.data.parts.forEach((part, i) => {
                        console.log(`  ${i + 1}. ${part.partName} (OEM: ${part.oemNumber})`);
                    });
                    console.log(`\nTotal parts in this category: ${partsRes.data.pagination.total}`);
                }
            }
        }

        // Get statistics
        console.log('\n→ Getting scraping statistics...');
        const statsRes = await axios.get(`${API_URL}/scraped-parts/stats`);
        console.log('Overall statistics:', JSON.stringify(statsRes.data.statistics, null, 2));

        // Test search
        console.log('\n→ Testing full-text search for "engine"...');
        const searchRes = await axios.get(`${API_URL}/scraped-parts/search?q=engine&limit=5`);
        console.log(`Found ${searchRes.data.pagination.total} results matching "engine"`);
        if (searchRes.data.results.length > 0) {
            console.log('First result:', searchRes.data.results[0].partName);
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ ALL TESTS PASSED - Database successfully populated!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ ERROR:', error.response?.data || error.message);
        process.exit(1);
    }
}

main();
