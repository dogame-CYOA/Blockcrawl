import React, { useState, useEffect } from 'react';
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
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [timeFilter, setTimeFilter] = useState('15m');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [trafficFilter, setTrafficFilter] = useState('both'); // 'incoming', 'outgoing', 'both'
  const [recordCount, setRecordCount] = useState(null); // Track number of records found
  const [expandedData, setExpandedData] = useState({}); // Store expanded node data

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save theme preference to localStorage
  useEffect(() => {
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const getTimeRange = () => {
    const now = new Date();
    
    switch (timeFilter) {
      case '15m':
        return {
          start: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
      case '1h':
        return {
          start: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
      case '24h':
        return {
          start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
      case '7d':
        return {
          start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
      case '30d':
        return {
          start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          return {
            start: new Date(customStartDate).toISOString(),
            end: new Date(customEndDate + 'T23:59:59').toISOString()
          };
        }
        return null;
      default:
        return {
          start: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
          end: now.toISOString()
        };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!walletAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    if (timeFilter === 'custom' && (!customStartDate || !customEndDate)) {
      setError('Please select both start and end dates for custom range');
      return;
    }

    const timeRange = getTimeRange();
    if (!timeRange) {
      setError('Invalid time range selected');
      return;
    }

    // Debug logging
    console.log('Submitting request with:', {
      address: walletAddress.trim(),
      timeRange: timeRange,
      timeFilter: timeFilter
    });

    setLoading(true);
    setError('');
    setTransactionData(null);
    setRateLimit(null);
    setRecordCount(null);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          address: walletAddress.trim(),
          timeRange: timeRange
        }),
      });

      const data = await response.json();

      // Debug logging
      console.log('API Response:', {
        status: response.status,
        ok: response.ok,
        dataLength: data?.edges?.length || 0,
        nodesLength: data?.nodes?.length || 0,
        data: data
      });

      // Handle rate limiting
      if (response.status === 429) {
        setError(`Rate limit exceeded. Please try again in ${data.retryAfter || 60} seconds.`);
        return;
      }

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to fetch transaction data');
      }

      setTransactionData(data);
      
      // Set record count
      if (data.edges) {
        setRecordCount(data.edges.length);
      }
      
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

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    setShowCustomDate(filter === 'custom');
    setError(''); // Clear any existing errors
    
    // Auto-apply filter if we have transaction data
    if (transactionData && walletAddress.trim()) {
      handleSubmit(new Event('submit'));
    }
  };

  const handleTrafficFilterChange = (filter) => {
    setTrafficFilter(filter);
    setError(''); // Clear any existing errors
    // Auto-apply filter if we have transaction data
    if (transactionData && walletAddress.trim()) {
      handleSubmit(new Event('submit'));
    }
  };

  const handleExpandNode = async (nodeId, nodeData) => {
    try {
      setLoading(true);
      
      console.log('Expanding node:', nodeId);
      
      const timeRange = getTimeRange();
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: nodeId,
          timeRange: timeRange
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expanded data');
      }

      const expandedNodeData = await response.json();
      
      // Merge the expanded data with existing data
      setExpandedData(prev => ({
        ...prev,
        [nodeId]: expandedNodeData
      }));

      // Update the main transaction data to include expanded nodes
      if (transactionData && expandedNodeData.nodes && expandedNodeData.edges) {
        const mergedData = {
          nodes: [...transactionData.nodes, ...expandedNodeData.nodes.filter(node => 
            !transactionData.nodes.find(existing => existing.id === node.id)
          )],
          edges: [...transactionData.edges, ...expandedNodeData.edges.filter(edge => 
            !transactionData.edges.find(existing => existing.id === edge.id)
          )],
          totalTransactions: transactionData.totalTransactions + expandedNodeData.totalTransactions,
          processedAt: new Date().toISOString(),
          entityInfo: { ...transactionData.entityInfo, ...expandedNodeData.entityInfo },
          tokenMetadata: { ...transactionData.tokenMetadata, ...expandedNodeData.tokenMetadata }
        };
        
        setTransactionData(mergedData);
      }

    } catch (error) {
      console.error('Error expanding node:', error);
      setError('Failed to expand node. Please try again.');
    } finally {
      setLoading(false);
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

      <div className={`container ${isDarkMode ? 'dark' : 'light'}`}>
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1>🔍 Solana Transaction Visualizer</h1>
              <p>Explore blockchain connections and analyze wallet transactions</p>
            </div>
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
          </div>
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
            
            <div className="time-filter-container">
              <div className="time-filter-label">
                Time Range: 
                <span className="active-filter-indicator">
                  {timeFilter === '15m' && '15 minutes'}
                  {timeFilter === '1h' && '1 hour'}
                  {timeFilter === '24h' && '24 hours'}
                  {timeFilter === '7d' && '7 days'}
                  {timeFilter === '30d' && '30 days'}
                  {timeFilter === 'custom' && 'Custom range'}
                </span>
              </div>
              <div className="time-filter-options">
                <button
                  type="button"
                  className={`time-filter-btn ${timeFilter === '15m' ? 'active' : ''}`}
                  onClick={() => handleTimeFilterChange('15m')}
                >
                  15 min
                </button>
                <button
                  type="button"
                  className={`time-filter-btn ${timeFilter === '1h' ? 'active' : ''}`}
                  onClick={() => handleTimeFilterChange('1h')}
                >
                  1 hour
                </button>
                <button
                  type="button"
                  className={`time-filter-btn ${timeFilter === '24h' ? 'active' : ''}`}
                  onClick={() => handleTimeFilterChange('24h')}
                >
                  24 hours
                </button>
                <button
                  type="button"
                  className={`time-filter-btn ${timeFilter === '7d' ? 'active' : ''}`}
                  onClick={() => handleTimeFilterChange('7d')}
                >
                  7 days
                </button>
                <button
                  type="button"
                  className={`time-filter-btn ${timeFilter === '30d' ? 'active' : ''}`}
                  onClick={() => handleTimeFilterChange('30d')}
                >
                  30 days
                </button>
                <button
                  type="button"
                  className={`time-filter-btn ${timeFilter === 'custom' ? 'active' : ''}`}
                  onClick={() => handleTimeFilterChange('custom')}
                >
                  Custom
                </button>
              </div>
              
              {showCustomDate && (
                <div className="custom-date-container">
                  <div className="date-input-group">
                    <label htmlFor="start-date">Start Date:</label>
                    <input
                      type="date"
                      id="start-date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="date-input"
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="date-input-group">
                    <label htmlFor="end-date">End Date:</label>
                    <input
                      type="date"
                      id="end-date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="date-input"
                      max={new Date().toISOString().split('T')[0]}
                      min={customStartDate}
                    />
                  </div>
                </div>
                             )}
             </div>
           </form>

          {transactionData && (
            <div className="traffic-filter-container">
              <div className="traffic-filter-label">
                Display Traffic: 
                <span className="active-filter-indicator">
                  {trafficFilter === 'both' && 'Both directions'}
                  {trafficFilter === 'incoming' && 'Incoming only'}
                  {trafficFilter === 'outgoing' && 'Outgoing only'}
                </span>
              </div>
              <div className="traffic-filter-options">
                <button
                  type="button"
                  className={`traffic-filter-btn ${trafficFilter === 'both' ? 'active' : ''}`}
                  onClick={() => handleTrafficFilterChange('both')}
                >
                  <span className="traffic-icon both">↔</span>
                  Both
                </button>
                <button
                  type="button"
                  className={`traffic-filter-btn ${trafficFilter === 'incoming' ? 'active' : ''}`}
                  onClick={() => handleTrafficFilterChange('incoming')}
                >
                  <span className="traffic-icon incoming">↓</span>
                  Incoming
                </button>
                <button
                  type="button"
                  className={`traffic-filter-btn ${trafficFilter === 'outgoing' ? 'active' : ''}`}
                  onClick={() => handleTrafficFilterChange('outgoing')}
                >
                  <span className="traffic-icon outgoing">↑</span>
                  Outgoing
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              <span>⚠️ {error}</span>
            </div>
          )}

          {loading && <LoadingSpinner recordCount={recordCount} />}

          {transactionData && (
            <div className="results-container">
              {transactionData.edges && transactionData.edges.length > 0 ? (
                <>
                  <TransactionVisualizer 
                    data={transactionData} 
                    inputAddress={walletAddress}
                    isDarkMode={isDarkMode}
                    trafficFilter={trafficFilter}
                    onExpandNode={handleExpandNode}
                  />
                  <TransactionDetails 
                    data={transactionData} 
                    inputAddress={walletAddress}
                    isDarkMode={isDarkMode}
                    trafficFilter={trafficFilter}
                  />
                </>
              ) : (
                <div className="no-data-message">
                  <div className="no-data-icon">📭</div>
                  <h3>No transactions found</h3>
                  <p>No NFT or SPL token transactions were found for this wallet address in the selected time range.</p>
                  <div className="no-data-suggestions">
                    <p><strong>Try:</strong></p>
                    <ul>
                      <li>Checking a different time range (try 30 days or longer)</li>
                      <li>Using a different wallet address with more activity</li>
                      <li>Verifying the wallet address is correct</li>
                    </ul>
                  </div>
                </div>
              )}
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: all 0.3s ease;
        }

        .container.dark {
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
          color: white;
        }

        .container.light {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #1e293b;
        }

        .header {
          padding: 2rem 1rem;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .container.dark .header {
          background: rgba(0, 0, 0, 0.3);
        }

        .container.light .header {
          background: rgba(255, 255, 255, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-left {
          text-align: left;
        }

        .theme-toggle {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          cursor: pointer;
          font-size: 1.5rem;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .container.light .theme-toggle {
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.2);
        }

        .theme-toggle:hover {
          transform: scale(1.1);
          background: rgba(255, 255, 255, 0.2);
        }

        .container.light .theme-toggle:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 2.5rem;
          font-weight: 700;
          transition: all 0.3s ease;
        }

        .container.dark .header h1 {
          background: linear-gradient(45deg, #fff, #f0f0f0);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .container.light .header h1 {
          background: linear-gradient(45deg, #1e293b, #334155);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header p {
          margin: 0;
          font-size: 1.1rem;
          transition: all 0.3s ease;
        }

        .container.dark .header p {
          opacity: 0.9;
        }

        .container.light .header p {
          opacity: 0.7;
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
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .container.dark .wallet-input {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .container.light .wallet-input {
          background: rgba(0, 0, 0, 0.05);
          color: #1e293b;
        }

        .container.dark .wallet-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .container.light .wallet-input::placeholder {
          color: rgba(30, 41, 59, 0.7);
        }

        .container.dark .wallet-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

        .container.light .wallet-input:focus {
          outline: none;
          background: rgba(0, 0, 0, 0.1);
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
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
          border-radius: 10px;
          padding: 1rem;
          margin: 1rem 0;
          text-align: center;
          backdrop-filter: blur(10px);
        }

        .container.dark .error-message {
          background: rgba(255, 107, 107, 0.2);
          border: 1px solid rgba(255, 107, 107, 0.5);
          color: white;
        }

        .container.light .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
        }

        .no-data-message {
          text-align: center;
          padding: 3rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
        }

        .container.dark .no-data-message {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .container.light .no-data-message {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .no-data-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .no-data-message h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .no-data-message p {
          margin: 0 0 1.5rem 0;
          opacity: 0.8;
          line-height: 1.6;
        }

        .no-data-suggestions {
          text-align: left;
          max-width: 400px;
          margin: 0 auto;
        }

        .no-data-suggestions ul {
          margin: 0.5rem 0 0 0;
          padding-left: 1.5rem;
        }

        .no-data-suggestions li {
          margin: 0.5rem 0;
          opacity: 0.8;
        }

        .results-container {
          border-radius: 20px;
          padding: 2rem;
          margin-top: 2rem;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .container.dark .results-container {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
        }

        .container.light .results-container {
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: #1e293b;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .results-container h1,
        .results-container h2,
        .results-container h3,
        .results-container h4,
        .results-container h5,
        .results-container h6,
        .results-container p,
        .results-container span,
        .results-container div {
          color: white;
        }

        .results-container .transaction-details {
          color: white;
        }

        .results-container .transaction-details h2 {
          color: white;
          margin-bottom: 1rem;
        }

        .results-container .transaction-details p {
          color: white;
        }

        .results-container .transaction-item {
          color: white;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          padding: 1rem;
          margin-bottom: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .results-container .transaction-header {
          color: white;
        }

        .results-container .transaction-type {
          color: white;
          background: rgba(147, 51, 234, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .results-container .transaction-direction {
          color: white;
          background: rgba(59, 130, 246, 0.3);
          padding: 0.25rem 0.5rem;
          border-radius: 5px;
          font-size: 0.8rem;
        }

        .results-container .transaction-path {
          color: white;
          margin: 0.5rem 0;
        }

        .results-container .wallet-address {
          color: white;
        }

        .results-container .wallet-address .label {
          color: rgba(255, 255, 255, 0.8);
        }

        .results-container .wallet-address .address {
          color: white;
          font-family: 'Courier New', monospace;
          font-weight: bold;
        }

        .results-container .badge {
          color: white;
          background: rgba(16, 185, 129, 0.3);
          padding: 0.1rem 0.3rem;
          border-radius: 3px;
          font-size: 0.7rem;
        }

        .results-container .transaction-details-row {
          color: white;
        }

        .results-container .detail-item {
          color: white;
        }

        .results-container .detail-label {
          color: rgba(255, 255, 255, 0.8);
        }

        .results-container .detail-value {
          color: white;
          font-weight: bold;
        }

        .results-container .mint {
          color: rgba(255, 255, 255, 0.7);
          font-family: 'Courier New', monospace;
          font-size: 0.8rem;
        }

        .results-container .amount {
          color: #10b981;
          font-weight: bold;
        }

        .results-container .no-transactions {
          color: white;
          text-align: center;
          padding: 2rem;
        }

        .results-container .no-transactions p {
          color: rgba(255, 255, 255, 0.8);
        }

        .results-container .tab-navigation {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
          padding-bottom: 0.5rem;
        }

        .results-container .tab-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 5px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
        }

        .results-container .tab-button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .results-container .tab-button.active {
          background: rgba(147, 51, 234, 0.3);
          border-color: rgba(147, 51, 234, 0.5);
          color: white;
        }

        .results-container .tab-content {
          color: white;
        }

        .results-container .arrow {
          color: white;
          font-size: 1.2rem;
          margin: 0 0.5rem;
        }

        .results-container .transaction-type.nft {
          background: rgba(236, 72, 153, 0.3);
        }

        .results-container .transaction-type.spl_token {
          background: rgba(59, 130, 246, 0.3);
        }

        .results-container .transaction-direction.incoming {
          background: rgba(16, 185, 129, 0.3);
        }

        .results-container .transaction-direction.outgoing {
          background: rgba(239, 68, 68, 0.3);
        }

        /* Force all text elements to be visible */
        .results-container * {
          color: white !important;
        }

        /* Specific overrides for transaction details */
        .results-container .transaction-details * {
          color: white !important;
        }

        .results-container .transaction-item * {
          color: white !important;
        }

        .results-container .transaction-header * {
          color: white !important;
        }

        .results-container .transaction-path * {
          color: white !important;
        }

        .results-container .wallet-address * {
          color: white !important;
        }

        .results-container .transaction-details-row * {
          color: white !important;
        }

        .results-container .detail-item * {
          color: white !important;
        }

        /* Ensure labels are slightly transparent but still visible */
        .results-container .wallet-address .label,
        .results-container .detail-label {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        /* Ensure addresses are bold and visible */
        .results-container .wallet-address .address {
          color: white !important;
          font-weight: bold !important;
        }

        /* Ensure mint addresses are visible but slightly dimmed */
        .results-container .mint {
          color: rgba(255, 255, 255, 0.8) !important;
        }

        /* Ensure amounts are highlighted */
        .results-container .amount {
          color: #10b981 !important;
          font-weight: bold !important;
        }

        /* Ensure badges are visible */
        .results-container .badge {
          color: white !important;
          background: rgba(16, 185, 129, 0.3) !important;
        }

        /* Ensure tab navigation is visible */
        .results-container .tab-navigation * {
          color: white !important;
        }

        .results-container .tab-button {
          color: white !important;
          background: rgba(255, 255, 255, 0.1) !important;
        }

        .results-container .tab-button.active {
          color: white !important;
          background: rgba(147, 51, 234, 0.3) !important;
        }

        /* Ensure transaction types are visible */
        .results-container .transaction-type {
          color: white !important;
        }

        .results-container .transaction-type.nft {
          background: rgba(236, 72, 153, 0.3) !important;
          color: white !important;
        }

        .results-container .transaction-type.spl_token {
          background: rgba(59, 130, 246, 0.3) !important;
          color: white !important;
        }

        /* Ensure transaction directions are visible */
        .results-container .transaction-direction {
          color: white !important;
        }

        .results-container .transaction-direction.incoming {
          background: rgba(16, 185, 129, 0.3) !important;
          color: white !important;
        }

        .results-container .transaction-direction.outgoing {
          background: rgba(239, 68, 68, 0.3) !important;
          color: white !important;
        }

        /* Ensure arrows are visible */
        .results-container .arrow {
          color: white !important;
          font-size: 1.2rem !important;
        }

        /* Ensure no-transactions message is visible */
        .results-container .no-transactions * {
          color: white !important;
        }

        .results-container .no-transactions p {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .rate-limit-info {
          text-align: center;
          margin-top: 1rem;
          opacity: 0.7;
        }

        .footer {
          text-align: center;
          padding: 2rem 1rem;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }

        .container.dark .footer {
          background: rgba(0, 0, 0, 0.3);
        }

        .container.light .footer {
          background: rgba(255, 255, 255, 0.1);
        }

        .footer a {
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .container.dark .footer a {
          color: #ffd700;
        }

        .container.light .footer a {
          color: #059669;
        }

        .container.dark .footer a:hover {
          color: #fff;
        }

        .container.light .footer a:hover {
          color: #047857;
        }

                 .time-filter-container {
           display: flex;
           flex-direction: column;
           gap: 1rem;
           margin-top: 1rem;
           padding: 1rem;
           border-radius: 10px;
           backdrop-filter: blur(10px);
           transition: all 0.3s ease;
         }

         .container.dark .time-filter-container {
           background: rgba(0, 0, 0, 0.3);
           border: 1px solid rgba(255, 255, 255, 0.2);
         }

         .container.light .time-filter-container {
           background: rgba(255, 255, 255, 0.1);
           border: 1px solid rgba(0, 0, 0, 0.1);
         }

                 .time-filter-label {
           font-size: 0.9rem;
           font-weight: 600;
           display: flex;
           align-items: center;
           gap: 0.5rem;
         }

         .container.dark .time-filter-label {
           color: rgba(255, 255, 255, 0.9);
         }

         .container.light .time-filter-label {
           color: #1e293b;
         }

         .active-filter-indicator {
           font-weight: 400;
           font-size: 0.8em;
           opacity: 0.8;
           padding: 0.2rem 0.5rem;
           background: rgba(59, 130, 246, 0.1);
           border-radius: 0.25rem;
           border: 1px solid rgba(59, 130, 246, 0.2);
         }

         .container.dark .active-filter-indicator {
           background: rgba(59, 130, 246, 0.2);
           border-color: rgba(59, 130, 246, 0.3);
         }

                 .time-filter-options {
           display: flex;
           gap: 0.5rem;
           flex-wrap: wrap;
           align-items: center;
         }

        .time-filter-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }

        .container.dark .time-filter-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.9);
        }

        .container.light .time-filter-btn {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: #1e293b;
        }

        .time-filter-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.2);
        }

        .container.dark .time-filter-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .container.light .time-filter-btn:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        .time-filter-btn.active {
          background: rgba(147, 51, 234, 0.3);
          border: 1px solid rgba(147, 51, 234, 0.5);
          color: white;
        }

                 .custom-date-container {
           margin-top: 1rem;
           padding: 1rem;
           border-radius: 10px;
           background: rgba(255, 255, 255, 0.05);
           border: 1px solid rgba(255, 255, 255, 0.1);
           backdrop-filter: blur(10px);
           display: flex;
           gap: 1rem;
           align-items: center;
         }

        .container.dark .custom-date-container {
          background: rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .container.light .custom-date-container {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

                 .date-input-group {
           display: flex;
           align-items: center;
           gap: 0.5rem;
           flex: 1;
         }

        .date-input-group label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }

        .container.dark .date-input-group label {
          color: rgba(255, 255, 255, 0.9);
        }

        .container.light .date-input-group label {
          color: #1e293b;
        }

        .date-input {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transition: all 0.3s ease;
        }

        .container.dark .date-input {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .container.light .date-input {
          background: rgba(0, 0, 0, 0.05);
          color: #1e293b;
        }

        .container.dark .date-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .container.light .date-input::placeholder {
          color: rgba(30, 41, 59, 0.7);
        }

        .container.dark .date-input:focus {
          outline: none;
          background: rgba(255, 255, 255, 0.2);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }

                 .container.light .date-input:focus {
           outline: none;
           background: rgba(0, 0, 0, 0.1);
           box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
         }

         .traffic-filter-container {
           display: flex;
           flex-direction: column;
           gap: 1rem;
           margin-top: 1rem;
           padding: 1rem;
           border-radius: 10px;
           backdrop-filter: blur(10px);
           transition: all 0.3s ease;
         }

         .container.dark .traffic-filter-container {
           background: rgba(0, 0, 0, 0.3);
           border: 1px solid rgba(255, 255, 255, 0.2);
         }

         .container.light .traffic-filter-container {
           background: rgba(255, 255, 255, 0.1);
           border: 1px solid rgba(0, 0, 0, 0.1);
         }

         .traffic-filter-label {
           font-size: 0.9rem;
           font-weight: 600;
           display: flex;
           align-items: center;
           gap: 0.5rem;
         }

         .container.dark .traffic-filter-label {
           color: rgba(255, 255, 255, 0.9);
         }

         .container.light .traffic-filter-label {
           color: #1e293b;
         }

         .traffic-filter-options {
           display: flex;
           gap: 0.5rem;
           flex-wrap: wrap;
           align-items: center;
         }

         .traffic-filter-btn {
           display: flex;
           align-items: center;
           gap: 0.5rem;
           padding: 0.5rem 1rem;
           border: none;
           border-radius: 8px;
           background: rgba(255, 255, 255, 0.1);
           color: white;
           font-size: 0.8rem;
           font-weight: 600;
           cursor: pointer;
           transition: all 0.3s ease;
           white-space: nowrap;
         }

         .container.dark .traffic-filter-btn {
           background: rgba(255, 255, 255, 0.05);
           border: 1px solid rgba(255, 255, 255, 0.1);
           color: rgba(255, 255, 255, 0.9);
         }

         .container.light .traffic-filter-btn {
           background: rgba(0, 0, 0, 0.05);
           border: 1px solid rgba(0, 0, 0, 0.1);
           color: #1e293b;
         }

         .traffic-filter-btn:hover:not(:disabled) {
           transform: translateY(-2px);
           background: rgba(255, 255, 255, 0.2);
         }

         .container.dark .traffic-filter-btn:hover {
           background: rgba(255, 255, 255, 0.2);
         }

         .container.light .traffic-filter-btn:hover {
           background: rgba(0, 0, 0, 0.2);
         }

         .traffic-filter-btn.active {
           background: rgba(147, 51, 234, 0.3);
           border: 1px solid rgba(147, 51, 234, 0.5);
           color: white;
         }

         .traffic-icon {
           font-size: 1rem;
           font-weight: bold;
         }

         .traffic-icon.both {
           color: #94a3b8;
         }

         .traffic-icon.incoming {
           color: #10b981;
         }

         .traffic-icon.outgoing {
           color: #ef4444;
         }

         .container.light .traffic-icon.both {
           color: #64748b;
         }

         .container.light .traffic-icon.incoming {
           color: #059669;
         }

         .container.light .traffic-icon.outgoing {
           color: #dc2626;
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

           .time-filter-container {
             padding: 0.75rem;
           }

           .time-filter-options {
             display: grid;
             grid-template-columns: repeat(2, 1fr);
             gap: 0.5rem;
           }

           .time-filter-btn {
             width: 100%;
             text-align: center;
             padding: 0.75rem 0.5rem;
             font-size: 0.75rem;
           }

           .custom-date-container {
             flex-direction: column;
             gap: 0.75rem;
           }

           .date-input-group {
             flex-direction: column;
             align-items: flex-start;
             gap: 0.25rem;
           }

           .date-input {
             width: 100%;
             padding: 0.75rem;
           }

                       .time-filter-label {
              font-size: 0.8rem;
              margin-bottom: 0.5rem;
            }

            .traffic-filter-container {
              padding: 0.75rem;
            }

            .traffic-filter-options {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 0.5rem;
            }

            .traffic-filter-btn {
              width: 100%;
              text-align: center;
              padding: 0.75rem 0.5rem;
              font-size: 0.75rem;
            }

            .traffic-filter-label {
              font-size: 0.8rem;
              margin-bottom: 0.5rem;
            }
          }
      `}</style>
    </>
  );
} 