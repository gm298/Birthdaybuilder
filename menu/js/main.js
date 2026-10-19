(() => {
  "use strict";

  const api = () => window.TinyMenuApi;
  const cart = () => window.TinyMenuCart;
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
    const listBar = document.getElementById("dm-list-bar");
    const listMeta = document.getElementById("dm-list-meta");
    const fab = document.getElementById("dm-shop-fab");
    const pop = document.getElementById("dm-pop");
    const popBody = document.getElementById("dm-pop-body");
    const listSheet = document.getElementById("dm-list-sheet");
    const listBody = document.getElementById("dm-list-body");
    const listNote = document.getElementById("dm-list-note");
    const listTotal = document.getElementById("dm-list-total");
    const waiter = document.getElementById("dm-waiter");
    if (!app || !grid || !api() || !cart() || !R()) return;

    const state = {
      menu: null,
      sectionId: "",
      sub: "All",
      sizeSel: {},
      pop: null,
      lines: cart().read(),
    };

    function dishById(id) {
      return (state.menu?.dishes || []).find((d) => d.id === id);
    }

    function currentSection() {
      return (state.menu?.sections || []).find((s) => s.id === state.sectionId);
    }

    function refreshBar() {
      const n = cart().count(state.lines);
      const { sum, incomplete } = cart().total(state.lines, state.menu);
      if (listMeta) {
        listMeta.textContent =
          n === 0
            ? "0 items"
            : `${n} item${n === 1 ? "" : "s"} · ${R().fmtPrice(sum)}${incomplete ? "+" : ""}`;
      }
      if (listBar) listBar.hidden = n === 0;
      document.body.classList.toggle("has-list-bar", n > 0);
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
            return R().cardHtml(d, size, api());
          })
          .join("");
      } else {
        grid.innerHTML = dishes.map((d) => R().rowHtml(d, api())).join("");
      }
    }

    function renderAll() {
      renderSections();
      renderSubs();
      renderGrid();
      refreshBar();
    }

    function openPop(dish, opts) {
      if (!dish || dish.soldOut) return;
      const defaultSize =
        (dish.sizes && dish.sizes[0] && dish.sizes[0].l) ||
        state.sizeSel[dish.id] ||
        "Adult";
      const defaultOpts = {};
      (dish.groups || []).forEach((gid) => {
        const g = (state.menu.groups || []).find((x) => x.id === gid);
        if (!g) return;
        if (g.type === "many") defaultOpts[gid] = [];
        else if (g.opts && g.opts[0]) defaultOpts[gid] = g.opts[0].id;
      });
      state.pop = {
        id: dish.id,
        size: opts?.size || defaultSize,
        opts: opts?.opts || defaultOpts,
        qty: 1,
      };
      popBody.innerHTML = R().popHtml(state.menu, dish, state.pop, api());
      pop.hidden = false;
      track("menu_customise_open", { dish_id: dish.id });
    }

    function closePop() {
      pop.hidden = true;
      state.pop = null;
    }

    function syncPop() {
      if (!state.pop) return;
      const dish = dishById(state.pop.id);
      if (!dish) return;
      popBody.innerHTML = R().popHtml(state.menu, dish, state.pop, api());
    }

    function addCurrentPop() {
      if (!state.pop) return;
      const dish = dishById(state.pop.id);
      if (!dish || dish.soldOut) return;
      const labels = R().optLabels(state.menu, state.pop.opts);
      const unit = R().unitPriceFor(state.menu, dish, state.pop.size, state.pop.opts);
      state.lines = cart().add({
        id: dish.id,
        l: state.pop.size,
        opts: state.pop.opts,
        qty: state.pop.qty || 1,
        esbMenuId: dish.esbMenuId || null,
        unitPrice: unit,
        name: dish.name,
        optLabels: labels,
      });
      track("menu_add_to_list", { dish_id: dish.id });
      closePop();
      refreshBar();
    }

    function openList() {
      const note = state.menu?.settings?.listNote || "";
      if (listNote) listNote.textContent = note;
      listBody.innerHTML = R().listHtml(state.menu, state.lines);
      const { sum, incomplete } = cart().total(state.lines, state.menu);
      if (listTotal) {
        listTotal.textContent = state.lines.length
          ? `Estimate ${R().fmtPrice(sum)}${incomplete ? "+" : ""}`
          : "";
      }
      listSheet.hidden = false;
    }

    function closeList() {
      listSheet.hidden = true;
    }

    function showWaiter() {
      if (!state.lines.length) return;
      // Future hook: cart().toOrderPayload(state.lines, state.menu, "waiter_show")
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      document.getElementById("dm-waiter-time").textContent = time;
      document.getElementById("dm-waiter-body").innerHTML = R().waiterHtml(state.lines);
      const { sum, incomplete } = cart().total(state.lines, state.menu);
      document.getElementById("dm-waiter-total").textContent = `Estimate ${R().fmtPrice(sum)}${
        incomplete ? "+" : ""
      }`;
      closeList();
      waiter.hidden = false;
      track("menu_show_waiter", { items: cart().count(state.lines) });
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
      const customise = e.target.closest("[data-customise]");
      if (customise) {
        openPop(dishById(customise.getAttribute("data-customise")));
        return;
      }
      const more = e.target.closest("[data-more]");
      if (more) {
        openPop(dishById(more.getAttribute("data-more")));
        return;
      }
      const quick = e.target.closest("[data-quick-add]");
      if (quick) {
        const dish = dishById(quick.getAttribute("data-quick-add"));
        if (!dish || dish.soldOut) return;
        const size = quick.getAttribute("data-size") || state.sizeSel[dish.id] || dish.sizes?.[0]?.l;
        const unit = R().unitPriceFor(state.menu, dish, size, {});
        state.lines = cart().add({
          id: dish.id,
          l: size,
          opts: {},
          qty: 1,
          esbMenuId: dish.esbMenuId || null,
          unitPrice: unit,
          name: dish.name,
          optLabels: [],
        });
        track("menu_quick_add", { dish_id: dish.id });
        refreshBar();
      }
    });

    pop.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-pop]")) {
        closePop();
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
        return;
      }
      const qty = e.target.closest("[data-pop-qty]");
      if (qty) {
        const delta = Number(qty.getAttribute("data-pop-qty")) || 0;
        state.pop.qty = Math.max(1, (state.pop.qty || 1) + delta);
        syncPop();
        return;
      }
      if (e.target.closest("#dm-pop-add")) addCurrentPop();
    });

    document.getElementById("dm-open-list")?.addEventListener("click", openList);
    listSheet.addEventListener("click", (e) => {
      if (e.target.closest("[data-close-list]")) {
        closeList();
        return;
      }
      const row = e.target.closest("[data-line-key]");
      const qtyBtn = e.target.closest("[data-line-qty]");
      if (row && qtyBtn) {
        const key = row.getAttribute("data-line-key");
        const line = state.lines.find((x) => x.key === key);
        if (!line) return;
        const next = (line.qty || 1) + (Number(qtyBtn.getAttribute("data-line-qty")) || 0);
        state.lines = cart().setQty(key, next);
        openList();
        refreshBar();
      }
    });
    document.getElementById("dm-show-waiter")?.addEventListener("click", showWaiter);
    document.getElementById("dm-waiter-done")?.addEventListener("click", () => {
      waiter.hidden = true;
    });

    try {
      const loaded = await api().loadMenu();
      state.menu = loaded.menu;
      const sections = R().visibleSections(state.menu);
      state.sectionId = sections[0]?.id || "breakfast";
      if (fab) fab.href = api().shopUrl(state.menu);
      if (listNote) listNote.textContent = state.menu?.settings?.listNote || "";
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
          openPop(dish);
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
