/* Riz.Fun — BSC mainnet deployments (production). Do not invent addresses. */
(function (global) {
  "use strict";
  var DEPLOY = {
    chainId: 56,
    chainIdHex: "0x38",
    mode: "live",
    factory: "0xFd0D4aaA8627646856CB14B1F9356C2f77a7F2ae",
    owner: "0x0e6Cf4AF115b611901fc27D6f95F5bBB82d06792",
    poolManager: "0x28e2Ea090877bF75740558f6BFB36A5ffeE9e9dF",
    positionManager: "0x7A4a5c919aE2541AeD11041A1AEeE68f1287f95b",
    permit2: "0x000000000022D473030F116dDEE9F6B43aC78BA3",
    locker: "0xeE51Df76C1f51baa4060753205FC48203c99EC55",
    memeHook: "0x103C83812daFC55e27F79B9DBb9101A67ae06044",
    feeEscrow: "0x714aeb9409F290882930061c8355aE56bf8A7A48",
    buybackVault: "0x61B5EE4D590e43A3c5fd7Fe8C8A6Ff287305D171",
    launchDeployer: "0x837618C5450b19b4c56E80351c55BfE2Dd62D329",
    graduationExecutor: "0xD1E88DabD2af8e91d32aEE29e4059fCf07799d39",
    graduationGuard: "0xdD0930964CC0dAa668D7b5E1ffe44D9a5Ae17317",
    launchFeeWei: "1000000000000000",
    defaultLaunchConfigId: 0,
    explorer: "https://bscscan.com",
    quotes: {
      BNB: "0x0000000000000000000000000000000000000000",
      XAUt: "0x21cAef8A43163Eea865baeE23b9C2E327696A3bf",
      PAXG: "0x7950865a9140cB519342433146Ed5b40c6F210f7",
    },
  };

  function isReady() {
    return !!(DEPLOY.factory && DEPLOY.factory !== "0x0000000000000000000000000000000000000000");
  }

  function quoteAddress(symbol) {
    return DEPLOY.quotes[symbol] || null;
  }

  function txUrl(hash) {
    return DEPLOY.explorer + "/tx/" + hash;
  }

  function addressUrl(addr) {
    return DEPLOY.explorer + "/address/" + addr;
  }

  global.RizDeployments = {
    DEPLOY: DEPLOY,
    isReady: isReady,
    quoteAddress: quoteAddress,
    txUrl: txUrl,
    addressUrl: addressUrl,
  };
})(typeof window !== "undefined" ? window : globalThis);
