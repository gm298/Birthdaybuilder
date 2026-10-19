/**
 * Future: submit guest cart lines to ESB Save Order / QS.
 * v1 stub — validates shape lightly, never writes to POS.
 */
import { loadEsbConfig } from "../_shared/esb.ts";

const ALLOWED_ORIGINS = [
  "https://tinyhealthycafe.com",
  "https://www.tinyhealthycafe.com",
  "https://gm298.github.io",
  "http://127.0.0.1:8777",
  "http://localhost:8777",
];

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

type OrderLine = {
  dishId?: string;
  esbMenuId?: string | null;
  size?: string;
  opts?: Record<string, unknown>;
  qty?: number;
  unitPrice?: number | null;
  name?: string;
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const cfg = loadEsbConfig();
  let body: { mode?: string; lines?: OrderLine[]; tableHint?: string | null } = {};
  try {
    body = await req.json();
  } catch (_) {
    return json({ error: "Invalid JSON" }, 400, origin);
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (!lines.length) {
    return json({ error: "lines required", enabled: false }, 400, origin);
  }

  if (!cfg.menuOrderingEnabled) {
    return json(
      {
        enabled: false,
        mode: body.mode || "esb_order",
        lineCount: lines.length,
        shopUrl: "https://esborder.qs.esb.co.id/TYKB/THFC/mode",
        message:
          "In-app ESB ordering is off. Guests should use Order online (ESB Order QS) or show My list to the waiter.",
      },
      501,
      origin,
    );
  }

  // Reserved for future POS write via esbFetch(cfg, ...)
  return json({ enabled: true, accepted: false, message: "Not implemented" }, 501, origin);
});
