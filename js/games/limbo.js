/* Limbo: pick a target multiplier; win if the result lands at or above it. */
(function () {
  "use strict";
  const R = window.Rake;
  const { el, $, fmt, round2, clamp } = R.util;

  R.register({
    id: "limbo",
    name: "Limbo",
    tagline: "How high can you go?",
    rules: "Win chance = 99 ÷ target",
    color: "linear-gradient(135deg,#ffb020,#e06a00)",
    tileBg: "radial-gradient(circle at 50% 30%, #ffc04d, #b04a00 78%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V5M6 11l6-6 6 6"/><path d="M5 20h14"/></svg>`,
    art: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="36" fill="none" stroke="#fff" stroke-width="6" opacity=".35"/><circle cx="50" cy="50" r="22" fill="none" stroke="#fff" stroke-width="6" opacity=".6"/><circle cx="50" cy="50" r="8" fill="#fff"/><path d="M50 50 78 22" stroke="#1a0f02" stroke-width="5" stroke-linecap="round"/><path d="M70 18h12v12" fill="none" stroke="#1a0f02" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    verify(next) {
      return `Result: ${R.crashPoint(next(1)[0]).toFixed(2)}×`;
    },
    mount({ controls, stage }) {
      let busy = false;
      const bet = R.ui.betInput();
      controls.appendChild(bet.el);
      const targetField = el(`<div class="field"><div class="label"><span>Target multiplier</span></div>
        <div class="input-group"><input class="input" type="number" min="1.01" max="1000000" step="0.01" value="${R.store.get("limbo:target", 2).toFixed(2)}"><span class="input-suffix">×</span></div></div>`);
      controls.appendChild(targetField);
      const info = el(`<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="field"><div class="label">Win chance</div><div class="readout" data-c></div></div>
        <div class="field"><div class="label">Profit on win</div><div class="readout" data-p></div></div></div>`);
      controls.appendChild(info);
      const btn = el(`<button class="btn btn-accent btn-block btn-lg">Bet</button>`);
      controls.appendChild(btn);

      stage.innerHTML = `<div class="pills" data-pills></div>
        <div class="limbo-stage"><div><div class="limbo-number">1.00×</div><div class="limbo-target">Target <span data-tg></span></div></div></div>`;
      const num = $(".limbo-number", stage);
      const pills = $("[data-pills]", stage);
      const tIn = $("input", targetField);
      const recent = [];

      const target = () => clamp(parseFloat(tIn.value) || 1.01, 1.01, 1000000);
      function render() {
        const t = target();
        $("[data-c]", info).textContent = (99 / t).toFixed(4).replace(/\.?0+$/, "") + "%";
        $("[data-p]", info).innerHTML = R.ui.coin + fmt(bet.get() * t - bet.get());
        $("[data-tg]", stage).textContent = t.toFixed(2) + "×";
        R.store.set("limbo:target", t);
      }
      tIn.addEventListener("input", render);
      tIn.addEventListener("blur", () => { tIn.value = target().toFixed(2); render(); });
      bet.onChange(render);

      let raf, pending = null;
      function finish() {
        const { amount, t, result, won, nonce, resolve } = pending;
        pending = null;
        const payout = R.settle("limbo", amount, won ? t : 0, nonce);
        resolve({ payout });
        recent.unshift({ result, won });
        if (recent.length > 12) recent.pop();
        busy = false;
      }
      function play(amt) {
        return new Promise((resolve) => {
        if (busy) return resolve(null);
        const amount = amt != null ? amt : bet.get();
        const t = target();
        if (!R.wallet.debit(amount)) return resolve(null);
        busy = true;
        btn.disabled = true;
        const { floats, nonce } = R.fair.next(1);
        const result = R.crashPoint(floats[0]);
        const won = result >= t;
        pending = { amount, t, result, won, nonce, resolve };
        num.classList.remove("won", "lost");
        const start = performance.now();
        const dur = 450;
        const tick = (now) => {
          const p = Math.min(1, (now - start) / dur);
          const e = 1 - Math.pow(1 - p, 3);
          const shown = 1 + (result - 1) * e;
          num.textContent = shown.toFixed(2) + "×";
          if (p < 1) raf = requestAnimationFrame(tick);
          else {
            num.textContent = result.toFixed(2) + "×";
            num.classList.add(won ? "won" : "lost");
            finish();
            pills.innerHTML = recent.map((x) => `<span class="pill ${x.won ? "win" : "loss"}">${x.result.toFixed(2)}×</span>`).join("");
            btn.disabled = false;
          }
        };
        raf = requestAnimationFrame(tick);
        });
      }
      btn.onclick = () => play();
      const modes = R.ui.betModes({ controls, bet, manualEls: [btn], playOnce: play, delay: 150 });
      render();
      return () => {
        modes.stop();
        if (raf) cancelAnimationFrame(raf);
        if (pending) finish(); // left mid-animation: pay out the already-decided bet

      };
    },
  });
})();
