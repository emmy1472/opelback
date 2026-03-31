/**
 * Centralized configuration for the application
 */

module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  MONGO_URI: process.env.MONGO_URI,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'opelcore-secret-key-change-in-production',
  JWT_EXPIRES_IN: '7d',

  // Scraper
  BASE_URL: 'https://opel.7zap.com',
  USER_AGENT: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  CURL_COMMAND: process.platform === 'win32' ? 'curl.exe' : 'curl',
  
  // Timeouts (in milliseconds)
  FETCH_TIMEOUT: 60000,
  CONNECT_TIMEOUT: 15000,
  IMAGE_FETCH_TIMEOUT: 30000,
  
  // Retry
  MAX_RETRIES: 2,
  RETRY_DELAY: 2000,

  // API
  MAX_HISTORY_RECORDS: 50,
  CACHE_LIMIT: 20,
  IMAGE_CACHE_MAX_AGE: 604800, // 7 days

  // Validation
  MIN_PASSWORD_LENGTH: 6,
  VIN_LENGTH: 17
};
