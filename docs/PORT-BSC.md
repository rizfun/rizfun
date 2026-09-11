# PORT-BSC — Pons V2 → BSC commodities launcher

**Product:** BSC commodities launcher (`Riz.Fun` — name not finalized)  
**Source:** `bsc/pons-fork` ← https://github.com/ponsdotdev/ponsfamily (MIT)  
**Pinned commit at clone:** `debbc21fb27761245356fe9b61a9276437147a1c`  
**Target chain:** BSC `chainId 56`  
**Do not:** rewrite from scratch; invent deployed addresses; claim commodites.market frontend source  

Upstream product docs (reference only): https://docs.ponsfamily.com/v2  

---

## MIT attribution (required)

Pons V2 contracts are **MIT**-licensed (`SPDX-License-Identifier: MIT` on sources). Keep SPDX headers. In README / NOTICE:

> Portions of this software are derived from [ponsdotdev/ponsfamily](https://github.com/ponsdotdev/ponsfamily), Copyright (c) Pons contributors, licensed under the MIT License.

No separate top-level `LICENSE` file shipped in the upstream clone at time of fork — add/retain MIT text when we publish our tree. Do not strip copyright headers from Solidity files.

---

## What we keep (almost everything in `contractsV2/`)

Keep the V2 architecture intact:

| Piece | Keep? | Notes |
|-------|-------|-------|
| `PonsV2LaunchFactory` | Yes | Wire BSC Uniswap addresses in constructor |
| `PonsV2LaunchDeployer` | Yes | CREATE2 curve+token |
| `PonsV2BondingCurve` | Yes | `pairToken == address(0)` = native (BNB on BSC) |
| `PonsV2LauncherToken` | Yes | 1B supply configs via `LaunchConfig` |
| `PonsV2GraduationGuard` | Yes | Chain-agnostic math |
| `PonsV2GraduationExecutor` | Yes | PositionManager + Permit2 mint dance |
| `PonsV2LaunchLocker` | Yes | Construct with BSC PositionManager |
| `PonsV2BuybackVault` | Yes | Retarget buyback asset policy later → `$RIZ` |
| `hooks/PonsV2MemeHook` | Yes | Mine address for BSC PoolManager + flags |
| Fee escrow / interfaces / math libs | Yes | |
| `contractsV1/` | Optional | Not needed for day-1 v4 commodities launcher |

**Native “ETH” in code = native currency.** On BSC that is **BNB**. Pons already uses `address(0)` for native; no rename of the EVM native sentinel is required. Update comments/docs that say “ETH” where user-facing.

---

## Uniswap v4 addresses to inject (BSC)

| Dependency | BSC address |
|------------|-------------|
| PoolManager | `0x28e2ea090877bf75740558f6bfb36a5ffee9e9df` |
| PositionManager | `0x7a4a5c919ae2541aed11041a1aeee68f1287f95b` |
| Permit2 | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |
| Universal Router (frontend/swaps, not factory ctor) | `0x1906c1d672b88cd1b9ac7593301ca990f94eae07` |

Factory constructor already takes `poolManager_`, `positionManager_`, `permit2_` and asserts `positionManager.poolManager() == poolManager_`. Pass the BSC trio above — do not hardcode Robinhood Chain addresses.

---

## Graduation pool lock (user lock · 2026-09-11)

**Graduation seeds Uniswap v4 on BSC only** (PoolManager / PositionManager / Permit2 above). Post-grad fees = **hook fees** (`poolFee = 0`). LP NFT → permanent locker.

**PancakeSwap is not the default graduation venue.** Do not retarget `PonsV2GraduationExecutor` / factory to PCS v2/v3/Infinity unless product explicitly unlocks that path. Day-1 docs, deploy scripts, and site copy must say **Uniswap v4 locked pool**, not Pancake.

## Hook flags (keep exactly — address must encode them)

From `PonsV2MemeHook.getHookPermissions()`:

| Flag | Value |
|------|-------|
| `beforeInitialize` | **true** |
| `afterInitialize` | false |
| `beforeAddLiquidity` | false |
| `afterAddLiquidity` | false |
| `beforeRemoveLiquidity` | false |
| `afterRemoveLiquidity` | false |
| `beforeSwap` | false |
| `afterSwap` | **true** |
| `beforeDonate` / `afterDonate` | false |
| `beforeSwapReturnDelta` | false |
| `afterSwapReturnDelta` | **true** |
| liquidity return deltas | false |

**CREATE2 / HookMiner:** deploy the hook to an address whose LSBs match this permission mask for the BSC `PoolManager`. Same flags as Robinhood; only the PoolManager + salt/miner target change. Do not flip flags “for BSC.”

---

## Exact code / config changes

### 1. Deploy-time constructor wiring (primary port surface)

No need to fork Uniswap libs. Change **deployment scripts / foundry scripts / constructor args**:

**`PonsV2MemeHook`**
```text
constructor(poolManager_, feeEscrow_, protocolFeeRecipient_, initialOwner_)
→ poolManager_ = 0x28e2…e9df
```

**`PonsV2LaunchLocker`**
```text
constructor(initialOwner, positionManager_)
→ positionManager_ = 0x7a4a…f95b
```

**`PonsV2LaunchFactory`**
```text
constructor(
  initialOwner,
  poolManager_,      // 0x28e2…
  positionManager_,  // 0x7a4a…
  permit2_,          // 0x000000000022D473030F116dDEE9F6B43aC78BA3
  locker_,
  memeHook_,
  feeEscrow_,
  buybackVault_,
  initialLaunchFee
)
```

**`PonsV2GraduationExecutor`**
```text
constructor(positionManager_, permit2_, locker_, factory_)
→ BSC PositionManager + Permit2
```

Then one-time wiring (same as upstream):
- `locker.setFactory(factory)`
- `memeHook.setFactory(factory)`
- `memeHook.setBuybackVault(vault)` (if separate)
- `factory.setLaunchDeployer(deployer)`
- `factory.setGraduationExecutor(executor)`

### 2. Native BNB

- Launch / buy with `pairToken = address(0)` → native BNB value on `launchToken` / `buy`.
- Comments & frontends: say BNB, not ETH.
- Graduation seed uses native currency0/1 sorting with `address(0)` as Uniswap v4 native — unchanged.

### 3. Launch economics (commodites.market product lock)

Configure via `addLaunchConfig` / `setPairTokenEconomics` (owner), not by rewriting curve math on day-1:

| Product lock | Port action |
|--------------|-------------|
| Supply **1B** | `LaunchConfig.supply = 1_000_000_000e18` (18 decimals token) |
| Open ~**$5k** / graduate ~**$35k** | Size `phantomQuote` + `graduationThreshold` **per quote asset decimals** so implied open/graduate mcaps ≈ $5k / $35k at current quote USD. Recompute when gold/BNB moves; pin with `previewLaunchEconomics`. |
| Trading fee **1–3%** | Allow `curveFeeBps` / `hookFeeBps` in **100–300** bps range (creator choice at launch or discrete configs). Cap already ≤10% upstream. |
| Fee split **40 / 30 / 30** holders / `$RIZ` buyback / protocol | **Gap vs upstream.** Pons defaults: protocol share + creator + launch-token buyback. See § Fee-model delta. |
| Creator no special fee | Default `creatorTaxBps = 0`; UI must not promise a creator cut. |
| First buy min ~$1 | Enforce in launch-and-buy router / frontend; optional on-chain min if we add a wrapper. |
| Up to **5** commodity pairs + weights | **Not in upstream Pons** (single `pairToken`). Day-1: one approved quote. Multi-weight is a later extension — do not fake it in factory. |

### 4. Approved quotes (day-1)

From `bsc/commodities.json`, owner calls `setApprovedPairToken` + `setPairTokenEconomics`:

| pairToken | Decimals | Notes |
|-----------|----------|-------|
| `address(0)` | 18 | Native BNB |
| `0x21cAef8A43163Eea865baeE23b9C2E327696A3bf` | 6 | XAUt |
| `0x7950865a9140cb519342433146ed5b40c6f210f7` | 18 | Binance-peg PAXG |

`MIN_PAIR_TOKEN_DECIMALS = 6` — XAUt (6) is at the floor; OK.

### 5. Pool params (keep Pons defaults unless product forces change)

Upstream graduated pools: `poolFee = 0` (hook charges post-grad), typical `tickSpacing = 200`. Keep unless we deliberately change. **Venue = Uniswap v4 on BSC — not Pancake.**

### 6. Fee-model delta (must track explicitly)

commodites.market product target (`SPEC-BSC-LAUNCHER.md`):

- **40%** holders in **paired commodity** (~15m)
- **30%** buyback/burn **platform token `$RIZ`**
- **30%** protocol  
- Creator: **no** special share

Upstream Pons V2:

- Quote-leg fee → protocol / creator / **launch-token** buyback vault (5y vest)
- Optional `creatorTaxBps` entirely to creator
- Hook: `afterSwap` + `afterSwapReturnDelta`; internal memecoin→quote conversion

**Port steps for fee parity (ordered):**

1. Set `creatorTaxBps` default **0**; discourage non-zero in create UI.
2. Retarget buyback spender to **`$RIZ`** market on BSC (or escrow → keeper buys `$RIZ` and burns). Do not silently keep “buy launch memecoin” if marketing says `$RIZ`.
3. Add **holder distributor**: accrue 40% of swept quote; push/claim to holders of the launch token (or staked set) in the pair commodity on ~15m cadence (keeper). This is **new code**, not a one-line Pons config.
4. Until (3) ships: document interim split; do not market “holders paid in gold every 15m.”

### 7. Naming / branding in code

- Optional rename `Pons*` → `Brand*` later; **not** required for a correct BSC port.
- Do not lock product name **Riz.Fun** into this launcher — use `Riz.Fun` in docs until the user picks.
- `$RIZ` remains the protocol buyback ticker name in SPEC.

### 8. Things that do **not** need changing for BSC

- Bonding curve constant-product math  
- Two-phase graduation (`graduate` / `createGraduatedPool`)  
- CREATE2 salt namespacing  
- Snipe tax design (tune start bps / seconds if CT wants softer open)  
- Locker “no withdraw” invariant  
- Hook permission bits (only re-mine address)

---

## Deploy order (exact)

1. Deploy **FeeEscrow** (if separate contract in tree / embed as needed).  
2. Deploy **BuybackVault** (owner = protocol).  
3. **Mine + deploy `PonsV2MemeHook`** at address matching flags for BSC PoolManager `0x28e2…`.  
4. Deploy **LaunchLocker**(owner, PositionManager `0x7a4a…`).  
5. Deploy **LaunchFactory**(owner, PoolManager, PositionManager, Permit2, locker, hook, escrow, vault, launchFee).  
6. Deploy **LaunchDeployer**(factory) → `factory.setLaunchDeployer`.  
7. Deploy **GraduationExecutor**(PositionManager, Permit2, locker, factory) → `factory.setGraduationExecutor`.  
8. `locker.setFactory(factory)`; `hook.setFactory(factory)`; wire vault on hook.  
9. Owner: `addLaunchConfig` (1B supply, fee/tick, phantom/threshold placeholders).  
10. Owner: approve **BNB / XAUt / PAXG** + `setPairTokenEconomics` sized to ~$5k open / ~$35k graduate.  
11. Owner: set fee policy toward 30% protocol / 30% `$RIZ` buyback path; holder 40% distributor when ready.  
12. Optional: Launch-and-buy router; frontend against Universal Router for post-grad swaps.  
13. Verify on BscScan; record **real** addresses only after deploy — never invent.

---

## Test checklist before public create

- [ ] Native BNB launch + buy + sell + graduate + V4 swap  
- [ ] XAUt (6 decimals) launch + graduate (Permit2 allowances)  
- [ ] PAXG launch + graduate  
- [ ] Hook rejects non-factory `beforeInitialize`  
- [ ] Locker holds NFT; no withdraw path  
- [ ] `creatorTaxBps = 0` path; fee escrow credits  
- [ ] Economics pin (`expectedEconomics`) reverts on mid-flight config change  
- [ ] No fake addresses in README / site  

---

## Relation to commodites.market

| Layer | Source |
|-------|--------|
| Product UX / fee narrative | commodites.market–style (observed product facts) |
| Smart contracts | **Pons V2 MIT fork** → BSC |
| Frontend | **Ours** — commodites.market frontend is **not** open source; we do not claim a frontend fork |

---

## Out of scope for this port doc

- Final product name (`Riz.Fun`)  
- Solana / pump.fun Riz.Fun surfaces  
- Publishing unaudited “mainnet addresses” before deploy  
