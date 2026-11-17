/* Mines: 5×5 grid, pick gems and avoid mines. Each safe pick raises the multiplier. */
(function () {
  "use strict";
  const R = window.Rake;
  const { el, $, $$, fmt, fmtMult } = R.util;
  const N = 25;

  /** Fisher–Yates shuffle of tiles 0..24 driven by fair floats; the first `mines` tiles are mines. */
  function layout(floats) {
    const tiles = Array.from({ length: N }, (_, i) => i);
    for (let i = 0; i < N - 1; i++) {
      const j = i + Math.floor(floats[i] * (N - i));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    return tiles;
  }
  function multFor(mines, picks) {
    let m = 0.99;
    for (let i = 0; i < picks; i++) m *= (N - i) / (N - mines - i);
    return Math.floor(m * 100) / 100;
  }

  R.register({
    id: "mines",
    name: "Mines",
    tagline: "Find gems, dodge mines",
    rules: "More mines, bigger multipliers",
    color: "linear-gradient(135deg,#21c47a,#0b7a49)",
    tileBg: "radial-gradient(circle at 50% 40%, #35e08f, #075234 80%)",
    icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M6 9 9 4h6l3 5-6 11z"/></svg>`,
    art: R.icons.gem,
    verifyExtra: { label: "Mines (1–24)", default: 3 },
    verify(next, mines) {
      mines = Math.max(1, Math.min(24, Math.floor(mines || 3)));
      const tiles = layout(next(N - 1));
      const set = tiles.slice(0, mines);
      const grid = [];
      for (let r = 0; r < 5; r++) {
        let row = "";
        for (let c = 0; c < 5; c++) row += set.includes(r * 5 + c) ? " 💣" : " 💎";
        grid.push(row);
      }
      return `Mine tiles (0–24, left to right, top to bottom): ${set.sort((a, b) => a - b).join(", ")}\n\n${grid.join("\n")}`;
    },
    mount({ controls, stage }) {
      let game = R.store.get("mines:game", null); // {amount, mines, layout, picks:[], nonce, over, boom}
      if (game && game.over) game = null;

      const bet = R.ui.betInput();
      controls.appendChild(bet.el);
      const minesField = el(`<div class="field"><div class="label">Mines</div><select class="select">${Array.from({ length: 24 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join("")}</select></div>`);
      controls.appendChild(minesField);
      const sel = $("select", minesField);
      sel.value = R.store.get("mines:count", 3);
      sel.onchange = () => { R.store.set("mines:count", +sel.value); render(); };
      const info = el(`<div class="mines-info">
        <div class="field"><div class="label">Gems left</div><div class="readout" data-g></div></div>
        <div class="field"><div class="label">Next pick</div><div class="readout" data-n></div></div></div>`);
      controls.appendChild(info);
      const profitField = el(`<div class="field"><div class="label"><span>Total profit</span><span data-pm></span></div><div class="readout">${R.ui.coin}<span data-p>0.00</span></div></div>`);
      controls.appendChild(profitField);
      const btn = el(`<button class="btn btn-accent btn-block btn-lg">Bet</button>`);
      controls.appendChild(btn);
      const randBtn = el(`<button class="btn btn-ghost btn-block">Pick random tile</button>`);
      controls.appendChild(randBtn);

      stage.innerHTML = `<div class="mines-stage"><div class="mines-grid"></div></div>`;
      const grid = $(".mines-grid", stage);
      const tiles = Array.from({ length: N }, (_, i) => {
        const b = el(`<button class="tile-btn" aria-label="Tile ${i + 1}"></button>`);
        b.onclick = () => pick(i);
        grid.appendChild(b);
        return b;
      });
      let lastResult = null; // finished game kept on screen

      const save = () => R.store.set("mines:game", game);
      function render() {
        const g = game || lastResult;
        const mines = game ? game.mines : +sel.value;
        const picks = game ? game.picks.length : 0;
        const mineSet = g ? new Set(g.layout.slice(0, g.mines)) : null;
        tiles.forEach((t, i) => {
          const opened = g && g.picks.includes(i);
          const reveal = g && g.over;
          t.className = "tile-btn";
          t.disabled = !game;
          if (opened || reveal) {
            t.classList.add("open");
            const isMine = mineSet.has(i);
            if (!opened) t.classList.add("dim");
            if (isMine && g.boom === i) t.classList.add("boom");
            const want = isMine ? "mine" : "gem";
            if (t.dataset.k !== want) { t.innerHTML = R.icons[want]; t.dataset.k = want; }
            t.disabled = true;
          } else {
            t.innerHTML = "";
            t.dataset.k = "";
          }
        });
        $("[data-g]", info).textContent = N - mines - picks;
        $("[data-n]", info).textContent = picks < N - mines ? fmtMult(multFor(mines, picks + 1)) : "—";
        const cur = game ? multFor(game.mines, picks) : 0;
        $("[data-pm]", profitField).textContent = game && picks ? fmtMult(cur) : "";
        $("[data-p]", profitField).textContent = fmt(game && picks ? game.amount * cur - game.amount : 0);
        if (game) {
          btn.textContent = picks ? `Cash out ${fmt(game.amount * cur)}` : "Pick a tile";
          btn.className = "btn btn-win btn-block btn-lg";
          btn.disabled = !picks;
          randBtn.disabled = false;
          bet.disable(true);
          sel.disabled = true;
        } else {
          btn.textContent = "Bet";
          btn.className = "btn btn-accent btn-block btn-lg";
          btn.disabled = false;
          randBtn.disabled = true;
          bet.disable(false);
          sel.disabled = false;
        }
      }

      function start() {
        const amount = bet.get();
        if (!R.wallet.debit(amount)) return;
        const { floats, nonce } = R.fair.next(N - 1);
        game = { amount, mines: +sel.value, layout: layout(floats), picks: [], nonce, over: false, boom: null };
        lastResult = null;
        save();
        render();
      }
      function finish(mult) {
        game.over = true;
        R.settle("mines", game.amount, mult, game.nonce);
        lastResult = game;
        game = null;
        R.store.set("mines:game", null);
        render();
      }
      function pick(i) {
        if (!game || game.picks.includes(i)) return;
        const isMine = game.layout.slice(0, game.mines).includes(i);
        game.picks.push(i);
        if (isMine) {
          game.boom = i;
          finish(0);
          return;
        }
        save();
        if (game.picks.length === N - game.mines) {
          const m = multFor(game.mines, game.picks.length);
          R.ui.toast(`Cleared the board! ${fmtMult(m)}`, "success");
          finish(m);
          return;
        }
        render();
      }
      btn.onclick = () => {
        if (!game) start();
        else if (game.picks.length) finish(multFor(game.mines, game.picks.length));
      };
      randBtn.onclick = () => {
        if (!game) return;
        const open = tiles.map((_, i) => i).filter((i) => !game.picks.includes(i));
        pick(open[Math.floor(Math.random() * open.length)]);
      };
      render();
    },
  });
})();
