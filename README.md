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
- **Automated Wallet Discovery** - Scans top volume tokens via Codex API and extracts profitable traders
- **Favorites System** - Save wallets to your personal watchlist, synced across devices
- **On-Chain Analysis** - Uses Codex tokenTopTraders API for real PnL data
- **Historical Tracking** - Records wallet performance across multiple tokens over time
- **Aggregated Statistics** - Total PnL, appearances, trade counts, and win rates
- **Token History** - See exactly which tokens each wallet was found trading
- **Time-Based Filtering** - Filter by discovery date or last activity (24h, 7d, 30d)
- **Modern UI** - Clean, dark-themed dashboard with animated backgrounds and subtle gradients
- **Open Source** - Fully transparent, check the code and contribute

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **APIs**:
  - [Codex](https://codex.io) - Trending token data
  - [Helius](https://helius.dev) - Solana RPC & Enhanced Transactions

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

For production, set up a cron job to run scans automatically:

1. **Vercel Cron** (Pro plan) - Add to `vercel.json`:
   ```json
   {
     "crons": [{
       "path": "/api/scan",
       "schedule": "*/10 * * * *"
     }]
   }
   ```

2. **External Cron** (Free) - Use [cron-job.org](https://cron-job.org) to POST to `/api/scan` every 10 minutes

## How It Works

1. **Token Discovery**: Fetches top 30 Solana tokens by 24h volume from Codex
2. **Transaction Analysis**: Gets recent transactions for each token via Helius
3. **Trader Extraction**: Parses swaps and transfers to identify active wallets
4. **Deduplication**: Checks if wallet+token combination already exists
5. **Aggregation**: Updates wallet statistics (only counting new findings)
6. **Storage**: Persists to Supabase for historical tracking

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
