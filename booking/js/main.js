(() => {
  "use strict";

  const WA_CAFE = "https://wa.me/6282266484226";
  const MAPS_URL = "https://maps.app.goo.gl/Sftcte5sWdBqkguJ8";
  const MAPS_EMBED =
    "https://www.google.com/maps?q=Tiny+Healthy+Cafe+Berawa+Bali&output=embed";
  const CAFE = {
    name: "Tiny Healthy Family Cafe",
    address: "Gg. Anggrek Gg. Jepun No.5, Tibubeneng, Kec. Kuta Utara, Kabupaten Badung, Bali 80361, Indonesia",
    phoneLabel: "+62 822 6648 4226",
    phoneTel: "+6282266484226",
  };
  const Map = window.TinyReserveMap;
  const INACTIVE = new Set(["cancelled", "rejected", "closed", "noshow"]);

  const state = {
    token: "",
    booking: null,
    editing: false,
    verifying: false,
    verified: false,
    verifiedEmail: "",
    verifiedPhone: "",
    busy: false,
    editArea: "indoor",
    editSelected: new Set(),
    editOwnTableIds: [],
    occupancy: [],
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function tokenFromUrl() {
    return new URLSearchParams(window.location.search).get("t") || "";
  }

  function verifyStorageKey(token) {
    return `tiny-verified-${token}`;
  }

  function loadVerified(token) {
    try {
      const raw = sessionStorage.getItem(verifyStorageKey(token));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function saveVerified(token, email, phone) {
    try {
      sessionStorage.setItem(verifyStorageKey(token), JSON.stringify({ email, phone, at: Date.now() }));
    } catch (_) {
      /* ignore */
    }
  }

  function parseIsoDate(value) {
    const [year, month, day] = String(value || "").split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(Date.UTC(year, month - 1, day));
  }

  function prettyDate(value) {
    const date = parseIsoDate(value);
    if (!date) return value || "—";
    return date.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function statusLabel(status) {
    const key = String(status || "new");
    if (key === "cancelled") return "Cancelled";
    if (key === "booked") return "Confirmed";
    if (key === "noshow") return "No-show";
    if (key === "rejected") return "Declined";
    if (key === "closed") return "Closed";
    if (key === "quoted") return "Quoted";
    if (key === "contacted") return "Contacted";
    return "Requested";
  }

  function isInactive(booking) {
    return INACTIVE.has(String(booking?.status || ""));
  }

  function isReservation(booking) {
    return booking?.source === "reservation";
  }

  function isBirthday(booking) {
    return booking?.source === "party_builder";
  }

  function isCake(booking) {
    return booking?.source === "cake";
  }

  function timeLabel(booking) {
    const time = booking.partyTime || "";
    if (isReservation(booking) && Map?.timeRangeLabel) return Map.timeRangeLabel(time);
    return time || "—";
  }

  function guestLabel(booking) {
    if (isReservation(booking)) {
      const kids = Number(booking.reservation?.kids ?? booking.guestKids) || 0;
      const adults = Number(booking.reservation?.adults ?? booking.guestAdults) || 0;
      return `${kids} kids · ${adults} adults`;
    }
    const kids = Number(booking.party?.guestKids ?? booking.guestKids) || 0;
    const adults = Number(booking.party?.guestAdults ?? booking.guestAdults) || 0;
    return `${kids} kids · ${adults} adults`;
  }

  function bareReservationName(booking) {
    const r = booking.reservation || {};
    let name = String(r.name || booking.contactName || "").trim();
    const sal = String(r.salutation || "").trim();
    if (sal && name.toLowerCase().startsWith(sal.toLowerCase())) {
      name = name.slice(sal.length).trim();
    }
    return name;
  }

  function displayName(booking) {
    if (isReservation(booking)) {
      return [booking.reservation?.salutation, bareReservationName(booking)].filter(Boolean).join(" ");
    }
    if (isCake(booking)) return booking.contactName || "Guest";
    return booking.party?.childName || booking.childName || booking.contactName || "Guest";
  }

  function setPageCopy(booking) {
    const title = document.getElementById("booking-title");
    const lead = document.getElementById("booking-lead");
    if (!booking) {
      if (title) title.textContent = "Booking not found";
      if (lead) lead.textContent = "This link may be invalid or expired.";
      return;
    }
    if (isReservation(booking)) {
      if (title) title.textContent = isInactive(booking) ? "Reservation" : "Your reservation";
      if (lead) {
        lead.textContent = isInactive(booking)
          ? "This reservation is no longer active."
          : "Details for your table at Tiny Healthy Cafe.";
      }
      return;
    }
    if (isBirthday(booking)) {
      if (title) title.textContent = "Manage birthday request";
      if (lead) {
        lead.textContent = isInactive(booking)
          ? "This birthday request is no longer active."
          : "Update your party details or cancel the request.";
      }
      return;
    }
    if (isCake(booking)) {
      if (title) title.textContent = "Manage cake order";
      if (lead) {
        lead.textContent = isInactive(booking)
          ? "This cake request is no longer active."
          : "Update your cake details or cancel the request.";
      }
      return;
    }
    if (title) title.textContent = "Your booking";
    if (lead) lead.textContent = "Booking details";
  }

  function venueHtml(showShareStyle) {
    return `
      <div class="venue">
        <h3>${escapeHtml(CAFE.name)}</h3>
        <p>${escapeHtml(CAFE.address)}</p>
        <p><a href="tel:${escapeHtml(CAFE.phoneTel)}">${escapeHtml(CAFE.phoneLabel)}</a></p>
        ${
          showShareStyle
            ? `<div class="venue__map"><iframe title="Map to Tiny Healthy Cafe" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${MAPS_EMBED}"></iframe></div>`
            : ""
        }
        <div class="venue__links">
          <a class="btn" href="${WA_CAFE}" target="_blank" rel="noopener noreferrer" data-wa="booking_cafe">WhatsApp Tiny</a>
          <a class="btn btn--outline" href="${MAPS_URL}" target="_blank" rel="noopener noreferrer">Open in Maps</a>
          <a class="btn btn--outline" href="tel:${escapeHtml(CAFE.phoneTel)}">Call</a>
        </div>
      </div>
    `;
  }

  function actionsHtml(booking) {
    if (isInactive(booking)) return "";
    const shareBtn = isReservation(booking)
      ? `<button type="button" class="btn btn--outline" id="booking-share">Share</button>`
      : "";
    if (!state.verified) {
      return `
        <div class="booking-actions">
          ${shareBtn}
          <button type="button" class="btn" id="booking-unlock">Edit or cancel</button>
        </div>
      `;
    }
    return `
      <div class="booking-actions">
        <button type="button" class="btn btn--outline" id="booking-edit">Edit</button>
        ${shareBtn}
        <button type="button" class="btn btn--danger" id="booking-cancel">Cancel</button>
      </div>
    `;
  }

  function verifyFormHtml() {
    return `
      <form class="booking-form" id="verify-form">
        <h2>Confirm it’s you</h2>
        <p class="booking-notes">Enter the email and WhatsApp number used for this booking to edit or cancel.</p>
        <label class="field"><span>Email</span>
          <input type="email" name="email" required autocomplete="email" value="${escapeHtml(state.verifiedEmail || "")}">
        </label>
        <label class="field"><span>WhatsApp (with country code)</span>
          <div class="phone-split">
            <input type="text" name="dial" value="+62" aria-label="Country code" placeholder="+62">
            <input type="tel" name="phoneNational" required inputmode="tel" placeholder="812 3456 7890" autocomplete="tel-national">
          </div>
          <input type="hidden" name="phone" value="">
        </label>
        <div class="booking-form__actions">
          <button class="btn" type="submit">Confirm</button>
          <button class="btn btn--outline" type="button" id="verify-cancel">Back to details</button>
        </div>
        <p class="form-msg" id="booking-msg" role="status"></p>
      </form>
    `;
  }

  function reservationView(booking) {
    const notes = booking.reservation?.notes || "";
    const purpose = booking.reservation?.purpose || "";
    return `
      <div class="booking-card">
        <p class="booking__code">${escapeHtml(booking.publicCode || "")}
          <span class="booking__badge${isInactive(booking) ? " is-cancelled" : ""}">${escapeHtml(
            statusLabel(booking.status)
          )}</span>
        </p>
        <h2>${escapeHtml(displayName(booking))}</h2>
        <div class="booking-grid">
          <div><span>Date</span><strong>${escapeHtml(prettyDate(booking.partyDate))}</strong></div>
          <div><span>Time</span><strong>${escapeHtml(timeLabel(booking))}</strong></div>
          <div><span>Guests</span><strong>${escapeHtml(guestLabel(booking))}</strong></div>
          <div><span>Table</span><strong>${escapeHtml(booking.reservation?.tableLabel || "—")}</strong></div>
          <div><span>Purpose</span><strong>${escapeHtml(purpose || "—")}</strong></div>
        </div>
        ${notes ? `<p class="booking-notes">${escapeHtml(notes)}</p>` : ""}
        ${venueHtml(true)}
        ${actionsHtml(booking)}
        <p class="form-msg" id="booking-msg" role="status"></p>
      </div>
    `;
  }

  function birthdayView(booking) {
    const notes = booking.party?.notes || "";
    return `
      <div class="booking-card">
        <p class="booking__code">${escapeHtml(booking.publicCode || "")}
          <span class="booking__badge${isInactive(booking) ? " is-cancelled" : ""}">${escapeHtml(
            statusLabel(booking.status)
          )}</span>
        </p>
        <h2>${escapeHtml(displayName(booking))}</h2>
        <div class="booking-grid">
          <div><span>Child</span><strong>${escapeHtml(
            [booking.party?.childName || booking.childName, booking.party?.childAge || booking.childAge]
              .filter(Boolean)
              .join(" · ") || "—"
          )}</strong></div>
          <div><span>Package</span><strong>${escapeHtml(booking.package?.name || booking.packageName || "—")}</strong></div>
          <div><span>Date</span><strong>${escapeHtml(prettyDate(booking.partyDate))}</strong></div>
          <div><span>Time</span><strong>${escapeHtml(timeLabel(booking))}</strong></div>
          <div><span>Guests</span><strong>${escapeHtml(guestLabel(booking))}</strong></div>
        </div>
        ${notes ? `<p class="booking-notes">${escapeHtml(notes)}</p>` : ""}
        ${venueHtml(false)}
        ${actionsHtml(booking)}
        <p class="form-msg" id="booking-msg" role="status"></p>
      </div>
    `;
  }

  function cakeView(booking) {
    const cake = booking.cake || {};
    return `
      <div class="booking-card">
        <p class="booking__code">${escapeHtml(booking.publicCode || "")}
          <span class="booking__badge${isInactive(booking) ? " is-cancelled" : ""}">${escapeHtml(
            statusLabel(booking.status)
          )}</span>
        </p>
        <h2>${escapeHtml(displayName(booking))}</h2>
        <div class="booking-grid">
          <div><span>Date needed</span><strong>${escapeHtml(prettyDate(booking.partyDate || booking.party?.date))}</strong></div>
          <div><span>Size</span><strong>${escapeHtml([cake.size, cake.priceLabel].filter(Boolean).join(" · ") || "—")}</strong></div>
          <div><span>Design</span><strong>${escapeHtml(
            cake.mode === "own" ? "Own idea" : cake.design || "—"
          )}</strong></div>
          <div><span>Theme</span><strong>${escapeHtml(cake.theme || "—")}</strong></div>
          <div><span>Sponge</span><strong>${escapeHtml(
            (Array.isArray(cake.sponges) ? cake.sponges.join(" + ") : "") || "—"
          )}</strong></div>
          <div><span>Diet</span><strong>${escapeHtml(
            (Array.isArray(cake.diet) ? cake.diet.join(", ") : "") || "—"
          )}</strong></div>
        </div>
        ${cake.notes ? `<p class="booking-notes">${escapeHtml(cake.notes)}</p>` : ""}
        ${venueHtml(false)}
        ${actionsHtml(booking)}
        <p class="form-msg" id="booking-msg" role="status"></p>
      </div>
    `;
  }

  function reservationEditForm(booking) {
    const r = booking.reservation || {};
    return `
      <form class="booking-form" id="booking-form">
        <p class="booking__code">${escapeHtml(booking.publicCode || "")}</p>
        <h2>Edit reservation</h2>
        <div class="booking-form__row">
          <label class="field"><span>Title</span>
            <select name="salutation">
              ${["Mr.", "Mrs.", "Ms.", "Mx."]
                .map(
                  (item) =>
                    `<option value="${item}" ${r.salutation === item ? "selected" : ""}>${item}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="field"><span>Name</span>
            <input name="name" required value="${escapeHtml(bareReservationName(booking))}">
          </label>
        </div>
        <div class="booking-form__row">
          <label class="field"><span>Date</span>
            <input type="date" name="date" required value="${escapeHtml(booking.partyDate || "")}">
          </label>
          <label class="field"><span>Start time</span>
            <input type="time" name="time" required step="1800" value="${escapeHtml(booking.partyTime || "")}">
          </label>
        </div>
        <div class="booking-form__row">
          <label class="field"><span>Kids</span>
            <input type="number" name="kids" min="0" value="${escapeHtml(String(r.kids ?? booking.guestKids ?? 0))}">
          </label>
          <label class="field"><span>Adults</span>
            <input type="number" name="adults" min="0" value="${escapeHtml(String(r.adults ?? booking.guestAdults ?? 0))}">
          </label>
        </div>
        <label class="field"><span>Purpose</span>
          <input name="purpose" value="${escapeHtml(r.purpose || "")}">
        </label>
        <label class="field"><span>Notes</span>
          <textarea name="notes" maxlength="200">${escapeHtml(r.notes || "")}</textarea>
        </label>
        <div class="field table-picker">
          <span class="field__label">Table</span>
          <p class="field__hint" id="edit-table-label">${escapeHtml(r.tableLabel || "Tap a table on the map")}</p>
          <div class="plan__tabs" role="tablist" aria-label="Cafe area">
            <button type="button" class="plan-tab${(r.area || "indoor") !== "terrace" ? " is-active" : ""}" data-area="indoor" aria-selected="${
              (r.area || "indoor") !== "terrace" ? "true" : "false"
            }">Indoor</button>
            <button type="button" class="plan-tab${r.area === "terrace" ? " is-active" : ""}" data-area="terrace" aria-selected="${
              r.area === "terrace" ? "true" : "false"
            }">Terrace</button>
          </div>
          <div class="plan__canvas" id="edit-floorplan" role="application" aria-label="Clickable table layout"></div>
        </div>
        <div class="booking-form__actions">
          <button class="btn" type="submit">Save changes</button>
          <button class="btn btn--outline" type="button" id="booking-edit-cancel">Cancel edits</button>
        </div>
        <p class="form-msg" id="booking-msg" role="status"></p>
      </form>
    `;
  }

  function birthdayEditForm(booking) {
    const p = booking.party || {};
    return `
      <form class="booking-form" id="booking-form">
        <p class="booking__code">${escapeHtml(booking.publicCode || "")}</p>
        <h2>Edit birthday request</h2>
        <div class="booking-form__row">
          <label class="field"><span>Child name</span>
            <input name="childName" required value="${escapeHtml(p.childName || booking.childName || "")}">
          </label>
          <label class="field"><span>Age</span>
            <input name="childAge" value="${escapeHtml(p.childAge || booking.childAge || "")}">
          </label>
        </div>
        <div class="booking-form__row">
          <label class="field"><span>Date</span>
            <input type="date" name="date" required value="${escapeHtml(booking.partyDate || p.date || "")}">
          </label>
          <label class="field"><span>Time</span>
            <input type="time" name="time" required step="1800" value="${escapeHtml(booking.partyTime || p.time || "")}">
          </label>
        </div>
        <div class="booking-form__row">
          <label class="field"><span>Kids</span>
            <input type="number" name="guestKids" min="0" value="${escapeHtml(String(p.guestKids ?? booking.guestKids ?? 0))}">
          </label>
          <label class="field"><span>Adults</span>
            <input type="number" name="guestAdults" min="0" value="${escapeHtml(String(p.guestAdults ?? booking.guestAdults ?? 0))}">
          </label>
        </div>
        <label class="field"><span>Notes</span>
          <textarea name="notes" maxlength="400">${escapeHtml(p.notes || "")}</textarea>
        </label>
        <div class="booking-form__actions">
          <button class="btn" type="submit">Save changes</button>
          <button class="btn btn--outline" type="button" id="booking-edit-cancel">Cancel edits</button>
        </div>
        <p class="form-msg" id="booking-msg" role="status"></p>
      </form>
    `;
  }

  function cakeEditForm(booking) {
    const cake = booking.cake || {};
    return `
      <form class="booking-form" id="booking-form">
        <p class="booking__code">${escapeHtml(booking.publicCode || "")}</p>
        <h2>Edit cake order</h2>
        <label class="field"><span>Date needed</span>
          <input type="date" name="date" required value="${escapeHtml(booking.partyDate || booking.party?.date || "")}">
        </label>
        <label class="field"><span>Size</span>
          <input name="size" required value="${escapeHtml(cake.size || "")}">
        </label>
        <label class="field"><span>Theme</span>
          <input name="theme" value="${escapeHtml(cake.theme || "")}">
        </label>
        <label class="field"><span>Design / reference</span>
          <input name="design" value="${escapeHtml(cake.design || "")}">
        </label>
        <label class="field"><span>Sponge (use + between flavours)</span>
          <input name="sponges" value="${escapeHtml(
            Array.isArray(cake.sponges) ? cake.sponges.join(" + ") : ""
          )}">
        </label>
        <label class="field"><span>Diet notes</span>
          <input name="diet" value="${escapeHtml(Array.isArray(cake.diet) ? cake.diet.join(", ") : "")}">
        </label>
        <label class="field"><span>Cake notes</span>
          <textarea name="notes" maxlength="400">${escapeHtml(cake.notes || "")}</textarea>
        </label>
        <div class="booking-form__actions">
          <button class="btn" type="submit">Save changes</button>
          <button class="btn btn--outline" type="button" id="booking-edit-cancel">Cancel edits</button>
        </div>
        <p class="form-msg" id="booking-msg" role="status"></p>
      </form>
    `;
  }

  function setMsg(text, kind) {
    const node = document.getElementById("booking-msg");
    if (!node) return;
    node.textContent = text || "";
    node.className = `form-msg${kind ? ` is-${kind}` : ""}`;
  }

  function normalizePhoneFromForm(form) {
    const full = String(form.querySelector('[name="phone"]')?.value || "").trim();
    if (full.startsWith("+")) return full.replace(/\s+/g, "");
    const dial = String(form.querySelector('[name="dial"]')?.value || "+62").replace(/[^\d]/g, "") || "62";
    const national = String(form.querySelector('[name="phoneNational"]')?.value || "")
      .replace(/\D/g, "")
      .replace(/^0+/, "");
    if (!national) return "";
    return `+${dial}${national}`;
  }

  function editGuestsFromForm(form) {
    const kids = Math.max(0, Number(form?.querySelector('[name="kids"]')?.value) || 0);
    const adults = Math.max(0, Number(form?.querySelector('[name="adults"]')?.value) || 0);
    return Math.max(1, kids + adults);
  }

  function editSelectedTables() {
    if (!Map?.findTable) return [];
    return [...state.editSelected]
      .map((id) => Map.findTable(id))
      .filter(Boolean)
      .sort((a, b) => a.number - b.number);
  }

  function heldIdsForEdit(time) {
    if (!Map?.heldTableIds) return new Set();
    const held = Map.heldTableIds(state.occupancy, time || state.booking?.partyTime);
    state.editOwnTableIds.forEach((id) => held.delete(String(id)));
    return held;
  }

  function updateEditTableLabel() {
    const label = document.getElementById("edit-table-label");
    if (!label || !Map?.tableLabel) return;
    const tables = editSelectedTables();
    label.textContent = tables.length ? Map.tableLabel(tables) : "Tap a table on the map";
  }

  function renderEditPlan() {
    const host = document.getElementById("edit-floorplan");
    const form = document.getElementById("booking-form");
    if (!host || !Map?.renderMap || !form) return;
    const time = String(form.querySelector('[name="time"]')?.value || state.booking?.partyTime || "").slice(0, 5);
    const guests = editGuestsFromForm(form);
    Map.renderMap(host, {
      area: state.editArea,
      selected: [...state.editSelected],
      held: [...heldIdsForEdit(time)],
      guests,
      interactive: true,
      base: "../reserve/img/",
      onPick: toggleEditTable,
    });
    updateEditTableLabel();
  }

  function pruneEditSelection() {
    const form = document.getElementById("booking-form");
    if (!form || !Map) return;
    const guests = editGuestsFromForm(form);
    const held = heldIdsForEdit(
      String(form.querySelector('[name="time"]')?.value || state.booking?.partyTime || "").slice(0, 5)
    );
    [...state.editSelected].forEach((id) => {
      if (held.has(id)) state.editSelected.delete(id);
    });
    const tables = editSelectedTables();
    if (tables.length && tables.some((table) => !Map.canTakeTable(table, guests))) {
      state.editSelected = new Set();
    }
  }

  function toggleEditTable(id) {
    if (!Map) return;
    const table = Map.findTable(id);
    if (!table) return;
    const form = document.getElementById("booking-form");
    const guests = editGuestsFromForm(form);
    const time = String(form?.querySelector('[name="time"]')?.value || "").slice(0, 5);
    const held = heldIdsForEdit(time);
    if (held.has(id) && !state.editSelected.has(id)) {
      setMsg("That table is already reserved for this 2-hour slot.", "error");
      return;
    }
    const next = Map.nextSelection(state.editSelected, id, guests, held);
    if (
      !held.has(id) &&
      next.size === state.editSelected.size &&
      [...next].every((item) => state.editSelected.has(item))
    ) {
      if (!Map.canTakeTable(table, guests)) {
        setMsg("That table is too small for this party.", "error");
        return;
      }
      setMsg("The joined table is already reserved for this slot.", "error");
      return;
    }
    state.editArea = table.area;
    state.editSelected = next;
    document.querySelectorAll(".plan-tab").forEach((tab) => {
      const on = tab.getAttribute("data-area") === state.editArea;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });
    setMsg("");
    renderEditPlan();
  }

  async function loadEditOccupancy() {
    const form = document.getElementById("booking-form");
    const date = String(form?.querySelector('[name="date"]')?.value || state.booking?.partyDate || "");
    const cfg = window.TINY_SUPABASE || {};
    if (!cfg.url || !cfg.anonKey || !date || !Map) {
      state.occupancy = [];
      pruneEditSelection();
      renderEditPlan();
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
      state.occupancy = Map.withFixedHolds ? Map.withFixedHolds(date, rows) : rows;
    } catch (_) {
      state.occupancy = [];
    }
    pruneEditSelection();
    renderEditPlan();
  }

  function initReservationEditState(booking) {
    const r = booking?.reservation || {};
    const ids = (Array.isArray(r.tableIds) ? r.tableIds : []).map(String);
    state.editOwnTableIds = ids.slice();
    state.editSelected = new Set(ids);
    const first = ids[0] && Map?.findTable ? Map.findTable(ids[0]) : null;
    state.editArea = r.area || first?.area || "indoor";
    state.occupancy = [];
  }

  function bindTablePicker() {
    if (!document.getElementById("edit-floorplan")) return;
    document.querySelectorAll(".plan-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const area = tab.getAttribute("data-area") === "terrace" ? "terrace" : "indoor";
        state.editArea = area;
        document.querySelectorAll(".plan-tab").forEach((item) => {
          const on = item.getAttribute("data-area") === area;
          item.classList.toggle("is-active", on);
          item.setAttribute("aria-selected", on ? "true" : "false");
        });
        if ([...state.editSelected].some((id) => Map?.findTable?.(id)?.area !== area)) {
          state.editSelected = new Set();
        }
        renderEditPlan();
      });
    });
    const form = document.getElementById("booking-form");
    form?.querySelector('[name="date"]')?.addEventListener("change", () => loadEditOccupancy());
    form?.querySelector('[name="time"]')?.addEventListener("change", () => {
      pruneEditSelection();
      renderEditPlan();
    });
    form?.querySelector('[name="kids"]')?.addEventListener("change", () => {
      pruneEditSelection();
      renderEditPlan();
    });
    form?.querySelector('[name="adults"]')?.addEventListener("change", () => {
      pruneEditSelection();
      renderEditPlan();
    });
    loadEditOccupancy();
  }

  function bindActions() {
    document.getElementById("booking-unlock")?.addEventListener("click", () => {
      state.verifying = true;
      state.editing = false;
      render();
    });
    document.getElementById("verify-cancel")?.addEventListener("click", () => {
      state.verifying = false;
      render();
    });
    document.getElementById("booking-edit")?.addEventListener("click", () => {
      if (!state.verified) {
        state.verifying = true;
        render();
        return;
      }
      if (isBirthday(state.booking)) {
        const href = window.TinySubmit?.builderEditUrl?.(state.token);
        if (href) {
          window.location.href = href;
          return;
        }
      }
      if (isReservation(state.booking)) initReservationEditState(state.booking);
      state.editing = true;
      render();
    });
    document.getElementById("booking-edit-cancel")?.addEventListener("click", () => {
      state.editing = false;
      render();
    });
    document.getElementById("booking-share")?.addEventListener("click", async () => {
      const url = window.location.href;
      const result = (await window.TinySuccessModal?.shareLink?.(url)) || "copied";
      if (result === "copied") setMsg("Link copied.", "success");
      else if (result === "shared") setMsg("Shared.", "success");
      else if (result !== "aborted") setMsg("Copy the link from the prompt.", "success");
    });
    document.getElementById("booking-cancel")?.addEventListener("click", async () => {
      if (!state.verified) {
        state.verifying = true;
        render();
        return;
      }
      if (!window.confirm("Cancel this booking? Tiny will be notified.")) return;
      state.busy = true;
      setMsg("Cancelling…");
      try {
        const result = await window.TinySubmit.manageRequest({
          action: "cancel",
          manageToken: state.token,
          email: state.verifiedEmail,
          phone: state.verifiedPhone,
        });
        state.booking = result.booking;
        state.editing = false;
        state.verifying = false;
        setPageCopy(state.booking);
        render();
        setMsg("Booking cancelled.", "success");
      } catch (err) {
        setMsg(err?.message || "Could not cancel.", "error");
      } finally {
        state.busy = false;
      }
    });

    const verifyForm = document.getElementById("verify-form");
    verifyForm?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.busy) return;
      const email = String(verifyForm.querySelector('[name="email"]')?.value || "")
        .trim()
        .toLowerCase();
      const phone = normalizePhoneFromForm(verifyForm);
      state.busy = true;
      setMsg("Checking…");
      try {
        await window.TinySubmit.manageRequest({
          action: "verify",
          manageToken: state.token,
          email,
          phone,
        });
        state.verified = true;
        state.verifiedEmail = email;
        state.verifiedPhone = phone;
        state.verifying = false;
        saveVerified(state.token, email, phone);
        render();
        setMsg("Confirmed. You can edit or cancel.", "success");
      } catch (err) {
        setMsg(err?.message || "Could not confirm.", "error");
      } finally {
        state.busy = false;
      }
    });

    const form = document.getElementById("booking-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (state.busy || !state.verified) return;
      const data = new FormData(form);
      state.busy = true;
      setMsg("Saving…");
      try {
        let payload;
        if (isReservation(state.booking)) {
          const tables = editSelectedTables();
          if (!tables.length) {
            setMsg("Please tap a table on the floor plan.", "error");
            state.busy = false;
            return;
          }
          const guests = editGuestsFromForm(form);
          const seats = tables.reduce((sum, table) => sum + table.seats, 0);
          if (seats < guests) {
            setMsg(`That table seats ${seats}. Pick a larger table or join indoor tables 1 and 2.`, "error");
            state.busy = false;
            return;
          }
          const time = String(data.get("time") || "").slice(0, 5);
          if (tables.some((table) => heldIdsForEdit(time).has(table.id))) {
            setMsg("That table is already reserved for this 2-hour slot.", "error");
            state.busy = false;
            return;
          }
          payload = {
            email: state.verifiedEmail,
            phone: state.verifiedPhone,
            reservation: {
              salutation: String(data.get("salutation") || ""),
              name: String(data.get("name") || "").trim(),
              purpose: String(data.get("purpose") || "").trim(),
              notes: String(data.get("notes") || "").trim(),
              kids: Number(data.get("kids") || 0),
              adults: Number(data.get("adults") || 0),
              tableIds: tables.map((table) => table.id),
              tableNumbers: tables.map((table) => table.number),
              tableLabel: Map.tableLabel(tables),
              area: tables[0]?.area || state.editArea,
              endTime: state.booking.reservation?.endTime || "",
              slotMinutes: Map.SLOT_MINUTES,
              graceMinutes: Map.GRACE_MINUTES,
              occupyBefore: Map.RES_BEFORE,
              occupyAfter: Map.RES_AFTER,
              occupyLabel: Map.occupyLabel?.(time, "reservation") || "",
              holdUntil: Map.graceLabel?.(time) || "",
            },
            party: {
              date: String(data.get("date") || ""),
              time,
            },
          };
        } else if (isCake(state.booking)) {
          const sponges = String(data.get("sponges") || "")
            .split("+")
            .map((s) => s.trim())
            .filter(Boolean);
          const diet = String(data.get("diet") || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          payload = {
            email: state.verifiedEmail,
            phone: state.verifiedPhone,
            party: { date: String(data.get("date") || "") },
            cake: {
              size: String(data.get("size") || "").trim(),
              theme: String(data.get("theme") || "").trim(),
              design: String(data.get("design") || "").trim(),
              sponges,
              diet,
              notes: String(data.get("notes") || "").trim(),
              mode: state.booking.cake?.mode || "",
              priceLabel: state.booking.cake?.priceLabel || "",
              sugarSponge: state.booking.cake?.sugarSponge || "",
            },
          };
        } else {
          payload = {
            email: state.verifiedEmail,
            phone: state.verifiedPhone,
            contactName: String(data.get("childName") || "").trim(),
            party: {
              childName: String(data.get("childName") || "").trim(),
              childAge: String(data.get("childAge") || "").trim(),
              date: String(data.get("date") || ""),
              time: String(data.get("time") || "").slice(0, 5),
              guestKids: Number(data.get("guestKids") || 0),
              guestAdults: Number(data.get("guestAdults") || 0),
              notes: String(data.get("notes") || "").trim(),
              foodNotes: state.booking.party?.foodNotes || "",
            },
          };
        }
        const result = await window.TinySubmit.manageRequest({
          action: "update",
          manageToken: state.token,
          email: state.verifiedEmail,
          phone: state.verifiedPhone,
          payload,
        });
        state.booking = result.booking;
        state.editing = false;
        setPageCopy(state.booking);
        render();
        setMsg("Saved.", "success");
      } catch (err) {
        setMsg(err?.message || "Could not save.", "error");
      } finally {
        state.busy = false;
      }
    });
  }

  function render() {
    const root = document.getElementById("booking-root");
    if (!root) return;
    const booking = state.booking;
    if (!booking) {
      root.innerHTML = `<p class="booking__status is-error">Booking not found.</p>`;
      return;
    }
    if (state.verifying && !isInactive(booking)) {
      root.innerHTML = verifyFormHtml();
    } else if (state.editing && state.verified && !isInactive(booking)) {
      if (isReservation(booking)) root.innerHTML = reservationEditForm(booking);
      else if (isCake(booking)) root.innerHTML = cakeEditForm(booking);
      else root.innerHTML = birthdayEditForm(booking);
    } else if (isReservation(booking)) {
      root.innerHTML = reservationView(booking);
    } else if (isBirthday(booking)) {
      root.innerHTML = birthdayView(booking);
    } else if (isCake(booking)) {
      root.innerHTML = cakeView(booking);
    } else {
      root.innerHTML = `<p class="booking__status">This booking type can’t be managed online. Please WhatsApp Tiny.</p>${venueHtml(false)}`;
    }
    bindActions();
    if (state.editing && state.verified && isReservation(booking)) bindTablePicker();
  }

  async function boot() {
    state.token = tokenFromUrl();
    const root = document.getElementById("booking-root");
    if (!state.token) {
      setPageCopy(null);
      if (root) root.innerHTML = `<p class="booking__status is-error">Missing booking link. Open the link from your confirmation.</p>`;
      return;
    }
    if (!window.TinySubmit?.manageRequest) {
      if (root) root.innerHTML = `<p class="booking__status is-error">Managing is not configured yet.</p>`;
      return;
    }
    const cached = loadVerified(state.token);
    if (cached?.email && cached?.phone) {
      state.verified = true;
      state.verifiedEmail = cached.email;
      state.verifiedPhone = cached.phone;
    }
    try {
      const result = await window.TinySubmit.manageRequest({
        action: "get",
        manageToken: state.token,
      });
      state.booking = result.booking;
      setPageCopy(state.booking);
      render();
    } catch (err) {
      setPageCopy(null);
      if (root) {
        root.innerHTML = `<p class="booking__status is-error">${escapeHtml(
          err?.message || "Could not load booking."
        )}</p>`;
      }
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
