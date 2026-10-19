/** Staff Master → Menu Data (draft edit + publish). */

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

function fmtPrice(p) {
  if (p == null || p === "") return "Ask us";
  const n = Number(p);
  if (!Number.isFinite(n)) return "Ask us";
  return n >= 1000 ? `Rp ${n / 1000} mln` : `Rp ${n}k`;
}

function diffCount(a, b) {
  try {
    return JSON.stringify(a) === JSON.stringify(b) ? 0 : 1;
  } catch (_) {
    return 1;
  }
}

export function createMenuDataController({ supabase, setStatus }) {
  const state = {
    draft: null,
    live: null,
    draftId: null,
    liveId: null,
    liveVersion: 1,
    tab: "items",
    query: "",
    filter: "all",
    editId: null,
  };

  async function load() {
    const { data, error } = await supabase
      .from("menu_snapshots")
      .select("id, status, version, payload, published_at, note, updated_at")
      .in("status", ["draft", "live"]);
    if (error) throw error;
    const rows = data || [];
    const draft = rows.find((r) => r.status === "draft");
    const live = rows.find((r) => r.status === "live");
    if (!draft && !live) throw new Error("No menu snapshots yet. Run the menu migration/seed first.");
    state.draft = deepClone(draft?.payload || live.payload);
    state.live = deepClone(live?.payload || draft.payload);
    state.draftId = draft?.id || null;
    state.liveId = live?.id || null;
    state.liveVersion = live?.version || 1;
    state.editId = null;
  }

  function dishes() {
    return state.draft?.dishes || [];
  }

  function filteredDishes() {
    const q = state.query.trim().toLowerCase();
    return dishes().filter((d) => {
      if (state.filter === "kids") return (d.sizes || []).some((s) => s.l === "Tiny");
      if (state.filter !== "all" && d.sec !== state.filter) return false;
      if (!q) return true;
      return [d.name, d.short, d.desc, d.id].join(" ").toLowerCase().includes(q);
    });
  }

  function renderTabs() {
    const tabs = [
      ["items", "Items"],
      ["sections", "Sections"],
      ["options", "Options"],
      ["publish", "Publish"],
    ];
    return tabs
      .map(
        ([id, label]) =>
          `<button type="button" class="dm-admin-tab${state.tab === id ? " is-active" : ""}" data-menu-tab="${id}">${label}</button>`
      )
      .join("");
  }

  function renderItems() {
    const sections = state.draft?.sections || [];
    const filters = [
      ["all", "All"],
      ...sections.filter((s) => !s.fixed).map((s) => [s.id, s.name]),
      ["kids", "Kids sizes"],
    ];
    const rows = filteredDishes()
      .map((d) => {
        const price = (d.sizes || []).map((s) => `${s.l} ${fmtPrice(s.p)}`).join(" · ");
        const flags = [d.hidden ? "Hidden" : "", d.soldOut ? "Sold out" : ""].filter(Boolean).join(" · ");
        return `<button type="button" class="dm-admin-row" data-edit-dish="${esc(d.id)}">
          <strong>${esc(d.name)}</strong>
          <span class="muted">${esc(d.sec)}${d.sub ? ` / ${esc(d.sub)}` : ""} · ${esc(price)}${
          flags ? ` · ${esc(flags)}` : ""
        }</span>
        </button>`;
      })
      .join("");

    const edit = state.editId ? dishes().find((d) => d.id === state.editId) : null;
    const editor = edit
      ? `<div class="dm-admin-editor">
          <div class="master-panel__head">
            <h3>${esc(edit.name)}</h3>
            <button type="button" class="btn btn--outline" data-close-dish>Close</button>
          </div>
          <label class="field"><span>Name</span><input data-dish-field="name" value="${esc(edit.name)}"></label>
          <label class="field"><span>Short</span><input data-dish-field="short" value="${esc(edit.short || "")}"></label>
          <label class="field"><span>Description</span><textarea data-dish-field="desc" rows="3">${esc(
            edit.desc || ""
          )}</textarea></label>
          <label class="field"><span>Image path</span><input data-dish-field="img" value="${esc(
            edit.img || ""
          )}" placeholder="img/dishes/id.jpg"></label>
          <label class="field"><span>Section id</span><input data-dish-field="sec" value="${esc(edit.sec || "")}"></label>
          <label class="field"><span>Subcategory</span><input data-dish-field="sub" value="${esc(edit.sub || "")}"></label>
          <label class="field"><span>Tags (comma)</span><input data-dish-field="tags" value="${esc(
            (edit.tags || []).join(", ")
          )}"></label>
          <label class="field"><span>Sizes JSON</span><textarea data-dish-field="sizesJson" rows="3">${esc(
            JSON.stringify(edit.sizes || [])
          )}</textarea></label>
          <label class="field"><span>Groups (comma ids)</span><input data-dish-field="groups" value="${esc(
            (edit.groups || []).join(", ")
          )}"></label>
          <label class="check"><input type="checkbox" data-dish-flag="hidden" ${
            edit.hidden ? "checked" : ""
          }> Hidden</label>
          <label class="check"><input type="checkbox" data-dish-flag="soldOut" ${
            edit.soldOut ? "checked" : ""
          }> Sold out today</label>
          <button type="button" class="btn" data-save-dish>Save item</button>
        </div>`
      : "";

    return `<div class="dm-admin-toolbar">
        <input type="search" id="menu-data-query" placeholder="Search dishes" value="${esc(state.query)}">
        <div class="dm-admin-filters">${filters
          .map(
            ([id, label]) =>
              `<button type="button" class="dm-admin-chip${state.filter === id ? " is-active" : ""}" data-menu-filter="${esc(
                id
              )}">${esc(label)}</button>`
          )
          .join("")}</div>
      </div>
      <div class="dm-admin-list">${rows || `<p class="muted">No dishes match.</p>`}</div>
      ${editor}`;
  }

  function renderSections() {
    return (state.draft?.sections || [])
      .map((s) => {
        return `<div class="dm-admin-card" data-section-id="${esc(s.id)}">
          <strong>${esc(s.name)}</strong>
          <label class="check"><input type="checkbox" data-sec-field="visible" ${
            s.visible !== false ? "checked" : ""
          }> Visible</label>
          <label class="field"><span>Layout</span>
            <select data-sec-field="layout">
              ${["cards", "list", "prices"]
                .map((l) => `<option value="${l}" ${s.layout === l ? "selected" : ""}>${l}</option>`)
                .join("")}
            </select>
          </label>
          <label class="field"><span>Intro</span><input data-sec-field="intro" value="${esc(s.intro || "")}"></label>
          <label class="field"><span>Subs (comma)</span><input data-sec-field="subs" value="${esc(
            (s.subs || []).join(", ")
          )}"></label>
        </div>`;
      })
      .join("");
  }

  function renderOptions() {
    return (state.draft?.groups || [])
      .map((g) => {
        return `<div class="dm-admin-card" data-group-id="${esc(g.id)}">
          <strong>${esc(g.name)}</strong> <span class="muted">(${esc(g.type)})</span>
          <label class="field"><span>Options JSON</span>
            <textarea data-group-opts rows="5">${esc(JSON.stringify(g.opts || [], null, 2))}</textarea>
          </label>
          <button type="button" class="btn btn--outline" data-save-group>Save options</button>
        </div>`;
      })
      .join("");
  }

  function renderPublish() {
    const changed = diffCount(state.draft, state.live);
    const note = state.draft?.settings?.listNote || "";
    const baseUrl = state.draft?.settings?.baseUrl || "";
    return `<div class="dm-admin-card">
      <p>Live version: <strong>v${state.liveVersion}</strong></p>
      <p class="muted">${changed ? "Draft has unpublished changes." : "Draft matches live."}</p>
      <label class="field"><span>Guest list note</span>
        <input id="menu-list-note" value="${esc(note)}">
      </label>
      <label class="field"><span>Base URL</span>
        <input id="menu-base-url" value="${esc(baseUrl)}">
      </label>
      <div class="contact-actions">
        <button type="button" class="btn" id="menu-save-draft">Save draft</button>
        <button type="button" class="btn btn--outline" id="menu-publish" ${changed ? "" : "disabled"}>Publish to live</button>
      </div>
    </div>`;
  }

  function render() {
    const root = document.getElementById("menu-data-root");
    if (!root) return;
    root.innerHTML = `
      <div class="dm-admin-tabs">${renderTabs()}</div>
      <div class="dm-admin-body">
        ${
          state.tab === "items"
            ? renderItems()
            : state.tab === "sections"
              ? renderSections()
              : state.tab === "options"
                ? renderOptions()
                : renderPublish()
        }
      </div>`;
  }

  async function saveDraft(note) {
    if (!state.draft) return;
    if (!state.draft.settings) state.draft.settings = {};
    const listNote = document.getElementById("menu-list-note");
    const baseUrl = document.getElementById("menu-base-url");
    if (listNote) state.draft.settings.listNote = listNote.value.trim();
    if (baseUrl) state.draft.settings.baseUrl = baseUrl.value.trim();

    const payload = {
      status: "draft",
      version: state.liveVersion,
      payload: state.draft,
      note: note || "Staff edit",
      updated_at: new Date().toISOString(),
      published_at: null,
    };
    if (state.draftId) {
      const { error } = await supabase.from("menu_snapshots").update(payload).eq("id", state.draftId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("menu_snapshots").insert(payload).select("id").single();
      if (error) throw error;
      state.draftId = data.id;
    }
  }

  async function publish() {
    await saveDraft("Published");
    const nextVersion = (state.liveVersion || 1) + 1;
    const livePayload = {
      status: "live",
      version: nextVersion,
      payload: state.draft,
      note: "Published from staff Menu Data",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (state.liveId) {
      const { error } = await supabase.from("menu_snapshots").update(livePayload).eq("id", state.liveId);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("menu_snapshots").insert(livePayload).select("id").single();
      if (error) throw error;
      state.liveId = data.id;
    }
    state.live = deepClone(state.draft);
    state.liveVersion = nextVersion;
  }

  function bind(root) {
    root.addEventListener("click", async (e) => {
      const tab = e.target.closest("[data-menu-tab]");
      if (tab) {
        state.tab = tab.getAttribute("data-menu-tab");
        render();
        return;
      }
      const filter = e.target.closest("[data-menu-filter]");
      if (filter) {
        state.filter = filter.getAttribute("data-menu-filter");
        render();
        return;
      }
      const edit = e.target.closest("[data-edit-dish]");
      if (edit) {
        state.editId = edit.getAttribute("data-edit-dish");
        render();
        return;
      }
      if (e.target.closest("[data-close-dish]")) {
        state.editId = null;
        render();
        return;
      }
      if (e.target.closest("[data-save-dish]")) {
        const dish = dishes().find((d) => d.id === state.editId);
        if (!dish) return;
        const editor = root.querySelector(".dm-admin-editor");
        dish.name = editor.querySelector('[data-dish-field="name"]').value.trim();
        dish.short = editor.querySelector('[data-dish-field="short"]').value.trim();
        dish.desc = editor.querySelector('[data-dish-field="desc"]').value.trim();
        dish.img = editor.querySelector('[data-dish-field="img"]').value.trim();
        dish.sec = editor.querySelector('[data-dish-field="sec"]').value.trim();
        dish.sub = editor.querySelector('[data-dish-field="sub"]').value.trim();
        dish.tags = editor
          .querySelector('[data-dish-field="tags"]')
          .value.split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        dish.groups = editor
          .querySelector('[data-dish-field="groups"]')
          .value.split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        try {
          dish.sizes = JSON.parse(editor.querySelector('[data-dish-field="sizesJson"]').value);
        } catch (_) {
          setStatus("menu-data-status", "Sizes must be valid JSON.", "is-error");
          return;
        }
        dish.hidden = editor.querySelector('[data-dish-flag="hidden"]').checked;
        dish.soldOut = editor.querySelector('[data-dish-flag="soldOut"]').checked;
        try {
          await saveDraft();
          setStatus("menu-data-status", "Item saved to draft.", "is-success");
          state.editId = null;
          render();
        } catch (err) {
          setStatus("menu-data-status", err.message || "Save failed.", "is-error");
        }
        return;
      }
      if (e.target.closest("[data-save-group]")) {
        const card = e.target.closest("[data-group-id]");
        const gid = card?.getAttribute("data-group-id");
        const group = (state.draft.groups || []).find((g) => g.id === gid);
        if (!group) return;
        try {
          group.opts = JSON.parse(card.querySelector("[data-group-opts]").value);
          await saveDraft();
          setStatus("menu-data-status", "Options saved to draft.", "is-success");
        } catch (err) {
          setStatus("menu-data-status", err.message || "Invalid options JSON.", "is-error");
        }
        return;
      }
      if (e.target.closest("#menu-save-draft")) {
        try {
          await saveDraft();
          setStatus("menu-data-status", "Draft saved.", "is-success");
          render();
        } catch (err) {
          setStatus("menu-data-status", err.message || "Could not save draft.", "is-error");
        }
        return;
      }
      if (e.target.closest("#menu-publish")) {
        try {
          await publish();
          setStatus("menu-data-status", `Published live v${state.liveVersion}.`, "is-success");
          render();
        } catch (err) {
          setStatus("menu-data-status", err.message || "Publish failed.", "is-error");
        }
      }
    });

    root.addEventListener("input", (e) => {
      if (e.target.id === "menu-data-query") {
        state.query = e.target.value || "";
        // re-render list only
        const list = root.querySelector(".dm-admin-list");
        if (list) {
          const tmp = document.createElement("div");
          state.tab = "items";
          // cheap: full render
          render();
        }
        return;
      }
      const secCard = e.target.closest("[data-section-id]");
      if (secCard && e.target.matches("[data-sec-field]")) {
        const sid = secCard.getAttribute("data-section-id");
        const sec = (state.draft.sections || []).find((s) => s.id === sid);
        if (!sec) return;
        const field = e.target.getAttribute("data-sec-field");
        if (field === "visible") sec.visible = e.target.checked;
        else if (field === "layout") sec.layout = e.target.value;
        else if (field === "intro") sec.intro = e.target.value;
        else if (field === "subs")
          sec.subs = e.target.value
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean);
      }
    });

    root.addEventListener("change", async (e) => {
      if (e.target.closest("[data-section-id]")) {
        try {
          await saveDraft();
          setStatus("menu-data-status", "Section updated in draft.", "is-success");
        } catch (err) {
          setStatus("menu-data-status", err.message || "Could not save section.", "is-error");
        }
      }
    });
  }

  let bound = false;

  async function renderMenuData() {
    setStatus("menu-data-status", "Loading menu…");
    await load();
    render();
    const root = document.getElementById("menu-data-root");
    if (root && !bound) {
      bind(root);
      bound = true;
    }
    setStatus("menu-data-status", `Draft ready · live v${state.liveVersion}`);
  }

  return { renderMenuData };
}
