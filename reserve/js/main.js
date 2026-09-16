(() => {
  "use strict";

  const WA_BASE = "https://wa.me/6282266484226";
  const NS = "http://www.w3.org/2000/svg";
  const TZ = "Asia/Makassar";

  const C = {
    peach: "#d7b08c",
    peachDeep: "#c4966e",
    brown: "#6b4a36",
    chair: "#f0e0d0",
    chairDark: "#6d6d6d",
    sofa: "#9aa89e",
    ring: "#ecdccb",
    tree: "#6a6a6a",
    sage: "#6f8578",
    sageDeep: "#5b6f64",
    cream: "#f7f5ee",
    white: "#ffffff",
    ink: "#3d4f45",
  };

  const TABLES = [
    { id: "in-lounge-n", area: "indoor", name: "Window lounge", seats: 4, hint: "Sofa + two chairs" },
    { id: "in-lounge-s", area: "indoor", name: "Coffee-bar lounge", seats: 4, hint: "Sofa + bench" },
    { id: "in-tree-sq", area: "indoor", name: "Garden square table", seats: 2, hint: "Small square by the tree" },
    { id: "in-round-nw", area: "indoor", name: "Garden round (NW)", seats: 2, hint: "Round table by the tree" },
    { id: "in-round-ne", area: "indoor", name: "Garden round (NE)", seats: 2, hint: "Round table by the tree" },
    { id: "in-round-sw", area: "indoor", name: "Garden round (SW)", seats: 2, hint: "Round table by the tree" },
    { id: "in-round-se", area: "indoor", name: "Garden round (SE)", seats: 2, hint: "Round table by the tree" },
    { id: "in-sq-ne", area: "indoor", name: "Square table by playground", seats: 4, hint: "Four chairs" },
    { id: "in-sq-e", area: "indoor", name: "Square table by entrance", seats: 4, hint: "Four chairs" },
    { id: "in-sq-s", area: "indoor", name: "Square table centre", seats: 4, hint: "Four chairs" },
    { id: "in-sq-se", area: "indoor", name: "Square table by cashier", seats: 4, hint: "Four chairs" },
    { id: "tr-lounge", area: "terrace", name: "Sofa lounge", seats: 4, hint: "Two sofas + coffee tables" },
    { id: "tr-bench-n", area: "terrace", name: "Bench table (north)", seats: 4, hint: "Two squares between benches" },
    { id: "tr-bench-s", area: "terrace", name: "Bench table (south)", seats: 4, hint: "Two squares between benches" },
    { id: "tr-corner", area: "terrace", name: "Corner lounge", seats: 5, hint: "L-sofa + side table" },
    { id: "tr-2n", area: "terrace", name: "Garden 2-top (north)", seats: 2, hint: "Two chairs" },
    { id: "tr-2s", area: "terrace", name: "Garden 2-top (south)", seats: 2, hint: "Two chairs" },
    { id: "tr-4n", area: "terrace", name: "Covered 4-top (north)", seats: 4, hint: "Long table, four chairs" },
    { id: "tr-4s", area: "terrace", name: "Covered 4-top (south)", seats: 4, hint: "Long table, four chairs" },
    { id: "tr-sq", area: "terrace", name: "Covered square table", seats: 2, hint: "Small square" },
  ];

  const CAFE = {
    name: "Tiny Healthy Family Cafe",
    address: "Gg. Anggrek Gg. Jepun No.5, Tibubeneng, Kec. Kuta Utara, Kabupaten Badung, Bali 80361, Indonesia",
  };

  const state = {
    step: 1,
    area: "indoor",
    selected: new Set(),
    guests: 2,
    time: "",
    date: "",
    occupancy: [],
    submitting: false,
  };

  function el(tag, attrs, children) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value == null || value === false) return;
      if (key === "text") node.textContent = value;
      else node.setAttribute(key, String(value));
    });
    (children || []).forEach((child) => {
      if (child) node.appendChild(child);
    });
    return node;
  }

  function tableGroup(id, glow, furniture, cx, cy, seats) {
    const table = TABLES.find((item) => item.id === id);
    const g = el("g", {
      class: "table-hit",
      id: `tbl-${id}`,
      role: "button",
      tabindex: "0",
      "data-table": id,
      "aria-pressed": "false",
      "aria-label": `${table.name}, ${table.seats} chairs`,
    });
    g.appendChild(
      el("path", {
        class: "table-glow",
        d: glow,
      })
    );
    furniture.forEach((node) => g.appendChild(node));
    g.appendChild(
      el("text", {
        class: "seat-label",
        x: cx,
        y: cy,
        "text-anchor": "middle",
        "dominant-baseline": "middle",
        text: `${seats}`,
      })
    );
    g.appendChild(el("title", { text: `${table.name} · ${table.seats} chairs` }));
    return g;
  }

  function rect(x, y, w, h, fill, extra) {
    return el("rect", Object.assign({ x, y, width: w, height: h, fill, rx: extra && extra.rx != null ? extra.rx : 6 }, extra || {}));
  }

  function circle(cx, cy, r, fill) {
    return el("circle", { cx, cy, r, fill });
  }

  function text(x, y, label, extra) {
    return el("text", Object.assign({ class: "plan-label", x, y, "text-anchor": "middle", "dominant-baseline": "middle", text: label }, extra || {}));
  }

  function halfChair(cx, cy, r, dir, fill) {
    const d =
      dir === "n"
        ? `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`
        : dir === "s"
          ? `M ${cx + r} ${cy} A ${r} ${r} 0 0 1 ${cx - r} ${cy} Z`
          : dir === "e"
            ? `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} Z`
            : `M ${cx} ${cy + r} A ${r} ${r} 0 0 1 ${cx} ${cy - r} Z`;
    return el("path", { d, fill });
  }

  function clover(id, x, y) {
    const s = 58;
    const chair = 22;
    const glow = `M ${x - 18} ${y - 18} h ${s + 36} v ${s + 36} h -${s + 36} Z`;
    return tableGroup(
      id,
      glow,
      [
        halfChair(x + s / 2, y - 2, chair, "n", C.chair),
        halfChair(x + s + 2, y + s / 2, chair, "e", C.chair),
        halfChair(x + s / 2, y + s + 2, chair, "s", C.chair),
        halfChair(x - 2, y + s / 2, chair, "w", C.chair),
        rect(x, y, s, s, C.peach),
      ],
      x + s / 2,
      y + s / 2 + 1,
      4
    );
  }

  function roundTwo(id, cx, cy) {
    const r = 34;
    const glow = `M ${cx} ${cy} m -${r + 26} 0 a ${r + 26} ${r + 26} 0 1 0 ${2 * (r + 26)} 0 a ${r + 26} ${r + 26} 0 1 0 -${2 * (r + 26)} 0`;
    return tableGroup(
      id,
      glow,
      [
        halfChair(cx - r - 2, cy, 20, "w", C.chair),
        halfChair(cx + r + 2, cy, 20, "e", C.chair),
        circle(cx, cy, r, C.brown),
      ],
      cx,
      cy + 1,
      2
    );
  }

  function twoTop(id, x, y) {
    const w = 86;
    const h = 52;
    const glow = `M ${x - 28} ${y - 8} h ${w + 56} v ${h + 16} h -${w + 56} Z`;
    return tableGroup(
      id,
      glow,
      [
        halfChair(x - 2, y + h / 2, 22, "w", C.chair),
        halfChair(x + w + 2, y + h / 2, 22, "e", C.chair),
        rect(x, y, w, h, C.peach, { rx: 10 }),
      ],
      x + w / 2,
      y + h / 2 + 1,
      2
    );
  }

  function longFour(id, x, y) {
    const w = 210;
    const h = 78;
    const glow = `M ${x - 12} ${y - 28} h ${w + 24} v ${h + 56} h -${w + 24} Z`;
    return tableGroup(
      id,
      glow,
      [
        halfChair(x + 52, y - 2, 24, "n", C.chair),
        halfChair(x + 158, y - 2, 24, "n", C.chair),
        halfChair(x + 52, y + h + 2, 24, "s", C.chair),
        halfChair(x + 158, y + h + 2, 24, "s", C.chair),
        rect(x, y, w, h, C.peach, { rx: 8 }),
      ],
      x + w / 2,
      y + h / 2 + 1,
      4
    );
  }

  function benchFour(id, x, y) {
    const glow = `M ${x - 10} ${y - 10} h 176 v 196 h -176 Z`;
    return tableGroup(
      id,
      glow,
      [
        rect(x, y, 156, 28, C.chair, { rx: 14 }),
        rect(x + 6, y + 42, 68, 68, C.peach),
        rect(x + 82, y + 42, 68, 68, C.peach),
        rect(x, y + 124, 156, 28, C.chair, { rx: 14 }),
      ],
      x + 78,
      y + 76,
      4
    );
  }

  function drawIndoor() {
    const svg = el("svg", {
      viewBox: "0 0 1600 900",
      role: "img",
      "aria-label": "Indoor table layout",
    });

    svg.appendChild(rect(0, 0, 1600, 900, C.white, { rx: 0 }));
    svg.appendChild(rect(40, 8, 1520, 72, C.sage, { rx: 0 }));
    svg.appendChild(text(800, 44, "PLAYGROUND", { "font-size": 28, "letter-spacing": 8 }));
    svg.appendChild(rect(0, 220, 48, 230, C.brown, { rx: 0 }));
    svg.appendChild(
      el("text", {
        class: "plan-label",
        x: 24,
        y: 335,
        transform: "rotate(-90 24 335)",
        "text-anchor": "middle",
        "font-size": 16,
        "letter-spacing": 4,
        text: "TERRACE",
      })
    );
    svg.appendChild(rect(1552, 500, 48, 250, C.brown, { rx: 0 }));
    svg.appendChild(
      el("text", {
        class: "plan-label",
        x: 1576,
        y: 625,
        transform: "rotate(90 1576 625)",
        "text-anchor": "middle",
        "font-size": 16,
        "letter-spacing": 4,
        text: "ENTRANCE",
      })
    );
    svg.appendChild(rect(70, 820, 640, 56, C.peach, { rx: 4 }));
    svg.appendChild(text(390, 848, "COFFEE BAR", { "font-size": 16, "letter-spacing": 4, fill: C.ink, class: "plan-label plan-label--dark" }));
    svg.appendChild(rect(1080, 820, 280, 56, C.brown, { rx: 4 }));
    svg.appendChild(text(1220, 848, "CASHIER", { "font-size": 16, "letter-spacing": 3 }));

    const tree = el("g", { "pointer-events": "none" });
    tree.appendChild(circle(690, 390, 148, C.ring));
    tree.appendChild(circle(690, 390, 108, "#e4d3c2"));
    tree.appendChild(
      el("path", {
        d: "M690 300 C640 330 620 360 630 410 C650 450 670 430 690 470 C710 430 740 455 755 410 C765 360 740 325 690 300 M640 360 C660 380 680 350 700 390 M720 340 C700 380 740 400 760 370",
        fill: "none",
        stroke: C.tree,
        "stroke-width": 10,
        "stroke-linecap": "round",
      })
    );
    [
      [560, 280],
      [630, 250],
      [760, 255],
      [830, 300],
      [840, 400],
      [780, 470],
      [620, 480],
      [550, 420],
    ].forEach(([x, y], i) => {
      const dir = ["w", "n", "n", "e", "e", "s", "s", "w"][i];
      tree.appendChild(halfChair(x, y, 26, dir, C.chair));
    });
    svg.appendChild(tree);

    svg.appendChild(
      tableGroup(
        "in-lounge-n",
        "M 62 96 h 196 v 170 h -196 Z",
        [
          rect(72, 112, 34, 140, C.sofa, { rx: 16 }),
          rect(118, 112, 72, 140, C.peach, { rx: 8 }),
          halfChair(214, 148, 22, "e", C.chairDark),
          halfChair(214, 216, 22, "e", C.chairDark),
          el("text", {
            class: "plan-label",
            x: 89,
            y: 182,
            transform: "rotate(-90 89 182)",
            "font-size": 9,
            fill: C.ink,
            text: "SOFA",
          }),
        ],
        154,
        182,
        4
      )
    );

    svg.appendChild(
      tableGroup(
        "in-lounge-s",
        "M 62 404 h 196 v 170 h -196 Z",
        [
          rect(72, 420, 34, 140, C.sofa, { rx: 16 }),
          rect(118, 420, 72, 140, C.peach, { rx: 8 }),
          rect(202, 420, 34, 140, C.peachDeep, { rx: 16 }),
        ],
        154,
        490,
        4
      )
    );

    svg.appendChild(
      tableGroup(
        "in-tree-sq",
        "M 430 128 h 92 v 92 h -92 Z",
        [
          halfChair(454, 148, 18, "w", C.chair),
          rect(458, 142, 50, 50, C.peach),
        ],
        483,
        167,
        2
      )
    );

    svg.appendChild(roundTwo("in-round-nw", 560, 320));
    svg.appendChild(roundTwo("in-round-ne", 820, 300));
    svg.appendChild(roundTwo("in-round-sw", 545, 500));
    svg.appendChild(roundTwo("in-round-se", 830, 490));
    svg.appendChild(clover("in-sq-ne", 1040, 150));
    svg.appendChild(clover("in-sq-e", 1300, 210));
    svg.appendChild(clover("in-sq-s", 1060, 470));
    svg.appendChild(clover("in-sq-se", 1310, 510));
    return svg;
  }

  function drawTerrace() {
    const svg = el("svg", {
      viewBox: "0 0 1600 900",
      role: "img",
      "aria-label": "Terrace table layout",
    });
    svg.appendChild(rect(0, 0, 1600, 900, C.white, { rx: 0 }));
    svg.appendChild(rect(1140, 0, 460, 900, C.brown, { rx: 0 }));
    svg.appendChild(rect(760, 0, 380, 230, "#c5c5c5", { rx: 0 }));
    svg.appendChild(circle(170, 70, 38, C.sageDeep));
    svg.appendChild(circle(70, 560, 22, C.sageDeep));
    svg.appendChild(circle(70, 620, 22, C.sageDeep));
    svg.appendChild(circle(70, 680, 22, C.sageDeep));
    svg.appendChild(circle(1480, 830, 42, C.white));

    svg.appendChild(
      tableGroup(
        "tr-lounge",
        "M 28 96 h 250 v 220 h -250 Z",
        [
          rect(48, 120, 40, 170, C.chair, { rx: 20 }),
          rect(102, 128, 70, 70, C.peach),
          rect(102, 206, 70, 70, C.peach),
          rect(186, 120, 40, 170, C.chair, { rx: 20 }),
          rect(8, 176, 28, 56, C.brown, { rx: 4 }),
        ],
        158,
        205,
        4
      )
    );

    svg.appendChild(benchFour("tr-bench-n", 300, 40));
    svg.appendChild(benchFour("tr-bench-s", 300, 280));

    svg.appendChild(
      tableGroup(
        "tr-corner",
        "M 108 500 h 250 v 250 h -250 Z",
        [
          el("path", {
            d: "M120 560 h70 a40 40 0 0 1 40 40 v150 h-150 a40 40 0 0 1 -40 -40 v-110 a40 40 0 0 1 80 -40 Z",
            fill: C.chair,
          }),
          rect(210, 575, 78, 78, C.peach),
          halfChair(288, 614, 22, "e", C.chair),
        ],
        249,
        614,
        5
      )
    );

    svg.appendChild(twoTop("tr-2n", 700, 400));
    svg.appendChild(twoTop("tr-2s", 700, 560));
    svg.appendChild(longFour("tr-4n", 1220, 70));
    svg.appendChild(longFour("tr-4s", 1220, 330));
    svg.appendChild(
      tableGroup(
        "tr-sq",
        "M 1210 620 h 100 v 100 h -100 Z",
        [rect(1228, 638, 64, 64, C.peach)],
        1260,
        670,
        2
      )
    );
    return svg;
  }

  function baliNowParts() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const grab = (type) => parts.find((part) => part.type === type).value;
    return {
      date: `${grab("year")}-${grab("month")}-${grab("day")}`,
      hour: Number(grab("hour")),
      minute: Number(grab("minute")),
    };
  }

  function timeSlots() {
    const out = [];
    for (let minutes = 8 * 60 + 30; minutes <= 18 * 60; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      out.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
    }
    return out;
  }

  function findTable(id) {
    return TABLES.find((item) => item.id === id);
  }

  function selectedTables() {
    return [...state.selected].map(findTable).filter(Boolean);
  }

  function selectedSeats() {
    return selectedTables().reduce((sum, table) => sum + table.seats, 0);
  }

  function setStatus(message, kind) {
    const node = document.getElementById("form-status");
    if (!node) return;
    node.textContent = message || "";
    node.classList.toggle("is-error", kind === "error");
    node.classList.toggle("is-success", kind === "success");
  }

  function heldTableIds() {
    const held = new Set();
    (state.occupancy || []).forEach((item) => {
      const slot = String(item.time || "").slice(0, 5);
      if (slot !== state.time) return;
      (item.tableIds || []).forEach((id) => held.add(String(id)));
    });
    return held;
  }

  function paintTables() {
    const held = heldTableIds();
    document.querySelectorAll(".table-hit").forEach((node) => {
      const id = node.getAttribute("data-table");
      const table = findTable(id);
      const selected = state.selected.has(id);
      const isHeld = held.has(id) && !selected;
      const tooSmall = table && table.seats < state.guests && !selected && state.selected.size === 0;
      node.classList.toggle("is-selected", selected);
      node.classList.toggle("is-small", Boolean(tooSmall));
      node.classList.toggle("is-held", isHeld);
      node.setAttribute("aria-pressed", selected ? "true" : "false");
      if (isHeld) node.setAttribute("aria-disabled", "true");
      else node.removeAttribute("aria-disabled");
    });
  }

  function renderPicked() {
    const box = document.getElementById("picked");
    const meta = document.getElementById("picked-meta");
    const tables = selectedTables();
    const seats = selectedSeats();
    if (!tables.length) {
      box.innerHTML =
        "<h3>No table yet</h3><p>Tap a table on the map. Its chair count is the maximum for that seat.</p>";
      meta.hidden = true;
      return;
    }
    const areaLabel = tables.length
      ? [...new Set(tables.map((table) => (table.area === "indoor" ? "Indoor" : "Terrace")))].join(" + ")
      : state.area === "indoor"
        ? "Indoor"
        : "Terrace";
    box.innerHTML = `<h3>${tables.map((table) => table.name).join(" + ")}</h3><p>${tables
      .map((table) => table.hint)
      .join(" · ")}</p>`;
    meta.hidden = false;
    meta.innerHTML = `
      <div><dt>Chairs</dt><dd>${seats}</dd></div>
      <div><dt>Guests</dt><dd>${state.guests}</dd></div>
      <div><dt>Area</dt><dd>${areaLabel}</dd></div>
    `;
    const hint = document.getElementById("guests-hint");
    if (hint) {
      hint.textContent =
        seats < state.guests
          ? `These seats hold ${seats}. Add another table or reduce guests.`
          : `These seats hold ${seats}.`;
    }
  }

  function renderPlan() {
    const host = document.getElementById("floorplan");
    host.innerHTML = "";
    host.appendChild(state.area === "terrace" ? drawTerrace() : drawIndoor());
    host.querySelectorAll(".table-hit").forEach((node) => {
      const pick = () => toggleTable(node.getAttribute("data-table"));
      node.addEventListener("click", pick);
      node.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          pick();
        }
      });
    });
    paintTables();
    renderPicked();
  }

  function toggleTable(id) {
    const table = findTable(id);
    if (!table) return;
    if (heldTableIds().has(id) && !state.selected.has(id)) {
      setStatus("That table is already held at this time.", "error");
      return;
    }
    if (table.area !== state.area) {
      state.area = table.area;
    }
    if (state.selected.has(id)) {
      state.selected.delete(id);
    } else {
      [...state.selected].forEach((other) => {
        if (findTable(other).area !== table.area) state.selected.delete(other);
      });
      state.selected.add(id);
    }
    paintTables();
    renderPicked();
    setStatus("");
  }

  function setArea(area) {
    state.area = area;
    document.querySelectorAll(".plan-tab").forEach((tab) => {
      const on = tab.getAttribute("data-area") === area;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    renderPlan();
  }

  function setGuests(next) {
    state.guests = Math.min(16, Math.max(1, next));
    const input = document.getElementById("reserve-guests");
    if (input) input.value = String(state.guests);
    paintTables();
    renderPicked();
  }

  function parseIsoDate(value) {
    const [year, month, day] = String(value || "").split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  function addDays(iso, days) {
    const date = parseIsoDate(iso);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  }

  function prettyDate(value, opts) {
    if (!value) return "";
    return parseIsoDate(value).toLocaleDateString("en-GB", {
      weekday: opts?.weekday || "long",
      day: "numeric",
      month: opts?.month || "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function weekdayShort(value) {
    return parseIsoDate(value).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  }

  function dayNum(value) {
    return String(Number(value.split("-")[2]));
  }

  function guestName() {
    const salutation = document.getElementById("reserve-salutation")?.value || "";
    const name = document.getElementById("reserve-name")?.value.trim() || "";
    return [salutation, name].filter(Boolean).join(" ");
  }

  function tableLabel() {
    return selectedTables()
      .map((table) => `${table.name} (${table.seats} chairs)`)
      .join(", ");
  }

  function areaLabel() {
    const tables = selectedTables();
    if (!tables.length) return "";
    return [...new Set(tables.map((table) => (table.area === "indoor" ? "Indoor" : "Terrace")))].join(" + ");
  }

  function composeMessage(code) {
    const notes = document.getElementById("reserve-notes")?.value.trim() || "";
    const purpose = document.getElementById("reserve-purpose")?.value || "";
    const email = document.getElementById("contact-email")?.value.trim() || "";
    const phone = document.getElementById("contact-phone")?.value.trim() || "";
    return [
      "Hi Tiny! I’d like to reserve a table.",
      code ? `Request: ${code}` : null,
      "",
      `Name: ${guestName()}`,
      `Date: ${prettyDate(state.date)}`,
      `Time: ${state.time}`,
      `Guests: ${state.guests}`,
      areaLabel() ? `Area: ${areaLabel()}` : null,
      tableLabel() ? `Table: ${tableLabel()}` : null,
      purpose ? `Purpose: ${purpose}` : null,
      notes ? `Notes: ${notes}` : null,
      phone ? `My WhatsApp: ${phone}` : null,
      email ? `Email: ${email}` : null,
      "",
      "Please confirm if this table is free.",
    ]
      .filter((line) => line !== null)
      .join("\n");
  }

  function buildPayload() {
    const tables = selectedTables();
    return {
      party: {
        date: state.date,
        time: state.time,
        day: weekdayShort(state.date),
        guestAdults: state.guests,
      },
      reservation: {
        name: guestName(),
        salutation: document.getElementById("reserve-salutation")?.value || "",
        purpose: document.getElementById("reserve-purpose")?.value || "",
        notes: document.getElementById("reserve-notes")?.value.trim() || "",
        guests: state.guests,
        area: tables[0]?.area || state.area,
        tableIds: tables.map((table) => table.id),
        tableLabel: tableLabel(),
      },
    };
  }

  function validateStep(step) {
    if (step === 1) {
      if (!state.date) return "Please choose a date.";
      if (!state.time) return "Please choose a time.";
      return "";
    }
    if (step === 2) {
      if (!document.getElementById("reserve-name")?.value.trim()) return "Please add your name.";
      const contact = window.TinyContact?.validateContact?.();
      if (!contact?.ok) return contact?.message || "Please add an email or WhatsApp number.";
      return "";
    }
    if (step === 3) {
      const tables = selectedTables();
      const seats = selectedSeats();
      if (!tables.length) return "Please tap a table on the floor plan.";
      if (seats < state.guests) {
        return `That table seats ${seats}. Pick a larger table, add another table, or reduce the party.`;
      }
      return "";
    }
    return "";
  }

  async function loadOccupancy() {
    const cfg = window.TINY_SUPABASE || {};
    if (!cfg.url || !cfg.anonKey || !state.date) {
      state.occupancy = [];
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
        body: JSON.stringify({ target_date: state.date }),
      });
      const data = await res.json();
      state.occupancy = Array.isArray(data) ? data : [];
    } catch (_) {
      state.occupancy = [];
    }
    [...state.selected].forEach((id) => {
      if (heldTableIds().has(id)) state.selected.delete(id);
    });
    paintTables();
    renderPicked();
  }

  function setDate(value) {
    const now = baliNowParts();
    state.date = value && value >= now.date ? value : now.date;
    const input = document.getElementById("reserve-date");
    if (input) input.value = state.date;
    renderDateChips();
    disablePastTimes();
    loadOccupancy();
  }

  function renderDateChips() {
    const host = document.getElementById("date-chips");
    if (!host) return;
    const now = baliNowParts();
    let start = now.date;
    if (state.date > addDays(now.date, 3)) start = addDays(state.date, -3);
    const unique = [0, 1, 2, 3].map((offset) => addDays(start, offset));
    host.innerHTML = "";
    unique.forEach((iso) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "date-chip" + (iso === state.date ? " is-active" : "");
      btn.innerHTML = `<span>${iso === now.date ? "Today" : weekdayShort(iso)}</span><strong>${dayNum(iso)}</strong>`;
      btn.addEventListener("click", () => setDate(iso));
      host.appendChild(btn);
    });
    const more = document.createElement("button");
    more.type = "button";
    more.className = "date-more";
    more.innerHTML = `<span>${parseIsoDate(state.date).toLocaleDateString("en-GB", {
      month: "short",
      timeZone: "UTC",
    })}</span>`;
    more.addEventListener("click", () => {
      const input = document.getElementById("reserve-date");
      if (input?.showPicker) input.showPicker();
      else input?.click();
    });
    host.appendChild(more);
  }

  function disablePastTimes() {
    const now = baliNowParts();
    const buttons = document.querySelectorAll(".time-chip");
    buttons.forEach((btn) => {
      const [hour, minute] = btn.dataset.time.split(":").map(Number);
      const past = state.date === now.date && hour * 60 + minute <= now.hour * 60 + now.minute;
      btn.disabled = past;
      if (past && state.time === btn.dataset.time) {
        const next = [...buttons].find((item) => !item.disabled);
        state.time = next ? next.dataset.time : "";
      }
    });
    if (!state.time) {
      const next = [...buttons].find((item) => !item.disabled);
      state.time = next ? next.dataset.time : "";
    }
    buttons.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.time === state.time));
  }

  function renderTimes() {
    const grid = document.getElementById("time-grid");
    grid.innerHTML = "";
    timeSlots().forEach((time) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "time-chip" + (time === state.time ? " is-active" : "");
      btn.dataset.time = time;
      btn.textContent = time;
      btn.addEventListener("click", () => {
        state.time = time;
        grid.querySelectorAll(".time-chip").forEach((item) => {
          item.classList.toggle("is-active", item === btn);
        });
        [...state.selected].forEach((id) => {
          if (heldTableIds().has(id)) state.selected.delete(id);
        });
        paintTables();
        renderPicked();
        setStatus("");
      });
      grid.appendChild(btn);
    });
    disablePastTimes();
  }

  function setStep(step, options) {
    state.step = Math.min(4, Math.max(1, step));
    document.querySelectorAll(".wizard-panel").forEach((panel) => {
      const on = Number(panel.getAttribute("data-panel")) === state.step;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });
    document.querySelectorAll(".steps__item").forEach((item, index) => {
      const n = index + 1;
      item.classList.toggle("is-active", n === state.step);
      item.classList.toggle("is-done", n < state.step);
    });
    const back = document.getElementById("wizard-back");
    const next = document.getElementById("wizard-next");
    const submit = document.getElementById("wizard-submit");
    if (back) back.hidden = state.step === 1;
    if (next) next.hidden = state.step === 4;
    if (submit) submit.hidden = state.step !== 4;
    if (state.step === 3) renderPlan();
    if (state.step === 4) renderSummary();
    if (!options?.silent) {
      document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function renderSummary() {
    const host = document.getElementById("summary-card");
    if (!host) return;
    const purpose = document.getElementById("reserve-purpose")?.value || "—";
    const notes = document.getElementById("reserve-notes")?.value.trim() || "—";
    const email = document.getElementById("contact-email")?.value.trim() || "";
    const phone = document.getElementById("contact-phone")?.value.trim() || "";
    host.innerHTML = `
      <div class="summary-block">
        <p class="summary-cafe">${CAFE.name}</p>
        <p class="field__hint">${CAFE.address}</p>
      </div>
      <div class="summary-block">
        <div class="summary-head">
          <h3>Schedule</h3>
          <button class="summary-edit" type="button" data-goto="1">Edit</button>
        </div>
        <div class="summary-row">
          <div><span>Date</span><strong>${prettyDate(state.date, { weekday: "short", month: "short" })}</strong></div>
          <div><span>Time</span><strong>${state.time}</strong></div>
          <div><span>Guests</span><strong>${state.guests} pax</strong></div>
        </div>
      </div>
      <div class="summary-block">
        <div class="summary-head">
          <h3>Reservation details</h3>
          <button class="summary-edit" type="button" data-goto="2">Edit</button>
        </div>
        <p><strong>${guestName()}</strong></p>
        <p class="field__hint">${[email, phone].filter(Boolean).join(" · ") || "—"}</p>
        <p class="summary-kicker">Purpose</p>
        <p>${purpose || "—"}</p>
        <p class="summary-kicker">Table</p>
        <p>${tableLabel()} · ${areaLabel()} <button class="summary-edit" type="button" data-goto="3">Edit</button></p>
        <p class="summary-kicker">Notes</p>
        <p>${notes}</p>
      </div>
    `;
    host.querySelectorAll("[data-goto]").forEach((btn) => {
      btn.addEventListener("click", () => setStep(Number(btn.getAttribute("data-goto"))));
    });
  }

  function updateNotesCount() {
    const notes = document.getElementById("reserve-notes");
    const count = document.getElementById("notes-count");
    if (!notes || !count) return;
    count.textContent = `${notes.value.length} / ${notes.maxLength || 120}`;
  }

  function resetWizard() {
    document.getElementById("reserve-form")?.reset();
    state.selected = new Set();
    state.area = "indoor";
    setGuests(2);
    setDate(baliNowParts().date);
    setStep(1);
    setStatus("");
    updateNotesCount();
  }

  function bindForm() {
    const date = document.getElementById("reserve-date");
    const now = baliNowParts();
    date.min = now.date;
    date.value = now.date;
    state.date = now.date;
    date.addEventListener("change", () => setDate(date.value));

    const guests = document.getElementById("reserve-guests");
    guests.addEventListener("input", () => setGuests(Number(guests.value) || 1));
    document.getElementById("guests-minus").addEventListener("click", () => setGuests(state.guests - 1));
    document.getElementById("guests-plus").addEventListener("click", () => setGuests(state.guests + 1));
    document.getElementById("reserve-notes")?.addEventListener("input", updateNotesCount);

    document.querySelectorAll(".plan-tab").forEach((tab) => {
      tab.addEventListener("click", () => setArea(tab.getAttribute("data-area")));
    });

    document.getElementById("wizard-cancel")?.addEventListener("click", resetWizard);
    document.getElementById("wizard-back")?.addEventListener("click", () => {
      setStatus("");
      setStep(state.step - 1);
    });
    document.getElementById("wizard-next")?.addEventListener("click", () => {
      const error = validateStep(state.step);
      if (error) {
        setStatus(error, "error");
        return;
      }
      window.TinyContact?.markContactValidity?.(true);
      setStatus("");
      setStep(state.step + 1);
    });

    document.getElementById("reserve-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.submitting) return;
      const error = validateStep(1) || validateStep(2) || validateStep(3);
      if (error) {
        setStatus(error, "error");
        if (error.includes("time") || error.includes("date")) setStep(1);
        else if (error.includes("name") || error.includes("email") || error.includes("WhatsApp") || error.includes("number")) setStep(2);
        else setStep(3);
        return;
      }
      const submitBtn = document.getElementById("wizard-submit");
      state.submitting = true;
      if (submitBtn) submitBtn.disabled = true;
      let code = "";
      try {
        if (!window.TinySubmit?.submitRequest) throw new Error("Saving is not configured yet.");
        setStatus("Saving your reservation…");
        const result = await window.TinySubmit.submitRequest({
          source: "reservation",
          payload: buildPayload(),
          onProgress: setStatus,
        });
        code = result.publicCode || "";
        setStatus(code ? `Saved as ${code}. Opening WhatsApp…` : "Saved. Opening WhatsApp…", "success");
      } catch (err) {
        console.error(err);
        setStatus(err?.message || "Could not save. Opening WhatsApp…", "error");
      }
      window.open(`${WA_BASE}?text=${encodeURIComponent(composeMessage(code))}`, "_blank", "noopener,noreferrer");
      state.submitting = false;
      if (submitBtn) submitBtn.disabled = false;
    });
  }

  function boot() {
    if (!document.getElementById("floorplan")) return;
    bindForm();
    renderTimes();
    setDate(baliNowParts().date);
    renderPlan();
    setStep(1, { silent: true });
    updateNotesCount();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
