#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# PumpTrack — Injective Testnet Deployment Script
# Run this after building the contract WASM
# ─────────────────────────────────────────────────────────────────────────────

set -e

# ── CONFIG — update these ────────────────────────────────────────────────────
WALLET_NAME="pumptrack-deployer"          # Your Keplr key name in injectived
CREATOR_ADDR="inj12hq0ez424h38xv6dd9jyjcpxgqxv3rrx52cud8"   # Your INJ wallet — receives fees          # your injectived key name
CHAIN_ID="injective-888"                  # testnet chain ID
NODE="https://testnet.sentry.tm.injective.network:443"
LCD="https://testnet.sentry.lcd.injective.network"
WASM_FILE="./contract/artifacts/pumptrack.wasm"
GAS_PRICES="500000000inj"

# ── STEP 1: Build optimized WASM ─────────────────────────────────────────────
echo ""
echo "🔨 Building optimized WASM..."
cd contract
docker run --rm \
  -v "$(pwd)":/code \
  --mount type=volume,source="$(basename $(pwd))_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.15.0
cd ..
echo "✅ Build complete: artifacts/pumptrack.wasm"

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
echo "🚀 Instantiating PumpTrack contract..."

# Get your deployer address
OWNER=$(injectived keys show "$WALLET_NAME" --output json | jq -r '.address')
echo "Owner address: $OWNER"

INIT_MSG=$(cat <<EOF
{
  "owner": "$OWNER",
  "min_stake": "100000000000000000",
  "fee_bps": 100
}
EOF
)

INSTANTIATE_TX=$(injectived tx wasm instantiate "$CODE_ID" "$INIT_MSG" \
  --label "PumpTrack v1" \
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
echo "  ✅ PumpTrack deployed on Injective Testnet!"
echo ""
echo "  Contract Address: $CONTRACT_ADDR"
echo "  Code ID:          $CODE_ID"
echo "  Owner:            $OWNER"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "👉 Now update contract.js:"
echo "   const PUMPTRACK_CONTRACT = \"$CONTRACT_ADDR\";"
echo ""

# ── STEP 4: Open first race ───────────────────────────────────────────────────
echo "🏎️  Opening Race #1..."

OPEN_MSG='{"open_staking":{"race_id":1}}'
injectived tx wasm execute "$CONTRACT_ADDR" "$OPEN_MSG" \
  --from "$WALLET_NAME" \
  --chain-id "$CHAIN_ID" \
  --node "$NODE" \
  --gas auto \
  --gas-adjustment 1.4 \
  --gas-prices "$GAS_PRICES" \
  --broadcast-mode sync \
  --yes

echo "✅ Race #1 staking is now OPEN on-chain!"
echo ""
echo "🔗 View on Injective Explorer:"
echo "   https://testnet.explorer.injective.network/contract/$CONTRACT_ADDR"
