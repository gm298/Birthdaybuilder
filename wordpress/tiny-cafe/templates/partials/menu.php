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
        <p class="dm-sub">Browse, customise, and show your list to the waiter. Order online anytime.</p>
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

    <div class="dm-bar" id="dm-list-bar" hidden>
      <button type="button" class="dm-bar__btn" id="dm-open-list">
        <span>My list</span>
        <span class="dm-bar__meta" id="dm-list-meta">0 items</span>
      </button>
    </div>

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

    <div class="dm-sheet" id="dm-list-sheet" hidden>
      <button type="button" class="dm-sheet__backdrop" data-close-list aria-label="Close"></button>
      <div class="dm-sheet__panel dm-sheet__panel--list" role="dialog" aria-modal="true" aria-labelledby="dm-list-title">
        <div class="dm-list-head">
          <h2 id="dm-list-title">My list</h2>
          <button type="button" class="dm-sheet__x" data-close-list aria-label="Close">&times;</button>
        </div>
        <p class="dm-list-note" id="dm-list-note"></p>
        <div id="dm-list-body"></div>
        <div class="dm-list-foot">
          <p class="dm-list-total" id="dm-list-total"></p>
          <button type="button" class="dm-btn dm-btn--primary dm-btn--block" id="dm-show-waiter">Show to waiter</button>
          <p class="dm-list-disclaimer">Nothing is ordered until you show this to your waiter.</p>
        </div>
      </div>
    </div>

    <div class="dm-waiter" id="dm-waiter" hidden>
      <div class="dm-waiter__card">
        <p class="dm-waiter__label">Show this to your waiter</p>
        <p class="dm-waiter__time" id="dm-waiter-time"></p>
        <div id="dm-waiter-body"></div>
        <p class="dm-waiter__total" id="dm-waiter-total"></p>
        <button type="button" class="dm-btn dm-btn--light" id="dm-waiter-done">Done</button>
      </div>
    </div>
  </div>
