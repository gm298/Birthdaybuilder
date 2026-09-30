"""Render menu/pdf/*.pdf into WebP page images for the menu viewer.

Run after replacing a menu PDF:  python scripts/render-menu-pages.py
Prints the page count and size for each menu so menu/index.html data-pages / data-size can be updated.
Requires: pip install pymupdf pillow
"""

import io
import os
import sys

import pymupdf
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MENUS = {"food": "tiny-food-menu.pdf", "drinks": "tiny-drink-menu.pdf", "nights": "tiny-nights-menu.pdf"}
WIDTH = 1200

pymupdf.TOOLS.mupdf_display_errors(False)

for key, filename in MENUS.items():
    pdf_path = os.path.join(ROOT, "menu", "pdf", filename)
    with open(pdf_path, "rb") as fh:
        if b"%%EOF" not in fh.read()[-2048:]:
            sys.exit(f"{filename} is incomplete (no end-of-file marker). Re-export it before rendering.")

    out_dir = os.path.join(ROOT, "menu", "pages", key)
    os.makedirs(out_dir, exist_ok=True)
    for old in os.listdir(out_dir):
        os.remove(os.path.join(out_dir, old))

    doc = pymupdf.open(pdf_path)
    total = 0
    for number, page in enumerate(doc, 1):
        zoom = WIDTH / page.rect.width
        pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
        image = Image.open(io.BytesIO(pix.tobytes("png")))
        target = os.path.join(out_dir, f"page-{number:02d}.webp")
        image.save(target, "WEBP", quality=78, method=6)
        total += os.path.getsize(target)
    print(f'{key}: data-pages="{doc.page_count}" data-size="{pix.width}x{pix.height}" ({total / 1048576:.1f} MB)')
