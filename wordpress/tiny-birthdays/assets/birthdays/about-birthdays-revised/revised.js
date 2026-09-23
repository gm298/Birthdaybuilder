(() => {
  "use strict";

  const HEADER_OFFSET = 80;

  const DEFAULT_PACKAGES = {
    legal:
      "Extra guests +150k per person on weekdays, +300k on weekends, up to each package's maximum. Every party runs 3 hours. Weekday starting rates shown; weekend rates are higher. All prices in IDR, subject to government tax & service. Custom combinations available on request.",
    legalMobile:
      "Extra guests +150k weekdays / +300k weekends. Every party runs 3 hours, subject to tax & service.",
    packages: [
      {
        id: "simple",
        name: "Simple celebration",
        shortName: "Simple celebration",
        guests: "5 guests included · add up to 9",
        price: "IDR 2.3M",
        featured: false,
        features: [
          "Birthday cake · 15cm, 2 layers",
          "Requested themed party",
          "Table decor (no flowers)",
          "Simple balloon decor",
          "Food & play-area deposit",
        ],
        mobileSummary: "5 guests · cake 15cm · themed party · table & balloon decor",
      },
      {
        id: "signature",
        name: "Signature themed party",
        shortName: "Signature themed party",
        guests: "10 guests included · add up to 20",
        price: "IDR 5.3M",
        featured: true,
        badge: "Most popular",
        features: [
          "Birthday cake · 18cm, 2 layers",
          "Requested themed party",
          "Medium balloon decor",
          "Photozone",
          "Food & play-area deposit",
        ],
        mobileSummary: "10 guests · cake 18cm · themed decor · medium balloons · photozone",
      },
      {
        id: "terrace",
        name: "Private terrace event",
        shortName: "Private terrace event",
        guests: "20 guests included · add up to 30",
        price: "IDR 12.7M",
        featured: false,
        features: [
          "Whole private terrace",
          "Full terrace balloon decor",
          "Photozone & piñata",
          "Dessert station",
          "Masterclass for 10 kids",
        ],
        mobileSummary: "20 guests · private terrace · photozone · dessert station · masterclass",
      },
    ],
  };

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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function packageBuilderUrl(pkg) {
    if (window.TINY_WP && window.TINY_WP.builderUrl) {
      return `${String(window.TINY_WP.builderUrl).replace(/\/?$/, "/")}?package=${encodeURIComponent(pkg.id)}`;
    }
    return `../builder/?package=${encodeURIComponent(pkg.id)}`;
  }

  function packagesJsonUrl() {
    if (window.TINY_WP && window.TINY_WP.packagesJson) return window.TINY_WP.packagesJson;
    return "../data/packages.json";
  }

  async function loadPackages() {
    const grid = document.getElementById("packages-grid");
    const compact = document.getElementById("packages-compact");
    const legal = document.getElementById("packages-legal");
    if (!grid || !compact) return;

    if (grid.hasAttribute("data-wp-managed")) {
      initPackageAccordion(compact);
      return;
    }

    let data = DEFAULT_PACKAGES;
    if (location.protocol !== "file:") {
      try {
        const res = await fetch(packagesJsonUrl());
        if (res.ok) data = await res.json();
      } catch (_) {
        data = DEFAULT_PACKAGES;
      }
    }

    if (legal) {
      const isMobile = window.matchMedia("(max-width: 900px)").matches;
      legal.textContent = isMobile && data.legalMobile ? data.legalMobile : data.legal;
    }

    grid.innerHTML = data.packages
      .map((pkg) => {
        const features = (pkg.features || [])
          .map((f) => `<li>${escapeHtml(f)}</li>`)
          .join("");
        const badge = pkg.featured
          ? `<span class="pkg__badge">${escapeHtml(pkg.badge || "Most popular")}</span>`
          : "";
        return `
          <a class="pkg${pkg.featured ? " pkg--featured" : ""}" href="${packageBuilderUrl(pkg)}">
            ${badge}
            <h3>${escapeHtml(pkg.name)}</h3>
            <div class="pkg__guests">${escapeHtml(pkg.guests)}</div>
            <div class="pkg__price">${escapeHtml(pkg.price)}</div>
            <ul class="pkg__features">${features}</ul>
            <div class="pkg__cta">Build with this →</div>
          </a>`;
      })
      .join("");

    const featured = data.packages.find((p) => p.featured) || data.packages[1];
    const ordered = featured
      ? [featured, ...data.packages.filter((p) => p.id !== featured.id)]
      : data.packages;

    compact.innerHTML = ordered
      .map((pkg, index) => {
        const isOpen = index === 0;
        const badge = pkg.featured
          ? `<span class="pkg-compact__badge">${escapeHtml(pkg.badge || "Most popular")}</span>`
          : "";
        return `
        <div class="pkg-compact__item${isOpen ? " is-open" : ""}${
          pkg.featured ? " is-featured" : ""
        }" data-pkg="${escapeHtml(pkg.id)}">
          <button type="button" class="pkg-compact__toggle" aria-expanded="${isOpen}">
            ${badge}
            <span class="pkg-compact__name">${escapeHtml(pkg.shortName || pkg.name)}</span>
            <span class="pkg-compact__price">${escapeHtml(pkg.price)}</span>
          </button>
          <div class="pkg-compact__panel"${isOpen ? "" : " hidden"}>
            <span class="pkg-compact__summary">${escapeHtml(pkg.mobileSummary || "")}</span>
            <a class="pkg-compact__cta" href="${packageBuilderUrl(pkg)}">Build with this →</a>
          </div>
        </div>`;
      })
      .join("");

    initPackageAccordion(compact);
  }

  function initPackageAccordion(root) {
    if (!root || root.dataset.accordionBound) return;
    root.dataset.accordionBound = "1";
    root.addEventListener("click", (e) => {
      const toggle = e.target.closest(".pkg-compact__toggle");
      if (!toggle || !root.contains(toggle)) return;
      const item = toggle.closest(".pkg-compact__item");
      if (!item) return;
      const wasOpen = item.classList.contains("is-open");
      root.querySelectorAll(".pkg-compact__item").forEach((el) => {
        el.classList.remove("is-open");
        const btn = el.querySelector(".pkg-compact__toggle");
        const panel = el.querySelector(".pkg-compact__panel");
        if (btn) btn.setAttribute("aria-expanded", "false");
        if (panel) panel.hidden = true;
      });
      if (!wasOpen) {
        item.classList.add("is-open");
        toggle.setAttribute("aria-expanded", "true");
        const panel = item.querySelector(".pkg-compact__panel");
        if (panel) panel.hidden = false;
      }
    });
  }

  function initSmoothScroll() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      window.scrollTo({ top, behavior: "smooth" });
      if (window.TinyChrome) window.TinyChrome.closeDrawer();
    });
  }

  function initFaq() {
    const items = document.querySelectorAll(".faq__item");
    items.forEach((item) => {
      const btn = item.querySelector(".faq__trigger");
      const marker = item.querySelector(".faq__marker");
      if (!btn) return;
      btn.addEventListener("click", () => {
        const wasOpen = item.classList.contains("is-open");
        items.forEach((other) => {
          other.classList.remove("is-open");
          const ob = other.querySelector(".faq__trigger");
          const om = other.querySelector(".faq__marker");
          if (ob) ob.setAttribute("aria-expanded", "false");
          if (om) om.textContent = "+";
        });
        if (!wasOpen) {
          item.classList.add("is-open");
          btn.setAttribute("aria-expanded", "true");
          if (marker) marker.textContent = "–";
        }
      });
    });
  }

  function playVideo(el) {
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.removeAttribute("autoplay");
      el.pause();
      return;
    }
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    const p = el.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        el.style.display = "none";
      });
    }
  }

  function initVideos() {
    playVideo(document.getElementById("hero-video-desktop"));
    playVideo(document.getElementById("hero-video-mobile"));
  }

  function initOfferSlider() {
    const root = document.querySelector(".offer-slider");
    if (!root) return;
    const track = root.querySelector(".offer-slider__track");
    const slides = Array.from(root.querySelectorAll(".offer-slider__slide"));
    const dotsHost = root.querySelector(".offer-slider__dots");
    const prev = root.querySelector(".offer-slider__nav--prev");
    const next = root.querySelector(".offer-slider__nav--next");
    const viewport = root.querySelector(".offer-slider__viewport");
    if (!track || !slides.length || !dotsHost) return;

    let index = 0;
    let timer = null;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const AUTO_MS = 5500;

    dotsHost.innerHTML = slides
      .map(
        (_, i) =>
          `<button type="button" class="offer-slider__dot${i === 0 ? " is-active" : ""}" aria-label="Show slide ${
            i + 1
          }" role="tab" aria-selected="${i === 0}"></button>`
      )
      .join("");

    const dots = Array.from(dotsHost.querySelectorAll(".offer-slider__dot"));

    function goTo(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots.forEach((dot, i) => {
        dot.classList.toggle("is-active", i === index);
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
      });
    }

    function stopAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function startAuto() {
      stopAuto();
      if (reduceMotion) return;
      timer = setInterval(() => goTo(index + 1), AUTO_MS);
    }

    if (prev) prev.addEventListener("click", () => {
      goTo(index - 1);
      startAuto();
    });
    if (next) next.addEventListener("click", () => {
      goTo(index + 1);
      startAuto();
    });
    dots.forEach((dot, i) => {
      dot.addEventListener("click", () => {
        goTo(i);
        startAuto();
      });
    });

    let touchX = null;
    if (viewport) {
      viewport.addEventListener(
        "touchstart",
        (e) => {
          touchX = e.changedTouches[0].clientX;
          stopAuto();
        },
        { passive: true }
      );
      viewport.addEventListener(
        "touchend",
        (e) => {
          if (touchX == null) return;
          const dx = e.changedTouches[0].clientX - touchX;
          touchX = null;
          if (Math.abs(dx) > 40) goTo(index + (dx < 0 ? 1 : -1));
          startAuto();
        },
        { passive: true }
      );
      viewport.addEventListener("mouseenter", stopAuto);
      viewport.addEventListener("mouseleave", startAuto);
      viewport.addEventListener("focusin", stopAuto);
      viewport.addEventListener("focusout", startAuto);
      viewport.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          goTo(index - 1);
          startAuto();
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          goTo(index + 1);
          startAuto();
        }
      });
    }

    goTo(0);
    startAuto();
  }

  function initWhatsAppTracking() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-wa]");
      if (!a) return;
      track("whatsapp_click", { button: a.getAttribute("data-wa") });
    });
  }

  function initMobileSticky() {
    const bar = document.getElementById("mobile-sticky");
    const hero = document.querySelector(".hero");
    if (!bar || !hero) return;

    const update = () => {
      const isMobile = window.matchMedia("(max-width: 900px)").matches;
      if (!isMobile) {
        bar.classList.remove("is-visible");
        return;
      }
      const pastHero = window.scrollY > hero.offsetHeight * 0.6;
      bar.classList.toggle("is-visible", pastHero);
    };

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadPackages();
    initSmoothScroll();
    initFaq();
    initVideos();
    initOfferSlider();
    initWhatsAppTracking();
    initMobileSticky();
  });
})();
