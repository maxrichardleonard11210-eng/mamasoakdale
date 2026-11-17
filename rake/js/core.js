/* Rake core: storage, wallet, provably-fair RNG, history, UI helpers.
 * Everything here is play money. Nothing is ever sent to a server. */
(function () {
  "use strict";
  const R = (window.Rake = { games: {}, order: [] });

  /* ---------------- Utilities ---------------- */
  const round2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const floor2 = (x) => Math.floor(x * 100 + 1e-9) / 100;
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const fmt = (n) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtMult = (m) => (m >= 1000 ? Math.round(m).toLocaleString("en-US") : Number(m).toFixed(2)) + "×";
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function el(html) {
    const t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  R.util = { round2, floor2, clamp, fmt, fmtMult, esc, el, $, $$ };

  /* ---------------- Storage ---------------- */
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem("rake:" + k);
        return v == null ? d : JSON.parse(v);
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem("rake:" + k, JSON.stringify(v));
      } catch (e) {
        /* storage unavailable: play continues in memory */
      }
    },
  };
  R.store = store;

  /* ---------------- SHA-256 / HMAC (pure JS, works on file://) ---------------- */
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  function sha256(msg) {
    const l = msg.length;
    const padded = ((l + 9 + 63) >> 6) << 6;
    const buf = new Uint8Array(padded);
    buf.set(msg);
    buf[l] = 0x80;
    const dv = new DataView(buf.buffer);
    const bits = l * 8;
    dv.setUint32(padded - 4, bits >>> 0);
    dv.setUint32(padded - 8, Math.floor(bits / 4294967296));
    const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
    const w = new Uint32Array(64);
    for (let o = 0; o < padded; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
      for (let i = 16; i < 64; i++) {
        const a = w[i - 15], b = w[i - 2];
        const s0 = ((a >>> 7) | (a << 25)) ^ ((a >>> 18) | (a << 14)) ^ (a >>> 3);
        const s1 = ((b >>> 17) | (b << 15)) ^ ((b >>> 19) | (b << 13)) ^ (b >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (let i = 0; i < 64; i++) {
        const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        const ch = (e & f) ^ (~e & g);
        const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        const mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + mj) >>> 0;
        hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
    }
    const out = new Uint8Array(32);
    const odv = new DataView(out.buffer);
    for (let i = 0; i < 8; i++) odv.setUint32(i * 4, h[i]);
    return out;
  }
  const enc = new TextEncoder();
  const hex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  function hmacSha256(key, msg) {
    let k = enc.encode(key);
    if (k.length > 64) k = sha256(k);
    const block = new Uint8Array(64);
    block.set(k);
    const ipad = new Uint8Array(64 + 0), opad = new Uint8Array(64);
    for (let i = 0; i < 64; i++) { ipad[i] = block[i] ^ 0x36; opad[i] = block[i] ^ 0x5c; }
    const m = enc.encode(msg);
    const inner = new Uint8Array(64 + m.length);
    inner.set(ipad); inner.set(m, 64);
    const ih = sha256(inner);
    const outer = new Uint8Array(96);
    outer.set(opad); outer.set(ih, 64);
    return sha256(outer);
  }
  R.crypto = { sha256: (s) => hex(sha256(enc.encode(s))), hmacHex: (k, m) => hex(hmacSha256(k, m)) };

  /* ---------------- Provably fair ----------------
   * floats = HMAC_SHA256(serverSeed, `${clientSeed}:${nonce}:${round}`), 4 bytes per float.
   * The server seed hash is shown before you play; rotating reveals the old seed so you can verify. */
  function randHex(n) {
    const a = new Uint8Array(n);
    crypto.getRandomValues(a);
    return hex(a);
  }
  function computeFloats(serverSeed, clientSeed, nonce, count) {
    const out = [];
    let round = 0;
    while (out.length < count) {
      const h = hmacSha256(serverSeed, `${clientSeed}:${nonce}:${round}`);
      for (let i = 0; i < 32 && out.length < count; i += 4) {
        out.push(h[i] / 256 + h[i + 1] / 65536 + h[i + 2] / 16777216 + h[i + 3] / 4294967296);
      }
      round++;
    }
    return out;
  }
  function newSeedPair(clientSeed) {
    const serverSeed = randHex(32);
    return { serverSeed, serverHash: R.crypto.sha256(serverSeed), clientSeed: clientSeed || randHex(8), nonce: 0 };
  }
  const fair = {
    state: store.get("fair", null),
    prev: store.get("fairPrev", null),
    listeners: [],
    save() {
      store.set("fair", this.state);
      store.set("fairPrev", this.prev);
      this.listeners.forEach((f) => f());
    },
    /** Draw `count` floats for one bet and advance the nonce. */
    next(count) {
      const s = this.state;
      const floats = computeFloats(s.serverSeed, s.clientSeed, s.nonce, count);
      const nonce = s.nonce;
      s.nonce++;
      this.save();
      return { floats, nonce };
    },
    rotate(newClientSeed) {
      const s = this.state;
      this.prev = { serverSeed: s.serverSeed, serverHash: s.serverHash, clientSeed: s.clientSeed, nonce: s.nonce };
      this.state = newSeedPair(newClientSeed ? String(newClientSeed).slice(0, 64) : null);
      this.save();
    },
    compute: computeFloats,
  };
  if (!fair.state || !fair.state.serverSeed) fair.state = newSeedPair();
  store.set("fair", fair.state);
  R.fair = fair;

  /* ---------------- Wallet ---------------- */
  const STARTING = 10000;
  const wallet = {
    balance: store.get("balance", STARTING),
    listeners: [],
    canAfford(a) { return a >= 0 && a <= this.balance + 1e-9; },
    debit(a) {
      a = round2(a);
      if (!(a >= 0)) { R.ui.toast("Enter a valid bet amount", "error"); return false; }
      if (!this.canAfford(a)) { R.ui.toast("Not enough coins. Grab some free ones in the Wallet.", "error"); return false; }
      this.balance = round2(this.balance - a);
      this.save(-1);
      return true;
    },
    credit(a) {
      this.balance = round2(this.balance + a);
      this.save(a > 0 ? 1 : 0);
    },
    save(dir) {
      store.set("balance", this.balance);
      this.listeners.forEach((f) => f(this.balance, dir));
    },
    onChange(f) { this.listeners.push(f); },
  };
  R.wallet = wallet;
  R.STARTING = STARTING;

  /* ---------------- History & stats ---------------- */
  const history = {
    list: store.get("history", []),
    stats: store.get("stats", { bets: 0, wagered: 0, profit: 0, best: 0 }),
    listeners: new Set(),
    add(entry) {
      this.list.unshift(entry);
      if (this.list.length > 60) this.list.length = 60;
      this.stats.bets++;
      this.stats.wagered = round2(this.stats.wagered + entry.bet);
      this.stats.profit = round2(this.stats.profit + entry.payout - entry.bet);
      if (entry.mult > this.stats.best) this.stats.best = entry.mult;
      store.set("history", this.list);
      store.set("stats", this.stats);
      this.listeners.forEach((f) => f());
    },
    onChange(f) { this.listeners.add(f); return () => this.listeners.delete(f); },
  };
  R.history = history;

  /** Pay out a finished bet and log it. Returns the payout. */
  R.settle = function (gameId, bet, mult, nonce) {
    const payout = round2(bet * mult);
    if (payout > 0) wallet.credit(payout);
    history.add({ game: gameId, bet: round2(bet), mult, payout, nonce, t: Date.now() });
    return payout;
  };

  /* ---------------- UI helpers ---------------- */
  const ui = {};
  R.ui = ui;
  ui.coin = '<span class="coin-icon"></span>';

  ui.toast = function (msg, type = "") {
    const t = el(`<div class="toast ${type}">${esc(msg)}</div>`);
    $("#toasts").appendChild(t);
    setTimeout(() => { t.style.transition = "opacity .3s"; t.style.opacity = "0"; }, 2600);
    setTimeout(() => t.remove(), 3000);
  };

  ui.modal = function (title, body) {
    const root = $("#modal-root");
    const back = el(`<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="modal-head"><h3>${esc(title)}</h3><button class="modal-close" aria-label="Close">×</button></div>
      <div class="modal-body"></div></div></div>`);
    const close = () => { back.remove(); document.removeEventListener("keydown", onKey); };
    const onKey = (e) => { if (e.key === "Escape") close(); };
    back.addEventListener("mousedown", (e) => { if (e.target === back) close(); });
    $(".modal-close", back).onclick = close;
    document.addEventListener("keydown", onKey);
    $(".modal-body", back).appendChild(body);
    root.appendChild(back);
    return close;
  };

  /** Bet amount input with ½ / 2× buttons. */
  ui.betInput = function (opts = {}) {
    const key = opts.key || "lastBet";
    const start = store.get(key, 10);
    const wrap = el(`<div class="field">
      <div class="label"><span>${esc(opts.label || "Bet amount")}</span><span class="bet-hint"></span></div>
      <div class="input-group">
        <span class="input-icon">${ui.coin}</span>
        <input type="number" class="input" min="0" step="0.01" inputmode="decimal" value="${Number(start).toFixed(2)}">
        <button class="chip-btn" data-a="half" type="button">½</button>
        <button class="chip-btn" data-a="double" type="button">2×</button>
      </div></div>`);
    const input = $("input", wrap);
    const listeners = [];
    const api = {
      el: wrap,
      input,
      get() {
        const v = parseFloat(input.value);
        return isFinite(v) && v >= 0 ? round2(v) : 0;
      },
      set(v) {
        input.value = round2(Math.max(0, v)).toFixed(2);
        changed();
      },
      disable(b) { $$("input,button", wrap).forEach((x) => (x.disabled = b)); },
      onChange(f) { listeners.push(f); },
      hint(text) { $(".bet-hint", wrap).textContent = text || ""; },
    };
    function changed() {
      store.set(key, api.get());
      listeners.forEach((f) => f(api.get()));
    }
    input.addEventListener("input", changed);
    input.addEventListener("blur", () => { input.value = api.get().toFixed(2); });
    $('[data-a="half"]', wrap).onclick = () => api.set(api.get() / 2);
    $('[data-a="double"]', wrap).onclick = () => api.set(Math.min(Math.max(api.get() * 2, 0.01), Math.max(wallet.balance, 0.01)));
    return api;
  };

  /** Size a canvas to its box at device pixel ratio; calls draw on resize. */
  ui.fitCanvas = function (canvas, onResize) {
    const ctx = canvas.getContext("2d");
    const info = { ctx, w: 0, h: 0, dpr: 1 };
    function resize(notify) {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      info.w = Math.max(1, r.width);
      info.h = Math.max(1, r.height);
      info.dpr = dpr;
      canvas.width = Math.round(info.w * dpr);
      canvas.height = Math.round(info.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (notify && onResize) onResize(info);
    }
    // Size now (silently, so callers can finish setting up); later resizes notify.
    const ro = new ResizeObserver(() => resize(true));
    ro.observe(canvas);
    resize(false);
    info.destroy = () => ro.disconnect();
    return info;
  };

  /** Recent-bets table that keeps itself up to date. Returns {el, destroy}. */
  ui.betsTable = function (gameId, limit = 10) {
    const card = el(`<div class="card"><div class="table-wrap"></div></div>`);
    const wrap = $(".table-wrap", card);
    function render() {
      const rows = history.list.filter((b) => !gameId || b.game === gameId).slice(0, limit);
      if (!rows.length) {
        wrap.innerHTML = `<div class="empty">No bets yet. Place one and it'll show up here.</div>`;
        return;
      }
      wrap.innerHTML = `<table class="bets"><thead><tr>
        <th>Game</th><th>Time</th><th class="num">Bet</th><th class="num">Multiplier</th><th class="num">Payout</th>
        </tr></thead><tbody>${rows
          .map((b) => {
            const g = R.games[b.game];
            const won = b.payout > b.bet;
            const even = b.payout === b.bet;
            const time = new Date(b.t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
            return `<tr><td><span style="display:inline-flex;align-items:center;gap:8px"><span class="nav-ico" style="width:22px;height:22px;background:${g ? g.color : "#333"}">${g ? g.icon : ""}</span>${g ? esc(g.name) : esc(b.game)}</span></td>
              <td class="muted">${time}</td>
              <td class="num">${fmt(b.bet)}</td>
              <td class="num">${fmtMult(b.mult)}</td>
              <td class="num ${won ? "win-text" : even ? "" : "loss-text"}">${won ? "+" : ""}${fmt(b.payout - b.bet)}</td></tr>`;
          })
          .join("")}</tbody></table>`;
    }
    render();
    const off = history.onChange(render);
    return { el: card, destroy: off };
  };

  /** Pills row of recent results. */
  ui.multPill = function (m, cls) {
    const c = cls || (m < 2 ? "lo" : m < 10 ? "mid" : "hi");
    return `<span class="pill ${c}">${fmtMult(m)}</span>`;
  };

  /** Shared 1%-edge multiplier distribution (Limbo, Crash, Flyaway): P(result >= m) = 0.99 / m. */
  R.crashPoint = (f) => clamp(Math.floor(99 / (1 - f)) / 100, 1, 1000000);

  /* ---------------- Game registry ---------------- */
  R.register = function (game) {
    R.games[game.id] = game;
    R.order.push(game.id);
  };

  /* ---------------- Shared icons ---------------- */
  R.icons = {
    gem: `<svg viewBox="0 0 64 64"><defs><linearGradient id="gemg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8affc1"/><stop offset="1" stop-color="#14b866"/></linearGradient></defs><path d="M14 22 24 10h16l10 12-18 32z" fill="url(#gemg)"/><path d="M14 22h36L32 54z" fill="#0fa65a" opacity=".55"/><path d="M24 10l-4 12h24l-4-12z" fill="#c9ffe2" opacity=".6"/><path d="M20 22 32 54 44 22" fill="none" stroke="#063d22" stroke-opacity=".25" stroke-width="1.5"/></svg>`,
    mine: `<svg viewBox="0 0 64 64"><circle cx="30" cy="36" r="17" fill="#ff4d63"/><circle cx="24" cy="30" r="5" fill="#ffd0d6" opacity=".7"/><path d="M40 22l6-6" stroke="#ffb35c" stroke-width="4" stroke-linecap="round"/><path d="M47 9v4M53 15h-4M51 11l-2.5 2.5" stroke="#ffd36b" stroke-width="2.5" stroke-linecap="round"/><rect x="36" y="18" width="10" height="7" rx="2" transform="rotate(-45 41 21.5)" fill="#a8263a"/></svg>`,
  };
})();
