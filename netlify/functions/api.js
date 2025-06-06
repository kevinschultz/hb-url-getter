exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      },
      body: ''
    };
  }

  const API_KEY = process.env.HOMEBASE_API_KEY;
  const API_URL = 'https://homebase.english3.com/api/public';
  
  if (!API_KEY) {
    console.error('HOMEBASE_API_KEY environment variable is not set');
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  try {
    // Build the full URL
    const path = event.path.replace('/.netlify/functions/api', '');
    const queryString = event.rawQuery ? `?${event.rawQuery}` : '';
    const url = `${API_URL}${path}${queryString}`;
    
    console.log(`Proxying ${event.httpMethod} request to: ${url}`);
    
    // Build fetch options
    const fetchOptions = {
      method: event.httpMethod,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    // Only add body for methods that support it
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body) {
      fetchOptions.body = event.body;
    }
    
    // Make the request
    const response = await fetch(url, fetchOptions);
    
    // Get content type and length
    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    
    console.log(`Response status: ${response.status}, Content-Type: ${contentType}, Content-Length: ${contentLength}`);
    
    // Handle empty responses
    if (!contentLength || contentLength === '0' || response.status === 204) {
      return {
        statusCode: response.status || 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ success: true })
      };
    }
    
    // Get the response body
    const responseBody = await response.text();
    console.log('Response body:', responseBody);
    
    // If the response is JSON, parse and re-stringify to ensure it's valid
    let finalBody = responseBody;
    if (contentType && contentType.includes('application/json')) {
      try {
        const jsonData = JSON.parse(responseBody);
        finalBody = JSON.stringify(jsonData);
      } catch (e) {
        console.log('Response is not valid JSON, returning as-is');
      }
    }
    
    // Return the response
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': contentType || 'application/json'
      },
      body: finalBody
    };
  } catch (error) {
    console.error('Error in API proxy:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      })
    };
  }
};