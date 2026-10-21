"""Build the drink menu into menu-seed.json, upload photos, and merge the live snapshot.

Food and specials are left in place. Re-running replaces only drink sections,
dishes, groups, and drink size presets.

Prices are thousands of rupiah, read from the Drink Menu PDF columns:
  Coffee S | M | L — espresso and macchiato are Small/Medium; milk coffees are
  Medium/Large; extra shot is 35 (medium) and 52 (large).
  Smoothies are Small 35 / Medium 65. Mist juice is the separate Small 35 /
  Medium 45 line under that drink. Other juices are Small 45 / Medium 55.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "menu" / "data" / "menu-seed.json"
IMG_DIR = ROOT / "menu" / "img" / "drinks"
ASSETS = Path(
    r"C:\Users\Gusti\.cursor\projects\c-Users-Gusti-OneDrive-Documents-design-handoff-birthday-landing-20260812T093818Z-1-001\assets"
)
PUBLIC = "https://wvfwnnujxvaukwrtydac.supabase.co/storage/v1/object/public/menu-images/drinks/"

PHOTO_TOKENS = {
    "espresso.jpg": "espresso_double",
    "macchiato.jpg": "images_picolo-",
    "milk-coffee.jpg": "cappuccino_latte_flat_white",
    "americano.jpg": "long_black",
    "matcha.jpg": "matcha_latte",
    "lemon-rosemary.jpg": "lemon_rosemary",
    "fresh-mint.jpg": "fresh_mint",
    "ginger-lemon.jpg": "ginger_lemon",
    "cinnamon.jpg": "images_cinnamon-",
    "chamomile.jpg": "chamomile",
    "pineapple-basil.jpg": "pineapple_sweet_basil",
    "rosella.jpg": "rosella_soursop",
    "blue-lemonade.jpg": "blue_lemonade",
    "smoothie-pink.jpg": "pink_smothie",
    "smoothie-earth.jpg": "earth_smothie",
    "smoothie-purple.jpg": "super_purple_smothie",
    "juice-pink.jpg": "Pink_watermelon",
    "juice-orange.jpg": "orange_carrot",
    "juice-light.jpg": "light_orange",
    "milk-pink.jpg": "pink_strawberry_milk",
    "milk-blue.jpg": "blue_blueberry_milk",
    "milk-yellow.jpg": "yellow_turmeric_milk",
}


def photo(name: str) -> str:
    return f"{PUBLIC}{name}" if name else ""


def section(sid, name, layout, intro=""):
    return {
        "id": sid,
        "name": name,
        "layout": layout,
        "visible": True,
        "intro": intro,
        "subs": [],
        "family": "drink",
        "cat": "drink",
    }


def dish(did, sec, name, short, desc, sizes, groups=(), img=""):
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
        "sizes": [{"l": label, "p": price} for label, price in sizes],
        "groups": list(groups),
        "hidden": False,
        "soldOut": False,
        "esbMenuId": None,
        "esbMenuCode": None,
        "cat": "drink",
    }


def opt(oid, label, price=None, sub=""):
    row = {"id": oid, "l": label, "esbOptionId": None}
    if sub:
        row["sub"] = sub
    if price is not None:
        row["p"] = price
    return row


def group(gid, name, gtype, opts):
    return {
        "id": gid,
        "name": name,
        "type": gtype,
        "opts": opts,
        "family": "drink",
        "cat": "drink",
    }


def build_catalog():
    coffee = ["d-serve", "d-coffee-extra", "d-healthy"]
    coffee_affogato = ["d-coffee-extra", "d-healthy"]
    cacao = ["d-serve", "d-alt-milk", "d-healthy"]
    cacao_affogato = ["d-alt-milk", "d-healthy"]
    hot = ["d-serve", "d-healthy"]
    boost = ["d-boost"]
    milk = ["d-warm", "d-milk", "d-boost"]

    sections = [
        section(
            "coffee",
            "Coffee",
            "cards",
            "Hot or cold. Decaf +15. Extra shot 35 on medium, 52 on large. Almond or oat milk +15.",
        ),
        section(
            "cacao",
            "Cacao",
            "cards",
            "Hot or cold, made with organic local cacao. Almond or oat milk +15.",
        ),
        section("infusions", "Fresh infusions", "cards", "Hot or cold."),
        section("tea", "Tea", "cards", "Hot or cold."),
        section("healthy", "Healthy +", "list", "Enhance your coffee, tea or cacao."),
        section("mocktails", "Mocktails", "cards"),
        section("juices", "Juices", "cards"),
        section(
            "smoothies",
            "Smoothies",
            "cards",
            "Protein powder +25, creatine +15, or collagen +10.",
        ),
        section(
            "milks",
            "Rainbow milks",
            "cards",
            "Warm or cold, with cow's milk, oat milk, or home-made almond milk.",
        ),
        section("slush", "Lush slush", "cards"),
        section("water", "Water", "cards"),
        section("kombucha", "Kombucha", "cards", "Sourboucha sugar-free kombucha, 330ml."),
        section("beer", "Beer", "cards"),
        section("cocktails", "Cocktails", "cards"),
        section("wine", "Wine", "cards"),
    ]

    sm = lambda a, b: [("Small", a), ("Medium", b)]
    ml = lambda a, b: [("Medium", a), ("Large", b)]
    sml = lambda a, b, c: [("Small", a), ("Medium", b), ("Large", c)]
    one = lambda p: [("Regular", p)]

    dishes = [
        dish("dk-esp", "coffee", "Espresso", "Hot or cold.", "Espresso, hot or cold.", sm(35, 55), coffee, "espresso.jpg"),
        dish("dk-mac", "coffee", "Macchiato", "Hot or cold.", "Macchiato, hot or cold.", sm(35, 55), coffee, "macchiato.jpg"),
        dish("dk-cap", "coffee", "Cappuccino", "Hot or cold.", "Cappuccino, hot or cold.", ml(45, 65), coffee, "milk-coffee.jpg"),
        dish("dk-fw", "coffee", "Flat White", "Hot or cold.", "Flat white, hot or cold.", ml(45, 65), coffee, "milk-coffee.jpg"),
        dish("dk-lat", "coffee", "Latte", "Hot or cold.", "Latte, hot or cold.", ml(45, 65), coffee, "milk-coffee.jpg"),
        dish("dk-ame", "coffee", "Americano", "Hot or cold.", "Americano, hot or cold.", ml(45, 65), coffee, "americano.jpg"),
        dish("dk-moc", "coffee", "Mocha", "Hot or cold.", "Mocha, hot or cold.", ml(45, 65), coffee),
        dish(
            "dk-aff",
            "coffee",
            "Affogato",
            "With homemade ice cream.",
            "Affogato with your choice of homemade ice cream.",
            one(55),
            coffee_affogato,
        ),
        dish("dk-cac", "cacao", "Classic", "Organic local cacao.", "Classic cacao, hot or cold.", sml(25, 45, 55), cacao),
        dish(
            "dk-cac-gin",
            "cacao",
            "Cacao Ginger & Coconut",
            "Ginger and coconut.",
            "Cacao with ginger and coconut, hot or cold.",
            sml(35, 55, 65),
            cacao,
        ),
        dish("dk-cac-ber", "cacao", "Cacao Berries", "Cacao and berries.", "Cacao with berries, hot or cold.", sml(35, 55, 65), cacao),
        dish(
            "dk-cac-cin",
            "cacao",
            "Cacao Cinnamon",
            "Cacao and cinnamon.",
            "Cacao with cinnamon, hot or cold.",
            sml(35, 55, 65),
            cacao,
        ),
        dish(
            "dk-cac-aff",
            "cacao",
            "Cacao Affogato",
            "With homemade ice cream.",
            "Cacao affogato with your choice of homemade ice cream.",
            sml(40, 75, 85),
            cacao_affogato,
        ),
        dish("dk-matcha", "cacao", "Matcha Latte", "Hot or cold.", "Matcha latte, hot or cold.", ml(45, 65), cacao, "matcha.jpg"),
        dish("dk-hojilatte", "cacao", "Hojicha Latte", "Hot or cold.", "Hojicha latte, hot or cold.", ml(45, 65), cacao),
        dish("dk-inf-lem", "infusions", "Lemon Rosemary", "Hot or cold.", "Lemon and rosemary infusion, hot or cold.", one(55), hot, "lemon-rosemary.jpg"),
        dish("dk-inf-mint", "infusions", "Fresh Mint", "Hot or cold.", "Fresh mint infusion, hot or cold.", one(55), hot, "fresh-mint.jpg"),
        dish("dk-inf-gin", "infusions", "Ginger Lemon", "Hot or cold.", "Ginger and lemon infusion, hot or cold.", one(55), hot, "ginger-lemon.jpg"),
        dish(
            "dk-inf-pea",
            "infusions",
            "Butterfly Pea Orange",
            "Hot or cold.",
            "Butterfly pea and orange infusion, hot or cold.",
            one(55),
            hot,
        ),
        dish("dk-inf-cin", "infusions", "Cinnamon", "Hot or cold.", "Cinnamon infusion, hot or cold.", one(55), hot, "cinnamon.jpg"),
        dish("dk-tea-cham", "tea", "Chamomile", "Hot or cold.", "Chamomile tea, hot or cold.", one(45), hot, "chamomile.jpg"),
        dish("dk-tea-roo", "tea", "Rooibos", "Hot or cold.", "Rooibos tea, hot or cold.", one(45), hot),
        dish("dk-tea-hoji", "tea", "Hojicha", "Hot or cold.", "Hojicha tea, hot or cold.", one(45), hot),
        dish("dk-tea-green", "tea", "Green Tea", "Hot or cold.", "Green tea, hot or cold.", one(45), hot),
        dish("dk-tea-earl", "tea", "Earl Grey", "Hot or cold.", "Earl Grey, hot or cold.", one(45), hot),
        dish("dk-tea-eng", "tea", "English Breakfast Tea", "Hot or cold.", "English breakfast tea, hot or cold.", one(45), hot),
        dish("dk-add-lav", "healthy", "Lavender", "Add to coffee, tea or cacao.", "Lavender.", one(15)),
        dish("dk-add-honey", "healthy", "Raw Mountain Honey", "Add to coffee, tea or cacao.", "Raw mountain honey.", one(20)),
        dish("dk-add-agave", "healthy", "Agave Syrup", "Add to coffee, tea or cacao.", "Agave syrup.", one(20)),
        dish(
            "dk-add-col",
            "healthy",
            "Collagen",
            "Collagen 5g, protein 4.67g.",
            "Collagen. Collagen 5g, protein 4.67g.",
            one(10),
        ),
        dish(
            "dk-mock-pine",
            "mocktails",
            "Pineapple Sweet Basil",
            "Pineapple, Thai basil, soda, honey and lime.",
            "Healthy digestion promoting pineapple and Thai sweet basil, a spin on a classic.",
            one(55),
            img="pineapple-basil.jpg",
        ),
        dish(
            "dk-mock-blue",
            "mocktails",
            "Blue Lemonade",
            "Butterfly pea, lime, soda and honey.",
            "Rich in antioxidants and vitamin C for hydration and immune support.",
            one(55),
            img="blue-lemonade.jpg",
        ),
        dish(
            "dk-mock-ros",
            "mocktails",
            "Rosella Soursop Soda",
            "Rosella, soursop, soda and honey.",
            "High in vitamin C and anti-inflammatory. Promotes destruction of free radicals.",
            one(55),
            img="rosella.jpg",
        ),
        dish("dk-j-yel", "juices", "Yellow", "Pineapple juice.", "Pineapple juice.", sm(45, 55), boost),
        dish("dk-j-lor", "juices", "Light Orange", "Tangerine juice.", "Tangerine juice.", sm(45, 55), boost, "juice-light.jpg"),
        dish(
            "dk-j-ora",
            "juices",
            "Orange",
            "Carrot, apple, turmeric, ginger and lime.",
            "Carrot, apple, turmeric, ginger and lime juice.",
            sm(45, 55),
            boost,
            "juice-orange.jpg",
        ),
        dish(
            "dk-j-pink",
            "juices",
            "Pink",
            "Watermelon, peppermint star juice and lime.",
            "Watermelon, peppermint star juice and lime juice.",
            sm(45, 55),
            boost,
            "juice-pink.jpg",
        ),
        dish(
            "dk-j-mist",
            "juices",
            "Mist",
            "Coconut water, with optional lime or coconut flesh.",
            "Coconut water with optional lime or coconut flesh.",
            sm(35, 45),
            boost,
        ),
        dish(
            "dk-sm-pink",
            "smoothies",
            "Pink",
            "Mango, strawberry, Greek yoghurt and oat milk.",
            "High in protein and vitamin C to support immunity and gut health.",
            sm(35, 65),
            boost,
            "smoothie-pink.jpg",
        ),
        dish(
            "dk-sm-earth",
            "smoothies",
            "Earth",
            "Hojicha, dates, banana, oats and almond milk.",
            "A grounding blend rich in fiber and antioxidants for sustained energy.",
            sm(35, 65),
            boost,
            "smoothie-earth.jpg",
        ),
        dish(
            "dk-sm-purp",
            "smoothies",
            "Super Purple",
            "Banana, blueberry and almond milk.",
            "Packed with superfoods to boost brain function and fight inflammation.",
            sm(35, 65),
            boost,
            "smoothie-purple.jpg",
        ),
        dish(
            "dk-mk-blue",
            "milks",
            "Blue Milk",
            "Blueberry, butterfly pea, blue spirulina and honey.",
            "Packed with antioxidants and anti-inflammatories to support brain function and energy.",
            sm(35, 45),
            milk,
            "milk-blue.jpg",
        ),
        dish(
            "dk-mk-yel",
            "milks",
            "Yellow Milk",
            "Turmeric and honey.",
            "Anti-inflammatory and immunity-boosting.",
            sm(35, 45),
            milk,
            "milk-yellow.jpg",
        ),
        dish(
            "dk-mk-pink",
            "milks",
            "Pink Milk",
            "Strawberry, dragon fruit and allulose.",
            "Vitamin C-rich and digestion-friendly, sweetened with allulose.",
            sm(35, 45),
            milk,
            "milk-pink.jpg",
        ),
        dish(
            "dk-sl-green",
            "slush",
            "Green",
            "Kale, avocado, cucumber, lemon and dates.",
            "Loaded with fiber and antioxidants to support detox and skin health.",
            sm(35, 55),
            boost,
        ),
        dish(
            "dk-sl-purp",
            "slush",
            "Purple",
            "Dragon fruit, soursop, green apple and agave.",
            "High in vitamin C and immune-supporting compounds, with a tropical tang.",
            sm(35, 55),
            boost,
        ),
        dish(
            "dk-sl-pink",
            "slush",
            "Pink",
            "Strawberry, mango and agave.",
            "Rich in antioxidants and vitamins to boost energy and support glowing skin.",
            sm(35, 55),
            boost,
        ),
        dish("dk-w-nat", "water", "Aqua Mineral, natural", "Still mineral water.", "Aqua mineral water, natural.", [("380ml", 32), ("750ml", 52)]),
        dish("dk-w-spk", "water", "Aqua Mineral, sparkling", "Sparkling mineral water.", "Aqua mineral water, sparkling.", [("380ml", 32), ("750ml", 57)]),
        dish("dk-w-rain", "water", "Bali Rain soda", "500ml.", "Bali Rain soda, 500ml.", [("500ml", 54)]),
        dish("dk-k-peach", "kombucha", "Peach", "Sugar-free, 330ml.", "Sourboucha sugar-free kombucha, peach, 330ml.", one(77)),
        dish("dk-k-lych", "kombucha", "Lychee", "Sugar-free, 330ml.", "Sourboucha sugar-free kombucha, lychee, 330ml.", one(77)),
        dish(
            "dk-k-dig",
            "kombucha",
            "Digestive Wellness",
            "Sugar-free, 330ml.",
            "Sourboucha sugar-free kombucha, digestive wellness, 330ml.",
            one(77),
        ),
        dish("dk-k-gin", "kombucha", "Ginger", "Sugar-free, 330ml.", "Sourboucha sugar-free kombucha, ginger, 330ml.", one(77)),
        dish("dk-b-pil", "beer", "Island Brewing Pilsner", "330ml.", "Island Brewing Pilsner, 330ml.", one(84)),
        dish("dk-b-pale", "beer", "Island Brewing Summer Pale Ale", "330ml.", "Island Brewing Summer Pale Ale, 330ml.", one(95)),
        dish("dk-b-bin", "beer", "Bintang", "330ml.", "Bintang, 330ml.", one(55)),
        dish("dk-b-cry", "beer", "Bintang Crystal", "330ml.", "Bintang Crystal, 330ml.", one(60)),
        dish("dk-ck-mar", "cocktails", "Classic Margarita", "Classic margarita.", "Classic margarita.", one(165)),
        dish(
            "dk-ck-blu",
            "cocktails",
            "Blue Margarita",
            "Butterfly pea and blue spirulina.",
            "Butterfly pea and blue spirulina coloured margarita.",
            one(165),
        ),
        dish("dk-ck-moj", "cocktails", "Mojito", "Mojito.", "Mojito.", one(110)),
        dish(
            "dk-ck-pbm",
            "cocktails",
            "Pineapple Basil Mojito",
            "Pineapple, lime, basil, mint and soda.",
            "Bacardi, fresh pineapple juice, lime, basil and mint, topped with soda.",
            one(120),
        ),
        dish("dk-ck-cuba", "cocktails", "Cuba Libre", "Cuba libre.", "Cuba libre.", one(125)),
        dish(
            "dk-ck-why",
            "cocktails",
            "Whisky Sour",
            "Whisky, egg white and Angustara bitter.",
            "Whisky, egg white and Angustara bitter.",
            one(115),
        ),
        dish("dk-ck-cos", "cocktails", "Cosmopolitan", "Cosmopolitan.", "Cosmopolitan.", one(120)),
        dish("dk-ck-esp", "cocktails", "Espresso Martini", "Espresso martini.", "Espresso martini.", one(110)),
        dish("dk-ck-fman", "cocktails", "Frozen Mango Margarita", "Frozen mango margarita.", "Frozen mango margarita.", one(165)),
        dish(
            "dk-ck-fstr",
            "cocktails",
            "Frozen Strawberry Martini",
            "Strawberry slushie, lime and Bacardi.",
            "Strawberry slushie with lime juice and Bacardi.",
            one(115),
        ),
        dish(
            "dk-wn-sang",
            "wine",
            "Remole Sangiovese Toscana",
            "Italy, 2022.",
            "Remole Sangiovese Toscana, Italy, 2022.",
            [("Glass", 219), ("Bottle", 889)],
        ),
        dish(
            "dk-wn-bian",
            "wine",
            "Remole Bianco Trebbiano",
            "Italy, 2024.",
            "Remole Bianco Trebbiano, Italy, 2024.",
            [("Glass", 219), ("Bottle", 889)],
        ),
        dish(
            "dk-wn-cal",
            "wine",
            "Calvet Baerdaux",
            "France, 2023.",
            "Calvet Baerdaux, France, 2023.",
            [("Glass", 255), ("Bottle", 989)],
        ),
        dish(
            "dk-wn-tala",
            "wine",
            "Talamonti Trebbiano",
            "Italy, 2019.",
            "Talamonti Trebbiano, Italy, 2019.",
            [("Glass", 179), ("Bottle", 759)],
        ),
    ]

    groups = [
        group("d-serve", "Serve", "one", [opt("hot", "Hot"), opt("cold", "Cold")]),
        group("d-warm", "Serve", "one", [opt("warm", "Warm"), opt("cold", "Cold")]),
        group(
            "d-milk",
            "Milk",
            "one",
            [
                opt("cows", "Cow's milk"),
                opt("oat", "Oat milk"),
                opt("almond", "Home-made almond milk"),
            ],
        ),
        group(
            "d-coffee-extra",
            "Add-ons",
            "many",
            [
                opt("decaf", "Decaf", 15),
                opt("xshot-m", "Extra shot, medium", 35),
                opt("xshot-l", "Extra shot, large", 52),
                opt("alt-milk", "Almond or oat milk", 15),
            ],
        ),
        group("d-alt-milk", "Milk", "many", [opt("alt-milk", "Almond or oat milk", 15)]),
        group(
            "d-healthy",
            "Healthy +",
            "many",
            [
                opt("lavender", "Lavender", 15),
                opt("honey", "Raw mountain honey", 20),
                opt("agave", "Agave syrup", 20),
                opt("collagen", "Collagen", 10, "Collagen 5g, protein 4.67g"),
            ],
        ),
        group(
            "d-boost",
            "Add-ons",
            "many",
            [
                opt("protein", "Protein powder", 25, "Protein 25g"),
                opt("creatine", "Creatine", 15, "Creatine 5g"),
                opt("collagen", "Collagen", 10, "Collagen 5g, protein 4.67g"),
            ],
        ),
    ]

    sizes = [
        {"label": "Small", "note": "", "family": "drink", "cat": "drink"},
        {"label": "Medium", "note": "", "family": "drink", "cat": "drink"},
        {"label": "Large", "note": "", "family": "drink", "cat": "drink"},
    ]
    return sections, dishes, groups, sizes


def is_drink(obj):
    return obj.get("cat") == "drink" or obj.get("family") == "drink" or obj.get("id") == "drinks" or obj.get("sec") == "drinks"


def apply_catalog(menu, sections, dishes, groups, sizes):
    drink_ids = {s["id"] for s in sections} | {"drinks"}
    menu["sizes"] = [s for s in menu.get("sizes", []) if not is_drink(s)]
    menu["sizes"].extend(sizes)

    kept_sections = [s for s in menu.get("sections", []) if not is_drink(s) and s.get("id") not in drink_ids]
    play_at = next((i for i, s in enumerate(kept_sections) if s.get("id") == "play"), len(kept_sections))
    kept_sections[play_at:play_at] = sections
    menu["sections"] = kept_sections

    menu["groups"] = [g for g in menu.get("groups", []) if not is_drink(g)]
    menu["groups"].extend(groups)

    menu["dishes"] = [
        d for d in menu.get("dishes", []) if not is_drink(d) and d.get("sec") not in drink_ids
    ]
    menu["dishes"].extend(dishes)
    return menu


def validate(menu, sections, dishes, groups):
    sec_ids = [s["id"] for s in menu["sections"]]
    if len(sec_ids) != len(set(sec_ids)):
        raise SystemExit("Duplicate section ids")
    dish_ids = [d["id"] for d in menu["dishes"]]
    if len(dish_ids) != len(set(dish_ids)):
        raise SystemExit("Duplicate dish ids")
    group_ids = {g["id"] for g in menu["groups"]}
    known_secs = set(sec_ids)
    for d in dishes:
        if d["sec"] not in known_secs:
            raise SystemExit(f"Missing section for {d['id']}")
        for gid in d["groups"]:
            if gid not in group_ids:
                raise SystemExit(f"Missing group {gid} on {d['id']}")
    food = [d for d in menu["dishes"] if d.get("cat") != "drink"]
    print(f"seed dishes: {len(food)} food/special, {len(dishes)} drinks, {len(sections)} drink sections, {len(groups)} drink groups")


def write_seed():
    raw = SEED.read_bytes()
    newline = "\r\n" if b"\r\n" in raw[:400] else "\n"
    menu = json.loads(raw.decode("utf-8"))
    food_before = sum(1 for d in menu["dishes"] if d.get("cat") != "drink" and d.get("sec") != "drinks")
    sections, dishes, groups, sizes = build_catalog()
    apply_catalog(menu, sections, dishes, groups, sizes)
    food_after = sum(1 for d in menu["dishes"] if d.get("cat") != "drink")
    if food_before != food_after:
        raise SystemExit(f"Food dish count changed {food_before} -> {food_after}")
    validate(menu, sections, dishes, groups)
    text = json.dumps(menu, ensure_ascii=False, indent=2) + "\n"
    if newline == "\r\n":
        text = text.replace("\n", "\r\n")
    SEED.write_bytes(text.encode("utf-8"))
    print(f"wrote {SEED}")
    return menu


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


def copy_images():
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    copied = {}
    for filename, token in PHOTO_TOKENS.items():
        src = find_asset(token)
        dest = IMG_DIR / filename
        with open(long_path(src), "rb") as handle:
            data = handle.read()
        dest.write_bytes(data)
        copied[filename] = dest
        print(f"copied {filename} ({len(data)} bytes)")
    return copied


def load_env():
    env = {}
    path = ROOT / ".env.local"
    for line in path.read_text(encoding="utf-8").splitlines():
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
        url = f"{base}/storage/v1/object/menu-images/drinks/{filename}"
        data = path.read_bytes()
        req = urllib.request.Request(
            url,
            data=data,
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


def merge_payload(payload):
    sections, dishes, groups, sizes = build_catalog()
    apply_catalog(payload, sections, dishes, groups, sizes)
    return payload


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
        with urllib.request.urlopen(req, timeout=120) as res:
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
                "note": "Drink menu",
            },
        )
        print("inserted live snapshot from seed")
        return

    for row in rows:
        payload = merge_payload(row["payload"])
        food = sum(1 for d in payload["dishes"] if d.get("cat") != "drink")
        drinks = sum(1 for d in payload["dishes"] if d.get("cat") == "drink")
        supabase_json(
            env,
            "PATCH",
            f"/rest/v1/menu_snapshots?id=eq.{row['id']}",
            {
                "payload": payload,
                "note": "Drink menu",
                "updated_at": now,
                **({"published_at": now} if row["status"] == "live" else {}),
            },
        )
        print(f"updated {row['status']} snapshot: {food} food/special dishes, {drinks} drinks")


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
