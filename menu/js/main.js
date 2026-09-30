(() => {
  "use strict";

  // Pages are pre-rendered images (scripts/render-menu-pages.py) because phones cannot show a PDF inline.

  const FLIP_MS = 700;
  const DOUBLE_MIN_WIDTH = 700;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function track(eventName, params) {
    try {
      if (typeof window.gtag === "function") window.gtag("event", eventName, params || {});
      else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: eventName, ...(params || {}) });
    } catch (_) {
      /* analytics optional */
    }
  }

  function assetUrl(path) {
    const base = (window.TINY_WP && window.TINY_WP.menuAssetBase) || "";
    return new URL(base + path, location.href).href;
  }

  function pageUrl(menu, n) {
    return assetUrl(`pages/${menu}/page-${String(n).padStart(2, "0")}.webp`);
  }

  // Cover alone on the right, then 2–3, 4–5 … and a lone back page on the left when the count is even.
  function buildSpreads(count, double) {
    if (!double) return Array.from({ length: count }, (_, i) => [i + 1]);
    const spreads = [[null, 1]];
    for (let p = 2; p <= count; p += 2) spreads.push([p, p + 1 <= count ? p + 1 : null]);
    return spreads;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const tabs = Array.from(document.querySelectorAll(".menu-tab[data-pdf]"));
    const panel = document.getElementById("menu-panel");
    const title = document.getElementById("menu-viewer-title");
    const book = document.getElementById("menu-book");
    const stage = document.getElementById("menu-stage");
    const prevBtn = document.getElementById("menu-prev");
    const nextBtn = document.getElementById("menu-next");
    const status = document.getElementById("menu-status");
    const download = document.getElementById("menu-download");
    const open = document.getElementById("menu-open");
    if (!tabs.length || !book || !stage) return;

    const state = {
      menu: "",
      name: "",
      pages: 0,
      ratio: 0.75,
      spreads: [],
      index: 0,
      double: true,
      busy: false,
      width: 0,
    };
    let bookEl = null;

    function makeImg(n) {
      const img = document.createElement("img");
      img.src = pageUrl(state.menu, n);
      img.alt = `${state.name}, page ${n} of ${state.pages}`;
      img.draggable = false;
      img.decoding = "async";
      return img;
    }

    function fill(el, n) {
      el.replaceChildren();
      el.classList.toggle("is-empty", !n);
      if (n) el.appendChild(makeImg(n));
    }

    function slot(side) {
      const el = document.createElement("div");
      el.className = `flipbook__page flipbook__page--${side}`;
      return el;
    }

    function visiblePages() {
      return (state.spreads[state.index] || []).filter(Boolean);
    }

    function preload() {
      for (let i = state.index - 1; i <= state.index + 2; i += 1) {
        (state.spreads[i] || []).filter(Boolean).forEach((n) => {
          new Image().src = pageUrl(state.menu, n);
        });
      }
    }

    function updateControls() {
      const last = state.spreads.length - 1;
      if (prevBtn) prevBtn.disabled = state.index <= 0;
      if (nextBtn) nextBtn.disabled = state.index >= last;
      if (!status) return;
      const shown = visiblePages();
      const range = shown.length > 1 ? `Pages ${shown[0]}–${shown[1]}` : `Page ${shown[0] || 1}`;
      const hint = state.index === 0 && last > 0 ? " · tap to open" : "";
      status.textContent = `${range} of ${state.pages}${hint}`;
    }

    function render() {
      const spread = state.spreads[state.index] || [];
      const el = document.createElement("div");
      el.className = `flipbook__book ${state.double ? "is-double" : "is-single"}`;
      if (state.double) {
        const left = slot("left");
        const right = slot("right");
        fill(left, spread[0]);
        fill(right, spread[1]);
        el.classList.toggle("is-cover", !spread[0]);
        el.classList.toggle("is-back", !spread[1]);
        el.append(left, right);
      } else {
        const single = slot("single");
        fill(single, spread[0]);
        el.append(single);
      }
      stage.replaceChildren(el);
      bookEl = el;
      updateControls();
      preload();
    }

    function layout() {
      const cs = getComputedStyle(stage);
      const availW = stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      if (availW <= 0 || !state.pages) return;
      state.width = stage.clientWidth;
      const double = availW >= DOUBLE_MIN_WIDTH;
      if (double !== state.double || !state.spreads.length) {
        const keep = state.spreads.length ? visiblePages()[0] || 1 : 1;
        state.double = double;
        state.spreads = buildSpreads(state.pages, double);
        const found = state.spreads.findIndex((s) => s.includes(keep));
        state.index = found < 0 ? 0 : found;
      }
      const availH = Math.min(window.innerHeight * 0.75, 940);
      const pageH = Math.floor(Math.min(availH, availW / (double ? 2 : 1) / state.ratio));
      stage.style.setProperty("--page-h", `${pageH}px`);
      stage.style.setProperty("--page-w", `${Math.floor(pageH * state.ratio)}px`);
      render();
    }

    function go(delta) {
      if (state.busy || !bookEl) return;
      const target = state.index + delta;
      if (target < 0 || target >= state.spreads.length) return;
      const from = state.spreads[state.index];
      const to = state.spreads[target];

      if (reduceMotion.matches) {
        state.index = target;
        render();
        return;
      }

      state.busy = true;
      const leaf = document.createElement("div");
      const front = document.createElement("div");
      const back = document.createElement("div");
      leaf.className = "flipbook__leaf";
      front.className = "flipbook__face flipbook__face--front";
      back.className = "flipbook__face flipbook__face--back";
      leaf.append(front, back);

      let turnedAtStart = false;
      if (state.double) {
        const left = bookEl.querySelector(".flipbook__page--left");
        const right = bookEl.querySelector(".flipbook__page--right");
        if (delta > 0) {
          leaf.classList.add("is-right");
          fill(front, from[1]);
          fill(back, to[0]);
          fill(right, to[1]);
        } else {
          leaf.classList.add("is-left");
          fill(front, from[0]);
          fill(back, to[1]);
          fill(left, to[0]);
        }
        bookEl.classList.toggle("is-cover", !to[0]);
        bookEl.classList.toggle("is-back", !to[1]);
      } else {
        const single = bookEl.querySelector(".flipbook__page--single");
        leaf.classList.add("is-right");
        fill(back, null);
        if (delta > 0) {
          fill(front, from[0]);
          fill(single, to[0]);
        } else {
          fill(front, to[0]);
          leaf.classList.add("is-turned");
          turnedAtStart = true;
        }
      }

      bookEl.appendChild(leaf);
      void leaf.offsetWidth;

      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        state.index = target;
        state.busy = false;
        render();
      };
      leaf.addEventListener("transitionend", (e) => {
        if (e.target === leaf && e.propertyName === "transform") finish();
      });
      window.setTimeout(finish, FLIP_MS + 200);

      requestAnimationFrame(() => {
        if (turnedAtStart) leaf.classList.remove("is-turned");
        else leaf.classList.add("is-turning");
      });
    }

    let swipeX = null;
    let swiped = false;

    stage.addEventListener("click", (e) => {
      if (swiped) {
        swiped = false;
        return;
      }
      if (!bookEl) return;
      if (state.double) {
        if (e.target.closest(".flipbook__page--left:not(.is-empty)")) go(-1);
        else if (e.target.closest(".flipbook__page--right:not(.is-empty)")) go(1);
        return;
      }
      const rect = bookEl.getBoundingClientRect();
      if (e.clientX < rect.left + rect.width * 0.35) go(-1);
      else go(1);
    });

    stage.addEventListener("pointerdown", (e) => {
      swipeX = e.pointerType === "mouse" ? null : e.clientX;
    });
    stage.addEventListener("pointerup", (e) => {
      if (swipeX === null) return;
      const dx = e.clientX - swipeX;
      swipeX = null;
      if (Math.abs(dx) < 40) return;
      swiped = true;
      go(dx < 0 ? 1 : -1);
    });

    book.addEventListener("keydown", (e) => {
      if (e.target.closest("button")) return;
      const keys = { ArrowRight: 1, PageDown: 1, ArrowLeft: -1, PageUp: -1 };
      if (e.key in keys) {
        e.preventDefault();
        go(keys[e.key]);
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        state.index = e.key === "Home" ? 0 : state.spreads.length - 1;
        render();
      }
    });

    prevBtn?.addEventListener("click", () => go(-1));
    nextBtn?.addEventListener("click", () => go(1));

    if (window.ResizeObserver) {
      new ResizeObserver(() => {
        if (stage.clientWidth !== state.width && !state.busy) layout();
      }).observe(stage);
    } else {
      window.addEventListener("resize", () => {
        if (!state.busy) layout();
      });
    }

    function select(tab, { updateHash = true } = {}) {
      const [width, height] = (tab.dataset.size || "1200x1600").split("x").map(Number);
      const name = tab.dataset.title || tab.textContent.trim();
      const url = assetUrl(tab.dataset.pdf);
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      panel?.setAttribute("aria-labelledby", tab.id);
      if (title) title.textContent = name;

      state.menu = tab.dataset.menu;
      state.name = name;
      state.pages = Number(tab.dataset.pages) || 0;
      state.ratio = width && height ? width / height : 0.75;
      state.spreads = [];
      state.index = 0;
      state.busy = false;
      layout();

      if (download) {
        download.href = url;
        download.setAttribute("download", tab.dataset.pdf.split("/").pop());
      }
      if (open) open.href = url;
      if (updateHash && history.replaceState) history.replaceState(null, "", `#${tab.dataset.menu}`);
    }

    function fromHash() {
      const key = location.hash.replace(/^#/, "");
      return tabs.find((t) => t.dataset.menu === key);
    }

    tabs.forEach((tab) => tab.addEventListener("click", () => select(tab)));

    tabs.forEach((tab, i) => {
      tab.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const next = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        next.focus();
        select(next);
      });
    });

    download?.addEventListener("click", () => {
      const active = tabs.find((t) => t.classList.contains("is-active"));
      track("menu_download", { menu: active?.dataset.menu || "" });
    });

    select(fromHash() || tabs.find((t) => t.classList.contains("is-active")) || tabs[0], { updateHash: false });
    window.addEventListener("hashchange", () => {
      const tab = fromHash();
      if (tab) select(tab, { updateHash: false });
    });
  });
})();
