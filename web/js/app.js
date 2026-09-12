/* Riz.Fun — commodities directory + create UI (frontend only) */
(function () {
  "use strict";

  const FALLBACK_QUOTES = [
    {
      symbol: "BNB",
      name: "BNB",
      mint: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      kind: "native",
      category: "native",
      status: "live",
      enabled: true,
      icon: "🍚",
      vibe: "Native gas · rice narrative on BSC",
    },
    {
      symbol: "XAUt",
      name: "Tether Gold",
      mint: "0x21cAef8A43163Eea865baeE23b9C2E327696A3bf",
      decimals: 6,
      kind: "tokenized_gold",
      category: "metals",
      status: "live",
      enabled: true,
      icon: "✦",
      vibe: "Tokenized gold · XAUt pair on BSC",
    },
    {
      symbol: "PAXG",
      name: "PAX Gold",
      mint: "0x7950865a9140cb519342433146ed5b40c6f210f7",
      decimals: 18,
      kind: "tokenized_gold",
      category: "metals",
      status: "live",
      enabled: true,
      icon: "◈",
      vibe: "Tokenized gold · Binance-peg on BSC",
    },
  ];

  const VIBES = {
    BNB: "Native gas · rice narrative on BSC",
    XAUt: "Tokenized gold · XAUt pair on BSC",
    PAXG: "Tokenized gold · Binance-peg on BSC",
  };

  let quotes = FALLBACK_QUOTES.slice();
  let selectedQuote = "BNB";
  let filterCategory = "ALL";
  let filterStatus = "ALL";
  let feePct = 2;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function isLive(q) {
    if (!q) return false;
    if (q.status === "live") return true;
    if (q.status === "soon") return false;
    return q.enabled !== false;
  }

  function liveQuotes() {
    return quotes.filter(isLive);
  }

  function avatarClass(quote) {
    const q = (quote || "").toLowerCase();
    if (q === "bnb" || q === "xaut" || q === "paxg") return q;
    return "";
  }

  function categoryClass(q) {
    const c = ((q && q.category) || "").toLowerCase();
    if (c === "native" || c === "metals" || c === "energy" || c === "agriculture") return "cat-" + c;
    const sym = ((q && q.symbol) || "").toLowerCase();
    if (sym === "bnb") return "cat-native";
    if (["xaut", "paxg", "xag", "xpt", "xpd", "copper", "alu", "iron", "li"].includes(sym))
      return "cat-metals";
    if (["wti", "brent", "ng", "coal", "u", "oil"].includes(sym)) return "cat-energy";
    return "cat-agriculture";
  }

  function categoryLabel(q) {
    const c = ((q && q.category) || "").toLowerCase();
    if (c === "native") return "Native";
    if (c === "metals") return "Metals";
    if (c === "energy") return "Energy";
    if (c === "agriculture") return "Agriculture";
    return q && q.kind === "native" ? "Native" : "Commodity";
  }

  function quoteIcon(q) {
    if (q && q.icon) return q.icon;
    return q && q.symbol ? q.symbol.slice(0, 4) : "?";
  }

  function quoteMeta(symbol) {
    const q = quotes.find((x) => x.symbol === symbol);
    return {
      symbol: symbol,
      name: (q && q.name) || symbol,
      vibe: (q && (q.vibe || q.notes)) || VIBES[symbol] || "",
      kind: (q && q.kind) || "",
      category: (q && q.category) || "",
    };
  }

  function displayName(q) {
    if (!q) return "";
    if (q.symbol === "BNB") return "BNB";
    if (q.symbol === "XAUt") return "Gold (XAUt)";
    if (q.symbol === "PAXG") return "Gold (PAXG)";
    return q.name || q.symbol;
  }

  function shortDesc(q) {
    return (q && (q.vibe || q.notes)) || "";
  }

  function filteredQuotes() {
    return quotes.filter((q) => {
      const cat = ((q.category || "").toLowerCase() || "other");
      const catOk =
        filterCategory === "ALL" ||
        (filterCategory === "native" && cat === "native") ||
        (filterCategory === "metals" && cat === "metals") ||
        (filterCategory === "energy" && cat === "energy") ||
        (filterCategory === "agriculture" && cat === "agriculture");
      const live = isLive(q);
      const statusOk =
        filterStatus === "ALL" ||
        (filterStatus === "live" && live) ||
        (filterStatus === "soon" && !live);
      return catOk && statusOk;
    });
  }

  function showView(id) {
    $all(".view").forEach((v) => v.classList.toggle("active", v.id === "view-" + id));
    $all(".nav-btn[data-view]").forEach((b) =>
      b.classList.toggle("active", b.getAttribute("data-view") === id)
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (location.hash !== "#" + id) {
      history.replaceState(null, "", "#" + id);
    }
  }

  function selectCommodity(symbol, opts) {
    opts = opts || {};
    const q = quotes.find((x) => x.symbol === symbol);
    if (!isLive(q)) return;
    selectedQuote = symbol;
    renderCreateQuotes();
    updateSummary();
    renderCommodityGallery();
    renderDirectory();
    if (opts.go === "create") {
      showView("create");
    } else if (opts.go === "commodities") {
      showView("commodities");
    }
  }

  function updateCatalogStats() {
    const live = liveQuotes().length;
    const total = quotes.length;
    const v = $("#statQuotesValue");
    const s = $("#statQuotesSub");
    if (v) v.textContent = String(total);
    if (s) s.textContent = live + " live · " + (total - live) + " soon";
    const countEl = $("#directoryCount");
    if (countEl) {
      const n = filteredQuotes().length;
      countEl.textContent = n + " of " + total + " commodities";
    }
  }

  function commodityCardHtml(q) {
    const live = isLive(q);
    const cls = [avatarClass(q.symbol), categoryClass(q), live ? "live" : "soon"]
      .filter(Boolean)
      .join(" ");
    const vibe = shortDesc(q);
    const badge = live
      ? '<span class="status-badge live">Live</span>'
      : '<span class="status-badge soon">Soon</span>';
    const hint = live
      ? '<span class="cta-hint">Use in Create →</span>'
      : '<span class="cta-hint soon-hint">Registry · quote TBD</span>';
    const tag = live ? "button" : "div";
    const typeAttr = live ? ' type="button"' : "";
    const dataAttr = live ? ' data-commodity="' + q.symbol + '"' : ' aria-disabled="true"';
    return (
      "<" +
      tag +
      typeAttr +
      ' class="commodity-card ' +
      cls +
      '"' +
      dataAttr +
      ">" +
      '<div class="card-top">' +
      '<div class="icon">' +
      quoteIcon(q) +
      "</div>" +
      badge +
      "</div>" +
      '<div class="sym">' +
      displayName(q) +
      "</div>" +
      '<div class="name"><span class="cat-pill">' +
      categoryLabel(q) +
      "</span> · " +
      q.symbol +
      "</div>" +
      '<p class="vibe">' +
      vibe +
      "</p>" +
      hint +
      "</" +
      tag +
      ">"
    );
  }

  function renderCommodityGallery() {
    const el = $("#commodityGallery");
    if (!el) return;
    el.innerHTML = quotes.map(commodityCardHtml).join("");
    $all("[data-commodity]", el).forEach((btn) => {
      btn.addEventListener("click", () => {
        selectCommodity(btn.getAttribute("data-commodity"), { go: "create" });
      });
    });
  }

  function renderDirectoryFilters() {
    const catEl = $("#dirCategoryFilters");
    const statusEl = $("#dirStatusFilters");
    if (catEl) {
      const cats = [
        ["ALL", "All"],
        ["native", "Native"],
        ["metals", "Metals"],
        ["energy", "Energy"],
        ["agriculture", "Agriculture"],
      ];
      catEl.innerHTML = cats
        .map(
          ([id, label]) =>
            '<button type="button" class="tab' +
            (filterCategory === id ? " active" : "") +
            '" data-dir-cat="' +
            id +
            '">' +
            label +
            "</button>"
        )
        .join("");
      $all("[data-dir-cat]", catEl).forEach((btn) => {
        btn.addEventListener("click", () => {
          filterCategory = btn.getAttribute("data-dir-cat");
          renderDirectoryFilters();
          renderDirectory();
          updateCatalogStats();
        });
      });
    }
    if (statusEl) {
      const statuses = [
        ["ALL", "All status"],
        ["live", "Live"],
        ["soon", "Soon"],
      ];
      statusEl.innerHTML = statuses
        .map(
          ([id, label]) =>
            '<button type="button" class="tab' +
            (filterStatus === id ? " active" : "") +
            '" data-dir-status="' +
            id +
            '">' +
            label +
            "</button>"
        )
        .join("");
      $all("[data-dir-status]", statusEl).forEach((btn) => {
        btn.addEventListener("click", () => {
          filterStatus = btn.getAttribute("data-dir-status");
          renderDirectoryFilters();
          renderDirectory();
          updateCatalogStats();
        });
      });
    }
  }

  function renderDirectory() {
    const tbody = $("#directoryBody");
    const grid = $("#directoryGrid");
    const rows = filteredQuotes();
    updateCatalogStats();

    if (tbody) {
      if (!rows.length) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="empty-cell">No commodities match these filters.</td></tr>';
      } else {
        tbody.innerHTML = rows
          .map((q) => {
            const live = isLive(q);
            const badge = live
              ? '<span class="status-badge live">Live</span>'
              : '<span class="status-badge soon">Soon</span>';
            const action = live
              ? '<button type="button" class="btn btn-ghost btn-sm" data-goto-create-with="' +
                q.symbol +
                '">Create</button>'
              : '<span class="muted-action">Soon</span>';
            return (
              "<tr class=\"" +
              (live ? "row-live" : "row-soon") +
              "\">" +
              "<td><div class=\"pair\">" +
              '<div class="avatar ' +
              avatarClass(q.symbol) +
              " " +
              categoryClass(q) +
              '">' +
              quoteIcon(q) +
              "</div>" +
              "<div><div class=\"name\">" +
              displayName(q) +
              '</div><div class="sym mono">' +
              categoryLabel(q) +
              "</div></div></div></td>" +
              '<td class="mono">' +
              q.symbol +
              "</td>" +
              "<td><span class=\"cat-pill\">" +
              categoryLabel(q) +
              "</span></td>" +
              "<td>" +
              badge +
              "</td>" +
              '<td class="desc-cell">' +
              shortDesc(q) +
              '</td>' +
              "<td>" +
              action +
              "</td>" +
              "</tr>"
            );
          })
          .join("");
        $all("[data-goto-create-with]", tbody).forEach((btn) => {
          btn.addEventListener("click", () => {
            selectCommodity(btn.getAttribute("data-goto-create-with"), { go: "create" });
          });
        });
      }
    }

    if (grid) {
      grid.innerHTML = rows.map(commodityCardHtml).join("");
      $all("[data-commodity]", grid).forEach((btn) => {
        btn.addEventListener("click", () => {
          selectCommodity(btn.getAttribute("data-commodity"), { go: "create" });
        });
      });
    }
  }

  function refreshLaunches() {
    const list =
      globalThis.RizLaunch && typeof globalThis.RizLaunch.loadLaunches === "function"
        ? globalThis.RizLaunch.loadLaunches()
        : [];
    const tbody = $("#launchesBody");
    const featured = $("#featuredLaunches");
    const explorer =
      (globalThis.RizDeployments && globalThis.RizDeployments.DEPLOY.explorer) ||
      "https://bscscan.com";

    if (tbody) {
      if (!list.length) {
        tbody.innerHTML =
          '<tr><td colspan="5" class="empty-cell">No launches yet — create one on BSC Mainnet</td></tr>';
      } else {
        tbody.innerHTML = list
          .map(function (L) {
            const token = L.token || "";
            const short = token ? token.slice(0, 6) + "…" + token.slice(-4) : "pending";
            const href = token ? explorer + "/address/" + token : L.txHash ? explorer + "/tx/" + L.txHash : "#";
            return (
              "<tr>" +
              "<td><strong>" +
              (L.symbol || "") +
              "</strong><div class=\"soft-note\">" +
              (L.name || "") +
              "</div></td>" +
              "<td class=\"mono\">" +
              (L.quote || "") +
              "</td>" +
              '<td class="mono"><a href="' +
              href +
              '" target="_blank" rel="noopener">' +
              short +
              "</a></td>" +
              "<td class=\"mono\">live</td>" +
              "<td>BSC</td>" +
              "</tr>"
            );
          })
          .join("");
      }
    }

    if (featured) {
      if (!list.length) {
        featured.innerHTML =
          '<div class="empty-state"><p class="empty-title">No launches yet</p><p class="empty-sub">Launch a coin on BSC Mainnet to see it here.</p></div>';
      } else {
        featured.innerHTML = list
          .slice(0, 6)
          .map(function (L) {
            const token = L.token || "";
            const href = token
              ? explorer + "/address/" + token
              : L.txHash
                ? explorer + "/tx/" + L.txHash
                : "#";
            return (
              '<a class="launch-card" href="' +
              href +
              '" target="_blank" rel="noopener">' +
              "<strong>" +
              (L.symbol || "TOKEN") +
              "</strong>" +
              '<span class="mono">' +
              (L.quote || "") +
              " · BSC Mainnet</span>" +
              "</a>"
            );
          })
          .join("");
      }
    }
  }

  function renderLaunchesEmpty() {
    refreshLaunches();
  }

  function renderCreateQuotes() {
    const el = $("#quotePicker");
    if (!el) return;
    const enabled = liveQuotes();
    if (!enabled.find((q) => q.symbol === selectedQuote) && enabled[0]) {
      selectedQuote = enabled[0].symbol;
    }
    el.innerHTML = enabled
      .map((q) => {
        const on = q.symbol === selectedQuote ? " on" : "";
        const cls = avatarClass(q.symbol);
        const vibe = q.vibe || VIBES[q.symbol] || "";
        return (
          '<button type="button" class="quote ' +
          cls +
          on +
          '" data-symbol="' +
          q.symbol +
          '">' +
          '<div class="icon-sm">' +
          quoteIcon(q) +
          "</div>" +
          '<div class="t">' +
          displayName(q) +
          "</div>" +
          '<div class="d">' +
          vibe +
          "</div>" +
          "</button>"
        );
      })
      .join("");
    $all(".quote", el).forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedQuote = btn.getAttribute("data-symbol");
        renderCreateQuotes();
        updateSummary();
      });
    });
  }

  function updateSummary() {
    const meta = quoteMeta(selectedQuote);
    const name = ($("#tokName") && $("#tokName").value.trim()) || "—";
    const tickerRaw = ($("#tokTicker") && $("#tokTicker").value.trim().toUpperCase()) || "";
    const firstBuy = ($("#firstBuy") && $("#firstBuy").value.trim()) || "0";

    const feeEl = $("#sumFee");
    const quoteEl = $("#sumQuote");
    const nameEl = $("#sumName");
    const tickEl = $("#sumTicker");
    if (feeEl) feeEl.textContent = feePct.toFixed(1) + "%";
    if (quoteEl) quoteEl.textContent = selectedQuote;
    if (nameEl) nameEl.textContent = name;
    if (tickEl) tickEl.textContent = tickerRaw ? "$" + tickerRaw : "—";
    const fb = $("#sumFirstBuy");
    if (fb)
      fb.textContent =
        firstBuy && Number(firstBuy) > 0 ? firstBuy + " " + selectedQuote : "None";

    const badge = $("#sumPairBadge");
    const pairName = $("#sumPairName");
    if (badge) {
      badge.className = "pair-badge " + avatarClass(selectedQuote);
      badge.textContent = selectedQuote.slice(0, 4);
    }
    if (pairName) pairName.textContent = displayName(meta);
  }

  function setupCreateForm() {
    const feeInput = $("#feeRange");
    const feeVal = $("#feeVal");
    if (feeInput) {
      feeInput.addEventListener("input", () => {
        feePct = Number(feeInput.value);
        if (feeVal) feeVal.textContent = feePct.toFixed(1) + "%";
        updateSummary();
      });
    }
    ["tokName", "tokTicker", "firstBuy"].forEach((id) => {
      const el = $("#" + id);
      if (el) el.addEventListener("input", updateSummary);
    });
    const ticker = $("#tokTicker");
    if (ticker) {
      ticker.addEventListener("input", () => {
        ticker.value = ticker.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
        updateSummary();
      });
    }
    const imgInput = $("#tokImage");
    const preview = $("#imgPreview");
    if (imgInput && preview) {
      imgInput.addEventListener("change", () => {
        const file = imgInput.files && imgInput.files[0];
        if (!file) {
          preview.classList.remove("show");
          preview.removeAttribute("src");
          return;
        }
        preview.src = URL.createObjectURL(file);
        preview.classList.add("show");
      });
    }
    const form = $("#createForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        /* Wallet module handles connect / network / honest-disabled launch (capture phase). */
        if (window.RizWallet) return;
        e.preventDefault();
        const msg = $("#createMsg");
        if (msg) {
          msg.textContent =
            "Launch opens when the protocol ships. Connect a wallet from the nav when you are ready.";
          msg.hidden = false;
        }
      });
    }
  }

  function setupNav() {
    $all(".nav-btn[data-view], [data-goto]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const id = el.getAttribute("data-view") || el.getAttribute("data-goto");
        if (id) showView(id);
      });
    });
    const hash = (location.hash || "#home").replace("#", "");
    const allowed = ["home", "commodities", "create", "about"];
    const legacy = { markets: "commodities", launches: "commodities" };
    const resolved = legacy[hash] || hash;
    showView(allowed.includes(resolved) ? resolved : "home");
    window.addEventListener("hashchange", () => {
      const h = (location.hash || "#home").replace("#", "");
      const r = legacy[h] || h;
      if (allowed.includes(r)) showView(r);
    });
  }

  async function loadQuotes() {
    try {
      const res = await fetch("commodities.json", { cache: "no-store" });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (data && Array.isArray(data.quotes) && data.quotes.length) {
        quotes = data.quotes.map((q) => ({
          ...q,
          status: q.status || (q.enabled === false ? "soon" : "live"),
          category: q.category || (q.kind === "native" ? "native" : "metals"),
          vibe: q.vibe || VIBES[q.symbol] || q.notes || "",
        }));
      }
    } catch (err) {
      console.warn("Using embedded quote registry fallback", err);
      quotes = FALLBACK_QUOTES.slice();
    }
  }

  async function init() {
    setupNav();
    setupCreateForm();
    await loadQuotes();
    updateCatalogStats();
    renderCommodityGallery();
    renderDirectoryFilters();
    renderDirectory();
    renderLaunchesEmpty();
    renderCreateQuotes();
    updateSummary();
  }

  globalThis.RizApp = {
    getSelectedQuote: function () {
      return selectedQuote;
    },
    refreshLaunches: refreshLaunches,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
