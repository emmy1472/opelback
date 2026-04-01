/**
 * JSON Parts Data Loader & Query Tool
 * 
 * Load and query OEM parts data from JSON files
 * Usage:
 *   const partsData = require('./json-data-loader');
 *   const corsa = partsData.getPartsByModel('corsa');
 *   const engine = partsData.getPartsByCategory('Engine');
 */

const fs = require('fs');
const path = require('path');

class PartsDataLoader {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = null;
    this.load();
  }

  load() {
    try {
      const jsonStr = fs.readFileSync(this.filePath, 'utf-8');
      this.data = JSON.parse(jsonStr);
      console.log(`✅ Loaded ${this.data.parts.length} parts from ${path.basename(this.filePath)}`);
    } catch (error) {
      console.error(`❌ Failed to load JSON: ${error.message}`);
      this.data = null;
    }
  }

  /**
   * Get all parts
   */
  getAll() {
    return this.data?.parts || [];
  }

  /**
   * Get parts by model (corsa, astra, mokka)
   */
  getPartsByModel(model) {
    return this.getAll().filter(p => 
      p.model?.toLowerCase() === model.toLowerCase()
    );
  }

  /**
   * Get parts by category (Engine, Brakes, etc.)
   */
  getPartsByCategory(category) {
    return this.getAll().filter(p => 
      p.category?.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Get parts by model AND category
   */
  getPartsByModelAndCategory(model, category) {
    return this.getAll().filter(p => 
      p.model?.toLowerCase() === model.toLowerCase() &&
      p.category?.toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Search parts by name or part number
   */
  search(query) {
    const q = query.toLowerCase();
    return this.getAll().filter(p => 
      p.name?.toLowerCase().includes(q) ||
      p.partNumber?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    );
  }

  /**
   * Get part by part number
   */
  getByPartNumber(partNumber) {
    return this.getAll().find(p => 
      p.partNumber.toUpperCase() === partNumber.toUpperCase()
    );
  }

  /**
   * Get unique models
   */
  getModels() {
    const models = new Set(this.getAll().map(p => p.model));
    return Array.from(models).sort();
  }

  /**
   * Get unique categories
   */
  getCategories() {
    const categories = new Set(this.getAll().map(p => p.category));
    return Array.from(categories).sort();
  }

  /**
   * Get statistics
   */
  getStats() {
    const parts = this.getAll();
    const byModel = {};
    const byCategory = {};

    parts.forEach(p => {
      byModel[p.model] = (byModel[p.model] || 0) + 1;
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    });

    return {
      totalParts: parts.length,
      totalModels: this.getModels().length,
      totalCategories: this.getCategories().length,
      byModel,
      byCategory,
      priceRange: {
        min: Math.min(...parts.map(p => p.price || 0)),
        max: Math.max(...parts.map(p => p.price || 0)),
        avg: (parts.reduce((sum, p) => sum + (p.price || 0), 0) / parts.length).toFixed(2)
      }
    };
  }

  /**
   * Export filtered results to JSON
   */
  exportToJSON(parts, filename) {
    const output = {
      metadata: {
        ...this.data.metadata,
        exportedAt: new Date().toISOString(),
        recordCount: parts.length
      },
      parts: parts
    };

    fs.writeFileSync(filename, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`✅ Exported ${parts.length} parts to ${filename}`);
  }

  /**
   * Export to CSV
   */
  exportToCSV(parts, filename) {
    if (parts.length === 0) {
      console.error('No parts to export');
      return;
    }

    const headers = Object.keys(parts[0]);
    const csvLines = [headers.join(',')];

    parts.forEach(p => {
      const values = headers.map(h => {
        const val = p[h];
        // Escape commas and quotes in values
        if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val || '';
      });
      csvLines.push(values.join(','));
    });

    fs.writeFileSync(filename, csvLines.join('\n'), 'utf-8');
    console.log(`✅ Exported ${parts.length} parts to ${filename}`);
  }
}

/**
 * CLI Usage
 */
function runCLI() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node json-data-loader.js <command> [options]

Commands:
  all                      - Show all parts
  stats                    - Show statistics
  models                   - List all models
  categories               - List all categories
  byModel <model>          - Get parts by model (corsa, astra, mokka)
  byCategory <category>    - Get parts by category
  search <query>           - Search parts by name/number
  export-json <output>     - Export all to JSON file
  export-csv <output>      - Export all to CSV file

Examples:
  node json-data-loader.js stats
  node json-data-loader.js byModel corsa
  node json-data-loader.js search "cylinder"
  node json-data-loader.js export-json output.json
    `);
    return;
  }

  const loader = new PartsDataLoader('parts-data.json');
  const command = args[0].toLowerCase();

  switch (command) {
    case 'all':
      console.log('\n📋 All Parts:');
      console.table(loader.getAll());
      break;

    case 'stats':
      console.log('\n📊 Statistics:');
      console.table(loader.getStats());
      break;

    case 'models':
      console.log('\n🚗 Models:');
      console.table(loader.getModels());
      break;

    case 'categories':
      console.log('\n🏷️ Categories:');
      console.table(loader.getCategories());
      break;

    case 'bymodel':
      if (!args[1]) {
        console.error('❌ Model name required');
        break;
      }
      console.log(`\n🔍 Parts for model: ${args[1]}`);
      console.table(loader.getPartsByModel(args[1]));
      break;

    case 'bycategory':
      if (!args[1]) {
        console.error('❌ Category name required');
        break;
      }
      console.log(`\n🔍 Parts in category: ${args[1]}`);
      console.table(loader.getPartsByCategory(args[1]));
      break;

    case 'search':
      if (!args[1]) {
        console.error('❌ Search query required');
        break;
      }
      console.log(`\n🔍 Search results for: "${args[1]}"`);
      console.table(loader.search(args[1]));
      break;

    case 'export-json':
      if (!args[1]) {
        console.error('❌ Output filename required');
        break;
      }
      loader.exportToJSON(loader.getAll(), args[1]);
      break;

    case 'export-csv':
      if (!args[1]) {
        console.error('❌ Output filename required');
        break;
      }
      loader.exportToCSV(loader.getAll(), args[1]);
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
  }
}

// Run CLI if called directly
if (require.main === module) {
  runCLI();
}

module.exports = PartsDataLoader;
