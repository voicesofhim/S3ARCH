import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsWithChildren } from 'react'

type WalletPermissions = string[]

type WanderContextValue = {
  isReady: boolean
  isConnected: boolean
  permissions: WalletPermissions
  address: string | null
  walletType: 'wander' | 'arconnect' | 'none'
  connect: (perms?: WalletPermissions) => Promise<void>
  disconnect: () => Promise<void>
}

export const WanderContext = createContext<WanderContextValue>({
  isReady: false,
  isConnected: false,
  permissions: [],
  address: null,
  walletType: 'none',
  connect: async () => {},
  disconnect: async () => {},
})

export function WanderProvider({ children }: PropsWithChildren) {
  const wanderRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [permissions, setPermissions] = useState<WalletPermissions>([])
  const [address, setAddress] = useState<string | null>(null)
  const [walletType, setWalletType] = useState<'wander' | 'arconnect' | 'none'>('none')

  const checkWalletState = useCallback(async () => {
    try {
      const api = (window as any).arweaveWallet
      if (api) {
        console.log('Found arweaveWallet API')
        // Check if already connected
        try {
          const addr = await api.getActiveAddress()
          if (addr) {
            setAddress(addr)
            setIsConnected(true)
            // Try to get current permissions if available
            const perms = await api.getPermissions?.() || []
            setPermissions(perms)
            
            // Detect wallet type
            if ((window as any).arweaveWallet?.walletName === 'ArConnect') {
              setWalletType('arconnect')
            } else {
              setWalletType('wander')
            }
          }
        } catch (e) {
          console.log('Not connected yet, that\'s fine')
        }
        setIsReady(true)
      } else {
        console.log('No arweaveWallet API found yet')
        // Still set ready to true so user can try to connect
        setIsReady(true)
      }
    } catch (e) {
      console.warn('Error checking wallet state:', e)
      setIsReady(true)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    console.log('WanderProvider initializing...')
    
    // Try to initialize Wander Connect if available
    const initWander = async () => {
      try {
        const { WanderConnect } = await import('@wanderapp/connect')
        const wander = new WanderConnect({ clientId: 'FREE_TRIAL' })
        if (mounted) {
          wanderRef.current = wander
          console.log('Wander Connect initialized')
        }
      } catch (e) {
        console.warn('Failed to initialize Wander Connect:', e)
      }
    }
    
    initWander()

    const handleLoaded = async (e: any) => {
      if (!mounted) return
      console.log('arweaveWalletLoaded event received', e)
      try {
        const perms: WalletPermissions = (e?.detail?.permissions as string[]) || []
        setPermissions(perms)
        setIsReady(true)
        
        if (perms.length > 0) {
          const api = (window as any).arweaveWallet
          if (api?.getActiveAddress) {
            const addr = await api.getActiveAddress()
            if (addr) {
              setAddress(addr)
              setIsConnected(true)
              setWalletType('wander')
            }
          }
        }
      } catch (e) {
        console.warn('Error in arweaveWalletLoaded handler:', e)
        setIsReady(true)
      }
    }

    window.addEventListener('arweaveWalletLoaded', handleLoaded)

    // Check if wallet is already available
    setTimeout(() => {
      if (mounted) {
        console.log('Checking wallet state...')
        checkWalletState()
      }
    }, 100)

    // Also check periodically for ArConnect
    const checkInterval = setInterval(() => {
      if (mounted && !isConnected) {
        checkWalletState()
      }
    }, 2000)

    return () => {
      mounted = false
      clearInterval(checkInterval)
      try { 
        wanderRef.current?.destroy() 
      } catch (e) {
        console.warn('Error destroying Wander Connect:', e)
      }
      wanderRef.current = null
      window.removeEventListener('arweaveWalletLoaded', handleLoaded)
    }
  }, [checkWalletState, isConnected])

  const connect = useCallback(async (perms?: WalletPermissions) => {
    try {
      const requested = perms ?? ['ACCESS_ADDRESS', 'SIGN_TRANSACTION', 'DISPATCH']
      const api = (window as any).arweaveWallet
      
      if (!api) {
        throw new Error('No Arweave wallet found. Please install ArConnect or Wander wallet extension.')
      }

      console.log('Attempting to connect with permissions:', requested)
      await api.connect(requested)
      const addr = await api.getActiveAddress()
      
      if (addr) {
        setAddress(addr)
        setIsConnected(true)
        setPermissions(requested)
        
        // Detect wallet type
        if (api.walletName === 'ArConnect') {
          setWalletType('arconnect')
        } else {
          setWalletType('wander')
        }
        console.log('Successfully connected:', addr)
      } else {
        throw new Error('Failed to get wallet address after connection')
      }
    } catch (e: any) {
      console.error('Wallet connection error:', e)
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
      setWalletType('none')
      console.log('Disconnected from wallet')
    } catch (e) {
      console.warn('Error disconnecting wallet:', e)
      // Still update state even if disconnect fails
      setIsConnected(false)
      setAddress(null)
      setPermissions([])
      setWalletType('none')
    }
  }, [])

  const value = useMemo<WanderContextValue>(() => ({
    isReady,
    isConnected,
    permissions,
    address,
    walletType,
    connect,
    disconnect,
  }), [isReady, isConnected, permissions, address, walletType, connect, disconnect])

  return (
    <WanderContext.Provider value={value}>{children}</WanderContext.Provider>
  )
}


