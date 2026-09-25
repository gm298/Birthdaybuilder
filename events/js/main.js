(() => {
  "use strict";

  const app = document.getElementById("events-app");
  if (!app) return;

  const HERO = app.getAttribute("data-hero") || "../birthdays/builder/img/decor/terrace.jpg";
  const MAPS_EMBED = "https://www.google.com/maps?q=Tiny+Healthy+Cafe+Berawa+Bali&output=embed";
  const MAPS_LINK = "https://maps.app.goo.gl/Sftcte5sWdBqkguJ8";
  const CAFE_ADDRESS = "Gg. Anggrek Gg. Jepun No.5, Tibubeneng, Kuta Utara, Badung, Bali";
  const DIALS = ["62", "61", "65", "44", "1", "31", "33", "49", "81", "86"];

  const state = {
    events: [],
    month: baliToday(),
    loading: true,
    error: "",
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function baliToday() {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Makassar",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (type) => parts.find((part) => part.type === type)?.value || "01";
    return `${get("year")}-${get("month")}-${get("day")}`;
  }

  function shiftIso(iso, days) {
    const [y, m, d] = String(iso).split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  }

  function isoWeekday(iso) {
    const [y, m, d] = String(iso).split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  }

  function prettyDate(iso) {
    const [y, m, d] = String(iso).split("-").map(Number);
    if (!y || !m || !d) return iso || "";
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function monthLabel(iso) {
    const [y, m] = String(iso).split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function formatIdr(value) {
    const amount = Number(value);
    if (!amount) return "";
    return `Rp ${amount.toLocaleString("id-ID")}`;
  }

  function timeRange(event) {
    const start = String(event.start_time || "").slice(0, 5);
    const end = String(event.end_time || "").slice(0, 5);
    if (start && end) return `${start}–${end}`;
    return start || "";
  }

  function config() {
    return window.TINY_SUPABASE || {};
  }

  function params() {
    return new URLSearchParams(window.location.search);
  }

  function go(query, replace) {
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    const stateUrl = url;
    if (replace) history.replaceState({}, "", stateUrl);
    else history.pushState({}, "", stateUrl);
    render();
  }

  function occurrences(event, fromIso, toIso) {
    const start = event.party_date;
    if (!start) return [];
    const freq = event.repeat_freq || "none";
    const until = event.repeat_until && event.repeat_until < toIso ? event.repeat_until : toIso;
    const dates = [];
    if (freq === "none") {
      if (start >= fromIso && start <= toIso) dates.push(start);
      return dates;
    }
    const cap = freq === "daily" ? 400 : 80;
    if (freq === "daily") {
      let cursor = start;
      let guard = 0;
      while (cursor <= until && guard < cap) {
        if (cursor >= fromIso) dates.push(cursor);
        cursor = shiftIso(cursor, 1);
        guard += 1;
      }
      return dates;
    }
    if (freq === "weekly") {
      const weekday = isoWeekday(start);
      let cursor = start;
      let guard = 0;
      while (cursor <= until && guard < cap) {
        if (cursor >= fromIso && isoWeekday(cursor) === weekday) dates.push(cursor);
        cursor = shiftIso(cursor, 7);
        guard += 1;
      }
      return dates;
    }
    if (freq === "monthly") {
      const day = Number(start.slice(8, 10));
      const [y0, m0] = start.split("-").map(Number);
      const last = new Date(Date.UTC(y0, m0, 0)).getUTCDate();
      const useLast = day + 7 > last;
      const nth = Math.ceil(day / 7);
      const weekday = isoWeekday(start);
      let year = Number(fromIso.slice(0, 4));
      let month = Number(fromIso.slice(5, 7));
      const endYear = Number(until.slice(0, 4));
      const endMonth = Number(until.slice(5, 7));
      let guard = 0;
      while ((year < endYear || (year === endYear && month <= endMonth)) && guard < cap) {
        const monthLast = new Date(Date.UTC(year, month, 0)).getUTCDate();
        let date = "";
        if (useLast) {
          for (let d = monthLast; d >= 1; d -= 1) {
            const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            if (isoWeekday(iso) === weekday) {
              date = iso;
              break;
            }
          }
        } else {
          let seen = 0;
          for (let d = 1; d <= monthLast; d += 1) {
            const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            if (isoWeekday(iso) === weekday) {
              seen += 1;
              if (seen === nth) {
                date = iso;
                break;
              }
            }
          }
        }
        if (date && date >= start && date >= fromIso && date <= until) dates.push(date);
        month += 1;
        if (month > 12) {
          month = 1;
          year += 1;
        }
        guard += 1;
      }
    }
    return dates;
  }

  function eventSlots(event) {
    const raw = Array.isArray(event?.slots) ? event.slots : [];
    const slots = raw
      .map((slot) => ({
        start: String(slot.start || "").slice(0, 5),
        end: String(slot.end || "").slice(0, 5),
      }))
      .filter((slot) => slot.start && slot.end);
    if (slots.length) return slots;
    return [{ start: String(event?.start_time || "").slice(0, 5), end: String(event?.end_time || "").slice(0, 5) }];
  }

  function expanded(fromIso, toIso) {
    const items = [];
    state.events.forEach((event) => {
      occurrences(event, fromIso, toIso).forEach((date) => {
        eventSlots(event).forEach((slot) => {
          items.push({ ...event, occurs_on: date, start_time: slot.start, end_time: slot.end });
        });
      });
    });
    return items.sort((a, b) => (a.occurs_on + a.start_time).localeCompare(b.occurs_on + b.start_time));
  }

  function coverStyle(event) {
    if (!event?.cover_url) return `background-image:url('${HERO}')`;
    return `background-image:url('${String(event.cover_url).replace(/'/g, "")}')`;
  }

  async function loadEvents() {
    const cfg = config();
    if (!cfg.url || !cfg.anonKey) {
      state.error = "Events are not available right now.";
      state.loading = false;
      return;
    }
    const res = await fetch(`${cfg.url}/rest/v1/rpc/list_public_events`, {
      method: "POST",
      headers: {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    if (!res.ok) {
      state.error = "Could not load events.";
      state.loading = false;
      return;
    }
    const data = await res.json();
    state.events = Array.isArray(data) ? data : [];
    state.loading = false;
  }

  function listingHtml() {
    const today = baliToday();
    const weekEnd = shiftIso(today, 6);
    const upcoming = expanded(today, weekEnd);
    const monthStart = `${state.month.slice(0, 7)}-01`;
    const [year, month] = monthStart.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const monthEnd = `${state.month.slice(0, 7)}-${String(daysInMonth).padStart(2, "0")}`;
    const inMonth = expanded(monthStart, monthEnd);
    const byDay = {};
    inMonth.forEach((item) => {
      if (!byDay[item.occurs_on]) byDay[item.occurs_on] = [];
      byDay[item.occurs_on].push(item);
    });
    const lead = isoWeekday(monthStart);
    const cells = [];
    for (let i = 0; i < lead; i += 1) cells.push("");
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push(`${state.month.slice(0, 7)}-${String(day).padStart(2, "0")}`);
    }
    return `
      <section class="events-hero" style="${coverStyle({ cover_url: HERO })}">
        <div class="events-hero__copy">
          <h1>Events at Tiny</h1>
          <p>Workshops, gatherings and slow afternoons on the terrace in Berawa. See what’s coming up, then add yourself to the guest list.</p>
        </div>
      </section>
      <div class="events-wrap">
        <section class="section">
          <p class="intro">Everything here is an event saved by the Tiny team. Birthdays and table reservations stay on their own pages.</p>
        </section>
        <section class="section" style="padding-top:0">
          <div class="section-head">
            <h2 class="section-title">This week</h2>
          </div>
          ${
            state.loading
              ? `<p class="muted">Loading events…</p>`
              : state.error
                ? `<p class="status">${escapeHtml(state.error)}</p>`
                : upcoming.length
                  ? `<div class="upcoming">${upcoming
                      .map(
                        (event) => `<button class="event-card" type="button" data-open="${escapeHtml(event.public_code)}">
                          ${
                            event.cover_url
                              ? `<img src="${escapeHtml(event.cover_url)}" alt="">`
                              : `<span class="event-card__fallback" style="${coverStyle({ cover_url: HERO })}"></span>`
                          }
                          <strong>${escapeHtml(event.name)}</strong>
                          <span>${escapeHtml(prettyDate(event.occurs_on))} · ${escapeHtml(timeRange(event))}</span>
                        </button>`
                      )
                      .join("")}</div>`
                  : `<p class="muted">Nothing scheduled in the next seven days. The month below still shows later events.</p>`
          }
        </section>
        <section class="section" style="padding-top:0">
          <div class="section-head">
            <h2 class="section-title">Calendar</h2>
          </div>
          <div class="calendar">
            <div class="calendar__bar">
              <button class="btn" type="button" data-month="-1" style="width:auto">Previous</button>
              <h3>${escapeHtml(monthLabel(monthStart))}</h3>
              <button class="btn" type="button" data-month="1" style="width:auto">Next</button>
            </div>
            <div class="cal-grid">
              ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<div class="cal-dow">${day}</div>`).join("")}
              ${cells
                .map((iso) => {
                  if (!iso) return `<div></div>`;
                  const count = (byDay[iso] || []).length;
                  const todayClass = iso === today ? " is-today" : "";
                  return `<button class="cal-day${count ? " has-event" : ""}${todayClass}" type="button" data-day="${iso}">
                    ${Number(iso.slice(8))}
                    ${count ? `<span class="cal-dots">${Array.from({ length: Math.min(count, 3) }, () => "<i></i>").join("")}</span>` : ""}
                  </button>`;
                })
                .join("")}
            </div>
          </div>
        </section>
      </div>
      <div class="day-modal" id="day-modal" hidden>
        <div class="day-modal__card" role="dialog" aria-modal="true" aria-labelledby="day-modal-title">
          <h2 id="day-modal-title" class="section-title"></h2>
          <div class="day-list" id="day-list"></div>
          <p style="margin-top:16px"><button class="btn" type="button" data-close-day style="width:auto">Close</button></p>
        </div>
      </div>`;
  }

  function eventHtml(code) {
    const event = state.events.find((item) => item.public_code === code);
    if (!event) {
      return `<div class="events-wrap"><section class="section"><p>That event is not on the calendar.</p><p><a href="${escapeHtml(window.location.pathname)}">Back to events</a></p></section></div>`;
    }
    const price = formatIdr(event.price_idr);
    return `
      <section class="event-banner" style="${coverStyle(event)}">
        <div class="event-banner__copy">
          <a class="back-link" href="${escapeHtml(window.location.pathname)}">All events</a>
          <h1>${escapeHtml(event.name)}</h1>
        </div>
      </section>
      <div class="event-layout">
        <div class="about">
          <h2>About event</h2>
          <p>${escapeHtml(event.about || "We’ll share the details of this gathering at Tiny.")}</p>
          <div class="map-frame">
            <iframe title="Map of Tiny Healthy Cafe" src="${MAPS_EMBED}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            <p><strong>${escapeHtml(event.location_label || "Tiny Healthy Cafe")}</strong><br>${escapeHtml(CAFE_ADDRESS)}<br><a href="${MAPS_LINK}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p>
          </div>
        </div>
        <aside class="ticket">
          <h2>Guest list</h2>
          <p class="ticket__when">${escapeHtml(prettyDate(event.party_date))}<br>${eventSlots(event)
            .map((slot) => escapeHtml(timeRange({ start_time: slot.start, end_time: slot.end })))
            .join("<br>")}</p>
          ${price ? `<p class="ticket__price">${escapeHtml(price)} <span class="muted" style="font-size:16px">per ticket</span></p>` : ""}
          <form id="guest-form">
            <label class="honeypot">Website<input name="website" tabindex="-1" autocomplete="off"></label>
            <label class="field"><span>Name</span><input name="name" required autocomplete="name"></label>
            <label class="field"><span>Party size</span><input name="pax" type="number" min="1" max="40" value="1" required></label>
            <div class="field">
              <span>WhatsApp</span>
              <div class="phone-row">
                <select name="dial" aria-label="Country code">${DIALS.map((code) => `<option value="${code}">+${code}</option>`).join("")}</select>
                <input name="phone" required inputmode="tel" autocomplete="tel" placeholder="812 3456 7890">
              </div>
            </div>
            <label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email"></label>
            <button class="btn" type="submit">Add to guest list</button>
            <p class="status" id="guest-status" role="status"></p>
          </form>
        </aside>
      </div>
      <div class="wa-modal" id="wa-modal" hidden>
        <div class="wa-modal__card" role="dialog" aria-modal="true" aria-labelledby="wa-title">
          <h2 id="wa-title" class="section-title">You’re on the list</h2>
          <p>Tiny will confirm your place. You can also send a WhatsApp so the team sees you straight away.</p>
          <p><a class="btn" id="wa-go" href="#" target="_blank" rel="noopener noreferrer">WhatsApp Tiny</a></p>
          <p><button class="btn" type="button" data-close-wa style="width:auto;background:transparent;color:var(--sage)">Close</button></p>
        </div>
      </div>`;
  }

  function guestHtml(guest, message) {
    if (!guest) {
      return `<div class="guest-card"><h1>Guest list</h1><p>${escapeHtml(message || "We couldn’t find that request.")}</p><p><a href="${escapeHtml(window.location.pathname)}">See events</a></p></div>`;
    }
    const status = guest.status === "confirmed" ? "Confirmed" : "Waiting for Tiny to confirm";
    return `<div class="guest-card">
      <p class="muted">${escapeHtml(guest.publicCode || "")}</p>
      <h1>${escapeHtml(guest.eventName || "Event")}</h1>
      <p>${escapeHtml(prettyDate(guest.partyDate))}${guest.startTime ? ` · ${escapeHtml(guest.startTime)}` : ""}</p>
      <p>${escapeHtml(guest.name)} · ${escapeHtml(guest.pax)} ${Number(guest.pax) === 1 ? "guest" : "guests"}</p>
      <p><strong>${escapeHtml(status)}</strong></p>
      <p><a href="${escapeHtml(window.location.pathname)}">See all events</a></p>
    </div>`;
  }

  function openDay(iso) {
    const items = expanded(iso, iso);
    const modal = document.getElementById("day-modal");
    const title = document.getElementById("day-modal-title");
    const list = document.getElementById("day-list");
    if (!modal || !list || !title) return;
    title.textContent = prettyDate(iso);
    list.innerHTML = items.length
      ? items
          .map(
            (event) =>
              `<button type="button" data-open="${escapeHtml(event.public_code)}"><strong>${escapeHtml(event.name)}</strong><br><span class="muted">${escapeHtml(timeRange(event))}</span></button>`
          )
          .join("")
      : `<p class="muted">No events on this day.</p>`;
    modal.hidden = false;
  }

  function bindListing() {
    app.querySelectorAll("[data-month]").forEach((button) => {
      button.addEventListener("click", () => {
        const delta = Number(button.getAttribute("data-month"));
        const [y, m] = state.month.split("-").map(Number);
        const next = new Date(Date.UTC(y, m - 1 + delta, 1));
        state.month = next.toISOString().slice(0, 10);
        render();
      });
    });
  }

  app.addEventListener("click", (event) => {
    const open = event.target.closest("[data-open]");
    if (open) {
      const modal = document.getElementById("day-modal");
      if (modal) modal.hidden = true;
      go(`e=${encodeURIComponent(open.getAttribute("data-open"))}`);
      return;
    }
    const day = event.target.closest("[data-day]");
    if (day) openDay(day.getAttribute("data-day"));
    if (event.target.closest("[data-close-day]")) {
      const modal = document.getElementById("day-modal");
      if (modal) modal.hidden = true;
    }
    if (event.target.id === "day-modal") event.target.hidden = true;
  });

  function normalizePhone(dial, national) {
    const digits = String(national || "").replace(/\D/g, "").replace(/^0+/, "");
    const code = String(dial || "62").replace(/\D/g, "") || "62";
    if (!digits) return "";
    return `+${code}${digits}`;
  }

  function bindEvent(code) {
    const back = app.querySelector(".back-link");
    back?.addEventListener("click", (event) => {
      event.preventDefault();
      go("");
    });
    const form = document.getElementById("guest-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = document.getElementById("guest-status");
      const data = new FormData(form);
      if (String(data.get("website") || "").trim()) return;
      const phone = normalizePhone(data.get("dial"), data.get("phone"));
      if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) {
        status.textContent = "Add a WhatsApp number with the country code.";
        return;
      }
      const button = form.querySelector("button[type=submit]");
      button.disabled = true;
      status.textContent = "Saving your place…";
      status.className = "status";
      try {
        const cfg = config();
        const res = await fetch(cfg.joinEventUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: cfg.anonKey,
            Authorization: `Bearer ${cfg.anonKey}`,
          },
          body: JSON.stringify({
            action: "join",
            code,
            name: String(data.get("name") || "").trim(),
            pax: Number(data.get("pax")) || 1,
            email: String(data.get("email") || "").trim(),
            phone,
            website: "",
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) {
          status.textContent = body.error || "Could not join the guest list.";
          button.disabled = false;
          return;
        }
        status.textContent = "You’re on the guest list. Check your email for the link.";
        status.className = "status is-ok";
        const modal = document.getElementById("wa-modal");
        const link = document.getElementById("wa-go");
        if (link) link.href = body.whatsappHref || "#";
        if (modal) modal.hidden = false;
        form.reset();
      } catch (err) {
        status.textContent = "Could not join the guest list.";
      }
      button.disabled = false;
    });
    document.querySelector("[data-close-wa]")?.addEventListener("click", () => {
      document.getElementById("wa-modal").hidden = true;
    });
  }

  async function renderGuest(token) {
    app.innerHTML = `<div class="guest-card"><h1>Guest list</h1><p class="muted">Loading…</p></div>`;
    const cfg = config();
    try {
      const res = await fetch(cfg.joinEventUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
        },
        body: JSON.stringify({ action: "status", token }),
      });
      const body = await res.json().catch(() => ({}));
      app.innerHTML = guestHtml(body.guest, body.error);
    } catch (err) {
      app.innerHTML = guestHtml(null, "Could not load that guest list request.");
    }
  }

  function render() {
    const query = params();
    const guestToken = query.get("g");
    if (guestToken) {
      renderGuest(guestToken);
      return;
    }
    const code = query.get("e");
    if (code) {
      app.innerHTML = eventHtml(code);
      document.title = `${state.events.find((item) => item.public_code === code)?.name || "Event"} | Tiny Healthy Cafe`;
      bindEvent(code);
      return;
    }
    document.title = "Events | Tiny Healthy Cafe";
    app.innerHTML = listingHtml();
    bindListing();
  }

  window.addEventListener("popstate", render);
  render();
  loadEvents()
    .catch(() => {
      state.error = "Could not load events.";
      state.loading = false;
    })
    .finally(render);
})();
