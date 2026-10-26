(() => {
  "use strict";

  const HEADER_OFFSET = 80;

  const DEFAULT_PACKAGES = {
    legal:
      "Extra guests +150k per person on weekdays, +300k on weekends, up to each package's maximum. Adults and children both count. Every party runs 3 hours. Weekday starting rates shown; weekend rates are higher. Prices exclude 5% service and 10% tax. Custom combinations available on request.",
    legalMobile:
      "Adults and children both count. Extra guests +150k weekdays / +300k weekends. Prices exclude 5% service and 10% tax.",
    packages: [
      {
        id: "simple",
        name: "Simple celebration",
        shortName: "Simple celebration",
        guests: "5 guests included · add up to 9",
        guestsIncluded: 5,
        guestsMax: 9,
        cakeSize: "15cm",
        priceWeekend: "IDR 3.8M",
        flags: { photozone: false, pinata: false, masterclass: false, dessertStation: false, privateTerrace: false },
        price: "IDR 2.3M",
        featured: false,
        features: [
          "Birthday cake · 15cm, 2 layers",
          "Requested themed party",
          "Table decor (no flowers)",
          "Simple balloon decor",
          "Food & drink credit · 750k weekday / 1.5M weekend. Extra orders are charged from the menu.",
        ],
        mobileSummary: "5 guests · cake 15cm · themed party · table & balloon decor",
      },
      {
        id: "signature",
        name: "Signature themed party",
        shortName: "Signature themed party",
        guests: "10 guests included · add up to 20",
        guestsIncluded: 10,
        guestsMax: 20,
        cakeSize: "18cm",
        priceWeekend: "IDR 8.7M",
        flags: { photozone: true, pinata: false, masterclass: false, dessertStation: false, privateTerrace: false },
        price: "IDR 5.3M",
        featured: false,
        features: [
          "Birthday cake · 18cm, 2 layers",
          "Requested themed party",
          "Medium balloon decor",
          "Photozone",
          "Food & drink credit · 1.5M weekday / 3M weekend. Extra orders are charged from the menu.",
        ],
        mobileSummary: "10 guests · cake 18cm · themed decor · medium balloons · photozone",
      },
      {
        id: "terrace",
        name: "Private terrace event",
        shortName: "Private terrace event",
        guests: "20 guests included · add up to 35",
        guestsIncluded: 20,
        guestsMax: 35,
        cakeSize: "22cm",
        priceWeekend: "IDR 20.5M",
        flags: { photozone: true, pinata: true, masterclass: true, dessertStation: true, privateTerrace: true },
        price: "IDR 12.7M",
        featured: false,
        features: [
          "Birthday cake · 22cm, 2 layers",
          "Whole private terrace",
          "Full terrace balloon decor",
          "Photozone & piñata",
          "Dessert station",
          "Masterclass for 10 kids",
          "Food & drink credit · 3M weekday / 6M weekend. Extra orders are charged from the menu.",
        ],
        mobileSummary: "20 guests · cake 22cm · piñata · dessert station · private terrace · masterclass",
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
    return `builder/?package=${encodeURIComponent(pkg.id)}`;
  }

  function packagesJsonUrl() {
    if (window.TINY_WP && window.TINY_WP.packagesJson) return window.TINY_WP.packagesJson;
    return "data/packages.json";
  }

  async function loadPackages() {
    const grid = document.getElementById("packages-grid");
    const compact = document.getElementById("packages-compact");
    const legal = document.getElementById("packages-legal");
    if (!grid || !compact) return;

    if (grid.hasAttribute("data-wp-managed")) {
      initPackageScreen();
      initPackageCards(grid);
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

    packageCatalog = data.packages;
    grid.innerHTML = data.packages
      .map((pkg, index) => {
        const prev = index > 0 ? data.packages[index - 1] : null;
        const plusLine = prev
          ? `<li class="pkg__plus">Everything in ${escapeHtml(prev.shortName || prev.name)}, plus:</li>`
          : "";
        const features = (pkg.features || [])
          .map((f) => `<li>${escapeHtml(f)}</li>`)
          .join("");
        const badge = pkg.badge
          ? `<span class="pkg__badge">${escapeHtml(pkg.badge)}</span>`
          : "";
        const photo = `builder/img/packages/${encodeURIComponent(pkg.id)}.jpg`;
        return `
          <button type="button" class="pkg" data-package="${escapeHtml(pkg.id)}">
            <img class="pkg__photo" src="${photo}" alt="" width="480" height="360" loading="lazy">
            ${badge}
            <h3>${escapeHtml(pkg.name)}</h3>
            <div class="pkg__guests">${escapeHtml(pkg.guests)}</div>
            <div class="pkg__price">${escapeHtml(pkg.price)}</div>
            <ul class="pkg__features">${plusLine}${features}</ul>
            <span class="pkg__cta">Customise this →</span>
          </button>`;
      })
      .join("");

    renderLandingCompare(data);

    compact.innerHTML = data.packages
      .map((pkg, index) => {
        const isOpen = index === 0;
        const badge = pkg.badge
          ? `<span class="pkg-compact__badge">${escapeHtml(pkg.badge)}</span>`
          : "";
        return `
        <div class="pkg-compact__item${isOpen ? " is-open" : ""}" data-pkg="${escapeHtml(pkg.id)}">
          <button type="button" class="pkg-compact__toggle" aria-expanded="${isOpen}">
            ${badge}
            <span class="pkg-compact__name">${escapeHtml(pkg.shortName || pkg.name)}</span>
            <span class="pkg-compact__price">${escapeHtml(pkg.price)}</span>
          </button>
          <div class="pkg-compact__panel"${isOpen ? "" : " hidden"}>
            <img class="pkg-compact__photo" src="builder/img/packages/${encodeURIComponent(pkg.id)}.jpg" alt="" width="480" height="300" loading="lazy">
            <span class="pkg-compact__summary">${escapeHtml(pkg.mobileSummary || "")}</span>
            <button type="button" class="pkg-compact__cta" data-package="${escapeHtml(pkg.id)}">Customise this →</button>
          </div>
        </div>`;
      })
      .join("");

    initPackageScreen();
    initPackageCards(grid);
    initPackageAccordion(compact);
  }

  let packageCatalog = [];

  function includedItems(pkg) {
    const items = (pkg.features || []).slice();
    const inherited = pkg.id === "signature" ? ["Table decor"] : pkg.id === "terrace" ? ["Requested themed party", "Table decor"] : [];
    inherited.forEach((line) => {
      if (items.some((item) => item.toLowerCase().startsWith(line.toLowerCase()))) return;
      const afterTheme = items.findIndex((item) => /themed party/i.test(item));
      const afterCake = items.findIndex((item) => /cake/i.test(item));
      const at = afterTheme >= 0 ? afterTheme + 1 : afterCake >= 0 ? afterCake + 1 : 0;
      items.splice(at, 0, line);
    });
    return items;
  }

  // Variant C (review §6): differences-only table, driven by the same
  // packages.json fields the builder uses (guestsMax, cakeSize, flags).
  function renderLandingCompare(data) {
    const host = document.getElementById("package-compare");
    if (!host || !Array.isArray(data?.packages) || !data.packages.length) return;
    const packages = data.packages;
    const yes = (on) => (on ? "✓" : "—");
    const rows = [
      { label: "Weekday", cell: (p) => p.price || "—" },
      { label: "Weekend", cell: (p) => p.priceWeekend || "—" },
      { label: "Guests", cell: (p) => (p.guestsMax ? `≤${p.guestsMax}` : p.guests || "—") },
      { label: "Cake", cell: (p) => p.cakeSize || "—" },
      { label: "Photozone", cell: (p) => yes(p.flags?.photozone) },
      { label: "Piñata", cell: (p) => yes(p.flags?.pinata) },
      { label: "Masterclass", cell: (p) => (p.flags?.masterclass ? "10 kids" : "—") },
      { label: "Dessert station", cell: (p) => yes(p.flags?.dessertStation) },
      { label: "Private terrace", cell: (p) => yes(p.flags?.privateTerrace) },
    ];
    const shared = [
      { label: "Duration", cell: () => "3 hours" },
      { label: "Themed party", cell: () => "✓" },
      { label: "Table decor", cell: () => "✓ included in full decor" },
    ];
    const renderRows = (list, cls) =>
      list
        .map(
          (row) =>
            `<tr${cls ? ` class="${cls}" hidden` : ""}><td>${escapeHtml(row.label)}</td>${packages
              .map((p) => {
                const v = row.cell(p);
                return `<td class="${v === "✓" || v === "10 kids" ? "yes" : v === "—" ? "no" : ""}">${escapeHtml(v)}</td>`;
              })
              .join("")}</tr>`
        )
        .join("");
    host.innerHTML = `
      <h3 class="pkg-compare__title">Compare Packages</h3>
      <label class="pkg-compare__toggle"><input type="checkbox" id="landing-compare-diffs" checked> Show only differences</label>
      <div class="pkg-compare__scroll">
        <table class="ctable" aria-label="Compare Packages">
          <tr><th></th>${packages.map((p) => `<th>${escapeHtml(p.shortName || p.name)}</th>`).join("")}</tr>
          ${renderRows(rows)}
          ${renderRows(shared, "ctable__shared")}
        </table>
      </div>
      <p class="packages__legal">Prices exclude 5% service and 10% tax.</p>`;
    host.querySelector("#landing-compare-diffs")?.addEventListener("change", (e) => {
      host.querySelectorAll(".ctable__shared").forEach((row) => {
        row.hidden = e.target.checked;
      });
    });
  }

  function initPackageScreen() {
    const screen = document.getElementById("pkg-screen");
    if (!screen || screen.dataset.bound) return;
    screen.dataset.bound = "1";
    screen.querySelectorAll("[data-close-package]").forEach((el) => {
      el.addEventListener("click", closePackageScreen);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !screen.hidden) closePackageScreen();
    });
  }

  function openPackageScreen(id) {
    const pkg = packageCatalog.find((item) => item.id === id);
    const screen = document.getElementById("pkg-screen");
    if (!pkg || !screen) return;
    const photo = screen.querySelector(".pkg-screen__photo");
    const title = screen.querySelector(".pkg-screen__title");
    const guests = screen.querySelector(".pkg-screen__guests");
    const price = screen.querySelector(".pkg-screen__price");
    const list = screen.querySelector(".pkg-screen__list");
    const cta = screen.querySelector(".pkg-screen__cta");
    if (photo) {
      photo.src = `builder/img/packages/${encodeURIComponent(pkg.id)}.jpg`;
      photo.alt = pkg.name;
    }
    if (title) title.textContent = pkg.name;
    if (guests) guests.textContent = pkg.guests || "";
    if (price) price.textContent = pkg.price || "";
    if (list) {
      list.innerHTML = includedItems(pkg)
        .map((item) => `<li>${escapeHtml(item)}</li>`)
        .join("");
    }
    if (cta) cta.href = `${packageBuilderUrl(pkg)}#details`;
    screen.hidden = false;
    document.body.classList.add("pkg-screen-open");
    screen.scrollTop = 0;
  }

  function closePackageScreen() {
    const screen = document.getElementById("pkg-screen");
    if (!screen) return;
    screen.hidden = true;
    document.body.classList.remove("pkg-screen-open");
  }

  function initPackageCards(root) {
    if (!root || root.dataset.cardsBound) return;
    root.dataset.cardsBound = "1";
    root.addEventListener("click", (event) => {
      const card = event.target.closest(".pkg");
      if (!card || !root.contains(card)) return;
      openPackageScreen(card.dataset.package);
    });
  }

  function initPackageAccordion(root) {
    if (!root || root.dataset.accordionBound) return;
    root.dataset.accordionBound = "1";
    root.addEventListener("click", (e) => {
      const openScreen = e.target.closest("[data-package]");
      if (openScreen && root.contains(openScreen)) {
        e.preventDefault();
        openPackageScreen(openScreen.dataset.package);
        return;
      }
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
      if (a.getAttribute("data-wa") === "tasting_requested") track("tasting_requested");
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

  function initComparePhotos() {
    const box = document.getElementById("pkg-lightbox");
    const img = document.getElementById("pkg-lightbox-img");
    const name = document.getElementById("pkg-lightbox-name");
    if (!box || !img || !name) return;
    const close = () => {
      box.hidden = true;
      box.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };
    const open = (src, title) => {
      if (!src) return;
      img.src = src;
      img.alt = title || "Package photo";
      name.textContent = title || "";
      box.hidden = false;
      box.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    };
    document.querySelectorAll(".pkg-compare__photo").forEach((btn) => {
      btn.addEventListener("click", () => open(btn.dataset.expandSrc, btn.dataset.expandAlt));
    });
    box.querySelector(".pkg-lightbox__close")?.addEventListener("click", close);
    box.addEventListener("click", (e) => {
      if (e.target === box) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !box.hidden) close();
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    track("landing_view");
    loadPackages();
    initSmoothScroll();
    initFaq();
    initVideos();
    initOfferSlider();
    initWhatsAppTracking();
    initMobileSticky();
    initComparePhotos();
  });
})();
