/* Dice: pick a target, roll over or under. Roll = floor(f * 10001) / 100, from 0.00 to 100.00. */
(function () {
  "use strict";
  const R = window.Rake;
  const { el, $, fmt, round2, clamp } = R.util;

  const roll = (f) => Math.floor(f * 10001) / 100;
  const multFor = (chance) => Math.floor((99 / chance) * 10000) / 10000;

  R.register({
    id: "dice",
    name: "Dice",
    tagline: "Roll over or under",
    rules: "Payout = 99 ÷ win chance",
    color: "linear-gradient(135deg,#3b6cff,#1f3fb8)",
    tileBg: "radial-gradient(circle at 50% 35%, #5a86ff, #1d2f8a 75%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="#fff"/><circle cx="15" cy="15" r="1.3" fill="#fff"/><circle cx="15" cy="9" r="1.3" fill="#fff"/><circle cx="9" cy="15" r="1.3" fill="#fff"/></svg>`,
    art: `<svg viewBox="0 0 100 100"><g transform="rotate(-12 50 50)"><rect x="18" y="18" width="64" height="64" rx="14" fill="#fff"/><rect x="18" y="72" width="64" height="10" rx="5" fill="#c8d2f0"/><g fill="#2a4bd6"><circle cx="35" cy="35" r="6"/><circle cx="65" cy="35" r="6"/><circle cx="50" cy="50" r="6"/><circle cx="35" cy="65" r="6"/><circle cx="65" cy="65" r="6"/></g></g></svg>`,
    verify(next) {
      return `Roll: ${roll(next(1)[0]).toFixed(2)}`;
    },
    mount({ controls, stage }) {
      let target = R.store.get("dice:target", 50.5);
      let over = R.store.get("dice:over", true);
      let busy = false;

      const bet = R.ui.betInput();
      controls.appendChild(bet.el);
      const profitField = el(`<div class="field"><div class="label"><span>Profit on win</span></div><div class="readout">${R.ui.coin}<span data-p>0.00</span></div></div>`);
      controls.appendChild(profitField);
      const btn = el(`<button class="btn btn-accent btn-block btn-lg">Roll dice</button>`);
      controls.appendChild(btn);
      const tip = el(`<p class="muted" style="margin:0;font-size:12px">Tip: press <b>Space</b> to roll.</p>`);
      controls.appendChild(tip);

      stage.innerHTML = `
        <div class="pills" data-pills></div>
        <div class="dice-stage">
          <div class="dice-track-wrap">
            <div class="dice-scale"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
            <div class="dice-range">
              <div class="dice-bar"><div class="lose"></div><div class="winz"></div></div>
              <div class="dice-marker"><div class="cube">0.00</div></div>
              <input type="range" min="2" max="98" step="1" aria-label="Target">
            </div>
          </div>
          <div class="dice-fields">
            <div class="field"><div class="label">Multiplier</div><div class="input-group"><input class="input" data-mult type="number" step="0.0001" min="1.0102" max="49.5"><span class="input-suffix">×</span></div></div>
            <div class="field"><div class="label" data-dir-label>Roll over</div><button class="readout" data-dir style="cursor:pointer;justify-content:space-between;border-color:var(--border);color:var(--text)"><span data-t></span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 7h11l-3-3M17 17H6l3 3"/></svg></button></div>
            <div class="field"><div class="label">Win chance</div><div class="input-group"><input class="input" data-chance type="number" step="0.01" min="2" max="98"><span class="input-suffix">%</span></div></div>
          </div>
        </div>`;
      const range = $("input[type=range]", stage);
      const lose = $(".lose", stage), winz = $(".winz", stage);
      const marker = $(".dice-marker", stage), cube = $(".cube", stage);
      const multIn = $("[data-mult]", stage), chanceIn = $("[data-chance]", stage);
      const pills = $("[data-pills]", stage);
      const recent = [];

      const chance = () => (over ? 100 - target : target);
      function render(skip) {
        target = clamp(round2(target), 2, 98);
        range.value = target;
        const c = chance();
        lose.style.flex = over ? target : 100 - target;
        winz.style.flex = over ? 100 - target : target;
        $(".dice-bar", stage).style.flexDirection = over ? "row" : "row-reverse";
        $("[data-t]", stage).textContent = target.toFixed(2);
        $("[data-dir-label]", stage).textContent = over ? "Roll over" : "Roll under";
        if (skip !== "mult") multIn.value = multFor(c).toFixed(4);
        if (skip !== "chance") chanceIn.value = c.toFixed(2);
        $("[data-p]", profitField).textContent = fmt(bet.get() * multFor(c) - bet.get());
        R.store.set("dice:target", target);
        R.store.set("dice:over", over);
      }
      range.addEventListener("input", () => { target = parseFloat(range.value); render(); });
      $("[data-dir]", stage).onclick = () => { over = !over; target = 100 - target; render(); };
      chanceIn.addEventListener("input", () => {
        const c = parseFloat(chanceIn.value);
        if (!(c >= 2 && c <= 98)) return;
        target = over ? 100 - c : c;
        render("chance");
      });
      multIn.addEventListener("input", () => {
        const m = parseFloat(multIn.value);
        if (!(m >= 1.0102 && m <= 49.5)) return;
        const c = clamp(99 / m, 2, 98);
        target = over ? 100 - c : c;
        render("mult");
      });
      [chanceIn, multIn].forEach((i) => i.addEventListener("blur", () => render()));
      bet.onChange(() => render());

      function play(amt) {
        return new Promise((resolve) => {
        if (busy) return resolve(null);
        const amount = amt != null ? amt : bet.get();
        if (!R.wallet.debit(amount)) return resolve(null);
        busy = true;
        btn.disabled = true;
        const { floats, nonce } = R.fair.next(1);
        const r = roll(floats[0]);
        const won = over ? r > target : r < target;
        const m = multFor(chance());
        marker.classList.remove("won", "lost");
        marker.classList.add("show");
        marker.style.left = r + "%";
        cube.textContent = r.toFixed(2);
        setTimeout(() => {
          marker.classList.add(won ? "won" : "lost");
          const payout = R.settle("dice", amount, won ? m : 0, nonce);
          recent.unshift({ r, won });
          if (recent.length > 12) recent.pop();
          pills.innerHTML = recent.map((x) => `<span class="pill ${x.won ? "win" : "loss"}">${x.r.toFixed(2)}</span>`).join("");
          busy = false;
          btn.disabled = false;
          resolve({ payout });
        }, 280);
        });
      }
      btn.onclick = () => play();
      const modes = R.ui.betModes({ controls, bet, manualEls: [btn, tip], playOnce: play, delay: 120 });
      const onKey = (e) => {
        if (e.code === "Space" && !/INPUT|SELECT|TEXTAREA|BUTTON/.test(document.activeElement.tagName) && !document.querySelector(".modal-backdrop")) {
          e.preventDefault();
          if (!modes.running()) play();
        }
      };
      document.addEventListener("keydown", onKey);
      render();
      return () => {
        modes.stop();
        document.removeEventListener("keydown", onKey);
      };
    },
  });
})();
