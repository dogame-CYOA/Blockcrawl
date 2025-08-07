import React, { useState } from 'react';

const TransactionDetails = ({ data, inputAddress }) => {
  const [activeTab, setActiveTab] = useState('nft');

  if (!data || !data.edges || data.edges.length === 0) {
    return (
      <div className="transaction-details">
        <h2>Transaction Path Analysis</h2>
        <div className="no-transactions">
          <p>No transaction details available to display.</p>
        </div>
      </div>
    );
  }

  // Separate NFT and SPL token transactions
  const nftTransactions = data.edges.filter(edge => edge.type === 'NFT');
  const splTransactions = data.edges.filter(edge => edge.type === 'SPL_TOKEN');

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getDirection = (edge) => {
    return edge.source === inputAddress ? 'outgoing' : 'incoming';
  };

  const formatAmount = (amount, decimals = 0) => {
    if (!amount) return '0';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat().format(num);
  };

  const renderTransaction = (edge, index) => {
    const direction = getDirection(edge);
    const isNFT = edge.type === 'NFT';
    
    return (
      <div key={edge.id} className="transaction-item">
        <div className="transaction-header">
          <span className={`transaction-type ${edge.type.toLowerCase()}`}>
            {edge.type}
          </span>
          <span className={`transaction-direction ${direction}`}>
            {direction}
          </span>
        </div>
        
        <div className="transaction-path">
          <div className="wallet-address from">
            <span className="label">From:</span>
            <span className="address">{formatAddress(edge.source)}</span>
            {edge.source === inputAddress && (
              <span className="badge input">Input Wallet</span>
            )}
          </div>
          <div className="arrow">→</div>
          <div className="wallet-address to">
            <span className="label">To:</span>
            <span className="address">{formatAddress(edge.target)}</span>
            {edge.target === inputAddress && (
              <span className="badge input">Input Wallet</span>
            )}
          </div>
        </div>
        
        <div className="transaction-details-row">
          {isNFT ? (
            <>
              <div className="detail-item">
                <span className="detail-label">NFT Amount:</span>
                <span className="detail-value">1 NFT</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Token Symbol:</span>
                <span className="detail-value">{edge.tokenSymbol || 'Unknown NFT'}</span>
              </div>
            </>
          ) : (
            <>
              <div className="detail-item">
                <span className="detail-label">Token:</span>
                <span className="detail-value">{edge.tokenSymbol || 'Unknown Token'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Amount:</span>
                <span className="detail-value amount">
                  {formatAmount(edge.uiAmount || edge.amount, edge.decimals)}
                </span>
              </div>
            </>
          )}
          <div className="detail-item">
            <span className="detail-label">Mint Address:</span>
            <span className="detail-value mint">{edge.mint || 'Unknown'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="transaction-details">
      <h2>Transaction Path Analysis</h2>
      <p className="section-subtitle">
        Detailed breakdown of all NFT transfers and SPL token transactions
      </p>
      
      <div className="transaction-tabs">
        <button 
          className={`tab-button ${activeTab === 'nft' ? 'active' : ''}`}
          onClick={() => setActiveTab('nft')}
        >
          <span className="tab-icon nft"></span>
          NFT Transfers ({nftTransactions.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'spl' ? 'active' : ''}`}
          onClick={() => setActiveTab('spl')}
        >
          <span className="tab-icon spl"></span>
          SPL Token Transfers ({splTransactions.length})
        </button>
      </div>

      <div className={`tab-content ${activeTab === 'nft' ? 'active' : ''}`}>
        {activeTab === 'nft' && (
          <div className="transaction-list">
            {nftTransactions.length > 0 ? (
              nftTransactions.map((edge, index) => renderTransaction(edge, index))
            ) : (
              <div className="no-transactions">
                <p>No NFT transfers found for this wallet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className={`tab-content ${activeTab === 'spl' ? 'active' : ''}`}>
        {activeTab === 'spl' && (
          <div className="transaction-list">
            {splTransactions.length > 0 ? (
              splTransactions.map((edge, index) => renderTransaction(edge, index))
            ) : (
              <div className="no-transactions">
                <p>No SPL token transfers found for this wallet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .transaction-details {
          background: transparent;
          border-radius: 12px;
          padding: 30px;
          margin-top: 30px;
          color: white;
        }

        .transaction-details h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: white;
        }

        .section-subtitle {
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 24px;
          font-size: 1rem;
        }

        .transaction-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.2);
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: white;
          transition: all 0.2s;
          border-radius: 8px 8px 0 0;
        }

        .tab-button.active {
          color: white;
          background: rgba(147, 51, 234, 0.3);
          border-bottom-color: #9333ea;
        }

        .tab-button:hover {
          color: white;
          background: rgba(255, 255, 255, 0.2);
        }

        .tab-icon {
          width: 16px;
          height: 3px;
          border-radius: 2px;
        }

        .tab-icon.nft {
          background-color: #dc2626;
        }

        .tab-icon.spl {
          background-color: #2563eb;
        }

        .tab-content {
          display: none;
        }

        .tab-content.active {
          display: block;
        }

        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .transaction-item {
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 20px;
          transition: all 0.2s;
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .transaction-item:hover {
          border-color: rgba(255, 255, 255, 0.3);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          background: rgba(255, 255, 255, 0.1);
        }

        .transaction-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          color: white;
        }

        .transaction-type {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: white;
        }

        .transaction-type.nft {
          background-color: rgba(236, 72, 153, 0.3);
          color: white;
        }

        .transaction-type.spl_token {
          background-color: rgba(59, 130, 246, 0.3);
          color: white;
        }

        .transaction-direction {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          color: white;
        }

        .transaction-direction.incoming {
          background-color: rgba(16, 185, 129, 0.3);
          color: white;
        }

        .transaction-direction.outgoing {
          background-color: rgba(239, 68, 68, 0.3);
          color: white;
        }

        .transaction-path {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 16px;
          padding: 16px;
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          color: white;
        }

        .wallet-address {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .wallet-address .label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .wallet-address .address {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: 600;
          color: white;
        }

        .badge {
          padding: 2px 8px;
          background-color: rgba(16, 185, 129, 0.3);
          color: white;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .arrow {
          font-size: 18px;
          font-weight: bold;
          color: white;
          flex-shrink: 0;
        }

        .transaction-details-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          color: white;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: white;
        }

        .detail-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 14px;
          color: white;
          word-break: break-all;
        }

        .detail-value.amount {
          font-family: 'Courier New', monospace;
          font-weight: 700;
          color: #10b981;
        }

        .detail-value.mint {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .no-transactions {
          text-align: center;
          padding: 40px;
          color: white;
        }

        .no-transactions p {
          font-style: italic;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        @media (max-width: 768px) {
          .transaction-details {
            padding: 20px;
          }

          .transaction-path {
            flex-direction: column;
            gap: 12px;
          }

          .transaction-details-row {
            grid-template-columns: 1fr;
          }

          .tab-button {
            padding: 10px 16px;
            font-size: 13px;
          }

          .wallet-address {
            justify-content: center;
          }

          .arrow {
            transform: rotate(90deg);
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionDetails; 