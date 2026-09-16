import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.TINY_SUPABASE || {};
const supabase = createClient(cfg.url || "", cfg.anonKey || "");
const TZ = "Asia/Makassar";
const BIRTHDAY_SOURCES = ["party_builder", "cake", "pdf_quote"];
const RES_STATUSES = ["new", "contacted", "quoted", "booked", "cancelled", "rejected", "closed"];
const BIRTHDAY_STATUSES = ["new", "contacted", "quoted", "booked", "closed"];
const REQUEST_SELECT =
  "id, created_at, source, status, public_code, email, phone, contact_name, child_name, party_date, party_time, package_name, guest_adults, guest_kids, quote_total_idr, payload";

const loginCard = document.getElementById("login-card");
const app = document.getElementById("app");
const signOutBtn = document.getElementById("sign-out");
const detailView = document.getElementById("detail-view");
const inboxViews = document.getElementById("inbox-views");
const loginStatus = document.getElementById("login-status");
const viewNav = document.getElementById("view-nav");
const pageTitle = document.getElementById("page-title");

const state = {
  reservations: [],
  birthdays: [],
  section: "reservations",
  selectedDate: todayIso(),
  calendarMonth: todayIso().slice(0, 7),
};

function todayIso() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const grab = (type) => parts.find((part) => part.type === type).value;
  return `${grab("year")}-${grab("month")}-${grab("day")}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatIdr(n) {
  if (!n && n !== 0) return "—";
  return `IDR ${Math.round(n).toLocaleString("en-US")}`;
}

function formatWhen(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLongDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function timeLabel(value) {
  return String(value || "").slice(0, 5) || "—";
}

function sourceLabel(source) {
  if (source === "party_builder") return "Party";
  if (source === "cake") return "Cake";
  if (source === "pdf_quote") return "PDF";
  if (source === "reservation") return "Reservation";
  return source || "—";
}

function isBirthdaySection() {
  return state.section === "birthdays";
}

function currentRows() {
  return isBirthdaySection() ? state.birthdays : state.reservations;
}

function rowsOnDate(iso) {
  return currentRows().filter((row) => row.party_date === iso);
}

function undatedRows() {
  if (!isBirthdaySection()) return [];
  return state.birthdays.filter((row) => !row.party_date);
}

function displayName(row) {
  if (isBirthdaySection() || BIRTHDAY_SOURCES.includes(row.source)) {
    return row.child_name || row.contact_name || "Guest";
  }
  return row.contact_name || row.payload?.reservation?.name || row.child_name || "Guest";
}

function displayGuests(row) {
  if (isBirthdaySection() || BIRTHDAY_SOURCES.includes(row.source)) {
    return (
      [row.guest_kids ? `${row.guest_kids} kids` : "", row.guest_adults ? `${row.guest_adults} adults` : ""]
        .filter(Boolean)
        .join(" · ") || "—"
    );
  }
  return (
    [row.guest_kids ? `${row.guest_kids} kids` : "", row.guest_adults ? `${row.guest_adults} adults` : ""]
      .filter(Boolean)
      .join(" · ") || `${row.guest_adults || row.payload?.reservation?.guests || "—"} pax`
  );
}

function displaySubtitle(row) {
  if (isBirthdaySection() || BIRTHDAY_SOURCES.includes(row.source)) {
    const pkg = row.package_name || (row.source === "cake" ? "Cake only" : "Package TBC");
    const total = row.quote_total_idr ? ` · ${formatIdr(row.quote_total_idr)}` : "";
    return `${sourceLabel(row.source)} · ${pkg}${total}`;
  }
  return tableText(row);
}

function reservationStatusLabel(status) {
  if (status === "booked") return "Confirmed";
  if (status === "new" || status === "contacted" || status === "quoted") return "New booking";
  if (status === "cancelled") return "Cancelled";
  if (status === "rejected") return "Rejected";
  if (status === "closed") return "Finished";
  return status || "—";
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
    minutes: Number(grab("hour")) * 60 + Number(grab("minute")),
  };
}

function occupyKind(row) {
  return BIRTHDAY_SOURCES.includes(row.source) ? "birthday" : "reservation";
}

function slotRange(row) {
  const time = timeLabel(row.party_time);
  return window.TinyReserveMap?.occupyLabel?.(time, occupyKind(row)) || time;
}

function dineRange(row) {
  const time = timeLabel(row.party_time);
  if (occupyKind(row) === "birthday") return slotRange(row);
  return window.TinyReserveMap?.timeRangeLabel?.(time) || time;
}

function arriveBy(row) {
  const time = timeLabel(row.party_time);
  return window.TinyReserveMap?.graceLabel?.(time) || time;
}

function tableText(row) {
  return row.payload?.reservation?.tableLabel || row.package_name || "Table TBC";
}

function isNoShowExpired(row) {
  if (!["new", "contacted", "quoted"].includes(row.status)) return false;
  if (!row.party_date || !row.party_time) return false;
  const now = baliNowParts();
  const start = window.TinyReserveMap?.timeToMinutes?.(row.party_time);
  const grace = window.TinyReserveMap?.GRACE_MINUTES || 15;
  if (start == null) return false;
  if (row.party_date < now.date) return true;
  if (row.party_date > now.date) return false;
  return now.minutes >= start + grace;
}

async function expireNoShows() {
  const expired = state.reservations.filter(isNoShowExpired);
  if (!expired.length) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user?.id || null;
  const nowIso = new Date().toISOString();
  await Promise.all(
    expired.map((row) =>
      supabase
        .from("requests")
        .update({
          status: "cancelled",
          status_changed_at: nowIso,
          status_changed_by: uid,
        })
        .eq("id", row.id)
        .in("status", ["new", "contacted", "quoted"])
    )
  );
  expired.forEach((row) => {
    row.status = "cancelled";
  });
}

function dayTableIds(rows) {
  const ids = new Set();
  rows.forEach((row) => {
    if (["cancelled", "rejected", "closed"].includes(row.status)) return;
    (row.payload?.reservation?.tableIds || []).forEach((id) => ids.add(String(id)));
  });
  return [...ids];
}

function renderDayPlans(rows) {
  const host = document.getElementById("staff-day-plans");
  if (!host || !window.TinyReserveMap) return;
  const selected = dayTableIds(rows);
  host.innerHTML = `
    <div>
      <h3>Indoor</h3>
      <div class="staff-plan" id="staff-plan-indoor"></div>
    </div>
    <div>
      <h3>Terrace</h3>
      <div class="staff-plan" id="staff-plan-terrace"></div>
    </div>
  `;
  window.TinyReserveMap.renderMap(document.getElementById("staff-plan-indoor"), {
    area: "indoor",
    selected,
    held: [],
    guests: 1,
    interactive: false,
    base: "../reserve/img/",
  });
  window.TinyReserveMap.renderMap(document.getElementById("staff-plan-terrace"), {
    area: "terrace",
    selected,
    held: [],
    guests: 1,
    interactive: false,
    base: "../reserve/img/",
  });
}

function birthdayStatusLabel(status) {
  if (status === "booked") return "Confirmed";
  if (status === "new") return "New booking";
  if (status === "contacted") return "Contacted";
  if (status === "quoted") return "Quoted";
  if (status === "closed") return "Finished";
  return status || "—";
}

function statusLabel(status, section = state.section) {
  return section === "birthdays" ? birthdayStatusLabel(status) : reservationStatusLabel(status);
}

function statusClass(status, section = state.section) {
  if (status === "booked") return "booked";
  if (status === "cancelled") return "cancelled";
  if (status === "rejected") return "rejected";
  if (status === "closed") return "closed";
  if (section === "birthdays") {
    if (status === "contacted") return "contacted";
    if (status === "quoted") return "quoted";
  }
  return "new";
}

function parseHash() {
  const hash = (location.hash || "").replace(/^#/, "");
  const request = hash.match(/request\/([0-9a-f-]{36})/i);
  if (request) return { section: "detail", id: request[1] };
  const parts = hash.split("/").filter(Boolean);
  const section = parts[0] === "birthdays" ? "birthdays" : "reservations";
  const view = parts[1] === "calendar" || parts[1] === "timeline" ? parts[1] : "overview";
  return { section, view };
}

async function requireStaff() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return null;
  const { data, error } = await supabase
    .from("staff_users")
    .select("user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) {
    await supabase.auth.signOut();
    setLoginError("This account is not a staff login.");
    return null;
  }
  return user;
}

function setLoginError(message) {
  loginStatus.textContent = message || "";
  loginStatus.className = message ? "status is-error" : "status";
}

function showApp(show) {
  loginCard.hidden = show;
  app.hidden = !show;
  signOutBtn.hidden = !show;
}

function countBy(rows, pred) {
  return rows.filter(pred).length;
}

async function loadReservations() {
  const { data, error } = await supabase
    .from("requests")
    .select(REQUEST_SELECT)
    .eq("source", "reservation")
    .order("party_date", { ascending: true })
    .limit(500);
  if (error) throw error;
  state.reservations = data || [];
  await expireNoShows();
}

async function loadBirthdays() {
  const { data, error } = await supabase
    .from("requests")
    .select(REQUEST_SELECT)
    .in("source", BIRTHDAY_SOURCES)
    .order("party_date", { ascending: true })
    .limit(500);
  if (error) throw error;
  state.birthdays = data || [];
}

function renderNav(section, view) {
  document.querySelectorAll(".app-switch a").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.section === section);
  });
  if (viewNav) {
    viewNav.hidden = section === "detail";
    viewNav.querySelectorAll("a").forEach((link) => {
      const target = section === "detail" ? state.section : section;
      link.href = `#/${target}/${link.dataset.view}`;
      link.classList.toggle("is-active", link.dataset.view === view);
    });
  }
  if (pageTitle && section !== "detail") {
    pageTitle.textContent = section === "birthdays" ? "Birthdays" : "Reservations";
  }
}

function overviewStats(rows) {
  if (isBirthdaySection()) {
    return [
      ["booked", "Confirmed", countBy(rows, (r) => r.status === "booked")],
      ["new", "New booking", countBy(rows, (r) => r.status === "new")],
      ["contacted", "Contacted", countBy(rows, (r) => r.status === "contacted")],
      ["quoted", "Quoted", countBy(rows, (r) => r.status === "quoted")],
      ["closed", "Finished", countBy(rows, (r) => r.status === "closed")],
      ["total", "Total booking", rows.length],
    ];
  }
  return [
    ["booked", "Confirmed", countBy(rows, (r) => r.status === "booked")],
    ["new", "New booking", countBy(rows, (r) => ["new", "contacted", "quoted"].includes(r.status))],
    ["cancelled", "Cancelled", countBy(rows, (r) => r.status === "cancelled")],
    ["rejected", "Rejected", countBy(rows, (r) => r.status === "rejected")],
    ["closed", "Finished", countBy(rows, (r) => r.status === "closed")],
    ["total", "Total booking", rows.length],
  ];
}

function bookingCard(row) {
  return `<button class="booking-card" type="button" data-id="${escapeHtml(row.id)}">
    <div>
      <div class="code">${escapeHtml(row.public_code)}</div>
      <h3>${escapeHtml(displayName(row))}</h3>
      <div class="muted">${escapeHtml(row.phone || row.email || "")}</div>
    </div>
    <div>
      <span class="badge badge--${statusClass(row.status)}">${escapeHtml(statusLabel(row.status))}</span>
      <div class="muted">${escapeHtml(displaySubtitle(row))}</div>
    </div>
    <div class="time">${escapeHtml(isBirthdaySection() || BIRTHDAY_SOURCES.includes(row.source) ? timeLabel(row.party_time) : slotRange(row))}
      <div class="muted">${escapeHtml(displayGuests(row))}</div>
    </div>
  </button>`;
}

function renderOverview() {
  const dateInput = document.getElementById("inbox-date");
  const label = document.getElementById("selected-date-label");
  if (dateInput) dateInput.value = state.selectedDate;
  if (label) label.textContent = formatLongDate(state.selectedDate);
  const rows = rowsOnDate(state.selectedDate);
  const stats = overviewStats(rows);
  document.getElementById("stat-grid").innerHTML = stats
    .map(
      ([key, labelText, count]) =>
        `<article class="stat-card is-${key}"><strong>${count}</strong><span>${labelText}</span></article>`
    )
    .join("");
  const undated = undatedRows();
  const empty = isBirthdaySection()
    ? "No birthday bookings on this date."
    : "No reservations on this date.";
  const list = document.getElementById("booking-list");
  list.innerHTML = [
    rows.length
      ? rows
          .slice()
          .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)))
          .map(bookingCard)
          .join("")
      : `<p class="muted">${empty}</p>`,
    undated.length
      ? `<p class="date-label undated-label">No date yet</p>${undated.map(bookingCard).join("")}`
      : "",
  ].join("");
  document.getElementById("overview-status").textContent = `${rows.length} booking${
    rows.length === 1 ? "" : "s"
  }`;
  const policy = document.getElementById("res-policy");
  const plans = document.getElementById("staff-day-plans");
  if (policy) policy.hidden = isBirthdaySection();
  if (plans) plans.hidden = isBirthdaySection();
  if (!isBirthdaySection()) renderDayPlans(rows);
}

function monthCells(yearMonth) {
  const [year, month] = yearMonth.split("-").map(Number);
  const first = new Date(Date.UTC(year, month - 1, 1));
  const startWeekday = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prevDays = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) {
    const day = prevDays - startWeekday + 1 + i;
    const iso = new Date(Date.UTC(year, month - 2, day)).toISOString().slice(0, 10);
    cells.push({ iso, day, muted: true });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({ iso, day, muted: false });
  }
  while (cells.length % 7 !== 0) {
    const extra = cells.length - (startWeekday + daysInMonth) + 1;
    const iso = new Date(Date.UTC(year, month, extra)).toISOString().slice(0, 10);
    cells.push({ iso, day: extra, muted: true });
  }
  return cells;
}

function shiftMonth(yearMonth, delta) {
  const [year, month] = yearMonth.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return next.toISOString().slice(0, 7);
}

function legendItems() {
  if (isBirthdaySection()) {
    return [
      ["new", "New booking"],
      ["contacted", "Contacted"],
      ["quoted", "Quoted"],
      ["booked", "Confirmed"],
      ["closed", "Finished"],
    ];
  }
  return [
    ["new", "New booking"],
    ["booked", "Confirmed"],
    ["cancelled", "Cancelled"],
    ["rejected", "Rejected"],
    ["closed", "Finished"],
  ];
}

function calendarRows(iso) {
  if (isBirthdaySection()) return state.birthdays.filter((row) => row.party_date === iso);
  return [
    ...state.reservations.filter((row) => row.party_date === iso),
    ...state.birthdays.filter(
      (row) =>
        row.party_date === iso &&
        row.source === "party_builder" &&
        !["cancelled", "rejected", "closed"].includes(row.status)
    ),
  ];
}

function timelineRows() {
  return calendarRows(state.selectedDate).filter((row) => row.party_time);
}

function renderCalendar() {
  const title = document.getElementById("cal-title");
  const [year, month] = state.calendarMonth.split("-").map(Number);
  title.textContent = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  document.getElementById("cal-legend").innerHTML = legendItems()
    .map(([kind, text]) => `<span><span class="dot dot--${kind}"></span> ${escapeHtml(text)}</span>`)
    .join("");
  const heads = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    .map((name) => `<div class="cal-cell is-head">${name}</div>`)
    .join("");
  const cells = monthCells(state.calendarMonth)
    .map((cell) => {
      const rows = calendarRows(cell.iso);
      const classes = [
        "cal-cell",
        cell.muted ? "is-muted" : "",
        cell.iso === todayIso() ? "is-today" : "",
        cell.iso === state.selectedDate ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const dots = [...new Set(rows.map((row) => statusClass(row.status)))]
        .map((kind) => `<span class="dot dot--${kind}"></span>`)
        .join("");
      return `<button class="${classes}" type="button" data-date="${cell.iso}">
        <strong>${cell.day}</strong>
        ${rows.length ? `<span class="cal-count">${rows.length} book</span>` : ""}
        <span class="cal-dots">${dots}</span>
      </button>`;
    })
    .join("");
  document.getElementById("cal-grid").innerHTML = heads + cells;
}

function renderTimeline() {
  const rows = timelineRows();
  const Map = window.TinyReserveMap;
  const dayStart = Map?.DAY_START ?? 7 * 60 + 30;
  const dayEnd = Map?.DAY_END ?? 19 * 60;
  const span = dayEnd - dayStart;
  document.getElementById("timeline-count").textContent = isBirthdaySection()
    ? `${rows.length} ${rows.length === 1 ? "party" : "parties"} booked · 4-hour hold (1h prep + 3h party)`
    : `${rows.length} booking${rows.length === 1 ? "" : "s"} · tables 3 hours, birthdays 4 hours`;
  const slots = [];
  for (let minutes = dayStart; minutes <= dayEnd; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  const empty = isBirthdaySection()
    ? "No parties booked on this date."
    : "No tables or parties booked on this date.";
  const packed = rows
    .slice()
    .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)))
    .map((row) => {
      const range = Map?.occupyRange?.(row.party_time, occupyKind(row)) || {
        start: Map?.timeToMinutes?.(row.party_time) || dayStart,
        end: (Map?.timeToMinutes?.(row.party_time) || dayStart) + 120,
      };
      return { row, range };
    });
  const lanes = [];
  packed.forEach((item) => {
    let lane = lanes.findIndex((list) =>
      list.every((other) => item.range.end <= other.range.start || item.range.start >= other.range.end)
    );
    if (lane < 0) {
      lanes.push([]);
      lane = lanes.length - 1;
    }
    lanes[lane].push(item);
    item.lane = lane;
  });
  document.getElementById("timeline").innerHTML = `
    <div class="timeline__track" style="--lanes:${Math.max(lanes.length, 1)}; --slots:${slots.length}">
      <div class="timeline__hours">
        ${slots.map((slot) => `<div class="timeline__slot">${slot}</div>`).join("")}
      </div>
      <div class="timeline__bookings">
        ${
          packed.length
            ? packed
                .map((item) => {
                  const left = ((item.range.start - dayStart) / span) * 100;
                  const width = ((item.range.end - item.range.start) / span) * 100;
                  const kind = occupyKind(item.row);
                  return `<button class="timeline__item is-${kind}" type="button" data-id="${escapeHtml(item.row.id)}" style="left:${left}%;width:${width}%;top:calc(${item.lane} * 46px)">
                    <strong>${escapeHtml(slotRange(item.row))}</strong>
                    ${escapeHtml(displayName(item.row))} · ${escapeHtml(displaySubtitle(item.row))}
                    · ${escapeHtml(displayGuests(item.row))}
                    ${kind === "birthday" ? `<span class="muted">Prep + party</span>` : `<span class="muted">Dine ${escapeHtml(dineRange(item.row))} · arrive by ${escapeHtml(arriveBy(item.row))}</span>`}
                  </button>`;
                })
                .join("")
            : `<p class="muted">${empty}</p>`
        }
      </div>
    </div>
  `;
}

async function signedUrl(path) {
  if (!path) return "";
  const { data, error } = await supabase.storage.from("request-files").createSignedUrl(path, 3600);
  if (error) return "";
  return data?.signedUrl || "";
}

function backTarget(row) {
  if (row?.source === "reservation") return "#/reservations/overview";
  return "#/birthdays/overview";
}

async function loadDetail(id) {
  inboxViews.hidden = true;
  if (viewNav) viewNav.hidden = true;
  detailView.hidden = false;
  detailView.innerHTML = `<p class="status">Loading request…</p>`;
  const { data: row, error } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (error || !row) {
    detailView.innerHTML = `<p class="status is-error">${escapeHtml(
      error?.message || "Request not found."
    )}</p><button class="btn btn--outline back" type="button" id="back-list">Back</button>`;
    document.getElementById("back-list")?.addEventListener("click", () => {
      location.hash = `#/${state.section}/overview`;
    });
    return;
  }

  if (row.source === "reservation" && isNoShowExpired(row)) {
    const { data: sessionData } = await supabase.auth.getSession();
    await supabase
      .from("requests")
      .update({
        status: "cancelled",
        status_changed_at: new Date().toISOString(),
        status_changed_by: sessionData.session?.user?.id || null,
      })
      .eq("id", row.id)
      .in("status", ["new", "contacted", "quoted"]);
    row.status = "cancelled";
  }

  const files = row.files || {};
  const payload = row.payload || {};
  const quote = payload.quote || {};
  const cake = payload.cake || {};
  const decor = payload.decor || {};
  const reservation = payload.reservation || {};
  const isReservation = row.source === "reservation";
  const statuses = isReservation ? RES_STATUSES : BIRTHDAY_STATUSES;
  const [pdfUrl, backdropUrl, cakeUrl] = await Promise.all([
    signedUrl(files.quotePdf),
    signedUrl(files.backdropPng),
    signedUrl(files.cakePhoto),
  ]);
  const printEntries = Object.entries(files.prints || {});
  const printUrls = await Promise.all(printEntries.map(([, path]) => signedUrl(path)));
  const lines = (quote.lines || [])
    .map(
      (line) =>
        `<li><span>${escapeHtml(line.label)}${
          line.detail ? `<br><small>${escapeHtml(line.detail)}</small>` : ""
        }</span><span>${line.note ? "TBC" : escapeHtml(formatIdr(line.value))}</span></li>`
    )
    .join("");
  const wa = row.phone ? `https://wa.me/${String(row.phone).replace(/\D/g, "")}` : "";

  detailView.innerHTML = `
    <button class="btn btn--outline back" type="button" id="back-list">Back</button>
    <article class="detail">
      <header class="staff-top">
        <div>
          <p class="staff-brand">${escapeHtml(sourceLabel(row.source))}</p>
          <h2>${escapeHtml(row.public_code)}</h2>
          <p class="muted">Submitted ${escapeHtml(formatWhen(row.created_at))}</p>
        </div>
        <label class="field" style="margin:0;min-width:160px">
          <span>Status</span>
          <select id="status-select">
            ${statuses
              .map(
                (s) =>
                  `<option value="${s}"${s === row.status ? " selected" : ""}>${
                    isReservation ? reservationStatusLabel(s) : birthdayStatusLabel(s)
                  }</option>`
              )
              .join("")}
          </select>
        </label>
      </header>
      <div class="contact-actions">
        ${row.email ? `<a class="btn btn--outline" href="mailto:${escapeHtml(row.email)}">${escapeHtml(row.email)}</a>` : ""}
        ${row.phone ? `<a class="btn btn--outline" href="tel:${escapeHtml(row.phone)}">${escapeHtml(row.phone)}</a>` : ""}
        ${wa ? `<a class="btn" href="${escapeHtml(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
        ${pdfUrl ? `<a class="btn btn--outline" href="${escapeHtml(pdfUrl)}" target="_blank" rel="noopener">Open PDF quotation</a>` : ""}
      </div>
      <div class="detail-grid">
        <section>
          <h3>${isReservation ? "Reservation" : "Booking"}</h3>
          <ul class="kv">
            <li><span>${isReservation ? "Guest" : "Child"}</span><span>${escapeHtml(
              isReservation ? displayName(row) : row.child_name || "—"
            )}${!isReservation && row.child_age ? ` · turning ${escapeHtml(row.child_age)}` : ""}</span></li>
            <li><span>Date</span><span>${escapeHtml(row.party_date || "—")}</span></li>
            <li><span>Time</span><span>${escapeHtml(isReservation ? dineRange(row) : timeLabel(row.party_time))}</span></li>
            ${
              isReservation
                ? `<li><span>Held</span><span>${escapeHtml(slotRange(row))} (30 min before and after)</span></li>
                   <li><span>Arrive by</span><span>${escapeHtml(arriveBy(row))} or the table is released</span></li>`
                : row.source === "party_builder"
                  ? `<li><span>Held</span><span>${escapeHtml(slotRange(row))} (1h prep + 3h party)</span></li>`
                  : ""
            }
            <li><span>Guests</span><span>${escapeHtml(displayGuests(row))}</span></li>
            <li><span>${isReservation ? "Table" : "Package"}</span><span>${escapeHtml(
              isReservation ? tableText(row) : row.package_name || "—"
            )}</span></li>
            ${
              isReservation
                ? `<li><span>Purpose</span><span>${escapeHtml(reservation.purpose || "—")}</span></li>
                   <li><span>Area</span><span>${escapeHtml(reservation.area || row.package_id || "—")}</span></li>`
                : `<li><span>Theme / request</span><span>${escapeHtml(
                    decor.designRequest || decor.themeLabel || "—"
                  )}</span></li>`
            }
          </ul>
        </section>
        ${
          isReservation
            ? `<section>
          <h3>Table layout</h3>
          <div class="staff-plan" id="staff-detail-plan"></div>
          <p class="muted">2-hour slot. Held for 15 minutes after start; then cancelled if the guest has not arrived.</p>
        </section>`
            : `<section>
          <h3>Quotation</h3>
          <ul class="quote-list">
            ${lines || "<li><span>No lines</span><span>—</span></li>"}
            <li><span>Subtotal</span><span>${escapeHtml(formatIdr(quote.subtotal ?? row.quote_subtotal_idr))}</span></li>
            <li><span>Service 5%</span><span>${escapeHtml(formatIdr(quote.service ?? row.quote_service_idr))}</span></li>
            <li><span>Tax 10%</span><span>${escapeHtml(formatIdr(quote.tax ?? row.quote_tax_idr))}</span></li>
            <li class="is-total"><span>Total</span><span>${escapeHtml(formatIdr(quote.total ?? row.quote_total_idr))}</span></li>
            <li><span>DP 30%</span><span>${escapeHtml(formatIdr(quote.dp30 ?? row.quote_dp_idr))}</span></li>
          </ul>
        </section>
        <section>
          <h3>Cake</h3>
          <ul class="kv">
            <li><span>Size</span><span>${escapeHtml(cake.size || "—")}</span></li>
            <li><span>Sponge</span><span>${escapeHtml((cake.sponges || []).join(" + ") || "—")}</span></li>
            <li><span>Design</span><span>${escapeHtml(
              cake.mode === "own" ? "Own idea" : cake.design || "—"
            )}</span></li>
            <li><span>Theme</span><span>${escapeHtml(cake.theme || "—")}</span></li>
            <li><span>Diet</span><span>${escapeHtml((cake.diet || []).join(", ") || "—")}</span></li>
          </ul>
          ${cakeUrl ? `<img class="hero-img" src="${escapeHtml(cakeUrl)}" alt="Cake reference">` : ""}
        </section>
        <section>
          <h3>Decoration</h3>
          <ul class="kv">
            <li><span>Package</span><span>${escapeHtml(decor.packageLabel || "—")}</span></li>
            <li><span>Look</span><span>${escapeHtml(decor.themeLabel || "—")}</span></li>
            <li><span>Name on backdrop</span><span>${escapeHtml(decor.backdropName || "—")}</span></li>
            <li><span>Colours</span><span>${escapeHtml(
              (decor.balloonColours || []).map((c) => c.label || c.hex).join(", ") || "—"
            )}</span></li>
          </ul>
          ${backdropUrl ? `<img class="hero-img" src="${escapeHtml(backdropUrl)}" alt="Custom backdrop mockup">` : ""}
          <div class="media-row">
            ${printUrls
              .map((url, i) =>
                url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(printEntries[i][0])} print">` : ""
              )
              .join("")}
          </div>
        </section>`
        }
        <section>
          <h3>Notes</h3>
          <p>${escapeHtml(reservation.notes || (payload.party && payload.party.foodNotes) || "No food notes")}</p>
          <p>${escapeHtml((payload.party && payload.party.notes) || (isReservation ? "" : "No extra notes"))}</p>
          <label class="field">
            <span>Staff notes</span>
            <textarea id="staff-notes" rows="4">${escapeHtml(row.staff_notes || "")}</textarea>
          </label>
          <button class="btn" type="button" id="save-notes">Save notes</button>
          <p class="status" id="detail-status"></p>
        </section>
      </div>
    </article>
  `;

  if (isReservation && window.TinyReserveMap) {
    window.TinyReserveMap.renderMap(document.getElementById("staff-detail-plan"), {
      area: reservation.area === "terrace" ? "terrace" : "indoor",
      selected: reservation.tableIds || [],
      held: [],
      guests: row.guest_adults || reservation.guests || 1,
      interactive: false,
      base: "../reserve/img/",
    });
  }

  document.getElementById("back-list")?.addEventListener("click", () => {
    location.hash = backTarget(row);
  });
  document.getElementById("status-select")?.addEventListener("change", async (e) => {
    const status = e.target.value;
    const { data: sessionData } = await supabase.auth.getSession();
    await supabase
      .from("requests")
      .update({
        status,
        status_changed_at: new Date().toISOString(),
        status_changed_by: sessionData.session?.user?.id || null,
      })
      .eq("id", row.id);
  });
  document.getElementById("save-notes")?.addEventListener("click", async () => {
    const notes = document.getElementById("staff-notes")?.value || "";
    const statusEl = document.getElementById("detail-status");
    const { error: saveError } = await supabase.from("requests").update({ staff_notes: notes }).eq("id", row.id);
    if (statusEl) {
      statusEl.textContent = saveError ? saveError.message : "Notes saved.";
      statusEl.className = saveError ? "status is-error" : "status is-success";
    }
  });
}

function showInbox(section, view) {
  state.section = section;
  detailView.hidden = true;
  inboxViews.hidden = false;
  document.getElementById("overview-view").hidden = view !== "overview";
  document.getElementById("calendar-view").hidden = view !== "calendar";
  document.getElementById("timeline-view").hidden = view !== "timeline";
  renderNav(section, view);
  renderOverview();
  if (view === "calendar") renderCalendar();
  if (view === "timeline") renderTimeline();
}

async function route() {
  const parsed = parseHash();
  if (parsed.section === "detail") {
    renderNav(parsed.section, "");
    await loadDetail(parsed.id);
    return;
  }
  try {
    if (parsed.section === "birthdays") {
      await loadBirthdays();
    } else {
      await Promise.all([loadReservations(), loadBirthdays()]);
    }
    showInbox(parsed.section, parsed.view || "overview");
  } catch (err) {
    const node = document.getElementById("overview-status");
    if (node) {
      node.textContent = err.message || "Could not load inbox.";
      node.className = "status is-error";
    }
  }
}

document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  setLoginError("");
  const email = document.getElementById("login-email")?.value || "";
  const password = document.getElementById("login-password")?.value || "";
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setLoginError(error.message);
    return;
  }
  const user = await requireStaff();
  if (!user) return;
  showApp(true);
  if (!location.hash) location.hash = "#/reservations/overview";
  route();
});

signOutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showApp(false);
});

document.getElementById("booking-list")?.addEventListener("click", (e) => {
  const card = e.target.closest("[data-id]");
  if (!card) return;
  location.hash = `#/request/${card.dataset.id}`;
});

document.getElementById("timeline")?.addEventListener("click", (e) => {
  const item = e.target.closest("[data-id]");
  if (!item) return;
  location.hash = `#/request/${item.dataset.id}`;
});

document.getElementById("cal-grid")?.addEventListener("click", (e) => {
  const cell = e.target.closest("[data-date]");
  if (!cell) return;
  state.selectedDate = cell.dataset.date;
  location.hash = `#/${state.section}/overview`;
});

document.getElementById("inbox-date")?.addEventListener("change", (e) => {
  state.selectedDate = e.target.value || todayIso();
  state.calendarMonth = state.selectedDate.slice(0, 7);
  const parsed = parseHash();
  if (parsed.section === "reservations" || parsed.section === "birthdays") {
    showInbox(parsed.section, parsed.view || "overview");
  }
});

document.getElementById("cal-prev")?.addEventListener("click", () => {
  state.calendarMonth = shiftMonth(state.calendarMonth, -1);
  renderCalendar();
});
document.getElementById("cal-next")?.addEventListener("click", () => {
  state.calendarMonth = shiftMonth(state.calendarMonth, 1);
  renderCalendar();
});

window.addEventListener("hashchange", () => {
  if (!app.hidden) route();
});

function tickClock() {
  const node = document.getElementById("live-clock");
  if (!node) return;
  node.textContent = new Date().toLocaleString("en-GB", {
    timeZone: TZ,
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

(async () => {
  tickClock();
  window.setInterval(tickClock, 1000);
  if (!cfg.anonKey || cfg.anonKey === "PASTE_SUPABASE_ANON_KEY") {
    setLoginError("Add the Supabase anon key in shared/supabase-config.js");
    return;
  }
  const user = await requireStaff();
  if (!user) {
    showApp(false);
    return;
  }
  showApp(true);
  if (!location.hash) location.hash = "#/reservations/overview";
  route();
})();
