import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import coseBilkent from 'cytoscape-cose-bilkent';

// Register the layout extension
cytoscape.use(coseBilkent);

const TransactionVisualizer = ({ data, inputAddress }) => {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);

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
        ...data.nodes.map(node => ({
          data: {
            id: node.id,
            label: node.label,
            type: node.type,
          }
        })),
        // Add edges
        ...data.edges.map(edge => ({
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
            'background-color': '#64748b',
            'label': 'data(label)',
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

    // Cleanup function
    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
      }
    };
  }, [data]);

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
    <div className="visualizer-container">
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
      </div>
      
      <div ref={containerRef} className="cytoscape-container" />
      
      <div className="stats">
        <span>Nodes: {data.nodes.length}</span>
        <span>Transactions: {data.edges.length}</span>
      </div>

      {selectedNode && (
        <div className="node-info">
          <h4>Selected Wallet</h4>
          <p><strong>Address:</strong> {selectedNode.id}</p>
          <p><strong>Type:</strong> {selectedNode.type === 'input' ? 'Input Wallet' : 'Connected Wallet'}</p>
          <button onClick={() => setSelectedNode(null)}>×</button>
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