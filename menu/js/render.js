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
    const alt = Object.keys(map).find((k) => k.endsWith(`/${shape}-${colour}.png`) || k === `${shape}-${colour}.png`);
    return map[key] || (alt ? map[alt] : "") || "";
  }

  function cardHtml(dish, sizeLabel, api) {
    const size = sizePrice(dish, sizeLabel);
    const hasGroups = (dish.groups || []).length > 0;
    const img = dish.img ? api.assetUrl(dish.img) : "";
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
      ? `<div class="dm-card__media"><img src="${esc(img)}" alt="" class="${fit}" loading="lazy" decoding="async"></div>`
      : `<div class="dm-card__media dm-card__media--empty">Tiny</div>`;
    const sold = dish.soldOut
      ? `<span class="dm-sold-badge">SOLD OUT TODAY</span>`
      : "";
    const actions = dish.soldOut
      ? `<button type="button" class="dm-btn" disabled>Sold out</button>`
      : hasGroups
        ? `<button type="button" class="dm-btn dm-btn--primary" data-customise="${esc(dish.id)}">Customise</button>`
        : `<button type="button" class="dm-btn" data-more="${esc(dish.id)}">More</button>
           <button type="button" class="dm-btn dm-btn--primary" data-quick-add="${esc(dish.id)}" data-size="${esc(
             size.l
           )}">Add</button>`;

    return `<article class="dm-card${dish.soldOut ? " is-sold" : ""}" data-dish="${esc(dish.id)}">
      ${media}
      <div class="dm-card__body">
        <h3 class="dm-card__name">${esc(dish.name)}</h3>
        ${tags ? `<div class="dm-tags">${tags}</div>` : ""}
        <p class="dm-card__short">${esc(dish.short || "")}</p>
        ${sold}
        <div class="dm-card__price">${esc(fmtPrice(size.p))}</div>
        ${(dish.sizes || []).length > 1 ? `<div class="dm-card__sizes">${sizes}</div>` : ""}
        <div class="dm-card__actions">${actions}</div>
      </div>
    </article>`;
  }

  function rowHtml(dish, api) {
    const size = (dish.sizes || [])[0] || { l: "", p: null };
    const hasGroups = (dish.groups || []).length > 0;
    const action = dish.soldOut
      ? `<button type="button" class="dm-btn" disabled>Sold out</button>`
      : hasGroups
        ? `<button type="button" class="dm-btn dm-btn--primary" data-customise="${esc(dish.id)}">Customise</button>`
        : `<button type="button" class="dm-btn dm-btn--primary" data-quick-add="${esc(dish.id)}" data-size="${esc(
            size.l
          )}">Add</button>`;
    return `<article class="dm-row${dish.soldOut ? " is-sold" : ""}" data-dish="${esc(dish.id)}">
      <div>
        <h3 class="dm-row__name">${esc(dish.name)}</h3>
        <p class="dm-row__meta">${esc(dish.short || "")} · ${esc(fmtPrice(size.p))}</p>
        ${dish.soldOut ? `<span class="dm-sold-badge">SOLD OUT TODAY</span>` : ""}
      </div>
      ${action}
    </article>`;
  }

  function optLabels(menu, opts) {
    const groups = Object.fromEntries((menu.groups || []).map((g) => [g.id, g]));
    const labels = [];
    Object.entries(opts || {}).forEach(([gid, val]) => {
      const g = groups[gid];
      if (!g) return;
      const ids = Array.isArray(val) ? val : [val];
      ids.forEach((oid) => {
        const opt = (g.opts || []).find((o) => o.id === oid);
        if (opt) labels.push(opt.l);
      });
    });
    return labels;
  }

  function unitPriceFor(menu, dish, sizeLabel, opts) {
    const size = sizePrice(dish, sizeLabel);
    let unit = size.p;
    const groups = Object.fromEntries((menu.groups || []).map((g) => [g.id, g]));
    Object.entries(opts || {}).forEach(([gid, val]) => {
      const g = groups[gid];
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
    const img = dish.img ? api.assetUrl(dish.img) : "";
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

    const groupBlocks = (dish.groups || [])
      .map((gid) => {
        const g = (menu.groups || []).find((x) => x.id === gid);
        if (!g) return "";
        const selected = state.opts[gid];
        const opts = (g.opts || [])
          .filter((o) => !o.off)
          .map((o) => {
            const active = g.type === "many"
              ? Array.isArray(selected) && selected.includes(o.id)
              : selected === o.id;
            const price = typeof o.p === "number" ? ` · +${fmtPrice(o.p)}` : "";
            return `<button type="button" class="dm-opt${active ? " is-active" : ""}" data-pop-opt-group="${esc(
              g.id
            )}" data-pop-opt="${esc(o.id)}" data-pop-opt-type="${esc(g.type)}">
              ${esc(o.l)}${esc(price)}
              ${o.sub ? `<span class="dm-opt__sub">${esc(o.sub)}</span>` : ""}
            </button>`;
          })
          .join("");
        return `<div class="dm-field"><span class="dm-field__label">${esc(g.name)}</span><div class="dm-opts">${opts}</div></div>`;
      })
      .join("");

    const unit = unitPriceFor(menu, dish, state.size, state.opts);
    const lineTotal = unit == null ? null : unit * (state.qty || 1);

    return `
      ${img ? `<div class="dm-pop__hero"><img src="${esc(img)}" alt=""></div>` : ""}
      <h2 class="dm-pop__title" id="dm-pop-title">${esc(dish.name)}</h2>
      ${tags ? `<div class="dm-tags">${tags}</div>` : ""}
      <p class="dm-pop__desc">${esc(dish.desc || dish.short || "")}</p>
      ${(dish.sizes || []).length ? `<div class="dm-field"><span class="dm-field__label">Size</span><div class="dm-opts">${sizes}</div></div>` : ""}
      ${groupBlocks}
      <div class="dm-field"><span class="dm-field__label">Quantity</span>
        <div class="dm-qty">
          <button type="button" data-pop-qty="-1" aria-label="Decrease">−</button>
          <strong id="dm-pop-qty">${state.qty || 1}</strong>
          <button type="button" data-pop-qty="1" aria-label="Increase">+</button>
        </div>
      </div>
      <button type="button" class="dm-btn dm-btn--primary dm-btn--block" id="dm-pop-add" ${
        dish.soldOut ? "disabled" : ""
      }>Add to list · ${esc(fmtPrice(lineTotal))}</button>
    `;
  }

  function listHtml(menu, lines) {
    if (!lines.length) {
      return `<p class="dm-list-note">Your list is empty. Add a dish to show the waiter.</p>`;
    }
    return lines
      .map((line) => {
        const labels = (line.optLabels || []).join(", ");
        return `<div class="dm-line" data-line-key="${esc(line.key)}">
          <div>
            <p class="dm-line__name">${esc(line.name)} × ${line.qty}</p>
            <p class="dm-line__opts">${esc(line.l)}${labels ? ` · ${esc(labels)}` : ""}</p>
          </div>
          <div class="dm-qty">
            <button type="button" data-line-qty="-1" aria-label="Decrease">−</button>
            <strong>${line.qty}</strong>
            <button type="button" data-line-qty="1" aria-label="Increase">+</button>
          </div>
        </div>`;
      })
      .join("");
  }

  function waiterHtml(lines) {
    return lines
      .map(
        (line) => `<div class="dm-waiter-line">
          <div>
            <strong>${esc(line.qty)}× ${esc(line.name)}</strong>
            <div>${esc(line.l)}${(line.optLabels || []).length ? ` · ${esc(line.optLabels.join(", "))}` : ""}</div>
          </div>
        </div>`
      )
      .join("");
  }

  window.TinyMenuRender = {
    esc,
    fmtPrice,
    sizePrice,
    sectionDishes,
    visibleSections,
    kidsDishes,
    pastaShapeSrc,
    cardHtml,
    rowHtml,
    optLabels,
    unitPriceFor,
    popHtml,
    listHtml,
    waiterHtml,
  };
})();
