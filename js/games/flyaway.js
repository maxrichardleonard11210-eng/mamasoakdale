/* Flyaway: the plane takes off and the multiplier climbs. Cash out before it flies away.
 * Rounds run back to back with a short boarding window. Up to two bets per round. */
(function () {
  "use strict";
  const R = window.Rake;
  const { el, $, $$, fmt, fmtMult, floor2 } = R.util;
  const RATE = 0.00007;
  const BOARDING_MS = 5000;
  const AFTER_MS = 2600;

  /** Update a two-line button without replacing its child elements (keeps clicks reliable mid-animation). */
  function setBtn(btn, label, sub, coin) {
    if (!btn._parts) {
      btn.innerHTML = '<span></span><small><span class="coin-icon" style="width:11px;height:11px;margin-right:4px;vertical-align:-1px"></span><span></span></small>';
      btn._parts = { label: btn.firstChild, coin: btn.querySelector(".coin-icon"), sub: btn.querySelector("small > span:last-child") };
    }
    const q = btn._parts;
    if (q.label.textContent !== label) q.label.textContent = label;
    if (q.sub.textContent !== sub) q.sub.textContent = sub;
    q.coin.style.display = coin ? "" : "none";
  }
  R.setBtn = setBtn;

  R.register({
    id: "flyaway",
    name: "Flyaway",
    tagline: "Cash out before it flies off",
    rules: "P(flight ≥ x) = 0.99 ÷ x",
    isNew: true,
    color: "linear-gradient(135deg,#ff5e3a,#c21f4b)",
    tileBg: "linear-gradient(160deg,#ff7a45 0%,#d4234f 55%,#3a0d2e 100%)",
    icon: `<svg viewBox="0 0 24 24" fill="#fff"><path d="M2.5 13.5 21 6.2c.7-.3 1.3.5.8 1.1l-6.6 7.4-.3 5.1c0 .6-.8.8-1.1.3l-2.4-3.6-3.8 1.5c-.5.2-1-.3-.7-.8l1.6-3.1-5.4-.3c-.6 0-.8-.9-.3-1.2z"/></svg>`,
    art: `<svg viewBox="0 0 120 100"><path d="M6 90C50 88 80 66 104 20" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round"/><g transform="translate(70 18) rotate(-28)"><path d="M-30 6c0-6 8-10 26-10h22c8 0 14 4 14 9s-6 9-14 9H-6C-22 14-30 11-30 6z" fill="#fff"/><path d="M0 4l-8 26h10L18 4z" fill="#ffe0d0"/><path d="M-4-2-10-22h8L12-2z" fill="#ffe0d0"/><path d="M-28 2-36-14h7L-20 2z" fill="#fff"/><circle cx="22" cy="2" r="3" fill="#d4234f"/><circle cx="12" cy="2" r="3" fill="#d4234f"/><circle cx="2" cy="2" r="3" fill="#d4234f"/></g></svg>`,
    verify(next) {
      return `Flight result: ${R.crashPoint(next(1)[0]).toFixed(2)}×`;
    },
    mount({ controls, stage }) {
      const { niceStep, hexA } = R.draw;
      controls.innerHTML = `
        <div class="field"><div class="label">How to play</div></div>
        <ol class="muted" style="margin:-6px 0 0;padding-left:18px;display:flex;flex-direction:column;gap:6px;font-size:13px">
          <li>Place one or two bets while passengers board.</li>
          <li>The plane takes off and the multiplier climbs.</li>
          <li>Cash out before it flies away. If you don't, the bet is lost.</li>
        </ol>
        <div class="field"><div class="label">Auto cash out</div></div>
        <p class="muted" style="margin:-8px 0 0;font-size:13px">Turn on <b>Auto</b> in a bet panel to cash out at a set multiplier automatically.</p>
        <div class="stats-row" style="grid-template-columns:1fr 1fr" data-fstats></div>`;

      stage.innerHTML = `<div class="pills" data-pills></div>
        <div class="canvas-wrap" style="min-height:380px"><canvas></canvas>
          <div class="stage-overlay"><div><div class="stage-sub" data-top></div><div class="big-mult" data-mult></div><div class="fly-progress" data-prog><div></div></div><div data-badge></div></div></div>
        </div>
        <div class="fly-bets"></div>`;
      const canvas = $("canvas", stage);
      const multEl = $("[data-mult]", stage), topEl = $("[data-top]", stage), prog = $("[data-prog]", stage), badge = $("[data-badge]", stage);
      const pills = $("[data-pills]", stage);
      const recent = R.store.get("flyaway:recent", []);
      const renderPills = () => (pills.innerHTML = recent.map((m) => R.ui.multPill(m)).join(""));
      renderPills();

      const view = R.ui.fitCanvas(canvas, () => draw(performance.now()));
      const multAt = (ms) => Math.exp(RATE * ms);
      const timeFor = (m) => Math.log(m) / RATE;

      /* ---------- Round state machine ---------- */
      // phase: "boarding" | "flying" | "gone"
      let phase = "boarding";
      let phaseStart = performance.now();
      let flight = null; // {crash, nonce, start}
      let roundNo = 0;

      /* ---------- Bet panels ---------- */
      const panels = [0, 1].map((i) => makePanel(i));
      function makePanel(i) {
        const node = el(`<div class="fly-panel">
          <div class="fly-panel-head"><span>Bet ${i ? "B" : "A"}</span>
            <label class="switch"><input type="checkbox" data-auto-on><span class="knob"></span>Auto</label></div>
          </div>`);
        const bet = R.ui.betInput({ key: "flyaway:bet" + i, label: "Amount" });
        node.appendChild(bet.el);
        const auto = el(`<div class="fly-auto"><div class="input-group"><input class="input" type="number" min="1.01" step="0.01" value="${Number(R.store.get("flyaway:auto" + i, 2)).toFixed(2)}" data-auto><span class="input-suffix">×</span></div></div>`);
        node.appendChild(auto);
        const btn = el(`<button class="btn btn-accent btn-block btn-lg fly-btn"></button>`);
        node.appendChild(btn);
        $(".fly-bets", stage).appendChild(node);
        const autoOn = $("[data-auto-on]", node);
        const autoIn = $("[data-auto]", node);
        autoOn.checked = R.store.get("flyaway:autoOn" + i, false);
        autoIn.disabled = !autoOn.checked;
        autoOn.onchange = () => { R.store.set("flyaway:autoOn" + i, autoOn.checked); autoIn.disabled = !autoOn.checked || p.status === "active"; };
        autoIn.oninput = () => R.store.set("flyaway:auto" + i, autoIn.value);
        const p = { i, node, bet, btn, autoOn, autoIn, status: "none", amount: 0, auto: null, cashedAt: null };
        btn.onclick = () => onPanelClick(p);
        return p;
      }

      function onPanelClick(p) {
        if (p.status === "none") {
          const amount = p.bet.get();
          if (!R.wallet.debit(amount)) return;
          p.amount = amount;
          p.status = "queued";
          p.auto = null;
        } else if (p.status === "queued") {
          R.wallet.credit(p.amount); // cancel = refund
          p.status = "none";
        } else if (p.status === "active" && phase === "flying") {
          const m = multAt(performance.now() - flight.start);
          if (m < flight.crash) cashOut(p, floor2(m));
        }
        renderPanels();
      }

      function cashOut(p, m) {
        p.cashedAt = Math.min(m, flight.crash);
        p.status = "cashed";
        const payout = R.settle("flyaway", p.amount, p.cashedAt, flight.nonce);
        R.ui.toast(`Bet ${p.i ? "B" : "A"} cashed out at ${fmtMult(p.cashedAt)}: +${fmt(payout - p.amount)}`, "success");
        showBadge();
      }

      function showBadge() {
        const wins = panels.filter((p) => p.status === "cashed");
        badge.innerHTML = wins.map((p) => `<div class="badge-win">${p.i ? "B" : "A"} · ${fmtMult(p.cashedAt)} · +${fmt(p.amount * p.cashedAt - p.amount)}</div>`).join("");
      }

      let lastStats = "";
      function renderPanels() {
        const now = performance.now();
        for (const p of panels) {
          const locked = p.status !== "none";
          p.bet.disable(locked);
          p.autoOn.disabled = p.status === "active" || p.status === "cashed";
          p.autoIn.disabled = !p.autoOn.checked || p.status === "active" || p.status === "cashed";
          p.node.classList.toggle("active", p.status === "active" || p.status === "queued");
          let cls = "btn-accent", label = "", sub = "", coin = false, dis = false;
          if (p.status === "none") {
            label = "Bet";
            if (phase === "boarding") { sub = fmt(p.bet.get()); coin = true; } else sub = "next flight";
          } else if (p.status === "queued") {
            cls = "btn-loss";
            label = "Cancel";
            sub = phase === "boarding" ? "boarding…" : "waiting for next flight";
          } else if (p.status === "active") {
            if (phase === "flying") {
              cls = "btn-win";
              label = "Cash out";
              sub = fmt(p.amount * floor2(multAt(now - flight.start)));
              coin = true;
            } else {
              label = "Boarded"; sub = fmt(p.amount); coin = true; dis = true;
            }
          } else if (p.status === "cashed") {
            cls = "btn-ghost";
            label = "Cashed " + fmtMult(p.cashedAt);
            sub = "+" + fmt(p.amount * p.cashedAt - p.amount);
            dis = true;
          } else if (p.status === "lost") {
            cls = "btn-ghost";
            label = "Flew away";
            sub = "-" + fmt(p.amount);
            dis = true;
          }
          const c = `btn ${cls} btn-block btn-lg fly-btn`;
          if (p.btn.className !== c) p.btn.className = c;
          setBtn(p.btn, label, sub, coin);
          p.btn.disabled = dis;
        }
        const mine = R.history.list.filter((b) => b.game === "flyaway");
        const best = mine.reduce((a, b) => (b.mult > a ? b.mult : a), 0);
        const statsHtml = `
          <div class="stat"><div class="stat-label">Rounds watched</div><div class="stat-value">${roundNo}</div></div>
          <div class="stat"><div class="stat-label">Best cash out</div><div class="stat-value">${best ? fmtMult(best) : "—"}</div></div>`;
        if (statsHtml !== lastStats) { lastStats = statsHtml; controls.querySelector("[data-fstats]").innerHTML = statsHtml; }
      }

      /* ---------- Phase transitions ---------- */
      function takeOff(now) {
        const { floats, nonce } = R.fair.next(1);
        flight = { crash: R.crashPoint(floats[0]), nonce, start: now };
        phase = "flying";
        phaseStart = now;
        badge.innerHTML = "";
        for (const p of panels) {
          if (p.status === "queued") {
            p.status = "active";
            p.cashedAt = null;
            p.auto = p.autoOn.checked ? Math.max(1.01, parseFloat(p.autoIn.value) || 2) : null;
          }
        }
      }
      function flyAway(now) {
        phase = "gone";
        phaseStart = now;
        roundNo++;
        for (const p of panels) {
          if (p.status === "active") {
            R.settle("flyaway", p.amount, 0, flight.nonce);
            p.status = "lost";
          }
        }
        recent.unshift(flight.crash);
        if (recent.length > 24) recent.length = 24;
        R.store.set("flyaway:recent", recent);
        renderPills();
      }
      function board(now) {
        phase = "boarding";
        phaseStart = now;
        badge.innerHTML = "";
        for (const p of panels) if (p.status === "cashed" || p.status === "lost") p.status = "none";
      }

      let raf;
      function loop(now) {
        if (phase === "boarding" && now - phaseStart >= BOARDING_MS) takeOff(now);
        if (phase === "flying") {
          const m = multAt(now - flight.start);
          for (const p of panels) {
            if (p.status === "active" && p.auto && m >= p.auto && p.auto < flight.crash) cashOut(p, p.auto);
          }
          if (m >= flight.crash) flyAway(now);
        }
        if (phase === "gone" && now - phaseStart >= AFTER_MS) board(now);
        draw(now);
        renderPanels();
        raf = requestAnimationFrame(loop);
      }

      /* ---------- Rendering ---------- */
      const stars = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, s: Math.random() * 0.6 + 0.2 }));
      function draw(now) {
        const { ctx, w, h } = view;
        ctx.clearRect(0, 0, w, h);
        // sky
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, "#160f2a");
        sky.addColorStop(1, "#0f1320");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
        const flying = phase === "flying";
        const t = flying ? now - flight.start : phase === "gone" ? timeFor(flight.crash) : 0;
        const speed = flying ? 0.00004 + Math.min(t, 30000) * 0.0000000025 : 0.000006;
        for (const s of stars) {
          const x = ((s.x - now * speed * s.s) % 1 + 1) % 1;
          ctx.globalAlpha = 0.25 + s.s * 0.6;
          ctx.fillStyle = "#fff";
          ctx.beginPath(); ctx.arc(x * w, s.y * h * 0.85, s.r, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
        // sunburst behind the plane path
        const glow = ctx.createRadialGradient(0, h, 0, 0, h, Math.max(w, h));
        glow.addColorStop(0, "rgba(255,94,58,.22)");
        glow.addColorStop(1, "rgba(255,94,58,0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);

        const pad = { l: 40, r: 30, t: 30, b: 34 };
        const W = w - pad.l - pad.r, H = h - pad.t - pad.b;
        const m = flying ? multAt(t) : phase === "gone" ? flight.crash : 1;
        const maxT = Math.max(9000, t * 1.3);
        const maxM = Math.max(2, 1 + (m - 1) * 1.35);
        const X = (tt) => pad.l + (tt / maxT) * W;
        const Y = (mm) => pad.t + H - ((mm - 1) / (maxM - 1)) * H;

        // axes labels
        ctx.font = "600 11px Inter, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,.35)";
        ctx.textAlign = "right"; ctx.textBaseline = "middle";
        const step = niceStep((maxM - 1) / 4);
        for (let v = 1; v <= maxM + 1e-9; v += step) ctx.fillText(v.toFixed(v < 10 ? 1 : 0) + "×", pad.l - 6, Y(v));
        ctx.strokeStyle = "rgba(255,255,255,.12)";
        ctx.beginPath(); ctx.moveTo(pad.l, pad.t); ctx.lineTo(pad.l, h - pad.b); ctx.lineTo(w - pad.r, h - pad.b); ctx.stroke();

        if (phase === "boarding") {
          drawPlane(ctx, X(0) + 30, Y(1) - 12, -0.05, 1, now);
        } else {
          // flight path
          ctx.beginPath();
          const steps = 90;
          for (let i = 0; i <= steps; i++) {
            const tt = (t * i) / steps;
            const x = X(tt), y = Y(multAt(tt));
            i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
          }
          const tipX = X(t), tipY = Y(m);
          const lineColor = phase === "gone" ? "#ff4d63" : "#ff5e3a";
          ctx.strokeStyle = lineColor; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.stroke();
          ctx.lineTo(tipX, Y(1)); ctx.lineTo(X(0), Y(1)); ctx.closePath();
          const fill = ctx.createLinearGradient(0, tipY, 0, Y(1));
          fill.addColorStop(0, hexA(lineColor, 0.4)); fill.addColorStop(1, hexA(lineColor, 0.02));
          ctx.fillStyle = fill; ctx.fill();
          // tangent angle
          const dt = 200;
          const ang = Math.atan2(Y(multAt(t)) - Y(multAt(Math.max(0, t - dt))), X(t) - X(Math.max(0, t - dt)));
          if (phase === "flying") {
            drawPlane(ctx, tipX, tipY, ang, 1, now);
          } else {
            // flies off to the upper right
            const k = Math.min(1, (now - phaseStart) / 900);
            const e = k * k;
            drawPlane(ctx, tipX + e * (w * 0.7), tipY - e * (h * 0.8), ang - 0.25 * e, 1, now);
          }
        }

        // overlay text
        if (phase === "boarding") {
          const left = Math.max(0, BOARDING_MS - (now - phaseStart));
          topEl.textContent = "Boarding · next flight in";
          multEl.textContent = (left / 1000).toFixed(1) + "s";
          multEl.style.color = "";
          prog.style.display = "";
          prog.firstElementChild.style.width = (100 * (1 - left / BOARDING_MS)).toFixed(1) + "%";
        } else if (phase === "flying") {
          topEl.textContent = "";
          multEl.textContent = m.toFixed(2) + "×";
          multEl.style.color = "";
          prog.style.display = "none";
        } else {
          topEl.textContent = "Flew away!";
          topEl.style.color = "#ff4d63";
          multEl.textContent = flight.crash.toFixed(2) + "×";
          multEl.style.color = "#ff4d63";
          prog.style.display = "none";
        }
        if (phase !== "gone") topEl.style.color = "";
      }

      function drawPlane(ctx, x, y, angle, s, now) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.scale(s, s);
        // body
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-34, -2);
        ctx.quadraticCurveTo(-34, -9, -10, -9);
        ctx.lineTo(14, -9);
        ctx.quadraticCurveTo(30, -9, 32, 0);
        ctx.quadraticCurveTo(30, 7, 14, 7);
        ctx.lineTo(-14, 7);
        ctx.quadraticCurveTo(-34, 6, -34, -2);
        ctx.fill();
        // tail fin
        ctx.beginPath();
        ctx.moveTo(-30, -5); ctx.lineTo(-38, -22); ctx.lineTo(-30, -22); ctx.lineTo(-18, -7); ctx.closePath();
        ctx.fill();
        // wings
        ctx.fillStyle = "#ffd9c9";
        ctx.beginPath();
        ctx.moveTo(-2, 2); ctx.lineTo(-12, 26); ctx.lineTo(-3, 26); ctx.lineTo(14, 2); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-4, -6); ctx.lineTo(-10, -20); ctx.lineTo(-3, -20); ctx.lineTo(8, -6); ctx.closePath(); ctx.fill();
        // stripe + windows
        ctx.fillStyle = "#ff5e3a";
        ctx.fillRect(-28, 1, 54, 3);
        ctx.fillStyle = "#3a1a3f";
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-18 + i * 8, -3, 2, 0, Math.PI * 2); ctx.fill(); }
        ctx.beginPath(); ctx.moveTo(22, -6); ctx.quadraticCurveTo(29, -5, 30, -1); ctx.lineTo(22, -1); ctx.closePath(); ctx.fill();
        // exhaust flicker
        if (phase === "flying") {
          const f = 6 + Math.sin(now / 40) * 3;
          ctx.fillStyle = "rgba(255,179,92,.8)";
          ctx.beginPath(); ctx.moveTo(-34, -4); ctx.lineTo(-34 - f, -1); ctx.lineTo(-34, 2); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }

      renderPanels();
      raf = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(raf);
        view.destroy();
        // Leaving the page: queued bets are refunded; bets in the air use auto cash out if it would hit.
        for (const p of panels) {
          if (p.status === "queued") R.wallet.credit(p.amount);
          if (p.status === "active" && phase === "flying") {
            if (p.auto && p.auto < flight.crash) cashOut(p, p.auto);
            else R.settle("flyaway", p.amount, 0, flight.nonce);
          }
          if (p.status === "active" && phase === "boarding") R.wallet.credit(p.amount);
          p.status = "none";
        }
        if (phase === "flying") {
          recent.unshift(flight.crash);
          if (recent.length > 24) recent.length = 24;
          R.store.set("flyaway:recent", recent);
        }
      };
    },
  });
})();
