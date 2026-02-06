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
    
    // Minimum buy amount in USD
    minBuyAmountUsd: 100,
    
    // Maximum buy amount (filters out whales that move markets)
    maxBuyAmountUsd: 50000,
    
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
