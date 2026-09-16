import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.TINY_SUPABASE || {};
const supabase = createClient(cfg.url || "", cfg.anonKey || "");
const TZ = "Asia/Makassar";
const BIRTHDAY_SOURCES = ["party_builder", "cake", "pdf_quote"];
const ALL_STATUSES = ["new", "contacted", "quoted", "booked", "cancelled", "rejected", "closed"];
const EVENT_STATUSES = ["booked", "cancelled", "closed"];
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
const blockModal = document.getElementById("block-modal");

const VIEWS = ["overview", "calendar", "day", "timeline", "tables"];

const state = {
  rows: [],
  view: "overview",
  lastView: "overview",
  selectedDate: todayIso(),
  calendarMonth: todayIso().slice(0, 7),
  filters: { type: "all", status: "all" },
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
  const kids = row.guest_kids ? `${row.guest_kids} kids` : "";
  const adults = row.guest_adults ? `${row.guest_adults} adults` : "";
  const joined = [kids, adults].filter(Boolean).join(" · ");
  if (joined) return joined;
  const pax = row.payload?.reservation?.guests;
  return pax ? `${pax} pax` : "—";
}

function tableText(row) {
  return row.payload?.reservation?.tableLabel || row.package_name || "Table TBC";
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

function matchesFilters(row) {
  const type = eventType(row);
  if (state.filters.type !== "all" && type !== state.filters.type) return false;
  if (state.filters.status !== "all" && row.status !== state.filters.status) return false;
  return true;
}

function filteredRows() {
  return state.rows.filter(matchesFilters);
}

function rowsOnDate(iso) {
  const rows = filteredRows().filter((row) => row.party_date === iso);
  const cooking = cookingRow(iso);
  if (cooking && matchesFilters(cooking) && !rows.some((row) => row.synthetic)) rows.push(cooking);
  return rows;
}

function undatedRows() {
  return filteredRows().filter((row) => !row.party_date);
}

function parseHash() {
  const hash = (location.hash || "").replace(/^#\/?/, "");
  const request = hash.match(/^request\/([0-9a-f-]{36})/i);
  if (request) return { view: "detail", id: request[1] };
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
    viewNav.hidden = view === "detail" || view === "cooking";
    viewNav.querySelectorAll("a").forEach((link) => {
      const target = link.dataset.view === "calendar" ? "calendar" : link.dataset.view;
      link.href = `#/${target}`;
      link.classList.toggle("is-active", link.dataset.view === (view === "day" ? "calendar" : view));
    });
  }
  if (pageTitle && view !== "detail" && view !== "cooking") {
    pageTitle.textContent = "Inbox";
  }
}

function syncFilterInputs() {
  const dateInput = document.getElementById("inbox-date");
  const typeInput = document.getElementById("filter-type");
  const statusInput = document.getElementById("filter-status");
  const label = document.getElementById("selected-date-label");
  if (dateInput) dateInput.value = state.selectedDate;
  if (typeInput) typeInput.value = state.filters.type;
  if (statusInput) statusInput.value = state.filters.status;
  if (label) label.textContent = formatLongDate(state.selectedDate);
}

function bookingCard(row) {
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
      <div class="muted">${escapeHtml(displayGuests(row))}</div>
    </div>
  </button>`;
}

function renderOverview() {
  syncFilterInputs();
  const rows = rowsOnDate(state.selectedDate);
  const stats = [
    ["booked", "Confirmed", countBy(rows, (r) => r.status === "booked")],
    ["new", "New booking", countBy(rows, (r) => ["new", "contacted", "quoted"].includes(r.status))],
    ["cancelled", "Cancelled", countBy(rows, (r) => r.status === "cancelled")],
    ["rejected", "Rejected", countBy(rows, (r) => r.status === "rejected")],
    ["closed", "Finished", countBy(rows, (r) => r.status === "closed")],
    ["total", "Total", rows.length],
  ];
  document.getElementById("stat-grid").innerHTML = stats
    .map(
      ([key, labelText, count]) =>
        `<article class="stat-card is-${key}"><strong>${count}</strong><span>${labelText}</span></article>`
    )
    .join("");
  const undated = undatedRows();
  const list = document.getElementById("booking-list");
  list.innerHTML = [
    rows.length
      ? rows
          .slice()
          .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)))
          .map(bookingCard)
          .join("")
      : `<p class="muted">No bookings on this date.</p>`,
    undated.length
      ? `<p class="date-label undated-label">No date yet</p>${undated.map(bookingCard).join("")}`
      : "",
  ].join("");
  document.getElementById("overview-status").textContent = `${rows.length} booking${
    rows.length === 1 ? "" : "s"
  }`;
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
    ["reservation", "Reservation"],
    ["birthday", "Birthday"],
    ["event", "Event"],
    ["cooking", "Cooking class"],
  ]
    .map(([kind, text]) => `<span><span class="dot dot--${kind === "cooking" ? "quoted" : kind === "event" ? "closed" : kind === "birthday" ? "booked" : "new"}"></span> ${text}</span>`)
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
          const kind = row.synthetic ? "cooking" : eventType(row);
          return `<button class="cal-event is-${kind}" type="button" data-open="${escapeHtml(openTarget(row).slice(2))}">${escapeHtml(
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
  const Map = window.TinyReserveMap;
  const dayStart = Map?.DAY_START ?? 7 * 60 + 30;
  const dayEnd = Map?.DAY_END ?? 19 * 60;
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

function renderDay() {
  syncFilterInputs();
  document.getElementById("day-title").textContent = formatLongDate(state.selectedDate);
  const rows = rowsOnDate(state.selectedDate)
    .slice()
    .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)));
  document.getElementById("day-count").textContent = `${rows.length} event${rows.length === 1 ? "" : "s"}`;
  const { dayStart, span, slots } = hourMarks();
  const height = Math.max(640, span * 1.2);
  const items = rows
    .map((row) => {
      const range = rowOccupy(row) || { start: dayStart, end: dayStart + 60 };
      const top = ((range.start - dayStart) / span) * 100;
      const blockHeight = Math.max(4, ((range.end - range.start) / span) * 100);
      const kind = row.synthetic ? "cooking" : eventType(row);
      return `<button class="day-item is-${kind}" type="button" data-open="${escapeHtml(openTarget(row).slice(2))}" style="top:${top}%;height:${blockHeight}%">
        <strong>${escapeHtml(slotRange(row))}</strong><br>${escapeHtml(displayName(row))} · ${escapeHtml(displaySubtitle(row))}
      </button>`;
    })
    .join("");
  document.getElementById("day-board").innerHTML = `
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

function renderTimeline() {
  syncFilterInputs();
  const rows = rowsOnDate(state.selectedDate).filter((row) => row.party_time);
  const Map = window.TinyReserveMap;
  const { dayStart, dayEnd, span } = hourMarks();
  const slots = [];
  for (let minutes = dayStart; minutes <= dayEnd; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  document.getElementById("timeline-count").textContent = `${rows.length} booking${
    rows.length === 1 ? "" : "s"
  } · reservations 3 hours, birthdays 4 hours`;
  const packed = rows
    .slice()
    .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)))
    .map((row) => ({ row, range: rowOccupy(row) || { start: dayStart, end: dayStart + 60 } }));
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
                  const kind = item.row.synthetic ? "event" : occupyKind(item.row);
                  return `<button class="timeline__item is-${kind}" type="button" data-open="${escapeHtml(
                    openTarget(item.row).slice(2)
                  )}" style="left:${left}%;width:${width}%;top:calc(${item.lane} * 46px)">
                    <strong>${escapeHtml(slotRange(item.row))}</strong>
                    ${escapeHtml(displayName(item.row))} · ${escapeHtml(displaySubtitle(item.row))}
                    · ${escapeHtml(displayGuests(item.row))}
                  </button>`;
                })
                .join("")
            : `<p class="muted">No bookings on this date.</p>`
        }
      </div>
    </div>
  `;
}

function tableRowsForDay() {
  const Map = window.TinyReserveMap;
  return Map?.TABLES || [];
}

function renderTables() {
  syncFilterInputs();
  const rows = rowsOnDate(state.selectedDate).filter(
    (row) => (row.payload?.reservation?.tableIds || []).length || row.synthetic
  );
  document.getElementById("tables-count").textContent = `${rows.length} booking${
    rows.length === 1 ? "" : "s"
  } on the floor · click an empty slot to block a table`;
  const { dayStart, span, slots } = hourMarks();
  const hourLines = slots
    .map((slot) => {
      const left = ((slot.minutes - dayStart) / span) * 100;
      return `<span class="pms__hourline" style="left:${left}%"></span>`;
    })
    .join("");
  const head = `<div class="pms__hours">
    <div class="pms__label">Table</div>
    <div class="pms__track" style="min-height:36px">${slots
      .map((slot) => {
        const left = ((slot.minutes - dayStart) / span) * 100;
        return `<span class="pms__hour" style="position:absolute;left:${left}%;top:8px">${slot.label}</span>`;
      })
      .join("")}</div>
  </div>`;
  const body = tableRowsForDay()
    .map((table) => {
      const items = rows
        .filter((row) => (row.payload?.reservation?.tableIds || []).includes(table.id))
        .map((row) => {
          const range = rowOccupy(row) || { start: dayStart, end: dayStart + 60 };
          const left = ((range.start - dayStart) / span) * 100;
          const width = Math.max(4, ((range.end - range.start) / span) * 100);
          const kind = row.synthetic ? "cooking" : eventType(row);
          return `<button class="pms__item is-${kind}" type="button" data-open="${escapeHtml(
            openTarget(row).slice(2)
          )}" style="left:${left}%;width:${width}%" title="${escapeHtml(displayName(row))}">${escapeHtml(
            displayName(row)
          )}</button>`;
        })
        .join("");
      return `<div class="pms__row">
        <div class="pms__label">${table.area === "indoor" ? "In" : "Tr"} ${table.number}</div>
        <div class="pms__track" data-table="${table.id}">${hourLines}${items}</div>
      </div>`;
    })
    .join("");
  document.getElementById("pms").innerHTML = head + body;
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

function minutesToTime(minutes) {
  const wrapped = Math.max(0, Math.round(minutes / 30) * 30);
  const hour = Math.floor(wrapped / 60);
  const min = wrapped % 60;
  return `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
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
          <p class="muted">Submitted ${escapeHtml(formatWhen(row.created_at))}</p>
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
        ${isEvent ? `<button class="btn btn--outline" type="button" id="delete-event">Remove block</button>` : ""}
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
              isReservation
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
          type === "birthday"
            ? `<section>
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
  document.getElementById("delete-event")?.addEventListener("click", async () => {
    if (!window.confirm("Remove this table block?")) return;
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
  renderNav(view);
  if (view === "overview") renderOverview();
  if (view === "calendar") renderCalendar();
  if (view === "day") renderDay();
  if (view === "timeline") renderTimeline();
  if (view === "tables") renderTables();
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
  if (state.view === "day") go(`day/${state.selectedDate}`);
  else showInbox(state.view);
});

document.getElementById("filter-type")?.addEventListener("change", (e) => {
  state.filters.type = e.target.value || "all";
  showInbox(state.view);
});

document.getElementById("filter-status")?.addEventListener("change", (e) => {
  state.filters.status = e.target.value || "all";
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

document.getElementById("block-tables")?.addEventListener("click", () => {
  openBlockModal({ date: state.selectedDate });
});

document.getElementById("block-cancel")?.addEventListener("click", closeBlockModal);
blockModal?.addEventListener("click", (e) => {
  if (e.target === blockModal) closeBlockModal();
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
