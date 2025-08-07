import React, { useState } from 'react';
import Head from 'next/head';
import TransactionVisualizer from '../components/TransactionVisualizer';
import TransactionDetails from '../components/TransactionDetails';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState('');
  const [transactionData, setTransactionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rateLimit, setRateLimit] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    setLoading(true);
    setError('');
    setTransactionData(null);
    setRateLimit(null);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: walletAddress.trim() }),
      });

      const data = await response.json();

      // Handle rate limiting
      if (response.status === 429) {
        setError(`Rate limit exceeded. Please try again in ${data.retryAfter || 60} seconds.`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch transaction data');
      }

      setTransactionData(data);
      
      // Store rate limit info if available
      if (data.requestInfo?.rateLimit) {
        setRateLimit(data.requestInfo.rateLimit);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setWalletAddress(e.target.value);
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  return (
    <>
      <Head>
        <title>Solana Transaction Visualizer</title>
        <meta name="description" content="Visualize Solana blockchain transactions and analyze wallet connections with interactive network graphs" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="Solana, blockchain, transaction, visualizer, NFT, SPL token, wallet analysis" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Solana Transaction Visualizer" />
        <meta property="og:description" content="Interactive tool to visualize Solana blockchain transactions" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://blockcrawl.vercel.app" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Solana Transaction Visualizer" />
        <meta name="twitter:description" content="Interactive tool to visualize Solana blockchain transactions" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>🔍 Solana Transaction Visualizer</h1>
          <p>Explore blockchain connections and analyze wallet transactions</p>
        </header>

        <main className="main">
          <form onSubmit={handleSubmit} className="search-form">
            <div className="input-group">
              <input
                type="text"
                value={walletAddress}
                onChange={handleInputChange}
                placeholder="Enter Solana wallet address..."
                className="wallet-input"
                disabled={loading}
                aria-label="Solana wallet address"
              />
              <button 
                type="submit" 
                className="search-button"
                disabled={loading || !walletAddress.trim()}
                aria-label="Search transactions"
              >
                {loading ? 'Analyzing...' : '🔍 Analyze'}
              </button>
            </div>
          </form>

          {error && (
            <div className="error-message" role="alert">
              <span>⚠️ {error}</span>
            </div>
          )}

          {loading && <LoadingSpinner />}

          {transactionData && (
            <div className="results-container">
              <TransactionVisualizer 
                data={transactionData} 
                inputAddress={walletAddress}
              />
              <TransactionDetails 
                data={transactionData} 
                inputAddress={walletAddress}
              />
            </div>
          )}

          {rateLimit && (
            <div className="rate-limit-info">
              <small>
                Rate limit: {rateLimit.remaining}/{rateLimit.limit} requests remaining
              </small>
            </div>
          )}
        </main>

        <footer className="footer">
          <p>
            Powered by <a href="https://helius.xyz" target="_blank" rel="noopener noreferrer">Helius</a> • 
            Built with <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a> • 
            Visualized with <a href="https://cytoscape.org" target="_blank" rel="noopener noreferrer">Cytoscape.js</a>
          </p>
        </footer>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .header {
          text-align: center;
          padding: 2rem 1rem;
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2.5rem;
          font-weight: 700;
          background: linear-gradient(45deg, #fff, #f0f0f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header p {
          margin: 0;
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .main {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem 1rem;
        }

        .search-form {
          margin-bottom: 2rem;
        }

        .input-group {
          display: flex;
          gap: 0.5rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .wallet-input {
          flex: 1;
          padding: 1rem 1.5rem;
          border: none;
          border-radius: 50px;
          font-size: 1rem;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .wallet-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .wallet-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        .search-button {
          padding: 1rem 2rem;
          border: none;
          border-radius: 50px;
          background: linear-gradient(45deg, #ff6b6b, #ee5a24);
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .search-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .search-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.5);
          border-radius: 10px;
          padding: 1rem;
          margin: 1rem 0;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .results-container {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 2rem;
          margin-top: 2rem;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .rate-limit-info {
          text-align: center;
          margin-top: 1rem;
          opacity: 0.7;
        }

        .footer {
          text-align: center;
          padding: 2rem 1rem;
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(10px);
        }

        .footer a {
          color: #ffd700;
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .footer a:hover {
          color: #fff;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }
          
          .input-group {
            flex-direction: column;
          }
          
          .search-button {
            width: 100%;
          }
        }
      `}</style>
    </>
  );
} 