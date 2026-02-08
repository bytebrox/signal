/**
 * SIGNAL Scanner Configuration
 * 
 * Adjust these values to fine-tune wallet discovery.
 * All filter values can be modified without touching the main code.
 */

export const config = {
  // ===========================================
  // NETWORK
  // ===========================================
  solana: {
    networkId: 1399811149,  // Codex Network ID for Solana
    // Tokens to exclude from scanning (native tokens, stablecoins, wrapped assets, LSTs)
    excludedTokens: [
      // Native / Wrapped
      'So11111111111111111111111111111111111111112',  // Wrapped SOL
      
      // Stablecoins
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
      '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo', // PYUSD (PayPal)
      
      // Liquid Staking Tokens
      'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',  // mSOL (Marinade)
      'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // jitoSOL
      'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',  // bSOL (BlazeStake)
      '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL (Lido)
      '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm', // INF (Sanctum Infinity)
      
      // Wrapped / Bridge Tokens
      '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // wETH (Wormhole)
      '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // wBTC (Wormhole)
      '6DNSN2BJsaPFdBAy7hc91iKk5y3bkPSBLNeGYCk6SnCe', // tBTC (Threshold)
      
      // Wrapped Assets
      'A9mUU4qviSctJVPJdBGsyN1XDALPHVmFn7Fof1pYRfAS', // wSOL (Wormhole)
      '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT', // UXD (Stablecoin)
      
      // LP / DeFi Infrastructure Tokens
      '27G8MtK7VnTknkBAMA1biGBHjEJRfKwrPoSmHdMkiT5c', // JLP (Jupiter LP)
      '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY (Raydium)
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',  // JUP (Jupiter)
      'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',  // ORCA
      'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey',  // MNDE (Marinade)
      
      // Established Memecoins (too large for insider signals)
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
      
      // Additional LSTs / Yield Tokens
      'jupSoLaHXQiZZTSfEWMTRRgpnyFm8f6sZdosWBjx93v',  // jupSOL
      'he1iusmfkpAdwvxLNGV8Y1iSbj4rUy6yMhEA3fotn9A',  // hSOL (Helius)
      'LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp',  // LST (Sanctum)
      'Comp4ssDzXcLeu2MnLuGNNFC4cmLPMng8qWHPvzAMU1h',  // compassSOL
      
      // Established Large-Cap Tokens (too large for insider signals)
      'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF (dogwifhat)
      'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
      '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ', // W (Wormhole)
      'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',  // JTO (Jito)
      'TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6',  // TENSOR
      
      // Additional Stablecoins / Pegged
      'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6', // USDY (Ondo)
      'HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr', // EURC (Circle EUR)
      'EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCWNWqxWV4J6o', // DAI (Wormhole)
      
      // Additional DeFi / Infrastructure
      'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',  // STEP (Step Finance)
      'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',  // SRM (Serum)
      'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',  // FIDA (Bonfida)
    ],
  },

  // ===========================================
  // SCANNER SETTINGS
  // ===========================================
  scanner: {
    // How many trending tokens to scan per run
    tokensToScan: 100,
    
    // How many top traders to fetch per token
    tradersPerToken: 25,
    
    // Delay between API calls (ms) to avoid rate limits
    apiDelayMs: 100,
    
    // Minimum trades required to be saved
    minTotalTrades: 1,
  },

  // ===========================================
  // WALLET FILTERS (for filterWallets endpoint)
  // ===========================================
  walletFilters: {
    // --- PROFITABILITY (Aggressive Insider Settings) ---
    
    // Minimum profit percentage in last 7 days (1000 = 1000% = 10x)
    minProfitPercent1w: 1000,
    
    // Minimum USD profit in last 7 days
    minProfitUsd1w: 5000,
    
    // Minimum average profit per trade in USD
    minAvgProfitPerTrade: 500,
    
    // Minimum win rate percentage (60 = 60%)
    minWinRate: 60,

    // --- ACTIVITY ---
    
    // Swap count range (too few = inactive, too many = bot)
    minSwaps1w: 3,
    maxSwaps1w: 100,
    
    // Unique tokens traded (too many = random, too few = not diversified)
    minUniqueTokens1w: 2,
    maxUniqueTokens1w: 20,
    
    // Minimum trading volume in USD
    minVolumeUsd1w: 5000,
    
    // Minimum average swap size in USD
    minAvgSwapAmount: 500,

    // --- QUALITY ---
    
    // Maximum scammer score (0-100, lower = safer)
    maxScammerScore: 20,
  },

  // ===========================================
  // TOKEN WALLET FILTERS (for filterTokenWallets endpoint)
  // ===========================================
  tokenWalletFilters: {
    // Minimum buys in last 30 days
    minBuys30d: 1,
    
    // Minimum sells in last 30 days (ensures realized profit)
    minSells30d: 1,
    
    // Minimum realized profit in USD for the token
    minRealizedProfitUsd: 500,
    
    // Minimum profit percentage (500 = 500% = 6x return)
    minProfitPercent: 500,
    
    // Minimum entry cost in USD (filters airdrops, transfers, micro-buys)
    // Used for both 30d buy volume and token acquisition cost
    minEntryCostUsd: 10,
    
    // Maximum buy amount (filters out whales that move markets)
    maxBuyAmountUsd: 100000,
    
    // Maximum days since last trade (filters out inactive wallets)
    // 7 = only wallets active in the last week
    maxDaysSinceLastTrade: 7,
  },

  // ===========================================
  // TRENDING TOKENS FILTERS (for filterTokens with trendingScore24)
  // ===========================================
  trendingTokens: {
    // Minimum 24h volume in USD (recommended: 100k+)
    minVolume24h: 100000,
    
    // Minimum liquidity in USD (recommended: 50k+)
    minLiquidity: 50000,
    
    // Minimum market cap in USD
    minMarketCap: 50000,
    
    // Maximum market cap (0 = no limit) - filter out mega caps
    maxMarketCap: 0,
    
    // Minimum price change percentage (to find pumping tokens)
    minPriceChange24h: 0,  // 0 = no filter
    
    // Use FILTERED statsType to remove MEV/bot activity
    useFilteredStats: true,
  },

  // ===========================================
  // DISPLAY / UI
  // ===========================================
  display: {
    // Number of wallets to show in dashboard (0 = show all)
    walletsPerPage: 50,
    
    // Default time range filter
    defaultTimeRange: 'all' as const,
    
    // Refresh interval for data (ms) - 0 = manual only
    autoRefreshMs: 0,

    // Days since last trade after which a wallet is considered "inactive"
    inactiveDays: 14,
  },

  // ===========================================
  // TAGS (auto-assigned based on performance)
  // ===========================================
  tags: {
    // Thresholds for "Smart Money" tag
    smartMoney: {
      minProfitPercent: 500,
      minWinRate: 60,
      minTrades: 5,
    },
    
    // Thresholds for "Whale" tag
    whale: {
      minVolumeUsd: 100000,
    },
    
    // Thresholds for "Consistent" tag
    consistent: {
      minAppearances: 3,  // Found in 3+ different tokens
      minWinRate: 55,
    },
    
    // Thresholds for "Early Bird" tag (buys early)
    earlyBird: {
      maxTokenAgeHours: 24,  // Bought within 24h of token launch
    },
  },
}

// Type export for TypeScript
export type Config = typeof config
