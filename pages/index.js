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
        <link rel="icon" href="/favicon.ico" />
        
        {/* Open Graph tags */}
        <meta property="og:title" content="Solana Transaction Visualizer" />
        <meta property="og:description" content="Interactive tool to visualize Solana blockchain transactions" />
        <meta property="og:type" content="website" />
        
        {/* Security headers */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      </Head>

      <div className="container">
        <header className="header">
          <h1>Solana Transaction Visualizer</h1>
          <p>Enter a Solana wallet address to visualize its transaction network</p>
          {rateLimit && (
            <div className="rate-limit-info">
              Requests remaining: {rateLimit.remaining} | Resets: {new Date(rateLimit.reset).toLocaleTimeString()}
            </div>
          )}
        </header>

        <main className="main">
          <form onSubmit={handleSubmit} className="form">
            <div className="input-group">
              <input
                type="text"
                value={walletAddress}
                onChange={handleInputChange}
                placeholder="Enter Solana wallet address (e.g., 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU)"
                className={`input ${error ? 'error' : ''}`}
                disabled={loading}
                maxLength={44}
                autoComplete="off"
                spellCheck="false"
              />
              <button 
                type="submit" 
                disabled={loading || !walletAddress.trim()}
                className="submit-button"
                aria-label="Analyze wallet transactions"
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Analyzing...
                  </>
                ) : (
                  'Visualize Transactions'
                )}
              </button>
            </div>
            
            {walletAddress.trim() && (
              <div className="input-help">
                <small>
                  Analyzing: <code>{walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}</code>
                </small>
              </div>
            )}
          </form>

          {error && (
            <div className="error" role="alert">
              <div className="error-icon">⚠️</div>
              <div>
                <strong>Error:</strong> {error}
              </div>
            </div>
          )}

          {loading && <LoadingSpinner />}

          {transactionData && !loading && (
            <>
              <div className="visualization">
                <TransactionVisualizer 
                  data={transactionData} 
                  inputAddress={walletAddress.trim()} 
                />
              </div>
              
              <TransactionDetails 
                data={transactionData} 
                inputAddress={walletAddress.trim()} 
              />
            </>
          )}

          {transactionData && !loading && transactionData.nodes.length === 1 && (
            <div className="info-message">
              <div className="info-icon">ℹ️</div>
              <div>
                <strong>Limited Data:</strong> This wallet has minimal transaction history. 
                Try a more active wallet address for a richer visualization.
              </div>
            </div>
          )}
        </main>

        <footer className="footer">
          <p>
            Powered by <a href="https://helius.dev" target="_blank" rel="noopener noreferrer">Helius API</a> • 
            Built with <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">Next.js</a> and 
            <a href="https://cytoscape.org" target="_blank" rel="noopener noreferrer">Cytoscape.js</a>
          </p>
          <p className="disclaimer">
            This tool is for educational and analytical purposes only. 
            Transaction data is fetched from public blockchain records.
          </p>
        </footer>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .header {
          text-align: center;
          padding: 40px 20px;
          color: white;
        }

        .header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin: 0 0 16px 0;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
          font-size: 1.2rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto 16px auto;
        }

        .rate-limit-info {
          font-size: 0.9rem;
          opacity: 0.8;
          background: rgba(255,255,255,0.1);
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
          margin-top: 8px;
        }

        .main {
          flex: 1;
          padding: 0 20px 40px 20px;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .form {
          background: white;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }

        .input-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .input {
          flex: 1;
          min-width: 300px;
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: all 0.2s;
          font-family: 'Courier New', monospace;
        }

        .input:focus {
          outline: none;
          border-color: #9333ea;
          box-shadow: 0 0 0 3px rgba(147, 51, 234, 0.1);
        }

        .input.error {
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .input:disabled {
          background-color: #f9fafb;
          color: #6b7280;
          cursor: not-allowed;
        }

        .input-help {
          width: 100%;
          margin-top: 8px;
          color: #6b7280;
          font-size: 14px;
        }

        .input-help code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }

        .submit-button {
          padding: 16px 32px;
          background: linear-gradient(135deg, #9333ea, #7c3aed);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(147, 51, 234, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spinner-small {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .error-icon {
          flex-shrink: 0;
          font-size: 1.2rem;
        }

        .info-message {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
          padding: 16px;
          border-radius: 8px;
          margin-top: 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .info-icon {
          flex-shrink: 0;
          font-size: 1.2rem;
        }

        .visualization {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }

        .footer {
          text-align: center;
          padding: 30px 20px;
          color: rgba(255,255,255,0.8);
          font-size: 14px;
        }

        .footer p {
          margin: 8px 0;
        }

        .footer a {
          color: rgba(255,255,255,0.9);
          text-decoration: underline;
        }

        .footer a:hover {
          color: white;
        }

        .disclaimer {
          font-size: 12px;
          opacity: 0.7;
          margin-top: 16px;
        }

        @media (max-width: 768px) {
          .header h1 {
            font-size: 2rem;
          }
          
          .input-group {
            flex-direction: column;
          }
          
          .input {
            min-width: auto;
          }
          
          .form {
            padding: 20px;
          }

          .submit-button {
            padding: 14px 24px;
            font-size: 15px;
          }
        }
      `}</style>
    </>
  );
} 