import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.TINY_SUPABASE || {};
const supabase = createClient(cfg.url || "", cfg.anonKey || "");
const TZ = "Asia/Makassar";
const BIRTHDAY_SOURCES = ["party_builder", "cake", "pdf_quote"];
const RES_STATUSES = ["new", "contacted", "quoted", "booked", "cancelled", "rejected", "closed"];
const BIRTHDAY_STATUSES = ["new", "contacted", "quoted", "booked", "closed"];

const loginCard = document.getElementById("login-card");
const app = document.getElementById("app");
const signOutBtn = document.getElementById("sign-out");
const inboxBody = document.getElementById("inbox-body");
const listView = document.getElementById("list-view");
const detailView = document.getElementById("detail-view");
const listStatus = document.getElementById("list-status");
const loginStatus = document.getElementById("login-status");
const reservationsView = document.getElementById("reservations-view");
const birthdaysView = document.getElementById("birthdays-view");
const resNav = document.getElementById("res-nav");
const pageTitle = document.getElementById("page-title");

const state = {
  reservations: [],
  birthdays: [],
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

function reservationName(row) {
  return (
    row.contact_name ||
    row.payload?.reservation?.name ||
    row.child_name ||
    "Guest"
  );
}

function reservationStatusLabel(status) {
  if (status === "booked") return "Confirmed";
  if (status === "new" || status === "contacted" || status === "quoted") return "New booking";
  if (status === "cancelled") return "Cancelled";
  if (status === "rejected") return "Rejected";
  if (status === "closed") return "Finished";
  return status || "—";
}

function statusClass(status) {
  if (status === "booked") return "booked";
  if (status === "cancelled") return "cancelled";
  if (status === "rejected") return "rejected";
  if (status === "closed") return "closed";
  return "new";
}

function parseHash() {
  const hash = (location.hash || "").replace(/^#/, "");
  const request = hash.match(/request\/([0-9a-f-]{36})/i);
  if (request) return { section: "detail", id: request[1] };
  if (hash.startsWith("/birthdays")) return { section: "birthdays" };
  if (hash.includes("calendar")) return { section: "reservations", view: "calendar" };
  if (hash.includes("timeline")) return { section: "reservations", view: "timeline" };
  return { section: "reservations", view: "overview" };
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

function reservationsOnDate(iso) {
  return state.reservations.filter((row) => row.party_date === iso);
}

function countBy(rows, pred) {
  return rows.filter(pred).length;
}

async function loadReservations() {
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, created_at, source, status, public_code, email, phone, contact_name, child_name, party_date, party_time, package_name, guest_adults, payload"
    )
    .eq("source", "reservation")
    .order("party_date", { ascending: true })
    .limit(500);
  if (error) throw error;
  state.reservations = data || [];
}

async function loadBirthdays() {
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, created_at, source, status, public_code, email, phone, child_name, party_date, package_name, quote_total_idr"
    )
    .in("source", BIRTHDAY_SOURCES)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  state.birthdays = data || [];
}

function renderNav(section, view) {
  document.querySelectorAll(".app-switch a").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.section === section);
  });
  if (resNav) resNav.hidden = section !== "reservations";
  resNav?.querySelectorAll("a").forEach((link) => {
    link.classList.toggle("is-active", link.dataset.view === view);
  });
  if (pageTitle) {
    pageTitle.textContent =
      section === "birthdays" ? "Birthday inbox" : "Reservations";
  }
}

function renderOverview() {
  const dateInput = document.getElementById("res-date");
  const label = document.getElementById("selected-date-label");
  if (dateInput) dateInput.value = state.selectedDate;
  if (label) label.textContent = formatLongDate(state.selectedDate);
  const rows = reservationsOnDate(state.selectedDate);
  const stats = [
    ["booked", "Confirmed", countBy(rows, (r) => r.status === "booked")],
    ["new", "New booking", countBy(rows, (r) => ["new", "contacted", "quoted"].includes(r.status))],
    ["cancelled", "Cancelled", countBy(rows, (r) => r.status === "cancelled")],
    ["rejected", "Rejected", countBy(rows, (r) => r.status === "rejected")],
    ["closed", "Finished", countBy(rows, (r) => r.status === "closed")],
    ["total", "Total booking", rows.length],
  ];
  document.getElementById("stat-grid").innerHTML = stats
    .map(
      ([key, labelText, count]) =>
        `<article class="stat-card is-${key}"><strong>${count}</strong><span>${labelText}</span></article>`
    )
    .join("");
  const list = document.getElementById("booking-list");
  list.innerHTML = rows.length
    ? rows
        .slice()
        .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)))
        .map(
          (row) => `<button class="booking-card" type="button" data-id="${escapeHtml(row.id)}">
            <div>
              <div class="code">${escapeHtml(row.public_code)}</div>
              <h3>${escapeHtml(reservationName(row))}</h3>
              <div class="muted">${escapeHtml(row.phone || row.email || "")}</div>
            </div>
            <div>
              <span class="badge">${escapeHtml(reservationStatusLabel(row.status))}</span>
              <div class="muted">${escapeHtml(row.package_name || "Table TBC")}</div>
            </div>
            <div class="time">${escapeHtml(timeLabel(row.party_time))}
              <div class="muted">${escapeHtml(String(row.guest_adults || row.payload?.reservation?.guests || "—"))} pax</div>
            </div>
          </button>`
        )
        .join("")
    : `<p class="muted">No reservations on this date.</p>`;
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

function renderCalendar() {
  const title = document.getElementById("cal-title");
  const [year, month] = state.calendarMonth.split("-").map(Number);
  title.textContent = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const heads = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    .map((name) => `<div class="cal-cell is-head">${name}</div>`)
    .join("");
  const cells = monthCells(state.calendarMonth)
    .map((cell) => {
      const rows = reservationsOnDate(cell.iso);
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
  const rows = reservationsOnDate(state.selectedDate);
  document.getElementById("timeline-count").textContent = `${rows.length} table${
    rows.length === 1 ? "" : "s"
  } booked`;
  const slots = [];
  for (let minutes = 8 * 60 + 30; minutes <= 18 * 60; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const min = minutes % 60;
    slots.push(`${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  document.getElementById("timeline").innerHTML = `
    <div class="timeline__track">
      <div class="timeline__hours">
        ${slots.map((slot) => `<div class="timeline__slot">${slot}</div>`).join("")}
      </div>
      <div class="timeline__bookings">
        ${
          rows.length
            ? rows
                .slice()
                .sort((a, b) => timeLabel(a.party_time).localeCompare(timeLabel(b.party_time)))
                .map(
                  (row) => `<button class="timeline__item" type="button" data-id="${escapeHtml(row.id)}">
                    <strong>${escapeHtml(timeLabel(row.party_time))}</strong>
                    ${escapeHtml(reservationName(row))} · ${escapeHtml(row.package_name || "Table")}
                    · ${escapeHtml(String(row.guest_adults || "—"))} pax
                  </button>`
                )
                .join("")
            : `<p class="muted">No tables booked on this date.</p>`
        }
      </div>
    </div>
  `;
}

function renderBirthdays() {
  const search = (document.getElementById("search")?.value || "").trim().toLowerCase();
  const status = document.getElementById("filter-status")?.value || "";
  const source = document.getElementById("filter-source")?.value || "";
  const rows = state.birthdays.filter((row) => {
    if (status && row.status !== status) return false;
    if (source && row.source !== source) return false;
    if (!search) return true;
    const blob = [row.public_code, row.child_name, row.email, row.phone, row.package_name]
      .join(" ")
      .toLowerCase();
    return blob.includes(search);
  });
  inboxBody.innerHTML = rows.length
    ? rows
        .map(
          (row) => `<tr data-id="${escapeHtml(row.id)}">
            <td><strong>${escapeHtml(row.public_code)}</strong><div class="muted">${escapeHtml(
              sourceLabel(row.source)
            )}</div></td>
            <td>${escapeHtml(formatWhen(row.created_at))}</td>
            <td>${escapeHtml(row.party_date || "—")}</td>
            <td>${escapeHtml(row.child_name || "—")}<div class="muted">${escapeHtml(
              row.email || row.phone || ""
            )}</div></td>
            <td>${escapeHtml(row.package_name || "—")}</td>
            <td>${escapeHtml(formatIdr(row.quote_total_idr))}</td>
            <td><span class="badge">${escapeHtml(row.status)}</span></td>
          </tr>`
        )
        .join("")
    : `<tr><td colspan="7">No requests yet.</td></tr>`;
  listStatus.textContent = `${rows.length} request${rows.length === 1 ? "" : "s"}`;
  listStatus.className = "status";
}

async function signedUrl(path) {
  if (!path) return "";
  const { data, error } = await supabase.storage.from("request-files").createSignedUrl(path, 3600);
  if (error) return "";
  return data?.signedUrl || "";
}

function backTarget(row) {
  if (row?.source === "reservation") return "#/reservations/overview";
  return "#/birthdays";
}

async function loadDetail(id) {
  reservationsView.hidden = true;
  birthdaysView.hidden = true;
  if (resNav) resNav.hidden = true;
  detailView.hidden = false;
  detailView.innerHTML = `<p class="status">Loading request…</p>`;
  const { data: row, error } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (error || !row) {
    detailView.innerHTML = `<p class="status is-error">${escapeHtml(
      error?.message || "Request not found."
    )}</p><button class="btn btn--outline back" type="button" id="back-list">Back</button>`;
    document.getElementById("back-list")?.addEventListener("click", () => {
      location.hash = "#/reservations/overview";
    });
    return;
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
                    isReservation ? reservationStatusLabel(s) : s
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
              isReservation ? reservationName(row) : row.child_name || "—"
            )}${!isReservation && row.child_age ? ` · turning ${escapeHtml(row.child_age)}` : ""}</span></li>
            <li><span>Date</span><span>${escapeHtml(row.party_date || "—")}</span></li>
            <li><span>Time</span><span>${escapeHtml(timeLabel(row.party_time))}</span></li>
            <li><span>Guests</span><span>${escapeHtml(
              isReservation
                ? `${row.guest_adults || reservation.guests || "—"} pax`
                : [row.guest_kids ? `${row.guest_kids} kids` : "", row.guest_adults ? `${row.guest_adults} adults` : ""]
                    .filter(Boolean)
                    .join(" · ") || "—"
            )}</span></li>
            <li><span>${isReservation ? "Table" : "Package"}</span><span>${escapeHtml(
              row.package_name || "—"
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
            ? ""
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

function showReservations(view) {
  detailView.hidden = true;
  birthdaysView.hidden = true;
  reservationsView.hidden = false;
  document.getElementById("overview-view").hidden = view !== "overview";
  document.getElementById("calendar-view").hidden = view !== "calendar";
  document.getElementById("timeline-view").hidden = view !== "timeline";
  renderNav("reservations", view);
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
      detailView.hidden = true;
      reservationsView.hidden = true;
      birthdaysView.hidden = false;
      listView.hidden = false;
      renderNav("birthdays");
      renderBirthdays();
      return;
    }
    await loadReservations();
    showReservations(parsed.view || "overview");
  } catch (err) {
    const node = document.getElementById("overview-status") || listStatus;
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

inboxBody?.addEventListener("click", (e) => {
  const row = e.target.closest("tr[data-id]");
  if (!row) return;
  location.hash = `#/request/${row.dataset.id}`;
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
  location.hash = "#/reservations/overview";
  renderOverview();
});

document.getElementById("res-date")?.addEventListener("change", (e) => {
  state.selectedDate = e.target.value || todayIso();
  state.calendarMonth = state.selectedDate.slice(0, 7);
  const parsed = parseHash();
  if (parsed.section === "reservations") showReservations(parsed.view || "overview");
});

document.getElementById("cal-prev")?.addEventListener("click", () => {
  state.calendarMonth = shiftMonth(state.calendarMonth, -1);
  renderCalendar();
});
document.getElementById("cal-next")?.addEventListener("click", () => {
  state.calendarMonth = shiftMonth(state.calendarMonth, 1);
  renderCalendar();
});

["search", "filter-status", "filter-source"].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", renderBirthdays);
  document.getElementById(id)?.addEventListener("change", renderBirthdays);
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
