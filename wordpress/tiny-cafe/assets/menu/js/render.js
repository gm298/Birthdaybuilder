(() => {
  "use strict";

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtPrice(p) {
    if (p == null || p === "") return "Ask us";
    const n = Number(p);
    if (!Number.isFinite(n)) return "Ask us";
    if (n >= 1000) {
      const mln = n / 1000;
      const text = Number.isInteger(mln) ? String(mln) : String(mln).replace(".", ",");
      return `Rp ${text} mln`;
    }
    return `Rp ${n}k`;
  }

  function sizePrice(dish, label) {
    const size = (dish.sizes || []).find((s) => s.l === label) || (dish.sizes || [])[0];
    return size || { l: "Regular", p: null };
  }

  function kidsDishes(menu) {
    return (menu.dishes || []).filter(
      (d) => !d.hidden && (d.sizes || []).some((s) => s.l === "Tiny")
    );
  }

  function sectionDishes(menu, section, sub) {
    if (!section) return [];
    let list;
    if (section.auto) {
      list = kidsDishes(menu);
    } else {
      list = (menu.dishes || []).filter((d) => d.sec === section.id && !d.hidden);
    }
    if (sub && sub !== "All") {
      if (section.auto) {
        list = list.filter((d) => d.sub === sub || (sub === "Tiny tummies" && d.sec === "kids"));
      } else {
        list = list.filter((d) => d.sub === sub);
      }
    }
    return list;
  }

  function visibleSections(menu) {
    return (menu.sections || []).filter((s) => s.visible !== false && s.id !== "play");
  }

  function pastaShapeSrc(menu, shape, colourLabel) {
    const map = menu?.settings?.pastaImgMap || {};
    const colour = String(colourLabel || "green").toLowerCase().split(" ")[0];
    const key = `assets/menu/pasta/${shape}-${colour}.png`;
    const alt = Object.keys(map).find(
      (k) => k.endsWith(`/${shape}-${colour}.png`) || k === `${shape}-${colour}.png`
    );
    return map[key] || (alt ? map[alt] : "") || "";
  }

  function groupById(menu, gid) {
    return (menu.groups || []).find((g) => g.id === gid);
  }

  function defaultOptsForDish(menu, dish) {
    const opts = {};
    (dish.groups || []).forEach((gid) => {
      const g = groupById(menu, gid);
      if (!g) return;
      if (g.type === "many") opts[gid] = [];
      else if (g.opts && g.opts[0]) opts[gid] = g.opts[0].id;
    });
    return opts;
  }

  function selectedOpt(group, selected) {
    if (!group) return null;
    if (group.type === "many") return null;
    return (group.opts || []).find((o) => o.id === selected) || null;
  }

  function optPillHtml(g, o, active, api, scope) {
    const price = typeof o.p === "number" ? ` · +${fmtPrice(o.p)}` : "";
    let media = "";
    if (o.img) {
      media = `<span class="dm-pill__thumb"><img src="${esc(api.assetUrl(o.img))}" alt=""></span>`;
    } else if (o.dot) {
      media = `<span class="dm-pill__dot" style="background:${esc(o.dot)}"></span>`;
    } else if (o.shape) {
      media = `<span class="dm-pill__dot dm-pill__dot--shape" aria-hidden="true"></span>`;
    }
    return `<button type="button" class="dm-pill${active ? " is-active" : ""}" data-${scope}-opt-group="${esc(
      g.id
    )}" data-${scope}-opt="${esc(o.id)}" data-${scope}-opt-type="${esc(g.type)}">
      ${media}
      <span class="dm-pill__label">${esc(o.l)}${esc(price)}</span>
    </button>`;
  }

  /** type:one groups for on-card chips; includeMany for detail sheet */
  function optionGroupsHtml(menu, dish, opts, api, scope, includeMany) {
    return (dish.groups || [])
      .map((gid) => {
        const g = groupById(menu, gid);
        if (!g) return "";
        if (!includeMany && g.type === "many") return "";
        const selected = opts[gid];
        const pills = (g.opts || [])
          .filter((o) => !o.off)
          .map((o) => {
            const active =
              g.type === "many"
                ? Array.isArray(selected) && selected.includes(o.id)
                : selected === o.id;
            return optPillHtml(g, o, active, api, scope);
          })
          .join("");
        const hint =
          g.type === "one"
            ? (() => {
                const opt = selectedOpt(g, selected);
                if (!opt) return "";
                return `<p class="dm-opt-hint">${esc(opt.l)}${opt.sub ? `: ${esc(opt.sub)}` : ""}</p>`;
              })()
            : "";
        const pick = g.type === "one" ? `<span class="dm-opt-head__pick">Pick one</span>` : "";
        return `<div class="dm-opt-block" data-opt-block="${esc(g.id)}">
          <div class="dm-opt-head">
            <span class="dm-opt-head__name">${esc(g.name)}</span>
            ${pick}
          </div>
          <div class="dm-pills">${pills}</div>
          ${hint}
        </div>`;
      })
      .join("");
  }

  function cardHeroSrc(menu, dish, opts, api) {
    if (dish.img) return api.assetUrl(dish.img);
    // Pasta: preview selected shape + colour when no dish photo
    const shapeId = opts.pshape;
    const colourId = opts.pcolour;
    const shapeG = groupById(menu, "pshape");
    const colourG = groupById(menu, "pcolour");
    const shape = shapeG && (shapeG.opts || []).find((o) => o.id === shapeId);
    const colour = colourG && (colourG.opts || []).find((o) => o.id === colourId);
    if (shape && shape.shape) {
      const rel = pastaShapeSrc(menu, shape.shape, colour ? colour.l : "green");
      if (rel) return api.assetUrl(rel);
    }
    return "";
  }

  function cardHtml(menu, dish, sizeLabel, opts, api) {
    const size = sizePrice(dish, sizeLabel);
    const img = cardHeroSrc(menu, dish, opts || {}, api);
    const fit = dish.fit === "contain" ? "is-contain" : "";
    const tags = (dish.tags || [])
      .map((t) => `<span class="dm-tag">${esc(t)}</span>`)
      .join("");
    const sizes = (dish.sizes || [])
      .map(
        (s) =>
          `<button type="button" class="dm-size${s.l === size.l ? " is-active" : ""}" data-size-for="${esc(
            dish.id
          )}" data-size="${esc(s.l)}">${esc(s.l)}</button>`
      )
      .join("");
    const media = img
      ? `<button type="button" class="dm-card__media" data-open-dish="${esc(
          dish.id
        )}" aria-label="Open ${esc(dish.name)}"><img src="${esc(img)}" alt="" class="${fit}" loading="lazy" decoding="async"></button>`
      : `<button type="button" class="dm-card__media dm-card__media--empty" data-open-dish="${esc(
          dish.id
        )}" aria-label="Open ${esc(dish.name)}">Tiny</button>`;
    const sold = dish.soldOut ? `<span class="dm-sold-badge">SOLD OUT TODAY</span>` : "";
    const oneGroups = optionGroupsHtml(menu, dish, opts || {}, api, "card", false);

    return `<article class="dm-card${dish.soldOut ? " is-sold" : ""}" data-dish="${esc(dish.id)}">
      ${media}
      <div class="dm-card__body">
        <button type="button" class="dm-card__open" data-open-dish="${esc(dish.id)}">
          <h3 class="dm-card__name">${esc(dish.name)}</h3>
          ${tags ? `<div class="dm-tags">${tags}</div>` : ""}
          <p class="dm-card__short">${esc(dish.short || "")}</p>
        </button>
        ${sold}
        <div class="dm-card__price">${esc(fmtPrice(size.p))}</div>
        ${(dish.sizes || []).length > 1 ? `<div class="dm-card__sizes">${sizes}</div>` : ""}
        ${oneGroups}
      </div>
    </article>`;
  }

  function rowHtml(menu, dish, opts, api) {
    const size = (dish.sizes || [])[0] || { l: "", p: null };
    const oneGroups = optionGroupsHtml(menu, dish, opts || {}, api, "card", false);
    return `<article class="dm-row${dish.soldOut ? " is-sold" : ""}" data-dish="${esc(dish.id)}">
      <button type="button" class="dm-row__open" data-open-dish="${esc(dish.id)}">
        <h3 class="dm-row__name">${esc(dish.name)}</h3>
        <p class="dm-row__meta">${esc(dish.short || "")} · ${esc(fmtPrice(size.p))}</p>
        ${dish.soldOut ? `<span class="dm-sold-badge">SOLD OUT TODAY</span>` : ""}
      </button>
      ${oneGroups}
    </article>`;
  }

  function unitPriceFor(menu, dish, sizeLabel, opts) {
    const size = sizePrice(dish, sizeLabel);
    let unit = size.p;
    Object.entries(opts || {}).forEach(([gid, val]) => {
      const g = groupById(menu, gid);
      if (!g) return;
      const ids = Array.isArray(val) ? val : [val];
      ids.forEach((oid) => {
        const opt = (g.opts || []).find((o) => o.id === oid);
        if (opt && typeof opt.p === "number") unit = (unit == null ? 0 : unit) + opt.p;
      });
    });
    return unit;
  }

  function popHtml(menu, dish, state, api) {
    const img = cardHeroSrc(menu, dish, state.opts || {}, api) || (dish.img ? api.assetUrl(dish.img) : "");
    const size = sizePrice(dish, state.size);
    const tags = (dish.tags || []).map((t) => `<span class="dm-tag">${esc(t)}</span>`).join("");
    const sizes = (dish.sizes || [])
      .map(
        (s) =>
          `<button type="button" class="dm-size${s.l === state.size ? " is-active" : ""}" data-pop-size="${esc(
            s.l
          )}">${esc(s.l)} · ${esc(fmtPrice(s.p))}</button>`
      )
      .join("");
    const groups = optionGroupsHtml(menu, dish, state.opts || {}, api, "pop", true);
    const unit = unitPriceFor(menu, dish, state.size, state.opts);

    return `
      ${img ? `<div class="dm-pop__hero"><img src="${esc(img)}" alt=""></div>` : ""}
      <h2 class="dm-pop__title" id="dm-pop-title">${esc(dish.name)}</h2>
      ${tags ? `<div class="dm-tags">${tags}</div>` : ""}
      <p class="dm-pop__desc">${esc(dish.desc || dish.short || "")}</p>
      <p class="dm-pop__price">${esc(fmtPrice(unit))}</p>
      ${(dish.sizes || []).length > 1 ? `<div class="dm-field"><span class="dm-field__label">Size</span><div class="dm-opts">${sizes}</div></div>` : ""}
      ${groups}
    `;
  }

  window.TinyMenuRender = {
    esc,
    fmtPrice,
    sizePrice,
    sectionDishes,
    visibleSections,
    kidsDishes,
    pastaShapeSrc,
    defaultOptsForDish,
    cardHtml,
    rowHtml,
    unitPriceFor,
    popHtml,
  };
})();
