import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.TINY_SUPABASE || {};
const supabase = createClient(cfg.url || "", cfg.anonKey || "");
const TZ = "Asia/Makassar";
const BIRTHDAY_SOURCES = ["party_builder", "cake", "pdf_quote"];
const ALL_STATUSES = ["new", "contacted", "quoted", "booked", "cancelled", "noshow", "rejected", "closed"];
const EVENT_STATUSES = ["booked", "cancelled", "closed"];
const PENDING_STATUSES = ["new", "contacted", "quoted"];
const INACTIVE_STATUSES = ["cancelled", "rejected", "closed", "noshow"];
const REQUEST_SELECT =
  "id, created_at, source, status, public_code, email, phone, contact_name, child_name, child_age, party_date, party_time, package_name, guest_adults, guest_kids, quote_total_idr, payload, files, google_event_id";

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

const VIEWS = ["overview", "calendar", "day", "timeline", "tables", "events", "payments", "customers"];
const STAFF_DAY_START = 8 * 60;
const STAFF_DAY_END = 21 * 60;
const BANK = {
  bank: "BCA",
  accountName: "Tiny Healthy Cafe",
  accountNumber: "",
};
const PAYMENT_METHODS = ["Permata EDC", "Permata QRIS", "Bank Transfer", "Cash"];
const RESERVE_PURPOSES = ["Family meal", "Friends", "Reunion", "Birthday", "Business", "Other"];
let invoiceSelectedTables = new Set();
let reservationSelectedTables = new Set();
let partyCatalog = null;

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
  tablesMode: "grid",
  tablesArea: "terrace",
  tablesFocusId: "",
  customerQuery: "",
  customerFilters: { name: "", country: "", phone: "", email: "", type: "all" },
  paymentFilter: "all",
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

function layoutImageBase() {
  return new URL("../../reserve/img/", import.meta.url).href;
}

function layoutImageSrc(area) {
  const file = area === "terrace" ? "layout-terrace.png" : "layout-indoor.png";
  return new URL(file, layoutImageBase()).href;
}

function paintLayoutMap(host, opts) {
  const area = opts.area === "indoor" ? "indoor" : "terrace";
  const src = opts.src || layoutImageSrc(area);
  const Map = window.TinyReserveMap;
  if (host && Map?.renderMap) {
    try {
      Map.renderMap(host, { ...opts, area, src, base: layoutImageBase() });
    } catch (err) {
      console.error(err);
    }
  }
  if (host && !host.querySelector("img")) {
    host.innerHTML = `<div class="plan-map"><img src="${escapeHtml(src)}" alt="${
      area === "terrace" ? "Terrace" : "Indoor"
    } table layout"></div>`;
  }
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
  if (type === "event") return "Event booking";
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
  if (row.status === "cancelled" || row.status === "rejected" || row.status === "noshow") return `is-${kind} is-cancelled`;
  if (row.status === "booked" || row.status === "closed") return `is-${kind} is-confirmed`;
  return `is-${kind} is-pending`;
}

function displaySubtitle(row) {
  if (eventType(row) === "reservation") return tableText(row);
  if (eventType(row) === "event") {
    const table = tableText(row);
    const total = eventPricingFromRow(row)?.total || row.quote_total_idr;
    return total ? `${table}${table ? " · " : ""}${formatIdr(total)}` : table;
  }
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
  if (status === "noshow") return "No-show";
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
  if (status === "noshow") return "noshow";
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

function isPastConfirmedReservation(row) {
  if (row.source !== "reservation") return false;
  if (row.status !== "booked") return false;
  if (!row.party_date) return false;
  return row.party_date < todayIso();
}

async function closeFinishedReservations() {
  const due = state.rows.filter(isPastConfirmedReservation);
  if (!due.length) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData.session?.user?.id || null;
  const nowIso = new Date().toISOString();
  await Promise.all(
    due.map((row) =>
      supabase
        .from("requests")
        .update({
          status: "closed",
          status_changed_at: nowIso,
          status_changed_by: uid,
        })
        .eq("id", row.id)
        .eq("status", "booked")
    )
  );
  due.forEach((row) => {
    row.status = "closed";
  });
}

function canMarkNoShow(row) {
  if (row.source !== "reservation" || row.status !== "booked") return false;
  if (!row.party_date || !row.party_time) return false;
  const now = baliNowParts();
  const start = window.TinyReserveMap?.timeToMinutes?.(row.party_time);
  if (start == null) return false;
  if (row.party_date < now.date) return true;
  if (row.party_date > now.date) return false;
  return now.minutes >= start;
}

async function markNoShow(id) {
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase
    .from("requests")
    .update({
      status: "noshow",
      status_changed_at: new Date().toISOString(),
      status_changed_by: sessionData.session?.user?.id || null,
    })
    .eq("id", id)
    .eq("status", "booked");
  if (error) throw error;
  const row = state.rows.find((item) => item.id === id);
  if (row) row.status = "noshow";
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
  return overviewDated((row) => matchesType(row) && matchesOverviewStatus(row) && row.status !== "noshow");
}

function undatedRows() {
  return overviewUndated((row) => matchesType(row) && matchesOverviewStatus(row) && row.status !== "noshow");
}

function noshowRows() {
  if (state.overviewStatus !== "all" && state.overviewStatus !== "noshow") return [];
  return overviewDated((row) => matchesType(row) && row.status === "noshow").concat(
    overviewUndated((row) => matchesType(row) && row.status === "noshow")
  );
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
  const customer = hash.match(/^customer\/(.+)$/i);
  if (customer) return { view: "customer", id: decodeURIComponent(customer[1]) };
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
  await closeFinishedReservations();
}

function renderNav(view) {
  if (viewNav) {
    viewNav.hidden =
      view === "detail" ||
      view === "cooking" ||
      view === "invoice" ||
      view === "payment" ||
      view === "customer";
    viewNav.querySelectorAll("a").forEach((link) => {
      const target = link.dataset.view === "calendar" ? "calendar" : link.dataset.view;
      link.href = `#/${target}`;
      link.classList.toggle("is-active", link.dataset.view === (view === "day" ? "calendar" : view));
    });
  }
  if (pageTitle && !["detail", "cooking", "invoice", "payment", "customer"].includes(view)) {
    pageTitle.textContent =
      view === "events"
        ? "Events"
        : view === "customers"
          ? "Customer details"
          : view === "payments"
            ? "Payments"
            : "Inbox";
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
  const onCustomers = state.view === "customers";
  const onPayments = state.view === "payments";
  const toolbar = document.querySelector(".toolbar--inbox");
  if (toolbar) toolbar.hidden = onCustomers || onPayments;
  if (modeWrap) modeWrap.hidden = !onOverview;
  if (modeInput) modeInput.value = state.dateMode;
  if (dateWrap) dateWrap.hidden = onCalendar || onCustomers || onPayments || (onOverview && state.dateMode !== "day");
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
  const showNoShow = opts.allowNoShow && canMarkNoShow(row);
  const card = `<button class="booking-card" type="button" data-open="${escapeHtml(row.synthetic ? `cooking/${row.party_date}` : `request/${row.id}`)}">
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
  if (!showNoShow) return card;
  return `<div class="booking-card-wrap">${card}<button class="btn btn--outline" type="button" data-noshow="${escapeHtml(
    row.id
  )}">No-show</button></div>`;
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
    ["new", "new", "New booking", countBy(statPool, (r) => r.status === "new")],
    ["contacted", "contacted", "Contacted", countBy(statPool, (r) => r.status === "contacted")],
    ["quoted", "quoted", "Quoted", countBy(statPool, (r) => r.status === "quoted")],
    ["cancelled", "cancelled", "Cancelled", countBy(statPool, (r) => r.status === "cancelled")],
    ["noshow", "noshow", "No-show", countBy(statPool, (r) => r.status === "noshow")],
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
            .map((row) => bookingCard(row, { showDate: true, allowNoShow: true }))
            .join("")}`
      )
      .join("");
  } else if (dated.length) {
    body = dated
      .slice()
      .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)))
      .map((row) => bookingCard(row, { allowNoShow: true }))
      .join("");
  }
  const missed = noshowRows();
  list.innerHTML = [
    body || (undated.length || missed.length ? "" : `<p class="muted">${emptyText}</p>`),
    undated.length
      ? `<p class="date-label undated-label">No date yet</p>${undated.map((row) => bookingCard(row, { showDate, allowNoShow: true })).join("")}`
      : "",
  ].join("");
  const noshowSection = document.getElementById("noshow-section");
  const noshowList = document.getElementById("noshow-list");
  if (noshowSection && noshowList) {
    noshowSection.hidden = !missed.length;
    noshowList.innerHTML = missed.map((row) => bookingCard(row, { showDate: true })).join("");
  }
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

function tableRowsOnDate(iso) {
  return rowsOnDate(iso).filter((row) => row.synthetic || !INACTIVE_STATUSES.includes(row.status));
}

function occupiedAtTime(iso, minutes) {
  return tableRowsOnDate(iso).filter((row) => {
    const range = rowOccupy(row);
    if (!range) return false;
    return minutes >= range.start && minutes < range.end;
  });
}

function snapTableMinutes(value) {
  const stepped = Math.round(Number(value) / 30) * 30;
  return Math.min(STAFF_DAY_END, Math.max(STAFF_DAY_START, stepped));
}

function bookingTableIds(row) {
  return row?.payload?.reservation?.tableIds || [];
}

function bookingArea(row) {
  const first = bookingTableIds(row)[0];
  return window.TinyReserveMap?.findTable?.(first)?.area || row?.payload?.reservation?.area || "terrace";
}

function layoutBookingKind(row) {
  if (row?.synthetic) return "cooking";
  return eventType(row);
}

function renderTablesLayout() {
  const slider = document.getElementById("tables-slider");
  state.tableMinutes = snapTableMinutes(slider ? slider.value : state.tableMinutes);
  if (slider) slider.value = String(state.tableMinutes);
  const timeText = minutesToTime(state.tableMinutes);
  const label = document.getElementById("tables-time-label");
  if (label) label.textContent = timeText;
  const active = occupiedAtTime(state.selectedDate, state.tableMinutes);
  const held = new Set();
  const byTable = new Map();
  active.forEach((row) => {
    bookingTableIds(row).forEach((id) => {
      held.add(id);
      if (!byTable.has(id)) byTable.set(id, row);
    });
  });
  if (!active.some((row) => String(row.id) === String(state.tablesFocusId))) {
    state.tablesFocusId = active[0] ? String(active[0].id) : "";
  }
  const focused = active.find((row) => String(row.id) === String(state.tablesFocusId)) || null;
  const area = state.tablesArea === "indoor" ? "indoor" : "terrace";
  const selected = focused ? bookingTableIds(focused).filter((id) => String(id).startsWith(area === "indoor" ? "in-" : "tr-")) : [];
  document.getElementById("tables-count").textContent = `${active.length} booking${
    active.length === 1 ? "" : "s"
  } at ${timeText} · ${formatLongDate(state.selectedDate)}`;
  const floor = document.getElementById("tables-floor");
  floor.className = "layout-plan";
  const list = active.length
    ? active
        .map((row) => {
          const kind = layoutBookingKind(row);
          const on = String(row.id) === String(state.tablesFocusId);
          return `<button class="layout-booking is-${kind}${on ? " is-active" : ""}" type="button" data-tables-focus="${escapeHtml(
            String(row.id)
          )}">
            <span class="badge badge--${kind === "cooking" ? "event" : kind}">${escapeHtml(
              kind === "cooking" ? "Cooking class" : typeLabel(kind)
            )}</span>
            <strong>${escapeHtml(displayName(row))}</strong>
            <span>${escapeHtml(tableText(row))}</span>
            <span>${escapeHtml(slotRange(row))} · ${escapeHtml(statusLabel(row.status))}</span>
          </button>`;
        })
        .join("")
    : `<p class="muted">No bookings at ${escapeHtml(timeText)}.</p>`;
  const focusMeta = focused
    ? `<div class="picked">
        <h3>${escapeHtml(tableText(focused))}</h3>
        <p>${escapeHtml(displayName(focused))} · ${escapeHtml(
          layoutBookingKind(focused) === "cooking" ? "Cooking class" : typeLabel(layoutBookingKind(focused))
        )}</p>
      </div>
      <dl class="picked__meta">
        <div><dt>Guests</dt><dd>${escapeHtml(displayGuests(focused))}</dd></div>
        <div><dt>Slot</dt><dd>${escapeHtml(slotRange(focused))}</dd></div>
        <div><dt>Status</dt><dd>${escapeHtml(statusLabel(focused.status))}</dd></div>
      </dl>
      <button class="btn" type="button" data-open="${escapeHtml(openTarget(focused).slice(2))}">Open details</button>`
    : `<div class="picked">
        <h3>No booking selected</h3>
        <p>Tap a colour-coded table, or pick a booking from the list.</p>
      </div>`;
  floor.innerHTML = `<div class="plan__head">
      <div>
        <h3>Floor plan</h3>
        <p class="muted">Occupied tables at ${escapeHtml(timeText)} are colour-coded. Click a table or a booking to inspect it.</p>
      </div>
      <div class="plan__tabs" role="tablist" aria-label="Cafe area">
        <button type="button" class="plan-tab${area === "indoor" ? " is-active" : ""}" data-tables-area="indoor">Indoor</button>
        <button type="button" class="plan-tab${area === "terrace" ? " is-active" : ""}" data-tables-area="terrace">Terrace</button>
      </div>
    </div>
    <div class="plan__legend">
      <span><i class="swatch swatch--reservation"></i> Reservation</span>
      <span><i class="swatch swatch--birthday"></i> Birthday</span>
      <span><i class="swatch swatch--event"></i> Event</span>
      <span><i class="swatch swatch--cooking"></i> Cooking class</span>
    </div>
    <div class="plan__stage">
      <div class="plan__canvas" id="tables-canvas"></div>
      <aside class="plan__side">
        ${focusMeta}
        <div class="layout-bookings">${list}</div>
      </aside>
    </div>`;
  const pick = (tableId) => {
    const row = byTable.get(tableId);
    if (row) {
      state.tablesFocusId = String(row.id);
      state.tablesArea = bookingArea(row);
      renderTablesLayout();
      return;
    }
    const end = minutesToTime(Math.min(STAFF_DAY_END, state.tableMinutes + 120));
    openBlockModal({ tableIds: [tableId], start: timeText, end, date: state.selectedDate });
  };
    paintLayoutMap(document.getElementById("tables-canvas"), {
    area,
    selected,
    held: [...held],
    guests: 1,
    interactive: true,
    ignoreCapacity: true,
    heldNote: false,
    src: layoutImageSrc(area),
    heldKind: (id) => layoutBookingKind(byTable.get(id)),
    heldLabel: (id) => {
      const row = byTable.get(id);
      return row ? `${displayName(row)} · ${typeLabel(eventType(row))}` : "Already reserved";
    },
    onPick: pick,
  });
}

function renderTablesGrid() {
  const Map = window.TinyReserveMap;
  const tables = Map?.TABLES || [];
  const { dayStart, span, slots } = hourMarks();
  const rows = tableRowsOnDate(state.selectedDate);
  const hourLines = slots
    .map((slot) => {
      const left = ((slot.minutes - dayStart) / span) * 100;
      return `<span class="pms__hourline" style="left:${left}%"></span>`;
    })
    .join("");
  const hourLabels = slots
    .map((slot) => {
      const left = ((slot.minutes - dayStart) / span) * 100;
      return `<span class="pms__hour" style="left:${left}%">${escapeHtml(slot.label)}</span>`;
    })
    .join("");
  const floor = document.getElementById("tables-floor");
  floor.className = "pms";
  floor.innerHTML = `<div class="pms__hours">
      <div class="pms__label">Table</div>
      <div class="pms__track pms__track--hours">${hourLines}${hourLabels}</div>
    </div>${tables
      .map((table) => {
        const items = rows
          .filter((row) => (row.payload?.reservation?.tableIds || []).includes(table.id))
          .map((row) => {
            const box = clampOccupy(rowOccupy(row) || { start: dayStart, end: dayStart + 60 }, dayStart, span);
            return `<button class="pms__item ${visualClass(row)}" type="button" data-open="${escapeHtml(
              openTarget(row).slice(2)
            )}" style="left:${box.left}%;width:${box.width}%">${escapeHtml(timeLabel(row.party_time))} ${escapeHtml(
              displayName(row)
            )}</button>`;
          })
          .join("");
        return `<div class="pms__row">
        <div class="pms__label">${table.area === "indoor" ? "In" : "Tr"} ${table.number}</div>
        <div class="pms__track" data-table="${escapeHtml(table.id)}">${hourLines}${items}</div>
      </div>`;
      })
      .join("")}`;
  document.getElementById("tables-count").textContent = `${rows.length} booking${
    rows.length === 1 ? "" : "s"
  } on ${formatLongDate(state.selectedDate)}`;
}

function renderTables() {
  syncFilterInputs();
  const timeWrap = document.getElementById("tables-time-wrap");
  const toolbar = document.querySelector("#tables-view .tables-toolbar");
  if (timeWrap) timeWrap.hidden = state.tablesMode !== "layout";
  if (toolbar) toolbar.classList.toggle("tables-toolbar--layout", state.tablesMode === "layout");
  const toggle = document.getElementById("tables-view-toggle");
  if (toggle) toggle.textContent = state.tablesMode === "layout" ? "View grid" : "View layout";
  if (state.tablesMode === "layout") renderTablesLayout();
  else renderTablesGrid();
}

function guestKey(row) {
  const phone = String(row.phone || "").replace(/\D/g, "");
  const email = String(row.email || "").trim().toLowerCase();
  if (phone) return `p:${phone}`;
  if (email) return `e:${email}`;
  return `id:${row.id}`;
}

function customerName(row) {
  return (
    row.contact_name ||
    row.payload?.reservation?.name ||
    row.payload?.event?.name ||
    row.child_name ||
    "Guest"
  );
}

function splitPhone(raw) {
  let digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return { code: "", national: "" };
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (/^8\d{7,12}$/.test(digits)) digits = `62${digits}`;
  const codes = [
    "971", "966", "886", "852", "353", "351", "234", "254", "972", "974", "973", "968", "965", "961",
    "62", "61", "65", "60", "66", "63", "81", "82", "84", "86", "91", "92", "94", "44", "49", "33",
    "31", "32", "34", "39", "41", "43", "45", "46", "47", "48", "36", "30", "90", "27", "20", "64", "1", "7",
  ].sort((a, b) => b.length - a.length);
  const code = codes.find((item) => digits.startsWith(item));
  if (!code) return { code: "", national: digits };
  return { code: `+${code}`, national: digits.slice(code.length) };
}

function isCompletedVisit(row) {
  if (row.status === "closed") return true;
  return row.status === "booked" && Boolean(row.party_date) && row.party_date < todayIso();
}

function isPaidInFull(row) {
  const payment = row.payload?.payment || {};
  return payment.deposit?.status === "paid" && payment.balance?.status === "paid";
}

function customerRecords() {
  const groups = new Map();
  state.rows
    .slice()
    .sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")))
    .forEach((row) => {
      const key = guestKey(row);
      if (!groups.has(key)) {
        const phoneParts = splitPhone(row.phone);
        groups.set(key, {
          key,
          name: customerName(row),
          phone: row.phone || "",
          email: row.email || "",
          countryCode: phoneParts.code,
          nationalPhone: phoneParts.national,
          types: new Set(),
          birthdayDate: "",
          visits: [],
        });
      }
      const guest = groups.get(key);
      if (!guest.name || guest.name === "Guest") guest.name = customerName(row);
      if (!guest.phone && row.phone) {
        guest.phone = row.phone;
        const phoneParts = splitPhone(row.phone);
        guest.countryCode = phoneParts.code;
        guest.nationalPhone = phoneParts.national;
      }
      if (!guest.email && row.email) guest.email = row.email;
      guest.types.add(eventType(row));
      if (eventType(row) === "birthday" && row.party_date && row.party_date > (guest.birthdayDate || "")) {
        guest.birthdayDate = row.party_date;
      }
      guest.visits.push(row);
    });
  return [...groups.values()];
}

function usageTypesLabel(guest) {
  return ["birthday", "reservation", "event"]
    .filter((type) => guest.types.has(type))
    .map(typeLabel)
    .join(", ");
}

function renderCustomers() {
  syncFilterInputs();
  const filters = state.customerFilters;
  const guests = customerRecords().filter((guest) => {
    if (filters.name && !String(guest.name || "").toLowerCase().includes(filters.name.toLowerCase())) return false;
    if (filters.country && guest.countryCode !== filters.country) return false;
    if (filters.phone && !`${guest.nationalPhone} ${guest.phone}`.includes(filters.phone.replace(/\s/g, ""))) return false;
    if (filters.email && !String(guest.email || "").toLowerCase().includes(filters.email.toLowerCase())) return false;
    if (filters.type !== "all" && !guest.types.has(filters.type)) return false;
    return true;
  });
  const allGuests = customerRecords();
  const completed = state.rows.filter(isCompletedVisit).length;
  const stats = document.getElementById("customers-stats");
  if (stats) {
    stats.innerHTML = `<article class="member-stat">
        <div><span>Total members</span><strong>${allGuests.length}</strong></div>
      </article>
      <article class="member-stat">
        <div><span>No. completed</span><strong>${completed}</strong></div>
      </article>`;
  }
  const countrySelect = document.getElementById("customers-filter-country");
  if (countrySelect) {
    const current = filters.country;
    const codes = [...new Set(allGuests.map((guest) => guest.countryCode).filter(Boolean))].sort();
    countrySelect.innerHTML = `<option value="">All codes</option>${codes
      .map((code) => `<option value="${escapeHtml(code)}"${code === current ? " selected" : ""}>${escapeHtml(code)}</option>`)
      .join("")}`;
  }
  const list = document.getElementById("customers-list");
  if (!list) return;
  list.innerHTML = guests.length
    ? guests
        .map((guest, index) => {
          const types = usageTypesLabel(guest) || "—";
          return `<tr class="member-row" data-customer="${escapeHtml(guest.key)}">
            <td>${index + 1}</td>
            <td>${escapeHtml(guest.name || "Guest")}</td>
            <td>${escapeHtml(guest.countryCode || "—")}</td>
            <td>${escapeHtml(guest.nationalPhone || guest.phone || "—")}</td>
            <td>${escapeHtml(guest.email || "—")}</td>
            <td>${escapeHtml(guest.birthdayDate ? formatShortDate(guest.birthdayDate) : "—")}</td>
            <td><span class="usage-pill">${escapeHtml(types)}</span></td>
            <td class="member-actions">
              <button class="btn btn--outline" type="button" data-delete-customer="${escapeHtml(guest.key)}">Delete</button>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="8" class="muted">No matching guests.</td></tr>`;
}

function visitGroupLabel(type) {
  if (type === "reservation") return "Reservations";
  if (type === "event") return "Event bookings";
  return "Birthdays";
}

function loadCustomer(key) {
  inboxViews.hidden = true;
  if (viewNav) viewNav.hidden = true;
  detailView.hidden = false;
  const guest = customerRecords().find((item) => item.key === key);
  if (!guest) {
    detailView.innerHTML = `<p class="status is-error">Guest not found.</p>
      <button class="btn btn--outline back" type="button" id="back-list">Back</button>`;
    document.getElementById("back-list")?.addEventListener("click", () => go("customers"));
    return;
  }
  const waDigits = String(guest.phone || "").replace(/\D/g, "");
  const wa = waDigits ? `https://wa.me/${waDigits}` : "";
  const groups = ["birthday", "reservation", "event"].map((type) => ({
    type,
    rows: guest.visits.filter((row) => eventType(row) === type),
  }));
  pageTitle.textContent = guest.name || "Customer";
  detailView.innerHTML = `
    <button class="btn btn--outline back" type="button" id="back-list">Back</button>
    <article class="detail">
      <h2>${escapeHtml(guest.name || "Guest")}</h2>
      <p class="muted">${escapeHtml([guest.countryCode, guest.nationalPhone || guest.phone, guest.email].filter(Boolean).join(" · ") || "No contact")}</p>
      <div class="contact-actions">
        ${guest.email ? `<a class="btn" href="mailto:${escapeHtml(guest.email)}">Email</a>` : ""}
        ${wa ? `<a class="btn" href="${escapeHtml(wa)}" target="_blank" rel="noopener">WhatsApp</a>` : ""}
        <button class="btn btn--outline" type="button" id="delete-customer">Delete customer</button>
      </div>
      ${groups
        .map((group) => {
          if (!group.rows.length) return "";
          return `<section>
            <h3>${escapeHtml(visitGroupLabel(group.type))}</h3>
            <ul class="customer-history">
              ${group.rows
                .map(
                  (row) => `<li>
                    <a href="${escapeHtml(openTarget(row))}">
                      <strong>${escapeHtml(row.public_code || displayName(row))}</strong>
                      <span>${escapeHtml(row.party_date ? formatShortDate(row.party_date) : "No date")} · ${escapeHtml(
                        timeLabel(row.party_time)
                      )} · ${escapeHtml(statusLabel(row.status))}</span>
                    </a>
                  </li>`
                )
                .join("")}
            </ul>
          </section>`;
        })
        .join("")}
    </article>
  `;
  document.getElementById("back-list")?.addEventListener("click", () => go("customers"));
  document.getElementById("delete-customer")?.addEventListener("click", () => {
    deleteCustomer(guest.key).catch((err) => window.alert(err.message || "Could not delete customer."));
  });
}

async function deleteCustomer(key) {
  const guest = customerRecords().find((item) => item.key === key);
  if (!guest) {
    window.alert("Guest not found.");
    return;
  }
  const count = guest.visits.length;
  const label = guest.name || "this guest";
  if (
    !window.confirm(
      `Delete ${label} and ${count} booking${count === 1 ? "" : "s"}? This cannot be undone.`
    )
  ) {
    return;
  }
  const ids = guest.visits.map((row) => row.id).filter(Boolean);
  if (!ids.length) return;
  const { error } = await supabase.from("requests").delete().in("id", ids);
  if (error) throw error;
  await loadRows();
  showInbox("customers");
  if (location.hash !== "#/customers") go("customers");
}

function reservationEditorHtml(row, reservation) {
  const purpose = reservation.purpose || "";
  const purposes =
    purpose && !RESERVE_PURPOSES.includes(purpose) ? [purpose, ...RESERVE_PURPOSES] : RESERVE_PURPOSES;
  const kids = row.guest_kids ?? reservation.kids ?? 0;
  const adults = row.guest_adults ?? reservation.adults ?? 0;
  const time = String(row.party_time || "").slice(0, 5);
  return `<section>
          <h3>Reservation</h3>
          <p class="muted">Change any detail and save. Confirmed bookings update Google Calendar.</p>
          <label class="field"><span>Guest / name</span><input id="reserve-edit-name" value="${escapeHtml(
            row.contact_name || reservation.name || ""
          )}"></label>
          <div class="field-row">
            <label class="field"><span>Email</span><input type="email" id="reserve-edit-email" value="${escapeHtml(
              row.email || ""
            )}"></label>
            <label class="field"><span>WhatsApp</span><input type="tel" id="reserve-edit-phone" value="${escapeHtml(
              row.phone || ""
            )}"></label>
          </div>
          <div class="field-row">
            <label class="field"><span>Date</span><input type="date" id="reserve-edit-date" value="${escapeHtml(
              row.party_date || ""
            )}"></label>
            <label class="field"><span>Time</span><input type="time" id="reserve-edit-time" value="${escapeHtml(
              time
            )}"></label>
          </div>
          <p class="muted">Held ${escapeHtml(slotRange(row))} (30 min before and after). Arrive by ${escapeHtml(
            arriveBy(row)
          )} or the table is released.</p>
          <div class="field-row">
            <label class="field"><span>Kids</span><input type="number" min="0" id="reserve-edit-kids" value="${escapeHtml(
              kids
            )}"></label>
            <label class="field"><span>Adults</span><input type="number" min="0" id="reserve-edit-adults" value="${escapeHtml(
              adults
            )}"></label>
          </div>
          <label class="field"><span>Purpose</span>
            <select id="reserve-edit-purpose">
              <option value="">Select reservation purpose</option>
              ${purposes
                .map(
                  (item) =>
                    `<option value="${escapeHtml(item)}"${item === purpose ? " selected" : ""}>${escapeHtml(
                      item
                    )}</option>`
                )
                .join("")}
            </select>
          </label>
          <label class="field"><span>Notes</span><textarea id="reserve-edit-notes" rows="3" maxlength="120">${escapeHtml(
            reservation.notes || ""
          )}</textarea></label>
          <h3>Tables</h3>
          <p class="muted">Click tables to assign this reservation. Selected tables stay highlighted.</p>
          <p class="muted" id="reserve-table-label"></p>
          <div class="staff-plans tables-floor">
            <div><h3>Indoor</h3><div class="staff-plan" id="reserve-indoor"></div></div>
            <div><h3>Terrace</h3><div class="staff-plan" id="reserve-terrace"></div></div>
          </div>
          <button class="btn" type="button" id="save-reservation">Save reservation</button>
          <p class="status" id="reserve-status"></p>
        </section>`;
}

function renderReservationMaps() {
  const pick = (id) => {
    if (reservationSelectedTables.has(id)) reservationSelectedTables.delete(id);
    else reservationSelectedTables.add(id);
    renderReservationMaps();
  };
  paintLayoutMap(document.getElementById("reserve-indoor"), {
    area: "indoor",
    selected: [...reservationSelectedTables].filter((id) => String(id).startsWith("in-")),
    held: [],
    guests: 1,
    interactive: true,
    ignoreCapacity: true,
    onPick: pick,
  });
  paintLayoutMap(document.getElementById("reserve-terrace"), {
    area: "terrace",
    selected: [...reservationSelectedTables].filter((id) => String(id).startsWith("tr-")),
    held: [],
    guests: 1,
    interactive: true,
    ignoreCapacity: true,
    onPick: pick,
  });
  const Map = window.TinyReserveMap;
  const summary = document.getElementById("reserve-table-label");
  if (summary) {
    const tables = [...reservationSelectedTables].map((id) => Map?.findTable?.(id)).filter(Boolean);
    summary.textContent = tables.length
      ? Map.tableLabel(tables)
      : "No tables assigned yet. Click a table on the plan to assign it.";
  }
}

async function persistReservation(row) {
  const statusEl = document.getElementById("reserve-status");
  const name = document.getElementById("reserve-edit-name")?.value.trim() || "";
  const email = document.getElementById("reserve-edit-email")?.value.trim() || "";
  const phone = document.getElementById("reserve-edit-phone")?.value.trim() || "";
  const date = document.getElementById("reserve-edit-date")?.value || "";
  let time = document.getElementById("reserve-edit-time")?.value || "";
  const kids = Number(document.getElementById("reserve-edit-kids")?.value) || 0;
  const adults = Number(document.getElementById("reserve-edit-adults")?.value) || 0;
  const purpose = document.getElementById("reserve-edit-purpose")?.value || "";
  const notes = document.getElementById("reserve-edit-notes")?.value.trim() || "";
  if (!name || !date || !time) {
    if (statusEl) {
      statusEl.textContent = "Name, date and time are required.";
      statusEl.className = "status is-error";
    }
    return;
  }
  if (time.length === 5) time = `${time}:00`;
  const Map = window.TinyReserveMap;
  const tableIds = [...reservationSelectedTables];
  const tables = tableIds.map((id) => Map?.findTable?.(id)).filter(Boolean);
  const tableLabel = tables.length ? Map.tableLabel(tables) : "";
  const area = tables[0]?.area || row.payload?.reservation?.area || "";
  const timeText = timeLabel(time);
  const reservation = {
    ...(row.payload?.reservation || {}),
    name,
    purpose,
    notes,
    guests: kids + adults,
    kids,
    adults,
    area,
    tableIds,
    tableNumbers: tables.map((table) => table.number),
    tableLabel,
    slotMinutes: Map?.SLOT_MINUTES,
    graceMinutes: Map?.GRACE_MINUTES,
    occupyBefore: Map?.RES_BEFORE,
    occupyAfter: Map?.RES_AFTER,
    occupyLabel: Map?.occupyLabel?.(timeText, "reservation") || "",
    holdUntil: Map?.graceLabel?.(timeText) || "",
  };
  const payload = {
    ...(row.payload || {}),
    party: {
      ...(row.payload?.party || {}),
      date,
      time: timeText,
      guestAdults: adults,
      guestKids: kids,
    },
    reservation,
  };
  if (statusEl) {
    statusEl.textContent = "Saving…";
    statusEl.className = "status";
  }
  const { error } = await supabase
    .from("requests")
    .update({
      contact_name: name,
      email: email || null,
      phone: phone || null,
      party_date: date,
      party_time: time,
      guest_kids: kids,
      guest_adults: adults,
      package_name: tableLabel || row.package_name,
      staff_notes: document.getElementById("staff-notes")?.value ?? row.staff_notes ?? "",
      payload,
    })
    .eq("id", row.id)
    .eq("source", "reservation");
  if (error) {
    if (statusEl) {
      statusEl.textContent = error.message;
      statusEl.className = "status is-error";
    }
    return;
  }
  await loadRows();
  await loadDetail(row.id);
  const saved = document.getElementById("reserve-status");
  const currentStatus = document.getElementById("status-select")?.value || row.status;
  if (saved) {
    saved.textContent =
      currentStatus === "booked"
        ? "Reservation saved. Confirmed booking updated in Google Calendar."
        : "Reservation saved.";
    saved.className = "status is-success";
  }
}

function birthdayPaymentRows() {
  return state.rows
    .filter((row) => eventType(row) === "birthday")
    .slice()
    .sort((a, b) => String(b.party_date || b.created_at || "").localeCompare(String(a.party_date || a.created_at || "")));
}

function renderPayments() {
  syncFilterInputs();
  const filter = document.getElementById("payments-filter");
  if (filter) filter.value = state.paymentFilter;
  const rows = birthdayPaymentRows().filter((row) => {
    if (state.paymentFilter === "paid") return isPaidInFull(row);
    if (state.paymentFilter === "pending") return !isPaidInFull(row);
    return true;
  });
  const count = document.getElementById("payments-count");
  if (count) {
    count.textContent = `${rows.length} birthday${rows.length === 1 ? "" : "s"}`;
  }
  const list = document.getElementById("payments-list");
  if (!list) return;
  list.innerHTML = rows.length
    ? rows
        .map((row, index) => {
          const amounts = paymentAmounts(row);
          const paid = isPaidInFull(row);
          return `<tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(displayName(row))}</td>
            <td>${escapeHtml(row.party_date ? formatShortDate(row.party_date) : "—")}</td>
            <td>${escapeHtml(formatIdr(amounts.total))}</td>
            <td>${escapeHtml(statusLabel(row.status))}</td>
            <td><span class="usage-pill${paid ? " usage-pill--paid" : " usage-pill--pending"}">${
              paid ? "Paid" : "Payment pending"
            }</span></td>
            <td class="member-actions">
              <a class="btn btn--outline" href="#/payment/${escapeHtml(row.id)}">Track</a>
              <a class="btn" href="#/invoice/${escapeHtml(row.id)}">Invoice</a>
            </td>
          </tr>`;
        })
        .join("")
    : `<tr><td colspan="7" class="muted">No matching birthdays.</td></tr>`;
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

function eventPricingTotals(price, includeService, includeTax) {
  const base = Math.max(0, Math.round(Number(price) || 0));
  const service = includeService ? Math.round(base * 0.05) : 0;
  const tax = includeTax ? Math.round((base + service) * 0.1) : 0;
  return {
    currency: "IDR",
    price: base,
    includeService: Boolean(includeService),
    includeTax: Boolean(includeTax),
    service,
    tax,
    total: base + service + tax,
  };
}

function eventPricingFromRow(row) {
  const stored = row?.payload?.event?.pricing;
  if (stored && (Number(stored.total) || Number(stored.price))) {
    return eventPricingTotals(stored.price, stored.includeService, stored.includeTax);
  }
  if (row?.quote_total_idr) {
    return eventPricingTotals(
      row.quote_subtotal_idr ?? row.quote_total_idr,
      Boolean(row.quote_service_idr),
      Boolean(row.quote_tax_idr)
    );
  }
  return null;
}

function readEventPricing() {
  return eventPricingTotals(
    document.getElementById("event-price")?.value,
    document.getElementById("event-add-service")?.checked,
    document.getElementById("event-add-tax")?.checked
  );
}

function eventPricingHtml(pricing) {
  if (!pricing?.price) return `<p class="muted">Enter a price in IDR. Tax and service are optional.</p>`;
  return `<ul class="kv">
    <li><span>Price</span><span>${escapeHtml(formatIdr(pricing.price))}</span></li>
    ${
      pricing.includeService
        ? `<li><span>Service 5%</span><span>${escapeHtml(formatIdr(pricing.service))}</span></li>`
        : ""
    }
    ${
      pricing.includeTax
        ? `<li><span>Tax 10%</span><span>${escapeHtml(formatIdr(pricing.tax))}</span></li>`
        : ""
    }
    <li class="is-total"><span>Total</span><span>${escapeHtml(formatIdr(pricing.total))}</span></li>
  </ul>`;
}

function refreshEventPricingPreview() {
  const host = document.getElementById("event-pricing-preview");
  if (host) host.innerHTML = eventPricingHtml(readEventPricing());
}

function fillEventPricing(pricing = {}) {
  const priceInput = document.getElementById("event-price");
  const serviceInput = document.getElementById("event-add-service");
  const taxInput = document.getElementById("event-add-tax");
  if (priceInput) priceInput.value = pricing.price ? String(pricing.price) : "";
  if (serviceInput) serviceInput.checked = Boolean(pricing.includeService);
  if (taxInput) taxInput.checked = Boolean(pricing.includeTax);
  refreshEventPricingPreview();
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
  document.getElementById("event-about").value = opts.about || "";
  document.getElementById("event-promo").value = opts.promo || "";
  document.getElementById("event-notes").value = opts.notes || "";
  document.getElementById("event-photos").value = "";
  document.getElementById("event-repeat").value = opts.repeat?.freq || "none";
  document.getElementById("event-until").value = opts.repeat?.until || "";
  const payment = opts.payment === "vendor" ? "vendor" : "tiny";
  document.querySelectorAll('input[name="event-payment"]').forEach((input) => {
    input.checked = input.value === payment;
  });
  fillEventPricing(opts.pricing || {});
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
  const about = document.getElementById("event-about")?.value.trim() || "";
  const promo = document.getElementById("event-promo")?.value.trim() || "";
  const notes = document.getElementById("event-notes")?.value.trim() || "";
  const payment = document.querySelector('input[name="event-payment"]:checked')?.value || "tiny";
  const pricing = readEventPricing();
  const hasPricing = pricing.price > 0;
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
      about,
      promo,
      notes,
      location,
      fullTerrace: location === "service" && fullTerrace,
      payment,
      pricing: hasPricing ? pricing : null,
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
        quote_subtotal_idr: hasPricing ? pricing.price : null,
        quote_service_idr: hasPricing ? pricing.service : null,
        quote_tax_idr: hasPricing ? pricing.tax : null,
        quote_total_idr: hasPricing ? pricing.total : null,
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
        quote_subtotal_idr: hasPricing ? pricing.price : null,
        quote_service_idr: hasPricing ? pricing.service : null,
        quote_tax_idr: hasPricing ? pricing.tax : null,
        quote_total_idr: hasPricing ? pricing.total : null,
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

async function loadPartyCatalog() {
  if (partyCatalog) return partyCatalog;
  const res = await fetch("../birthdays/builder/data/party.json");
  if (!res.ok) throw new Error("Could not load birthday add-ons.");
  partyCatalog = await res.json();
  return partyCatalog;
}

function catalogAddItems(catalog, kids = 1) {
  const extras = catalog?.extras || {};
  const items = [];
  const push = (group, item, price, qty = 1) => {
    if (!item) return;
    items.push({
      group,
      id: item.id,
      label: item.name,
      price: Number(price) || 0,
      qty,
    });
  };
  (extras.entertainment || []).forEach((item) => {
    if (item.options) {
      item.options.forEach((opt) => push("Entertainment", opt, opt.priceValue));
    } else {
      push("Entertainment", item, item.priceValue);
    }
  });
  (extras.decoration || []).forEach((item) => push("Decoration add-ons", item, item.priceValue));
  (extras.cake || []).forEach((item) => push("Extra cake", item, item.priceValue));
  (catalog?.masterclasses || []).forEach((item) =>
    push("Masterclass", item, item.pricePerKid, Math.max(Number(kids) || 1, item.minKids || 1))
  );
  if (catalog?.extraGuest) {
    push("Extra guests", { id: "extra-guest-wd", name: "Extra guest (weekday)" }, catalog.extraGuest.weekday);
    push("Extra guests", { id: "extra-guest-we", name: "Extra guest (weekend)" }, catalog.extraGuest.weekend);
  }
  return items;
}

function quoteAddPanelHtml(catalog, kids) {
  const groups = {};
  catalogAddItems(catalog, kids).forEach((item) => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });
  const blocks = Object.entries(groups)
    .map(
      ([group, items]) => `<div class="quote-add-group">
        <h4>${escapeHtml(group)}</h4>
        ${items
          .map(
            (item) =>
              `<button class="btn btn--outline quote-add-choice" type="button" data-add-item data-label="${escapeHtml(
                item.label
              )}" data-price="${escapeHtml(item.price)}" data-qty="${escapeHtml(item.qty)}">${escapeHtml(
                item.label
              )} · ${item.price ? escapeHtml(formatIdr(item.price)) : "price TBC"}</button>`
          )
          .join("")}
      </div>`
    )
    .join("");
  return `<div class="quote-add-panel" id="quote-add-panel" hidden>
    <p class="muted">Pick a birthday add-on or entertainment extra, or enter a custom item and price.</p>
    ${blocks || "<p class='muted'>Catalogue could not be loaded.</p>"}
    <div class="quote-add-custom">
      <input type="text" id="custom-item-label" placeholder="Custom item">
      <input type="number" id="custom-item-price" min="0" step="1000" placeholder="Price">
      <input type="number" id="custom-item-qty" min="1" step="1" value="1" aria-label="Qty">
      <button class="btn" type="button" id="custom-item-add">Add custom</button>
    </div>
  </div>`;
}

function insertQuoteLine(line) {
  const editor = document.getElementById("quote-editor");
  if (!editor) return;
  editor.insertAdjacentHTML("beforeend", quoteLineHtml(line));
  refreshQuoteTotals();
}

function closeDecorBuilder() {
  const overlay = document.getElementById("decor-builder-overlay");
  if (!overlay) return;
  overlay.hidden = true;
  const frame = overlay.querySelector("iframe");
  if (frame) frame.src = "about:blank";
}

function openDecorBuilder(requestId) {
  let overlay = document.getElementById("decor-builder-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "decor-builder-overlay";
    overlay.className = "builder-overlay";
    overlay.innerHTML = `<div class="builder-overlay__bar">
      <span>Decoration builder</span>
      <button class="btn btn--outline" type="button" id="close-decor-builder">Close</button>
    </div>
    <iframe title="Decoration builder"></iframe>`;
    document.body.appendChild(overlay);
    overlay.querySelector("#close-decor-builder")?.addEventListener("click", closeDecorBuilder);
  }
  overlay.hidden = false;
  overlay.querySelector("iframe").src = `../birthdays/builder/index.html?staffRequest=${encodeURIComponent(requestId)}#decor`;
}

window.addEventListener("message", (event) => {
  if (event.origin !== location.origin) return;
  if (event.data?.type !== "tiny-staff-decor-saved") return;
  closeDecorBuilder();
  if (event.data.id) loadInvoice(event.data.id);
});

function quoteLineHtml(line = {}) {
  const qty = Number(line.qty) || 1;
  const price = Number(line.price ?? line.value) || 0;
  return `<div class="quote-line">
    <input class="quote-line-item" type="text" name="quote-label" value="${escapeHtml(line.label || "")}" placeholder="Item">
    <input class="quote-line-qty" type="number" name="quote-qty" min="1" step="1" value="${qty}" aria-label="Qty" placeholder="Qty">
    <input class="quote-line-price" type="number" name="quote-price" min="0" step="1000" value="${price}" aria-label="Unit price" placeholder="Unit price">
    <span class="quote-line-total">${escapeHtml(formatIdr(qty * price))}</span>
    <button class="btn btn--outline quote-line-remove" type="button" data-remove-line>Remove</button>
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

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Could not read image."));
    reader.readAsDataURL(blob);
  });
}

async function inlineImages(root) {
  const images = [...root.querySelectorAll("img")];
  await Promise.all(
    images.map(async (img) => {
      const src = img.getAttribute("src") || "";
      if (!src || src.startsWith("data:")) return;
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error("Image request failed.");
        img.src = await blobToDataUrl(await response.blob());
      } catch {
        img.remove();
      }
    })
  );
}

function pdfResultToBlob(result) {
  if (result instanceof Blob) {
    if (!result.size) throw new Error("PDF file was empty.");
    return result.type ? result : new Blob([result], { type: "application/pdf" });
  }
  if (result instanceof ArrayBuffer) return new Blob([result], { type: "application/pdf" });
  if (typeof result === "string") {
    const payload = result.includes(",") ? result.split(",")[1] : result;
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    if (!bytes.length) throw new Error("PDF file was empty.");
    return new Blob([bytes], { type: "application/pdf" });
  }
  throw new Error("PDF library returned an empty file.");
}

async function htmlToPdfBlob(element, filename) {
  if (!window.html2pdf) throw new Error("PDF library did not load.");
  await inlineImages(element);
  const sheets = [...document.styleSheets];
  const disabled = sheets.map((sheet) => sheet.disabled);
  sheets.forEach((sheet) => {
    sheet.disabled = true;
  });
  try {
    const result = await window
      .html2pdf()
      .set({
        margin: 12,
        filename,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          onclone: (doc) => {
            doc.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => node.remove());
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .outputPdf("blob");
    return pdfResultToBlob(result);
  } finally {
    sheets.forEach((sheet, index) => {
      sheet.disabled = disabled[index];
    });
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function loadScriptOnce(src, ready) {
  if (ready()) return Promise.resolve();
  const existing = document.querySelector(`script[data-pdf-lib="${src}"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      if (ready()) {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load PDF tools.")), { once: true });
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.pdfLib = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load PDF tools."));
    document.head.appendChild(script);
  });
}

async function loadCanvasPdfLibs() {
  await loadScriptOnce(
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    () => typeof window.html2canvas === "function"
  );
  await loadScriptOnce(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    () => !!(window.jspdf && window.jspdf.jsPDF)
  );
  if (typeof window.html2canvas !== "function" || !window.jspdf?.jsPDF) {
    throw new Error("PDF tools did not load.");
  }
}

function quoteAsset(file) {
  return new URL(`../../birthdays/builder/img/quote/${file}`, import.meta.url).href;
}

function ensureInvoicePdfStyles() {
  if (document.getElementById("invoice-pdf-styles")) return;
  const style = document.createElement("style");
  style.id = "invoice-pdf-styles";
  style.textContent = `
.quote-pdf-root { box-sizing: border-box; width: 794px; margin: 0; padding: 0; color: #5f7367 !important; background: #fffaf6; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; }
.quote-pdf-root *, .quote-pdf-root *::before, .quote-pdf-root *::after { box-sizing: border-box; }
.quote-pdf-root .qp-page { width: 794px; height: 1123px; padding: 68px 68px 82px; position: relative; overflow: hidden; background: #fffaf6; color: #5f7367 !important; }
.quote-pdf-root .qp-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 28px; }
.quote-pdf-root .qp-logo { width: 58px; height: auto; display: block; }
.quote-pdf-root .qp-title { margin: 0; text-align: right; font-size: 34px; line-height: 1.05; font-weight: 600; color: #7a9a86 !important; }
.quote-pdf-root .qp-meta { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 18px 24px; margin-bottom: 34px; font-size: 14px; line-height: 1.7; color: #5f7367 !important; }
.quote-pdf-root .qp-meta-left div, .quote-pdf-root .qp-meta-right div { margin: 0 0 2px; }
.quote-pdf-root .qp-meta strong { font-weight: 600; }
.quote-pdf-root table.qp-items { width: 100%; border-collapse: collapse; font-size: 13px; color: #5f7367 !important; }
.quote-pdf-root table.qp-items thead th { text-align: left; font-weight: 600; color: #7a9a86 !important; padding: 0 8px 10px 0; border-bottom: 1.5px solid #5f7367; }
.quote-pdf-root table.qp-items .qp-num, .quote-pdf-root table.qp-items .qp-qty { text-align: right; white-space: nowrap; }
.quote-pdf-root table.qp-items .qp-qty { width: 48px; padding-left: 12px; }
.quote-pdf-root table.qp-items .qp-num { width: 120px; }
.quote-pdf-root table.qp-items tbody td { padding: 11px 8px 11px 0; vertical-align: top; border-bottom: 1px solid rgba(95, 115, 103, 0.18); color: #5f7367 !important; }
.quote-pdf-root .qp-note { margin-top: 3px; font-size: 11px; color: rgba(95, 115, 103, 0.72) !important; line-height: 1.4; }
.quote-pdf-root .qp-totals-wrap { margin-top: 18px; display: flex; justify-content: flex-end; }
.quote-pdf-root .qp-totals { width: 270px; font-size: 14px; color: #5f7367 !important; }
.quote-pdf-root .qp-totals-row { display: flex; justify-content: space-between; gap: 18px; padding: 5px 0; }
.quote-pdf-root .qp-totals-row.is-grand { margin-top: 8px; font-weight: 700; font-size: 16px; }
.quote-pdf-root .qp-totals-row.is-grand .qp-amount { border-bottom: 3px double #5f7367; padding-bottom: 2px; }
.quote-pdf-root .qp-totals-row.is-dp { margin-top: 10px; font-weight: 600; }
.quote-pdf-root .qp-flowers { position: absolute; left: 46px; bottom: 38px; width: 180px; height: auto; pointer-events: none; }
.quote-pdf-root .qp-flowers--right { left: auto; right: 38px; width: 196px; }
.quote-pdf-root .qp-mockup { display: block; width: 100%; height: auto; margin-top: 4px; border-radius: 4px; }
.quote-pdf-root .qp-cake { display: block; width: auto; max-width: 420px; max-height: 520px; margin: 8px auto 0; border-radius: 4px; object-fit: contain; }
.quote-pdf-root .qp-rules-title { margin: 8px 0 18px; font-size: 18px; font-weight: 700; color: #5f7367 !important; }
.quote-pdf-root .qp-rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px; }
.quote-pdf-root .qp-rule h4 { margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #5f7367 !important; }
.quote-pdf-root .qp-rule p { margin: 0; font-size: 12px; line-height: 1.55; color: #5f7367 !important; }
.quote-pdf-root .qp-estimate { margin-top: 22px; font-size: 11px; color: rgba(95, 115, 103, 0.75) !important; max-width: 420px; }
`;
  document.head.appendChild(style);
}

function invoiceThemeLine(form, extras) {
  const decor = extras.decor || {};
  const parts = [];
  if (decor.themeLabel && decor.themeLabel !== "Not chosen yet") parts.push(decor.themeLabel);
  if ((decor.balloonColours || []).length) parts.push("custom balloon colours");
  if (decor.backdropName) parts.push(`name "${decor.backdropName}"`);
  if (form.cake?.theme) parts.push(form.cake.theme);
  else if (form.cake?.design) parts.push(form.cake.design);
  return parts.join(" · ");
}

function invoicePdfMarkup(form, row, extras) {
  const logoSrc = quoteAsset("logo-tiny.png");
  const flowers1 = quoteAsset("flowers-page1.png");
  const flowers2 = quoteAsset("flowers-page2.png");
  const kids = form.guest_kids || 0;
  const adults = form.guest_adults || 0;
  const header = `<div class="qp-header"><img class="qp-logo" src="${logoSrc}" alt="Tiny"><h1 class="qp-title">Birthday Bash<br>at Tiny</h1></div>`;
  const meta = `<div class="qp-meta">
    <div class="qp-meta-left">
      <div><strong>Name</strong> : ${escapeHtml(form.child_name || form.contact_name || "")}</div>
      <div><strong>Phone</strong> : ${escapeHtml(row.phone || "")}</div>
      <div><strong>Email</strong> : ${escapeHtml(row.email || "")}</div>
      <div><strong>Time</strong> : ${escapeHtml(timeLabel(form.party_time) === "—" ? "" : timeLabel(form.party_time))}</div>
      <div><strong>Total Pax</strong> : ${escapeHtml(`${kids} kids ${adults} adults`)}</div>
      <div><strong>Theme</strong> : ${escapeHtml(invoiceThemeLine(form, extras))}</div>
    </div>
    <div class="qp-meta-right"><div><strong>Date</strong> : ${escapeHtml(formatLongDate(form.party_date))}</div></div>
  </div>`;
  const rows = (form.quote.lines || [])
    .map((line) => {
      const qty = Number(line.qty) || 1;
      const total = Number(line.value) || qty * (Number(line.price) || 0);
      const unit = Number(line.price) || (qty ? Math.round(total / qty) : total);
      return `<tr>
        <td class="qp-details">${escapeHtml(line.label || "Item")}${line.detail ? `<div class="qp-note">${escapeHtml(line.detail)}</div>` : ""}</td>
        <td class="qp-num">${escapeHtml(formatIdr(unit))}</td>
        <td class="qp-qty">${escapeHtml(qty)}</td>
        <td class="qp-num">${escapeHtml(formatIdr(total))}</td>
      </tr>`;
    })
    .join("");
  const bank = form.quote.bank || {};
  const bankLine = [bank.bank, bank.accountName, bank.accountNumber].filter(Boolean).join(" · ");
  const pages = [`<div class="qp-page">${header}${meta}
    <table class="qp-items"><thead><tr><th>Details</th><th class="qp-num">Price</th><th class="qp-qty">Qty</th><th class="qp-num">Total</th></tr></thead>
    <tbody>${rows || `<tr><td class="qp-details">No items</td><td class="qp-num">—</td><td class="qp-qty">—</td><td class="qp-num">—</td></tr>`}</tbody></table>
    <div class="qp-totals-wrap"><div class="qp-totals">
      <div class="qp-totals-row"><span>Total :</span><span>${escapeHtml(formatIdr(form.quote.subtotal))}</span></div>
      <div class="qp-totals-row"><span>Service (+5%) :</span><span>${escapeHtml(formatIdr(form.quote.service))}</span></div>
      <div class="qp-totals-row"><span>Tax (+10%) :</span><span>${escapeHtml(formatIdr(form.quote.tax))}</span></div>
      <div class="qp-totals-row is-grand"><span>TOTAL:</span><span class="qp-amount">${escapeHtml(formatIdr(form.quote.total))}</span></div>
      <div class="qp-totals-row is-dp"><span>DP 30% :</span><span>${escapeHtml(formatIdr(form.quote.dp30))}</span></div>
    </div></div>
    <p class="qp-estimate">Estimate only — final quotation confirmed by Tiny. Items marked TBC are priced on request.${bankLine ? ` Bank transfer: ${escapeHtml(bankLine)}.` : ""}</p>
    <img class="qp-flowers" src="${flowers1}" alt="">
  </div>`, `<div class="qp-page">${header}${meta}
    <h2 class="qp-rules-title">Reservation Rules:</h2>
    <div class="qp-rules-grid">
      <div class="qp-rule"><h4>Hold Time for Reservations:</h4><p>Reservations will be held for a maximum of 20 minutes after the designated reservation time. If guests fail to arrive within this time frame, the reservation may be released to accommodate other diners.</p></div>
      <div class="qp-rule"><h4>Cancellation Policy:</h4><p>Guests are kindly requested to provide at least 24 hours notice for any cancellations or changes to their reservation. Failure to do so may result in a cancellation fee or restriction on future reservations. There is no refund for any cancellations.</p></div>
      <div class="qp-rule"><h4>Outside Food and Drinks:</h4><p>No outside food or drinks are permitted.</p></div>
      <div class="qp-rule"><h4>Service Charge and Taxes:</h4><p>All reservations are subject to a 5% service charge and a 10% tax, as per local regulations. Prices exclude service charge and taxes unless otherwise stated.</p></div>
      <div class="qp-rule"><h4>Availability and Capacity:</h4><p>Reservations are subject to availability and capacity limits.</p></div>
      <div class="qp-rule"><h4>Special Requests:</h4><p>Guests must ensure all special requests are communicated and provide mandatory details at least 4 days before the event.</p></div>
    </div>
    <img class="qp-flowers qp-flowers--right" src="${flowers2}" alt="">
  </div>`];
  if (extras.backdropUrl) {
    const colours = (extras.decor?.balloonColours || [])
      .map((colour) => colour.label || colour.hex)
      .filter(Boolean)
      .join(", ");
    pages.push(`<div class="qp-page">${header}${meta}
      <h2 class="qp-rules-title">Backdrop mockup</h2>
      <img class="qp-mockup" src="${escapeHtml(extras.backdropUrl)}" alt="Backdrop">
      <p class="qp-estimate">${escapeHtml([extras.decor?.backdropName ? `Name: ${extras.decor.backdropName}` : "", colours ? `Balloon colours: ${colours}` : "", form.decor?.notes || ""].filter(Boolean).join(". "))}</p>
    </div>`);
  }
  if (extras.cakeUrl) {
    const cakeBits = [form.cake?.size ? `Size ${form.cake.size}` : "", form.cake?.design || "", form.cake?.theme ? `Theme ${form.cake.theme}` : ""].filter(Boolean);
    pages.push(`<div class="qp-page">${header}${meta}
      <h2 class="qp-rules-title">Cake design</h2>
      <img class="qp-cake" src="${escapeHtml(extras.cakeUrl)}" alt="Cake design">
      <p class="qp-estimate">${escapeHtml(cakeBits.join(". ") || "Cake reference")}. Reference for Tiny — final cake may vary.</p>
    </div>`);
  }
  return pages.join("");
}

async function createInvoicePdfBlob(form, row, extras) {
  await loadCanvasPdfLibs();
  ensureInvoicePdfStyles();
  const host = document.createElement("div");
  host.id = "invoice-pdf-root";
  host.className = "quote-pdf-root";
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = "position:absolute;left:0;top:0;width:794px;z-index:2147483000;pointer-events:none;opacity:1;background:#fffaf6;";
  host.innerHTML = invoicePdfMarkup(form, row, extras);
  document.body.appendChild(host);
  const sheets = [...document.styleSheets];
  const disabled = sheets.map((sheet) => sheet.disabled);
  sheets.forEach((sheet) => {
    if (sheet.ownerNode?.id !== "invoice-pdf-styles") sheet.disabled = true;
  });
  try {
    await inlineImages(host);
    const images = [...host.querySelectorAll("img")];
    await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) resolve();
            else {
              img.onload = resolve;
              img.onerror = resolve;
            }
          })
      )
    );
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const pages = [...host.querySelectorAll(".qp-page")];
    if (!pages.length) throw new Error("No invoice pages to export");
    const JsPDF = window.jspdf.jsPDF;
    const pdf = new JsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    for (let i = 0; i < pages.length; i += 1) {
      const canvas = await window.html2canvas(pages[i], {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#fffaf6",
        scrollX: 0,
        scrollY: -window.scrollY,
        windowWidth: 794,
        logging: false,
        onclone: (doc) => {
          doc.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
            if (node.id !== "invoice-pdf-styles") node.remove();
          });
          const cloned = doc.getElementById("invoice-pdf-root");
          if (cloned) {
            cloned.style.position = "static";
            cloned.style.left = "0";
            cloned.style.top = "0";
            cloned.style.opacity = "1";
          }
        },
      });
      const img = canvas.toDataURL("image/jpeg", 0.98);
      if (i > 0) pdf.addPage();
      pdf.addImage(img, "JPEG", 0, 0, pageW, pageH, undefined, "FAST");
    }
    const blob = pdf.output("blob");
    if (!(blob instanceof Blob) || !blob.size) throw new Error("PDF file was empty.");
    return blob;
  } finally {
    sheets.forEach((sheet, index) => {
      sheet.disabled = disabled[index];
    });
    host.remove();
  }
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
  paintLayoutMap(document.getElementById("staff-detail-plan"), {
    area: "terrace",
    selected: ["tr-18", "tr-19"],
    held: [],
    guests: 1,
    interactive: false,
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
        ${
          isReservation
            ? reservationEditorHtml(row, reservation)
            : `<section>
          <h3>${isEvent ? "Event" : "Booking"}</h3>
          <ul class="kv">
            <li><span>${isEvent ? "Guest / name" : "Child"}</span><span>${escapeHtml(displayName(row))}${
                !isEvent && row.child_age ? ` · turning ${escapeHtml(row.child_age)}` : ""
              }</span></li>
            <li><span>Date</span><span>${escapeHtml(row.party_date || "—")}</span></li>
            <li><span>Time</span><span>${escapeHtml(slotRange(row))}</span></li>
            ${
              row.source === "party_builder"
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
          isEvent
            ? `<section>
          <h3>About event</h3>
          <p class="muted" style="margin-top:0">Customer-facing copy for the events site.</p>
          <p style="white-space:pre-wrap">${escapeHtml(payload.event?.about || "—")}</p>
        </section>
        <section>
          <h3>Promo</h3>
          <p class="muted" style="margin-top:0">Staff only.</p>
          <p style="white-space:pre-wrap">${escapeHtml(payload.event?.promo || "—")}</p>
        </section>`
            : ""
        }
        ${
          showLayout
            ? `<section>
          <h3>Table layout</h3>
          <div class="staff-plan" id="staff-detail-plan"></div>
        </section>`
            : ""
        }`
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
        ${
          isEvent && eventPricingFromRow(row)
            ? `<section>
          <h3>Pricing</h3>
          ${eventPricingHtml(eventPricingFromRow(row))}
        </section>`
            : ""
        }
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
          ${
            isReservation
              ? ""
              : `<p>${escapeHtml(payload.event?.notes || (payload.party && payload.party.foodNotes) || "No food notes")}</p>
          <p>${escapeHtml((payload.party && payload.party.notes) || "")}</p>`
          }
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

  if (isReservation) {
    reservationSelectedTables = new Set(tableIds);
    renderReservationMaps();
    document.getElementById("save-reservation")?.addEventListener("click", () => {
      persistReservation(row).catch((err) => {
        const statusEl = document.getElementById("reserve-status");
        if (statusEl) {
          statusEl.textContent = err.message || "Could not save reservation.";
          statusEl.className = "status is-error";
        }
      });
    });
  } else if (showLayout && window.TinyReserveMap) {
    paintLayoutMap(document.getElementById("staff-detail-plan"), {
      area: layoutArea === "terrace" ? "terrace" : "indoor",
      selected: tableIds,
      held: [],
      guests: row.guest_adults || reservation.guests || 1,
      interactive: false,
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
      about: event.about || "",
      promo: event.promo || "",
      notes: event.notes || reservation.notes || "",
      payment: event.payment || "tiny",
      tableIds: reservation.tableIds || [],
      guests: event.guests || [],
      repeat: event.repeat,
      pricing: event.pricing || eventPricingFromRow(row),
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
      about: event.about || "",
      promo: event.promo || "",
      notes: event.notes || reservation.notes || "",
      payment: event.payment || "tiny",
      tableIds: reservation.tableIds || [],
      guests: [...(event.guests || []), {}],
      repeat: event.repeat,
      pricing: event.pricing || eventPricingFromRow(row),
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
  const pick = (id) => {
    if (invoiceSelectedTables.has(id)) invoiceSelectedTables.delete(id);
    else invoiceSelectedTables.add(id);
    renderInvoiceMaps();
  };
  paintLayoutMap(document.getElementById("invoice-indoor"), {
    area: "indoor",
    selected: [...invoiceSelectedTables].filter((id) => String(id).startsWith("in-")),
    held: [],
    guests: 1,
    interactive: true,
    ignoreCapacity: true,
    onPick: pick,
  });
  paintLayoutMap(document.getElementById("invoice-terrace"), {
    area: "terrace",
    selected: [...invoiceSelectedTables].filter((id) => String(id).startsWith("tr-")),
    held: [],
    guests: 1,
    interactive: true,
    ignoreCapacity: true,
    onPick: pick,
  });
  const Map = window.TinyReserveMap;
  const summary = document.getElementById("invoice-table-label");
  if (summary) {
    const tables = [...invoiceSelectedTables].map((id) => Map?.findTable?.(id)).filter(Boolean);
    summary.textContent = tables.length
      ? Map.tableLabel(tables)
      : "No tables assigned yet. Click a table on the plan to assign it.";
  }
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
      notes: document.getElementById("invoice-decor-notes")?.value.trim() || "",
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
  const guests = payload.party?.guests || [];
  const payment = payload.payment || {};
  const amounts = paymentAmounts(row, quote);
  const catalog = await loadPartyCatalog().catch(() => null);
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
            ${(quote.lines?.length ? quote.lines : []).map(quoteLineHtml).join("")}
          </div>
          <button class="btn btn--outline" type="button" id="quote-add-line">Add item</button>
          ${quoteAddPanelHtml(catalog, row.guest_kids || 1)}
          <div id="quote-totals"></div>
          <label class="field"><span>Bank</span><input id="invoice-bank" value="${escapeHtml(quote.bank?.bank || BANK.bank)}"></label>
          <label class="field"><span>Account name</span><input id="invoice-account-name" value="${escapeHtml(quote.bank?.accountName || BANK.accountName)}"></label>
          <label class="field"><span>Account number</span><input id="invoice-account-number" value="${escapeHtml(quote.bank?.accountNumber || BANK.accountNumber)}"></label>
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
          </ul>
          ${backdropUrl ? `<img class="hero-img" src="${escapeHtml(backdropUrl)}" alt="Backdrop">` : ""}
          <label class="field"><span>Decoration notes</span><textarea id="invoice-decor-notes" rows="3">${escapeHtml(decor.notes || "")}</textarea></label>
          <button class="btn" type="button" id="edit-decoration">Edit decoration</button>
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
          <p class="muted">Click tables to assign this party. Selected tables stay highlighted.</p>
          <p class="muted" id="invoice-table-label"></p>
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
        <button class="btn btn--outline" type="button" id="download-invoice-pdf">Download PDF</button>
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
    const panel = document.getElementById("quote-add-panel");
    if (panel) panel.hidden = !panel.hidden;
  });
  document.getElementById("quote-add-panel")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-add-item]");
    if (!btn) return;
    insertQuoteLine({
      label: btn.dataset.label || "",
      price: Number(btn.dataset.price) || 0,
      qty: Number(btn.dataset.qty) || 1,
    });
    document.getElementById("quote-add-panel").hidden = true;
  });
  document.getElementById("custom-item-add")?.addEventListener("click", () => {
    const label = document.getElementById("custom-item-label")?.value.trim() || "";
    const price = Number(document.getElementById("custom-item-price")?.value) || 0;
    const qty = Number(document.getElementById("custom-item-qty")?.value) || 1;
    if (!label) return;
    insertQuoteLine({ label, price, qty });
    document.getElementById("custom-item-label").value = "";
    document.getElementById("custom-item-price").value = "";
    document.getElementById("custom-item-qty").value = "1";
    document.getElementById("quote-add-panel").hidden = true;
  });
  document.getElementById("edit-decoration")?.addEventListener("click", async () => {
    const ok = await persistInvoice(false);
    if (ok) openDecorBuilder(row.id);
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
    if (!statusEl) return false;
    statusEl.textContent = "Saving…";
    statusEl.className = "status";
    const form = readInvoiceForm(row);
    const nextPayload = {
      ...payload,
      quote: { ...quote, ...form.quote },
      cake: { ...cake, ...form.cake },
      decor: { ...decor, notes: form.decor.notes },
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
      if (cakeFile) nextFiles.cakePhoto = await uploadStaffFile(row.id, "cake", cakeFile);
      if (send) {
        const blob = await createInvoicePdfBlob(form, row, {
          decor: nextPayload.decor,
          cakeUrl,
          backdropUrl,
          payment: nextPayload.payment,
        });
        const path = `${row.id}/invoice.pdf`;
        const pdfFile = new File([blob], `${row.public_code}-invoice.pdf`, { type: "application/pdf" });
        const { error: uploadError } = await supabase.storage.from("request-files").upload(path, pdfFile, {
          contentType: "application/pdf",
          upsert: true,
        });
        if (uploadError) throw uploadError;
        nextFiles.invoicePdf = path;
        downloadBlob(pdfFile, `${row.public_code}-invoice.pdf`);
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
      return true;
    } catch (err) {
      statusEl.textContent = err.message || "Could not save invoice.";
      statusEl.className = "status is-error";
      return false;
    }
  }

  document.getElementById("save-invoice")?.addEventListener("click", () => persistInvoice(false));
  document.getElementById("download-invoice-pdf")?.addEventListener("click", async () => {
    const statusEl = document.getElementById("invoice-status");
    if (statusEl) {
      statusEl.textContent = "Preparing PDF…";
      statusEl.className = "status";
    }
    try {
      const form = readInvoiceForm(row);
      const blob = await createInvoicePdfBlob(form, row, {
        decor: { ...decor, notes: form.decor.notes },
        cakeUrl,
        backdropUrl,
        payment: readPaymentForm(form.quote.dp30, Math.max(0, form.quote.total - form.quote.dp30)),
      });
      downloadBlob(blob, `${row.public_code || "invoice"}-invoice.pdf`);
      if (statusEl) {
        statusEl.textContent = "PDF downloaded.";
        statusEl.className = "status is-success";
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = err.message || "Could not download PDF.";
        statusEl.className = "status is-error";
      }
    }
  });
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
  const customersView = document.getElementById("customers-view");
  if (customersView) customersView.hidden = view !== "customers";
  const paymentsView = document.getElementById("payments-view");
  if (paymentsView) paymentsView.hidden = view !== "payments";
  const note = document.getElementById("calendar-sync-note");
  if (note) note.hidden = view === "customers" || view === "payments";
  renderNav(view);
  if (view === "overview") renderOverview();
  if (view === "calendar") renderCalendar();
  if (view === "day") renderDay();
  if (view === "timeline") renderTimeline();
  if (view === "tables") renderTables();
  if (view === "events") renderEvents();
  if (view === "customers") renderCustomers();
  if (view === "payments") renderPayments();
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
  if (parsed.view === "customer") {
    try {
      await loadRows();
    } catch {
      /* show whatever is already cached */
    }
    renderNav(parsed.view);
    loadCustomer(parsed.id);
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
  const noshowBtn = e.target.closest("[data-noshow]");
  if (noshowBtn) {
    e.preventDefault();
    e.stopPropagation();
    markNoShow(noshowBtn.dataset.noshow)
      .then(() => showInbox("overview"))
      .catch((err) => window.alert(err.message || "Could not mark no-show."));
    return;
  }
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
  const deleteCustomerBtn = e.target.closest("[data-delete-customer]");
  if (deleteCustomerBtn) {
    e.preventDefault();
    e.stopPropagation();
    deleteCustomer(deleteCustomerBtn.dataset.deleteCustomer).catch((err) =>
      window.alert(err.message || "Could not delete customer.")
    );
    return;
  }
  const customerRow = e.target.closest("[data-customer]");
  if (customerRow) {
    e.preventDefault();
    go(`customer/${encodeURIComponent(customerRow.dataset.customer)}`);
    return;
  }
  const areaTab = e.target.closest("[data-tables-area]");
  if (areaTab) {
    e.preventDefault();
    state.tablesArea = areaTab.dataset.tablesArea === "indoor" ? "indoor" : "terrace";
    if (state.view === "tables") renderTables();
    return;
  }
  const focusBtn = e.target.closest("[data-tables-focus]");
  if (focusBtn) {
    e.preventDefault();
    state.tablesFocusId = focusBtn.dataset.tablesFocus || "";
    const row = occupiedAtTime(state.selectedDate, state.tableMinutes).find(
      (item) => String(item.id) === String(state.tablesFocusId)
    );
    if (row) state.tablesArea = bookingArea(row);
    if (state.view === "tables") renderTables();
    return;
  }
  const cell = e.target.closest("[data-date]");
  if (cell && cell.closest("#cal-grid")) {
    state.selectedDate = cell.dataset.date;
    go(`day/${cell.dataset.date}`);
    return;
  }
  const track = e.target.closest(".pms__track[data-table]");
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

document.getElementById("tables-view-toggle")?.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  state.tablesMode = state.tablesMode === "layout" ? "grid" : "layout";
  renderTables();
});

document.getElementById("customers-filter-name")?.addEventListener("input", (e) => {
  state.customerFilters.name = e.target.value || "";
  if (state.view === "customers") renderCustomers();
});
document.getElementById("customers-filter-country")?.addEventListener("change", (e) => {
  state.customerFilters.country = e.target.value || "";
  if (state.view === "customers") renderCustomers();
});
document.getElementById("customers-filter-phone")?.addEventListener("input", (e) => {
  state.customerFilters.phone = e.target.value || "";
  if (state.view === "customers") renderCustomers();
});
document.getElementById("customers-filter-email")?.addEventListener("input", (e) => {
  state.customerFilters.email = e.target.value || "";
  if (state.view === "customers") renderCustomers();
});
document.getElementById("customers-filter-type")?.addEventListener("change", (e) => {
  state.customerFilters.type = e.target.value || "all";
  if (state.view === "customers") renderCustomers();
});
document.getElementById("payments-filter")?.addEventListener("change", (e) => {
  state.paymentFilter = e.target.value || "all";
  if (state.view === "payments") renderPayments();
});

document.getElementById("tables-slider")?.addEventListener("input", () => {
  const slider = document.getElementById("tables-slider");
  state.tableMinutes = snapTableMinutes(slider?.value || state.tableMinutes);
  if (slider) slider.value = String(state.tableMinutes);
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
document.getElementById("event-form")?.addEventListener("input", (e) => {
  if (e.target.closest("#event-pricing")) refreshEventPricingPreview();
});
document.getElementById("event-form")?.addEventListener("change", (e) => {
  if (e.target.closest("#event-pricing")) refreshEventPricingPreview();
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
