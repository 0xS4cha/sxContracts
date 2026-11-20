import { useCallback, useEffect, useState } from 'react'
import { MOCK_BOARD } from '../data/mockBoard'
import type { BoardData, Contract, ContractPaper, CreateContractPayload } from '../types/contracts'
import { fetchNui } from '../utils/fetchNui'
import { isEnvBrowser } from '../utils/nui'

export function useBoard(visible: boolean) {
  const [board, setBoard] = useState<BoardData | null>(isEnvBrowser() ? MOCK_BOARD : null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedAt, setLoadedAt] = useState(() => Date.now())
  const [clock, setClock] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setClock(Date.now()), 15000)
    return () => window.clearInterval(id)
  }, [])

  const refresh = useCallback(async () => {
    if (isEnvBrowser()) return
    setLoading(true)
    try {
      setBoard(await fetchNui<BoardData>('getBoard'))
      setLoadedAt(Date.now())
      setClock(Date.now())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(() => void refresh(), 0)
    return () => window.clearTimeout(id)
  }, [visible, refresh])

  const run = useCallback(async (event: string, data: unknown) => {
    if (isEnvBrowser()) return true
    try {
      await fetchNui(event, data)
      setError(null)
      await refresh()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unknown')
      return false
    }
  }, [refresh])

  const serverNow = board ? board.now + Math.floor((clock - loadedAt) / 1000) : Math.floor(clock / 1000)

  return {
    board,
    loading,
    error,
    clearError: () => setError(null),
    refresh,
    serverNow,
    create: (payload: CreateContractPayload) => run('createContract', payload),
    accept: (id: number) => run('acceptContract', { id }),
    abandon: (id: number) => run('abandonContract', { id }),
    complete: (id: number) => run('completeContract', { id }),
    cancel: (id: number, admin = false) => run('cancelContract', { id, admin }),
    setWaypoint: (location: { x: number; y: number }) => void fetchNui('setWaypoint', location),
    getPaper: async (contract: Contract): Promise<ContractPaper | null> => {
      if (isEnvBrowser()) {
        return {
          ...contract,
          poster: contract.poster.name,
          contractor: contract.contractor?.name ?? null,
          place: contract.location ? { street: 'Route 68', zone: 'Sandy Shores' } : null,
        }
      }
      try {
        return await fetchNui<ContractPaper>('getPaper', { id: contract.id })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'unknown')
        return null
      }
    },
  }
}
