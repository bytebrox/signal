'use client'

import { FC, ReactNode, useMemo } from 'react'
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css'

interface Props {
  children: ReactNode
}

export const WalletProvider: FC<Props> = ({ children }) => {
  // Use mainnet for production
  const endpoint = useMemo(() => clusterApiUrl('mainnet-beta'), [])
  
  // Modern wallets (Phantom, Solflare, Backpack, etc.) register themselves
  // via the Wallet Standard protocol and are auto-detected.
  // No manual adapters needed — passing an empty array avoids conflicts
  // that caused Phantom to fail in some browsers (e.g. Firefox).
  const wallets = useMemo(() => [], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}
