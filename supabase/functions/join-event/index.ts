import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendBookingEmail } from "../_shared/send-booking-email.ts";
import { callPromo, releasePromo } from "../_shared/promotions.ts";

const ALLOWED_ORIGINS = [
  "https://tinyhealthycafe.com",
  "https://www.tinyhealthycafe.com",
  "https://gm298.github.io",
  "http://127.0.0.1:8777",
  "http://localhost:8777",
  "http://127.0.0.1:8765",
  "http://localhost:8765",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+[1-9][0-9]{7,14}$/;
const RATE_MAX = 8;
const INACTIVE = new Set(["cancelled", "rejected", "closed", "noshow"]);
const WA = "6282266484226";

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

function asString(value: unknown) {
  if (value == null) return "";
  return String(value).trim();
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

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function siteOrigin() {
  return (Deno.env.get("PUBLIC_SITE_ORIGIN") || "https://tinyhealthycafe.com").replace(/\/$/, "");
}

function guestLink(token: string) {
  return `${siteOrigin()}/events/?g=${encodeURIComponent(token)}`;
}

function formatIdr(value: number) {
  const amount = Math.round(Number(value) || 0);
  if (!amount) return "";
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

function ticketUnit(row: { quote_total_idr?: number | null; payload?: { event?: { pricing?: { total?: unknown; price?: unknown } } } }) {
  const pricing = row.payload?.event?.pricing;
  const amount = Number(pricing?.total) || Number(pricing?.price) || Number(row.quote_total_idr) || 0;
  return amount > 0 ? Math.round(amount) : 0;
}

function whatsappHref(details: { name: string; email: string; eventName: string; slot: string; pax: number; price?: string }) {
  const count = Number(details.pax) || 1;
  const tickets = count === 1 ? "1 person / 1 ticket" : `${count} people / ${count} tickets`;
  const text = [
    "Hi Tiny! I'd like to book a spot.",
    `Guest: ${details.name}`,
    `Email: ${details.email}`,
    `Event: ${details.eventName}`,
    details.slot ? `Time: ${details.slot}` : "",
    `Tickets: ${tickets}`,
    details.price ? `Price: ${details.price}` : "",
    "Payment: pay on site at Tiny",
  ]
    .filter(Boolean)
    .join("\n");
  return `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
}

type Guest = {
  id?: string;
  name?: string;
  pax?: number;
  phone?: string;
  email?: string;
  notes?: string;
  status?: string;
  token?: string;
  source?: string;
  created_at?: string;
  archived_at?: string;
  slot?: { start?: string; end?: string };
  payment?: { status?: string; amount?: number };
  promo?: { code?: string; name?: string; discount_idr?: number };
};

function phoneDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  else if (/^8\d{7,12}$/.test(digits)) digits = `62${digits}`;
  return digits;
}

function guestContactsMatch(guest: Guest, email: string, phone: string) {
  const wantEmail = asString(guest.email).toLowerCase();
  const wantPhone = phoneDigits(asString(guest.phone));
  const gotEmail = asString(email).toLowerCase();
  const gotPhone = phoneDigits(phone);
  if (!wantEmail && !wantPhone) return false;
  if (wantEmail && (!EMAIL_RE.test(gotEmail) || gotEmail !== wantEmail)) return false;
  if (wantPhone && gotPhone !== wantPhone) return false;
  return true;
}

function slotFrom(value: unknown) {
  if (value && typeof value === "object") {
    const record = value as { start?: unknown; end?: unknown };
    const start = asString(record.start).slice(0, 5);
    const end = asString(record.end).slice(0, 5);
    return start && end ? { start, end } : null;
  }
  const [start, end] = asString(value).split("|");
  if (!start || !end) return null;
  return { start: start.slice(0, 5), end: end.slice(0, 5) };
}

function slotLabel(slot?: { start?: string; end?: string } | null) {
  const start = asString(slot?.start).slice(0, 5);
  const end = asString(slot?.end).slice(0, 5);
  return start && end ? `${start}–${end}` : "";
}

function eventSlots(event: Record<string, unknown>, row: { party_time?: string; payload?: { reservation?: { endTime?: string } } }) {
  const raw = Array.isArray(event.slots) ? event.slots : [];
  const slots = raw
    .map((item) => slotFrom(item))
    .filter((item): item is { start: string; end: string } => Boolean(item));
  if (slots.length) return slots;
  const start = asString(row.party_time).slice(0, 5);
  const end = asString(row.payload?.reservation?.endTime).slice(0, 5);
  if (start) return [{ start, end: end || start }];
  return [];
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "Server is not configured" }, 500, origin);

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Could not read the request." }, 400, origin);
  }

  if (asString(body.website)) return json({ ok: true, ignored: true }, 200, origin);

  const action = asString(body.action) || "join";

  async function findGuest(token: string) {
    const { data: rows, error } = await supabase
      .from("requests")
      .select("id, public_code, contact_name, party_date, party_time, status, payload, quote_total_idr")
      .eq("source", "event");
    if (error) return { error: "Could not load the guest list." };
    for (const row of rows || []) {
      const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
      const event = payload.event && typeof payload.event === "object" ? payload.event : {};
      const guests = (Array.isArray(event.guests) ? event.guests : []) as Guest[];
      const index = guests.findIndex((item) => item.token === token);
      if (index < 0) continue;
      return { row, payload, event, guests, index };
    }
    return { error: "We couldn't find that guest list request.", missing: true };
  }

  function guestView(found: {
    row: {
      public_code?: string;
      contact_name?: string;
      party_date?: string;
      party_time?: string;
      status?: string;
      payload?: { event?: { name?: string } };
      quote_total_idr?: number | null;
    };
    guests: Guest[];
    index: number;
  }, withNotes = false) {
    const guest = found.guests[found.index];
    const row = found.row;
    const eventName = row.payload?.event?.name || row.contact_name || "Event";
    const start = slotLabel(guest.slot) || String(row.party_time || "").slice(0, 5);
    const unit = ticketUnit(row);
    const pax = Number(guest.pax) || 1;
    const due = guest.promo?.code && Number.isFinite(Number(guest.payment?.amount))
      ? Number(guest.payment?.amount)
      : unit * pax;
    const status = guest.status === "confirmed" || guest.status === "contacted" || guest.status === "rejected"
      ? guest.status
      : "pending";
    return {
      name: guest.name || "Guest",
      pax,
      ...(withNotes ? { notes: asString(guest.notes) } : {}),
      status,
      eventName,
      partyDate: row.party_date,
      startTime: start,
      publicCode: row.public_code,
      eventOpen: !INACTIVE.has(String(row.status || "")),
      payment: guest.payment?.status === "paid" ? "paid" : "onsite",
      priceLabel: due ? `${formatIdr(due)} for ${pax} ${pax === 1 ? "ticket" : "tickets"}` : "",
      editable: !guest.archived_at && !INACTIVE.has(String(row.status || "")) && Boolean(asString(guest.email) || asString(guest.phone)),
      hasEmail: Boolean(asString(guest.email)),
      hasPhone: Boolean(asString(guest.phone)),
    };
  }

  if (action === "status" || action === "verify" || action === "update") {
    const token = asString(body.token);
    if (!token || token.length < 16) return json({ ok: false, error: "That link is not valid." }, 400, origin);
    const found = await findGuest(token);
    if (!("guests" in found) || found.index == null) {
      return json({ ok: false, error: found.error || "We couldn't find that guest list request." }, found.missing ? 404 : 500, origin);
    }
    const guest = found.guests[found.index];
    if (action === "status") {
      return json({ ok: true, guest: guestView(found) }, 200, origin);
    }
    const email = asString(body.email);
    const phone = asString(body.phone);
    const needEmail = Boolean(asString(guest.email));
    const needPhone = Boolean(asString(guest.phone));
    if (!needEmail && !needPhone) {
      return json({ ok: false, error: "This request can’t be edited from the link. Please WhatsApp Tiny." }, 403, origin);
    }
    if ((needEmail && !email) || (needPhone && !phone)) {
      return json(
        {
          ok: false,
          error: needEmail && needPhone
            ? "Enter the email and WhatsApp used for this request."
            : needEmail
              ? "Enter the email used for this request."
              : "Enter the WhatsApp number used for this request.",
        },
        400,
        origin
      );
    }
    if (!guestContactsMatch(guest, email, phone)) {
      return json({ ok: false, error: "Those details don’t match this request." }, 403, origin);
    }
    if (action === "verify") {
      return json({ ok: true, verified: true, guest: guestView(found, true) }, 200, origin);
    }
    if (guest.archived_at || INACTIVE.has(String(found.row.status || ""))) {
      return json({ ok: false, error: "This request can no longer be changed." }, 409, origin);
    }
    const name = asString(body.name);
    const pax = Math.max(1, Math.min(40, Math.round(Number(body.pax) || 1)));
    const notes = asString(body.notes).slice(0, 400);
    if (!name) return json({ ok: false, error: "Please add your name." }, 400, origin);
    found.guests[found.index] = { ...guest, name, pax, notes };
    const nextPayload = { ...found.payload, event: { ...found.event, guests: found.guests } };
    const { error: updateError } = await supabase.from("requests").update({ payload: nextPayload }).eq("id", found.row.id);
    if (updateError) return json({ ok: false, error: "Could not save the guest list." }, 500, origin);
    return json({ ok: true, guest: guestView(found, true) }, 200, origin);
  }

  if (action !== "join") return json({ ok: false, error: "Unknown action." }, 400, origin);

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
    { ip_hash: ipHash, window_start: windowStart, hit_count: (rateRow?.hit_count || 0) + 1 },
    { onConflict: "ip_hash,window_start" }
  );

  const code = asString(body.code).toUpperCase();
  const name = asString(body.name);
  const pax = Math.max(1, Math.min(40, Math.round(Number(body.pax) || 1)));
  const emailRaw = asString(body.email).toLowerCase();
  const phoneRaw = asString(body.phone).replace(/\s+/g, "");
  const email = EMAIL_RE.test(emailRaw) ? emailRaw : "";
  const phone = PHONE_RE.test(phoneRaw) ? phoneRaw : "";
  if (!code) return json({ ok: false, error: "Choose an event." }, 400, origin);
  if (!name) return json({ ok: false, error: "Please add your name." }, 400, origin);
  if (!email) return json({ ok: false, error: "Please add a valid email." }, 400, origin);
  if (!phone) return json({ ok: false, error: "Please add a WhatsApp number with the country code." }, 400, origin);

  const { data: row, error } = await supabase
    .from("requests")
    .select("id, public_code, contact_name, party_date, party_time, status, source, payload, quote_total_idr")
    .eq("public_code", code)
    .eq("source", "event")
    .maybeSingle();
  if (error || !row) return json({ ok: false, error: "That event is not available." }, 404, origin);
  if (INACTIVE.has(row.status)) return json({ ok: false, error: "That event is not open for the guest list." }, 400, origin);

  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  const event = payload.event && typeof payload.event === "object" ? payload.event : {};
  const slots = eventSlots(event as Record<string, unknown>, row);
  const chosen = slotFrom(body.slot);
  const matched = chosen ? slots.find((slot) => slot.start === chosen.start && slot.end === chosen.end) : null;
  if (!matched) return json({ ok: false, error: "Choose a time slot first." }, 400, origin);

  const guests = Array.isArray(event.guests) ? [...event.guests] : [];
  const existing = guests.find(
    (guest: Guest) =>
      (guest.email && guest.email.toLowerCase() === email) || (guest.phone && guest.phone === phone)
  );
  const eventName = event.name || row.contact_name || "Event";
  const date = row.party_date || "";
  if (existing) {
    const when = slotLabel(existing.slot) || slotLabel(slots[0]);
    return json(
      { ok: false, error: `You're already on the guest list${when ? ` for ${when}` : ""}.` },
      409,
      origin
    );
  }

  const token = crypto.randomUUID();
  const unit = ticketUnit(row);
  const promoCode = asString(body.promoCode);
  let due = unit * pax;
  let promo: Guest["promo"];
  let redeemedPromoId = "";
  if (promoCode) {
    if (!unit) return json({ ok: false, error: "This event has no ticket price to discount." }, 400, origin);
    const result = await callPromo(supabase, "redeem_promotion", promoCode, "event", due);
    if (!result.ok) return json({ ok: false, error: result.error || "That promo code is not valid." }, 400, origin);
    redeemedPromoId = String(result.id || "");
    const discount = Math.max(0, Math.round(Number(result.discount_idr || 0)));
    due = Math.max(0, due - discount);
    promo = { code: result.code || promoCode, name: result.name || "", discount_idr: discount };
  }
  guests.push({
    id: crypto.randomUUID(),
    name,
    pax,
    phone,
    email,
    notes: promo ? `Website guest list · ${promo.code}` : "Website guest list",
    status: "pending",
    token,
    source: "website",
    slot: matched,
    created_at: new Date().toISOString(),
    payment: { status: "onsite", amount: due },
    ...(promo ? { promo } : {}),
  });
  const nextPayload = { ...payload, event: { ...event, guests } };
  const { error: updateError } = await supabase.from("requests").update({ payload: nextPayload }).eq("id", row.id);
  if (updateError) {
    if (redeemedPromoId) await releasePromo(supabase, redeemedPromoId);
    return json({ ok: false, error: "Could not save the guest list." }, 500, origin);
  }

  try {
    await sendBookingEmail({
      kind: "event",
      to: email,
      publicCode: row.public_code,
      manageToken: token,
      guestName: name,
      partyDate: date,
      partyTime: slotLabel(matched),
      guestsLabel: `${pax}${due ? ` · ${formatIdr(due)}${promo?.code ? ` · ${promo.code}` : ""} · pay on site` : ""}`,
      eventName,
      link: guestLink(token),
    });
  } catch (_emailError) {
    /* The guest is saved even if the confirmation email cannot be sent. */
  }

  return json(
    {
      ok: true,
      token,
      link: guestLink(token),
      whatsappHref: whatsappHref({
        name,
        email,
        eventName,
        slot: slotLabel(matched),
        pax,
        price: due
          ? `${formatIdr(due)}${promo?.code ? ` with ${promo.code}` : ""}${pax > 1 ? ` for ${pax} tickets` : ""}`
          : "",
      }),
      status: "pending",
    },
    200,
    origin
  );
});
