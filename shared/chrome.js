(() => {
  "use strict";

  const WA_TASTING =
    "https://wa.me/6282147830142?text=" +
    encodeURIComponent("Hi Tiny! I'd like to book a free cake tasting.");

  const PATHS = {
    landing: {
      birthdays: "./",
      cakes: "../cakes/",
      builder: "./builder/",
      logoDark: "img/logo-dark.png",
      logoLight: "img/logo-light.png",
    },
    builder: {
      birthdays: "../",
      cakes: "../../cakes/",
      builder: "./",
      logoDark: "../img/logo-dark.png",
      logoLight: "../img/logo-light.png",
    },
    cakes: {
      birthdays: "../birthdays/",
      cakes: "./",
      builder: "../birthdays/builder/",
      logoDark: "img/logo-dark.png",
      logoLight: "img/logo-light.png",
    },
  };

  const ICON_WA =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
  const ICON_IG =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>';
  const ICON_MAP =
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>';

  function current(page, key) {
    return page === key ? " is-current" : "";
  }

  function headerHtml(page, p) {
    return `
    <header class="site-header" id="top">
      <a class="site-header__logo" href="https://tinyhealthycafe.com/" aria-label="Tiny Healthy Cafe home">
        <img src="${p.logoDark}" alt="Tiny" height="48">
      </a>
      <nav class="site-nav" aria-label="Site">
        <a class="${current(page, "landing").trim()}" href="${p.birthdays}">About Birthdays</a>
        <a class="${current(page, "cakes").trim()}" href="${p.cakes}">Build a Cake</a>
        <a class="${current(page, "builder").trim()}" href="${p.builder}">Build your party</a>
      </nav>
      <div class="site-header__cta">
        <span class="site-header__caption">Free tasting · no deposit</span>
        <a class="btn" href="${WA_TASTING}" target="_blank" rel="noopener noreferrer" data-wa="header_tasting">Book a free cake tasting</a>
      </div>
      <button class="menu-toggle" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-drawer">
        <span class="menu-toggle__bars" aria-hidden="true"></span>
      </button>
    </header>
    <div class="nav-drawer" id="nav-drawer" aria-hidden="true">
      <div class="nav-drawer__panel" role="dialog" aria-label="Navigation">
        <button class="nav-drawer__close" type="button" aria-label="Close menu">&times;</button>
        <a class="${current(page, "landing").trim()}" href="${p.birthdays}">About Birthdays</a>
        <a class="${current(page, "cakes").trim()}" href="${p.cakes}">Build a Cake</a>
        <a class="${current(page, "builder").trim()}" href="${p.builder}">Build your party</a>
        <a href="${WA_TASTING}" target="_blank" rel="noopener noreferrer" data-wa="drawer_tasting">Book a free cake tasting</a>
      </div>
    </div>`;
  }

  function footerHtml(page, p) {
    return `
    <footer class="site-footer">
      <div class="site-footer__brand">
        <img src="${p.logoLight}" alt="Tiny" height="48">
        <span>Tiny Healthy Cafe · Berawa, Bali, Indonesia</span>
      </div>
      <nav class="site-footer__pages" aria-label="Site pages">
        <a class="${current(page, "landing").trim()}" href="${p.birthdays}">About Birthdays</a>
        <a class="${current(page, "cakes").trim()}" href="${p.cakes}">Build a Cake</a>
        <a class="${current(page, "builder").trim()}" href="${p.builder}">Build your party</a>
      </nav>
      <div class="site-footer__links">
        <a class="footer-link" href="https://wa.me/6282147830142" target="_blank" rel="noopener noreferrer" data-wa="footer_whatsapp" aria-label="WhatsApp +62 821 4783 0142">
          <span class="footer-link__icon">${ICON_WA}</span>
          <span class="footer-link__label">+62 821 4783 0142</span>
        </a>
        <a class="footer-link" href="https://www.instagram.com/tiny.cafe.bali/" target="_blank" rel="noopener noreferrer" aria-label="Instagram @tiny.cafe.bali">
          <span class="footer-link__icon">${ICON_IG}</span>
          <span class="footer-link__label">@tiny.cafe.bali</span>
        </a>
        <a class="footer-link" href="https://maps.app.goo.gl/Sftcte5sWdBqkguJ8" target="_blank" rel="noopener noreferrer" aria-label="Google Maps Berawa, Bali">
          <span class="footer-link__icon">${ICON_MAP}</span>
          <span class="footer-link__label">Berawa, Bali</span>
        </a>
        <span class="footer-phone">+62 821 4783 0142</span>
      </div>
    </footer>`;
  }

  function openDrawer() {
    const drawer = document.getElementById("nav-drawer");
    const toggle = document.querySelector(".menu-toggle");
    if (!drawer) return;
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    if (toggle) toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeDrawer() {
    const drawer = document.getElementById("nav-drawer");
    const toggle = document.querySelector(".menu-toggle");
    if (!drawer) return;
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
    if (!document.querySelector(".lightbox.is-open")) {
      document.body.style.overflow = "";
    }
  }

  function initDrawer() {
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
    drawer?.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", closeDrawer);
    });
  }

  window.TinyChrome = { openDrawer, closeDrawer };

  document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.getAttribute("data-page") || "landing";
    const p = PATHS[page] || PATHS.landing;
    const headerHost = document.getElementById("site-chrome-header");
    const footerHost = document.getElementById("site-chrome-footer");
    if (headerHost) headerHost.innerHTML = headerHtml(page, p);
    if (footerHost) footerHost.innerHTML = footerHtml(page, p);
    document.body.classList.add("has-site-header");
    const syncHeaderH = () => {
      const header = document.querySelector(".site-header");
      if (!header) return;
      document.documentElement.style.setProperty(
        "--site-header-h",
        `${Math.ceil(header.getBoundingClientRect().height)}px`
      );
    };
    syncHeaderH();
    window.addEventListener("resize", syncHeaderH);
    if (window.ResizeObserver) {
      const header = document.querySelector(".site-header");
      if (header) new ResizeObserver(syncHeaderH).observe(header);
    }
    initDrawer();
  });
})();
