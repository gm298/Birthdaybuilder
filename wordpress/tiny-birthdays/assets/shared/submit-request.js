(() => {
  "use strict";

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_RE = /^\+[1-9][0-9]{7,14}$/;

  function config() {
    return window.TINY_SUPABASE || {};
  }

  function normalizeEmail(value) {
    return String(value || "").trim().toLowerCase();
  }

  function normalizePhone(dial, national) {
    let raw = String(national || "").trim();
    if (!raw) return "";
    if (raw.startsWith("+")) {
      return `+${raw.replace(/\D/g, "")}`.replace(/^\+/, "+");
    }
    const digits = raw.replace(/\D/g, "").replace(/^0+/, "");
    const code = String(dial || "62").replace(/\D/g, "") || "62";
    if (!digits) return "";
    return `+${code}${digits}`;
  }

  function readContact() {
    const emailRaw = document.getElementById("contact-email")?.value || "";
    const phoneRaw = document.getElementById("contact-phone")?.value || "";
    const dial = document.getElementById("contact-dial")?.value || "62";
    const email = EMAIL_RE.test(normalizeEmail(emailRaw)) ? normalizeEmail(emailRaw) : "";
    const phone = PHONE_RE.test(normalizePhone(dial, phoneRaw)) ? normalizePhone(dial, phoneRaw) : "";
    return { email, phone, emailRaw: emailRaw.trim(), phoneRaw: phoneRaw.trim() };
  }

  function validateContact() {
    const { email, phone, emailRaw, phoneRaw } = readContact();
    if (email || phone) return { ok: true, email: email || null, phone: phone || null };
    if (!emailRaw && !phoneRaw) {
      return { ok: false, message: "Please add an email or WhatsApp number." };
    }
    return { ok: false, message: "That email or number doesn’t look valid." };
  }

  function markContactValidity(ok) {
    const wrap = document.getElementById("contact-fields");
    wrap?.querySelectorAll(".field").forEach((field) => {
      field.classList.toggle("is-invalid", !ok);
    });
  }

  function idempotencyKey(source) {
    const key = `tiny-submit-${source}`;
    try {
      const existing = sessionStorage.getItem(key);
      if (existing) return existing;
      const next = crypto.randomUUID();
      sessionStorage.setItem(key, next);
      return next;
    } catch (_) {
      return crypto.randomUUID();
    }
  }

  function clearIdempotency(source) {
    try {
      sessionStorage.removeItem(`tiny-submit-${source}`);
    } catch (_) {
      /* ignore */
    }
  }

  function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
      if (!canvas || typeof canvas.toBlob !== "function") {
        resolve(null);
        return;
      }
      canvas.toBlob((blob) => resolve(blob), type || "image/jpeg", quality ?? 0.85);
    });
  }

  async function compressImage(file, maxEdge, quality) {
    if (!file || !String(file.type || "").startsWith("image/")) return file;
    const edge = maxEdge || 2000;
    const q = quality ?? 0.82;
    if (file.size < 1.2 * 1024 * 1024) return file;
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
    } catch (_) {
      return file;
    }
    let { width, height } = bitmap;
    if (width > edge || height > edge) {
      const scale = Math.min(edge / width, edge / height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvasToBlob(canvas, "image/jpeg", q);
    if (!blob) return file;
    return new File([blob], (file.name || "photo").replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  }

  function utm() {
    const params = new URLSearchParams(window.location.search);
    const out = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
      const v = params.get(k);
      if (v) out[k] = v;
    });
    return out;
  }

  async function submitRequest({ source, payload, files, onProgress, extraClient }) {
    const cfg = config();
    if (!cfg.submitUrl || !cfg.anonKey || cfg.anonKey === "PASTE_SUPABASE_ANON_KEY") {
      throw new Error("Saving is not configured yet.");
    }
    const contact = validateContact();
    if (!contact.ok) throw new Error(contact.message);

    const key = idempotencyKey(source);
    const form = new FormData();
    form.append(
      "meta",
      JSON.stringify({
        source,
        email: contact.email,
        phone: contact.phone,
        idempotencyKey: key,
        payload: payload || {},
        client: {
          url: String(window.location.href || ""),
          ua: String(navigator.userAgent || ""),
          utm: utm(),
          ...(extraClient || {}),
        },
      })
    );
    form.append("website", "");

    const entries = Object.entries(files || {}).filter(([, file]) => file);
    for (let i = 0; i < entries.length; i += 1) {
      const [name, file] = entries[i];
      if (onProgress) onProgress(`Uploading ${i + 1} of ${entries.length + 1}…`);
      form.append(name, file, file.name || name);
    }

    if (onProgress) onProgress("Saving your request…");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 90000);
    let res;
    try {
      res = await fetch(cfg.submitUrl, {
        method: "POST",
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          "x-idempotency-key": key,
        },
        body: form,
        signal: controller.signal,
      });
    } catch (err) {
      window.clearTimeout(timer);
      if (err && err.name === "AbortError") throw new Error("Saving timed out. Please try again.");
      throw new Error("Could not save. Check your connection and try again.");
    }
    window.clearTimeout(timer);

    let body = {};
    try {
      body = await res.json();
    } catch (_) {
      body = {};
    }
    if (!res.ok || !body.ok) {
      throw new Error(body.error || "Could not save the request.");
    }
    clearIdempotency(source);
    return body;
  }

  function bookingUrl(manageToken) {
    const token = String(manageToken || "").trim();
    if (!token) return "";
    if (window.TINY_WP?.bookingUrl) {
      const base = String(window.TINY_WP.bookingUrl).replace(/\?.*$/, "").replace(/\/?$/, "/");
      return `${base}?t=${encodeURIComponent(token)}`;
    }
    try {
      const path = String(window.location.pathname || "");
      let prefix = "";
      const pages = path.match(/^(.*?\/Birthdaybuilder)(?:\/|$)/i);
      if (pages) prefix = pages[1];
      const url = new URL(`${prefix}/booking/`, window.location.origin);
      url.searchParams.set("t", token);
      return url.href;
    } catch (_) {
      return `${window.location.origin}/booking/?t=${encodeURIComponent(token)}`;
    }
  }

  function rememberManage(source, { publicCode, manageToken, requestId }) {
    try {
      sessionStorage.setItem(
        `tiny-manage-${source}`,
        JSON.stringify({
          publicCode: publicCode || "",
          manageToken: manageToken || "",
          requestId: requestId || "",
          savedAt: Date.now(),
        })
      );
    } catch (_) {
      /* ignore */
    }
  }

  function readManage(source) {
    try {
      const raw = sessionStorage.getItem(`tiny-manage-${source}`);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  async function manageRequest({ action, manageToken, payload, email, phone }) {
    const cfg = config();
    if (!cfg.manageUrl || !cfg.anonKey || cfg.anonKey === "PASTE_SUPABASE_ANON_KEY") {
      throw new Error("Managing is not configured yet.");
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 45000);
    let res;
    try {
      res = await fetch(cfg.manageUrl, {
        method: "POST",
        headers: {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          manageToken,
          payload: payload || {},
          email: email || payload?.email || "",
          phone: phone || payload?.phone || "",
        }),
        signal: controller.signal,
      });
    } catch (err) {
      window.clearTimeout(timer);
      if (err && err.name === "AbortError") throw new Error("Request timed out. Please try again.");
      throw new Error("Could not reach the server. Check your connection and try again.");
    }
    window.clearTimeout(timer);

    let body = {};
    try {
      body = await res.json();
    } catch (_) {
      body = {};
    }
    if (!res.ok || !body.ok) {
      throw new Error(body.error || "Could not update the booking.");
    }
    return body;
  }

  const DIAL_CODES = [
    ["62", "ID", "Indonesia"],
    ["61", "AU", "Australia"],
    ["64", "NZ", "New Zealand"],
    ["65", "SG", "Singapore"],
    ["60", "MY", "Malaysia"],
    ["1", "US", "United States"],
    ["1", "CA", "Canada"],
    ["44", "GB", "United Kingdom"],
    ["353", "IE", "Ireland"],
    ["33", "FR", "France"],
    ["49", "DE", "Germany"],
    ["31", "NL", "Netherlands"],
    ["32", "BE", "Belgium"],
    ["41", "CH", "Switzerland"],
    ["43", "AT", "Austria"],
    ["39", "IT", "Italy"],
    ["34", "ES", "Spain"],
    ["351", "PT", "Portugal"],
    ["46", "SE", "Sweden"],
    ["47", "NO", "Norway"],
    ["45", "DK", "Denmark"],
    ["358", "FI", "Finland"],
    ["48", "PL", "Poland"],
    ["420", "CZ", "Czechia"],
    ["36", "HU", "Hungary"],
    ["40", "RO", "Romania"],
    ["30", "GR", "Greece"],
    ["90", "TR", "Turkey"],
    ["7", "RU", "Russia"],
    ["380", "UA", "Ukraine"],
    ["81", "JP", "Japan"],
    ["82", "KR", "South Korea"],
    ["86", "CN", "China"],
    ["852", "HK", "Hong Kong"],
    ["853", "MO", "Macau"],
    ["886", "TW", "Taiwan"],
    ["66", "TH", "Thailand"],
    ["84", "VN", "Vietnam"],
    ["63", "PH", "Philippines"],
    ["91", "IN", "India"],
    ["94", "LK", "Sri Lanka"],
    ["977", "NP", "Nepal"],
    ["855", "KH", "Cambodia"],
    ["856", "LA", "Laos"],
    ["95", "MM", "Myanmar"],
    ["673", "BN", "Brunei"],
    ["971", "AE", "United Arab Emirates"],
    ["966", "SA", "Saudi Arabia"],
    ["974", "QA", "Qatar"],
    ["965", "KW", "Kuwait"],
    ["972", "IL", "Israel"],
    ["27", "ZA", "South Africa"],
    ["20", "EG", "Egypt"],
    ["55", "BR", "Brazil"],
    ["52", "MX", "Mexico"],
    ["54", "AR", "Argentina"],
    ["56", "CL", "Chile"],
  ].map(([code, iso, name]) => ({ code, iso, name }));

  function dialLabel(entry) {
    return `+${entry.code} ${entry.iso}`;
  }

  function parseTypedDial(value) {
    const raw = String(value || "").trim();
    const digits = raw.replace(/[^\d]/g, "");
    const query = raw.toLowerCase().replace(/^\+/, "");
    if (!raw) return null;
    const matches = DIAL_CODES.filter((entry) => {
      const hay = `${entry.code} ${entry.iso} ${entry.name} +${entry.code}`.toLowerCase();
      return hay.includes(query) || entry.code.startsWith(digits);
    });
    if (matches.length === 1) return matches[0];
    const exact = DIAL_CODES.find(
      (entry) =>
        entry.code === digits ||
        entry.iso.toLowerCase() === query ||
        entry.name.toLowerCase() === query
    );
    if (exact) return exact;
    if (/^\+?\d{1,4}$/.test(raw.replace(/\s/g, "")) && digits) {
      return { code: digits, iso: "", name: "Custom" };
    }
    return matches[0] || null;
  }

  function initDialCombobox() {
    const hidden = document.getElementById("contact-dial");
    const input = document.getElementById("contact-dial-search");
    const list = document.getElementById("contact-dial-list");
    if (!hidden || !input || !list || input.dataset.bound) return;
    input.dataset.bound = "1";

    let highlight = 0;
    let open = false;
    let results = DIAL_CODES.slice();

    const currentEntry = () =>
      DIAL_CODES.find((entry) => entry.code === hidden.value) || {
        code: hidden.value || "62",
        iso: "",
        name: "Custom",
      };

    function setDial(entry, closeList) {
      if (!entry || !entry.code) return;
      hidden.value = entry.code;
      input.value = entry.iso ? dialLabel(entry) : `+${entry.code}`;
      hidden.dispatchEvent(new Event("change", { bubbles: true }));
      if (closeList) hideList();
    }

    function filtered() {
      const q = input.value.trim().toLowerCase().replace(/^\+/, "");
      const digits = q.replace(/[^\d]/g, "");
      if (!q) return DIAL_CODES.slice();
      return DIAL_CODES.filter((entry) => {
        const hay = `${entry.code} ${entry.iso} ${entry.name} +${entry.code}`.toLowerCase();
        return hay.includes(q) || (digits && entry.code.startsWith(digits));
      });
    }

    function renderList() {
      results = filtered();
      const typed = input.value.trim();
      const typedDigits = typed.replace(/[^\d]/g, "");
      const custom =
        typedDigits &&
        !results.some((entry) => entry.code === typedDigits)
          ? [{ code: typedDigits, iso: "", name: `Use +${typedDigits}` }]
          : [];
      const rows = results.concat(custom);
      highlight = Math.min(highlight, Math.max(0, rows.length - 1));
      list.innerHTML = rows
        .map(
          (entry, i) =>
            `<li role="option" data-code="${entry.code}" data-iso="${entry.iso}" class="${
              i === highlight ? "is-active" : ""
            }">${entry.iso ? dialLabel(entry) + " · " + entry.name : entry.name}</li>`
        )
        .join("");
      list.querySelectorAll("li").forEach((li, i) => {
        li.addEventListener("mousedown", (e) => {
          e.preventDefault();
          setDial({ code: li.dataset.code, iso: li.dataset.iso, name: "" }, true);
        });
        li.addEventListener("mouseenter", () => {
          highlight = i;
          list.querySelectorAll("li").forEach((item, idx) => {
            item.classList.toggle("is-active", idx === highlight);
          });
        });
      });
    }

    function showList() {
      open = true;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
      renderList();
    }

    function hideList() {
      open = false;
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
    }

    input.value = dialLabel(currentEntry());
    input.addEventListener("focus", showList);
    input.addEventListener("click", showList);
    input.addEventListener("input", () => {
      highlight = 0;
      showList();
    });
    input.addEventListener("blur", () => {
      window.setTimeout(() => {
        const picked = parseTypedDial(input.value) || currentEntry();
        setDial(picked, true);
      }, 120);
    });
    input.addEventListener("keydown", (e) => {
      const items = list.querySelectorAll("li");
      if (e.key === "ArrowDown") {
        e.preventDefault();
        if (!open) showList();
        highlight = Math.min(highlight + 1, items.length - 1);
        renderList();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        highlight = Math.max(highlight - 1, 0);
        renderList();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const li = items[highlight];
        if (li) setDial({ code: li.dataset.code, iso: li.dataset.iso, name: "" }, true);
        else setDial(parseTypedDial(input.value) || currentEntry(), true);
      } else if (e.key === "Escape") {
        hideList();
        input.blur();
      }
    });
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".dial-combobox")) hideList();
    });
  }

  window.TinyContact = {
    readContact,
    validateContact,
    markContactValidity,
    normalizePhone,
    initDialCombobox,
  };

  function bootDial() {
    initDialCombobox();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootDial);
  } else {
    bootDial();
  }
  window.TinySubmit = {
    submitRequest,
    manageRequest,
    bookingUrl,
    rememberManage,
    readManage,
    compressImage,
    canvasToBlob,
    idempotencyKey,
  };
})();
