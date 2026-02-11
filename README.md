<p align="center">
  <img src="public/gitlogo.png" alt="SIGNAL Logo" width="200">
</p>

# SIGNAL

Smart Money Intelligence Platform for Solana — Track profitable wallets across trending tokens.

![SIGNAL](https://img.shields.io/badge/Solana-Smart%20Money-purple)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/license-MIT-green)

## What is SIGNAL?

SIGNAL is a web app that automatically discovers the most profitable traders on Solana. Instead of manually searching through blockchain explorers, SIGNAL does the heavy lifting: it finds trending tokens, analyzes who traded them best, and surfaces those wallets in a clean dashboard.

The idea is simple — if a wallet consistently shows up as a top performer across multiple trending tokens, that's a signal worth following.

## How It Works

The scanning process runs in two stages:

### 1. Token Discovery

We pull the highest-trending Solana tokens based on trading activity, volume, and liquidity. Tokens that don't meet quality thresholds (low volume, low liquidity, suspicious activity) are filtered out before we look at any wallets.

### 2. Trader Extraction

For each qualifying token, we analyze the wallets that traded it. This is where the aggressive filtering kicks in:

- **Profit threshold** — Min. 500% realized profit and $500+ in USD. We're not interested in small gains.
- **Real buys** — Min. $10 entry cost. Wallets that received tokens via airdrops or transfers are excluded. This prevents inflated profit numbers.
- **Minimum trades** — At least 3 trades in 30 days. Filters deployer wallets that only buy → distribute → sell.
- **Anti-bot** — Codex bot score and scammer score must be below 0.7. Automated bots and rug pull wallets are excluded.
- **Recent activity** — Only wallets active in the last 7 days. Dormant wallets are skipped.
- **Position size** — Max. $100k buy amount to filter out market-moving whales.
- **Token blacklist** — 37 tokens excluded: native SOL, stablecoins (USDC, USDT, PYUSD, DAI, EURC), LSTs (mSOL, jitoSOL, bSOL, stSOL, jupSOL, etc.), wrapped assets (wETH, wBTC), DeFi tokens (RAY, JUP, ORCA), and established large-caps (BONK, WIF, PYTH, JTO). Only real small-cap/memecoin trading counts.

When a wallet passes all filters, it gets saved to the database with its stats. If the same wallet shows up across multiple tokens in future scans, its statistics are aggregated — and that's when it becomes really interesting.

### Auto-Tagging

Wallets are automatically tagged based on their performance profile:

- **Smart Money** — Consistently high profit across tokens
- **Whale** — Large position sizes
- **Insider** — Very early entries into tokens
- **10x Hunter** — Achieved extreme returns on at least one token
- **Consistent** — Steady performance, not just one lucky trade
- **Active** — High trade frequency

## What You Can Do

### Dashboard
Browse all discovered wallets sorted by profit. Search by address, filter by tags, switch between time ranges (24h, 7d, 30d), and paginate through results. Each wallet row shows total PnL, average PnL, trade count, token appearances, tags, and a "Last Scan" indicator showing when the wallet was last spotted in a trending token. Inactive wallets (not seen in 14+ days) can be hidden with a single click.

Clicking a wallet opens a detail panel with current holdings (live from Codex), a 30-day PnL chart, full token history (including entry cost and time after token launch), and links to Solscan/Birdeye. Entries within 30 minutes of token launch are highlighted as strong insider signals.

### Favorites & Nicknames
Track wallets by adding them to your personal watchlist. Assign custom nicknames to quickly identify them. Drag and drop to reorder your favorites — the order is saved. Everything is private — tied to your connected wallet, invisible to others.

### CSV Export
Download the current wallet list as a CSV file for your own analysis or tracking.

### Documentation
In-app docs page explaining how the platform works, what the data means, and answers to common questions.

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | Next.js 14 (App Router) | Server-side rendering, API routes, file-based routing |
| Language | TypeScript | Type safety across frontend and backend |
| Styling | Tailwind CSS | Rapid UI development with utility classes |
| Animations | Framer Motion | Smooth page transitions, loading states, accordions |
| Charts | Recharts | PnL visualization with area charts |
| Database | Supabase (PostgreSQL) | Managed Postgres with real-time capabilities and RLS |
| Token Data | Codex API | Token discovery, wallet analysis, PnL chart data |
| Auth | Solana Wallet Adapter | Wallet-based authentication (Phantom, Solflare, Backpack) |
| Hosting | Vercel | Zero-config Next.js deployment |

## Architecture

The app follows a straightforward Next.js App Router pattern:

```
app/
├── page.tsx              # Landing page
├── app/page.tsx          # Dashboard (main app)
├── docs/page.tsx         # Documentation
├── components/
│   ├── Nav.tsx           # Shared navigation (used on all pages)
│   └── Footer.tsx        # Shared footer (used on all pages)
├── api/
│   ├── scan/             # Scanner endpoint (cron-triggered)
│   ├── wallets/          # Wallet listing + detail endpoints
│   ├── favorites/        # User favorites CRUD
│   └── users/            # User auth
lib/
├── config.ts             # All scanner settings (centralized)
└── supabase.ts           # Database client
```

**Data flow:**

1. A cron job triggers `/api/scan` (protected by API key)
2. The scanner fetches trending tokens from Codex, then extracts top traders per token
3. Qualifying wallets are upserted into Supabase with aggregated stats
4. The frontend fetches from `/api/wallets` with pagination, search, and filters
5. Wallet details (including PnL chart and current holdings) are fetched on demand from `/api/wallets/[address]`

## Design Decisions

**Why Codex API?**
Codex provides pre-computed wallet statistics and token analytics that would be extremely expensive to calculate ourselves from raw blockchain data. Their `filterTokenWallets` endpoint lets us query traders per token with specific profit thresholds.

**Why aggressive filtering?**
Without strict filters, the database fills up with noise — bots, inactive wallets, airdrop recipients with inflated PnL. By requiring high minimum profit, recent activity, and real buy transactions, we ensure every wallet in the database is genuinely interesting.

**Why centralized config?**
All filter thresholds live in `lib/config.ts`. This makes it easy to tune the scanner without touching business logic — adjust minimum profit, change how many tokens to scan, or modify activity requirements in one place.

**Why wallet-based auth?**
No passwords, no emails. Users connect their Solana wallet and everything is tied to their address. Favorites, nicknames, and preferences are private and portable.

## Links

- **Website**: [justasignal.com](https://justasignal.com)
- **GitHub**: [github.com/bytebrox/signal](https://github.com/bytebrox/signal)
- **Community**: [x.com/bytebrox](https://x.com/i/communities/2021579927926059257)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Disclaimer

This tool is for informational purposes only. Cryptocurrency trading involves substantial risk. Past performance of tracked wallets does not guarantee future results. Always do your own research.
