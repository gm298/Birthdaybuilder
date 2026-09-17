(() => {
  "use strict";

  const WA_BASE = "https://wa.me/6282266484226";
  const TZ = "Asia/Makassar";
  const Map = window.TinyReserveMap;

  const CAFE = {
    name: "Tiny Healthy Family Cafe",
    address: "Gg. Anggrek Gg. Jepun No.5, Tibubeneng, Kec. Kuta Utara, Kabupaten Badung, Bali 80361, Indonesia",
  };

  const state = {
    step: 1,
    area: "indoor",
    selected: new Set(),
    kids: 0,
    adults: 2,
    guests: 2,
    time: "",
    date: "",
    occupancy: [],
    submitting: false,
  };

  function findTable(id) {
    return Map.findTable(id);
  }

  function selectedTables() {
    return [...state.selected].map(findTable).filter(Boolean);
  }

  function selectedSeats() {
    return selectedTables().reduce((sum, table) => sum + table.seats, 0);
  }

  function heldIds() {
    return Map.heldTableIds(state.occupancy, state.time);
  }

  function setStatus(message, kind) {
    const node = document.getElementById("form-status");
    if (!node) return;
    node.textContent = message || "";
    node.classList.toggle("is-error", kind === "error");
    node.classList.toggle("is-success", kind === "success");
  }

  function renderPicked() {
    const box = document.getElementById("picked");
    const meta = document.getElementById("picked-meta");
    const tables = selectedTables();
    const seats = selectedSeats();
    if (!tables.length) {
      box.innerHTML = "<h3>No table yet</h3><p>Tap a numbered table on the layout.</p>";
      meta.hidden = true;
      return;
    }
    box.innerHTML = `<h3>${Map.tableLabel(tables)}</h3><p>${tables
      .map((table) => table.hint)
      .join(" · ")}</p>`;
    meta.hidden = false;
    meta.innerHTML = `
      <div><dt>Seats</dt><dd>${seats}</dd></div>
      <div><dt>Guests</dt><dd>${state.kids} kids · ${state.adults} adults</dd></div>
      <div><dt>Slot</dt><dd>${Map.timeRangeLabel(state.time)}</dd></div>
    `;
  }

  function fitPlanToPage() {
    if (state.step !== 3) return;
    const wizard = document.querySelector(".wizard");
    const head = document.querySelector('[data-panel="3"] .plan__head');
    const nav = document.querySelector(".wizard__nav");
    if (!wizard) return;
    const headerH = document.querySelector(".site-header")?.getBoundingClientRect().height || 80;
    const topH = document.querySelector(".wizard__top")?.getBoundingClientRect().height || 0;
    const stepsH = document.querySelector(".steps")?.getBoundingClientRect().height || 0;
    const headH = head?.getBoundingClientRect().height || 0;
    const navH = nav?.getBoundingClientRect().height || 0;
    const status = document.getElementById("form-status");
    const statusH = status?.textContent ? status.getBoundingClientRect().height : 0;
    const styles = getComputedStyle(wizard);
    const pad = (parseFloat(styles.paddingTop) || 0) + (parseFloat(styles.paddingBottom) || 0);
    const gaps = 28;
    const used = headerH + topH + stepsH + headH + navH + statusH + pad + gaps + 16;
    let mapMax = Math.max(200, Math.floor(window.innerHeight - used));
    if (window.matchMedia("(max-width: 980px)").matches) {
      mapMax = Math.min(mapMax, Math.floor(window.innerHeight * 0.42), 320);
    }
    document.documentElement.style.setProperty("--plan-map-max", `${mapMax}px`);
  }

  function renderPlan() {
    const host = document.getElementById("floorplan");
    if (!host || !Map) return;
    Map.renderMap(host, {
      area: state.area,
      selected: [...state.selected],
      held: [...heldIds()],
      guests: state.guests,
      interactive: true,
      base: "img/",
      onPick: toggleTable,
    });
    renderPicked();
    fitPlanToPage();
  }

  function pruneSelection() {
    const tables = selectedTables();
    if (!tables.length) return;
    if (tables.some((table) => !Map.canTakeTable(table, state.guests))) {
      state.selected = new Set();
    }
    [...state.selected].forEach((id) => {
      if (heldIds().has(id)) state.selected.delete(id);
    });
  }

  function toggleTable(id) {
    const table = findTable(id);
    if (!table) return;
    const held = heldIds();
    if (held.has(id) && !state.selected.has(id)) {
      setStatus("That table is already reserved for this 2-hour slot.", "error");
      return;
    }
    const next = Map.nextSelection(state.selected, id, state.guests, held);
    if (held.has(id) === false && next.size === state.selected.size && [...next].every((item) => state.selected.has(item))) {
      if (!Map.canTakeTable(table, state.guests)) {
        setStatus("That table is too small for this party.", "error");
        return;
      }
      setStatus("The joined table is already reserved for this slot.", "error");
      return;
    }
    state.area = table.area;
    state.selected = next;
    document.querySelectorAll(".plan-tab").forEach((tab) => {
      const on = tab.getAttribute("data-area") === state.area;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    renderPlan();
    setStatus("");
  }

  function setArea(area) {
    state.area = area;
    document.querySelectorAll(".plan-tab").forEach((tab) => {
      const on = tab.getAttribute("data-area") === area;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    if ([...state.selected].some((id) => findTable(id)?.area !== area)) {
      state.selected = new Set();
    }
    renderPlan();
  }

  function readGuests() {
    const kids = Math.max(0, Number(document.getElementById("guest-kids")?.value) || 0);
    const adults = Math.max(0, Number(document.getElementById("guest-adults")?.value) || 0);
    state.kids = kids;
    state.adults = adults;
    state.guests = kids + adults;
    pruneSelection();
    renderPlan();
  }

  function setGuests(kids, adults) {
    state.kids = Math.max(0, kids);
    state.adults = Math.max(0, adults);
    state.guests = state.kids + state.adults;
    const kidsInput = document.getElementById("guest-kids");
    const adultsInput = document.getElementById("guest-adults");
    if (kidsInput) kidsInput.value = String(state.kids);
    if (adultsInput) adultsInput.value = String(state.adults);
    pruneSelection();
    renderPlan();
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

  function composeMessage(code) {
    const notes = document.getElementById("reserve-notes")?.value.trim() || "";
    const purpose = document.getElementById("reserve-purpose")?.value || "";
    const email = document.getElementById("contact-email")?.value.trim() || "";
    const phone = window.TinyContact?.readContact?.().phone || document.getElementById("contact-phone")?.value.trim() || "";
    return [
      "Hi Tiny! I’d like to reserve a table.",
      code ? `Request: ${code}` : null,
      "",
      `Name: ${guestName()}`,
      `Date: ${prettyDate(state.date)}`,
      `Time: ${Map.timeRangeLabel(state.time)} (2-hour table)`,
      `Please arrive by ${Map.graceLabel(state.time)} or the reservation is cancelled.`,
      `Guests: ${state.kids} kids, ${state.adults} adults`,
      Map.tableLabel(selectedTables()) ? `Table: ${Map.tableLabel(selectedTables())}` : null,
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
        guestAdults: state.adults,
        guestKids: state.kids,
      },
      reservation: {
        name: guestName(),
        salutation: document.getElementById("reserve-salutation")?.value || "",
        purpose: document.getElementById("reserve-purpose")?.value || "",
        notes: document.getElementById("reserve-notes")?.value.trim() || "",
        guests: state.guests,
        kids: state.kids,
        adults: state.adults,
        area: tables[0]?.area || state.area,
        tableIds: tables.map((table) => table.id),
        tableNumbers: tables.map((table) => table.number),
        tableLabel: Map.tableLabel(tables),
        slotMinutes: Map.SLOT_MINUTES,
        graceMinutes: Map.GRACE_MINUTES,
        occupyBefore: Map.RES_BEFORE,
        occupyAfter: Map.RES_AFTER,
        occupyLabel: Map.occupyLabel(state.time, "reservation"),
        holdUntil: Map.graceLabel(state.time),
      },
    };
  }

  function validateStep(step) {
    if (step === 1) {
      if (!state.date) return "Please choose a date.";
      if (!state.time) return "Please choose a time.";
      if (state.guests < 1) return "Please add how many kids and adults are coming.";
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
        return `That table seats ${seats}. Pick a larger table or join indoor tables 1 and 2.`;
      }
      if (tables.some((table) => heldIds().has(table.id))) {
        return "That table is already reserved for this 2-hour slot.";
      }
      return "";
    }
    return "";
  }

  async function loadOccupancy() {
    const cfg = window.TINY_SUPABASE || {};
    if (!cfg.url || !cfg.anonKey || !state.date) {
      state.occupancy = [];
      pruneSelection();
      renderPlan();
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
      const rows = Array.isArray(data) ? data : [];
      state.occupancy = Map.withFixedHolds ? Map.withFixedHolds(state.date, rows) : rows;
    } catch (_) {
      state.occupancy = [];
    }
    pruneSelection();
    renderPlan();
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
    Map.timeSlots().forEach((time) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "time-chip" + (time === state.time ? " is-active" : "");
      btn.dataset.time = time;
      btn.innerHTML = `<strong>${time}</strong><span>until ${Map.addMinutes(time, Map.SLOT_MINUTES)}</span>`;
      btn.addEventListener("click", () => {
        state.time = time;
        grid.querySelectorAll(".time-chip").forEach((item) => {
          item.classList.toggle("is-active", item === btn);
        });
        pruneSelection();
        renderPlan();
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
    if (state.step === 3) requestAnimationFrame(fitPlanToPage);
  }

  function renderSummary() {
    const host = document.getElementById("summary-card");
    if (!host) return;
    const purpose = document.getElementById("reserve-purpose")?.value || "—";
    const notes = document.getElementById("reserve-notes")?.value.trim() || "—";
    const email = document.getElementById("contact-email")?.value.trim() || "";
    const phone = window.TinyContact?.readContact?.().phone || document.getElementById("contact-phone")?.value.trim() || "";
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
          <div><span>Time</span><strong>${Map.timeRangeLabel(state.time)}</strong></div>
          <div><span>Guests</span><strong>${state.kids} kids · ${state.adults} adults</strong></div>
        </div>
        <p class="field__hint">Arrive by ${Map.graceLabel(state.time)}. After that the table is released.</p>
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
        <p>${Map.tableLabel(selectedTables())} <button class="summary-edit" type="button" data-goto="3">Edit</button></p>
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
    window.TinyContact?.initDialCombobox?.();
    state.selected = new Set();
    state.area = "indoor";
    setGuests(0, 2);
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

    document.getElementById("guest-kids")?.addEventListener("input", readGuests);
    document.getElementById("guest-adults")?.addEventListener("input", readGuests);
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
    if (!document.getElementById("floorplan") || !Map) return;
    bindForm();
    renderTimes();
    setDate(baliNowParts().date);
    renderPlan();
    setStep(1, { silent: true });
    updateNotesCount();
    window.addEventListener("resize", fitPlanToPage);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
