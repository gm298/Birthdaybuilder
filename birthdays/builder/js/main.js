(() => {
  "use strict";

  const WA_BASE = "https://wa.me/6282147830142";
  const CAKES_ASSET_BASE = "../../cakes/";

  const DEFAULT_PARTY = {
    packages: [
      {
        id: "simple",
        name: "Simple",
        guests: "5 people included · add up to 9",
        guestsIncluded: 5,
        guestsMax: 9,
        priceWeekday: "IDR 2.3M",
        priceWeekend: "IDR 3.8M",
        priceWeekdayValue: 2300000,
        priceWeekendValue: 3800000,
        featured: false,
        image: "img/packages/simple.jpg",
        includes: [
          "Birthday cake · 15cm, 2 layers",
          "Requested themed party",
          "Table decor (no flowers)",
          "Simple balloon decor",
          "Food & play-area deposit",
        ],
        decorId: "simple",
        cakeSize: "15 cm",
      },
      {
        id: "signature",
        name: "Optimal",
        guests: "10 people included · add up to 20",
        guestsIncluded: 10,
        guestsMax: 20,
        priceWeekday: "IDR 5.3M",
        priceWeekend: "IDR 8.7M",
        priceWeekdayValue: 5300000,
        priceWeekendValue: 8700000,
        featured: true,
        badge: "Most popular",
        image: "img/packages/signature.jpg",
        includes: [
          "Birthday cake · 18cm, 2 layers",
          "Requested themed party",
          "Medium balloon decor",
          "Photozone",
          "Food & play-area deposit",
        ],
        decorId: "optimal",
        cakeSize: "18 cm",
      },
      {
        id: "terrace",
        name: "Whole Terrace",
        guests: "20 people included · add up to 30",
        guestsIncluded: 20,
        guestsMax: 30,
        priceWeekday: "IDR 12.7M",
        priceWeekend: "IDR 20.5M",
        priceWeekdayValue: 12700000,
        priceWeekendValue: 20500000,
        featured: false,
        image: "img/packages/terrace.jpg",
        includes: [
          "Whole private terrace",
          "Full terrace balloon decor",
          "Photozone & piñata",
          "Dessert station",
          "Masterclass for 10 kids",
        ],
        decorId: "terrace",
        cakeSize: "22 cm",
      },
    ],
    decorPackages: [
      {
        id: "simple",
        name: "Simple",
        image: "img/decor/simple.jpg",
        note: "Included with Simple",
        items: ["11 pcs flying balloons", "1 standing number", "1 glitter balloon PVC", "1 head character"],
      },
      {
        id: "optimal",
        name: "Optimal",
        image: "img/decor/optimal.jpg",
        note: "Included with Optimal",
        items: [
          "1 rounded garland",
          "1 head character",
          "1 standing number",
          "1 set balloon (1 star · 1 glitter · 5 pcs)",
          "Tiny rounded table",
          "1 cloud garland (1.5m)",
        ],
      },
      {
        id: "terrace",
        name: "Whole Terrace",
        image: "img/decor/terrace.jpg",
        note: "Included with Whole Terrace",
        items: [
          "1½ backdrop with balloon & name (2m)",
          "1 character balloon",
          "8 flying balloons",
          "1 standing number",
          "2 styrofoam properties",
          "Tiny rounded table",
          "2 cloud garlands (1.5m)",
        ],
      },
    ],
    decorThemes: [
      { id: "photozone", name: "Photozone & balloons", image: "img/decor/photozone.jpg" },
      { id: "character", name: "Named backdrop", image: "img/decor/character.jpg" },
      { id: "minnie", name: "Character party", image: "img/decor/minnie.jpg" },
      { id: "unicorn", name: "Unicorn & rainbow", image: "img/decor/unicorn.jpg" },
      { id: "table", name: "Table styling", image: "img/decor/table.jpg" },
      { id: "pastel", name: "Soft pastel", image: "img/decor/pastel.jpg" },
      { id: "custom", name: "Build your own", image: "", custom: true },
    ],
    masterclasses: [
      { id: "bunny-mask", name: "Bunny mask", note: "+200k / kid · min. 4 kids", pricePerKid: 200000, minKids: 4, image: "img/masterclass/bunny-mask.jpg" },
      { id: "lava-lab", name: "Lava lab", note: "+200k / kid · min. 4 kids", pricePerKid: 200000, minKids: 4, image: "img/masterclass/lava-lab.jpg" },
      { id: "clay-painting", name: "Clay painting", note: "+200k / kid · min. 4 kids", pricePerKid: 200000, minKids: 4, image: "img/masterclass/clay-painting.jpg" },
      { id: "cooking-class", name: "Cooking class", note: "+200k / kid · min. 4 kids", pricePerKid: 200000, minKids: 4, image: "img/masterclass/cooking-class.jpg" },
    ],
    extras: {
      entertainment: [
        { id: "pinata", name: "Piñata", price: "1.4M", priceValue: 1400000, image: "img/extras/pinata.jpg" },
        {
          id: "magic",
          name: "Magic show",
          image: "img/extras/magic.jpg",
          options: [
            { id: "magic-2h", name: "Magic show (2 hrs)", price: "2M", priceValue: 2000000 },
            { id: "magic-mc", name: "Magic show & MC", price: "3M", priceValue: 3000000 },
          ],
        },
        { id: "face-painting", name: "Face painting (2 hrs)", price: "from 1.4M", priceValue: 1400000, image: "img/extras/face-painting.jpg" },
        { id: "dessert-station", name: "Dessert station", price: "2M", priceValue: 2000000, image: "img/extras/dessert.jpg" },
      ],
      decoration: [
        { id: "simple-balloon", name: "Simple balloon decor", price: "950k", priceValue: 950000, image: "img/extras/balloons.jpg" },
        { id: "optimal-balloon", name: "Optimal balloon & photozone", price: "2.4M", priceValue: 2400000, image: "img/decor/optimal.jpg" },
        { id: "terrace-balloon", name: "Terrace balloon & photozone", price: "4M", priceValue: 4000000, image: "img/decor/terrace.jpg" },
        { id: "table-decor", name: "Table decor (flowers / themed)", price: "on request", priceValue: 0, image: "img/extras/table.jpg" },
      ],
      cake: [
        { id: "cake-15", name: "Extra cake 15cm", price: "1M", priceValue: 1000000 },
        { id: "cake-18", name: "Extra cake 18cm", price: "1.5M", priceValue: 1500000 },
        { id: "cake-22", name: "Extra cake 22cm", price: "1.8M", priceValue: 1800000 },
      ],
    },
    extraGuest: { weekday: 150000, weekend: 300000 },
    food: {
      image: "img/food.jpg",
      lede: "Food and drink sit in the package as a play-area deposit. Tell us allergies and we’ll set the table from Tiny’s kitchen.",
      menuUrl: "https://drive.google.com/drive/folders/1-Ubm3u3EvXdcDY-TdVo_sA4bPH5s5ARI?usp=drive_link",
      depositByPackage: {
        simple: {
          weekday: 750000,
          weekend: 1500000,
          weekdayLabel: "750k",
          weekendLabel: "1.5M",
        },
        optimal: {
          weekday: 1500000,
          weekend: 3000000,
          weekdayLabel: "1.5M",
          weekendLabel: "3M",
        },
        terrace: {
          weekday: 3000000,
          weekend: 6000000,
          weekdayLabel: "3M",
          weekendLabel: "6M",
        },
      },
    },
  };

  const SPONGE_FLOURLESS = "Flourless Zucchini Chocolate (Gluten free)";
  const SPONGES_ALL = [
    "Wholewheat kale & apple",
    "Wholewheat pumpkin cacao",
    SPONGE_FLOURLESS,
    "Wholewheat almond cake",
  ];
  const SPONGES_NO_SUGAR = [
    "Wholewheat kale & apple",
    "Wholewheat pumpkin cacao",
    SPONGE_FLOURLESS,
    "Wholewheat almond cake",
  ];
  const SUGAR_SPONGES = ["Red Velvet", "Chocolate"];

  const DEFAULT_CAKES = {
    sizes: [
      { label: "15 cm", note: "Small family table — about 8–10 slices", line: "15 cm — small family table, about 8–10 slices." },
      { label: "18 cm", note: "The usual birthday size — about 12–16 slices", line: "18 cm — the usual birthday size, about 12–16 slices." },
      { label: "22 cm", note: "Bigger parties — about 20–25 slices", line: "22 cm — bigger parties, about 20–25 slices." },
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

  const partyState = {
    day: "weekday",
    packageId: "signature",
    decorPackageId: "optimal",
    decorThemeId: "",
    masterclassId: "",
    extras: [],
  };

  const cakeState = {
    filter: "All",
    size: "18 cm",
    sponges: [],
    sugarSponge: "",
    mode: "gallery",
    design: "",
    theme: "",
    addons: [],
    fileName: "",
    activeCake: null,
    galleryExpanded: false,
  };

  let partyData = DEFAULT_PARTY;
  let cakeData = DEFAULT_CAKES;

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
    if (/^https?:\/\//i.test(src) || src.startsWith("../../")) return src;
    return CAKES_ASSET_BASE + src.replace(/^\.\//, "");
  }

  function normalizeCakes(data) {
    const cakes = (data.cakes || []).map((c) => ({ ...c, src: cakeSrc(c.src) }));
    return {
      ...data,
      cakes,
      sponges: SPONGES_ALL.slice(),
      sugarSponges: SUGAR_SPONGES.slice(),
      addons: ["Gluten-free", "No added sugar"],
    };
  }

  function availableSponges() {
    const gf = cakeState.addons.includes("Gluten-free");
    const noSugar = cakeState.addons.includes("No added sugar");
    if (gf) return [SPONGE_FLOURLESS];
    if (noSugar) return SPONGES_NO_SUGAR.slice();
    return SPONGES_ALL.slice();
  }

  function syncSugarSpongeVisibility() {
    const field = document.getElementById("sugar-sponge-field");
    const hide =
      cakeState.addons.includes("No added sugar") ||
      cakeState.addons.includes("Gluten-free");
    if (hide) {
      cakeState.sugarSponge = "";
      if (field) field.hidden = true;
    } else if (field) {
      field.hidden = false;
    }
  }

  function pruneSpongesToAvailable() {
    const allowed = new Set(availableSponges());
    cakeState.sponges = cakeState.sponges.filter((s) => allowed.has(s));
  }

  function selectCakeDesign(cake) {
    if (!cake) return;
    cakeState.mode = "gallery";
    cakeState.design = cake.name;
    cakeState.activeCake = cake;
    renderMode();
    renderDesignGrid();
    renderGallery();
    renderSummary();
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

  function headerOffset() {
    const root = getComputedStyle(document.documentElement);
    const stepsBar = parseFloat(root.getPropertyValue("--steps-bar-h")) || 52;
    const pinned = document.body.classList.contains("steps-pinned");
    if (pinned) return stepsBar + 12;
    const siteHeader = parseFloat(root.getPropertyValue("--site-header-h")) || 80;
    return siteHeader + stepsBar + 16;
  }

  function foodDepositAmount(pkg) {
    const deposits =
      partyData.food?.depositByPackage || DEFAULT_PARTY.food.depositByPackage;
    const key = packageDepositKey(pkg);
    const d = deposits?.[key];
    if (!d) return 0;
    return partyState.day === "weekend" ? d.weekend || 0 : d.weekday || 0;
  }

  function buildQuotation() {
    const pkg = selectedPackage();
    const lines = [];
    let subtotal = 0;
    const { kids, adults } = guestCounts();
    const totalGuests = kids + adults;

    if (pkg) {
      const pkgVal = packagePriceValue(pkg);
      const deposit = foodDepositAmount(pkg);
      const packageOnly = Math.max(0, pkgVal - deposit);
      subtotal += packageOnly;
      lines.push({
        label: `${pkg.name} package (${partyState.day})`,
        value: packageOnly,
      });

      const included = pkg.guestsIncluded || 0;
      const extraPeople = Math.max(0, totalGuests - included);
      let extraCost = 0;
      if (extraPeople > 0) {
        const rate =
          partyState.day === "weekend"
            ? partyData.extraGuest?.weekend || 300000
            : partyData.extraGuest?.weekday || 150000;
        extraCost = extraPeople * rate;
      }

      const foodTotal = deposit + extraCost;
      if (foodTotal > 0) {
        subtotal += foodTotal;
        const extraNote =
          extraPeople > 0
            ? `${extraPeople} extra ${extraPeople === 1 ? "person" : "people"}`
            : "";
        const baseNote =
          "This is how much is included for you to purchase food and beverages.";
        lines.push({
          label: "Food & drink deposit",
          value: foodTotal,
          detail: extraNote ? `${extraNote}. ${baseNote}` : baseNote,
        });
      }
    }

    if (partyState.masterclassId) {
      const m = partyData.masterclasses.find((x) => x.id === partyState.masterclassId);
      if (m) {
        const billKids = Math.max(kids || m.minKids || 4, m.minKids || 4);
        const mCost = (m.pricePerKid || 200000) * billKids;
        subtotal += mCost;
        lines.push({
          label: `Masterclass · ${m.name} (${billKids} kids)`,
          value: mCost,
        });
      }
    }

    flatExtraItems().forEach((item) => {
      if (!partyState.extras.includes(item.id)) return;
      const val = item.priceValue || 0;
      if (val > 0) {
        subtotal += val;
        lines.push({ label: item.name, value: val });
      } else {
        lines.push({ label: `${item.name} (on request)`, value: 0, note: true });
      }
    });

    const service = Math.round(subtotal * 0.05);
    const tax = Math.round((subtotal + service) * 0.1);
    const total = subtotal + service + tax;

    return { lines, subtotal, service, tax, total };
  }

  function renderQuote() {
    const panel = document.getElementById("quote-panel");
    if (!panel) return;
    const q = buildQuotation();
    const rows = q.lines
      .map((line) => {
        const label = line.detail
          ? `${escapeHtml(line.label)}<small class="quote-detail">${escapeHtml(
              line.detail
            )}</small>`
          : escapeHtml(line.label);
        return `<li><span>${label}</span><span>${
          line.note ? "TBC" : escapeHtml(formatIdr(line.value))
        }</span></li>`;
      })
      .join("");
    panel.innerHTML = `
      <h3>Quotation</h3>
      <ul>
        ${rows || "<li><span>Select a package to start</span><span>—</span></li>"}
        <li><span>Subtotal</span><span>${escapeHtml(formatIdr(q.subtotal))}</span></li>
        <li><span>Service 5%</span><span>${escapeHtml(formatIdr(q.service))}</span></li>
        <li><span>Tax 10%</span><span>${escapeHtml(formatIdr(q.tax))}</span></li>
        <li class="is-total"><span>Estimated total</span><span>${escapeHtml(formatIdr(q.total))}</span></li>
      </ul>
      <p class="quote-note">Estimate only — final quote confirmed on WhatsApp. Items marked TBC are priced on request.</p>`;
  }

  function syncStepsBarH() {
    const steps = document.querySelector(".steps-bar");
    if (!steps) return;
    const height = Math.ceil(steps.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--steps-bar-h", `${height}px`);
    const spacer = document.getElementById("steps-bar-spacer");
    if (spacer && steps.classList.contains("is-fixed")) {
      spacer.style.height = `${height}px`;
    }
  }

  function initStickySteps() {
    const bar = document.getElementById("steps-bar");
    const anchor = document.getElementById("steps-bar-anchor");
    const spacer = document.getElementById("steps-bar-spacer");
    if (!bar || !anchor) return;

    const setFixed = (fixed) => {
      bar.classList.toggle("is-fixed", fixed);
      document.body.classList.toggle("steps-pinned", fixed);
      if (spacer) {
        spacer.style.height = fixed ? `${bar.offsetHeight}px` : "0";
      }
      bar.style.top = "0";
      syncStepsBarH();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        setFixed(!entry.isIntersecting);
      },
      { root: null, threshold: 0, rootMargin: "0px 0px 0px 0px" }
    );

    observer.observe(anchor);
    window.addEventListener(
      "resize",
      () => {
        bar.style.top = "0";
        if (bar.classList.contains("is-fixed") && spacer) {
          spacer.style.height = `${bar.offsetHeight}px`;
        }
        syncStepsBarH();
      },
      { passive: true }
    );
  }

  function dayFromDate(dateStr) {
    if (!dateStr) return "weekday";
    const d = new Date(`${dateStr}T12:00:00`);
    const dow = d.getDay();
    return dow === 0 || dow === 6 ? "weekend" : "weekday";
  }

  function updateDayIndicator() {
    const label = document.getElementById("day-indicator-label");
    if (!label) return;
    const dateStr = document.getElementById("party-date")?.value;
    const dayLabel = partyState.day === "weekend" ? "Weekend pricing" : "Weekday pricing";
    label.textContent = dateStr ? dayLabel : `${dayLabel} · pick a date in step 01`;
  }

  function syncDayFromDate() {
    const dateStr = document.getElementById("party-date")?.value;
    if (dateStr) partyState.day = dayFromDate(dateStr);
    updateDayIndicator();
    renderPackages();
    renderFood();
    renderSummary();
  }

  function packageDepositKey(pkg) {
    if (!pkg) return "simple";
    return pkg.decorId || (pkg.id === "signature" ? "optimal" : pkg.id);
  }

  function mediaExpandHtml(src, alt) {
    if (!src) return "";
    return `<div class="photo-card__media photo-card__media--expandable" data-expand-src="${escapeHtml(
      src
    )}" data-expand-alt="${escapeHtml(alt || "")}" role="button" tabindex="0" aria-label="Expand photo">
      <img src="${escapeHtml(src)}" alt="" width="600" height="750" loading="lazy">
    </div>`;
  }

  function bindPhotoExpand(root) {
    (root || document).querySelectorAll("[data-expand-src]").forEach((el) => {
      if (el.dataset.boundExpand) return;
      el.dataset.boundExpand = "1";
      const open = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const card = el.closest(".photo-card");
        const title =
          card?.querySelector("h3,h4")?.textContent?.trim() ||
          el.dataset.expandAlt ||
          "Photo";
        const note = card?.querySelector("p,.photo-card__price")?.textContent?.trim() || "";
        openPhotoLightbox(el.dataset.expandSrc, title, note);
      };
      el.addEventListener("click", open);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") open(e);
      });
    });
  }

  function applyPackageSelection(packageId) {
    partyState.packageId = packageId;
    const pkg = selectedPackage();
    if (pkg?.cakeSize) {
      cakeState.size = pkg.cakeSize;
      renderSizeOptions();
    }
    if (pkg?.decorId) {
      partyState.decorPackageId = pkg.decorId;
      renderDecorPackages();
    }
    renderPackages();
    renderFood();
    renderSummary();
  }

  function selectedPackage() {
    return (
      partyData.packages.find((p) => p.id === partyState.packageId) ||
      partyData.packages[0]
    );
  }

  function packagePrice(pkg) {
    return partyState.day === "weekend" ? pkg.priceWeekend : pkg.priceWeekday;
  }

  function initSmoothScroll() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      if (!document.querySelector(id)) return;
      e.preventDefault();
      if (window.TinyChrome) window.TinyChrome.closeDrawer();
      closeAllLightboxes();
      scrollToId(id);
    });
  }

  function scrollToId(id) {
    const el = document.querySelector(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset();
    window.scrollTo({ top, behavior: "smooth" });
  }

  function packagePriceValue(pkg) {
    return partyState.day === "weekend"
      ? pkg.priceWeekendValue || 0
      : pkg.priceWeekdayValue || 0;
  }

  function guestCounts() {
    const kids = parseInt(document.getElementById("guest-kids")?.value, 10);
    const adults = parseInt(document.getElementById("guest-adults")?.value, 10);
    return {
      kids: Number.isFinite(kids) && kids > 0 ? kids : 0,
      adults: Number.isFinite(adults) && adults > 0 ? adults : 0,
    };
  }

  function guestLabel() {
    const { kids, adults } = guestCounts();
    if (!kids && !adults) return "—";
    const parts = [];
    if (kids) parts.push(`${kids} kids`);
    if (adults) parts.push(`${adults} adults`);
    return parts.join(" · ");
  }

  function formatIdr(n) {
    if (!n && n !== 0) return "—";
    return `IDR ${Math.round(n).toLocaleString("en-US")}`;
  }

  function flatExtraItems() {
    const extras = partyData.extras || {};
    const out = [];
    (extras.entertainment || []).forEach((item) => {
      if (item.options) {
        item.options.forEach((opt) => out.push({ ...opt, image: item.image }));
      } else {
        out.push(item);
      }
    });
    (extras.decoration || []).forEach((item) => out.push(item));
    (extras.cake || []).forEach((item) => out.push(item));
    return out;
  }

  function decorItemsForPackage(pkg) {
    const decor = (partyData.decorPackages || []).find((d) => d.id === (pkg.decorId || pkg.id));
    return decor?.items || pkg.decor || [];
  }

  function renderPackages() {
    const grid = document.getElementById("package-grid");
    if (!grid) return;
    grid.innerHTML = partyData.packages
      .map((pkg) => {
        const selected = pkg.id === partyState.packageId;
        const badge = pkg.featured
          ? `<span class="pkg-card__badge">${escapeHtml(pkg.badge || "Most popular")}</span>`
          : "";
        const features = (pkg.includes || [])
          .map((f) => `<li>${escapeHtml(f)}</li>`)
          .join("");
        const decorItems = decorItemsForPackage(pkg)
          .map((f) => `<li>${escapeHtml(f)}</li>`)
          .join("");
        const media = pkg.image
          ? `<div class="pkg-card__media"><img src="${escapeHtml(pkg.image)}" alt="" width="800" height="500" loading="lazy"></div>`
          : "";
        return `
          <button type="button" class="pkg-card${pkg.featured ? " pkg-card--featured" : ""}${
            selected ? " is-selected" : ""
          }" data-package="${escapeHtml(pkg.id)}">
            ${badge}
            ${media}
            <div class="pkg-card__body">
              <h3>${escapeHtml(pkg.name)}</h3>
              <div class="pkg-card__guests">${escapeHtml(pkg.guests)}</div>
              <div class="pkg-card__price">${escapeHtml(packagePrice(pkg))}</div>
              <ul class="pkg-card__list">${features}</ul>
              ${
                decorItems
                  ? `<p class="pkg-card__decor-label">Decoration included</p><ul class="pkg-card__decor">${decorItems}</ul>`
                  : ""
              }
            </div>
            <div class="pkg-card__pick">${selected ? "Selected" : "Choose this"}</div>
          </button>`;
      })
      .join("");

    grid.querySelectorAll("[data-package]").forEach((btn) => {
      btn.addEventListener("click", () => {
        applyPackageSelection(btn.dataset.package);
        track("builder_package", { package: partyState.packageId });
      });
    });
  }

  function renderDecorPackages() {
    const grid = document.getElementById("decor-package-grid");
    if (!grid) return;
    const items = partyData.decorPackages || [];
    grid.innerHTML = items
      .map((d) => {
        const selected = d.id === partyState.decorPackageId;
        const list = (d.items || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("");
        return `
          <button type="button" class="photo-card${selected ? " is-selected" : ""}" data-decor-pkg="${escapeHtml(d.id)}">
            <div class="photo-card__media">
              <img src="${escapeHtml(d.image)}" alt="" width="800" height="1000" loading="lazy">
            </div>
            <div class="photo-card__body">
              <h3>${escapeHtml(d.name)}</h3>
              <p>${escapeHtml(d.note || "")}</p>
              <ul>${list}</ul>
            </div>
          </button>`;
      })
      .join("");
    grid.querySelectorAll("[data-decor-pkg]").forEach((btn) => {
      btn.addEventListener("click", () => {
        partyState.decorPackageId = btn.dataset.decorPkg;
        renderDecorPackages();
        renderSummary();
      });
    });
  }

  function renderDecorThemes() {
    const grid = document.getElementById("decor-theme-grid");
    const wrap = document.getElementById("custom-theme-wrap");
    if (!grid) return;
    const themes = partyData.decorThemes || [];
    grid.innerHTML = themes
      .map((t) => {
        const selected = t.id === partyState.decorThemeId;
        if (t.custom) {
          return `
            <button type="button" class="photo-card photo-card--custom${selected ? " is-selected" : ""}" data-decor-theme="${escapeHtml(t.id)}">
              <div class="photo-card__body">
                <h3>${escapeHtml(t.name)}</h3>
                <p>Describe colours, characters and backdrop.</p>
              </div>
            </button>`;
        }
        return `
          <button type="button" class="photo-card${selected ? " is-selected" : ""}" data-decor-theme="${escapeHtml(t.id)}">
            <div class="photo-card__media photo-card__media--wide">
              <img src="${escapeHtml(t.image)}" alt="" width="900" height="600" loading="lazy">
            </div>
            <div class="photo-card__body">
              <h4>${escapeHtml(t.name)}</h4>
            </div>
          </button>`;
      })
      .join("");
    grid.querySelectorAll("[data-decor-theme]").forEach((btn) => {
      btn.addEventListener("click", () => {
        partyState.decorThemeId = btn.dataset.decorTheme;
        renderDecorThemes();
        renderSummary();
      });
    });
    if (wrap) {
      wrap.hidden = partyState.decorThemeId !== "custom";
    }
  }

  function decorPackageLabel() {
    const d = (partyData.decorPackages || []).find((x) => x.id === partyState.decorPackageId);
    return d ? d.name : "—";
  }

  function decorThemeLabel() {
    if (!partyState.decorThemeId) return "Not chosen yet";
    const t = (partyData.decorThemes || []).find((x) => x.id === partyState.decorThemeId);
    if (!t) return partyState.decorThemeId;
    if (t.custom) {
      const custom = document.getElementById("decor-custom")?.value.trim();
      return custom ? `Custom · ${custom}` : "Build your own";
    }
    return t.name;
  }

  function renderFood() {
    const food = partyData.food || {};
    const lede = document.getElementById("food-lede");
    const img = document.getElementById("food-image");
    const list = document.getElementById("food-deposits");
    const included = document.getElementById("food-included");
    if (lede && food.lede) lede.textContent = food.lede;
    if (img && food.image) img.src = food.image;

    const deposits = food.depositByPackage || DEFAULT_PARTY.food.depositByPackage;
    const selectedPkg = selectedPackage();
    const selectedKey = packageDepositKey(selectedPkg);
    const day = partyState.day;
    const pkgMeta = [
      { key: "simple", name: "Simple" },
      { key: "optimal", name: "Optimal" },
      { key: "terrace", name: "Whole Terrace" },
    ];

    if (list) {
      list.innerHTML = pkgMeta
        .map(({ key, name }) => {
          const d = deposits[key];
          if (!d) return "";
          const active = key === selectedKey;
          const weekdayRate =
            day === "weekday"
              ? `<span class="food-deposit__rate">${escapeHtml(d.weekdayLabel)}</span>`
              : escapeHtml(d.weekdayLabel);
          const weekendRate =
            day === "weekend"
              ? `<span class="food-deposit__rate">${escapeHtml(d.weekendLabel)}</span>`
              : escapeHtml(d.weekendLabel);
          return `<li class="food-deposit${active ? " is-active" : ""}"><strong>${escapeHtml(
            name
          )}</strong> · ${weekdayRate} weekday / ${weekendRate} weekend</li>`;
        })
        .join("");
    }

    if (included) {
      const d = deposits[selectedKey];
      if (d) {
        const amount = day === "weekend" ? d.weekend : d.weekday;
        included.textContent = `This means you have ${formatIdr(
          amount
        )} included to purchase food and drinks.`;
      } else {
        included.textContent = "";
      }
    }
  }

  function initPartyDate() {
    const input = document.getElementById("party-date");
    if (!input) return;
    input.min = minOrderDate();
    input.addEventListener("change", syncDayFromDate);
    input.addEventListener("input", syncDayFromDate);
    syncDayFromDate();
  }

  function renderMasterclasses() {
    const grid = document.getElementById("masterclass-grid");
    const noneBtn = document.getElementById("no-masterclass");
    if (!grid) return;
    const noneSelected = !partyState.masterclassId;
    if (noneBtn) noneBtn.classList.toggle("is-selected", noneSelected);

    grid.innerHTML = partyData.masterclasses
      .map(
        (m) => `
        <button type="button" class="photo-card${
          partyState.masterclassId === m.id ? " is-selected" : ""
        }" data-master="${escapeHtml(m.id)}">
          ${mediaExpandHtml(m.image || "", m.name)}
          <div class="photo-card__body">
            <h3>${escapeHtml(m.name)}</h3>
            <p>${escapeHtml(m.note || "")}</p>
          </div>
        </button>`
      )
      .join("");

    const pick = (id) => {
      partyState.masterclassId = id || "";
      renderMasterclasses();
      renderSummary();
    };

    grid.querySelectorAll("[data-master]").forEach((btn) => {
      btn.addEventListener("click", () => pick(btn.dataset.master || ""));
    });
    bindPhotoExpand(grid);
    if (noneBtn && !noneBtn.dataset.bound) {
      noneBtn.dataset.bound = "1";
      noneBtn.addEventListener("click", () => pick(""));
    }
  }

  function toggleExtra(id, groupIds) {
    const on = partyState.extras.includes(id);
    if (groupIds && groupIds.length) {
      partyState.extras = partyState.extras.filter((x) => !groupIds.includes(x));
      if (!on) partyState.extras = partyState.extras.concat(id);
    } else if (on) {
      partyState.extras = partyState.extras.filter((x) => x !== id);
    } else {
      partyState.extras = partyState.extras.concat(id);
    }
    renderExtras();
    renderSummary();
  }

  function renderExtras() {
    const entEl = document.getElementById("extras-entertainment");
    if (entEl) {
      const items = (partyData.extras && partyData.extras.entertainment) || [];
      entEl.innerHTML = items
        .map((item) => {
          if (item.options) {
            const optionIds = item.options.map((o) => o.id);
            const selectedOpt = item.options.find((o) => partyState.extras.includes(o.id));
            const opts = item.options
              .map(
                (opt) => `
                <button type="button" class="magic-option${
                  partyState.extras.includes(opt.id) ? " is-selected" : ""
                }" data-extra="${escapeHtml(opt.id)}" data-magic-group="1">
                  <span>${escapeHtml(opt.name)}</span>
                  <span>${escapeHtml(opt.price)}</span>
                </button>`
              )
              .join("");
            return `
              <div class="photo-card${selectedOpt ? " is-selected" : ""}">
                ${mediaExpandHtml(item.image || "", item.name)}
                <div class="photo-card__body">
                  <h4>${escapeHtml(item.name)}</h4>
                  <div class="magic-options" data-magic-ids="${escapeHtml(optionIds.join(","))}">${opts}</div>
                </div>
              </div>`;
          }
          return `
            <button type="button" class="photo-card${
              partyState.extras.includes(item.id) ? " is-selected" : ""
            }" data-extra="${escapeHtml(item.id)}">
              ${mediaExpandHtml(item.image || "", item.name)}
              <div class="photo-card__body">
                <h4>${escapeHtml(item.name)}</h4>
                <span class="photo-card__price">${escapeHtml(item.price)}</span>
              </div>
            </button>`;
        })
        .join("");

      entEl.querySelectorAll("[data-extra]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const id = btn.dataset.extra;
          if (btn.dataset.magicGroup) {
            const wrap = btn.closest("[data-magic-ids]");
            const group = (wrap?.dataset.magicIds || "").split(",").filter(Boolean);
            toggleExtra(id, group);
          } else {
            toggleExtra(id);
          }
        });
      });
      bindPhotoExpand(entEl);
    }

    ["decoration", "cake"].forEach((group) => {
      const el = document.getElementById(`extras-${group}`);
      if (!el) return;
      const items = (partyData.extras && partyData.extras[group]) || [];
      if (group === "cake") {
        el.innerHTML = items
          .map(
            (item) => `
            <button type="button" class="check-item${
              partyState.extras.includes(item.id) ? " is-selected" : ""
            }" data-extra="${escapeHtml(item.id)}">
              <span>${escapeHtml(item.name)}</span>
              <span>${escapeHtml(item.price)}</span>
            </button>`
          )
          .join("");
      } else {
        el.innerHTML = items
          .map(
            (item) => `
            <button type="button" class="photo-card${
              partyState.extras.includes(item.id) ? " is-selected" : ""
            }" data-extra="${escapeHtml(item.id)}">
              ${mediaExpandHtml(item.image || "", item.name)}
              <div class="photo-card__body">
                <h4>${escapeHtml(item.name)}</h4>
                <span class="photo-card__price">${escapeHtml(item.price)}</span>
              </div>
            </button>`
          )
          .join("");
      }
      el.querySelectorAll("[data-extra]").forEach((btn) => {
        btn.addEventListener("click", () => toggleExtra(btn.dataset.extra));
      });
      if (group === "decoration") bindPhotoExpand(el);
    });
  }

  function extraLabel(id) {
    const found = flatExtraItems().find((x) => x.id === id);
    return found ? `${found.name} (${found.price})` : id;
  }

  function masterclassLabel() {
    if (!partyState.masterclassId) return "None";
    const m = partyData.masterclasses.find((x) => x.id === partyState.masterclassId);
    return m ? m.name : partyState.masterclassId;
  }

  function cakeSummaryLines() {
    const theme = document.getElementById("cake-theme")?.value.trim() || "";
    return [
      cakeState.size ? `Cake size: ${cakeState.size}` : "",
      cakeState.sponges.length ? `Sponge: ${cakeState.sponges.join(" + ")}` : "",
      cakeState.sugarSponge ? `Sugar added sponge: ${cakeState.sugarSponge}` : "",
      cakeState.mode === "gallery" && cakeState.design
        ? `Cake design: ${cakeState.design}`
        : "",
      cakeState.mode === "own" ? "Cake design: my own idea" : "",
      theme ? `Cake theme/name: ${theme}` : "",
      cakeState.addons.length ? `Cake diet: ${cakeState.addons.join(", ")}` : "",
      cakeState.fileName ? `Cake reference photo: ${cakeState.fileName}` : "",
    ].filter(Boolean);
  }

  function renderSummary() {
    const list = document.getElementById("summary-list");
    if (!list) return;
    const pkg = selectedPackage();
    const partyDate = document.getElementById("party-date")?.value || "—";
    const guests = guestLabel();
    const child = document.getElementById("child-name")?.value.trim() || "—";
    const age = document.getElementById("child-age")?.value.trim() || "";
    const notes = document.getElementById("party-notes")?.value.trim() || "—";
    const foodNotes = document.getElementById("food-notes")?.value.trim() || "—";
    const extras =
      partyState.extras.length > 0
        ? partyState.extras.map(extraLabel).join(", ")
        : "None";
    const cakeBits = cakeSummaryLines();
    const cakeText = cakeBits.length ? cakeBits.join(" · ") : "Not chosen yet";

    const rows = [
      ["Package", pkg ? `${pkg.name} · ${packagePrice(pkg)}` : "—"],
      ["Day", partyState.day === "weekend" ? "Weekend" : "Weekday"],
      ["Decoration package", decorPackageLabel()],
      ["Decoration look", decorThemeLabel()],
      ["Party date", partyDate],
      ["Guests", guests],
      ["Birthday child", age ? `${child} · turning ${age}` : child],
      ["Cake", cakeText],
      ["Masterclass", masterclassLabel()],
      ["Extras", extras],
      ["Food notes", foodNotes],
      ["Notes", notes],
    ];

    list.innerHTML = rows
      .map(
        ([label, value]) =>
          `<li><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></li>`
      )
      .join("");
    renderQuote();
  }

  function composeWhatsAppMessage() {
    const pkg = selectedPackage();
    const partyDate = document.getElementById("party-date")?.value || "";
    const guests = guestLabel();
    const child = document.getElementById("child-name")?.value.trim() || "";
    const age = document.getElementById("child-age")?.value.trim() || "";
    const notes = document.getElementById("party-notes")?.value.trim() || "";
    const foodNotes = document.getElementById("food-notes")?.value.trim() || "";
    const cakeTheme = document.getElementById("cake-theme")?.value.trim() || "";
    const decorCustom = document.getElementById("decor-custom")?.value.trim() || "";
    const q = buildQuotation();

    const lines = [
      "Hi Tiny! I'd like to build a birthday party.",
      pkg ? `Package: ${pkg.name} (${packagePrice(pkg)}, ${partyState.day})` : "",
      `Decoration package: ${decorPackageLabel()}`,
      `Decoration look: ${decorThemeLabel()}`,
      decorCustom && partyState.decorThemeId === "custom" ? `Custom theme notes: ${decorCustom}` : "",
      partyDate ? `Party date: ${partyDate}` : "",
      guests !== "—" ? `Guests: ${guests}` : "",
      child ? `Birthday child: ${child}${age ? ` (turning ${age})` : ""}` : "",
      foodNotes ? `Food / allergies: ${foodNotes}` : "",
      notes ? `Notes: ${notes}` : "",
      "",
      "— Cake —",
      cakeState.size ? `Size: ${cakeState.size}` : "",
      cakeState.sponges.length ? `Sponge: ${cakeState.sponges.join(" + ")}` : "",
      cakeState.sugarSponge ? `Sugar added sponge: ${cakeState.sugarSponge}` : "",
      cakeState.mode === "gallery" && cakeState.design
        ? `Design from your gallery: ${cakeState.design}`
        : "",
      cakeState.mode === "own" ? "Design: my own idea" : "",
      cakeTheme ? `Theme on cake: ${cakeTheme}` : "",
      cakeState.addons.length ? `Diet: ${cakeState.addons.join(", ")}` : "",
      cakeState.fileName ? `I have a reference photo to send: ${cakeState.fileName}` : "",
      "",
      `Masterclass: ${masterclassLabel()}`,
      partyState.extras.length
        ? `Extras: ${partyState.extras.map(extraLabel).join(", ")}`
        : "Extras: none",
      "",
      "— Quotation estimate —",
      ...q.lines.map((line) =>
        line.note ? `${line.label}: TBC` : `${line.label}: ${formatIdr(line.value)}`
      ),
      `Subtotal: ${formatIdr(q.subtotal)}`,
      `Service 5%: ${formatIdr(q.service)}`,
      `Tax 10%: ${formatIdr(q.tax)}`,
      `Estimated total: ${formatIdr(q.total)}`,
    ].filter((line, i, arr) => {
      if (line === "" && (arr[i - 1] === "" || i === 0)) return false;
      return true;
    });

    return lines.join("\n");
  }

  function initSend() {
    const btn = document.getElementById("send-whatsapp");
    const status = document.getElementById("send-status");
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (status) {
        status.textContent = "";
        status.className = "form-status";
      }
      if (!partyState.packageId) {
        if (status) {
          status.textContent = "Please choose a package first.";
          status.classList.add("is-error");
        }
        scrollToId("#package");
        return;
      }
      const message = composeWhatsAppMessage();
      track("builder_send", {
        package: partyState.packageId,
        masterclass: partyState.masterclassId || "none",
        extras: partyState.extras.join(","),
      });
      if (status) {
        status.textContent = "Opening WhatsApp…";
        status.classList.add("is-success");
      }
      window.open(
        `${WA_BASE}?text=${encodeURIComponent(message)}`,
        "_blank",
        "noopener,noreferrer"
      );
    });

    [
      "party-date",
      "guest-kids",
      "guest-adults",
      "child-name",
      "child-age",
      "party-notes",
      "food-notes",
      "cake-theme",
      "decor-custom",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", renderSummary);
      el.addEventListener("change", renderSummary);
    });
  }

  function renderFilters() {
    const el = document.getElementById("filters");
    if (!el) return;
    el.innerHTML = cakeData.filters
      .map(
        (label) =>
          `<button type="button" class="filter-chip${
            label === cakeState.filter ? " is-active" : ""
          }" data-filter="${escapeHtml(label)}" role="tab" aria-selected="${
            label === cakeState.filter
          }">${escapeHtml(label)}</button>`
      )
      .join("");
    el.querySelectorAll(".filter-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        cakeState.filter = btn.dataset.filter;
        cakeState.galleryExpanded = false;
        track("cake_filter", { filter: cakeState.filter });
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
    const GALLERY_PREVIEW = 6;
    const visibleCakes = cakeData.cakes.filter((cake) =>
      matchesFilter(cake, cakeState.filter)
    );
    const showAll = cakeState.galleryExpanded || visibleCakes.length <= GALLERY_PREVIEW;
    const previewIds = new Set(
      visibleCakes.slice(0, GALLERY_PREVIEW).map((c) => c.id)
    );

    grid.innerHTML = cakeData.cakes
      .map((cake) => {
        const inFilter = matchesFilter(cake, cakeState.filter);
        const inPreview = previewIds.has(cake.id);
        const collapsed = !showAll && inFilter && !inPreview;
        const hidden = !inFilter || collapsed ? " is-hidden" : "";
        const selected =
          cakeState.mode === "gallery" && cakeState.design === cake.name
            ? " is-selected"
            : "";
        return `
        <button type="button" class="cake-tile${hidden}${selected}" data-id="${escapeHtml(cake.id)}" aria-label="${escapeHtml(
          cake.name
        )}${selected ? " (selected)" : ""}">
          <div class="cake-tile__img">
            <img src="${escapeHtml(cake.src)}" alt="${escapeHtml(cake.name)}" width="760" height="950" loading="lazy">
          </div>
          <span class="cake-tile__name">${escapeHtml(cake.name)}</span>
          <span class="cake-tile__theme">${escapeHtml(cake.theme)}</span>
        </button>`;
      })
      .join("");

    grid.querySelectorAll(".cake-tile").forEach((tile) => {
      tile.addEventListener("click", () => {
        const cake = cakeData.cakes.find((c) => c.id === tile.dataset.id);
        if (!cake) return;
        selectCakeDesign(cake);
        openLightbox(cake);
      });
    });

    if (moreBtn) {
      const needsMore = visibleCakes.length > GALLERY_PREVIEW;
      moreBtn.hidden = !needsMore;
      moreBtn.textContent = cakeState.galleryExpanded ? "Show fewer cakes" : "See more cakes";
      if (!moreBtn.dataset.bound) {
        moreBtn.dataset.bound = "1";
        moreBtn.addEventListener("click", () => {
          cakeState.galleryExpanded = !cakeState.galleryExpanded;
          renderGallery();
        });
      }
    }
  }

  function openLightbox(cake) {
    cakeState.activeCake = cake;
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
  }

  function closeLightbox() {
    const box = document.getElementById("lightbox");
    if (!box) return;
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    cakeState.activeCake = null;
    if (!document.querySelector(".lightbox.is-open")) {
      document.body.style.overflow = "";
    }
  }

  function openPhotoLightbox(src, title, note) {
    closeLightbox();
    const box = document.getElementById("photo-lightbox");
    const img = document.getElementById("photo-lightbox-img");
    const name = document.getElementById("photo-lightbox-name");
    const noteEl = document.getElementById("photo-lightbox-note");
    if (!box || !img || !name || !noteEl || !src) return;
    img.style.backgroundImage = `url("${src}")`;
    img.setAttribute("aria-label", title || "Expanded photo");
    name.textContent = title || "";
    noteEl.textContent = note || "";
    box.classList.add("is-open");
    box.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closePhotoLightbox() {
    const box = document.getElementById("photo-lightbox");
    if (!box) return;
    box.classList.remove("is-open");
    box.setAttribute("aria-hidden", "true");
    if (!document.querySelector(".lightbox.is-open")) {
      document.body.style.overflow = "";
    }
  }

  function closeAllLightboxes() {
    closeLightbox();
    closePhotoLightbox();
  }

  function initLightbox() {
    const box = document.getElementById("lightbox");
    const closeBtn = box?.querySelector(".lightbox__close");
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
        const cake = cakeState.activeCake;
        if (cake) selectCakeDesign(cake);
        closeLightbox();
        scrollToId("#build");
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeAllLightboxes();
    });
  }

  function initPhotoLightbox() {
    const box = document.getElementById("photo-lightbox");
    const closeBtn = box?.querySelector("[data-close-photo]");
    if (closeBtn) closeBtn.addEventListener("click", closePhotoLightbox);
    if (box) {
      box.addEventListener("click", (e) => {
        if (e.target === box) closePhotoLightbox();
      });
    }
  }

  function renderSizeOptions() {
    const el = document.getElementById("size-options");
    const note = document.getElementById("size-note");
    if (!el) return;
    const pkg = selectedPackage();
    const includedSize = pkg?.cakeSize || "";
    el.innerHTML = cakeData.sizes
      .map(
        (s) => `
      <div class="size-wrap">
        <button type="button" class="option-btn option-btn--center${
          cakeState.size === s.label ? " is-active" : ""
        }" data-size="${escapeHtml(s.label)}">${escapeHtml(s.label)}</button>
        <div class="size-tip${s.label === includedSize ? " is-included" : ""}">${
          s.label === includedSize
            ? "Included in selected package"
            : escapeHtml(s.note)
        }</div>
      </div>`
      )
      .join("");
    el.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        cakeState.size = btn.dataset.size;
        renderSizeOptions();
        renderSummary();
      });
    });
    if (note) {
      if (cakeState.size && cakeState.size === includedSize) {
        note.textContent = `${cakeState.size} — included in selected package.`;
      } else {
        const selected = cakeData.sizes.find((s) => s.label === cakeState.size);
        note.textContent = selected ? selected.line : "Two layers, whichever size you pick.";
      }
    }
  }

  function initStepChips() {
    const chips = document.querySelectorAll(".step-chip");
    const sections = ["#details", "#package", "#decor", "#cakes", "#addons", "#food", "#send"]
      .map((id) => document.querySelector(id))
      .filter(Boolean);
    const update = () => {
      let active = sections[0];
      const offset = headerOffset();
      sections.forEach((sec) => {
        if (sec.getBoundingClientRect().top - offset <= 0) active = sec;
      });
      chips.forEach((chip) => {
        chip.classList.toggle("is-active", chip.getAttribute("href") === `#${active.id}`);
      });
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }

  function renderChoiceList(containerId, options, selected, key) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = options
      .map(
        (label) =>
          `<button type="button" class="option-btn${
            selected === label ? " is-active" : ""
          }" data-value="${escapeHtml(label)}">${escapeHtml(label)}</button>`
      )
      .join("");
    el.querySelectorAll("[data-value]").forEach((btn) => {
      btn.addEventListener("click", () => {
        cakeState[key] = btn.dataset.value;
        renderChoiceList(containerId, options, cakeState[key], key);
        renderSummary();
      });
    });
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
            cakeState.sponges.includes(label) ? " is-active" : ""
          }" data-sponge="${escapeHtml(label)}">${escapeHtml(label)}</button>`
      )
      .join("");
    el.querySelectorAll("[data-sponge]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const label = btn.dataset.sponge;
        if (cakeState.sponges.includes(label)) {
          cakeState.sponges = cakeState.sponges.filter((s) => s !== label);
        } else if (cakeState.sponges.length < 2) {
          cakeState.sponges = cakeState.sponges.concat(label);
        } else {
          cakeState.sponges = [cakeState.sponges[1], label];
        }
        renderSpongeOptions();
        renderSummary();
      });
    });
    if (hint) {
      const n = cakeState.sponges.length;
      hint.textContent =
        n === 0
          ? "Select one or two flavours for your cake layers."
          : n === 1
            ? "1 flavour selected — you can add one more."
            : "2 flavours selected.";
    }
  }

  function renderSugarSpongeOptions() {
    const el = document.getElementById("sugar-sponge-options");
    if (!el) return;
    syncSugarSpongeVisibility();
    const options = cakeData.sugarSponges || SUGAR_SPONGES;
    el.innerHTML = options
      .map(
        (label) =>
          `<button type="button" class="option-btn${
            cakeState.sugarSponge === label ? " is-active" : ""
          }" data-sugar-sponge="${escapeHtml(label)}">${escapeHtml(label)}</button>`
      )
      .join("");
    el.querySelectorAll("[data-sugar-sponge]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const value = btn.dataset.sugarSponge || "";
        cakeState.sugarSponge = cakeState.sugarSponge === value ? "" : value;
        renderSugarSpongeOptions();
        renderSummary();
      });
    });
  }

  function renderAddons() {
    const el = document.getElementById("addon-options");
    if (!el) return;
    el.innerHTML = (cakeData.addons || ["Gluten-free", "No added sugar"])
      .map(
        (label) =>
          `<button type="button" class="option-btn option-btn--sm${
            cakeState.addons.includes(label) ? " is-active" : ""
          }" data-addon="${escapeHtml(label)}">${escapeHtml(label)}</button>`
      )
      .join("");
    el.querySelectorAll("[data-addon]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const label = btn.dataset.addon;
        if (cakeState.addons.includes(label)) {
          cakeState.addons = cakeState.addons.filter((a) => a !== label);
        } else {
          cakeState.addons = cakeState.addons.concat(label);
        }
        pruneSpongesToAvailable();
        syncSugarSpongeVisibility();
        renderAddons();
        renderSpongeOptions();
        renderSugarSpongeOptions();
        renderSummary();
      });
    });
  }

  function renderMode() {
    document.querySelectorAll("#mode-options [data-mode]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === cakeState.mode);
    });
    const grid = document.getElementById("design-grid");
    const drop = document.getElementById("file-drop");
    if (grid) grid.classList.toggle("is-visible", cakeState.mode === "gallery");
    if (drop) drop.classList.toggle("is-visible", cakeState.mode === "own");
  }

  function renderDesignGrid() {
    const grid = document.getElementById("design-grid");
    if (!grid) return;
    grid.innerHTML = cakeData.cakes
      .map(
        (cake) => `
      <button type="button" class="design-pick${
        cakeState.design === cake.name ? " is-selected" : ""
      }" data-design="${escapeHtml(cake.name)}">
        <div class="design-pick__img">
          <img src="${escapeHtml(cake.src)}" alt="" width="120" height="150" loading="lazy">
        </div>
        <span>${escapeHtml(cake.name)}</span>
      </button>`
      )
      .join("");
    grid.querySelectorAll(".design-pick").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.dataset.design;
        const cake = cakeData.cakes.find((c) => c.name === name);
        if (cake) {
          selectCakeDesign(cake);
        } else {
          cakeState.design = name;
          cakeState.mode = "gallery";
          renderMode();
          renderDesignGrid();
          renderGallery();
          renderSummary();
        }
      });
    });
  }

  function initModeToggle() {
    document.querySelectorAll("#mode-options [data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        cakeState.mode = btn.dataset.mode;
        if (cakeState.mode === "own") cakeState.design = "";
        renderMode();
        renderDesignGrid();
        renderSummary();
      });
    });
  }

  function initFileInput() {
    const input = document.getElementById("ref-photo");
    const label = document.getElementById("file-label");
    if (!input || !label) return;
    input.addEventListener("change", () => {
      cakeState.fileName = input.files && input.files[0] ? input.files[0].name : "";
      label.textContent = cakeState.fileName || "Tap to attach a photo";
      renderSummary();
    });
  }

  function initCakeForm() {
    const form = document.getElementById("cake-form");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        renderSummary();
        scrollToId("#send");
      });
    }
  }

  function initMobileSticky() {
    const bar = document.getElementById("mobile-sticky");
    const hero = document.querySelector(".builder-hero");
    if (!bar || !hero) return;
    const update = () => {
      const isMobile = window.matchMedia("(max-width: 900px)").matches;
      if (!isMobile) {
        bar.classList.remove("is-visible");
        return;
      }
      bar.classList.toggle("is-visible", window.scrollY > hero.offsetHeight * 0.4);
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  async function loadJson(url, fallback) {
    if (location.protocol === "file:") return fallback;
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
    } catch (_) {
      /* fallback */
    }
    return fallback;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    partyData = await loadJson("data/party.json", DEFAULT_PARTY);
    cakeData = normalizeCakes(
      await loadJson("../../cakes/data/cakes.json", DEFAULT_CAKES)
    );

    const params = new URLSearchParams(window.location.search);
    const packageParam = params.get("package");
    if (packageParam && partyData.packages.some((p) => p.id === packageParam)) {
      partyState.packageId = packageParam;
    }

    const pkg = selectedPackage();
    if (pkg && pkg.cakeSize) cakeState.size = pkg.cakeSize;
    if (pkg && pkg.decorId) partyState.decorPackageId = pkg.decorId;

    renderPackages();
    initPartyDate();
    renderDecorPackages();
    renderDecorThemes();
    renderMasterclasses();
    renderExtras();
    renderFood();
    renderSummary();
    initSend();

    renderFilters();
    renderGallery();
    renderSizeOptions();
    renderAddons();
    renderSpongeOptions();
    renderSugarSpongeOptions();
    renderMode();
    renderDesignGrid();
    initModeToggle();
    initFileInput();
    initCakeForm();
    initLightbox();
    initPhotoLightbox();
    initSmoothScroll();
    initStickySteps();
    syncStepsBarH();
    window.addEventListener("resize", syncStepsBarH);
    if (window.ResizeObserver) {
      const steps = document.querySelector(".steps-bar");
      if (steps) new ResizeObserver(syncStepsBarH).observe(steps);
    }
    initMobileSticky();
    initStepChips();
  });
})();
