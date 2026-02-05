'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

const sections = [
  { id: 'intro', title: 'Introduction' },
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'wallets', title: 'Wallet Tracking' },
  { id: 'alerts', title: 'Alerts' },
  { id: 'api', title: 'API Reference' },
  { id: 'faq', title: 'FAQ' },
]

export default function Docs() {
  const [active, setActive] = useState('intro')

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-border sticky top-0 bg-bg/80 backdrop-blur-xl z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-semibold tracking-tight">
              SIGNAL
            </Link>
            <span className="text-muted">/</span>
            <span className="text-muted">Documentation</span>
          </div>
          <Link 
            href="/app" 
            className="px-5 py-2.5 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
          >
            Launch App
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[240px_1fr] gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActive(section.id)}
                  className={`block w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors ${
                    active === section.id 
                      ? 'bg-white/5 text-white' 
                      : 'text-muted hover:text-white'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert max-w-none"
            >
              <section id="intro" className="mb-16">
                <h1 className="text-4xl font-bold tracking-tight mb-6">Introduction</h1>
                <p className="text-lg text-muted leading-relaxed mb-6">
                  SIGNAL is a smart money intelligence platform that identifies and tracks 
                  consistently profitable wallets on Solana. Our algorithm analyzes millions 
                  of transactions to surface wallets with exceptional track records.
                </p>
                <div className="p-6 rounded-xl bg-surface border border-border">
                  <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2 text-muted">
                    <li className="flex items-start gap-3">
                      <span className="text-white">◈</span>
                      Algorithmic wallet discovery based on on-chain performance
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white">◈</span>
                      Real-time transaction monitoring and alerts
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white">◈</span>
                      Deep analytics on wallet behavior and strategies
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-white">◈</span>
                      One-click copy trading integration
                    </li>
                  </ul>
                </div>
              </section>

              <section id="getting-started" className="mb-16">
                <h2 className="text-3xl font-bold tracking-tight mb-6">Getting Started</h2>
                <p className="text-muted leading-relaxed mb-6">
                  To access SIGNAL's full features, you need to hold a minimum amount of 
                  $SIGNAL tokens in your connected wallet.
                </p>
                
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">Step 1: Connect Wallet</h4>
                    <p className="text-muted text-sm">
                      Click "Connect Wallet" and select your preferred Solana wallet 
                      (Phantom, Solflare, or Backpack).
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">Step 2: Hold $SIGNAL</h4>
                    <p className="text-muted text-sm">
                      Ensure you hold at least 10,000 $SIGNAL tokens to unlock dashboard access.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">Step 3: Start Tracking</h4>
                    <p className="text-muted text-sm">
                      Browse our curated list of smart money wallets and click "Track" 
                      to add them to your watchlist.
                    </p>
                  </div>
                </div>
              </section>

              <section id="wallets" className="mb-16">
                <h2 className="text-3xl font-bold tracking-tight mb-6">Wallet Tracking</h2>
                <p className="text-muted leading-relaxed mb-6">
                  SIGNAL's core feature is the ability to track elite wallets in real-time. 
                  Here's how our wallet scoring system works:
                </p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 font-semibold">Metric</th>
                        <th className="text-left py-4 font-semibold">Weight</th>
                        <th className="text-left py-4 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted">
                      <tr className="border-b border-border">
                        <td className="py-4">Win Rate</td>
                        <td className="py-4">30%</td>
                        <td className="py-4">Percentage of profitable trades</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-4">Avg. Return</td>
                        <td className="py-4">25%</td>
                        <td className="py-4">Average return per trade</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-4">Consistency</td>
                        <td className="py-4">20%</td>
                        <td className="py-4">Performance stability over time</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-4">Volume</td>
                        <td className="py-4">15%</td>
                        <td className="py-4">Trading volume (filters out noise)</td>
                      </tr>
                      <tr>
                        <td className="py-4">Early Entry</td>
                        <td className="py-4">10%</td>
                        <td className="py-4">Ability to enter tokens early</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section id="alerts" className="mb-16">
                <h2 className="text-3xl font-bold tracking-tight mb-6">Alerts</h2>
                <p className="text-muted leading-relaxed mb-6">
                  Never miss a move. Configure alerts to notify you instantly when 
                  tracked wallets make transactions.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <div className="text-2xl mb-3">◉</div>
                    <h4 className="font-semibold mb-2">Telegram</h4>
                    <p className="text-muted text-sm">
                      Instant alerts via Telegram bot with trade details and quick links.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <div className="text-2xl mb-3">◈</div>
                    <h4 className="font-semibold mb-2">Discord</h4>
                    <p className="text-muted text-sm">
                      Webhook integration for your Discord server or DMs.
                    </p>
                  </div>
                </div>
              </section>

              <section id="api" className="mb-16">
                <h2 className="text-3xl font-bold tracking-tight mb-6">API Reference</h2>
                <p className="text-muted leading-relaxed mb-6">
                  Access SIGNAL data programmatically via our REST API. Available for 
                  premium tier holders.
                </p>
                
                <div className="p-6 rounded-xl bg-surface border border-border font-mono text-sm">
                  <div className="text-muted mb-2"># Get tracked wallets</div>
                  <div className="text-emerald-400 mb-4">
                    GET /api/v1/wallets
                  </div>
                  <div className="text-muted mb-2"># Get wallet details</div>
                  <div className="text-emerald-400 mb-4">
                    GET /api/v1/wallets/:address
                  </div>
                  <div className="text-muted mb-2"># Get recent trades</div>
                  <div className="text-emerald-400">
                    GET /api/v1/trades?limit=50
                  </div>
                </div>
              </section>

              <section id="faq" className="mb-16">
                <h2 className="text-3xl font-bold tracking-tight mb-6">FAQ</h2>
                
                <div className="space-y-4">
                  {[
                    { 
                      q: 'How are wallets selected?', 
                      a: 'Our algorithm analyzes on-chain data to identify wallets with consistent profitability over time. We look at win rate, average returns, and early entry patterns.' 
                    },
                    { 
                      q: 'How fast are alerts?', 
                      a: 'Alerts are typically delivered within 500ms-2s of transaction confirmation on Solana.' 
                    },
                    { 
                      q: 'Can I suggest wallets to track?', 
                      a: 'Yes! Premium members can submit wallet addresses for review. If they meet our criteria, they\'ll be added to the public tracker.' 
                    },
                    { 
                      q: 'Is this financial advice?', 
                      a: 'No. SIGNAL provides data and analytics only. Always do your own research before trading.' 
                    },
                  ].map((faq, i) => (
                    <div key={i} className="p-6 rounded-xl bg-surface border border-border">
                      <h4 className="font-semibold mb-2">{faq.q}</h4>
                      <p className="text-muted text-sm">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          </main>
        </div>
      </div>
    </div>
  )
}
