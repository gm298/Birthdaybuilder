export type BookingEmailKind = "reservation" | "birthday" | "cake";

export type BookingEmailInput = {
  kind?: BookingEmailKind;
  to: string;
  publicCode: string;
  manageToken: string;
  guestName: string;
  partyDate: string;
  partyTime?: string;
  guestsLabel?: string;
  tableLabel?: string;
  purpose?: string;
  packageName?: string;
  cakeLabel?: string;
};

function siteOrigin() {
  return (Deno.env.get("PUBLIC_SITE_ORIGIN") || "https://tinyhealthycafe.com").replace(/\/$/, "");
}

function manageLink(token: string) {
  return `${siteOrigin()}/booking/?t=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function copyForKind(kind: BookingEmailKind) {
  if (kind === "birthday") {
    return {
      subject: (code: string) => `Your Tiny birthday plan ${code}`,
      saved: "Your birthday plan at Tiny Healthy Cafe is saved.",
      linkLabel: "View, edit or cancel your birthday plan",
    };
  }
  if (kind === "cake") {
    return {
      subject: (code: string) => `Your Tiny cake order ${code}`,
      saved: "Your cake request at Tiny Healthy Cafe is saved.",
      linkLabel: "View, edit or cancel your cake request",
    };
  }
  return {
    subject: (code: string) => `Your Tiny reservation ${code}`,
    saved: "Your table request at Tiny Healthy Cafe is saved.",
    linkLabel: "View, edit or cancel your reservation",
  };
}

export async function sendBookingEmail(input: BookingEmailInput) {
  const apiKey = Deno.env.get("RESEND_API_KEY") || "";
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; skipping booking email");
    return { ok: false, skipped: true };
  }
  const kind = input.kind || "reservation";
  const copy = copyForKind(kind);
  const from =
    Deno.env.get("BOOKING_FROM_EMAIL") || "Tiny Healthy Cafe <onboarding@resend.dev>";
  const link = manageLink(input.manageToken);
  const subject = copy.subject(input.publicCode);
  const detailLines = [
    `Code: ${input.publicCode}`,
    input.partyDate ? `Date: ${input.partyDate}` : "",
    input.partyTime ? `Time: ${input.partyTime}` : "",
    input.guestsLabel ? `Guests: ${input.guestsLabel}` : "",
    input.packageName ? `Package: ${input.packageName}` : "",
    input.tableLabel ? `Table: ${input.tableLabel}` : "",
    input.cakeLabel ? `Cake: ${input.cakeLabel}` : "",
    input.purpose ? `Purpose: ${input.purpose}` : "",
  ].filter(Boolean);

  const text = [
    `Hi ${input.guestName || "there"},`,
    "",
    copy.saved,
    "",
    ...detailLines,
    "",
    `View, edit or cancel: ${link}`,
    "",
    "Tiny Healthy Cafe · Berawa, Bali",
    "+62 822 6648 4226",
  ].join("\n");

  const htmlDetails = [
    `<strong>Code:</strong> ${escapeHtml(input.publicCode)}`,
    input.partyDate ? `<strong>Date:</strong> ${escapeHtml(input.partyDate)}` : "",
    input.partyTime ? `<strong>Time:</strong> ${escapeHtml(input.partyTime)}` : "",
    input.guestsLabel ? `<strong>Guests:</strong> ${escapeHtml(input.guestsLabel)}` : "",
    input.packageName ? `<strong>Package:</strong> ${escapeHtml(input.packageName)}` : "",
    input.tableLabel ? `<strong>Table:</strong> ${escapeHtml(input.tableLabel)}` : "",
    input.cakeLabel ? `<strong>Cake:</strong> ${escapeHtml(input.cakeLabel)}` : "",
    input.purpose ? `<strong>Purpose:</strong> ${escapeHtml(input.purpose)}` : "",
  ]
    .filter(Boolean)
    .join("<br>");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Jost:wght@500;600&family=Tenor+Sans&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f7f5ee;">
  <div style="margin:0;padding:32px 16px;background:#f7f5ee;font-family:'Tenor Sans',Georgia,serif;color:#33413a;">
    <div style="max-width:560px;margin:0 auto;background:#fbfaf7;border-radius:18px;overflow:hidden;border:1px solid rgba(100,124,110,0.16);">
      <div style="padding:28px 28px 8px;">
        <img src="https://gm298.github.io/Birthdaybuilder/birthdays/builder/img/quote/logo-tiny.png" alt="Tiny" width="54" height="54" style="display:block;width:54px;height:auto;margin:0 0 14px;">
        <p style="margin:0;font-family:'Jost',sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#647c6e;">Tiny Healthy Cafe</p>
        <h1 style="margin:8px 0 0;font-family:'Jost',sans-serif;font-size:32px;line-height:1.1;font-weight:500;color:#647c6e;">Birthday Bash<br>at Tiny</h1>
      </div>
      <div style="padding:8px 28px 28px;">
        <p style="margin:0 0 8px;font-size:16px;color:#3d4f45;">Hi ${escapeHtml(input.guestName || "there")},</p>
        <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">${escapeHtml(copy.saved)}</p>
        <div style="padding:14px 16px;border-radius:12px;background:#ffffff;border:1px solid rgba(100,124,110,0.16);font-size:14px;line-height:1.7;color:#3d4f45;">
          ${htmlDetails}
        </div>
        <p style="margin:22px 0;">
          <a href="${escapeHtml(link)}" style="display:inline-block;background:#647c6e;color:#ffffff;text-decoration:none;border-radius:999px;padding:12px 20px;font-family:'Jost',sans-serif;font-weight:500;">${escapeHtml(copy.linkLabel)}</a>
        </p>
        <p style="margin:0;color:#8a9c8f;font-size:13px;line-height:1.5;">Tiny Healthy Cafe · Berawa, Bali<br>+62 822 6648 4226</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject,
        text,
        html,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend error", body);
      return { ok: false, error: body };
    }
    return { ok: true, id: body.id };
  } catch (err) {
    console.error("Resend send failed", err);
    return { ok: false, error: String(err) };
  }
}

/** @deprecated Prefer sendBookingEmail({ kind: "reservation", ... }) */
export async function sendReservationEmail(input: Omit<BookingEmailInput, "kind">) {
  return sendBookingEmail({ ...input, kind: "reservation" });
}
