<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
  <section class="info-hero" aria-labelledby="menu-title">
      <div class="info-wrap info-hero__inner">
        <div>
          <div class="eyebrow">Tiny Healthy Cafe · Berawa, Bali</div>
          <h1 id="menu-title">Our menu</h1>
          <p class="info-hero__sub">Browse our food, drinks and nights menus, or download a copy to keep.</p>
        </div>
        <div class="info-hero__actions">
          <a class="btn btn--lg btn--dark" href="../reserve/">Reserve a table</a>
        </div>
      </div>
    </section>

    <section class="info-wrap" id="menu-app" aria-label="Menus">
      <div class="menu-tabs" role="tablist" aria-label="Choose a menu">
        <button type="button" class="menu-tab is-active" role="tab" aria-selected="true" id="menu-tab-food" data-menu="food" data-pdf="pdf/tiny-food-menu.pdf" data-title="Food Menu">Food Menu</button>
        <button type="button" class="menu-tab" role="tab" aria-selected="false" id="menu-tab-drinks" data-menu="drinks" data-pdf="pdf/tiny-drink-menu.pdf" data-title="Drink Menu">Drink Menu</button>
        <button type="button" class="menu-tab" role="tab" aria-selected="false" id="menu-tab-nights" data-menu="nights" data-pdf="pdf/tiny-nights-menu.pdf" data-title="Nights Menu">Nights Menu</button>
      </div>

      <div class="menu-viewer" role="tabpanel" aria-labelledby="menu-tab-food" id="menu-panel">
        <div class="menu-viewer__bar">
          <h2 class="menu-viewer__title" id="menu-viewer-title">Food Menu</h2>
          <div class="menu-viewer__actions">
            <a class="btn" id="menu-download" href="pdf/tiny-food-menu.pdf" download="tiny-food-menu.pdf">Download PDF</a>
            <a class="btn btn--outline" id="menu-open" href="pdf/tiny-food-menu.pdf" target="_blank" rel="noopener">Open full screen</a>
          </div>
        </div>
        <div class="menu-viewer__frame" id="menu-frame-wrap">
          <iframe id="menu-frame" title="Food Menu" allow="fullscreen" allowfullscreen></iframe>
          <div class="menu-viewer__loading">Loading menu…</div>
          <div class="menu-viewer__fallback" id="menu-fallback" hidden>
            <p>This menu opens in your phone's PDF viewer.</p>
            <a class="btn btn--dark btn--lg" id="menu-fallback-open" href="#" target="_blank" rel="noopener">Open menu</a>
          </div>
        </div>
      </div>
    </section>
