# Changelog

All notable changes to SIGNAL will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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


