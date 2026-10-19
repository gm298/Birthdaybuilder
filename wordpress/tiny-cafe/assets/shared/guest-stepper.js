(() => {
  "use strict";

  function limits(input) {
    const min = input.min === "" ? 0 : Number(input.min);
    const max = input.max === "" ? Infinity : Number(input.max);
    return {
      min: Number.isFinite(min) ? min : 0,
      max: Number.isFinite(max) ? max : Infinity,
    };
  }

  function clamp(input, value) {
    const { min, max } = limits(input);
    let n = Number(value);
    if (!Number.isFinite(n)) n = min;
    n = Math.round(n);
    if (n < min) n = min;
    if (n > max) n = max;
    return n;
  }

  function paintTotal(root) {
    if (!root) return;
    const totalEl = root.querySelector("[data-guest-total]");
    if (!totalEl) return;
    const inputs = [...root.querySelectorAll("input[type='number']")];
    const filled = inputs.filter((input) => input.value !== "");
    if (!filled.length) {
      totalEl.textContent = inputs.length > 1 ? "Total: —" : "";
      return;
    }
    const total = filled.reduce((sum, input) => sum + (Number(input.value) || 0), 0);
    totalEl.textContent = inputs.length > 1 ? `Total: ${total}` : `${total}`;
  }

  function commit(input, value) {
    const next = String(clamp(input, value));
    if (input.value !== next) input.value = next;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    paintTotal(input.closest("[data-guest-stepper]"));
  }

  function bind(root) {
    if (!root || root.dataset.guestStepperBound) return;
    root.dataset.guestStepperBound = "1";
    root.querySelectorAll(".guest-stepper__btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.getAttribute("data-for") || "");
        if (!input) return;
        const current = input.value === "" ? Number(input.min || 0) : Number(input.value);
        const delta = Number(btn.getAttribute("data-step")) || 0;
        commit(input, current + delta);
      });
    });
    root.querySelectorAll("input[type='number']").forEach((input) => {
      input.addEventListener("input", () => paintTotal(root));
      input.addEventListener("change", () => {
        if (input.value === "") {
          paintTotal(root);
          return;
        }
        const next = String(clamp(input, input.value));
        if (input.value !== next) input.value = next;
        paintTotal(root);
      });
    });
    paintTotal(root);
  }

  function init(scope) {
    const root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll("[data-guest-stepper]").forEach(bind);
  }

  window.TinyGuestStepper = {
    init,
    paint(root) {
      paintTotal(root);
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init(document));
  } else {
    init(document);
  }
})();
