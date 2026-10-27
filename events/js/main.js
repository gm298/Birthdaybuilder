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

  function track(eventName, params) {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params || {});
      } else if (Array.isArray(window.dataLayer)) {
        window.dataLayer.push({ event: eventName, ...(params || {}) });
      }
    } catch (_) {
      /* analytics optional */
    }
  }

  function ticketUnit(event) {
    if (eventIsFree(event)) return 0;
    const amount = Number(event?.price_idr ?? event?.pricing?.total ?? event?.pricing?.price ?? 0);
    return amount > 0 ? Math.round(amount) : 0;
  }

  function eventIsFree(event) {
    if (event?.is_free === true || event?.is_free === "true" || event?.is_free === 1) return true;
    if (event?.pricing?.free === true || event?.pricing?.free === "true") return true;
    const raw = event?.price_idr ?? event?.pricing?.total ?? event?.pricing?.price;
    if (raw === 0 || raw === "0") return true;
    const amount = Number(raw);
    return raw != null && raw !== "" && Number.isFinite(amount) && amount === 0;
  }

  function ticketPriceLabel(event) {
    if (eventIsFree(event)) return "FREE!";
    const amount = ticketUnit(event);
    return amount ? `${formatIdr(amount)} / ticket` : "Price not confirmed";
  }

  function eventCapacity(event) {
    const capacity = Number(event?.capacity);
    return Number.isFinite(capacity) && capacity >= 1 ? Math.round(capacity) : 0;
  }

  function eventSpotsTaken(event) {
    const taken = Number(event?.spots_taken);
    return Number.isFinite(taken) && taken > 0 ? Math.round(taken) : 0;
  }

  function eventSpotsLeft(event) {
    const capacity = eventCapacity(event);
    if (!capacity) return null;
    return Math.max(0, capacity - eventSpotsTaken(event));
  }

  function spotsLeftLabel(event) {
    const left = eventSpotsLeft(event);
    if (left == null) return "";
    if (left <= 0) return "Sold out";
    if (left === 1) return "Only 1 spot left!";
    return `Only ${left} spots left!`;
  }

  let appliedEventPromo = null;

  function eventPromoDiscount(amount) {
    if (!appliedEventPromo || amount <= 0) return 0;
    const value = Number(appliedEventPromo.discount_value) || 0;
    if (appliedEventPromo.discount_type === "percent") {
      return Math.min(amount, Math.round((amount * value) / 100));
    }
    return Math.min(amount, Math.round(value));
  }

  async function previewEventPromo(code, amount) {
    const cfg = config();
    const res = await fetch(`${cfg.url}/rest/v1/rpc/preview_promotion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
      },
      body: JSON.stringify({
        p_code: code,
        p_channel: "event",
        p_amount: Math.max(0, Math.round(amount)),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || data.error || "Could not check that code.");
    return data;
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
          <div class="eyebrow">Tiny · Berawa</div>
          <h1>Upcoming classes<br>and family<br>events<br>at Tiny</h1>
          <p class="hero__sub">Find your next activity in Berawa.</p>
          <div class="hero__actions">
            <a class="btn btn--lg btn--dark" href="#upcoming-events">See upcoming events</a>
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
                          ${
                            event.audience
                              ? `<span class="event-card__meta">${escapeHtml(event.audience)}</span>`
                              : ""
                          }
                          <span class="event-card__price">${escapeHtml(ticketPriceLabel(event))}</span>
                          ${
                            spotsLeftLabel(event)
                              ? `<span class="event-card__spots">${escapeHtml(spotsLeftLabel(event))}</span>`
                              : ""
                          }
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
      "Hi Tiny! I'd like to request tickets.",
      `Guest: ${details.name}`,
      `Email: ${details.email}`,
      `Event: ${details.eventName}`,
      details.slot ? `Time: ${details.slot}` : "",
      `Tickets: ${tickets}`,
      details.price ? `Price: ${details.price}` : "",
      details.price === "FREE!" ? "Payment: free" : "Payment: pay on site at Tiny",
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

  function eventGallery(event) {
    const gallery = Array.isArray(event?.gallery)
      ? event.gallery.map((url) => String(url || "").trim()).filter(Boolean)
      : [];
    if (gallery.length) return [...new Set(gallery)];
    if (event?.cover_url) return [String(event.cover_url)];
    return [HERO];
  }

  function photoButton(url, index, alt) {
    return `<button class="event-photo" type="button" data-expand-photo="${index}" aria-label="View larger picture">
        <img src="${escapeHtml(url)}" alt="${alt}">
      </button>`;
  }

  function flyerHtml(event) {
    const images = eventGallery(event);
    const name = escapeHtml(event.name || "Event");
    if (images.length === 1) {
      return `<figure class="event-media">${photoButton(images[0], 0, `${name} flyer`)}</figure>`;
    }
    return `<div class="event-slider" data-slider>
        <div class="event-slider__viewport">
          <div class="event-slider__track">
            ${images
              .map(
                (url, index) =>
                  `<figure class="event-slider__slide">${photoButton(url, index, `${name} picture ${index + 1}`)}</figure>`
              )
              .join("")}
          </div>
        </div>
        <button class="event-slider__nav event-slider__nav--prev" type="button" data-slider-prev aria-label="Previous picture">‹</button>
        <button class="event-slider__nav event-slider__nav--next" type="button" data-slider-next aria-label="Next picture">›</button>
        <div class="event-slider__dots" role="tablist" aria-label="Pictures">
          ${images
            .map(
              (_, index) =>
                `<button class="event-slider__dot${index === 0 ? " is-active" : ""}" type="button" data-slider-dot="${index}" aria-label="Picture ${index + 1}"></button>`
            )
            .join("")}
        </div>
      </div>`;
  }

  let lightboxUrls = [];
  let lightboxIndex = 0;
  let lightboxReady = false;

  function lightboxEl() {
    let box = document.getElementById("event-lightbox");
    if (box) return box;
    box = document.createElement("div");
    box.id = "event-lightbox";
    box.className = "event-lightbox";
    box.hidden = true;
    box.innerHTML = `
      <button class="event-lightbox__backdrop" type="button" data-lightbox-close aria-label="Close picture"></button>
      <button class="event-lightbox__nav event-lightbox__nav--prev" type="button" data-lightbox-prev aria-label="Previous picture">‹</button>
      <img class="event-lightbox__img" alt="">
      <button class="event-lightbox__nav event-lightbox__nav--next" type="button" data-lightbox-next aria-label="Next picture">›</button>
      <button class="event-lightbox__close" type="button" data-lightbox-close aria-label="Close picture">×</button>`;
    document.body.appendChild(box);
    return box;
  }

  function paintLightbox() {
    const box = lightboxEl();
    const img = box.querySelector(".event-lightbox__img");
    const multi = lightboxUrls.length > 1;
    box.querySelector("[data-lightbox-prev]").hidden = !multi;
    box.querySelector("[data-lightbox-next]").hidden = !multi;
    if (img) {
      img.src = lightboxUrls[lightboxIndex] || "";
      img.alt = lightboxUrls.length > 1 ? `Event picture ${lightboxIndex + 1}` : "Event picture";
    }
  }

  function stepLightbox(delta) {
    if (lightboxUrls.length < 2) return;
    lightboxIndex = (lightboxIndex + delta + lightboxUrls.length) % lightboxUrls.length;
    paintLightbox();
  }

  function closeLightbox() {
    const box = document.getElementById("event-lightbox");
    if (!box || box.hidden) return;
    box.hidden = true;
    document.body.style.overflow = "";
  }

  function openLightbox(urls, index) {
    lightboxUrls = urls.filter(Boolean);
    if (!lightboxUrls.length) return;
    lightboxIndex = Math.max(0, Math.min(index, lightboxUrls.length - 1));
    const box = lightboxEl();
    if (!lightboxReady) {
      lightboxReady = true;
      box.addEventListener("click", (event) => {
        if (event.target.closest("[data-lightbox-close]")) closeLightbox();
        else if (event.target.closest("[data-lightbox-prev]")) stepLightbox(-1);
        else if (event.target.closest("[data-lightbox-next]")) stepLightbox(1);
      });
      document.addEventListener("keydown", (event) => {
        if (box.hidden) return;
        if (event.key === "Escape") closeLightbox();
        else if (event.key === "ArrowRight") stepLightbox(1);
        else if (event.key === "ArrowLeft") stepLightbox(-1);
      });
    }
    paintLightbox();
    box.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function eventHtml(code) {
    const event = state.events.find((item) => item.public_code === code);
    if (!event) {
      return `<div class="events-wrap"><section class="section"><p>That event is not on the calendar.</p><p><button class="event-back" type="button" data-back>Back to events</button></p></section></div>`;
    }
    const unit = ticketUnit(event);
    const price = formatIdr(unit);
    const priceLabel = ticketPriceLabel(event);
    const isFree = eventIsFree(event);
    const spotsLeft = eventSpotsLeft(event);
    const spotsLabel = spotsLeftLabel(event);
    const soldOut = spotsLeft === 0;
    const bookable = priceLabel !== "Price not confirmed" && !soldOut;
    const actionLabel = soldOut ? "Sold out" : bookable ? "Request tickets" : "Register your interest";
    const payLine = soldOut
      ? "This event is full."
      : isFree
        ? "The team confirms your place."
        : unit
          ? "The team confirms your place. Pay at Tiny when you attend."
          : "The price is not confirmed, so this is not a paid reservation.";
    const slots = eventSlots(event);
    const aboutText = String(event.about || "").trim();
    const maxTickets = spotsLeft == null ? 40 : Math.max(1, spotsLeft);
    return `
      <div class="event-page">
        <button class="event-back" type="button" data-back>← Upcoming events</button>
        ${flyerHtml(event)}
        <h1 class="event-title">${escapeHtml(event.name)}</h1>
        <p class="event-facts">${escapeHtml(prettyDate(event.party_date))}<br>${slots
          .map((slot) => escapeHtml(timeRange({ start_time: slot.start, end_time: slot.end })))
          .join("<br>")}<br>${escapeHtml(event.location_label || "Tiny Healthy Cafe, Berawa")}<br>${escapeHtml(
          priceLabel
        )}${unit ? " · Pay at Tiny" : ""}${
          spotsLabel ? `<br><span class="event-spots">${escapeHtml(spotsLabel)}</span>` : ""
        }</p>
        <aside class="ticket">
          <h2>Tickets</h2>
          <p class="ticket__when">${escapeHtml(prettyDate(event.party_date))}<br>${slots
            .map((slot) => escapeHtml(timeRange({ start_time: slot.start, end_time: slot.end })))
            .join("<br>")}</p>
          <p class="ticket__price">${
            price
              ? `${escapeHtml(price)} <span class="muted" style="font-size:16px">per ticket</span>`
              : escapeHtml(priceLabel)
          }</p>
          ${spotsLabel ? `<p class="ticket__spots">${escapeHtml(spotsLabel)}</p>` : ""}
          <p class="ticket__pay">${escapeHtml(payLine)}</p>
          <p class="ticket__due" id="ticket-due"${unit ? "" : " hidden"}></p>
          <button class="btn" type="button" id="book-spot"${soldOut ? " disabled" : ""}>${actionLabel}</button>
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
            <div class="field">
              <span id="pax-label">Tickets</span>
              <p class="field__hint">One ticket is one participant.${
                spotsLeft != null ? ` ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left.` : ""
              }</p>
              <div class="guest-stepper" data-guest-stepper>
                <div class="guest-stepper__row">
                  <label class="guest-stepper__name" for="guest-pax">Tickets</label>
                  <button type="button" class="guest-stepper__btn" data-for="guest-pax" data-step="-1" aria-label="Fewer tickets">−</button>
                  <input class="guest-stepper__input" type="number" id="guest-pax" name="pax" min="1" max="${maxTickets}" inputmode="numeric" value="1" aria-labelledby="pax-label">
                  <button type="button" class="guest-stepper__btn" data-for="guest-pax" data-step="1" aria-label="More tickets">+</button>
                </div>
              </div>
            </div>
            <div class="field">
              <span>WhatsApp</span>
              <div class="phone-split">
                <div class="dial-combobox">
                  <input type="hidden" id="contact-dial" name="contact-dial" value="62">
                  <input type="text" id="contact-dial-search" class="dial-combobox__input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="contact-dial-list" aria-label="Country code" autocomplete="off" spellcheck="false" placeholder="+62 ID">
                  <ul class="dial-combobox__list" id="contact-dial-list" role="listbox" hidden></ul>
                </div>
                <input type="tel" name="phone" inputmode="tel" autocomplete="tel" placeholder="812 3456 7890">
              </div>
            </div>
            <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email"></label>
            <p class="field__hint">Add an email or a WhatsApp number. One is enough.</p>
            ${
              unit
                ? `<button type="button" class="promo-reveal" id="promo-reveal">Have a promo code?</button>
            <div class="field" id="promo-box" hidden>
              <span>Promo code</span>
              <div class="promo-row">
                <input name="promo" id="promo-code" autocomplete="off" spellcheck="false" placeholder="Optional" maxlength="32">
                <button class="btn" type="button" id="promo-apply">Apply</button>
              </div>
              <p class="status" id="promo-status" role="status"></p>
            </div>`
                : ""
            }
            <button class="btn" type="submit">${actionLabel}</button>
            <p class="status" id="guest-status" role="status"></p>
          </form>
        </aside>
        <div class="about">
          <h2>About event</h2>
          <p>${aboutText ? escapeHtml(aboutText) : "Details for this class are still being added."}</p>
          ${
            event.audience
              ? `<p><strong>Who it’s for</strong><br>${escapeHtml(event.audience)}</p>`
              : ""
          }
          ${
            event.duration
              ? `<p><strong>Duration</strong><br>${escapeHtml(event.duration)}</p>`
              : ""
          }
          ${
            event.includes
              ? `<p><strong>Included</strong><br>${escapeHtml(event.includes)}</p>`
              : ""
          }
          <div class="map-frame">
            <iframe title="Map of Tiny Healthy Cafe" src="${MAPS_EMBED}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
            <p><strong>${escapeHtml(event.location_label || "Tiny Healthy Cafe")}</strong><br>${escapeHtml(CAFE_ADDRESS)}<br><a href="${MAPS_LINK}" target="_blank" rel="noopener noreferrer">Open in Google Maps</a></p>
          </div>
        </div>
      </div>
      <div class="wa-modal" id="wa-modal" hidden>
        <div class="wa-modal__card" role="dialog" aria-modal="true" aria-labelledby="wa-title">
          <h2 id="wa-title" class="section-title">You’re on the list</h2>
          <p>${
            isFree
              ? "We received your request. Tiny will confirm your place. This event is free."
              : "We received your request. Tiny will confirm your place. Pay at Tiny when you attend. This does not reserve the seat until the team confirms."
          }</p>
          <p><a class="btn" id="wa-go" href="#" target="_blank" rel="noopener noreferrer">WhatsApp Tiny</a></p>
          <p><button class="btn" type="button" data-close-wa style="width:auto;background:transparent;color:var(--sage)">Close</button></p>
        </div>
      </div>
      `;
  }

  const guestView = {
    token: "",
    guest: null,
    error: "",
    mode: "view",
    email: "",
    phone: "",
    message: "",
    messageKind: "",
  };

  function guestVerifyKey(token) {
    return `tiny-guest-verified-${token}`;
  }

  function loadGuestVerified(token) {
    try {
      const raw = sessionStorage.getItem(guestVerifyKey(token));
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function saveGuestVerified(token, email, phone) {
    try {
      sessionStorage.setItem(guestVerifyKey(token), JSON.stringify({ email, phone }));
    } catch (_) {
      /* ignore */
    }
  }

  function guestStatusLabel(status) {
    if (status === "confirmed") return "Confirmed";
    if (status === "contacted") return "Contacted";
    if (status === "rejected") return "Not confirmed";
    return "Waiting for Tiny to confirm";
  }

  function guestDetailsHtml(guest) {
    return `<p class="muted">${escapeHtml(guest.publicCode || "")}</p>
      <h1>${escapeHtml(guest.eventName || "Event")}</h1>
      <p>${escapeHtml(prettyDate(guest.partyDate))}${guest.startTime ? ` · ${escapeHtml(guest.startTime)}` : ""}</p>
      <p>${escapeHtml(guest.name)} · ${escapeHtml(guest.pax)} ${Number(guest.pax) === 1 ? "guest" : "guests"}</p>
      ${guest.priceLabel ? `<p>${escapeHtml(guest.priceLabel)}</p>` : ""}
      <p><strong>${escapeHtml(guestStatusLabel(guest.status))}</strong></p>
      ${
        guest.payment === "free"
          ? ""
          : `<p>${escapeHtml(guest.payment === "paid" ? "Paid" : "Pay on site")}</p>`
      }`;
  }

  function guestHtml() {
    const guest = guestView.guest;
    if (!guest) {
      return `<div class="guest-card"><h1>Guest list</h1><p>${escapeHtml(guestView.error || "We couldn’t find that request.")}</p><p><a href="${escapeHtml(window.location.pathname)}">See events</a></p></div>`;
    }
    const message = guestView.message
      ? `<p class="status${guestView.messageKind === "ok" ? " is-ok" : ""}" role="status">${escapeHtml(guestView.message)}</p>`
      : `<p class="status" role="status"></p>`;
    if (guestView.mode === "verify") {
      return `<div class="guest-card">
        ${guestDetailsHtml(guest)}
        <form id="guest-verify">
          <h2>Confirm it’s you</h2>
          <p class="muted">Enter the details used for this request before you can edit it.</p>
          ${
            guest.hasEmail
              ? `<label class="field"><span>Email</span><input type="email" name="email" required autocomplete="email" value="${escapeHtml(guestView.email)}"></label>`
              : ""
          }
          ${
            guest.hasPhone
              ? `<label class="field"><span>WhatsApp</span><input type="tel" name="phone" required autocomplete="tel" placeholder="+62 812 3456 7890" value="${escapeHtml(guestView.phone)}"></label>`
              : ""
          }
          <button class="btn" type="submit">Confirm</button>
          <p><button class="btn" type="button" data-guest-back style="width:auto;background:transparent;color:var(--sage)">Back to details</button></p>
          ${message}
        </form>
      </div>`;
    }
    if (guestView.mode === "edit") {
      return `<div class="guest-card">
        <p class="muted">${escapeHtml(guest.publicCode || "")}</p>
        <h1>Edit guest list</h1>
        <p>${escapeHtml(guest.eventName || "Event")}${guest.startTime ? ` · ${escapeHtml(guest.startTime)}` : ""}</p>
        <form id="guest-edit">
          <label class="field"><span>Name</span><input name="name" required autocomplete="name" value="${escapeHtml(guest.name || "")}"></label>
          <label class="field"><span>Tickets</span><input type="number" name="pax" min="1" max="40" required value="${escapeHtml(guest.pax || 1)}"></label>
          <label class="field"><span>Notes</span><textarea name="notes" maxlength="400" rows="3">${escapeHtml(guest.notes || "")}</textarea></label>
          <button class="btn" type="submit">Save</button>
          <p><button class="btn" type="button" data-guest-back style="width:auto;background:transparent;color:var(--sage)">Back to details</button></p>
          ${message}
        </form>
      </div>`;
    }
    return `<div class="guest-card">
      ${guestDetailsHtml(guest)}
      ${
        guest.editable === true
          ? `<p><button class="btn" type="button" id="guest-edit-open">Edit details</button></p>`
          : guest.editable === false
            ? `<p class="muted">This request can’t be changed from the link. WhatsApp Tiny if something needs updating.</p>`
            : ""
      }
      ${message}
      <p><a href="${escapeHtml(window.location.pathname)}">See all events</a></p>
    </div>`;
  }

  async function postGuest(body) {
    const cfg = config();
    const res = await fetch(cfg.joinEventUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.error || "Could not update the guest list.");
    return data;
  }

  function paintGuest() {
    app.innerHTML = guestHtml();
    document.getElementById("guest-edit-open")?.addEventListener("click", () => {
      guestView.message = "";
      if (guestView.email || guestView.phone) {
        openGuestEdit().catch((err) => {
          guestView.mode = "verify";
          guestView.message = err.message || "Enter the details used for this request.";
          paintGuest();
        });
        return;
      }
      guestView.mode = "verify";
      paintGuest();
    });
    document.querySelector("[data-guest-back]")?.addEventListener("click", () => {
      guestView.mode = "view";
      guestView.message = "";
      paintGuest();
    });
    document.getElementById("guest-verify")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      guestView.email = String(form.querySelector('[name="email"]')?.value || guestView.email || "").trim();
      guestView.phone = String(form.querySelector('[name="phone"]')?.value || guestView.phone || "").trim();
      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      try {
        await openGuestEdit();
      } catch (err) {
        guestView.message = err.message || "Those details don’t match this request.";
        guestView.messageKind = "";
        paintGuest();
      }
    });
    document.getElementById("guest-edit")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const button = form.querySelector('button[type="submit"]');
      if (button) button.disabled = true;
      guestView.message = "Saving…";
      guestView.messageKind = "";
      const status = form.querySelector(".status");
      if (status) status.textContent = "Saving…";
      try {
        const data = await postGuest({
          action: "update",
          token: guestView.token,
          email: guestView.email,
          phone: guestView.phone,
          name: String(form.querySelector('[name="name"]')?.value || "").trim(),
          pax: Number(form.querySelector('[name="pax"]')?.value) || 1,
          notes: String(form.querySelector('[name="notes"]')?.value || "").trim(),
        });
        guestView.guest = data.guest || guestView.guest;
        guestView.mode = "view";
        guestView.message = "Saved.";
        guestView.messageKind = "ok";
        paintGuest();
      } catch (err) {
        guestView.message = err.message || "Could not save.";
        guestView.messageKind = "";
        paintGuest();
      }
    });
  }

  async function openGuestEdit() {
    const data = await postGuest({
      action: "verify",
      token: guestView.token,
      email: guestView.email,
      phone: guestView.phone,
    });
    saveGuestVerified(guestView.token, guestView.email, guestView.phone);
    guestView.guest = data.guest || guestView.guest;
    guestView.mode = "edit";
    guestView.message = "";
    paintGuest();
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
              `<button type="button" data-open="${escapeHtml(event.public_code)}"><strong>${escapeHtml(event.name)}</strong><br><span class="muted">${escapeHtml(timeRange(event))}${
                ticketPriceLabel(event) ? ` · ${escapeHtml(ticketPriceLabel(event))}` : ""
              }${spotsLeftLabel(event) ? ` · ${escapeHtml(spotsLeftLabel(event))}` : ""}</span></button>`
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
    if (window.TinyContact?.normalizePhone) return window.TinyContact.normalizePhone(dial, national);
    const digits = String(national || "").replace(/\D/g, "").replace(/^0+/, "");
    const code = String(dial || "62").replace(/\D/g, "") || "62";
    if (!digits) return "";
    return `+${code}${digits}`;
  }

  function bindDialCombobox() {
    window.TinyContact?.initDialCombobox?.();
  }

  function resetDialCombobox() {
    const hidden = document.getElementById("contact-dial");
    const search = document.getElementById("contact-dial-search");
    if (hidden) hidden.value = "62";
    if (search) search.value = "+62 ID";
  }

  function updateTicketDue() {
    const due = document.getElementById("ticket-due");
    const input = document.getElementById("guest-pax");
    const code = params().get("e");
    const event = state.events.find((item) => item.public_code === code);
    const unit = ticketUnit(event);
    if (!due) return;
    if (!unit) {
      due.hidden = true;
      return;
    }
    const pax = Math.max(1, Number(input?.value) || 1);
    const gross = unit * pax;
    const discount = eventPromoDiscount(gross);
    const net = Math.max(0, gross - discount);
    const promoNote = discount && appliedEventPromo?.code ? ` · ${appliedEventPromo.code} saves ${formatIdr(discount)}` : "";
    due.hidden = false;
    due.textContent =
      pax === 1
        ? `${formatIdr(net)} for 1 ticket${promoNote} · pay at Tiny`
        : `${formatIdr(net)} for ${pax} tickets${promoNote} · pay at Tiny`;
  }

  function initPartySize() {
    const input = document.getElementById("guest-pax");
    if (!input) return;
    window.TinyGuestStepper?.init?.(document.getElementById("events-app") || document);
    input.addEventListener("input", updateTicketDue);
    input.addEventListener("change", updateTicketDue);
    updateTicketDue();
  }

  function bindEventPromo(eventCode) {
    const input = document.getElementById("promo-code");
    const button = document.getElementById("promo-apply");
    const status = document.getElementById("promo-status");
    if (!input || !button) return;
    const paint = (message, kind) => {
      if (!status) return;
      status.textContent = message || "";
      status.className = kind ? `status ${kind}` : "status";
    };
    input.addEventListener("input", () => {
      const typed = input.value.trim();
      if (appliedEventPromo && typed.toUpperCase() !== String(appliedEventPromo.code || "").toUpperCase()) {
        appliedEventPromo = null;
        paint("");
        updateTicketDue();
      }
    });
    button.addEventListener("click", async () => {
      const codeText = input.value.trim();
      if (!codeText) {
        appliedEventPromo = null;
        paint("");
        updateTicketDue();
        return;
      }
      const eventItem = state.events.find((item) => item.public_code === eventCode);
      const unit = ticketUnit(eventItem);
      const pax = Math.max(1, Number(document.getElementById("guest-pax")?.value) || 1);
      if (!unit) {
        paint("This event has no ticket price to discount.", "is-error");
        return;
      }
      button.disabled = true;
      paint("Checking code…");
      try {
        const result = await previewEventPromo(codeText, unit * pax);
        if (!result?.ok) {
          appliedEventPromo = null;
          paint(result?.error || "That promo code is not valid.", "is-error");
          updateTicketDue();
          return;
        }
        appliedEventPromo = result;
        input.value = result.code || codeText;
        paint(`${result.name || result.code} applied.`, "is-ok");
        updateTicketDue();
      } catch (err) {
        appliedEventPromo = null;
        paint(err.message || "Could not check that code.", "is-error");
        updateTicketDue();
      } finally {
        button.disabled = false;
      }
    });
  }

  function bindEvent(code) {
    app.querySelector("[data-back]")?.addEventListener("click", (event) => {
      event.preventDefault();
      go("");
    });
    const slider = app.querySelector("[data-slider]");
    if (slider) {
      let index = 0;
      const track = slider.querySelector(".event-slider__track");
      const dots = [...slider.querySelectorAll("[data-slider-dot]")];
      const total = dots.length;
      const goTo = (next) => {
        index = ((next % total) + total) % total;
        if (track) track.style.transform = `translateX(-${index * 100}%)`;
        dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
      };
      slider.querySelector("[data-slider-prev]")?.addEventListener("click", () => goTo(index - 1));
      slider.querySelector("[data-slider-next]")?.addEventListener("click", () => goTo(index + 1));
      dots.forEach((dot) => {
        dot.addEventListener("click", () => goTo(Number(dot.getAttribute("data-slider-dot")) || 0));
      });
      let startX = 0;
      slider.addEventListener(
        "touchstart",
        (event) => {
          startX = event.changedTouches?.[0]?.clientX || 0;
        },
        { passive: true }
      );
      let swiped = false;
      slider.addEventListener(
        "touchend",
        (event) => {
          const endX = event.changedTouches?.[0]?.clientX || 0;
          const delta = endX - startX;
          if (Math.abs(delta) < 40) return;
          swiped = true;
          goTo(delta < 0 ? index + 1 : index - 1);
          window.setTimeout(() => {
            swiped = false;
          }, 400);
        },
        { passive: true }
      );
      slider.addEventListener("click", (event) => {
        const trigger = event.target.closest("[data-expand-photo]");
        if (!trigger) return;
        if (swiped) {
          swiped = false;
          event.preventDefault();
          return;
        }
        const urls = [...slider.querySelectorAll("[data-expand-photo] img")].map((img) => img.getAttribute("src") || "");
        openLightbox(urls, Number(trigger.getAttribute("data-expand-photo")) || 0);
      });
    }
    app.querySelector(".event-media [data-expand-photo]")?.addEventListener("click", (event) => {
      const trigger = event.currentTarget;
      const img = trigger.querySelector("img");
      openLightbox([img?.getAttribute("src") || ""], 0);
    });
    appliedEventPromo = null;
    initPartySize();
    updateTicketDue();
    bindDialCombobox();
    bindEventPromo(code);
    document.getElementById("promo-reveal")?.addEventListener("click", () => {
      const box = document.getElementById("promo-box");
      const reveal = document.getElementById("promo-reveal");
      if (box) box.hidden = false;
      if (reveal) reveal.hidden = true;
      document.getElementById("promo-code")?.focus();
    });
    document.getElementById("book-spot")?.addEventListener("click", () => {
      const eventItem = state.events.find((item) => item.public_code === code);
      if (eventSpotsLeft(eventItem) === 0) return;
      track("reservation_started", { event_code: code });
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
      const eventItem = state.events.find((item) => item.public_code === code);
      const left = eventSpotsLeft(eventItem);
      if (left === 0) {
        status.textContent = "This event is sold out.";
        status.className = "status is-error";
        return;
      }
      const requestedPax = Math.max(1, Number(data.get("pax")) || 1);
      if (left != null && requestedPax > left) {
        status.textContent =
          left === 1 ? "Only 1 spot left." : `Only ${left} spots left. Choose fewer tickets.`;
        status.className = "status is-error";
        return;
      }
      const slot = String(data.get("slot") || "");
      if (!slot.includes("|")) {
        status.textContent = "Choose a time slot first.";
        status.className = "status is-error";
        return;
      }
      const email = String(data.get("email") || "").trim();
      const phoneRaw = String(data.get("phone") || "").trim();
      let phone = "";
      if (phoneRaw) {
        phone = normalizePhone(data.get("contact-dial") || document.getElementById("contact-dial")?.value, phoneRaw);
        if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) {
          status.textContent = "Add a WhatsApp number with the country code, or use email instead.";
          status.className = "status is-error";
          return;
        }
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = "Enter a valid email, or use WhatsApp instead.";
        status.className = "status is-error";
        return;
      }
      if (!email && !phone) {
        status.textContent = "Add an email or a WhatsApp number.";
        status.className = "status is-error";
        return;
      }
      const typedPromo = String(data.get("promo") || "").trim();
      if (typedPromo && (!appliedEventPromo || appliedEventPromo.code.toUpperCase() !== typedPromo.toUpperCase())) {
        status.textContent = "Apply the promo code, or clear it, before booking.";
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
            email,
            phone,
            slot,
            payment: "onsite",
            promoCode: appliedEventPromo?.code || "",
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
        status.textContent = "Request received. Tiny will confirm your place.";
        status.className = "status is-ok";
        track("reservation_confirmed", { event_code: code });
        const modal = document.getElementById("wa-modal");
        const link = document.getElementById("wa-go");
        const eventItem = state.events.find((item) => item.public_code === code);
        const slotText = form.querySelector("[name=slot]")?.selectedOptions?.[0]?.textContent?.trim() || "";
        const paxCount = Number(data.get("pax")) || 1;
        const gross = ticketUnit(eventItem) * paxCount;
        const discount = eventPromoDiscount(gross);
        const net = Math.max(0, gross - discount);
        if (link) {
          link.href = bookingWhatsappHref(body.whatsappHref, {
            name: String(data.get("name") || "").trim(),
            email,
            eventName: eventItem?.name || "Event",
            slot: slotText,
            pax: paxCount,
            price: net
              ? `${formatIdr(net)}${appliedEventPromo?.code ? ` with ${appliedEventPromo.code}` : ""}`
              : ticketPriceLabel(eventItem),
          });
        }
        if (modal) modal.hidden = false;
        form.reset();
        appliedEventPromo = null;
        resetDialCombobox();
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
    guestView.token = token;
    guestView.guest = null;
    guestView.error = "";
    guestView.mode = "view";
    guestView.message = "";
    const saved = loadGuestVerified(token);
    guestView.email = saved?.email || "";
    guestView.phone = saved?.phone || "";
    app.innerHTML = `<div class="guest-card"><h1>Guest list</h1><p class="muted">Loading…</p></div>`;
    try {
      const body = await postGuest({ action: "status", token });
      guestView.guest = body.guest || null;
      guestView.error = body.guest ? "" : body.error || "We couldn’t find that request.";
    } catch (err) {
      guestView.guest = null;
      guestView.error = err?.message && err.message !== "Failed to fetch"
        ? err.message
        : "Could not load that guest list request.";
    }
    paintGuest();
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
      track("event_detail_view", { event_code: code });
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
