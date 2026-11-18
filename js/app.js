/* Rake app shell: navigation, lobby, wallet, and fairness dialogs. */
(function () {
  "use strict";
  const R = window.Rake;
  const { el, $, $$, fmt, fmtMult, esc, round2 } = R.util;

  /* ---------------- Balance display ---------------- */
  const balEl = $("#balance-amount");
  const balBox = $("#balance");
  let bumpTimer;
  function renderBalance(b, dir) {
    balEl.textContent = fmt(b);
    if (dir) {
      balBox.classList.remove("bump-win", "bump-loss");
      void balBox.offsetWidth;
      balBox.classList.add(dir > 0 ? "bump-win" : "bump-loss");
      clearTimeout(bumpTimer);
      bumpTimer = setTimeout(() => balBox.classList.remove("bump-win", "bump-loss"), 450);
    }
  }
  renderBalance(R.wallet.balance);
  R.wallet.onChange(renderBalance);

  /* ---------------- Sidebar ---------------- */
  const CATS = [
    { id: "slots", name: "Slots" },
    { id: "originals", name: "Rake Originals" },
  ];
  const catOf = (g) => g.category || "originals";
  function renderSidebar() {
    const nav = $("#sidebar");
    const link = (id) => {
      const g = R.games[id];
      return `<a class="nav-link" href="#/${id}" data-id="${id}"><span class="nav-ico" style="background:${g.color}">${g.icon}</span>${esc(g.name)}</a>`;
    };
    nav.innerHTML = `
      <a class="nav-link" href="#/" data-id=""><span class="nav-ico" style="background:var(--raised)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg></span>Lobby</a>
      <button class="nav-link nav-btn" data-act="vip"><span class="nav-ico" style="background:var(--raised)"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/></svg></span>VIP &amp; Rakeback</button>
      ${CATS.map((c) => `<div class="nav-section">${c.name}</div>${R.order.filter((id) => catOf(R.games[id]) === c.id).map(link).join("")}`).join("")}`;
    $('[data-act="vip"]', nav).onclick = openVip;
  }

  /* ---------------- Lobby ---------------- */
  let lobbyCat = "all";
  let lobbyQuery = "";
  function tileHtml(id) {
    const g = R.games[id];
    return `<a class="tile" href="#/${id}" style="background:${g.tileBg || g.color}">
      ${g.isNew ? '<span class="tile-new">NEW</span>' : ""}
      <div class="tile-art">${g.art || g.icon}</div>
      <div class="tile-name">${esc(g.name)}</div><div class="tile-tag">${esc(g.tagline)}</div></a>`;
  }
  function renderLobby(view) {
    const s = R.history.stats;
    const lvl = R.vip.current();
    view.innerHTML = `
      <section class="hero">
        <span class="hero-badge">Free to play · No real money</span>
        <h1>Play the <span>Rake</span> originals.</h1>
        <p>${R.order.length} games, including slots, running on free virtual coins. Every result is provably fair, every bet earns rakeback, and you can top up for free whenever you run dry.</p>
        <div class="hero-actions">
          <a class="btn btn-accent btn-lg" href="#/riches">Spin Rake Riches</a>
          <a class="btn btn-ghost btn-lg" href="#/flyaway">Play Flyaway</a>
          <button class="btn btn-ghost btn-lg" data-act="wallet">Claim free coins</button>
        </div>
      </section>
      <div class="vip-strip card" data-act="vip">
        <span class="vip-badge" style="--c:${lvl.color}">${esc(lvl.name)}</span>
        <div class="vip-strip-bar"><div class="vip-bar"><div style="width:${(R.vip.progress() * 100).toFixed(1)}%;background:${lvl.color}"></div></div>
          <span class="muted">${R.vip.next() ? `${(R.vip.progress() * 100).toFixed(1)}% to ${esc(R.vip.next().name)}` : "Top level reached"}</span></div>
        <span class="vip-strip-rb">Rakeback <b class="mono">${fmt(Math.floor(R.vip.rakeback * 100) / 100)}</b></span>
      </div>
      <div class="lobby-bar">
        <div class="input-group lobby-search"><span class="input-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></span><input class="input" placeholder="Search games" data-q style="font-family:var(--sans)"></div>
        <div class="chips">${[{ id: "all", name: "All games" }, ...CATS].map((c) => `<button class="chip ${c.id === lobbyCat ? "on" : ""}" data-cat="${c.id}">${c.name}</button>`).join("")}</div>
      </div>
      <div data-slot="games"></div>
      <div class="section-head"><h2>Your stats</h2></div>
      <div class="stats-row">
        <div class="stat"><div class="stat-label">Bets placed</div><div class="stat-value">${s.bets.toLocaleString()}</div></div>
        <div class="stat"><div class="stat-label">Total wagered</div><div class="stat-value">${fmt(s.wagered)}</div></div>
        <div class="stat"><div class="stat-label">Net profit</div><div class="stat-value ${s.profit >= 0 ? "win-text" : "loss-text"}">${s.profit >= 0 ? "+" : ""}${fmt(s.profit)}</div></div>
        <div class="stat"><div class="stat-label">Best multiplier</div><div class="stat-value">${fmtMult(s.best || 0)}</div></div>
      </div>
      <div class="section-head"><h2>Recent bets</h2></div>
      <div data-slot="bets"></div>`;
    $('[data-act="wallet"]', view).onclick = openWallet;
    $('.vip-strip', view).onclick = openVip;
    const slot = $('[data-slot="games"]', view);
    const q = $("[data-q]", view);
    q.value = lobbyQuery;
    function renderGames() {
      const term = lobbyQuery.trim().toLowerCase();
      const match = (id) => {
        const g = R.games[id];
        return !term || (g.name + " " + g.tagline).toLowerCase().includes(term);
      };
      const cats = lobbyCat === "all" ? CATS : CATS.filter((c) => c.id === lobbyCat);
      const html = cats
        .map((c) => {
          const ids = R.order.filter((id) => catOf(R.games[id]) === c.id && match(id));
          if (!ids.length) return "";
          return `<div class="section-head"><h2>${c.name}</h2><span class="muted">${ids.length} game${ids.length === 1 ? "" : "s"}</span></div><div class="tiles">${ids.map(tileHtml).join("")}</div>`;
        })
        .join("");
      slot.innerHTML = html || `<div class="empty card" style="margin-top:20px">No games match "${esc(lobbyQuery)}".</div>`;
    }
    q.addEventListener("input", () => { lobbyQuery = q.value; renderGames(); });
    $$("[data-cat]", view).forEach((b) => (b.onclick = () => {
      lobbyCat = b.dataset.cat;
      $$("[data-cat]", view).forEach((x) => x.classList.toggle("on", x === b));
      renderGames();
    }));
    renderGames();
    const t = R.ui.betsTable(null, 15);
    $('[data-slot="bets"]', view).appendChild(t.el);
    return t.destroy;
  }

  /* ---------------- Game page ---------------- */
  function renderGame(view, g) {
    view.innerHTML = `
      <div class="game-title"><span class="nav-ico" style="background:${g.color}">${g.icon}</span><h1>${esc(g.name)}</h1></div>
      <div class="game"><aside class="game-controls"></aside><section class="game-stage"></section></div>
      <div class="game-foot">
        <span>House edge ${esc(g.edge || "1%")} · ${esc(g.rules || "")}</span>
        <button class="link-btn" data-act="fair"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>Provably fair</button>
      </div>
      <div class="section-head"><h2>My ${esc(g.name)} bets</h2></div>
      <div data-slot="bets"></div>`;
    $('[data-act="fair"]', view).onclick = () => openFairness(g.id);
    const cleanup = g.mount({ controls: $(".game-controls", view), stage: $(".game-stage", view), root: view });
    const t = R.ui.betsTable(g.id, 10);
    $('[data-slot="bets"]', view).appendChild(t.el);
    return () => {
      t.destroy();
      cleanup && cleanup();
    };
  }

  /* ---------------- Router ---------------- */
  let cleanup = null;
  function route() {
    const id = location.hash.replace(/^#\/?/, "").split("?")[0];
    if (cleanup) {
      try { cleanup(); } catch (e) { console.error(e); }
      cleanup = null;
    }
    const view = $("#view");
    view.innerHTML = "";
    const g = R.games[id];
    cleanup = g ? renderGame(view, g) : renderLobby(view);
    document.title = g ? `${g.name} — Rake` : "Rake — Free-to-Play Casino";
    $$(".nav-link").forEach((a) => a.classList.toggle("active", a.dataset.id === (g ? id : "")));
    const active = $(".nav-link.active");
    if (active && window.innerWidth <= 760) active.scrollIntoView({ inline: "center", block: "nearest" });
    window.scrollTo(0, 0);
  }

  /* ---------------- Wallet modal ---------------- */
  const DAY = 24 * 60 * 60 * 1000;
  const DAILY = 10000;
  const REFILL_TO = 1000;
  function openWallet() {
    const body = el(`<div style="display:flex;flex-direction:column;gap:14px">
      <div class="stat"><div class="stat-label">Balance</div><div class="stat-value" style="font-size:26px;display:flex;align-items:center;gap:8px">${R.ui.coin}<span data-b></span></div></div>
      <p>Rake Coins are free play money with no cash value. They can't be purchased or withdrawn.</p>
      <button class="btn btn-accent btn-block btn-lg" data-daily></button>
      <button class="btn btn-ghost btn-block" data-refill></button>
      <button class="btn btn-ghost btn-block" data-vip>VIP &amp; Rakeback</button>
      <div class="stats-row" data-stats></div>
    </div>`);
    let timer;
    function render() {
      $("[data-b]", body).textContent = fmt(R.wallet.balance);
      const last = R.store.get("dailyAt", 0);
      const left = last + DAY - Date.now();
      const daily = $("[data-daily]", body);
      if (left <= 0) {
        daily.disabled = false;
        daily.textContent = `Claim daily bonus: +${fmt(DAILY)}`;
      } else {
        daily.disabled = true;
        const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000), s = Math.floor((left % 60000) / 1000);
        daily.textContent = `Next daily bonus in ${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
      }
      const refill = $("[data-refill]", body);
      const broke = R.wallet.balance < 1;
      refill.disabled = !broke;
      refill.textContent = broke ? `Out of coins? Refill to ${fmt(REFILL_TO)}` : `Refill unlocks when your balance drops below 1.00`;
      const s = R.history.stats;
      $("[data-stats]", body).innerHTML = `
        <div class="stat"><div class="stat-label">Bets</div><div class="stat-value">${s.bets.toLocaleString()}</div></div>
        <div class="stat"><div class="stat-label">Wagered</div><div class="stat-value">${fmt(s.wagered)}</div></div>
        <div class="stat"><div class="stat-label">Profit</div><div class="stat-value ${s.profit >= 0 ? "win-text" : "loss-text"}">${fmt(s.profit)}</div></div>`;
    }
    $("[data-daily]", body).onclick = () => {
      R.store.set("dailyAt", Date.now());
      R.wallet.credit(DAILY);
      R.ui.toast(`+${fmt(DAILY)} coins added`, "success");
      render();
    };
    $("[data-vip]", body).onclick = () => { $(".modal-close").click(); openVip(); };
    $("[data-refill]", body).onclick = () => {
      if (R.wallet.balance >= 1) return;
      R.wallet.credit(round2(REFILL_TO - R.wallet.balance));
      R.ui.toast("Balance refilled", "success");
      render();
    };
    render();
    timer = setInterval(() => { if (!body.isConnected) clearInterval(timer); else render(); }, 1000);
    R.ui.modal("Wallet", body);
  }

  /* ---------------- VIP modal ---------------- */
  function openVip() {
    const body = el(`<div style="display:flex;flex-direction:column;gap:14px"></div>`);
    function render() {
      const i = R.vip.index(), lvl = R.vip.levels[i], nxt = R.vip.next();
      const w = R.history.stats.wagered;
      const rb = Math.floor(R.vip.rakeback * 100) / 100;
      body.innerHTML = `
        <div class="vip-card" style="--c:${lvl.color}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span class="vip-badge" style="--c:${lvl.color}">${esc(lvl.name)}</span>
            <span class="muted mono">${fmt(w)} wagered</span></div>
          <div class="vip-bar" style="margin-top:14px"><div style="width:${(R.vip.progress() * 100).toFixed(1)}%;background:${lvl.color}"></div></div>
          <div class="muted" style="margin-top:8px;font-size:13px">${nxt ? `Wager ${fmt(nxt.min - w)} more to reach <b style="color:${nxt.color}">${esc(nxt.name)}</b>` : "You've reached the top level."}</div>
        </div>
        <div class="stat" style="display:flex;justify-content:space-between;align-items:center;gap:12px">
          <div><div class="stat-label">Rakeback ready to claim</div><div class="stat-value" style="display:flex;gap:8px;align-items:center">${R.ui.coin}${fmt(rb)}</div>
          <div class="muted" style="font-size:12px;margin-top:4px">You earn ${Math.round(lvl.rb * 100)}% of the house edge back on every bet.</div></div>
          <button class="btn btn-accent" data-claim ${rb < 0.01 ? "disabled" : ""}>Claim</button>
        </div>
        <div class="card table-wrap"><table class="bets"><thead><tr><th>Level</th><th class="num">Wagered</th><th class="num">Rakeback</th></tr></thead><tbody>
          ${R.vip.levels.map((l, k) => `<tr${k === i ? ' style="background:var(--panel-2)"' : ""}><td><span class="vip-badge sm" style="--c:${l.color}">${esc(l.name)}</span></td><td class="num">${fmt(l.min)}</td><td class="num">${Math.round(l.rb * 100)}% of edge</td></tr>`).join("")}
        </tbody></table></div>
        <p style="font-size:12px">All rewards are virtual Rake Coins with no cash value.</p>`;
      const btn = $("[data-claim]", body);
      btn.onclick = () => {
        const got = R.vip.claim();
        if (got) R.ui.toast(`Claimed ${fmt(got)} rakeback`, "success");
        render();
      };
    }
    render();
    const off = R.vip.onChange(() => { if (!body.isConnected) off(); else render(); });
    R.ui.modal("VIP & Rakeback", body);
  }
  R.openVip = openVip;

  const vipBtn = $("#vip-btn");
  function renderVipChip() {
    const lvl = R.vip.current();
    vipBtn.style.setProperty("--c", lvl.color);
    $("[data-vip-name]", vipBtn).textContent = lvl.name;
    $("[data-vip-ring]", vipBtn).style.setProperty("--p", (R.vip.progress() * 100).toFixed(1) + "%");
  }
  vipBtn.onclick = openVip;
  R.vip.onChange(renderVipChip);
  renderVipChip();

  /* ---------------- Fairness modal ---------------- */
  function openFairness(gameId) {
    const body = el(`<div style="display:flex;flex-direction:column;gap:14px">
      <div class="tabs"><button class="on" data-tab="seeds">Seeds</button><button data-tab="verify">Verify</button></div>
      <div data-pane="seeds" style="display:flex;flex-direction:column;gap:12px"></div>
      <div data-pane="verify" style="display:none;flex-direction:column;gap:12px"></div>
    </div>`);
    const seeds = $('[data-pane="seeds"]', body);
    const verify = $('[data-pane="verify"]', body);
    function renderSeeds() {
      const s = R.fair.state, p = R.fair.prev;
      seeds.innerHTML = `
        <p>Each result comes from HMAC-SHA256(server seed, "client seed:nonce:round"). You see the server seed's hash before you play. Rotating reveals the old seed so you can check every past bet.</p>
        <div class="field"><div class="label">Active client seed</div>
          <div class="input-group"><input class="input" data-client value="${esc(s.clientSeed)}" maxlength="64"><button class="chip-btn" data-rotate>Rotate</button></div></div>
        <div class="field"><div class="label">Active server seed (hashed)</div><div class="code-box">${s.serverHash}</div></div>
        <div class="field"><div class="label">Bets on this seed pair (next nonce)</div><div class="code-box">${s.nonce}</div></div>
        ${
          p
            ? `<div class="field"><div class="label">Previous server seed (revealed)</div><div class="code-box">${p.serverSeed}</div></div>
               <div class="field"><div class="label">Previous client seed · bets made</div><div class="code-box">${esc(p.clientSeed)} · ${p.nonce}</div></div>`
            : `<p style="font-size:13px">Rotate your seed pair to reveal the current server seed.</p>`
        }`;
      $("[data-rotate]", seeds).onclick = () => {
        const v = $("[data-client]", seeds).value.trim();
        R.fair.rotate(v && v !== s.clientSeed ? v : null);
        R.ui.toast("Seed pair rotated. Previous server seed revealed.", "success");
        renderSeeds();
      };
    }
    function renderVerify() {
      const p = R.fair.prev;
      const games = R.order.map((id) => `<option value="${id}" ${id === gameId ? "selected" : ""}>${esc(R.games[id].name)}</option>`).join("");
      verify.innerHTML = `
        <div class="field"><div class="label">Game</div><select class="select" data-g>${games}</select></div>
        <div class="field"><div class="label">Server seed (unhashed)</div><div class="input-group"><input class="input" data-ss value="${p ? p.serverSeed : ""}"></div></div>
        <div class="field"><div class="label">Client seed</div><div class="input-group"><input class="input" data-cs value="${p ? esc(p.clientSeed) : ""}"></div></div>
        <div class="field"><div class="label">Nonce</div><div class="input-group"><input class="input" type="number" min="0" data-n value="0"></div></div>
        <div class="field" data-extra-wrap><div class="label" data-extra-label></div><div class="input-group"><input class="input" type="number" data-extra></div></div>
        <div class="verify-out" data-out></div>`;
      const out = $("[data-out]", verify);
      const extraWrap = $("[data-extra-wrap]", verify);
      function run() {
        const g = R.games[$("[data-g]", verify).value];
        const ex = g.verifyExtra;
        extraWrap.style.display = ex ? "" : "none";
        if (ex) {
          $("[data-extra-label]", verify).textContent = ex.label;
          const inp = $("[data-extra]", verify);
          if (inp.dataset.for !== g.id) { inp.value = ex.default; inp.dataset.for = g.id; }
        }
        const ss = $("[data-ss]", verify).value.trim();
        const cs = $("[data-cs]", verify).value;
        const n = parseInt($("[data-n]", verify).value, 10) || 0;
        if (!ss) { out.textContent = "Enter a revealed server seed to verify a bet."; return; }
        const extra = ex ? parseFloat($("[data-extra]", verify).value) : null;
        const lines = [`SHA-256(server seed) = ${R.crypto.sha256(ss)}`];
        try {
          lines.push(g.verify((count) => R.fair.compute(ss, cs, n, count), extra));
        } catch (e) {
          lines.push("Could not compute: " + e.message);
        }
        out.textContent = lines.join("\n\n");
      }
      $$("input,select", verify).forEach((x) => x.addEventListener("input", run));
      run();
    }
    $$("[data-tab]", body).forEach((b) => {
      b.onclick = () => {
        $$("[data-tab]", body).forEach((x) => x.classList.toggle("on", x === b));
        seeds.style.display = b.dataset.tab === "seeds" ? "flex" : "none";
        verify.style.display = b.dataset.tab === "verify" ? "flex" : "none";
        if (b.dataset.tab === "verify") renderVerify();
      };
    });
    renderSeeds();
    R.ui.modal("Provably fair", body);
  }
  R.openFairness = openFairness;
  R.openWallet = openWallet;

  $("#wallet-btn").onclick = openWallet;
  $("#fair-btn").onclick = () => openFairness();

  renderSidebar();
  window.addEventListener("hashchange", route);
  route();
})();
