/* Riz.Fun BSC launcher MVP — frontend only. No live protocol contracts. */
(function () {
  "use strict";

  const GRADUATE_USD = 35000;
  const OPEN_USD = 5000;

  const FALLBACK_QUOTES = [
    {
      symbol: "BNB",
      name: "BNB (native)",
      mint: "0x0000000000000000000000000000000000000000",
      decimals: 18,
      kind: "native",
      enabled: true,
      notes: "Native gas token",
    },
    {
      symbol: "XAUt",
      name: "Tether Gold",
      mint: "0x21cAef8A43163Eea865baeE23b9C2E327696A3bf",
      decimals: 6,
      kind: "tokenized_gold",
      enabled: true,
      notes: "Tether Gold on BNB Chain",
    },
    {
      symbol: "PAXG",
      name: "Binance-peg PAX Gold",
      mint: "0x7950865a9140cb519342433146ed5b40c6f210f7",
      decimals: 18,
      kind: "tokenized_gold",
      enabled: true,
      notes: "Binance-peg PAXG (BEP-20)",
    },
  ];

  /** Demo markets — clearly fictional until deploy */
  const DEMO_MARKETS = [
    {
      name: "Rice Rocket",
      ticker: "RIZZR",
      quote: "BNB",
      mcap: 18200,
      fee: 2,
      ageHours: 4,
      avatar: "RR",
    },
    {
      name: "Gold Grain",
      ticker: "GGRAIN",
      quote: "XAUt",
      mcap: 27400,
      fee: 1.5,
      ageHours: 11,
      avatar: "GG",
    },
    {
      name: "Pax Bowl",
      ticker: "PBOWL",
      quote: "PAXG",
      mcap: 9100,
      fee: 3,
      ageHours: 2,
      avatar: "PB",
    },
    {
      name: "Sticky Hands",
      ticker: "STICKY",
      quote: "BNB",
      mcap: 32100,
      fee: 1,
      ageHours: 28,
      avatar: "SH",
    },
    {
      name: "Auric Rice",
      ticker: "ARICE",
      quote: "XAUt",
      mcap: 14800,
      fee: 2.5,
      ageHours: 7,
      avatar: "AR",
    },
    {
      name: "Chopstick Cat",
      ticker: "CHOP",
      quote: "PAXG",
      mcap: 5600,
      fee: 2,
      ageHours: 1,
      avatar: "CC",
    },
    {
      name: "BNB Bento",
      ticker: "BENTO",
      quote: "BNB",
      mcap: 22100,
      fee: 1.5,
      ageHours: 16,
      avatar: "BB",
    },
    {
      name: "Vault Rice",
      ticker: "VRICE",
      quote: "XAUt",
      mcap: 33900,
      fee: 1,
      ageHours: 42,
      avatar: "VR",
    },
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
    const d = Math.floor(hours / 24);
    return d + "d";
  }

  function avatarClass(quote) {
    const q = (quote || "").toLowerCase();
    if (q === "bnb") return "bnb";
    if (q === "xaut") return "xaut";
    if (q === "paxg") return "paxg";
    return "";
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

  function renderQuoteFilters() {
    const el = $("#quoteFilters");
    if (!el) return;
    const enabled = quotes.filter((q) => q.enabled !== false);
    const bits = ['<button type="button" class="tab' + (filterQuote === "ALL" ? " active" : "") + '" data-filter="ALL">All</button>'];
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
        renderMarkets();
      });
    });
  }

  function renderMarkets() {
    const tbody = $("#marketsBody");
    if (!tbody) return;
    const rows = DEMO_MARKETS.filter(
      (m) => filterQuote === "ALL" || m.quote === filterQuote
    );
    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="color:var(--muted);padding:24px">No DEMO markets for this quote.</td></tr>';
      return;
    }
    tbody.innerHTML = rows
      .map((m, i) => {
        const pct = Math.min(100, Math.round((m.mcap / GRADUATE_USD) * 100));
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
          ' <span class="pill demo">DEMO</span></div>' +
          '<div class="sym mono">$' +
          m.ticker +
          "</div></div></div></td>" +
          '<td><span class="pill quote-' +
          m.quote.toLowerCase() +
          '">' +
          m.quote +
          "</span></td>" +
          '<td class="mcap-cell"><div class="mono">' +
          formatUsd(m.mcap) +
          '</div><div class="progress" title="Progress to ~$35k graduate"><i style="width:' +
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
          '<td><button type="button" class="btn btn-ghost btn-sm" disabled title="Contracts not live yet">Trade</button></td>' +
          "</tr>"
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
        const kind =
          q.kind === "native"
            ? "Native quote"
            : q.kind === "tokenized_gold"
            ? "Tokenized gold"
            : q.kind || "Quote";
        return (
          '<button type="button" class="quote' +
          on +
          '" data-symbol="' +
          q.symbol +
          '">' +
          '<div class="t">' +
          q.symbol +
          "</div>" +
          '<div class="d">' +
          (q.name || kind) +
          " · Phase A</div>" +
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
    const name = ($("#tokName") && $("#tokName").value.trim()) || "—";
    const ticker = ($("#tokTicker") && $("#tokTicker").value.trim().toUpperCase()) || "—";
    const feeEl = $("#sumFee");
    const quoteEl = $("#sumQuote");
    const nameEl = $("#sumName");
    const tickEl = $("#sumTicker");
    const firstBuy = ($("#firstBuy") && $("#firstBuy").value.trim()) || "0";
    if (feeEl) feeEl.textContent = feePct.toFixed(1) + "%";
    if (quoteEl) quoteEl.textContent = selectedQuote;
    if (nameEl) nameEl.textContent = name;
    if (tickEl) tickEl.textContent = ticker === "—" ? "—" : "$" + ticker;
    const fb = $("#sumFirstBuy");
    if (fb) fb.textContent = firstBuy && Number(firstBuy) > 0 ? firstBuy + " " + selectedQuote : "None";
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
        const url = URL.createObjectURL(file);
        preview.src = url;
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
            "Contracts not live yet — coming after deploy. No fake addresses. Your form is UI-only for now.";
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
    const hash = (location.hash || "#markets").replace("#", "");
    const allowed = ["markets", "create", "about"];
    showView(allowed.includes(hash) ? hash : "markets");
    window.addEventListener("hashchange", () => {
      const h = (location.hash || "#markets").replace("#", "");
      if (allowed.includes(h)) showView(h);
    });
  }

  async function loadQuotes() {
    try {
      const res = await fetch("commodities.json", { cache: "no-store" });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (data && Array.isArray(data.quotes) && data.quotes.length) {
        quotes = data.quotes;
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
    renderQuoteFilters();
    renderMarkets();
    renderCreateQuotes();
    updateSummary();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
