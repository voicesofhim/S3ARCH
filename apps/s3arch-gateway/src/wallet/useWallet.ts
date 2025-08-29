import { useContext } from 'react'
import { WanderContext } from './WanderContext'

export function useWallet() {
  const ctx = useContext(WanderContext)
  return ctx
}


