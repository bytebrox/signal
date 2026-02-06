'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

interface NavProps {
  /** Content shown on the right side (buttons etc.) — placed before hamburger */
  rightContent?: React.ReactNode
  /** Current active page for highlighting */
  activePage?: 'docs' | 'app' | null
  /** 'fixed' for landing page (transparent → opaque on scroll), 'sticky' for other pages */
  position?: 'fixed' | 'sticky'
  /** Secondary navigation bar below the main nav (e.g. Dashboard tabs, Doc sections) */
  secondaryNav?: React.ReactNode
}

export default function Nav({
  rightContent,
  activePage = null,
  position = 'sticky',
  secondaryNav,
}: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  const isLanding = pathname === '/'
  const isFixed = position === 'fixed'

  // Scroll listener for fixed (landing page) variant
  useEffect(() => {
    if (!isFixed) return
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isFixed])

  // On landing page, anchor links scroll directly. On other pages, navigate to /#section
  const featuresHref = isLanding ? '#features' : '/#features'
  const howHref = isLanding ? '#how' : '/#how'

  return (
    <nav className={`${
      isFixed ? 'fixed top-0 left-0 right-0' : 'sticky top-0 border-b border-border'
    } z-50 transition-all duration-300 ${
      isFixed
        ? (scrolled || mobileMenuOpen ? 'bg-[#050505]/95 backdrop-blur-xl border-b border-white/5' : '')
        : 'bg-bg/95 backdrop-blur-xl'
    }`}>
      {/* Main Nav Bar — full width, same padding everywhere */}
      <div className="px-4 sm:px-8 lg:px-16 py-4 sm:py-5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group">
          <img src="/logo_w.png" alt="SIGNAL" className="h-6 sm:h-7 w-auto" />
          <span className="text-lg sm:text-xl font-bold tracking-tight">SIGNAL</span>
        </Link>

        {/* Desktop Links — identical on every page */}
        <div className="hidden md:flex items-center gap-10 text-sm text-white/50">
          <a href={featuresHref} className="hover:text-white transition-colors duration-300">Features</a>
          <a href={howHref} className="hover:text-white transition-colors duration-300">How it works</a>
          <Link href="/docs" className={`${activePage === 'docs' ? 'text-white' : 'hover:text-white'} transition-colors duration-300`}>Docs</Link>
          <a href="https://github.com/bytebrox/signal" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300">GitHub</a>
          <a href="https://x.com/bytebrox" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-300">Twitter</a>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {rightContent}

          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu — identical on every page */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden border-t border-white/10"
          >
            <div className="px-4 sm:px-8 py-2 flex flex-col gap-1">
              <a href={featuresHref} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors">Features</a>
              <a href={howHref} onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors">How it works</a>
              <Link href="/docs" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-3 text-sm ${activePage === 'docs' ? 'text-white' : 'text-muted hover:text-white'} hover:bg-white/5 rounded-xl transition-colors`}>Docs</Link>
              <a href="https://github.com/bytebrox/signal" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors">GitHub</a>
              <a href="https://x.com/bytebrox" target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="px-4 py-3 text-sm text-muted hover:text-white hover:bg-white/5 rounded-xl transition-colors">Twitter</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Secondary Navigation (page-specific) */}
      {secondaryNav}
    </nav>
  )
}
