import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from './providers/WalletProvider'

export const metadata: Metadata = {
  title: 'SIGNAL — Smart Money Intelligence',
  description: 'Follow the insiders. Track wallets that consistently profit on Solana before everyone else catches on.',
  icons: { 
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  metadataBase: new URL('https://justasignal.com'),
  openGraph: {
    title: 'SIGNAL — Smart Money Intelligence',
    description: 'Follow the insiders. Track wallets that consistently profit on Solana.',
    type: 'website',
    siteName: 'SIGNAL',
    url: 'https://justasignal.com',
    images: ['/banner.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIGNAL — Smart Money Intelligence',
    description: 'Follow the insiders. Track wallets that consistently profit on Solana.',
    images: ['/banner.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
