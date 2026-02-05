'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'

// Simulated live data for the ticker
const mockWallets = [
  { address: '7xKX...m2Np', pnl: '+847%', token: 'BONK' },
  { address: '3dFv...qL8s', pnl: '+312%', token: 'WIF' },
  { address: '9aHj...nK4p', pnl: '+1,240%', token: 'POPCAT' },
  { address: '2mXc...wR7t', pnl: '+567%', token: 'MYRO' },
  { address: '5pLk...jN3v', pnl: '+923%', token: 'MEW' },
]

export default function Home() {
  const [tickerIndex, setTickerIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((i) => (i + 1) % mockWallets.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="min-h-screen bg-bg">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-bg/90 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            SIGNAL
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how" className="hover:text-white transition-colors">How it works</a>
            <a href="https://github.com/bytebrox/signal" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <Link 
            href="/app" 
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Launch App
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        
        <div className="relative max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 mb-6">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                Live on Solana Mainnet
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
                Track the wallets
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                  making real money
                </span>
              </h1>

              <p className="text-lg text-muted mb-8 leading-relaxed max-w-lg">
                We scan Solana for profitable traders and surface the wallets 
                that consistently win. No noise, no influencers — just on-chain data.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/app"
                  className="group px-6 py-3.5 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-all flex items-center gap-2"
                >
                  Open App
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="#how"
                  className="px-6 py-3.5 border border-border rounded-full hover:bg-white/5 transition-colors font-medium"
                >
                  Learn more
                </Link>
              </div>
            </motion.div>

            {/* Right - Live Preview Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl bg-surface border border-border overflow-hidden">
                {/* Card Header */}
                <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium">Live Discoveries</span>
                  </div>
                  <span className="text-xs text-muted">Updated just now</span>
                </div>
                
                {/* Card Content */}
                <div className="p-5 space-y-3">
                  {mockWallets.map((wallet, i) => (
                    <motion.div
                      key={wallet.address}
                      initial={{ opacity: 0.4 }}
                      animate={{ 
                        opacity: i === tickerIndex ? 1 : 0.4,
                        scale: i === tickerIndex ? 1.02 : 1
                      }}
                      className={`p-4 rounded-xl transition-colors ${
                        i === tickerIndex ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center text-xs font-mono">
                            {wallet.address.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-mono text-sm">{wallet.address}</div>
                            <div className="text-xs text-muted">Found in ${wallet.token}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-emerald-400 font-semibold">{wallet.pnl}</div>
                          <div className="text-xs text-muted">realized</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Card Footer */}
                <div className="px-5 py-4 border-t border-border bg-white/[0.01]">
                  <Link href="/app" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2">
                    View all tracked wallets
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 px-6 border-y border-border bg-surface/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 'Real-time', label: 'On-chain scanning' },
              { value: 'Multi-token', label: 'Pattern detection' },
              { value: 'Solana', label: 'Network support' },
              { value: 'Free', label: 'Open source' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-lg font-semibold mb-1">{stat.value}</div>
                <div className="text-xs text-muted">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How SIGNAL works</h2>
            <p className="text-muted max-w-xl mx-auto">
              Three steps to finding wallets that actually make money
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Scan tokens',
                desc: 'We continuously monitor trending Solana tokens — high volume, price action, new launches.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )
              },
              {
                step: '02',
                title: 'Find winners',
                desc: 'For each token, we extract wallets with realized profits. Not just traders — actual winners.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                )
              },
              {
                step: '03',
                title: 'Track patterns',
                desc: 'Wallets appearing profitable across multiple tokens get flagged. Save them, watch them, follow their moves.',
                icon: (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl bg-surface border border-border group hover:border-emerald-500/30 transition-colors"
              >
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-bg border border-border flex items-center justify-center text-xs font-mono text-muted">
                  {item.step}
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 bg-surface/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for serious traders</h2>
            <p className="text-muted max-w-xl mx-auto">
              Everything you need to find and follow smart money
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Wallet watchlist', desc: 'Save wallets to your personal list. Syncs with your connected wallet.' },
              { title: 'Token history', desc: 'See every token a wallet was found in and their PnL at time of discovery.' },
              { title: 'Performance stats', desc: 'Total PnL, win rate, trade count, and more for each tracked wallet.' },
              { title: 'Manual scans', desc: 'Trigger scans whenever you want. Fresh data on demand.' },
              { title: 'Solana native', desc: 'Connect with Phantom or any Solana wallet. Your data stays with you.' },
              { title: 'Open source', desc: 'Fully transparent. Check the code, run it yourself, contribute.' },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-xl border border-border hover:bg-white/[0.02] transition-colors"
              >
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Start tracking smart money
            </h2>
            <p className="text-lg text-muted mb-8 max-w-xl mx-auto">
              Find the wallets that consistently profit — and follow their next moves.
            </p>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors"
            >
              Launch App
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-semibold">SIGNAL</div>
          <div className="flex items-center gap-6 text-sm text-muted">
            <a href="https://github.com/bytebrox/signal" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>
          <div className="text-sm text-muted">Built on Solana</div>
        </div>
      </footer>
    </main>
  )
}
