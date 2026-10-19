(() => {
  "use strict";

  const SHOP_URL = "https://esborder.qs.esb.co.id/TYKB/THFC/mode";

  function assetBase() {
    if (window.TINY_WP && window.TINY_WP.menuAssetBase) return window.TINY_WP.menuAssetBase;
    return "";
  }

  function assetUrl(path) {
    if (!path) return "";
    if (/^https?:\/\//i.test(path) || path.startsWith("data:")) return path;
    return new URL(assetBase() + path.replace(/^\//, ""), location.href).href;
  }

  async function fetchLiveSnapshot() {
    const cfg = window.TINY_SUPABASE || {};
    if (!cfg.url || !cfg.anonKey || location.protocol === "file:") return null;
    try {
      const res = await fetch(
        `${cfg.url}/rest/v1/menu_snapshots?status=eq.live&select=version,payload,published_at&limit=1`,
        {
          headers: {
            apikey: cfg.anonKey,
            Authorization: `Bearer ${cfg.anonKey}`,
          },
        }
      );
      if (!res.ok) return null;
      const rows = await res.json();
      const row = Array.isArray(rows) ? rows[0] : null;
      return row && row.payload ? row : null;
    } catch (_) {
      return null;
    }
  }

  async function fetchSeedJson() {
    const url = (window.TINY_WP && window.TINY_WP.menuSeedJson) || "data/menu-seed.json";
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load menu data.");
    return res.json();
  }

  async function loadMenu() {
    const live = await fetchLiveSnapshot();
    if (live && live.payload) {
      return {
        menu: live.payload,
        version: live.version || 1,
        publishedAt: live.published_at || null,
        source: "live",
      };
    }
    const seed = await fetchSeedJson();
    return { menu: seed, version: 1, publishedAt: null, source: "seed" };
  }

  function shopUrl(menu) {
    return (menu && menu.settings && menu.settings.shopUrl) || SHOP_URL;
  }

  window.TinyMenuApi = { loadMenu, assetUrl, shopUrl, SHOP_URL };
})();
