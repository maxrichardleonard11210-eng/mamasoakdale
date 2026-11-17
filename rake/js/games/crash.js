/* Crash: the multiplier climbs until it crashes. Cash out before it does. */
(function () {
  "use strict";
  const R = window.Rake;
  const { el, $, fmt, fmtMult, floor2 } = R.util;
  const RATE = 0.00007; // multiplier = e^(RATE * ms)

  R.register({
    id: "crash",
    name: "Crash",
    tagline: "Cash out before the crash",
    rules: "P(crash ≥ x) = 0.99 ÷ x",
    color: "linear-gradient(135deg,#ff4d63,#b3122c)",
    tileBg: "radial-gradient(circle at 30% 80%, #ff6b7f, #6e0a1d 80%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20c6 0 11-4 15-14"/><path d="M14 6h4v4"/></svg>`,
    art: `<svg viewBox="0 0 100 100"><path d="M10 88h80M10 88V12" stroke="#fff" stroke-opacity=".35" stroke-width="3"/><path d="M12 86c30 0 52-14 68-58" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round"/><path d="M12 86c30 0 52-14 68-58V86z" fill="#fff" opacity=".15"/><circle cx="80" cy="28" r="9" fill="#ffd36b"/><path d="M74 22l12 12M86 22 74 34" stroke="#b3122c" stroke-width="3.5" stroke-linecap="round"/></svg>`,
    verify(next) {
      return `Crash point: ${R.crashPoint(next(1)[0]).toFixed(2)}×`;
    },
    mount({ controls, stage }) {
      const bet = R.ui.betInput();
      controls.appendChild(bet.el);
      const autoField = el(`<div class="field"><div class="label"><span>Auto cash out</span><span>blank = off</span></div>
        <div class="input-group"><input class="input" type="number" min="1.01" step="0.01" placeholder="Off" value="${R.store.get("crash:auto", "")}"><span class="input-suffix">×</span></div></div>`);
      controls.appendChild(autoField);
      const autoIn = $("input", autoField);
      autoIn.addEventListener("input", () => R.store.set("crash:auto", autoIn.value));
      const btn = el(`<button class="btn btn-accent btn-block btn-lg fly-btn">Bet</button>`);
      controls.appendChild(btn);
      controls.appendChild(el(`<p class="muted" style="margin:0;font-size:12px">Every bet starts its own round. Cash out any time before the line crashes.</p>`));

      stage.innerHTML = `<div class="pills" data-pills></div>
        <div class="canvas-wrap"><canvas></canvas>
        <div class="stage-overlay"><div><div class="big-mult">1.00×</div><div class="stage-sub" data-sub>Place a bet to start</div><div data-badge></div></div></div></div>`;
      const canvas = $("canvas", stage);
      const big = $(".big-mult", stage), sub = $("[data-sub]", stage), badge = $("[data-badge]", stage);
      const pills = $("[data-pills]", stage);
      const recent = R.store.get("crash:recent", []);
      const renderPills = () => (pills.innerHTML = recent.map((m) => R.ui.multPill(m)).join(""));
      renderPills();

      // round state
      let round = null; // {amount, crash, start, auto, cashedAt, nonce, ended}
      let raf = null;
      const view = R.ui.fitCanvas(canvas, () => draw());

      const auto = () => {
        const v = parseFloat(autoIn.value);
        return v >= 1.01 ? v : null;
      };
      const multAt = (ms) => Math.exp(RATE * ms);
      const timeFor = (m) => Math.log(m) / RATE;

      function updateButton() {
        if (round && !round.ended && round.cashedAt == null) {
          const m = multAt(performance.now() - round.start);
          btn.className = "btn btn-win btn-block btn-lg fly-btn";
          R.setBtn(btn, "Cash out", fmt(round.amount * floor2(m)), true);
          btn.disabled = false;
          bet.disable(true);
          autoIn.disabled = true;
        } else if (round && !round.ended) {
          btn.className = "btn btn-accent btn-block btn-lg fly-btn";
          R.setBtn(btn, "Cashed out", "waiting for the crash…", false);
          btn.disabled = true;
        } else {
          btn.className = "btn btn-accent btn-block btn-lg fly-btn";
          R.setBtn(btn, "Bet", "", false);
          btn.disabled = false;
          bet.disable(false);
          autoIn.disabled = false;
        }
      }

      function cashOut(at) {
        if (!round || round.ended || round.cashedAt != null) return;
        const m = Math.min(at, round.crash);
        round.cashedAt = m;
        const payout = R.settle("crash", round.amount, m, round.nonce);
        badge.innerHTML = `<span class="badge-win">Cashed out ${fmtMult(m)} · +${fmt(payout - round.amount)}</span>`;
        updateButton();
      }

      function endRound() {
        round.ended = true;
        if (round.cashedAt == null) R.settle("crash", round.amount, 0, round.nonce);
        recent.unshift(round.crash);
        if (recent.length > 20) recent.length = 20;
        R.store.set("crash:recent", recent);
        renderPills();
        updateButton();
      }

      function loop() {
        if (!round) return;
        const elapsed = performance.now() - round.start;
        let m = multAt(elapsed);
        if (round.auto && round.cashedAt == null && m >= round.auto && round.auto < round.crash) cashOut(round.auto);
        if (m >= round.crash) {
          m = round.crash;
          endRound();
          draw();
          return;
        }
        draw();
        updateButton();
        raf = requestAnimationFrame(loop);
      }

      btn.onclick = () => {
        if (round && !round.ended) {
          const now = multAt(performance.now() - round.start);
          if (round.cashedAt == null && now < round.crash) cashOut(floor2(now));
          return;
        }
        const amount = bet.get();
        if (!R.wallet.debit(amount)) return;
        const { floats, nonce } = R.fair.next(1);
        round = { amount, crash: R.crashPoint(floats[0]), start: performance.now(), auto: auto(), cashedAt: null, nonce, ended: false };
        badge.innerHTML = "";
        updateButton();
        raf = requestAnimationFrame(loop);
      };

      function draw() {
        const { ctx, w, h } = view;
        ctx.clearRect(0, 0, w, h);
        const pad = { l: 46, r: 20, t: 20, b: 34 };
        const W = w - pad.l - pad.r, H = h - pad.t - pad.b;
        let elapsed = 0, m = 1;
        if (round) {
          elapsed = round.ended ? timeFor(round.crash) : performance.now() - round.start;
          m = round.ended ? round.crash : multAt(elapsed);
        }
        const maxT = Math.max(8000, elapsed * 1.15);
        const maxM = Math.max(2, 1 + (m - 1) * 1.25);
        const X = (t) => pad.l + (t / maxT) * W;
        const Y = (mm) => pad.t + H - ((mm - 1) / (maxM - 1)) * H;

        // grid
        ctx.font = "600 11px Inter, sans-serif";
        ctx.fillStyle = "#5d667a";
        ctx.strokeStyle = "rgba(255,255,255,.06)";
        ctx.lineWidth = 1;
        const yStep = niceStep((maxM - 1) / 4);
        for (let v = 1; v <= maxM + 1e-9; v += yStep) {
          const y = Y(v);
          ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
          ctx.textAlign = "right"; ctx.textBaseline = "middle";
          ctx.fillText(v.toFixed(v < 10 ? 1 : 0) + "×", pad.l - 8, y);
        }
        const tStep = niceStep(maxT / 1000 / 5) * 1000;
        for (let t = 0; t <= maxT; t += tStep) {
          ctx.textAlign = "center"; ctx.textBaseline = "top";
          ctx.fillText(Math.round(t / 1000) + "s", X(t), h - pad.b + 10);
        }

        const crashed = round && round.ended;
        const color = crashed ? "#ff4d63" : round && round.cashedAt != null ? "#2fd47a" : "#ff8a1f";
        if (round) {
          ctx.beginPath();
          const steps = 80;
          for (let i = 0; i <= steps; i++) {
            const t = (elapsed * i) / steps;
            const x = X(t), y = Y(multAt(t));
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          const tipX = X(elapsed), tipY = Y(m);
          ctx.lineWidth = 4; ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.stroke();
          ctx.lineTo(tipX, Y(1)); ctx.lineTo(X(0), Y(1)); ctx.closePath();
          const g = ctx.createLinearGradient(0, tipY, 0, Y(1));
          g.addColorStop(0, hexA(color, 0.35)); g.addColorStop(1, hexA(color, 0));
          ctx.fillStyle = g; ctx.fill();
          ctx.beginPath(); ctx.arc(tipX, tipY, 7, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
          ctx.beginPath(); ctx.arc(tipX, tipY, 13, 0, Math.PI * 2); ctx.fillStyle = hexA(color, 0.2); ctx.fill();
          if (round.cashedAt != null && round.cashedAt > 1) {
            const cx = X(timeFor(round.cashedAt)), cy = Y(round.cashedAt);
            ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fillStyle = "#2fd47a"; ctx.fill();
          }
        }
        big.textContent = m.toFixed(2) + "×";
        big.style.color = crashed ? "#ff4d63" : round && round.cashedAt != null ? "#2fd47a" : "";
        sub.textContent = !round ? "Place a bet to start" : crashed ? "Crashed" : "Current payout";
      }

      updateButton();
      return () => {
        if (raf) cancelAnimationFrame(raf);
        view.destroy();
        // Leaving mid-round: resolve with auto cash out if it would have hit, otherwise it rides to the crash.
        if (round && !round.ended) {
          if (round.cashedAt == null && round.auto && round.auto < round.crash) cashOut(round.auto);
          round.ended = true;
          if (round.cashedAt == null) R.settle("crash", round.amount, 0, round.nonce);
          recent.unshift(round.crash);
          if (recent.length > 20) recent.length = 20;
          R.store.set("crash:recent", recent);
        }
      };
    },
  });

  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
    const n = raw / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
  }
  function hexA(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }
  window.Rake.draw = { niceStep, hexA };
})();
