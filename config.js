// ─────────────────────────────────────────────────────────────────────────────
// PoolParty — Creator Config
// Update these values with YOUR wallet and contract address
// ─────────────────────────────────────────────────────────────────────────────

const POOLPARTY_CONFIG = {

  // ── WALLET ADDRESS ────────────────────────────────────────────────────
  CREATOR_WALLET: "inj12hq0ez424h38xv6dd9jyjcpxgqxv3rrx52cud8",

  // ── CONTRACT ADDRESS ───────────────────────────────────────────────────────
  CONTRACT_ADDRESS: "inj1REPLACE_WITH_YOUR_CONTRACT_ADDRESS",

  // ── PLATFORM FEE ──────────────────────────────────────────────────────────
  FEE_PERCENT: 1,       // shown to users
  FEE_BPS: 100,         // used in contract (basis points)

  // ── NETWORK ───────────────────────────────────────────────────────────────
  NETWORK: "testnet",   // change to "mainnet" when going live
  CHAIN_ID: "injective-888",       // testnet
  // CHAIN_ID: "injective-1",      // mainnet (uncomment when ready)

  // ── EXPLORER ──────────────────────────────────────────────────────────────
  EXPLORER: "https://testnet.explorer.injective.network", // testnet
  // EXPLORER: "https://explorer.injective.network",      // mainnet

};


console.log('[PoolParty] Config loaded. Creator:', POOLPARTY_CONFIG.CREATOR_WALLET.slice(0,10)+'...');
