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

  window.TinyContact = {
    readContact,
    validateContact,
    markContactValidity,
    normalizePhone,
  };
  window.TinySubmit = {
    submitRequest,
    compressImage,
    canvasToBlob,
    idempotencyKey,
  };
})();
