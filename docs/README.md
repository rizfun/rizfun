# BSC commodities launcher

**Brand:** `Riz.Fun` (punchy name not finalized — do not treat “Riz.Fun” as this product’s locked name)  
**Chain:** BNB Smart Chain (`chainId 56`)  
**Stack:** [Pons V2](https://github.com/ponsdotdev/ponsfamily) MIT fork + Uniswap v4 (live on BSC)  

This directory is the **BSC port** of a commodites.market–style commodities launcher: bonding curve → permanently locked Uniswap v4 pool, quotes in tokenized gold / native BNB.

---

## Layout

```
bsc/
├── README.md           ← you are here
├── PORT-BSC.md         ← exact port steps (addresses, hook flags, deploy order, fee delta)
├── commodities.json    ← day-1 enabled quote mints
└── pons-fork/          ← cloned github.com/ponsdotdev/ponsfamily (MIT)
    ├── contractsV2/    ← bonding curve + V4 graduation (primary)
    └── contractsV1/    ← legacy V3 path (not required day-1)
```

Product lock (economics, UX, disclosures):  
[`../docs/SPEC-BSC-LAUNCHER.md`](../docs/SPEC-BSC-LAUNCHER.md)

---

## What this is

- A **fork/port of Pons V2**, not a from-scratch launchpad.
- Product mirror of **commodites.market** (opening ~$5k, graduate ~$35k, 1B supply, 1–3% fee, 40/30/30 holders / `$RIZ` buyback / protocol) on BSC.
- Under the hood: Pons curve → **Uniswap v4 on BSC** graduation (post-grad **hook fees**, LP locked). **Pancake not default.**

## What this is not

- **Not** a fork of the commodites.market frontend (that UI is not open source).
- **Not** physical gold custody / vault claims.
- **Not** deployed yet — **no invented protocol contract addresses** in this tree.

---

## Canonical Uniswap v4 (BSC) — already live

**User lock:** graduation pool = **Uniswap v4 on BSC** (hook fees post-grad; LP permanently locked). **Pancake is not the default** liquidity endpoint.

| Contract | Address |
|----------|---------|
| PoolManager | `0x28e2ea090877bf75740558f6bfb36a5ffee9e9df` |
| PositionManager | `0x7a4a5c919ae2541aed11041a1aeee68f1287f95b` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| Universal Router | `0x1906c1d672b88cd1b9ac7593301ca990f94eae07` |

Day-1 quotes: see `commodities.json` (BNB native, XAUt, Binance-peg PAXG).

---

## Port plan (summary)

1. Keep `contractsV2` logic; inject BSC PoolManager / PositionManager / Permit2 at deploy.  
2. Native `address(0)` = **BNB** (same sentinel Pons uses for ETH).  
3. Mine `PonsV2MemeHook` for flags: `beforeInitialize` + `afterSwap` + `afterSwapReturnDelta`.  
4. Configure 1B supply + phantom/threshold ≈ $5k / $35k per quote decimals.  
5. Fee product target 40/30/30 needs a **holder distributor** + `$RIZ` buyback retarget — see `PORT-BSC.md` § Fee-model delta.  
6. Attribute MIT upstream in NOTICE/README when publishing.

Full steps: **[`PORT-BSC.md`](./PORT-BSC.md)**.

---

## Attribution

```
Pons Family launchpad contracts — MIT
https://github.com/ponsdotdev/ponsfamily
Clone path: bsc/pons-fork @ debbc21fb27761245356fe9b61a9276437147a1c
```

---

## Protocol token

Buyback/burn leg targets **`$RIZ`** (platform token). Product display name remains **`Riz.Fun`** until chosen.
