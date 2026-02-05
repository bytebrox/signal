'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.25, 0.4, 0.25, 1] }
  })
}

const stats = [
  { value: '$2.4B+', label: 'Volume Tracked' },
  { value: '847', label: 'Elite Wallets' },
  { value: '12ms', label: 'Avg Latency' },
  { value: '99.9%', label: 'Uptime' },
]

const features = [
  {
    title: 'Smart Money Detection',
    desc: 'Algorithmic identification of consistently profitable wallets across thousands of tokens.',
    icon: '◈'
  },
  {
    title: 'Real-Time Alerts',
    desc: 'Instant notifications when tracked wallets make moves. Telegram, Discord, or webhooks.',
    icon: '◉'
  },
  {
    title: 'Performance Analytics',
    desc: 'Deep dive into wallet histories. Win rates, avg returns, preferred tokens.',
    icon: '◐'
  },
  {
    title: 'Copy Trade Ready',
    desc: 'One-click routing to Jupiter or Raydium. Follow the alpha, not the crowd.',
    icon: '◎'
  },
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            SIGNAL
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how" className="hover:text-white transition-colors">How it works</Link>
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
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
      <section className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/[0.01] rounded-full blur-3xl" />
        </div>
        
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />

        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
            className="mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-xs text-muted font-mono">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              LIVE ON SOLANA
            </span>
          </motion.div>

          <motion.h1
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="text-5xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[0.9] mb-8"
          >
            Track smart money.
            <br />
            <span className="text-muted">Move first.</span>
          </motion.h1>

          <motion.p
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            SIGNAL identifies elite traders by analyzing on-chain performance. 
            Get real-time alerts when they move. No noise, just alpha.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/app"
              className="group px-8 py-4 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-all flex items-center gap-3"
            >
              Enter App
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/docs"
              className="px-8 py-4 text-muted hover:text-white transition-colors font-medium"
            >
              Read Docs
            </Link>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
        >
          <div className="w-5 h-8 border border-border rounded-full flex justify-center pt-2">
            <motion.div 
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-1 bg-muted rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-24 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold tracking-tight mb-2">{stat.value}</div>
                <div className="text-sm text-muted">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              Intelligence infrastructure
              <br />
              <span className="text-muted">for serious traders</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group p-8 rounded-2xl bg-surface border border-border hover:border-white/10 transition-colors"
              >
                <div className="text-2xl mb-4 text-muted group-hover:text-white transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              How SIGNAL works
            </h2>
          </motion.div>

          <div className="space-y-0">
            {[
              { num: '01', title: 'We analyze', desc: 'Our algorithm scans millions of transactions daily, identifying wallets with exceptional track records.' },
              { num: '02', title: 'We track', desc: 'Qualified wallets are monitored 24/7. Every swap, every transfer, logged in real-time.' },
              { num: '03', title: 'You act', desc: 'Receive instant alerts when tracked wallets make moves. Execute before the crowd catches on.' },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="flex gap-8 py-12 border-b border-border last:border-0"
              >
                <div className="text-5xl font-bold text-white/10 font-mono">{step.num}</div>
                <div>
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted text-lg leading-relaxed max-w-xl">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
              Stop following.
              <br />
              Start leading.
            </h2>
            <Link
              href="/app"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-black font-medium text-lg rounded-full hover:bg-white/90 transition-all"
            >
              Get Started
              <span>→</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xl font-semibold tracking-tight">SIGNAL</div>
          <div className="flex items-center gap-8 text-sm text-muted">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <a href="https://twitter.com" target="_blank" rel="noopener" className="hover:text-white transition-colors">Twitter</a>
            <a href="https://t.me" target="_blank" rel="noopener" className="hover:text-white transition-colors">Telegram</a>
          </div>
          <div className="text-sm text-muted">© 2026 SIGNAL</div>
        </div>
      </footer>
    </main>
  )
}
