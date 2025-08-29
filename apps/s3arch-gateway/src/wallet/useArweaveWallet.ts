import { useActiveAddress, useConnection, useApi } from '@arweave-wallet-kit/react'

export function useArweaveWallet() {
  const address = useActiveAddress()
  const { connected, connect, disconnect } = useConnection()
  const api = useApi()

  return {
    address,
    isConnected: connected,
    connect,
    disconnect,
    api, // This gives us access to window.arweaveWallet methods
  }
}
