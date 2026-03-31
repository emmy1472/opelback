const { execSync } = require('child_process');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const os = require('os');


const BASE_URL = 'https://opel.7zap.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

// Detect OS platform for curl command
const CURL_CMD = os.platform() === 'win32' ? 'curl.exe' : 'curl';

async function fetchWithCurl(url, method = 'GET', postData = null, retryCount = 0) {
    try {
        let command;
        const headers = [
            `"User-Agent: ${USER_AGENT}"`,
            '"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"',
            '"Accept-Language: en-US,en;q=0.9"',
            '"Accept-Encoding: gzip, deflate"',
            '"DNT: 1"',
            '"Connection: keep-alive"',
            '"Upgrade-Insecure-Requests: 1"'
        ];
        
        const headerStr = headers.map(h => `-H ${h}`).join(' ');
        
        if (method === 'POST' && postData) {
            const dataStr = Object.entries(postData)
                .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
                .join('&');
            command = `${CURL_CMD} ${headerStr} -L -X POST -d "${dataStr}" "${url}" --max-time 60 --connect-timeout 15`;
        } else {
            // Add cookie jar and longer timeout for production environments
            const cookieFile = os.tmpdir() + '/cookies.txt';
            command = `${CURL_CMD} ${headerStr} -L -b "${cookieFile}" -c "${cookieFile}" "${url}" --max-time 60 --connect-timeout 15`;
        }
        
        console.log(`[SCRAPER] Fetching: ${url.substring(0, 80)}...`);
        
        const stdout = execSync(command, {
            encoding: 'utf-8',
            maxBuffer: 1024 * 1024 * 10,
            timeout: 65000
        });
        
        console.log(`[SCRAPER] ✅ Successfully fetched ${url.substring(0, 50)}... (${stdout.length} bytes)`);
        return stdout;
    } catch (error) {
        const msg = error.message || '';
        console.error(`[SCRAPER] ❌ Error fetching ${url}:`, msg.substring(0, 200));
        
        // Retry logic for network errors
        if (retryCount < 2 && (msg.includes('timed out') || msg.includes('ETIMEDOUT'))) {
            console.log(`[SCRAPER] Retrying... (attempt ${retryCount + 1}/2)`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
            return fetchWithCurl(url, method, postData, retryCount + 1);
        }
        
        if (msg.includes('Could not resolve host') || msg.includes('Connection refused')) {
            const networkErr = new Error(`Network error: Cannot reach ${url}. The server may be unreachable.`);
            networkErr.isNetworkError = true;
            throw networkErr;
        }
        throw error;
    }


async function getGlobalModels() {
    try {
        const html = await fetchWithCurl(`${BASE_URL}/en/global/`);
        const $ = cheerio.load(html);
        const models = [];

        // Use regex for images to be robust against formatting differences (e.g. escaped characters)
        const imgRegex = /"url":"(https:\/\/opel\.7zap\.com\/en\/global\/[^"]+\/)","name":"[^"]+","inLanguage":"en","image":"(https:\/\/img\.7zap\.com\/images\/oem\/models\/[^"]+\.webp)"/g;
        let imageMap = {};
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
            imageMap[match[1]] = match[2];
        }

        // Updated selector based on adam_catalog.html analysis
        $('a[href*="-parts-catalog/"]').each((i, el) => {
            const href = $(el).attr('href');
            let name = $(el).text().trim();
            if (href && name && name.length > 2) {
                // Clean up name
                name = name.replace(/\s*-\s*parts catalog.*/i, '').trim();
                const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                if (!models.some(m => m.url === fullUrl)) {
                    models.push({
                        name,
                        url: fullUrl,
                        image: imageMap[fullUrl] || imageMap[fullUrl + '/'] || null
                    });
                }
            }
        });

        return models;
    } catch (error) {
        console.error('Error scraping global models:', error.message);
        throw error;
    }
}

async function getModelCatalog(modelUrl) {
    try {
        const html = await fetchWithCurl(modelUrl);
        const $ = cheerio.load(html);
        const categories = [];

        // For Nuxt SPA: Look for links in various common patterns
        // Try finding category links by href patterns
        $('a').each((i, el) => {
            const href = $(el).attr('href');
            const text = $(el).text().trim();

            // Look for parts-catalog or specific category patterns
            if (href && (
                href.includes('/global/') ||
                href.includes('/en/') ||
                href.includes('-catalog')
            ) && text.length > 2 && !text.includes('7zap') && href !== modelUrl) {
                const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                
                // Avoid duplicates
                if (!categories.some(c => c.url === fullUrl)) {
                    categories.push({
                        name: text.substring(0, 50), // Limit name length
                        url: fullUrl
                    });
                }
            }
        });

        // Filter to keep only logical categories (avoid meta links, navigation links)
        const filtered = categories.filter(c => {
            const name = c.name.toLowerCase();
            return !name.includes('privacy') && 
                   !name.includes('cookie') &&
                   !name.includes('terms') &&
                   !name.includes('home') &&
                   !name.includes('go back') &&
                   c.url.toLowerCase().includes('catalog') ||
                   c.url.toLowerCase().includes('parts');
        });

        return filtered.length > 0 ? filtered : categories;
    } catch (error) {
        console.error('Error scraping model catalog:', error.message);
        throw error;
    }
}

async function getCategoryParts(categoryUrl) {
    try {
        const html = await fetchWithCurl(categoryUrl);
        const $ = cheerio.load(html);
        const parts = [];

        // For Nuxt SPA: Extract parts from common patterns
        // Look for part numbers and names
        $('a, div, li, span').each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();
            const href = $el.attr('href');
            
            // Look for patterns like part numbers (numeric/alphanumeric codes)
            // Examples: "1234567", "DL-123456", etc.
            const partNumberMatch = text.match(/^[A-Z0-9\-\.]{4,20}$/i);
            if (partNumberMatch && text.length > 3) {
                parts.push({
                    name: $el.find('span, div').first().text().trim() || text.substring(0, 50),
                    number: text,
                    url: href ? (href.startsWith('http') ? href : `${BASE_URL}${href}`) : categoryUrl
                });
            }
        });

        // Alternative: Look for part links directly
        if (parts.length === 0) {
            $('a[href*="/part/"], a[href*="/catalog/"], a').each((i, el) => {
                const href = $(el).attr('href');
                const name = $(el).text().trim();
                if (href && name && name.length > 2 && !name.includes('cookie') && !name.includes('privacy')) {
                    const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
                    parts.push({
                        name: name.substring(0, 50),
                        number: href.split('/').slice(-2).join('/'),
                        url: fullUrl
                    });
                }
            });
        }

        return parts.filter((p, i, arr) => arr.findIndex(x => x.number === p.number) === i); // Remove duplicates
    } catch (error) {
        console.error('Error scraping category parts:', error.message);
        throw error;
    }
}

async function getVehicleSpecs(modelUrl) {
    try {
        const html = await fetchWithCurl(modelUrl);
        const $ = cheerio.load(html);
        const specs = [];

        // For Nuxt SPA: Look for spec patterns
        // Year patterns: YYYY, 2000-2020 ranges
        // Engine: V6, 1.6L, diesel, gasoline, etc.
        // Transmission: manual, automatic, CVT

        $('*').each((i, el) => {
            const $el = $(el);
            const text = $el.text().trim();

            // Look for year ranges or specifications
            const yearMatch = text.match(/\b(19|20)\d{2}\b/);
            const engineMatch = text.match(/(diesel|petrol|gasoline|electric|hybrid|engine|V4|V6|V8|turbo|\d\.?\d+[LT])/i);
            const transmissionMatch = text.match(/(manual|automatic|cvt|a\/t|m\/t|transmission)/i);

            if (yearMatch && engineMatch && transmissionMatch) {
                const year = yearMatch[0];
                const engine = engineMatch[0];
                const transmission = transmissionMatch[0];

                // Avoid duplicates
                if (!specs.some(s => s.year === year && s.engine === engine)) {
                    specs.push({
                        year: parseInt(year),
                        engine: engine.substring(0, 20),
                        transmission: transmission.substring(0, 20),
                        url: modelUrl
                    });
                }
            }
        });

        // Alternative: Look for table rows with year data
        if (specs.length === 0) {
            $('tr').each((i, el) => {
                const cells = $(el).find('td, th');
                if (cells.length >= 3) {
                    const year = cells.eq(0).text().trim();
                    const engine = cells.eq(1).text().trim();
                    const transmission = cells.eq(2).text().trim();

                    if (year && engine && transmission && year.match(/\d{4}/)) {
                        specs.push({
                            year: parseInt(year.match(/\d{4}/)[0]),
                            engine: engine.substring(0, 30),
                            transmission: transmission.substring(0, 30),
                            url: modelUrl
                        });
                    }
                }
            });
        }

        return specs;
    } catch (error) {
        console.error('Error scraping vehicle specs:', error.message);
        throw error;
    }
}

// ─────────────────────────────────────────────
// Local Opel/GM VIN decoder — no API calls needed
// ─────────────────────────────────────────────

// WMI → model slug mapping for Opel (based on common Opel WMI codes)
const OPEL_WMI_MAP = {
    // Opel Germany
    'W0L': { brand: 'Opel', region: 'global' },
    'WOL': { brand: 'Opel', region: 'global' },
    // Opel Belgium
    'W0V': { brand: 'Opel', region: 'global' },
    // Opel Spain
    'VSX': { brand: 'Opel', region: 'global' },
    // Vauxhall UK
    'SAJ': { brand: 'Vauxhall', region: 'global' },
    'SUL': { brand: 'Vauxhall', region: 'global' },
};

// VIN position 4–8 contains model info. Use position 4 as primary model key.
// Based on known Opel model codes (4th character of VIN for W0L VINs):
const OPEL_MODEL_VIN_MAP = {
    // Astra
    '0': 'astra',
    'A': 'astra',
    'B': 'astra',
    // Corsa
    'C': 'corsa',
    // Zafira / Astra family check via positions 4-5
    // We use pattern matching on positions 4-8 below
};

// More granular matching via positions 4-6 (chars 4,5,6 = index 3-5)
// Covers W0L (Germany), W0V (Belgium), VSX (Spain) plants
const OPEL_DETAILED_MODEL = [
    // -- W0L Germany --
    { prefix: '0AA', model: 'corsa', name: 'Corsa B/C' },
    { prefix: '0AB', model: 'corsa', name: 'Corsa C' },
    { prefix: '0AT', model: 'astra', name: 'Astra H' },
    { prefix: '0AH', model: 'astra', name: 'Astra H' },
    { prefix: '0TG', model: 'astra', name: 'Astra G + Zafira A' },
    { prefix: '0XD', model: 'zafira', name: 'Zafira B' },
    { prefix: '0XC', model: 'zafira', name: 'Zafira A' },
    { prefix: '0YD', model: 'omega', name: 'Omega B' },
    { prefix: '0Y3', model: 'vectra', name: 'Vectra C' },
    { prefix: '0ZB', model: 'astra', name: 'Astra J' },
    { prefix: '0Z0', model: 'mokka', name: 'Mokka' },
    { prefix: '0Z1', model: 'insignia', name: 'Insignia A' },
    { prefix: '0GD', model: 'vectra', name: 'Vectra B' },
    { prefix: '0GC', model: 'vectra', name: 'Vectra B' },
    { prefix: '0ZJ', model: 'adam', name: 'Adam' },
    { prefix: 'BBA', model: 'mokka', name: 'Mokka' },
    { prefix: 'BBD', model: 'mokka', name: 'Mokka' },
    { prefix: 'BBL', model: 'insignia', name: 'Insignia B' },
    { prefix: 'BBM', model: 'insignia', name: 'Insignia A' },
    { prefix: 'BBR', model: 'astra', name: 'Astra K' },
    { prefix: 'BBC', model: 'corsa', name: 'Corsa D' },
    { prefix: 'BBF', model: 'corsa', name: 'Corsa D' },
    { prefix: 'BBH', model: 'corsa', name: 'Corsa E' },
    { prefix: 'BBJ', model: 'corsa', name: 'Corsa F' },
    { prefix: 'BBK', model: 'meriva', name: 'Meriva B' },
    { prefix: 'BBN', model: 'zafira', name: 'Zafira C' },
    { prefix: 'BBP', model: 'astra', name: 'Astra K' },
    { prefix: 'BFA', model: 'adam', name: 'Adam' },
    // -- W0V Belgium --
    { prefix: 'BE8', model: 'crossland', name: 'Crossland X' },
    { prefix: 'BE6', model: 'crossland', name: 'Crossland X' },
    { prefix: 'BE7', model: 'crossland', name: 'Crossland X' },
    { prefix: 'BGA', model: 'grandland', name: 'Grandland X' },
    { prefix: 'BGR', model: 'grandland', name: 'Grandland X' },
    { prefix: 'BG8', model: 'grandland', name: 'Grandland X' },
    { prefix: 'BHN', model: 'mokka', name: 'Mokka B' },
    { prefix: 'BGS', model: 'astra', name: 'Astra L' },
    { prefix: 'BHA', model: 'astra', name: 'Astra L' },
    { prefix: 'BAD', model: 'vivaro', name: 'Vivaro' },
    { prefix: 'BAJ', model: 'vivaro', name: 'Vivaro' },
    // -- VSX Spain --
    { prefix: 'SX0', model: 'corsa', name: 'Corsa E' },
    { prefix: 'SX3', model: 'corsa', name: 'Corsa F' },
    { prefix: 'SXM', model: 'meriva', name: 'Meriva A' },
    { prefix: 'SXV', model: 'meriva', name: 'Meriva A' },
    { prefix: 'SXW', model: 'corsa', name: 'Corsa C' },
];


// VIN 10th character → model year
// Year codes repeat on a 30-year cycle. Each char maps to TWO possible years.
// We pick the most recent plausible year for modern Opel VINs.
const VIN_YEAR_CYCLES = {
    'A': [1980, 2010], 'B': [1981, 2011], 'C': [1982, 2012],
    'D': [1983, 2013], 'E': [1984, 2014], 'F': [1985, 2015],
    'G': [1986, 2016], 'H': [1987, 2017], 'J': [1988, 2018],
    'K': [1989, 2019], 'L': [1990, 2020], 'M': [1991, 2021],
    'N': [1992, 2022], 'P': [1993, 2023], 'R': [1994, 2024],
    'S': [1995, 2025], 'T': [1996, null], 'V': [1997, null],
    'W': [1998, null], 'X': [1999, null], 'Y': [2000, null],
    '1': [2001, null], '2': [2002, null], '3': [2003, null],
    '4': [2004, null], '5': [2005, null], '6': [2006, null],
    '7': [2007, null], '8': [2008, null], '9': [2009, null],
};

// WMIs that started production in 2010 or later — always pick the second cycle
const MODERN_WMIS = new Set(['W0V', 'VSX']);
// Cutoff: if the model code prefix appears only with modern models, prefer recent year
const MODERN_MODEL_PREFIXES = new Set([
    'BE8', 'BE6', 'BE7', 'BGA', 'BGR', 'BG8', 'BHN', 'BGS', 'BHA',
    'BBL', 'BBR', 'BBJ', 'BBH', 'BFA', 'SX3'
]);

function resolveYear(yearChar, wmi, modelKey) {
    const cycles = VIN_YEAR_CYCLES[yearChar];
    if (!cycles) return 'Unknown';
    const [first, second] = cycles;
    if (!second) return first; // unambiguous (e.g. '1'→2001)
    // If the WMI or model prefix is known to be modern, pick second cycle
    if (MODERN_WMIS.has(wmi) || MODERN_MODEL_PREFIXES.has(modelKey)) return second;
    // Otherwise default to second cycle for any Opel made after roughly 2005
    // (first cycle would be 1980–1989, highly unlikely for a working vehicle)
    return second;
}

function decodeVinLocally(vin) {
    if (!vin || vin.length !== 17) return null;
    const vinUpper = vin.toUpperCase();

    // Check WMI (first 3 chars)
    const wmi = vinUpper.substring(0, 3);
    const wmiEntry = OPEL_WMI_MAP[wmi];
    if (!wmiEntry) {
        return { found: false, message: 'This VIN does not appear to be an Opel vehicle. Only Opel/Vauxhall VINs are supported.' };
    }

    // Decode year from 10th character (index 9) with cycle disambiguation
    const yearChar = vinUpper[9];
    const modelKey = vinUpper.substring(3, 6);
    const year = resolveYear(yearChar, wmi, modelKey);
    let modelSlug = 'astra'; // default fallback
    let modelName = 'Opel Vehicle';

    for (const entry of OPEL_DETAILED_MODEL) {
        if (modelKey.startsWith(entry.prefix)) {
            modelSlug = entry.model;
            modelName = entry.name;
            break;
        }
    }

    // Construct 7zap catalog URL for this model
    const catalogUrl = `${BASE_URL}/en/${wmiEntry.region}/${modelSlug}/`;

    return {
        found: true,
        url: catalogUrl,
        name: `${wmiEntry.brand} ${modelName} (${year})`,
        year,
        model: modelName
    };
}

async function searchByVin(vin) {
    // First: try local WMI-based decoding (works offline, no auth needed)
    const localResult = decodeVinLocally(vin);
    if (localResult) {
        return localResult;
    }

    // If WMI decode didn't return anything useful, tell user
    return { found: false, message: 'Unable to decode VIN. Please check the number and try again.' };
}

module.exports = {
    getGlobalModels,
    getVehicleSpecs,
    getModelCatalog,
    getCategoryParts,
    searchByVin
};

