(() => {
  "use strict";

  const WA_BASE = "https://wa.me/6282147830142";
  const HEADER_OFFSET = 80;

  const COUNTRIES = [
    { iso: "ID", name: "Indonesia", dial: "62", flag: "🇮🇩" },
    { iso: "AU", name: "Australia", dial: "61", flag: "🇦🇺" },
    { iso: "SG", name: "Singapore", dial: "65", flag: "🇸🇬" },
    { iso: "MY", name: "Malaysia", dial: "60", flag: "🇲🇾" },
    { iso: "US", name: "United States", dial: "1", flag: "🇺🇸" },
    { iso: "GB", name: "United Kingdom", dial: "44", flag: "🇬🇧" },
    { iso: "RU", name: "Russia", dial: "7", flag: "🇷🇺" },
    { iso: "DE", name: "Germany", dial: "49", flag: "🇩🇪" },
    { iso: "FR", name: "France", dial: "33", flag: "🇫🇷" },
    { iso: "NL", name: "Netherlands", dial: "31", flag: "🇳🇱" },
    { iso: "IT", name: "Italy", dial: "39", flag: "🇮🇹" },
    { iso: "ES", name: "Spain", dial: "34", flag: "🇪🇸" },
    { iso: "PT", name: "Portugal", dial: "351", flag: "🇵🇹" },
    { iso: "IN", name: "India", dial: "91", flag: "🇮🇳" },
    { iso: "JP", name: "Japan", dial: "81", flag: "🇯🇵" },
    { iso: "KR", name: "South Korea", dial: "82", flag: "🇰🇷" },
    { iso: "CN", name: "China", dial: "86", flag: "🇨🇳" },
    { iso: "HK", name: "Hong Kong", dial: "852", flag: "🇭🇰" },
    { iso: "TW", name: "Taiwan", dial: "886", flag: "🇹🇼" },
    { iso: "TH", name: "Thailand", dial: "66", flag: "🇹🇭" },
    { iso: "VN", name: "Vietnam", dial: "84", flag: "🇻🇳" },
    { iso: "PH", name: "Philippines", dial: "63", flag: "🇵🇭" },
    { iso: "NZ", name: "New Zealand", dial: "64", flag: "🇳🇿" },
    { iso: "CA", name: "Canada", dial: "1", flag: "🇨🇦" },
    { iso: "AE", name: "United Arab Emirates", dial: "971", flag: "🇦🇪" },
    { iso: "SA", name: "Saudi Arabia", dial: "966", flag: "🇸🇦" },
    { iso: "ZA", name: "South Africa", dial: "27", flag: "🇿🇦" },
    { iso: "BR", name: "Brazil", dial: "55", flag: "🇧🇷" },
    { iso: "MX", name: "Mexico", dial: "52", flag: "🇲🇽" },
    { iso: "PL", name: "Poland", dial: "48", flag: "🇵🇱" },
    { iso: "UA", name: "Ukraine", dial: "380", flag: "🇺🇦" },
    { iso: "SE", name: "Sweden", dial: "46", flag: "🇸🇪" },
    { iso: "NO", name: "Norway", dial: "47", flag: "🇳🇴" },
    { iso: "DK", name: "Denmark", dial: "45", flag: "🇩🇰" },
    { iso: "FI", name: "Finland", dial: "358", flag: "🇫🇮" },
    { iso: "CH", name: "Switzerland", dial: "41", flag: "🇨🇭" },
    { iso: "AT", name: "Austria", dial: "43", flag: "🇦🇹" },
    { iso: "BE", name: "Belgium", dial: "32", flag: "🇧🇪" },
    { iso: "IE", name: "Ireland", dial: "353", flag: "🇮🇪" },
    { iso: "TR", name: "Turkey", dial: "90", flag: "🇹🇷" },
  ];

  let selectedCountry = COUNTRIES[0];

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

  function waUrl(text) {
    return `${WA_BASE}?text=${encodeURIComponent(text)}`;
  }

  function packageWaMessage(pkg) {
    return `Hi Tiny! I'm interested in the ${pkg.name} (${pkg.price}).`;
  }

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
        shortName: "Private terrace",
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

  function packageBuilderUrl(pkg) {
    return `builder/?package=${encodeURIComponent(pkg.id)}`;
  }

  async function loadPackages() {
    const grid = document.getElementById("packages-grid");
    const compact = document.getElementById("packages-compact");
    const legal = document.getElementById("packages-legal");
    if (!grid || !compact) return;

    let data = DEFAULT_PACKAGES;
    if (location.protocol !== "file:") {
      try {
        const res = await fetch("data/packages.json");
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
          <a class="pkg${pkg.featured ? " pkg--featured" : ""}" href="${packageBuilderUrl(
            pkg
          )}" data-wa="package_${pkg.id}">
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
            <a class="pkg-compact__cta" href="${packageBuilderUrl(
              pkg
            )}" data-wa="package_${pkg.id}_mobile">Build with this →</a>
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

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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
      closeDrawer();
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

  function openDrawer() {
    if (window.TinyChrome) {
      window.TinyChrome.openDrawer();
      return;
    }
    const drawer = document.getElementById("nav-drawer");
    const toggle = document.querySelector(".menu-toggle");
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    if (window.TinyChrome) {
      window.TinyChrome.closeDrawer();
      return;
    }
    const drawer = document.getElementById("nav-drawer");
    const toggle = document.querySelector(".menu-toggle");
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  function initDrawer() {
    /* Shared chrome.js owns the drawer when present */
    if (document.getElementById("site-chrome-header")) return;
    const toggle = document.querySelector(".menu-toggle");
    const drawer = document.getElementById("nav-drawer");
    const closeBtn = document.querySelector(".nav-drawer__close");
    if (toggle) toggle.addEventListener("click", openDrawer);
    if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
    if (drawer) {
      drawer.addEventListener("click", (e) => {
        if (e.target === drawer) closeDrawer();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDrawer();
    });
  }

  function setCountry(country) {
    selectedCountry = country;
    const flag = document.getElementById("country-flag");
    const dial = document.getElementById("country-dial");
    if (flag) flag.textContent = country.flag;
    if (dial) dial.textContent = `+${country.dial}`;
  }

  function renderCountryList(filter) {
    const picker = document.getElementById("country-picker");
    if (!picker) return;
    const q = (filter || "").trim().toLowerCase();
    const list = COUNTRIES.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.iso.toLowerCase().includes(q)
    );
    picker.innerHTML = `
      <input class="country-picker__search" type="search" placeholder="Search country" aria-label="Search country">
      ${list
        .map(
          (c) => `
        <button type="button" role="option" data-iso="${c.iso}" aria-selected="${
            c.iso === selectedCountry.iso
          }">
          <span>${c.flag}</span>
          <span>${escapeHtml(c.name)}</span>
          <span style="margin-left:auto;color:#8a9c8f">+${c.dial}</span>
        </button>`
        )
        .join("")}`;

    const search = picker.querySelector(".country-picker__search");
    if (search) {
      search.addEventListener("input", () => renderCountryList(search.value));
      search.focus();
    }
    picker.querySelectorAll("button[data-iso]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const country = COUNTRIES.find((c) => c.iso === btn.dataset.iso);
        if (country) setCountry(country);
        closeCountryPicker();
      });
    });
  }

  function openCountryPicker() {
    const picker = document.getElementById("country-picker");
    const btn = document.getElementById("country-btn");
    if (!picker) return;
    picker.classList.add("is-open");
    if (btn) btn.setAttribute("aria-expanded", "true");
    renderCountryList("");
  }

  function closeCountryPicker() {
    const picker = document.getElementById("country-picker");
    const btn = document.getElementById("country-btn");
    if (!picker) return;
    picker.classList.remove("is-open");
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function initCountryPicker() {
    const btn = document.getElementById("country-btn");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const picker = document.getElementById("country-picker");
        if (picker && picker.classList.contains("is-open")) closeCountryPicker();
        else openCountryPicker();
      });
    }
    document.addEventListener("click", (e) => {
      const phone = document.querySelector(".pdf-form__phone");
      if (phone && !phone.contains(e.target)) closeCountryPicker();
    });

    // Best-effort IP country preselect (skipped on file://)
    if (location.protocol !== "file:") {
      fetch("https://ipapi.co/json/")
        .then((r) => r.json())
        .then((data) => {
          if (!data || !data.country_code) return;
          const match = COUNTRIES.find((c) => c.iso === data.country_code);
          if (match) setCountry(match);
        })
        .catch(() => {});
    }
  }

  function validatePhone(nationalNumber) {
    const cleaned = String(nationalNumber || "").replace(/\D/g, "");
    if (!cleaned) return { ok: false, message: "Please enter your WhatsApp number." };

    const lp = window.libphonenumber;
    const parseFn =
      lp &&
      (lp.parsePhoneNumberFromString ||
        lp.parsePhoneNumber ||
        (lp.default && (lp.default.parsePhoneNumberFromString || lp.default.parsePhoneNumber)));
    if (typeof parseFn === "function") {
      try {
        const phone = parseFn(cleaned, selectedCountry.iso);
        if (!phone || !phone.isValid()) {
          return { ok: false, message: "That number doesn’t look valid for the selected country." };
        }
        return { ok: true, e164: phone.format("E.164") };
      } catch (_) {
        return { ok: false, message: "That number doesn’t look valid." };
      }
    }

    if (cleaned.length < 7 || cleaned.length > 15) {
      return { ok: false, message: "Please enter a valid WhatsApp number." };
    }
    return { ok: true, e164: `+${selectedCountry.dial}${cleaned}` };
  }

  function getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
    const out = {};
    keys.forEach((k) => {
      const v = params.get(k);
      if (v) out[k] = v;
    });
    return out;
  }

  function initPdfForm() {
    const form = document.getElementById("pdf-form");
    const status = document.getElementById("pdf-status");
    const input = document.getElementById("phone-input");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (status) {
        status.textContent = "";
        status.className = "pdf-form__status";
      }

      const result = validatePhone(input ? input.value : "");
      if (!result.ok) {
        if (status) {
          status.textContent = result.message;
          status.classList.add("is-error");
        }
        return;
      }

      const utm = getUtmParams();
      const utmNote = Object.keys(utm).length
        ? ` (via ${Object.entries(utm)
            .map(([k, v]) => `${k}=${v}`)
            .join(", ")})`
        : "";

      const message = `Hi Tiny! Please send me the Tiny Birthday Packages 2026 PDF. My WhatsApp is ${result.e164}.${utmNote}`;
      track("pdf_form_submit", { country: selectedCountry.iso, ...utm });

      if (status) {
        status.textContent = "Sent — check WhatsApp";
        status.classList.add("is-success");
      }

      window.open(waUrl(message), "_blank", "noopener,noreferrer");
    });
  }

  function initWhatsAppTracking() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-wa]");
      if (!a) return;
      track("whatsapp_click", { button: a.getAttribute("data-wa") });
    });
  }

  function initScrollDepth() {
    const packages = document.getElementById("packages");
    if (!packages) return;
    let fired = false;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!fired && entry.isIntersecting) {
            fired = true;
            track("scroll_past_packages", {});
            obs.disconnect();
          }
        });
      },
      { threshold: 0.35 }
    );
    obs.observe(packages);
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
    initDrawer();
    initWhatsAppTracking();
    initScrollDepth();
    initMobileSticky();
  });
})();
