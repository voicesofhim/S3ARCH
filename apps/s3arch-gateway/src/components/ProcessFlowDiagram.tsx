import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  type Node,
  Handle,
  Position,
  type NodeProps,
  type EdgeProps,
  getSmoothStepPath,
  BaseEdge,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TIM3_PROCESSES, ENVIRONMENT } from '../ao/processes';
import { useProcessFlow } from '../hooks/useProcessFlow';
import { requestMintTIM3, requestBurnTIM3, getCoordinatorStatus, getCoordinatorConfig, configureCoordinator } from '../ao/tim3';

// Custom node types
const ProcessNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`process-node ${selected ? 'selected' : ''} ${data.type}`}>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
      
      <div className="node-header">
        <div className="node-title">{data.label}</div>
        <div className="environment-badge">{ENVIRONMENT.toUpperCase()}</div>
      </div>
      
      <div className="node-content">
        <div className="process-id">
          ID: {data.processId?.slice(0, 8)}...{data.processId?.slice(-6)}
        </div>
        {data.balance && (
          <div className="balance">{data.balance}</div>
        )}
        {data.status && (
          <div className={`status ${data.status.toLowerCase()}`}>
            {data.status}
          </div>
        )}
      </div>
      
      {data.activity && (
        <div className="activity-indicator">
          <div className="pulse"></div>
        </div>
      )}
    </div>
  );
};

// Custom animated edge with money flow
const MoneyFlowEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge path={edgePath} style={style} />
      {data?.amount && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 11,
              fontWeight: 500,
              background: '#1a1a1a',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid #333',
              color: '#4ade80',
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            {data.amount}
          </div>
        </EdgeLabelRenderer>
      )}
      
      {/* Animated flow particles */}
      {data?.flowing && (
        <div className="flow-particle" style={{
          position: 'absolute',
          left: sourceX,
          top: sourceY,
        }}>
          <div className="particle"></div>
        </div>
      )}
    </>
  );
};

const nodeTypes = {
  process: ProcessNode,
};

const edgeTypes = {
  moneyFlow: MoneyFlowEdge,
};

interface ProcessFlowDiagramProps {
  isVisible: boolean;
  onToggle: () => void;
}

export default function ProcessFlowDiagram({ isVisible, onToggle }: ProcessFlowDiagramProps) {
  const { processes, transactions, isLoading, error, addTransaction, refreshBalances, connected } = useProcessFlow();
  const [activeTransaction, setActiveTransaction] = useState<string | null>(null);
  const [mintAmount, setMintAmount] = useState('100');
  
  // Create nodes from process data
  const createNodes = useCallback((): Node[] => {
    const baseNodes = [
      {
        id: 'user',
        type: 'process',
        position: { x: 400, y: 50 },
        data: {
          label: 'User Interface',
          type: 'user',
          processId: 'Frontend',
          status: connected ? 'CONNECTED' : 'DISCONNECTED',
          balance: null,
        },
      },
    ];

    const processNodes = processes.map(process => {
      const positions: Record<string, { x: number; y: number }> = {
        coordinator: { x: 400, y: 200 },
        usda: { x: 100, y: 350 },
        lockManager: { x: 250, y: 350 },
        tokenManager: { x: 550, y: 350 },
        stateManager: { x: 700, y: 350 },
      };

      const types: Record<string, string> = {
        coordinator: 'coordinator',
        usda: 'token',
        lockManager: 'manager',
        tokenManager: 'manager',
        stateManager: 'manager',
      };

      return {
        id: process.id,
        type: 'process',
        position: positions[process.id] || { x: 400, y: 300 },
        data: {
          label: process.name,
          type: types[process.id] || 'manager',
          processId: process.processId,
          status: process.status.toUpperCase(),
          balance: process.balance,
          activity: process.status === 'processing',
        },
      };
    });

    return [...baseNodes, ...processNodes];
  }, [processes, connected]);

  // Initialize edges with flow connections
  const initialEdges: Edge[] = [
    {
      id: 'user-coordinator',
      source: 'user',
      target: 'coordinator',
      type: 'moneyFlow',
      animated: true,
      style: { stroke: '#60a5fa' },
      data: { amount: '', flowing: false },
    },
    {
      id: 'coordinator-lockmanager',
      source: 'coordinator',
      target: 'lockManager',
      type: 'moneyFlow',
      animated: false,
      style: { stroke: '#f59e0b' },
      data: { amount: '', flowing: false },
    },
    {
      id: 'lockmanager-usda',
      source: 'lockManager',
      target: 'usda',
      type: 'moneyFlow',
      animated: false,
      style: { stroke: '#ef4444' },
      data: { amount: '', flowing: false },
    },
    {
      id: 'coordinator-tokenmanager',
      source: 'coordinator',
      target: 'tokenManager',
      type: 'moneyFlow',
      animated: false,
      style: { stroke: '#10b981' },
      data: { amount: '', flowing: false },
    },
    {
      id: 'coordinator-statemanager',
      source: 'coordinator',
      target: 'stateManager',
      type: 'moneyFlow',
      animated: false,
      style: { stroke: '#ff6b6b', strokeDasharray: '5,5' }, // Red dashed to indicate missing
      data: { amount: 'MISSING!', flowing: false },
    },
  ];

  const [nodes, setNodes, onNodesChange] = useNodesState(createNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when process data changes
  useEffect(() => {
    setNodes(createNodes());
  }, [processes, connected, createNodes]);

  // Handle TIM3 mint operation
  const handleMintTIM3 = async () => {
    if (!connected || !mintAmount) return;
    
    try {
      console.log('🚀 Initiating TIM3 mint for amount:', mintAmount);
      
      // First, let's check coordinator status
      console.log('🔍 Checking coordinator status...');
      try {
        const coordinatorStatus = await getCoordinatorStatus();
        console.log('📊 Coordinator status:', coordinatorStatus);
      } catch (e) {
        console.log('⚠️ Could not get coordinator status:', e);
      }
      
      // Check coordinator config
      console.log('🔍 Checking coordinator config...');
      try {
        const coordinatorConfig = await getCoordinatorConfig();
        console.log('⚙️ Coordinator config:', coordinatorConfig);
      } catch (e) {
        console.log('⚠️ Could not get coordinator config, trying to configure...');
        try {
          await configureCoordinator();
          console.log('✅ Coordinator configured successfully');
        } catch (configError) {
          console.error('❌ Failed to configure coordinator:', configError);
        }
      }
      
      // Add transaction to track
      const transactionId = addTransaction({
        type: 'mint',
        amount: mintAmount,
        status: 'processing',
      });

      // Send actual mint request
      console.log('💰 Sending mint request...');
      const mintResult = await requestMintTIM3(mintAmount);
      console.log('✅ Mint request result:', mintResult);
      
      console.log('🔄 TIM3 mint request completed, waiting for processing...');
      
      // Refresh balances after a delay
      setTimeout(() => {
        console.log('🔄 Refreshing balances...');
        refreshBalances();
      }, 3000);
      
    } catch (error) {
      console.error('❌ Error minting TIM3:', error);
    }
  };

  // Handle TIM3 burn operation
  const handleBurnTIM3 = async () => {
    if (!connected || !mintAmount) return;
    
    try {
      console.log('Initiating TIM3 burn for amount:', mintAmount);
      
      const transactionId = addTransaction({
        type: 'burn', 
        amount: mintAmount,
        status: 'processing',
      });

      await requestBurnTIM3(mintAmount);
      
      console.log('TIM3 burn request sent successfully');
    } catch (error) {
      console.error('TIM3 burn failed:', error);
    }
  };

  // Handle new connections
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Simulate transaction flow animation
  useEffect(() => {
    const latestTransaction = transactions[transactions.length - 1];
    if (latestTransaction && latestTransaction.status === 'processing') {
      setActiveTransaction(latestTransaction.id);
      
      // Animate the flow based on transaction type
      if (latestTransaction.type === 'mint') {
        // Mint flow: User → Coordinator → Lock Manager → USDA (collateral)
        //                            → Token Manager (mint TIM3)
        //                            → State Manager (update state)
        const animationSteps = [
          { edgeId: 'user-coordinator', delay: 0 },
          { edgeId: 'coordinator-lockmanager', delay: 1000 },
          { edgeId: 'lockmanager-usda', delay: 2000 },
          { edgeId: 'coordinator-tokenmanager', delay: 1500 },
          { edgeId: 'coordinator-statemanager', delay: 3000 },
        ];

        animationSteps.forEach(({ edgeId, delay }) => {
          setTimeout(() => {
            setEdges((eds) => eds.map(edge => 
              edge.id === edgeId 
                ? { 
                    ...edge, 
                    animated: true, 
                    style: { ...edge.style, strokeWidth: 3 },
                    data: { 
                      ...edge.data, 
                      amount: latestTransaction.amount + (edgeId.includes('usda') ? ' USDA' : ' TIM3'),
                      flowing: true 
                    }
                  }
                : edge
            ));
            
            // Set coordinator as active
            setNodes((nds) => nds.map(node => 
              node.id === 'coordinator' 
                ? { ...node, data: { ...node.data, activity: true } }
                : node
            ));
          }, delay);
        });

        // Reset animations after completion
        setTimeout(() => {
          setEdges((eds) => eds.map(edge => ({
            ...edge,
            animated: false,
            style: { ...edge.style, strokeWidth: 1 },
            data: { ...edge.data, amount: '', flowing: false }
          })));
          
          setNodes((nds) => nds.map(node => 
            node.id === 'coordinator' 
              ? { ...node, data: { ...node.data, activity: false } }
              : node
          ));
          
          setActiveTransaction(null);
        }, 5000);
      }
    }
  }, [transactions, setEdges, setNodes]);

  if (!isVisible) return null;

  return (
    <div className="process-flow-container">
      {/* Header */}
      <div className="flow-header">
        <div className="flow-title">
          <h3>TIM3 Process Flow Diagram</h3>
          <span className="environment-indicator">{ENVIRONMENT} Environment</span>
        </div>
        
        {/* Interactive Controls */}
        <div className="flow-controls">
          {connected ? (
            <div className="operation-controls">
              <input
                type="number"
                value={mintAmount}
                onChange={(e) => setMintAmount(e.target.value)}
                placeholder="Amount"
                className="amount-input"
                min="1"
                max="1000"
              />
              <button 
                onClick={handleMintTIM3} 
                className="operation-btn mint-btn"
                disabled={!mintAmount || isLoading}
              >
                Mint TIM3
              </button>
              <button 
                onClick={handleBurnTIM3} 
                className="operation-btn burn-btn"
                disabled={!mintAmount || isLoading}
              >
                Burn TIM3
              </button>
              <button 
                onClick={refreshBalances} 
                className="refresh-btn"
                disabled={isLoading}
              >
                🔄
              </button>
            </div>
          ) : (
            <div className="connection-status">Wallet not connected</div>
          )}
          
          {activeTransaction && (
            <div className="active-transaction">
              Processing: {activeTransaction}
            </div>
          )}
          
          {error && (
            <div className="error-message">{error}</div>
          )}
          
          <button onClick={onToggle} className="close-btn">×</button>
        </div>
      </div>

      {/* React Flow */}
      <div className="flow-content">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Controls />
          <MiniMap 
            nodeStrokeColor="#333"
            nodeColor="#1a1a1a"
            nodeBorderRadius={8}
            maskColor="rgba(0,0,0,0.3)"
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#333" />
        </ReactFlow>
      </div>

      {/* Transaction History */}
      {transactions.length > 0 && (
        <div className="transaction-history">
          <h4>Recent Transactions</h4>
          <div className="transaction-list">
            {transactions.slice(-5).map((tx) => (
              <div key={tx.id} className={`transaction-item ${tx.status}`}>
                <span className="tx-type">{tx.type.toUpperCase()}</span>
                <span className="tx-amount">{tx.amount}</span>
                <span className="tx-status">{tx.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .process-flow-container {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 400px;
          background: #0d1117;
          border-top: 1px solid #30363d;
          display: flex;
          flex-direction: column;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .flow-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px;
          background: #161b22;
          border-bottom: 1px solid #30363d;
        }

        .flow-title h3 {
          margin: 0;
          color: #f0f6fc;
          font-size: 14px;
          font-weight: 600;
        }

        .environment-indicator {
          margin-left: 12px;
          padding: 2px 8px;
          background: ${ENVIRONMENT === 'test' ? '#1f6feb' : '#fb8500'};
          color: white;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .flow-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .operation-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .amount-input {
          width: 80px;
          padding: 4px 8px;
          border: 1px solid #30363d;
          border-radius: 4px;
          background: #0d1117;
          color: #f0f6fc;
          font-size: 12px;
        }

        .amount-input:focus {
          outline: none;
          border-color: #58a6ff;
          box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
        }

        .operation-btn {
          padding: 4px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .operation-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mint-btn {
          background: #238636;
          color: white;
        }

        .mint-btn:hover:not(:disabled) {
          background: #2ea043;
        }

        .burn-btn {
          background: #da3633;
          color: white;
        }

        .burn-btn:hover:not(:disabled) {
          background: #f85149;
        }

        .refresh-btn {
          padding: 4px 8px;
          background: none;
          border: 1px solid #30363d;
          border-radius: 4px;
          color: #8b949e;
          cursor: pointer;
          font-size: 12px;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #30363d;
          color: #f0f6fc;
        }

        .connection-status {
          color: #f85149;
          font-size: 12px;
          font-weight: 500;
        }

        .error-message {
          color: #f85149;
          font-size: 11px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .active-transaction {
          color: #4ade80;
          font-size: 12px;
          font-weight: 500;
        }

        .close-btn {
          background: none;
          border: none;
          color: #8b949e;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .close-btn:hover {
          background: #30363d;
          color: #f0f6fc;
        }

        .flow-content {
          flex: 1;
          position: relative;
        }

        .transaction-history {
          padding: 8px 16px;
          background: #0d1117;
          border-top: 1px solid #30363d;
          max-height: 120px;
          overflow-y: auto;
        }

        .transaction-history h4 {
          margin: 0 0 8px 0;
          color: #f0f6fc;
          font-size: 12px;
          font-weight: 600;
        }

        .transaction-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .transaction-item {
          display: flex;
          justify-content: space-between;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-family: monospace;
        }

        .transaction-item.pending { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
        .transaction-item.processing { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .transaction-item.completed { background: rgba(34, 197, 94, 0.1); color: #22c55e; }
        .transaction-item.failed { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

        /* Process Node Styles */
        :global(.process-node) {
          background: #1a1a1a;
          border: 2px solid #333;
          border-radius: 8px;
          padding: 8px;
          min-width: 140px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          transition: all 0.2s ease;
        }

        :global(.process-node.selected) {
          border-color: #60a5fa;
          box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.2);
        }

        :global(.process-node.user) { border-color: #60a5fa; }
        :global(.process-node.coordinator) { border-color: #f59e0b; }
        :global(.process-node.token) { border-color: #ef4444; }
        :global(.process-node.manager) { border-color: #10b981; }

        :global(.node-header) {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        :global(.node-title) {
          color: #f0f6fc;
          font-weight: 600;
          font-size: 12px;
        }

        :global(.environment-badge) {
          padding: 1px 4px;
          background: #30363d;
          color: #8b949e;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 500;
        }

        :global(.node-content) {
          font-size: 11px;
        }

        :global(.process-id) {
          color: #8b949e;
          font-family: monospace;
          margin-bottom: 4px;
        }

        :global(.balance) {
          color: #4ade80;
          font-weight: 600;
          margin-bottom: 4px;
        }

        :global(.status) {
          padding: 1px 4px;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 500;
        }

        :global(.status.deployed) { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        :global(.status.active) { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }

        :global(.activity-indicator) {
          position: absolute;
          top: 4px;
          right: 4px;
        }

        :global(.pulse) {
          width: 8px;
          height: 8px;
          background: #4ade80;
          border-radius: 50%;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        /* Custom React Flow Controls */
        :global(.react-flow__controls) {
          background: #161b22;
          border: 1px solid #30363d;
        }

        :global(.react-flow__controls-button) {
          background: #161b22;
          border-bottom: 1px solid #30363d;
          color: #8b949e;
        }

        :global(.react-flow__controls-button:hover) {
          background: #21262d;
          color: #f0f6fc;
        }

        :global(.react-flow__minimap) {
          background: #161b22;
          border: 1px solid #30363d;
        }

        :global(.react-flow__attribution) {
          background: rgba(13, 17, 23, 0.8);
          color: #8b949e;
          padding: 2px 4px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
