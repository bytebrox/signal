'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'

const CONTRACT_ADDRESS = 'DU6qS6L15J1mtYsxzgSNM4XhB1dfFSB2HK3H2UVHpump'

function shortenAddress(addr: string, head = 6, tail = 6): string {
  if (addr.length <= head + tail) return addr
  return `${addr.slice(0, head)}...${addr.slice(-tail)}`
}

export default function Footer() {
  const [copied, setCopied] = useState(false)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const copyContractAddress = useCallback(async () => {
    if (resetTimeoutRef.current) {
      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }
    try {
      await navigator.clipboard.writeText(CONTRACT_ADDRESS)
      setCopied(true)
      resetTimeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }, [])

  useEffect(() => () => {
    if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current)
  }, [])

  return (
    <footer className="py-8 sm:py-12 px-4 sm:px-8 lg:px-16 border-t border-white/5">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
        <div className="flex items-center gap-3">
          <img src="/logo_w.png" alt="SIGNAL" className="h-6 w-auto" />
          <span className="font-bold text-lg">SIGNAL</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-8 text-sm text-white/40">
          <a href="https://github.com/bytebrox/signal" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          <a href="https://x.com/i/communities/2021579927926059257" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
          <button
            type="button"
            onClick={copyContractAddress}
            className="font-mono text-white/40 hover:text-white/70 active:scale-[0.98] transition-all duration-150 flex items-center gap-1.5"
            title="Copy contract address"
          >
            <span className="select-none">{shortenAddress(CONTRACT_ADDRESS)}</span>
            {copied ? (
              <span className="text-emerald-400 font-sans font-medium text-xs flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </span>
            ) : (
              <svg className="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        <div className="text-sm text-white/30">
          Built for the trenches · 2026
        </div>
      </div>
    </footer>
  )
}
