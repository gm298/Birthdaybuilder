/**
 * Future: pull ESB master menu into menu_snapshots draft.
 * v1 stub — disabled until MENU_ORDERING_ENABLED / ESB menu probe is ready.
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

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const cfg = loadEsbConfig();
  return json(
    {
      enabled: false,
      menuOrderingEnabled: cfg.menuOrderingEnabled,
      company: cfg.company,
      branch: cfg.branch,
      message: "ESB menu sync is not enabled yet. Guest menu uses Supabase menu_snapshots.",
    },
    501,
    origin,
  );
});
