import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const ALLOWED_ORIGINS = [
  "https://tinyhealthycafe.com",
  "https://www.tinyhealthycafe.com",
  "https://gm298.github.io",
  "http://127.0.0.1:8777",
  "http://localhost:8777",
  "http://127.0.0.1:8765",
  "http://localhost:8765",
];

const ALLOWED_SOURCES = new Set(["party_builder", "cake", "pdf_quote", "reservation"]);
const SLOT_MINUTES = 120;
const RES_BEFORE = 30;
const RES_AFTER = 30;
const GRACE_MINUTES = 15;
const BALI_OFFSET = "+08:00";

function timeToMinutes(value: string) {
  const slot = String(value || "").slice(0, 5);
  const [hour, minute] = slot.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function occupyRange(time: string) {
  const start = timeToMinutes(time);
  if (start == null) return null;
  return { start: start - RES_BEFORE, end: start + SLOT_MINUTES + RES_AFTER };
}

function slotsOverlap(a: string, b: string) {
  const left = occupyRange(a);
  const right = occupyRange(b);
  if (!left || !right) return false;
  return left.start < right.end && right.start < left.end;
}

function isReleasedNoShow(status: string | null | undefined, date: string, time: string) {
  const kind = status || "new";
  if (!["new", "contacted", "quoted"].includes(kind)) return false;
  const start = new Date(`${date}T${String(time).slice(0, 5)}:00${BALI_OFFSET}`);
  if (Number.isNaN(start.getTime())) return false;
  return Date.now() > start.getTime() + GRACE_MINUTES * 60 * 1000;
}
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+[1-9][0-9]{7,14}$/;
const MAX_FILE = 8 * 1024 * 1024;
const MAX_PAYLOAD = 200 * 1024;
const RATE_MAX = 8;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
]);

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-idempotency-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function publicCodeFromId(id: string) {
  return `TINY-${id.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

function asString(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
}

function emptyToNull(value: string | null | undefined) {
  const v = (value || "").trim();
  return v ? v : null;
}

function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0].trim();
  return first || req.headers.get("cf-connecting-ip") || "unknown";
}

function hourWindow() {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  return d.toISOString();
}

async function fileFromForm(form: FormData, key: string) {
  const value = form.get(key);
  if (!value || typeof value === "string") return null;
  const file = value as File;
  if (!file.size) return null;
  return file;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: "Server is not configured" }, 500, origin);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ipHash = await sha256(`${Deno.env.get("RATE_LIMIT_SALT") || "tiny"}:${clientIp(req)}`);
  const windowStart = hourWindow();
  const { data: rateRow } = await supabase
    .from("submit_rate_limits")
    .select("hit_count")
    .eq("ip_hash", ipHash)
    .eq("window_start", windowStart)
    .maybeSingle();

  if ((rateRow?.hit_count || 0) >= RATE_MAX) {
    return json({ ok: false, error: "Too many requests. Please try again later." }, 429, origin);
  }

  await supabase.from("submit_rate_limits").upsert(
    {
      ip_hash: ipHash,
      window_start: windowStart,
      hit_count: (rateRow?.hit_count || 0) + 1,
    },
    { onConflict: "ip_hash,window_start" }
  );

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return json({ ok: false, error: "Could not read the form." }, 400, origin);
  }

  if (asString(form.get("website"))) {
    return json({ ok: true, ignored: true }, 200, origin);
  }

  let meta: Record<string, unknown> = {};
  try {
    meta = JSON.parse(asString(form.get("meta")) || "{}");
  } catch {
    return json({ ok: false, error: "Invalid request data." }, 400, origin);
  }

  const source = asString(meta.source);
  if (!ALLOWED_SOURCES.has(source)) {
    return json({ ok: false, error: "Unknown form." }, 400, origin);
  }

  const emailRaw = asString(meta.email).toLowerCase();
  const phoneRaw = asString(meta.phone).replace(/\s+/g, "");
  const email = EMAIL_RE.test(emailRaw) ? emailRaw : null;
  const phone = PHONE_RE.test(phoneRaw) ? phoneRaw : null;
  if (!email && !phone) {
    return json({ ok: false, error: "Please add an email or WhatsApp number." }, 400, origin);
  }

  const payload = meta.payload && typeof meta.payload === "object" ? meta.payload : {};
  const payloadSize = new TextEncoder().encode(JSON.stringify(payload)).length;
  if (payloadSize > MAX_PAYLOAD) {
    return json({ ok: false, error: "Request is too large." }, 400, origin);
  }

  if (source === "party_builder") {
    const party = (payload as { party?: Record<string, unknown> }).party || {};
    const pkg = (payload as { package?: Record<string, unknown> }).package || {};
    if (!asString(pkg.id) || !asString(party.date) || !asString(party.childName)) {
      return json({ ok: false, error: "Please complete the party details." }, 400, origin);
    }
  }
  if (source === "cake") {
    const cake = (payload as { cake?: Record<string, unknown> }).cake || {};
    const party = (payload as { party?: Record<string, unknown> }).party || {};
    if (!asString(cake.size) || !asString(party.date)) {
      return json({ ok: false, error: "Please choose a cake size and date." }, 400, origin);
    }
  }
  if (source === "reservation") {
    const reservation = (payload as { reservation?: Record<string, unknown> }).reservation || {};
    const party = (payload as { party?: Record<string, unknown> }).party || {};
    const tableIds = Array.isArray(reservation.tableIds) ? reservation.tableIds : [];
    if (!asString(party.date) || !asString(party.time) || !asString(reservation.name) || !tableIds.length) {
      return json({ ok: false, error: "Please complete the reservation details." }, 400, origin);
    }
    const wantedTime = asString(party.time);
    const wantedDate = asString(party.date);
    const { data: clashes } = await supabase
      .from("requests")
      .select("id, status, party_time, payload")
      .eq("source", "reservation")
      .eq("party_date", wantedDate)
      .not("status", "in", "(cancelled,rejected,closed)");
    const wanted = new Set(tableIds.map((id) => String(id)));
    const taken = (clashes || []).some((row) => {
      const rowTime = asString(row.party_time);
      if (!slotsOverlap(rowTime, wantedTime)) return false;
      if (isReleasedNoShow(row.status as string, wantedDate, rowTime)) return false;
      const held =
        ((row.payload as { reservation?: { tableIds?: unknown[] } })?.reservation?.tableIds) || [];
      return held.some((id) => wanted.has(String(id)));
    });
    if (taken) {
      return json(
        { ok: false, error: "That table is already reserved for this 2-hour slot. Please pick another." },
        409,
        origin
      );
    }
  }

  const fileParts: { key: string; file: File }[] = [];
  for (const key of ["quotePdf", "backdrop", "cakePhoto", "print_left", "print_center", "print_right"]) {
    const file = await fileFromForm(form, key);
    if (!file) continue;
    if (file.size > MAX_FILE) {
      return json({ ok: false, error: "A file is larger than 8 MB." }, 400, origin);
    }
    const mime = (file.type || "").toLowerCase();
    if (mime && !ALLOWED_MIME.has(mime)) {
      return json({ ok: false, error: "That file type is not allowed." }, 400, origin);
    }
    fileParts.push({ key, file });
  }

  const idempotencyKey =
    emptyToNull(req.headers.get("x-idempotency-key")) || emptyToNull(asString(meta.idempotencyKey));

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from("requests")
      .select("id, public_code, files")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing?.id) {
      const files = await uploadFiles(supabase, existing.id, fileParts, existing.files || {});
      await supabase.from("requests").update({ files }).eq("id", existing.id);
      return json({ ok: true, requestId: existing.id, publicCode: existing.public_code }, 200, origin);
    }
  }

  const quote = (payload as { quote?: Record<string, number> }).quote || {};
  const party = (payload as { party?: Record<string, unknown> }).party || {};
  const pkg = (payload as { package?: Record<string, unknown> }).package || {};
  const reservation = (payload as { reservation?: Record<string, unknown> }).reservation || {};
  const id = crypto.randomUUID();
  const publicCode = source === "reservation"
    ? `THFC-${id.replace(/-/g, "").slice(0, 4).toUpperCase()}`
    : publicCodeFromId(id);
  const total = Number(quote.total || 0);
  const row = {
    id,
    source,
    public_code: publicCode,
    idempotency_key: idempotencyKey,
    email,
    phone,
    contact_name: emptyToNull(asString(reservation.name) || asString(party.childName)),
    party_date: emptyToNull(asString(party.date)),
    party_time: emptyToNull(asString(party.time)),
    child_name: emptyToNull(asString(party.childName)),
    child_age: emptyToNull(asString(party.childAge)),
    package_id: emptyToNull(asString(pkg.id) || asString(reservation.area)),
    package_name: emptyToNull(asString(pkg.name) || asString(reservation.tableLabel)),
    day_type: emptyToNull(asString(party.day)),
    guest_kids: Number.isFinite(Number(party.guestKids)) ? Number(party.guestKids) : null,
    guest_adults: Number.isFinite(Number(party.guestAdults || reservation.guests))
      ? Number(party.guestAdults || reservation.guests)
      : null,
    quote_subtotal_idr: Number(quote.subtotal || 0),
    quote_service_idr: Number(quote.service || 0),
    quote_tax_idr: Number(quote.tax || 0),
    quote_total_idr: total,
    quote_dp_idr: Number(quote.dp30 || Math.round(total * 0.3)),
    payload,
    files: {},
    client: meta.client && typeof meta.client === "object" ? meta.client : {},
  };

  const { error: insertError } = await supabase.from("requests").insert(row);
  if (insertError) {
    if (String(insertError.message || "").includes("idempotency") && idempotencyKey) {
      const { data: existing } = await supabase
        .from("requests")
        .select("id, public_code")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();
      if (existing) {
        return json({ ok: true, requestId: existing.id, publicCode: existing.public_code }, 200, origin);
      }
    }
    console.error(insertError);
    return json({ ok: false, error: "Could not save the request." }, 500, origin);
  }

  const files = await uploadFiles(supabase, id, fileParts, {});
  await supabase.from("requests").update({ files }).eq("id", id);
  return json({ ok: true, requestId: id, publicCode }, 200, origin);
});

async function uploadFiles(
  supabase: ReturnType<typeof createClient>,
  requestId: string,
  parts: { key: string; file: File }[],
  previous: Record<string, unknown>
) {
  const files: Record<string, unknown> = { ...previous };
  const prints = { ...((previous.prints as Record<string, string>) || {}) };

  for (const { key, file } of parts) {
    const ext = extensionFor(file);
    let path = "";
    if (key === "quotePdf") path = `${requestId}/quotation.pdf`;
    else if (key === "backdrop") path = `${requestId}/backdrop.jpg`;
    else if (key === "cakePhoto") path = `${requestId}/cake${ext}`;
    else if (key.startsWith("print_")) {
      const panel = key.replace("print_", "");
      path = `${requestId}/print-${panel}${ext}`;
      prints[panel] = path;
    }
    if (!path) continue;
    const buffer = new Uint8Array(await file.arrayBuffer());
    const { error } = await supabase.storage.from("request-files").upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
    if (error) {
      console.error(error);
      continue;
    }
    if (key === "quotePdf") files.quotePdf = path;
    if (key === "backdrop") files.backdropPng = path;
    if (key === "cakePhoto") files.cakePhoto = path;
  }
  if (Object.keys(prints).length) files.prints = prints;
  return files;
}

function extensionFor(file: File) {
  const type = (file.type || "").toLowerCase();
  if (type === "application/pdf") return ".pdf";
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/heic" || type === "image/heif") return ".heic";
  if (type.includes("jpeg") || type.includes("jpg")) return ".jpg";
  const name = file.name || "";
  const dot = name.lastIndexOf(".");
  return dot >= 0 ? name.slice(dot).toLowerCase() : ".jpg";
}
