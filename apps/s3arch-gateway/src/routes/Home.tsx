import { useState } from 'react'
import { useArweaveWallet } from '../wallet/useArweaveWallet'
import { TIM3_PROCESSES } from '../ao/processes'
import { queryBalance } from '../ao/client'

export default function Home() {
  const { address, isConnected, connect, disconnect } = useArweaveWallet()
  const [tim3Balance, setTim3Balance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const fetchTim3Balance = async () => {
    try {
      if (!isConnected) await connect()
      if (!address) {
        setStatus('Error: No wallet address available')
        return
      }
      
      setStatus('Requesting balance...')
      setError(null)
      
      const balance = await queryBalance(
        TIM3_PROCESSES.tokenManager.processId,
        TIM3_PROCESSES.tokenManager.scheduler,
        address
      )
      
      setTim3Balance(balance)
      setStatus('✅ Balance retrieved successfully')
    } catch (e: any) {
      const errorMsg = `Balance query failed: ${e?.message ?? 'unknown'}`
      setStatus(errorMsg)
      setError(errorMsg)
      setTim3Balance(null)
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
            <div>
              <button onClick={() => disconnect()} style={{ padding: '4px 12px', marginRight: 8 }}>
                Disconnect
              </button>
              <button onClick={fetchTim3Balance} style={{ padding: '4px 12px' }}>
                Get TIM3 Balance
              </button>
            </div>
            {tim3Balance && (
              <div style={{ marginTop: 8 }}>
                <strong>TIM3 Balance:</strong> {tim3Balance}
              </div>
            )}
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
            <a href="/tim3" style={{ textDecoration: 'underline' }}>
              → Go to TIM3 Mint Page
            </a>
          </div>


        </div>
      )
    }


