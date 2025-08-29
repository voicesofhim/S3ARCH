import { useContext } from 'react'
import { ArConnectContext } from './ArConnectProvider'

export function useArConnect() {
  const ctx = useContext(ArConnectContext)
  return ctx
}
