/** Shared ESB Order / QS client helpers (reservations + future menu ordering). */

export type EsbConfig = {
  token: string;
  company: string;
  branch: string;
  baseUrl: string;
  visitPurposeId?: string;
  menuOrderingEnabled: boolean;
};

export function loadEsbConfig(): EsbConfig {
  return {
    token: Deno.env.get("ESB_TOKEN") || "",
    company: Deno.env.get("ESB_COMPANY") || "TYKB",
    branch: Deno.env.get("ESB_BRANCH") || "THFC",
    baseUrl: (Deno.env.get("ESB_BASE_URL") || "https://eso-api.esb.co.id").replace(/\/$/, ""),
    visitPurposeId: Deno.env.get("ESB_VISIT_PURPOSE_ID") || "",
    menuOrderingEnabled: String(Deno.env.get("MENU_ORDERING_ENABLED") || "").toLowerCase() === "true",
  };
}

export function esbHeaders(cfg: EsbConfig): HeadersInit {
  return {
    Authorization: `Bearer ${cfg.token}`,
    "Data-Company": cfg.company,
    "Data-Branch": cfg.branch,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export async function esbFetch(
  cfg: EsbConfig,
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  if (!cfg.token) throw new Error("ESB_TOKEN is not configured");
  const url = `${cfg.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  return fetch(url, {
    ...init,
    headers: {
      ...esbHeaders(cfg),
      ...(init.headers || {}),
    },
  });
}
