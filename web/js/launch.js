/* Riz.Fun — live BSC launch / trade / graduate (no mocks). Requires ethers UMD + RizDeployments + RizWallet. */
(function (global) {
  "use strict";

  var STORAGE_KEY = "rizfun.launches.bsc56.v1";
  var LAUNCH_ABI = [
    "function launchToken((string name,string symbol,string logo,string description,(string twitter,string telegram,string discord,string website,string farcaster) socials,address creatorFeeRecipient,uint16 creatorTaxBps,bool buybackEnabled,bytes32 expectedEconomics,bytes32 salt),uint256 launchConfigId,address pairToken) payable returns (address token,address curve)",
    "function graduate(address token)",
    "function getLaunchedToken(address token) view returns (address tokenAddr,address curve,address deployer,address creatorFeeRecipient,address pairToken,uint256 graduationThreshold,uint24 poolFee,int24 tickSpacing,uint16 creatorTaxBps,bool buybackEnabled,uint8 phase,uint256 sweptQuote,uint256 sweptTokens,uint256 sweptAt,bool exists)",
    "function launchFee() view returns (uint256)",
    "event TokenLaunched(address indexed token,address indexed curve,address indexed deployer,address pairToken,uint256 launchConfigId,uint256 graduationThreshold)",
  ];
  var CURVE_ABI = [
    "function buy(uint256 quoteIn,uint256 minTokensOut,address recipient) payable returns (uint256 tokensOut)",
    "function sell(uint256 tokensIn,uint256 minQuoteOut,address recipient) returns (uint256 quoteOut)",
    "function readyToGraduate() view returns (bool)",
  ];
  var ERC20_ABI = [
    "function approve(address spender,uint256 amount) returns (bool)",
    "function allowance(address owner,address spender) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];

  function ethersLib() {
    if (!global.ethers) throw new Error("ethers.js missing");
    return global.ethers;
  }

  function provider() {
    var w = global.RizWallet;
    if (!w) throw new Error("Wallet not ready");
    var eth = w.getState().provider || global.ethereum;
    if (!eth) throw new Error("No injected wallet");
    return new (ethersLib().BrowserProvider)(eth);
  }

  function factoryContract(signerOrProvider) {
    var d = global.RizDeployments.DEPLOY;
    return new (ethersLib().Contract)(d.factory, LAUNCH_ABI, signerOrProvider);
  }

  function randomSalt() {
    var a = new Uint8Array(32);
    global.crypto.getRandomValues(a);
    return ethersLib().hexlify(a);
  }

  function loadLaunches() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  }

  function saveLaunch(entry) {
    var list = loadLaunches();
    list.unshift(entry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
  }

  async function launchFromForm(form) {
    if (!global.RizDeployments || !global.RizDeployments.isReady()) {
      throw new Error("Deployment config missing");
    }
    var w = global.RizWallet.getState();
    if (!w.connected) throw new Error("Connect wallet first");
    if (!w.onBsc) throw new Error("Switch to BNB Smart Chain (56)");

    var name = (form.querySelector("#tokName") || form.querySelector("[name=name]") || {}).value || "";
    var symbol = (form.querySelector("#tokTicker") || form.querySelector("[name=ticker]") || form.querySelector("[name=symbol]") || {}).value || "";
    var logo = "";
    var img = form.querySelector("#imgPreview");
    if (img && img.src && img.src.indexOf("data:") === 0) logo = img.src.slice(0, 200);
    var description = "";
    var quoteSym = "BNB";
    if (global.RizApp && typeof global.RizApp.getSelectedQuote === "function") {
      quoteSym = global.RizApp.getSelectedQuote() || quoteSym;
    }
    var pairToken = global.RizDeployments.quoteAddress(quoteSym);
    if (pairToken == null) throw new Error("Unknown quote " + quoteSym);

    name = String(name).trim();
    symbol = String(symbol).trim();
    if (!name || !symbol) throw new Error("Name and symbol required");

    var feePctEl = form.querySelector("[name=fee]") || form.querySelector("#feePct");
    // creator tax separate from curve fee — product lock creator 0
    var creatorTaxBps = 0;

    var ethers = ethersLib();
    var p = provider();
    var signer = await p.getSigner();
    var me = await signer.getAddress();
    var factory = factoryContract(signer);
    var fee = await factory.launchFee();
    var d = global.RizDeployments.DEPLOY;

    var params = {
      name: name,
      symbol: symbol,
      logo: String(logo || ""),
      description: String(description || ""),
      socials: { twitter: "", telegram: "", discord: "", website: "", farcaster: "" },
      creatorFeeRecipient: me,
      creatorTaxBps: creatorTaxBps,
      buybackEnabled: true,
      expectedEconomics: ethers.ZeroHash,
      salt: randomSalt(),
    };

    var tx = await factory.launchToken(params, d.defaultLaunchConfigId, pairToken, { value: fee });
    var receipt = await tx.wait();
    var token = null;
    var curve = null;
    try {
      for (var i = 0; i < receipt.logs.length; i++) {
        try {
          var parsed = factory.interface.parseLog(receipt.logs[i]);
          if (parsed && parsed.name === "TokenLaunched") {
            token = parsed.args.token;
            curve = parsed.args.curve;
            break;
          }
        } catch (_) {}
      }
    } catch (_) {}

    var entry = {
      name: name,
      symbol: symbol,
      quote: quoteSym,
      pairToken: pairToken,
      token: token,
      curve: curve,
      txHash: receipt.hash,
      at: Date.now(),
      factory: d.factory,
    };
    if (token) saveLaunch(entry);
    return entry;
  }

  async function buy(curveAddr, quoteInWei, minTokensOut, recipient) {
    var ethers = ethersLib();
    var signer = await provider().getSigner();
    var curve = new ethers.Contract(curveAddr, CURVE_ABI, signer);
    var to = recipient || (await signer.getAddress());
    var tx = await curve.buy(quoteInWei, minTokensOut || 0, to, { value: quoteInWei });
    return tx.wait();
  }

  async function sell(curveAddr, tokensIn, minQuoteOut, recipient) {
    var ethers = ethersLib();
    var signer = await provider().getSigner();
    var curve = new ethers.Contract(curveAddr, CURVE_ABI, signer);
    var to = recipient || (await signer.getAddress());
    var tx = await curve.sell(tokensIn, minQuoteOut || 0, to);
    return tx.wait();
  }

  async function graduate(tokenAddr) {
    var signer = await provider().getSigner();
    var factory = factoryContract(signer);
    var tx = await factory.graduate(tokenAddr);
    return tx.wait();
  }

  global.RizLaunch = {
    launchFromForm: launchFromForm,
    buy: buy,
    sell: sell,
    graduate: graduate,
    loadLaunches: loadLaunches,
    saveLaunch: saveLaunch,
  };
})(typeof window !== "undefined" ? window : globalThis);
