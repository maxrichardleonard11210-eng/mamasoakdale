/* Blackjack: infinite deck, dealer stands on all 17s, blackjack pays 3:2, double on any first two cards. */
(function () {
  "use strict";
  const R = window.Rake;
  const { el, $, fmt } = R.util;
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const SUITS = ["♠", "♥", "♦", "♣"];

  const cardFrom = (f) => {
    const n = Math.floor(f * 52);
    return { rank: n % 13, suit: Math.floor(n / 13) };
  };
  function total(cards) {
    let t = 0, aces = 0;
    for (const c of cards) {
      if (c.rank === 0) { aces++; t += 11; } else t += Math.min(10, c.rank + 1);
    }
    while (t > 21 && aces) { t -= 10; aces--; }
    return { t, soft: aces > 0 };
  }
  const isBJ = (cards) => cards.length === 2 && total(cards).t === 21;
  const label = (c) => RANKS[c.rank] + SUITS[c.suit];

  R.register({
    id: "blackjack",
    name: "Blackjack",
    tagline: "Beat the dealer to 21",
    rules: "Blackjack pays 3:2 · dealer stands on 17",
    color: "linear-gradient(135deg,#1aa3a3,#0b5c6b)",
    tileBg: "radial-gradient(circle at 50% 40%, #21c2b5, #063a45 80%)",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="6" width="11" height="15" rx="2" transform="rotate(-10 8 13)"/><rect x="10" y="3" width="11" height="15" rx="2" fill="#fff" fill-opacity=".25" transform="rotate(8 15 10)"/></svg>`,
    art: `<svg viewBox="0 0 100 100"><g transform="rotate(-12 40 55)"><rect x="16" y="24" width="44" height="62" rx="6" fill="#fff"/><text x="23" y="42" font-family="Inter,sans-serif" font-weight="800" font-size="15" fill="#151824">A</text><text x="38" y="66" font-family="Inter,sans-serif" font-size="24" fill="#151824">♠</text></g><g transform="rotate(10 62 50)"><rect x="42" y="16" width="44" height="62" rx="6" fill="#fff"/><text x="48" y="34" font-family="Inter,sans-serif" font-weight="800" font-size="15" fill="#d3213b">K</text><text x="62" y="58" font-family="Inter,sans-serif" font-size="24" fill="#d3213b">♥</text></g></svg>`,
    verify(next) {
      const cards = next(52).slice(0, 12).map(cardFrom);
      return `Deal order (player, dealer, player, dealer, then each draw in turn):\n${cards.map(label).join("  ")}`;
    },
    mount({ controls, stage }) {
      // hand: {amount, deck, idx, player, dealer, nonce, done, result, payoutMult, doubled}
      let hand = R.bjHand || null;

      const bet = R.ui.betInput();
      controls.appendChild(bet.el);
      const dealBtn = el(`<button class="btn btn-accent btn-block btn-lg">Deal</button>`);
      controls.appendChild(dealBtn);
      const actions = el(`<div class="bj-actions">
        <button class="btn btn-lg" data-a="hit">Hit</button>
        <button class="btn btn-lg" data-a="stand">Stand</button>
        <button class="btn btn-lg btn-violet" data-a="double" style="grid-column:span 2">Double down</button></div>`);
      controls.appendChild(actions);
      controls.appendChild(el(`<p class="muted" style="margin:0;font-size:12px">Infinite deck. Dealer peeks for blackjack and stands on all 17s. Blackjack pays 3:2.</p>`));

      stage.innerHTML = `<div class="bj-stage">
        <div class="bj-hand"><div class="bj-label">Dealer <span class="bj-total" data-dt></span></div><div class="bj-cards" data-dc></div></div>
        <div class="bj-banner empty-b" data-banner>Place a bet and press Deal</div>
        <div class="bj-hand"><div class="bj-cards" data-pc></div><div class="bj-label">You <span class="bj-total" data-pt></span></div></div>
      </div>`;
      const dc = $("[data-dc]", stage), pc = $("[data-pc]", stage);
      const dt = $("[data-dt]", stage), pt = $("[data-pt]", stage), banner = $("[data-banner]", stage);
      const shown = { d: 0, p: 0, hole: true };

      function cardEl(c, hidden) {
        if (hidden) return el(`<div class="pcard back"></div>`);
        const red = c.suit === 1 || c.suit === 2;
        return el(`<div class="pcard ${red ? "red" : ""}"><div class="c-tl">${RANKS[c.rank]}<small>${SUITS[c.suit]}</small></div><div class="c-mid">${SUITS[c.suit]}</div></div>`);
      }
      function draw() {
        const c = cardFrom(hand.deck[hand.idx++]);
        return c;
      }

      function render() {
        if (!hand) {
          dc.innerHTML = ""; pc.innerHTML = "";
          shown.d = shown.p = 0;
          dt.style.display = pt.style.display = "none";
        } else {
          const hideHole = !hand.done && !hand.dealerTurn;
          // player cards (append only new ones so the deal animation plays once)
          if (shown.p > hand.player.length) { pc.innerHTML = ""; shown.p = 0; }
          for (; shown.p < hand.player.length; shown.p++) pc.appendChild(cardEl(hand.player[shown.p]));
          if (shown.d > hand.dealer.length || shown.hole !== hideHole) {
            dc.innerHTML = "";
            shown.d = 0;
          }
          for (; shown.d < hand.dealer.length; shown.d++) {
            const node = cardEl(hand.dealer[shown.d], shown.d === 1 && hideHole);
            if (shown.d === 1 && shown.hole && !hideHole) node.style.animation = "none";
            if (shown.hole !== hideHole && shown.d === 0) node.style.animation = "none";
            dc.appendChild(node);
          }
          shown.hole = hideHole;
          const p = total(hand.player);
          const d = hideHole ? total([hand.dealer[0]]) : total(hand.dealer);
          pt.style.display = dt.style.display = "";
          pt.textContent = isBJ(hand.player) ? "Blackjack" : (p.soft && p.t < 21 ? `${p.t - 10}/${p.t}` : p.t);
          pt.className = "bj-total" + (p.t > 21 ? " bust" : isBJ(hand.player) ? " bj" : "");
          dt.textContent = !hideHole && isBJ(hand.dealer) ? "Blackjack" : d.t;
          dt.className = "bj-total" + (d.t > 21 ? " bust" : !hideHole && isBJ(hand.dealer) ? " bj" : "");
        }
        const live = hand && !hand.done;
        dealBtn.disabled = !!live;
        bet.disable(!!live);
        const [hit, stand, dbl] = actions.querySelectorAll("button");
        hit.disabled = stand.disabled = !live;
        dbl.disabled = !live || hand.player.length !== 2 || !R.wallet.canAfford(hand.amount);
        if (!hand) {
          banner.className = "bj-banner empty-b";
          banner.textContent = "Place a bet and press Deal";
        } else if (hand.done) {
          const r = hand.result;
          banner.className = "bj-banner " + (r.kind === "win" ? "win" : r.kind === "push" ? "push" : "loss");
          banner.textContent = r.text + (r.kind === "win" ? `  +${fmt(hand.amount * hand.payoutMult - hand.amount)}` : "");
        } else {
          banner.className = "bj-banner empty-b";
          banner.textContent = hand.doubled ? "Doubled" : "Hit or stand?";
        }
        R.bjHand = hand && !hand.done ? hand : null;
      }

      function finish(kind, text, mult) {
        hand.done = true;
        hand.result = { kind, text };
        hand.payoutMult = mult;
        R.settle("blackjack", hand.amount, mult, hand.nonce);
        render();
      }

      function deal() {
        const amount = bet.get();
        if (!R.wallet.debit(amount)) return;
        const { floats, nonce } = R.fair.next(52);
        hand = { amount, deck: floats, idx: 0, player: [], dealer: [], nonce, done: false, dealerTurn: false, doubled: false };
        pc.innerHTML = ""; dc.innerHTML = ""; shown.p = shown.d = 0; shown.hole = true;
        hand.player.push(draw());
        hand.dealer.push(draw());
        hand.player.push(draw());
        hand.dealer.push(draw());
        const pBJ = isBJ(hand.player), dBJ = isBJ(hand.dealer);
        if (pBJ || dBJ) {
          hand.dealerTurn = true;
          if (pBJ && dBJ) return finish("push", "Push: both have blackjack", 1);
          if (pBJ) return finish("win", "Blackjack!", 2.5);
          return finish("loss", "Dealer has blackjack", 0);
        }
        render();
      }

      function dealerPlay() {
        hand.dealerTurn = true;
        render();
        const step = () => {
          if (!hand || hand.done) return;
          const d = total(hand.dealer).t;
          if (d < 17) {
            hand.dealer.push(draw());
            render();
            timer = setTimeout(step, 420);
            return;
          }
          const p = total(hand.player).t;
          if (d > 21) finish("win", "Dealer busts. You win!", 2);
          else if (p > d) finish("win", `You win ${p} to ${d}`, 2);
          else if (p === d) finish("push", `Push at ${p}`, 1);
          else finish("loss", `Dealer wins ${d} to ${p}`, 0);
        };
        timer = setTimeout(step, 450);
      }
      let timer = null;

      function hit() {
        if (!hand || hand.done || hand.dealerTurn) return;
        hand.player.push(draw());
        const p = total(hand.player).t;
        if (p > 21) { hand.dealerTurn = true; return finish("loss", `Bust with ${p}`, 0); }
        if (p === 21) return dealerPlay();
        render();
      }
      function stand() {
        if (!hand || hand.done || hand.dealerTurn) return;
        dealerPlay();
      }
      function double() {
        if (!hand || hand.done || hand.dealerTurn || hand.player.length !== 2) return;
        if (!R.wallet.debit(hand.amount)) return;
        hand.amount = hand.amount * 2;
        hand.doubled = true;
        hand.player.push(draw());
        const p = total(hand.player).t;
        if (p > 21) { hand.dealerTurn = true; return finish("loss", `Bust with ${p}`, 0); }
        dealerPlay();
      }

      dealBtn.onclick = deal;
      actions.querySelector('[data-a="hit"]').onclick = hit;
      actions.querySelector('[data-a="stand"]').onclick = stand;
      actions.querySelector('[data-a="double"]').onclick = double;

      // resume a hand that was in progress
      if (hand && hand.dealerTurn && !hand.done) dealerPlay();
      render();

      return () => {
        clearTimeout(timer);
        // If the dealer was mid-draw, finish the hand instantly so the bet resolves.
        if (hand && !hand.done && hand.dealerTurn) {
          while (total(hand.dealer).t < 17) hand.dealer.push(draw());
          const d = total(hand.dealer).t, p = total(hand.player).t;
          const mult = d > 21 || p > d ? 2 : p === d ? 1 : 0;
          hand.done = true;
          R.settle("blackjack", hand.amount, mult, hand.nonce);
          R.bjHand = null;
        }
      };
    },
  });
})();
