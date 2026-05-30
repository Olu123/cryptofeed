'use client'
import { useEffect, useState } from 'react'

interface CoinPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
}

const COINS = [
  { id: 'bitcoin', symbol: 'BTC', icon: '₿' },
  { id: 'ethereum', symbol: 'ETH', icon: 'Ξ' },
  { id: 'solana', symbol: 'SOL', icon: '◎' },
  { id: 'binancecoin', symbol: 'BNB', icon: '⬡' },
  { id: 'ripple', symbol: 'XRP', icon: '✕' },
  { id: 'cardano', symbol: 'ADA', icon: '₳' },
  { id: 'avalanche-2', symbol: 'AVAX', icon: '🔺' },
  { id: 'chainlink', symbol: 'LINK', icon: '⬡' },
]

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
  if (price >= 1) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${price.toFixed(4)}`
}

export default function PriceTicker() {
  const [prices, setPrices] = useState<CoinPrice[]>([])
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = COINS.map(c => c.id).join(',')
        const res = await fetch(
          `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
          { next: { revalidate: 60 } }
        )
        if (!res.ok) throw new Error('Failed')
        const data = await res.json()
        setPrices(data)
        setError(false)
      } catch {
        setError(true)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 60_000) // refresh every 60s
    return () => clearInterval(interval)
  }, [])

  if (error || prices.length === 0) return null

  // Duplicate for seamless scroll loop
  const items = [...prices, ...prices]

  return (
    <div className="bg-gray-900 dark:bg-gray-950 border-b border-gray-800 overflow-hidden h-8 flex items-center">
      <div className="flex animate-ticker whitespace-nowrap">
        {items.map((coin, i) => {
          const coinMeta = COINS.find(c => c.id === coin.id)
          const isUp = coin.price_change_percentage_24h >= 0
          return (
            <span key={`${coin.id}-${i}`} className="inline-flex items-center gap-1.5 px-5 text-xs">
              <span className="text-gray-400 font-medium">{coinMeta?.icon} {coin.symbol.toUpperCase()}</span>
              <span className="text-white font-mono">{formatPrice(coin.current_price)}</span>
              <span className={`font-semibold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '▲' : '▼'} {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
              </span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
