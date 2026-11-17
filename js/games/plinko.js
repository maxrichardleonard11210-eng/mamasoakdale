/* Plinko: drop a ball through rows of pegs. Each row is a fair coin flip left or right. */
(function () {
  "use strict";
  const R = window.Rake;
  const { el, $, fmt } = R.util;

  const RISK = {
    low: { floor: 0.5, p: 2 },
    medium: { floor: 0.3, p: 3.2 },
    high: { floor: 0.2, p: 4.6 },
  };
  function binom(n) {
    const out = [];
    let c = 1;
    for (let k = 0; k <= n; k++) {
      out.push(c / Math.pow(2, n));
      c = (c * (n - k)) / (k + 1);
    }
    return out;
  }
  /** Round down so the house edge never drops below 1%. */
  function nice(v) {
    if (v >= 10) return Math.floor(v);
    return Math.floor(v * 10) / 10;
  }
  /** Payout table: center pays `floor`, edges grow as x^p. The scale is solved so the
   *  rounded table returns as close to 99% as possible without going over. */
  const cache = {};
  function table(rows, risk) {
    const key = rows + risk;
    if (cache[key]) return cache[key];
    const { floor, p } = RISK[risk];
    const probs = binom(rows);
    const xs = probs.map((_, i) => Math.abs(i - rows / 2) / (rows / 2));
    const build = (k) => xs.map((x) => nice(floor + k * Math.pow(x, p)));
    const rtp = (t) => t.reduce((a, m, i) => a + m * probs[i], 0);
    let lo = 0, hi = 1e5;
    for (let n = 0; n < 60; n++) {
      const mid = (lo + hi) / 2;
      if (rtp(build(mid)) <= 0.99) lo = mid; else hi = mid;
    }
    return (cache[key] = build(lo));
  }
  R.plinkoTable = table;
  const pathFrom = (floats) => floats.map((f) => (f < 0.5 ? 0 : 1));

  R.register({
    id: "plinko",
    name: "Plinko",
    tagline: "Drop it like it's hot",
    rules: "8–16 rows · 3 risk levels",
    edge: "1–2.6%",
    color: "linear-gradient(135deg,#d64bff,#7a1fbf)",
    tileBg: "radial-gradient(circle at 50% 20%, #e477ff, #4a0f80 80%)",
    icon: `<svg viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="5" r="2"/><circle cx="8" cy="11" r="2"/><circle cx="16" cy="11" r="2"/><circle cx="4" cy="17" r="2"/><circle cx="12" cy="17" r="2"/><circle cx="20" cy="17" r="2"/></svg>`,
    art: `<svg viewBox="0 0 100 100"><g fill="#fff" opacity=".85"><circle cx="50" cy="22" r="4"/><circle cx="38" cy="38" r="4"/><circle cx="62" cy="38" r="4"/><circle cx="26" cy="54" r="4"/><circle cx="50" cy="54" r="4"/><circle cx="74" cy="54" r="4"/><circle cx="14" cy="70" r="4"/><circle cx="38" cy="70" r="4"/><circle cx="62" cy="70" r="4"/><circle cx="86" cy="70" r="4"/></g><circle cx="44" cy="46" r="7" fill="#ffd36b"/><g><rect x="4" y="82" width="20" height="12" rx="3" fill="#ff4d63"/><rect x="27" y="82" width="20" height="12" rx="3" fill="#ffb020"/><rect x="53" y="82" width="20" height="12" rx="3" fill="#ffb020"/><rect x="76" y="82" width="20" height="12" rx="3" fill="#ff4d63"/></g></svg>`,
    verifyExtra: { label: "Rows (8–16)", default: 16 },
    verify(next, rows) {
      rows = Math.max(8, Math.min(16, Math.floor(rows || 16)));
      const path = pathFrom(next(rows));
      const bucket = path.reduce((a, b) => a + b, 0);
      return `Path: ${path.map((d) => (d ? "R" : "L")).join(" ")}\nBucket: ${bucket} of 0–${rows}\nPayouts: low ${table(rows, "low")[bucket]}× · medium ${table(rows, "medium")[bucket]}× · high ${table(rows, "high")[bucket]}×`;
    },
    mount({ controls, stage }) {
      let risk = R.store.get("plinko:risk", "medium");
      let rows = R.store.get("plinko:rows", 16);
      const balls = [];
      const flashes = {}; // bucket index -> time

      const bet = R.ui.betInput();
      controls.appendChild(bet.el);
      const riskField = el(`<div class="field"><div class="label">Risk</div><div class="seg">
        <button data-r="low">Low</button><button data-r="medium">Medium</button><button data-r="high">High</button></div></div>`);
      controls.appendChild(riskField);
      const rowsField = el(`<div class="field"><div class="label">Rows</div><select class="select">${[8, 9, 10, 11, 12, 13, 14, 15, 16].map((r) => `<option>${r}</option>`).join("")}</select></div>`);
      controls.appendChild(rowsField);
      const rowSel = $("select", rowsField);
      rowSel.value = rows;
      const btn = el(`<button class="btn btn-accent btn-block btn-lg">Drop ball</button>`);
      controls.appendChild(btn);
      const autoRow = el(`<div style="display:grid;grid-template-columns:1fr auto;gap:8px">
        <div class="input-group"><input class="input" type="number" min="1" max="500" value="10" aria-label="Auto drops"><span class="input-suffix">balls</span></div>
        <button class="btn btn-violet" data-auto>Auto</button></div>`);
      controls.appendChild(autoRow);
      controls.appendChild(el(`<p class="muted" style="margin:0;font-size:12px">Drop as many balls as you like at once. Risk and rows lock while balls are falling.</p>`));

      stage.innerHTML = `<div class="pills" data-pills></div><div class="canvas-wrap plinko-wrap"><canvas></canvas></div>`;
      const pills = $("[data-pills]", stage);
      const recent = [];
      const view = R.ui.fitCanvas($("canvas", stage));

      function syncControls() {
        const busy = balls.length > 0;
        riskField.querySelectorAll("button").forEach((b) => {
          b.classList.toggle("on", b.dataset.r === risk);
          b.disabled = busy;
        });
        rowSel.disabled = busy;
      }
      riskField.querySelectorAll("button").forEach((b) => (b.onclick = () => { risk = b.dataset.r; R.store.set("plinko:risk", risk); syncControls(); }));
      rowSel.onchange = () => { rows = +rowSel.value; R.store.set("plinko:rows", rows); };

      function geom() {
        const { w, h } = view;
        const top = 26, bottom = 44;
        const spacing = Math.min((w - 30) / (rows + 2), (h - top - bottom) / rows);
        const width = spacing * (rows + 2);
        const left = (w - width) / 2;
        const cx = w / 2;
        const rowY = (r) => top + r * spacing;
        const pegR = Math.max(2.2, spacing * 0.11);
        const ballR = Math.max(4, spacing * 0.24);
        return { w, h, top, spacing, left, cx, rowY, pegR, ballR, bucketY: rowY(rows - 1) + spacing * 0.7 };
      }

      function drop() {
        const amount = bet.get();
        if (!R.wallet.debit(amount)) return false;
        const { floats, nonce } = R.fair.next(rows);
        const path = pathFrom(floats);
        balls.push({ amount, path, nonce, rows, risk, start: performance.now(), jitter: (Math.random() - 0.5) * 0.3 });
        syncControls();
        return true;
      }
      btn.onclick = drop;

      let autoTimer = null;
      const autoBtn = $("[data-auto]", autoRow);
      autoBtn.onclick = () => {
        if (autoTimer) return stopAuto();
        let left = Math.max(1, Math.min(500, parseInt($("input", autoRow).value, 10) || 10));
        autoBtn.textContent = "Stop";
        autoBtn.className = "btn btn-loss";
        autoTimer = setInterval(() => {
          if (left-- <= 0 || !drop()) stopAuto();
        }, 260);
      };
      function stopAuto() {
        clearInterval(autoTimer);
        autoTimer = null;
        autoBtn.textContent = "Auto";
        autoBtn.className = "btn btn-violet";
      }

      const SEG = 130; // ms per row
      function ballPos(b, now, g) {
        const t = (now - b.start) / SEG;
        const s = g.spacing;
        // keyframes: k=0 is the drop point above row 0; k=r is resting on the top of row r's peg
        const pointAt = (k) => {
          if (k <= 0) return { x: g.cx + b.jitter * s * 0.2, y: g.rowY(0) - s * 0.9 };
          const rights = b.path.slice(0, k).reduce((a, c) => a + c, 0);
          const x = g.cx + (rights - k / 2) * s;
          if (k >= b.rows) return { x, y: g.bucketY };
          return { x, y: g.rowY(k) - g.pegR - g.ballR };
        };
        const first = { x: g.cx, y: g.rowY(0) - g.pegR - g.ballR };
        if (t < 1) {
          // fall onto the first peg
          const a = pointAt(0);
          return { x: a.x + (first.x - a.x) * t, y: a.y + (first.y - a.y) * t * t, done: false };
        }
        const k = Math.floor(t - 1);
        const f = t - 1 - k;
        if (k >= b.rows) return { ...pointAt(b.rows), done: true };
        const a = k === 0 ? first : pointAt(k);
        const c = pointAt(k + 1);
        const hop = s * 0.35;
        return { x: a.x + (c.x - a.x) * f, y: a.y + (c.y - a.y) * f - hop * 4 * f * (1 - f) * (k + 1 < b.rows ? 1 : 0.4), done: false };
      }

      function bucketColor(i, n) {
        const x = Math.abs(i - n / 2) / (n / 2);
        const a = [255, 200, 74], b = [255, 59, 92];
        const c = a.map((v, j) => Math.round(v + (b[j] - v) * Math.pow(x, 0.8)));
        return `rgb(${c[0]},${c[1]},${c[2]})`;
      }

      let raf;
      function loop(now) {
        const g = geom();
        const { ctx, w, h } = view;
        ctx.clearRect(0, 0, w, h);
        // pegs
        ctx.fillStyle = "#e8ebf2";
        for (let r = 0; r < rows; r++) {
          for (let j = 0; j < r + 3; j++) {
            const x = g.cx + (j - (r + 2) / 2) * g.spacing;
            ctx.beginPath(); ctx.arc(x, g.rowY(r), g.pegR, 0, Math.PI * 2); ctx.fill();
          }
        }
        // buckets
        const tbl = table(rows, risk);
        const bw = g.spacing * 0.9, bh = Math.max(20, g.spacing * 0.75);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = `800 ${Math.max(8, Math.min(13, g.spacing * 0.3))}px Inter, sans-serif`;
        for (let i = 0; i <= rows; i++) {
          const x = g.cx + (i - rows / 2) * g.spacing;
          const fl = flashes[i] ? Math.max(0, 1 - (now - flashes[i]) / 400) : 0;
          const y = g.bucketY - bh / 2 + 4 + fl * 6;
          ctx.fillStyle = bucketColor(i, rows);
          ctx.globalAlpha = 0.85 + fl * 0.15;
          roundRect(ctx, x - bw / 2, y, bw, bh, 4);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = "rgba(0,0,0,.25)";
          ctx.fillRect(x - bw / 2, y + bh - 4, bw, 4);
          ctx.fillStyle = "#1a0f02";
          const m = tbl[i];
          ctx.fillText(rows > 12 || m >= 100 ? String(m) : m + "×", x, y + bh / 2 - 1);
        }
        // balls
        for (let n = balls.length - 1; n >= 0; n--) {
          const b = balls[n];
          // geometry depends on current rows; balls are only allowed to fall while rows are locked
          const p = ballPos(b, now, g);
          if (p.done) {
            const bucket = b.path.reduce((a, c) => a + c, 0);
            const m = table(b.rows, b.risk)[bucket];
            R.settle("plinko", b.amount, m, b.nonce);
            flashes[bucket] = now;
            recent.unshift(m);
            if (recent.length > 14) recent.pop();
            pills.innerHTML = recent.map((v) => `<span class="pill ${v >= 1 ? (v >= 10 ? "hi" : "win") : "loss"}">${v}×</span>`).join("");
            balls.splice(n, 1);
            syncControls();
            continue;
          }
          const grad = ctx.createRadialGradient(p.x - g.ballR * 0.3, p.y - g.ballR * 0.3, 1, p.x, p.y, g.ballR);
          grad.addColorStop(0, "#ffe7b0"); grad.addColorStop(1, "#ff8a1f");
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(p.x, p.y, g.ballR, 0, Math.PI * 2); ctx.fill();
        }
        raf = requestAnimationFrame(loop);
      }
      function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      }

      syncControls();
      raf = requestAnimationFrame(loop);
      return () => {
        cancelAnimationFrame(raf);
        stopAuto();
        view.destroy();
        // Balls still falling have known outcomes; pay them out.
        for (const b of balls) {
          const bucket = b.path.reduce((a, c) => a + c, 0);
          R.settle("plinko", b.amount, table(b.rows, b.risk)[bucket], b.nonce);
        }
        balls.length = 0;
      };
    },
  });
})();
