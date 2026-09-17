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

const SLOT_MINUTES = 120;
const RES_BEFORE = 30;
const RES_AFTER = 30;
const BDAY_BEFORE = 60;
const BDAY_AFTER = 180;
const GRACE_MINUTES = 15;
const BALI_OFFSET = "+08:00";
const COOKING_TABLES = new Set(["tr-18", "tr-19"]);
const COOKING_START = 14 * 60;
const COOKING_END = 17 * 60;
const OCCUPY_SOURCES = ["reservation", "event", "party_builder"];
const INACTIVE = new Set(["cancelled", "rejected", "closed", "noshow"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+[1-9][0-9]{7,14}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SELECT_COLS =
  "id, source, status, public_code, manage_token, email, phone, contact_name, child_name, child_age, party_date, party_time, package_name, guest_adults, guest_kids, payload, google_event_id";

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
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

function emptyToNull(value: string | null | undefined) {
  const v = (value || "").trim();
  return v ? v : null;
}

function timeToMinutes(value: string) {
  const slot = String(value || "").slice(0, 5);
  const [hour, minute] = slot.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function occupyKind(source: string) {
  if (source === "party_builder") return "birthday";
  if (source === "event") return "event";
  return "reservation";
}

function occupyRange(time: string, kind = "reservation", endTime = "") {
  const start = timeToMinutes(time);
  if (start == null) return null;
  const explicitEnd = timeToMinutes(endTime);
  if (explicitEnd != null) return { start, end: Math.max(start + 30, explicitEnd) };
  if (kind === "birthday") return { start: start - BDAY_BEFORE, end: start + BDAY_AFTER };
  return { start: start - RES_BEFORE, end: start + SLOT_MINUTES + RES_AFTER };
}

function rangesOverlap(
  aTime: string,
  bTime: string,
  aKind = "reservation",
  bKind = "reservation",
  aEnd = "",
  bEnd = ""
) {
  const left = occupyRange(aTime, aKind, aEnd);
  const right = occupyRange(bTime, bKind, bEnd);
  if (!left || !right) return false;
  return left.start < right.end && right.start < left.end;
}

function isSaturday(date: string) {
  const [year, month, day] = String(date).split("-").map(Number);
  if (!year || !month || !day) return false;
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() === 6;
}

function cookingClassClash(date: string, time: string, tableIds: string[], kind: string, endTime = "") {
  if (!isSaturday(date) || !tableIds.some((id) => COOKING_TABLES.has(id))) return false;
  const wanted = occupyRange(time, kind, endTime);
  if (!wanted) return false;
  return wanted.start < COOKING_END && COOKING_START < wanted.end;
}

function isReleasedNoShow(status: string | null | undefined, date: string, time: string) {
  const kind = status || "new";
  if (!["new", "contacted", "quoted"].includes(kind)) return false;
  const start = new Date(`${date}T${String(time).slice(0, 5)}:00${BALI_OFFSET}`);
  if (Number.isNaN(start.getTime())) return false;
  return Date.now() > start.getTime() + GRACE_MINUTES * 60 * 1000;
}

function publicRow(row: Record<string, unknown>) {
  const payload = (row.payload && typeof row.payload === "object" ? row.payload : {}) as Record<
    string,
    unknown
  >;
  const reservation = (payload.reservation && typeof payload.reservation === "object"
    ? payload.reservation
    : {}) as Record<string, unknown>;
  const party = (payload.party && typeof payload.party === "object" ? payload.party : {}) as Record<
    string,
    unknown
  >;
  const pkg = (payload.package && typeof payload.package === "object" ? payload.package : {}) as Record<
    string,
    unknown
  >;
  const cake = (payload.cake && typeof payload.cake === "object" ? payload.cake : {}) as Record<
    string,
    unknown
  >;

  return {
    source: row.source,
    status: row.status,
    publicCode: row.public_code,
    manageToken: row.manage_token,
    email: row.email,
    phone: row.phone,
    contactName: row.contact_name,
    childName: row.child_name,
    childAge: row.child_age,
    partyDate: row.party_date,
    partyTime: String(row.party_time || "").slice(0, 5),
    packageName: row.package_name,
    guestAdults: row.guest_adults,
    guestKids: row.guest_kids,
    reservation: {
      name: reservation.name || row.contact_name || "",
      salutation: reservation.salutation || "",
      purpose: reservation.purpose || "",
      notes: reservation.notes || party.notes || "",
      tableIds: Array.isArray(reservation.tableIds) ? reservation.tableIds : [],
      tableLabel: reservation.tableLabel || row.package_name || "",
      area: reservation.area || "",
      endTime: reservation.endTime || "",
      kids: reservation.kids ?? row.guest_kids ?? 0,
      adults: reservation.adults ?? row.guest_adults ?? 0,
      guests: reservation.guests ?? null,
    },
    party: {
      childName: party.childName || row.child_name || "",
      childAge: party.childAge || row.child_age || "",
      date: party.date || row.party_date || "",
      time: String(party.time || row.party_time || "").slice(0, 5),
      notes: party.notes || "",
      foodNotes: party.foodNotes || "",
      guestKids: party.guestKids ?? row.guest_kids ?? 0,
      guestAdults: party.guestAdults ?? row.guest_adults ?? 0,
    },
    package: {
      id: pkg.id || "",
      name: pkg.name || row.package_name || "",
    },
    cake: {
      size: cake.size || "",
      priceLabel: cake.priceLabel || "",
      sponges: Array.isArray(cake.sponges) ? cake.sponges : [],
      sugarSponge: cake.sugarSponge || "",
      mode: cake.mode || "",
      design: cake.design || "",
      theme: cake.theme || "",
      diet: Array.isArray(cake.diet) ? cake.diet : [],
      notes: cake.notes || "",
    },
  };
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) {
    return json({ ok: false, error: "Server is not configured." }, 500, origin);
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON." }, 400, origin);
  }

  const action = asString(body.action).toLowerCase();
  const manageToken = asString(body.manageToken);
  if (!UUID_RE.test(manageToken)) {
    return json({ ok: false, error: "Invalid manage link." }, 400, origin);
  }
  if (!["get", "update", "cancel", "verify"].includes(action)) {
    return json({ ok: false, error: "Unknown action." }, 400, origin);
  }

  const { data: row, error: loadError } = await supabase
    .from("requests")
    .select(SELECT_COLS)
    .eq("manage_token", manageToken)
    .maybeSingle();

  if (loadError) {
    console.error(loadError);
    return json({ ok: false, error: "Could not load booking." }, 500, origin);
  }
  if (!row) {
    return json({ ok: false, error: "Booking not found." }, 404, origin);
  }

  if (action === "get") {
    return json({ ok: true, booking: publicRow(row as Record<string, unknown>) }, 200, origin);
  }

  function contactsMatch(inputEmail: string, inputPhone: string) {
    const wantEmail = asString(row.email).toLowerCase();
    const wantPhone = asString(row.phone).replace(/\s+/g, "");
    const gotEmail = asString(inputEmail).toLowerCase();
    const gotPhone = asString(inputPhone).replace(/\s+/g, "");
    if (!wantEmail && !wantPhone) return false;
    if (wantEmail) {
      if (!EMAIL_RE.test(gotEmail) || gotEmail !== wantEmail) return false;
    }
    if (wantPhone) {
      if (!PHONE_RE.test(gotPhone) || gotPhone !== wantPhone) return false;
    }
    return true;
  }

  if (action === "verify") {
    const email = asString(body.email);
    const phone = asString(body.phone);
    const needEmail = Boolean(asString(row.email));
    const needPhone = Boolean(asString(row.phone));
    if ((needEmail && !email) || (needPhone && !phone)) {
      return json(
        {
          ok: false,
          error: needEmail && needPhone
            ? "Enter the email and WhatsApp used for this booking."
            : needEmail
              ? "Enter the email used for this booking."
              : "Enter the WhatsApp number used for this booking.",
        },
        400,
        origin
      );
    }
    if (!contactsMatch(email, phone)) {
      return json({ ok: false, error: "Those details don’t match this booking." }, 403, origin);
    }
    return json({ ok: true, verified: true, booking: publicRow(row as Record<string, unknown>) }, 200, origin);
  }

  if (INACTIVE.has(String(row.status || ""))) {
    return json(
      { ok: false, error: "This booking can no longer be changed.", booking: publicRow(row as Record<string, unknown>) },
      409,
      origin
    );
  }

  // update / cancel require contact confirmation
  {
    const email = asString(body.email ?? (body.payload as { email?: unknown })?.email);
    const phone = asString(body.phone ?? (body.payload as { phone?: unknown })?.phone);
    if (!contactsMatch(email, phone)) {
      return json(
        { ok: false, error: "Confirm with the email and WhatsApp used for this booking before editing." },
        403,
        origin
      );
    }
  }

  async function tablesClash(
    wantedDate: string,
    wantedTime: string,
    tableIds: unknown[],
    kind: string,
    endTime = "",
    excludeId = ""
  ) {
    const wanted = new Set(tableIds.map((id) => String(id)));
    if (!wanted.size) return false;
    if (cookingClassClash(wantedDate, wantedTime, [...wanted], kind, endTime)) return true;
    const { data: clashes } = await supabase
      .from("requests")
      .select("id, source, status, party_time, payload")
      .in("source", OCCUPY_SOURCES)
      .eq("party_date", wantedDate)
      .not("status", "in", "(cancelled,rejected,closed,noshow)");
    return (clashes || []).some((item) => {
      if (excludeId && item.id === excludeId) return false;
      const rowTime = asString(item.party_time);
      const rowPayload =
        (item.payload as { reservation?: { tableIds?: unknown[]; endTime?: unknown } })?.reservation ||
        {};
      const held = rowPayload.tableIds || [];
      const rowKind = occupyKind(String(item.source || ""));
      const rowEnd = asString(rowPayload.endTime);
      if (!rangesOverlap(rowTime, wantedTime, rowKind, kind, rowEnd, endTime)) return false;
      if (item.source === "reservation" && isReleasedNoShow(item.status as string, wantedDate, rowTime)) {
        return false;
      }
      return held.some((id) => wanted.has(String(id)));
    });
  }

  async function notifyCalendar(record: Record<string, unknown>, oldRecord: Record<string, unknown>) {
    const secret = Deno.env.get("CALENDAR_SYNC_SECRET") || "";
    if (!secret) return;
    try {
      await fetch(`${supabaseUrl}/functions/v1/sync-google-calendar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${secret}`,
          "x-calendar-sync-secret": secret,
        },
        body: JSON.stringify({ type: "UPDATE", record, old_record: oldRecord }),
      });
    } catch (err) {
      console.error("calendar sync notify failed", err);
    }
  }

  if (action === "cancel") {
    const oldRecord = { ...row };
    const { data: updated, error: cancelError } = await supabase
      .from("requests")
      .update({
        status: "cancelled",
        status_changed_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .select(SELECT_COLS)
      .single();
    if (cancelError || !updated) {
      console.error(cancelError);
      return json({ ok: false, error: "Could not cancel the booking." }, 500, origin);
    }
    await notifyCalendar(updated as Record<string, unknown>, oldRecord as Record<string, unknown>);
    return json({ ok: true, booking: publicRow(updated as Record<string, unknown>) }, 200, origin);
  }

  // update
  const payloadIn = body.payload && typeof body.payload === "object" ? (body.payload as Record<string, unknown>) : {};
  const source = String(row.source || "");
  const existingPayload =
    row.payload && typeof row.payload === "object" ? { ...(row.payload as Record<string, unknown>) } : {};

  if (source === "reservation") {
    const reservationIn =
      payloadIn.reservation && typeof payloadIn.reservation === "object"
        ? (payloadIn.reservation as Record<string, unknown>)
        : {};
    const partyIn =
      payloadIn.party && typeof payloadIn.party === "object"
        ? (payloadIn.party as Record<string, unknown>)
        : {};

    const date = asString(partyIn.date || row.party_date);
    const time = asString(partyIn.time || row.party_time).slice(0, 5);
    const name = asString(reservationIn.name || row.contact_name);
    const tableIds = Array.isArray(reservationIn.tableIds)
      ? reservationIn.tableIds.map(String)
      : ((existingPayload.reservation as { tableIds?: string[] })?.tableIds || []).map(String);
    const kids = Number.isFinite(Number(reservationIn.kids))
      ? Math.max(0, Number(reservationIn.kids))
      : Number(row.guest_kids) || 0;
    const adults = Number.isFinite(Number(reservationIn.adults))
      ? Math.max(0, Number(reservationIn.adults))
      : Number(row.guest_adults) || 0;
    const guests = kids + adults || Number(reservationIn.guests) || 1;

    if (!date || !time || !name || !tableIds.length) {
      return json({ ok: false, error: "Please complete the reservation details." }, 400, origin);
    }
    if (await tablesClash(date, time, tableIds, "reservation", "", String(row.id))) {
      return json(
        { ok: false, error: "That table is already reserved for this 2-hour slot. Please pick another." },
        409,
        origin
      );
    }

    const emailRaw = asString(payloadIn.email ?? row.email).toLowerCase();
    const phoneRaw = asString(payloadIn.phone ?? row.phone).replace(/\s+/g, "");
    const email = EMAIL_RE.test(emailRaw) ? emailRaw : null;
    const phone = PHONE_RE.test(phoneRaw) ? phoneRaw : null;
    if (!email && !phone) {
      return json({ ok: false, error: "Please add an email or WhatsApp number." }, 400, origin);
    }

    const prevRes =
      existingPayload.reservation && typeof existingPayload.reservation === "object"
        ? (existingPayload.reservation as Record<string, unknown>)
        : {};
    const nextReservation = {
      ...prevRes,
      name,
      salutation: asString(reservationIn.salutation || prevRes.salutation),
      purpose: asString(reservationIn.purpose ?? prevRes.purpose),
      notes: asString(reservationIn.notes ?? prevRes.notes),
      tableIds,
      tableLabel: asString(reservationIn.tableLabel || prevRes.tableLabel),
      area: asString(reservationIn.area || prevRes.area),
      kids,
      adults,
      guests,
      endTime: asString(reservationIn.endTime || prevRes.endTime),
    };
    const nextParty = {
      ...((existingPayload.party as Record<string, unknown>) || {}),
      date,
      time,
    };
    const nextPayload = {
      ...existingPayload,
      reservation: nextReservation,
      party: nextParty,
    };

    const oldRecord = { ...row };
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update({
        email,
        phone,
        contact_name: emptyToNull(name),
        party_date: date,
        party_time: time,
        guest_kids: kids,
        guest_adults: adults,
        package_name: emptyToNull(asString(nextReservation.tableLabel)),
        package_id: emptyToNull(asString(nextReservation.area)),
        payload: nextPayload,
      })
      .eq("id", row.id)
      .select(SELECT_COLS)
      .single();
    if (updateError || !updated) {
      console.error(updateError);
      return json({ ok: false, error: "Could not update the reservation." }, 500, origin);
    }
    await notifyCalendar(updated as Record<string, unknown>, oldRecord as Record<string, unknown>);
    return json({ ok: true, booking: publicRow(updated as Record<string, unknown>) }, 200, origin);
  }

  if (source === "party_builder") {
    const partyIn =
      payloadIn.party && typeof payloadIn.party === "object"
        ? (payloadIn.party as Record<string, unknown>)
        : {};
    const prevParty =
      existingPayload.party && typeof existingPayload.party === "object"
        ? (existingPayload.party as Record<string, unknown>)
        : {};
    const prevRes =
      existingPayload.reservation && typeof existingPayload.reservation === "object"
        ? (existingPayload.reservation as Record<string, unknown>)
        : {};

    const date = asString(partyIn.date || row.party_date);
    const time = asString(partyIn.time || row.party_time).slice(0, 5);
    const childName = asString(partyIn.childName || row.child_name);
    const childAge = asString(partyIn.childAge ?? row.child_age);
    const notes = asString(partyIn.notes ?? prevParty.notes);
    const foodNotes = asString(partyIn.foodNotes ?? prevParty.foodNotes);
    const guestKids = Number.isFinite(Number(partyIn.guestKids))
      ? Math.max(0, Number(partyIn.guestKids))
      : Number(row.guest_kids) || 0;
    const guestAdults = Number.isFinite(Number(partyIn.guestAdults))
      ? Math.max(0, Number(partyIn.guestAdults))
      : Number(row.guest_adults) || 0;
    const tableIds = Array.isArray(prevRes.tableIds) ? prevRes.tableIds.map(String) : [];

    if (!date || !time || !childName) {
      return json({ ok: false, error: "Please complete the party details." }, 400, origin);
    }
    if (tableIds.length && (await tablesClash(date, time, tableIds, "birthday", "", String(row.id)))) {
      return json(
        { ok: false, error: "Those tables are already reserved for this party time. Please pick another." },
        409,
        origin
      );
    }

    const emailRaw = asString(payloadIn.email ?? row.email).toLowerCase();
    const phoneRaw = asString(payloadIn.phone ?? row.phone).replace(/\s+/g, "");
    const email = EMAIL_RE.test(emailRaw) ? emailRaw : null;
    const phone = PHONE_RE.test(phoneRaw) ? phoneRaw : null;
    if (!email && !phone) {
      return json({ ok: false, error: "Please add an email or WhatsApp number." }, 400, origin);
    }

    const nextParty = {
      ...prevParty,
      date,
      time,
      childName,
      childAge,
      notes,
      foodNotes,
      guestKids,
      guestAdults,
    };
    const nextPayload = {
      ...existingPayload,
      party: nextParty,
    };

    const oldRecord = { ...row };
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update({
        email,
        phone,
        contact_name: emptyToNull(asString(payloadIn.contactName || row.contact_name || childName)),
        child_name: emptyToNull(childName),
        child_age: emptyToNull(childAge),
        party_date: date,
        party_time: time,
        guest_kids: guestKids,
        guest_adults: guestAdults,
        payload: nextPayload,
      })
      .eq("id", row.id)
      .select(SELECT_COLS)
      .single();
    if (updateError || !updated) {
      console.error(updateError);
      return json({ ok: false, error: "Could not update the birthday request." }, 500, origin);
    }
    await notifyCalendar(updated as Record<string, unknown>, oldRecord as Record<string, unknown>);
    return json({ ok: true, booking: publicRow(updated as Record<string, unknown>) }, 200, origin);
  }

  if (source === "cake") {
    const cakeIn =
      payloadIn.cake && typeof payloadIn.cake === "object"
        ? (payloadIn.cake as Record<string, unknown>)
        : {};
    const partyIn =
      payloadIn.party && typeof payloadIn.party === "object"
        ? (payloadIn.party as Record<string, unknown>)
        : {};
    const prevCake =
      existingPayload.cake && typeof existingPayload.cake === "object"
        ? (existingPayload.cake as Record<string, unknown>)
        : {};
    const prevParty =
      existingPayload.party && typeof existingPayload.party === "object"
        ? (existingPayload.party as Record<string, unknown>)
        : {};

    const date = asString(partyIn.date || row.party_date || prevParty.date);
    const size = asString(cakeIn.size ?? prevCake.size);
    if (!date || !size) {
      return json({ ok: false, error: "Please choose a cake size and date." }, 400, origin);
    }

    const emailRaw = asString(payloadIn.email ?? row.email).toLowerCase();
    const phoneRaw = asString(payloadIn.phone ?? row.phone).replace(/\s+/g, "");
    const email = EMAIL_RE.test(emailRaw) ? emailRaw : null;
    const phone = PHONE_RE.test(phoneRaw) ? phoneRaw : null;
    if (!email && !phone) {
      return json({ ok: false, error: "Please add an email or WhatsApp number." }, 400, origin);
    }

    const nextCake = {
      ...prevCake,
      size,
      priceLabel: asString(cakeIn.priceLabel ?? prevCake.priceLabel),
      sponges: Array.isArray(cakeIn.sponges) ? cakeIn.sponges : prevCake.sponges || [],
      sugarSponge: asString(cakeIn.sugarSponge ?? prevCake.sugarSponge),
      mode: asString(cakeIn.mode ?? prevCake.mode),
      design: asString(cakeIn.design ?? prevCake.design),
      theme: asString(cakeIn.theme ?? prevCake.theme),
      diet: Array.isArray(cakeIn.diet) ? cakeIn.diet : prevCake.diet || [],
      notes: asString(cakeIn.notes ?? prevCake.notes),
    };
    const nextParty = {
      ...prevParty,
      date,
    };
    const nextPayload = {
      ...existingPayload,
      cake: nextCake,
      party: nextParty,
    };

    const oldRecord = { ...row };
    const { data: updated, error: updateError } = await supabase
      .from("requests")
      .update({
        email,
        phone,
        party_date: date,
        payload: nextPayload,
      })
      .eq("id", row.id)
      .select(SELECT_COLS)
      .single();
    if (updateError || !updated) {
      console.error(updateError);
      return json({ ok: false, error: "Could not update the cake request." }, 500, origin);
    }
    await notifyCalendar(updated as Record<string, unknown>, oldRecord as Record<string, unknown>);
    return json({ ok: true, booking: publicRow(updated as Record<string, unknown>) }, 200, origin);
  }

  return json({ ok: false, error: "This booking type cannot be edited online." }, 400, origin);
});
