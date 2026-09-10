# Riz.Fun — BSC Foundry deploy (Pons V2 fork)

Thin Foundry project. Solidity sources: `../pons-fork/contractsV2` (remapped as `pons-v2/`).
Brand: **Riz.Fun** / `$RIZ`. See `../PORT-BSC.md`.

**MIT attribution:** see `NOTICE` — derived from [ponsdotdev/ponsfamily](https://github.com/ponsdotdev/ponsfamily).

## Prerequisites

```bash
export PATH="$HOME/.foundry/bin:$PATH"
forge --version   # installed via foundryup on this box
```

## Build

```bash
cd /workspace/akatsuki/orefun/bsc/riz-foundry
forge build
# or: make build
```

`foundry.toml` sets `via_ir = true` (stack-too-deep on factory without it).
See `PATCHES.md` for small upstream compile fixes on the pons pin.

## Dry-run on BSC mainnet fork (preferred)

Uniswap v4 (`PoolManager` / `PositionManager`) is on **BSC mainnet**. Chapel testnet may lack PoolManager — do **not** treat Chapel as the primary path.

```bash
export BSC_RPC="${BSC_RPC:-https://bsc-dataseed.binance.org}"
forge script script/DeployRizBsc.s.sol:DeployRizBsc --fork-url "$BSC_RPC" -vvv
# or: make dry-run
```

Omit `--broadcast`. The script does **not** invent keys: if `PRIVATE_KEY` is unset it simulates only.

### Addresses injected (BSC mainnet)

| Dependency       | Address                                      |
|------------------|----------------------------------------------|
| PoolManager      | `0x28e2Ea090877bF75740558f6BFB36A5ffeE9e9dF` |
| PositionManager  | `0x7A4a5c919aE2541AeD11041A1AEeE68f1287f95b` |
| Permit2          | `0x000000000022D473030F116dDEE9F6B43aC78BA3` |

Do **not** copy simulation addresses into docs as “live.”

## Quote config (BNB / XAUt / PAXG)

From `../commodities.json`:

| Symbol | mint | decimals | notes |
|--------|------|----------|-------|
| BNB | `address(0)` | 18 | Native — always via `LaunchConfig`; no `setPairTokenApproved` |
| XAUt | `0x21cAef8A43163Eea865baeE23b9C2E327696A3bf` | 6 | Set economics then approve |
| PAXG | `0x7950865a9140cB519342433146Ed5b40c6F210f7` | 18 | Binance-peg |

`DeployRizBsc` configures these when bytecode exists on the fork.
Standalone:

```bash
FACTORY=0x... forge script script/ConfigQuotes.s.sol:ConfigQuotes --fork-url "$BSC_RPC" -vvv
```

Phantom / graduation figures in the scripts are **placeholders** (~$5k / ~$35k narrative). Retune with `previewLaunchEconomics` before public create.

Default launch config: supply **1B**, `curveFeeBps=100`, `poolFee=0`, `tickSpacing=200`, `creatorTaxBps` left to launch callers (**use 0**).

## Live mainnet broadcast (later)

```bash
# ONLY with a real key the user provides — never invent / never commit keys
export PRIVATE_KEY=0x...   # user-supplied
export BSC_RPC=...
forge script script/DeployRizBsc.s.sol:DeployRizBsc \
  --rpc-url "$BSC_RPC" --broadcast --verify
```

If `PRIVATE_KEY` is absent, stop before broadcast (script already simulation-only).

## Hook mining

`PonsV2MemeHook` flags: `beforeInitialize` + `afterSwap` + `afterSwapReturnDelta`.
Salt mined with Uniswap `HookMiner` against Foundry `CREATE2_FACTORY` (`0x4e59…956C`).

## Fee escrow shim

Upstream pin ships `IPonsV2FeeEscrow` only. Implementation: `src/PonsV2FeeEscrow.sol`.

## Layout

```
riz-foundry/
  foundry.toml
  remappings.txt
  NOTICE
  README-DEPLOY.md
  Makefile
  src/PonsV2FeeEscrow.sol
  script/DeployRizBsc.s.sol
  script/ConfigQuotes.s.sol
  script/lib/HookMiner.sol
  lib/forge-std/
```

## Dry-run status (this box)

Last successful simulation (no `--broadcast`, no `PRIVATE_KEY`):

```text
forge script script/DeployRizBsc.s.sol:DeployRizBsc --fork-url https://bsc-dataseed.binance.org -vvv
# Script ran successfully. Chain 56. ~23.5M gas estimate.
```

Simulated addresses in forge logs are **not** live deployments — do not publish them as mainnet addresses.
