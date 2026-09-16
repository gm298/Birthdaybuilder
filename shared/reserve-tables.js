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

  const TABLES = [
    { id: "in-1", area: "indoor", number: 1, name: "Table 1", seats: 4, hint: "Square by the entrance", x: 78.2, y: 24.8, w: 7.4, h: 13.2, shape: "clover" },
    { id: "in-2", area: "indoor", number: 2, name: "Table 2", seats: 4, hint: "Square by the entrance", x: 78.2, y: 56.2, w: 7.4, h: 13.2, shape: "clover" },
    { id: "in-3", area: "indoor", number: 3, name: "Table 3", seats: 4, hint: "Square by the playground", x: 66.4, y: 18.2, w: 7.4, h: 13.2, shape: "clover" },
    { id: "in-4", area: "indoor", number: 4, name: "Table 4", seats: 4, hint: "Square by the cashier", x: 64.6, y: 52.6, w: 7.4, h: 13.2, shape: "clover" },
    { id: "in-5", area: "indoor", number: 5, name: "Table 5", seats: 2, hint: "Garden round", x: 51.8, y: 29.2, w: 6.4, h: 11.4, shape: "round" },
    { id: "in-6", area: "indoor", number: 6, name: "Table 6", seats: 2, hint: "Garden round", x: 51.8, y: 54.4, w: 6.4, h: 11.4, shape: "round" },
    { id: "in-7", area: "indoor", number: 7, name: "Table 7", seats: 2, hint: "Garden round", x: 31.6, y: 54.4, w: 6.4, h: 11.4, shape: "round" },
    { id: "in-8", area: "indoor", number: 8, name: "Table 8", seats: 2, hint: "Garden round", x: 31.8, y: 30.2, w: 6.4, h: 11.4, shape: "round" },
    { id: "in-9", area: "indoor", number: 9, name: "Table 9", seats: 2, hint: "Small square by the tree", x: 27.6, y: 16.6, w: 5.4, h: 9.8, shape: "square" },
    { id: "in-11", area: "indoor", number: 11, name: "Table 11", seats: 4, hint: "Window lounge", x: 9.6, y: 16.4, w: 9.2, h: 21.2, shape: "lounge" },
    { id: "in-12", area: "indoor", number: 12, name: "Table 12", seats: 4, hint: "Coffee-bar lounge", x: 9.6, y: 50.2, w: 9.2, h: 22.4, shape: "lounge" },
    { id: "tr-12", area: "terrace", number: 12, name: "Table 12", seats: 2, hint: "Garden 2-top", x: 50.4, y: 67.8, w: 14.8, h: 12.6, shape: "pill" },
    { id: "tr-13", area: "terrace", number: 13, name: "Table 13", seats: 2, hint: "Garden 2-top", x: 50.4, y: 43.8, w: 14.8, h: 12.6, shape: "pill" },
    { id: "tr-14", area: "terrace", number: 14, name: "Table 14", seats: 5, hint: "Corner lounge", x: 16.4, y: 59.4, w: 8.6, h: 15.2, shape: "square" },
    { id: "tr-15", area: "terrace", number: 15, name: "Table 15", seats: 4, hint: "Bench table", x: 21.2, y: 32.2, w: 16.8, h: 16.6, shape: "rect" },
    { id: "tr-16", area: "terrace", number: 16, name: "Table 16", seats: 4, hint: "Bench table", x: 21.2, y: 4.4, w: 16.8, h: 16.6, shape: "rect" },
    { id: "tr-17", area: "terrace", number: 17, name: "Table 17", seats: 4, hint: "Sofa lounge", x: 3.4, y: 8.6, w: 11.2, h: 27.4, shape: "lounge" },
    { id: "tr-18", area: "terrace", number: 18, name: "Table 18", seats: 4, hint: "Covered 4-top", x: 75.6, y: 36.4, w: 18.4, h: 16.8, shape: "rect" },
    { id: "tr-19", area: "terrace", number: 19, name: "Table 19", seats: 4, hint: "Covered 4-top", x: 75.6, y: 6.2, w: 18.4, h: 16.8, shape: "rect" },
    { id: "tr-20", area: "terrace", number: 20, name: "Table 20", seats: 2, hint: "Covered square", x: 72.2, y: 75.8, w: 6.4, h: 11.4, shape: "square" },
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

  function occupyRange(time, kind) {
    const start = timeToMinutes(time);
    if (start == null) return null;
    if (kind === "birthday") return { start: start - BDAY_BEFORE, end: start + BDAY_AFTER };
    return { start: start - RES_BEFORE, end: start + SLOT_MINUTES + RES_AFTER };
  }

  function occupyOverlap(a, b, kindA, kindB) {
    const left = occupyRange(a, kindA || "reservation");
    const right = occupyRange(b, kindB || "reservation");
    if (!left || !right) return false;
    return left.start < right.end && right.start < left.end;
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

  function heldTableIds(occupancy, time) {
    const held = new Set();
    (occupancy || []).forEach((item) => {
      if (!occupyOverlap(item.time, time, item.kind || "reservation", "reservation")) return;
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
      const tooSmall = !isSelected && !canTakeTable(table, guests);
      btn.classList.toggle("is-selected", isSelected);
      btn.classList.toggle("is-held", isHeld && !isSelected);
      btn.classList.toggle("is-small", tooSmall && !isHeld);
      btn.disabled = !interactive || (isHeld && !isSelected) || tooSmall;
      btn.setAttribute("aria-pressed", isSelected ? "true" : "false");
      btn.setAttribute("aria-label", `${table.name}, ${table.seats} seats`);
      if (isHeld && !isSelected) {
        const note = document.createElement("span");
        note.className = "table-hit__note";
        note.textContent = "Already reserved";
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
    nextSelection,
    tableLabel,
    layoutSrc,
    renderMap,
  };
})();
