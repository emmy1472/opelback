/**
 * CSV to JSON Converter
 * 
 * Converts CSV data files to JSON format for storage/distribution
 * Usage:
 *   node csv-to-json.js --file input.csv --output output.json
 */

const fs = require('fs');
const path = require('path');

// Parse CSV
function parseCSV(csvData) {
  const lines = csvData.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(',').map(v => v.trim());
    const record = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || null;
      
      // Auto-convert numeric values
      if (value && !isNaN(value) && value !== '') {
        record[header] = parseFloat(value);
      } else {
        record[header] = value;
      }
    });
    
    records.push(record);
  }

  return records;
}

async function convertCSVToJSON(inputFile, outputFile) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║ CSV to JSON Converter                                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // Check input file exists
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      process.exit(1);
    }

    // Read CSV
    console.log(`[CONVERTER] Reading: ${inputFile}`);
    const csvData = fs.readFileSync(inputFile, 'utf-8');
    
    // Parse CSV
    console.log('[CONVERTER] Parsing CSV...');
    const records = parseCSV(csvData);
    
    if (records.length === 0) {
      console.error('[CONVERTER] ❌ No records found in CSV');
      process.exit(1);
    }

    console.log(`[CONVERTER] ✅ Parsed ${records.length} records\n`);

    // Create JSON structure
    const jsonData = {
      metadata: {
        version: '1.0',
        createdAt: new Date().toISOString(),
        source: inputFile,
        recordCount: records.length,
        description: 'OEM Parts Data - Opel Automotive Catalog'
      },
      parts: records
    };

    // Save JSON
    console.log(`[CONVERTER] Writing: ${outputFile}`);
    const jsonString = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync(outputFile, jsonString, 'utf-8');
    
    const fileSize = fs.statSync(outputFile).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║ CONVERSION COMPLETE                                    ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log(`✅ Input file:     ${inputFile}`);
    console.log(`✅ Output file:    ${outputFile}`);
    console.log(`✅ Records:        ${records.length}`);
    console.log(`✅ File size:      ${fileSizeKB} KB`);
    console.log(`✅ Timestamp:      ${jsonData.metadata.createdAt}\n`);

    // Show sample
    console.log('📋 Sample record (first part):');
    console.log(JSON.stringify(records[0], null, 2));
    console.log('\n');

  } catch (error) {
    console.error('[CONVERTER] ❌ Error:', error.message);
    process.exit(1);
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  let inputFile = 'sample-data.csv';
  let outputFile = 'parts-data.json';

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' || args[i] === '--input') {
      inputFile = args[i + 1];
      i++;
    } else if (args[i] === '--output') {
      outputFile = args[i + 1];
      i++;
    }
  }

  console.log('\n📋 CSV to JSON Data Converter');
  console.log('─'.repeat(50));
  
  await convertCSVToJSON(inputFile, outputFile);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { parseCSV, convertCSVToJSON };
