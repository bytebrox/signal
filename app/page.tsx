'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Nav from '@/app/components/Nav'
import Footer from '@/app/components/Footer'

interface LiveWallet {
  address: string
  pnl: string
  token: string
  time: string
}

// Fallback data in case DB is empty
const fallbackWallets: LiveWallet[] = [
  { address: '7xKX...m2Np', pnl: '+847%', token: 'BONK', time: '2m ago' },
  { address: '3dFv...qL8s', pnl: '+312%', token: 'WIF', time: '5m ago' },
  { address: '9aHj...nK4p', pnl: '+1,240%', token: 'POPCAT', time: '8m ago' },
]

export default function Home() {
  const [tickerIndex, setTickerIndex] = useState(0)
  const [mounted, setMounted] = useState(false)
  const [liveWallets, setLiveWallets] = useState<LiveWallet[]>(fallbackWallets)
  const [loading, setLoading] = useState(true)
  

  // Format time ago
  const timeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  // Fetch real wallets from DB
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const res = await fetch('/api/wallets?limit=6&sort=created_at')
        const data = await res.json()
        
        if (data.wallets && data.wallets.length > 0) {
          const formatted = data.wallets.map((w: any) => ({
            address: `${w.address.slice(0, 4)}...${w.address.slice(-4)}`,
            pnl: `+${w.total_pnl || w.pnl_percent || 0}%`,
            token: w.last_token_symbol || w.tags?.[0] || 'SOL',
            time: w.created_at ? timeAgo(w.created_at) : 'recently'
          }))
          setLiveWallets(formatted)
        }
      } catch (error) {
        console.error('Failed to fetch live wallets:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchWallets()
  }, [])

  useEffect(() => {
    setMounted(true)
    const interval = setInterval(() => {
      setTickerIndex((i) => (i + 1) % liveWallets.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [liveWallets.length])

  return (
    <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
      {/* Ambient Background - z-0 so section backgrounds can layer above */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-white/[0.02] rounded-full blur-[100px]" />
      </div>

      <Nav
        position="fixed"
        rightContent={
          <Link 
            href="/app" 
            className="group px-4 sm:px-6 py-2 sm:py-2.5 bg-white text-black text-xs sm:text-sm font-semibold rounded-full hover:scale-105 transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              Launch App
              <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </Link>
        }
      />

      {/* Hero - Full Width Asymmetric */}
      <section className="relative min-h-screen flex items-center pt-20 sm:pt-0">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src="/hero.mp4" type="video/mp4" />
        </video>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#050505] via-transparent to-[#050505]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent" />
        
        <div className="relative z-10 w-full px-4 sm:px-8 lg:px-16 py-16 sm:py-32">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-4 items-center">
            {/* Left Content - Takes 7 columns */}
            <motion.div
              className="lg:col-span-7"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 mb-8">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm text-emerald-400">Live scanning active</span>
              </div>
              
              <h1 className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tighter leading-[0.95] mb-6 sm:mb-8">
                Follow the
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600">
                  insiders
                </span>
              </h1>

              <p className="text-base sm:text-xl lg:text-2xl text-white/50 mb-8 sm:mb-12 max-w-2xl leading-relaxed font-light">
                Track wallets with <span className="text-white">exceptional returns</span> across trending Solana tokens. 
                See what smart money is buying before everyone else.
              </p>

              <div className="flex flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/app"
                  className="group relative min-w-[200px] px-6 sm:px-8 py-3 sm:py-4 bg-white text-black text-sm sm:text-base font-bold rounded-full hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    Open App
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <a
                  href="https://github.com/bytebrox/signal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-[200px] px-6 sm:px-8 py-3 sm:py-4 border border-white/20 rounded-full hover:bg-white/5 transition-all duration-300 text-sm sm:text-base font-medium flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  View on GitHub
                </a>
              </div>
            </motion.div>

            {/* Right - Live Feed - Takes 5 columns */}
            <motion.div
              className="lg:col-span-5"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent rounded-3xl blur-xl" />
                
                <div className="relative rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden">
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-semibold">Live Feed</span>
                    </div>
                    <span className="text-xs text-white/40 font-mono">SOLANA</span>
                  </div>
                  
                  {/* Feed Items */}
                  <div className="divide-y divide-white/5">
                    {liveWallets.slice(0, 5).map((wallet, i) => (
                      <motion.div
                        key={wallet.address}
                        className={`px-6 py-4 transition-all duration-500 ${
                          i === tickerIndex ? 'bg-emerald-500/10' : 'hover:bg-white/[0.02]'
                        }`}
                        animate={{ 
                          opacity: mounted ? 1 : 0,
                          x: mounted ? 0 : 20
                        }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-mono font-bold ${
                              i === tickerIndex 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-white/5 text-white/60'
                            }`}>
                              {wallet.address.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-mono text-sm text-white/90">{wallet.address}</div>
                              <div className="text-xs text-white/40 flex items-center gap-2">
                                <span>${wallet.token}</span>
                                <span>·</span>
                                <span>{wallet.time}</span>
                              </div>
                            </div>
                          </div>
                          <div className={`text-right font-bold ${
                            i === tickerIndex ? 'text-emerald-400 text-lg' : 'text-emerald-500/80'
                          }`}>
                            {wallet.pnl}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
                    <Link href="/app" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center justify-center gap-2 font-medium">
                      View all discoveries
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden sm:block"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2">
            <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
          </div>
        </motion.div>
      </section>

      {/* Stats Marquee - Full Width */}
      <section className="py-6 border-y border-white/5 bg-white/[0.01] overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, j) => (
            <div key={j} className="flex items-center gap-16 mx-8">
              {[
                { value: 'High', label: 'Profit Filter' },
                { value: 'Trending', label: 'Token Scanning' },
                { value: '24/7', label: 'Auto Updates' },
                { value: 'Active', label: 'Wallets Only' },
                { value: 'Open', label: 'Source Code' },
                { value: 'Real', label: 'On-Chain Data' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-white">{stat.value}</span>
                  <span className="text-white/40 text-sm uppercase tracking-wider">{stat.label}</span>
                  <span className="text-emerald-500/50 text-2xl">◆</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* How it Works - Bento Grid Full Width */}
      <section id="how" className="py-16 sm:py-32 px-4 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-emerald-500 text-sm font-semibold tracking-wider uppercase mb-4 block">How it works</span>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight">
            Three steps to<br />
            <span className="text-white/40">smart money</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Scan Trending Tokens',
              desc: 'We continuously monitor trending Solana tokens with high volume, strong momentum, and fresh launches.',
              bg: '/bg1.png',
            },
            {
              step: '02',
              title: 'Extract Winners',
              desc: 'For each token, we find wallets with high realized profits that are actively trading. Not paper gains — real money.',
              bg: '/bg2.png',
            },
            {
              step: '03',
              title: 'Track & Follow',
              desc: 'Save wallets to your watchlist. See their complete history, PnL charts, and which tokens they are moving into next.',
              bg: '/bg3.png',
            },
          ].map((item, i) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="group relative p-8 lg:p-10 rounded-3xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-500 overflow-hidden"
            >
              {/* Background Image */}
              <div 
                className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity duration-500"
                style={{
                  backgroundImage: `url('${item.bg}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              {/* Dark overlay for text readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/95 via-[#050505]/70 to-[#050505]/40" />
              
              <div className="relative z-10">
                <div className="text-6xl lg:text-7xl font-bold text-white/5 group-hover:text-emerald-500/20 transition-colors duration-500 mb-6">{item.step}</div>
                <h3 className="text-xl lg:text-2xl font-bold mb-4">{item.title}</h3>
                <p className="text-white/50 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features - Full Width Bento */}
      <section id="features" className="py-16 sm:py-32 px-4 sm:px-8 lg:px-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-16 text-right"
        >
          <span className="text-emerald-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Features</span>
          <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight">
            Built for<br />
            <span className="text-white/40">the trenches</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { 
              title: 'Wallet Watchlist', 
              desc: 'Save and track your favorite wallets. Get a complete overview of their performance.',
              icon: '★',
              span: 'lg:col-span-2',
            },
            { 
              title: '30-Day PnL Charts', 
              desc: 'Visual profit/loss history for every wallet.',
              icon: '◈',
              span: '',
            },
            { 
              title: 'Token History', 
              desc: 'See every token a wallet profited from.',
              icon: '◇',
              span: '',
            },
            { 
              title: 'Smart Tags', 
              desc: 'Auto-labeled: Smart Money, Whale, Insider.',
              icon: '◆',
              span: '',
            },
            { 
              title: 'Auto Scanning', 
              desc: 'Continuous scanning around the clock. No manual work needed.',
              icon: '↻',
              span: '',
            },
            { 
              title: 'Open Source', 
              desc: 'Fully transparent. Check the code, run it yourself, contribute to the project.',
              icon: '</>',
              span: 'lg:col-span-2',
            },
          ].map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className={`group p-8 rounded-3xl border border-white/10 bg-white/[0.02] hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all duration-300 ${feature.span}`}
            >
              <div className="text-3xl mb-6 w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-white/50 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA - Full Width */}
      <section className="pt-16 sm:pt-32 pb-16 sm:pb-32 px-4 sm:px-8 lg:px-16 relative overflow-hidden z-[1]">
        {/* Background Image */}
        <div className="absolute inset-0 z-[1]">
          {/* Hero Image */}
          <div 
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `url('/hero.png')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center bottom',
              maskImage: 'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(0,0,0,0.5) 35%, black 55%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, transparent 20%, rgba(0,0,0,0.5) 35%, black 55%)',
            }}
          />
          {/* Glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/15 rounded-full blur-[150px]" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          <h2 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6 sm:mb-8">
            Ready to follow<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">smart money?</span>
          </h2>
          <p className="text-base sm:text-xl text-white/50 mb-8 sm:mb-12 max-w-2xl mx-auto">
            Join traders who track the wallets that consistently profit on Solana.
          </p>
          <Link
            href="/app"
            className="group inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white text-black font-bold text-base sm:text-lg rounded-full hover:scale-105 transition-all duration-300"
          >
            Launch App
            <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </section>

      <Footer />
      
      {/* Custom Styles */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </main>
  )
}
