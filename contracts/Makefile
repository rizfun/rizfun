# Riz.Fun / Pons V2 BSC — Foundry helpers
# Primary path: BSC mainnet fork (Uniswap v4 PoolManager is on mainnet; Chapel may lack it).

export PATH := $(HOME)/.foundry/bin:$(PATH)

# Public RPC — override with BSC_RPC=...
BSC_RPC ?= https://bsc-dataseed.binance.org

.PHONY: build dry-run dry-run-config clean

build:
	forge build

# Simulation only — never broadcasts. Does not require PRIVATE_KEY.
dry-run:
	forge script script/DeployRizBsc.s.sol:DeployRizBsc --fork-url $(BSC_RPC) -vvv

# Post-deploy quote config dry-run (needs FACTORY=0x...)
dry-run-config:
	@test -n "$(FACTORY)" || (echo "Set FACTORY=0x..."; exit 1)
	FACTORY=$(FACTORY) forge script script/ConfigQuotes.s.sol:ConfigQuotes --fork-url $(BSC_RPC) -vvv

# Live mainnet: user supplies key. NEVER invent keys.
#   PRIVATE_KEY=0x... forge script script/DeployRizBsc.s.sol:DeployRizBsc \
#     --rpc-url $$BSC_RPC --broadcast --verify
#
# Stop before broadcast if PRIVATE_KEY is unset (script also refuses inventing keys).

clean:
	forge clean
