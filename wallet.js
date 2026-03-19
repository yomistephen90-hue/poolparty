// PoolParty — Injective Wallet Connection
const INJECTIVE_TESTNET_CHAIN_ID = "injective-888";

const CHAIN_CONFIG = {
  chainId: INJECTIVE_TESTNET_CHAIN_ID,
  chainName: "Injective Testnet",
  rpc: "https://testnet.sentry.tm.injective.network:443",
  rest: "https://testnet.sentry.lcd.injective.network",
  bip44: { coinType: 60 },
  bech32Config: {
    bech32PrefixAccAddr: "inj", bech32PrefixAccPub: "injpub",
    bech32PrefixValAddr: "injvaloper", bech32PrefixValPub: "injvaloperpub",
    bech32PrefixConsAddr: "injvalcons", bech32PrefixConsPub: "injvalconspub"
  },
  currencies: [{ coinDenom: "INJ", coinMinimalDenom: "inj", coinDecimals: 18 }],
  feeCurrencies: [{ coinDenom: "INJ", coinMinimalDenom: "inj", coinDecimals: 18,
    gasPriceStep: { low: 500000000, average: 1000000000, high: 1500000000 } }],
  stakeCurrency: { coinDenom: "INJ", coinMinimalDenom: "inj", coinDecimals: 18 }
};

window.PumpWallet = {
  address: null,
  balance: null,
  provider: null,

  async connect() {
    if (window.keplr) {
      this.provider = "keplr";
      await window.keplr.experimentalSuggestChain(CHAIN_CONFIG);
      await window.keplr.enable(INJECTIVE_TESTNET_CHAIN_ID);
      const offlineSigner = window.keplr.getOfflineSigner(INJECTIVE_TESTNET_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      this.address = accounts[0].address;
    } else if (window.leap) {
      this.provider = "leap";
      await window.leap.experimentalSuggestChain(CHAIN_CONFIG);
      await window.leap.enable(INJECTIVE_TESTNET_CHAIN_ID);
      const offlineSigner = window.leap.getOfflineSigner(INJECTIVE_TESTNET_CHAIN_ID);
      const accounts = await offlineSigner.getAccounts();
      this.address = accounts[0].address;
    } else {
      this.showNoWalletModal();
      return null;
    }
    await this.fetchBalance();
    this.updateUI();
    localStorage.setItem("pt_wallet_provider", this.provider);
    return this.address;
  },

  disconnect() {
    this.address = null;
    this.balance = null;
    this.provider = null;
    localStorage.removeItem("pt_wallet_provider");
    this.updateUI();
    // Hide dropdown if open
    const dd = document.getElementById("walletDropdown");
    if (dd) dd.style.display = "none";
  },

  async fetchBalance() {
    if (!this.address) return;
    try {
      const res = await fetch(`${CHAIN_CONFIG.rest}/cosmos/bank/v1beta1/balances/${this.address}`);
      const data = await res.json();
      const inj = data.balances?.find(b => b.denom === "inj");
      this.balance = inj ? (parseFloat(inj.amount) / 1e18).toFixed(4) : "0.0000";
    } catch { this.balance = "0.0000"; }
  },

  updateUI() {
    const btn = document.getElementById("walletBtn");
    const balEl = document.getElementById("walletBalance");
    const dd = document.getElementById("walletDropdown");
    if (!btn) return;

    if (this.address) {
      const short = this.address.slice(0, 7) + "..." + this.address.slice(-5);
      btn.textContent = short + " ▾";
      btn.classList.add("connected");
      if (balEl) balEl.textContent = this.balance + " INJ";
      // Build dropdown content
      if (dd) {
        dd.innerHTML = `
          <div class="wd-addr">${short}</div>
          <div class="wd-bal">${this.balance} INJ</div>
          <div class="wd-divider"></div>
          <button class="wd-btn" onclick="navigator.clipboard?.writeText('${this.address}');window.PumpWallet.showCopied()">
            📋 Copy Address
          </button>
          <a class="wd-btn" href="https://testnet.explorer.injective.network/account/${this.address}" target="_blank" rel="noopener">
            🔍 View on Explorer
          </a>
          <div class="wd-divider"></div>
          <button class="wd-btn wd-disconnect" onclick="window.PumpWallet.disconnect()">
            🔌 Disconnect
          </button>
        `;
      }
    } else {
      btn.textContent = "Connect Wallet";
      btn.classList.remove("connected");
      if (balEl) balEl.textContent = "";
      if (dd) { dd.innerHTML = ""; dd.style.display = "none"; }
    }
  },

  showCopied() {
    const t = document.createElement("div");
    t.textContent = "✓ Address copied!";
    t.style.cssText = "position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);background:#0a1a12;border:2px solid #00f5a0;color:#00f5a0;padding:.6rem 1.2rem;border-radius:8px;font-family:Orbitron,monospace;font-size:.75rem;font-weight:700;z-index:9999;";
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2000);
  },

  showNoWalletModal() {
    const m = document.getElementById("noWalletModal");
    if (m) m.style.display = "flex";
  },

  async autoReconnect() {
    const saved = localStorage.getItem("pt_wallet_provider");
    if (saved === "keplr" && window.keplr) await this.connect();
    else if (saved === "leap" && window.leap) await this.connect();
  }
};

// Inject dropdown HTML + CSS into every page
document.addEventListener("DOMContentLoaded", () => {
  // Inject dropdown CSS
  if (!document.getElementById("walletDropdownStyle")) {
    const s = document.createElement("style");
    s.id = "walletDropdownStyle";
    s.textContent = `
      .wallet-btn-wrap { position: relative; display: inline-block; }
      #walletDropdown {
        display: none;
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        min-width: 210px;
        background: #0b0f1e;
        border: 1px solid #1c2340;
        border-radius: 10px;
        padding: .5rem;
        z-index: 500;
        box-shadow: 0 8px 32px rgba(0,0,0,.6);
        animation: ddIn .15s ease;
      }
      @keyframes ddIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:translateY(0); } }
      .wd-addr { font-family: Orbitron, monospace; font-size: .72rem; color: #00f5a0; padding: .4rem .6rem .1rem; }
      .wd-bal  { font-family: Orbitron, monospace; font-size: .85rem; font-weight: 700; color: #e8eaf6; padding: .1rem .6rem .4rem; }
      .wd-divider { height: 1px; background: #1c2340; margin: .3rem 0; }
      .wd-btn {
        display: block; width: 100%; text-align: left;
        background: none; border: none; cursor: pointer;
        color: #e8eaf6; font-family: 'DM Sans', sans-serif; font-size: .82rem;
        padding: .45rem .6rem; border-radius: 6px; text-decoration: none;
        transition: background .15s;
      }
      .wd-btn:hover { background: rgba(255,255,255,.06); }
      .wd-disconnect { color: #ff6b6b !important; }
      .wd-disconnect:hover { background: rgba(255,107,107,.1) !important; }
    `;
    document.head.appendChild(s);
  }

  // Wrap walletBtn in a div and create dropdown
  const btn = document.getElementById("walletBtn");
  if (btn && !btn.parentElement.classList.contains("wallet-btn-wrap")) {
    const wrap = document.createElement("div");
    wrap.className = "wallet-btn-wrap";
    btn.parentNode.insertBefore(wrap, btn);
    wrap.appendChild(btn);

    const dd = document.createElement("div");
    dd.id = "walletDropdown";
    wrap.appendChild(dd);

    // Toggle dropdown on button click when connected
    btn.addEventListener("click", async () => {
      if (window.PumpWallet.address) {
        // Toggle dropdown
        const isOpen = dd.style.display === "block";
        dd.style.display = isOpen ? "none" : "block";
      } else {
        await window.PumpWallet.connect();
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) {
        dd.style.display = "none";
      }
    });
  }

  window.PumpWallet.autoReconnect();

  const closeModal = document.getElementById("closeNoWallet");
  if (closeModal) closeModal.addEventListener("click", () => {
    document.getElementById("noWalletModal").style.display = "none";
  });
});
