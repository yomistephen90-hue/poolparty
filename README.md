# 🏎️ PumpTrack

> Provably fair car race game on Injective. Stake INJ, pick your car, win the pool.

---

## Local Development

### Option A — Node.js server (recommended)
```bash
# In the poolparty/ folder:
node server.js
```
Then open: **http://localhost:3000**

### Option B — VS Code Live Server
1. Install the **Live Server** extension in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. It auto-reloads on every file save 🔥

### Option C — Python (if you have it)
```bash
python -m http.server 3000
```

---

## File Structure

```
poolparty/
├── index.html       ← Landing page
├── game.html        ← Live game (real INJ)
├── simulate.html    ← Practice mode (fake INJ)
├── wallet.js        ← Keplr / Leap wallet connection
├── server.js        ← Local dev server
└── contract/        ← CosmWasm smart contract (Rust)
    ├── Cargo.toml
    └── src/
        ├── lib.rs
        ├── contract.rs  ← Main logic
        ├── msg.rs       ← Message types
        ├── state.rs     ← Storage
        └── error.rs     ← Error types
```

---

## Game Loop

```
⏳ STAKING OPEN (30s)  →  players pick cars + stake INJ
🔒 STAKES LOCKED (5s)  →  no more bets
🏁 RACE RUNS (10s)     →  5 cartoon cars, random obstacles
🏆 WINNER ANNOUNCED    →  instant payout + next race countdown
🔁 REPEAT every ~45s
```


## Push to Git

```bash
# First time
git init
git add .
git commit -m "feat: PumpTrack v1 - car race game on Injective"
git remote add origin https://github.com/YOUR_USERNAME/pumptrack.git
git push -u origin main

# After changes
git add .
git commit -m "fix: whatever you fixed"
git push
```

---

## Deploy to Netlify (after testing)

1. Push to GitHub (above)
2. Go to [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Select your repo → Build settings: leave blank (static site)
4. Click **Deploy site**
5. Your live URL appears in ~30 seconds

Or drag-and-drop: go to [app.netlify.com/drop](https://app.netlify.com/drop) and drop the `pumptrack/` folder.

---

## Smart Contract (Injective Testnet)

```bash
# Prerequisites: Rust + wasm target
rustup target add wasm32-unknown-unknown
cargo install cosmwasm-check

# Build
cd contract/
cargo build --release --target wasm32-unknown-unknown

# Optimize (requires Docker)
docker run --rm -v "$(pwd)":/code \
  cosmwasm/rust-optimizer:0.15.0

# Deploy to Injective testnet via injectived
injectived tx wasm store artifacts/pumptrack.wasm \
  --from wallet --chain-id injective-888 \
  --node https://testnet.sentry.tm.injective.network:443 \
  --gas auto --fees 1000000000000000inj
```

---

Built for **Injective Africa Builderthon 2026** 🌍
