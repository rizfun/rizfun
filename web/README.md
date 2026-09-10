# Riz.Fun — public site

Static HTML/CSS/JS for **Riz.Fun** (`$RIZ`, rice + rizz) on **BNB Chain**.

Commodities-first launcher UI: pair memes with **BNB**, **XAUt**, and **PAXG**.

## Open locally

```bash
cd web
python3 -m http.server 8765
```

Open http://127.0.0.1:8765/

## Views

| Tab | What |
|-----|------|
| **Home** | Hero + commodities gallery + featured markets |
| **Markets** | Board filtered by commodity; pair badge prominent |
| **Create** | Step 1 = commodity picker, then token details; summary headlines the pair |
| **How it works** | Pair → curve (~$5k→~$35k) → locked Uniswap v4; fee split 40/30/30 |

## Assets

- Locked logo: `assets/rizfun-logo.png`
- Quote registry: `commodities.json`

## Deploy

GitHub Pages serves `rizfun/rizfun-site` from repo root.
