import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

// Register the layout extension
cytoscape.use(coseBilkent);

const TransactionVisualizer = ({ data, inputAddress, isDarkMode = true, trafficFilter = 'both' }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Filter data based on traffic filter
  const filteredEdges = React.useMemo(() => {
    if (!data || !data.edges) return [];
    
    if (trafficFilter === 'both') {
      return data.edges;
    }
    
    return data.edges.filter(edge => {
      const isIncoming = edge.target === inputAddress;
      const isOutgoing = edge.source === inputAddress;
      
      if (trafficFilter === 'incoming') {
        return isIncoming;
      } else if (trafficFilter === 'outgoing') {
        return isOutgoing;
      }
      return true;
    });
  }, [data, trafficFilter, inputAddress]);

  const filteredNodes = React.useMemo(() => {
    if (!data || !data.nodes) return [];
    
    const nodeIds = new Set();
    filteredEdges.forEach(edge => {
      nodeIds.add(edge.source);
      nodeIds.add(edge.target);
    });

    return data.nodes.filter(node => nodeIds.has(node.id));
  }, [filteredEdges, data]);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    // Destroy existing instance
    if (cyRef.current) {
      cyRef.current.destroy();
    }



    // Initialize Cytoscape
    cyRef.current = cytoscape({
      container: containerRef.current,
      
      elements: [
        // Add nodes
        ...filteredNodes.map(node => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
            entity: node.entity, // Include entity information
          }
        })),
        // Add edges
        ...filteredEdges.map(edge => ({
          data: {
            id: edge.id,
            source: edge.source,
            target: edge.target,
            type: edge.type,
            amount: edge.amount,
            tokenSymbol: edge.tokenSymbol,
            uiAmount: edge.uiAmount,
          }
        }))
      ],

      style: [
        // Node styles
        {
          selector: 'node',
          style: {
            'background-color': (ele) => {
              const node = ele.data();
              if (node.entity && node.entity.color) {
                return node.entity.color;
              }
              return '#64748b';
            },
            'label': (ele) => {
              const node = ele.data();
              if (node.entity) {
                return `${node.entity.icon} ${node.entity.name}`;
              }
              return node.label;
            },
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '12px',
            'font-weight': 'bold',
            'color': '#fff',
            'text-outline-width': 2,
            'text-outline-color': '#000',
            'width': 60,
            'height': 60,
            'transition-property': 'background-color, width, height',
            'transition-duration': '0.2s',
          }
        },
        // Input wallet node (central node)
        {
          selector: 'node[type="input"]',
          style: {
            'background-color': '#9333ea',
            'width': 80,
            'height': 80,
            'border-width': 3,
            'border-color': '#7c3aed',
          }
        },
        // Regular wallet nodes
        {
          selector: 'node[type="wallet"]',
          style: {
            'background-color': '#059669',
          }
        },
        // Selected node style
        {
          selector: 'node:selected',
          style: {
            'background-color': '#f59e0b',
            'border-width': 4,
            'border-color': '#d97706',
          }
        },
        // Edge styles
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#94a3b8',
            'target-arrow-color': '#94a3b8',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'transition-property': 'width, line-color',
            'transition-duration': '0.2s',
          }
        },
        // NFT transaction edges
        {
          selector: 'edge[type="NFT"]',
          style: {
            'line-color': '#dc2626',
            'target-arrow-color': '#dc2626',
            'width': 4,
          }
        },
        // SPL token transaction edges
        {
          selector: 'edge[type="SPL_TOKEN"]',
          style: {
            'line-color': '#2563eb',
            'target-arrow-color': '#2563eb',
          }
        },
        // Highlighted edges (connected to selected node)
        {
          selector: 'edge.highlighted',
          style: {
            'width': 6,
            'opacity': 1,
          }
        },
        // Dimmed edges (not connected to selected node)
        {
          selector: 'edge.dimmed',
          style: {
            'opacity': 0.3,
          }
        },
      ],

      layout: {
        name: 'cose-bilkent',
        animate: true,
        animationDuration: 1000,
        fit: true,
        padding: 50,
        nodeRepulsion: 100000,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 0.1,
        gravity: 0.25,
        numIter: 2500,
        tile: true,
        tilingPaddingVertical: 10,
        tilingPaddingHorizontal: 10,
      },

      // Enable panning and zooming
      zoomingEnabled: true,
      userZoomingEnabled: true,
      panningEnabled: true,
      userPanningEnabled: true,
      minZoom: 0.1,
      maxZoom: 3,
    });

    // Add click event for nodes
    cyRef.current.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeData = node.data();
      
      setSelectedNode(nodeData);
      
      // Highlight connected edges
      const connectedEdges = node.connectedEdges();
      cyRef.current.edges().removeClass('highlighted dimmed');
      
      connectedEdges.addClass('highlighted');
      cyRef.current.edges().not(connectedEdges).addClass('dimmed');
    });

    // Clear selection when clicking on background
    cyRef.current.on('tap', (event) => {
      if (event.target === cyRef.current) {
        setSelectedNode(null);
        cyRef.current.edges().removeClass('highlighted dimmed');
      }
    });

    // Add hover effects
    cyRef.current.on('mouseover', 'node', (event) => {
      const node = event.target;
      if (!node.selected()) {
        node.style('background-color', '#f59e0b');
      }
    });

    cyRef.current.on('mouseout', 'node', (event) => {
      const node = event.target;
      if (!node.selected()) {
        const nodeType = node.data('type');
        
        if (nodeType === 'input') {
          node.style('background-color', '#9333ea');
        } else {
          node.style('background-color', '#059669');
        }
      }
    });

    // Edge hover events for tooltips
    cyRef.current.on('mouseover', 'edge', (event) => {
      const edge = event.target;
      const edgeData = edge.data();
      setHoveredEdge(edgeData);
      
      // Get mouse position for tooltip
      const mousePos = event.renderedPosition || event.position;
      setTooltipPosition({ x: mousePos.x, y: mousePos.y });
    });

    cyRef.current.on('mouseout', 'edge', () => {
      setHoveredEdge(null);
    });

    // Cleanup function
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [filteredNodes, filteredEdges]);

  if (!data || data.nodes.length === 0) {
    return (
      <div className="no-data">
        <div className="no-data-icon">📊</div>
        <h3>No Transaction Data Found</h3>
        <p>This wallet address has no recent NFT transfers or SPL token transactions to display.</p>
        <p className="suggestion">Try a different wallet address that has been more active on the Solana blockchain.</p>
      </div>
    );
  }

  return (
    <div className={`visualizer-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="legend">
        <div className="legend-item">
          <div className="legend-color input"></div>
          <span>Input Wallet</span>
        </div>
        <div className="legend-item">
          <div className="legend-color wallet"></div>
          <span>Connected Wallet</span>
        </div>
        <div className="legend-item">
          <div className="legend-line nft"></div>
          <span>NFT Transfer</span>
        </div>
        <div className="legend-item">
          <div className="legend-line spl"></div>
          <span>SPL Token</span>
        </div>
        <div className="legend-separator"></div>
        <div className="legend-item">
          <div className="legend-color marketplace"></div>
          <span>🖼️ NFT Marketplace</span>
        </div>
        <div className="legend-item">
          <div className="legend-color dex"></div>
          <span>🔄 DEX</span>
        </div>
        <div className="legend-item">
          <div className="legend-color staking"></div>
          <span>🔒 Staking</span>
        </div>
        <div className="legend-item">
          <div className="legend-color exchange"></div>
          <span>🏦 Exchange</span>
        </div>
        <div className="legend-item">
          <div className="legend-color sns"></div>
          <span>🌐 SNS Domain</span>
        </div>
      </div>
      
      <div ref={containerRef} className="cytoscape-container" />
      
      <div className="stats">
        <span>Nodes: {filteredNodes ? filteredNodes.length : data.nodes.length}</span>
        <span>Transactions: {filteredEdges ? filteredEdges.length : data.edges.length}</span>
        {trafficFilter !== 'both' && (
          <span className="filter-indicator">
            Showing: {trafficFilter === 'incoming' ? 'Incoming' : 'Outgoing'} only
          </span>
        )}
      </div>

      {selectedNode && (
        <div className="node-info">
          <h4>Selected Wallet</h4>
          <p><strong>Address:</strong> {selectedNode.id}</p>
          <p><strong>Type:</strong> {selectedNode.type === 'input' ? 'Input Wallet' : 'Connected Wallet'}</p>
          {selectedNode.entity && (
            <div className="entity-info">
              <p><strong>Entity:</strong> {selectedNode.entity.icon} {selectedNode.entity.name}</p>
              <p><strong>Category:</strong> {selectedNode.entity.description}</p>
            </div>
          )}
          <button onClick={() => setSelectedNode(null)}>×</button>
        </div>
      )}

      {hoveredEdge && (
        <div 
          className="edge-tooltip"
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="tooltip-header">
            <span className={`tooltip-type ${hoveredEdge.type.toLowerCase()}`}>
              {hoveredEdge.type}
            </span>
            <span className="tooltip-direction">
              {hoveredEdge.source === inputAddress ? 'Outgoing' : 'Incoming'}
            </span>
          </div>
          <div className="tooltip-content">
            <div className="tooltip-path">
              <span className="tooltip-address">{hoveredEdge.source.slice(0, 4)}...{hoveredEdge.source.slice(-4)}</span>
              <span className="tooltip-arrow">→</span>
              <span className="tooltip-address">{hoveredEdge.target.slice(0, 4)}...{hoveredEdge.target.slice(-4)}</span>
            </div>
            {hoveredEdge.type === 'NFT' ? (
              <div className="tooltip-details">
                <span><strong>Amount:</strong> 1 NFT</span>
                <span><strong>Token:</strong> {hoveredEdge.tokenSymbol || 'Unknown'}</span>
              </div>
            ) : (
              <div className="tooltip-details">
                <span><strong>Amount:</strong> {hoveredEdge.uiAmount || hoveredEdge.amount}</span>
                <span><strong>Token:</strong> {hoveredEdge.tokenSymbol || 'Unknown'}</span>
              </div>
            )}
            {hoveredEdge.signature && (
              <div className="tooltip-signature">
                <a 
                  href={`https://solscan.io/tx/${hoveredEdge.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tooltip-link"
                >
                  View on Solscan →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .visualizer-container {
          position: relative;
          width: 100%;
          height: 600px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .cytoscape-container {
          width: 100%;
          height: 100%;
        }
        
        .legend {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 255, 255, 0.95);
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          backdrop-filter: blur(4px);
          color: #1f2937;
        }

        .visualizer-container.dark .legend {
          background: rgba(0, 0, 0, 0.9);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .visualizer-container.light .legend {
          background: rgba(255, 255, 255, 0.95);
          color: #1f2937;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }

        .visualizer-container.light .edge-tooltip {
          background: rgba(255, 255, 255, 0.95);
          color: #1f2937;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .visualizer-container.light .tooltip-type.nft {
          background-color: rgba(236, 72, 153, 0.2);
          color: #1f2937;
        }

        .visualizer-container.light .tooltip-type.spl_token {
          background-color: rgba(59, 130, 246, 0.2);
          color: #1f2937;
        }

        .visualizer-container.light .tooltip-direction {
          background-color: rgba(0, 0, 0, 0.1);
          color: #1f2937;
        }

        .visualizer-container.light .tooltip-signature {
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .visualizer-container.light .tooltip-link {
          color: #2563eb;
        }

        .visualizer-container.light .tooltip-link:hover {
          color: #1d4ed8;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          margin: 6px 0;
        }
        
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          margin-right: 8px;
        }
        
        .legend-color.input {
          background-color: #9333ea;
        }
        
        .legend-color.wallet {
          background-color: #059669;
        }
        
        .legend-line {
          width: 20px;
          height: 3px;
          margin-right: 8px;
        }
        
        .legend-line.nft {
          background-color: #dc2626;
        }
        
        .legend-line.spl {
          background-color: #2563eb;
        }
        
        .legend-separator {
          height: 1px;
          background-color: rgba(0, 0, 0, 0.2);
          margin: 8px 0;
        }
        
        .visualizer-container.dark .legend-separator {
          background-color: rgba(255, 255, 255, 0.2);
        }
        
        .legend-color.marketplace {
          background-color: #FF6B6B;
        }
        
        .legend-color.dex {
          background-color: #4ECDC4;
        }
        
        .legend-color.staking {
          background-color: #45B7D1;
        }
        
        .legend-color.exchange {
          background-color: #DDA0DD;
        }
        
        .legend-color.sns {
          background-color: #98D8C8;
        }
        
        .stats {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.95);
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 12px;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          backdrop-filter: blur(4px);
        }
        
        .stats span {
          margin-right: 12px;
        }
        
        .filter-indicator {
          background: rgba(147, 51, 234, 0.1);
          color: #9333ea;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 11px;
        }
        
        .visualizer-container.dark .filter-indicator {
          background: rgba(147, 51, 234, 0.2);
          color: #a855f7;
        }
          font-weight: 500;
        }

        .node-info {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 255, 255, 0.95);
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          backdrop-filter: blur(4px);
          max-width: 250px;
        }

        .node-info h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #1f2937;
        }

        .node-info p {
          margin: 4px 0;
          word-break: break-all;
        }

        .node-info button {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: #6b7280;
        }

        .node-info button:hover {
          color: #dc2626;
        }

        .edge-tooltip {
          position: absolute;
          background: rgba(0, 0, 0, 0.95);
          color: white;
          padding: 12px;
          border-radius: 8px;
          font-size: 12px;
          z-index: 1001;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          max-width: 280px;
          pointer-events: none;
        }

        .tooltip-header {
          display: flex;
          gap: 8px;
          margin-bottom: 8px;
          align-items: center;
        }

        .tooltip-type {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .tooltip-type.nft {
          background-color: rgba(236, 72, 153, 0.8);
          color: white;
        }

        .tooltip-type.spl_token {
          background-color: rgba(59, 130, 246, 0.8);
          color: white;
        }

        .tooltip-direction {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          background-color: rgba(255, 255, 255, 0.2);
        }

        .tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .tooltip-path {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Courier New', monospace;
        }

        .tooltip-address {
          font-weight: 600;
        }

        .tooltip-arrow {
          color: #94a3b8;
          font-weight: bold;
        }

        .tooltip-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .tooltip-details span {
          font-size: 11px;
        }

        .tooltip-signature {
          margin-top: 4px;
          padding-top: 4px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .tooltip-link {
          color: #60a5fa;
          text-decoration: none;
          font-size: 11px;
          font-weight: 600;
          pointer-events: auto;
        }

        .tooltip-link:hover {
          color: #93c5fd;
          text-decoration: underline;
        }
        
        .no-data {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #6b7280;
          text-align: center;
          padding: 40px;
        }

        .no-data-icon {
          font-size: 4rem;
          margin-bottom: 16px;
        }

        .no-data h3 {
          margin: 0 0 12px 0;
          color: #374151;
          font-size: 1.5rem;
        }

        .no-data p {
          margin: 8px 0;
          font-size: 1rem;
          line-height: 1.5;
        }

        .suggestion {
          font-style: italic;
          color: #9333ea;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
};

export default TransactionVisualizer; 