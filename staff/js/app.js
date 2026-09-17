import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.TINY_SUPABASE || {};
const supabase = createClient(cfg.url || "", cfg.anonKey || "");
const TZ = "Asia/Makassar";
const BIRTHDAY_SOURCES = ["party_builder", "cake", "pdf_quote"];
const ALL_STATUSES = ["new", "contacted", "quoted", "booked", "cancelled", "rejected", "closed"];
const EVENT_STATUSES = ["booked", "cancelled", "closed"];
const PENDING_STATUSES = ["new", "contacted", "quoted"];
const REQUEST_SELECT =
  "id, created_at, source, status, public_code, email, phone, contact_name, child_name, party_date, party_time, package_name, guest_adults, guest_kids, quote_total_idr, payload, files, google_event_id";

const loginCard = document.getElementById("login-card");
const app = document.getElementById("app");
const signOutBtn = document.getElementById("sign-out");
const detailView = document.getElementById("detail-view");
const inboxViews = document.getElementById("inbox-views");
const loginStatus = document.getElementById("login-status");
const viewNav = document.getElementById("view-nav");
const pageTitle = document.getElementById("page-title");
const blockModal = document.getElementById("block-modal");
const eventModal = document.getElementById("event-modal");

const VIEWS = ["overview", "calendar", "day", "timeline", "tables", "events"];
const STAFF_DAY_START = 8 * 60;
const STAFF_DAY_END = 21 * 60;
const BANK = {
  bank: "BCA",
  accountName: "Tiny Healthy Cafe",
  accountNumber: "",
};
const PAYMENT_METHODS = ["Permata EDC", "Permata QRIS", "Bank Transfer", "Cash"];
let invoiceSelectedTables = new Set();

const state = {
  rows: [],
  view: "overview",
  lastView: "overview",
  selectedDate: todayIso(),
  dateMode: "all",
  calendarMonth: todayIso().slice(0, 7),
  filters: { type: "all", status: "all" },
  overviewStatus: "all",
  tableMinutes: 14 * 60,
  editingEventId: null,
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

function formatShortDate(iso) {
  if (!iso) return "No date";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
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

function eventType(row) {
  if (row?.synthetic || row?.source === "event") return "event";
  if (row?.source === "reservation") return "reservation";
  return "birthday";
}

function occupyKind(row) {
  if (eventType(row) === "birthday") return "birthday";
  if (eventType(row) === "event") return "event";
  return "reservation";
}

function sourceLabel(source) {
  if (source === "party_builder") return "Party";
  if (source === "cake") return "Cake";
  if (source === "pdf_quote") return "PDF";
  if (source === "reservation") return "Reservation";
  if (source === "event") return "Event";
  return source || "—";
}

function typeLabel(type) {
  if (type === "reservation") return "Reservation";
  if (type === "event") return "Event";
  return "Birthday";
}

function displayName(row) {
  if (row?.synthetic) return row.contact_name || "Cooking class";
  if (eventType(row) === "birthday") return row.child_name || row.contact_name || "Guest";
  return row.contact_name || row.payload?.reservation?.name || row.payload?.event?.name || row.child_name || "Guest";
}

function displayGuests(row) {
  const eventGuests = row.payload?.event?.guests;
  if (Array.isArray(eventGuests) && eventGuests.length) {
    const pax = eventGuests.reduce((sum, guest) => sum + (Number(guest.pax) || 0), 0);
    return `${eventGuests.length} name${eventGuests.length === 1 ? "" : "s"} · ${pax} pax`;
  }
  const kids = row.guest_kids ? `${row.guest_kids} kids` : "";
  const adults = row.guest_adults ? `${row.guest_adults} adults` : "";
  const joined = [kids, adults].filter(Boolean).join(" · ");
  if (joined) return joined;
  const pax = row.payload?.reservation?.guests;
  return pax ? `${pax} pax` : "—";
}

function tableText(row) {
  if (row.payload?.event?.location === "masterclass") return "Masterclass";
  if (row.payload?.event?.fullTerrace) return "Full terrace";
  return row.payload?.reservation?.tableLabel || row.package_name || "Table TBC";
}

function visualKind(row) {
  if (row?.synthetic) return "cooking";
  return eventType(row);
}

function visualClass(row) {
  const kind = visualKind(row);
  if (row?.synthetic) return `is-${kind} is-confirmed`;
  if (row.status === "cancelled" || row.status === "rejected") return `is-${kind} is-cancelled`;
  if (row.status === "booked" || row.status === "closed") return `is-${kind} is-confirmed`;
  return `is-${kind} is-pending`;
}

function displaySubtitle(row) {
  if (eventType(row) === "reservation" || eventType(row) === "event") return tableText(row);
  const pkg = row.package_name || (row.source === "cake" ? "Cake only" : "Package TBC");
  const total = row.quote_total_idr ? ` · ${formatIdr(row.quote_total_idr)}` : "";
  return `${sourceLabel(row.source)} · ${pkg}${total}`;
}

function reservationStatusLabel(status) {
  if (status === "booked") return "Confirmed";
  if (status === "new") return "New booking";
  if (status === "contacted") return "Contacted";
  if (status === "quoted") return "Quoted";
  if (status === "cancelled") return "Cancelled";
  if (status === "rejected") return "Rejected";
  if (status === "closed") return "Finished";
  return status || "—";
}

function statusLabel(status) {
  return reservationStatusLabel(status);
}

function statusClass(status) {
  if (status === "booked") return "booked";
  if (status === "cancelled") return "cancelled";
  if (status === "rejected") return "rejected";
  if (status === "closed") return "closed";
  if (status === "contacted") return "contacted";
  if (status === "quoted") return "quoted";
  return "new";
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

function slotRange(row) {
  const Map = window.TinyReserveMap;
  const time = timeLabel(row.party_time);
  const endTime = row.payload?.reservation?.endTime;
  if (endTime) return `${time}–${timeLabel(endTime)}`;
  return Map?.occupyLabel?.(time, occupyKind(row)) || time;
}

function dineRange(row) {
  const time = timeLabel(row.party_time);
  if (occupyKind(row) !== "reservation") return slotRange(row);
  return window.TinyReserveMap?.timeRangeLabel?.(time) || time;
}

function arriveBy(row) {
  return window.TinyReserveMap?.graceLabel?.(timeLabel(row.party_time)) || timeLabel(row.party_time);
}

function rowOccupy(row) {
  const Map = window.TinyReserveMap;
  const time = timeLabel(row.party_time);
  return Map?.occupyRange?.(time, occupyKind(row), row.payload?.reservation?.endTime) || null;
}

function isNoShowExpired(row) {
  if (row.source !== "reservation") return false;
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
  const expired = state.rows.filter(isNoShowExpired);
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

function cookingRow(iso) {
  const item = window.TinyReserveMap?.cookingClassItem?.(iso);
  if (!item) return null;
  return {
    id: item.id,
    source: "event",
    status: "booked",
    public_code: "CLASS",
    contact_name: "Cooking class",
    party_date: iso,
    party_time: "14:00",
    package_name: "Tables 18 & 19",
    payload: {
      event: { name: "Cooking class", recurring: true },
      reservation: {
        tableIds: item.tableIds,
        endTime: "17:00",
        tableLabel: "Terrace tables 18 & 19",
        area: "terrace",
      },
    },
    synthetic: true,
  };
}

function matchesType(row) {
  return state.filters.type === "all" || eventType(row) === state.filters.type;
}

function matchesStatus(row) {
  if (state.filters.status === "all") return true;
  if (state.filters.status === "pending") return PENDING_STATUSES.includes(row.status);
  return row.status === state.filters.status;
}

function matchesOverviewStatus(row) {
  if (state.overviewStatus === "all") return true;
  if (state.overviewStatus === "pending") return PENDING_STATUSES.includes(row.status);
  return row.status === state.overviewStatus;
}

function matchesFilters(row) {
  return matchesType(row) && matchesStatus(row);
}

function shiftIso(iso, days) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function isoWeekday(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function weekdayName(iso) {
  return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][isoWeekday(iso)] || "";
}

function monthlyNth(iso) {
  const day = Number(String(iso).slice(8, 10));
  const nth = Math.ceil(day / 7);
  const [y, m] = String(iso).split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { nth, isLast: day + 7 > last, ordinal: nth === 1 ? "first" : nth === 2 ? "second" : nth === 3 ? "third" : nth === 4 ? "fourth" : "fifth" };
}

function eventRepeat(row) {
  return row?.payload?.event?.repeat || { freq: "none" };
}

function occursOn(row, iso) {
  if (!row?.party_date || !iso) return false;
  if (row.party_date === iso) return true;
  const repeat = eventRepeat(row);
  const freq = repeat.freq || "none";
  if (freq === "none") return false;
  if (iso < row.party_date) return false;
  if (repeat.until && iso > repeat.until) return false;
  const start = Date.parse(`${row.party_date}T00:00:00Z`);
  const target = Date.parse(`${iso}T00:00:00Z`);
  const days = Math.round((target - start) / 86400000);
  if (days < 0) return false;
  if (freq === "daily") return days % (repeat.interval || 1) === 0;
  if (freq === "weekly") return isoWeekday(iso) === isoWeekday(row.party_date) && days % (7 * (repeat.interval || 1)) === 0;
  if (freq === "monthly") {
    const a = monthlyNth(row.party_date);
    const b = monthlyNth(iso);
    return isoWeekday(iso) === isoWeekday(row.party_date) && (a.isLast ? b.isLast : a.nth === b.nth);
  }
  return false;
}

function instanceOnDate(row, iso) {
  if (row.party_date === iso) return row;
  return { ...row, party_date: iso, occurrenceOf: row.id };
}

function filteredRows() {
  return state.rows.filter(matchesFilters);
}

function rowsOnDate(iso) {
  const rows = filteredRows()
    .filter((row) => occursOn(row, iso))
    .map((row) => instanceOnDate(row, iso));
  const cooking = cookingRow(iso);
  if (cooking && matchesFilters(cooking) && !rows.some((row) => row.synthetic)) rows.push(cooking);
  return rows;
}

function overviewDated(pred) {
  const today = todayIso();
  return state.rows
    .filter(pred)
    .filter((row) => {
      if (!row.party_date) return false;
      if (state.dateMode === "upcoming") return row.party_date >= today;
      if (state.dateMode === "day") return row.party_date === state.selectedDate;
      return true;
    })
    .slice()
    .sort((a, b) => {
      const byDate = String(a.party_date).localeCompare(String(b.party_date));
      if (byDate) return byDate;
      return timeLabel(a.party_time).localeCompare(timeLabel(b.party_time));
    });
}

function overviewUndated(pred) {
  return state.rows.filter(pred).filter((row) => !row.party_date);
}

function overviewRows() {
  return overviewDated((row) => matchesType(row) && matchesOverviewStatus(row));
}

function undatedRows() {
  return overviewUndated((row) => matchesType(row) && matchesOverviewStatus(row));
}

function parseHash() {
  const hash = (location.hash || "").replace(/^#\/?/, "");
  const request = hash.match(/^request\/([0-9a-f-]{36})/i);
  if (request) return { view: "detail", id: request[1] };
  const invoice = hash.match(/^invoice\/([0-9a-f-]{36})/i);
  if (invoice) return { view: "invoice", id: invoice[1] };
  const payment = hash.match(/^payment\/([0-9a-f-]{36})/i);
  if (payment) return { view: "payment", id: payment[1] };
  const cooking = hash.match(/^cooking\/(\d{4}-\d{2}-\d{2})/);
  if (cooking) return { view: "cooking", date: cooking[1] };
  const day = hash.match(/^day\/(\d{4}-\d{2}-\d{2})/);
  if (day) return { view: "day", date: day[1] };
  const parts = hash.split("/").filter(Boolean);
  if (parts[0] === "reservations" || parts[0] === "birthdays") {
    const view = VIEWS.includes(parts[1]) ? parts[1] : "overview";
    return { view };
  }
  const view = VIEWS.includes(parts[0]) ? parts[0] : "overview";
  return { view };
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
  if (show) renderCalendarNote();
}

function renderCalendarNote() {
  const note = document.getElementById("calendar-sync-note");
  if (!note) return;
  const url = cfg.googleCalendarUrl || "";
  note.innerHTML = url
    ? `Confirmed bookings sync to the Tiny Google Calendar. <a href="${escapeHtml(
        url
      )}" target="_blank" rel="noopener">Open Tiny calendar</a>`
    : "Confirmed bookings sync to the Tiny Google Calendar once it is connected.";
}

function countBy(rows, pred) {
  return rows.filter(pred).length;
}

async function loadRows() {
  const { data, error } = await supabase
    .from("requests")
    .select(REQUEST_SELECT)
    .order("party_date", { ascending: true })
    .limit(800);
  if (error) throw error;
  state.rows = data || [];
  await expireNoShows();
}

function renderNav(view) {
  if (viewNav) {
    viewNav.hidden = view === "detail" || view === "cooking" || view === "invoice" || view === "payment";
    viewNav.querySelectorAll("a").forEach((link) => {
      const target = link.dataset.view === "calendar" ? "calendar" : link.dataset.view;
      link.href = `#/${target}`;
      link.classList.toggle("is-active", link.dataset.view === (view === "day" ? "calendar" : view));
    });
  }
  if (pageTitle && !["detail", "cooking", "invoice", "payment"].includes(view)) {
    pageTitle.textContent = view === "events" ? "Events" : "Inbox";
  }
}

function syncFilterInputs() {
  const dateInput = document.getElementById("inbox-date");
  const dateWrap = document.getElementById("inbox-date-wrap");
  const modeInput = document.getElementById("filter-date-mode");
  const modeWrap = document.getElementById("filter-date-mode-wrap");
  const typeInput = document.getElementById("filter-type");
  const statusInput = document.getElementById("filter-status");
  const label = document.getElementById("selected-date-label");
  const onOverview = state.view === "overview";
  const onCalendar = state.view === "calendar";
  if (modeWrap) modeWrap.hidden = !onOverview;
  if (modeInput) modeInput.value = state.dateMode;
  if (dateWrap) dateWrap.hidden = onCalendar || (onOverview && state.dateMode !== "day");
  if (dateInput) dateInput.value = state.selectedDate;
  if (typeInput) typeInput.value = state.filters.type;
  if (statusInput) statusInput.value = onOverview ? state.overviewStatus : state.filters.status;
  if (label) {
    if (onCalendar) label.textContent = "Calendar";
    else if (onOverview && state.dateMode === "all") label.textContent = "All requests";
    else if (onOverview && state.dateMode === "upcoming") label.textContent = `From ${formatLongDate(todayIso())}`;
    else label.textContent = formatLongDate(state.selectedDate);
  }
}

function bookingCard(row, opts = {}) {
  const dateLine = opts.showDate
    ? `<div class="muted">${escapeHtml(row.party_date ? formatShortDate(row.party_date) : "No date")}</div>`
    : "";
  return `<button class="booking-card" type="button" data-open="${escapeHtml(row.synthetic ? `cooking/${row.party_date}` : `request/${row.id}`)}">
    <div>
      <div class="code">${escapeHtml(row.public_code)}</div>
      <h3>${escapeHtml(displayName(row))}</h3>
      <div class="muted">${escapeHtml(row.phone || row.email || typeLabel(eventType(row)))}</div>
    </div>
    <div>
      <span class="badge badge--${statusClass(row.status)}">${escapeHtml(statusLabel(row.status))}</span>
      <div class="muted">${escapeHtml(typeLabel(eventType(row)))} · ${escapeHtml(displaySubtitle(row))}</div>
    </div>
    <div class="time">${escapeHtml(slotRange(row))}
      ${dateLine}
      <div class="muted">${escapeHtml(displayGuests(row))}</div>
    </div>
  </button>`;
}

function renderOverview() {
  syncFilterInputs();
  const dated = overviewRows();
  const showDate = state.dateMode !== "day";
  const undated = undatedRows();
  const visible = dated.concat(undated);
  const statPool = overviewDated(matchesType).concat(overviewUndated(matchesType));
  const selectedFilter = state.overviewStatus;
  const stats = [
    ["booked", "booked", "Confirmed", countBy(statPool, (r) => r.status === "booked")],
    ["new", "pending", "New booking", countBy(statPool, (r) => PENDING_STATUSES.includes(r.status))],
    ["cancelled", "cancelled", "Cancelled", countBy(statPool, (r) => r.status === "cancelled")],
    ["rejected", "rejected", "Rejected", countBy(statPool, (r) => r.status === "rejected")],
    ["closed", "closed", "Finished", countBy(statPool, (r) => r.status === "closed")],
    ["total", "all", "Total", statPool.length],
  ];
  document.getElementById("stat-grid").innerHTML = stats
    .map(([key, filter, labelText, count]) => {
      const selected = selectedFilter === filter;
      return `<button class="stat-card is-${key}${selected ? " is-selected" : ""}" type="button" data-status-filter="${filter}" aria-pressed="${selected}">
        <strong>${count}</strong><span>${labelText}</span>
      </button>`;
    })
    .join("");
  const list = document.getElementById("booking-list");
  const emptyText =
    state.dateMode === "upcoming"
      ? "No bookings from today onwards."
      : state.dateMode === "all"
        ? "No bookings yet."
        : "No bookings on this date.";
  let body = "";
  if (showDate) {
    const groups = [];
    const seen = new Map();
    dated.forEach((row) => {
      const key = row.party_date || "";
      if (!seen.has(key)) {
        const group = { date: key, rows: [] };
        seen.set(key, group);
        groups.push(group);
      }
      seen.get(key).rows.push(row);
    });
    body = groups
      .map(
        (group) =>
          `<p class="date-label undated-label">${escapeHtml(formatLongDate(group.date))}</p>${group.rows
            .map((row) => bookingCard(row, { showDate: true }))
            .join("")}`
      )
      .join("");
  } else if (dated.length) {
    body = dated
      .slice()
      .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)))
      .map((row) => bookingCard(row))
      .join("");
  }
  list.innerHTML = [
    body || (undated.length ? "" : `<p class="muted">${emptyText}</p>`),
    undated.length
      ? `<p class="date-label undated-label">No date yet</p>${undated.map((row) => bookingCard(row, { showDate })).join("")}`
      : "",
  ].join("");
  const suffix =
    state.dateMode === "upcoming" ? " from today" : state.dateMode === "all" ? "" : "";
  document.getElementById("overview-status").textContent = `${visible.length} booking${
    visible.length === 1 ? "" : "s"
  }${suffix}`;
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

function openTarget(row) {
  if (row.synthetic) return `#/cooking/${row.party_date}`;
  return `#/request/${row.id}`;
}

function renderCalendar() {
  syncFilterInputs();
  const title = document.getElementById("cal-title");
  const [year, month] = state.calendarMonth.split("-").map(Number);
  title.textContent = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  document.getElementById("cal-legend").innerHTML = [
    ["reservation-pending", "Reservation (unconfirmed)"],
    ["reservation", "Reservation"],
    ["birthday-pending", "Birthday (unconfirmed)"],
    ["birthday", "Birthday"],
    ["event", "Event"],
    ["cooking", "Cooking class"],
  ]
    .map(([kind, text]) => `<span><span class="dot dot--${kind}"></span> ${text}</span>`)
    .join("");
  const heads = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    .map((name) => `<div class="cal-cell is-head">${name}</div>`)
    .join("");
  const cells = monthCells(state.calendarMonth)
    .map((cell) => {
      const rows = rowsOnDate(cell.iso)
        .slice()
        .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)));
      const classes = [
        "cal-cell",
        cell.muted ? "is-muted" : "",
        cell.iso === todayIso() ? "is-today" : "",
        cell.iso === state.selectedDate ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");
      const shown = rows.slice(0, 3);
      const extra = rows.length - shown.length;
      const events = shown
        .map((row) => {
          return `<button class="cal-event ${visualClass(row)}" type="button" data-open="${escapeHtml(openTarget(row).slice(2))}">${escapeHtml(
            `${timeLabel(row.party_time)} ${displayName(row)}`
          )}</button>`;
        })
        .join("");
      return `<div class="${classes}" data-date="${cell.iso}">
        <button class="cal-daynum" type="button" data-open="day/${cell.iso}">${cell.day}</button>
        <div class="cal-events">${events}${
          extra > 0 ? `<button class="cal-more" type="button" data-open="day/${cell.iso}">+${extra} more</button>` : ""
        }</div>
      </div>`;
    })
    .join("");
  document.getElementById("cal-grid").innerHTML = heads + cells;
}

function hourMarks() {
  const dayStart = STAFF_DAY_START;
  const dayEnd = STAFF_DAY_END;
  const slots = [];
  for (let minutes = dayStart; minutes <= dayEnd; minutes += 60) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    slots.push({
      minutes,
      label: `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
    });
  }
  return { dayStart, dayEnd, span: dayEnd - dayStart, slots };
}

function clampOccupy(range, dayStart, span) {
  const start = Math.max(range.start ?? dayStart, dayStart);
  const end = Math.max(start + 15, Math.min(range.end ?? start + 60, dayStart + span));
  const pct = (value) => ((value - dayStart) / span) * 100;
  return {
    start,
    end,
    left: pct(start),
    width: Math.max(2, pct(end) - pct(start)),
    top: pct(start),
    height: Math.max(4, pct(end) - pct(start)),
  };
}

function fillDayBoard(board, countNode, titleNode) {
  if (!board) return;
  if (titleNode) titleNode.textContent = formatLongDate(state.selectedDate);
  const rows = rowsOnDate(state.selectedDate)
    .slice()
    .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)));
  if (countNode) {
    countNode.textContent = `${rows.length} event${rows.length === 1 ? "" : "s"}`;
  }
  const { dayStart, span, slots } = hourMarks();
  const height = Math.max(640, span * 1.2);
  const items = rows
    .map((row) => {
      const box = clampOccupy(rowOccupy(row) || { start: dayStart, end: dayStart + 60 }, dayStart, span);
      return `<button class="day-item ${visualClass(row)}" type="button" data-open="${escapeHtml(openTarget(row).slice(2))}" style="top:${box.top}%;height:${box.height}%">
        <strong>${escapeHtml(slotRange(row))}</strong><br>${escapeHtml(displayName(row))} · ${escapeHtml(displaySubtitle(row))}
      </button>`;
    })
    .join("");
  board.innerHTML = `
    <div class="day-hours" style="height:${height}px">
      <div>${slots
        .map((slot) => `<div class="day-hour" style="height:${height / slots.length}px">${slot.label}</div>`)
        .join("")}</div>
      <div class="day-track" style="height:${height}px">${
        items || `<p class="muted" style="padding:16px">No events on this day.</p>`
      }</div>
    </div>
  `;
}

function renderDay() {
  syncFilterInputs();
  fillDayBoard(
    document.getElementById("day-board"),
    document.getElementById("day-count"),
    document.getElementById("day-title")
  );
}

function renderTimeline() {
  syncFilterInputs();
  fillDayBoard(
    document.getElementById("timeline"),
    document.getElementById("timeline-count"),
    document.getElementById("timeline-title")
  );
}

function occupiedAtTime(iso, minutes) {
  return rowsOnDate(iso).filter((row) => {
    const range = rowOccupy(row);
    if (!range) return false;
    return minutes >= range.start && minutes < range.end;
  });
}

function renderTables() {
  syncFilterInputs();
  const slider = document.getElementById("tables-slider");
  if (slider && !slider.dataset.ready) {
    slider.value = String(state.tableMinutes);
    slider.dataset.ready = "1";
  }
  if (slider) state.tableMinutes = Number(slider.value) || state.tableMinutes;
  const timeText = minutesToTime(state.tableMinutes);
  const label = document.getElementById("tables-time-label");
  if (label) label.textContent = timeText;
  const active = occupiedAtTime(state.selectedDate, state.tableMinutes);
  const held = new Set();
  const byTable = new Map();
  active.forEach((row) => {
    (row.payload?.reservation?.tableIds || []).forEach((id) => {
      held.add(id);
      if (!byTable.has(id)) byTable.set(id, row);
    });
  });
  document.getElementById("tables-count").textContent = `${active.length} booking${
    active.length === 1 ? "" : "s"
  } at ${timeText} · drag the time to see booked and blocked tables`;
  const floor = document.getElementById("tables-floor");
  floor.innerHTML = `<section><h3>Indoor</h3><div class="staff-plan" id="tables-indoor"></div></section>
    <section><h3>Terrace</h3><div class="staff-plan" id="tables-terrace"></div></section>`;
  const Map = window.TinyReserveMap;
  const pick = (tableId) => {
    const row = byTable.get(tableId);
    if (row) {
      go(openTarget(row).slice(2));
      return;
    }
    const end = minutesToTime(Math.min(STAFF_DAY_END, state.tableMinutes + 120));
    openBlockModal({ tableIds: [tableId], start: timeText, end, date: state.selectedDate });
  };
  Map?.renderMap?.(document.getElementById("tables-indoor"), {
    area: "indoor",
    selected: [],
    held: [...held],
    guests: 1,
    interactive: true,
    base: "../reserve/img/",
    onPick: pick,
  });
  Map?.renderMap?.(document.getElementById("tables-terrace"), {
    area: "terrace",
    selected: [],
    held: [...held],
    guests: 1,
    interactive: true,
    base: "../reserve/img/",
    onPick: pick,
  });
}

function fillBlockTableList(selected = []) {
  const host = document.getElementById("block-table-list");
  const Map = window.TinyReserveMap;
  const picked = new Set(selected);
  host.innerHTML = (Map?.TABLES || [])
    .map(
      (table) =>
        `<label><input type="checkbox" name="block-table" value="${escapeHtml(table.id)}"${
          picked.has(table.id) ? " checked" : ""
        }> ${table.area === "indoor" ? "Indoor" : "Terrace"} ${table.number}</label>`
    )
    .join("");
}

function openBlockModal(opts = {}) {
  document.getElementById("block-name").value = opts.name || "Event block";
  document.getElementById("block-date").value = opts.date || state.selectedDate;
  document.getElementById("block-start").value = opts.start || "14:00";
  document.getElementById("block-end").value = opts.end || "17:00";
  document.getElementById("block-status").textContent = "";
  fillBlockTableList(opts.tableIds || []);
  blockModal.hidden = false;
}

function closeBlockModal() {
  blockModal.hidden = true;
}

function guestRowHtml(guest = {}) {
  return `<div class="guest-row">
    <input type="text" name="guest-name" placeholder="Name" value="${escapeHtml(guest.name || "")}">
    <input type="number" name="guest-pax" min="1" placeholder="PAX" value="${escapeHtml(guest.pax || 1)}">
    <input type="tel" name="guest-phone" placeholder="Phone" value="${escapeHtml(guest.phone || "")}">
    <input type="email" name="guest-email" placeholder="Email" value="${escapeHtml(guest.email || "")}">
    <input type="text" name="guest-notes" placeholder="Notes" value="${escapeHtml(guest.notes || "")}">
    <button class="btn btn--outline" type="button" data-remove-guest>Remove</button>
  </div>`;
}

function readGuestList() {
  return [...document.querySelectorAll("#event-guests .guest-row")]
    .map((row) => ({
      name: row.querySelector('[name="guest-name"]')?.value.trim() || "",
      pax: Number(row.querySelector('[name="guest-pax"]')?.value) || 1,
      phone: row.querySelector('[name="guest-phone"]')?.value.trim() || "",
      email: row.querySelector('[name="guest-email"]')?.value.trim() || "",
      notes: row.querySelector('[name="guest-notes"]')?.value.trim() || "",
    }))
    .filter((guest) => guest.name || guest.phone || guest.email);
}

function fillEventTableList(selected = []) {
  const host = document.getElementById("event-table-list");
  if (!host) return;
  const Map = window.TinyReserveMap;
  const picked = new Set(selected);
  host.innerHTML = (Map?.TABLES || [])
    .map(
      (table) =>
        `<label><input type="checkbox" name="event-table" value="${escapeHtml(table.id)}"${
          picked.has(table.id) ? " checked" : ""
        }> ${table.area === "indoor" ? "Indoor" : "Terrace"} ${table.number}</label>`
    )
    .join("");
}

function syncEventLocationFields() {
  const location = document.getElementById("event-location")?.value || "service";
  const service = document.getElementById("event-service-fields");
  if (service) service.hidden = location !== "service";
}

function applyFullTerrace() {
  const full = document.getElementById("event-full-terrace")?.checked;
  if (!full) return;
  const terrace = new Set(window.TinyReserveMap?.terraceTableIds?.() || []);
  document.querySelectorAll('input[name="event-table"]').forEach((input) => {
    input.checked = terrace.has(input.value);
  });
}

function repeatHint(freq, date) {
  if (!date || freq === "none") return "";
  const day = weekdayName(date);
  const nth = monthlyNth(date);
  if (freq === "daily") return "Every day";
  if (freq === "weekly") return `Weekly on ${day}`;
  if (freq === "monthly") return nth.isLast ? `Monthly on the last ${day}` : `Monthly on the ${nth.ordinal} ${day}`;
  return "";
}

function syncEventRepeatFields() {
  const freq = document.getElementById("event-repeat")?.value || "none";
  const date = document.getElementById("event-date")?.value || state.selectedDate;
  const wrap = document.getElementById("event-until-wrap");
  const hint = document.getElementById("event-repeat-hint");
  if (wrap) wrap.hidden = freq === "none";
  if (hint) hint.textContent = repeatHint(freq, date);
  const weekly = document.querySelector('#event-repeat option[value="weekly"]');
  const monthly = document.querySelector('#event-repeat option[value="monthly"]');
  if (weekly) weekly.textContent = date ? `Weekly on ${weekdayName(date)}` : "Weekly";
  if (monthly) {
    const nth = date ? monthlyNth(date) : null;
    monthly.textContent = nth
      ? nth.isLast
        ? `Monthly on the last ${weekdayName(date)}`
        : `Monthly on the ${nth.ordinal} ${weekdayName(date)}`
      : "Monthly";
  }
}

function openEventModal(opts = {}) {
  state.editingEventId = opts.id || null;
  document.getElementById("event-modal-title").textContent = opts.id ? "Edit event" : "Add event";
  document.getElementById("event-name").value = opts.name || "";
  document.getElementById("event-date").value = opts.date || state.selectedDate;
  document.getElementById("event-start").value = opts.start || "14:00";
  document.getElementById("event-end").value = opts.end || "17:00";
  document.getElementById("event-location").value = opts.location || "service";
  document.getElementById("event-full-terrace").checked = Boolean(opts.fullTerrace);
  document.getElementById("event-notes").value = opts.notes || "";
  document.getElementById("event-photos").value = "";
  document.getElementById("event-repeat").value = opts.repeat?.freq || "none";
  document.getElementById("event-until").value = opts.repeat?.until || "";
  const payment = opts.payment === "vendor" ? "vendor" : "tiny";
  document.querySelectorAll('input[name="event-payment"]').forEach((input) => {
    input.checked = input.value === payment;
  });
  fillEventTableList(opts.tableIds || []);
  document.getElementById("event-guests").innerHTML = (opts.guests?.length ? opts.guests : [{}]).map(guestRowHtml).join("");
  document.getElementById("event-status").textContent = "";
  document.getElementById("event-status").className = "status";
  syncEventLocationFields();
  syncEventRepeatFields();
  if (opts.fullTerrace) applyFullTerrace();
  eventModal.hidden = false;
}

function closeEventModal() {
  eventModal.hidden = true;
  state.editingEventId = null;
}

function renderEvents() {
  syncFilterInputs();
  const rows = state.rows
    .filter((row) => row.source === "event")
    .filter(matchesStatus)
    .filter((row) => row.party_date === state.selectedDate)
    .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)));
  document.getElementById("events-count").textContent = `${rows.length} event${
    rows.length === 1 ? "" : "s"
  } on this date`;
  const list = document.getElementById("events-list");
  list.innerHTML = rows.length
    ? rows.map((row) => bookingCard(row)).join("")
    : `<p class="muted">No events on this date. Add one to block tables, keep a guest list, and push it to Google Calendar.</p>`;
}

async function uploadEventPhotos(requestId, fileList) {
  const files = [...(fileList || [])];
  const paths = [];
  for (const file of files) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `${requestId}/event/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("request-files").upload(path, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    paths.push(path);
  }
  return paths;
}

async function saveStaffEvent() {
  const statusEl = document.getElementById("event-status");
  const name = document.getElementById("event-name")?.value.trim() || "";
  const date = document.getElementById("event-date")?.value;
  const start = document.getElementById("event-start")?.value;
  const end = document.getElementById("event-end")?.value;
  const location = document.getElementById("event-location")?.value || "service";
  const fullTerrace = Boolean(document.getElementById("event-full-terrace")?.checked);
  const notes = document.getElementById("event-notes")?.value.trim() || "";
  const payment = document.querySelector('input[name="event-payment"]:checked')?.value || "tiny";
  const photos = document.getElementById("event-photos")?.files;
  const guests = readGuestList();
  const freq = document.getElementById("event-repeat")?.value || "none";
  const until = document.getElementById("event-until")?.value || "";
  const Map = window.TinyReserveMap;
  let tableIds = [...document.querySelectorAll('input[name="event-table"]:checked')].map((input) => input.value);
  if (location === "masterclass") tableIds = [];
  else if (fullTerrace) tableIds = Map?.terraceTableIds?.() || tableIds;
  if (!name || !date || !start || !end) {
    statusEl.textContent = "Name, date, and time are required.";
    statusEl.className = "status is-error";
    return;
  }
  if (location === "service" && !tableIds.length) {
    statusEl.textContent = "Pick tables to block, or choose full terrace.";
    statusEl.className = "status is-error";
    return;
  }
  const tables = tableIds.map((id) => Map.findTable(id)).filter(Boolean);
  const tableLabel =
    location === "masterclass" ? "Masterclass" : fullTerrace ? "Full terrace" : Map.tableLabel(tables);
  const pax = guests.reduce((sum, guest) => sum + (Number(guest.pax) || 0), 0) || null;
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  const repeat = freq === "none" ? { freq: "none" } : { freq, until: until || shiftIso(date, 365) };
  const payload = {
    event: {
      name,
      notes,
      location,
      fullTerrace: location === "service" && fullTerrace,
      payment,
      guests,
      repeat,
    },
    reservation: {
      name,
      tableIds,
      tableNumbers: tables.map((table) => table.number),
      tableLabel,
      area: location === "masterclass" ? "masterclass" : tables[0]?.area || "terrace",
      endTime: end,
      notes,
    },
  };
  statusEl.textContent = "Saving event…";
  statusEl.className = "status";
  let requestId = state.editingEventId;
  if (requestId) {
    const { error } = await supabase
      .from("requests")
      .update({
        contact_name: name,
        party_date: date,
        party_time: start,
        package_name: tableLabel,
        guest_adults: pax,
        email: guests.find((guest) => guest.email)?.email || user?.email || "events@tinyhealthycafe.com",
        phone: guests.find((guest) => guest.phone)?.phone || null,
        payload,
      })
      .eq("id", requestId)
      .eq("source", "event");
    if (error) {
      statusEl.textContent = error.message;
      statusEl.className = "status is-error";
      return;
    }
  } else {
    const code = `EVT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data, error } = await supabase
      .from("requests")
      .insert({
        source: "event",
        status: "booked",
        public_code: code,
        email: guests.find((guest) => guest.email)?.email || user?.email || "events@tinyhealthycafe.com",
        phone: guests.find((guest) => guest.phone)?.phone || null,
        contact_name: name,
        party_date: date,
        party_time: start,
        package_name: tableLabel,
        guest_adults: pax,
        payload,
      })
      .select("id")
      .single();
    if (error || !data?.id) {
      statusEl.textContent = error?.message || "Could not save event.";
      statusEl.className = "status is-error";
      return;
    }
    requestId = data.id;
  }
  try {
    const uploaded = await uploadEventPhotos(requestId, photos);
    if (uploaded.length) {
      const { data: current } = await supabase.from("requests").select("files").eq("id", requestId).maybeSingle();
      const files = { ...(current?.files || {}) };
      files.eventPhotos = [...(files.eventPhotos || []), ...uploaded];
      const { error: fileError } = await supabase.from("requests").update({ files }).eq("id", requestId);
      if (fileError) throw fileError;
    }
  } catch (err) {
    statusEl.textContent = `Event saved, but files did not upload: ${err.message || err}`;
    statusEl.className = "status is-error";
    return;
  }
  const stayOnDetail = Boolean(state.editingEventId);
  closeEventModal();
  state.selectedDate = date;
  await loadRows();
  if (stayOnDetail) {
    if ((location.hash || "").includes(requestId)) await loadDetail(requestId);
    else location.hash = `#/request/${requestId}`;
  } else showInbox("events");
}

function minutesToTime(minutes) {
  const wrapped = Math.max(0, Math.round(Number(minutes) || 0));
  const hour = Math.floor(wrapped / 60);
  const min = wrapped % 60;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function guestNameFor(row) {
  return row.contact_name || row.payload?.reservation?.name || row.child_name || "there";
}

function feedbackMessage(row) {
  const kind = eventType(row) === "reservation" ? "reservation" : "Birthday";
  return `Hello ${guestNameFor(row)}, I would like to follow up and check how your ${kind} was?`;
}

function feedbackUrl(row) {
  const phone = String(row.phone || "").replace(/\D/g, "");
  const text = encodeURIComponent(feedbackMessage(row));
  if (phone) return `https://wa.me/${phone}?text=${text}`;
  if (row.email) return `mailto:${row.email}?subject=${encodeURIComponent("Tiny follow-up")}&body=${text}`;
  return "";
}

function quoteLineValue(line) {
  if (line?.note) return 0;
  const qty = Number(line.qty) || 1;
  const price = Number(line.price ?? line.value) || 0;
  return qty * price;
}

function quoteTotalsFromLines(lines) {
  const subtotal = lines.reduce((sum, line) => sum + quoteLineValue(line), 0);
  const service = Math.round(subtotal * 0.05);
  const tax = Math.round((subtotal + service) * 0.1);
  const total = subtotal + service + tax;
  return { subtotal, service, tax, total, dp30: Math.round(total * 0.3) };
}

function quoteLineHtml(line = {}) {
  const qty = Number(line.qty) || 1;
  const price = Number(line.price ?? line.value) || 0;
  return `<div class="quote-line">
    <input type="text" name="quote-label" value="${escapeHtml(line.label || "")}" placeholder="Item">
    <input type="number" name="quote-qty" min="1" step="1" value="${qty}" aria-label="Qty">
    <input type="number" name="quote-price" min="0" step="1000" value="${price}" aria-label="Unit price">
    <span class="quote-line-total">${escapeHtml(formatIdr(qty * price))}</span>
    <button class="btn btn--outline" type="button" data-remove-line>Remove</button>
  </div>`;
}

function readQuoteEditor() {
  const lines = [...document.querySelectorAll("#quote-editor .quote-line")]
    .map((row) => {
      const qty = Number(row.querySelector('[name="quote-qty"]')?.value) || 1;
      const price = Number(row.querySelector('[name="quote-price"]')?.value) || 0;
      return {
        label: row.querySelector('[name="quote-label"]')?.value.trim() || "",
        qty,
        price,
        value: qty * price,
        note: false,
        detail: row.querySelector('[name="quote-detail"]')?.value.trim() || "",
      };
    })
    .filter((line) => line.label || line.value);
  const totals = quoteTotalsFromLines(lines);
  const bank = {
    bank: document.getElementById("invoice-bank")?.value.trim() || BANK.bank,
    accountName: document.getElementById("invoice-account-name")?.value.trim() || BANK.accountName,
    accountNumber: document.getElementById("invoice-account-number")?.value.trim() || BANK.accountNumber,
  };
  return { lines, ...totals, currency: "IDR", bank };
}

function refreshQuoteTotals() {
  document.querySelectorAll("#quote-editor .quote-line").forEach((row) => {
    const qty = Number(row.querySelector('[name="quote-qty"]')?.value) || 1;
    const price = Number(row.querySelector('[name="quote-price"]')?.value) || 0;
    const total = row.querySelector(".quote-line-total");
    if (total) total.textContent = formatIdr(qty * price);
  });
  const totals = quoteTotalsFromLines(readQuoteEditor().lines);
  const host = document.getElementById("quote-totals");
  if (!host) return;
  host.innerHTML = `<ul class="kv">
    <li><span>Subtotal</span><span>${escapeHtml(formatIdr(totals.subtotal))}</span></li>
    <li><span>Service 5%</span><span>${escapeHtml(formatIdr(totals.service))}</span></li>
    <li><span>Tax 10%</span><span>${escapeHtml(formatIdr(totals.tax))}</span></li>
    <li class="is-total"><span>Total</span><span>${escapeHtml(formatIdr(totals.total))}</span></li>
    <li><span>DP 30%</span><span>${escapeHtml(formatIdr(totals.dp30))}</span></li>
  </ul>`;
}

function paymentSummary(payment) {
  const deposit = payment?.deposit || {};
  const balance = payment?.balance || {};
  if (deposit.status === "paid" && balance.status === "paid") return "Paid in full";
  const d = deposit.status === "paid" ? `DP paid${deposit.method ? ` · ${deposit.method}` : ""}` : "DP unpaid";
  const b = balance.status === "paid" ? `Balance paid${balance.method ? ` · ${balance.method}` : ""}` : "Balance unpaid";
  return `${d} · ${b}`;
}

function methodOptions(selected) {
  return [`<option value="">Select method</option>`]
    .concat(PAYMENT_METHODS.map((method) => `<option value="${escapeHtml(method)}"${method === selected ? " selected" : ""}>${escapeHtml(method)}</option>`))
    .join("");
}

function paymentAmounts(row, quoteOverride) {
  const quote = quoteOverride || row.payload?.quote || {};
  const total = quote.total ?? row.quote_total_idr ?? 0;
  const dp = quote.dp30 ?? row.quote_dp_idr ?? Math.round(total * 0.3);
  const rest = Math.max(0, total - dp);
  return { total, dp, rest };
}

function paymentFieldsHtml(id, title, amount, part = {}) {
  return `<section class="payment-card">
    <h3>${escapeHtml(title)}</h3>
    <p>${escapeHtml(formatIdr(amount))}</p>
    <label class="field"><span>Status</span>
      <select id="${id}-status">
        <option value="unpaid"${part.status !== "paid" ? " selected" : ""}>Unpaid</option>
        <option value="paid"${part.status === "paid" ? " selected" : ""}>Paid</option>
      </select>
    </label>
    <label class="field"><span>Method</span>
      <select id="${id}-method">${methodOptions(part.method)}</select>
    </label>
    <label class="field"><span>Paid on</span><input type="date" id="${id}-date" value="${escapeHtml(part.paidOn || "")}"></label>
    <label class="field"><span>Notes</span><textarea id="${id}-notes" rows="2">${escapeHtml(part.notes || "")}</textarea></label>
  </section>`;
}

function readPaymentPart(id, amount) {
  return {
    status: document.getElementById(`${id}-status`)?.value || "unpaid",
    method: document.getElementById(`${id}-method`)?.value || "",
    paidOn: document.getElementById(`${id}-date`)?.value || "",
    notes: document.getElementById(`${id}-notes`)?.value.trim() || "",
    amount,
  };
}

function readPaymentForm(dp, rest) {
  return {
    deposit: readPaymentPart("dp", dp),
    balance: readPaymentPart("bal", rest),
  };
}

function colourRowHtml(colour = {}) {
  return `<div class="colour-row">
    <input type="text" name="balloon-label" value="${escapeHtml(colour.label || "Balloon")}" placeholder="Balloon group">
    <input type="color" name="balloon-hex" value="${escapeHtml(colour.hex || colour.original || "#c5dcc8")}">
    <input type="hidden" name="balloon-id" value="${escapeHtml(colour.id || "")}">
    <input type="hidden" name="balloon-original" value="${escapeHtml(colour.original || colour.hex || "#c5dcc8")}">
    <button class="btn btn--outline" type="button" data-remove-colour>Remove</button>
  </div>`;
}

async function htmlToPdfBlob(element, filename) {
  if (!window.html2pdf) throw new Error("PDF library did not load.");
  const blob = await window.html2pdf().set({
    margin: 12,
    filename,
    image: { type: "jpeg", quality: 0.95 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  }).from(element).outputPdf("blob");
  return blob;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function signedUrl(path) {
  if (!path) return "";
  const { data, error } = await supabase.storage.from("request-files").createSignedUrl(path, 3600);
  if (error) return "";
  return data?.signedUrl || "";
}

function backHash() {
  if (state.lastView === "day") return `#/day/${state.selectedDate}`;
  return `#/${state.lastView || "overview"}`;
}

function renderCookingDetail(iso) {
  inboxViews.hidden = true;
  if (viewNav) viewNav.hidden = true;
  detailView.hidden = false;
  const row = cookingRow(iso);
  pageTitle.textContent = "Cooking class";
  detailView.innerHTML = `
    <button class="btn btn--outline back" type="button" id="back-list">Back</button>
    <article class="detail">
      <header class="staff-top">
        <div>
          <p class="staff-brand">Event</p>
          <h2>Weekly cooking class</h2>
          <p class="muted">${escapeHtml(formatLongDate(iso))} · 14:00–17:00</p>
        </div>
      </header>
      <p>Tables 18 and 19 are unavailable every Saturday from 2pm to 5pm for cooking class. This block is automatic and cannot be deleted.</p>
      <div class="staff-plan" id="staff-detail-plan"></div>
    </article>
  `;
  window.TinyReserveMap?.renderMap?.(document.getElementById("staff-detail-plan"), {
    area: "terrace",
    selected: ["tr-18", "tr-19"],
    held: [],
    guests: 1,
    interactive: false,
    base: "../reserve/img/",
  });
  document.getElementById("back-list")?.addEventListener("click", () => {
    location.hash = backHash();
  });
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
      location.hash = backHash();
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
  const type = eventType(row);
  const isReservation = type === "reservation";
  const isEvent = type === "event";
  const statuses = isEvent ? EVENT_STATUSES : ALL_STATUSES;
  const [pdfUrl, backdropUrl, cakeUrl] = await Promise.all([
    signedUrl(files.quotePdf),
    signedUrl(files.backdropPng),
    signedUrl(files.cakePhoto),
  ]);
  const eventPhotoPaths = files.eventPhotos || [];
  const eventPhotoUrls = await Promise.all(eventPhotoPaths.map((path) => signedUrl(path)));
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
  const tableIds = reservation.tableIds || [];
  const showLayout = tableIds.length > 0;
  const layoutArea = reservation.area || (String(tableIds[0] || "").startsWith("tr-") ? "terrace" : "indoor");

  pageTitle.textContent = displayName(row);
  detailView.innerHTML = `
    <button class="btn btn--outline back" type="button" id="back-list">Back</button>
    <article class="detail">
      <header class="staff-top">
        <div>
          <p class="staff-brand">${escapeHtml(typeLabel(type))} · ${escapeHtml(sourceLabel(row.source))}</p>
          <h2>${escapeHtml(row.public_code)}</h2>
          <p class="muted">Submitted ${escapeHtml(formatWhen(row.created_at))}${
            row.status === "booked" && row.google_event_id
              ? " · Synced to Google Calendar"
              : row.status === "booked"
                ? " · Waiting to sync to Google Calendar"
                : ""
          }</p>
        </div>
        <label class="field" style="margin:0;min-width:160px">
          <span>Status</span>
          <select id="status-select">
            ${statuses
              .map(
                (s) =>
                  `<option value="${s}"${s === row.status ? " selected" : ""}>${statusLabel(s)}</option>`
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
        ${
          type === "birthday"
            ? `<a class="btn" href="#/invoice/${escapeHtml(row.id)}">Invoicing</a>
               <a class="btn btn--outline" href="#/payment/${escapeHtml(row.id)}">Track payment</a>`
            : ""
        }
        ${
          row.status === "closed" && feedbackUrl(row)
            ? `<a class="btn" href="${escapeHtml(feedbackUrl(row))}" target="_blank" rel="noopener">Ask for guest feedback</a>`
            : ""
        }
        ${isEvent ? `<button class="btn" type="button" id="edit-event">Edit event</button>` : ""}
        ${isEvent ? `<button class="btn btn--outline" type="button" id="delete-event">Remove event</button>` : ""}
      </div>
      <div class="detail-grid">
        <section>
          <h3>${isEvent ? "Event" : isReservation ? "Reservation" : "Booking"}</h3>
          <ul class="kv">
            <li><span>${isReservation || isEvent ? "Guest / name" : "Child"}</span><span>${escapeHtml(
              displayName(row)
            )}${!isReservation && !isEvent && row.child_age ? ` · turning ${escapeHtml(row.child_age)}` : ""}</span></li>
            <li><span>Date</span><span>${escapeHtml(row.party_date || "—")}</span></li>
            <li><span>Time</span><span>${escapeHtml(isReservation ? dineRange(row) : slotRange(row))}</span></li>
            ${
              isReservation
                ? `<li><span>Held</span><span>${escapeHtml(slotRange(row))} (30 min before and after)</span></li>
                   <li><span>Arrive by</span><span>${escapeHtml(arriveBy(row))} or the table is released</span></li>`
                : row.source === "party_builder"
                  ? `<li><span>Held</span><span>${escapeHtml(slotRange(row))} (1h prep + 3h party)</span></li>`
                  : ""
            }
            <li><span>Guests</span><span>${escapeHtml(displayGuests(row))}</span></li>
            <li><span>Tables</span><span>${escapeHtml(tableText(row))}</span></li>
            ${
              isEvent
                ? `<li><span>Location</span><span>${escapeHtml(
                    payload.event?.location === "masterclass" ? "In masterclass" : "In service area"
                  )}</span></li>
                   <li><span>Payment</span><span>${escapeHtml(
                     payload.event?.payment === "vendor" ? "By vendor" : "By Tiny"
                   )}</span></li>
                   <li><span>Repeats</span><span>${escapeHtml(
                     payload.event?.repeat?.freq && payload.event.repeat.freq !== "none"
                       ? `${repeatHint(payload.event.repeat.freq, row.party_date)}${
                           payload.event.repeat.until ? ` until ${payload.event.repeat.until}` : ""
                         }`
                       : "Does not repeat"
                   )}</span></li>`
                : isReservation
                ? `<li><span>Purpose</span><span>${escapeHtml(reservation.purpose || "—")}</span></li>`
                : type === "birthday"
                  ? `<li><span>Package</span><span>${escapeHtml(row.package_name || "—")}</span></li>
                     <li><span>Theme / request</span><span>${escapeHtml(
                       decor.designRequest || decor.themeLabel || "—"
                     )}</span></li>`
                  : ""
            }
          </ul>
        </section>
        ${
          showLayout
            ? `<section>
          <h3>Table layout</h3>
          <div class="staff-plan" id="staff-detail-plan"></div>
        </section>`
            : ""
        }
        ${
          isEvent
            ? `<section>
          <h3>Guest list</h3>
          <div class="contact-actions" style="margin-bottom:12px">
            <button class="btn" type="button" id="add-guest-detail">Add to guest list</button>
            <button class="btn btn--outline" type="button" id="export-guests">Export guest list PDF</button>
            <button class="btn btn--outline" type="button" id="share-guests">Share guest list</button>
          </div>
          ${
            (payload.event?.guests || []).length
              ? `<ul class="kv">${payload.event.guests
                  .map(
                    (guest) =>
                      `<li><span>${escapeHtml(guest.name || "Guest")} · ${escapeHtml(guest.pax || 1)} pax</span><span>${escapeHtml(
                        [guest.phone, guest.email, guest.notes].filter(Boolean).join(" · ") || "—"
                      )}</span></li>`
                  )
                  .join("")}</ul>`
              : `<p class="muted">No guests added.</p>`
          }
        </section>
        <section>
          <h3>Pictures</h3>
          <div class="media-row">
            ${
              eventPhotoUrls.filter(Boolean).length
                ? eventPhotoUrls
                    .map((url, i) =>
                      url ? `<img src="${escapeHtml(url)}" alt="Event picture ${i + 1}">` : ""
                    )
                    .join("")
                : `<p class="muted">No pictures uploaded.</p>`
            }
          </div>
        </section>`
            : ""
        }
        ${
          type === "birthday"
            ? `<section>
          <h3>Quotation</h3>
          <ul class="kv">
            ${(quote.lines || [])
              .map(
                (line) =>
                  `<li><span>${escapeHtml(line.label || "Item")}${
                    line.qty ? ` · ×${escapeHtml(line.qty)}` : ""
                  }</span><span>${line.note ? "TBC" : escapeHtml(formatIdr(line.value))}</span></li>`
              )
              .join("") || "<li><span>No lines</span><span>—</span></li>"}
            <li><span>Total</span><span>${escapeHtml(formatIdr(quote.total ?? row.quote_total_idr))}</span></li>
            <li><span>DP 30%</span><span>${escapeHtml(formatIdr(quote.dp30 ?? row.quote_dp_idr))}</span></li>
            <li><span>Payment</span><span>${escapeHtml(paymentSummary(payload.payment))}</span></li>
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
            <li><span>Cake notes</span><span>${escapeHtml(cake.notes || "—")}</span></li>
          </ul>
          ${cakeUrl ? `<img class="hero-img" src="${escapeHtml(cakeUrl)}" alt="Cake reference">` : ""}
        </section>
        <section>
          <h3>Decoration</h3>
          <ul class="kv">
            <li><span>Package</span><span>${escapeHtml(decor.packageLabel || "—")}</span></li>
            <li><span>Look</span><span>${escapeHtml(decor.themeLabel || "—")}</span></li>
            <li><span>Name on backdrop</span><span>${escapeHtml(decor.backdropName || "—")}</span></li>
            <li><span>Colours</span><span>${
              (decor.balloonColours || []).length
                ? decor.balloonColours
                    .map(
                      (c) =>
                        `<span class="colour-swatch" style="background:${escapeHtml(c.hex || c.original || "#c5dcc8")}"></span>${escapeHtml(
                          c.label || c.hex || ""
                        )}`
                    )
                    .join("<br>")
                : "—"
            }</span></li>
            <li><span>Decor notes</span><span>${escapeHtml(decor.notes || "—")}</span></li>
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
            : ""
        }
        <section>
          <h3>Notes</h3>
          <p>${escapeHtml(reservation.notes || payload.event?.notes || (payload.party && payload.party.foodNotes) || "No food notes")}</p>
          <p>${escapeHtml((payload.party && payload.party.notes) || "")}</p>
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

  if (showLayout && window.TinyReserveMap) {
    window.TinyReserveMap.renderMap(document.getElementById("staff-detail-plan"), {
      area: layoutArea === "terrace" ? "terrace" : "indoor",
      selected: tableIds,
      held: [],
      guests: row.guest_adults || reservation.guests || 1,
      interactive: false,
      base: "../reserve/img/",
    });
  }

  document.getElementById("back-list")?.addEventListener("click", () => {
    location.hash = backHash();
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
    if (status === "closed") await loadDetail(row.id);
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
  document.getElementById("edit-event")?.addEventListener("click", () => {
    const event = payload.event || {};
    openEventModal({
      id: row.id,
      name: row.contact_name || event.name,
      date: row.party_date,
      start: timeLabel(row.party_time),
      end: reservation.endTime || "17:00",
      location: event.location || "service",
      fullTerrace: event.fullTerrace,
      notes: event.notes || reservation.notes || "",
      payment: event.payment || "tiny",
      tableIds: reservation.tableIds || [],
      guests: event.guests || [],
      repeat: event.repeat,
    });
  });
  document.getElementById("add-guest-detail")?.addEventListener("click", () => {
    const event = payload.event || {};
    openEventModal({
      id: row.id,
      name: row.contact_name || event.name,
      date: row.party_date,
      start: timeLabel(row.party_time),
      end: reservation.endTime || "17:00",
      location: event.location || "service",
      fullTerrace: event.fullTerrace,
      notes: event.notes || reservation.notes || "",
      payment: event.payment || "tiny",
      tableIds: reservation.tableIds || [],
      guests: [...(event.guests || []), {}],
      repeat: event.repeat,
    });
  });
  document.getElementById("export-guests")?.addEventListener("click", async () => {
    const guests = payload.event?.guests || [];
    const host = document.createElement("div");
    host.style.cssText = "padding:24px;font-family:Jost,sans-serif;color:#2c3a32;width:720px;background:#fff";
    host.innerHTML = `<h2>Guest list · ${escapeHtml(displayName(row))}</h2>
      <p>${escapeHtml(formatLongDate(row.party_date))} · ${escapeHtml(slotRange(row))}</p>
      <ul class="kv">${
        guests.length
          ? guests
              .map(
                (guest) =>
                  `<li><span>${escapeHtml(guest.name || "Guest")} · ${escapeHtml(guest.pax || 1)} pax</span><span>${escapeHtml(
                    [guest.phone, guest.email, guest.notes].filter(Boolean).join(" · ") || "—"
                  )}</span></li>`
              )
              .join("")
          : "<li><span>No guests</span><span>—</span></li>"
      }</ul>`;
    document.body.appendChild(host);
    try {
      const blob = await htmlToPdfBlob(host, `${row.public_code}-guests.pdf`);
      downloadBlob(blob, `${row.public_code}-guests.pdf`);
    } catch (err) {
      window.print();
    }
    host.remove();
  });
  document.getElementById("share-guests")?.addEventListener("click", () => {
    const guests = payload.event?.guests || [];
    const text = [
      `Guest list for ${displayName(row)}`,
      `${formatLongDate(row.party_date)} · ${slotRange(row)}`,
      ...guests.map(
        (guest) =>
          `${guest.name || "Guest"} · ${guest.pax || 1} pax${guest.phone ? ` · ${guest.phone}` : ""}${
            guest.email ? ` · ${guest.email}` : ""
          }`
      ),
    ].join("\n");
    const phone = String(row.phone || "").replace(/\D/g, "");
    if (navigator.share) {
      navigator.share({ title: `Guest list ${row.public_code}`, text }).catch(() => {});
      return;
    }
    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
    else if (row.email) window.location.href = `mailto:${row.email}?subject=${encodeURIComponent("Guest list")}&body=${encodeURIComponent(text)}`;
    else navigator.clipboard?.writeText(text);
  });
  document.getElementById("delete-event")?.addEventListener("click", async () => {
    if (!window.confirm("Remove this event?")) return;
    const { error: delError } = await supabase.from("requests").delete().eq("id", row.id).eq("source", "event");
    const statusEl = document.getElementById("detail-status");
    if (delError) {
      if (statusEl) {
        statusEl.textContent = delError.message;
        statusEl.className = "status is-error";
      }
      return;
    }
    location.hash = backHash();
  });
}

function renderInvoiceMaps() {
  const Map = window.TinyReserveMap;
  if (!Map) return;
  const guests =
    (Number(document.getElementById("invoice-kids")?.value) || 0) +
    (Number(document.getElementById("invoice-adults")?.value) || 0) || 1;
  const pick = (id) => {
    if (invoiceSelectedTables.has(id)) invoiceSelectedTables.delete(id);
    else invoiceSelectedTables.add(id);
    renderInvoiceMaps();
  };
  Map.renderMap(document.getElementById("invoice-indoor"), {
    area: "indoor",
    selected: [...invoiceSelectedTables].filter((id) => String(id).startsWith("in-")),
    held: [],
    guests,
    interactive: true,
    base: "../reserve/img/",
    onPick: pick,
  });
  Map.renderMap(document.getElementById("invoice-terrace"), {
    area: "terrace",
    selected: [...invoiceSelectedTables].filter((id) => String(id).startsWith("tr-")),
    held: [],
    guests,
    interactive: true,
    base: "../reserve/img/",
    onPick: pick,
  });
}

async function uploadStaffFile(requestId, folder, file) {
  if (!file) return "";
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${requestId}/${folder}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("request-files").upload(path, file, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  return path;
}

function readInvoiceForm(row) {
  const quote = readQuoteEditor();
  const Map = window.TinyReserveMap;
  const tableIds = [...invoiceSelectedTables];
  const tables = tableIds.map((id) => Map?.findTable?.(id)).filter(Boolean);
  const balloonColours = [...document.querySelectorAll("#invoice-colours .colour-row")].map((rowEl, index) => {
    const hex = rowEl.querySelector('[name="balloon-hex"]')?.value || "#c5dcc8";
    return {
      id: rowEl.querySelector('[name="balloon-id"]')?.value || `c${index + 1}`,
      label: rowEl.querySelector('[name="balloon-label"]')?.value.trim() || `Balloon ${index + 1}`,
      hex,
      original: rowEl.querySelector('[name="balloon-original"]')?.value || hex,
    };
  });
  const time = document.getElementById("invoice-time")?.value || "";
  return {
    child_name: document.getElementById("invoice-child")?.value.trim() || row.child_name,
    contact_name: document.getElementById("invoice-contact")?.value.trim() || row.contact_name,
    party_date: document.getElementById("invoice-date")?.value || row.party_date,
    party_time: time ? (time.length === 5 ? `${time}:00` : time) : row.party_time,
    guest_kids: Number(document.getElementById("invoice-kids")?.value) || 0,
    guest_adults: Number(document.getElementById("invoice-adults")?.value) || 0,
    quote,
    guests: readGuestListFrom("#invoice-guests"),
    cake: {
      size: document.getElementById("invoice-cake-size")?.value.trim() || "",
      sponges: (document.getElementById("invoice-cake-sponges")?.value || "")
        .split("+")
        .map((item) => item.trim())
        .filter(Boolean),
      design: document.getElementById("invoice-cake-design")?.value.trim() || "",
      theme: document.getElementById("invoice-cake-theme")?.value.trim() || "",
      notes: document.getElementById("invoice-cake-notes")?.value.trim() || "",
    },
    decor: {
      backdropName: document.getElementById("invoice-backdrop-name")?.value.trim() || "",
      notes: document.getElementById("invoice-decor-notes")?.value.trim() || "",
      balloonColours,
    },
    tableIds,
    tableLabel: tables.length ? Map.tableLabel(tables) : row.payload?.reservation?.tableLabel || row.package_name,
    area: tables[0]?.area || row.payload?.reservation?.area || "terrace",
  };
}

function readGuestListFrom(selector) {
  return [...document.querySelectorAll(`${selector} .guest-row`)]
    .map((row) => ({
      name: row.querySelector('[name="guest-name"]')?.value.trim() || "",
      pax: Number(row.querySelector('[name="guest-pax"]')?.value) || 1,
      phone: row.querySelector('[name="guest-phone"]')?.value.trim() || "",
      email: row.querySelector('[name="guest-email"]')?.value.trim() || "",
      notes: row.querySelector('[name="guest-notes"]')?.value.trim() || "",
    }))
    .filter((guest) => guest.name || guest.phone || guest.email);
}

async function loadInvoice(id) {
  inboxViews.hidden = true;
  if (viewNav) viewNav.hidden = true;
  detailView.hidden = false;
  detailView.innerHTML = `<p class="status">Loading invoice…</p>`;
  const { data: row, error } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (error || !row) {
    detailView.innerHTML = `<p class="status is-error">${escapeHtml(error?.message || "Request not found.")}</p>`;
    return;
  }
  const payload = row.payload || {};
  const quote = payload.quote || {};
  const cake = payload.cake || {};
  const decor = payload.decor || {};
  const reservation = payload.reservation || {};
  const files = row.files || {};
  const [cakeUrl, backdropUrl] = await Promise.all([signedUrl(files.cakePhoto), signedUrl(files.backdropPng)]);
  invoiceSelectedTables = new Set(reservation.tableIds || []);
  const colours = decor.balloonColours?.length ? decor.balloonColours : [{ label: "Balloon 1", hex: "#c5dcc8" }];
  const guests = payload.party?.guests || [];
  const payment = payload.payment || {};
  const amounts = paymentAmounts(row, quote);
  pageTitle.textContent = `Invoice · ${row.public_code}`;
  detailView.innerHTML = `
    <button class="btn btn--outline back" type="button" id="back-list">Back</button>
    <article class="detail">
      <h2>Invoicing</h2>
      <p class="muted">${escapeHtml(row.public_code)} · edit the booking, decoration, cake and send the invoice.</p>
      <div class="detail-grid">
        <section>
          <h3>Guest & party</h3>
          <label class="field"><span>Child / guest name</span><input id="invoice-child" value="${escapeHtml(row.child_name || "")}"></label>
          <label class="field"><span>Parent / contact</span><input id="invoice-contact" value="${escapeHtml(row.contact_name || "")}"></label>
          <div class="field-row">
            <label class="field"><span>Date</span><input type="date" id="invoice-date" value="${escapeHtml(row.party_date || "")}"></label>
            <label class="field"><span>Time</span><input type="time" id="invoice-time" value="${escapeHtml(String(row.party_time || "").slice(0, 5))}"></label>
          </div>
          <div class="field-row">
            <label class="field"><span>Kids</span><input type="number" min="0" id="invoice-kids" value="${escapeHtml(row.guest_kids || 0)}"></label>
            <label class="field"><span>Adults</span><input type="number" min="0" id="invoice-adults" value="${escapeHtml(row.guest_adults || 0)}"></label>
          </div>
        </section>
        <section>
          <h3>Line items</h3>
          <div class="quote-editor" id="quote-editor">
            ${(quote.lines?.length ? quote.lines : [{ label: "", qty: 1, price: 0 }]).map(quoteLineHtml).join("")}
            <button class="btn btn--outline" type="button" id="quote-add-line">Add item</button>
            <div id="quote-totals"></div>
          </div>
          <label class="field"><span>Bank</span><input id="invoice-bank" value="${escapeHtml(quote.bank?.bank || BANK.bank)}"></label>
          <label class="field"><span>Account name</span><input id="invoice-account-name" value="${escapeHtml(quote.bank?.accountName || BANK.accountName)}"></label>
          <label class="field"><span>Account number</span><input id="invoice-account-number" value="${escapeHtml(quote.bank?.accountNumber || BANK.accountNumber)}"></label>
        </section>
        <section>
          <h3>Decoration</h3>
          <label class="field"><span>Name on backdrop</span><input id="invoice-backdrop-name" value="${escapeHtml(decor.backdropName || "")}"></label>
          <div id="invoice-colours">${colours.map(colourRowHtml).join("")}</div>
          <button class="btn btn--outline" type="button" id="add-balloon-colour">Add balloon colour</button>
          <label class="field"><span>Decoration notes</span><textarea id="invoice-decor-notes" rows="3">${escapeHtml(decor.notes || "")}</textarea></label>
          <label class="field"><span>Replace backdrop image</span><input type="file" id="invoice-backdrop-file" accept="image/jpeg,image/png,image/webp"></label>
          ${backdropUrl ? `<img class="hero-img" src="${escapeHtml(backdropUrl)}" alt="Backdrop">` : ""}
        </section>
        <section>
          <h3>Cake</h3>
          <label class="field"><span>Size</span><input id="invoice-cake-size" value="${escapeHtml(cake.size || "")}"></label>
          <label class="field"><span>Sponge</span><input id="invoice-cake-sponges" value="${escapeHtml((cake.sponges || []).join(" + "))}"></label>
          <label class="field"><span>Design / reference</span><input id="invoice-cake-design" value="${escapeHtml(cake.design || "")}"></label>
          <label class="field"><span>Theme</span><input id="invoice-cake-theme" value="${escapeHtml(cake.theme || "")}"></label>
          <label class="field"><span>Cake notes</span><textarea id="invoice-cake-notes" rows="3">${escapeHtml(cake.notes || "")}</textarea></label>
          <label class="field"><span>Replace cake reference photo</span><input type="file" id="invoice-cake-file" accept="image/jpeg,image/png,image/webp"></label>
          ${cakeUrl ? `<img class="hero-img" src="${escapeHtml(cakeUrl)}" alt="Cake">` : ""}
        </section>
        <section>
          <h3>Tables</h3>
          <p class="muted">Click tables to assign this party.</p>
          <div class="staff-plans tables-floor">
            <div><h3>Indoor</h3><div class="staff-plan" id="invoice-indoor"></div></div>
            <div><h3>Terrace</h3><div class="staff-plan" id="invoice-terrace"></div></div>
          </div>
        </section>
        <section>
          <h3>Guest list (optional)</h3>
          <div id="invoice-guests" class="guest-list">${(guests.length ? guests : []).map(guestRowHtml).join("")}</div>
          <button class="btn btn--outline" type="button" id="invoice-guest-add">Add guest</button>
        </section>
        <section>
          <h3>Payment</h3>
          <p class="muted">Deposit and balance also appear on Google Calendar when this booking is confirmed.</p>
          <div class="payment-grid">
            ${paymentFieldsHtml("dp", "Deposit 30%", amounts.dp, payment.deposit)}
            ${paymentFieldsHtml("bal", "Balance", amounts.rest, payment.balance)}
          </div>
        </section>
      </div>
      <p class="status" id="invoice-status"></p>
      <div class="contact-actions">
        <button class="btn" type="button" id="save-invoice">Save invoice</button>
        <button class="btn btn--outline" type="button" id="send-invoice">Save & send invoice</button>
        <a class="btn btn--outline" href="#/payment/${escapeHtml(row.id)}">Track payment</a>
      </div>
    </article>
  `;
  refreshQuoteTotals();
  renderInvoiceMaps();
  document.getElementById("back-list")?.addEventListener("click", () => {
    location.hash = `#/request/${row.id}`;
  });
  document.getElementById("quote-editor")?.addEventListener("input", refreshQuoteTotals);
  document.getElementById("quote-editor")?.addEventListener("click", (e) => {
    if (!e.target.closest("[data-remove-line]")) return;
    e.target.closest(".quote-line")?.remove();
    refreshQuoteTotals();
  });
  document.getElementById("quote-add-line")?.addEventListener("click", () => {
    document.getElementById("quote-add-line")?.insertAdjacentHTML("beforebegin", quoteLineHtml());
    refreshQuoteTotals();
  });
  document.getElementById("add-balloon-colour")?.addEventListener("click", () => {
    document.getElementById("invoice-colours")?.insertAdjacentHTML("beforeend", colourRowHtml());
  });
  document.getElementById("invoice-colours")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-remove-colour]")) e.target.closest(".colour-row")?.remove();
  });
  document.getElementById("invoice-guest-add")?.addEventListener("click", () => {
    document.getElementById("invoice-guests")?.insertAdjacentHTML("beforeend", guestRowHtml());
  });
  document.getElementById("invoice-guests")?.addEventListener("click", (e) => {
    if (e.target.closest("[data-remove-guest]")) e.target.closest(".guest-row")?.remove();
  });
  document.getElementById("invoice-kids")?.addEventListener("change", renderInvoiceMaps);
  document.getElementById("invoice-adults")?.addEventListener("change", renderInvoiceMaps);

  async function persistInvoice(send) {
    const statusEl = document.getElementById("invoice-status");
    statusEl.textContent = "Saving…";
    statusEl.className = "status";
    const form = readInvoiceForm(row);
    const nextPayload = {
      ...payload,
      quote: { ...quote, ...form.quote },
      cake: { ...cake, ...form.cake },
      decor: { ...decor, ...form.decor, balloonColours: form.decor.balloonColours },
      party: { ...(payload.party || {}), guests: form.guests },
      payment: readPaymentForm(form.quote.dp30, Math.max(0, form.quote.total - form.quote.dp30)),
      reservation: {
        ...reservation,
        name: form.contact_name,
        tableIds: form.tableIds,
        tableLabel: form.tableLabel,
        area: form.area,
      },
    };
    const nextFiles = { ...(row.files || {}) };
    try {
      const cakeFile = document.getElementById("invoice-cake-file")?.files?.[0];
      const backdropFile = document.getElementById("invoice-backdrop-file")?.files?.[0];
      if (cakeFile) nextFiles.cakePhoto = await uploadStaffFile(row.id, "cake", cakeFile);
      if (backdropFile) nextFiles.backdropPng = await uploadStaffFile(row.id, "backdrop", backdropFile);
      if (send) {
        const colours = form.decor.balloonColours
          .map(
            (c) =>
              `<span style="display:inline-block;width:12px;height:12px;background:${escapeHtml(
                c.hex
              )};border:1px solid #ccc;margin-right:6px;vertical-align:middle"></span>${escapeHtml(c.label)} ${escapeHtml(c.hex)}`
          )
          .join("<br>");
        const host = document.createElement("div");
        host.style.cssText = "padding:28px;font-family:Jost,sans-serif;color:#2c3a32;width:720px;background:#fff";
        host.innerHTML = `<h2>Invoice · Tiny Healthy Cafe</h2>
          <p>${escapeHtml(row.public_code)} · ${escapeHtml(form.child_name || form.contact_name)}</p>
          <p>${escapeHtml(formatLongDate(form.party_date))} · ${escapeHtml(timeLabel(form.party_time))}</p>
          <p>${escapeHtml(form.guest_kids || 0)} kids · ${escapeHtml(form.guest_adults || 0)} adults · ${escapeHtml(form.tableLabel || "")}</p>
          <ul class="kv">${form.quote.lines
            .map(
              (line) =>
                `<li><span>${escapeHtml(line.label)} × ${escapeHtml(line.qty)}</span><span>${escapeHtml(formatIdr(line.value))}</span></li>`
            )
            .join("")}
            <li><span>Subtotal</span><span>${escapeHtml(formatIdr(form.quote.subtotal))}</span></li>
            <li><span>Service 5%</span><span>${escapeHtml(formatIdr(form.quote.service))}</span></li>
            <li><span>Tax 10%</span><span>${escapeHtml(formatIdr(form.quote.tax))}</span></li>
            <li class="is-total"><span>Total</span><span>${escapeHtml(formatIdr(form.quote.total))}</span></li>
            <li><span>Deposit 30%</span><span>${escapeHtml(formatIdr(form.quote.dp30))}</span></li>
          </ul>
          <p><strong>Decoration</strong><br>Backdrop: ${escapeHtml(form.decor.backdropName || "—")}<br>${
            colours || "Balloons: —"
          }<br>${escapeHtml(form.decor.notes || "")}</p>
          ${backdropUrl ? `<img src="${escapeHtml(backdropUrl)}" alt="Backdrop" style="max-width:320px;margin:8px 0">` : ""}
          <p><strong>Cake</strong><br>${escapeHtml([form.cake.size, form.cake.design, form.cake.theme].filter(Boolean).join(" · ") || "—")}<br>${escapeHtml(
            form.cake.notes || ""
          )}</p>
          ${cakeUrl ? `<img src="${escapeHtml(cakeUrl)}" alt="Cake" style="max-width:320px;margin:8px 0">` : ""}
          ${
            form.guests.length
              ? `<p><strong>Guest list</strong></p><ul class="kv">${form.guests
                  .map(
                    (guest) =>
                      `<li><span>${escapeHtml(guest.name || "Guest")} · ${escapeHtml(guest.pax || 1)} pax</span><span>${escapeHtml(
                        [guest.phone, guest.email].filter(Boolean).join(" · ") || "—"
                      )}</span></li>`
                  )
                  .join("")}</ul>`
              : ""
          }
          <p><strong>Bank transfer</strong><br>${escapeHtml(form.quote.bank.bank)} · ${escapeHtml(
            form.quote.bank.accountName
          )}<br>${escapeHtml(form.quote.bank.accountNumber || "Account number TBC")}</p>
          <p><strong>Payment</strong><br>${escapeHtml(paymentSummary(nextPayload.payment))}</p>
          <p>Please transfer the 30% deposit (${escapeHtml(formatIdr(form.quote.dp30))}) to confirm.</p>`;
        document.body.appendChild(host);
        const blob = await htmlToPdfBlob(host, `${row.public_code}-invoice.pdf`);
        host.remove();
        const path = `${row.id}/invoice.pdf`;
        await supabase.storage.from("request-files").upload(path, blob, { contentType: "application/pdf", upsert: true });
        nextFiles.invoicePdf = path;
        downloadBlob(blob, `${row.public_code}-invoice.pdf`);
        const url = await signedUrl(path);
        const text = `Hello ${form.contact_name || "there"}, here is the invoice for your Birthday at Tiny Healthy Cafe. Total ${formatIdr(
          form.quote.total
        )}. 30% deposit ${formatIdr(form.quote.dp30)}. ${form.quote.bank.bank} ${form.quote.bank.accountName} ${
          form.quote.bank.accountNumber || ""
        }. ${url || ""}`.trim();
        const phone = String(row.phone || "").replace(/\D/g, "");
        if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        else if (row.email) window.location.href = `mailto:${row.email}?subject=${encodeURIComponent("Tiny invoice")}&body=${encodeURIComponent(text)}`;
      }
      const { error: saveError } = await supabase
        .from("requests")
        .update({
          child_name: form.child_name,
          contact_name: form.contact_name,
          party_date: form.party_date,
          party_time: form.party_time,
          guest_kids: form.guest_kids,
          guest_adults: form.guest_adults,
          package_name: form.tableLabel || row.package_name,
          payload: nextPayload,
          files: nextFiles,
          quote_subtotal_idr: form.quote.subtotal,
          quote_service_idr: form.quote.service,
          quote_tax_idr: form.quote.tax,
          quote_total_idr: form.quote.total,
          quote_dp_idr: form.quote.dp30,
          status: send && row.status === "new" ? "quoted" : row.status,
        })
        .eq("id", row.id);
      if (saveError) throw saveError;
      statusEl.textContent = send ? "Invoice saved and sent." : "Invoice saved.";
      statusEl.className = "status is-success";
    } catch (err) {
      statusEl.textContent = err.message || "Could not save invoice.";
      statusEl.className = "status is-error";
    }
  }

  document.getElementById("save-invoice")?.addEventListener("click", () => persistInvoice(false));
  document.getElementById("send-invoice")?.addEventListener("click", () => persistInvoice(true));
}

async function loadPayment(id) {
  inboxViews.hidden = true;
  if (viewNav) viewNav.hidden = true;
  detailView.hidden = false;
  detailView.innerHTML = `<p class="status">Loading payment…</p>`;
  const { data: row, error } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (error || !row) {
    detailView.innerHTML = `<p class="status is-error">${escapeHtml(error?.message || "Request not found.")}</p>`;
    return;
  }
  const quote = row.payload?.quote || {};
  const payment = row.payload?.payment || {};
  const { dp, rest } = paymentAmounts(row, quote);
  pageTitle.textContent = `Payment · ${row.public_code}`;
  detailView.innerHTML = `
    <button class="btn btn--outline back" type="button" id="back-list">Back</button>
    <article class="detail">
      <h2>Track payment</h2>
      <p class="muted">${escapeHtml(displayName(row))} · ${escapeHtml(paymentSummary(payment))} · this also updates the Google Calendar event when the booking is confirmed.</p>
      <div class="payment-grid">
        ${paymentFieldsHtml("dp", "Deposit 30%", dp, payment.deposit)}
        ${paymentFieldsHtml("bal", "Balance", rest, payment.balance)}
      </div>
      <p class="status" id="payment-status"></p>
      <div class="contact-actions">
        <button class="btn" type="button" id="save-payment">Save payment status</button>
        <a class="btn btn--outline" href="#/invoice/${escapeHtml(row.id)}">Back to invoicing</a>
      </div>
    </article>
  `;
  document.getElementById("back-list")?.addEventListener("click", () => {
    location.hash = `#/request/${row.id}`;
  });
  document.getElementById("save-payment")?.addEventListener("click", async () => {
    const statusEl = document.getElementById("payment-status");
    const nextPayment = readPaymentForm(dp, rest);
    const { error: saveError } = await supabase
      .from("requests")
      .update({ payload: { ...(row.payload || {}), payment: nextPayment } })
      .eq("id", row.id);
    if (saveError) {
      statusEl.textContent = saveError.message;
      statusEl.className = "status is-error";
      return;
    }
    statusEl.textContent = `Saved · ${paymentSummary(nextPayment)}. Google Calendar will update if this booking is confirmed.`;
    statusEl.className = "status is-success";
  });
}

function showInbox(view) {
  state.view = view;
  if (view !== "day") state.lastView = view;
  else state.lastView = "day";
  detailView.hidden = true;
  inboxViews.hidden = false;
  document.getElementById("overview-view").hidden = view !== "overview";
  document.getElementById("calendar-view").hidden = view !== "calendar";
  document.getElementById("day-view").hidden = view !== "day";
  document.getElementById("timeline-view").hidden = view !== "timeline";
  document.getElementById("tables-view").hidden = view !== "tables";
  document.getElementById("events-view").hidden = view !== "events";
  renderNav(view);
  if (view === "overview") renderOverview();
  if (view === "calendar") renderCalendar();
  if (view === "day") renderDay();
  if (view === "timeline") renderTimeline();
  if (view === "tables") renderTables();
  if (view === "events") renderEvents();
}

async function route() {
  const parsed = parseHash();
  if (parsed.date) {
    state.selectedDate = parsed.date;
    state.calendarMonth = parsed.date.slice(0, 7);
  }
  if (parsed.view === "detail") {
    renderNav(parsed.view);
    await loadDetail(parsed.id);
    return;
  }
  if (parsed.view === "invoice") {
    renderNav(parsed.view);
    await loadInvoice(parsed.id);
    return;
  }
  if (parsed.view === "payment") {
    renderNav(parsed.view);
    await loadPayment(parsed.id);
    return;
  }
  if (parsed.view === "cooking") {
    renderNav(parsed.view);
    renderCookingDetail(parsed.date || state.selectedDate);
    return;
  }
  try {
    await loadRows();
    showInbox(parsed.view || "overview");
  } catch (err) {
    const node = document.getElementById("overview-status");
    if (node) {
      node.textContent = err.message || "Could not load inbox.";
      node.className = "status is-error";
    }
  }
}

function go(hash) {
  location.hash = hash.startsWith("#") ? hash : `#/${hash}`;
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
  if (!location.hash || location.hash === "#") location.hash = "#/overview";
  route();
});

signOutBtn?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  showApp(false);
});

document.getElementById("inbox-views")?.addEventListener("click", (e) => {
  const statusCard = e.target.closest("[data-status-filter]");
  if (statusCard) {
    e.preventDefault();
    state.overviewStatus = statusCard.dataset.statusFilter || "all";
    showInbox("overview");
    return;
  }
  const open = e.target.closest("[data-open]");
  if (open) {
    e.preventDefault();
    e.stopPropagation();
    go(open.dataset.open);
    return;
  }
  const cell = e.target.closest("[data-date]");
  if (cell && cell.closest("#cal-grid")) {
    state.selectedDate = cell.dataset.date;
    go(`day/${cell.dataset.date}`);
    return;
  }
  const track = e.target.closest("[data-table]");
  if (track && !e.target.closest("[data-open]")) {
    const Map = window.TinyReserveMap;
    const { dayStart, span } = hourMarks();
    const rect = track.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const start = minutesToTime(dayStart + pct * span);
    const end = minutesToTime(dayStart + pct * span + 120);
    openBlockModal({ tableIds: [track.dataset.table], start, end, date: state.selectedDate });
  }
});

document.getElementById("inbox-date")?.addEventListener("change", (e) => {
  state.selectedDate = e.target.value || todayIso();
  state.calendarMonth = state.selectedDate.slice(0, 7);
  if (state.view === "overview") state.dateMode = "day";
  if (state.view === "day") go(`day/${state.selectedDate}`);
  else showInbox(state.view);
});

document.getElementById("filter-date-mode")?.addEventListener("change", (e) => {
  state.dateMode = e.target.value || "all";
  if (state.dateMode === "day" && !state.selectedDate) state.selectedDate = todayIso();
  showInbox(state.view);
});

document.getElementById("filter-type")?.addEventListener("change", (e) => {
  state.filters.type = e.target.value || "all";
  showInbox(state.view);
});

document.getElementById("filter-status")?.addEventListener("change", (e) => {
  const value = e.target.value || "all";
  if (state.view === "overview") state.overviewStatus = value;
  else state.filters.status = value;
  showInbox(state.view);
});

document.getElementById("cal-prev")?.addEventListener("click", () => {
  state.calendarMonth = shiftMonth(state.calendarMonth, -1);
  renderCalendar();
});
document.getElementById("cal-next")?.addEventListener("click", () => {
  state.calendarMonth = shiftMonth(state.calendarMonth, 1);
  renderCalendar();
});

document.getElementById("day-back")?.addEventListener("click", () => {
  go("calendar");
});

document.getElementById("timeline-prev")?.addEventListener("click", () => {
  state.selectedDate = shiftIso(state.selectedDate, -1);
  showInbox("timeline");
});
document.getElementById("timeline-next")?.addEventListener("click", () => {
  state.selectedDate = shiftIso(state.selectedDate, 1);
  showInbox("timeline");
});

document.getElementById("tables-slider")?.addEventListener("input", () => {
  state.tableMinutes = Number(document.getElementById("tables-slider").value) || state.tableMinutes;
  if (state.view === "tables") renderTables();
});

document.getElementById("event-repeat")?.addEventListener("change", syncEventRepeatFields);
document.getElementById("event-date")?.addEventListener("change", syncEventRepeatFields);

document.getElementById("block-tables")?.addEventListener("click", () => {
  openBlockModal({ date: state.selectedDate });
});

document.getElementById("add-event")?.addEventListener("click", () => {
  openEventModal({ date: state.selectedDate });
});

document.getElementById("block-cancel")?.addEventListener("click", closeBlockModal);
blockModal?.addEventListener("click", (e) => {
  if (e.target === blockModal) closeBlockModal();
});
document.getElementById("event-cancel")?.addEventListener("click", closeEventModal);
eventModal?.addEventListener("click", (e) => {
  if (e.target === eventModal) closeEventModal();
});
document.getElementById("event-location")?.addEventListener("change", syncEventLocationFields);
document.getElementById("event-full-terrace")?.addEventListener("change", applyFullTerrace);
document.getElementById("event-guest-add")?.addEventListener("click", () => {
  document.getElementById("event-guests")?.insertAdjacentHTML("beforeend", guestRowHtml());
});
document.getElementById("event-guests")?.addEventListener("click", (e) => {
  if (!e.target.closest("[data-remove-guest]")) return;
  const row = e.target.closest(".guest-row");
  const host = document.getElementById("event-guests");
  row?.remove();
  if (host && !host.querySelector(".guest-row")) host.insertAdjacentHTML("beforeend", guestRowHtml());
});
document.getElementById("event-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  await saveStaffEvent();
});

document.getElementById("block-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById("block-status");
  const name = document.getElementById("block-name")?.value.trim() || "Event block";
  const date = document.getElementById("block-date")?.value;
  const start = document.getElementById("block-start")?.value;
  const end = document.getElementById("block-end")?.value;
  const tableIds = [...document.querySelectorAll('input[name="block-table"]:checked')].map((input) => input.value);
  if (!date || !start || !end || !tableIds.length) {
    statusEl.textContent = "Choose a date, time range, and at least one table.";
    statusEl.className = "status is-error";
    return;
  }
  const Map = window.TinyReserveMap;
  const tables = tableIds.map((id) => Map.findTable(id)).filter(Boolean);
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  const code = `EVT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const { error } = await supabase.from("requests").insert({
    source: "event",
    status: "booked",
    public_code: code,
    email: user?.email || "events@tinyhealthycafe.com",
    contact_name: name,
    party_date: date,
    party_time: start,
    package_name: Map.tableLabel(tables),
    payload: {
      event: { name },
      reservation: {
        name,
        tableIds,
        tableNumbers: tables.map((table) => table.number),
        tableLabel: Map.tableLabel(tables),
        area: tables[0]?.area || "terrace",
        endTime: end,
      },
    },
  });
  if (error) {
    statusEl.textContent = error.message;
    statusEl.className = "status is-error";
    return;
  }
  closeBlockModal();
  state.selectedDate = date;
  await loadRows();
  showInbox("tables");
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

tickClock();
setInterval(tickClock, 1000);

(async () => {
  const user = await requireStaff();
  if (!user) {
    showApp(false);
    return;
  }
  showApp(true);
  if (!location.hash || location.hash === "#") location.hash = "#/overview";
  route();
})();
