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
    
    // Get the response body
    const responseBody = await response.text();
    
    // Return the response
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': response.headers.get('content-type') || 'application/json'
      },
      body: responseBody
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