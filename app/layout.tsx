import type { Metadata } from 'next'
import './globals.css'
import { WalletProvider } from './providers/WalletProvider'

export const metadata: Metadata = {
  title: 'SIGNAL — Smart Money Intelligence',
  description: 'Track elite wallets. Decode alpha. Move first.',
  icons: { icon: '/favicon.png' },
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
