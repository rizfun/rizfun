# Riz.Fun

Commodity-paired memecoin launcher on **BNB Chain (BSC)**.

- Brand: **Riz.Fun** · ticker **$RIZ** · meta rice + rizz
- Stack: Pons V2 fork (MIT) → Uniswap v4 on BSC
- Live UI (DEMO): https://rizfun.github.io/rizfun-site/

## Layout

| Path | What |
|------|------|
| `web/` | Create + Markets + About UI |
| `contracts/` | Foundry deploy scripts + patches for Pons V2 on BSC |
| `docs/` | SPEC, PORT-BSC, brand, commodity quotes |
| `brand/` | Locked logo |

## Upstream

Pons V2: [ponsdotdev/ponsfamily](https://github.com/ponsdotdev/ponsfamily) (MIT). See `contracts/NOTICE` and `contracts/PATCHES.md`.

## Status

- UI: public DEMO (no invented live factory addresses)
- Contracts: dry-run on BSC fork OK; broadcast not done yet

## Disclaimer

No physical commodity custody. Tokenized quotes only. DYOR.
