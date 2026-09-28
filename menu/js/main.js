(() => {
  "use strict";

  // Phones (Android Chrome in particular) cannot show a PDF inside an iframe.
  const inlinePdf = navigator.pdfViewerEnabled !== false;

  function track(eventName, params) {
    try {
      if (typeof window.gtag === "function") window.gtag("event", eventName, params || {});
      else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: eventName, ...(params || {}) });
    } catch (_) {
      /* analytics optional */
    }
  }

  function sourceFor(tab) {
    const base = (window.TINY_WP && window.TINY_WP.menuAssetBase) || "";
    const url = new URL(base + tab.dataset.pdf, location.href).href;
    return { url, view: `${url}#view=FitH&navpanes=0`, filename: tab.dataset.pdf.split("/").pop() };
  }

  document.addEventListener("DOMContentLoaded", () => {
    const tabs = Array.from(document.querySelectorAll(".menu-tab[data-pdf]"));
    const panel = document.getElementById("menu-panel");
    const title = document.getElementById("menu-viewer-title");
    const frame = document.getElementById("menu-frame");
    const frameWrap = document.getElementById("menu-frame-wrap");
    const download = document.getElementById("menu-download");
    const open = document.getElementById("menu-open");
    const fallback = document.getElementById("menu-fallback");
    const fallbackOpen = document.getElementById("menu-fallback-open");
    if (!tabs.length || !frame) return;

    frame.addEventListener("load", () => frameWrap?.classList.add("is-loaded"));

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
      frame.title = name;

      frameWrap?.classList.toggle("is-fallback", !inlinePdf);
      if (fallback) fallback.hidden = inlinePdf;
      if (fallbackOpen) fallbackOpen.href = src.url;
      if (inlinePdf && frame.getAttribute("src") !== src.view) {
        frameWrap?.classList.remove("is-loaded");
        frame.src = src.view;
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
