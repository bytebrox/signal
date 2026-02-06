'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'

const sections = [
  { id: 'intro', title: 'Introduction' },
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'scanning', title: 'How It Works' },
  { id: 'wallets', title: 'Wallet Tracking' },
  { id: 'faq', title: 'FAQ' },
]

export default function Docs() {
  const [active, setActive] = useState('intro')
  const isClickScrolling = useRef(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const scrollToSection = (id: string) => {
    setActive(id)
    isClickScrolling.current = true
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    // Re-enable observer after scroll animation finishes
    setTimeout(() => { isClickScrolling.current = false }, 800)
  }

  // Scroll listener to track which section is in view
  useEffect(() => {
    let ticking = false
    
    const updateActive = () => {
      if (isClickScrolling.current) { ticking = false; return }
      
      const scrollY = window.pageYOffset || document.documentElement.scrollTop
      let current = sections[0].id
      
      for (const { id } of sections) {
        const el = document.getElementById(id)
        if (el) {
          // Use offsetTop which is relative to the document
          const sectionTop = el.offsetTop - 180
          if (scrollY >= sectionTop) {
            current = id
          }
        }
      }
      
      setActive(current)
      ticking = false
    }

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateActive)
        ticking = true
      }
    }

    document.addEventListener('scroll', handleScroll, true)
    window.addEventListener('scroll', handleScroll)
    updateActive()
    
    return () => {
      document.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      <Nav
        activePage="docs"
        rightContent={
          <Link 
            href="/app" 
            className="px-4 sm:px-5 py-2 sm:py-2.5 bg-white text-black text-xs sm:text-sm font-medium rounded-full hover:bg-white/90 transition-colors flex-shrink-0"
          >
            Launch App
          </Link>
        }
        secondaryNav={
          <div className="lg:hidden border-t border-border overflow-x-auto scrollbar-hide">
            <div className="flex px-4 sm:px-6">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`px-3 py-2.5 text-xs whitespace-nowrap font-medium transition-colors border-b-2 ${
                    active === section.id 
                      ? 'text-emerald-400 border-emerald-500' 
                      : 'text-muted border-transparent hover:text-white'
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="px-4 sm:px-8 lg:px-16 py-6 sm:py-12">
        <div className="grid lg:grid-cols-[240px_1fr] gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
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
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-4 sm:mb-6">Introduction</h1>
                <p className="text-base sm:text-lg text-muted leading-relaxed mb-4 sm:mb-6">
                  SIGNAL is a smart money intelligence platform that identifies and tracks 
                  consistently profitable wallets on Solana. Our scanner finds trending tokens 
                  and extracts the wallets behind the biggest wins.
                </p>
                <div className="p-6 rounded-xl bg-surface border border-border">
                  <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                  <ul className="space-y-2 text-muted">
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500">◈</span>
                      Automated discovery of profitable wallets from trending tokens
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500">◈</span>
                      Strict filters — only wallets with exceptional realized profits
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500">◈</span>
                      30-day PnL charts and detailed trade history per wallet
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500">◈</span>
                      Personal watchlist with nicknames and favorites
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500">◈</span>
                      Search by address, filter by tags, export as CSV
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500">◈</span>
                      Fully open source — run it yourself or contribute
                    </li>
                  </ul>
                </div>
              </section>

              <section id="getting-started" className="mb-16">
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">Getting Started</h2>
                
                <div className="space-y-4">
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">Step 1: Connect Wallet</h4>
                    <p className="text-muted text-sm">
                      Click "Launch App" and connect your Solana wallet (Phantom, Solflare, or Backpack).
                      Your wallet address is used to save your preferences and favorites.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">Step 2: Browse Wallets</h4>
                    <p className="text-muted text-sm">
                      The dashboard shows all discovered wallets sorted by profit. Use the search bar 
                      to find specific addresses, filter by tags like "Smart Money" or "Whale", 
                      and narrow results by time range.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">Step 3: Track Favorites</h4>
                    <p className="text-muted text-sm">
                      Click "Track" on any wallet to save it to your personal watchlist.
                      Give it a custom nickname, view detailed PnL charts, and check its 
                      full token history in the Wallets tab.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">Step 4: Export Data</h4>
                    <p className="text-muted text-sm">
                      Use the CSV export button in the dashboard to download the current 
                      wallet list for your own analysis.
                    </p>
                  </div>
                </div>
              </section>

              <section id="scanning" className="mb-16">
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">How It Works</h2>
                <p className="text-muted leading-relaxed mb-6">
                  SIGNAL uses a two-step process to discover the most profitable wallets on Solana:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">1. Find Trending Tokens</h4>
                    <p className="text-muted text-sm">
                      We continuously scan Solana for tokens that are gaining traction — based on 
                      trading volume, liquidity, and market activity. Only tokens that pass our 
                      quality filters are analyzed further.
                    </p>
                  </div>
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">2. Extract Top Traders</h4>
                    <p className="text-muted text-sm mb-3">
                      For each trending token, we look at who traded it and how well they did.
                      Only wallets that meet strict criteria make it into the database:
                    </p>
                    <ul className="space-y-1.5 text-muted text-sm">
                      <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> High realized profit percentage</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Significant profit in dollar terms</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Recently active (not dormant wallets)</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Real purchases — not just token transfers</li>
                      <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Reasonable position sizes</li>
                    </ul>
                  </div>
                  <div className="p-6 rounded-xl bg-surface border border-border">
                    <h4 className="font-semibold mb-2">3. Continuous Growth</h4>
                    <p className="text-muted text-sm">
                      Scans run automatically in the background. Each scan discovers new tokens and 
                      new wallets, so the database grows over time. If the same wallet appears across 
                      multiple tokens, its stats are aggregated.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-surface border border-border">
                  <h4 className="font-semibold mb-2">Auto Tags</h4>
                  <p className="text-muted text-sm mb-3">Wallets are automatically tagged based on their performance:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400">Smart Money</span>
                    <span className="px-3 py-1.5 rounded-full text-xs bg-blue-500/20 text-blue-400">Whale</span>
                    <span className="px-3 py-1.5 rounded-full text-xs bg-purple-500/20 text-purple-400">Insider</span>
                    <span className="px-3 py-1.5 rounded-full text-xs bg-amber-500/20 text-amber-400">Consistent</span>
                    <span className="px-3 py-1.5 rounded-full text-xs bg-white/10 text-white/70">Active</span>
                    <span className="px-3 py-1.5 rounded-full text-xs bg-pink-500/20 text-pink-400">10x Hunter</span>
                  </div>
                </div>
              </section>

              <section id="wallets" className="mb-16">
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">Wallet Tracking</h2>
                <p className="text-muted leading-relaxed mb-6">
                  Each tracked wallet includes the following information:
                </p>
                
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 sm:py-4 px-4 sm:px-0 font-semibold whitespace-nowrap">Data Point</th>
                        <th className="text-left py-3 sm:py-4 px-4 sm:px-0 font-semibold">Description</th>
                      </tr>
                    </thead>
                    <tbody className="text-muted">
                      <tr className="border-b border-border">
                        <td className="py-4">Total PnL</td>
                        <td className="py-4">Cumulative profit percentage across all tokens</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-4">Avg PnL</td>
                        <td className="py-4">Average profit per token found</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-4">Total Trades</td>
                        <td className="py-4">Number of trades across all tokens</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-4">Appearances</td>
                        <td className="py-4">How many different tokens this wallet was found on</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-4">Tags</td>
                        <td className="py-4">Auto-assigned labels based on performance</td>
                      </tr>
                      <tr className="border-b border-border">
                        <td className="py-4">Token History</td>
                        <td className="py-4">Every token the wallet was found trading</td>
                      </tr>
                      <tr>
                        <td className="py-4">30-Day PnL Chart</td>
                        <td className="py-4">Visual chart showing daily realized profit over the last 30 days</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 p-6 rounded-xl bg-surface border border-border">
                  <h4 className="font-semibold mb-3">Favorites & Nicknames</h4>
                  <p className="text-muted text-sm leading-relaxed">
                    Save wallets to your personal watchlist by clicking "Track" in the dashboard. 
                    In the Wallets tab, you can assign custom nicknames to quickly identify your 
                    favorites. All your favorites and nicknames are private — only you can see them.
                  </p>
                </div>
              </section>

              <section id="faq" className="mb-16">
                <h2 className="text-xl sm:text-3xl font-bold tracking-tight mb-4 sm:mb-6">FAQ</h2>
                
                <div className="space-y-4">
                  {[
                    { 
                      q: 'How are wallets selected?', 
                      a: 'We scan trending Solana tokens and look at the wallets trading them. Only wallets with high realized profits, recent activity, and real buy transactions make it through our filters.'
                    },
                    { 
                      q: 'How often are new wallets added?', 
                      a: 'Scans run automatically in the background. New tokens and wallets are discovered with each scan, so the database keeps growing over time.'
                    },
                    { 
                      q: 'What does the PnL chart show?', 
                      a: 'The 30-day PnL chart shows how much realized profit (in USD) a wallet made each day over the past month. It gives you a quick visual overview of recent performance.'
                    },
                    {
                      q: 'What do the tags mean?',
                      a: 'Tags are automatically assigned based on wallet performance. "Smart Money" means high overall profit, "Whale" indicates large positions, "Insider" suggests very early entries, and "10x Hunter" means the wallet has achieved extreme returns on at least one token.'
                    },
                    { 
                      q: 'Are my favorites visible to others?', 
                      a: 'No. Your tracked wallets, nicknames, and notes are completely private. Only you can see them when connected with your wallet.'
                    },
                    {
                      q: 'How do I search for a specific wallet?',
                      a: 'Use the search bar at the top of the dashboard. You can search by wallet address (partial matches work) and combine it with tag filters like "Smart Money" or "Whale" to narrow down results.'
                    },
                    {
                      q: 'What does "Appearances" mean?',
                      a: 'Appearances show how many different trending tokens a wallet was found trading profitably. A wallet with 3+ appearances was profitable across multiple tokens — a strong signal of skill rather than luck.'
                    },
                    {
                      q: 'Can I export the data?',
                      a: 'Yes. Click the CSV button in the dashboard to download the current wallet list including addresses, PnL, trades, tags, and more.'
                    },
                    { 
                      q: 'Can I run my own instance?', 
                      a: 'Yes! SIGNAL is fully open source. Check out the GitHub repository for setup instructions and deployment guides.'
                    },
                    { 
                      q: 'Is this financial advice?', 
                      a: 'No. SIGNAL provides data and analytics only. Past performance of tracked wallets does not guarantee future results. Always do your own research before trading.'
                    },
                  ].map((faq, i) => (
                    <div key={i} className="rounded-xl bg-surface border border-border overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full px-6 py-5 font-semibold cursor-pointer select-none flex items-center justify-between hover:bg-white/[0.02] transition-colors text-left"
                      >
                        {faq.q}
                        <motion.svg
                          animate={{ rotate: openFaq === i ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="w-4 h-4 text-muted shrink-0 ml-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </motion.svg>
                      </button>
                      <AnimatePresence initial={false}>
                        {openFaq === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-5">
                              <p className="text-muted text-sm leading-relaxed">{faq.a}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
