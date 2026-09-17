export type BookingEmailInput = {
  to: string;
  publicCode: string;
  manageToken: string;
  guestName: string;
  partyDate: string;
  partyTime: string;
  guestsLabel: string;
  tableLabel: string;
  purpose?: string;
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

export async function sendReservationEmail(input: BookingEmailInput) {
  const apiKey = Deno.env.get("RESEND_API_KEY") || "";
  if (!apiKey) {
    console.warn("RESEND_API_KEY not set; skipping reservation email");
    return { ok: false, skipped: true };
  }
  const from =
    Deno.env.get("BOOKING_FROM_EMAIL") || "Tiny Healthy Cafe <onboarding@resend.dev>";
  const link = manageLink(input.manageToken);
  const subject = `Your Tiny reservation ${input.publicCode}`;
  const text = [
    `Hi ${input.guestName || "there"},`,
    "",
    "Your table request at Tiny Healthy Cafe is saved.",
    "",
    `Code: ${input.publicCode}`,
    `Date: ${input.partyDate}`,
    `Time: ${input.partyTime}`,
    `Guests: ${input.guestsLabel}`,
    input.tableLabel ? `Table: ${input.tableLabel}` : "",
    input.purpose ? `Purpose: ${input.purpose}` : "",
    "",
    `View, edit or cancel: ${link}`,
    "",
    "Tiny Healthy Cafe · Berawa, Bali",
    "+62 822 6648 4226",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Georgia,serif;color:#33413a;line-height:1.5">
      <p>Hi ${escapeHtml(input.guestName || "there")},</p>
      <p>Your table request at <strong>Tiny Healthy Cafe</strong> is saved.</p>
      <p>
        <strong>Code:</strong> ${escapeHtml(input.publicCode)}<br>
        <strong>Date:</strong> ${escapeHtml(input.partyDate)}<br>
        <strong>Time:</strong> ${escapeHtml(input.partyTime)}<br>
        <strong>Guests:</strong> ${escapeHtml(input.guestsLabel)}<br>
        ${input.tableLabel ? `<strong>Table:</strong> ${escapeHtml(input.tableLabel)}<br>` : ""}
        ${input.purpose ? `<strong>Purpose:</strong> ${escapeHtml(input.purpose)}<br>` : ""}
      </p>
      <p><a href="${escapeHtml(link)}" style="color:#647c6e">View, edit or cancel your reservation</a></p>
      <p style="color:#8a9c8f;font-size:14px">Tiny Healthy Cafe · Berawa, Bali · +62 822 6648 4226</p>
    </div>
  `;

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
