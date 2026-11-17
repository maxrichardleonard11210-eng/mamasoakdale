# Rake

A free-to-play casino simulator. Everything runs on **Rake Coins**, which are virtual, have no cash value, and can't be bought or redeemed. There are no deposits, withdrawals, or prizes.

## Games

| Game | How it works |
| --- | --- |
| **Flyaway** | Plane-themed rounds that run back to back. Place up to two bets while passengers board, then cash out before the plane flies away. Each bet can have its own auto cash out. |
| **Crash** | Every bet starts its own round. The line climbs until it crashes; cash out manually or set an auto cash out. |
| **Dice** | Drag the target, choose roll over or under. Payout = 99 ÷ win chance. |
| **Limbo** | Pick a target multiplier; win if the result lands at or above it. |
| **Mines** | 5×5 grid with 1–24 mines. Every gem you find raises the multiplier. Cash out any time. |
| **Plinko** | 8–16 rows, low/medium/high risk, multiple balls at once, plus auto-drop. |
| **Blackjack** | Infinite deck, dealer peeks and stands on all 17s, blackjack pays 3:2, double on the first two cards. |

## Features

- **Wallet:** you start with 10,000 coins. A daily bonus adds 10,000, and a refill to 1,000 unlocks when you're broke.
- **Provably fair:** results come from `HMAC-SHA256(serverSeed, "clientSeed:nonce:round")`. You see the hashed server seed before you play. Rotating the seed pair reveals the old seed, and the **Verify** tab recomputes any past result.
- **Your history:** bet history and stats (bets, wagered, profit, best multiplier).
- **Layout:** works on desktop and mobile.
- **No setup:** no build step and no dependencies. It's plain HTML, CSS and JavaScript, and progress is saved in the browser's `localStorage`.

## Run it

Open `rake/index.html` in a browser, or serve the folder:

```bash
cd rake && python3 -m http.server 8000
```

Then visit http://localhost:8000.

To host it for free, deploy the `rake/` folder to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages).

## Files

```
rake/
  index.html          page shell
  css/style.css       all styles
  js/core.js          wallet, storage, SHA-256/HMAC, provably-fair RNG, UI helpers
  js/app.js           navigation, lobby, wallet and fairness dialogs
  js/games/*.js       one file per game; each calls Rake.register({...})
```

To add a game, create `js/games/<name>.js` that calls `Rake.register({ id, name, mount, verify })` and add a `<script>` tag for it in `index.html`.
