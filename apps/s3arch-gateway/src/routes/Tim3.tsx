import { useState, useEffect } from 'react'
import { requestMintTIM3 } from '../ao/tim3'

export default function Tim3() {
  const [isConnected, setIsConnected] = useState(false)
  const [amount, setAmount] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    // Check if wallet is connected
    const checkConnection = async () => {
      try {
        const wallet = (window as any).arweaveWallet
        if (wallet) {
          const addr = await wallet.getActiveAddress()
          setIsConnected(!!addr)
        }
      } catch (e) {
        setIsConnected(false)
      }
    }
    checkConnection()
  }, [])

  const handleConnect = async () => {
    try {
      const wallet = (window as any).arweaveWallet
      if (!wallet) {
        throw new Error('ArConnect not found')
      }
      await wallet.connect(['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH'])
      setIsConnected(true)
    } catch (e: any) {
      setStatus(`Connection failed: ${e?.message ?? 'unknown'}`)
    }
  }

  const handleMint = async () => {
    try {
      if (!isConnected) {
        await handleConnect()
      }
      setStatus('Submitting MintTIM3…')
      await requestMintTIM3(amount)
      setStatus('MintTIM3 request submitted')
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? 'unknown'}`)
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>TIM3</h2>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button onClick={handleMint}>Mint TIM3</button>
      </div>
      {status && <div style={{ marginTop: 12 }}>{status}</div>}
    </div>
  )
}


