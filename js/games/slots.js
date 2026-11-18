/* Rake slots: "Rake Riches" (5×3, 10 lines, wilds, free spins) and "Classic 7s" (3×3, 5 lines). */
(function () {
  "use strict";
  const R = window.Rake;
  const S = R.slots;
  const { el, $, $$, fmt, fmtMult, esc } = R.util;

  /* ---------------- Symbol art (original) ---------------- */
  const SYM = {
    cherry: `<svg viewBox="0 0 64 64"><path d="M32 10c-2 10-10 18-16 24M32 10c2 10 6 18 14 22" stroke="#3fae4f" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M32 10c6-4 14-3 18 2-6 3-12 2-18-2z" fill="#4cc75d"/><circle cx="18" cy="42" r="12" fill="#e8243f"/><circle cx="46" cy="40" r="12" fill="#ff3b55"/><circle cx="14" cy="37" r="3.5" fill="#ffb3bf"/><circle cx="42" cy="35" r="3.5" fill="#ffc2cb"/></svg>`,
    lemon: `<svg viewBox="0 0 64 64"><ellipse cx="32" cy="34" rx="22" ry="17" fill="#ffd23f" transform="rotate(-18 32 34)"/><path d="M10 40l-4 4M54 28l4-4" stroke="#e8b000" stroke-width="4" stroke-linecap="round"/><ellipse cx="25" cy="27" rx="8" ry="4" fill="#fff3b0" transform="rotate(-18 25 27)"/></svg>`,
    plum: `<svg viewBox="0 0 64 64"><g fill="#8a4dff"><circle cx="22" cy="28" r="9"/><circle cx="40" cy="28" r="9"/><circle cx="31" cy="40" r="9"/><circle cx="22" cy="50" r="7" opacity=".9"/><circle cx="40" cy="50" r="7" opacity=".9"/></g><g fill="#c7a8ff"><circle cx="19" cy="25" r="2.5"/><circle cx="37" cy="25" r="2.5"/><circle cx="28" cy="37" r="2.5"/></g><path d="M31 19V8M31 12c5-4 11-3 13 0" stroke="#3fae4f" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
    bell: `<svg viewBox="0 0 64 64"><path d="M32 8c-11 0-17 9-17 20v10l-6 8h46l-6-8V28c0-11-6-20-17-20z" fill="#ffb020"/><path d="M22 26c0-6 4-11 9-12" stroke="#ffe3a1" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="32" cy="52" r="6" fill="#d98a00"/><rect x="29" y="4" width="6" height="7" rx="3" fill="#d98a00"/></svg>`,
    bar: `<svg viewBox="0 0 64 64"><rect x="6" y="18" width="52" height="28" rx="6" fill="#20232d" stroke="#e8ebf2" stroke-width="3"/><text x="32" y="39" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="18" fill="#e8ebf2" letter-spacing="1">BAR</text></svg>`,
    seven: `<svg viewBox="0 0 64 64"><text x="32" y="53" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="54" fill="#ff3b55" stroke="#7a0b1c" stroke-width="2.5" paint-order="stroke">7</text></svg>`,
    gem: `<svg viewBox="0 0 64 64"><path d="M12 24 22 10h20l10 14-20 32z" fill="#3ad7ff"/><path d="M12 24h40L32 56z" fill="#0aa3d6"/><path d="M22 10l-4 14h28l-4-14z" fill="#b8f2ff"/></svg>`,
    wild: `<svg viewBox="0 0 64 64"><circle cx="32" cy="30" r="22" fill="#ff8a1f" stroke="#ffd36b" stroke-width="3"/><text x="32" y="39" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="26" fill="#1a0f02">R</text><rect x="10" y="48" width="44" height="13" rx="4" fill="#1a0f02"/><text x="32" y="58.5" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="10" fill="#ffd36b" letter-spacing="1.5">WILD</text></svg>`,
    star: `<svg viewBox="0 0 64 64"><path d="M32 4l7.6 16.8 18.4 2-13.7 12.4 3.9 18L32 44l-16.2 9.2 3.9-18L6 22.8l18.4-2z" fill="#d64bff" stroke="#f2b8ff" stroke-width="2.5" stroke-linejoin="round"/><rect x="12" y="48" width="40" height="13" rx="4" fill="#2a0b40"/><text x="32" y="58.5" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="10" fill="#f2b8ff" letter-spacing="1.5">FREE</text></svg>`,
  };
  const SYM_NAME = { cherry: "Cherry", lemon: "Lemon", plum: "Plum", bell: "Bell", bar: "Bar", seven: "Seven", gem: "Gem", wild: "Wild", star: "Free spins" };

  /* ---------------- Machine configs ---------------- */
  const LINES5 = [[1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2], [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [1, 0, 1, 2, 1]];
  const RICHES_COUNTS = { cherry: 8, lemon: 7, plum: 6, bell: 5, bar: 4, seven: 3, gem: 2, wild: 2, star: 1 };
  const MACHINES = {
    riches: {
      rows: 3,
      lines: LINES5,
      wild: "wild",
      scatter: "star",
      strips: [1, 2, 3, 4, 5].map((i) => S.buildStrip(RICHES_COUNTS, 1000 + i)),
      // pays are in line bets (total bet ÷ 10) for 3, 4 and 5 in a row
      pays: {
        cherry: [0, 0, 0, 4.1, 14.4, 52], lemon: [0, 0, 0, 4.1, 14.4, 52], plum: [0, 0, 0, 7.2, 25, 82],
        bell: [0, 0, 0, 12.4, 39, 155], bar: [0, 0, 0, 21, 60, 258], seven: [0, 0, 0, 35, 118, 515],
        gem: [0, 0, 0, 60, 247, 1030], wild: [0, 0, 0, 103, 494, 2575],
      },
      scatterPays: [0, 0, 0, 2, 10, 50], // × total bet
      freeSpins: { need: 3, count: 10, mult: 2, max: 50 },
      rtp: "97.5%",
    },
    classic: {
      rows: 3,
      lines: [[1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0]],
      wild: "wild",
      strips: [1, 2, 3].map((i) => S.buildStrip({ cherry: 6, lemon: 5, bell: 4, bar: 3, seven: 2, wild: 1 }, 2000 + i)),
      pays: { cherry: [0, 0, 0, 5], lemon: [0, 0, 0, 7], bell: [0, 0, 0, 14], bar: [0, 0, 0, 30], seven: [0, 0, 0, 72], wild: [0, 0, 0, 240] },
      rtp: "96.7%",
    },
  };
  R.slotMachines = MACHINES;
  const floatsPerRound = (cfg) => cfg.strips.length * (1 + (cfg.freeSpins ? cfg.freeSpins.max : 0));
  function floatFeeder(floats, reels) {
    let i = 0;
    return () => { const out = floats.slice(i, i + reels); i += reels; return out; };
  }
  const LINE_COLORS = ["#ffd36b", "#5cf09f", "#8fb4ff", "#ff7c8c", "#c3b2ff", "#ffb35c", "#7ee8ff", "#f2b8ff", "#b6f28a", "#ffa3d1"];

  function makeSlotGame(def) {
    const cfg = MACHINES[def.machine];
    const reels = cfg.strips.length;
    R.register({
      id: def.id,
      name: def.name,
      tagline: def.tagline,
      category: "slots",
      rules: `${reels}×${cfg.rows} · ${cfg.lines.length} lines · RTP ${cfg.rtp}`,
      edge: (100 - parseFloat(cfg.rtp)).toFixed(1) + "%",
      isNew: def.isNew,
      color: def.color,
      tileBg: def.tileBg,
      icon: def.icon,
      art: def.art,
      verify(next) {
        const floats = next(floatsPerRound(cfg));
        const feed = floatFeeder(floats, reels);
        const grid = S.spinGrid(cfg, floats.slice(0, reels));
        const rows = Array.from({ length: cfg.rows }, (_, r) => grid.map((c) => SYM_NAME[c[r]].padEnd(10)).join(" ")).join("\n");
        const round = S.playRound(cfg, feed);
        return `Reels:\n${rows}\n\nRound pays ${fmtMult(round.total)} your bet${round.freeSpinsPlayed ? ` (incl. ${round.freeSpinsPlayed} free spins)` : ""}`;
      },
      mount({ controls, stage }) {
        return mountSlot({ controls, stage, cfg, def, reels });
      },
    });
  }

  function mountSlot({ controls, stage, cfg, def, reels }) {
    const turboKey = "slots:turbo";
    let spinning = false;
    let auto = 0; // remaining auto spins
    let destroyed = false;
    let pending = null; // {amount, nonce, total} — settle if the user leaves mid-round

    /* ---------- Controls ---------- */
    const bet = R.ui.betInput({ label: "Total bet" });
    controls.appendChild(bet.el);
    const spinBtn = el(`<button class="btn btn-accent btn-block btn-lg">Spin</button>`);
    controls.appendChild(spinBtn);
    const autoRow = el(`<div class="field"><div class="label">Auto spin</div><div class="seg" data-auto>
      <button data-n="10">10</button><button data-n="25">25</button><button data-n="50">50</button><button data-n="100">100</button></div></div>`);
    controls.appendChild(autoRow);
    const opts = el(`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
      <label class="switch"><input type="checkbox" data-turbo><span class="knob"></span>Turbo</label>
      <button class="btn btn-ghost btn-sm" data-pay>Paytable</button></div>`);
    controls.appendChild(opts);
    const turbo = $("[data-turbo]", opts);
    turbo.checked = R.store.get(turboKey, false);
    turbo.onchange = () => R.store.set(turboKey, turbo.checked);
    const info = el(`<div class="stats-row" style="grid-template-columns:1fr 1fr">
      <div class="stat"><div class="stat-label">Last win</div><div class="stat-value" data-last>—</div></div>
      <div class="stat"><div class="stat-label">RTP</div><div class="stat-value">${cfg.rtp}</div></div></div>`);
    controls.appendChild(info);
    controls.appendChild(el(`<p class="muted" style="margin:0;font-size:12px">Press <b>Space</b> to spin. ${cfg.freeSpins ? `3+ <b>FREE</b> stars anywhere award ${cfg.freeSpins.count} free spins with every win ×${cfg.freeSpins.mult}.` : "Wilds substitute for every symbol."}</p>`));

    /* ---------- Stage ---------- */
    stage.innerHTML = `<div class="slot-stage slot-${def.machine}">
      <div class="slot-head"><div class="slot-title">${esc(def.name)}</div><div class="slot-fs" data-fs></div></div>
      <div class="slot-frame">
        <div class="slot-window" style="--reels:${reels};--rows:${cfg.rows}">
          ${Array.from({ length: reels }, () => `<div class="reel"><div class="reel-strip"></div></div>`).join("")}
          <svg class="slot-lines" viewBox="0 0 ${reels * 100} ${cfg.rows * 100}" preserveAspectRatio="none"></svg>
        </div>
      </div>
      <div class="slot-win" data-win>&nbsp;</div>
    </div>`;
    const windowEl = $(".slot-window", stage);
    const strips = $$(".reel-strip", stage);
    const linesSvg = $(".slot-lines", stage);
    const winEl = $("[data-win]", stage);
    const fsEl = $("[data-fs]", stage);

    const sizeCells = () => windowEl.style.setProperty("--cell", windowEl.clientHeight / cfg.rows + "px");
    const ro = new ResizeObserver(sizeCells);
    ro.observe(windowEl);
    sizeCells();
    const cellHtml = (sym) => `<div class="cell" data-s="${sym}">${SYM[sym]}</div>`;
    const randomSym = (reel) => cfg.strips[reel][Math.floor(Math.random() * cfg.strips[reel].length)];
    let grid = cfg.strips.map((strip, r) => Array.from({ length: cfg.rows }, (_, row) => strip[(r * 7 + row) % strip.length]));
    strips.forEach((s, r) => { s.innerHTML = grid[r].map(cellHtml).join(""); });

    function clearWins() {
      linesSvg.innerHTML = "";
      $$(".cell.hit", stage).forEach((c) => c.classList.remove("hit"));
      windowEl.classList.remove("has-win");
    }

    /** Animate reels to a grid. Resolves when all reels have stopped. */
    function animateTo(next, fast) {
      clearWins();
      const cellH = windowEl.clientHeight / cfg.rows;
      const base = fast ? 260 : 650;
      const step = fast ? 70 : 170;
      return new Promise((resolve) => {
        let done = 0;
        strips.forEach((strip, r) => {
          const fillers = (fast ? 6 : 12) + r * (fast ? 2 : 4);
          const items = [...next[r]];
          for (let i = 0; i < fillers; i++) items.push(randomSym(r));
          items.push(...grid[r]);
          strip.innerHTML = items.map(cellHtml).join("");
          strip.style.transition = "none";
          strip.style.transform = `translateY(${-(items.length - cfg.rows) * cellH}px)`;
          strip.classList.add("spinning");
          void strip.offsetHeight;
          const dur = base + r * step;
          strip.style.transition = `transform ${dur}ms cubic-bezier(.25,.1,.3,1.08)`;
          strip.style.transform = "translateY(0)";
          const end = () => {
            strip.removeEventListener("transitionend", end);
            clearTimeout(fallback);
            strip.classList.remove("spinning");
            strip.style.transition = "none";
            strip.innerHTML = next[r].map(cellHtml).join("");
            strip.style.transform = "translateY(0)";
            if (++done === reels) { grid = next; resolve(); }
          };
          const fallback = setTimeout(end, dur + 80);
          strip.addEventListener("transitionend", end);
        });
      });
    }

    function showWins(res) {
      const cellsOf = (reel) => strips[reel].children;
      res.lineWins.forEach((w) => {
        const line = cfg.lines[w.line];
        const color = LINE_COLORS[w.line % LINE_COLORS.length];
        const pts = line.map((row, reel) => `${reel * 100 + 50},${row * 100 + 50}`).join(" ");
        linesSvg.insertAdjacentHTML("beforeend", `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" opacity=".9"/>`);
        for (let reel = 0; reel < w.count; reel++) cellsOf(reel)[line[reel]].classList.add("hit");
      });
      if (res.scatter && res.scatter.count >= 3) res.scatter.cells.forEach(([reel, row]) => cellsOf(reel)[row].classList.add("hit"));
      if (res.total > 0) windowEl.classList.add("has-win");
    }

    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    async function spin() {
      if (spinning || destroyed) return;
      const amount = bet.get();
      if (!R.wallet.debit(amount)) { auto = 0; autoActive = false; renderButtons(); return; }
      spinning = true;
      renderButtons();
      const fast = turbo.checked;
      const { floats, nonce } = R.fair.next(floatsPerRound(cfg));
      const feed = floatFeeder(floats, reels);
      // Pre-compute the whole round so leaving mid-animation still pays correctly.
      const round = S.playRound(cfg, floatFeeder(floats, reels));
      pending = { amount, nonce, total: round.total };
      winEl.innerHTML = "&nbsp;";
      winEl.className = "slot-win";

      const baseGrid = S.spinGrid(cfg, feed());
      await animateTo(baseGrid, fast);
      if (destroyed) return;
      const baseRes = S.evaluate(cfg, baseGrid);
      showWins(baseRes);
      let total = baseRes.total;
      if (baseRes.total > 0) showWinText(amount * baseRes.total, baseRes.total);

      // Free spins
      if (baseRes.freeSpins) {
        let left = baseRes.freeSpins, played = 0, fsTotal = 0;
        winEl.className = "slot-win feature";
        winEl.textContent = `${left} FREE SPINS!`;
        await wait(fast ? 700 : 1500);
        stage.querySelector(".slot-stage").classList.add("in-feature");
        while (left > 0 && played < cfg.freeSpins.max && !destroyed) {
          fsEl.textContent = `Free spin ${played + 1} · ${left - 1} left · ×${cfg.freeSpins.mult}`;
          const g = S.spinGrid(cfg, feed());
          await animateTo(g, fast);
          if (destroyed) return;
          const r = S.evaluate(cfg, g);
          showWins(r);
          fsTotal += r.total * cfg.freeSpins.mult;
          if (r.freeSpins) { left += r.freeSpins; R.ui.toast(`+${r.freeSpins} free spins!`, "success"); }
          left--;
          played++;
          if (r.total > 0) showWinText(amount * fsTotal, fsTotal, "Free spins total");
          await wait(r.total > 0 ? (fast ? 450 : 900) : fast ? 150 : 350);
        }
        total += fsTotal;
        fsEl.textContent = "";
        stage.querySelector(".slot-stage").classList.remove("in-feature");
      }

      pending = null;
      const payout = R.settle(def.id, amount, Math.round(total * 10000) / 10000, nonce);
      if (total > 0) showWinText(payout, total, total >= 10 ? "BIG WIN" : null, true);
      else { winEl.className = "slot-win"; winEl.innerHTML = "&nbsp;"; }
      $("[data-last]", info).textContent = total > 0 ? fmt(payout) : "0.00";
      spinning = false;
      renderButtons();
      if (autoActive && !destroyed) {
        auto--;
        if (auto <= 0) { stopAuto(); return; }
        renderButtons();
        await wait(total > 0 ? (fast ? 400 : 900) : fast ? 120 : 300);
        if (autoActive && !destroyed) spin();
      }
    }
    function showWinText(payout, mult, label, final) {
      winEl.className = "slot-win show" + (mult >= 10 ? " big" : "");
      winEl.innerHTML = `${label ? `<span class="slot-win-label">${esc(label)}</span>` : ""}<span>${R.ui.coin} ${fmt(payout)}</span><span class="slot-win-mult">${fmtMult(mult)}</span>`;
      if (final && mult >= 10) R.ui.toast(`Big win! ${fmtMult(mult)}`, "success");
    }

    /* ---------- Auto spin ---------- */
    let autoActive = false;
    $$("[data-auto] button", autoRow).forEach((b) => {
      b.onclick = () => {
        if (autoActive) { stopAuto(); return; }
        auto = +b.dataset.n;
        autoActive = true;
        renderButtons();
        spin();
      };
    });
    function stopAuto() {
      auto = 0;
      autoActive = false;
      renderButtons();
    }
    function renderButtons() {
      bet.disable(spinning || autoActive);
      if (autoActive) {
        spinBtn.className = "btn btn-loss btn-block btn-lg";
        spinBtn.textContent = `Stop auto (${auto} left)`;
        spinBtn.disabled = false;
      } else {
        spinBtn.className = "btn btn-accent btn-block btn-lg";
        spinBtn.textContent = spinning ? "Spinning…" : "Spin";
        spinBtn.disabled = spinning;
      }
      $$("[data-auto] button", autoRow).forEach((b) => (b.disabled = autoActive || spinning));
    }
    spinBtn.onclick = () => (autoActive ? stopAuto() : spin());

    /* ---------- Paytable ---------- */
    $("[data-pay]", opts).onclick = () => {
      const nl = cfg.lines.length;
      const rowsHtml = Object.entries(cfg.pays)
        .reverse()
        .map(([s, p]) => {
          const cols = p.map((v, n) => (v ? `<td class="num">${n}× <b>${fmtMult(v / nl)}</b></td>` : "")).join("");
          return `<tr><td><span class="pt-sym">${SYM[s]}</span>${SYM_NAME[s]}</td>${cols}</tr>`;
        })
        .join("");
      const scat = cfg.scatter
        ? `<tr><td><span class="pt-sym">${SYM[cfg.scatter]}</span>Free spins (anywhere)</td>${cfg.scatterPays.map((v, n) => (v ? `<td class="num">${n}× <b>${fmtMult(v)}</b></td>` : "")).join("")}</tr>`
        : "";
      const body = el(`<div style="display:flex;flex-direction:column;gap:12px">
        <p>Payouts are multiples of your <b>total bet</b>. Line wins pay left to right on ${nl} fixed lines; ${SYM_NAME[cfg.wild]} substitutes for every symbol${cfg.scatter ? " except Free spins" : ""}. Only the best win per line pays.</p>
        <div class="card table-wrap"><table class="bets paytable"><tbody>${scat}${rowsHtml}</tbody></table></div>
        ${cfg.freeSpins ? `<p>${cfg.freeSpins.need}+ Free spins symbols award <b>${cfg.freeSpins.count} free spins</b>. All free spin wins are multiplied ×${cfg.freeSpins.mult}, and the feature can retrigger (up to ${cfg.freeSpins.max} spins).</p>` : ""}
        <p>Return to player: <b>${cfg.rtp}</b> (long-run average from simulation).</p></div>`);
      R.ui.modal(`${def.name} paytable`, body);
    };

    const onKey = (e) => {
      if (e.code === "Space" && !/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement.tagName) && !document.querySelector(".modal-backdrop")) {
        e.preventDefault();
        if (!autoActive) spin();
      }
    };
    document.addEventListener("keydown", onKey);
    renderButtons();

    return () => {
      destroyed = true;
      autoActive = false;
      ro.disconnect();
      document.removeEventListener("keydown", onKey);
      if (pending) {
        // Round outcome was fixed when the spin started; pay it out.
        R.settle(def.id, pending.amount, Math.round(pending.total * 10000) / 10000, pending.nonce);
        pending = null;
      }
    };
  }

  /* ---------------- Register machines ---------------- */
  makeSlotGame({
    id: "riches",
    machine: "riches",
    name: "Rake Riches",
    tagline: "5 reels · free spins ×2",
    isNew: true,
    color: "linear-gradient(135deg,#ff8a1f,#d6246e)",
    tileBg: "radial-gradient(circle at 50% 30%, #ffb03a, #c2185b 60%, #3d0a2c 100%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M9 5v14M15 5v14"/><circle cx="6" cy="12" r="1.2" fill="#fff"/><circle cx="12" cy="12" r="1.2" fill="#fff"/><circle cx="18" cy="12" r="1.2" fill="#fff"/></svg>`,
    art: `<svg viewBox="0 0 100 100"><rect x="8" y="22" width="84" height="56" rx="10" fill="#1a0f02" opacity=".55"/><g transform="translate(13 30) scale(.62)">${SYM.seven.replace(/<\/?svg[^>]*>/g, "")}</g><g transform="translate(37 30) scale(.62)">${SYM.wild.replace(/<\/?svg[^>]*>/g, "")}</g><g transform="translate(61 30) scale(.62)">${SYM.seven.replace(/<\/?svg[^>]*>/g, "")}</g></svg>`,
  });
  makeSlotGame({
    id: "classic",
    machine: "classic",
    name: "Classic 7s",
    tagline: "3 reels · old-school fruit",
    color: "linear-gradient(135deg,#e8243f,#7a0b1c)",
    tileBg: "radial-gradient(circle at 50% 30%, #ff5468, #5a0717 80%)",
    icon: `<svg viewBox="0 0 24 24"><text x="12" y="19" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-weight="900" font-size="18" fill="#fff">7</text></svg>`,
    art: `<svg viewBox="0 0 100 100"><g transform="translate(5 18) scale(.7)">${SYM.cherry.replace(/<\/?svg[^>]*>/g, "")}</g><g transform="translate(51 18) scale(.7)">${SYM.bell.replace(/<\/?svg[^>]*>/g, "")}</g><g transform="translate(28 40) scale(.78)">${SYM.seven.replace(/<\/?svg[^>]*>/g, "")}</g></svg>`,
  });
})();
