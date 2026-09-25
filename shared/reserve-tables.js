(() => {
  "use strict";

  const SLOT_MINUTES = 120;
  const GRACE_MINUTES = 15;
  const RES_BEFORE = 30;
  const RES_AFTER = 30;
  const BDAY_BEFORE = 60;
  const BDAY_AFTER = 180;
  const INDOOR_MAX = 8;
  const JOIN_GROUPS = [["in-1", "in-2"]];
  const OPEN_MINUTES = 8 * 60 + 30;
  const LAST_START_MINUTES = 16 * 60;
  const CLOSE_MINUTES = 18 * 60;
  const DAY_START = 7 * 60 + 30;
  const DAY_END = 19 * 60;
  const COOKING_TABLES = ["tr-18", "tr-19"];
  const COOKING_START = 14 * 60;
  const COOKING_END = 17 * 60;
  const OPTIMAL_TABLES = ["tr-18", "tr-19", "tr-12", "tr-13"];

  const TABLES = [
    { id: "in-1", area: "indoor", number: 1, name: "Table 1", seats: 4, hint: "Square by the entrance", x: 78.3, y: 33.7, w: 7.3, h: 12.6, shape: "clover" },
    { id: "in-2", area: "indoor", number: 2, name: "Table 2", seats: 4, hint: "Square by the entrance", x: 79.0, y: 64.4, w: 7.1, h: 12.6, shape: "clover" },
    { id: "in-3", area: "indoor", number: 3, name: "Table 3", seats: 4, hint: "Square by the playground", x: 65.4, y: 23.7, w: 7.1, h: 12.6, shape: "clover" },
    { id: "in-4", area: "indoor", number: 4, name: "Table 4", seats: 4, hint: "Square by the cashier", x: 66.3, y: 71.5, w: 7.1, h: 12.6, shape: "clover" },
    { id: "in-5", area: "indoor", number: 5, name: "Table 5", seats: 2, hint: "Garden round", x: 54.1, y: 33.7, w: 6.6, h: 11.2, shape: "round" },
    { id: "in-6", area: "indoor", number: 6, name: "Table 6", seats: 2, hint: "Garden round", x: 55.4, y: 62.6, w: 6.5, h: 11.1, shape: "round" },
    { id: "in-7", area: "indoor", number: 7, name: "Table 7", seats: 2, hint: "Garden round", x: 30.8, y: 61.9, w: 6.6, h: 11.2, shape: "round" },
    { id: "in-8", area: "indoor", number: 8, name: "Table 8", seats: 2, hint: "Garden round", x: 31.9, y: 33.9, w: 6.6, h: 11.2, shape: "round" },
    { id: "in-9", area: "indoor", number: 9, name: "Table 9", seats: 2, hint: "Small square by the tree", x: 27.9, y: 22.2, w: 5.0, h: 9.3, shape: "square" },
    { id: "in-11", area: "indoor", number: 11, name: "Table 11", seats: 4, hint: "Window lounge", x: 7.0, y: 14.7, w: 13.4, h: 22.9, shape: "lounge" },
    { id: "in-12", area: "indoor", number: 12, name: "Table 12", seats: 4, hint: "Coffee-bar lounge", x: 7.0, y: 65.2, w: 12.8, h: 23.3, shape: "lounge" },
    { id: "tr-12", area: "terrace", number: 12, name: "Table 12", seats: 2, hint: "Garden 2-top", x: 51.4, y: 86.9, w: 16.6, h: 12.8, shape: "pill" },
    { id: "tr-13", area: "terrace", number: 13, name: "Table 13", seats: 2, hint: "Garden 2-top", x: 51.4, y: 57.5, w: 16.6, h: 12.8, shape: "pill" },
    { id: "tr-14", area: "terrace", number: 14, name: "Table 14", seats: 5, hint: "Corner lounge", x: 19.4, y: 71.1, w: 12.0, h: 20.5, shape: "square" },
    { id: "tr-15", area: "terrace", number: 15, name: "Table 15", seats: 4, hint: "Bench table", x: 24.1, y: 36.1, w: 16.8, h: 24.5, shape: "rect" },
    { id: "tr-16", area: "terrace", number: 16, name: "Table 16", seats: 4, hint: "Bench table", x: 23.8, y: 5.0, w: 17.1, h: 24.3, shape: "rect" },
    { id: "tr-17", area: "terrace", number: 17, name: "Table 17", seats: 4, hint: "Sofa lounge", x: 0.2, y: 15.6, w: 15.6, h: 29.9, shape: "lounge" },
    { id: "tr-18", area: "terrace", number: 18, name: "Table 18", seats: 4, hint: "Covered 4-top", x: 78.4, y: 48.3, w: 17.1, h: 30.6, shape: "rect" },
    { id: "tr-19", area: "terrace", number: 19, name: "Table 19", seats: 4, hint: "Covered 4-top", x: 78.4, y: 10.0, w: 17.1, h: 30.6, shape: "rect" },
    { id: "tr-20", area: "terrace", number: 20, name: "Table 20", seats: 2, hint: "Covered square", x: 75.0, y: 89.5, w: 6.0, h: 10.2, shape: "square" },
  ];

  function padTime(minutes) {
    const wrapped = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
    const hour = Math.floor(wrapped / 60);
    const min = wrapped % 60;
    return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
  }

  function timeToMinutes(value) {
    const slot = String(value || "").slice(0, 5);
    const [hour, minute] = slot.split(":").map(Number);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
  }

  function addMinutes(value, extra) {
    const start = timeToMinutes(value);
    if (start == null) return "";
    return padTime(start + extra);
  }

  function occupyRange(time, kind, endTime) {
    if (time && typeof time === "object") {
      return occupyRange(time.time, time.kind || kind, time.endTime || endTime);
    }
    const start = timeToMinutes(time);
    if (start == null) return null;
    const explicitEnd = timeToMinutes(endTime);
    if (explicitEnd != null) return { start, end: Math.max(start + 30, explicitEnd) };
    if (kind === "birthday") return { start: start - BDAY_BEFORE, end: start + BDAY_AFTER };
    return { start: start - RES_BEFORE, end: start + SLOT_MINUTES + RES_AFTER };
  }

  function occupyOverlap(a, b, kindA, kindB) {
    const left = occupyRange(a, kindA || "reservation");
    const right = occupyRange(b, kindB || "reservation");
    if (!left || !right) return false;
    return left.start < right.end && right.start < left.end;
  }

  function isSaturday(iso) {
    if (!iso) return false;
    const [year, month, day] = String(iso).split("-").map(Number);
    if (!year || !month || !day) return false;
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 6;
  }

  function cookingClassItem() {
    return null;
  }

  function withFixedHolds(_iso, occupancy) {
    return occupancy || [];
  }

  function terraceTableIds() {
    return TABLES.filter((table) => table.area === "terrace").map((table) => table.id);
  }

  function optimalTableIds(pax) {
    const guests = Math.max(1, Number(pax) || 1);
    const ids = [];
    let seats = 0;
    OPTIMAL_TABLES.forEach((id) => {
      if (seats >= guests) return;
      ids.push(id);
      seats += findTable(id)?.seats || 0;
    });
    return ids;
  }

  function birthdayTableIds(packageId, pax) {
    if (packageId === "terrace") return terraceTableIds();
    if (packageId === "signature" || packageId === "optimal") return optimalTableIds(pax);
    return [];
  }

  function occupyLabel(time, kind) {
    const range = occupyRange(time, kind);
    if (!range) return String(time || "").slice(0, 5);
    return `${padTime(range.start)}–${padTime(range.end)}`;
  }

  function timeRangeLabel(value) {
    const start = String(value || "").slice(0, 5);
    const end = addMinutes(start, SLOT_MINUTES);
    return end ? `${start}–${end}` : start;
  }

  function graceLabel(value) {
    return addMinutes(value, GRACE_MINUTES);
  }

  function slotsOverlap(a, b) {
    return occupyOverlap(a, b, "reservation", "reservation");
  }

  function timeSlots() {
    const out = [];
    for (let minutes = OPEN_MINUTES; minutes <= LAST_START_MINUTES; minutes += 30) {
      out.push(padTime(minutes));
    }
    return out;
  }

  function findTable(id) {
    return TABLES.find((item) => item.id === id);
  }

  function joinGroup(id) {
    return JOIN_GROUPS.find((group) => group.includes(id)) || [id];
  }

  function groupSeats(ids) {
    return ids.reduce((sum, id) => sum + (findTable(id)?.seats || 0), 0);
  }

  function neededIds(table, guests) {
    if (!table) return [];
    if (table.seats >= guests) return [table.id];
    const group = joinGroup(table.id);
    if (group.length > 1 && groupSeats(group) >= guests) return group.slice();
    return [table.id];
  }

  function canTakeTable(table, guests) {
    if (!table) return false;
    if (table.area === "indoor" && guests > INDOOR_MAX) return false;
    return groupSeats(neededIds(table, guests)) >= guests;
  }

  function slotIsBooked(occupancy, time, kind, guests, requiredIds, ignoreIds) {
    const held = heldTableIds(occupancy, time, kind);
    (ignoreIds || []).forEach((id) => held.delete(String(id)));
    const required = (requiredIds || []).map(String).filter(Boolean);
    if (required.length) return required.some((id) => held.has(id));
    const pax = Math.max(1, Number(guests) || 1);
    const options = TABLES.filter((table) => canTakeTable(table, pax));
    if (!options.length) return false;
    return options.every((table) => neededIds(table, pax).some((id) => held.has(String(id))));
  }

  function heldTableIds(occupancy, time, kind) {
    const wanted = occupyRange(time, kind || "reservation");
    const held = new Set();
    if (!wanted) return held;
    (occupancy || []).forEach((item) => {
      const other = occupyRange(item);
      if (!other || wanted.start >= other.end || other.start >= wanted.end) return;
      (item.tableIds || []).forEach((id) => held.add(String(id)));
    });
    return held;
  }

  function nextSelection(current, id, guests, held) {
    const table = findTable(id);
    const selected = new Set(current || []);
    if (!table) return selected;
    if (held?.has(id) && !selected.has(id)) return selected;
    const ids = neededIds(table, guests);
    if (ids.some((item) => held?.has(item) && !selected.has(item))) return selected;
    if (ids.length && ids.every((item) => selected.has(item))) {
      ids.forEach((item) => selected.delete(item));
      return selected;
    }
    return new Set(ids);
  }

  function tableLabel(tables) {
    if (!tables.length) return "";
    const area = tables[0].area === "indoor" ? "Indoor" : "Terrace";
    const numbers = tables.map((table) => table.number).join(" & ");
    return `${area} table${tables.length > 1 ? "s" : ""} ${numbers}`;
  }

  function layoutSrc(area, base) {
    const file = area === "terrace" ? "layout-terrace.png" : "layout-indoor.png";
    return `${String(base || "").replace(/\/?$/, "/")}${file}`;
  }

  function renderMap(host, opts) {
    if (!host) return;
    const area = opts.area === "terrace" ? "terrace" : "indoor";
    const selected = new Set(opts.selected || []);
    const held = new Set(opts.held || []);
    const guests = Number(opts.guests) || 1;
    const interactive = Boolean(opts.interactive);
    const ignoreCapacity = Boolean(opts.ignoreCapacity);
    host.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "plan-map";
    const img = document.createElement("img");
    img.src = opts.src || layoutSrc(area, opts.base || "img/");
    img.alt = area === "terrace" ? "Terrace table layout" : "Indoor table layout";
    wrap.appendChild(img);
    TABLES.filter((table) => table.area === area).forEach((table) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `table-hit table-hit--${table.shape || "square"}`;
      btn.dataset.table = table.id;
      btn.style.left = `${table.x}%`;
      btn.style.top = `${table.y}%`;
      btn.style.width = `${table.w}%`;
      btn.style.height = `${table.h}%`;
      const isHeld = held.has(table.id);
      const isSelected = selected.has(table.id);
      const tooSmall = !ignoreCapacity && !isSelected && !canTakeTable(table, guests);
      const kind = typeof opts.heldKind === "function" ? opts.heldKind(table.id) : "";
      btn.classList.toggle("is-selected", isSelected);
      btn.classList.toggle("is-held", isHeld && !isSelected);
      btn.classList.toggle("is-small", tooSmall && !isHeld);
      if (isHeld && kind) btn.classList.add(`is-held--${kind}`);
      btn.disabled = !interactive || (tooSmall && !isHeld && !isSelected);
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
      const heldText =
        (typeof opts.heldLabel === "function" ? opts.heldLabel(table.id) : opts.heldLabel) || "Already reserved";
      btn.setAttribute("aria-label", `${table.name}, ${table.seats} seats`);
      if (isHeld) btn.title = heldText;
      if (isHeld && !isSelected && opts.heldNote !== false) {
        btn.title = heldText;
        const note = document.createElement("span");
        note.className = "table-hit__note";
        note.textContent = heldText;
        btn.appendChild(note);
      }
      if (interactive) {
        btn.addEventListener("click", () => opts.onPick && opts.onPick(table.id));
      }
      wrap.appendChild(btn);
    });
    host.appendChild(wrap);
  }

  window.TinyReserveMap = {
    TABLES,
    SLOT_MINUTES,
    HOLD_MINUTES: SLOT_MINUTES + RES_BEFORE + RES_AFTER,
    GRACE_MINUTES,
    RES_BEFORE,
    RES_AFTER,
    BDAY_BEFORE,
    BDAY_AFTER,
    INDOOR_MAX,
    JOIN_GROUPS,
    OPEN_MINUTES,
    LAST_START_MINUTES,
    CLOSE_MINUTES,
    DAY_START,
    DAY_END,
    COOKING_TABLES,
    COOKING_START,
    COOKING_END,
    OPTIMAL_TABLES,
    isSaturday,
    cookingClassItem,
    withFixedHolds,
    terraceTableIds,
    optimalTableIds,
    birthdayTableIds,
    timeToMinutes,
    addMinutes,
    occupyRange,
    occupyOverlap,
    occupyLabel,
    timeRangeLabel,
    graceLabel,
    slotsOverlap,
    holdsOverlap: slotsOverlap,
    timeSlots,
    findTable,
    joinGroup,
    groupSeats,
    neededIds,
    canTakeTable,
    heldTableIds,
    slotIsBooked,
    nextSelection,
    tableLabel,
    layoutSrc,
    renderMap,
  };
})();
