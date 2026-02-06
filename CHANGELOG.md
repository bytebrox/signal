# Changelog

All notable changes to SIGNAL will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.8.0] - 2026-02-06

### Added
- **Modern Full-Width Landing Page** - Complete redesign
  - Full-width layout using entire viewport (no centered container)
  - Asymmetric 7/5 hero grid with larger text
  - Live Feed shows real wallet data from database (with fallback)
  - Scroll-triggered sticky nav with blur background
  - Marquee stats bar with infinite scroll animation
  - Bento grid features section with varying spans
  - Background images (bg1/bg2/bg3) on "How it works" cards
  - hero.png background on CTA section with overlay fade
  - Scroll indicator animation on hero
  - GitHub button with icon in hero
  - "Live scanning active" badge

### Changed
- Landing page now fetches latest wallets from `/api/wallets` for live feed
- API `/api/wallets` returns `last_token_symbol` per wallet from history
- Navigation becomes opaque with backdrop-blur on scroll
- Removed specific numbers/percentages from landing copy (more generic)

### Removed
- Centered `max-w-6xl` container constraint on landing page
- Mock-only wallet data (replaced with real DB data)

## [0.7.0] - 2026-02-06

### Added
- **Automated Scanning** - Cron job support for automatic wallet discovery
  - API key authentication for `/api/scan` endpoint
  - `SCAN_API_KEY` environment variable for secure access
  - Compatible with cron-job.org and similar services
- **Wallets Tab Details** - Full wallet details in favorites view
  - Click any tracked wallet to see complete details
  - 30-day PnL chart with area visualization
  - Stats grid: Total PnL, Avg PnL, Trades, Tokens
  - Tag display (Smart Money, Whale, Insider, etc.)
  - Token history with individual PnL per token
  - Direct links to Solscan & Birdeye
  - Two-column layout with sticky details panel

### Changed
- Removed manual "Run Scan" button (automated via cron job)
- Updated empty state message to reflect automatic scanning
- Wallets tab now shows "Click on a wallet to see details"

### Fixed
- PnL chart in Wallets tab now correctly uses `realizedProfitUsd` dataKey

### Security
- Scan endpoint now requires Bearer token authentication
- API key validated against `SCAN_API_KEY` environment variable

## [0.6.0] - 2026-02-05

### Added
- **Centralized Configuration** - All scanner settings in `lib/config.ts`
  - Easy adjustment of all filters without touching core code
  - Network settings, scanner limits, wallet filters, display options
  - Tag thresholds for auto-labeling (Smart Money, Whale, etc.)
- **Trending Token Discovery** - Uses Codex `trendingScore24` ranking
  - Scans top 30 trending Solana tokens per run
  - Filters: min $100k volume, $50k liquidity, $50k market cap
  - FILTERED stats type removes MEV/bot activity
- **Token-Based Wallet Discovery** - Two-step process
  1. Fetch trending tokens via `filterTokens`
  2. Get top traders per token via `filterTokenWallets`
- **Aggressive Insider Filters** - Only high-quality wallets saved
  - Minimum 500% profit (6x return)
  - Minimum $500 realized profit
  - Minimum $100 buy amount (filters out transfers)
  - Maximum 7 days since last trade (active wallets only)
  - Maximum $50k buy (filters out whales)
- **30-Day PnL Chart** - Visual profit/loss chart in wallet details
  - Uses Codex `walletChart` endpoint
  - Area chart with gradient fill
  - Custom tooltips showing date and PnL
- **Pagination** - Proper page navigation for wallet list
  - 20 wallets per page
  - Previous/Next navigation
  - Page number buttons (up to 5 visible)
  - Shows "X-Y of Z wallets"

### Changed
- Scanner now uses `filterTokenWallets` instead of generic `filterWallets`
- Wallet statistics aggregated across multiple tokens properly
- API `/api/wallets` returns `total` count for pagination
- Display limit increased - database collects all qualifying wallets

### Fixed
- Inactive wallets no longer appear (7-day activity filter)
- Inflated profit percentages from token transfers filtered out
- Recharts console warnings (added minWidth/minHeight)

### Configuration
New `lib/config.ts` structure:
```typescript
config.scanner.tokensToScan      // 30 tokens per scan
config.scanner.tradersPerToken   // 25 traders per token
config.tokenWalletFilters.minProfitPercent  // 500%
config.tokenWalletFilters.maxDaysSinceLastTrade  // 7 days
config.display.walletsPerPage    // 20 per page
```

## [0.5.0] - 2026-02-05

### Added
- **Hero Video Background** - Animated video background on landing page
  - Autoplay, loop, muted for seamless experience
  - Full viewport height hero section
- **Dashboard Background** - Subtle background image with hero.png
  - Fixed position, 30% opacity
  - Doesn't interfere with content readability
- **Background Images** - Section-specific backgrounds
  - "How SIGNAL works" section with bg2.png and fade effect
  - CTA section with bg1.png rotated 180°
- **Custom Logo** - Brand logo added throughout the app
  - Navigation (landing page + dashboard)
  - Footer
  - Favicon and Apple Touch Icon
- **Community Link** - X.com link in navigation and footer
- **Custom Wallet Modal** - Solana Wallet Adapter styled to match app design
  - Dark background with blur effect
  - Emerald green hover states
  - Rounded corners and consistent typography
  - Custom dropdown menu styling

### Changed
- **Box Design Overhaul** - All boxes now have:
  - Solid dark backgrounds for readability (rgba 95% opacity)
  - Subtle green gradient accents on top
  - Backdrop blur effect
  - Hover glow effects preserved
- **Landing Page Polish**
  - Stats bar redesigned with gradient lines and horizontal layout
  - "How it works" section: clean numbered design without icons
  - "Features" section: removed generic AI-looking icons
  - Removed "Manual scans" and "Solana native" features (not relevant)
  - New tagline: "Follow the insiders"
- **Dashboard Cleanup**
  - Removed "Quick Actions" panel
  - Sticky header with solid background
  - All content readable over background image
- **Metadata** - Enhanced SEO and social sharing
  - Open Graph tags
  - Twitter Card tags
  - Domain set to justasignal.com

### Removed
- Generic SVG icons from feature boxes
- Quick Actions panel from dashboard sidebar
- "Alerts" feature references

## [0.4.0] - 2026-02-05

### Added
- **Wallet Authentication** - Connect with Solana wallet to access the app
  - Solana Wallet Adapter integration (Phantom support)
  - User accounts created automatically on first connect
  - Persistent sessions across devices
- **Favorites System** - Save wallets to your personal watchlist
  - Track button on each wallet in the dashboard
  - Dedicated "Wallets" tab showing all favorites
  - Remove favorites with one click
  - Favorites stored per user in database
- **Navigation Tabs** - Full app navigation
  - Dashboard (wallet scanner)
  - Wallets (your favorites)
  - Settings (account info, disconnect)
- **Settings Page** - Account management
  - View wallet address and member since date
  - Plan status (Free/Premium)
  - Stats overview
  - Disconnect wallet option
- **New Landing Page** - Redesigned homepage
  - Live preview card with animated wallet ticker
  - Clear feature explanations
  - Modern design without generic AI look

### Changed
- Landing page completely redesigned for authenticity
- App requires wallet connection to access
- "Track" button now functional (saves to favorites)

### Database
- New `users` table for wallet-based accounts
- New `user_favorites` table for saved wallets
- Updated schema with proper indexes and RLS policies

### Dependencies
- Added `@solana/wallet-adapter-base`
- Added `@solana/wallet-adapter-react`
- Added `@solana/wallet-adapter-react-ui`
- Added `@solana/wallet-adapter-phantom`
- Added `@solana/web3.js`
- Added `graphql` (peer dependency for Codex SDK)

## [0.3.0] - 2026-02-05

### Added
- **Codex API Integration** - Switched from DexScreener to Codex for trending token data
  - Better quality token rankings by 24h volume
  - More reliable data source with filtering capabilities
- **Wallet Details Panel** - Click on any wallet to see detailed information
  - Token history showing all tokens where wallet was found
  - PnL at discovery for each token
  - Trade counts per token
  - Direct links to DexScreener for each token
- **Time-Based Filtering** - Filter wallets by time period
  - Options: All, 24h, 7d, 30d
  - Filter by discovery date or last activity
  - Combinable filters for precise queries
- **New API Endpoint** - `/api/wallets/[address]` for individual wallet details

### Changed
- Scanner description updated to reflect Codex usage
- "How it works" section updated in UI

## [0.2.0] - 2026-02-05

### Added
- **Wallet Token History Table** - New `wallet_token_history` table in Supabase
  - Tracks unique wallet+token combinations
  - Prevents duplicate counting on repeated scans
  - Stores PnL and trade count at discovery time
- **Aggregated Statistics** - Proper accumulation of wallet performance
  - `total_pnl` - Sum of all PnL across tokens
  - `appearances` - Count of unique tokens found
  - Average PnL calculation
- **Smart Deduplication** - Scans now check for existing wallet+token pairs
  - Only new findings contribute to statistics
  - Historical accuracy maintained

### Changed
- Scan logic completely refactored for proper aggregation
- UI updated to show total PnL vs average PnL
- "Tokens" column now shows appearances count

### Fixed
- Wallet statistics no longer overwritten on each scan
- Duplicate wallet+token combinations no longer counted multiple times

## [0.1.0] - 2026-02-05

### Added
- **Initial Release** - Complete migration from Astro to Next.js 14
- **Modern UI** - Dark theme with motion design
  - Large headlines and modern typography
  - Framer Motion animations
  - Responsive layout
- **Supabase Integration** - PostgreSQL database for wallet tracking
  - `tracked_wallets` table schema
  - Row Level Security policies
- **Helius API Integration** - On-chain transaction analysis
  - Signature fetching for tokens
  - Enhanced transaction parsing
  - Swap and transfer detection
- **DexScreener Integration** - Token discovery (later replaced by Codex)
- **Manual Scan Trigger** - "Run Scan" button in dashboard
- **Wallet Table** - Display tracked wallets with statistics
  - Address, PnL, trades, tags
  - Click to select and view details
- **External Links** - Solscan and Birdeye links for each wallet
- **Scan Status** - Last scan timestamp and result display

### Technical
- Next.js 14 App Router
- TypeScript strict mode
- Tailwind CSS with custom theme
- Lazy Supabase client initialization (Vercel build fix)


