<?php
if (!defined('ABSPATH')) {
    exit;
}
?>
  <section class="hero" aria-label="Reserve a table">
      <div class="hero__copy">
        <div class="eyebrow">Tiny Healthy Cafe · Berawa, Bali</div>
        <h1>Reserve a table</h1>
        <p class="hero__sub">The cafe is open 8:30am–8pm. Online Reservations last for 2 hours and we will hold your table for 15 minutes. Full booking conditions are shown before you confirm.</p>
      </div>
      <figure class="hero__photo">
        <img src="<?php echo esc_url(tiny_birthdays_asset('reserve/img/dining.jpg')); ?>" alt="Family at a table with drinks, food, and a server at Tiny" width="1024" height="1024">
      </figure>
    </section>

    <section class="wizard" id="book">
      <div class="wizard__top">
        <h2>Reservation</h2>
        <button class="wizard__cancel" type="button" id="wizard-cancel">Cancel</button>
      </div>
      <ol class="steps" aria-label="Reservation steps">
        <li class="steps__item is-active" data-step-label="1">Schedule</li>
        <li class="steps__item" data-step-label="2">Table</li>
        <li class="steps__item" data-step-label="3">Details</li>
        <li class="steps__item" data-step-label="4">Confirm</li>
      </ol>

      <form id="reserve-form" novalidate>
        <div class="wizard-panel is-active" data-panel="1">
          <div class="field field--guests">
            <span class="field__label">Guests <span class="field__req">*</span></span>
            <div class="guest-stepper" id="guest-stepper" data-guest-stepper>
              <div class="guest-stepper__row">
                <label class="guest-stepper__name" id="guest-kids-label" for="guest-kids">Children</label>
                <button type="button" class="guest-stepper__btn" data-for="guest-kids" data-step="-1" aria-label="Fewer children">−</button>
                <input class="guest-stepper__input" type="number" id="guest-kids" name="guest-kids" min="0" max="30" inputmode="numeric" value="" aria-labelledby="guest-kids-label">
                <button type="button" class="guest-stepper__btn" data-for="guest-kids" data-step="1" aria-label="More children">+</button>
              </div>
              <div class="guest-stepper__row">
                <label class="guest-stepper__name" id="guest-adults-label" for="guest-adults">Adults</label>
                <button type="button" class="guest-stepper__btn" data-for="guest-adults" data-step="-1" aria-label="Fewer adults">−</button>
                <input class="guest-stepper__input" type="number" id="guest-adults" name="guest-adults" min="0" max="20" inputmode="numeric" value="" aria-labelledby="guest-adults-label">
                <button type="button" class="guest-stepper__btn" data-for="guest-adults" data-step="1" aria-label="More adults">+</button>
              </div>
              <p class="guest-stepper__total" data-guest-total>Total: —</p>
            </div>
          </div>
          <div class="field">
            <span class="field__label">Select reservation date</span>
            <div class="date-chips" id="date-chips"></div>
            <input type="date" id="reserve-date" name="date" required class="sr-date">
          </div>
          <div class="field">
            <span class="field__label" id="time-label">Select reservation time</span>
            <button type="button" class="time-trigger" id="time-trigger" aria-haspopup="dialog" aria-expanded="false" aria-controls="time-modal">
              <span class="time-trigger__label" id="time-trigger-label">Select time</span>
              <span class="time-trigger__hint" id="time-trigger-hint">Choose an available 2-hour slot</span>
            </button>
            <span class="field__hint">2 hours · arrive within 15 minutes.</span>
          </div>
          <p class="form-status" id="schedule-occupancy-status" role="status" hidden></p>
        </div>

        <div class="wizard-panel" data-panel="2" hidden>
          <div class="plan__head">
            <div>
              <h3 class="panel-title">Pick a table</h3>
              <p class="field__hint" id="guests-hint">Tables shown fit your party. Indoor tables 1 &amp; 2 or 3 &amp; 4 join for up to 8. Terrace tables 18 &amp; 19 join for 8–10. Held tables are blocked for this slot.</p>
            </div>
            <div class="plan__tabs" role="tablist" aria-label="Cafe area">
              <button type="button" class="plan-tab is-active" role="tab" aria-selected="true" data-area="indoor">Indoor</button>
              <button type="button" class="plan-tab" role="tab" aria-selected="false" data-area="terrace">Terrace</button>
            </div>
          </div>
          <div class="plan__stage">
            <div class="plan__canvas" id="floorplan" role="application" aria-label="Clickable table layout"></div>
            <aside class="plan__side" aria-live="polite">
              <div class="picked" id="picked">
                <h3>No table yet</h3>
                <p>Tap a table on the map.</p>
              </div>
              <dl class="picked__meta" id="picked-meta" hidden></dl>
            </aside>
          </div>
        </div>

        <div class="wizard-panel" data-panel="3" hidden>
          <h3 class="panel-title">Reservation details</h3>
          <p class="field__hint">We’ll email your reservation details and a private link to edit or cancel. We’ll also send a copy to Tiny.</p>
          <div class="field">
            <label class="field__label" for="reserve-name">Name</label>
            <input type="text" id="reserve-name" name="name" autocomplete="name" required placeholder="Full name">
          </div>
          <div id="contact-fields">
            <div class="field">
              <label class="field__label" for="contact-email">Email</label>
              <input type="email" id="contact-email" name="email" autocomplete="email" placeholder="Enter your email">
            </div>
            <div class="field">
              <label class="field__label" for="contact-phone">WhatsApp number</label>
              <div class="phone-split">
                <div class="dial-combobox">
                  <input type="hidden" id="contact-dial" name="contact-dial" value="62">
                  <input type="text" id="contact-dial-search" class="dial-combobox__input" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="contact-dial-list" aria-label="Country code" autocomplete="off" spellcheck="false" placeholder="+62 ID">
                  <ul class="dial-combobox__list" id="contact-dial-list" role="listbox" hidden></ul>
                </div>
                <input type="tel" id="contact-phone" name="phone" inputmode="tel" autocomplete="tel" placeholder="812 3456 7890">
              </div>
            </div>
          </div>
          <div class="field">
            <label class="field__label" for="reserve-notes">Notes <span class="field__label-note">(optional)</span></label>
            <textarea id="reserve-notes" name="notes" rows="3" maxlength="120" placeholder="High chair, pram, cake…"></textarea>
            <span class="field__hint" id="notes-count">0 / 120</span>
          </div>
        </div>

        <div class="wizard-panel" data-panel="4" hidden>
          <div class="summary-card" id="summary-card"></div>
          <div class="notice">
            <p>Make sure your reservation details are correct.</p>
            <p>Your table is booked for 2 hours. We hold it for 15 minutes after the start time. If you have not arrived by then, the reservation is cancelled.</p>
          </div>
        </div>

        <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
        <div class="wizard__nav">
          <button class="btn btn--outline" type="button" id="wizard-back" hidden>Back</button>
          <button class="btn" type="button" id="wizard-next">Continue</button>
          <button class="btn" type="submit" id="wizard-submit" hidden>Confirm reservation</button>
          <a class="btn" id="wa-open" hidden target="_blank" rel="noopener noreferrer">Send to WhatsApp</a>
        </div>
        <div class="post-save-actions" id="post-save-actions" hidden>
          <a class="btn btn--outline" id="post-save-edit" href="#">Edit</a>
          <button class="btn btn--outline" type="button" id="post-save-share">Share</button>
          <button class="btn btn--outline" type="button" id="post-save-cancel">Cancel</button>
        </div>
      </form>
    </section>

  <div class="time-modal" id="time-modal" hidden aria-hidden="true">
    <button type="button" class="time-modal__backdrop" data-close-time aria-label="Close"></button>
    <div class="time-modal__panel" role="dialog" aria-modal="true" aria-labelledby="time-modal-title">
      <div class="time-modal__head">
        <h3 id="time-modal-title">Available times</h3>
        <button type="button" class="time-modal__close" data-close-time aria-label="Close">&times;</button>
      </div>
      <div class="time-grid" id="time-grid" role="group" aria-labelledby="time-modal-title"></div>
    </div>
  </div>

