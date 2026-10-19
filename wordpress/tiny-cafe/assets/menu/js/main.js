(() => {
  "use strict";

  const api = () => window.TinyMenuApi;
  const R = () => window.TinyMenuRender;

  function track(eventName, params) {
    try {
      if (typeof window.gtag === "function") window.gtag("event", eventName, params || {});
      else if (Array.isArray(window.dataLayer)) window.dataLayer.push({ event: eventName, ...(params || {}) });
    } catch (_) {
      /* optional */
    }
  }

  function offerFromUrl() {
    const q = new URLSearchParams(location.search).get("offer");
    if (q) return q;
    const hash = location.hash || "";
    const m = hash.match(/offer=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const app = document.getElementById("dm-app");
    const grid = document.getElementById("dm-grid");
    const sectionsEl = document.getElementById("dm-sections");
    const subsEl = document.getElementById("dm-subs");
    const introEl = document.getElementById("dm-intro");
    const statusEl = document.getElementById("dm-status");
    const fab = document.getElementById("dm-shop-fab");
    const pop = document.getElementById("dm-pop");
    const popBody = document.getElementById("dm-pop-body");
    if (!app || !grid || !api() || !R()) return;

    const state = {
      menu: null,
      sectionId: "",
      sub: "All",
      sizeSel: {},
      cardOpts: {},
      pop: null,
    };

    function dishById(id) {
      return (state.menu?.dishes || []).find((d) => d.id === id);
    }

    function currentSection() {
      return (state.menu?.sections || []).find((s) => s.id === state.sectionId);
    }

    function optsFor(dish) {
      if (!state.cardOpts[dish.id]) {
        state.cardOpts[dish.id] = R().defaultOptsForDish(state.menu, dish);
      }
      return state.cardOpts[dish.id];
    }

    function renderSections() {
      const sections = R().visibleSections(state.menu);
      sectionsEl.innerHTML = sections
        .map(
          (s) =>
            `<button type="button" class="dm-chip" role="tab" aria-selected="${
              s.id === state.sectionId ? "true" : "false"
            }" data-sec="${R().esc(s.id)}">${R().esc(s.name)}</button>`
        )
        .join("");
    }

    function renderSubs() {
      const sec = currentSection();
      const subs = ["All", ...((sec && sec.subs) || [])];
      if (!sec || subs.length <= 1) {
        subsEl.hidden = true;
        subsEl.innerHTML = "";
        return;
      }
      subsEl.hidden = false;
      subsEl.innerHTML = subs
        .map(
          (sub) =>
            `<button type="button" class="dm-subchip${sub === state.sub ? " is-active" : ""}" data-sub="${R().esc(
              sub
            )}">${R().esc(sub)}</button>`
        )
        .join("");
    }

    function renderGrid() {
      const sec = currentSection();
      const layout = (sec && sec.layout) || "cards";
      grid.className = `dm-grid is-${layout}`;
      if (introEl) {
        if (sec && sec.intro) {
          introEl.hidden = false;
          introEl.textContent = sec.intro;
        } else {
          introEl.hidden = true;
          introEl.textContent = "";
        }
      }
      const dishes = R().sectionDishes(state.menu, sec, state.sub);
      if (!dishes.length) {
        grid.innerHTML = `<p class="dm-status">Nothing in this section right now.</p>`;
        return;
      }
      if (layout === "cards") {
        grid.innerHTML = dishes
          .map((d) => {
            const size = state.sizeSel[d.id] || (d.sizes && d.sizes[0] && d.sizes[0].l) || "Adult";
            return R().cardHtml(state.menu, d, size, optsFor(d), api());
          })
          .join("");
      } else {
        grid.innerHTML = dishes.map((d) => R().rowHtml(state.menu, d, optsFor(d), api())).join("");
      }
    }

    function renderAll() {
      renderSections();
      renderSubs();
      renderGrid();
    }

    function openDetail(dish) {
      if (!dish) return;
      const defaultSize =
        state.sizeSel[dish.id] || (dish.sizes && dish.sizes[0] && dish.sizes[0].l) || "Adult";
      state.pop = {
        id: dish.id,
        size: defaultSize,
        opts: { ...optsFor(dish) },
      };
      popBody.innerHTML = R().popHtml(state.menu, dish, state.pop, api());
      pop.hidden = false;
      track("menu_detail_open", { dish_id: dish.id });
    }

    function closePop() {
      pop.hidden = true;
      state.pop = null;
    }

    function syncPop() {
      if (!state.pop) return;
      const dish = dishById(state.pop.id);
      if (!dish) return;
      // Keep card selection in sync when changing options in detail
      state.cardOpts[dish.id] = { ...state.pop.opts };
      if (state.pop.size) state.sizeSel[dish.id] = state.pop.size;
      popBody.innerHTML = R().popHtml(state.menu, dish, state.pop, api());
    }

    sectionsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sec]");
      if (!btn) return;
      state.sectionId = btn.getAttribute("data-sec");
      state.sub = "All";
      renderAll();
    });

    subsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-sub]");
      if (!btn) return;
      state.sub = btn.getAttribute("data-sub");
      renderSubs();
      renderGrid();
    });

    grid.addEventListener("click", (e) => {
      const sizeBtn = e.target.closest("[data-size-for]");
      if (sizeBtn) {
        state.sizeSel[sizeBtn.getAttribute("data-size-for")] = sizeBtn.getAttribute("data-size");
        renderGrid();
        return;
      }
      const opt = e.target.closest("[data-card-opt]");
      if (opt) {
        const card = opt.closest("[data-dish]");
        const dishId = card?.getAttribute("data-dish");
        const dish = dishById(dishId);
        if (!dish) return;
        const gid = opt.getAttribute("data-card-opt-group");
        const oid = opt.getAttribute("data-card-opt");
        const type = opt.getAttribute("data-card-opt-type");
        const opts = optsFor(dish);
        if (type === "many") {
          const cur = Array.isArray(opts[gid]) ? opts[gid].slice() : [];
          const i = cur.indexOf(oid);
          if (i >= 0) cur.splice(i, 1);
          else cur.push(oid);
          opts[gid] = cur;
        } else {
          opts[gid] = oid;
        }
        renderGrid();
        return;
      }
      const open = e.target.closest("[data-open-dish]");
      if (open) {
        openDetail(dishById(open.getAttribute("data-open-dish")));
      }
    });

    pop.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-pop]")) {
        closePop();
        renderGrid();
        return;
      }
      if (!state.pop) return;
      const size = e.target.closest("[data-pop-size]");
      if (size) {
        state.pop.size = size.getAttribute("data-pop-size");
        syncPop();
        return;
      }
      const opt = e.target.closest("[data-pop-opt]");
      if (opt) {
        const gid = opt.getAttribute("data-pop-opt-group");
        const oid = opt.getAttribute("data-pop-opt");
        const type = opt.getAttribute("data-pop-opt-type");
        if (type === "many") {
          const cur = Array.isArray(state.pop.opts[gid]) ? state.pop.opts[gid].slice() : [];
          const i = cur.indexOf(oid);
          if (i >= 0) cur.splice(i, 1);
          else cur.push(oid);
          state.pop.opts[gid] = cur;
        } else {
          state.pop.opts[gid] = oid;
        }
        syncPop();
      }
    });

    try {
      const loaded = await api().loadMenu();
      state.menu = loaded.menu;
      const sections = R().visibleSections(state.menu);
      state.sectionId = sections[0]?.id || "breakfast";
      if (fab) fab.href = api().shopUrl(state.menu);
      if (statusEl) statusEl.hidden = true;
      app.setAttribute("aria-busy", "false");
      renderAll();

      const offer = offerFromUrl();
      if (offer) {
        const dish = dishById(offer);
        if (dish) {
          state.sectionId = dish.sec === "kids" ? "kids" : dish.sec;
          state.sub = dish.sub || "All";
          renderAll();
          openDetail(dish);
        }
      }
      track("menu_digital_view", { source: loaded.source, version: loaded.version });
    } catch (err) {
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = err.message || "Could not load the menu.";
      }
      app.setAttribute("aria-busy", "false");
    }
  });
})();
