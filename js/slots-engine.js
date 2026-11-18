/* Rake slot engine: reel strips, paylines, wilds, scatters and free spins.
 * Pure functions so results can be re-computed in the fairness verifier. */
(function () {
  "use strict";
  const R = window.Rake;

  /** Deterministic shuffle so every player sees the same fixed reel strips. */
  function seededShuffle(arr, seed) {
    const a = arr.slice();
    let s = seed >>> 0;
    const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function buildStrip(counts, seed) {
    const list = [];
    for (const [sym, n] of Object.entries(counts)) for (let i = 0; i < n; i++) list.push(sym);
    return seededShuffle(list, seed);
  }

  /** Visible grid [reel][row] from one float per reel. */
  function spinGrid(cfg, floats) {
    return cfg.strips.map((strip, r) => {
      const stop = Math.floor(floats[r] * strip.length);
      return Array.from({ length: cfg.rows }, (_, row) => strip[(stop + row) % strip.length]);
    });
  }

  /** Evaluate a grid. Returns {lineWins:[{line, sym, count, mult}], scatter:{count, mult}, total} in multiples of TOTAL bet. */
  function evaluate(cfg, grid) {
    const nLines = cfg.lines.length;
    const lineWins = [];
    let total = 0;
    cfg.lines.forEach((line, li) => {
      const syms = line.map((row, reel) => grid[reel][row]);
      // run of wilds from the left
      let wildRun = 0;
      while (wildRun < syms.length && syms[wildRun] === cfg.wild) wildRun++;
      const base = syms.find((s) => s !== cfg.wild);
      let best = null;
      if (base && base !== cfg.scatter) {
        let n = 0;
        while (n < syms.length && (syms[n] === base || syms[n] === cfg.wild)) n++;
        const pay = (cfg.pays[base] || [])[n] || 0;
        if (pay) best = { sym: base, count: n, pay };
      }
      if (cfg.wild && wildRun) {
        const pay = (cfg.pays[cfg.wild] || [])[wildRun] || 0;
        if (pay && (!best || pay > best.pay)) best = { sym: cfg.wild, count: wildRun, pay };
      }
      if (best) {
        const mult = best.pay / nLines; // paytable is in line bets
        lineWins.push({ line: li, sym: best.sym, count: best.count, mult });
        total += mult;
      }
    });
    let scatter = { count: 0, mult: 0, cells: [] };
    if (cfg.scatter) {
      grid.forEach((col, reel) => col.forEach((s, row) => { if (s === cfg.scatter) scatter.cells.push([reel, row]); }));
      scatter.count = scatter.cells.length;
      scatter.mult = (cfg.scatterPays && cfg.scatterPays[Math.min(scatter.count, cfg.scatterPays.length - 1)]) || 0;
      total += scatter.mult;
    }
    const freeSpins = cfg.freeSpins && scatter.count >= cfg.freeSpins.need ? cfg.freeSpins.count : 0;
    return { lineWins, scatter, total, freeSpins };
  }

  /** Play a whole round (base spin + any free spins) from a float source. Used by verifier and simulation. */
  function playRound(cfg, nextFloats) {
    const base = evaluate(cfg, spinGrid(cfg, nextFloats()));
    let total = base.total;
    let left = base.freeSpins;
    let played = 0;
    while (left > 0 && played < cfg.freeSpins.max) {
      const fs = evaluate(cfg, spinGrid(cfg, nextFloats()));
      total += fs.total * cfg.freeSpins.mult;
      left += fs.freeSpins - 1;
      played++;
    }
    return { total, freeSpinsPlayed: played };
  }

  R.slots = { buildStrip, spinGrid, evaluate, playRound };
})();
