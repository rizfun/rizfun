# Upstream compile patches (pons-fork pin debbc21)

Applied under `../pons-fork/contractsV2` so `forge build` succeeds. Upstream
published Factory references APIs not present on BondingCurve / LaunchDeployer
at this pin.

1. **PonsV2BondingCurve.sol** — added `exemptFromSnipeTax(address)` +
   `snipeTaxExempt` mapping. Factory calls this at launch; curve previously
   had no symbol. Stub records exemptions; full snipe-tax charge path still
   absent on this pin (buy uses feeBps + creatorTaxBps only).

2. **PonsV2LaunchDeployer.sol** — added `bytes32 salt` to `LaunchDeployment`
   so Factory named-arg `salt: params.salt` compiles. Deployer does not yet
   CREATE2 with it (upstream gap).

Do not invent live addresses. Revisit when upstream publishes matching sources.
