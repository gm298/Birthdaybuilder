(() => {
  "use strict";

  const FAMILY_IDS = ["food", "dinner", "drink"];
  const DEFAULT_FAMILY = "food";
  const DEFAULT_SECTION = "lunch";

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function menuPriceToIdr(p) {
    if (p == null || p === "" || !Number.isFinite(Number(p))) return 0;
    return Math.round(Number(p) * 1000);
  }

  function formatIdr(n) {
    if (!n && n !== 0) return "—";
    return `IDR ${Math.round(n).toLocaleString("en-US")}`;
  }

  function formatCompact(n) {
    const amount = Math.max(0, Math.round(Number(n) || 0));
    if (amount >= 1000000) {
      const mln = amount / 1000000;
      const text = Number.isInteger(mln) ? String(mln) : String(Math.round(mln * 10) / 10).replace(".", ",");
      return `Rp ${text} mln`;
    }
    const k = Math.round(amount / 1000);
    return `Rp ${k}k`;
  }

  function ensureMenuPaths() {
    window.TINY_WP = window.TINY_WP || {};
    if (!window.TINY_WP.menuAssetBase) {
      window.TINY_WP.menuAssetBase = "../../menu/";
    }
    if (!window.TINY_WP.menuSeedJson) {
      window.TINY_WP.menuSeedJson = "../../menu/data/menu-seed.json";
    }
  }

  function optSummary(menu, dish, opts) {
    const R = window.TinyMenuRender;
    if (!R || !opts) return "";
    const bits = [];
    Object.entries(opts).forEach(([gid, val]) => {
      const g = (menu.groups || []).find((x) => x.id === gid);
      if (!g) return;
      const ids = Array.isArray(val) ? val : [val];
      ids.forEach((oid) => {
        const opt = (g.opts || []).find((o) => o.id === oid);
        if (!opt) return;
        const def = !Array.isArray(val) && g.opts?.[0]?.id === oid;
        if (def && g.type === "one") return;
        bits.push(opt.l);
      });
    });
    return bits.join(", ");
  }

  function createPicker() {
    const root = document.getElementById("food-picker");
    if (!root) return null;

    const api = () => window.TinyMenuApi;
    const R = () => window.TinyMenuRender;

    const state = {
      menu: null,
      loading: false,
      error: "",
      familyId: DEFAULT_FAMILY,
      sectionId: DEFAULT_SECTION,
      sub: "All",
      sizeSel: {},
      cardOpts: {},
      pop: null,
      cart: [],
      creditIdr: 0,
      sideCollapsed: false,
      mobileOpen: false,
      onSave: null,
      onSkip: null,
    };

    const els = {
      root,
      status: root.querySelector("[data-fp-status]"),
      menus: root.querySelector("[data-fp-menus]"),
      sections: root.querySelector("[data-fp-sections]"),
      subs: root.querySelector("[data-fp-subs]"),
      grid: root.querySelector("[data-fp-grid]"),
      cart: root.querySelector("[data-fp-cart]"),
      cartMobile: root.querySelector("[data-fp-cart-mobile]"),
      totals: root.querySelector("[data-fp-totals]"),
      totalsMobile: root.querySelector("[data-fp-totals-mobile]"),
      side: root.querySelector("[data-fp-side]"),
      mobileBar: root.querySelector("[data-fp-mobile-bar]"),
      mobileLabel: root.querySelector("[data-fp-mobile-label]"),
      mobileSheet: root.querySelector("[data-fp-mobile-sheet]"),
      pop: root.querySelector("[data-fp-pop]"),
      popBody: root.querySelector("[data-fp-pop-body]"),
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

    function families() {
      return R()
        .menuFamilies(state.menu)
        .filter((m) => FAMILY_IDS.includes(m.id));
    }

    function sectionsForFamily() {
      return R().visibleSections(state.menu, state.familyId);
    }

    function selectFamily(familyId, preferSectionId) {
      state.familyId = familyId || DEFAULT_FAMILY;
      const sections = sectionsForFamily();
      let preferred = preferSectionId || "";
      if (state.familyId === "food" && !preferred) preferred = DEFAULT_SECTION;
      if (preferred && !sections.some((s) => s.id === preferred)) preferred = "";
      state.sectionId = preferred || sections[0]?.id || "";
      state.sub = "All";
    }

    function cartTotals() {
      const itemsTotalIdr = state.cart.reduce((sum, item) => sum + (item.lineTotal || 0), 0);
      const creditIdr = Math.max(0, state.creditIdr || 0);
      const remainingCreditIdr = Math.max(0, creditIdr - itemsTotalIdr);
      const overCreditIdr = Math.max(0, itemsTotalIdr - creditIdr);
      const service = Math.round(itemsTotalIdr * 0.05);
      const tax = Math.round((itemsTotalIdr + service) * 0.1);
      const orderTotal = itemsTotalIdr + service + tax;
      const itemCount = state.cart.reduce((sum, item) => sum + (item.qty || 0), 0);
      return {
        itemsTotalIdr,
        creditIdr,
        remainingCreditIdr,
        overCreditIdr,
        service,
        tax,
        orderTotal,
        itemCount,
      };
    }

    function cartKey(item) {
      return `${item.id}|${item.size || ""}|${JSON.stringify(item.opts || {})}`;
    }

    function cartRowsHtml() {
      if (!state.cart.length) {
        return `<p class="food-picker__cart-empty">No items yet — add from lunch, dinner, or drinks, or skip without pre-ordering.</p>`;
      }
      return state.cart
        .map((item, index) => {
          const opts = item.optsLabel ? ` · ${esc(item.optsLabel)}` : "";
          return `<div class="food-picker__cart-row" data-cart-index="${index}">
            <div class="food-picker__cart-meta">
              <strong>${esc(item.name)}</strong>
              <span>${esc(item.size || "Regular")}${opts} · ${esc(formatIdr(item.unitPrice))} each</span>
            </div>
            <div class="food-picker__cart-qty">
              <button type="button" data-cart-dec aria-label="Decrease">−</button>
              <span>${esc(item.qty)}</span>
              <button type="button" data-cart-inc aria-label="Increase">+</button>
            </div>
            <strong class="food-picker__cart-total">${esc(formatIdr(item.lineTotal))}</strong>
            <button type="button" class="food-picker__cart-remove" data-cart-remove aria-label="Remove">&times;</button>
          </div>`;
        })
        .join("");
    }

    function totalsHtml() {
      const t = cartTotals();
      const budgetLabel = t.overCreditIdr > 0 ? "Over spend budget" : "Remaining spend budget";
      const budgetValue = t.overCreditIdr > 0 ? t.overCreditIdr : t.remainingCreditIdr;
      const budgetClass = t.overCreditIdr > 0 ? " is-over" : "";
      return `
        <div class="food-picker__totals-row"><span>Subtotal</span><span>${esc(formatIdr(t.itemsTotalIdr))}</span></div>
        <div class="food-picker__totals-row"><span>Service (+5%)</span><span>${esc(formatIdr(t.service))}</span></div>
        <div class="food-picker__totals-row"><span>Tax (+10%)</span><span>${esc(formatIdr(t.tax))}</span></div>
        <div class="food-picker__totals-row is-grand"><span>Order total</span><span>${esc(formatIdr(t.orderTotal))}</span></div>
        <div class="food-picker__totals-row is-budget${budgetClass}">
          <span>${budgetLabel}</span>
          <span>${esc(formatIdr(budgetValue))}</span>
        </div>
        <div class="food-picker__totals-row"><span>Package credit</span><span>${esc(formatIdr(t.creditIdr))}</span></div>`;
    }

    function setSideCollapsed(collapsed) {
      state.sideCollapsed = Boolean(collapsed);
      root.classList.toggle("is-side-collapsed", state.sideCollapsed);
      root.querySelectorAll("[data-fp-toggle-side]").forEach((btn) => {
        btn.setAttribute("aria-expanded", state.sideCollapsed ? "false" : "true");
        if (btn.classList.contains("food-picker__side-toggle")) {
          btn.textContent = state.sideCollapsed ? "Your order" : "Hide order";
          btn.title = state.sideCollapsed ? "Show order" : "Hide order";
        }
      });
    }

    function setMobileOpen(open) {
      state.mobileOpen = Boolean(open);
      if (!els.mobileSheet) return;
      els.mobileSheet.hidden = !state.mobileOpen;
      els.mobileSheet.setAttribute("aria-hidden", state.mobileOpen ? "false" : "true");
    }

    function renderMobileBar() {
      if (!els.mobileBar || !els.mobileLabel) return;
      const t = cartTotals();
      const countLabel = t.itemCount === 1 ? "1 item" : `${t.itemCount} items`;
      els.mobileLabel.textContent = `My list · ${countLabel} · ${formatCompact(t.itemsTotalIdr)}`;
      els.mobileBar.hidden = false;
    }

    function renderCart() {
      const rows = cartRowsHtml();
      const totals = totalsHtml();
      if (els.cart) els.cart.innerHTML = rows;
      if (els.cartMobile) els.cartMobile.innerHTML = rows;
      if (els.totals) els.totals.innerHTML = totals;
      if (els.totalsMobile) els.totalsMobile.innerHTML = totals;
      renderMobileBar();
    }

    function addToCart(dish, sizeLabel, opts, qty) {
      const unitK = R().unitPriceFor(state.menu, dish, sizeLabel, opts);
      const unitPrice = menuPriceToIdr(unitK);
      const nextQty = Math.max(1, qty || 1);
      const optsLabel = optSummary(state.menu, dish, opts);
      const item = {
        id: dish.id,
        name: dish.name,
        size: sizeLabel || (dish.sizes || [])[0]?.l || "Regular",
        opts: JSON.parse(JSON.stringify(opts || {})),
        optsLabel,
        qty: nextQty,
        unitPrice,
        lineTotal: unitPrice * nextQty,
        family: R().dishCat(state.menu, dish) || state.familyId,
      };
      const key = cartKey(item);
      const existing = state.cart.find((row) => cartKey(row) === key);
      if (existing) {
        existing.qty += nextQty;
        existing.lineTotal = existing.unitPrice * existing.qty;
      } else {
        state.cart.push(item);
      }
      renderCart();
    }

    function renderMenus() {
      if (!els.menus) return;
      els.menus.innerHTML = families()
        .map(
          (m) =>
            `<button type="button" class="dm-menu-chip${m.id === state.familyId ? " is-active" : ""}" role="tab" aria-selected="${
              m.id === state.familyId ? "true" : "false"
            }" data-fp-family="${esc(m.id)}">${esc(m.name)}</button>`
        )
        .join("");
    }

    function renderSections() {
      if (!els.sections) return;
      const sections = sectionsForFamily();
      els.sections.innerHTML = sections
        .map(
          (s) =>
            `<button type="button" class="dm-chip" role="tab" aria-selected="${
              s.id === state.sectionId ? "true" : "false"
            }" data-fp-sec="${esc(s.id)}">${esc(s.name)}</button>`
        )
        .join("");
    }

    function renderSubs() {
      if (!els.subs) return;
      const sec = currentSection();
      const subs = ["All", ...((sec && sec.subs) || [])];
      if (!sec || subs.length <= 1) {
        els.subs.hidden = true;
        els.subs.innerHTML = "";
        return;
      }
      els.subs.hidden = false;
      els.subs.innerHTML = subs
        .map(
          (sub) =>
            `<button type="button" class="dm-subchip${sub === state.sub ? " is-active" : ""}" data-fp-sub="${esc(
              sub
            )}">${esc(sub)}</button>`
        )
        .join("");
    }

    function renderGrid() {
      if (!els.grid || !state.menu) return;
      const sec = currentSection();
      const dishes = R().sectionDishes(state.menu, sec, state.sub === "All" ? null : state.sub);
      if (!dishes.length) {
        els.grid.innerHTML = `<p class="food-picker__empty">No dishes in this section.</p>`;
        return;
      }
      const layout = sec?.layout === "list" ? "list" : "cards";
      els.grid.className = `dm-grid is-${layout}`;
      els.grid.innerHTML = dishes
        .map((dish) => {
          const size = state.sizeSel[dish.id] || (dish.sizes || [])[0]?.l;
          const html =
            layout === "list"
              ? R().rowHtml(state.menu, dish, optsFor(dish), api())
              : R().cardHtml(state.menu, dish, size, optsFor(dish), api());
          return html.replace(
            "</article>",
            `<div class="food-picker__add-row">
              <button type="button" class="food-picker__more" data-open-dish="${esc(dish.id)}">More</button>
              <button type="button" class="btn food-picker__add" data-fp-add="${esc(dish.id)}"${
              dish.soldOut ? " disabled" : ""
            }>Add</button>
            </div></article>`
          );
        })
        .join("");
    }

    function renderAll() {
      renderMenus();
      renderSections();
      renderSubs();
      renderGrid();
      renderCart();
    }

    function closePop() {
      state.pop = null;
      if (els.pop) {
        els.pop.hidden = true;
        els.pop.setAttribute("aria-hidden", "true");
      }
      if (els.popBody) els.popBody.innerHTML = "";
    }

    function openDetail(dishId) {
      const dish = dishById(dishId);
      if (!dish || !els.pop || !els.popBody) return;
      const size = state.sizeSel[dish.id] || (dish.sizes || [])[0]?.l;
      state.pop = {
        id: dish.id,
        size,
        opts: JSON.parse(JSON.stringify(optsFor(dish))),
        qty: 1,
      };
      els.popBody.innerHTML =
        R().popHtml(state.menu, dish, state.pop, api()) +
        `<div class="food-picker__pop-actions">
          <div class="food-picker__qty">
            <button type="button" data-fp-pop-dec aria-label="Decrease">−</button>
            <span data-fp-pop-qty>1</span>
            <button type="button" data-fp-pop-inc aria-label="Increase">+</button>
          </div>
          <button type="button" class="btn" data-fp-pop-add${dish.soldOut ? " disabled" : ""}>Add</button>
        </div>`;
      els.pop.hidden = false;
      els.pop.setAttribute("aria-hidden", "false");
    }

    function refreshPop() {
      if (!state.pop) return;
      const dish = dishById(state.pop.id);
      if (!dish || !els.popBody) return;
      const qty = state.pop.qty || 1;
      els.popBody.innerHTML =
        R().popHtml(state.menu, dish, state.pop, api()) +
        `<div class="food-picker__pop-actions">
          <div class="food-picker__qty">
            <button type="button" data-fp-pop-dec aria-label="Decrease">−</button>
            <span data-fp-pop-qty>${qty}</span>
            <button type="button" data-fp-pop-inc aria-label="Increase">+</button>
          </div>
          <button type="button" class="btn" data-fp-pop-add${dish.soldOut ? " disabled" : ""}>Add</button>
        </div>`;
    }

    function snapshot() {
      const t = cartTotals();
      return {
        skipped: state.cart.length === 0,
        creditIdr: t.creditIdr,
        itemsTotalIdr: t.itemsTotalIdr,
        remainingCreditIdr: t.remainingCreditIdr,
        overCreditIdr: t.overCreditIdr,
        serviceIdr: t.service,
        taxIdr: t.tax,
        orderTotalIdr: t.orderTotal,
        items: state.cart.map((item) => ({
          id: item.id,
          name: item.name,
          size: item.size,
          opts: item.opts,
          optsLabel: item.optsLabel || "",
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          family: item.family || "",
        })),
      };
    }

    function close() {
      closePop();
      setMobileOpen(false);
      root.hidden = true;
      root.setAttribute("aria-hidden", "true");
      document.body.classList.remove("food-picker-open");
    }

    async function ensureMenu() {
      if (state.menu) return state.menu;
      if (!api() || !R()) throw new Error("Menu is not available right now.");
      ensureMenuPaths();
      state.loading = true;
      if (els.status) {
        els.status.hidden = false;
        els.status.textContent = "Loading menu…";
      }
      try {
        const loaded = await api().loadMenu();
        state.menu = loaded.menu;
        state.error = "";
        if (els.status) els.status.hidden = true;
        return state.menu;
      } catch (err) {
        state.error = err?.message || "Could not load menu.";
        if (els.status) {
          els.status.hidden = false;
          els.status.textContent = state.error;
        }
        throw err;
      } finally {
        state.loading = false;
      }
    }

    async function open({ creditIdr = 0, items = [], onSave, onSkip } = {}) {
      state.creditIdr = Math.max(0, Number(creditIdr) || 0);
      state.cart = Array.isArray(items)
        ? items.map((item) => ({
            ...item,
            qty: Math.max(1, Number(item.qty) || 1),
            unitPrice: Math.max(0, Number(item.unitPrice) || 0),
            lineTotal:
              Math.max(0, Number(item.lineTotal)) ||
              Math.max(0, Number(item.unitPrice) || 0) * Math.max(1, Number(item.qty) || 1),
          }))
        : [];
      state.onSave = typeof onSave === "function" ? onSave : null;
      state.onSkip = typeof onSkip === "function" ? onSkip : null;
      setSideCollapsed(false);
      setMobileOpen(false);
      root.hidden = false;
      root.setAttribute("aria-hidden", "false");
      document.body.classList.add("food-picker-open");
      try {
        await ensureMenu();
        selectFamily(DEFAULT_FAMILY, DEFAULT_SECTION);
        renderAll();
      } catch (_) {
        renderCart();
      }
    }

    root.addEventListener("click", (e) => {
      if (e.target.closest("[data-fp-close]")) {
        close();
        return;
      }
      if (e.target.closest("[data-fp-toggle-side]")) {
        setSideCollapsed(!state.sideCollapsed);
        return;
      }
      if (e.target.closest("[data-fp-mobile-bar]")) {
        setMobileOpen(true);
        return;
      }
      if (e.target.closest("[data-fp-mobile-close]")) {
        setMobileOpen(false);
        return;
      }
      if (e.target.closest("[data-fp-skip]")) {
        state.cart = [];
        const result = snapshot();
        result.skipped = true;
        close();
        state.onSkip?.(result);
        return;
      }
      if (e.target.closest("[data-fp-save]")) {
        const result = snapshot();
        close();
        state.onSave?.(result);
        return;
      }

      const familyBtn = e.target.closest("[data-fp-family]");
      if (familyBtn) {
        selectFamily(familyBtn.getAttribute("data-fp-family"));
        renderAll();
        return;
      }
      const secBtn = e.target.closest("[data-fp-sec]");
      if (secBtn) {
        state.sectionId = secBtn.getAttribute("data-fp-sec");
        state.sub = "All";
        renderAll();
        return;
      }
      const subBtn = e.target.closest("[data-fp-sub]");
      if (subBtn) {
        state.sub = subBtn.getAttribute("data-fp-sub");
        renderSubs();
        renderGrid();
        return;
      }

      const sizeBtn = e.target.closest("[data-size-for]");
      if (sizeBtn) {
        const id = sizeBtn.getAttribute("data-size-for");
        state.sizeSel[id] = sizeBtn.getAttribute("data-size");
        renderGrid();
        return;
      }

      const cardOpt = e.target.closest("[data-card-opt]");
      if (cardOpt) {
        const dishEl = cardOpt.closest("[data-dish]");
        const dish = dishById(dishEl?.getAttribute("data-dish"));
        if (!dish) return;
        const gid = cardOpt.getAttribute("data-card-opt-group");
        const oid = cardOpt.getAttribute("data-card-opt");
        const type = cardOpt.getAttribute("data-card-opt-type");
        const opts = optsFor(dish);
        if (type === "many") {
          const cur = Array.isArray(opts[gid]) ? opts[gid] : [];
          opts[gid] = cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid];
        } else {
          opts[gid] = oid;
        }
        renderGrid();
        return;
      }

      const openBtn = e.target.closest("[data-open-dish]");
      if (openBtn) {
        openDetail(openBtn.getAttribute("data-open-dish") || openBtn.closest("[data-dish]")?.getAttribute("data-dish"));
        return;
      }

      const addBtn = e.target.closest("[data-fp-add]");
      if (addBtn) {
        const dish = dishById(addBtn.getAttribute("data-fp-add"));
        if (!dish || dish.soldOut) return;
        const size = state.sizeSel[dish.id] || (dish.sizes || [])[0]?.l;
        addToCart(dish, size, optsFor(dish), 1);
        return;
      }

      if (e.target.closest("[data-close-pop], [data-fp-close-pop]")) {
        closePop();
        return;
      }

      if (state.pop) {
        const popSize = e.target.closest("[data-pop-size]");
        if (popSize) {
          state.pop.size = popSize.getAttribute("data-pop-size");
          refreshPop();
          return;
        }
        const popOpt = e.target.closest("[data-pop-opt]");
        if (popOpt) {
          const gid = popOpt.getAttribute("data-pop-opt-group");
          const oid = popOpt.getAttribute("data-pop-opt");
          const type = popOpt.getAttribute("data-pop-opt-type");
          if (type === "many") {
            const cur = Array.isArray(state.pop.opts[gid]) ? state.pop.opts[gid] : [];
            state.pop.opts[gid] = cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid];
          } else {
            state.pop.opts[gid] = oid;
          }
          refreshPop();
          return;
        }
        if (e.target.closest("[data-fp-pop-dec]")) {
          state.pop.qty = Math.max(1, (state.pop.qty || 1) - 1);
          refreshPop();
          return;
        }
        if (e.target.closest("[data-fp-pop-inc]")) {
          state.pop.qty = Math.min(99, (state.pop.qty || 1) + 1);
          refreshPop();
          return;
        }
        if (e.target.closest("[data-fp-pop-add]")) {
          const dish = dishById(state.pop.id);
          if (!dish || dish.soldOut) return;
          addToCart(dish, state.pop.size, state.pop.opts, state.pop.qty || 1);
          closePop();
          return;
        }
      }

      const cartRow = e.target.closest("[data-cart-index]");
      if (cartRow) {
        const index = Number(cartRow.getAttribute("data-cart-index"));
        const item = state.cart[index];
        if (!item) return;
        if (e.target.closest("[data-cart-remove]")) {
          state.cart.splice(index, 1);
          renderCart();
          return;
        }
        if (e.target.closest("[data-cart-dec]")) {
          item.qty = Math.max(1, item.qty - 1);
          item.lineTotal = item.unitPrice * item.qty;
          renderCart();
          return;
        }
        if (e.target.closest("[data-cart-inc]")) {
          item.qty = Math.min(99, item.qty + 1);
          item.lineTotal = item.unitPrice * item.qty;
          renderCart();
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (root.hidden) return;
      if (state.pop) closePop();
      else if (state.mobileOpen) setMobileOpen(false);
      else close();
    });

    return { open, close, snapshot };
  }

  let picker;

  function getPicker() {
    if (!picker) picker = createPicker();
    return picker;
  }

  window.TinyFoodPicker = {
    open(opts) {
      return getPicker()?.open(opts);
    },
    close() {
      getPicker()?.close();
    },
    menuPriceToIdr,
    formatIdr,
  };
})();
