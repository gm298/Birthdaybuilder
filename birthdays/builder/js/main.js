(() => {
  "use strict";

  const BUILDER_VERSION = "20260905a";
  const WA_BASE = "https://wa.me/6282147830142";
  const CAKES_ASSET_BASE =
    (window.TINY_WP && window.TINY_WP.cakesAssetBase) || "../../cakes/";
  const TERRACE_GUEST_MAX = 35;
  const BUILDER_FLOW = [
    { id: "intro", href: "#intro", nextLabel: "Continue", required: false },
    { id: "details", href: "#details", nextLabel: "Next: Package", required: true },
    { id: "package", href: "#package", nextLabel: "Next: Decorations", required: true },
    { id: "decor", href: "#decor", nextLabel: "Next: Cake", required: true },
    { id: "cakes", href: "#cakes", nextLabel: "Next: Add ons", required: true },
    { id: "addons", href: "#addons", nextLabel: "Next: Food", required: true },
    { id: "food", href: "#food", nextLabel: "Next: Quote", required: true },
    { id: "send", href: "#send", nextLabel: "", required: false },
  ];
  const DIET_NONE = "No special requirements";
  const PARTY_DURATION_HOURS = 3;
  const BUILDER_STEPS = BUILDER_FLOW.filter((step) => step.required).map((step) => step.id);
  const THEME_COLLAGE_IDS = ["photozone", "character", "minnie", "unicorn"];
  const SIMPLE_BUILDER_AGE_MIN = 1;
  const SIMPLE_BUILDER_AGE_MAX = 7;
  const SIMPLE_BUILDER_PHOTO_FALLBACK = "img/decor/simple.jpg";
  const SIMPLE_BUILDER_PHOTO_VERSION = "20260831b";

  function wpConfig() {
    return window.TINY_WP || {};
  }

  function resolveBuilderAsset(path) {
    if (!path) return path;
    if (/^https?:\/\//i.test(path) || path.startsWith("data:") || path.startsWith("blob:")) {
      return path;
    }
    const base = wpConfig().builderAssetBase;
    if (!base) return path;
    try {
      return new URL(path, base).href;
    } catch (_) {
      return String(base).replace(/\/?$/, "/") + String(path).replace(/^\.\//, "");
    }
  }

  function prefixImgStrings(node) {
    if (!wpConfig().builderAssetBase || node == null) return node;
    if (typeof node === "string") {
      return /^(img\/|\.\/img\/)/.test(node) ? resolveBuilderAsset(node) : node;
    }
    if (Array.isArray(node)) {
      node.forEach((item, i) => {
        node[i] = prefixImgStrings(item);
      });
      return node;
    }
    if (typeof node === "object") {
      Object.keys(node).forEach((key) => {
        node[key] = prefixImgStrings(node[key]);
      });
    }
    return node;
  }

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
        guests: "20 people included · max 35 total",
        guestsIncluded: 20,
        guestsMax: 35,
        priceWeekday: "IDR 12.7M",
        priceWeekend: "IDR 20.5M",
        priceWeekdayValue: 12700000,
        priceWeekendValue: 20500000,
        featured: false,
        image: "img/packages/terrace.jpg",
        includes: [
          "Whole private terrace",
          "Full terrace balloon decor",
          "Photozone & piÃ±ata",
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
          "1Â½ backdrop with balloon & name (2m)",
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
        { id: "pinata", name: "PiÃ±ata", price: "1.4M", priceValue: 1400000, image: "img/extras/pinata.jpg" },
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
    packageId: "",
    packageChosen: false,
    decorPackageId: "optimal",
    decorThemeId: "",
    masterclassId: "",
    masterclassReviewed: false,
    entertainmentReviewed: false,
    foodReviewed: false,
    decorReviewed: false,
    extras: [],
    tableIds: [],
    tableArea: "indoor",
    occupancy: [],
  };

  let currentStepId = "intro";
  const staffRequestId = new URLSearchParams(window.location.search).get("staffRequest") || "";
  let staffDecorRestore = null;

  const cakeState = {
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

  const TERRACE_BACKDROP = {
    width: 1024,
    height: 678,
    photo: "img/backdrop/terrace.jpg?v=20260827e",
    occlusion: "img/backdrop/occlusion.png?v=20260827e",
    balloonsMask: "img/backdrop/balloons-mask.png?v=20260827e",
    namePanelId: "center",
    namePanelLabel: "Name on the center board",
    panels: [
      { id: "left", label: "Left panel", x: 0.2812, y: 0.6298, w: 0.0967, h: 0.3333, arch: 0.22, mask: "img/backdrop/panel-left.png?v=20260827e" },
      { id: "center", label: "Center panel", x: 0.376, y: 0.5177, w: 0.1553, h: 0.4454, arch: 0.5, mask: "img/backdrop/panel-center.png?v=20260827e" },
      { id: "right", label: "Right panel", x: 0.5312, y: 0.5177, w: 0.21, h: 0.4454, arch: 0.22, mask: "img/backdrop/panel-right.png?v=20260827e" },
    ],
    colours: [
      { id: "forest", label: "Forest green", original: "#3a5440", mask: "img/backdrop/balloon-forest.png?v=20260827e" },
      { id: "mint", label: "Mint", original: "#c5dcc8", mask: "img/backdrop/balloon-mint.png?v=20260827e" },
      { id: "white", label: "White", original: "#f3f2ed", mask: "img/backdrop/balloon-white.png?v=20260827e" },
      { id: "sky", label: "Sky blue", original: "#a3c6dc", mask: "img/backdrop/balloon-sky.png?v=20260827e" },
      { id: "lavender", label: "Lavender", original: "#cbb8d4", mask: "img/backdrop/balloon-lavender.png?v=20260827e" },
    ],
  };

  const OPTIMAL_BACKDROP = {
    width: 819,
    height: 1024,
    photo: "img/backdrop/optimal/optimal.jpg?v=20260831e",
    balloonsMask: "img/backdrop/optimal/balloons-mask.png?v=20260831e",
    namePanelId: "right",
    namePanelLabel: "Name on the right arch",
    panels: [
      { id: "left", label: "Left arch", x: 0.21, y: 0.5078, w: 0.1429, h: 0.3105, arch: 0.5, mask: "img/backdrop/optimal/panel-left.png?v=20260831e" },
      { id: "right", label: "Right arch", x: 0.4835, y: 0.4082, w: 0.2589, h: 0.4082, arch: 0.5, mask: "img/backdrop/optimal/panel-right.png?v=20260831e" },
    ],
    colours: [
      { id: "colour1", label: "Balloon group 1", original: "#cab9be", mask: "img/backdrop/optimal/balloon-colour-1.png?v=20260831e" },
      { id: "colour2", label: "Balloon group 2", original: "#c5b3b8", mask: "img/backdrop/optimal/balloon-colour-2.png?v=20260831e" },
      { id: "colour3", label: "Balloon group 3", original: "#d0c4c8", mask: "img/backdrop/optimal/balloon-colour-3.png?v=20260831e" },
    ],
  };

  const BACKDROP_BY_PKG = {
    simple: {
      id: "simple",
      name: "Simple",
      mode: "static",
      photo: SIMPLE_BUILDER_PHOTO_FALLBACK,
      panels: [],
      colours: [],
      lede: "Enter the turning age in Details to preview the standing number balloon, then describe your theme and colours.",
    },
    optimal: {
      id: "optimal",
      name: "Optimal",
      mode: "full",
      ...OPTIMAL_BACKDROP,
      lede: "Upload a print for each arch and remap the three balloon groups. Balloons stay in front of the prints.",
    },
    terrace: {
      id: "terrace",
      name: "Whole Terrace",
      mode: "full",
      ...TERRACE_BACKDROP,
      lede: "Upload a print for each board and remap the five balloon colours. Balloons stay in front of the prints.",
    },
  };

  function defaultBackdropColours(cfg) {
    return Object.fromEntries((cfg.colours || []).map((c) => [c.id, c.original]));
  }

  const backdropState = {
    ready: false,
    loading: null,
    nameTouched: false,
    renderTimer: 0,
    panels: { left: null, center: null, right: null },
    colours: defaultBackdropColours(BACKDROP_BY_PKG.optimal),
    assets: null,
  };

  let partyData = DEFAULT_PARTY;
  let cakeData = DEFAULT_CAKES;
  let guestLimitShown = false;

  function canSelectPackage() {
    return totalGuests() > 0;
  }

  function renderPackageHint() {
    const hint = document.getElementById("package-hint");
    if (!hint) return;
    hint.hidden = canSelectPackage();
  }

  function partyTimeValue() {
    return document.getElementById("party-time")?.value || "";
  }

  function partyEndTimeLabel() {
    const start = partyTimeValue();
    if (!start) return "";
    const [h, m] = start.split(":").map((n) => parseInt(n, 10));
    if (!Number.isFinite(h) || !Number.isFinite(m)) return "";
    const endMins = h * 60 + m + PARTY_DURATION_HOURS * 60;
    const eh = Math.floor(endMins / 60) % 24;
    const em = endMins % 60;
    const fmt = (n) => String(n).padStart(2, "0");
    return `${fmt(eh)}:${fmt(em)}`;
  }

  function contactIsComplete() {
    const result = window.TinyContact?.validateContact?.();
    return Boolean(result && result.ok);
  }

  function detailsAreComplete() {
    const date = document.getElementById("party-date")?.value || "";
    const time = partyTimeValue();
    const child = document.getElementById("child-name")?.value.trim() || "";
    const age = parseChildAge();
    return Boolean(date && time && child && age && totalGuests() > 0 && contactIsComplete());
  }

  function validateDetailsSection(showErrors) {
    const fields = [
      { id: "party-date", test: () => Boolean(document.getElementById("party-date")?.value) },
      { id: "party-time", test: () => Boolean(partyTimeValue()) },
      { id: "child-name", test: () => Boolean(document.getElementById("child-name")?.value.trim()) },
      { id: "child-age", test: () => parseChildAge() != null },
      { id: "guest-kids", test: () => totalGuests() > 0 },
    ];
    const contactOk = contactIsComplete();
    window.TinyContact?.markContactValidity?.(contactOk);
    let ok = contactOk;
    fields.forEach(({ id, test }) => {
      const input = document.getElementById(id);
      const wrap = input?.closest(".field");
      const valid = test();
      if (!valid) ok = false;
      if (showErrors && wrap) wrap.classList.toggle("is-invalid", !valid);
      else if (wrap) wrap.classList.remove("is-invalid");
    });
    return ok;
  }

  function entertainmentExtraIds() {
    const items = (partyData.extras && partyData.extras.entertainment) || [];
    const ids = [];
    items.forEach((item) => {
      if (item.options) item.options.forEach((o) => ids.push(o.id));
      else ids.push(item.id);
    });
    return ids;
  }

  function hasEntertainmentExtra() {
    const entIds = new Set(entertainmentExtraIds());
    return partyState.extras.some((id) => entIds.has(id));
  }

  function markAddonsReviewed() {
    if (partyState.masterclassReviewed && partyState.entertainmentReviewed) {
      updateStepProgress();
    }
  }

  function parseChildAge() {
    const raw = document.getElementById("child-age")?.value.trim() || "";
    const match = raw.match(/\d+/);
    if (!match) return null;
    const age = parseInt(match[0], 10);
    return Number.isFinite(age) && age > 0 ? age : null;
  }

  function simpleBuilderPhoto(age) {
    if (age == null) return resolveBuilderAsset(SIMPLE_BUILDER_PHOTO_FALLBACK);
    if (age >= SIMPLE_BUILDER_AGE_MIN && age <= SIMPLE_BUILDER_AGE_MAX) {
      return resolveBuilderAsset(
        `img/backdrop/simple/simple-${age}.jpg?v=${SIMPLE_BUILDER_PHOTO_VERSION}`
      );
    }
    return resolveBuilderAsset(SIMPLE_BUILDER_PHOTO_FALLBACK);
  }

  function backdropPhotoForConfig(cfg) {
    if (cfg?.id === "simple") return simpleBuilderPhoto(parseChildAge());
    return cfg?.photo || "";
  }

  function simpleBuilderHint() {
    const age = parseChildAge();
    if (!age) {
      return "Enter the turning age in Details to preview the standing number balloon.";
    }
    if (age < SIMPLE_BUILDER_AGE_MIN || age > SIMPLE_BUILDER_AGE_MAX) {
      return `No preview for age ${age} yet — we have sample looks for ages ${SIMPLE_BUILDER_AGE_MIN}–${SIMPLE_BUILDER_AGE_MAX}. Tell us the age in your design request.`;
    }
    return `Preview for age ${age} — Tiny will match the look, not every pixel.`;
  }

  function getBackdropConfig() {
    const pkgId = partyState.decorPackageId || includedDecorId();
    return BACKDROP_BY_PKG[pkgId] || BACKDROP_BY_PKG.terrace;
  }

  function invalidateBackdropAssets() {
    backdropState.assets = null;
    backdropState.loading = null;
    backdropState.ready = false;
  }

  function resetBackdropForPackage() {
    invalidateBackdropAssets();
    backdropState.colours = defaultBackdropColours(getBackdropConfig());
  }

  function activeBackdropPanels() {
    return getBackdropConfig().panels || [];
  }

  function activeBackdropColours() {
    return getBackdropConfig().colours || [];
  }

  function designRequestValue() {
    return document.getElementById("decor-design-request")?.value.trim() || "";
  }

  function totalGuests() {
    const { kids, adults } = guestCounts();
    return kids + adults;
  }

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

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Could not load ${src}`));
      img.src = src;
    });
  }

  function hexToRgb(hex) {
    const h = String(hex || "").replace("#", "").trim();
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const n = parseInt(full, 16);
    if (Number.isNaN(n)) return [0, 0, 0];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function overlayChannel(lum, color) {
    const b = lum / 255;
    const c = color / 255;
    const o = b < 0.5 ? 2 * b * c : 1 - 2 * (1 - b) * (1 - c);
    return Math.round(Math.min(255, Math.max(0, o * 255)));
  }

  function multiplyChannel(lum, color) {
    return Math.round(Math.min(255, Math.max(0, (lum / 255) * color)));
  }

  function maskBytes(img, w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, w, h);
    const data = ctx.getImageData(0, 0, w, h).data;
    const out = new Uint8Array(w * h);
    for (let i = 0; i < out.length; i += 1) out[i] = data[i * 4];
    return out;
  }

  function backdropPanelPath(ctx, panel, w, h) {
    const x = panel.x * w;
    const y = panel.y * h;
    const pw = panel.w * w;
    const ph = panel.h * h;
    const rx = pw / 2;
    const ry = pw * (panel.arch != null ? panel.arch : 0.42);
    const cx = x + rx;
    ctx.beginPath();
    ctx.moveTo(x, y + ry);
    ctx.ellipse(cx, y + ry, rx, ry, 0, Math.PI, 0, false);
    ctx.lineTo(x + pw, y + ph);
    ctx.lineTo(x, y + ph);
    ctx.closePath();
  }

  function drawCover(ctx, img, x, y, w, h) {
    const ir = img.naturalWidth / img.naturalHeight;
    const br = w / h;
    let dw;
    let dh;
    let dx;
    let dy;
    if (ir > br) {
      dh = h;
      dw = h * ir;
      dx = x + (w - dw) / 2;
      dy = y;
    } else {
      dw = w;
      dh = w / ir;
      dx = x;
      dy = y + (h - dh) / 2;
    }
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function backdropNameValue() {
    return document.getElementById("backdrop-name")?.value.trim() || "";
  }

  function prefillBackdropName() {
    const el = document.getElementById("backdrop-name");
    if (!el || backdropState.nameTouched || el.value.trim()) return;
    const child = document.getElementById("child-name")?.value.trim() || "";
    if (child) el.value = `${child}’s Birthday`;
  }

  async function ensureBackdropAssets() {
    const cfg = getBackdropConfig();
    if (cfg.mode !== "full") {
      const photoPath = backdropPhotoForConfig(cfg);
      if (backdropState.assets?.photoOnly && backdropState.assets.photoPath === photoPath) {
        return backdropState.assets;
      }
      const photo = await loadImage(photoPath);
      backdropState.assets = { photo, photoOnly: true, photoPath };
      backdropState.ready = true;
      return backdropState.assets;
    }
    if (
      backdropState.assets &&
      !backdropState.assets.photoOnly &&
      backdropState.assets.configId === cfg.id
    ) {
      return backdropState.assets;
    }
    if (backdropState.loading) return backdropState.loading;
    backdropState.loading = (async () => {
      const w = cfg.width;
      const h = cfg.height;
      const photo = await loadImage(cfg.photo);
      const colours = cfg.colours || [];
      const maskImgs = await Promise.all(colours.map((c) => loadImage(c.mask)));
      const panelMaskImgs = await Promise.all((cfg.panels || []).map((p) => loadImage(p.mask)));
      const balloonsImg = await loadImage(cfg.balloonsMask);
      const occlusionImg = cfg.occlusion ? await loadImage(cfg.occlusion) : null;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const ctx = off.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(photo, 0, 0, w, h);
      backdropState.assets = {
        configId: cfg.id,
        photo,
        photoData: ctx.getImageData(0, 0, w, h),
        masks: maskImgs.map((img) => maskBytes(img, w, h)),
        panelMasks: Object.fromEntries(
          (cfg.panels || []).map((p, i) => [p.id, maskBytes(panelMaskImgs[i], w, h)])
        ),
        occlusion: occlusionImg ? maskBytes(occlusionImg, w, h) : null,
        balloons: maskBytes(balloonsImg, w, h),
      };
      backdropState.ready = true;
      return backdropState.assets;
    })();
    try {
      return await backdropState.loading;
    } catch (err) {
      backdropState.loading = null;
      throw err;
    }
  }

  function drawPanelPrint(ctx, panel, img, w, h) {
    const assets = backdropState.assets;
    const mask = assets?.panelMasks?.[panel.id];
    const x = panel.x * w;
    const y = panel.y * h;
    const pw = panel.w * w;
    const ph = panel.h * h;

    const layer = document.createElement("canvas");
    layer.width = w;
    layer.height = h;
    const lctx = layer.getContext("2d");
    if (mask) {
      const mid = lctx.createImageData(w, h);
      const md = mid.data;
      for (let i = 0, p = 0; i < mask.length; i += 1, p += 4) {
        const a = mask[i] >= 128 ? 255 : 0;
        md[p] = 255;
        md[p + 1] = 255;
        md[p + 2] = 255;
        md[p + 3] = a;
      }
      lctx.putImageData(mid, 0, 0);
      lctx.globalCompositeOperation = "source-in";
      drawCover(lctx, img, x, y, pw, ph);
    } else {
      lctx.save();
      backdropPanelPath(lctx, panel, w, h);
      lctx.clip();
      drawCover(lctx, img, x, y, pw, ph);
      lctx.restore();
    }
    ctx.drawImage(layer, 0, 0);
  }

  function restoreMaskedPhoto(ctx, w, h, mask, thresh) {
    const assets = backdropState.assets;
    if (!assets || !mask) return;
    const out = ctx.getImageData(0, 0, w, h);
    const od = out.data;
    const pd = assets.photoData.data;
    const n = w * h;
    const t = thresh == null ? 128 : thresh;
    for (let i = 0, p = 0; i < n; i += 1, p += 4) {
      if (mask[i] < t) continue;
      od[p] = pd[p];
      od[p + 1] = pd[p + 1];
      od[p + 2] = pd[p + 2];
    }
    ctx.putImageData(out, 0, 0);
  }

  function paintBalloons(ctx, w, h) {
    const assets = backdropState.assets;
    if (!assets || assets.photoOnly) return;
    const colours = activeBackdropColours();
    const anyChanged = colours.some(
      (c) => backdropState.colours[c.id].toLowerCase() !== c.original.toLowerCase()
    );
    if (!anyChanged) return;

    const out = ctx.getImageData(0, 0, w, h);
    const od = out.data;
    const pd = assets.photoData.data;
    const rgb = colours.map((c) => hexToRgb(backdropState.colours[c.id]));
    const orig = colours.map((c) => hexToRgb(c.original));
    const THRESH = 128;
    const sil = assets.balloons;
    const n = w * h;
    for (let i = 0, p = 0; i < n; i += 1, p += 4) {
      if (sil && sil[i] < THRESH) continue;
      let best = -1;
      let bestA = THRESH;
      for (let c = 0; c < assets.masks.length; c += 1) {
        const a = assets.masks[c][i];
        if (a > bestA) {
          bestA = a;
          best = c;
        }
      }
      if (best < 0) continue;
      const [nr, ng, nb] = rgb[best];
      const [or, og, ob] = orig[best];
      if (nr === or && ng === og && nb === ob) continue;

      const pr = pd[p];
      const pg = pd[p + 1];
      const pb = pd[p + 2];
      const lum = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
      const mr = multiplyChannel(lum, nr);
      const mg = multiplyChannel(lum, ng);
      const mb = multiplyChannel(lum, nb);
      const ovr = overlayChannel(lum, nr);
      const ovg = overlayChannel(lum, ng);
      const ovb = overlayChannel(lum, nb);
      const mix = lum > 180 ? 0.55 : 0.2;
      od[p] = Math.round(mr * (1 - mix) + ovr * mix);
      od[p + 1] = Math.round(mg * (1 - mix) + ovg * mix);
      od[p + 2] = Math.round(mb * (1 - mix) + ovb * mix);
    }
    ctx.putImageData(out, 0, 0);
  }

  function paintOcclusion(ctx, w, h) {
    restoreMaskedPhoto(ctx, w, h, backdropState.assets?.occlusion, 40);
  }

  function drawBackdropName(ctx, panel, w, h, name) {
    const x = panel.x * w;
    const y = panel.y * h;
    const pw = panel.w * w;
    const ph = panel.h * h;
    const assets = backdropState.assets;
    const mask = assets?.panelMasks?.[panel.id];

    const paintName = (target) => {
      if (!backdropState.panels[panel.id]) {
        target.fillStyle = "#f4f2ee";
        if (mask) target.fillRect(0, 0, w, h);
        else target.fill();
      }
      target.fillStyle = "#1b1b1b";
      target.textAlign = "center";
      target.textBaseline = "middle";
      const maxW = pw * 0.84;
      let size = Math.min(56, pw * 0.24);
      const fontFor = (s) => `${s}px "Great Vibes", "Tenor Sans", cursive`;
      target.font = fontFor(size);
      while (size > 18 && target.measureText(name).width > maxW) {
        size -= 1;
        target.font = fontFor(size);
      }
      target.fillText(name, x + pw / 2, y + ph * 0.42);
    };

    if (mask) {
      const layer = document.createElement("canvas");
      layer.width = w;
      layer.height = h;
      const lctx = layer.getContext("2d");
      paintName(lctx);
      const clip = document.createElement("canvas");
      clip.width = w;
      clip.height = h;
      const cctx = clip.getContext("2d");
      const mid = cctx.createImageData(w, h);
      const md = mid.data;
      for (let i = 0, p = 0; i < mask.length; i += 1, p += 4) {
        const a = mask[i] >= 128 ? 255 : 0;
        md[p] = 255;
        md[p + 1] = 255;
        md[p + 2] = 255;
        md[p + 3] = a;
      }
      cctx.putImageData(mid, 0, 0);
      lctx.globalCompositeOperation = "destination-in";
      lctx.drawImage(clip, 0, 0);
      ctx.drawImage(layer, 0, 0);
      return;
    }

    ctx.save();
    backdropPanelPath(ctx, panel, w, h);
    ctx.clip();
    paintName(ctx);
    ctx.restore();
  }

  async function renderBackdropPreview() {
    const canvas = document.getElementById("backdrop-canvas");
    const staticImg = document.getElementById("backdrop-static");
    if (!canvas || partyState.decorThemeId !== "custom") return;
    const cfg = getBackdropConfig();
    const photoPath = backdropPhotoForConfig(cfg);
    if (cfg.mode !== "full") {
      if (staticImg) {
        staticImg.src = photoPath;
        staticImg.alt = cfg.id === "simple" && parseChildAge()
          ? `Simple balloon decor preview for age ${parseChildAge()}`
          : "Decoration preview";
        staticImg.hidden = false;
      }
      const hint = document.querySelector(".backdrop-builder__hint");
      if (hint && cfg.id === "simple") hint.textContent = simpleBuilderHint();
      canvas.hidden = true;
      return;
    }
    if (staticImg) staticImg.hidden = true;
    canvas.hidden = false;
    try {
      await ensureBackdropAssets();
    } catch (err) {
      console.error(err);
      return;
    }
    if (document.fonts?.ready) await document.fonts.ready;
    const w = cfg.width;
    const h = cfg.height;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(backdropState.assets.photo, 0, 0, w, h);

    (cfg.panels || []).forEach((panel) => {
      const slot = backdropState.panels[panel.id];
      if (!slot?.img) return;
      drawPanelPrint(ctx, panel, slot.img, w, h);
    });

    const name = backdropNameValue();
    const namePanel = (cfg.panels || []).find((p) => p.id === (cfg.namePanelId || "center"));
    if (name && namePanel) drawBackdropName(ctx, namePanel, w, h, name);

    restoreMaskedPhoto(ctx, w, h, backdropState.assets.balloons, 128);
    paintOcclusion(ctx, w, h);
    paintBalloons(ctx, w, h);
  }

  function scheduleBackdropRender() {
    if (partyState.decorThemeId !== "custom") return;
    window.clearTimeout(backdropState.renderTimer);
    backdropState.renderTimer = window.setTimeout(() => {
      renderBackdropPreview();
    }, 40);
  }

  function setBackdropPanel(id, file) {
    const prev = backdropState.panels[id];
    if (prev?.url) URL.revokeObjectURL(prev.url);
    if (!file) {
      backdropState.panels[id] = null;
      renderBackdropUploads();
      scheduleBackdropRender();
      renderSummary();
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      backdropState.panels[id] = { name: file.name, url, img, file };
      renderBackdropUploads();
      scheduleBackdropRender();
      renderSummary();
    };
    img.src = url;
  }

  function loadPanelFromUrl(id, url, name) {
    return new Promise((resolve) => {
      if (!url) {
        resolve();
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const prev = backdropState.panels[id];
        if (prev?.url && String(prev.url).startsWith("blob:")) URL.revokeObjectURL(prev.url);
        backdropState.panels[id] = { name: name || "Print", url, img, file: null };
        renderBackdropUploads();
        scheduleBackdropRender();
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  function renderBackdropUploads() {
    const host = document.getElementById("backdrop-uploads");
    if (!host) return;
    const panels = activeBackdropPanels();
    host.innerHTML = panels
      .map((panel) => {
        const slot = backdropState.panels[panel.id];
        const hint = slot ? slot.name : "Tap to upload a print";
        const thumb = slot ? ` style="background-image:url('${slot.url}')"` : "";
        const clear = slot
          ? `<button type="button" class="backdrop-drop__clear" data-clear-panel="${escapeHtml(panel.id)}">Clear</button>`
          : `<span></span>`;
        return `
          <div class="backdrop-drop">
            <label class="backdrop-drop__hit">
              <span class="backdrop-drop__thumb"${thumb}></span>
              <span class="backdrop-drop__copy">
                <span class="backdrop-drop__label">${escapeHtml(panel.label)}</span>
                <span class="backdrop-drop__hint">${escapeHtml(hint)}</span>
              </span>
              <input type="file" accept="image/*" data-panel="${escapeHtml(panel.id)}">
            </label>
            ${clear}
          </div>`;
      })
      .join("");
    host.querySelectorAll("input[data-panel]").forEach((input) => {
      input.addEventListener("change", () => {
        const file = input.files && input.files[0] ? input.files[0] : null;
        setBackdropPanel(input.dataset.panel, file);
      });
    });
    host.querySelectorAll("[data-clear-panel]").forEach((btn) => {
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        setBackdropPanel(btn.dataset.clearPanel, null);
      });
    });
  }

  function renderBackdropColours() {
    const host = document.getElementById("backdrop-colours");
    if (!host) return;
    const colours = activeBackdropColours();
    host.innerHTML = colours
      .map((c) => {
        const val = backdropState.colours[c.id] || c.original;
        return `
          <label class="backdrop-swatch">
            <span class="backdrop-swatch__chips">
              <span class="backdrop-swatch__orig" style="background:${escapeHtml(c.original)}" title="Original"></span>
              <input type="color" data-balloon="${escapeHtml(c.id)}" value="${escapeHtml(val)}" aria-label="${escapeHtml(c.label)}">
            </span>
            <span class="backdrop-swatch__name">${escapeHtml(c.label)}</span>
          </label>`;
      })
      .join("");
    host.querySelectorAll("input[data-balloon]").forEach((input) => {
      input.addEventListener("input", () => {
        backdropState.colours[input.dataset.balloon] = input.value;
        scheduleBackdropRender();
        renderSummary();
      });
    });
  }

  function backdropPaletteLabel() {
    return activeBackdropColours()
      .map((c) => `${c.label} ${backdropState.colours[c.id]}`)
      .join(", ");
  }

  function backdropPrintsLabel() {
    const named = activeBackdropPanels()
      .filter((p) => backdropState.panels[p.id])
      .map((p) => p.label.toLowerCase());
    if (!named.length) return "no prints yet";
    return named.join(", ");
  }

  function backdropColoursChanged() {
    return activeBackdropColours().some(
      (c) => backdropState.colours[c.id].toLowerCase() !== c.original.toLowerCase()
    );
  }

  function updateBackdropBuilderUI() {
    const cfg = getBackdropConfig();
    const lede = document.getElementById("backdrop-lede");
    const uploads = document.getElementById("backdrop-uploads");
    const nameField = document.getElementById("backdrop-name-field");
    const coloursField = document.getElementById("backdrop-colours-field");
    const downloadBtn = document.getElementById("backdrop-download");
    const pkgLabel = document.getElementById("builder-pkg-label");
    if (lede) lede.textContent = cfg.lede || "";
    if (uploads) uploads.hidden = cfg.mode !== "full";
    if (nameField) nameField.hidden = cfg.id === "simple" || cfg.mode !== "full";
    if (coloursField) coloursField.hidden = cfg.mode !== "full" || !cfg.colours?.length;
    if (downloadBtn) downloadBtn.hidden = cfg.mode !== "full";
    if (pkgLabel) {
      pkgLabel.textContent = `Builder for ${cfg.name} decoration package`;
    }
    const nameLabel = document.querySelector('label[for="backdrop-name"]');
    if (nameLabel) {
      nameLabel.textContent =
        cfg.namePanelLabel || (cfg.mode === "full" ? "Name on the backdrop" : "Name on the center board");
    }
    const hint = document.querySelector(".backdrop-builder__hint");
    if (hint) {
      hint.textContent =
        cfg.id === "simple"
          ? simpleBuilderHint()
          : "A briefing mockup — Tiny will match the look, not every pixel.";
    }
    renderBackdropUploads();
    renderBackdropColours();
    scheduleBackdropRender();
  }

  function openCustomBuilderModal() {
    partyState.decorThemeId = "custom";
    partyState.decorReviewed = true;
    const pkg = selectedPackage();
    if (pkg?.decorId) {
      const decorId = partyState.decorPackageId || pkg.decorId;
      if (!partyState.decorPackageId || decorRank(decorId) < decorRank(pkg.decorId)) {
        partyState.decorPackageId = pkg.decorId;
        resetBackdropForPackage();
      }
    }
    const modal = document.getElementById("custom-builder-modal");
    if (!modal) return;
    updateBackdropBuilderUI();
    prefillBackdropName();
    scheduleBackdropRender();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    renderSummary();
    updateStepProgress();
    track("builder_custom_theme_open", { decorPackage: partyState.decorPackageId });
  }

  function closeCustomBuilderModal() {
    const modal = document.getElementById("custom-builder-modal");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    updateStepProgress();
    renderSummary();
  }

  function showGuestLimitModal() {
    if (guestLimitShown) return;
    guestLimitShown = true;
    const modal = document.getElementById("guest-limit-modal");
    if (!modal) return;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    track("builder_guest_limit", { guests: totalGuests() });
  }

  function closeGuestLimitModal() {
    const modal = document.getElementById("guest-limit-modal");
    if (!modal) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    if (document.getElementById("custom-builder-modal")?.hidden !== false) {
      document.body.style.overflow = "";
    }
  }

  function checkTerraceGuestLimit() {
    const pkg = selectedPackage();
    if (pkg?.id !== "terrace") {
      guestLimitShown = false;
      return;
    }
    if (totalGuests() > TERRACE_GUEST_MAX) {
      showGuestLimitModal();
    } else {
      guestLimitShown = false;
    }
  }

  function initBackdrop() {
    renderBackdropUploads();
    renderBackdropColours();
    const nameEl = document.getElementById("backdrop-name");
    if (nameEl) {
      nameEl.addEventListener("input", () => {
        backdropState.nameTouched = true;
        scheduleBackdropRender();
        renderSummary();
      });
    }
    const child = document.getElementById("child-name");
    const childAge = document.getElementById("child-age");
    if (child) {
      child.addEventListener("input", () => {
        if (!backdropState.nameTouched) {
          const el = document.getElementById("backdrop-name");
          const value = child.value.trim();
          if (el) el.value = value ? `${value}’s Birthday` : "";
        }
        if (partyState.decorThemeId === "custom") scheduleBackdropRender();
      });
    }
    if (childAge) {
      childAge.addEventListener("input", () => {
        if (getBackdropConfig().id === "simple") invalidateBackdropAssets();
        if (partyState.decorThemeId === "custom") scheduleBackdropRender();
        updateStepProgress();
        renderSummary();
      });
      childAge.addEventListener("change", () => {
        if (getBackdropConfig().id === "simple") invalidateBackdropAssets();
        if (partyState.decorThemeId === "custom") scheduleBackdropRender();
        updateStepProgress();
        renderSummary();
      });
    }
    const dl = document.getElementById("backdrop-download");
    if (dl) {
      dl.addEventListener("click", async () => {
        await renderBackdropPreview();
        const canvas = document.getElementById("backdrop-canvas");
        if (!canvas) return;
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.download = "tiny-backdrop-mockup.png";
        a.click();
        track("builder_backdrop_download", { theme: partyState.decorThemeId });
      });
    }
  }

  function selectedCakeRecord() {
    if (cakeState.mode !== "gallery") return null;
    if (cakeState.activeCake?.name === cakeState.design) return cakeState.activeCake;
    return (cakeData.cakes || []).find((c) => c.name === cakeState.design) || null;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Could not read cake photo"));
      reader.readAsDataURL(file);
    });
  }

  async function blobToJpegFile(blob, filename) {
    if (!blob) return null;
    if (blob.type === "image/jpeg" || blob.type === "image/jpg") {
      return new File([blob], filename || "cake.jpg", { type: "image/jpeg" });
    }
    try {
      const bitmap = await createImageBitmap(blob);
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return new File([blob], filename || "cake.jpg", { type: blob.type || "image/jpeg" });
      ctx.drawImage(bitmap, 0, 0);
      const jpeg = await new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9);
      });
      if (!jpeg) return new File([blob], filename || "cake.jpg", { type: blob.type || "image/jpeg" });
      return new File([jpeg], (filename || "cake.jpg").replace(/\.[^.]+$/, ".jpg"), {
        type: "image/jpeg",
      });
    } catch (_) {
      return new File([blob], filename || "cake.jpg", { type: blob.type || "image/jpeg" });
    }
  }

  async function resolveCakeImageAssets() {
    const compress = window.TinySubmit?.compressImage;
    if (cakeState.mode === "own") {
      const file = cakeState.file || document.getElementById("ref-photo")?.files?.[0] || null;
      if (!file) return null;
      const compressed = compress ? await compress(file) : file;
      const dataUrl = await fileToDataUrl(compressed);
      return {
        source: "upload",
        label: file.name || "Uploaded reference",
        file: compressed,
        dataUrl,
      };
    }

    const cake = selectedCakeRecord();
    if (!cake?.src) return null;
    try {
      const res = await fetch(cake.src, { cache: "force-cache" });
      if (!res.ok) throw new Error("Cake image fetch failed");
      const blob = await res.blob();
      const file = await blobToJpegFile(blob, `${cake.id || "gallery-cake"}.jpg`);
      const compressed = compress && file ? await compress(file) : file;
      const dataUrl = compressed ? await fileToDataUrl(compressed) : "";
      return {
        source: "gallery",
        label: cake.name,
        cakeId: cake.id || "",
        cakeSrc: cake.src,
        file: compressed,
        dataUrl,
      };
    } catch (err) {
      console.error(err);
      return {
        source: "gallery",
        label: cake.name,
        cakeId: cake.id || "",
        cakeSrc: cake.src,
        file: null,
        dataUrl: cake.src,
      };
    }
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
      cakeState.sugarSponge = [];
      if (field) field.hidden = true;
    } else if (field) {
      field.hidden = false;
    }
  }

  function selectedSugarSponges() {
    if (Array.isArray(cakeState.sugarSponge)) return cakeState.sugarSponge;
    return cakeState.sugarSponge ? [cakeState.sugarSponge] : [];
  }

  function flavourItems() {
    return [
      ...cakeState.sponges.map((label) => ({ kind: "plain", label })),
      ...selectedSugarSponges().map((label) => ({ kind: "sugar", label })),
    ];
  }

  function applyFlavourItems(items) {
    cakeState.sponges = items.filter((item) => item.kind === "plain").map((item) => item.label);
    cakeState.sugarSponge = items.filter((item) => item.kind === "sugar").map((item) => item.label);
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
    if (n === 0) return "Select one or two flavours — mix a no-sugar sponge with a sugar-added one if you like.";
    if (n === 1) return "1 flavour selected — you can add one more from either list.";
    return "2 flavours selected.";
  }

  function afterFlavourChange() {
    renderSpongeOptions();
    renderSugarSpongeOptions();
    renderSummary();
    updateStepProgress();
    const spongeField = document.getElementById("sponge-options")?.closest(".field");
    const sugarField = document.getElementById("sugar-sponge-options")?.closest(".field");
    if (flavourCount()) {
      spongeField?.classList.remove("is-invalid");
      sugarField?.classList.remove("is-invalid");
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
    cakeState.file = null;
    cakeState.fileName = "";
    const input = document.getElementById("ref-photo");
    const label = document.getElementById("file-label");
    if (input) input.value = "";
    if (label) label.textContent = "Tap to attach a photo";
    renderMode();
    renderDesignGrid();
    renderGallery();
    renderSummary();
    const status = document.getElementById("form-status");
    if (status) {
      status.textContent = `Selected "${cake.name}" from the gallery.`;
      status.className = "form-status is-success";
    }
  }

  function minOrderDate() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().slice(0, 10);
  }

  function headerOffset() {
    const chrome = document.getElementById("steps-chrome");
    const intro = currentStepId === "intro";
    const stepsH = !intro && chrome ? chrome.getBoundingClientRect().height : 0;
    return Math.ceil(stepsH) + 12;
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
    const chrome = document.getElementById("steps-chrome");
    if (!chrome) return;
    const height = Math.ceil(chrome.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--steps-bar-only-h", `${height}px`);
    document.documentElement.style.setProperty("--steps-bar-h", `${height}px`);
  }

  function initStickySteps() {
    const chrome = document.getElementById("steps-chrome");
    if (!chrome) return;
    syncStepsBarH();
    window.addEventListener("resize", syncStepsBarH, { passive: true });
    if (window.ResizeObserver) {
      new ResizeObserver(syncStepsBarH).observe(chrome);
    }
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
    renderPartyTables();
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
    if (!canSelectPackage()) {
      renderPackageHint();
      return;
    }
    partyState.packageId = packageId;
    partyState.packageChosen = true;
    const pkg = selectedPackage();
    if (pkg?.cakeSize) {
      cakeState.size = pkg.cakeSize;
      renderSizeOptions();
    }
    if (pkg?.decorId) {
      partyState.decorPackageId = pkg.decorId;
      resetBackdropForPackage();
      renderDecorPackages();
      updateBackdropBuilderUI();
    }
    renderPackages();
    renderPackageHint();
    renderFood();
    checkTerraceGuestLimit();
    assignPartyTables();
    renderSummary();
    updateStepProgress();
  }

  function selectedPackage() {
    if (!partyState.packageId) return null;
    return partyData.packages.find((p) => p.id === partyState.packageId) || null;
  }

  function partyTables() {
    const Map = window.TinyReserveMap;
    return (partyState.tableIds || []).map((id) => Map?.findTable?.(id)).filter(Boolean);
  }

  function heldPartyTableIds() {
    const Map = window.TinyReserveMap;
    if (!Map?.heldTableIds) return new Set();
    return Map.heldTableIds(partyState.occupancy, partyTimeValue(), "birthday");
  }

  function unavailablePartyTables() {
    const held = heldPartyTableIds();
    return (partyState.tableIds || []).filter((id) => held.has(id));
  }

  function partyTableLabel() {
    const Map = window.TinyReserveMap;
    const tables = partyTables();
    return tables.length && Map?.tableLabel ? Map.tableLabel(tables) : "";
  }

  async function loadPartyOccupancy() {
    const Map = window.TinyReserveMap;
    const date = document.getElementById("party-date")?.value || "";
    const cfg = window.TINY_SUPABASE || {};
    if (!cfg.url || !cfg.anonKey || !date) {
      partyState.occupancy = Map?.withFixedHolds?.(date, []) || [];
      renderPartyTables();
      return;
    }
    try {
      const res = await fetch(`${cfg.url}/rest/v1/rpc/reservation_occupancy`, {
        method: "POST",
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ target_date: date }),
      });
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      partyState.occupancy = Map?.withFixedHolds?.(date, rows) || rows;
    } catch (_) {
      partyState.occupancy = Map?.withFixedHolds?.(date, []) || [];
    }
    renderPartyTables();
    updateStepProgress();
  }

  function assignPartyTables() {
    const Map = window.TinyReserveMap;
    const pkg = selectedPackage();
    if (!pkg || !Map) {
      partyState.tableIds = [];
      renderPartyTables();
      return;
    }
    const auto = Map.birthdayTableIds?.(pkg.id, totalGuests()) || [];
    if (auto.length) {
      partyState.tableIds = auto;
      partyState.tableArea = "terrace";
    } else if (pkg.id === "simple") {
      const stillFit = partyTables().every((table) => Map.canTakeTable(table, totalGuests()));
      if (!stillFit) partyState.tableIds = [];
    } else {
      partyState.tableIds = [];
    }
    loadPartyOccupancy();
  }

  function renderPartyTables() {
    const host = document.getElementById("party-tables");
    const plan = document.getElementById("party-floorplan");
    const areas = document.getElementById("party-table-areas");
    const copy = document.getElementById("party-tables-copy");
    const picked = document.getElementById("party-tables-picked");
    const status = document.getElementById("party-tables-status");
    const Map = window.TinyReserveMap;
    const pkg = selectedPackage();
    if (!host) return;
    if (!pkg || !partyState.packageChosen) {
      host.hidden = true;
      return;
    }
    host.hidden = false;
    const interactive = pkg.id === "simple";
    const area = interactive ? partyState.tableArea || "indoor" : "terrace";
    if (areas) {
      areas.hidden = !interactive;
      areas.querySelectorAll("[data-area]").forEach((btn) => {
        btn.classList.toggle("is-active", btn.dataset.area === area);
      });
    }
    if (copy) {
      if (pkg.id === "simple") {
        copy.textContent =
          "Pick tables that fit your guest count. Indoor max 8 people; indoor tables 1 and 2 can be joined. Saturday 14:00–17:00, terrace 18 and 19 are held for cooking class.";
      } else if (pkg.id === "terrace") {
        copy.textContent = "Whole Terrace reserves every terrace table for the party window.";
      } else {
        copy.textContent =
          "Optimal uses terrace tables 18, 19, 12 and 13, added in that order until they fit your guest count.";
      }
    }
    const blocked = unavailablePartyTables();
    if (status) {
      if (!partyTimeValue() || !document.getElementById("party-date")?.value) {
        status.textContent = "Set the party date and time in step 01 so we can check table availability.";
        status.className = "form-status";
      } else if (blocked.length) {
        status.textContent =
          pkg.id === "simple"
            ? "That table is already reserved for this party time. Please pick another."
            : "Those terrace tables are already reserved (including Saturday cooking class on 18 and 19, 14:00–17:00). Please pick another time.";
        status.className = "form-status is-error";
      } else if (!(partyState.tableIds || []).length) {
        status.textContent = "Select tables to continue.";
        status.className = "form-status";
      } else {
        status.textContent = "";
        status.className = "form-status";
      }
    }
    if (picked) {
      const label = partyTableLabel();
      picked.textContent = label ? `Reserved: ${label}` : "No tables selected yet.";
    }
    if (plan && Map?.renderMap) {
      Map.renderMap(plan, {
        area,
        selected: partyState.tableIds || [],
        held: [...heldPartyTableIds()],
        guests: totalGuests() || 1,
        interactive,
        base: "../../reserve/img/",
        onPick: (id) => {
          const next = Map.nextSelection(partyState.tableIds, id, totalGuests(), heldPartyTableIds());
          partyState.tableIds = [...next];
          renderPartyTables();
          renderSummary();
          updateStepProgress();
        },
      });
    }
  }

  function packagePrice(pkg) {
    return partyState.day === "weekend" ? pkg.priceWeekend : pkg.priceWeekday;
  }

  function initSmoothScroll() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.id === "next-step" || a.classList.contains("step-chip")) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const stepId = id.slice(1);
      if (BUILDER_FLOW.some((step) => step.id === stepId)) {
        e.preventDefault();
        if (window.TinyChrome) window.TinyChrome.closeDrawer();
        closeAllLightboxes();
        if (canVisitStep(stepId)) {
          goToStep(stepId);
        } else {
          const fallback = firstIncompleteRequiredStep();
          goToStep(fallback);
          showStepGate(stepIncompleteMessage(fallback));
        }
        return;
      }
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      if (window.TinyChrome) window.TinyChrome.closeDrawer();
      closeAllLightboxes();
      const page = el.closest(".builder-page");
      if (page && page.id !== currentStepId && canVisitStep(page.id)) {
        goToStep(page.id);
      }
      requestAnimationFrame(() => scrollToId(id));
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

  function formatIdrInvoice(n) {
    if (!n && n !== 0) return "—";
    return `IDR ${Math.round(n).toLocaleString("id-ID")}`;
  }

  function formatPartyDateLong(iso) {
    if (!iso) return "";
    const d = new Date(`${iso}T12:00:00`);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function quotationThemeLabel() {
    const cakeTheme = document.getElementById("cake-theme")?.value.trim() || "";
    const decor = decorThemeLabel();
    if (cakeTheme && decor && decor !== "Not chosen yet") return `${decor} · ${cakeTheme}`;
    if (cakeTheme) return cakeTheme;
    if (decor && decor !== "Not chosen yet") return decor;
    return "";
  }

  function loadScriptOnce(src, ready) {
    if (ready()) return Promise.resolve();
    const existing = document.querySelector(`script[data-quote-lib="${src}"]`);
    if (existing) {
      return new Promise((resolve, reject) => {
        if (ready()) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve());
        existing.addEventListener("error", () => reject(new Error(`Failed ${src}`)));
      });
    }
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = true;
      script.dataset.quoteLib = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Could not load ${src}`));
      document.head.appendChild(script);
    });
  }

  async function loadPdfLibs() {
    await loadScriptOnce(
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      () => typeof window.html2canvas === "function"
    );
    await loadScriptOnce(
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      () => !!(window.jspdf && window.jspdf.jsPDF)
    );
    if (typeof window.html2canvas !== "function" || !window.jspdf?.jsPDF) {
      throw new Error("PDF libraries missing");
    }
  }

  function ensureQuotePdfStyles() {
    if (document.getElementById("quote-pdf-styles")) return;
    const style = document.createElement("style");
    style.id = "quote-pdf-styles";
    style.textContent = `
.quote-pdf-root {
  box-sizing: border-box;
  width: 794px;
  margin: 0;
  padding: 0;
  color: #5f7367 !important;
  background: #fffaf6;
  font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
.quote-pdf-root *, .quote-pdf-root *::before, .quote-pdf-root *::after { box-sizing: border-box; }
.quote-pdf-root .qp-page {
  width: 794px;
  height: 1123px;
  padding: 68px 68px 82px;
  position: relative;
  overflow: hidden;
  background: #fffaf6;
  color: #5f7367 !important;
}
.quote-pdf-root .qp-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;
}
.quote-pdf-root .qp-logo { width: 58px; height: auto; display: block; }
.quote-pdf-root .qp-title {
  margin: 0;
  text-align: right;
  font-size: 34px;
  line-height: 1.05;
  font-weight: 600;
  color: #7a9a86 !important;
}
.quote-pdf-root .qp-meta {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 18px 24px;
  margin-bottom: 34px;
  font-size: 14px;
  line-height: 1.7;
  color: #5f7367 !important;
}
.quote-pdf-root .qp-meta-left div,
.quote-pdf-root .qp-meta-right div { margin: 0 0 2px; }
.quote-pdf-root .qp-meta strong { font-weight: 600; }
.quote-pdf-root table.qp-items {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  color: #5f7367 !important;
}
.quote-pdf-root table.qp-items thead th {
  text-align: left;
  font-weight: 600;
  color: #7a9a86 !important;
  padding: 0 8px 10px 0;
  border-bottom: 1.5px solid #5f7367;
}
.quote-pdf-root table.qp-items .qp-num,
.quote-pdf-root table.qp-items .qp-qty {
  text-align: right;
  white-space: nowrap;
}
.quote-pdf-root table.qp-items .qp-qty { width: 48px; padding-left: 12px; }
.quote-pdf-root table.qp-items .qp-num { width: 120px; }
.quote-pdf-root table.qp-items tbody td {
  padding: 11px 8px 11px 0;
  vertical-align: top;
  border-bottom: 1px solid rgba(95, 115, 103, 0.18);
  color: #5f7367 !important;
}
.quote-pdf-root .qp-note {
  margin-top: 3px;
  font-size: 11px;
  color: rgba(95, 115, 103, 0.72) !important;
  line-height: 1.4;
}
.quote-pdf-root .qp-totals-wrap {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
}
.quote-pdf-root .qp-totals { width: 270px; font-size: 14px; color: #5f7367 !important; }
.quote-pdf-root .qp-totals-row {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 5px 0;
}
.quote-pdf-root .qp-totals-row.is-grand {
  margin-top: 8px;
  font-weight: 700;
  font-size: 16px;
}
.quote-pdf-root .qp-totals-row.is-grand .qp-amount {
  border-bottom: 3px double #5f7367;
  padding-bottom: 2px;
}
.quote-pdf-root .qp-totals-row.is-dp { margin-top: 10px; font-weight: 600; }
.quote-pdf-root .qp-flowers {
  position: absolute;
  left: 46px;
  bottom: 38px;
  width: 180px;
  height: auto;
  pointer-events: none;
}
.quote-pdf-root .qp-flowers--right {
  left: auto;
  right: 38px;
  width: 196px;
}
.quote-pdf-root .qp-mockup {
  display: block;
  width: 100%;
  height: auto;
  margin-top: 4px;
  border-radius: 4px;
}
.quote-pdf-root .qp-cake {
  display: block;
  width: auto;
  max-width: 420px;
  max-height: 520px;
  margin: 8px auto 0;
  border-radius: 4px;
  object-fit: contain;
}
.quote-pdf-root .qp-rules-title {
  margin: 8px 0 18px;
  font-size: 18px;
  font-weight: 700;
  color: #5f7367 !important;
}
.quote-pdf-root .qp-rules-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px 28px;
}
.quote-pdf-root .qp-rule h4 {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 700;
  color: #5f7367 !important;
}
.quote-pdf-root .qp-rule p {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #5f7367 !important;
}
.quote-pdf-root .qp-estimate {
  margin-top: 22px;
  font-size: 11px;
  color: rgba(95, 115, 103, 0.75) !important;
  max-width: 420px;
}`;
    document.head.appendChild(style);
  }

  function buildQuotationPdfMarkup(cakeImage) {
    const q = buildQuotation();
    const pkg = selectedPackage();
    const child = document.getElementById("child-name")?.value.trim() || "";
    const partyDate = document.getElementById("party-date")?.value || "";
    const dateLabel = formatPartyDateLong(partyDate);
    const guests = guestLabel();
    const theme = quotationThemeLabel();
    const dp = Math.round(q.total * 0.3);
    const logoSrc = resolveBuilderAsset("img/quote/logo-tiny.png?v=20260827logo");
    const flowers1 = resolveBuilderAsset("img/quote/flowers-page1.png");
    const flowers2 = resolveBuilderAsset("img/quote/flowers-page2.png");
    const cakeTheme = document.getElementById("cake-theme")?.value.trim() || "";
    const cakeCaption =
      cakeImage?.source === "upload"
        ? `Uploaded reference${cakeImage.label ? `: ${cakeImage.label}` : ""}`
        : cakeImage?.label
          ? `Gallery cake: ${cakeImage.label}`
          : cakeState.design || "Cake";
    const cakeDetailBits = [
      cakeState.size ? `Size ${cakeState.size}` : "",
      cakeState.sponges.length ? `Sponge ${cakeState.sponges.join(" + ")}` : "",
      selectedSugarSponges().length
        ? `Sugar added sponge ${selectedSugarSponges().join(" + ")}`
        : "",
      cakeTheme ? `Theme ${cakeTheme}` : "",
    ].filter(Boolean);

    const rows = (q.lines || [])
      .filter((line) => !line.note)
      .map((line) => {
        const price = formatIdrInvoice(line.value);
        return `<tr>
          <td class="qp-details">${escapeHtml(line.label)}${
            line.detail
              ? `<div class="qp-note">${escapeHtml(line.detail)}</div>`
              : ""
          }</td>
          <td class="qp-num">${escapeHtml(price)}</td>
          <td class="qp-qty">1</td>
          <td class="qp-num">${escapeHtml(price)}</td>
        </tr>`;
      })
      .join("");

    const tbcRows = (q.lines || [])
      .filter((line) => line.note)
      .map(
        (line) => `<tr>
          <td class="qp-details">${escapeHtml(line.label)}</td>
          <td class="qp-num">TBC</td>
          <td class="qp-qty">1</td>
          <td class="qp-num">TBC</td>
        </tr>`
      )
      .join("");

    const contact = window.TinyContact?.readContact?.() || {};
    const metaBlock = `
      <div class="qp-meta">
        <div class="qp-meta-left">
          <div><strong>Name</strong> : ${escapeHtml(child)}</div>
          <div><strong>Phone</strong> : ${escapeHtml(contact.phone || "")}</div>
          <div><strong>Email</strong> : ${escapeHtml(contact.email || "")}</div>
          <div><strong>Time</strong> : ${escapeHtml(partyTimeValue() || "")}</div>
          <div><strong>Total Pax</strong> : ${escapeHtml(guests === "—" ? "" : guests)}</div>
          <div><strong>Theme</strong> : ${escapeHtml(theme)}</div>
        </div>
        <div class="qp-meta-right">
          <div><strong>Date</strong> : ${escapeHtml(
            dateLabel || (pkg ? `${pkg.name} estimate` : "")
          )}</div>
        </div>
      </div>`;

    const header = `
      <div class="qp-header">
        <img class="qp-logo" src="${logoSrc}" alt="Tiny">
        <h1 class="qp-title">Birthday Bash<br>at Tiny</h1>
      </div>`;

    return `
<div class="qp-page">
  ${header}
  ${metaBlock}
  <table class="qp-items">
    <thead>
      <tr>
        <th>Details</th>
        <th class="qp-num">Price</th>
        <th class="qp-qty">Qty</th>
        <th class="qp-num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${
        rows ||
        `<tr><td class="qp-details">No package selected</td><td class="qp-num">—</td><td class="qp-qty">—</td><td class="qp-num">—</td></tr>`
      }
      ${tbcRows}
    </tbody>
  </table>
  <div class="qp-totals-wrap">
    <div class="qp-totals">
      <div class="qp-totals-row"><span>Total :</span><span>${escapeHtml(formatIdrInvoice(q.subtotal))}</span></div>
      <div class="qp-totals-row"><span>Service (+5%) :</span><span>${escapeHtml(formatIdrInvoice(q.service))}</span></div>
      <div class="qp-totals-row"><span>Tax (+10%) :</span><span>${escapeHtml(formatIdrInvoice(q.tax))}</span></div>
      <div class="qp-totals-row is-grand"><span>TOTAL:</span><span class="qp-amount">${escapeHtml(formatIdrInvoice(q.total))}</span></div>
      <div class="qp-totals-row is-dp"><span>DP 30% :</span><span>${escapeHtml(formatIdrInvoice(dp))}</span></div>
    </div>
  </div>
  <p class="qp-estimate">Estimate only — final quotation confirmed by Tiny. Items marked TBC are priced on request.</p>
  <img class="qp-flowers" src="${flowers1}" alt="" crossorigin="anonymous">
</div>
<div class="qp-page">
  ${header}
  ${metaBlock}
  <h2 class="qp-rules-title">Reservation Rules:</h2>
  <div class="qp-rules-grid">
    <div class="qp-rule">
      <h4>Hold Time for Reservations:</h4>
      <p>Reservations will be held for a maximum of 20 minutes after the designated reservation time. If guests fail to arrive within this time frame, the reservation may be released to accommodate other diners.</p>
    </div>
    <div class="qp-rule">
      <h4>Cancellation Policy:</h4>
      <p>Guests are kindly requested to provide at least 24 hours notice for any cancellations or changes to their reservation. Failure to do so may result in a cancellation fee or restriction on future reservations. There is no refund for any cancellations.</p>
    </div>
    <div class="qp-rule">
      <h4>Outside Food and Drinks:</h4>
      <p>No outside food or drinks are permitted.</p>
    </div>
    <div class="qp-rule">
      <h4>Service Charge and Taxes:</h4>
      <p>All reservations are subject to a 5% service charge and a 10% tax, as per local regulations. Prices exclude service charge and taxes unless otherwise stated.</p>
    </div>
    <div class="qp-rule">
      <h4>Availability and Capacity:</h4>
      <p>Reservations are subject to availability and capacity limits.</p>
    </div>
    <div class="qp-rule">
      <h4>Special Requests:</h4>
      <p>Guests must ensure all special requests are communicated and provide mandatory details at least 4 days before the event.</p>
    </div>
  </div>
  <img class="qp-flowers qp-flowers--right" src="${flowers2}" alt="" crossorigin="anonymous">
</div>${
      partyState.decorThemeId === "custom" && document.getElementById("backdrop-canvas")
        ? `
<div class="qp-page">
  ${header}
  ${metaBlock}
  <h2 class="qp-rules-title">Backdrop mockup</h2>
  <img class="qp-mockup" src="${document.getElementById("backdrop-canvas").toDataURL("image/jpeg", 0.9)}" alt="Custom decoration mockup">
  <p class="qp-estimate">Balloon colours: ${escapeHtml(backdropPaletteLabel())}. Prints: ${escapeHtml(backdropPrintsLabel())}. Briefing mockup only.</p>
</div>`
        : ""
    }${
      cakeImage?.dataUrl
        ? `
<div class="qp-page">
  ${header}
  ${metaBlock}
  <h2 class="qp-rules-title">Cake design</h2>
  <img class="qp-cake" src="${cakeImage.dataUrl}" alt="Cake design" crossorigin="anonymous">
  <p class="qp-estimate">${escapeHtml(cakeCaption)}${
          cakeDetailBits.length ? `. ${escapeHtml(cakeDetailBits.join(" · "))}` : ""
        }. Reference for Tiny — final cake may vary.</p>
</div>`
        : ""
    }`;
  }

  async function waitForImages(root) {
    const imgs = [...root.querySelectorAll("img")];
    await Promise.all(
      imgs.map((img) =>
        img.complete && img.naturalWidth
          ? Promise.resolve()
          : new Promise((res) => {
              img.onload = res;
              img.onerror = res;
            })
      )
    );
  }

  async function exportQuotationPdf() {
    const status = document.getElementById("send-status");
    if (!partyState.packageId) {
      if (status) {
        status.textContent = "Please choose a package first.";
        status.className = "form-status is-error";
      }
      goToStep("package");
      showStepGate("Please choose a package first.");
      return;
    }
    const incomplete = firstIncompleteRequiredStep();
    if (incomplete !== "send") {
      if (status) {
        status.textContent = stepIncompleteMessage(incomplete);
        status.className = "form-status is-error";
      }
      goToStep(incomplete);
      showStepGate(stepIncompleteMessage(incomplete));
      return;
    }

    if (status) {
      status.textContent = "Preparing PDF…";
      status.className = "form-status";
    }

    try {
      const blob = await buildQuotationPdfBlob();
      const partyDate = document.getElementById("party-date")?.value || "estimate";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Tiny-Birthday-Quotation-${partyDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      track("builder_export_pdf", { package: partyState.packageId });
      if (status) {
        status.textContent = "PDF downloaded.";
        status.className = "form-status is-success";
      }
    } catch (err) {
      console.error(err);
      if (status) {
        status.textContent = "Could not export PDF. Please try again.";
        status.className = "form-status is-error";
      }
    }
  }

  function buildRequestPayload() {
    const pkg = selectedPackage();
    const q = buildQuotation();
    const { kids, adults } = guestCounts();
    const cfg = getBackdropConfig();
    const cakeTheme = document.getElementById("cake-theme")?.value.trim() || "";
    return {
      builderVersion: BUILDER_VERSION,
      party: {
        date: document.getElementById("party-date")?.value || "",
        time: partyTimeValue(),
        endTime: partyEndTimeLabel(),
        durationHours: PARTY_DURATION_HOURS,
        day: partyState.day,
        childName: document.getElementById("child-name")?.value.trim() || "",
        childAge: document.getElementById("child-age")?.value.trim() || "",
        guestKids: kids,
        guestAdults: adults,
        foodNotes: document.getElementById("food-notes")?.value.trim() || "",
        notes: document.getElementById("party-notes")?.value.trim() || "",
      },
      reservation: {
        name: document.getElementById("child-name")?.value.trim() || "",
        area: partyTables()[0]?.area || partyState.tableArea || "terrace",
        tableIds: partyState.tableIds || [],
        tableNumbers: partyTables().map((table) => table.number),
        tableLabel: partyTableLabel(),
        guests: totalGuests(),
      },
      package: pkg
        ? {
            id: pkg.id,
            name: pkg.name,
            priceLabel: packagePrice(pkg),
            priceValue: packagePriceValue(pkg),
          }
        : {},
      decor: {
        packageId: partyState.decorPackageId || "",
        packageLabel: decorPackageLabel(),
        themeId: partyState.decorThemeId || "",
        themeLabel: decorThemeLabel(),
        designRequest: designRequestValue(),
        backdropMode: cfg.mode || "",
        backdropName: backdropNameValue(),
        balloonColours: activeBackdropColours().map((c) => ({
          id: c.id,
          label: c.label,
          hex: backdropState.colours[c.id],
          original: c.original,
        })),
        prints: activeBackdropPanels()
          .filter((p) => backdropState.panels[p.id])
          .map((p) => ({
            panelId: p.id,
            originalName: backdropState.panels[p.id]?.name || "",
          })),
      },
      cake: {
        size: cakeState.size || "",
        sponges: cakeState.sponges.slice(),
        sugarSponge: selectedSugarSponges().join(" + "),
        mode: cakeState.mode,
        design: cakeState.design || "",
        designId: selectedCakeRecord()?.id || "",
        designSrc: selectedCakeRecord()?.src || "",
        theme: cakeTheme,
        diet: cakeState.addons.length ? cakeState.addons.slice() : [DIET_NONE],
        referenceOriginalName: cakeState.fileName || "",
        imageSource:
          cakeState.mode === "own" && (cakeState.file || cakeState.fileName)
            ? "upload"
            : cakeState.mode === "gallery" && cakeState.design
              ? "gallery"
              : "",
      },
      addons: {
        masterclassId: partyState.masterclassId || "",
        masterclassLabel: masterclassLabel(),
        extras: partyState.extras.map((id) => {
          const found = flatExtraItems().find((x) => x.id === id);
          return found
            ? { id, name: found.name, priceValue: found.priceValue || 0 }
            : { id, name: id, priceValue: 0 };
        }),
      },
      quote: {
        currency: "IDR",
        lines: (q.lines || []).map((line) => ({
          label: line.label,
          value: line.value || 0,
          note: Boolean(line.note),
          detail: line.detail || null,
        })),
        subtotal: q.subtotal,
        service: q.service,
        tax: q.tax,
        total: q.total,
        dp30: Math.round(q.total * 0.3),
      },
    };
  }

  async function collectSubmitFiles() {
    const files = {};
    const compress = window.TinySubmit?.compressImage;
    const toBlob = window.TinySubmit?.canvasToBlob;

    if (statusPreparing) statusPreparing("Preparing quotation PDF…");
    const cakeImage = await resolveCakeImageAssets();
    const pdfBlob = await buildQuotationPdfBlobFromAssets(cakeImage);
    files.quotePdf = new File([pdfBlob], "quotation.pdf", { type: "application/pdf" });

    const cfg = getBackdropConfig();
    const canvas = document.getElementById("backdrop-canvas");
    if (partyState.decorThemeId === "custom" && cfg.mode === "full" && canvas && !canvas.hidden) {
      await renderBackdropPreview();
      const backdropBlob = toBlob
        ? await toBlob(canvas, "image/jpeg", 0.85)
        : null;
      if (backdropBlob) {
        files.backdrop = new File([backdropBlob], "backdrop.jpg", { type: "image/jpeg" });
      }
    }

    for (const panel of activeBackdropPanels()) {
      const slot = backdropState.panels[panel.id];
      if (!slot?.file) continue;
      const compressed = compress ? await compress(slot.file) : slot.file;
      files[`print_${panel.id}`] = compressed;
    }

    if (cakeImage?.file) {
      files.cakePhoto = cakeImage.file;
    }

    return files;
  }

  async function buildQuotationPdfBlobFromAssets(cakeImage) {
    if (partyState.decorThemeId === "custom") {
      await renderBackdropPreview();
    }

    document.getElementById("quote-pdf-root")?.remove();
    ensureQuotePdfStyles();

    const host = document.createElement("div");
    host.id = "quote-pdf-root";
    host.className = "quote-pdf-root";
    host.setAttribute("aria-hidden", "true");
    host.style.cssText =
      "position:absolute;left:0;top:0;width:794px;z-index:2147483000;pointer-events:none;opacity:1;background:#fffaf6;";
    host.innerHTML = buildQuotationPdfMarkup(cakeImage || null);
    document.body.appendChild(host);

    try {
      await loadPdfLibs();
      await waitForImages(host);
      if (document.fonts?.ready) await document.fonts.ready;
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const pages = [...host.querySelectorAll(".qp-page")];
      if (!pages.length) throw new Error("No quotation pages to export");

      const JsPDF = window.jspdf.jsPDF;
      const pdf = new JsPDF({
        unit: "mm",
        format: "a4",
        orientation: "portrait",
        compress: true,
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i += 1) {
        const canvas = await window.html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#fffaf6",
          scrollX: 0,
          scrollY: -window.scrollY,
          windowWidth: 794,
          logging: false,
          onclone: (doc) => {
            const clonedRoot = doc.getElementById("quote-pdf-root");
            if (clonedRoot) {
              clonedRoot.style.left = "0";
              clonedRoot.style.top = "0";
              clonedRoot.style.opacity = "1";
              clonedRoot.style.position = "static";
            }
          },
        });
        const img = canvas.toDataURL("image/jpeg", 0.98);
        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", 0, 0, pageW, pageH, undefined, "FAST");
      }

      return pdf.output("blob");
    } finally {
      host.remove();
    }
  }

  async function buildQuotationPdfBlob() {
    const cakeImage = await resolveCakeImageAssets();
    return buildQuotationPdfBlobFromAssets(cakeImage);
  }

  let statusPreparing = null;

  function openWhatsAppWithMessage(message) {
    window.open(`${WA_BASE}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function composeWhatsAppMessage(publicCode) {
    const contact = window.TinyContact?.readContact?.() || {};
    const base = composeWhatsAppMessageBody();
    const head = [
      publicCode ? `Request code: ${publicCode}` : "",
      contact.email ? `Email: ${contact.email}` : "",
      contact.phone ? `WhatsApp: ${contact.phone}` : "",
    ].filter(Boolean);
    return head.length ? `${head.join("\n")}\n\n${base}` : base;
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
    const locked = !canSelectPackage();
    grid.innerHTML = partyData.packages
      .map((pkg) => {
        const selected = partyState.packageChosen && pkg.id === partyState.packageId;
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
          }${locked ? " is-locked" : ""}" data-package="${escapeHtml(pkg.id)}"${
            locked ? ' aria-disabled="true" tabindex="-1"' : ""
          }>
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
        if (!canSelectPackage()) {
          renderPackageHint();
          goToStep("details");
          showStepGate("Enter how many people before you can choose a package.");
          return;
        }
        applyPackageSelection(btn.dataset.package);
        track("builder_package", { package: partyState.packageId });
        updateStepProgress();
      });
    });
    renderPackageHint();
  }

  const DECOR_RANK = { simple: 1, optimal: 2, terrace: 3 };
  const DECOR_UPGRADE_PRICE = {
    simple: 950000,
    optimal: 2400000,
    terrace: 4000000,
  };

  function decorRank(id) {
    return DECOR_RANK[id] || 0;
  }

  function includedDecorId() {
    const pkg = selectedPackage();
    return pkg?.decorId || "simple";
  }

  function canSelectDecor(id) {
    if (staffRequestId) return true;
    return decorRank(id) >= decorRank(includedDecorId());
  }

  function decorUpgradeNote(d) {
    const included = includedDecorId();
    if (d.id === included) return "Included with your package";
    if (decorRank(d.id) < decorRank(included)) return "Below your package";
    const price = DECOR_UPGRADE_PRICE[d.id];
    return price ? `Upgrade · ${formatIdr(price)}` : "Upgrade available";
  }

  function renderDecorPackages() {
    const grid = document.getElementById("decor-package-grid");
    if (!grid) return;
    const items = partyData.decorPackages || [];
    const selectedId = partyState.decorPackageId || includedDecorId();
    if (!canSelectDecor(selectedId)) {
      partyState.decorPackageId = includedDecorId();
    }
    grid.classList.add("photo-grid--decor");
    grid.dataset.emphasize = partyState.decorPackageId || includedDecorId();
    grid.innerHTML = items
      .map((d) => {
        const selected = d.id === partyState.decorPackageId;
        const locked = !canSelectDecor(d.id);
        const list = (d.items || []).map((i) => `<li>${escapeHtml(i)}</li>`).join("");
        const classes = [
          "photo-card",
          "photo-card--decor-pkg",
          selected ? "is-selected" : "is-compact",
          locked ? "is-locked" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `
          <button type="button" class="${classes}" data-decor-pkg="${escapeHtml(d.id)}"${
            locked ? ' aria-disabled="true" disabled' : ""
          }>
            <div class="photo-card__media">
              <img src="${escapeHtml(d.image)}" alt="" width="800" height="1000" loading="lazy">
            </div>
            <div class="photo-card__body">
              <h3>${escapeHtml(d.name)}</h3>
              <p>${escapeHtml(decorUpgradeNote(d))}</p>
              <ul>${list}</ul>
            </div>
          </button>`;
      })
      .join("");
    grid.querySelectorAll("[data-decor-pkg]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.decorPkg;
        if (!canSelectDecor(id)) return;
        const changed = partyState.decorPackageId !== id;
        partyState.decorPackageId = id;
        partyState.decorReviewed = true;
        if (changed) resetBackdropForPackage();
        renderDecorPackages();
        updateBackdropBuilderUI();
        renderSummary();
        updateStepProgress();
        openCustomBuilderModal();
      });
    });
  }

  function renderThemeCollage() {
    const host = document.getElementById("theme-collage");
    if (!host) return;
    const themes = partyData.decorThemes || [];
    const collageThemes = THEME_COLLAGE_IDS.map((id) => themes.find((t) => t.id === id)).filter(Boolean);
    host.removeAttribute("aria-hidden");
    host.innerHTML = collageThemes
      .map(
        (t) => `
        <div class="theme-collage__item">
          <img src="${escapeHtml(t.image)}" alt="" width="400" height="500" loading="lazy">
          <span class="theme-collage__caption">${escapeHtml(t.name)}</span>
        </div>`
      )
      .join("");
  }

  function renderDecorThemes() {
    renderThemeCollage();
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
      const designRequest = designRequestValue();
      const prints = activeBackdropPanels().filter((p) => backdropState.panels[p.id]).length;
      const bits = [];
      if (designRequest) bits.push(`design request: ${designRequest}`);
      if (prints) bits.push(`${prints} print${prints === 1 ? "" : "s"}`);
      if (backdropColoursChanged()) bits.push("custom balloon colours");
      const name = backdropNameValue();
      if (name) bits.push(`name “${name}”`);
      return bits.length ? `Custom · ${bits.join(" · ")}` : "Build your own";
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
    const noneSelected = partyState.masterclassReviewed && !partyState.masterclassId;
    if (noneBtn) noneBtn.classList.toggle("is-selected", noneSelected);

    grid.innerHTML = partyData.masterclasses
      .map(
        (m) => `
        <button type="button" class="photo-card photo-card--addon photo-card--selectable${
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
      partyState.masterclassReviewed = true;
      renderMasterclasses();
      renderSummary();
      markAddonsReviewed();
      updateStepProgress();
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

  function clearEntertainmentExtras() {
    const entIds = new Set(entertainmentExtraIds());
    partyState.extras = partyState.extras.filter((id) => !entIds.has(id));
  }

  function toggleExtra(id, groupIds) {
    const entIds = new Set(entertainmentExtraIds());
    if (entIds.has(id) || (groupIds && groupIds.some((g) => entIds.has(g)))) {
      partyState.entertainmentReviewed = true;
    }
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
    updateStepProgress();
  }

  function renderExtras() {
    const entEl = document.getElementById("extras-entertainment");
    const noneEntBtn = document.getElementById("no-entertainment");
    if (noneEntBtn) {
      const noneEntSelected = partyState.entertainmentReviewed && !hasEntertainmentExtra();
      noneEntBtn.classList.toggle("is-selected", noneEntSelected);
      if (!noneEntBtn.dataset.bound) {
        noneEntBtn.dataset.bound = "1";
        noneEntBtn.addEventListener("click", () => {
          clearEntertainmentExtras();
          partyState.entertainmentReviewed = true;
          renderExtras();
          renderSummary();
          markAddonsReviewed();
          updateStepProgress();
        });
      }
    }
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
              <div class="photo-card photo-card--addon${selectedOpt ? " is-selected" : ""}">
                ${mediaExpandHtml(item.image || "", item.name)}
                <div class="photo-card__body">
                  <h4>${escapeHtml(item.name)}</h4>
                  <div class="magic-options" data-magic-ids="${escapeHtml(optionIds.join(","))}">${opts}</div>
                </div>
              </div>`;
          }
          return `
            <button type="button" class="photo-card photo-card--addon photo-card--selectable${
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
      selectedSugarSponges().length
        ? `Sugar added sponge: ${selectedSugarSponges().join(" + ")}`
        : "",
      cakeState.mode === "gallery" && cakeState.design
        ? `Cake design: ${cakeState.design}`
        : "",
      cakeState.mode === "own" ? "Cake design: my own idea" : "",
      theme ? `Cake theme/name: ${theme}` : "",
      cakeState.addons.length
        ? `Cake diet: ${cakeState.addons.join(", ")}`
        : "Cake diet: No special requirements",
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

    const contact = window.TinyContact?.readContact?.() || {};
    const rows = [
      ["Contact", [contact.email, contact.phone].filter(Boolean).join(" · ") || "—"],
      ["Package", pkg ? `${pkg.name} · ${packagePrice(pkg)}` : "—"],
      ["Tables", partyTableLabel() || "—"],
      ["Day", partyState.day === "weekend" ? "Weekend" : "Weekday"],
      ["Decoration package", decorPackageLabel()],
      ["Decoration look", decorThemeLabel()],
      ...(partyState.decorThemeId === "custom"
        ? [
            ["Design request", designRequestValue() || "—"],
            ["Backdrop prints", backdropPrintsLabel()],
            ["Balloon colours", backdropPaletteLabel()],
          ]
        : []),
      ["Party date", partyDate],
      [
        "Party time",
        partyTimeValue()
          ? `${partyTimeValue()} – ${partyEndTimeLabel() || "—"} (${PARTY_DURATION_HOURS} hours)`
          : "—",
      ],
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

  function composeWhatsAppMessageBody() {
    const pkg = selectedPackage();
    const partyDate = document.getElementById("party-date")?.value || "";
    const guests = guestLabel();
    const child = document.getElementById("child-name")?.value.trim() || "";
    const age = document.getElementById("child-age")?.value.trim() || "";
    const notes = document.getElementById("party-notes")?.value.trim() || "";
    const foodNotes = document.getElementById("food-notes")?.value.trim() || "";
    const cakeTheme = document.getElementById("cake-theme")?.value.trim() || "";
    const designRequest = designRequestValue();
    const q = buildQuotation();

    const lines = [
      "Hi Tiny! I'd like to build a birthday party.",
      pkg ? `Package: ${pkg.name} (${packagePrice(pkg)}, ${partyState.day})` : "",
      partyTableLabel() ? `Tables: ${partyTableLabel()}` : "",
      `Decoration package: ${decorPackageLabel()}`,
      `Decoration look: ${decorThemeLabel()}`,
      designRequest && partyState.decorThemeId === "custom"
        ? `Design request (build for us): ${designRequest}`
        : "",
      ...(partyState.decorThemeId === "custom"
        ? [
            getBackdropConfig().mode === "full"
              ? `Custom backdrop prints: ${backdropPrintsLabel()}`
              : "",
            activeBackdropColours().length ? `Balloon colours: ${backdropPaletteLabel()}` : "",
            backdropNameValue() ? `Name on backdrop: ${backdropNameValue()}` : "",
            getBackdropConfig().mode === "full"
              ? "Custom backdrop mockup was saved with this request."
              : "",
          ].filter(Boolean)
        : []),
      partyDate ? `Party date: ${partyDate}` : "",
      partyTimeValue()
        ? `Start time: ${partyTimeValue()} (${PARTY_DURATION_HOURS} hours, until ${partyEndTimeLabel() || "—"})`
        : "",
      guests !== "—" ? `Guests: ${guests}` : "",
      child ? `Birthday child: ${child}${age ? ` (turning ${age})` : ""}` : "",
      foodNotes ? `Food / allergies: ${foodNotes}` : "",
      notes ? `Notes: ${notes}` : "",
      "",
      "— Cake —",
      cakeState.size ? `Size: ${cakeState.size}` : "",
      cakeState.sponges.length ? `Sponge: ${cakeState.sponges.join(" + ")}` : "",
      selectedSugarSponges().length
        ? `Sugar added sponge: ${selectedSugarSponges().join(" + ")}`
        : "",
      cakeState.mode === "gallery" && cakeState.design
        ? `Design from your gallery: ${cakeState.design}`
        : "",
      cakeState.mode === "own" ? "Design: my own idea" : "",
      cakeTheme ? `Theme on cake: ${cakeTheme}` : "",
      cakeState.addons.length ? `Diet: ${cakeState.addons.join(", ")}` : "Diet: No special requirements",
      cakeState.fileName ? `Cake reference photo uploaded: ${cakeState.fileName}` : "",
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
    const exportBtn = document.getElementById("export-quote-pdf");
    const status = document.getElementById("send-status");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => {
        exportQuotationPdf();
      });
    }
    if (!btn) return;

    const setStatus = (text, kind) => {
      if (!status) return;
      status.textContent = text || "";
      status.className = kind ? `form-status ${kind}` : "form-status";
    };

    const runSaveAndSend = async () => {
      setStatus("");
      if (!partyState.packageChosen || !partyState.packageId) {
        setStatus("Please choose a package first.", "is-error");
        goToStep("package");
        showStepGate("Please choose a package first.");
        return;
      }
      const incomplete = firstIncompleteRequiredStep();
      if (incomplete !== "send") {
        setStatus(stepIncompleteMessage(incomplete), "is-error");
        goToStep(incomplete);
        showStepGate(stepIncompleteMessage(incomplete));
        return;
      }
      const contact = window.TinyContact?.validateContact?.();
      if (!contact?.ok) {
        setStatus(contact?.message || "Please add an email or WhatsApp number.", "is-error");
        window.TinyContact?.markContactValidity?.(false);
        goToStep("details");
        showStepGate(contact?.message || "Please add an email or WhatsApp number.");
        return;
      }
      window.TinyContact?.markContactValidity?.(true);

      if (!window.TinySubmit?.submitRequest) {
        setStatus("Saving is not configured yet.", "is-error");
        return;
      }

      btn.disabled = true;
      if (exportBtn) exportBtn.disabled = true;
      statusPreparing = (msg) => setStatus(msg || "Saving your request…");

      try {
        statusPreparing("Preparing quotation PDF…");
        const files = await collectSubmitFiles();
        const payload = buildRequestPayload();
        const result = await window.TinySubmit.submitRequest({
          source: "party_builder",
          payload,
          files,
          onProgress: statusPreparing,
          extraClient: { builderVersion: BUILDER_VERSION },
        });
        const code = result.publicCode || "";
        track("builder_save_success", {
          package: partyState.packageId,
          publicCode: code,
        });
        track("builder_send", {
          package: partyState.packageId,
          masterclass: partyState.masterclassId || "none",
          extras: partyState.extras.join(","),
          publicCode: code,
          saved: true,
        });
        setStatus(
          code ? `Saved as ${code}. Opening WhatsApp…` : "Saved. Opening WhatsApp…",
          "is-success"
        );
        openWhatsAppWithMessage(composeWhatsAppMessage(code));
      } catch (err) {
        console.error(err);
        track("builder_send_failed", { message: String(err?.message || err) });
        setStatus(err?.message || "Could not save the request.", "is-error");
        const retry = document.createElement("button");
        retry.type = "button";
        retry.className = "btn btn--outline-light";
        retry.textContent = "Retry save";
        retry.style.marginTop = "8px";
        const waAnyway = document.createElement("button");
        waAnyway.type = "button";
        waAnyway.className = "btn btn--outline-light";
        waAnyway.textContent = "Open WhatsApp anyway";
        waAnyway.style.marginTop = "8px";
        const actions = document.querySelector(".summary-actions");
        document.getElementById("send-retry-row")?.remove();
        const row = document.createElement("div");
        row.id = "send-retry-row";
        row.style.display = "flex";
        row.style.flexDirection = "column";
        row.style.gap = "8px";
        row.append(retry, waAnyway);
        actions?.appendChild(row);
        retry.addEventListener("click", () => {
          row.remove();
          runSaveAndSend();
        });
        waAnyway.addEventListener("click", () => {
          openWhatsAppWithMessage(composeWhatsAppMessage());
        });
      } finally {
        statusPreparing = null;
        btn.disabled = false;
        if (exportBtn) exportBtn.disabled = false;
      }
    };

    btn.addEventListener("click", () => {
      runSaveAndSend();
    });

    [
      "party-date",
      "party-time",
      "guest-kids",
      "guest-adults",
      "child-name",
      "child-age",
      "contact-email",
      "contact-phone",
      "contact-dial",
      "contact-dial-search",
      "party-notes",
      "food-notes",
      "cake-theme",
      "decor-design-request",
      "backdrop-name",
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        renderSummary();
        updateStepProgress();
      });
      el.addEventListener("change", () => {
        renderSummary();
        updateStepProgress();
      });
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
    closeCustomBuilderModal();
    closeGuestLimitModal();
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
    const includedSize = partyState.packageChosen && pkg?.cakeSize ? pkg.cakeSize : "";
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
        updateStepProgress();
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

  function isStepComplete(stepId) {
    switch (stepId) {
      case "intro":
        return true;
      case "details":
        return detailsAreComplete();
      case "package":
        return (
          partyState.packageChosen &&
          Boolean(partyState.packageId) &&
          (partyState.tableIds || []).length > 0 &&
          unavailablePartyTables().length === 0
        );
      case "decor":
        return partyState.decorReviewed || partyState.decorThemeId === "custom";
      case "cakes":
        return flavourCount() > 0 && Boolean(cakeState.size);
      case "addons":
        return partyState.masterclassReviewed && partyState.entertainmentReviewed;
      case "food":
        return partyState.foodReviewed;
      case "send":
        return BUILDER_STEPS.every((id) => isStepComplete(id));
      default:
        return false;
    }
  }

  function stepIncompleteMessage(stepId) {
    switch (stepId) {
      case "details":
        return "Please fill out the required details, including email or WhatsApp.";
      case "package":
        return "Please choose a package and available tables.";
      case "decor":
        return "Please choose a decoration look or build your own.";
      case "cakes":
        return "Please choose a cake size and at least one sponge flavour.";
      case "addons":
        return "Please choose a masterclass and entertainment option, or select no add on.";
      case "food":
        return "Please review food and drink, then continue.";
      default:
        return "Please complete this step to continue.";
    }
  }

  function showStepGate(message) {
    const el = document.getElementById("step-gate");
    if (!el) return;
    if (!message) {
      el.hidden = true;
      el.textContent = "";
      return;
    }
    el.hidden = false;
    el.textContent = message;
  }

  function flowIndex(stepId) {
    return BUILDER_FLOW.findIndex((step) => step.id === stepId);
  }

  function firstIncompleteRequiredStep() {
    const incomplete = BUILDER_FLOW.find((step) => step.required && !isStepComplete(step.id));
    return incomplete ? incomplete.id : "send";
  }

  function canVisitStep(stepId) {
    if (staffRequestId) return true;
    const target = flowIndex(stepId);
    if (target < 0) return false;
    for (let i = 0; i < target; i += 1) {
      const step = BUILDER_FLOW[i];
      if (!step.required) continue;
      if (!isStepComplete(step.id)) return false;
    }
    return true;
  }

  function markStepSeen(stepId) {
    if (stepId === "food") partyState.foodReviewed = true;
  }

  function updateStepChips() {
    document.querySelectorAll(".step-chip[data-step]").forEach((chip) => {
      const stepId = chip.dataset.step;
      const allowed = canVisitStep(stepId);
      chip.classList.toggle("is-active", stepId === currentStepId);
      chip.classList.toggle("is-complete", isStepComplete(stepId));
      chip.classList.toggle("is-locked", !allowed);
      chip.setAttribute("aria-disabled", allowed ? "false" : "true");
      if (stepId === currentStepId) chip.setAttribute("aria-current", "step");
      else chip.removeAttribute("aria-current");
    });
  }

  function goToStep(stepId, options = {}) {
    const fromHistory = Boolean(options.fromHistory);
    let nextId = BUILDER_FLOW.some((step) => step.id === stepId) ? stepId : "intro";
    if (!canVisitStep(nextId)) nextId = firstIncompleteRequiredStep();
    currentStepId = nextId;
    document.body.dataset.builderStep = nextId;
    document.body.classList.add("is-wizard");
    document.querySelectorAll(".builder-page").forEach((el) => {
      const active = el.id === nextId;
      el.classList.toggle("is-active", active);
      el.hidden = !active;
    });
    markStepSeen(nextId);
    showStepGate("");
    window.scrollTo({ top: 0, behavior: "auto" });
    const hash = `#${nextId}`;
    if (!fromHistory && location.hash !== hash) {
      history.pushState({ step: nextId }, "", hash);
    } else if (fromHistory && location.hash !== hash) {
      history.replaceState({ step: nextId }, "", hash);
    }
    const heading = document.querySelector(`#${nextId} h1, #${nextId} h2`);
    if (heading) {
      if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
    }
    updateStepProgress();
    updateStepChips();
    updateNextStepButton();
    syncStepsBarH();
    if (nextId === "send") renderSummary();
  }

  function validateCurrentStep(showErrors) {
    const current = BUILDER_FLOW[flowIndex(currentStepId)] || BUILDER_FLOW[0];
    if (current.id === "details") return validateDetailsSection(showErrors);
    if (current.id === "cakes") {
      const ok = isStepComplete("cakes");
      const spongeField = document.getElementById("sponge-options")?.closest(".field");
      const sugarField = document.getElementById("sugar-sponge-options")?.closest(".field");
      if (showErrors) {
        const missingFlavour = flavourCount() === 0;
        spongeField?.classList.toggle("is-invalid", missingFlavour);
        sugarField?.classList.toggle("is-invalid", missingFlavour);
      }
      return ok;
    }
    if (current.id === "decor") {
      if (partyState.decorPackageId) partyState.decorReviewed = true;
    }
    if (current.id === "food") {
      partyState.foodReviewed = true;
    }
    if (!current.required) return true;
    return isStepComplete(current.id);
  }

  function tryAdvance(e) {
    if (e) e.preventDefault();
    const current = BUILDER_FLOW[flowIndex(currentStepId)] || BUILDER_FLOW[0];
    if (!validateCurrentStep(true)) {
      showStepGate(stepIncompleteMessage(current.id));
      if (current.id === "details") {
        document.querySelector("#details .field.is-invalid")?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return false;
    }
    const next = BUILDER_FLOW[flowIndex(current.id) + 1];
    if (!next) return false;
    goToStep(next.id);
    return true;
  }

  function updateStepProgress() {
    const completed = BUILDER_STEPS.filter((id) => isStepComplete(id)).length;
    const total = BUILDER_STEPS.length;
    const fill = document.getElementById("steps-progress-fill");
    const text = document.getElementById("steps-progress-text");
    const track = document.getElementById("steps-progress-track");
    if (fill) fill.style.width = `${(completed / total) * 100}%`;
    if (text) text.textContent = `${completed} out of ${total} steps complete`;
    if (track) {
      track.setAttribute("aria-valuenow", String(completed));
      track.setAttribute("aria-valuemax", String(total));
    }
    updateStepChips();
  }

  function initCollapsibleAddons() {
    document.querySelectorAll(".addon-collapse").forEach((wrap) => {
      const toggle = wrap.querySelector(".addon-collapse__toggle");
      const panel = wrap.querySelector(".addon-collapse__panel");
      if (!toggle || !panel || toggle.dataset.bound) return;
      toggle.dataset.bound = "1";
      toggle.addEventListener("click", () => {
        const open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
        wrap.classList.toggle("is-open", !open);
        panel.hidden = open;
      });
    });
  }

  function initBuilderModals() {
    const openBtn = document.getElementById("open-custom-builder");
    if (openBtn && !openBtn.dataset.bound) {
      openBtn.dataset.bound = "1";
      openBtn.addEventListener("click", openCustomBuilderModal);
    }
    document.querySelectorAll("[data-close-builder]").forEach((el) => {
      if (el.dataset.boundClose) return;
      el.dataset.boundClose = "1";
      el.addEventListener("click", closeCustomBuilderModal);
    });
    document.querySelectorAll("[data-close-guest-limit]").forEach((el) => {
      if (el.dataset.boundCloseGuest) return;
      el.dataset.boundCloseGuest = "1";
      el.addEventListener("click", closeGuestLimitModal);
    });
  }

  function updateNextStepButton() {
    const btn = document.getElementById("next-step");
    if (!btn) return;
    const index = flowIndex(currentStepId);
    const current = BUILDER_FLOW[index] || BUILDER_FLOW[0];
    const next = BUILDER_FLOW[index + 1];
    if (!next || current.id === "send" || current.id === "intro") {
      btn.hidden = true;
      return;
    }
    btn.hidden = false;
    btn.textContent = current.nextLabel || "Next step";
    btn.setAttribute("href", next.href);
  }

  function initNextStep() {
    const btn = document.getElementById("next-step");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", tryAdvance);
  }

  function initWizard() {
    const requested = (location.hash || "#intro").replace("#", "") || "intro";
    goToStep(requested, { fromHistory: true });
    if (location.hash !== `#${currentStepId}`) {
      history.replaceState({ step: currentStepId }, "", `#${currentStepId}`);
    }
    window.addEventListener("popstate", () => {
      const stepId = (location.hash || "#intro").replace("#", "") || "intro";
      goToStep(stepId, { fromHistory: true });
    });
  }

  function initPartyTables() {
    const areas = document.getElementById("party-table-areas");
    if (!areas || areas.dataset.bound) return;
    areas.dataset.bound = "1";
    areas.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-area]");
      if (!btn) return;
      partyState.tableArea = btn.dataset.area;
      partyState.tableIds = [];
      renderPartyTables();
      renderSummary();
      updateStepProgress();
    });
  }

  function initGuestLimit() {
    ["guest-kids", "guest-adults"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.guestLimitBound) return;
      el.dataset.guestLimitBound = "1";
      el.addEventListener("input", () => {
        checkTerraceGuestLimit();
        renderPackages();
        renderPackageHint();
        assignPartyTables();
        updateStepProgress();
      });
      el.addEventListener("change", () => {
        checkTerraceGuestLimit();
        renderPackages();
        renderPackageHint();
        assignPartyTables();
        updateStepProgress();
      });
    });
    ["party-date", "party-time", "child-name", "child-age"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el || el.dataset.stepBound) return;
      el.dataset.stepBound = "1";
      el.addEventListener("input", () => {
        validateDetailsSection(false);
        updateStepProgress();
        renderSummary();
        if (id === "party-date" || id === "party-time") loadPartyOccupancy();
      });
      el.addEventListener("change", () => {
        validateDetailsSection(false);
        updateStepProgress();
        renderSummary();
        if (id === "party-date" || id === "party-time") loadPartyOccupancy();
      });
    });
  }

  function initStepChips() {
    document.querySelectorAll(".step-chip[data-step]").forEach((chip) => {
      if (chip.dataset.wizardBound) return;
      chip.dataset.wizardBound = "1";
      chip.addEventListener("click", (e) => {
        e.preventDefault();
        const stepId = chip.dataset.step;
        if (canVisitStep(stepId)) {
          goToStep(stepId);
          return;
        }
        const fallback = firstIncompleteRequiredStep();
        goToStep(fallback);
        showStepGate(stepIncompleteMessage(fallback));
      });
    });
    updateStepChips();
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
    const options = cakeData.sugarSponges || SUGAR_SPONGES;
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
      ...(cakeData.addons || []).filter((label) => label !== DIET_NONE),
    ];
    el.innerHTML = dietOptions
      .map((label) => {
        const active =
          label === DIET_NONE
            ? cakeState.addons.length === 0
            : cakeState.addons.includes(label);
        return `<button type="button" class="option-btn option-btn--sm${
          active ? " is-active" : ""
        }" data-addon="${escapeHtml(label)}">${escapeHtml(label)}</button>`;
      })
      .join("");
    el.querySelectorAll("[data-addon]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const label = btn.dataset.addon;
        if (label === DIET_NONE) {
          cakeState.addons = [];
        } else if (cakeState.addons.includes(label)) {
          cakeState.addons = cakeState.addons.filter((a) => a !== label);
        } else {
          cakeState.addons = [label];
        }
        pruneSpongesToAvailable();
        syncSugarSpongeVisibility();
        renderAddons();
        renderSpongeOptions();
        renderSugarSpongeOptions();
        renderGallery();
        renderSummary();
        updateStepProgress();
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
          cakeState.activeCake = null;
          cakeState.file = null;
          cakeState.fileName = "";
          const input = document.getElementById("ref-photo");
          const label = document.getElementById("file-label");
          if (input) input.value = "";
          if (label) label.textContent = "Tap to attach a photo";
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
        if (cakeState.mode === "own") {
          cakeState.design = "";
          cakeState.activeCake = null;
        }
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
      cakeState.file = input.files && input.files[0] ? input.files[0] : null;
      cakeState.fileName = cakeState.file ? cakeState.file.name : "";
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
        tryAdvance();
      });
    }
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

  function inferPackageId(row, payload) {
    if (payload.package?.id && partyData.packages.some((p) => p.id === payload.package.id)) {
      return payload.package.id;
    }
    const name = String(payload.package?.name || row.package_name || "").toLowerCase();
    if (name.includes("terrace") || payload.decor?.packageId === "terrace") return "terrace";
    if (name.includes("optimal") || name.includes("signature") || payload.decor?.packageId === "optimal") {
      return "signature";
    }
    if (name.includes("simple") || payload.decor?.packageId === "simple") return "simple";
    return partyData.packages[0]?.id || "signature";
  }

  async function staffClient() {
    const cfg = window.TINY_SUPABASE || {};
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    return createClient(cfg.url || "", cfg.anonKey || "");
  }

  async function hydrateStaffRequest(id) {
    const client = await staffClient();
    const { data: sessionData } = await client.auth.getSession();
    if (!sessionData.session) throw new Error("Sign in to the staff inbox first.");
    const { data: row, error } = await client.from("requests").select("*").eq("id", id).maybeSingle();
    if (error || !row) throw new Error(error?.message || "Request not found.");
    const payload = row.payload || {};
    const decor = payload.decor || {};
    const party = payload.party || {};
    const pkgId = inferPackageId(row, payload);
    const pkg = partyData.packages.find((p) => p.id === pkgId);
    partyState.packageId = pkgId;
    partyState.packageChosen = true;
    partyState.decorPackageId = decor.packageId || pkg?.decorId || "optimal";
    partyState.decorThemeId = decor.themeId || "custom";
    partyState.decorReviewed = true;
    partyState.masterclassReviewed = true;
    partyState.entertainmentReviewed = true;
    partyState.foodReviewed = true;
    partyState.tableIds = payload.reservation?.tableIds || [];
    partyState.tableArea = payload.reservation?.area || "terrace";
    if (party.day) partyState.day = party.day;
    const setVal = (fieldId, value) => {
      const el = document.getElementById(fieldId);
      if (el && value != null && value !== "") el.value = value;
    };
    setVal("party-date", row.party_date || party.date || "");
    setVal("party-time", String(row.party_time || party.time || "").slice(0, 5));
    setVal("child-name", row.child_name || party.childName || "");
    setVal("child-age", row.child_age || party.childAge || "");
    setVal("guest-kids", row.guest_kids ?? party.guestKids ?? 0);
    setVal("guest-adults", row.guest_adults ?? party.guestAdults ?? 0);
    const copy = document.getElementById("staff-decor-copy");
    if (copy) copy.textContent = `Editing decoration for ${row.public_code || "this invoice"}`;
    staffDecorRestore = { row, payload, decor, files: row.files || {} };
    resetBackdropForPackage();
    (decor.balloonColours || []).forEach((c) => {
      if (c.id && c.hex) backdropState.colours[c.id] = c.hex;
    });
    renderPackages();
    renderDecorPackages();
    renderDecorThemes();
    updateBackdropBuilderUI();
    renderSummary();
  }

  async function applyStaffDecorState() {
    const restore = staffDecorRestore;
    if (!restore) return;
    const decor = restore.decor || {};
    const nameEl = document.getElementById("backdrop-name");
    if (nameEl && decor.backdropName) {
      nameEl.value = decor.backdropName;
      backdropState.nameTouched = true;
    }
    const requestEl = document.getElementById("decor-design-request");
    if (requestEl && decor.designRequest) requestEl.value = decor.designRequest;
    (decor.balloonColours || []).forEach((c) => {
      if (c.id && c.hex) backdropState.colours[c.id] = c.hex;
    });
    renderBackdropColours();
    const prints = restore.files.prints || {};
    const client = await staffClient();
    for (const panel of activeBackdropPanels()) {
      const path = prints[panel.id];
      if (!path) continue;
      const { data } = await client.storage.from("request-files").createSignedUrl(path, 3600);
      if (data?.signedUrl) await loadPanelFromUrl(panel.id, data.signedUrl, panel.label);
    }
    scheduleBackdropRender();
  }

  async function saveStaffDecoration() {
    const status = document.getElementById("staff-decor-status");
    const setStatus = (text, kind) => {
      if (!status) return;
      status.textContent = text || "";
      status.className = kind ? `form-status ${kind}` : "form-status";
    };
    if (!staffRequestId || !staffDecorRestore?.row) {
      setStatus("No invoice loaded.", "is-error");
      return;
    }
    setStatus("Saving decoration…");
    try {
      const client = await staffClient();
      const { data: sessionData } = await client.auth.getSession();
      if (!sessionData.session) throw new Error("Sign in to the staff inbox first.");
      const row = staffDecorRestore.row;
      const payload = { ...(staffDecorRestore.payload || {}) };
      const files = { ...(row.files || {}) };
      const cfg = getBackdropConfig();
      if (partyState.decorThemeId === "custom" && cfg.mode === "full") {
        await renderBackdropPreview();
      }
      const canvas = document.getElementById("backdrop-canvas");
      if (partyState.decorThemeId === "custom" && cfg.mode === "full" && canvas && !canvas.hidden) {
        const blob = window.TinySubmit?.canvasToBlob
          ? await window.TinySubmit.canvasToBlob(canvas, "image/jpeg", 0.85)
          : null;
        if (blob) {
          const path = `${row.id}/backdrop.jpg`;
          const { error } = await client.storage.from("request-files").upload(path, blob, {
            contentType: "image/jpeg",
            upsert: true,
          });
          if (error) throw error;
          files.backdropPng = path;
        }
      }
      const prints = { ...(files.prints || {}) };
      for (const panel of activeBackdropPanels()) {
        const slot = backdropState.panels[panel.id];
        if (!slot?.file) continue;
        const compressed = window.TinySubmit?.compressImage ? await window.TinySubmit.compressImage(slot.file) : slot.file;
        const path = `${row.id}/print-${panel.id}.jpg`;
        const { error } = await client.storage.from("request-files").upload(path, compressed, {
          contentType: compressed.type || "image/jpeg",
          upsert: true,
        });
        if (error) throw error;
        prints[panel.id] = path;
      }
      if (Object.keys(prints).length) files.prints = prints;
      payload.decor = {
        ...(payload.decor || {}),
        packageId: partyState.decorPackageId || "",
        packageLabel: decorPackageLabel(),
        themeId: partyState.decorThemeId || "",
        themeLabel: decorThemeLabel(),
        designRequest: designRequestValue(),
        backdropMode: cfg.mode || "",
        backdropName: backdropNameValue(),
        balloonColours: activeBackdropColours().map((c) => ({
          id: c.id,
          label: c.label,
          hex: backdropState.colours[c.id],
          original: c.original,
        })),
        prints: activeBackdropPanels()
          .filter((p) => backdropState.panels[p.id])
          .map((p) => ({
            panelId: p.id,
            originalName: backdropState.panels[p.id]?.name || "",
          })),
      };
      const { error: saveError } = await client.from("requests").update({ payload, files }).eq("id", row.id);
      if (saveError) throw saveError;
      staffDecorRestore = { ...staffDecorRestore, payload, files, row: { ...row, payload, files } };
      setStatus("Decoration saved to invoice.", "is-success");
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "tiny-staff-decor-saved", id: row.id }, window.location.origin);
      }
    } catch (err) {
      setStatus(err.message || "Could not save decoration.", "is-error");
    }
  }

  function initStaffDecorBar() {
    if (!staffRequestId) return;
    document.body.classList.add("is-staff-edit");
    const bar = document.getElementById("staff-decor-bar");
    if (bar) bar.hidden = false;
    document.getElementById("staff-decor-save")?.addEventListener("click", () => {
      saveStaffDecoration();
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    prefixImgStrings(DEFAULT_PARTY);
    prefixImgStrings(TERRACE_BACKDROP);
    prefixImgStrings(OPTIMAL_BACKDROP);
    prefixImgStrings(BACKDROP_BY_PKG);
    partyData = prefixImgStrings(
      await loadJson(wpConfig().partyJson || "data/party.json", DEFAULT_PARTY)
    );
    cakeData = normalizeCakes(
      await loadJson(wpConfig().cakesJson || "../../cakes/data/cakes.json", DEFAULT_CAKES)
    );

    const params = new URLSearchParams(window.location.search);
    const packageParam = params.get("package");
    if (packageParam && partyData.packages.some((p) => p.id === packageParam)) {
      const pkg = partyData.packages.find((p) => p.id === packageParam);
      partyState.packageId = packageParam;
      if (pkg?.decorId) partyState.decorPackageId = pkg.decorId;
    }

    renderPackages();
    renderPackageHint();
    initPartyDate();
    renderDecorPackages();
    renderDecorThemes();
    initBackdrop();
    updateBackdropBuilderUI();
    initBuilderModals();
    initCollapsibleAddons();
    initGuestLimit();
    initPartyTables();
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
    initStepChips();
    initNextStep();
    if (staffRequestId) {
      initStaffDecorBar();
      try {
        await hydrateStaffRequest(staffRequestId);
      } catch (err) {
        const status = document.getElementById("staff-decor-status");
        if (status) {
          status.textContent = err.message || "Could not load this quotation.";
          status.className = "form-status is-error";
        }
      }
    }
    initWizard();
    if (staffRequestId && staffDecorRestore) {
      goToStep("decor", { fromHistory: true });
      openCustomBuilderModal();
      await applyStaffDecorState();
    }
    updateStepProgress();
    checkTerraceGuestLimit();
  });
})();
