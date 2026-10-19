(() => {
  "use strict";

  const KEY = "tinyDigitalMenu.guestList.v1";

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function write(lines) {
    localStorage.setItem(KEY, JSON.stringify(lines));
  }

  function lineKey(id, sizeLabel, opts) {
    return `${id}|${sizeLabel || ""}|${JSON.stringify(opts || {})}`;
  }

  function add(line) {
    const lines = read();
    const key = line.key || lineKey(line.id, line.l, line.opts);
    const existing = lines.find((x) => x.key === key);
    if (existing) {
      existing.qty += line.qty || 1;
    } else {
      lines.push({
        key,
        id: line.id,
        l: line.l,
        opts: line.opts || {},
        qty: line.qty || 1,
        esbMenuId: line.esbMenuId || null,
        unitPrice: line.unitPrice ?? null,
        name: line.name || "",
        optLabels: line.optLabels || [],
      });
    }
    write(lines);
    return lines;
  }

  function setQty(key, qty) {
    let lines = read();
    if (qty <= 0) {
      lines = lines.filter((x) => x.key !== key);
    } else {
      const row = lines.find((x) => x.key === key);
      if (row) row.qty = qty;
    }
    write(lines);
    return lines;
  }

  function clear() {
    write([]);
    return [];
  }

  function count(lines) {
    return (lines || read()).reduce((n, x) => n + (x.qty || 0), 0);
  }

  function total(lines, menu) {
    const dishes = Object.fromEntries((menu?.dishes || []).map((d) => [d.id, d]));
    let sum = 0;
    let incomplete = false;
    (lines || read()).forEach((line) => {
      const dish = dishes[line.id];
      let unit = line.unitPrice;
      if (unit == null && dish) {
        const size = (dish.sizes || []).find((s) => s.l === line.l);
        unit = size ? size.p : null;
        const groups = Object.fromEntries((menu.groups || []).map((g) => [g.id, g]));
        Object.entries(line.opts || {}).forEach(([gid, val]) => {
          const g = groups[gid];
          if (!g) return;
          const ids = Array.isArray(val) ? val : [val];
          ids.forEach((oid) => {
            const opt = (g.opts || []).find((o) => o.id === oid);
            if (opt && typeof opt.p === "number") unit = (unit || 0) + opt.p;
          });
        });
      }
      if (unit == null) incomplete = true;
      else sum += unit * (line.qty || 0);
    });
    return { sum, incomplete };
  }

  /** Future ESB order payload shape (not submitted in v1). */
  function toOrderPayload(lines, menu, mode) {
    return {
      mode: mode || "waiter_show",
      lines: (lines || read()).map((line) => ({
        dishId: line.id,
        esbMenuId: line.esbMenuId || null,
        size: line.l,
        opts: line.opts || {},
        qty: line.qty,
        unitPrice: line.unitPrice,
        name: line.name,
      })),
      tableHint: null,
      listNote: menu?.settings?.listNote || "",
    };
  }

  window.TinyMenuCart = {
    KEY,
    read,
    write,
    add,
    setQty,
    clear,
    count,
    total,
    lineKey,
    toOrderPayload,
  };
})();
