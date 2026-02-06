<p align="center">
  <img src="public/gitlogo.png" alt="SIGNAL Logo" width="200">
</p>

# SIGNAL

Smart Money Intelligence Platform for Solana - Track profitable wallets across trending tokens.

![SIGNAL](https://img.shields.io/badge/Solana-Smart%20Money-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-green)

## Overview

SIGNAL automatically scans trending Solana tokens, analyzes on-chain transactions, and identifies wallets that consistently appear in profitable trades. Track the smart money and see which wallets are making moves across multiple winning tokens.

### Features

- **Wallet Authentication** - Connect with Phantom or other Solana wallets to access the app
- **Insider Wallet Discovery** - Scans trending tokens and finds wallets with 500%+ profit
- **Aggressive Filtering** - Only active, high-performing wallets (no bots, no inactive, no transfers)
- **Favorites System** - Save wallets to your personal watchlist, synced across devices
- **On-Chain Analysis** - Uses Codex API for real PnL data and wallet charts
- **30-Day PnL Charts** - Visual profit/loss history for each wallet
- **Historical Tracking** - Records wallet performance across multiple tokens over time
- **Aggregated Statistics** - Total PnL, appearances, trade counts, and win rates
- **Token History** - See exactly which tokens each wallet was found trading
- **Time-Based Filtering** - Filter by discovery date or last activity (24h, 7d, 30d)
- **Pagination** - Browse through collected wallets (20 per page)
- **Centralized Config** - Easy adjustment of all filters in `lib/config.ts`
- **Modern UI** - Clean, dark-themed dashboard with animated backgrounds
- **Open Source** - Fully transparent, check the code and contribute

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)
- **APIs**:
  - [Codex](https://codex.io) - Token discovery, wallet analysis, PnL charts
  - [Helius](https://helius.dev) - Solana RPC (optional)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account (free tier works)
- Helius API key (free tier: 100k credits/month)
- Codex API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/bytebrox/signal.git
   cd signal
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```
   
   Required variables:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   # Helius API
   HELIUS_API_KEY=your-helius-api-key
   
   # Codex API
   CODEX_API_KEY=your-codex-api-key
   ```

4. **Set up the database**
   
   Run the SQL schema in your Supabase SQL Editor:
   ```bash
   # Copy contents of supabase-schema.sql and execute in Supabase Dashboard
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### `users`
User accounts (wallet-based authentication):
- `wallet_address` - Solana wallet address (unique)
- `created_at` - Account creation timestamp
- `last_login_at` - Last login timestamp
- `is_premium` - Premium status flag
- `settings` - User preferences (JSON)

### `user_favorites`
Saved wallets per user:
- `user_id` - Reference to users table
- `wallet_address` - Tracked wallet address
- `nickname` - Optional custom name
- `notes` - Optional notes

### `tracked_wallets`
Stores aggregated wallet statistics:
- `address` - Solana wallet address
- `total_pnl` - Cumulative PnL across all tokens
- `pnl_percent` - Average PnL per token
- `appearances` - Number of unique tokens found
- `total_trades` - Total trade count
- `tags` - Auto-generated labels (Smart Money, Consistent, etc.)

### `wallet_token_history`
Records each wallet+token discovery:
- `wallet_address` - The wallet
- `token_address` - Token contract address
- `token_symbol` - Token symbol
- `pnl_at_discovery` - PnL at time of scan
- `discovered_at` - Timestamp

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/scan` | POST | Trigger a new wallet scan |
| `/api/scan` | GET | Get scan status and last scan time |
| `/api/wallets` | GET | List tracked wallets with filtering |
| `/api/wallets/[address]` | GET | Get wallet details + token history |
| `/api/users` | POST | Create or login user by wallet address |
| `/api/users` | GET | Get user by wallet address |
| `/api/favorites` | GET | Get user's favorite wallets |
| `/api/favorites` | POST | Add wallet to favorites |
| `/api/favorites` | DELETE | Remove wallet from favorites |

### Query Parameters for `/api/wallets`

- `limit` - Number of results (default: 20)
- `offset` - Pagination offset
- `sort` - Sort field (default: total_pnl)
- `range` - Time filter: `all`, `24h`, `7d`, `30d`
- `filterType` - `discovered` or `activity`

### Query Parameters for `/api/wallets/[address]`

- `chart` - Include 30-day PnL chart data (true/false)
- `days` - Number of days for chart (default: 30)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy

### Environment Variables in Vercel

Add these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HELIUS_API_KEY`
- `CODEX_API_KEY`

## Automated Scanning

For production, set up a cron job to run scans automatically.

### Option 1: cron-job.org (Free)

1. Add `SCAN_API_KEY` to your Vercel environment variables (generate a random string)
2. Create account at [cron-job.org](https://cron-job.org)
3. Create new cron job:
   - **URL:** `https://your-domain.vercel.app/api/scan`
   - **Method:** `POST`
   - **Schedule:** Every 10-30 minutes
   - **Headers:** Add `Authorization: Bearer YOUR_SCAN_API_KEY`
   - **Timeout:** 60 seconds

### Option 2: Vercel Cron (Pro plan)

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/scan",
    "schedule": "*/10 * * * *"
  }]
}
```
Note: Vercel cron doesn't support custom headers, so leave `SCAN_API_KEY` unset or use a different auth method

## How It Works

1. **Token Discovery**: Fetches top 30 trending Solana tokens by `trendingScore24` from Codex
2. **Trader Analysis**: For each token, fetches top 25 traders via `filterTokenWallets`
3. **Aggressive Filtering**: 
   - Minimum 500% profit (6x return)
   - Minimum $500 realized profit
   - Active in last 7 days
   - Real buys (not transfers) - minimum $100 invested
4. **Deduplication**: Checks if wallet+token combination already exists
5. **Aggregation**: Updates wallet statistics across all discovered tokens
6. **Storage**: Persists to Supabase - database grows with each scan

### Scan Configuration

All settings are centralized in `lib/config.ts`:

```typescript
// Tokens to scan per run
config.scanner.tokensToScan = 30

// Traders to fetch per token
config.scanner.tradersPerToken = 25

// Minimum profit percentage (500 = 6x return)
config.tokenWalletFilters.minProfitPercent = 500

// Maximum days since last trade
config.tokenWalletFilters.maxDaysSinceLastTrade = 7
```

## Configuration Reference

All scanner settings are in `lib/config.ts`:

| Setting | Default | Description |
|---------|---------|-------------|
| `scanner.tokensToScan` | 30 | Trending tokens per scan |
| `scanner.tradersPerToken` | 25 | Top traders fetched per token |
| `tokenWalletFilters.minProfitPercent` | 500 | Minimum 500% profit (6x) |
| `tokenWalletFilters.minRealizedProfitUsd` | 500 | Minimum $500 profit |
| `tokenWalletFilters.minBuyAmountUsd` | 100 | Minimum $100 invested |
| `tokenWalletFilters.maxDaysSinceLastTrade` | 7 | Active in last 7 days |
| `trendingTokens.minVolume24h` | 100000 | Min $100k 24h volume |
| `trendingTokens.minLiquidity` | 50000 | Min $50k liquidity |
| `display.walletsPerPage` | 20 | Wallets per page |

## Links

- **Website**: [justasignal.com](https://justasignal.com)
- **GitHub**: [github.com/bytebrox/signal](https://github.com/bytebrox/signal)
- **Community**: [x.com/bytebrox](https://x.com/bytebrox)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Disclaimer

This tool is for informational purposes only. Cryptocurrency trading involves substantial risk. Past performance of tracked wallets does not guarantee future results. Always do your own research.
