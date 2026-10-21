"""Add the Tiny Nights dinner menu beside food and drinks.

Reads Dinner Menu.pdf (newest file in Downloads). Prices are thousands of
rupiah. Single-price dishes use Regular. Food, drinks, and specials stay.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "menu" / "data" / "menu-seed.json"
IMG_DIR = ROOT / "menu" / "img" / "dinner"
ASSETS = Path(
    r"C:\Users\Gusti\.cursor\projects\c-Users-Gusti-OneDrive-Documents-design-handoff-birthday-landing-20260812T093818Z-1-001\assets"
)
PUBLIC = "https://wvfwnnujxvaukwrtydac.supabase.co/storage/v1/object/public/menu-images/dinner/"

PHOTO_TOKENS = {
    "tartare.jpg": "Steak_Tartare",
    "polenta.jpg": "Salmon___Polenta",
    "schnitzel.jpg": "Chicken_Schnitzel",
    "burger.jpg": "Black_Burger",
    "roast-chicken.jpg": "Roast_chicken",
    "steak-veg.jpg": "Steak_and_Veg",
    "macaron.jpg": "Macaroon___Icecream",
    "dome.jpg": "Chocolate_dome",
    "lava.jpg": "Chocolate_lava",
    "zucchini.jpg": "Grilled_Zucchini",
    "tomato-pasta.jpg": "Tomato___Basil_Tagliatelle",
    "olive-pasta.jpg": "Olive___Caper",
    "thai-beef.jpg": "Thai_Beef",
    "salmon.jpg": "Seared_Salmon",
}


def photo(name: str) -> str:
    return f"{PUBLIC}{name}" if name else ""


def section(sid, name, intro=""):
    return {
        "id": sid,
        "name": name,
        "layout": "cards",
        "visible": True,
        "intro": intro,
        "subs": [],
        "family": "dinner",
        "cat": "dinner",
    }


def dish(did, sec, name, short, desc, price, groups=(), img=""):
    return {
        "id": did,
        "sec": sec,
        "sub": "",
        "name": name,
        "short": short,
        "desc": desc,
        "img": photo(img),
        "fit": "cover",
        "tags": [],
        "sizes": [{"l": "Regular", "p": price}],
        "groups": list(groups),
        "hidden": False,
        "soldOut": False,
        "esbMenuId": None,
        "esbMenuCode": None,
        "cat": "dinner",
    }


def opt(oid, label):
    return {"id": oid, "l": label, "esbOptionId": None}


def group(gid, name, opts):
    return {
        "id": gid,
        "name": name,
        "type": "one",
        "opts": opts,
        "family": "dinner",
        "cat": "dinner",
    }


def build_catalog():
    sauce = ["dn-sauce"]
    mash = ["dn-mash"]
    sections = [
        section("dn-app", "Appetiser"),
        section("dn-classics", "The Classics"),
        section("dn-snacks", "Snacks & sides"),
        section("dn-mains", "Mains"),
        section("dn-salads", "Salads"),
        section("dn-desserts", "Desserts"),
        section("dn-beer", "Beer specials", "Burger or pasta with a beer."),
    ]
    dishes = [
        dish(
            "dn-tartare",
            "dn-app",
            "Steak Tartare",
            "Australian tenderloin, herbs, capers and tobiko.",
            "Brunoise-cut Australian tenderloin with herbs, capers, egg yolk and tobiko, served with crisp baguette.",
            119,
            img="tartare.jpg",
        ),
        dish(
            "dn-polenta",
            "dn-app",
            "Salmon & Polenta",
            "Polenta pancake, dill cream cheese and gravlax.",
            "Polenta pancake with dill cream cheese, topped with salmon gravlax and tobiko.",
            119,
            img="polenta.jpg",
        ),
        dish(
            "dn-brus",
            "dn-app",
            "Bruschetta",
            "Tomato, garlic, basil and olive oil.",
            "Home-made baguette with fresh diced tomatoes, garlic, basil and extra virgin olive oil.",
            39,
        ),
        dish(
            "dn-rolls",
            "dn-app",
            "Fairy Flower Rolls",
            "Rice paper rolls with peanut sesame sauce.",
            "Seasonal salad, micro herbs, mango, kale, pickles and flowers wrapped in rice paper, with peanut sesame sauce and coriander cashew chutney.",
            85,
        ),
        dish(
            "dn-burger",
            "dn-classics",
            "Black Cheese Burger",
            "Charcoal bun, beef patty, cheddar and fries.",
            "Multigrain charcoal brioche bun with an Australian beef patty, caramelised onion, cheddar cheese and ranch sauce. Served with crinkle-cut french fries.",
            119,
            img="burger.jpg",
        ),
        dish(
            "dn-olive",
            "dn-classics",
            "Olive & Caper Tagliatelle",
            "Home-made tagliatelle, olive and caper sauce.",
            "Home-made tagliatelle with an olive and caper sauce.",
            55,
            img="olive-pasta.jpg",
        ),
        dish(
            "dn-tomato",
            "dn-classics",
            "Tomato & Basil Tagliatelle",
            "Home-made tagliatelle, fresh tomato and basil.",
            "Home-made tagliatelle with a fresh tomato and basil sauce.",
            55,
            img="tomato-pasta.jpg",
        ),
        dish(
            "dn-wings",
            "dn-snacks",
            "Chicken Wings",
            "6 pieces, roasted garlic soy.",
            "Six roasted garlic soy chicken wings.",
            39,
        ),
        dish("dn-calamari", "dn-snacks", "Calamari Tempura", "Calamari tempura.", "Calamari tempura.", 59),
        dish("dn-karage", "dn-snacks", "Chicken Karage", "Chicken karage.", "Chicken karage.", 44),
        dish("dn-crisps", "dn-snacks", "Potato Crisps", "Potato crisps.", "Potato crisps.", 29),
        dish(
            "dn-mash",
            "dn-snacks",
            "Mashed Potato or Carrot",
            "Choose mashed potato or carrot.",
            "Mashed potato or carrot.",
            29,
            mash,
        ),
        dish(
            "dn-roast",
            "dn-mains",
            "Roast Chicken",
            "Chicken breast, beans, onion and cherry tomato.",
            "Roasted chicken breast with sauteed beans, grilled onion and toasted cherry tomato.",
            96,
            img="roast-chicken.jpg",
        ),
        dish(
            "dn-steak",
            "dn-mains",
            "Steak & Veg",
            "200g Australian rib-eye with greens.",
            "200g Australian rib-eye with green beans, asparagus, baby carrots and mashed potato. Choice of demi-glace or black pepper sauce.",
            279,
            sauce,
            "steak-veg.jpg",
        ),
        dish(
            "dn-schnitz",
            "dn-mains",
            "Chicken Schnitzel",
            "Breaded cutlet, creamy sauce, onion and lemon.",
            "Breaded chicken cutlet with creamy sauce, grilled onion and lemon.",
            114,
            img="schnitzel.jpg",
        ),
        dish(
            "dn-salmon",
            "dn-mains",
            "Seared Salmon",
            "Crispy skin salmon, carrot puree and greens.",
            "Crispy skin salmon with carrot puree, sauteed asparagus, spinach and shimeji mushrooms.",
            249,
            img="salmon.jpg",
        ),
        dish(
            "dn-zuc",
            "dn-salads",
            "Grilled Zucchini",
            "Zucchini, cherry tomato, kale and feta.",
            "Grilled zucchini, cherry tomato, kale and feta cheese.",
            109,
            img="zucchini.jpg",
        ),
        dish(
            "dn-thai",
            "dn-salads",
            "Thai Beef Salad",
            "Rib-eye with a spicy Thai dressing.",
            "Marinated Australian rib-eye with a spicy Thai dressing, cucumber, red paprika, coriander, shallots and spring onion.",
            185,
            img="thai-beef.jpg",
        ),
        dish(
            "dn-burrata",
            "dn-salads",
            "Citrus Burrata Salad",
            "Citrus, watermelon, tomatoes and burrata.",
            "Seasonal citrus, watermelon, three-colour cherry tomatoes and Italian basil, topped with burrata.",
            129,
        ),
        dish(
            "dn-dome",
            "dn-desserts",
            "Chocolate Dome",
            "Chocolate dome with banana ice cream.",
            "Tempered chocolate dome filled with banana ice cream and red velvet sponge.",
            79,
            img="dome.jpg",
        ),
        dish(
            "dn-lava",
            "dn-desserts",
            "Chocolate Lava Cake",
            "Home-made chocolate lava cake.",
            "Home-made chocolate lava cake.",
            39,
            img="lava.jpg",
        ),
        dish(
            "dn-macaron",
            "dn-desserts",
            "Macaron & Ice Cream",
            "Matcha macaron and hojicha ice cream.",
            "Matcha macaron served with hojicha ice cream and berry reduction.",
            69,
            img="macaron.jpg",
        ),
        dish(
            "dn-beer-burger",
            "dn-beer",
            "Burger & Beer",
            "Black cheese burger with a beer.",
            "Black cheese burger with a beer.",
            149,
            img="burger.jpg",
        ),
        dish(
            "dn-beer-pasta",
            "dn-beer",
            "Pasta & Beer",
            "Tagliatelle with a beer.",
            "Tagliatelle with a beer.",
            79,
        ),
    ]
    groups = [
        group("dn-sauce", "Sauce", [opt("demi", "Demi-glace"), opt("pepper", "Black pepper")]),
        group("dn-mash", "Side", [opt("potato", "Mashed potato"), opt("carrot", "Carrot")]),
    ]
    sizes = [{"label": "Regular", "note": "", "family": "dinner", "cat": "dinner"}]
    return sections, dishes, groups, sizes


def is_dinner(obj):
    return obj.get("cat") == "dinner" or obj.get("family") == "dinner"


def ensure_dinner_menu(menu):
    settings = menu.setdefault("settings", {})
    menus = settings.setdefault("menus", [])
    if any(m.get("id") == "dinner" for m in menus):
        return
    food_at = next((i for i, m in enumerate(menus) if m.get("id") == "food"), -1)
    menus.insert(food_at + 1 if food_at >= 0 else len(menus), {"id": "dinner", "name": "Dinner Menu"})


def apply_catalog(menu, sections, dishes, groups, sizes):
    ensure_dinner_menu(menu)
    before = {d["id"] for d in menu.get("dishes", []) if not is_dinner(d)}
    menu["sizes"] = [s for s in menu.get("sizes", []) if not is_dinner(s)]
    menu["sizes"].extend(sizes)
    kept_sections = [s for s in menu.get("sections", []) if not is_dinner(s)]
    play_at = next((i for i, s in enumerate(kept_sections) if s.get("id") == "play"), len(kept_sections))
    kept_sections[play_at:play_at] = sections
    menu["sections"] = kept_sections
    menu["groups"] = [g for g in menu.get("groups", []) if not is_dinner(g)]
    menu["groups"].extend(groups)
    menu["dishes"] = [d for d in menu.get("dishes", []) if not is_dinner(d)]
    menu["dishes"].extend(dishes)
    after = {d["id"] for d in menu["dishes"] if not is_dinner(d)}
    if before != after:
        missing = sorted(before - after)
        extra = sorted(after - before)
        raise SystemExit(f"Non-dinner dishes changed. missing={missing[:8]} extra={extra[:8]}")
    return menu


def write_seed():
    raw = SEED.read_bytes()
    newline = "\r\n" if b"\r\n" in raw[:400] else "\n"
    menu = json.loads(raw.decode("utf-8"))
    sections, dishes, groups, sizes = build_catalog()
    apply_catalog(menu, sections, dishes, groups, sizes)
    text = json.dumps(menu, ensure_ascii=False, indent=2) + "\n"
    if newline == "\r\n":
        text = text.replace("\n", "\r\n")
    SEED.write_bytes(text.encode("utf-8"))
    drinks = sum(1 for d in menu["dishes"] if d.get("cat") == "drink")
    food = sum(1 for d in menu["dishes"] if d.get("cat") not in ("drink", "dinner"))
    print(f"wrote seed: {food} food/special, {drinks} drinks, {len(dishes)} dinner")


def long_path(path: Path) -> str:
    text = os.path.abspath(path)
    if text.startswith("\\\\?\\"):
        return text
    return "\\\\?\\" + text


def find_asset(token):
    hits = [
        name
        for name in os.listdir(ASSETS)
        if token in name and name.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    ]
    if len(hits) != 1:
        raise SystemExit(f"Expected one asset for {token}, found {hits}")
    return ASSETS / hits[0]


def compress(data: bytes) -> bytes:
    try:
        from PIL import Image
    except ImportError:
        return data
    image = Image.open(BytesIO(data))
    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    image.thumbnail((1600, 1600))
    out = BytesIO()
    image.save(out, "JPEG", quality=82, optimize=True)
    return out.getvalue()


def copy_images():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    copied = {}
    for filename, token in PHOTO_TOKENS.items():
        src = find_asset(token)
        with open(long_path(src), "rb") as handle:
            data = compress(handle.read())
        dest = IMG_DIR / filename
        dest.write_bytes(data)
        copied[filename] = dest
        print(f"copied {filename} ({len(data)} bytes)")
    return copied


def load_env():
    env = {}
    for line in (ROOT / ".env.local").read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"')
    return env


def storage_upload(env, files):
    base = env["SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    for filename, path in files.items():
        url = f"{base}/storage/v1/object/menu-images/dinner/{filename}"
        req = urllib.request.Request(
            url,
            data=path.read_bytes(),
            method="POST",
            headers={
                "Authorization": f"Bearer {key}",
                "apikey": key,
                "Content-Type": "image/jpeg",
                "x-upsert": "true",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as res:
                print(f"uploaded {filename} ({res.status})")
        except urllib.error.HTTPError as err:
            body = err.read().decode("utf-8", "replace")[:300]
            raise SystemExit(f"Upload failed for {filename}: {err.code} {body}") from err


def supabase_json(env, method, path, body=None):
    base = env["SUPABASE_URL"].rstrip("/")
    key = env["SUPABASE_SERVICE_ROLE_KEY"]
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(
        f"{base}{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {key}",
            "apikey": key,
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as res:
            raw = res.read().decode("utf-8")
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")[:500]
        raise SystemExit(f"Supabase {method} {path} failed: {err.code} {detail}") from err


def publish(env):
    rows = supabase_json(
        env,
        "GET",
        "/rest/v1/menu_snapshots?status=in.(live,draft)&select=id,status,version,payload",
    )
    now = datetime.now(timezone.utc).isoformat()
    sections, dishes, groups, sizes = build_catalog()
    if not rows:
        menu = json.loads(SEED.read_text(encoding="utf-8"))
        supabase_json(
            env,
            "POST",
            "/rest/v1/menu_snapshots",
            {
                "status": "live",
                "version": 1,
                "payload": menu,
                "published_at": now,
                "note": "Dinner menu",
            },
        )
        print("inserted live snapshot from seed")
        return
    for row in rows:
        payload = apply_catalog(row["payload"], sections, dishes, groups, sizes)
        drinks = sum(1 for d in payload["dishes"] if d.get("cat") == "drink")
        dinner = sum(1 for d in payload["dishes"] if d.get("cat") == "dinner")
        other = len(payload["dishes"]) - drinks - dinner
        supabase_json(
            env,
            "PATCH",
            f"/rest/v1/menu_snapshots?id=eq.{row['id']}",
            {
                "payload": payload,
                "note": "Dinner menu",
                "updated_at": now,
                **({"published_at": now} if row["status"] == "live" else {}),
            },
        )
        print(f"updated {row['status']}: {other} food/special, {drinks} drinks, {dinner} dinner")


def main():
    steps = set(sys.argv[1:] or ["seed", "images", "upload", "publish"])
    if "seed" in steps:
        write_seed()
    files = None
    if "images" in steps or "upload" in steps:
        files = copy_images()
    env = load_env()
    if "upload" in steps:
        storage_upload(env, files or copy_images())
    if "publish" in steps:
        publish(env)


if __name__ == "__main__":
    main()
