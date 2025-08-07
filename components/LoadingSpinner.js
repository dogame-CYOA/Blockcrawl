import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p>Analyzing blockchain transactions...</p>
      <div className="loading-steps">
        <div className="step">Fetching transaction data</div>
        <div className="step">Processing wallet connections</div>
        <div className="step">Building visualization</div>
      </div>
      
      <style jsx>{`
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }
        
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #9333ea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        p {
          margin: 0 0 20px 0;
          color: #374151;
          font-size: 18px;
          font-weight: 600;
        }
        
        .loading-steps {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .step {
          color: #6b7280;
          font-size: 14px;
          padding: 4px 0;
          position: relative;
        }
        
        .step::before {
          content: "•";
          color: #9333ea;
          margin-right: 8px;
          font-weight: bold;
        }
        
        @media (max-width: 768px) {
          .loading-container {
            padding: 30px;
          }
          
          p {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner; 