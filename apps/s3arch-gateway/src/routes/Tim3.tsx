import { useState } from 'react'
import { requestMintTIM3 } from '../ao/tim3'
import { useArweaveWallet } from '../wallet/useArweaveWallet'
import { ENVIRONMENT } from '../ao/processes'

export default function Tim3() {
  const { address, isConnected, connect } = useArweaveWallet()
  const [usdaAmount, setUsdaAmount] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const handleSwap = async () => {
    try {
      if (!isConnected) {
        await connect()
      }
      if (!usdaAmount || Number(usdaAmount) <= 0) {
        setStatus('Enter a positive USDA amount')
        return
      }
      setStatus('Submitting swap (USDA -> TIM3)…')
      await requestMintTIM3(usdaAmount)
      setStatus('Swap submitted. Check balances shortly.')
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? 'unknown'}`)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
      <div
        style={{
          width: 'min(720px, 95vw)',
          background: '#111',
          border: '1px solid #333',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
        }}
      >
        <h2 style={{ textAlign: 'center', color: '#c77dff', marginTop: 0 }}>Quantum TIM3</h2>
        
        {/* Environment Indicator */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: 16 
        }}>
          <div style={{ 
            display: 'inline-block',
            padding: '6px 12px',
            backgroundColor: ENVIRONMENT === 'test' ? '#ffc107' : '#28a745',
            color: '#000',
            borderRadius: 4,
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            {ENVIRONMENT === 'test' ? '🧪 TEST MODE' : '🏛️ PRODUCTION MODE'}
          </div>
        </div>

        {/* Send (USDA) */}
        <div
          style={{
            background: '#1c1c1c',
            border: '1px solid #2a2a2a',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16
          }}
        >
          <div style={{ color: '#9aa0a6', fontSize: 12, marginBottom: 8 }}>You send</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              placeholder="0.0"
              value={usdaAmount}
              onChange={(e) => setUsdaAmount(e.target.value)}
              inputMode="decimal"
              style={{
                flex: 1,
                background: '#0f0f0f',
                color: '#eaeaea',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: '14px 12px',
                fontSize: 24,
                outline: 'none'
              }}
            />
            <div
              style={{
                background: '#0f0f0f',
                color: '#cbd5e1',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 96,
                textAlign: 'center'
              }}
            >
              {ENVIRONMENT === 'test' ? '(TEST) USDA' : 'USDA'}
            </div>
          </div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>0.00 | {ENVIRONMENT === 'test' ? '(TEST) USDA' : 'USDA'}</div>
        </div>

        <hr style={{ borderColor: '#222', margin: '18px 0' }} />

        {/* Receive (TIM3) */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(0,80,0,0.5), rgba(0,0,0,0.4))',
            border: '1px solid #016e2f',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16
          }}
        >
          <div style={{ color: '#9aa0a6', fontSize: 12, marginBottom: 8 }}>You receive</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              flex: 1,
              color: '#eaeaea',
              fontSize: 28,
              fontFamily: 'monospace'
            }}>
              {usdaAmount || '0'}
            </div>
            <div
              style={{
                background: '#0f0f0f',
                color: '#cbd5e1',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                padding: '10px 14px',
                minWidth: 96,
                textAlign: 'center'
              }}
            >
              {ENVIRONMENT === 'test' ? '(TEST) TIM3' : 'TIM3'}
            </div>
          </div>
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>0.00 | {ENVIRONMENT === 'test' ? '(TEST) TIM3' : 'TIM3'}</div>
        </div>

        {/* Action Button */}
        {!isConnected ? (
          <button
            onClick={() => connect()}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: '#7c8cff',
              color: '#0b1020',
              border: 'none',
              borderRadius: 24,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: 'pointer'
            }}
          >
            Connect Wander Wallet
          </button>
        ) : (
          <button
            onClick={handleSwap}
            disabled={!usdaAmount || Number(usdaAmount) <= 0}
            style={{
              width: '100%',
              padding: '14px 16px',
              background: !usdaAmount || Number(usdaAmount) <= 0 ? '#333' : '#22c55e',
              color: '#000',
              border: 'none',
              borderRadius: 24,
              fontWeight: 700,
              letterSpacing: 0.5,
              cursor: !usdaAmount || Number(usdaAmount) <= 0 ? 'not-allowed' : 'pointer'
            }}
          >
            Swap to {ENVIRONMENT === 'test' ? '(TEST) TIM3' : 'TIM3'}
          </button>
        )}

        {address && (
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 10, textAlign: 'center' }}>
            Connected: {address.slice(0, 8)}...{address.slice(-8)}
          </div>
        )}

        {status && (
          <div style={{
            marginTop: 14,
            padding: 10,
            border: '1px solid #2a2a2a',
            borderRadius: 8,
            background: '#0d0d0d',
            color: '#cbd5e1',
            fontSize: 13
          }}>
            {status}
          </div>
        )}
      </div>
    </div>
  )
}


