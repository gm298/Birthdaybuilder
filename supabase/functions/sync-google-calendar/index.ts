import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.9.6";

const TZ = "Asia/Makassar";
const SLOT_MINUTES = 120;
const RES_BEFORE = 30;
const RES_AFTER = 30;
const BDAY_BEFORE = 60;
const BDAY_AFTER = 180;
const CAFE_LOCATION =
  "Gg. Anggrek Gg. Jepun No.5, Tibubeneng, Kec. Kuta Utara, Kabupaten Badung, Bali 80361, Indonesia";
const COOKING_KEY = "weekly";

type RequestRow = {
  id?: string;
  source?: string;
  status?: string;
  public_code?: string | null;
  email?: string | null;
  phone?: string | null;
  contact_name?: string | null;
  child_name?: string | null;
  party_date?: string | null;
  party_time?: string | null;
  package_name?: string | null;
  guest_adults?: number | null;
  guest_kids?: number | null;
  staff_notes?: string | null;
  google_event_id?: string | null;
  files?: {
    quotePdf?: string;
    eventPhotos?: string[];
  } | null;
  payload?: {
    reservation?: {
      name?: string;
      tableLabel?: string;
      tableIds?: string[];
      endTime?: string;
      purpose?: string;
      notes?: string;
      area?: string;
    };
    event?: {
      name?: string;
      notes?: string;
      location?: string;
      fullTerrace?: boolean;
      payment?: string;
      guests?: { name?: string; pax?: number; phone?: string; email?: string; notes?: string }[];
    };
    party?: { notes?: string; foodNotes?: string };
  } | null;
};

function googleError(data: Record<string, unknown>) {
  const err = data.error;
  if (err && typeof err === "object" && "message" in err) return String((err as { message: unknown }).message);
  return asString(err) || "Google Calendar error";
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function asString(value: unknown) {
  return String(value ?? "").trim();
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

function shiftDate(iso: string, dayDelta: number) {
  const [year, month, day] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day + dayDelta));
  return dt.toISOString().slice(0, 10);
}

function dateTimeAt(isoDate: string, minutes: number) {
  let date = isoDate;
  let mins = minutes;
  while (mins < 0) {
    date = shiftDate(date, -1);
    mins += 24 * 60;
  }
  while (mins >= 24 * 60) {
    date = shiftDate(date, 1);
    mins -= 24 * 60;
  }
  const hour = String(Math.floor(mins / 60)).padStart(2, "0");
  const min = String(mins % 60).padStart(2, "0");
  return `${date}T${hour}:${min}:00`;
}

function typeLabel(source: string) {
  if (source === "party_builder") return "Birthday";
  if (source === "cake") return "Cake";
  if (source === "pdf_quote") return "PDF";
  if (source === "event") return "Event";
  return "Reservation";
}

function displayName(row: RequestRow) {
  const reservation = row.payload?.reservation;
  if (row.source === "party_builder" || row.source === "cake" || row.source === "pdf_quote") {
    return row.child_name || row.contact_name || "Guest";
  }
  return (
    row.contact_name ||
    reservation?.name ||
    row.payload?.event?.name ||
    row.child_name ||
    "Guest"
  );
}

function tableText(row: RequestRow) {
  return row.payload?.reservation?.tableLabel || row.package_name || "";
}

function guestText(row: RequestRow) {
  const eventGuests = row.payload?.event?.guests;
  if (Array.isArray(eventGuests) && eventGuests.length) {
    const pax = eventGuests.reduce((sum, guest) => sum + (Number(guest.pax) || 0), 0);
    return `${eventGuests.length} names · ${pax} pax`;
  }
  const parts = [
    row.guest_kids ? `${row.guest_kids} kids` : "",
    row.guest_adults ? `${row.guest_adults} adults` : "",
  ].filter(Boolean);
  return parts.join(" · ") || "";
}

function colorId(source: string) {
  if (source === "event") return "3";
  if (source === "party_builder" || source === "cake" || source === "pdf_quote") return "2";
  return "9";
}

function shouldHaveEvent(row: RequestRow | null | undefined) {
  return Boolean(row?.status === "booked" && row.party_date && row.party_time);
}

function shouldKeepEvent(row: RequestRow | null | undefined) {
  return Boolean(row?.status === "closed" && row.google_event_id);
}

function relevantSnapshot(row: RequestRow | null | undefined) {
  if (!row) return "";
  const reservation = row.payload?.reservation || {};
  return JSON.stringify({
    status: row.status,
    source: row.source,
    party_date: row.party_date,
    party_time: String(row.party_time || "").slice(0, 8),
    contact_name: row.contact_name,
    child_name: row.child_name,
    package_name: row.package_name,
    guest_adults: row.guest_adults,
    guest_kids: row.guest_kids,
    phone: row.phone,
    email: row.email,
    staff_notes: row.staff_notes,
    tableLabel: reservation.tableLabel,
    endTime: reservation.endTime,
    notes: reservation.notes || row.payload?.event?.notes || row.payload?.party?.notes,
    location: row.payload?.event?.location || reservation.area,
    payment: row.payload?.event?.payment,
    guests: row.payload?.event?.guests,
    quotePdf: row.files?.quotePdf || "",
    eventPhotos: row.files?.eventPhotos || [],
  });
}

function authorized(req: Request) {
  const secret = Deno.env.get("CALENDAR_SYNC_SECRET") || "";
  if (!secret) return false;
  const header = req.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  const alt = req.headers.get("x-calendar-sync-secret") || "";
  return bearer === secret || alt === secret;
}

async function googleAccessToken() {
  const raw = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "";
  const sa = JSON.parse(raw);
  const pem = String(sa.private_key || "").replace(/\\n/g, "\n");
  const key = await importPKCS8(pem, "RS256");
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/drive",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience("https://oauth2.googleapis.com/token")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "Google auth failed");
  }
  return String(data.access_token);
}

function calendarUrl(path = "", query = "") {
  const id = encodeURIComponent(Deno.env.get("GOOGLE_CALENDAR_ID") || "");
  return `https://www.googleapis.com/calendar/v3/calendars/${id}/events${path}${query}`;
}

async function gcal(token: string, method: string, path: string, body?: unknown, query = "") {
  const res = await fetch(path.startsWith("http") ? path : calendarUrl(path, query), {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

function mimeFromPath(path: string) {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "application/pdf";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic" || ext === "heif") return "image/heic";
  return "image/jpeg";
}

function fileTitle(path: string, fallback: string) {
  const base = path.split("/").pop() || fallback;
  return base;
}

async function driveJson(token: string, method: string, url: string, body?: unknown, contentType = "application/json") {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && !(body instanceof Uint8Array) ? { "Content-Type": contentType } : {}),
    },
    body: body instanceof Uint8Array ? body : body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { ok: res.ok, status: res.status, data };
}

async function driveFind(token: string, name: string) {
  const q = encodeURIComponent(`name='${name.replace(/'/g, "\\'")}' and trashed=false`);
  const found = await driveJson(
    token,
    "GET",
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,webViewLink)&pageSize=1`
  );
  const files = Array.isArray(found.data.files) ? (found.data.files as { id?: string; mimeType?: string; webViewLink?: string; name?: string }[]) : [];
  return files[0] || null;
}

async function driveShare(token: string, fileId: string) {
  await driveJson(token, "POST", `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/permissions`, {
    role: "reader",
    type: "anyone",
  });
}

async function driveUpload(token: string, name: string, mime: string, bytes: Uint8Array) {
  const existing = await driveFind(token, name);
  if (existing?.id) {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(existing.id)}?uploadType=media&fields=id,webViewLink,name,mimeType`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": mime,
        },
        body: bytes,
      }
    );
    const data = await res.json();
    if (res.ok && data.id) {
      await driveShare(token, String(data.id));
      return { fileId: String(data.id), mimeType: mime, title: name, fileUrl: String(data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`) };
    }
  }
  const metadata = JSON.stringify({ name, mimeType: mime });
  const boundary = "tiny_upload_boundary";
  const encoder = new TextEncoder();
  const metaPart = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
  );
  const fileHead = encoder.encode(`--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`);
  const tail = encoder.encode(`\r\n--${boundary}--`);
  const body = new Uint8Array(metaPart.length + fileHead.length + bytes.length + tail.length);
  body.set(metaPart, 0);
  body.set(fileHead, metaPart.length);
  body.set(bytes, metaPart.length + fileHead.length);
  body.set(tail, metaPart.length + fileHead.length + bytes.length);
  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,name,mimeType",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(data.error?.message || "Could not upload calendar attachment");
  }
  await driveShare(token, String(data.id));
  return {
    fileId: String(data.id),
    mimeType: mime,
    title: name,
    fileUrl: String(data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`),
  };
}

function attachmentPaths(row: RequestRow) {
  const files = row.files || {};
  const items: { path: string; title: string }[] = [];
  if (files.quotePdf) items.push({ path: files.quotePdf, title: `${row.id}-quotation.pdf` });
  (files.eventPhotos || []).forEach((path, index) => {
    const ext = path.split(".").pop() || "jpg";
    items.push({ path, title: `${row.id}-event-${index + 1}.${ext}` });
  });
  return items;
}

async function calendarAttachments(token: string, row: RequestRow) {
  const supabase = adminClient();
  const attachments: { fileId: string; mimeType: string; title: string; fileUrl: string }[] = [];
  const links: string[] = [];
  for (const item of attachmentPaths(row)) {
    try {
      const { data, error } = await supabase.storage.from("request-files").download(item.path);
      if (error || !data) {
        const signed = await supabase.storage.from("request-files").createSignedUrl(item.path, 60 * 60 * 24 * 365);
        if (signed.data?.signedUrl) links.push(`${fileTitle(item.path, item.title)}: ${signed.data.signedUrl}`);
        continue;
      }
      const bytes = new Uint8Array(await data.arrayBuffer());
      const uploaded = await driveUpload(token, item.title, mimeFromPath(item.path), bytes);
      attachments.push(uploaded);
      links.push(`${uploaded.title}: ${uploaded.fileUrl}`);
    } catch (err) {
      console.error("attachment failed", item.path, err);
      const signed = await supabase.storage.from("request-files").createSignedUrl(item.path, 60 * 60 * 24 * 365);
      if (signed.data?.signedUrl) links.push(`${fileTitle(item.path, item.title)}: ${signed.data.signedUrl}`);
    }
  }
  return { attachments, links };
}

async function eventBody(token: string, row: RequestRow) {
  const source = String(row.source || "reservation");
  const kind = occupyKind(source);
  const endTime = asString(row.payload?.reservation?.endTime);
  const range = occupyRange(asString(row.party_time), kind, endTime);
  const date = asString(row.party_date);
  if (!range || !date) return null;
  const name = displayName(row);
  const tables = tableText(row);
  const guests = guestText(row);
  const notes = [
    row.payload?.reservation?.notes,
    row.payload?.event?.notes,
    row.payload?.party?.foodNotes,
    row.payload?.party?.notes,
    row.staff_notes,
  ]
    .map((item) => asString(item))
    .filter(Boolean);
  const event = row.payload?.event || {};
  const guestLines = (event.guests || [])
    .map((guest) => {
      const bits = [guest.name, guest.pax ? `${guest.pax} pax` : "", guest.phone, guest.email, guest.notes].filter(Boolean);
      return bits.length ? `Guest: ${bits.join(" · ")}` : "";
    })
    .filter(Boolean);
  const { attachments, links } = await calendarAttachments(token, row);
  const description = [
    row.public_code ? `Code: ${row.public_code}` : "",
    guests ? `Guests: ${guests}` : "",
    tables ? `Tables: ${tables}` : "",
    event.location === "masterclass" ? "Location: In masterclass" : event.location === "service" ? "Location: In service area" : "",
    event.fullTerrace ? "Block: Full terrace" : "",
    event.payment === "vendor" ? "Payment: By vendor" : event.payment === "tiny" ? "Payment: By Tiny" : "",
    row.phone ? `Phone: ${row.phone}` : "",
    row.email ? `Email: ${row.email}` : "",
    row.payload?.reservation?.purpose ? `Purpose: ${row.payload.reservation.purpose}` : "",
    ...notes.map((note) => `Notes: ${note}`),
    ...guestLines,
    ...links.map((link) => `File: ${link}`),
  ]
    .filter(Boolean)
    .join("\n");
  return {
    summary: [typeLabel(source), name, tables].filter(Boolean).join(" · "),
    description,
    location: CAFE_LOCATION,
    start: { dateTime: dateTimeAt(date, range.start), timeZone: TZ },
    end: { dateTime: dateTimeAt(date, range.end), timeZone: TZ },
    colorId: colorId(source),
    extendedProperties: { private: { requestId: String(row.id || "") } },
    ...(attachments.length ? { attachments } : {}),
  };
}

function adminClient() {
  return createClient(Deno.env.get("SUPABASE_URL") || "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "", {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function saveEventId(id: string, googleEventId: string | null) {
  const supabase = adminClient();
  await supabase.from("requests").update({ google_event_id: googleEventId }).eq("id", id);
}

async function upsertEvent(token: string, row: RequestRow) {
  const body = await eventBody(token, row);
  if (!body || !row.id) return { action: "skip" as const };
  const attachQuery = "?supportsAttachments=true";
  if (row.google_event_id) {
    const patched = await gcal(token, "PATCH", `/${encodeURIComponent(row.google_event_id)}`, body, attachQuery);
    if (patched.ok) return { action: "updated" as const, id: row.google_event_id };
    if (patched.status !== 404) {
      throw new Error(googleError(patched.data) || "Could not update Google event");
    }
  }
  const created = await gcal(token, "POST", "", body, attachQuery);
  const eventId = asString(created.data.id);
  if (!created.ok || !eventId) {
    throw new Error(googleError(created.data) || "Could not create Google event");
  }
  await saveEventId(row.id, eventId);
  return { action: "created" as const, id: eventId };
}

async function deleteEvent(token: string, row: RequestRow, persist = true) {
  if (!row.google_event_id) return { action: "skip" as const };
  await gcal(token, "DELETE", `/${encodeURIComponent(row.google_event_id)}`);
  if (persist && row.id) await saveEventId(row.id, null);
  return { action: "deleted" as const, id: row.google_event_id };
}

async function syncRow(token: string, row: RequestRow | null) {
  if (!row?.id) return { action: "skip" as const };
  if (shouldHaveEvent(row)) return upsertEvent(token, row);
  if (shouldKeepEvent(row)) return { action: "kept" as const, id: row.google_event_id };
  return deleteEvent(token, row);
}

function nextSaturdayIso() {
  const now = new Date();
  const bali = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  const day = bali.getDay();
  const add = (6 - day + 7) % 7;
  bali.setDate(bali.getDate() + add);
  const year = bali.getFullYear();
  const month = String(bali.getMonth() + 1).padStart(2, "0");
  const date = String(bali.getDate()).padStart(2, "0");
  return `${year}-${month}-${date}`;
}

async function seedCookingClass(token: string) {
  const search = await gcal(
    token,
    "GET",
    calendarUrl("", `?privateExtendedProperty=${encodeURIComponent(`cookingClass=${COOKING_KEY}`)}&maxResults=1`)
  );
  const existing = Array.isArray(search.data.items) ? search.data.items[0] as { id?: string } : null;
  if (existing?.id) return { action: "exists" as const, id: existing.id };
  const saturday = nextSaturdayIso();
  const body = {
    summary: "Cooking class · Tables 18 & 19",
    description:
      "Weekly cooking class. Terrace tables 18 and 19 are unavailable every Saturday from 14:00 to 17:00.",
    location: CAFE_LOCATION,
    start: { dateTime: `${saturday}T14:00:00`, timeZone: TZ },
    end: { dateTime: `${saturday}T17:00:00`, timeZone: TZ },
    recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=SA"],
    colorId: "6",
    extendedProperties: { private: { cookingClass: COOKING_KEY } },
  };
  const created = await gcal(token, "POST", "", body);
  const eventId = asString(created.data.id);
  if (!created.ok || !eventId) {
    throw new Error(googleError(created.data) || "Could not create cooking class event");
  }
  return { action: "created" as const, id: eventId };
}

async function backfill(token: string) {
  const supabase = adminClient();
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, source, status, public_code, email, phone, contact_name, child_name, party_date, party_time, package_name, guest_adults, guest_kids, staff_notes, google_event_id, payload, files"
    )
    .eq("status", "booked")
    .not("party_date", "is", null)
    .not("party_time", "is", null)
    .limit(500);
  if (error) throw error;
  const results = [];
  for (const row of data || []) {
    results.push({ id: row.id, ...(await syncRow(token, row as RequestRow)) });
  }
  return { count: results.length, results };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (!authorized(req)) return json({ ok: false, error: "Unauthorized" }, 401);

  const calendarId = Deno.env.get("GOOGLE_CALENDAR_ID") || "";
  const sa = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "";
  if (!calendarId || !sa) {
    return json({ ok: false, error: "Google Calendar is not configured." }, 500);
  }

  try {
    const token = await googleAccessToken();
    const url = new URL(req.url);

    if (url.searchParams.get("backfill") === "1") {
      if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);
      return json({ ok: true, ...(await backfill(token)) });
    }
    if (url.searchParams.get("seed_cooking_class") === "1") {
      if (req.method !== "POST") return json({ ok: false, error: "POST required" }, 405);
      return json({ ok: true, cookingClass: await seedCookingClass(token) });
    }

    if (req.method === "GET") {
      return json({ ok: true, ready: true });
    }

    let payload: { type?: string; record?: RequestRow | null; old_record?: RequestRow | null } = {};
    try {
      payload = await req.json();
    } catch {
      return json({ ok: false, error: "Invalid JSON" }, 400);
    }

    const type = asString(payload.type).toUpperCase();
    const record = payload.record || null;
    const oldRecord = payload.old_record || null;

    if (type === "DELETE") {
      const result = await deleteEvent(token, oldRecord || {}, false);
      return json({ ok: true, result });
    }

    if (type === "UPDATE" && relevantSnapshot(record) === relevantSnapshot(oldRecord) && record?.google_event_id) {
      return json({ ok: true, result: { action: "noop" } });
    }

    const result = await syncRow(token, record);
    return json({ ok: true, result });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: err instanceof Error ? err.message : "Calendar sync failed" }, 500);
  }
});
