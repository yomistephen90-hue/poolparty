#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# PoolParty — Injective Testnet Deployment Script
# 5-Game Multiplayer Crypto Gaming Platform
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── CONFIG — update these ────────────────────────────────────────────────────
WALLET_NAME="poolparty-deployer"              # Your Keplr wallet key name
CREATOR_ADDR="inj1YOUR_ADDRESS_HERE"         # Your INJ wallet (receives 1% fees)
CHAIN_ID="injective-888"                      # Injective testnet
NODE="https://testnet.sentry.tm.injective.network:443"
LCD="https://testnet.sentry.lcd.injective.network"
WASM_FILE="./contract/target/wasm32-unknown-unknown/release/poolparty.wasm"
GAS_PRICES="500000000inj"

# ── STEP 1: Build optimized WASM ─────────────────────────────────────────────
echo ""
echo "🔨 Building optimized WASM for PoolParty..."
cd contract
cargo build --release --target wasm32-unknown-unknown
cd ..
echo "✅ Build complete: target/wasm32-unknown-unknown/release/poolparty.wasm"

# ── STEP 2: Upload WASM to Injective testnet ──────────────────────────────────
echo ""
echo "📤 Uploading WASM to Injective testnet..."
UPLOAD_TX=$(injectived tx wasm store "$WASM_FILE" \
  --from "$WALLET_NAME" \
  --chain-id "$CHAIN_ID" \
  --node "$NODE" \
  --gas auto \
  --gas-adjustment 1.4 \
  --gas-prices "$GAS_PRICES" \
  --broadcast-mode sync \
  --yes \
  --output json)

UPLOAD_TX_HASH=$(echo "$UPLOAD_TX" | jq -r '.txhash')
echo "Upload tx: $UPLOAD_TX_HASH"
echo "Waiting for confirmation..."
sleep 8

# Get code ID from tx result
CODE_ID=$(injectived query tx "$UPLOAD_TX_HASH" \
  --node "$NODE" \
  --output json | jq -r '.logs[0].events[] | select(.type=="store_code") | .attributes[] | select(.key=="code_id") | .value')

echo "✅ Code ID: $CODE_ID"

# ── STEP 3: Instantiate contract ──────────────────────────────────────────────
echo ""
echo "🚀 Instantiating PoolParty contract..."

# Get your deployer address
OWNER=$(injectived keys show "$WALLET_NAME" --output json | jq -r '.address')
echo "Owner address: $OWNER"

INIT_MSG=$(cat <<EOF
{
  "creator": "$OWNER",
  "fee_percent": 1
}
EOF
)

INSTANTIATE_TX=$(injectived tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
  --label "PoolParty v1" \
  --from "$WALLET_NAME" \
  --chain-id "$CHAIN_ID" \
  --node "$NODE" \
  --gas auto \
  --gas-adjustment 1.4 \
  --gas-prices "$GAS_PRICES" \
  --broadcast-mode sync \
  --yes \
  --output json)

INSTANTIATE_TX_HASH=$(echo "$INSTANTIATE_TX" | jq -r '.txhash')
echo "Instantiate tx: $INSTANTIATE_TX_HASH"
echo "Waiting for confirmation..."
sleep 8

# Get contract address
CONTRACT_ADDR=$(injectived query tx "$INSTANTIATE_TX_HASH" \
  --node "$NODE" \
  --output json | jq -r '.logs[0].events[] | select(.type=="instantiate") | .attributes[] | select(.key=="_contract_address") | .value')

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  ✅ PoolParty deployed on Injective Testnet!"
echo ""
echo "  Contract Address: $CONTRACT_ADDR"
echo "  Code ID:          $CODE_ID"
echo "  Owner:            $OWNER"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "👉 Now update config.js:"
echo "   REACT_APP_CONTRACT_ADDRESS = \"$CONTRACT_ADDR\";"
echo ""

# ── STEP 4: Open first game ───────────────────────────────────────────────────
echo "🎮 Opening Game Round #1..."

OPEN_MSG='{"new_game":{}}'
injectived tx wasm execute "$CONTRACT_ADDR" "$OPEN_MSG" \
  --from "$WALLET_NAME" \
  --chain-id "$CHAIN_ID" \
  --node "$NODE" \
  --gas auto \
  --gas-adjustment 1.4 \
  --gas-prices "$GAS_PRICES" \
  --broadcast-mode sync \
  --yes

echo "✅ Game Round #1 is now OPEN on-chain!"
echo ""
echo "🔗 View on Injective Explorer:"
echo "   https://testnet.explorer.injective.network/contract/$CONTRACT_ADDR"
echo ""
echo "🎮 Play on frontend:"
echo "   Update config.js with contract address above"
echo "   Deploy to Netlify: npm run build && drag to app.netlify.com/drop"