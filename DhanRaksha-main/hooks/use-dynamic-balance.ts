import { useEffect, useState } from 'react'

/**
 * Hook to provide real-time balance updates
 * Automatically refreshes balance when transactions change
 */
export function useDynamicBalance(userId?: string) {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/account')
      if (!response.ok) {
        throw new Error('Failed to fetch balance')
      }
      
      const data = await response.json()
      setBalance(data.balance)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch
  useEffect(() => {
    fetchBalance()
  }, [userId])

  // Function to manually refresh balance
  const refreshBalance = () => {
    fetchBalance()
  }

  return {
    balance,
    loading,
    error,
    refreshBalance
  }
}
