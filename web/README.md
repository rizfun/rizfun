# Riz.Fun — public site

Static HTML/CSS/JS for **Riz.Fun** (`$RIZ`, rice + rizz) on **BNB Chain**.

Commodities-first launcher UI: pair memes against a **commodity quote directory** (gold, silver, oil, wheat, corn, coffee…). Day-1 live quotes: **BNB**, **XAUt**, **PAXG**.

## Open locally

```bash
cd web
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/

## Views

| Tab | What |
|-----|------|
| **Home** | Hero + commodities directory gallery + empty launches |
| **Commodities** | Full quote-asset directory (table + grid); Live / Soon; launches board empty |
| **Create** | Live commodity picker (BNB / XAUt / PAXG) + token details |
| **How it works** | Pair → curve (~$5k→~$35k) → locked Uniswap v4; fee split 40/30/30 |

## Assets

- Locked logo: `assets/rizfun-logo.png`
- Quote registry: `commodities.json` (~30 CME-style softs / metals / energy)

## Honest empty state

No fake sample memecoins. Launches board shows **No launches yet** until the protocol ships.

## Deploy

GitHub Pages serves `rizfun/rizfun-site` from repo root.
