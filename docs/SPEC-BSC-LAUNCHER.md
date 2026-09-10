# SPEC — BSC commodities launcher (product lock)

**Status:** product lock for day-1 BSC build  
**Date:** 2026-09-11  
**Brand:** `Riz.Fun` · ticker `$RIZ` · meta RICE + rizz (LOCKED)  
**Chain:** BNB Smart Chain (BSC), `chainId 56`  
**Tech under:** Pons V2 (MIT fork at `bsc/pons-fork`) + Uniswap v4 on BSC  

---

## One-liner

A **commodites.market-style** token launcher on BSC: creators launch memecoins paired with **tokenized commodities** (and/or native BNB). Trading starts on a bonding curve, then graduates into a permanently locked Uniswap v4 pool. English CT. No fake custody claims.

---

## What we are / are not

### Are
- A Pons V2–lineage launchpad on BSC (bonding curve → locked Uniswap v4).
- Commodity-quote first: day-1 quotes include Tether Gold (XAUt), Binance-peg PAXG, and native BNB.
- Protocol token for buyback/burn leg: **`$RIZ`** (platform token; separate from the unfinalized product brand name).
- Fee model target aligned with commodites.market / CME-style split (holders share quote + buyback platform token + protocol). Tune later.

### Are not
- We do **not** custody physical gold, oil, or any metal.
- We do **not** claim official Tether / Paxos / Binance product affiliation beyond using their public on-chain tokens as quotes.
- We did **not** fork commodites.market’s frontend (it is **not** open source). UI is greenfield / our own.
- We do **not** invent or publish fake deployed `Riz.Fun` contract addresses. Addresses appear only after real deploys.
- We do **not** rewrite the launch stack from scratch — we **port** Pons V2 (`ponsdotdev/ponsfamily`, MIT).

---

## Product mirror (commodites.market → BSC)

Public product facts we lock as the UX/economic target. Implementation maps onto Pons V2 primitives (curve + hook + fee policy), then adapts where Pons defaults differ (see Fee model).

| Surface | Lock |
|--------|------|
| Opening cap | ~**$5k** starting market cap (curve open) |
| Migrate / endpoint | ~**$35k** graduation market cap |
| Supply | **1,000,000,000** (1B) fixed |
| Trading fee | Creator picks **1–3%** at launch |
| Fee split | **40% holders** (paid in the **paired commodity**), **30% buyback/burn** platform token (`$RIZ`), **30% protocol** |
| Creator economics | Creator has **no special fee share**; earns as a **holder** like everyone else |
| Holder payout cadence | ~**every 15 minutes** in the paired commodity (sweep/distributor cadence — tune) |
| Launch inputs | Image, name, ticker; pick **up to 5** commodity pair coins + **weights**; trading fee 1–3%; optional first buy |
| First buy | Min ~**$1** in **BNB** (native) or a stable/commodity quote path (commodites uses ETH/USDG; on BSC: BNB + approved quotes) |
| Under the hood | **Pons + Uniswap v4** (we fork Pons V2 MIT → BSC) |

### Multi-quote (up to 5 + weights)

commodites.market lets creators pick **up to 5** commodity pair coins with weights. Day-1 port strategy:

1. **On-chain (Pons-native):** each launch still has **one** `pairToken` (Pons V2 curve/pool is single-quote). Factory `approvedPairTokens` + per-asset economics for BNB / XAUt / PAXG.
2. **Product UX:** “up to 5 + weights” is the **create UI target**. Phase A: single selected quote from the enabled list. Phase B: weighted multi-quote as a product feature (routing / basket / sequential quotes) without claiming it is already in upstream Pons.

Do not pretend multi-quote is already in the cloned contracts until we design that extension.

---

## Lifecycle (user-facing)

1. **Create** — name, ticker, image, socials; choose quote(s); set trading fee 1–3%; optional first buy ≥ ~$1.
2. **Trade the curve** — constant-product bonding curve in the chosen quote; open ~$5k mcap; sell anytime until graduation edge.
3. **Graduate** — at ~$35k endpoint, curve closes; reserves seed a Uniswap v4 full-range pool; LP NFT locked permanently.
4. **Pool** — ordinary Uniswap v4 swaps; hook takes the protocol fee cut; liquidity cannot be withdrawn by creator or protocol.

No custody of user funds by the brand. Users sign with their own wallets.

---

## Fee model (target vs Pons defaults)

### Target (product lock — CME / commodites-style)

Of the trading fee on the **quote leg**:

| Share | % | Destination |
|-------|---|-------------|
| Holders | 40% | Paid in **paired commodity** (~15m cadence) |
| Buyback | 30% | Buy + burn (or buy + lock→burn policy) of **`$RIZ`** |
| Protocol | 30% | Protocol treasury / ops |
| Creator special cut | **0%** | Creator earns only as a holder |

Creator-optional tax on top of the base fee: **off by default** for this product (commodites-style: no special creator fee share). If we keep Pons’ `creatorTaxBps` knob, day-1 recommended default is `0` and UI should not market a “creator fee” as a separate product promise.

### Mapping notes (engineering)

Upstream Pons V2 fee policy is **protocol / creator / buyback-on-launch-token**, not “40% holders in quote.” The BSC port must either:

- Add a **holder distributor** (or staking/claim contract) funded from the 40% quote share, and retarget the 30% buyback leg to **`$RIZ`** instead of the launch memecoin; or
- Document an interim mapping and ship holder payouts off the protocol share until the distributor lands.

SPEC locks the **product numbers**; `PORT-BSC.md` lists the code touchpoints. Do not ship marketing that claims holder commodity payouts until the distributor path exists.

---

## Quote registry (day-1)

Source of truth: `bsc/commodities.json`.

| Symbol | Role | Address | Decimals |
|--------|------|---------|----------|
| BNB | Native gas / native quote | `address(0)` (Uniswap v4 native currency) | 18 |
| XAUt | Tether Gold on BSC | `0x21cAef8A43163Eea865baeE23b9C2E327696A3bf` | 6 |
| PAXG | Binance-peg PAX Gold | `0x7950865a9140cb519342433146ed5b40c6f210f7` | 18 |

Only factory-approved pair tokens can be used as launch quotes. Approval ≠ endorsement. Thin books stay disabled.

---

## Uniswap v4 on BSC (canonical — not ours)

| Contract | Address |
|----------|---------|
| PoolManager | `0x28e2ea090877bf75740558f6bfb36a5ffee9e9df` |
| PositionManager | `0x7a4a5c919ae2541aed11041a1aeee68f1287f95b` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| Universal Router | `0x1906c1d672b88cd1b9ac7593301ca990f94eae07` |

`Riz.Fun` protocol contracts: **undeployed** — do not invent addresses.

---

## Brand & CT

- Product name: **`Riz.Fun`** until the user picks a punchy name.
- Protocol / buyback token ticker: **`$RIZ`** (existing Riz.Fun token narrative may stay separate; do not force-rename the Solana brand into this BSC product).
- Tone: English CT, metals + degen, clean industrial UI.
- Disclosures: not RWA custody; tokenized gold quotes are third-party tokens; launches can go to zero; names/tickers are not unique.

---

## MVP surfaces

1. Landing — what it is + create CTA + risk strip  
2. Discover — commodity-paired launches board  
3. Create — quote picker (≤5 + weights in UX; single quote on-chain day-1), fee 1–3%, first buy  
4. Docs — this SPEC + port plan + “not custody”  

Frontend is **ours**. Do not claim a fork of commodites.market UI.

---

## Success

People say “it’s commodites.market on BSC” and can create a gold-quoted launch against live Uniswap v4 without us claiming custody or inventing contract addresses.
