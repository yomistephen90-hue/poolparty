// ─── PumpTrack Contract Integration ──────────────────────────────────────────
// Connects the game UI to the CosmWasm contract on Injective testnet
// Uses @injectivelabs/sdk-ts loaded via CDN

const CREATOR_WALLET = "inj12hq0ez424h38xv6dd9jyjcpxgqxv3rrx52cud8"; // Your wallet — receives 1% fee
const PUMPTRACK_CONTRACT = "inj1REPLACE_WITH_YOUR_CONTRACT_ADDRESS"; // ← set after deploy
const INJECTIVE_TESTNET_RPC = "https://testnet.sentry.tm.injective.network:443";
const INJECTIVE_TESTNET_GRPC = "https://testnet.sentry.chain.grpc-web.injective.network";
const CHAIN_ID = "injective-888";
const INJ_DENOM = "inj";
const INJ_DECIMALS = 18; // 1 INJ = 1e18 uinj

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function toUinj(inj) {
  // Convert human INJ → uinj (BigInt to avoid float issues)
  return BigInt(Math.round(inj * 1e6)) * BigInt(1e12);
}

function fromUinj(uinj) {
  return Number(BigInt(uinj)) / 1e18;
}

function shortAddr(addr) {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// ─── QUERY HELPERS (no wallet needed) ────────────────────────────────────────

async function queryContract(queryMsg) {
  try {
    const encoded = btoa(JSON.stringify(queryMsg));
    const url = `${INJECTIVE_TESTNET_GRPC}/cosmwasm/wasm/v1/contract/${PUMPTRACK_CONTRACT}/smart/${encoded}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code) throw new Error(data.message || 'Query failed');
    // decode base64 data field
    return JSON.parse(atob(data.data));
  } catch (err) {
    console.error('Contract query error:', err);
    return null;
  }
}

async function fetchRaceState() {
  return await queryContract({ race_state: {} });
}

async function fetchPoolBreakdown() {
  return await queryContract({ pool_breakdown: {} });
}

async function fetchPlayerStake(address) {
  return await queryContract({ player_stake: { address } });
}

async function fetchLeaderboard() {
  return await queryContract({ leaderboard: {} });
}

// ─── EXECUTE HELPERS (wallet required) ───────────────────────────────────────

async function execStake(carNumber, injAmount) {
  const wallet = window.PumpWallet;
  if (!wallet?.address) {
    alert('Connect your wallet first!');
    return null;
  }

  const uinj = toUinj(injAmount).toString();

  // Build CosmWasm execute message
  const executeMsg = {
    stake: { cars: [carNumber] }
  };

  // Get offline signer from Keplr/Leap
  const provider = wallet.provider === 'keplr' ? window.keplr : window.leap;
  const offlineSigner = provider.getOfflineSigner(CHAIN_ID);
  const accounts = await offlineSigner.getAccounts();
  const signerAddress = accounts[0].address;

  // Build tx using window.keplr signAndBroadcast
  const msg = {
    typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
    value: {
      sender: signerAddress,
      contract: PUMPTRACK_CONTRACT,
      msg: new TextEncoder().encode(JSON.stringify(executeMsg)),
      funds: [{ denom: INJ_DENOM, amount: uinj }]
    }
  };

  try {
    // Use Keplr's experimental broadcast
    const result = await provider.sendTx(
      CHAIN_ID,
      await buildTx(signerAddress, msg, offlineSigner),
      { preferNoSetFee: false }
    );
    return result;
  } catch (err) {
    console.error('Stake tx error:', err);
    showTxError(err.message || 'Transaction failed');
    return null;
  }
}

// ─── SIMPLE TX BUILDER (works with Keplr amino signing) ──────────────────────

async function buildTx(sender, msg, offlineSigner) {
  // For Keplr, we can use signAmino or signDirect
  // This builds a minimal amino tx
  const fee = {
    amount: [{ denom: INJ_DENOM, amount: "5000000000000000" }], // 0.005 INJ gas fee
    gas: "200000"
  };

  const chainInfo = await window.keplr?.getChainInfoWithoutEndpoints(CHAIN_ID)
    .catch(() => null);
  const sequence = await fetchAccountSequence(sender);

  return {
    msg,
    fee,
    memo: "PumpTrack stake",
    sequence
  };
}

async function fetchAccountSequence(address) {
  try {
    const res = await fetch(
      `https://testnet.sentry.lcd.injective.network/cosmos/auth/v1beta1/accounts/${address}`
    );
    const data = await res.json();
    return parseInt(data.account?.base_account?.sequence || 0);
  } catch { return 0; }
}

// ─── GAME INTEGRATION FUNCTIONS ──────────────────────────────────────────────
// These are called by game.html at the right moments in the game loop

// Called when staking opens — sync on-chain state to UI
async function onStakingOpened() {
  const state = await fetchRaceState();
  if (!state) return;

  // If contract says staking is open, sync race ID
  window._contractRaceId = state.race_id;
  window._contractPhase = state.phase;

  // Show on-chain pool size if available
  if (state.total_pool && state.total_pool !== '0') {
    const poolInj = fromUinj(state.total_pool);
    // UI update handled in game.html — just expose the data
    window._onChainPool = poolInj;
  }

  console.log(`[PumpTrack] Race #${state.race_id} staking open`);
}

// Called when player clicks STAKE — sends real INJ tx
async function onPlayerStake(carNumber, injAmount, callback) {
  const wallet = window.PumpWallet;

  if (!wallet?.address) {
    // Not connected — fall back to simulation mode
    console.log('[PumpTrack] No wallet — running in demo mode');
    callback({ success: true, demo: true });
    return;
  }

  // Show loading state
  const btn = document.getElementById('stakeBtn');
  const originalText = btn.textContent;
  btn.textContent = '⏳ SENDING...';
  btn.disabled = true;

  try {
    // Send real transaction
    const result = await execStake(carNumber, injAmount);

    if (result) {
      console.log('[PumpTrack] Stake tx successful:', result);
      // Refresh wallet balance
      await window.PumpWallet.fetchBalance();
      window.PumpWallet.updateUI();
      callback({ success: true, txHash: result.transactionHash, demo: false });
    } else {
      btn.textContent = originalText;
      btn.disabled = false;
      callback({ success: false });
    }
  } catch (err) {
    console.error('[PumpTrack] Stake failed:', err);
    btn.textContent = originalText;
    btn.disabled = false;
    callback({ success: false, error: err.message });
  }
}

// Called after race ends — query on-chain payout for this player
async function checkPlayerPayout(raceId) {
  const wallet = window.PumpWallet;
  if (!wallet?.address) return null;

  const stakeData = await fetchPlayerStake(wallet.address);
  if (!stakeData) return null;

  if (stakeData.payout && stakeData.payout !== '0') {
    const payoutInj = fromUinj(stakeData.payout);
    // Refresh wallet balance to show new amount
    await wallet.fetchBalance();
    wallet.updateUI();
    return payoutInj;
  }
  return null;
}

// Poll on-chain winner after race ends
async function pollRaceResult(expectedRaceId, onResult) {
  let attempts = 0;
  const poll = setInterval(async () => {
    attempts++;
    const state = await fetchRaceState();
    if (!state) return;

    if (state.phase === 'resolved' && state.race_id === expectedRaceId) {
      clearInterval(poll);
      onResult(state.winner_car);
    }

    if (attempts > 20) clearInterval(poll); // stop after 20s
  }, 1000);
}

// ─── TX ERROR DISPLAY ─────────────────────────────────────────────────────────

function showTxError(message) {
  const existing = document.getElementById('txErrorBanner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.id = 'txErrorBanner';
  banner.style.cssText = `
    position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);
    background:#1a0a0a;border:1px solid #ff6b35;color:#ff6b35;
    padding:.8rem 1.5rem;border-radius:6px;font-family:Orbitron,monospace;
    font-size:.75rem;z-index:999;max-width:90vw;text-align:center;
  `;
  banner.textContent = '⚠️ ' + message;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 5000);
}

// ─── FAUCET HELPER ────────────────────────────────────────────────────────────
// Opens Injective testnet faucet so players can get test INJ

function openFaucet() {
  const addr = window.PumpWallet?.address;
  if (addr) {
    window.open(`https://testnet.faucet.injective.network/?address=${addr}`, '_blank');
  } else {
    window.open('https://testnet.faucet.injective.network/', '_blank');
  }
}

console.log('[PumpTrack] Contract module loaded');
