/**
 * ENHANCED VIN DECODER
 * Works with local comprehensive vehicle database
 * Decodes Opel VINs to extract model, year, engine, transmission
 * Then links to our parts catalog and specifications
 */

const axios = require('axios');
require('dotenv').config();

// VIN Year Code Mapping
const YEAR_CODES = {
  'Y': 2000, 'X': 2001, 'W': 2002, 'V': 2003, 'U': 2004,
  'T': 2005, 'S': 2006, 'R': 2007, 'P': 2008, 'N': 2009,
  'M': 2010, 'L': 2011, 'K': 2012, 'J': 2013, 'H': 2014,
  'G': 2015, 'F': 2016, 'E': 2017, 'D': 2018, 'C': 2019,
  'B': 2020, 'A': 2021, '1': 2022, '2': 2023, '3': 2024,
  '4': 2025, '5': 2026, '6': 2027, '7': 2028, '8': 2029,
  '9': 2030
};

// Opel Model Database (based on our comprehensive data)
const OPEL_MODELS = {
  'Corsa': { models: ['Corsa'], years: [2000, 2003, 2006, 2010, 2014, 2018, 2024], code: '010' },
  'Astra': { models: ['Astra'], years: [1991, 1998, 2004, 2009, 2015, 2021], code: '020' },
  'Mokka': { models: ['Mokka'], years: [2012, 2016, 2021], code: '030' },
  'Grandland': { models: ['Grandland'], years: [2017, 2021], code: '040' },
  'Insignia': { models: ['Insignia'], years: [2008, 2013, 2017], code: '050' },
  'Vectra': { models: ['Vectra'], years: [1988, 1995, 2002, 2008], code: '060' },
  'Omega': { models: ['Omega'], years: [1986, 1994, 2003], code: '070' },
  'Meriva': { models: ['Meriva'], years: [2003, 2010, 2017], code: '080' },
  'Zafira': { models: ['Zafira'], years: [1999, 2005, 2011, 2019], code: '090' }
};

// Engine displacements and types
const ENGINE_MAPPING = {
  'A': '1.0L', 'B': '1.2L', 'C': '1.4L', 'D': '1.6L',
  'E': '1.8L', 'F': '2.0L', 'G': '2.2L', 'H': '2.4L',
  'I': '3.0L', 'J': '1.0T', 'K': '1.4T', 'L': '1.6D',
  'M': '1.3D', 'N': '1.9D', 'P': '2.0D'
};

// Transmission codes
const TRANSMISSION_MAPPING = {
  '1': 'Manual', '2': 'Automatic', '3': 'CVT',
  '4': 'Manual 6-sp', '5': 'Auto 6-sp', '6': 'Auto 8-sp'
};

// Body style codes
const BODY_STYLE_MAPPING = {
  'SA': 'Sedan', 'HA': 'Hatchback', 'SU': 'SUV',
  'CV': 'Convertible', 'WA': 'Wagon', 'MV': 'Minivan',
  'CP': 'Coupe', 'VN': 'Van'
};

/**
 * Decode a 17-character VIN
 * VIN Structure: WMI(3) + VDS(6) + VIS(8)
 */
function decodeVINStructure(vin) {
  if (!vin || vin.length !== 17) {
    throw new Error('VIN must be exactly 17 characters');
  }

  vin = vin.toUpperCase();
  const decoded = {
    vin: vin,
    source: 'vin_structure',
    decodedAt: new Date(),
    wmi: vin.substring(0, 3),
    vds: vin.substring(3, 9),
    vis: vin.substring(9, 17),
    model: null,
    year: null,
    engine: null,
    transmission: null,
    body_style: null,
    plant: null,
    sequential: vin.substring(11, 17),
    confidence: 0
  };

  // Extract year from position 10 (index 9)
  const yearCode = vin[9];
  if (YEAR_CODES[yearCode]) {
    decoded.year = YEAR_CODES[yearCode];
    decoded.confidence += 30;  // High confidence for year
  }

  // Extract engine from position 5 (index 4)
  const engineCode = vin[4];
  if (ENGINE_MAPPING[engineCode]) {
    decoded.engine = ENGINE_MAPPING[engineCode];
    decoded.confidence += 20;
  }

  // Extract transmission from position 8 (index 7)
  const transCode = vin[7];
  if (TRANSMISSION_MAPPING[transCode]) {
    decoded.transmission = TRANSMISSION_MAPPING[transCode];
    decoded.confidence += 15;
  }

  // Extract body style from positions 3-4 (index 2-3)
  const bodyCode = vin.substring(2, 4);
  if (BODY_STYLE_MAPPING[bodyCode]) {
    decoded.body_style = BODY_STYLE_MAPPING[bodyCode];
    decoded.confidence += 15;
  }

  // Plant code at position 9 (index 8)
  decoded.plant = vin[8];

  // Intelligent model prediction based on VIN patterns
  // WMI detection: Opel VINs typically start with W0L, WOL, or WPO
  const wmi = vin.substring(0, 3);
  if (wmi === 'W0L' || wmi === 'WOL' || wmi === 'WPO' || wmi === 'ZAR') {
    // Model code in positions 3-5 (index 2-4)
    const modelCode = vin.substring(2, 5);
    
    // Try to match known Opel model codes
    for (const [modelName, modelInfo] of Object.entries(OPEL_MODELS)) {
      if (modelInfo.code === modelCode) {
        decoded.model = modelName;
        decoded.confidence += 35;
        break;
      }
    }

    // If no exact match, try heuristic matching
    if (!decoded.model && decoded.year) {
      // Find best matching model based on year
      for (const [modelName, modelInfo] of Object.entries(OPEL_MODELS)) {
        const closestYear = modelInfo.years.reduce((prev, curr) =>
          Math.abs(curr - decoded.year) < Math.abs(prev - decoded.year) ? curr : prev
        );
        if (Math.abs(closestYear - decoded.year) <= 2) {
          decoded.model = modelName;
          decoded.confidence += 20;
          break;
        }
      }
    }
  }

  return decoded;
}

/**
 * Try to fetch VIN decode from external API (fallback)
 * This tries multiple sources if available
 */
async function tryExternalDecode(vin) {
  try {
    // Try online VIN decoder API if available
    const apis = [
      { url: `https://api.decodevin.com/api/v1/vin/${vin}?auth=`, key: null },
      // Add more APIs as needed
    ];

    for (const api of apis) {
      try {
        const response = await axios.get(api.url, {
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (response.data && response.data.model) {
          return {
            model: response.data.model,
            year: response.data.year,
            source: 'external_api'
          };
        }
      } catch (e) {
        // Try next API
        continue;
      }
    }
  } catch (error) {
    // External APIs failed, will use VIN structure only
  }

  return null;
}

/**
 * Main decode function - combines structure + database lookup
 */
async function decodeVIN(vin, models) {
  try {
    console.log(`[VIN-DECODER] Decoding: ${vin}`);
    
    // Step 1: Parse VIN structure
    const structureDecode = decodeVINStructure(vin);
    console.log(`[VIN-DECODER] Structure decode: ${structureDecode.model || 'Unknown'} (${structureDecode.year})`);

    // Step 2: Try external source (fallback)
    let externalData = null;
    try {
      externalData = await tryExternalDecode(vin);
      if (externalData) {
        console.log(`[VIN-DECODER] External source found additional data`);
      }
    } catch (e) {
      // External decode failed, continue with structure only
    }

    // Step 3: Merge results
    const result = {
      ...structureDecode,
      ...(externalData && { externalSource: externalData }),
      confidence: structureDecode.confidence
    };

    // Step 4: Find related parts if database provided
    if (models && result.model) {
      try {
        const matchedModel = models.find(m => 
          m.name.toLowerCase() === result.model.toLowerCase()
        );
        
        if (matchedModel) {
          result.modelId = matchedModel.modelId;
          result.modelDetails = {
            name: matchedModel.name,
            type: matchedModel.type,
            yearsSupported: matchedModel.yearsSupported,
            url: matchedModel.url
          };
          result.confidence = Math.min(100, result.confidence + 10);
        }
      } catch (e) {
        // Model details lookup failed (not critical)
      }
    }

    console.log(`[VIN-DECODER] ✅ Decode complete (confidence: ${result.confidence}%)`);
    return result;

  } catch (error) {
    console.error(`[VIN-DECODER] ❌ Error: ${error.message}`);
    throw error;
  }
}

module.exports = {
  decodeVIN,
  decodeVINStructure,
  YEAR_CODES,
  ENGINE_MAPPING,
  TRANSMISSION_MAPPING,
  BODY_STYLE_MAPPING,
  OPEL_MODELS
};
