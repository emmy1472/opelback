/**
 * Curl utility for HTTP requests via command line
 */
const { execSync } = require('child_process');
const config = require('../config');

async function buildCurlCommand(url, method = 'GET', postData = null) {
  let command;
  
  if (method === 'POST' && postData) {
    const dataStr = Object.entries(postData)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');
    command = `${config.CURL_COMMAND} -A "${config.USER_AGENT}" -H "Accept: text/html" -H "Referer: ${config.BASE_URL}/" -L -X POST -d "${dataStr}" "${url}" --max-time ${config.FETCH_TIMEOUT / 1000} --connect-timeout ${config.CONNECT_TIMEOUT / 1000} --retry ${config.MAX_RETRIES}`;
  } else {
    command = `${config.CURL_COMMAND} -A "${config.USER_AGENT}" -H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" -H "Accept-Language: en-US,en;q=0.9" -H "Referer: ${config.BASE_URL}/" -H "Accept-Encoding: gzip, deflate, br" -L "${url}" --max-time ${config.FETCH_TIMEOUT / 1000} --connect-timeout ${config.CONNECT_TIMEOUT / 1000} --retry ${config.MAX_RETRIES} --compressed`;
  }
  
  return command;
}

async function fetchWithCurl(url, method = 'GET', postData = null, retryCount = 0) {
  try {
    const command = await buildCurlCommand(url, method, postData);
    console.log(`[CURL] Fetching: ${url.substring(0, 80)}...`);
    
    const stdout = execSync(command, {
      encoding: 'utf-8',
      maxBuffer: 1024 * 1024 * 10,
      timeout: config.FETCH_TIMEOUT + 5000
    });
    
    console.log(`[CURL] ✅ ${url.substring(0, 50)}... (${stdout.length} bytes)`);
    return stdout;
  } catch (error) {
    const msg = error.message || '';
    console.error(`[CURL] ❌ ${url}: ${msg.substring(0, 200)}`);
    
    // Retry for network timeouts
    if (retryCount < config.MAX_RETRIES && (msg.includes('timed out') || msg.includes('ETIMEDOUT'))) {
      console.log(`[CURL] Retrying... (${retryCount + 1}/${config.MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, config.RETRY_DELAY));
      return fetchWithCurl(url, method, postData, retryCount + 1);
    }
    
    if (msg.includes('Could not resolve host') || msg.includes('Connection refused')) {
      const networkErr = new Error(`Network error: Cannot reach ${url}`);
      networkErr.isNetworkError = true;
      throw networkErr;
    }
    throw error;
  }
}

async function fetchImageWithCurl(url) {
  try {
    const command = `${config.CURL_COMMAND} -A "${config.USER_AGENT}" -L "${url}" --max-time ${config.IMAGE_FETCH_TIMEOUT / 1000} --compressed -H "Accept: image/*" -H "Referer: ${config.BASE_URL}/" --cookie-jar /tmp/cookies.txt --cookie "" --retry 2`;
    
    const imageBuffer = execSync(command, {
      encoding: 'buffer',
      maxBuffer: 1024 * 1024 * 50,
      timeout: config.IMAGE_FETCH_TIMEOUT + 5000
    });
    
    return imageBuffer;
  } catch (error) {
    console.error(`[IMAGE CURL] Error: ${error.message}`);
    throw error;
  }
}

module.exports = { fetchWithCurl, fetchImageWithCurl, buildCurlCommand };
