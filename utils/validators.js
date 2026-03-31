/**
 * Input validation utilities
 */
const config = require('../config');

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePassword(password) {
  return password && password.length >= config.MIN_PASSWORD_LENGTH;
}

function validateUsername(username) {
  return username && username.length >= 3 && username.length <= 50;
}

function validateVin(vin) {
  return vin && vin.length === config.VIN_LENGTH && /^[A-HJ-NPR-Z0-9]+$/.test(vin);
}

function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateQueryUrl(url) {
  return url && url.startsWith('http') && url.includes('7zap.com');
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validateVin,
  validateUrl,
  validateQueryUrl
};
