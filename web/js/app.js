/* Riz.Fun — commodities-first launcher UI (frontend only) */
(function () {
  "use strict";

  const GRADUATE_USD = 35000;

  const FALLBACK_QUOTES = [
    {
      symbol: "BNB",
      name: "BNB",
      mint: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      kind: "native",
      enabled: true,
      vibe: "Native gas · rice narrative on BSC",
    },
    {
      symbol: "XAUt",
      name: "Tether Gold",
      mint: "0x21cAef8A43163Eea865baeE23b9C2E327696A3bf",
      decimals: 6,
      kind: "tokenized_gold",
      enabled: true,
      vibe: "Tokenized gold · soft auric pair",
    },
    {
      symbol: "PAXG",
      name: "PAX Gold",
      mint: "0x7950865a9140cb519342433146ed5b40c6f210f7",
      decimals: 18,
      kind: "tokenized_gold",
      enabled: true,
      vibe: "Tokenized gold · Binance-peg on BSC",
    },
  ];

  const VIBES = {
    BNB: "Native gas · rice narrative on BSC",
    XAUt: "Tokenized gold · soft auric pair",
    PAXG: "Tokenized gold · Binance-peg on BSC",
  };

  const SAMPLE_MARKETS = [
    { name: "Rice Rocket", ticker: "RIZZR", quote: "BNB", mcap: 18200, fee: 2, ageHours: 4, avatar: "RR" },
    { name: "Gold Grain", ticker: "GGRAIN", quote: "XAUt", mcap: 27400, fee: 1.5, ageHours: 11, avatar: "GG" },
    { name: "Pax Bowl", ticker: "PBOWL", quote: "PAXG", mcap: 9100, fee: 3, ageHours: 2, avatar: "PB" },
    { name: "Sticky Hands", ticker: "STICKY", quote: "BNB", mcap: 32100, fee: 1, ageHours: 28, avatar: "SH" },
    { name: "Auric Rice", ticker: "ARICE", quote: "XAUt", mcap: 14800, fee: 2.5, ageHours: 7, avatar: "AR" },
    { name: "Chopstick Cat", ticker: "CHOP", quote: "PAXG", mcap: 5600, fee: 2, ageHours: 1, avatar: "CC" },
    { name: "BNB Bento", ticker: "BENTO", quote: "BNB", mcap: 22100, fee: 1.5, ageHours: 16, avatar: "BB" },
    { name: "Vault Rice", ticker: "VRICE", quote: "XAUt", mcap: 33900, fee: 1, ageHours: 42, avatar: "VR" },
  ];

  let quotes = FALLBACK_QUOTES.slice();
  let selectedQuote = "BNB";
  let filterQuote = "ALL";
  let feePct = 2;

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function formatUsd(n) {
    if (n >= 1000) return "$" + (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    return "$" + Math.round(n).toLocaleString();
  }

  function formatAge(hours) {
    if (hours < 1) return "<1h";
    if (hours < 24) return hours + "h";
    return Math.floor(hours / 24) + "d";
  }

  function avatarClass(quote) {
    const q = (quote || "").toLowerCase();
    if (q === "bnb" || q === "xaut" || q === "paxg") return q;
    return "";
  }

  function quoteMeta(symbol) {
    const q = quotes.find((x) => x.symbol === symbol);
    return {
      symbol: symbol,
      name: (q && q.name) || symbol,
      vibe: (q && (q.vibe || q.notes)) || VIBES[symbol] || "",
      kind: (q && q.kind) || "",
    };
  }

  function displayName(q) {
    if (q.symbol === "BNB") return "BNB";
    if (q.symbol === "XAUt") return "Gold (XAUt)";
    if (q.symbol === "PAXG") return "Gold (PAXG)";
    return q.name || q.symbol;
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
    selectedQuote = symbol;
    filterQuote = symbol;
    renderCreateQuotes();
    updateSummary();
    renderQuoteFilters();
    renderCommodityStrip();
    renderMarkets();
    renderFeatured();
    if (opts.go === "create") {
      showView("create");
    } else if (opts.go === "markets") {
      showView("markets");
    }
  }

  function renderCommodityGallery() {
    const el = $("#commodityGallery");
    if (!el) return;
    const enabled = quotes.filter((q) => q.enabled !== false);
    el.innerHTML = enabled
      .map((q) => {
        const cls = avatarClass(q.symbol);
        const vibe = q.vibe || VIBES[q.symbol] || q.notes || "";
        return (
          '<button type="button" class="commodity-card ' +
          cls +
          '" data-commodity="' +
          q.symbol +
          '">' +
          '<div class="icon">' +
          q.symbol.slice(0, 4) +
          "</div>" +
          '<div class="sym">' +
          displayName(q) +
          "</div>" +
          '<div class="name">' +
          (q.kind === "native" ? "Native quote" : "Tokenized gold") +
          "</div>" +
          '<p class="vibe">' +
          vibe +
          "</p>" +
          '<span class="cta-hint">Filter markets · or create →</span>' +
          "</button>"
        );
      })
      .join("");
    $all("[data-commodity]", el).forEach((btn) => {
      btn.addEventListener("click", () => {
        selectCommodity(btn.getAttribute("data-commodity"), { go: "markets" });
      });
    });
  }

  function renderCommodityStrip() {
    const el = $("#commodityStrip");
    if (!el) return;
    const enabled = quotes.filter((q) => q.enabled !== false);
    el.innerHTML = enabled
      .map((q) => {
        const cls = avatarClass(q.symbol);
        const on = filterQuote === q.symbol ? " on" : "";
        return (
          '<button type="button" class="strip-card ' +
          cls +
          on +
          '" data-strip="' +
          q.symbol +
          '">' +
          '<div class="mini">' +
          q.symbol.slice(0, 4) +
          "</div>" +
          "<div><div class=\"t\">" +
          displayName(q) +
          '</div><div class="d">' +
          (q.kind === "native" ? "Rice · native" : "Gold quote") +
          "</div></div></button>"
        );
      })
      .join("");
    $all("[data-strip]", el).forEach((btn) => {
      btn.addEventListener("click", () => {
        const sym = btn.getAttribute("data-strip");
        filterQuote = filterQuote === sym ? "ALL" : sym;
        selectedQuote = sym;
        renderCommodityStrip();
        renderQuoteFilters();
        renderMarkets();
        renderCreateQuotes();
        updateSummary();
      });
    });
  }

  function renderQuoteFilters() {
    const el = $("#quoteFilters");
    if (!el) return;
    const enabled = quotes.filter((q) => q.enabled !== false);
    const bits = [
      '<button type="button" class="tab' +
        (filterQuote === "ALL" ? " active" : "") +
        '" data-filter="ALL">All</button>',
    ];
    enabled.forEach((q) => {
      bits.push(
        '<button type="button" class="tab' +
          (filterQuote === q.symbol ? " active" : "") +
          '" data-filter="' +
          q.symbol +
          '">' +
          q.symbol +
          "</button>"
      );
    });
    el.innerHTML = bits.join("");
    $all("[data-filter]", el).forEach((btn) => {
      btn.addEventListener("click", () => {
        filterQuote = btn.getAttribute("data-filter");
        renderQuoteFilters();
        renderCommodityStrip();
        renderMarkets();
      });
    });
  }

  function renderMarkets() {
    const tbody = $("#marketsBody");
    const label = $("#boardLabel");
    if (label) {
      label.textContent =
        filterQuote === "ALL" ? "All commodities" : "Paired with " + filterQuote;
    }
    if (!tbody) return;
    const rows = SAMPLE_MARKETS.filter(
      (m) => filterQuote === "ALL" || m.quote === filterQuote
    );
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="color:var(--muted);padding:28px;text-align:center">No markets for this commodity yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map((m, i) => {
        const pct = Math.min(100, Math.round((m.mcap / GRADUATE_USD) * 100));
        const qCls = m.quote.toLowerCase();
        return (
          "<tr>" +
          '<td class="mono">' +
          String(i + 1).padStart(2, "0") +
          "</td>" +
          "<td><div class=\"pair\">" +
          '<div class="avatar ' +
          avatarClass(m.quote) +
          '">' +
          m.avatar +
          "</div>" +
          "<div><div class=\"name\">" +
          m.name +
          '</div><div class="sym mono">$' +
          m.ticker +
          "</div></div></div></td>" +
          '<td><span class="pill quote-' +
          qCls +
          '">' +
          (m.quote === "BNB" ? "🍚 BNB" : "✦ " + m.quote) +
          "</span></td>" +
          '<td class="mcap-cell"><div class="mono">' +
          formatUsd(m.mcap) +
          '</div><div class="progress"><i style="width:' +
          pct +
          '%"></i></div>' +
          '<div class="mcap-meta"><span>' +
          pct +
          "%</span><span>→ " +
          formatUsd(GRADUATE_USD) +
          "</span></div></td>" +
          '<td class="mono">' +
          m.fee.toFixed(1) +
          "%</td>" +
          '<td class="mono">' +
          formatAge(m.ageHours) +
          "</td>" +
          '<td><button type="button" class="btn btn-ghost btn-sm" data-goto-create-with="' +
          m.quote +
          '">Pair</button></td>' +
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

  function renderFeatured() {
    const el = $("#featuredMarkets");
    if (!el) return;
    const rows = SAMPLE_MARKETS.slice(0, 4);
    el.innerHTML = rows
      .map((m) => {
        const pct = Math.min(100, Math.round((m.mcap / GRADUATE_USD) * 100));
        return (
          '<div class="m-card">' +
          '<div class="avatar ' +
          avatarClass(m.quote) +
          '">' +
          m.avatar +
          "</div>" +
          '<div class="meta"><div class="name">' +
          m.name +
          '</div><div class="sym mono">$' +
          m.ticker +
          ' · <span class="pill quote-' +
          m.quote.toLowerCase() +
          '" style="margin-left:4px">' +
          m.quote +
          "</span></div></div>" +
          '<div class="right"><div class="mcap mono">' +
          formatUsd(m.mcap) +
          '</div><div class="pct">' +
          pct +
          "% to graduate</div></div></div>"
        );
      })
      .join("");
  }

  function renderCreateQuotes() {
    const el = $("#quotePicker");
    if (!el) return;
    const enabled = quotes.filter((q) => q.enabled !== false);
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
          q.symbol.slice(0, 4) +
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
        e.preventDefault();
        const msg = $("#createMsg");
        if (msg) {
          msg.textContent =
            "Coming soon — launch creation opens when the protocol ships. Your details stay local for now.";
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
    const allowed = ["home", "markets", "create", "about"];
    const legacy = { commodities: "home" };
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
    renderCommodityGallery();
    renderCommodityStrip();
    renderQuoteFilters();
    renderMarkets();
    renderFeatured();
    renderCreateQuotes();
    updateSummary();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
