import axios from 'axios';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const testAddress = '3ZfrkG3LZsdPfmUYeFYMPB4RXU2LpSyUnGpZ8WJ8D7uY';
    
    console.log('Testing Helius API with address:', testAddress);
    
    const response = await axios.get(`https://api.helius.xyz/v0/addresses/${testAddress}/transactions`, {
      params: {
        'api-key': process.env.HELIUS_API_KEY,
        limit: 10,
      },
      timeout: 30000,
    });

    console.log('Helius API Response:', {
      status: response.status,
      dataLength: response.data?.length || 0,
      sampleTransaction: response.data?.[0] ? {
        signature: response.data[0].signature,
        timestamp: response.data[0].timestamp,
        keys: Object.keys(response.data[0]),
        hasTokenTransfers: !!response.data[0].tokenTransfers,
        hasNativeTransfers: !!response.data[0].nativeTransfers,
        tokenTransfersLength: response.data[0].tokenTransfers?.length || 0,
        nativeTransfersLength: response.data[0].nativeTransfers?.length || 0
      } : null
    });

    return res.status(200).json({
      success: true,
      status: response.status,
      dataLength: response.data?.length || 0,
      sampleTransaction: response.data?.[0] ? {
        signature: response.data[0].signature,
        timestamp: response.data[0].timestamp,
        keys: Object.keys(response.data[0]),
        hasTokenTransfers: !!response.data[0].tokenTransfers,
        hasNativeTransfers: !!response.data[0].nativeTransfers,
        tokenTransfersLength: response.data[0].tokenTransfers?.length || 0,
        nativeTransfersLength: response.data[0].nativeTransfers?.length || 0
      } : null,
      firstTransaction: response.data?.[0] || null
    });

  } catch (error) {
    console.error('Helius API Test Error:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    return res.status(500).json({
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}
