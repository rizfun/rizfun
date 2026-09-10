# Riz.Fun — BSC launcher frontend (MVP)

Static HTML/CSS/JS UI for **Riz.Fun** (`$RIZ`, rice + rizz) on **BNB Chain**.

This is a **frontend-only** MVP. Protocol contracts are **not deployed**. Markets are **DEMO**. No fake Riz.Fun addresses.

## Open locally

From this directory:

```bash
cd /workspace/akatsuki/orefun/bsc/web
python3 -m http.server 8765
```

Then open [http://127.0.0.1:8765/](http://127.0.0.1:8765/) in a browser.

A simple file open (`file://`) may work for layout, but loading `commodities.json` needs a local server (CORS / fetch).

## Pages

| Tab | What |
|-----|------|
| **Markets** | Demo board — name, ticker, quote (BNB/XAUt/PAXG), mcap progress to ~$35k, fee %, age. Filter by quote. |
| **Create** | Image preview, name, ticker, one quote (Phase A), fee 1–3%, optional first buy, socials. Submit is blocked with “Contracts not live yet”. |
| **About** | Curve ~$5k→~$35k, 1B supply, fee split 40/30/30, no physical custody disclaimer. |

## Assets

- Locked logo: `assets/rizfun-logo.png` (copied from `../brand/rizfun-logo-LOCKED.png`)
- Quote registry: `commodities.json` (copied from `../commodities.json`)

## Deploy later

GitHub Pages (or any static host) can serve this folder as-is. Do **not** publish invented contract addresses.

## Hard rules baked in

- Never invent live Riz.Fun contract addresses
- Never claim physical gold/rice custody
- All market rows labeled **DEMO** until real deploy
