/**
 * Backfill category (cat/family) on dishes, sections, groups, and size presets.
 * Default: food. Drinks section → drink. Offers → special.
 */
import fs from "fs";

const path = new URL("../menu/data/menu-seed.json", import.meta.url);
const menu = JSON.parse(fs.readFileSync(path, "utf8"));

const secFamily = Object.fromEntries(
  (menu.sections || []).map((s) => [s.id, s.family || s.cat || "food"])
);

let nDish = 0;
for (const d of menu.dishes || []) {
  const next = d.cat || secFamily[d.sec] || "food";
  if (d.cat !== next) {
    d.cat = next;
    nDish++;
  } else if (!d.cat) {
    d.cat = next;
    nDish++;
  }
}

let nSec = 0;
for (const s of menu.sections || []) {
  const next = s.family || s.cat || "food";
  if (s.family !== next) {
    s.family = next;
    nSec++;
  }
  if (s.cat !== next) s.cat = next;
}

let nGroup = 0;
for (const g of menu.groups || []) {
  const next = g.family || g.cat || "food";
  if (g.family !== next) {
    g.family = next;
    nGroup++;
  }
  if (g.cat !== next) g.cat = next;
}

let nSize = 0;
for (const s of menu.sizes || []) {
  const next = s.family || s.cat || "food";
  if (s.family !== next) {
    s.family = next;
    nSize++;
  }
  if (s.cat !== next) s.cat = next;
}

fs.writeFileSync(path, JSON.stringify(menu, null, 2) + "\n");
console.log(`Updated seed: dishes=${nDish}, sections=${nSec}, groups=${nGroup}, sizes=${nSize}`);
