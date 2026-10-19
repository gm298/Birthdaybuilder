(() => {
  "use strict";

  // Paste your GA4 Measurement ID from analytics.google.com (Admin → Data streams).
  const GA_MEASUREMENT_ID = "G-0FETZGZZKT";

  const PAGE_NAMES = {
    landing: "birthdays",
    cakes: "cakes",
    builder: "builder",
  };

  function pageName() {
    const key = document.body?.getAttribute("data-page") || "landing";
    return PAGE_NAMES[key] || key;
  }

  function isConfigured() {
    return /^G-[A-Z0-9]+$/.test(GA_MEASUREMENT_ID) && GA_MEASUREMENT_ID !== "G-0FETZGZZKT";
  }

  function track(eventName, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params || {});
      } else if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: eventName, ...(params || {}) });
      }
    } catch (_) {
      /* analytics optional */
    }
  }

  function installGtag() {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
    });

    const script = document.createElement("script");
    script.async = true;
    script.src =
      "https://www.googletagmanager.com/gtag/js?id=" +
      encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  function sendPageView() {
    const name = pageName();
    window.gtag("set", { page_name: name });
    track("page_view", {
      page_name: name,
      page_title: document.title,
      page_path: location.pathname + location.search,
      page_location: location.href,
    });
  }

  function linkType(anchor) {
    const href = anchor.getAttribute("href") || "";
    const abs = anchor.href || href;
    if (anchor.hasAttribute("data-wa") || /wa\.me|whatsapp/i.test(abs)) return "whatsapp";
    if (/instagram\.com/i.test(abs)) return "instagram";
    if (/maps\.app\.goo\.gl|google\.(com|co\.\w+)\/maps|maps\.google/i.test(abs)) {
      return "maps";
    }
    if (href.startsWith("mailto:")) return "email";
    if (href.startsWith("tel:")) return "phone";
    if (href.startsWith("#")) return "anchor";
    try {
      const url = new URL(abs, location.href);
      if (url.origin === location.origin) {
        return url.pathname === location.pathname && url.hash ? "anchor" : "internal";
      }
    } catch (_) {
      /* ignore malformed href */
    }
    return "outbound";
  }

  function linkLabel(anchor) {
    return (
      anchor.getAttribute("data-wa") ||
      anchor.getAttribute("aria-label") ||
      anchor.getAttribute("data-step") ||
      anchor.textContent.replace(/\s+/g, " ").trim().slice(0, 80) ||
      anchor.getAttribute("href") ||
      ""
    );
  }

  function initClicks() {
    document.addEventListener(
      "click",
      (event) => {
        const anchor = event.target.closest("a[href]");
        if (!anchor) return;
        track("link_click", {
          page_name: pageName(),
          link_type: linkType(anchor),
          link_text: linkLabel(anchor),
          link_url: (anchor.href || anchor.getAttribute("href") || "").slice(0, 500),
        });
      },
      true
    );
  }

  function initTimeOnPage() {
    let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    let engagedMs = 0;
    let flushed = false;

    function pause() {
      if (!visibleSince) return;
      engagedMs += Date.now() - visibleSince;
      visibleSince = null;
    }

    function resume() {
      if (!visibleSince && document.visibilityState === "visible") {
        visibleSince = Date.now();
      }
    }

    function flush(reason) {
      pause();
      if (flushed) return;
      flushed = true;
      const seconds = Math.round(engagedMs / 1000);
      if (seconds < 1) return;
      track("page_time", {
        page_name: pageName(),
        time_seconds: seconds,
        leave_reason: reason,
        transport_type: "beacon",
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        pause();
        return;
      }
      resume();
    });
    window.addEventListener("pagehide", () => flush("pagehide"));
  }

  window.TinyAnalytics = { track, pageName };

  if (!isConfigured()) return;

  installGtag();

  const start = () => {
    sendPageView();
    initClicks();
    initTimeOnPage();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
