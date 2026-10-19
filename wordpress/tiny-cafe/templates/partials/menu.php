<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
  <div class="dm" id="dm-app" aria-busy="true">
    <header class="dm-hero">
      <div class="dm-hero__inner">
        <p class="dm-eyebrow">Tiny Healthy Cafe · Berawa</p>
        <h1 class="dm-title">Our menu</h1>
        <p class="dm-sub">Browse dishes and options. Order online anytime.</p>
        <div class="dm-hero__actions">
          <a class="dm-btn dm-btn--ghost" href="pdf/tiny-food-menu.pdf" download>Download PDF</a>
          <a class="dm-btn dm-btn--ghost" href="../reserve/">Reserve a table</a>
        </div>
      </div>
    </header>

    <div class="dm-toolbar" id="dm-sections" role="tablist" aria-label="Menu sections"></div>
    <div class="dm-subs" id="dm-subs" hidden></div>
    <p class="dm-intro" id="dm-intro" hidden></p>
    <p class="dm-status" id="dm-status" role="status">Loading menu…</p>
    <div class="dm-grid" id="dm-grid" aria-live="polite"></div>

    <a class="dm-fab" id="dm-shop-fab" href="https://esborder.qs.esb.co.id/TYKB/THFC/mode" target="_blank" rel="noopener noreferrer" aria-label="Order online">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.2 11h9.6l2-8H7"/></svg>
      <span>Order online</span>
    </a>

    <div class="dm-sheet" id="dm-pop" hidden>
      <button type="button" class="dm-sheet__backdrop" data-close-pop aria-label="Close"></button>
      <div class="dm-sheet__panel" role="dialog" aria-modal="true" aria-labelledby="dm-pop-title">
        <button type="button" class="dm-sheet__x" data-close-pop aria-label="Close">&times;</button>
        <div class="dm-pop" id="dm-pop-body"></div>
      </div>
    </div>
  </div>
