'use client'

import { FC, ReactNode, useMemo, useCallback } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { WalletError } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

interface Props {
  children: ReactNode
}

export const WalletProvider: FC<Props> = ({ children }) => {
  // Use mainnet for production
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), [])
  
  // Include PhantomWalletAdapter as legacy fallback.
  // Modern wallets also register via Wallet Standard (auto-detected).
  // The library deduplicates: Wallet Standard takes priority when available.
  // In browsers where Wallet Standard registration fails (e.g. Firefox),
  // the legacy adapter provides a direct connection via window.phantom.solana.
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
  ], [])

  // Log wallet errors for debugging
  const onError = useCallback((error: WalletError) => {
    console.warn('[Wallet] Connection error:', error.message || error)
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect onError={onError}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
