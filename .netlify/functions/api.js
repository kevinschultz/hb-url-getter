exports.handler = async (event, context) => {
  const API_KEY = process.env.HOMEBASE_API_KEY;
  const API_URL = 'https://homebase.english3.com/api/public';
  
  // Forward the request to the actual API
  const response = await fetch(API_URL + event.path.replace('/.netlify/functions/api', '') + '?' + event.rawQuery, {
    method: event.httpMethod,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: event.body
  });
  
  const data = await response.json();
  
  return {
    statusCode: response.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    },
    body: JSON.stringify(data)
  };
};