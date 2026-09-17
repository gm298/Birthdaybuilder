(() => {
  "use strict";

  const WA_BASE = "https://wa.me/6282147830142";
  const HEADER_OFFSET = 90;
  const GALLERY_PREVIEW = 6;
  const DIET_NONE = "No special requirements";

  const SPONGE_FLOURLESS = "Flourless Zucchini Chocolate (Gluten free)";
  const SPONGES_ALL = [
    "Wholewheat kale & apple",
    "Wholewheat pumpkin cacao",
    SPONGE_FLOURLESS,
    "Wholewheat almond cake",
  ];
  const SPONGES_NO_SUGAR = SPONGES_ALL.slice();
  const SUGAR_SPONGES = ["Red Velvet", "Chocolate"];

  const DEFAULT_DATA = {
    sizes: [
      { label: "15 cm", note: "Small family table — about 8–10 slices", line: "15 cm — IDR 1M · small family table, about 8–10 slices.", price: "IDR 1M" },
      { label: "18 cm", note: "The usual birthday size — about 12–16 slices", line: "18 cm — IDR 1.5M · the usual birthday size, about 12–16 slices.", price: "IDR 1.5M" },
      { label: "22 cm", note: "Bigger parties — about 20–25 slices", line: "22 cm — IDR 1.8M · bigger parties, about 20–25 slices.", price: "IDR 1.8M" },
    ],
    sponges: SPONGES_ALL.slice(),
    sugarSponges: SUGAR_SPONGES.slice(),
    addons: ["Gluten-free", "No added sugar"],
    filters: ["All", "Animals", "Dinosaurs", "Vehicles", "Ocean", "Characters", "Flowers", "First birthday"],
    cakes: [
      { id: "safari-chocolate", src: "img/cakes/safari-chocolate.jpg", name: "Chocolate safari", theme: "Animals" },
      { id: "dino-meadow", src: "img/cakes/dino-meadow.jpg", name: "Dino meadow", theme: "Dinosaurs" },
      { id: "dino-sand-first", src: "img/cakes/dino-sand-first.jpg", name: "Dino sands, first birthday", theme: "Dinosaurs · first birthday" },
      { id: "digger-berries", src: "img/cakes/digger-berries.jpg", name: "Digger and berries", theme: "Vehicles" },
      { id: "construction-crane", src: "img/cakes/construction-crane.jpg", name: "Construction site", theme: "Vehicles · named" },
      { id: "race-cars", src: "img/cakes/race-cars.jpg", name: "Race day", theme: "Vehicles" },
      { id: "car-clouds", src: "img/cakes/car-clouds.jpg", name: "Little blue car", theme: "Vehicles · first birthdays" },
      { id: "ocean-tiers", src: "img/cakes/ocean-tiers.jpg", name: "Ocean two-tier", theme: "Ocean" },
      { id: "undersea-heroes", src: "img/cakes/undersea-heroes.jpg", name: "Undersea friends", theme: "Ocean · characters" },
      { id: "superhero-city", src: "img/cakes/superhero-city.jpg", name: "Superhero city", theme: "Characters" },
      { id: "rescue-heroes", src: "img/cakes/rescue-heroes.jpg", name: "Rescue crew", theme: "Characters · named" },
      { id: "blue-characters", src: "img/cakes/blue-characters.jpg", name: "Blue friends", theme: "Characters · named" },
      { id: "rainbow-neon", src: "img/cakes/rainbow-neon.jpg", name: "Rainbow party", theme: "Bright and bold" },
      { id: "pastel-sleepy", src: "img/cakes/pastel-sleepy.jpg", name: "Sleepy pastel", theme: "Bright and bold" },
      { id: "sky-clouds-first", src: "img/cakes/sky-clouds-first.jpg", name: "Clouds and sky, first birthday", theme: "First birthday" },
      { id: "unicorn-meadow", src: "img/cakes/unicorn-meadow.jpg", name: "Unicorn meadow", theme: "Flowers" },
      { id: "pink-blossom", src: "img/cakes/pink-blossom.jpg", name: "Pink blossom", theme: "Flowers" },
      { id: "flamingo-garden", src: "img/cakes/flamingo-garden.jpg", name: "Flamingo garden", theme: "Flowers" },
      { id: "forest-pines", src: "img/cakes/forest-pines.jpg", name: "Pine forest", theme: "Forest" },
      { id: "chocolate-gold", src: "img/cakes/chocolate-gold.jpg", name: "Chocolate and gold", theme: "Classic" },
    ],
  };

  const state = {
    filter: "All",
    size: "18 cm",
    sponges: [],
    sugarSponge: [],
    mode: "gallery",
    design: "",
    theme: "",
    addons: [],
    fileName: "",
    file: null,
    activeCake: null,
    galleryExpanded: false,
  };

  let data = DEFAULT_DATA;

  function track(eventName, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params || {});
      } else if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: eventName, ...(params || {}) });
      }
    } catch (_) {
      /* optional */
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cakeSrc(src) {
    if (!src) return "";
    if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
    const base = window.TINY_WP && window.TINY_WP.cakesAssetBase;
    if (base) return base.replace(/\/?$/, "/") + String(src).replace(/^\.\//, "");
    return src;
  }

  function normalizeData(raw) {
    return {
      ...raw,
      cakes: (raw.cakes || []).map((c) => ({ ...c, src: cakeSrc(c.src) })),
      sponges: SPONGES_ALL.slice(),
      sugarSponges: (raw.sugarSponges || SUGAR_SPONGES).slice(),
      addons: raw.addons || ["Gluten-free", "No added sugar"],
    };
  }

  function availableSponges() {
    const gf = state.addons.includes("Gluten-free");
    const noSugar = state.addons.includes("No added sugar");
    if (gf) return [SPONGE_FLOURLESS];
    if (noSugar) return SPONGES_NO_SUGAR.slice();
    return SPONGES_ALL.slice();
  }

  function syncSugarSpongeVisibility() {
    const field = document.getElementById("sugar-sponge-field");
    const hide =
      state.addons.includes("No added sugar") || state.addons.includes("Gluten-free");
    if (hide) {
      state.sugarSponge = [];
      if (field) field.hidden = true;
    } else if (field) {
      field.hidden = false;
    }
  }

  function selectedSugarSponges() {
    if (Array.isArray(state.sugarSponge)) return state.sugarSponge;
    return state.sugarSponge ? [state.sugarSponge] : [];
  }

  function flavourItems() {
    return [
      ...state.sponges.map((label) => ({ kind: "plain", label })),
      ...selectedSugarSponges().map((label) => ({ kind: "sugar", label })),
    ];
  }

  function applyFlavourItems(items) {
    state.sponges = items.filter((item) => item.kind === "plain").map((item) => item.label);
    state.sugarSponge = items.filter((item) => item.kind === "sugar").map((item) => item.label);
  }

  function flavourCount() {
    return flavourItems().length;
  }

  function toggleFlavour(kind, label) {
    let items = flavourItems();
    const index = items.findIndex((item) => item.kind === kind && item.label === label);
    if (index >= 0) items.splice(index, 1);
    else {
      items.push({ kind, label });
      if (items.length > 2) items = items.slice(-2);
    }
    applyFlavourItems(items);
  }

  function flavourHintText() {
    const n = flavourCount();
    if (n === 0) {
      return "Select one or two flavours — mix a no-sugar sponge with a sugar-added one if you like.";
    }
    if (n === 1) return "1 flavour selected — you can add one more from either list.";
    return "2 flavours selected.";
  }

  function afterFlavourChange() {
    renderSpongeOptions();
    renderSugarSpongeOptions();
  }

  function pruneSpongesToAvailable() {
    const allowed = new Set(availableSponges());
    state.sponges = state.sponges.filter((s) => allowed.has(s));
  }

  function selectCakeDesign(cake) {
    if (!cake) return;
    state.mode = "gallery";
    state.design = cake.name;
    state.activeCake = cake;
    renderMode();
    renderDesignGrid();
    renderGallery();
    const status = document.getElementById("form-status");
    if (status) {
      status.textContent = `Selected “${cake.name}” from the gallery.`;
      status.className = "form-status is-success";
    }
  }

  function minOrderDate() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }

  function scrollToId(id) {
    const el = document.querySelector(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: "smooth" });
  }

  function initSmoothScroll() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      if (!document.querySelector(id)) return;
      e.preventDefault();
      closeDrawer();
      closeLightbox();
      scrollToId(id);
    });
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
    if (!state.activeCake) document.body.style.overflow = "";
  }

  function initDrawer() {
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
  }

  function renderFilters() {
    const el = document.getElementById("filters");
    if (!el) return;
    el.innerHTML = data.filters
      .map(
        (label) =>
          `<button type="button" class="filter-chip${
            label === state.filter ? " is-active" : ""
          }" data-filter="${escapeHtml(label)}" role="tab" aria-selected="${
            label === state.filter
          }">${escapeHtml(label)}</button>`
      )
      .join("");

    el.querySelectorAll(".filter-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.filter = btn.dataset.filter;
        state.galleryExpanded = false;
        const url = new URL(window.location.href);
        if (state.filter === "All") url.searchParams.delete("theme");
        else url.searchParams.set("theme", state.filter.toLowerCase());
        history.replaceState({}, "", url);
        track("cake_filter", { filter: state.filter });
        renderFilters();
        renderGallery();
      });
    });
  }

  function matchesFilter(cake, filter) {
    if (filter === "All") return true;
    return cake.theme.toLowerCase().includes(filter.toLowerCase());
  }

  function renderGallery() {
    const grid = document.getElementById("gallery-grid");
    const moreBtn = document.getElementById("gallery-more");
    if (!grid) return;

    const visibleCakes = data.cakes.filter((cake) => matchesFilter(cake, state.filter));
    const showAll = state.galleryExpanded || visibleCakes.length <= GALLERY_PREVIEW;
    const previewIds = new Set(visibleCakes.slice(0, GALLERY_PREVIEW).map((c) => c.id));

    grid.innerHTML = data.cakes
      .map((cake) => {
        const inFilter = matchesFilter(cake, state.filter);
        const inPreview = previewIds.has(cake.id);
        const collapsed = !showAll && inFilter && !inPreview;
        const hidden = !inFilter || collapsed ? " is-hidden" : "";
        const selected =
          state.mode === "gallery" && state.design === cake.name ? " is-selected" : "";
        return `
        <button type="button" class="cake-tile${hidden}${selected}" data-id="${escapeHtml(
          cake.id
        )}" aria-label="${escapeHtml(cake.name)}${selected ? " (selected)" : ""}">
          <div class="cake-tile__img">
            <img src="${escapeHtml(cake.src)}" alt="${escapeHtml(
          cake.name
        )}" width="760" height="950" loading="lazy">
          </div>
          <span class="cake-tile__name">${escapeHtml(cake.name)}</span>
          <span class="cake-tile__theme">${escapeHtml(cake.theme)}</span>
        </button>`;
      })
      .join("");

    grid.querySelectorAll(".cake-tile").forEach((tile) => {
      tile.addEventListener("click", () => {
        const cake = data.cakes.find((c) => c.id === tile.dataset.id);
        if (!cake) return;
        selectCakeDesign(cake);
        openLightbox(cake);
      });
    });

    if (moreBtn) {
      const needsMore = visibleCakes.length > GALLERY_PREVIEW;
      moreBtn.hidden = !needsMore;
      moreBtn.textContent = state.galleryExpanded ? "Show fewer cakes" : "See more cakes";
      if (!moreBtn.dataset.bound) {
        moreBtn.dataset.bound = "1";
        moreBtn.addEventListener("click", () => {
          state.galleryExpanded = !state.galleryExpanded;
          renderGallery();
        });
      }
    }
  }

  function openLightbox(cake) {
    state.activeCake = cake;
    const box = document.getElementById("lightbox");
    const img = document.getElementById("lightbox-img");
    const name = document.getElementById("lightbox-name");
    const theme = document.getElementById("lightbox-theme");
    if (!box || !img || !name || !theme) return;
    img.style.backgroundImage = `url("${cake.src}")`;
    img.setAttribute("aria-label", cake.name);
    name.textContent = cake.name;
    theme.textContent = cake.theme;
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    track("cake_lightbox_open", { cake: cake.id });
    document.getElementById("lightbox-order")?.focus();
  }

  function closeLightbox() {
    const box = document.getElementById("lightbox");
    if (!box) return;
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    state.activeCake = null;
    document.body.style.overflow = "";
  }

  function initLightbox() {
    const box = document.getElementById("lightbox");
    const closeBtn = document.querySelector(".lightbox__close");
    const order = document.getElementById("lightbox-order");
    if (closeBtn) closeBtn.addEventListener("click", closeLightbox);
    if (box) {
      box.addEventListener("click", (e) => {
        if (e.target === box) closeLightbox();
      });
    }
    if (order) {
      order.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const cake = state.activeCake;
        if (cake) selectCakeDesign(cake);
        closeLightbox();
        scrollToId("#build");
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeLightbox();
        closeDrawer();
      }
    });
  }

  function renderSizeOptions() {
    const el = document.getElementById("size-options");
    const note = document.getElementById("size-note");
    if (!el) return;
    el.innerHTML = data.sizes
      .map((s) => {
        const price = s.price ? `<span class="option-btn__price">${escapeHtml(s.price)}</span>` : "";
        const tip = s.price ? `${s.label} · ${s.price}. ${s.note}` : s.note;
        return `
      <div class="size-wrap">
        <button type="button" class="option-btn option-btn--center${
          state.size === s.label ? " is-active" : ""
        }" data-size="${escapeHtml(s.label)}">${escapeHtml(s.label)}${price}</button>
        <div class="size-tip">${escapeHtml(tip)}</div>
      </div>`;
      })
      .join("");

    el.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.size = btn.dataset.size;
        renderSizeOptions();
      });
    });

    if (note) {
      const selected = data.sizes.find((s) => s.label === state.size);
      note.textContent = selected ? selected.line : "Two layers, whichever size you pick.";
    }
  }

  function renderSpongeOptions() {
    const el = document.getElementById("sponge-options");
    const hint = document.getElementById("sponge-hint");
    if (!el) return;
    pruneSpongesToAvailable();
    const options = availableSponges();
    el.innerHTML = options
      .map(
        (label) =>
          `<button type="button" class="option-btn${
            state.sponges.includes(label) ? " is-active" : ""
          }" data-sponge="${escapeHtml(label)}">${escapeHtml(label)}</button>`
      )
      .join("");
    el.querySelectorAll("[data-sponge]").forEach((btn) => {
      btn.addEventListener("click", () => {
        toggleFlavour("plain", btn.dataset.sponge);
        afterFlavourChange();
      });
    });
    if (hint) hint.textContent = flavourHintText();
  }

  function renderSugarSpongeOptions() {
    const el = document.getElementById("sugar-sponge-options");
    const hint = document.getElementById("sugar-sponge-hint");
    if (!el) return;
    syncSugarSpongeVisibility();
    const picks = selectedSugarSponges();
    const options = data.sugarSponges || SUGAR_SPONGES;
    el.innerHTML = options
      .map(
        (label) =>
          `<button type="button" class="option-btn${
            picks.includes(label) ? " is-active" : ""
          }" data-sugar-sponge="${escapeHtml(label)}">${escapeHtml(label)}</button>`
      )
      .join("");
    el.querySelectorAll("[data-sugar-sponge]").forEach((btn) => {
      btn.addEventListener("click", () => {
        toggleFlavour("sugar", btn.dataset.sugarSponge || "");
        afterFlavourChange();
      });
    });
    if (hint) hint.textContent = flavourHintText();
  }

  function renderAddons() {
    const el = document.getElementById("addon-options");
    if (!el) return;
    const dietOptions = [
      DIET_NONE,
      ...(data.addons || []).filter((label) => label !== DIET_NONE),
    ];
    el.innerHTML = dietOptions
      .map((label) => {
        const active =
          label === DIET_NONE
            ? state.addons.length === 0
            : state.addons.includes(label);
        return `<button type="button" class="option-btn option-btn--sm${
          active ? " is-active" : ""
        }" data-addon="${escapeHtml(label)}">${escapeHtml(label)}</button>`;
      })
      .join("");
    el.querySelectorAll("[data-addon]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const label = btn.dataset.addon;
        if (label === DIET_NONE) {
          state.addons = [];
        } else if (state.addons.includes(label)) {
          state.addons = state.addons.filter((a) => a !== label);
        } else {
          state.addons = [label];
        }
        pruneSpongesToAvailable();
        syncSugarSpongeVisibility();
        renderAddons();
        renderSpongeOptions();
        renderSugarSpongeOptions();
        renderGallery();
      });
    });
  }

  function renderMode() {
    document.querySelectorAll("#mode-options [data-mode]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === state.mode);
    });
    const grid = document.getElementById("design-grid");
    const drop = document.getElementById("file-drop");
    if (grid) grid.classList.toggle("is-visible", state.mode === "gallery");
    if (drop) drop.classList.toggle("is-visible", state.mode === "own");
  }

  function renderDesignGrid() {
    const grid = document.getElementById("design-grid");
    if (!grid) return;
    grid.innerHTML = data.cakes
      .map(
        (cake) => `
      <button type="button" class="design-pick${
        state.design === cake.name ? " is-selected" : ""
      }" data-design="${escapeHtml(cake.name)}" data-id="${escapeHtml(cake.id)}">
        <div class="design-pick__img">
          <img src="${escapeHtml(cake.src)}" alt="" width="120" height="150" loading="lazy">
        </div>
        <span>${escapeHtml(cake.name)}</span>
      </button>`
      )
      .join("");
    grid.querySelectorAll(".design-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        const cake = data.cakes.find((c) => c.id === btn.dataset.id);
        if (cake) selectCakeDesign(cake);
        else {
          state.design = btn.dataset.design;
          renderDesignGrid();
        }
      });
    });
  }

  function initModeToggle() {
    document.querySelectorAll("#mode-options [data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.mode = btn.dataset.mode;
        if (state.mode === "own") state.design = "";
        renderMode();
        renderDesignGrid();
        renderGallery();
      });
    });
  }

  function initFileInput() {
    const input = document.getElementById("ref-photo");
    const label = document.getElementById("file-label");
    if (!input || !label) return;
    input.addEventListener("change", () => {
      state.file = input.files && input.files[0] ? input.files[0] : null;
      state.fileName = state.file ? state.file.name : "";
      label.textContent = state.fileName || "Tap to attach a photo";
    });
  }

  function spongeLine() {
    if (!state.sponges.length) return "";
    return `Sponge: ${state.sponges.join(" + ")}`;
  }

  function selectedSize() {
    return data.sizes.find((s) => s.label === state.size);
  }

  function composeWhatsAppMessage(publicCode) {
    const date = document.getElementById("cake-date")?.value || "";
    const theme = document.getElementById("cake-theme")?.value.trim() || "";
    const size = selectedSize();
    const contact = window.TinyContact?.readContact?.() || {};
    const sizeLine = size
      ? size.price
        ? `Size: ${size.label} (${size.price})`
        : `Size: ${size.label}`
      : "";
    const lines = [
      publicCode ? `Request code: ${publicCode}` : "",
      contact.email ? `Email: ${contact.email}` : "",
      contact.phone ? `WhatsApp: ${contact.phone}` : "",
      publicCode || contact.email || contact.phone ? "" : "",
      "Hi Tiny! I'd like to order a cake.",
      date ? `Date: ${date}` : "",
      sizeLine,
      spongeLine(),
      selectedSugarSponges().length
        ? `Sugar added sponge: ${selectedSugarSponges().join(" + ")}`
        : "",
      state.mode === "gallery" && state.design
        ? `Design from your gallery: ${state.design}`
        : "",
      state.mode === "own" ? "Design: my own idea" : "",
      theme ? `Theme: ${theme}` : "",
      state.addons.length ? `Diet: ${state.addons.join(", ")}` : "Diet: No special requirements",
      state.fileName
        ? publicCode
          ? `Cake reference photo uploaded: ${state.fileName}`
          : `I have a reference photo to send: ${state.fileName}`
        : "",
    ].filter((line, i, arr) => {
      if (line === "" && (i === 0 || arr[i - 1] === "")) return false;
      return true;
    });
    return lines.join("\n");
  }

  function buildCakePayload() {
    const date = document.getElementById("cake-date")?.value || "";
    const theme = document.getElementById("cake-theme")?.value.trim() || "";
    const size = selectedSize();
    return {
      party: { date },
      cake: {
        size: state.size || "",
        priceLabel: size?.price || "",
        sponges: state.sponges.slice(),
        sugarSponge: selectedSugarSponges().join(" + "),
        mode: state.mode,
        design: state.design || "",
        theme,
        diet: state.addons.length ? state.addons.slice() : [DIET_NONE],
        referenceOriginalName: state.fileName || "",
      },
    };
  }

  function initForm() {
    const form = document.getElementById("cake-form");
    const dateInput = document.getElementById("cake-date");
    const status = document.getElementById("form-status");
    if (dateInput) {
      dateInput.min = minOrderDate();
    }
    if (!form) return;

    const setStatus = (text, kind) => {
      if (!status) return;
      status.textContent = text || "";
      status.className = kind ? `form-status ${kind}` : "form-status";
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      setStatus("");

      const date = dateInput ? dateInput.value : "";
      if (!date) {
        setStatus("Please choose the date you need the cake.", "is-error");
        dateInput?.focus();
        return;
      }

      if (dateInput && date < dateInput.min) {
        setStatus("Please order at least 2 days ahead.", "is-error");
        return;
      }

      if (!state.size) {
        setStatus("Please choose a size.", "is-error");
        return;
      }

      const contact = window.TinyContact?.validateContact?.();
      if (!contact?.ok) {
        setStatus(contact?.message || "Please add an email or WhatsApp number.", "is-error");
        window.TinyContact?.markContactValidity?.(false);
        document.getElementById("contact-email")?.focus();
        return;
      }
      window.TinyContact?.markContactValidity?.(true);

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        if (!window.TinySubmit?.submitRequest) {
          throw new Error("Saving is not configured yet.");
        }
        setStatus("Saving your cake request…");
        const files = {};
        const cakeFile = state.file || document.getElementById("ref-photo")?.files?.[0];
        if (cakeFile) {
          files.cakePhoto = window.TinySubmit.compressImage
            ? await window.TinySubmit.compressImage(cakeFile)
            : cakeFile;
        }
        const result = await window.TinySubmit.submitRequest({
          source: "cake",
          payload: buildCakePayload(),
          files,
          onProgress: setStatus,
        });
        const code = result.publicCode || "";
        const manageToken = result.manageToken || "";
        window.TinySubmit?.rememberManage?.("cake", {
          publicCode: code,
          manageToken,
          requestId: result.requestId,
        });
        track("cake_form_submit", {
          size: state.size,
          mode: state.mode,
          design: state.design || "",
          publicCode: code,
          saved: true,
        });
        setStatus(code ? `Saved as ${code}.` : "Saved.", "is-success");
        const waHref = `${WA_BASE}?text=${encodeURIComponent(composeWhatsAppMessage(code))}`;
        if (window.TinySuccessModal?.open) {
          window.TinySuccessModal.open({
            title: "Cake request saved",
            code,
            manageToken,
            whatsappHref: waHref,
            showEdit: true,
            showCancel: true,
            showShare: false,
          });
        } else {
          window.open(waHref, "_blank", "noopener,noreferrer");
        }
      } catch (err) {
        console.error(err);
        setStatus(err?.message || "Could not save the request.", "is-error");
        track("cake_form_submit", {
          size: state.size,
          mode: state.mode,
          design: state.design || "",
          saved: false,
        });
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
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
      bar.classList.toggle("is-visible", window.scrollY > hero.offsetHeight * 0.5);
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  function initWhatsAppTracking() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-wa]");
      if (!a) return;
      track("whatsapp_click", { button: a.getAttribute("data-wa") });
    });
  }

  function applyThemeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const theme = params.get("theme");
    if (!theme) return;
    const match = data.filters.find((f) => f.toLowerCase() === theme.toLowerCase());
    if (match) state.filter = match;
  }

  async function loadData() {
    if (location.protocol === "file:") return normalizeData(DEFAULT_DATA);
    try {
      const url = (window.TINY_WP && window.TINY_WP.cakesJson) || "data/cakes.json";
      const res = await fetch(url);
      if (res.ok) return normalizeData(await res.json());
    } catch (_) {
      /* fallback */
    }
    return normalizeData(DEFAULT_DATA);
  }

  document.addEventListener("DOMContentLoaded", async () => {
    data = await loadData();
    applyThemeFromUrl();
    renderFilters();
    renderGallery();
    renderSizeOptions();
    renderSpongeOptions();
    renderSugarSpongeOptions();
    renderAddons();
    renderMode();
    renderDesignGrid();
    initModeToggle();
    initFileInput();
    initForm();
    initLightbox();
    initDrawer();
    initSmoothScroll();
    initMobileSticky();
    initWhatsAppTracking();
  });
})();
