(() => {
  "use strict";

  const app = document.getElementById("events-app");
  if (!app) return;

  const HERO = app.getAttribute("data-hero") || "../birthdays/builder/img/decor/terrace.jpg";
  const VIDEO = app.getAttribute("data-video") || "video/cooking-class.mp4";
  const LOGO = app.getAttribute("data-logo") || "../birthdays/img/logo-dark.png";
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

  function groupedDays(fromIso, toIso) {
    const groups = [];
    const index = new Map();
    expanded(fromIso, toIso).forEach((item) => {
      const key = `${item.public_code}|${item.occurs_on}`;
      let group = index.get(key);
      if (!group) {
        group = { ...item, times: [] };
        index.set(key, group);
        groups.push(group);
      }
      const label = timeRange(item);
      if (label && !group.times.includes(label)) group.times.push(label);
    });
    return groups;
  }

  function monthCells(yearMonth) {
    const [year, month] = yearMonth.split("-").map(Number);
    const startWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const prevDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) {
      const day = prevDays - startWeekday + 1 + i;
      cells.push({ iso: new Date(Date.UTC(year, month - 2, day)).toISOString().slice(0, 10), day, muted: true });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({
        iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        day,
        muted: false,
      });
    }
    let extra = 1;
    while (cells.length % 7 !== 0) {
      cells.push({ iso: new Date(Date.UTC(year, month, extra)).toISOString().slice(0, 10), day: extra, muted: true });
      extra += 1;
    }
    return cells;
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
    const upcoming = groupedDays(today, weekEnd);
    const monthKey = state.month.slice(0, 7);
    const cells = monthCells(monthKey);
    const inView = expanded(cells[0].iso, cells[cells.length - 1].iso);
    const byDay = {};
    inView.forEach((item) => {
      if (!byDay[item.occurs_on]) byDay[item.occurs_on] = [];
      byDay[item.occurs_on].push(item);
    });
    const video = escapeHtml(VIDEO);
    const logo = escapeHtml(LOGO);
    return `
      <section class="hero" aria-label="Events">
        <div class="hero__copy">
          <div class="eyebrow">Tiny · Exclusive Events &amp; Activities in Bali</div>
          <h1>Where precious<br>moments<br>become<br>memories</h1>
          <p class="hero__sub">Exclusive events for all ages from toddler to adults. Check our upcoming events &amp; event calendar to pick one perfect for you!</p>
          <div class="hero__actions">
            <a class="btn btn--lg btn--dark" href="#upcoming-events">See our Events</a>
          </div>
        </div>
        <div class="hero__media">
          <div class="hero__video-card">
            <video id="hero-video-desktop" playsinline muted loop preload="metadata">
              <source src="${video}" type="video/mp4">
            </video>
            <img class="hero__video-logo" src="${logo}" alt="" width="36" height="36" aria-hidden="true">
          </div>
        </div>
        <div class="hero__video-mobile-wrap">
          <video id="hero-video-mobile" class="hero__video-mobile" playsinline muted loop preload="metadata">
            <source src="${video}" type="video/mp4">
          </video>
        </div>
      </section>
      <div class="events-wrap">
        <section class="section" id="upcoming-events">
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
                          <span>${escapeHtml(prettyDate(event.occurs_on))}</span>
                          <span class="event-card__times">${(event.times || []).map((time) => escapeHtml(time)).join("<br>")}</span>
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
              <h3>${escapeHtml(monthLabel(`${monthKey}-01`))}</h3>
              <button class="btn" type="button" data-month="1" style="width:auto">Next</button>
            </div>
            <div class="cal-grid">
              ${["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                .map((day) => `<div class="cal-cell is-head">${day}</div>`)
                .join("")}
              ${cells
                .map((cell) => {
                  const items = byDay[cell.iso] || [];
                  const shown = items.slice(0, 3);
                  const extra = items.length - shown.length;
                  const classes = ["cal-cell", cell.muted ? "is-muted" : "", cell.iso === today ? "is-today" : ""]
                    .filter(Boolean)
                    .join(" ");
                  const bars = shown
                    .map(
                      (event) =>
                        `<button class="cal-event" type="button" data-open="${escapeHtml(event.public_code)}">${escapeHtml(
                          `${event.start_time || ""} ${event.name}`.trim()
                        )}</button>`
                    )
                    .join("");
                  const more = extra
                    ? `<button class="cal-more" type="button" data-day="${cell.iso}">+${extra} more</button>`
                    : "";
                  return `<div class="${classes}">
                    <button class="cal-daynum" type="button" data-day="${cell.iso}">${cell.day}</button>
                    <div class="cal-events">${bars}${more}</div>
                  </div>`;
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

  function bookingWhatsappHref(serverHref, details) {
    const count = Number(details.pax) || 1;
    const tickets = count === 1 ? "1 person / 1 ticket" : `${count} people / ${count} tickets`;
    const lines = [
      "Hi Tiny! I'd like to book a spot.",
      `Guest: ${details.name}`,
      `Email: ${details.email}`,
      `Event: ${details.eventName}`,
      details.slot ? `Time: ${details.slot}` : "",
      `Tickets: ${tickets}`,
    ].filter(Boolean);
    let phone = "6282266484226";
    try {
      const digits = new URL(serverHref || `https://wa.me/${phone}`).pathname.replace(/\D/g, "");
      if (digits) phone = digits;
    } catch {
      /* keep the cafe WhatsApp number */
    }
    return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  function eventHtml(code) {
    const event = state.events.find((item) => item.public_code === code);
    if (!event) {
      return `<div class="events-wrap"><section class="section"><p>That event is not on the calendar.</p><p><button class="event-back" type="button" data-back>Back to events</button></p></section></div>`;
    }
    const price = formatIdr(event.price_idr);
    const slots = eventSlots(event);
    const cover = event.cover_url || HERO;
    return `
      <div class="event-page">
        <button class="event-back" type="button" data-back>← Upcoming events</button>
        <figure class="event-flyer">
          <img src="${escapeHtml(cover)}" alt="${escapeHtml(event.name)} flyer">
        </figure>
        <h1 class="event-title">${escapeHtml(event.name)}</h1>
        <aside class="ticket">
          <h2>Guest list</h2>
          <p class="ticket__when">${escapeHtml(prettyDate(event.party_date))}<br>${slots
            .map((slot) => escapeHtml(timeRange({ start_time: slot.start, end_time: slot.end })))
            .join("<br>")}</p>
          ${price ? `<p class="ticket__price">${escapeHtml(price)} <span class="muted" style="font-size:16px">per ticket</span></p>` : ""}
          <button class="btn" type="button" id="book-spot">Book your spot</button>
          <form id="guest-form" hidden>
            <label class="honeypot">Website<input name="website" tabindex="-1" autocomplete="off"></label>
            <label class="field"><span>Time</span>
              <select name="slot" required>
                ${slots.length > 1 ? `<option value="">Choose a time</option>` : ""}
                ${slots
                  .map(
                    (slot) =>
                      `<option value="${escapeHtml(slot.start)}|${escapeHtml(slot.end)}">${escapeHtml(
                        timeRange({ start_time: slot.start, end_time: slot.end })
                      )}</option>`
                  )
                  .join("")}
              </select>
            </label>
            <label class="field"><span>Name</span><input name="name" required autocomplete="name"></label>
            <label class="field"><span>Party size</span><input name="pax" type="number" min="1" max="40" value="1" required></label>
            <div class="field">
              <span>WhatsApp</span>
              <div class="phone-row">
                <select name="dial" aria-label="Country code">${DIALS.map((dial) => `<option value="${dial}">+${dial}</option>`).join("")}</select>
                <input name="phone" required inputmode="tel" autocomplete="tel" placeholder="812 3456 7890">
              </div>
            </div>
            <label class="field"><span>Email</span><input name="email" type="email" required autocomplete="email"></label>
            <button class="btn" type="submit">Book your spot</button>
            <p class="status" id="guest-status" role="status"></p>
          </form>
        </aside>
        <div class="about">
          <h2>About event</h2>
          <p>${escapeHtml(event.about || "We’ll share the details of this gathering at Tiny.")}</p>
          <div class="map-frame">
            <iframe title="Map of Tiny Healthy Cafe" src="${MAPS_EMBED}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            <p><strong>${escapeHtml(event.location_label || "Tiny Healthy Cafe")}</strong><br>${escapeHtml(CAFE_ADDRESS)}<br><a href="${MAPS_LINK}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p>
          </div>
        </div>
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
    const status =
      guest.status === "confirmed" ? "Confirmed" : guest.status === "contacted" ? "Contacted" : "Waiting for Tiny to confirm";
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

  function playVideo(el) {
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.removeAttribute("autoplay");
      el.pause();
      return;
    }
    el.muted = true;
    el.loop = true;
    el.playsInline = true;
    const playback = el.play();
    if (playback && typeof playback.catch === "function") playback.catch(() => {});
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
    app.querySelector("[data-back]")?.addEventListener("click", (event) => {
      event.preventDefault();
      go("");
    });
    document.getElementById("book-spot")?.addEventListener("click", () => {
      const form = document.getElementById("guest-form");
      const trigger = document.getElementById("book-spot");
      if (form) form.hidden = false;
      if (trigger) trigger.hidden = true;
      form?.querySelector("[name=name]")?.focus();
    });
    const form = document.getElementById("guest-form");
    form?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const status = document.getElementById("guest-status");
      const data = new FormData(form);
      if (String(data.get("website") || "").trim()) return;
      const slot = String(data.get("slot") || "");
      if (!slot.includes("|")) {
        status.textContent = "Choose a time slot first.";
        status.className = "status is-error";
        return;
      }
      const phone = normalizePhone(data.get("dial"), data.get("phone"));
      if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) {
        status.textContent = "Add a WhatsApp number with the country code.";
        status.className = "status is-error";
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
            slot,
            website: "",
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.ok) {
          status.textContent = body.error || body.message || "Could not join the guest list.";
          status.className = "status is-error";
          button.disabled = false;
          return;
        }
        status.textContent = "You’re on the guest list. Check your email for the link.";
        status.className = "status is-ok";
        const modal = document.getElementById("wa-modal");
        const link = document.getElementById("wa-go");
        const eventItem = state.events.find((item) => item.public_code === code);
        const slotText = form.querySelector("[name=slot]")?.selectedOptions?.[0]?.textContent?.trim() || "";
        if (link) {
          link.href = bookingWhatsappHref(body.whatsappHref, {
            name: String(data.get("name") || "").trim(),
            email: String(data.get("email") || "").trim(),
            eventName: eventItem?.name || "Event",
            slot: slotText,
            pax: Number(data.get("pax")) || 1,
          });
        }
        if (modal) modal.hidden = false;
        form.reset();
        form.hidden = true;
        const trigger = document.getElementById("book-spot");
        if (trigger) trigger.hidden = false;
      } catch (err) {
        status.textContent = err?.message || "Could not join the guest list.";
        status.className = "status is-error";
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
    playVideo(document.getElementById("hero-video-desktop"));
    playVideo(document.getElementById("hero-video-mobile"));
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
