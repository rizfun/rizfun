/* Riz.Fun — EIP-1193 injected wallet (MetaMask / Rabby / Binance Wallet). No WC cloud. */
(function (global) {
  "use strict";

  var BSC = {
    chainId: "0x38",
    chainIdDec: 56,
    chainName: "BSC Mainnet",
    nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
    rpcUrls: [
      "https://bsc-dataseed.binance.org/",
      "https://bsc-dataseed1.bnbchain.org/",
      "https://bsc-dataseed1.defibit.io/",
    ],
    blockExplorerUrls: ["https://bscscan.com"],
  };

  var STORAGE_KEY = "rizfun.wallet.v1";
  var listeners = [];
  var state = {
    address: null,
    chainId: null,
    connecting: false,
    error: null,
  };

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }

  function truncate(addr) {
    if (!addr || addr.length < 10) return addr || "";
    return addr.slice(0, 6) + "…" + addr.slice(-4);
  }

  function emit() {
    var snap = getState();
    listeners.forEach(function (fn) {
      try {
        fn(snap);
      } catch (e) {
        console.warn("[RizWallet] listener error", e);
      }
    });
    renderNav();
  }

  function getState() {
    return {
      address: state.address,
      chainId: state.chainId,
      connecting: state.connecting,
      error: state.error,
      connected: !!state.address,
      onBsc: isBsc(state.chainId),
      truncated: truncate(state.address),
      provider: getProvider(),
    };
  }

  function isBsc(chainId) {
    if (chainId == null) return false;
    var n = typeof chainId === "string" ? parseInt(chainId, 16) : Number(chainId);
    return n === BSC.chainIdDec;
  }

  function normalizeChainId(raw) {
    if (raw == null) return null;
    if (typeof raw === "number") return "0x" + raw.toString(16);
    var s = String(raw).toLowerCase();
    if (s.indexOf("0x") === 0) return s;
    var n = parseInt(s, 10);
    if (!isNaN(n)) return "0x" + n.toString(16);
    return s;
  }

  function getProvider() {
    var eth = global.ethereum;
    if (!eth) return null;
    if (Array.isArray(eth.providers) && eth.providers.length) {
      var mm = eth.providers.find(function (p) {
        return p.isMetaMask && !p.isBraveWallet;
      });
      var rabby = eth.providers.find(function (p) {
        return p.isRabby;
      });
      var binance = eth.providers.find(function (p) {
        return p.isBinance || p.isBinanceWallet;
      });
      return rabby || mm || binance || eth.providers[0] || eth;
    }
    return eth;
  }

  function hasInjected() {
    return !!getProvider();
  }

  function persist(addr) {
    try {
      if (addr) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ address: addr }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (_) {}
  }

  function readPersisted() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.address ? parsed.address : null;
    } catch (_) {
      return null;
    }
  }

  function setError(msg) {
    state.error = msg || null;
    emit();
  }

  async function request(method, params) {
    var provider = getProvider();
    if (!provider) throw new Error("No injected wallet. Install MetaMask, Rabby, or Binance Wallet.");
    return provider.request({ method: method, params: params || [] });
  }

  async function readChainId() {
    var id = await request("eth_chainId");
    state.chainId = normalizeChainId(id);
    return state.chainId;
  }

  async function ensureBsc() {
    var id = await readChainId();
    if (isBsc(id)) return true;
    try {
      await request("wallet_switchEthereumChain", [{ chainId: BSC.chainId }]);
    } catch (err) {
      var code = err && (err.code || (err.data && err.data.originalError && err.data.originalError.code));
      if (code === 4902 || (err && /Unrecognized chain|not added/i.test(String(err.message || err)))) {
        await request("wallet_addEthereumChain", [
          {
            chainId: BSC.chainId,
            chainName: BSC.chainName,
            nativeCurrency: BSC.nativeCurrency,
            rpcUrls: BSC.rpcUrls,
            blockExplorerUrls: BSC.blockExplorerUrls,
          },
        ]);
      } else if (code === 4001) {
        throw new Error("Network switch rejected.");
      } else {
        throw err;
      }
    }
    await readChainId();
    if (!isBsc(state.chainId)) {
      throw new Error("Please switch to BNB Smart Chain (56).");
    }
    return true;
  }

  async function connect() {
    if (state.connecting) return getState();
    state.connecting = true;
    state.error = null;
    emit();
    try {
      if (!hasInjected()) {
        throw new Error("No browser wallet found. Install MetaMask, Rabby, or Binance Wallet.");
      }
      var accounts = await request("eth_requestAccounts");
      if (!accounts || !accounts.length) throw new Error("No account returned.");
      state.address = accounts[0];
      persist(state.address);
      await ensureBsc();
      bindProviderEvents();
      state.connecting = false;
      emit();
      return getState();
    } catch (err) {
      state.connecting = false;
      var msg =
        err && err.code === 4001
          ? "Connection rejected."
          : (err && err.message) || String(err);
      state.error = msg;
      emit();
      throw err;
    }
  }

  function disconnect() {
    state.address = null;
    state.error = null;
    persist(null);
    emit();
  }

  async function silentRestore() {
    if (!hasInjected()) return;
    var saved = readPersisted();
    if (!saved) return;
    try {
      var accounts = await request("eth_accounts");
      if (accounts && accounts.length) {
        var match = accounts.find(function (a) {
          return a.toLowerCase() === saved.toLowerCase();
        });
        state.address = match || accounts[0];
        persist(state.address);
        await readChainId();
        bindProviderEvents();
        emit();
      } else {
        persist(null);
      }
    } catch (_) {
      /* ignore silent restore failures */
    }
  }

  var eventsBound = false;
  function bindProviderEvents() {
    var provider = getProvider();
    if (!provider || eventsBound || !provider.on) return;
    eventsBound = true;
    provider.on("accountsChanged", function (accounts) {
      if (!accounts || !accounts.length) {
        disconnect();
        return;
      }
      state.address = accounts[0];
      persist(state.address);
      emit();
    });
    provider.on("chainChanged", function (chainId) {
      state.chainId = normalizeChainId(chainId);
      emit();
    });
    provider.on("disconnect", function () {
      disconnect();
    });
  }

  function onChange(fn) {
    if (typeof fn === "function") listeners.push(fn);
    return function () {
      listeners = listeners.filter(function (f) {
        return f !== fn;
      });
    };
  }

  function renderNav() {
    var slot = $("#walletSlot");
    if (!slot) return;
    var s = getState();
    if (s.connecting) {
      slot.innerHTML =
        '<button type="button" class="btn btn-ghost btn-sm wallet-btn" disabled>Connecting…</button>';
      return;
    }
    if (s.connected) {
      var warn = s.onBsc
        ? ""
        : '<button type="button" class="btn btn-ghost btn-sm wallet-btn wallet-wrong" data-wallet-action="switch">Wrong network</button>';
      slot.innerHTML =
        warn +
        '<div class="wallet-connected">' +
        '<span class="wallet-addr mono" title="' +
        s.address +
        '">' +
        s.truncated +
        "</span>" +
        '<button type="button" class="btn btn-ghost btn-sm wallet-btn" data-wallet-action="disconnect">Disconnect</button>' +
        "</div>";
    } else {
      slot.innerHTML =
        '<button type="button" class="btn btn-primary btn-sm wallet-btn" data-wallet-action="connect">Connect Wallet</button>';
    }
    slot.querySelectorAll("[data-wallet-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var action = btn.getAttribute("data-wallet-action");
        if (action === "connect") {
          connect().catch(function () {});
        } else if (action === "disconnect") {
          disconnect();
        } else if (action === "switch") {
          ensureBsc().catch(function (err) {
            setError((err && err.message) || "Could not switch network");
          });
        }
      });
    });
  }

  function updateCreateUi() {
    var submit = $("#createSubmit");
    var msg = $("#createMsg");
    if (!submit) return;
    var s = getState();
    var ready = global.RizDeployments && global.RizDeployments.isReady();
    submit.disabled = false;
    if (!s.connected) {
      submit.textContent = "Connect Wallet";
      submit.dataset.mode = "connect";
    } else if (!s.onBsc) {
      submit.textContent = "Switch to BSC Mainnet";
      submit.dataset.mode = "switch";
    } else if (!ready) {
      submit.textContent = "Factory config missing";
      submit.disabled = true;
      submit.dataset.mode = "blocked";
    } else {
      submit.textContent = "Launch on BSC";
      submit.dataset.mode = "launch";
    }
    if (msg && s.error) {
      msg.textContent = s.error;
      msg.hidden = false;
    }
  }

  function wireCreateSubmit() {
    var form = $("#createForm");
    if (!form || form.dataset.walletWired) return;
    form.dataset.walletWired = "1";
    form.addEventListener(
      "submit",
      function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        var submit = $("#createSubmit");
        var msg = $("#createMsg");
        var mode = submit && submit.dataset.mode;
        var s = getState();

        if (mode === "connect" || !s.connected) {
          connect()
            .then(function () {
              if (msg) {
                msg.textContent = "Wallet connected on BSC Mainnet.";
                msg.hidden = false;
              }
              updateCreateUi();
            })
            .catch(function (err) {
              if (msg) {
                msg.textContent = (err && err.message) || "Could not connect wallet.";
                msg.hidden = false;
              }
            });
          return;
        }
        if (mode === "switch" || !s.onBsc) {
          ensureBsc()
            .then(function () {
              if (msg) {
                msg.textContent = "Switched to BSC Mainnet.";
                msg.hidden = false;
              }
              updateCreateUi();
            })
            .catch(function (err) {
              if (msg) {
                msg.textContent = (err && err.message) || "Could not switch network.";
                msg.hidden = false;
              }
            });
          return;
        }
        if (mode !== "launch") {
          if (msg) {
            msg.textContent = "Launch unavailable — factory config missing.";
            msg.hidden = false;
          }
          return;
        }
        if (!global.RizLaunch || typeof global.RizLaunch.launchFromForm !== "function") {
          if (msg) {
            msg.textContent = "Launch module not loaded.";
            msg.hidden = false;
          }
          return;
        }
        submit.disabled = true;
        submit.textContent = "Confirm in wallet…";
        if (msg) {
          msg.textContent = "Sending launch tx to factory (0.001 BNB fee)…";
          msg.hidden = false;
        }
        global.RizLaunch.launchFromForm(form)
          .then(function (entry) {
            var link = entry.txHash && global.RizDeployments
              ? global.RizDeployments.txUrl(entry.txHash)
              : "";
            if (msg) {
              msg.innerHTML =
                "Launched <strong>" +
                (entry.symbol || "") +
                "</strong>" +
                (entry.token ? " · <span class=\"mono\">" + entry.token + "</span>" : "") +
                (link ? ' · <a href="' + link + '" target="_blank" rel="noopener">BscScan</a>' : "");
              msg.hidden = false;
            }
            if (global.RizApp && typeof global.RizApp.refreshLaunches === "function") {
              global.RizApp.refreshLaunches();
            }
            updateCreateUi();
          })
          .catch(function (err) {
            if (msg) {
              msg.textContent = (err && err.message) || "Launch failed.";
              msg.hidden = false;
            }
            updateCreateUi();
          });
      },
      true
    );
  }

  function init() {
    renderNav();
    wireCreateSubmit();
    updateCreateUi();
    onChange(updateCreateUi);
    silentRestore().then(function () {
      renderNav();
      updateCreateUi();
    });
  }

  var api = {
    BSC: BSC,
    connect: connect,
    disconnect: disconnect,
    ensureBsc: ensureBsc,
    getState: getState,
    hasInjected: hasInjected,
    truncate: truncate,
    onChange: onChange,
    renderNav: renderNav,
    init: init,
  };

  global.RizWallet = api;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
