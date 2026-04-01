/**
 * VIN Decoder Scraper
 * 
 * Decodes 17-character Opel VINs to extract:
 * - Model family (Corsa, Astra, Mokka, etc.)
 * - Year of manufacture
 * - Engine code & displacement
 * - Gearbox/Transmission type
 * - Body style
 * - Market/Region
 * - Direct link to parts catalog
 * 
 * Data Source: https://opel.7zap.com/en/vin-decoder/
 */

const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const BASE_URL = 'https://opel.7zap.com/en/vin-decoder/';

// Configure axios with realistic headers
const axiosInstance = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Cache-Control': 'max-age=0'
  }
});

/**
 * Decode a 17-character VIN and return vehicle details
 * @param {string} vin - 17-character VIN
 * @returns {Promise<Object>} Vehicle details
 */
async function decodeVIN(vin) {
  if (!vin || vin.length !== 17) {
    throw new Error('VIN must be exactly 17 characters');
  }

  try {
    console.log(`[VIN-DECODER] Decoding VIN: ${vin}`);

    // Try JSON API endpoint first (modern approach)
    try {
      const apiUrl = `${BASE_URL}api/decode?vin=${vin}`;
      console.log(`[VIN-DECODER] Trying API endpoint: ${apiUrl}`);
      
      const apiResponse = await axiosInstance.get(apiUrl);
      
      if (apiResponse.data && apiResponse.data.success !== false) {
        console.log(`[VIN-DECODER] ✅ API response received`);
        return parseAPIResponse(apiResponse.data, vin);
      }
    } catch (apiError) {
      console.log(`[VIN-DECODER] API endpoint not available, trying form submission...`);
    }

    // Fallback: Submit form and parse HTML response
    return await decodeVINViaForm(vin);

  } catch (error) {
    console.error(`[VIN-DECODER] ❌ Error decoding VIN: ${error.message}`);
    throw error;
  }
}

/**
 * Parse JSON API response
 */
function parseAPIResponse(data, vin) {
  const extracted = {
    vin: vin,
    source: 'api',
    decoded_at: new Date(),
    model: null,
    year: null,
    engine: null,
    gearbox: null,
    body_style: null,
    market: null,
    catalog_link: null,
    raw_data: data
  };

  // Map API fields to our schema
  if (data.model) extracted.model = data.model;
  if (data.year) extracted.year = parseInt(data.year);
  if (data.engine) extracted.engine = data.engine;
  if (data.gearbox) extracted.gearbox = data.gearbox;
  if (data.body_style) extracted.body_style = data.body_style;
  if (data.market) extracted.market = data.market;
  if (data.catalog_link) extracted.catalog_link = data.catalog_link;

  return extracted;
}

/**
 * Decode VIN via HTML form submission (fallback)
 */
async function decodeVINViaForm(vin) {
  try {
    console.log(`[VIN-DECODER] Fetching decoder page...`);
    
    // Get the page to extract CSRF token if needed
    const pageResponse = await axiosInstance.get(BASE_URL);
    const $ = cheerio.load(pageResponse.data);

    // Look for VIN decoder form and submit
    console.log(`[VIN-DECODER] Looking for decoder form...`);

    // Try multiple form submission methods
    const formData = new URLSearchParams();
    formData.append('vin', vin);
    formData.append('action', 'decode_vin');

    const submitResponse = await axiosInstance.post(BASE_URL, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    console.log(`[VIN-DECODER] Form submitted, parsing response...`);
    return parseHTMLResponse(submitResponse.data, vin);

  } catch (error) {
    console.error(`[VIN-DECODER] Form submission failed: ${error.message}`);
    
    // Last resort: Return VIN components based on VIN structure
    return parseVINStructure(vin);
  }
}

/**
 * Parse HTML response to extract vehicle info
 */
function parseHTMLResponse(html, vin) {
  const $ = cheerio.load(html);
  
  const extracted = {
    vin: vin,
    source: 'html_parse',
    decoded_at: new Date(),
    model: null,
    year: null,
    engine: null,
    gearbox: null,
    body_style: null,
    market: null,
    catalog_link: null
  };

  // Look for result tables or divs
  const resultDivs = $('[class*="result"], [class*="decode"], [class*="vin-result"]');
  
  resultDivs.each((i, el) => {
    const text = $(el).text().trim().toLowerCase();
    const html = $(el).html();

    // Extract model
    if (text.includes('model')) {
      extracted.model = $(el).find('[class*="value"]').text().trim() || 
                       text.match(/model[:\s]+([^\n,]+)/)?.[1]?.trim();
    }

    // Extract year
    if (text.includes('year')) {
      const yearMatch = text.match(/(?:year|production)\s*[:\s]+(\d{4})/);
      if (yearMatch) extracted.year = parseInt(yearMatch[1]);
    }

    // Extract engine
    if (text.includes('engine')) {
      extracted.engine = $(el).find('[class*="value"]').text().trim() || 
                        text.match(/engine[:\s]+([^\n,]+)/)?.[1]?.trim();
    }

    // Extract gearbox
    if (text.includes('gearbox') || text.includes('transmission')) {
      extracted.gearbox = $(el).find('[class*="value"]').text().trim() || 
                         text.match(/(?:gearbox|transmission)[:\s]+([^\n,]+)/)?.[1]?.trim();
    }

    // Extract body style
    if (text.includes('body')) {
      extracted.body_style = $(el).find('[class*="value"]').text().trim() || 
                            text.match(/body[:\s]+([^\n,]+)/)?.[1]?.trim();
    }
  });

  // Look for parts catalog link
  const catalogLink = $('a[href*="/catalog/"], a[href*="/parts/"]').attr('href');
  if (catalogLink) {
    extracted.catalog_link = catalogLink.startsWith('http') ? 
      catalogLink : 
      ('https://opel.7zap.com' + catalogLink);
  }

  return extracted;
}

/**
 * Parse VIN structure (last resort - extract what we can from VIN itself)
 * VIN Structure: WMI (3) + VDS (6) + VIS (8)
 * Position guide:
 * 1-3: World Manufacturer Identifier (WMI)
 * 4-6: Vehicle Descriptor Section (VDS)
 * 7-8: Check digit + Model year
 * 9: Plant code
 * 10-17: Sequential number
 */
function parseVINStructure(vin) {
  const extracted = {
    vin: vin,
    source: 'vin_structure',
    decoded_at: new Date(),
    model: null,
    year: null,
    engine: null,
    gearbox: null,
    body_style: null,
    market: null,
    catalog_link: null,
    notes: 'Limited info from VIN structure only'
  };

  // Extract year from position 10 (model year code)
  const yearCode = vin[9]; // Position 10 is index 9
  const yearMap = {
    'Y': 2000, 'X': 2001, 'W': 2002, 'V': 2003, 'U': 2004,
    'T': 2005, 'S': 2006, 'R': 2007, 'P': 2008, 'N': 2009,
    'M': 2010, 'L': 2011, 'K': 2012, 'J': 2013, 'H': 2014,
    'G': 2015, 'F': 2016, 'E': 2017, 'D': 2018, 'C': 2019,
    'B': 2020, 'A': 2021, '1': 2022, '2': 2023, '3': 2024,
    '4': 2025, '5': 2026, '6': 2027, '7': 2028, '8': 2029,
    '9': 2030
  };

  if (yearMap[yearCode]) {
    extracted.year = yearMap[yearCode];
  }

  // Extract check digit (position 9)
  const checkDigit = vin[8];

  // WMI identifies manufacturer
  const wmi = vin.substring(0, 3);
  if (wmi === 'WOP') {
    extracted.market = 'Opel Germany';
  } else if (wmi.startsWith('WO')) {
    extracted.market = 'Opel/Vauxhall';
  }

  // VDS (positions 4-6) may contain model info
  // This is manufacturer-specific encoding
  const vds = vin.substring(3, 9);
  console.log(`[VIN-DECODER] VDS: ${vds}, Year Code: ${yearCode}, Year: ${extracted.year}`);

  return extracted;
}

/**
 * Batch decode multiple VINs
 */
async function decodeVINBatch(vins) {
  console.log(`[VIN-DECODER] Batch decoding ${vins.length} VINs...`);

  const results = [];
  
  for (const vin of vins) {
    try {
      const result = await decodeVIN(vin);
      results.push({ success: true, data: result });
      
      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ 
        success: false, 
        vin: vin,
        error: error.message 
      });
    }
  }

  console.log(`[VIN-DECODER] ✅ Batch complete: ${results.filter(r => r.success).length}/${vins.length} successful`);
  return results;
}

module.exports = {
  decodeVIN,
  decodeVINBatch,
  BASE_URL
};
