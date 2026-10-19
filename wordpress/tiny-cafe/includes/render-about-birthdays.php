<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_render_about_birthdays($attrs = []) {
    $img = tiny_birthdays_asset('birthdays/img/');
    $video = tiny_birthdays_asset('birthdays/video/hero-main-birthday.mp4');
    $builder = tiny_birthdays_page_url('builder');
    $cakes = tiny_birthdays_page_url('cakes');
    $decor = tiny_birthdays_asset('birthdays/builder/img/decor/');
    $pkg_img = tiny_birthdays_asset('birthdays/builder/img/packages/');
    $wa = tiny_birthdays_wa_tasting();
    $wa_q = tiny_birthdays_wa_question();
    $builder_simple = esc_url(trailingslashit($builder) . '?package=simple#details');
    $builder_signature = esc_url(trailingslashit($builder) . '?package=signature#details');
    $builder_terrace = esc_url(trailingslashit($builder) . '?package=terrace#details');
    $cakes_gallery = esc_url(trailingslashit($cakes) . '#gallery');
    $builder_url = esc_url(trailingslashit($builder) . '#details');

    ob_start();
    ?>
    <section class="hero" aria-label="Hero">
      <div class="hero__copy">
        <div class="eyebrow">Tiny · Berawa, Bali</div>
        <h1>Kids' birthday<br>parties<br><span class="hero__at-tiny">in Berawa</span></h1>
        <p class="hero__sub">Choose your cake, decor and party extras in one place.</p>
        <ul class="hero__checks">
          <li>Decor, cake, play, and a food &amp; drink credit</li>
          <li>Any budget · starting from IDR 2.3M</li>
          <li>Private tropical terrace · up to 35 guests</li>
        </ul>
        <div class="hero__actions">
          <a class="btn btn--lg btn--dark" href="<?php echo $builder_url; ?>">Check your date &amp; estimate</a>
          <a class="btn btn--lg btn--outline-dark" href="#packages">Compare party packages</a>
        </div>
        <div class="hero__rating">
          <span class="stars" aria-hidden="true">★</span>
          <span>4.8 on Google Maps · 100+ celebrations hosted</span>
        </div>
      </div>
      <div class="hero__media">
        <div class="hero__video-card">
          <video id="hero-video-desktop" poster="<?php echo esc_url($img . 'pdf-gal-03.webp'); ?>" playsinline muted loop preload="metadata">
            <source src="<?php echo esc_url($video); ?>" type="video/mp4">
          </video>
          <img class="hero__video-logo" src="<?php echo esc_url($img . 'logo-dark.png'); ?>" alt="" width="36" height="36" aria-hidden="true">
        </div>
      </div>
      <div class="hero__video-mobile-wrap">
        <video id="hero-video-mobile" class="hero__video-mobile" poster="<?php echo esc_url($img . 'pdf-gal-03.webp'); ?>" playsinline muted loop preload="metadata">
          <source src="<?php echo esc_url($video); ?>" type="video/mp4">
        </video>
      </div>
    </section>

    <section class="included" id="included">
      <img class="included__bg" src="<?php echo esc_url($img . 'pdf-gal-06.webp'); ?>" alt="Kids on the decorated terrace" width="1440" height="660" loading="lazy">
      <div class="included__overlay" aria-hidden="true"></div>
      <div class="included__inner">
        <div>
          <div class="eyebrow">How it works</div>
          <h2>Five steps, then you arrive.</h2>
        </div>
        <div class="included__card-wrap">
          <div class="included__card">
            <h3>All you need to do</h3>
            <div class="step"><span class="step__num">01</span><div><div class="step__title">Tell us the basics</div></div></div>
            <div class="step"><span class="step__num">02</span><div><div class="step__title">Choose a package</div></div></div>
            <div class="step"><span class="step__num">03</span><div><div class="step__title">Pick decoration</div></div></div>
            <div class="step"><span class="step__num">04</span><div><div class="step__title">Choose cake, food &amp; drinks</div></div></div>
            <div class="step"><span class="step__num">05</span><div><div class="step__title">Add entertainment if needed</div></div></div>
            <div class="included__card-footer">Arrive &amp; enjoy</div>
            <a class="btn btn--lg included__build-cta" href="<?php echo $builder_url; ?>">Check your date &amp; estimate</a>
          </div>
        </div>
      </div>
    </section>

    <section class="offer-slider" id="gallery" aria-label="What we offer">
      <div class="offer-slider__head">
        <div class="eyebrow">Themes, venue &amp; cakes</div>
        <h2>What we offer</h2>
      </div>
      <div class="offer-slider__frame">
        <button type="button" class="offer-slider__nav offer-slider__nav--prev" aria-label="Previous photo">‹</button>
        <div class="offer-slider__viewport" tabindex="0">
          <ul class="offer-slider__track">
            <li class="offer-slider__slide is-active"><img src="<?php echo esc_url($img . 'slideshow/01.jpg'); ?>" alt="Guests seated at a birthday table" width="1600" height="1200" loading="eager"><span class="offer-slider__caption">Party table</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/02.jpg'); ?>" alt="Children in front of a balloon photozone" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Balloon photozone</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/03.jpg'); ?>" alt="Child with unicorn face paint and a parent" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Face paint</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/04.jpg'); ?>" alt="Children making crafts at the table" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Craft table</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/05.jpg'); ?>" alt="Themed birthday balloon backdrop" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Birthday backdrop</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/06.jpg'); ?>" alt="Children playing together" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Play time</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/07.jpg'); ?>" alt="Families gathered around the party table" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Around the table</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/08.jpg'); ?>" alt="Family standing at a pastel balloon photozone" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Photozone</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/09.jpg'); ?>" alt="Children in costume dancing" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Dress-up</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/10.jpg'); ?>" alt="Adults and children making something together" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Making together</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/11.jpg'); ?>" alt="Child in front of a character balloon photozone" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Character photozone</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/12.jpg'); ?>" alt="Children around a birthday cake" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Cake at the table</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/13.jpg'); ?>" alt="Child in front of a character balloon backdrop" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Themed photozone</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/14.jpg'); ?>" alt="Adult and child in aprons at a cooking class" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Cooking class</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'slideshow/15.jpg'); ?>" alt="Birthday table with balloons and cake" width="1600" height="1200" loading="lazy"><span class="offer-slider__caption">Birthday table</span></li>
          </ul>
        </div>
        <button type="button" class="offer-slider__nav offer-slider__nav--next" aria-label="Next photo">›</button>
      </div>
      <div class="offer-slider__dots" role="tablist" aria-label="Slide indicators"></div>
    </section>

    <section class="packages" id="packages">
      <div class="packages__head">
        <div>
          <div class="eyebrow">Three ways to celebrate</div>
          <h2>One price, everything handled</h2>
        </div>
        <p class="packages__note">Each package lists what is different. Food and drink are a credit toward the menu, not unlimited. Parties run 3 hours. Party changes need 24 hours’ notice; there is no refund for party cancellations.</p>
      </div>
      <div class="packages__grid" id="packages-grid" data-wp-managed="1">
        <a class="pkg" href="<?php echo $builder_simple; ?>"><h3>Simple celebration</h3><div class="pkg__guests">5 guests included · add up to 9</div><div class="pkg__price">IDR 2.3M</div><ul class="pkg__features"><li>Birthday cake · 15cm, 2 layers</li><li>Requested themed party</li><li>Table decor (no flowers)</li><li>Simple balloon decor</li><li>Food &amp; drink credit · 750k weekday / 1.5M weekend. Extra orders are charged from the menu.</li></ul><div class="pkg__cta">Customise this →</div></a>
        <a class="pkg" href="<?php echo $builder_signature; ?>"><h3>Signature themed party</h3><div class="pkg__guests">10 guests included · add up to 20</div><div class="pkg__price">IDR 5.3M</div><ul class="pkg__features"><li>Birthday cake · 18cm, 2 layers</li><li>Requested themed party</li><li>Medium balloon decor</li><li>Photozone</li><li>Food &amp; drink credit · 1.5M weekday / 3M weekend. Extra orders are charged from the menu.</li></ul><div class="pkg__cta">Customise this →</div></a>
        <a class="pkg" href="<?php echo $builder_terrace; ?>"><h3>Private terrace event</h3><div class="pkg__guests">20 guests included · add up to 35</div><div class="pkg__price">IDR 12.7M</div><ul class="pkg__features"><li>Birthday cake · 22cm, 2 layers</li><li>Whole private terrace</li><li>Full terrace balloon decor</li><li>Photozone &amp; piñata</li><li>Dessert station</li><li>Masterclass for 10 kids</li><li>Food &amp; drink credit · 3M weekday / 6M weekend. Extra orders are charged from the menu.</li></ul><div class="pkg__cta">Customise this →</div></a>
      </div>
      <div class="pkg-compact" id="packages-compact">
        <div class="pkg-compact__item is-open" data-pkg="simple">
          <button type="button" class="pkg-compact__toggle" aria-expanded="true"><span class="pkg-compact__name">Simple celebration</span><span class="pkg-compact__price">IDR 2.3M</span></button>
          <div class="pkg-compact__panel"><span class="pkg-compact__summary">5 guests · cake 15cm · themed party · table &amp; balloon decor</span><a class="pkg-compact__cta" href="<?php echo $builder_simple; ?>">Customise this →</a></div>
        </div>
        <div class="pkg-compact__item" data-pkg="signature">
          <button type="button" class="pkg-compact__toggle" aria-expanded="false"><span class="pkg-compact__name">Signature themed party</span><span class="pkg-compact__price">IDR 5.3M</span></button>
          <div class="pkg-compact__panel" hidden><span class="pkg-compact__summary">10 guests · cake 18cm · themed decor · medium balloons · photozone</span><a class="pkg-compact__cta" href="<?php echo $builder_signature; ?>">Customise this →</a></div>
        </div>
        <div class="pkg-compact__item" data-pkg="terrace">
          <button type="button" class="pkg-compact__toggle" aria-expanded="false"><span class="pkg-compact__name">Private terrace event</span><span class="pkg-compact__price">IDR 12.7M</span></button>
          <div class="pkg-compact__panel" hidden><span class="pkg-compact__summary">20 guests · cake 22cm · dessert station · private terrace · masterclass</span><a class="pkg-compact__cta" href="<?php echo $builder_terrace; ?>">Customise this →</a></div>
        </div>
      </div>
      <div class="pkg-compare" id="package-compare">
        <h3 class="pkg-compare__title">Compare Packages</h3>
        <div class="pkg-compare__scroll">
          <div class="pkg-compare__board" role="table" aria-label="Compare Packages">
            <div class="pkg-compare__label pkg-compare__label--head"></div>
            <div class="pkg-compare__colhead" role="columnheader">
              <button type="button" class="pkg-compare__photo" data-expand-src="<?php echo esc_url($pkg_img . 'simple.jpg'); ?>" data-expand-alt="Simple celebration" aria-label="Expand Simple celebration photo">
                <img src="<?php echo esc_url($pkg_img . 'simple.jpg'); ?>" alt="" width="480" height="320" loading="lazy">
              </button>
              <p class="pkg-compare__name">Simple celebration</p>
              <a href="<?php echo $builder_simple; ?>">Customise this</a>
            </div>
            <div class="pkg-compare__colhead" role="columnheader">
              <button type="button" class="pkg-compare__photo" data-expand-src="<?php echo esc_url($pkg_img . 'signature.jpg'); ?>" data-expand-alt="Signature themed party" aria-label="Expand Signature themed party photo">
                <img src="<?php echo esc_url($pkg_img . 'signature.jpg'); ?>" alt="" width="480" height="320" loading="lazy">
              </button>
              <p class="pkg-compare__name">Signature themed party</p>
              <a href="<?php echo $builder_signature; ?>">Customise this</a>
            </div>
            <div class="pkg-compare__colhead" role="columnheader">
              <button type="button" class="pkg-compare__photo" data-expand-src="<?php echo esc_url($pkg_img . 'terrace.jpg'); ?>" data-expand-alt="Private terrace event" aria-label="Expand Private terrace event photo">
                <img src="<?php echo esc_url($pkg_img . 'terrace.jpg'); ?>" alt="" width="480" height="320" loading="lazy">
              </button>
              <p class="pkg-compare__name">Private terrace event</p>
              <a href="<?php echo $builder_terrace; ?>">Customise this</a>
            </div>
            <div class="pkg-compare__label" role="rowheader"><span>Weekday from</span></div>
            <div class="pkg-compare__cell" role="cell">IDR 2.3M</div>
            <div class="pkg-compare__cell" role="cell">IDR 5.3M</div>
            <div class="pkg-compare__cell" role="cell">IDR 12.7M</div>
            <div class="pkg-compare__label" role="rowheader"><span>Weekend from</span></div>
            <div class="pkg-compare__cell" role="cell">IDR 3.8M</div>
            <div class="pkg-compare__cell" role="cell">IDR 8.7M</div>
            <div class="pkg-compare__cell" role="cell">IDR 20.5M</div>
            <div class="pkg-compare__label" role="rowheader"><span>Guests</span></div>
            <div class="pkg-compare__cell" role="cell">5 included · max 9</div>
            <div class="pkg-compare__cell" role="cell">10 included · max 20</div>
            <div class="pkg-compare__cell" role="cell">20 included · max 35</div>
            <div class="pkg-compare__label" role="rowheader"><span>Duration</span></div>
            <div class="pkg-compare__cell" role="cell">3 hours</div>
            <div class="pkg-compare__cell" role="cell">3 hours</div>
            <div class="pkg-compare__cell" role="cell">3 hours</div>
            <div class="pkg-compare__label" role="rowheader"><span>Cake</span></div>
            <div class="pkg-compare__cell" role="cell">15cm, 2 layers</div>
            <div class="pkg-compare__cell" role="cell">18cm, 2 layers</div>
            <div class="pkg-compare__cell" role="cell">22cm, 2 layers</div>
            <div class="pkg-compare__label" role="rowheader"><span>Food &amp; drink credit</span></div>
            <div class="pkg-compare__cell" role="cell">750k weekday / 1.5M weekend</div>
            <div class="pkg-compare__cell" role="cell">1.5M weekday / 3M weekend</div>
            <div class="pkg-compare__cell" role="cell">3M weekday / 6M weekend</div>
            <div class="pkg-compare__label" role="rowheader"><span>Themed party</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
            <div class="pkg-compare__label" role="rowheader"><span>Table decor</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__label" role="rowheader"><span>Balloon decor</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span> <span class="cmp-note">Simple</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span> <span class="cmp-note">Medium</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span> <span class="cmp-note">Full terrace</span></div>
            <div class="pkg-compare__label" role="rowheader"><span>Photozone</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
            <div class="pkg-compare__label" role="rowheader"><span>Piñata</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
            <div class="pkg-compare__label" role="rowheader"><span>Private terrace</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
            <div class="pkg-compare__label" role="rowheader"><span>Dessert station</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
            <div class="pkg-compare__label" role="rowheader"><span>Masterclass for 10 kids</span></div>
            <div class="pkg-compare__cell pkg-compare__cell--last" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell pkg-compare__cell--last" role="cell"><span class="cmp-mark cmp-mark--no" role="img" aria-label="Not included">✕</span></div>
            <div class="pkg-compare__cell pkg-compare__cell--last" role="cell"><span class="cmp-mark cmp-mark--yes" role="img" aria-label="Included">✓</span></div>
          </div>
        </div>
        <p class="pkg-compare__note">Starting prices exclude 5% service and 10% tax. The food and drink credit is included in the package price. Extra orders are charged from the menu.</p>
      </div>
      <p class="packages__legal" id="packages-legal">Extra guests +150k per person on weekdays, +300k on weekends, up to each package's maximum. Adults and children both count. Every party runs 3 hours. Weekday starting rates shown; weekend rates are higher. Prices exclude 5% service and 10% tax. Custom combinations available on request.</p>
    </section>

    <section class="party-look" id="party-look" aria-labelledby="party-look-heading">
      <div class="party-look__media">
        <img src="<?php echo esc_url($decor . 'terrace.jpg'); ?>" alt="Birthday setup on the Tiny terrace" width="960" height="720" loading="lazy">
      </div>
      <div class="party-look__copy">
        <div class="eyebrow">A real party</div>
        <h2 id="party-look-heading">What your party will look like</h2>
        <p class="party-look__meta">Private terrace event</p>
        <blockquote class="party-look__quote">
          <p>"We celebrated our daughter's 6th birthday on the terrace and it was completely stress-free — decor, cake and entertainment were all handled. The kids were thrilled and didn't want to leave."</p>
          <footer>Anna · birthday on the terrace</footer>
        </blockquote>
      </div>
    </section>

    <section class="pdf-block cake-promo tasting-promo" id="tasting" aria-labelledby="tasting-heading">
      <div class="pdf-block__copy">
        <div class="eyebrow">Free cake tasting</div>
        <h2 id="tasting-heading">Want to try the cake before choosing?</h2>
        <p>Request a cake tasting at Tiny. It is free, with no deposit, and you can cancel any time. Tell us a preferred day and how to reach you. Our team will confirm an appointment — we usually reply within the hour. A request is not a confirmed visit. Your party date can wait if you do not know it yet.</p>
      </div>
      <div class="pdf-card">
        <div class="pdf-card__file">
          <img class="cake-promo__thumb" src="<?php echo esc_url($img . 'pdf-gal-06.webp'); ?>" alt="" width="46" height="58" loading="lazy">
          <div>
            <div class="pdf-card__file-title">Taste first</div>
            <div class="pdf-card__file-meta">Venue tour · cake tasting · tailored quote</div>
          </div>
        </div>
        <div class="cake-promo__actions">
          <a class="btn" href="<?php echo esc_url($wa); ?>" target="_blank" rel="noopener noreferrer" data-wa="tasting_requested">Request a tasting</a>
          <a class="btn btn--outline" href="<?php echo $cakes_gallery; ?>">Browse catalog</a>
        </div>
      </div>
    </section>

    <section class="faq" id="faq">
      <div class="faq__intro">
        <div class="eyebrow">Good to know</div>
        <h2>Frequently asked questions</h2>
        <p>Anything else — just message us on WhatsApp.</p>
      </div>
      <div class="faq__list">
        <?php
        $faq_items = [
            ["What's included in the price?", 'The package cards and the comparison list the differences. The food and drink credit is included in the package price. Anything above that credit is charged from the menu.'],
            ['Is the cake tasting really free?', 'Yes. It is free, with no deposit, and you can cancel any time. We usually reply within the hour. The team confirms the appointment — sending a request does not book the visit.'],
            ['Can you do a specific theme or character?', "Yes. Tell us what your child loves — dinosaurs, unicorns, the sea, or a favourite character — and we build the decor and cake around it."],
            ['Do you offer allergy-friendly cakes?', 'The only gluten-free sponge is Flourless Chocolate Zucchini. No-added-sugar sponges are listed on the cake page. Tell us about other allergies when you message us.'],
            ['How many guests can you host?', 'Packages start from 5 guests and scale up to 35 on the private terrace. Adults and children both count. Extra guests can be added within each package’s maximum — see the notes under Packages.'],
            ['How far in advance should we book?', 'We recommend booking 3–4 weeks ahead for weekend dates. Weekdays are often more flexible — message us with your preferred date and we’ll check availability.'],
            ['Do adults count toward the guest total?', 'Yes. Adults and children both count toward the guests included in a package and toward its maximum.'],
            ['Can we change the guest count or cancel?', 'Party changes need 24 hours’ notice. There is no refund for party cancellations.'],
            ['When is the party confirmed?', 'Sending a request is not a booking. The team confirms availability and the final quote. The party is confirmed only after those steps.'],
        ];
        foreach ($faq_items as $item) :
            ?>
          <div class="faq__item">
            <button class="faq__trigger" type="button" aria-expanded="false">
              <span><?php echo esc_html($item[0]); ?></span>
              <span class="faq__marker" aria-hidden="true">+</span>
            </button>
            <div class="faq__panel"><div class="faq__panel-inner"><p><?php echo esc_html($item[1]); ?></p></div></div>
          </div>
        <?php endforeach; ?>
      </div>
    </section>

    <section class="reviews" id="reviews">
      <div class="reviews__head">
        <h2>What families say</h2>
        <a class="link-text" href="https://maps.app.goo.gl/Sftcte5sWdBqkguJ8" target="_blank" rel="noopener noreferrer">Read all reviews on Google →</a>
      </div>
      <div class="reviews__grid">
        <article class="review-card">
          <span class="stars" aria-hidden="true">★★★★★</span>
          <p>"Tiny offers a warm and welcoming atmosphere perfect for families. The staff are incredibly friendly and patient with kids, and the space feels safe and comfortable for little ones."</p>
          <span class="review-card__by">Mela Resti · Google review</span>
        </article>
        <article class="review-card">
          <span class="stars" aria-hidden="true">★★★★★</span>
          <p>"The unicorn cake was beautiful and actually healthy — gluten-free and no added sugar. Everything was set up perfectly when we arrived. Best birthday decision we made."</p>
          <span class="review-card__by">Olga · mum of two</span>
        </article>
      </div>
      <a class="link-text reviews__google-mobile" href="https://maps.app.goo.gl/Sftcte5sWdBqkguJ8" target="_blank" rel="noopener noreferrer">Read all reviews on Google →</a>
    </section>

    <section class="closing" aria-labelledby="closing-heading">
      <div class="closing__copy">
        <h2 id="closing-heading">Still deciding? Taste first.</h2>
        <p>Request a tasting and the team will confirm a time. We usually reply within the hour.</p>
        <div class="closing__actions">
          <a class="btn btn--lg btn--white" href="<?php echo esc_url($wa); ?>" target="_blank" rel="noopener noreferrer" data-wa="tasting_requested">Request a tasting</a>
          <a class="link-text" href="<?php echo esc_url($wa_q); ?>" target="_blank" rel="noopener noreferrer" data-wa="closing_question">Just have a question? Write to us on WhatsApp</a>
        </div>
      </div>
      <ul class="closing__points">
        <li>Book 3–4 weeks ahead for weekend dates</li>
      </ul>
    </section>

    <div class="mobile-sticky" id="mobile-sticky" aria-label="Quick actions">
      <a class="btn" href="<?php echo $builder_url; ?>">Check your date &amp; estimate</a>
      <a class="btn btn--outline" href="#packages">Compare packages</a>
    </div>
    <div class="pkg-lightbox" id="pkg-lightbox" role="dialog" aria-modal="true" aria-hidden="true" aria-labelledby="pkg-lightbox-name" hidden>
      <button type="button" class="pkg-lightbox__close" aria-label="Close">&times;</button>
      <figure class="pkg-lightbox__panel">
        <img id="pkg-lightbox-img" alt="">
        <figcaption id="pkg-lightbox-name"></figcaption>
      </figure>
    </div>
    <?php
    return ob_get_clean();
}
