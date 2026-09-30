(() => {
  "use strict";

  // Pages are pre-rendered images (scripts/render-menu-pages.py) because phones cannot show a PDF inline.

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

  function sourceFor(tab) {
    const [width, height] = (tab.dataset.size || "1200x1600").split("x").map(Number);
    return {
      url: assetUrl(tab.dataset.pdf),
      filename: tab.dataset.pdf.split("/").pop(),
      pages: Number(tab.dataset.pages) || 0,
      width,
      height,
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const tabs = Array.from(document.querySelectorAll(".menu-tab[data-pdf]"));
    const panel = document.getElementById("menu-panel");
    const title = document.getElementById("menu-viewer-title");
    const pagesEl = document.getElementById("menu-pages");
    const download = document.getElementById("menu-download");
    const open = document.getElementById("menu-open");
    if (!tabs.length || !pagesEl) return;

    const rendered = new Map();

    function pagesFor(tab) {
      if (rendered.has(tab)) return rendered.get(tab);
      const src = sourceFor(tab);
      const name = tab.dataset.title || tab.textContent.trim();
      const list = document.createElement("div");
      list.className = "menu-viewer__list";
      for (let i = 1; i <= src.pages; i += 1) {
        const img = document.createElement("img");
        img.className = "menu-page";
        img.src = assetUrl(`pages/${tab.dataset.menu}/page-${String(i).padStart(2, "0")}.webp`);
        img.width = src.width;
        img.height = src.height;
        img.alt = `${name}, page ${i} of ${src.pages}`;
        img.decoding = "async";
        if (i > 2) img.loading = "lazy";
        img.addEventListener("error", () => img.classList.add("is-broken"), { once: true });
        list.appendChild(img);
      }
      rendered.set(tab, list);
      return list;
    }

    function select(tab, { updateHash = true } = {}) {
      const src = sourceFor(tab);
      const name = tab.dataset.title || tab.textContent.trim();
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      panel?.setAttribute("aria-labelledby", tab.id);
      if (title) title.textContent = name;

      const list = pagesFor(tab);
      if (pagesEl.firstElementChild !== list) {
        pagesEl.replaceChildren(list);
        pagesEl.scrollTop = 0;
      }

      if (download) {
        download.href = src.url;
        download.setAttribute("download", src.filename);
      }
      if (open) open.href = src.url;
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
