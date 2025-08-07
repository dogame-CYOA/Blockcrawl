import React, { useState } from 'react';

const TransactionDetails = ({ data, inputAddress, isDarkMode = true }) => {
  const [activeTab, setActiveTab] = useState('nft');

  if (!data || !data.edges || data.edges.length === 0) {
    return (
      <div className={`transaction-details ${isDarkMode ? 'dark' : 'light'}`}>
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
          <span className="transaction-number">#{index + 1}</span>
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
    <div className={`transaction-details ${isDarkMode ? 'dark' : 'light'}`}>
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
          border-radius: 12px;
          padding: 30px;
          margin-top: 30px;
          transition: all 0.3s ease;
        }

        .transaction-details h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin-bottom: 8px;
          transition: all 0.3s ease;
        }

        .section-subtitle {
          margin-bottom: 24px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .transaction-tabs {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          transition: all 0.3s ease;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s;
          border-radius: 8px 8px 0 0;
        }

        .tab-icon {
          width: 16px;
          height: 3px;
          border-radius: 2px;
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
           gap: 30px;
         }

        .transaction-item {
          border-radius: 15px;
          padding: 30px;
          transition: all 0.3s ease;
          margin-bottom: 20px;
          border: 2px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          position: relative;
        }

        .transaction-item:not(:last-child)::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 20px;
          right: 20px;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
        }

        .transaction-header {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid rgba(0, 0, 0, 0.1);
        }

        .transaction-number {
          font-size: 14px;
          font-weight: 700;
          color: #64748b;
          background: rgba(0, 0, 0, 0.05);
          padding: 4px 8px;
          border-radius: 6px;
          min-width: 30px;
          text-align: center;
        }

        .transaction-type {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .transaction-direction {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .transaction-path {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 25px;
          padding: 25px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
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
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .wallet-address .address {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          font-weight: 600;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          flex-shrink: 0;
        }

        .arrow {
          font-size: 18px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .transaction-details-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .detail-label {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .detail-value {
          font-size: 14px;
          word-break: break-all;
        }

        .detail-value.amount {
          font-family: 'Courier New', monospace;
          font-weight: 700;
        }

        .detail-value.mint {
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        .no-transactions {
          text-align: center;
          padding: 40px;
        }

        .no-transactions p {
          font-style: italic;
          font-size: 1rem;
        }

        /* Dark theme styles */
        .transaction-details.dark {
          color: white;
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .transaction-details.dark h2 {
          color: white;
        }

        .transaction-details.dark .section-subtitle {
          color: rgba(255, 255, 255, 0.9);
        }

        .transaction-details.dark .transaction-tabs {
          border-bottom: 2px solid rgba(255, 255, 255, 0.3);
        }

        .transaction-details.dark .tab-button {
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .transaction-details.dark .tab-button.active {
          color: white;
          background: rgba(147, 51, 234, 0.6);
          border-bottom-color: #9333ea;
          border-color: rgba(147, 51, 234, 0.8);
        }

        .transaction-details.dark .tab-button:hover {
          color: white;
          background: rgba(0, 0, 0, 0.8);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .tab-icon.nft {
          background-color: #ec4899;
        }

        .tab-icon.spl {
          background-color: #3b82f6;
        }

        .transaction-details.dark .transaction-item {
          border: 2px solid rgba(255, 255, 255, 0.3);
          background: rgba(0, 0, 0, 0.6);
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        }

        .transaction-details.dark .transaction-item:hover {
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
          background: rgba(0, 0, 0, 0.8);
          transform: translateY(-2px);
        }

        .transaction-details.dark .transaction-item:not(:last-child)::after {
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        }

        .transaction-details.dark .transaction-header {
          color: white;
        }

        .transaction-details.dark .transaction-number {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.1);
        }

        .transaction-details.dark .transaction-type {
          color: white;
        }

        .transaction-details.dark .transaction-type.nft {
          background-color: rgba(236, 72, 153, 0.6);
          color: white;
          border: 1px solid rgba(236, 72, 153, 0.8);
        }

        .transaction-details.dark .transaction-type.spl_token {
          background-color: rgba(59, 130, 246, 0.6);
          color: white;
          border: 1px solid rgba(59, 130, 246, 0.8);
        }

        .transaction-details.dark .transaction-direction {
          color: white;
        }

        .transaction-details.dark .transaction-direction.incoming {
          background-color: rgba(16, 185, 129, 0.6);
          color: white;
          border: 1px solid rgba(16, 185, 129, 0.8);
        }

        .transaction-details.dark .transaction-direction.outgoing {
          background-color: rgba(239, 68, 68, 0.6);
          color: white;
          border: 1px solid rgba(239, 68, 68, 0.8);
        }

        .transaction-details.dark .transaction-path {
          background-color: rgba(0, 0, 0, 0.4);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .transaction-details.dark .wallet-address .label {
          color: rgba(255, 255, 255, 0.9);
        }

        .transaction-details.dark .wallet-address .address {
          color: white;
        }

        .transaction-details.dark .badge {
          background-color: rgba(16, 185, 129, 0.6);
          color: white;
          border: 1px solid rgba(16, 185, 129, 0.8);
        }

        .transaction-details.dark .arrow {
          color: white;
        }

        .transaction-details.dark .transaction-details-row {
          color: white;
        }

        .transaction-details.dark .detail-item {
          color: white;
        }

        .transaction-details.dark .detail-label {
          color: rgba(255, 255, 255, 0.9);
        }

        .transaction-details.dark .detail-value {
          color: white;
        }

        .transaction-details.dark .detail-value.amount {
          color: #10b981;
        }

        .transaction-details.dark .detail-value.mint {
          color: rgba(255, 255, 255, 0.8);
        }

        .transaction-details.dark .no-transactions {
          color: white;
        }

        .transaction-details.dark .no-transactions p {
          color: rgba(255, 255, 255, 0.9);
        }

        /* Light theme styles */
        .transaction-details.light {
          color: #1e293b;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(0, 0, 0, 0.15);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .transaction-details.light h2 {
          color: #1e293b;
        }

        .transaction-details.light .section-subtitle {
          color: #475569;
        }

        .transaction-details.light .tab-button {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: #1e293b;
        }

        .transaction-details.light .tab-button:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .transaction-details.light .tab-button.active {
          background: rgba(147, 51, 234, 0.2);
          border-color: rgba(147, 51, 234, 0.4);
          color: #1e293b;
        }

        .transaction-details.light .transaction-item {
          background: rgba(255, 255, 255, 0.8);
          border: 2px solid rgba(0, 0, 0, 0.1);
          color: #1e293b;
        }

        .transaction-details.light .transaction-item:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: rgba(0, 0, 0, 0.2);
          box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
        }

        .transaction-details.light .transaction-header {
          border-bottom: 2px solid rgba(0, 0, 0, 0.1);
          color: #1e293b;
        }

        .transaction-details.light .transaction-number {
          color: #64748b;
          background: rgba(0, 0, 0, 0.05);
        }

        .transaction-details.light .transaction-type {
          color: #1e293b;
        }

        .transaction-details.light .transaction-type.nft {
          background-color: rgba(236, 72, 153, 0.2);
          color: #1e293b;
          border: 1px solid rgba(236, 72, 153, 0.4);
        }

        .transaction-details.light .transaction-type.spl_token {
          background-color: rgba(59, 130, 246, 0.2);
          color: #1e293b;
          border: 1px solid rgba(59, 130, 246, 0.4);
        }

        .transaction-details.light .transaction-direction {
          color: #1e293b;
        }

        .transaction-details.light .transaction-direction.incoming {
          background-color: rgba(16, 185, 129, 0.2);
          color: #1e293b;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .transaction-details.light .transaction-direction.outgoing {
          background-color: rgba(239, 68, 68, 0.2);
          color: #1e293b;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        .transaction-details.light .transaction-path {
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(0, 0, 0, 0.1);
          color: #1e293b;
        }

        .transaction-details.light .wallet-address .label {
          color: #475569;
        }

        .transaction-details.light .wallet-address .address {
          color: #1e293b;
        }

        .transaction-details.light .badge {
          background-color: rgba(16, 185, 129, 0.2);
          color: #1e293b;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        .transaction-details.light .arrow {
          color: #1e293b;
        }

        .transaction-details.light .transaction-details-row {
          color: #1e293b;
        }

        .transaction-details.light .detail-item {
          color: #1e293b;
        }

        .transaction-details.light .detail-label {
          color: #475569;
        }

        .transaction-details.light .detail-value {
          color: #1e293b;
        }

        .transaction-details.light .detail-value.amount {
          color: #059669;
        }

        .transaction-details.light .detail-value.mint {
          color: #64748b;
        }

        .transaction-details.light .no-transactions {
          color: #1e293b;
        }

        .transaction-details.light .no-transactions p {
          color: #64748b;
        }

        .transaction-details.light .transaction-item:not(:last-child)::after {
          background: linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.1), transparent);
        }
          color: rgba(30, 41, 59, 0.8);
        }

        .transaction-details.light .transaction-tabs {
          border-bottom: 2px solid rgba(0, 0, 0, 0.15);
        }

        .transaction-details.light .tab-button {
          background: rgba(0, 0, 0, 0.08);
          color: #1e293b;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .transaction-details.light .tab-button.active {
          color: white;
          background: rgba(147, 51, 234, 0.9);
          border-bottom-color: #9333ea;
          border-color: rgba(147, 51, 234, 1);
        }

        .transaction-details.light .tab-button:hover {
          color: #1e293b;
          background: rgba(0, 0, 0, 0.12);
          border-color: rgba(0, 0, 0, 0.2);
        }

        .transaction-details.light .transaction-item {
          border: 2px solid rgba(0, 0, 0, 0.15);
          background: rgba(255, 255, 255, 0.7);
          color: #1e293b;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .transaction-details.light .transaction-item:hover {
          border-color: rgba(0, 0, 0, 0.25);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
          background: rgba(255, 255, 255, 0.9);
          transform: translateY(-2px);
        }

        .transaction-details.light .transaction-header {
          color: #1e293b;
        }

        .transaction-details.light .transaction-type {
          color: white;
        }

        .transaction-details.light .transaction-type.nft {
          background-color: rgba(236, 72, 153, 0.9);
          color: white;
          border: 1px solid rgba(236, 72, 153, 1);
        }

        .transaction-details.light .transaction-type.spl_token {
          background-color: rgba(59, 130, 246, 0.9);
          color: white;
          border: 1px solid rgba(59, 130, 246, 1);
        }

        .transaction-details.light .transaction-direction {
          color: white;
        }

        .transaction-details.light .transaction-direction.incoming {
          background-color: rgba(16, 185, 129, 0.9);
          color: white;
          border: 1px solid rgba(16, 185, 129, 1);
        }

        .transaction-details.light .transaction-direction.outgoing {
          background-color: rgba(239, 68, 68, 0.9);
          color: white;
          border: 1px solid rgba(239, 68, 68, 1);
        }

        .transaction-details.light .transaction-path {
          background-color: rgba(0, 0, 0, 0.05);
          color: #1e293b;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .transaction-details.light .wallet-address .label {
          color: rgba(30, 41, 59, 0.8);
        }

        .transaction-details.light .wallet-address .address {
          color: #1e293b;
        }

        .transaction-details.light .badge {
          background-color: rgba(16, 185, 129, 0.9);
          color: white;
          border: 1px solid rgba(16, 185, 129, 1);
        }

        .transaction-details.light .arrow {
          color: #1e293b;
        }

        .transaction-details.light .transaction-details-row {
          color: #1e293b;
        }

        .transaction-details.light .detail-item {
          color: #1e293b;
        }

        .transaction-details.light .detail-label {
          color: rgba(30, 41, 59, 0.8);
        }

        .transaction-details.light .detail-value {
          color: #1e293b;
        }

        .transaction-details.light .detail-value.amount {
          color: #059669;
        }

        .transaction-details.light .detail-value.mint {
          color: rgba(30, 41, 59, 0.7);
        }

        .transaction-details.light .no-transactions {
          color: #1e293b;
        }

        .transaction-details.light .no-transactions p {
          color: rgba(30, 41, 59, 0.8);
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