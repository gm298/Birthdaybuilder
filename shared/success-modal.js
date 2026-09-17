(() => {
  "use strict";

  const INACTIVE = new Set(["cancelled", "rejected", "closed", "noshow"]);

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensureRoot() {
    let root = document.getElementById("tiny-success-modal");
    if (root) return root;
    root = document.createElement("div");
    root.id = "tiny-success-modal";
    root.className = "tiny-success-modal";
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <button type="button" class="tiny-success-modal__backdrop" data-close aria-label="Close"></button>
      <div class="tiny-success-modal__panel" role="dialog" aria-modal="true" aria-labelledby="tiny-success-title">
        <button type="button" class="tiny-success-modal__x" data-close aria-label="Close">&times;</button>
        <div class="tiny-success-modal__body" id="tiny-success-body"></div>
      </div>
    `;
    document.body.appendChild(root);
    root.addEventListener("click", (event) => {
      if (event.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !root.hidden) close();
    });
    return root;
  }

  function close() {
    const root = document.getElementById("tiny-success-modal");
    if (!root) return;
    root.hidden = true;
    root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("tiny-success-open");
  }

  async function shareLink(url) {
    const title = "Tiny Healthy Cafe booking";
    try {
      if (navigator.share) {
        await navigator.share({ title, url, text: title });
        return "shared";
      }
    } catch (err) {
      if (err && err.name === "AbortError") return "aborted";
    }
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch (_) {
      window.prompt("Copy this link:", url);
      return "prompt";
    }
  }

  function open(options) {
    const opts = options || {};
    const root = ensureRoot();
    const body = root.querySelector("#tiny-success-body");
    const code = opts.code || "";
    const manageToken = opts.manageToken || "";
    const manageHref = opts.manageHref || (manageToken ? window.TinySubmit?.bookingUrl?.(manageToken) : "");
    const whatsappHref = opts.whatsappHref || "";
    const showEdit = Boolean(opts.showEdit && manageHref);
    const showCancel = Boolean(opts.showCancel && manageToken);
    const showShare = Boolean(opts.showShare && manageHref);
    const title = opts.title || "Saved";
    const subtitle =
      opts.subtitle ||
      (code ? `Reference ${code}. Send the details to Tiny on WhatsApp when you’re ready.` : "Send the details to Tiny on WhatsApp when you’re ready.");

    body.innerHTML = `
      <p class="tiny-success-modal__eyebrow">Tiny Healthy Cafe</p>
      <h2 id="tiny-success-title">${escapeHtml(title)}</h2>
      <p class="tiny-success-modal__sub">${escapeHtml(subtitle)}</p>
      ${code ? `<p class="tiny-success-modal__code">${escapeHtml(code)}</p>` : ""}
      <div class="tiny-success-modal__actions">
        ${
          whatsappHref
            ? `<a class="btn tiny-success-modal__primary" href="${escapeHtml(
                whatsappHref
              )}" target="_blank" rel="noopener noreferrer" data-wa="success_send">Send to WhatsApp</a>`
            : ""
        }
        ${showEdit ? `<a class="btn btn--outline" href="${escapeHtml(manageHref)}">Edit</a>` : ""}
        ${showShare ? `<button type="button" class="btn btn--outline" data-share>Share</button>` : ""}
        ${showCancel ? `<button type="button" class="btn btn--outline tiny-success-modal__danger" data-cancel>Cancel booking</button>` : ""}
      </div>
      <p class="tiny-success-modal__status" id="tiny-success-status" role="status" aria-live="polite"></p>
      <button type="button" class="tiny-success-modal__dismiss" data-close>Close</button>
    `;

    const status = body.querySelector("#tiny-success-status");
    const setStatus = (text, kind) => {
      if (!status) return;
      status.textContent = text || "";
      status.className = `tiny-success-modal__status${kind ? ` is-${kind}` : ""}`;
    };

    body.querySelector("[data-share]")?.addEventListener("click", async () => {
      const result = await shareLink(manageHref);
      if (result === "copied") setStatus("Link copied.", "success");
      else if (result === "shared") setStatus("Shared.", "success");
      else if (result === "aborted") setStatus("");
      else setStatus("Copy the link from the prompt.", "success");
    });

    body.querySelector("[data-cancel]")?.addEventListener("click", async () => {
      if (!window.confirm("Cancel this booking? Tiny will be notified.")) return;
      const btn = body.querySelector("[data-cancel]");
      if (btn) btn.disabled = true;
      setStatus("Cancelling…");
      try {
        if (!window.TinySubmit?.manageRequest) throw new Error("Managing is not configured yet.");
        const contact = window.TinyContact?.readContact?.() || {};
        const result = await window.TinySubmit.manageRequest({
          action: "cancel",
          manageToken,
          email: opts.email || contact.email || "",
          phone: opts.phone || contact.phone || "",
        });
        const booking = result.booking || {};
        setStatus("Booking cancelled.", "success");
        body.querySelector(".tiny-success-modal__actions")?.querySelectorAll("a, button").forEach((el) => {
          if (el.hasAttribute("data-close")) return;
          if (el.getAttribute("data-wa") === "success_send") return;
          el.hidden = true;
        });
        if (typeof opts.onCancelled === "function") opts.onCancelled(booking);
      } catch (err) {
        setStatus(err?.message || "Could not cancel.", "error");
        if (btn) btn.disabled = false;
      }
    });

    root.hidden = false;
    root.setAttribute("aria-hidden", "false");
    document.body.classList.add("tiny-success-open");
    body.querySelector(".tiny-success-modal__primary")?.focus();
  }

  window.TinySuccessModal = {
    open,
    close,
    shareLink,
    isInactiveStatus(status) {
      return INACTIVE.has(String(status || ""));
    },
  };
})();
