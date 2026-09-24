import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendBookingEmail } from "../_shared/send-booking-email.ts";

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

function whatsappHref(eventName: string, date: string) {
  const text = `Hi Tiny! I'd like to join the guest list for ${eventName}${date ? ` on ${date}` : ""}.`;
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
};

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

  if (action === "status") {
    const token = asString(body.token);
    if (!token || token.length < 16) return json({ ok: false, error: "That link is not valid." }, 400, origin);
    const { data: rows, error } = await supabase
      .from("requests")
      .select("public_code, contact_name, party_date, party_time, status, payload")
      .eq("source", "event");
    if (error) return json({ ok: false, error: "Could not load the guest list." }, 500, origin);
    for (const row of rows || []) {
      const guests = (row.payload?.event?.guests || []) as Guest[];
      const guest = guests.find((item) => item.token === token);
      if (!guest) continue;
      const eventName = row.payload?.event?.name || row.contact_name || "Event";
      const start = String(row.party_time || "").slice(0, 5);
      return json(
        {
          ok: true,
          guest: {
            name: guest.name || "Guest",
            pax: Number(guest.pax) || 1,
            status: guest.status === "confirmed" ? "confirmed" : "pending",
            eventName,
            partyDate: row.party_date,
            startTime: start,
            publicCode: row.public_code,
            eventOpen: !INACTIVE.has(row.status),
          },
        },
        200,
        origin
      );
    }
    return json({ ok: false, error: "We couldn't find that guest list request." }, 404, origin);
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
    .select("id, public_code, contact_name, party_date, party_time, status, source, payload")
    .eq("public_code", code)
    .eq("source", "event")
    .maybeSingle();
  if (error || !row) return json({ ok: false, error: "That event is not available." }, 404, origin);
  if (INACTIVE.has(row.status)) return json({ ok: false, error: "That event is not open for the guest list." }, 400, origin);

  const payload = row.payload && typeof row.payload === "object" ? row.payload : {};
  const event = payload.event && typeof payload.event === "object" ? payload.event : {};
  const guests = Array.isArray(event.guests) ? [...event.guests] : [];
  const existing = guests.find(
    (guest: Guest) =>
      (guest.email && guest.email.toLowerCase() === email) || (guest.phone && guest.phone === phone)
  );
  const eventName = event.name || row.contact_name || "Event";
  const date = row.party_date || "";
  if (existing?.token) {
    return json(
      {
        ok: true,
        already: true,
        token: existing.token,
        link: guestLink(existing.token),
        whatsappHref: whatsappHref(eventName, date),
        status: existing.status === "confirmed" ? "confirmed" : "pending",
      },
      200,
      origin
    );
  }

  const token = crypto.randomUUID();
  guests.push({
    id: crypto.randomUUID(),
    name,
    pax,
    phone,
    email,
    notes: "Website guest list",
    status: "pending",
    token,
    source: "website",
    created_at: new Date().toISOString(),
  });
  const nextPayload = { ...payload, event: { ...event, guests } };
  const { error: updateError } = await supabase.from("requests").update({ payload: nextPayload }).eq("id", row.id);
  if (updateError) return json({ ok: false, error: "Could not save the guest list." }, 500, origin);

  const start = String(row.party_time || "").slice(0, 5);
  await sendBookingEmail({
    kind: "event",
    to: email,
    publicCode: row.public_code,
    manageToken: token,
    guestName: name,
    partyDate: date,
    partyTime: start,
    guestsLabel: `${pax}`,
    eventName,
    link: guestLink(token),
  });

  return json(
    {
      ok: true,
      token,
      link: guestLink(token),
      whatsappHref: whatsappHref(eventName, date),
      status: "pending",
    },
    200,
    origin
  );
});
