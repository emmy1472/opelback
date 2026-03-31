/**
 * Test the query endpoints with existing database data
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function main() {
    try {
        console.log('\n' + '='.repeat(70));
        console.log('📊 QUERY ENDPOINTS TEST - Spec Data Browser');
        console.log('='.repeat(70) + '\n');

        // 1. Get all models
        console.log('[1] Fetching all vehicle models...');
        const modelsRes = await axios.get(`${API_URL}/scraped-parts/models`);
        console.log(`✅ Found ${modelsRes.data.models.length} models:`, modelsRes.data.models);

        // 2. Get categories for first model
        if (modelsRes.data.models.length > 0) {
            const model = modelsRes.data.models[0];
            console.log(`\n[2] Fetching categories for "${model}"...`);
            const catsRes = await axios.get(`${API_URL}/scraped-parts/${model}/categories`);
            console.log(`✅ Categories:`, catsRes.data.categories.join(', '));

            // 3. Get sub-categories
            if (catsRes.data.categories.length > 0) {
                const category = catsRes.data.categories[0];
                console.log(`\n[3] Fetching sub-categories for "${model}/${category}"...`);
                const subcatsRes = await axios.get(`${API_URL}/scraped-parts/${model}/${category}`);
                console.log(`✅ Sub-categories:`, subcatsRes.data.subCategories.join(', '));

                // 4. Get parts
                if (subcatsRes.data.subCategories.length > 0) {
                    const subcat = subcatsRes.data.subCategories[0];
                    console.log(`\n[4] Fetching parts for "${model}/${category}/${subcat}"...`);
                    const partsRes = await axios.get(
                        `${API_URL}/scraped-parts/${model}/${category}/${subcat}?limit=10`
                    );
                    console.log(`✅ Found ${partsRes.data.parts.length} parts:`);
                    partsRes.data.parts.forEach(part => {
                        console.log(`   • ${part.partName} (OEM: ${part.oemNumber})`);
                    });
                    console.log(`\nTotal in this category: ${partsRes.data.pagination.total}`);
                }
            }
        }

        // 5. Test search
        console.log(`\n[5] Testing full-text search for "engine"...`);
        const searchRes = await axios.get(`${API_URL}/scraped-parts/search?q=engine&limit=5`);
        console.log(`✅ Found ${searchRes.data.pagination.total} matches`);
        if (searchRes.data.results.length > 0) {
            console.log('First result:', searchRes.data.results[0].partName, `(${searchRes.data.results[0].oemNumber})`);
        }

        // 6. Get statistics
        console.log(`\n[6] Getting scraping statistics...`);
        const statsRes = await axios.get(`${API_URL}/scraped-parts/stats`);
        const stats = statsRes.data.statistics;
        console.log(`✅ Statistics:
   Total Parts: ${stats.totalParts}
   Models: ${stats.uniqueModels}
   Categories: ${stats.uniqueCategories}
   Last Scraped: ${stats.lastScrapedAt || 'N/A'}`);

        console.log('\n' + '='.repeat(70));
        console.log('✅ ALL QUERY ENDPOINTS WORKING!');
        console.log('='.repeat(70) + '\n');

    } catch (error) {
        if (error.response?.status === 404) {
            console.log('\n⚠️  No data found in database.');
            console.log('Run seed_scraped_parts.js to populate with sample data.\n');
        } else {
            console.error('\n❌ ERROR:', error.response?.data || error.message);
        }
    }
}

main();
