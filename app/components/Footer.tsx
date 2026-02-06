import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="py-8 sm:py-12 px-4 sm:px-8 lg:px-16 border-t border-white/5">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <img src="/logo_w.png" alt="SIGNAL" className="h-6 w-auto" />
          <span className="font-bold text-lg">SIGNAL</span>
        </div>
        
        <div className="flex items-center gap-8 text-sm text-white/40">
          <a href="https://github.com/bytebrox/signal" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
          <a href="https://x.com/bytebrox" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Twitter</a>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
        </div>
        
        <div className="text-sm text-white/30">
          Built for the trenches · 2026
        </div>
      </div>
    </footer>
  )
}
