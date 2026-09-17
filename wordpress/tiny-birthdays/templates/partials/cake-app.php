<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
<div id="cakes">
<section class="gallery" id="gallery">
  <div class="gallery__head">
    <h2><?php echo tiny_birthdays_esc($gallery_headline); ?></h2>
    <div class="filters" id="filters" role="tablist" aria-label="Filter by theme"></div>
  </div>
  <div class="gallery__grid" id="gallery-grid"></div>
  <div class="gallery-more-wrap">
    <button type="button" class="btn btn--outline" id="gallery-more" hidden>See more cakes</button>
  </div>
</section>

<section class="builder" id="build">
  <div class="builder__intro">
    <div class="eyebrow"><?php echo tiny_birthdays_esc($eyebrow); ?></div>
    <h2><?php echo tiny_birthdays_html($headline); ?></h2>
    <p><?php echo tiny_birthdays_html($copy); ?></p>
    <ul class="builder__points">
      <li>Order at least 2 days ahead</li>
      <li>Custom themes and characters welcome</li>
      <li>Free cake tasting if you're booking a birthday</li>
      <li>Pick up to two sponge flavours</li>
    </ul>
    <div class="builder__diet">
      <div>
        <h3>Gluten-free and no added sugar, on any cake</h3>
        <p><strong style="font-weight:400;color:#fff">Gluten-free</strong> means the sponge is baked without wheat flour, on a nut or root-vegetable base instead. <strong style="font-weight:400;color:#fff">No added sugar</strong> means nothing sweeter than fruit and dates goes in — no cane sugar, no syrups. Both are a paid add-on available on every cake here; tell us which you need when you order and we'll quote it. The decoration doesn't change.</p>
      </div>
      <div class="builder__diet-tags">
        <span>Gluten-free</span>
        <span>No added sugar</span>
      </div>
    </div>
    <a class="link-text" href="<?php echo esc_url($birthdays_url); ?>">Celebrating at Tiny? See birthday packages</a>
  </div>

  <form class="builder__form" id="cake-form" novalidate>
    <div class="field">
      <span class="field__label" id="addons-label">Diet options</span>
      <div class="option-row" id="addon-options" role="group" aria-labelledby="addons-label"></div>
      <span class="field__hint field__hint--soft">Choose a diet option or leave on “No special requirements” to see every cake and sponge. Gluten-free and no added sugar filter the sponge list below — both cost extra.</span>
    </div>

    <div class="field">
      <label class="field__label" for="cake-date">Date you need it</label>
      <input type="date" id="cake-date" name="date" required>
    </div>

    <div class="field">
      <span class="field__label" id="size-label">Size</span>
      <div class="option-row" id="size-options" role="group" aria-labelledby="size-label"></div>
      <span class="field__hint" id="size-note">18 cm — IDR 1.5M · the usual birthday size, about 12–16 slices.</span>
    </div>

    <div class="form-row">
      <div class="field">
        <span class="field__label" id="sponge-label">No added sugar sponge <span class="field__label-note">(up to 2 flavours total)</span></span>
        <div class="option-col" id="sponge-options" role="group" aria-labelledby="sponge-label"></div>
        <span class="field__hint" id="sponge-hint">Select one or two flavours for your cake layers.</span>
      </div>
      <div class="field" id="sugar-sponge-field">
        <span class="field__label" id="sugar-sponge-label">Sugar added sponge <span class="field__label-note">(counts toward 2)</span></span>
        <div class="option-col" id="sugar-sponge-options" role="group" aria-labelledby="sugar-sponge-label"></div>
        <span class="field__hint field__hint--soft" id="sugar-sponge-hint">Mix with a no-sugar sponge, or pick two sugar-added flavours.</span>
      </div>
    </div>

    <div class="field">
      <span class="field__label" id="design-label">Design</span>
      <div class="option-row" id="mode-options" role="group" aria-labelledby="design-label">
        <button type="button" class="option-btn option-btn--sm is-active" data-mode="gallery">From the gallery</button>
        <button type="button" class="option-btn option-btn--sm" data-mode="own">My own idea</button>
      </div>
      <div class="design-grid is-visible" id="design-grid"></div>
      <label class="file-drop" id="file-drop">
        <span class="file-drop__label" id="file-label">Tap to attach a photo</span>
        <span class="file-drop__hint">Attach a reference photo — we'll get close, not identical</span>
        <input type="file" id="ref-photo" accept="image/*">
      </label>
    </div>

    <div class="field">
      <label class="field__label" for="cake-theme">Theme or name on the cake</label>
      <input type="text" id="cake-theme" name="theme" placeholder="e.g. dinosaurs, and the name Mira">
    </div>

    <div class="form-row" id="contact-fields">
      <div class="field">
        <label class="field__label" for="contact-email">Email</label>
        <input type="email" id="contact-email" name="contact-email" autocomplete="email" placeholder="you@email.com">
      </div>
      <div class="field">
        <label class="field__label" for="contact-phone">WhatsApp number</label>
        <div class="phone-split">
          <div class="dial-combobox">
            <input type="hidden" id="contact-dial" name="contact-dial" value="62">
            <input type="text" id="contact-dial-search" class="dial-combobox__input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="contact-dial-list" aria-label="Country code" autocomplete="off" spellcheck="false" placeholder="+62 ID">
            <ul class="dial-combobox__list" id="contact-dial-list" role="listbox" hidden></ul>
          </div>
          <input type="tel" id="contact-phone" name="contact-phone" inputmode="tel" autocomplete="tel" placeholder="81234567890">
        </div>
      </div>
    </div>
    <p class="field__hint field__hint--soft">We need email or WhatsApp. At least one is required. We’ll save the cake details and photo so Tiny can quote you.</p>

    <button class="btn btn--white btn--lg builder__submit" type="submit">Save &amp; send to WhatsApp</button>
    <p class="builder__submit-note">Saves your cake request for Tiny, then opens WhatsApp with the details filled in.</p>
    <p class="form-status" id="form-status" role="status" aria-live="polite"></p>

    <div class="builder__diet-mobile">
      <h3>Gluten-free and no added sugar</h3>
      <p><strong style="font-weight:400;color:#fff">Gluten-free</strong> — sponge without wheat flour, on a nut or root-vegetable base. <strong style="font-weight:400;color:#fff">No added sugar</strong> — sweetened only with fruit and dates. Both are a paid add-on; we'll quote it in the chat.</p>
    </div>
    <ul class="builder__points-mobile">
      <li>Order at least 2 days ahead</li>
      <li>Custom themes welcome</li>
      <li>Pick up to two sponge flavours</li>
    </ul>
  </form>
</section>
</div>

<div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="lightbox-name">
  <button class="lightbox__close" type="button" aria-label="Close">&times;</button>
  <div class="lightbox__panel">
    <div class="lightbox__img" id="lightbox-img" role="img" aria-label=""></div>
    <div class="lightbox__meta">
      <span class="lightbox__name" id="lightbox-name"></span>
      <span class="lightbox__theme" id="lightbox-theme"></span>
    </div>
    <a class="btn btn--white" href="#build" id="lightbox-order">Use this cake</a>
  </div>
</div>
