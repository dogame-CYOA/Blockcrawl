import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.HELIUS_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ error: 'HELIUS_API_KEY not configured' });
  }

  try {
    console.log('Testing Helius API key:', apiKey.substring(0, 10) + '...');
    
    // Test with a simple endpoint
    const response = await axios.get('https://api.helius.xyz/v0/addresses/11111111111111111111111111111112/transactions', {
      params: {
        'api-key': apiKey,
        limit: 1,
      },
      timeout: 10000,
    });

    return res.status(200).json({
      success: true,
      status: response.status,
      dataLength: response.data?.length || 0,
      message: 'Helius API key is working correctly'
    });

  } catch (error) {
    console.error('Helius API test error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      message: 'Helius API key test failed'
    });
  }
}
