import { useState, useEffect } from 'react'
import { useArweaveWallet } from '../wallet/useArweaveWallet'
import { TIM3_PROCESSES } from '../ao/processes'
import { queryBalance } from '../ao/client'
import { mintTestUSDA, getUSDABalance, getCoordinatorStatus, configureCoordinator, getCoordinatorConfig } from '../ao/tim3'

export default function Home() {
  const { address, isConnected, connect, disconnect } = useArweaveWallet()
  const [tim3Balance, setTim3Balance] = useState<string | null>(null)
  const [usdaBalance, setUsdaBalance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const fetchTim3Balance = async () => {
    try {
      if (!isConnected) await connect()
      if (!address) {
        setStatus('Error: No wallet address available')
        return
      }
      
      setStatus('Requesting TIM3 balance...')
      setError(null)
      
      const balance = await queryBalance(
        TIM3_PROCESSES.tokenManager.processId,
        TIM3_PROCESSES.tokenManager.scheduler,
        address
      )
      
      setTim3Balance(balance)
      setStatus('✅ TIM3 balance retrieved successfully')
    } catch (e: any) {
      const errorMsg = `Balance query failed: ${e?.message ?? 'unknown'}`
      setStatus(errorMsg)
      setError(errorMsg)
      setTim3Balance(null)
    }
  }

  const fetchUsdaBalance = async () => {
    try {
      if (!isConnected) await connect()
      if (!address) {
        setStatus('Error: No wallet address available')
        return
      }
      
      setStatus('Requesting USDA balance...')
      setError(null)
      
      const balance = await queryBalance(
        TIM3_PROCESSES.mockUsda.processId,
        TIM3_PROCESSES.mockUsda.scheduler,
        address
      )
      
      setUsdaBalance(balance)
      setStatus('✅ USDA balance retrieved successfully')
    } catch (e: any) {
      const errorMsg = `USDA balance query failed: ${e?.message ?? 'unknown'}`
      setStatus(errorMsg)
      setError(errorMsg)
      setUsdaBalance(null)
    }
  }

  const mintUSDATokens = async () => {
    try {
      if (!isConnected) await connect()
      
      setError(null)
      setStatus('Minting 1000 test USDA tokens...')
      
      const messageId = await mintTestUSDA('1000')
      setStatus(`✅ USDA mint request sent! (Message ID: ${messageId.slice(0, 8)}...)`)
      
      // Auto-refresh USDA balance after a short delay
      setTimeout(() => {
        fetchUsdaBalance()
      }, 2000)
    } catch (e: any) {
      const errorMsg = `USDA mint failed: ${e?.message ?? 'unknown'}`
      setStatus(errorMsg)
      setError(errorMsg)
    }
  }

  const handleConnect = async () => {
    try {
      setError(null)
      setStatus('Opening Wander...')
      await connect()
      setStatus('✅ Connected successfully!')
    } catch (e: any) {
      const errorMsg = `Connection failed: ${e?.message ?? 'unknown'}`
      setStatus(errorMsg)
      setError(errorMsg)
    }
  }

  const checkCoordinatorStatus = async () => {
    try {
      setStatus('Checking coordinator status...')
      const statusId = await getCoordinatorStatus()
      setStatus(`Coordinator status request sent: ${statusId.slice(0, 8)}...`)
    } catch (e: any) {
      setStatus(`Coordinator status error: ${e?.message ?? 'unknown'}`)
    }
  }

  const configureCoordinatorProcess = async () => {
    try {
      setStatus('Configuring coordinator with production USDA process...')
      const configId = await configureCoordinator()
      setStatus(`✅ Coordinator configuration sent: ${configId.slice(0, 8)}...`)
    } catch (e: any) {
      setStatus(`❌ Coordinator config error: ${e?.message ?? 'unknown'}`)
    }
  }

  const checkCoordinatorConfig = async () => {
    try {
      setStatus('Checking coordinator configuration...')
      const configId = await getCoordinatorConfig()
      setStatus(`Coordinator config request sent: ${configId.slice(0, 8)}...`)
    } catch (e: any) {
      setStatus(`Coordinator config check error: ${e?.message ?? 'unknown'}`)
    }
  }

  // Auto-load balances when wallet connects
  useEffect(() => {
    const loadBalances = async () => {
      if (isConnected && address) {
        setStatus('Loading balances...')
        try {
          await Promise.all([
            fetchTim3Balance(),
            fetchUsdaBalance()
          ])
          setStatus('✅ Balances loaded')
        } catch {
          setStatus('⚠️ Some balances failed to load')
        }
      }
    }
    
    loadBalances()
  }, [isConnected, address])

  return (
    <div style={{ padding: 24 }}>
      <h2>S3ARCH Gateway</h2>
      
      <div style={{ marginBottom: 16 }}>
        <strong>Wallet Status:</strong>
        {!isConnected && <span> Ready (not connected)</span>}
        {isConnected && <span> Connected</span>}
      </div>

      {/* Debug info */}
      <div style={{ marginBottom: 16, fontSize: '0.9em', color: '#666' }}>
        <div>Connected: {isConnected ? 'Yes' : 'No'}</div>
        {address && <div>Address: {address.slice(0, 8)}...{address.slice(-8)}</div>}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      </div>

      {/* Wander modal will guide install if needed */}

      <div style={{ marginBottom: 16 }}>
        {!isConnected && (
          <button 
            onClick={handleConnect} 
            style={{ 
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Connect Wander
          </button>
        )}
        {isConnected && (
          <div>
            <div style={{ marginBottom: 8 }}>
              <strong>Connected:</strong> {address?.slice(0, 8)}...{address?.slice(-8)}
            </div>
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => disconnect()} style={{ padding: '8px 16px', marginRight: 8 }}>
                Disconnect
              </button>
            </div>
            
            {/* Balance Display Section */}
            <div style={{ 
              marginBottom: 24, 
              padding: 16, 
              backgroundColor: '#1a1a1a', 
              borderRadius: 8,
              border: '1px solid #333'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: 16 }}>💰 Token Balances</h3>
              
              <div style={{ display: 'flex', gap: 24, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: 4 }}>USDA Balance</div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: usdaBalance && usdaBalance !== '0' ? '#28a745' : '#666',
                    fontFamily: 'monospace'
                  }}>
                    {usdaBalance || '0'} USDA
                  </div>
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', color: '#888', marginBottom: 4 }}>TIM3 Balance</div>
                  <div style={{ 
                    fontSize: '20px', 
                    fontWeight: 'bold', 
                    color: tim3Balance && tim3Balance !== '0' ? '#ffc107' : '#666',
                    fontFamily: 'monospace'
                  }}>
                    {tim3Balance || '0'} TIM3
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button 
                  disabled
                  title="Production USDA cannot be minted - acquire USDA tokens through exchanges"
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#6c757d',
                    color: '#aaa',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'not-allowed',
                    opacity: 0.6
                  }}
                >
                  🏦 Production USDA (No Mint)
                </button>
                <button 
                  onClick={fetchUsdaBalance} 
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Refresh USDA
                </button>
                <button 
                  onClick={fetchTim3Balance} 
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer'
                  }}
                >
                  Refresh TIM3
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {status && (
        <div style={{ 
          marginTop: 16, 
          padding: 8, 
          backgroundColor: status.includes('Error') ? '#ffebee' : '#e8f5e8',
          border: `1px solid ${status.includes('Error') ? '#f44336' : '#4caf50'}`,
          borderRadius: 4,
          fontSize: '0.9em'
        }}>
          {status}
        </div>
      )}

                <div style={{ marginTop: 24 }}>
            <h3>🔧 Debug Tools</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: 16, flexWrap: 'wrap' }}>
              <button onClick={checkCoordinatorStatus} style={{ padding: '8px 16px' }}>
                Check Coordinator Status
              </button>
              <button onClick={checkCoordinatorConfig} style={{ padding: '8px 16px' }}>
                Check Config
              </button>
              <button onClick={configureCoordinatorProcess} style={{ padding: '8px 16px', backgroundColor: '#ff6b35', color: '#000' }}>
                🔧 Configure Coordinator
              </button>
            </div>
            <div style={{ fontSize: '0.8em', color: '#666', marginBottom: 16 }}>
              <strong>💡 If TIM3 minting fails:</strong> Click "🔧 Configure Coordinator" to link it with production USDA process
            </div>
            <a href="/tim3" style={{ textDecoration: 'underline' }}>
              → Go to TIM3 Mint Page
            </a>
          </div>


        </div>
      )
    }


