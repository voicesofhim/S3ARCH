import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

type WalletPermissions = string[]

type ArConnectContextValue = {
  isReady: boolean
  isConnected: boolean
  permissions: WalletPermissions
  address: string | null
  walletName: string | null
  connect: (perms?: WalletPermissions) => Promise<void>
  disconnect: () => Promise<void>
}

export const ArConnectContext = createContext<ArConnectContextValue>({
  isReady: false,
  isConnected: false,
  permissions: [],
  address: null,
  walletName: null,
  connect: async () => {},
  disconnect: async () => {},
})

export function ArConnectProvider({ children }: PropsWithChildren) {
  const [isReady, setIsReady] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [permissions, setPermissions] = useState<WalletPermissions>([])
  const [address, setAddress] = useState<string | null>(null)
  const [walletName, setWalletName] = useState<string | null>(null)

  const checkWalletState = useCallback(async () => {
    try {
      const api = (window as any).arweaveWallet
      if (api) {
        console.log('ArConnect: Found arweaveWallet API')
        setWalletName(api.walletName || 'Unknown')
        
        // Check if already connected
        try {
          const addr = await api.getActiveAddress()
          if (addr) {
            console.log('ArConnect: Already connected to', addr)
            setAddress(addr)
            setIsConnected(true)
            // Try to get current permissions if available
            const perms = await api.getPermissions?.() || []
            setPermissions(perms)
          }
        } catch (e) {
          console.log('ArConnect: Not connected yet')
        }
        setIsReady(true)
      } else {
        console.log('ArConnect: No arweaveWallet API found')
        setIsReady(true) // Still set ready so user can see the connect button
      }
    } catch (e) {
      console.warn('ArConnect: Error checking wallet state:', e)
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    console.log('ArConnect: Provider initializing...')

    const handleLoaded = async () => {
      if (!mounted) return
      console.log('ArConnect: arweaveWalletLoaded event received')
      if (mounted) {
        await checkWalletState()
      }
    }

    // Listen for wallet loaded event
    window.addEventListener('arweaveWalletLoaded', handleLoaded)
    window.addEventListener('walletSwitch', handleLoaded)

    // Check immediately
    setTimeout(() => {
      if (mounted) {
        console.log('ArConnect: Initial wallet check...')
        checkWalletState()
      }
    }, 100)

    // Also check periodically for wallet availability
    const checkInterval = setInterval(() => {
      if (mounted && !isReady) {
        checkWalletState()
      }
    }, 1000)

    return () => {
      mounted = false
      clearInterval(checkInterval)
      window.removeEventListener('arweaveWalletLoaded', handleLoaded)
      window.removeEventListener('walletSwitch', handleLoaded)
    }
  }, [checkWalletState, isReady])

  const connect = useCallback(async (perms?: WalletPermissions) => {
    try {
      const requested = perms ?? ['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']
      const api = (window as any).arweaveWallet
      
      if (!api) {
        throw new Error('No Arweave wallet found. Please install ArConnect extension from https://arconnect.io')
      }

      console.log('ArConnect: Attempting to connect with permissions:', requested)
      await api.connect(requested)
      
      // Wait a moment for connection to establish
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const addr = await api.getActiveAddress()
      
      if (addr) {
        setAddress(addr)
        setIsConnected(true)
        setPermissions(requested)
        setWalletName(api.walletName || 'ArConnect')
        console.log('ArConnect: Successfully connected:', addr)
      } else {
        throw new Error('Failed to get wallet address after connection')
      }
    } catch (e: any) {
      console.error('ArConnect: Connection error:', e)
      throw new Error(e.message || 'Failed to connect wallet')
    }
  }, [])

  const disconnect = useCallback(async () => {
    try {
      const api = (window as any).arweaveWallet
      if (api?.disconnect) {
        await api.disconnect()
      }
      setIsConnected(false)
      setAddress(null)
      setPermissions([])
      console.log('ArConnect: Disconnected from wallet')
    } catch (e) {
      console.warn('ArConnect: Error disconnecting wallet:', e)
      // Still update state even if disconnect fails
      setIsConnected(false)
      setAddress(null)
      setPermissions([])
    }
  }, [])

  const value = useMemo<ArConnectContextValue>(() => ({
    isReady,
    isConnected,
    permissions,
    address,
    walletName,
    connect,
    disconnect,
  }), [isReady, isConnected, permissions, address, walletName, connect, disconnect])

  return (
    <ArConnectContext.Provider value={value}>{children}</ArConnectContext.Provider>
  )
}
