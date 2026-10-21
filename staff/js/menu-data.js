/** Staff Master → Menu Desk (live updates, hub sections, image upload). */

function deepClone(v) {
  return JSON.parse(JSON.stringify(v));
}

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const DIET_TAGS = ["GF", "VG", "V", "DF", "NF"];
const MENU_BUCKET = "menu-images";

export function createMenuDataController({ supabase, setStatus }) {
  const state = {
    menu: null,
    liveId: null,
    liveVersion: 1,
    tab: "",
    query: "",
    filter: "all",
    catFilter: "all",
    editId: null,
  };

  let bound = false;
  let drawerBound = false;
  let loaded = false;
  let saveTimer = null;

  async function loadSeedPayload() {
    const url = new URL("../menu/data/menu-seed.json", location.href).href;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Could not load menu seed file.");
    return res.json();
  }

  function ensureMenus(payload) {
    if (!payload.settings) payload.settings = {};
    if (!Array.isArray(payload.settings.menus) || !payload.settings.menus.length) {
      payload.settings.menus = [
        { id: "food", name: "Food Menu" },
        { id: "drink", name: "Drink Menu" },
        { id: "special", name: "Special Menu" },
      ];
    }
    return payload;
  }

  function entityCat(obj, fallback = "food") {
    return obj?.cat || obj?.family || fallback;
  }

  /** Backfill cat/family on dishes, sections, groups, sizes. Returns true if anything changed. */
  function normalizeCategories(payload) {
    ensureMenus(payload);
    let changed = false;
    const secCat = Object.fromEntries(
      (payload.sections || []).map((s) => {
        const next = entityCat(s, "food");
        if (s.family !== next || s.cat !== next) {
          s.family = next;
          s.cat = next;
          changed = true;
        }
        return [s.id, next];
      })
    );
    for (const d of payload.dishes || []) {
      const next = d.cat || secCat[d.sec] || "food";
      if (d.cat !== next) {
        d.cat = next;
        changed = true;
      }
    }
    for (const g of payload.groups || []) {
      const next = entityCat(g, "food");
      if (g.family !== next || g.cat !== next) {
        g.family = next;
        g.cat = next;
        changed = true;
      }
    }
    for (const s of payload.sizes || []) {
      const next = entityCat(s, "food");
      if (s.family !== next || s.cat !== next) {
        s.family = next;
        s.cat = next;
        changed = true;
      }
    }
    return changed;
  }

  function catFilterChips() {
    const cats = categories();
    return `<div class="dm-admin-filters dm-admin-filters--cats" role="tablist" aria-label="Category">
      <button type="button" class="dm-admin-chip${state.catFilter === "all" ? " is-active" : ""}" data-cat-filter="all">All categories</button>
      ${cats
        .map(
          (c) =>
            `<button type="button" class="dm-admin-chip${state.catFilter === c.id ? " is-active" : ""}" data-cat-filter="${esc(
              c.id
            )}">${esc(c.name)}</button>`
        )
        .join("")}
    </div>`;
  }

  function dishCat(d) {
    if (d?.cat) return d.cat;
    const sec = (state.menu?.sections || []).find((s) => s.id === d?.sec);
    return entityCat(sec, "food");
  }

  async function load() {
    const { data, error } = await supabase
      .from("menu_snapshots")
      .select("id, status, version, payload, published_at, note, updated_at")
      .in("status", ["live", "draft"]);
    if (error) {
      throw new Error(
        error.message.includes("menu_snapshots") || error.code === "42P01" || error.code === "PGRST205"
          ? "Menu table missing. Run scripts/deploy-supabase.ps1 (migration 20261019180000_menu_snapshots)."
          : error.message
      );
    }
    const rows = data || [];
    let live = rows.find((r) => r.status === "live");
    const draft = rows.find((r) => r.status === "draft");
    if (!live && draft) {
      // Promote existing draft to live (publish tab removed).
      const { error: upErr } = await supabase
        .from("menu_snapshots")
        .update({
          status: "live",
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          note: "Promoted draft to live",
        })
        .eq("id", draft.id);
      if (upErr) throw upErr;
      live = { ...draft, status: "live" };
    }
    if (!live) {
      const seed = ensureMenus(await loadSeedPayload());
      const { data: inserted, error: insertErr } = await supabase
        .from("menu_snapshots")
        .insert({
          status: "live",
          version: 1,
          payload: seed,
          published_at: new Date().toISOString(),
          note: "Seeded from menu-seed.json",
        })
        .select("id, status, version, payload, published_at, note, updated_at")
        .single();
      if (insertErr) throw insertErr;
      live = inserted;
    }
    state.menu = ensureMenus(deepClone(live.payload));
    state.liveId = live.id;
    state.liveVersion = live.version || 1;
    state.editId = null;
    if (normalizeCategories(state.menu)) {
      await saveLive("Backfill categories (food / drink / special)");
    }
  }

  function dishes() {
    return state.menu?.dishes || [];
  }

  function filteredDishes() {
    const q = state.query.trim().toLowerCase();
    return dishes().filter((d) => {
      if (state.catFilter !== "all" && dishCat(d) !== state.catFilter) return false;
      if (state.filter === "kids") return (d.sizes || []).some((s) => s.l === "Tiny");
      if (state.filter !== "all" && d.sec !== state.filter) return false;
      if (!q) return true;
      return [d.name, d.short, d.desc, d.id].join(" ").toLowerCase().includes(q);
    });
  }

  function sectionLabel(secId) {
    const s = (state.menu?.sections || []).find((x) => x.id === secId);
    return s?.name || secId || "—";
  }

  function categories() {
    return state.menu?.settings?.menus || [];
  }

  function menuPublicUrl(path) {
    if (!path) return "";
    const { data } = supabase.storage.from(MENU_BUCKET).getPublicUrl(path);
    return data?.publicUrl || "";
  }

  function imgSrc(path) {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:") || path.startsWith("/")) return path;
    if (path.startsWith("dishes/") || path.startsWith("menu/")) return menuPublicUrl(path);
    return `../menu/${path.replace(/^\.?\/?/, "")}`;
  }

  function storagePathFromImg(img) {
    if (!img || typeof img !== "string") return "";
    const marker = `/object/public/${MENU_BUCKET}/`;
    const i = img.indexOf(marker);
    if (i >= 0) return img.slice(i + marker.length);
    if (img.startsWith("dishes/")) return img;
    return "";
  }

  function imgThumb(d) {
    const src = imgSrc(d.img || "");
    if (!src) return `<span class="dm-desk-thumb dm-desk-thumb--empty"><span>PHOTO</span></span>`;
    const fit = d.fit === "contain" ? "object-fit:contain" : "object-fit:cover";
    return `<span class="dm-desk-thumb"><img src="${esc(src)}" alt="" loading="lazy" style="${fit}"></span>`;
  }

  function toggleHtml(on, attrs) {
    return `<button type="button" class="dm-switch${on ? " is-on" : ""}" ${attrs} aria-pressed="${on}"><span class="dm-switch__knob"></span></button>`;
  }

  async function saveLive(note) {
    if (!state.menu) return;
    const payload = {
      status: "live",
      version: state.liveVersion || 1,
      payload: state.menu,
      note: note || "Staff edit",
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
    };
    if (state.liveId) {
      const { error } = await supabase.from("menu_snapshots").update(payload).eq("id", state.liveId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("menu_snapshots").insert(payload).select("id").single();
      if (error) throw error;
      state.liveId = data.id;
    }
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      try {
        await saveLive();
        setStatus("menu-data-status", "Saved · live on /menu/", "is-success");
      } catch (err) {
        setStatus("menu-data-status", err.message || "Could not save.", "is-error");
      }
    }, 450);
  }

  const CROP_RATIO = 5 / 4;
  const OUTPUT_W = 1000;
  const OUTPUT_H = 800;
  const cropState = {
    bitmap: null,
    zoom: 1,
    x: 0,
    y: 0,
    frameW: 0,
    frameH: 0,
    drag: null,
    pinch: null,
    pointers: new Map(),
    busy: false,
  };
  let cropBound = false;

  function bitmapSize(bitmap) {
    return {
      w: bitmap.naturalWidth || bitmap.width,
      h: bitmap.naturalHeight || bitmap.height,
    };
  }

  function formatPhotoSize(bytes) {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function readBitmap(file) {
    const type = String(file?.type || "");
    const name = String(file?.name || "");
    if (type && !type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|bmp|avif|heic|heif)$/i.test(name)) {
      throw new Error("Choose a picture file.");
    }
    try {
      if (typeof createImageBitmap === "function") {
        return await createImageBitmap(file, { imageOrientation: "from-image" });
      }
    } catch (_) {
      /* Fall back to an image element for formats the bitmap decoder rejects. */
    }
    const url = URL.createObjectURL(file);
    try {
      return await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not read that picture. Try a JPG or PNG."));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function imageScale() {
    const { w, h } = bitmapSize(cropState.bitmap);
    const cover = Math.max(cropState.frameW / w, cropState.frameH / h);
    return cover * cropState.zoom;
  }

  function clampCropOffsets() {
    const { w, h } = bitmapSize(cropState.bitmap);
    const scale = imageScale();
    const minX = cropState.frameW - w * scale;
    const minY = cropState.frameH - h * scale;
    cropState.x = Math.min(0, Math.max(minX, cropState.x));
    cropState.y = Math.min(0, Math.max(minY, cropState.y));
  }

  function sourceRect() {
    const { w, h } = bitmapSize(cropState.bitmap);
    const scale = imageScale();
    let sx = -cropState.x / scale;
    let sy = -cropState.y / scale;
    let sw = cropState.frameW / scale;
    let sh = cropState.frameH / scale;
    sx = Math.max(0, sx);
    sy = Math.max(0, sy);
    if (sx + sw > w) sw = w - sx;
    if (sy + sh > h) sh = h - sy;
    return { sx, sy, sw, sh };
  }

  function drawCrop(ctx, dw, dh) {
    const { sx, sy, sw, sh } = sourceRect();
    ctx.fillStyle = "#fbf6eb";
    ctx.fillRect(0, 0, dw, dh);
    ctx.drawImage(cropState.bitmap, sx, sy, sw, sh, 0, 0, dw, dh);
  }

  function layoutCrop() {
    const stage = document.getElementById("menu-photo-crop-stage");
    const width = Math.max(240, stage?.clientWidth || 360);
    cropState.frameW = width;
    cropState.frameH = Math.round(width / CROP_RATIO);
    if (stage) stage.style.height = `${cropState.frameH}px`;
  }

  function paintCrop() {
    const canvas = document.getElementById("menu-photo-crop-canvas");
    const preview = document.getElementById("menu-photo-crop-preview");
    if (!canvas || !preview || !cropState.bitmap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cropState.frameW * dpr);
    canvas.height = Math.round(cropState.frameH * dpr);
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCrop(ctx, cropState.frameW, cropState.frameH);
    preview.width = 250;
    preview.height = 200;
    drawCrop(preview.getContext("2d"), 250, 200);
  }

  function setCropZoom(next, anchorX, anchorY) {
    if (!cropState.bitmap) return;
    const prevScale = imageScale();
    const ax = anchorX ?? cropState.frameW / 2;
    const ay = anchorY ?? cropState.frameH / 2;
    const ix = (ax - cropState.x) / prevScale;
    const iy = (ay - cropState.y) / prevScale;
    cropState.zoom = Math.min(4, Math.max(1, next));
    const nextScale = imageScale();
    cropState.x = ax - ix * nextScale;
    cropState.y = ay - iy * nextScale;
    clampCropOffsets();
    const slider = document.getElementById("menu-photo-crop-zoom");
    if (slider) slider.value = String(cropState.zoom);
    paintCrop();
  }

  function centerCrop() {
    const { w, h } = bitmapSize(cropState.bitmap);
    const scale = imageScale();
    cropState.x = (cropState.frameW - w * scale) / 2;
    cropState.y = (cropState.frameH - h * scale) / 2;
    clampCropOffsets();
  }

  function closeCrop() {
    const modal = document.getElementById("menu-photo-crop");
    if (modal) modal.hidden = true;
    if (cropState.bitmap?.close) cropState.bitmap.close();
    cropState.bitmap = null;
    cropState.drag = null;
    cropState.pinch = null;
    cropState.pointers.clear();
    cropState.busy = false;
    const status = document.getElementById("menu-photo-crop-status");
    if (status) {
      status.textContent = "";
      status.className = "status";
    }
    const saveBtn = document.querySelector("[data-crop-save]");
    if (saveBtn) saveBtn.disabled = false;
    document.getElementById("menu-photo-crop-stage")?.classList.remove("is-dragging");
  }

  async function openCrop(file) {
    const bitmap = await readBitmap(file);
    const size = bitmapSize(bitmap);
    if (!size.w || !size.h) throw new Error("Could not read that picture. Try a JPG or PNG.");
    closeCrop();
    cropState.bitmap = bitmap;
    cropState.zoom = 1;
    const modal = document.getElementById("menu-photo-crop");
    if (!modal) throw new Error("Crop tool is missing from the page.");
    modal.hidden = false;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    layoutCrop();
    centerCrop();
    const slider = document.getElementById("menu-photo-crop-zoom");
    if (slider) slider.value = "1";
    paintCrop();
  }

  function canvasToJpeg(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Could not compress the picture."))),
        "image/jpeg",
        quality
      );
    });
  }

  async function exportCroppedFile() {
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_W;
    canvas.height = OUTPUT_H;
    drawCrop(canvas.getContext("2d"), OUTPUT_W, OUTPUT_H);
    let quality = 0.82;
    let blob = await canvasToJpeg(canvas, quality);
    const target = 380 * 1024;
    while (blob.size > target && quality > 0.52) {
      quality = Math.round((quality - 0.08) * 100) / 100;
      blob = await canvasToJpeg(canvas, quality);
    }
    if (blob.size > 1024 * 1024) {
      canvas.width = 800;
      canvas.height = 640;
      drawCrop(canvas.getContext("2d"), 800, 640);
      blob = await canvasToJpeg(canvas, 0.72);
    }
    return new File([blob], "dish.jpg", { type: "image/jpeg" });
  }

  async function commitCrop() {
    if (cropState.busy || !cropState.bitmap) return;
    const dish = editingDish();
    const status = document.getElementById("menu-photo-crop-status");
    const saveBtn = document.querySelector("[data-crop-save]");
    if (!dish) {
      if (status) {
        status.textContent = "Open a menu item before saving the photo.";
        status.className = "status is-error";
      }
      return;
    }
    cropState.busy = true;
    if (saveBtn) saveBtn.disabled = true;
    try {
      if (status) {
        status.textContent = "Compressing photo…";
        status.className = "status";
      }
      const file = await exportCroppedFile();
      if (status) status.textContent = "Uploading photo…";
      const prev = dish.img;
      dish.img = await uploadDishImage(dish.id, file);
      if (prev && prev !== dish.img) await removeStoredImage(prev);
      closeCrop();
      fillDrawer();
      scheduleSave();
      setStatus("menu-data-status", `Photo uploaded · ${formatPhotoSize(file.size)}`, "is-success");
    } catch (err) {
      cropState.busy = false;
      if (saveBtn) saveBtn.disabled = false;
      if (status) {
        status.textContent = err.message || "Upload failed.";
        status.className = "status is-error";
      }
      setStatus("menu-data-status", err.message || "Upload failed.", "is-error");
    }
  }

  function bindCrop() {
    if (cropBound) return;
    const modal = document.getElementById("menu-photo-crop");
    const stage = document.getElementById("menu-photo-crop-stage");
    if (!modal || !stage) return;
    cropBound = true;

    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target.closest("[data-crop-cancel]")) {
        closeCrop();
        return;
      }
      if (e.target.closest("[data-crop-save]")) commitCrop();
    });

    document.getElementById("menu-photo-crop-zoom")?.addEventListener("input", (e) => {
      setCropZoom(Number(e.target.value));
    });

    stage.addEventListener("pointerdown", (e) => {
      if (!cropState.bitmap) return;
      try {
        stage.setPointerCapture(e.pointerId);
      } catch (_) {
        /* Synthetic events and some browsers cannot capture the pointer. */
      }
      cropState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (cropState.pointers.size >= 2) {
        const [a, b] = [...cropState.pointers.values()];
        cropState.pinch = { dist: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom: cropState.zoom };
        cropState.drag = null;
      } else {
        cropState.drag = { x: e.clientX, y: e.clientY, ox: cropState.x, oy: cropState.y };
        stage.classList.add("is-dragging");
      }
    });

    stage.addEventListener("pointermove", (e) => {
      if (!cropState.pointers.has(e.pointerId)) return;
      cropState.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (cropState.pointers.size >= 2 && cropState.pinch) {
        const [a, b] = [...cropState.pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        setCropZoom(cropState.pinch.zoom * (dist / cropState.pinch.dist));
        return;
      }
      if (!cropState.drag) return;
      cropState.x = cropState.drag.ox + (e.clientX - cropState.drag.x);
      cropState.y = cropState.drag.oy + (e.clientY - cropState.drag.y);
      clampCropOffsets();
      paintCrop();
    });

    const endPointer = (e) => {
      cropState.pointers.delete(e.pointerId);
      if (cropState.pointers.size < 2) cropState.pinch = null;
      if (cropState.pointers.size === 0) {
        cropState.drag = null;
        stage.classList.remove("is-dragging");
      } else if (cropState.pointers.size === 1) {
        const point = [...cropState.pointers.values()][0];
        cropState.drag = { x: point.x, y: point.y, ox: cropState.x, oy: cropState.y };
      }
    };
    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);

    stage.addEventListener(
      "wheel",
      (e) => {
        if (!cropState.bitmap) return;
        e.preventDefault();
        const rect = stage.getBoundingClientRect();
        const factor = e.deltaY < 0 ? 1.06 : 0.94;
        setCropZoom(cropState.zoom * factor, e.clientX - rect.left, e.clientY - rect.top);
      },
      { passive: false }
    );

    window.addEventListener("resize", () => {
      if (modal.hidden || !cropState.bitmap) return;
      const prev = sourceRect();
      layoutCrop();
      const scale = imageScale();
      cropState.x = cropState.frameW / 2 - (prev.sx + prev.sw / 2) * scale;
      cropState.y = cropState.frameH / 2 - (prev.sy + prev.sh / 2) * scale;
      clampCropOffsets();
      paintCrop();
    });

    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key !== "Escape" || modal.hidden) return;
        e.preventDefault();
        e.stopPropagation();
        closeCrop();
      },
      true
    );

    document.addEventListener("change", async (e) => {
      const fileInput = e.target.closest?.("[data-drawer-upload]");
      if (!fileInput || !fileInput.files?.[0]) return;
      const file = fileInput.files[0];
      fileInput.value = "";
      const photoStatus = document.getElementById("menu-photo-status");
      const showPhotoStatus = (message, kind) => {
        if (photoStatus) {
          photoStatus.textContent = message || "";
          photoStatus.className = kind ? `status ${kind}` : "status";
        }
      };
      try {
        showPhotoStatus("Preparing photo…");
        await openCrop(file);
        showPhotoStatus("");
      } catch (err) {
        showPhotoStatus(err.message || "Could not open that picture.", "is-error");
      }
    });
  }

  function pictureType(file) {
    const type = String(file?.type || "").toLowerCase();
    if (type === "image/jpg" || type === "image/pjpeg") return "image/jpeg";
    if (type === "image/jpeg" || type === "image/png" || type === "image/webp") return type;
    const ext = String(file?.name || "").split(".").pop().toLowerCase();
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "png") return "image/png";
    if (ext === "webp") return "image/webp";
    return "";
  }

  async function uploadDishImage(dishId, file) {
    const contentType = pictureType(file);
    if (!contentType) throw new Error("Use a JPG, PNG or WebP picture.");
    const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : "jpg";
    const safeId = String(dishId || "dish").replace(/[^a-zA-Z0-9_-]/g, "") || "dish";
    const path = `dishes/${safeId}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(MENU_BUCKET).upload(path, file, {
      upsert: false,
      contentType,
    });
    if (error) {
      const message = error.message || "Upload failed.";
      if (/bucket not found/i.test(message)) {
        throw new Error("Picture storage is not set up yet. Run the menu-images migration.");
      }
      throw new Error(message);
    }
    return menuPublicUrl(path);
  }

  async function removeStoredImage(img) {
    const path = storagePathFromImg(img);
    if (!path) return;
    try {
      await supabase.storage.from(MENU_BUCKET).remove([path]);
    } catch (_) {
      /* best effort */
    }
  }

  function renderHub() {
    const nItems = dishes().length;
    const nSec = (state.menu?.sections || []).filter((s) => !s.fixed).length;
    const nGroups = (state.menu?.groups || []).length;
    const nCats = categories().length;
    return `<div class="dm-desk-head dm-desk-head--page">
        <div>
          <h2 class="dm-desk-title">Menu Desk</h2>
          <p class="muted">Changes save straight to the guest menu.</p>
        </div>
      </div>
      <div class="master-home dm-menu-hub">
        <button class="master-choice" type="button" data-menu-go="items">
          <strong>Menu items</strong>
          <span>${nItems} dishes · edit photos, prices and options</span>
        </button>
        <button class="master-choice" type="button" data-menu-go="sections">
          <strong>Sections</strong>
          <span>${nSec} tabs guests see on the menu</span>
        </button>
        <button class="master-choice" type="button" data-menu-go="options">
          <strong>Sizes &amp; options</strong>
          <span>${nGroups} customise groups and portion presets</span>
        </button>
        <button class="master-choice" type="button" data-menu-go="categories">
          <strong>Categories</strong>
          <span>${nCats} top menus · Food, Drink, Special</span>
        </button>
      </div>`;
  }

  function renderItems() {
    const sections = (state.menu?.sections || []).filter((s) => {
      if (s.fixed || s.id === "play") return false;
      if (state.catFilter !== "all" && entityCat(s) !== state.catFilter) return false;
      return true;
    });
    const filters = [
      ["all", "All sections"],
      ...sections.map((s) => [s.id, s.name]),
      ["kids", "Kids sizes"],
    ];
    const list = filteredDishes();
    const catName = (id) => categories().find((c) => c.id === id)?.name || id;
    const rows = list
      .map((d) => {
        const price = (d.sizes || []).map((s) => `${s.l} ${s.p == null || s.p === "" ? "—" : s.p}`).join(" · ") || "—";
        const customise = (d.groups || []).length ? `<span class="dm-desk-badge">CUSTOMISE</span>` : "";
        const sold = d.soldOut ? `<span class="dm-desk-badge dm-desk-badge--sold">SOLD OUT</span>` : "";
        const onMenu = !d.hidden;
        const cat = dishCat(d);
        return `<div class="dm-desk-row${state.editId === d.id ? " is-editing" : ""}" data-row-dish="${esc(d.id)}">
          <div class="dm-desk-cell dm-desk-cell--item">
            ${imgThumb(d)}
            <div class="dm-desk-item-text">
              <div class="dm-desk-name">${esc(d.name)}${customise}${sold}</div>
              <div class="dm-desk-desc">${esc(d.short || d.desc || "")}</div>
            </div>
          </div>
          <div class="dm-desk-cell dm-desk-cell--sec">${esc(catName(cat))} · ${esc(sectionLabel(d.sec))}${
          d.sub ? ` · ${esc(d.sub)}` : ""
        }</div>
          <div class="dm-desk-cell dm-desk-cell--price">${esc(price)}</div>
          <div class="dm-desk-cell dm-desk-cell--on">
            ${toggleHtml(onMenu, `data-toggle-on="${esc(d.id)}" title="On menu"`)}
          </div>
          <div class="dm-desk-cell dm-desk-cell--act">
            <button type="button" class="dm-desk-edit" data-edit-dish="${esc(d.id)}">Edit</button>
          </div>
        </div>`;
      })
      .join("");

    const kidsNote =
      state.filter === "kids"
        ? `<div class="dm-desk-note">Kids is filled automatically: every item with a Tiny size shows here, plus Kids’ own items.</div>`
        : "";

    return `<div class="dm-desk-head">
        <div>
          <h2 class="dm-desk-title">Menu items</h2>
          <p class="muted">${list.length} of ${dishes().length} items · click a row to edit</p>
        </div>
        <div class="dm-desk-head__tools">
          <input type="search" id="menu-data-query" placeholder="Search dishes" value="${esc(state.query)}">
          <button type="button" class="btn" data-new-dish>+ New item</button>
        </div>
      </div>
      ${catFilterChips()}
      <div class="dm-admin-filters">${filters
        .map(
          ([id, label]) =>
            `<button type="button" class="dm-admin-chip${state.filter === id ? " is-active" : ""}" data-menu-filter="${esc(
              id
            )}">${esc(label)}</button>`
        )
        .join("")}</div>
      ${kidsNote}
      <div class="dm-desk-table" role="table">
        <div class="dm-desk-row dm-desk-row--head" role="row">
          <div class="dm-desk-cell">Item</div>
          <div class="dm-desk-cell">Category · Section</div>
          <div class="dm-desk-cell">Price ('000)</div>
          <div class="dm-desk-cell">On menu</div>
          <div class="dm-desk-cell"></div>
        </div>
        ${rows || `<p class="muted" style="padding:1rem">No dishes match.</p>`}
      </div>`;
  }

  function renderSections() {
    const allSections = state.menu?.sections || [];
    const sections = allSections.filter((s) => {
      if (state.catFilter !== "all" && entityCat(s) !== state.catFilter) return false;
      return true;
    });
    const cats = categories();
    const cards = sections
      .map((s, idx) => {
        const absIdx = allSections.findIndex((x) => x.id === s.id);
        const count = dishes().filter(
          (d) => d.sec === s.id || (s.auto && (d.sizes || []).some((x) => x.l === "Tiny"))
        ).length;
        const subs = (s.subs || [])
          .map(
            (sub) =>
              `<span class="dm-chip-tag">${esc(sub)}<button type="button" data-sec-remove-sub="${esc(
                s.id
              )}" data-sub="${esc(sub)}" aria-label="Remove">✕</button></span>`
          )
          .join("");
        const layout =
          s.layout === "prices"
            ? `<span class="dm-pill-note">Price table</span>`
            : `<select data-sec-field="layout" data-section-id="${esc(s.id)}">
                <option value="cards" ${s.layout === "cards" ? "selected" : ""}>Photo cards</option>
                <option value="list" ${s.layout === "list" ? "selected" : ""}>Compact list</option>
              </select>`;
        const family = entityCat(s);
        return `<div class="dm-sec-card${s.visible === false ? " is-off" : ""}" data-section-id="${esc(s.id)}">
          <div class="dm-sec-card__top">
            <div class="dm-sec-card__move">
              <button type="button" data-sec-move="up" data-section-id="${esc(s.id)}" ${
          absIdx <= 0 ? "disabled" : ""
        } aria-label="Move up">↑</button>
              <button type="button" data-sec-move="down" data-section-id="${esc(s.id)}" ${
          absIdx < 0 || absIdx >= allSections.length - 1 ? "disabled" : ""
        } aria-label="Move down">↓</button>
            </div>
            <input class="dm-sec-card__name" data-sec-field="name" data-section-id="${esc(s.id)}" value="${esc(
          s.name
        )}">
            ${layout}
            <select data-sec-field="family" data-section-id="${esc(s.id)}" title="Category">
              ${cats
                .map(
                  (c) =>
                    `<option value="${esc(c.id)}" ${c.id === family ? "selected" : ""}>${esc(c.name)}</option>`
                )
                .join("")}
            </select>
            <span class="muted dm-sec-card__count">${count} item${count === 1 ? "" : "s"}</span>
            <label class="dm-sec-card__on">On menu ${toggleHtml(s.visible !== false, `data-sec-toggle="${esc(
              s.id
            )}"`)}</label>
          </div>
          <input class="dm-sec-card__intro" data-sec-field="intro" data-section-id="${esc(
            s.id
          )}" placeholder="Intro line under the tabs (optional)" value="${esc(s.intro || "")}">
          ${
            s.fixed
              ? ""
              : `<div class="dm-sec-card__subs">${subs}<input class="dm-sec-card__add-sub" data-sec-add-sub="${esc(
                  s.id
                )}" placeholder="+ Sub-section, Enter"></div>`
          }
        </div>`;
      })
      .join("");

    return `<div class="dm-desk-head">
        <div>
          <h2 class="dm-desk-title">Sections</h2>
          <p class="muted">The tabs guests see, in this order. Sub-sections become the second row of chips.</p>
        </div>
        <button type="button" class="btn" data-add-section>+ Section</button>
      </div>
      ${catFilterChips()}
      <div class="dm-sec-list">${cards || `<p class="muted">No sections in this category.</p>`}</div>`;
  }

  function renderOptions() {
    const cats = categories();
    const sizeRows = (state.menu?.sizes || [])
      .map((s, i) => {
        if (state.catFilter !== "all" && entityCat(s) !== state.catFilter) return "";
        return `<div class="dm-size-row">
          <input data-preset-size="${i}" data-field="label" value="${esc(s.label || "")}" placeholder="Label">
          <input data-preset-size="${i}" data-field="note" value="${esc(s.note || "")}" placeholder="Note">
          <select data-preset-size="${i}" data-field="family" title="Category">
            ${cats
              .map(
                (c) =>
                  `<option value="${esc(c.id)}" ${c.id === entityCat(s) ? "selected" : ""}>${esc(c.name)}</option>`
              )
              .join("")}
          </select>
        </div>`;
      })
      .join("");

    const groups = (state.menu?.groups || [])
      .filter((g) => state.catFilter === "all" || entityCat(g) === state.catFilter)
      .map((g) => {
        const used = dishes().filter((d) => (d.groups || []).includes(g.id)).length;
        const opts = (g.opts || [])
          .map((o, oi) => {
            const media = o.img
              ? `<img src="${esc(imgSrc(o.img))}" alt="">`
              : `<span style="background:${esc(o.dot || "#dcd2be")}"></span>`;
            return `<div class="dm-opt-row${o.off ? " is-off" : ""}" data-group-id="${esc(g.id)}" data-opt-i="${oi}">
              <span class="dm-opt-row__swatch">${media}</span>
              <input data-opt-field="l" value="${esc(o.l || "")}">
              <input data-opt-field="p" value="${o.p == null ? "" : esc(o.p)}" placeholder="+0">
              ${toggleHtml(!o.off, `data-opt-toggle="${esc(g.id)}" data-opt-i="${oi}"`)}
              <button type="button" data-opt-remove="${esc(g.id)}" data-opt-i="${oi}" aria-label="Remove">✕</button>
            </div>`;
          })
          .join("");
        return `<div class="dm-group-card" data-group-id="${esc(g.id)}">
          <div class="dm-group-card__head">
            <input data-group-field="name" value="${esc(g.name)}">
            <select data-group-field="family" title="Category">
              ${cats
                .map(
                  (c) =>
                    `<option value="${esc(c.id)}" ${c.id === entityCat(g) ? "selected" : ""}>${esc(c.name)}</option>`
                )
                .join("")}
            </select>
            <button type="button" class="dm-group-type" data-group-type="${esc(g.id)}">${
          g.type === "many" ? "Add-ons" : "Pick one"
        }</button>
          </div>
          <p class="muted">Used on ${used} item${used === 1 ? "" : "s"}</p>
          ${opts}
          <input class="dm-group-add" data-group-add="${esc(g.id)}" placeholder="+ Add option, Enter">
        </div>`;
      })
      .join("");

    return `<div class="dm-desk-head">
        <div>
          <h2 class="dm-desk-title">Sizes &amp; options</h2>
          <p class="muted">Presets you attach to items. Change an option here and every item using it updates.</p>
        </div>
      </div>
      ${catFilterChips()}
      <div class="dm-options-block">
        <div class="dm-options-card">
          <div class="dm-options-label">Portion size presets</div>
          ${sizeRows || `<p class="muted">No presets in this category.</p>`}
          <p class="muted" style="margin:0.5rem 0 0">Any item with a “Tiny” size is listed in Kids automatically.</p>
        </div>
        <div class="dm-options-groups-head">
          <span class="dm-options-label">Customise groups</span>
          <button type="button" class="btn" data-add-group>+ New group</button>
        </div>
        <div class="dm-group-grid">${groups || `<p class="muted">No groups in this category.</p>`}</div>
      </div>`;
  }

  function renderCategories() {
    const cats = categories();
    const cards = cats
      .map((c, idx) => {
        const n = (state.menu?.sections || []).filter((s) => entityCat(s) === c.id && !s.fixed).length;
        return `<div class="dm-cat-card" data-cat-id="${esc(c.id)}">
          <div class="dm-cat-card__top">
            <div class="dm-sec-card__move">
              <button type="button" data-cat-move="up" data-cat-id="${esc(c.id)}" ${
          idx === 0 ? "disabled" : ""
        } aria-label="Move up">↑</button>
              <button type="button" data-cat-move="down" data-cat-id="${esc(c.id)}" ${
          idx === cats.length - 1 ? "disabled" : ""
        } aria-label="Move down">↓</button>
            </div>
            <input class="dm-sec-card__name" data-cat-field="name" data-cat-id="${esc(c.id)}" value="${esc(
          c.name
        )}">
            <span class="muted">${n} section${n === 1 ? "" : "s"}</span>
            <button type="button" class="btn btn--text" data-cat-delete="${esc(c.id)}">Delete</button>
          </div>
          <p class="muted" style="margin:0">Id: <code>${esc(c.id)}</code> · used by sections on the guest Food / Drink / Special switcher</p>
        </div>`;
      })
      .join("");

    return `<div class="dm-desk-head">
        <div>
          <h2 class="dm-desk-title">Categories</h2>
          <p class="muted">Top menus guests switch between. Assign sections to a category under Sections.</p>
        </div>
        <button type="button" class="btn" data-add-category>+ Category</button>
      </div>
      <div class="dm-sec-list">${cards || `<p class="muted">No categories yet.</p>`}</div>`;
  }

  function render() {
    const root = document.getElementById("menu-data-root");
    if (!root) return;
    if (!state.tab) root.innerHTML = renderHub();
    else if (state.tab === "items") root.innerHTML = renderItems();
    else if (state.tab === "sections") root.innerHTML = renderSections();
    else if (state.tab === "options") root.innerHTML = renderOptions();
    else if (state.tab === "categories") root.innerHTML = renderCategories();
    else root.innerHTML = renderHub();
  }

  function editingDish() {
    return dishes().find((d) => d.id === state.editId) || null;
  }

  function fillDrawer() {
    const drawer = document.getElementById("menu-item-drawer");
    const body = document.getElementById("menu-item-drawer-body");
    const title = document.getElementById("menu-item-drawer-title");
    if (!drawer || !body) return;
    const dish = editingDish();
    if (!dish) {
      drawer.hidden = true;
      return;
    }
    drawer.hidden = false;
    if (title) title.textContent = dish.name || "Edit item";

    const dishCategory = dishCat(dish);
    const sections = (state.menu?.sections || []).filter((s) => {
      if (s.fixed && s.id !== dish.sec) return false;
      return entityCat(s) === dishCategory || s.id === dish.sec;
    });
    const sec = sections.find((s) => s.id === dish.sec);
    const subOpts = ["", ...((sec && sec.subs) || [])];
    const src = imgSrc(dish.img || "");
    const sizes = (dish.sizes || [])
      .map(
        (z, i) => `<div class="dm-drawer-size" data-size-i="${i}">
          <input data-drawer-size-l value="${esc(z.l || "")}">
          <input data-drawer-size-p value="${z.p == null ? "" : esc(z.p)}" placeholder="Ask us">
          <button type="button" data-drawer-size-remove="${i}" aria-label="Remove">✕</button>
        </div>`
      )
      .join("");
    const sizeAdds = (state.menu?.sizes || [])
      .filter((p) => entityCat(p) === dishCategory)
      .map((p) => p.label)
      .filter((l) => l && !(dish.sizes || []).some((z) => z.l === l))
      .map((l) => `<button type="button" class="dm-dash-chip" data-drawer-add-size="${esc(l)}">+ ${esc(l)}</button>`)
      .join("");
    const tags = DIET_TAGS.map((t) => {
      const on = (dish.tags || []).includes(t);
      return `<button type="button" class="dm-tag-chip${on ? " is-on" : ""}" data-drawer-tag="${t}">${t}</button>`;
    }).join("");
    const groups = (state.menu?.groups || [])
      .filter((g) => entityCat(g) === dishCategory || (dish.groups || []).includes(g.id))
      .map((g) => {
        const on = (dish.groups || []).includes(g.id);
        return `<button type="button" class="dm-tag-chip${on ? " is-on" : ""}" data-drawer-group="${esc(
          g.id
        )}">${esc(g.name)}</button>`;
      })
      .join("");
    const catOpts = categories()
      .map(
        (c) =>
          `<option value="${esc(c.id)}" ${c.id === dishCategory ? "selected" : ""}>${esc(c.name)}</option>`
      )
      .join("");

    body.innerHTML = `
      <div class="dm-drawer-photo">
        <div class="dm-drawer-photo__frame">${
          src
            ? `<img src="${esc(src)}" alt="" style="object-fit:${dish.fit === "contain" ? "contain" : "cover"}">`
            : `<span class="dm-drawer-photo__empty">No photo yet</span>`
        }</div>
        <div class="dm-drawer-photo__actions">
          <span class="btn dm-file-btn">Upload photo<input type="file" accept="image/*" data-drawer-upload aria-label="Upload photo"></span>
          ${
            src
              ? `<button type="button" class="btn btn--outline" data-drawer-fit>${
                  dish.fit === "contain" ? "Fit: contain" : "Fit: cover"
                }</button><button type="button" class="btn btn--text" data-drawer-remove-img>Remove</button>`
              : ""
          }
        </div>
        <p class="status" id="menu-photo-status" role="status"></p>
        <p class="muted">Choose a photo, crop it to the menu card, then save. Large pictures are compressed to a small JPG.</p>
      </div>
      <label class="field"><span>Name</span><input data-drawer-field="name" value="${esc(dish.name || "")}"></label>
      <label class="field"><span>Card line</span><input data-drawer-field="short" value="${esc(
        dish.short || ""
      )}"></label>
      <label class="field"><span>Description · pop-up</span><textarea data-drawer-field="desc" rows="4">${esc(
        dish.desc || ""
      )}</textarea></label>
      <label class="field"><span>Category</span>
        <select data-drawer-field="cat">${catOpts}</select>
      </label>
      <div class="field-row">
        <label class="field"><span>Section</span>
          <select data-drawer-field="sec">${sections
            .map((s) => `<option value="${esc(s.id)}" ${s.id === dish.sec ? "selected" : ""}>${esc(s.name)}</option>`)
            .join("")}</select>
        </label>
        <label class="field"><span>Sub-section</span>
          <select data-drawer-field="sub">${subOpts
            .map(
              (sub) =>
                `<option value="${esc(sub)}" ${sub === (dish.sub || "") ? "selected" : ""}>${esc(
                  sub || "—"
                )}</option>`
            )
            .join("")}</select>
        </label>
      </div>
      <div class="dm-drawer-block">
        <span class="dm-drawer-label">Dietary</span>
        <div class="dm-chip-row">${tags}</div>
      </div>
      <div class="dm-drawer-block">
        <span class="dm-drawer-label">Sizes &amp; prices · ’000 IDR</span>
        ${sizes}
        <div class="dm-chip-row">${sizeAdds}<button type="button" class="dm-dash-chip" data-drawer-add-size="">+ Custom</button></div>
        <p class="muted">Items with a Tiny size also appear under Kids.</p>
      </div>
      <div class="dm-drawer-block">
        <span class="dm-drawer-label">Customise in pop-up</span>
        <div class="dm-chip-row">${groups || `<span class="muted">No groups yet — add some under Sizes &amp; options.</span>`}</div>
      </div>
      <div class="dm-drawer-flags">
        <div class="dm-drawer-flag"><span>Show on menu</span>${toggleHtml(!dish.hidden, `data-drawer-flag="hidden"`)}</div>
        <div class="dm-drawer-flag"><span>Sold out today</span>${toggleHtml(!!dish.soldOut, `data-drawer-flag="soldOut"`)}</div>
      </div>`;
  }

  async function closeItemDrawer({ save = true } = {}) {
    if (save && state.editId) {
      try {
        clearTimeout(saveTimer);
        await saveLive();
        setStatus("menu-data-status", "Saved · live on /menu/", "is-success");
      } catch (err) {
        setStatus("menu-data-status", err.message || "Could not save.", "is-error");
      }
    }
    closeCrop();
    state.editId = null;
    const drawer = document.getElementById("menu-item-drawer");
    if (drawer) drawer.hidden = true;
    render();
  }

  function openItem(id) {
    state.editId = id;
    state.tab = "items";
    fillDrawer();
    render();
  }

  function bindDrawer() {
    if (drawerBound) return;
    drawerBound = true;
    const drawer = document.getElementById("menu-item-drawer");
    if (!drawer) return;

    drawer.addEventListener("click", async (e) => {
      if (e.target.closest("[data-menu-drawer-close]") || e.target.closest("[data-menu-drawer-done]")) {
        await closeItemDrawer({ save: true });
        return;
      }
      if (e.target.closest("[data-menu-drawer-delete]")) {
        const dish = editingDish();
        if (!dish) return;
        if (!confirm(`Delete “${dish.name}”?`)) return;
        await removeStoredImage(dish.img);
        state.menu.dishes = dishes().filter((d) => d.id !== dish.id);
        closeCrop();
        state.editId = null;
        drawer.hidden = true;
        scheduleSave();
        render();
        return;
      }
      const dish = editingDish();
      if (!dish) return;

      if (e.target.closest("[data-drawer-fit]")) {
        dish.fit = dish.fit === "contain" ? "cover" : "contain";
        fillDrawer();
        scheduleSave();
        return;
      }
      if (e.target.closest("[data-drawer-remove-img]")) {
        await removeStoredImage(dish.img);
        dish.img = "";
        fillDrawer();
        scheduleSave();
        return;
      }
      const tag = e.target.closest("[data-drawer-tag]");
      if (tag) {
        const t = tag.getAttribute("data-drawer-tag");
        const cur = new Set(dish.tags || []);
        if (cur.has(t)) cur.delete(t);
        else cur.add(t);
        dish.tags = [...cur];
        fillDrawer();
        scheduleSave();
        return;
      }
      const grp = e.target.closest("[data-drawer-group]");
      if (grp) {
        const gid = grp.getAttribute("data-drawer-group");
        const cur = new Set(dish.groups || []);
        if (cur.has(gid)) cur.delete(gid);
        else cur.add(gid);
        dish.groups = [...cur];
        fillDrawer();
        scheduleSave();
        return;
      }
      const addSize = e.target.closest("[data-drawer-add-size]");
      if (addSize) {
        const label = addSize.getAttribute("data-drawer-add-size") || "Custom";
        if (!dish.sizes) dish.sizes = [];
        dish.sizes.push({ l: label || "Custom", p: null });
        fillDrawer();
        scheduleSave();
        return;
      }
      const remSize = e.target.closest("[data-drawer-size-remove]");
      if (remSize) {
        const i = Number(remSize.getAttribute("data-drawer-size-remove"));
        dish.sizes.splice(i, 1);
        fillDrawer();
        scheduleSave();
        return;
      }
      const flag = e.target.closest("[data-drawer-flag]");
      if (flag) {
        const f = flag.getAttribute("data-drawer-flag");
        if (f === "hidden") dish.hidden = !dish.hidden;
        if (f === "soldOut") dish.soldOut = !dish.soldOut;
        fillDrawer();
        scheduleSave();
      }
    });

    bindCrop();

    drawer.addEventListener("change", async (e) => {
      if (e.target.closest("[data-drawer-upload]")) return;
      const dish = editingDish();
      if (!dish) return;
      const field = e.target.closest("[data-drawer-field]");
      if (field) {
        const key = field.getAttribute("data-drawer-field");
        dish[key] = field.value;
        if (key === "cat") {
          const firstSec = (state.menu?.sections || []).find(
            (s) => !s.fixed && entityCat(s) === dish.cat
          );
          if (firstSec) {
            dish.sec = firstSec.id;
            dish.sub = firstSec.subs?.[0] || "";
          } else {
            dish.sub = "";
          }
          fillDrawer();
        } else if (key === "sec") {
          dish.sub = "";
          const sec = (state.menu?.sections || []).find((s) => s.id === dish.sec);
          if (sec) dish.cat = entityCat(sec);
          fillDrawer();
        } else if (key === "name") {
          const t = document.getElementById("menu-item-drawer-title");
          if (t) t.textContent = dish.name || "Edit item";
        }
        scheduleSave();
      }
    });

    drawer.addEventListener("input", (e) => {
      const dish = editingDish();
      if (!dish) return;
      const sizeRow = e.target.closest("[data-size-i]");
      if (sizeRow) {
        const i = Number(sizeRow.getAttribute("data-size-i"));
        if (!dish.sizes[i]) return;
        if (e.target.matches("[data-drawer-size-l]")) dish.sizes[i].l = e.target.value;
        if (e.target.matches("[data-drawer-size-p]")) {
          const v = e.target.value.trim();
          dish.sizes[i].p = v === "" ? null : Number(v);
        }
        scheduleSave();
        return;
      }
      const field = e.target.closest("[data-drawer-field]");
      if (field && field.tagName !== "SELECT") {
        const key = field.getAttribute("data-drawer-field");
        dish[key] = field.value;
        if (key === "name") {
          const t = document.getElementById("menu-item-drawer-title");
          if (t) t.textContent = dish.name || "Edit item";
        }
        scheduleSave();
      }
    });
  }

  function bind(root) {
    root.addEventListener("click", async (e) => {
      const goTab = e.target.closest("[data-menu-go]");
      if (goTab) {
        location.hash = `#/master/menu/${goTab.getAttribute("data-menu-go")}`;
        return;
      }

      const catFilter = e.target.closest("[data-cat-filter]");
      if (catFilter) {
        state.catFilter = catFilter.getAttribute("data-cat-filter") || "all";
        state.filter = "all";
        render();
        return;
      }
      const filter = e.target.closest("[data-menu-filter]");
      if (filter) {
        state.filter = filter.getAttribute("data-menu-filter");
        render();
        return;
      }
      const toggleOn = e.target.closest("[data-toggle-on]");
      if (toggleOn) {
        e.stopPropagation();
        const id = toggleOn.getAttribute("data-toggle-on");
        const dish = dishes().find((d) => d.id === id);
        if (!dish) return;
        dish.hidden = !dish.hidden;
        scheduleSave();
        render();
        return;
      }
      if (e.target.closest("[data-new-dish]")) {
        const id = `dish_${Date.now().toString(36)}`;
        const cat =
          state.catFilter !== "all" ? state.catFilter : categories()[0]?.id || "food";
        const secId =
          state.filter !== "all" && state.filter !== "kids"
            ? state.filter
            : (state.menu?.sections || []).find((s) => !s.fixed && entityCat(s) === cat)?.id ||
              (state.menu?.sections || []).find((s) => !s.fixed)?.id ||
              "breakfast";
        const sec = (state.menu?.sections || []).find((s) => s.id === secId);
        const dish = {
          id,
          name: "New item",
          short: "",
          desc: "",
          img: "",
          fit: "cover",
          cat: entityCat(sec, cat),
          sec: secId,
          sub: sec?.subs?.[0] || "",
          tags: [],
          sizes: [{ l: "Adult", p: null }],
          groups: [],
          hidden: false,
          soldOut: false,
        };
        if (!state.menu.dishes) state.menu.dishes = [];
        state.menu.dishes.unshift(dish);
        state.query = "";
        openItem(id);
        scheduleSave();
        return;
      }
      const edit = e.target.closest("[data-edit-dish]");
      if (edit) {
        e.stopPropagation();
        openItem(edit.getAttribute("data-edit-dish"));
        return;
      }
      const row = e.target.closest("[data-row-dish]");
      if (row && !e.target.closest("[data-toggle-on]")) {
        openItem(row.getAttribute("data-row-dish"));
        return;
      }

      const move = e.target.closest("[data-sec-move]");
      if (move) {
        const id = move.getAttribute("data-section-id");
        const dir = move.getAttribute("data-sec-move");
        const list = state.menu.sections;
        const i = list.findIndex((s) => s.id === id);
        const j = dir === "up" ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= list.length) return;
        const [rowSec] = list.splice(i, 1);
        list.splice(j, 0, rowSec);
        scheduleSave();
        render();
        return;
      }
      const secToggle = e.target.closest("[data-sec-toggle]");
      if (secToggle) {
        const sec = (state.menu.sections || []).find((s) => s.id === secToggle.getAttribute("data-sec-toggle"));
        if (!sec) return;
        sec.visible = !(sec.visible !== false);
        scheduleSave();
        render();
        return;
      }
      const remSub = e.target.closest("[data-sec-remove-sub]");
      if (remSub) {
        const sec = (state.menu.sections || []).find((s) => s.id === remSub.getAttribute("data-sec-remove-sub"));
        const sub = remSub.getAttribute("data-sub");
        if (!sec) return;
        sec.subs = (sec.subs || []).filter((x) => x !== sub);
        scheduleSave();
        render();
        return;
      }
      if (e.target.closest("[data-add-section]")) {
        const id = `s_${Date.now().toString(36)}`;
        const list = state.menu.sections || [];
        const playIdx = list.findIndex((s) => s.id === "play");
        const cat = state.catFilter !== "all" ? state.catFilter : categories()[0]?.id || "food";
        const rowSec = {
          id,
          name: "New section",
          layout: "cards",
          visible: false,
          intro: "",
          subs: [],
          family: cat,
          cat,
        };
        if (playIdx >= 0) list.splice(playIdx, 0, rowSec);
        else list.push(rowSec);
        scheduleSave();
        render();
        return;
      }

      if (e.target.closest("[data-add-group]")) {
        if (!state.menu.groups) state.menu.groups = [];
        const cat = state.catFilter !== "all" ? state.catFilter : categories()[0]?.id || "food";
        state.menu.groups.push({
          id: `g_${Date.now().toString(36)}`,
          name: "New group",
          type: "one",
          opts: [],
          family: cat,
          cat,
        });
        scheduleSave();
        render();
        return;
      }
      const typeBtn = e.target.closest("[data-group-type]");
      if (typeBtn) {
        const g = (state.menu.groups || []).find((x) => x.id === typeBtn.getAttribute("data-group-type"));
        if (!g) return;
        g.type = g.type === "many" ? "one" : "many";
        scheduleSave();
        render();
        return;
      }
      const optToggle = e.target.closest("[data-opt-toggle]");
      if (optToggle) {
        const g = (state.menu.groups || []).find((x) => x.id === optToggle.getAttribute("data-opt-toggle"));
        const i = Number(optToggle.getAttribute("data-opt-i"));
        if (!g?.opts?.[i]) return;
        g.opts[i].off = !g.opts[i].off;
        scheduleSave();
        render();
        return;
      }
      const optRem = e.target.closest("[data-opt-remove]");
      if (optRem) {
        const g = (state.menu.groups || []).find((x) => x.id === optRem.getAttribute("data-opt-remove"));
        const i = Number(optRem.getAttribute("data-opt-i"));
        if (!g?.opts) return;
        g.opts.splice(i, 1);
        scheduleSave();
        render();
        return;
      }

      /* Categories */
      if (e.target.closest("[data-add-category]")) {
        const id = `cat_${Date.now().toString(36)}`;
        if (!state.menu.settings) state.menu.settings = {};
        if (!state.menu.settings.menus) state.menu.settings.menus = [];
        state.menu.settings.menus.push({ id, name: "New category" });
        scheduleSave();
        render();
        return;
      }
      const catMove = e.target.closest("[data-cat-move]");
      if (catMove) {
        const id = catMove.getAttribute("data-cat-id");
        const dir = catMove.getAttribute("data-cat-move");
        const list = state.menu.settings.menus;
        const i = list.findIndex((c) => c.id === id);
        const j = dir === "up" ? i - 1 : i + 1;
        if (i < 0 || j < 0 || j >= list.length) return;
        const [row] = list.splice(i, 1);
        list.splice(j, 0, row);
        scheduleSave();
        render();
        return;
      }
      const catDel = e.target.closest("[data-cat-delete]");
      if (catDel) {
        const id = catDel.getAttribute("data-cat-delete");
        const used = (state.menu.sections || []).filter((s) => entityCat(s) === id).length;
        if (used && !confirm(`Delete this category? ${used} section(s) use it — they will move to Food.`)) return;
        const fallback = categories().find((c) => c.id !== id)?.id || "food";
        (state.menu.sections || []).forEach((s) => {
          if (entityCat(s) === id) {
            s.family = fallback;
            s.cat = fallback;
          }
        });
        (state.menu.dishes || []).forEach((d) => {
          if (d.cat === id) d.cat = fallback;
        });
        (state.menu.groups || []).forEach((g) => {
          if (entityCat(g) === id) {
            g.family = fallback;
            g.cat = fallback;
          }
        });
        (state.menu.sizes || []).forEach((s) => {
          if (entityCat(s) === id) {
            s.family = fallback;
            s.cat = fallback;
          }
        });
        state.menu.settings.menus = categories().filter((c) => c.id !== id);
        scheduleSave();
        render();
      }
    });

    root.addEventListener("input", (e) => {
      if (e.target.id === "menu-data-query") {
        state.query = e.target.value || "";
        render();
        const q = root.querySelector("#menu-data-query");
        if (q) {
          q.focus();
          const len = q.value.length;
          q.setSelectionRange(len, len);
        }
        return;
      }
      const secField = e.target.closest("[data-sec-field]");
      if (secField) {
        const sid = secField.getAttribute("data-section-id");
        const sec = (state.menu.sections || []).find((s) => s.id === sid);
        if (!sec) return;
        const field = secField.getAttribute("data-sec-field");
        if (field === "name" || field === "intro") sec[field] = secField.value;
        scheduleSave();
        return;
      }
      const catField = e.target.closest("[data-cat-field]");
      if (catField) {
        const cat = categories().find((c) => c.id === catField.getAttribute("data-cat-id"));
        if (!cat) return;
        cat[catField.getAttribute("data-cat-field")] = catField.value;
        scheduleSave();
        return;
      }
      const preset = e.target.closest("[data-preset-size]");
      if (preset) {
        const i = Number(preset.getAttribute("data-preset-size"));
        const field = preset.getAttribute("data-field");
        if (!state.menu.sizes) state.menu.sizes = [];
        if (!state.menu.sizes[i]) state.menu.sizes[i] = { label: "", note: "", family: "food", cat: "food" };
        state.menu.sizes[i][field] = preset.value;
        if (field === "family") state.menu.sizes[i].cat = preset.value;
        scheduleSave();
        return;
      }
      const gName = e.target.closest("[data-group-field]");
      if (gName) {
        const card = gName.closest("[data-group-id]");
        const g = (state.menu.groups || []).find((x) => x.id === card?.getAttribute("data-group-id"));
        if (!g) return;
        const field = gName.getAttribute("data-group-field");
        g[field] = gName.value;
        if (field === "family") g.cat = gName.value;
        scheduleSave();
        return;
      }
      const optField = e.target.closest("[data-opt-field]");
      if (optField) {
        const row = optField.closest("[data-opt-i]");
        const g = (state.menu.groups || []).find((x) => x.id === row?.getAttribute("data-group-id"));
        const i = Number(row?.getAttribute("data-opt-i"));
        if (!g?.opts?.[i]) return;
        const f = optField.getAttribute("data-opt-field");
        if (f === "p") {
          const v = optField.value.trim();
          g.opts[i].p = v === "" ? null : Number(v);
        } else g.opts[i][f] = optField.value;
        scheduleSave();
      }
    });

    root.addEventListener("change", (e) => {
      const secField = e.target.closest("[data-sec-field]");
      if (secField) {
        const field = secField.getAttribute("data-sec-field");
        if (field === "layout" || field === "family") {
          const sid = secField.getAttribute("data-section-id");
          const sec = (state.menu.sections || []).find((s) => s.id === sid);
          if (!sec) return;
          sec[field] = secField.value;
          if (field === "family") sec.cat = secField.value;
          scheduleSave();
          if (field === "family") render();
        }
      }
      const preset = e.target.closest("[data-preset-size]");
      if (preset && preset.getAttribute("data-field") === "family") {
        const i = Number(preset.getAttribute("data-preset-size"));
        if (state.menu.sizes?.[i]) {
          state.menu.sizes[i].family = preset.value;
          state.menu.sizes[i].cat = preset.value;
          scheduleSave();
          render();
        }
        return;
      }
      const gField = e.target.closest("[data-group-field]");
      if (gField && gField.getAttribute("data-group-field") === "family") {
        const card = gField.closest("[data-group-id]");
        const g = (state.menu.groups || []).find((x) => x.id === card?.getAttribute("data-group-id"));
        if (!g) return;
        g.family = gField.value;
        g.cat = gField.value;
        scheduleSave();
        render();
      }
    });

    root.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const addSub = e.target.closest("[data-sec-add-sub]");
      if (addSub) {
        e.preventDefault();
        const sec = (state.menu.sections || []).find((s) => s.id === addSub.getAttribute("data-sec-add-sub"));
        const val = addSub.value.trim();
        if (!sec || !val) return;
        if (!sec.subs) sec.subs = [];
        if (!sec.subs.includes(val)) sec.subs.push(val);
        addSub.value = "";
        scheduleSave();
        render();
        return;
      }
      const addOpt = e.target.closest("[data-group-add]");
      if (addOpt) {
        e.preventDefault();
        const g = (state.menu.groups || []).find((x) => x.id === addOpt.getAttribute("data-group-add"));
        const val = addOpt.value.trim();
        if (!g || !val) return;
        if (!g.opts) g.opts = [];
        g.opts.push({ id: `o_${Date.now().toString(36)}`, l: val, p: null });
        addOpt.value = "";
        scheduleSave();
        render();
      }
    });
  }

  async function renderMenuData(tab) {
    const root = document.getElementById("menu-data-root");
    state.tab = tab || "";
    if (!loaded || !state.menu) {
      setStatus("menu-data-status", "Loading menu…");
      await load();
      loaded = true;
    }
    render();
    if (state.editId && state.tab === "items") fillDrawer();
    else {
      const drawer = document.getElementById("menu-item-drawer");
      if (drawer && state.tab !== "items") {
        drawer.hidden = true;
        state.editId = null;
      }
    }
    if (root && !bound) {
      bind(root);
      bound = true;
    }
    bindDrawer();
    bindCrop();
    setStatus("menu-data-status", state.tab ? "Saved changes go live on /menu/" : "");
  }

  bindCrop();

  return { renderMenuData, closeItemDrawer };
}
