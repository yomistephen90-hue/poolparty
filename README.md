# 🎮 PoolParty — Multiplayer Crypto Gaming on Injective

A **5-game prediction gaming platform** built on the Injective blockchain where players stake real INJ tokens and compete on outcomes determined by verifiable block hash randomness. Featuring innovative **carryover pools** that accumulate when no winners exist.

**Status:** Testnet-ready | **Deadline:** Africa Builderthon 2026 (March 23) | **Chain:** Injective

---

## ✨ Features

### **5 Unique Games**
- 🏎️ **Racing** — Pick a car, watch it race with physics-based obstacles
- 🎲 **Dice** — Spin a colorful wheel with 5 segments
- 🔢 **Numbers** — Guess the hidden mystery number with card flips
- 🏊 **Pool** — Solid or stripe ball sinks first (50/50 odds)
- 🎡 **Spin** — Pick a roulette wheel segment

### **Fair Randomness**
✅ **Block Hash RNG** — Randomness determined by Injective blockchain validators, not servers  
✅ **Verifiable** — Check results on Injective Explorer after every game  
✅ **Tamper-proof** — 1000s of validators confirm outcomes  
✅ **Zero house edge** — No mathematical advantage against players

### **Innovative Carryover Pools** ⭐
When no one picks the winning outcome, the entire pool carries forward and accumulates:
```
Round 1: 10 INJ → NO winners → Carryover = 10 INJ
Round 2: 8 INJ → NO winners → Carryover = 18 INJ
Round 3: 5 INJ → WINNERS! → Split (5+18)×0.99 = 22.77 INJ
```
This creates bigger "superpools" and rewards player patience and retention.

### **Beautiful UX**
- Responsive design (mobile, tablet, desktop)
- Smooth animations (card flips, wheel spins, race sequences)
- Real-time live feed of player stakes
- All-time leaderboards
- Personal win/loss history
- Instant payouts

### **Blockchain Integration**
- **Wallet Support:** Keplr, Leap
- **Token:** INJ (Injective)
- **Network:** Testnet (ready for mainnet)
- **Payouts:** Instant, on-chain verified
- **Smart Contract:** CosmWasm (Rust)

---

## 🎯 How It Works

### **Simple 45-Second Game Loop**

```
┌─────────────────────────────────────────┐
│ PHASE 1: STAKING (30 seconds)          │
│ • Pick an outcome (car, color, number) │
│ • Stake INJ                             │
│ • Watch live feed of other players     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ PHASE 2: LOCKED (5 seconds)             │
│ • No more bets allowed                  │
│ • Countdown to outcome reveal           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ PHASE 3: REVEAL (10 seconds)            │
│ • Outcome determined by block hash RNG │
│ • Animation shows the result            │
│ • Winners announced                     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ PHASE 4: PAYOUTS (5 seconds)            │
│ • Winners split 99% of pool             │
│ • Creator gets 1% fee                   │
│ • Payouts sent to wallets               │
│ • Next round begins                     │
└─────────────────────────────────────────┘
```

### **Economics**
| Item | Percentage | Details |
|------|-----------|---------|
| **Winners** | 99% | Split among all who picked correct outcome |
| **Creator Fee** | 1% | Sustains platform development |
| **House Edge** | 0% | No mathematical advantage against players |

---

## 🚀 Getting Started

### **Play on Testnet**

1. **Install Wallet**
   - [Keplr](https://www.keplr.app/) or [Leap](https://www.leapwallet.io/)

2. **Get Testnet INJ**
   - Open the game and click "GET TEST INJ"
   - Faucet provides free testnet tokens (worthless, for testing only)

3. **Connect & Play**
   - Click "Connect Wallet"
   - Choose a game (Racing, Dice, Numbers, Pool, or Spin)
   - Pick an outcome and stake
   - Watch the result reveal

4. **Verify Payouts**
   - Check the leaderboard
   - Click explorer link next to a player name
   - See transactions on Injective testnet explorer

### **Deploy Locally**

```bash
# Clone the repo
git clone https://github.com/yomistephen90-hue/poolparty.git
cd poolparty

# Install dependencies (if needed)
npm install

# Run on localhost
npm run dev
# or open index.html directly in browser

# Smart contract
cd contract
cargo build --release --target wasm32-unknown-unknown
```

---

## 📁 Project Structure

```
poolparty/
├── game-car.html           # Racing game
├── game-dice.html          # Dice/wheel game
├── game-num.html           # Mystery numbers game
├── game-pool.html          # Pool/billiards game
├── game-spin.html          # Roulette/spin game
├── simulate-*.html         # Demo versions (no blockchain)
│
├── index.html              # Landing page
├── wallet.js               # Keplr/Leap integration
├── config.js               # Configuration
├── contract.js             # Smart contract interface
│
├── contract/               # CosmWasm smart contract
│   ├── src/
│   │   └── lib.rs         # Contract logic
│   ├── Cargo.toml
│   └── ...
│
├── README.md               # This file
└── deploy.sh               # Deployment script
```

---

## 🔧 Technical Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, JavaScript (vanilla) |
| **Smart Contract** | CosmWasm (Rust) |
| **Blockchain** | Injective (Cosmos SDK) |
| **Randomness** | Block Hash RNG (on-chain) |
| **Wallet Integration** | Keplr, Leap |
| **Hosting** | Netlify (frontend), Injective (contract) |

---

## 📊 Game Mechanics

### **🏎️ Racing**
- 5 cars race on animated track
- Winner determined by block hash RNG
- Obstacles slow cars down randomly
- Winner car gets slight speed boost
- 20% probability per car
- **Payout:** Pool × 99% ÷ number of winners

### **🎲 Dice**
- Colorful spinning wheel with 5 segments
- Smooth deceleration animation
- 20% probability per segment
- **Payout:** Pool × 99% ÷ number of winners

### **🔢 Numbers**
- Mystery number hidden in range (e.g., "find between 5-8")
- 4 cards flip to reveal (3 decoys, 1 mystery)
- You pick from 5+ options
- Skill-based element (reading the range)
- **Payout:** Pool × 99% ÷ number of winners

### **🏊 Pool**
- Realistic billiards physics
- Cue ball breaks and scatters balls
- First ball sunk determines winner (solid or stripe)
- 50/50 odds (perfectly balanced)
- **Payout:** Pool × 99% ÷ number of winners

### **🎡 Spin**
- Roulette wheel with 6-8 segments
- Each segment equally likely
- Anti-casino mechanics (no house edge)
- **Payout:** Pool × 99% ÷ number of winners

---

## 🏆 Why PoolParty Wins

### **Against Other Gaming Dapps**
- ✅ 5 games, not 1
- ✅ Block hash RNG (fairer than Math.random)
- ✅ Carryover pools (unique retention mechanic)
- ✅ Professional UX (beautiful, fast, responsive)

### **Against Web2 Gaming**
- ✅ Players own wallets (no account needed)
- ✅ Payouts verified on-chain
- ✅ Transparent economics
- ✅ No centralized authority

### **Innovation**
- ✅ Carryover pool mechanic (no competitor has this)
- ✅ Block hash RNG (verifiable fairness)
- ✅ 5 different game types (variety)
- ✅ Real blockchain integration (testnet-ready)

---

## 📈 Metrics

| Metric | Value |
|--------|-------|
| **Games** | 5 |
| **Average Game Duration** | 45 seconds |
| **Creator Fee** | 1% (lowest industry standard) |
| **House Edge** | 0% (within winners) |
| **Payout Speed** | Instant (on-chain) |
| **Fairness** | Verifiable on blockchain |

---

## 🔐 Security

- **No Admin Keys** — Smart contract handles all logic automatically
- **No Server-Side Randomness** — Block hash determined by validators
- **Verifiable Outcomes** — Check explorer after every game
- **No Hidden Mechanics** — All calculations transparent
- **User Funds Safe** — Payouts go directly to wallets

## 🚢 Deployment

### **Current Status**
- ✅ Frontend: Complete, testnet-ready
- ✅ Smart Contract: Ready for deployment
- ✅ Wallet Integration: Keplr/Leap working
- ⏳ Testnet Deployment: In progress
- ⏳ Mainnet: Ready to scale

### **Deploy to Testnet**
```bash
# 1. Build contract
cd contract
cargo build --release --target wasm32-unknown-unknown

# 2. Deploy via Injective CLI or web interface
# https://testnet.explorer.injective.network/

# 3. Update config.js with contract address
# REACT_APP_CONTRACT_ADDRESS=inj1xxxxx

# 4. Deploy frontend to Netlify
npm run build
# Drag build folder to Netlify
```

---

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional game types
- Mobile optimization
- Leaderboard filters
- Advanced analytics dashboard
- Multi-chain support

---

## 👨‍💻 Author

**Stephen** ([@yomistephen90-hue](https://github.com/yomistephen90-hue))

- Full-stack Web3 developer
- Built for Africa Builderthon 2026 (Injective)
---


## 🎯 Next Steps

1. ✅ Code development complete
2. ⏳ Deploy smart contract to testnet
3. ⏳ Test with community on testnet
4. ⏳ Optimize for mainnet
5. ⏳ Launch on Injective mainnet

---


**Ready to play? [Get Started Now](https://injpoolparty.netlify.app/)** 🚀

---

