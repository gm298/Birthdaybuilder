#!/usr/bin/env python3
"""Extract Tiny Digital Menu prototype → menu/img + menu-seed.json + SQL migration."""

from __future__ import annotations

import base64
import json
import pathlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
PROTO = ROOT / "Tiny Digital Menu - prototype.html"
OUT_IMG = ROOT / "menu" / "img"
OUT_JSON = ROOT / "menu" / "data" / "menu-seed.json"
OUT_SQL = ROOT / "supabase" / "migrations" / "20261019180000_menu_snapshots.sql"


def load_template() -> str:
    text = PROTO.read_text(encoding="utf-8", errors="replace")
    m = re.search(r'<script type="__bundler/template">(.*?)</script>', text, re.S)
    if not m:
        raise SystemExit("Could not find __bundler/template")
    return json.loads(m.group(1).strip())


def extract_js_block(tpl: str) -> str:
    """Pull slug/TA/D/G/PASTA/FRESH + DEFAULT() and optional __IMG."""
    # Prefer starting at slug helper used by G()
    start = tpl.find("slug = t =>")
    if start < 0:
        start = tpl.find("const TA =")
    if start < 0:
        raise SystemExit("Could not find menu helpers")

    # Ensure we include `const slug` / `var slug` / bare
    # Walk back to statement start
    line_start = tpl.rfind("\n", 0, start) + 1
    prefix = tpl[line_start:start]
    if "const " not in prefix and "let " not in prefix and "var " not in prefix:
        # bare `slug =` — prepend const
        block_start = line_start
        slug_fix = "const "
    else:
        block_start = line_start
        slug_fix = ""

    end_marker = tpl.find("\nfunction load()", start)
    if end_marker < 0:
        end_marker = tpl.find("\nfunction load (", start)
    if end_marker < 0:
        raise SystemExit("Could not find end of DEFAULT()")
    helpers = slug_fix + tpl[block_start:end_marker]

    # __IMG for pasta previews (may appear earlier)
    img_m = re.search(r"(?:const|let|var)?\s*__IMG\s*=\s*\{", tpl)
    img_js = "const __IMG = {};\n"
    if img_m:
        brace = img_m.end() - 1
        depth = 0
        i = brace
        while i < len(tpl):
            c = tpl[i]
            if c == "{":
                depth += 1
            elif c == "}":
                depth -= 1
                if depth == 0:
                    img_js = "const __IMG = " + tpl[brace : i + 1] + ";\n"
                    break
            i += 1

    return img_js + "\n" + helpers


def run_default(js_block: str) -> tuple[dict, dict]:
    """Evaluate DEFAULT() in Node; return (menu, __IMG)."""
    runner = f"""
{js_block}
const menu = DEFAULT();
const out = {{ menu, imgMap: (typeof __IMG !== 'undefined' ? __IMG : {{}}) }};
process.stdout.write(JSON.stringify(out));
"""
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".mjs", delete=False) as f:
        f.write(runner)
        path = f.name
    try:
        r = subprocess.run(
            ["node", path],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            cwd=str(ROOT),
        )
        if r.returncode != 0:
            print(r.stderr[:4000], file=sys.stderr)
            raise SystemExit(f"node failed ({r.returncode})")
        data = json.loads(r.stdout)
        return data["menu"], data.get("imgMap") or {}
    finally:
        pathlib.Path(path).unlink(missing_ok=True)


def decode_data_url(url: str) -> tuple[str, bytes]:
    m = re.match(r"data:(image/[\w+.-]+);base64,(.+)$", url, re.S)
    if not m:
        raise ValueError("not a data url")
    mime = m.group(1).lower()
    ext = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "image/svg+xml": ".svg",
    }.get(mime, ".bin")
    return ext, base64.b64decode(m.group(2))


def save_data_url(url: str, dest: pathlib.Path) -> str:
    ext, raw = decode_data_url(url)
    if dest.suffix.lower() not in (".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"):
        dest = dest.with_suffix(ext)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(raw)
    # relative to menu/
    rel = dest.relative_to(ROOT / "menu").as_posix()
    return rel


def rewrite_images(menu: dict, img_map: dict) -> dict:
    dishes_dir = OUT_IMG / "dishes"
    pasta_dir = OUT_IMG / "pasta"
    other_dir = OUT_IMG / "options"
    dishes_dir.mkdir(parents=True, exist_ok=True)
    pasta_dir.mkdir(parents=True, exist_ok=True)
    other_dir.mkdir(parents=True, exist_ok=True)

    dish_n = 0
    for d in menu.get("dishes") or []:
        img = d.get("img") or ""
        if isinstance(img, str) and img.startswith("data:image"):
            rel = save_data_url(img, dishes_dir / d["id"])
            d["img"] = rel
            dish_n += 1
        elif not img:
            d["img"] = ""
        d.setdefault("hidden", False)
        d.setdefault("soldOut", False)
        d.setdefault("esbMenuId", None)
        d.setdefault("esbMenuCode", None)
        d.setdefault("groups", d.get("groups") or [])
        d.setdefault("fit", d.get("fit") or "cover")

    opt_n = 0
    for g in menu.get("groups") or []:
        for opt in g.get("opts") or []:
            if not isinstance(opt, dict):
                continue
            opt.setdefault("esbOptionId", None)
            img = opt.get("img")
            if isinstance(img, str) and img.startswith("data:image"):
                oid = opt.get("id") or re.sub(r"[^a-z0-9]+", "-", (opt.get("l") or "opt").lower())
                rel = save_data_url(img, other_dir / f"{g['id']}-{oid}")
                opt["img"] = rel
                opt_n += 1

    pasta_remap = {}
    pasta_n = 0
    for key, data_url in img_map.items():
        if not isinstance(data_url, str) or not data_url.startswith("data:image"):
            continue
        name = pathlib.Path(key.replace("\\", "/")).name
        stem = pathlib.Path(name).stem
        rel = save_data_url(data_url, pasta_dir / stem)
        pasta_remap[key] = rel
        # also key by basename for simpler lookup
        pasta_remap[name] = rel
        pasta_n += 1

    settings = dict(menu.get("settings") or {})
    settings["pastaImgMap"] = pasta_remap
    settings["shopUrl"] = "https://esborder.qs.esb.co.id/TYKB/THFC/mode"
    settings.setdefault(
        "listNote",
        "Estimate only. Prices exclude 10% government tax & 5% service.",
    )
    settings.setdefault("baseUrl", "https://tinyhealthycafe.com/menu")
    menu["settings"] = settings

    print(f"Images: dishes={dish_n} options={opt_n} pasta={pasta_n}")
    return menu


def write_sql(payload: dict) -> None:
    payload_json = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    tag = "menu_json"
    while f"${tag}$" in payload_json:
        tag += "x"

    sql = f"""-- Digital guest menu snapshots. Dish photos live on Hostinger under menu/img/.
create table if not exists public.menu_snapshots (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('draft', 'live')),
  version integer not null default 1,
  payload jsonb not null,
  published_at timestamptz,
  updated_by uuid references auth.users (id),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists menu_snapshots_one_live
  on public.menu_snapshots (status)
  where status = 'live';

create unique index if not exists menu_snapshots_one_draft
  on public.menu_snapshots (status)
  where status = 'draft';

create index if not exists menu_snapshots_status_idx on public.menu_snapshots (status);

alter table public.menu_snapshots enable row level security;

grant select on public.menu_snapshots to anon, authenticated;
grant insert, update, delete on public.menu_snapshots to authenticated;

drop policy if exists "public read live menu" on public.menu_snapshots;
create policy "public read live menu"
  on public.menu_snapshots for select
  to anon, authenticated
  using (status = 'live');

drop policy if exists "staff read all menu snapshots" on public.menu_snapshots;
create policy "staff read all menu snapshots"
  on public.menu_snapshots for select
  to authenticated
  using (public.is_staff());

drop policy if exists "staff manage menu snapshots" on public.menu_snapshots;
create policy "staff manage menu snapshots"
  on public.menu_snapshots for all
  to authenticated
  using (public.is_staff())
  with check (public.is_staff());

-- Seed only when empty (safe to re-run)
do $$
begin
  if not exists (select 1 from public.menu_snapshots where status = 'live') then
    insert into public.menu_snapshots (status, version, payload, published_at, note)
    values (
      'live',
      1,
      ${tag}${payload_json}${tag}$,
      now(),
      'Seeded from Tiny Digital Menu prototype'
    );
  end if;
  if not exists (select 1 from public.menu_snapshots where status = 'draft') then
    insert into public.menu_snapshots (status, version, payload, published_at, note)
    values (
      'draft',
      1,
      ${tag}${payload_json}${tag}$,
      null,
      'Seeded from Tiny Digital Menu prototype'
    );
  end if;
end $$;
"""
    OUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    OUT_SQL.write_text(sql, encoding="utf-8")
    print("Wrote", OUT_SQL)


def main() -> None:
    if not PROTO.exists():
        raise SystemExit(f"Missing {PROTO}")
    tpl = load_template()
    js = extract_js_block(tpl)
    print("JS block chars", len(js))
    menu, img_map = run_default(js)
    print(
        "Parsed",
        f"dishes={len(menu.get('dishes') or [])}",
        f"groups={len(menu.get('groups') or [])}",
        f"sections={len(menu.get('sections') or [])}",
        f"__IMG={len(img_map)}",
    )
    menu = rewrite_images(menu, img_map)
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(menu, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Wrote", OUT_JSON)
    write_sql(menu)
    print("Done")


if __name__ == "__main__":
    main()
