/**
 * @param {number} [timeoutMs] - Abort after this many ms (default 10000). Use a large value for slow server work (e.g. questionnaire + AI).
 */
export default async function API(API_NAME = "", DATA = {}, METHOD = "POST", AUTH = true, token = null, timeoutMs = 10000) {
  let result = { statusCode: null, status: null, message: null, data: null };
  let BASE_URL = "https://autibile.my/api/";

  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");

  if (AUTH && token) {
    myHeaders.append("Authorization", `Bearer ${token}`);
  }

  let url = BASE_URL + API_NAME;

  if (METHOD === "GET" && DATA && Object.keys(DATA).length) {
    const params = new URLSearchParams();
    for (const key in DATA) {
      if (DATA.hasOwnProperty(key)) {
        params.append(key, DATA[key]);
      }
    }
    url += `?${params.toString()}`;
  }

  let requestOptions = {
    method: METHOD,
    headers: myHeaders,
    redirect: 'follow',
  };

  if (METHOD !== "GET") {
    requestOptions.body = JSON.stringify(DATA);
  }

  try {
    console.log("API URL:", url);
    console.log("API Method:", METHOD);
    
    // Add timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    result = await response.json();
  } catch (error) {
    console.log('API error:', error);
    
    if (error.name === 'AbortError') {
      result = { statusCode: 408, message: 'Request timeout - please check your connection' };
    } else if (error.message.includes('Network request failed')) {
      result = { statusCode: 0, message: 'Network error - please check your internet connection' };
    } else {
      result = { statusCode: 500, message: error.message || 'Internal API error' };
    }
  }

  return result;
}
