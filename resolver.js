#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// PumpTrack Race Resolver
// Runs as a backend service. Listens to game timing and calls resolve_race
// on the contract after each race, using the Injective block hash as RNG seed.
//
// Usage: node resolver.js
// ─────────────────────────────────────────────────────────────────────────────

const https = require('https');
const http  = require('http');

// ── CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  CONTRACT:    process.env.CONTRACT_ADDR || "inj1REPLACE_WITH_CONTRACT",
  CHAIN_ID:    "injective-888",
  LCD:         "https://testnet.sentry.lcd.injective.network",
  RPC:         "https://testnet.sentry.tm.injective.network",
  WALLET_MNEMONIC: process.env.WALLET_MNEMONIC || "", // set via env var — never hardcode
  STAKING_MS:  30000,   // 30s staking
  LOCK_MS:     5000,    // 5s lock
  RACE_MS:     10000,   // 10s race
  NUM_CARS:    5,
};

let currentRaceId = 1;
let isRunning = false;

// ── FETCH HELPERS ─────────────────────────────────────────────────────────────
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

// Get latest block hash from Injective RPC — used as provably fair RNG seed
async function getLatestBlockHash() {
  try {
    const data = await fetchJson(`${CONFIG.RPC}/block`);
    return data.result?.block_id?.hash || null;
  } catch(err) {
    console.error('Failed to get block hash:', err.message);
    return null;
  }
}

// Derive winner car (1-5) from block hash — deterministic and verifiable
function deriveWinnerFromHash(blockHash) {
  // Take last 8 chars of hash, parse as hex, mod 5, +1 → car 1-5
  const last8 = blockHash.slice(-8);
  const num = parseInt(last8, 16);
  return (num % CONFIG.NUM_CARS) + 1;
}

// Query current contract race state
async function queryRaceState() {
  try {
    const query = Buffer.from(JSON.stringify({ race_state: {} })).toString('base64');
    const url = `${CONFIG.LCD}/cosmwasm/wasm/v1/contract/${CONFIG.CONTRACT}/smart/${query}`;
    const data = await fetchJson(url);
    if(data.data) {
      return JSON.parse(Buffer.from(data.data, 'base64').toString());
    }
  } catch(err) {
    console.error('Race state query failed:', err.message);
  }
  return null;
}

// ── GAME LOOP ─────────────────────────────────────────────────────────────────
async function runGameLoop() {
  if(isRunning) return;
  isRunning = true;

  console.log(`\n🏎️  PumpTrack Resolver started`);
  console.log(`   Contract: ${CONFIG.CONTRACT}`);
  console.log(`   Chain:    ${CONFIG.CHAIN_ID}\n`);

  while(true) {
    console.log(`\n── Race #${currentRaceId} ─────────────────────────`);

    // ── STAKING PHASE (30s) ──────────────────────────────────────────────────
    console.log(`⏳ [${timestamp()}] Staking open (30s)...`);
    await sleep(CONFIG.STAKING_MS);

    // ── LOCK PHASE (5s) ──────────────────────────────────────────────────────
    console.log(`🔒 [${timestamp()}] Stakes locked (5s)...`);
    // In production: call lock_staking on contract here
    // await execLockStaking(currentRaceId);
    await sleep(CONFIG.LOCK_MS);

    // ── RACE PHASE (10s) ─────────────────────────────────────────────────────
    console.log(`🏁 [${timestamp()}] Race running (10s)...`);
    await sleep(CONFIG.RACE_MS);

    // ── RESOLVE ──────────────────────────────────────────────────────────────
    console.log(`🎲 [${timestamp()}] Getting block hash for RNG...`);
    const blockHash = await getLatestBlockHash();

    if(!blockHash) {
      console.error('No block hash — skipping resolve');
      currentRaceId++;
      continue;
    }

    const winnerCar = deriveWinnerFromHash(blockHash);
    console.log(`🏆 [${timestamp()}] Winner: Car #${winnerCar} (hash: ${blockHash.slice(0,16)}...)`);

    // Log the resolve message (execute this via injectived CLI or SDK)
    const resolveMsg = {
      resolve_race: {
        winner_car: winnerCar,
        block_hash: blockHash,
      }
    };

    console.log(`\n   Execute this to resolve on-chain:`);
    console.log(`   injectived tx wasm execute ${CONFIG.CONTRACT} '${JSON.stringify(resolveMsg)}' \\`);
    console.log(`     --from pumptrack-deployer --chain-id ${CONFIG.CHAIN_ID} \\`);
    console.log(`     --gas auto --gas-prices 500000000inj --yes\n`);

    // ── OPEN NEXT RACE ────────────────────────────────────────────────────────
    currentRaceId++;
    const openMsg = { open_staking: { race_id: currentRaceId } };
    console.log(`   Open next race:`);
    console.log(`   injectived tx wasm execute ${CONFIG.CONTRACT} '${JSON.stringify(openMsg)}' \\`);
    console.log(`     --from pumptrack-deployer --chain-id ${CONFIG.CHAIN_ID} \\`);
    console.log(`     --gas auto --gas-prices 500000000inj --yes\n`);

    // Brief pause before next staking opens
    await sleep(3000);
  }
}

// ── ALSO SERVE RACE STATE for frontend to poll ────────────────────────────────
// Lightweight HTTP server on port 3001 that proxies contract queries
const stateServer = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if(req.url === '/race-state'){
    const state = await queryRaceState();
    res.end(JSON.stringify(state || { error: 'contract not reachable' }));
  } else if(req.url === '/block-hash'){
    const hash = await getLatestBlockHash();
    res.end(JSON.stringify({ hash, winner: hash ? deriveWinnerFromHash(hash) : null }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not found' }));
  }
});

stateServer.listen(3001, () => {
  console.log('📡 Race state server on http://localhost:3001/race-state');
});

// ── HELPERS ───────────────────────────────────────────────────────────────────
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
function timestamp(){ return new Date().toLocaleTimeString(); }

// ── START ─────────────────────────────────────────────────────────────────────
runGameLoop().catch(err => {
  console.error('Fatal resolver error:', err);
  process.exit(1);
});
