import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const cfg = window.TINY_SUPABASE || {};
const supabase = createClient(cfg.url || "", cfg.anonKey || "");
const TZ = "Asia/Makassar";

const loginCard = document.getElementById("login-card");
const app = document.getElementById("app");
const signOutBtn = document.getElementById("sign-out");
const inboxBody = document.getElementById("inbox-body");
const listView = document.getElementById("list-view");
const detailView = document.getElementById("detail-view");
const listStatus = document.getElementById("list-status");
const loginStatus = document.getElementById("login-status");

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

function sourceLabel(source) {
  if (source === "party_builder") return "Party";
  if (source === "cake") return "Cake";
  if (source === "pdf_quote") return "PDF";
  return source || "—";
}

function currentId() {
  const hash = location.hash || "";
  const match = hash.match(/request\/([0-9a-f-]{36})/i);
  return match ? match[1] : "";
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

async function loadList() {
  listStatus.textContent = "Loading…";
  const q = supabase
    .from("requests")
    .select(
      "id, created_at, source, status, public_code, email, phone, child_name, party_date, package_name, quote_total_idr"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  const { data, error } = await q;
  if (error) {
    listStatus.textContent = error.message;
    listStatus.className = "status is-error";
    return;
  }
  const search = (document.getElementById("search")?.value || "").trim().toLowerCase();
  const status = document.getElementById("filter-status")?.value || "";
  const source = document.getElementById("filter-source")?.value || "";
  const rows = (data || []).filter((row) => {
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

async function loadDetail(id) {
  listView.hidden = true;
  detailView.hidden = false;
  detailView.innerHTML = `<p class="status">Loading request…</p>`;
  const { data: row, error } = await supabase.from("requests").select("*").eq("id", id).maybeSingle();
  if (error || !row) {
    detailView.innerHTML = `<p class="status is-error">${escapeHtml(
      error?.message || "Request not found."
    )}</p><button class="btn btn--outline back" type="button" id="back-list">Back to inbox</button>`;
    document.getElementById("back-list")?.addEventListener("click", goList);
    return;
  }

  const files = row.files || {};
  const payload = row.payload || {};
  const quote = payload.quote || {};
  const cake = payload.cake || {};
  const decor = payload.decor || {};
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
    <button class="btn btn--outline back" type="button" id="back-list">Back to inbox</button>
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
            ${["new", "contacted", "quoted", "booked", "closed"]
              .map(
                (s) =>
                  `<option value="${s}"${s === row.status ? " selected" : ""}>${s}</option>`
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
          <h3>Booking</h3>
          <ul class="kv">
            <li><span>Child</span><span>${escapeHtml(row.child_name || "—")}${
              row.child_age ? ` · turning ${escapeHtml(row.child_age)}` : ""
            }</span></li>
            <li><span>Date</span><span>${escapeHtml(row.party_date || "—")}</span></li>
            <li><span>Time</span><span>${escapeHtml(String(row.party_time || "—").slice(0, 5))}</span></li>
            <li><span>Guests</span><span>${escapeHtml(
              [row.guest_kids ? `${row.guest_kids} kids` : "", row.guest_adults ? `${row.guest_adults} adults` : ""]
                .filter(Boolean)
                .join(" · ") || "—"
            )}</span></li>
            <li><span>Package</span><span>${escapeHtml(row.package_name || "—")}</span></li>
            <li><span>Theme / request</span><span>${escapeHtml(decor.designRequest || decor.themeLabel || "—")}</span></li>
          </ul>
        </section>
        <section>
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
                url
                  ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(printEntries[i][0])} print">`
                  : ""
              )
              .join("")}
          </div>
        </section>
        <section>
          <h3>Notes</h3>
          <p>${escapeHtml((payload.party && payload.party.foodNotes) || "No food notes")}</p>
          <p>${escapeHtml((payload.party && payload.party.notes) || "No extra notes")}</p>
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

  document.getElementById("back-list")?.addEventListener("click", goList);
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
    const { error: saveError } = await supabase
      .from("requests")
      .update({ staff_notes: notes })
      .eq("id", row.id);
    if (statusEl) {
      statusEl.textContent = saveError ? saveError.message : "Notes saved.";
      statusEl.className = saveError ? "status is-error" : "status is-success";
    }
  });
}

function goList() {
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  detailView.hidden = true;
  listView.hidden = false;
  loadList();
}

function route() {
  const id = currentId();
  if (id) loadDetail(id);
  else {
    detailView.hidden = true;
    listView.hidden = false;
    loadList();
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

["search", "filter-status", "filter-source"].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", loadList);
  document.getElementById(id)?.addEventListener("change", loadList);
});

window.addEventListener("hashchange", () => {
  if (!app.hidden) route();
});

(async () => {
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
  route();
})();
