'use client'

import { Holding } from '@/lib/types'

interface HoldingsListProps {
  holdings: Holding[]
  page: number
  setPage: (page: number) => void
  perPage?: number
}

export default function HoldingsList({ holdings, page, setPage, perPage = 5 }: HoldingsListProps) {
  const totalHoldingsUsd = holdings.reduce((s, x) => s + x.balanceUsd, 0)
  const totalPages = Math.ceil(holdings.length / perPage)
  const safePage = Math.min(page, totalPages - 1)
  const pageHoldings = holdings.slice(safePage * perPage, (safePage + 1) * perPage)

  return (
    <div className="space-y-1.5">
      {pageHoldings.map((h) => {
        const pct = totalHoldingsUsd > 0 ? (h.balanceUsd / totalHoldingsUsd) * 100 : 0
        return (
          <div key={h.tokenAddress} className="p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-sm truncate">{h.tokenSymbol}</span>
                <span className="text-[10px] text-muted truncate hidden sm:inline">{h.tokenName}</span>
              </div>
              <span className="text-sm font-semibold text-white whitespace-nowrap ml-2">
                ${h.balanceUsd >= 1000000 ? `${(h.balanceUsd / 1000000).toFixed(1)}M` : h.balanceUsd >= 1000 ? `${(h.balanceUsd / 1000).toFixed(1)}k` : h.balanceUsd.toFixed(0)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <div className="flex-1 mr-3">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500/40 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
              <span className="text-[10px] text-muted whitespace-nowrap">{pct.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] text-muted">
                {h.balance >= 1000000 ? `${(h.balance / 1000000).toFixed(1)}M` : h.balance >= 1000 ? `${(h.balance / 1000).toFixed(1)}k` : h.balance.toFixed(2)} tokens
              </span>
              <a
                href={`https://dexscreener.com/solana/${h.tokenAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] text-muted hover:text-white font-mono"
              >
                {h.tokenAddress.slice(0, 6)}...
              </a>
            </div>
          </div>
        )
      })}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setPage(Math.max(0, safePage - 1))}
            disabled={safePage === 0}
            className="px-2 py-1 text-[10px] border border-border rounded hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span className="text-[10px] text-muted">{safePage + 1} / {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
            disabled={safePage >= totalPages - 1}
            className="px-2 py-1 text-[10px] border border-border rounded hover:border-white/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
      <div className="p-2.5 border-t border-border mt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Total Value</span>
          <span className="text-sm font-semibold text-emerald-400">
            ${totalHoldingsUsd >= 1000000 ? `${(totalHoldingsUsd / 1000000).toFixed(2)}M` : totalHoldingsUsd >= 1000 ? `${(totalHoldingsUsd / 1000).toFixed(1)}k` : totalHoldingsUsd.toFixed(0)}
          </span>
        </div>
      </div>
    </div>
  )
}
