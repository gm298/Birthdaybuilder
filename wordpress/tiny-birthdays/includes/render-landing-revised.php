<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_render_landing_revised($attrs = []) {
    $img = tiny_birthdays_asset('birthdays/img/');
    $video = tiny_birthdays_asset('birthdays/video/hero-main-birthday.mp4');
    $builder = tiny_birthdays_page_url('builder');
    $cakes = tiny_birthdays_page_url('cakes');
    $decor = tiny_birthdays_asset('birthdays/builder/img/decor/');
    $cake_imgs = tiny_birthdays_asset('cakes/img/cakes/');
    $wa = tiny_birthdays_wa_tasting();
    $wa_q = tiny_birthdays_wa_question();
    $builder_simple = esc_url(trailingslashit($builder) . '?package=simple');
    $builder_signature = esc_url(trailingslashit($builder) . '?package=signature');
    $builder_terrace = esc_url(trailingslashit($builder) . '?package=terrace');
    $cakes_gallery = esc_url(trailingslashit($cakes) . '#gallery');
    $builder_url = esc_url($builder);

    ob_start();
    ?>
    <section class="hero" aria-label="Hero">
      <div class="hero__copy">
        <div class="eyebrow">Tiny · Kids birthdays in Bali</div>
        <h1>Dream birthday<br>for your child<br><span class="hero__at-tiny">at Tiny</span></h1>
        <p class="hero__sub">Cake, food, decor &amp; entertainment — all on us</p>
        <ul class="hero__checks">
          <li>All-inclusive: decor, cake, food &amp; play</li>
          <li>Any budget · starting from IDR 2.3M</li>
          <li>Private tropical terrace · up to 30 guests</li>
        </ul>
        <div class="hero__actions">
          <a class="btn btn--lg btn--dark" href="#packages">See packages</a>
          <a class="btn btn--lg btn--outline-dark" href="<?php echo $builder_url; ?>">Build your birthday</a>
        </div>
        <p class="hero__note">Free cake tasting — we usually reply within the hour</p>
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
          <div class="eyebrow">The real offer</div>
          <h2>A birthday is three weeks of your life. Here it's one message.</h2>
          <p class="included__lead">Ten things get done for your child's party. Nine of them are ours.</p>
          <ul class="included__list">
            <li>Theme &amp; decor concept</li>
            <li>Balloons &amp; photozone</li>
            <li>Cake, baked here</li>
            <li>Food for kids &amp; adults</li>
            <li>Games &amp; masterclass</li>
            <li>Supervised playground</li>
            <li>Setting up beforehand</li>
            <li>Clearing everything after</li>
          </ul>
          <ul class="included__list-mobile">
            <li>Theme, decor &amp; photozone</li>
            <li>Cake, baked here</li>
            <li>Food for kids &amp; adults</li>
            <li>Games, masterclass, playground</li>
            <li>Setting up and clearing away</li>
          </ul>
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
            <a class="btn btn--lg included__build-cta" href="<?php echo $builder_url; ?>">Build your birthday</a>
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
            <li class="offer-slider__slide is-active"><img src="<?php echo esc_url($img . 'pdf-gal-01.webp'); ?>" alt="Unicorn photozone" width="960" height="640" loading="eager"><span class="offer-slider__caption">Unicorn photozone</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($decor . 'unicorn.jpg'); ?>" alt="Unicorn and rainbow theme" width="960" height="640" loading="lazy"><span class="offer-slider__caption">Theme · unicorn &amp; rainbow</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($decor . 'photozone.jpg'); ?>" alt="Photozone and balloons" width="960" height="640" loading="lazy"><span class="offer-slider__caption">Theme · photozone &amp; balloons</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($decor . 'terrace.jpg'); ?>" alt="Private terrace venue" width="960" height="640" loading="lazy"><span class="offer-slider__caption">Venue · private terrace</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'pdf-gal-06.webp'); ?>" alt="Custom under-the-sea cake" width="960" height="640" loading="lazy"><span class="offer-slider__caption">Cake · under the sea</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($cake_imgs . 'unicorn-meadow.jpg'); ?>" alt="Unicorn meadow cake" width="960" height="640" loading="lazy"><span class="offer-slider__caption">Cake · unicorn meadow</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($cake_imgs . 'dino-meadow.jpg'); ?>" alt="Dino meadow cake" width="960" height="640" loading="lazy"><span class="offer-slider__caption">Cake · dino meadow</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'pdf-gal-04.webp'); ?>" alt="Hands-on kids masterclass" width="960" height="640" loading="lazy"><span class="offer-slider__caption">Masterclass on the terrace</span></li>
            <li class="offer-slider__slide"><img src="<?php echo esc_url($img . 'pdf-gal-11.webp'); ?>" alt="Parent and child celebrating" width="960" height="640" loading="lazy"><span class="offer-slider__caption">Celebrate together</span></li>
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
        <p class="packages__note">Every package includes cake, decor, food and play. Three hours, fully set up before you arrive.</p>
      </div>
      <div class="packages__grid" id="packages-grid" data-wp-managed="1">
        <a class="pkg" href="<?php echo $builder_simple; ?>"><h3>Simple celebration</h3><div class="pkg__guests">5 guests included · add up to 9</div><div class="pkg__price">IDR 2.3M</div><ul class="pkg__features"><li>Birthday cake · 15cm, 2 layers</li><li>Requested themed party</li><li>Table decor (no flowers)</li><li>Simple balloon decor</li><li>Food &amp; play-area deposit</li></ul><div class="pkg__cta">Build with this →</div></a>
        <a class="pkg pkg--featured" href="<?php echo $builder_signature; ?>"><span class="pkg__badge">Most popular</span><h3>Signature themed party</h3><div class="pkg__guests">10 guests included · add up to 20</div><div class="pkg__price">IDR 5.3M</div><ul class="pkg__features"><li>Birthday cake · 18cm, 2 layers</li><li>Requested themed party</li><li>Medium balloon decor</li><li>Photozone</li><li>Food &amp; play-area deposit</li></ul><div class="pkg__cta">Build with this →</div></a>
        <a class="pkg" href="<?php echo $builder_terrace; ?>"><h3>Private terrace event</h3><div class="pkg__guests">20 guests included · add up to 30</div><div class="pkg__price">IDR 12.7M</div><ul class="pkg__features"><li>Whole private terrace</li><li>Full terrace balloon decor</li><li>Photozone &amp; piñata</li><li>Dessert station</li><li>Masterclass for 10 kids</li></ul><div class="pkg__cta">Build with this →</div></a>
      </div>
      <div class="pkg-compact" id="packages-compact">
        <div class="pkg-compact__item is-open is-featured" data-pkg="signature">
          <button type="button" class="pkg-compact__toggle" aria-expanded="true"><span class="pkg-compact__badge">Most popular</span><span class="pkg-compact__name">Signature themed party</span><span class="pkg-compact__price">IDR 5.3M</span></button>
          <div class="pkg-compact__panel"><span class="pkg-compact__summary">10 guests · cake 18cm · themed decor · medium balloons · photozone</span><a class="pkg-compact__cta" href="<?php echo $builder_signature; ?>">Build with this →</a></div>
        </div>
        <div class="pkg-compact__item" data-pkg="simple">
          <button type="button" class="pkg-compact__toggle" aria-expanded="false"><span class="pkg-compact__name">Simple celebration</span><span class="pkg-compact__price">IDR 2.3M</span></button>
          <div class="pkg-compact__panel" hidden><span class="pkg-compact__summary">5 guests · cake 15cm · themed party · table &amp; balloon decor</span><a class="pkg-compact__cta" href="<?php echo $builder_simple; ?>">Build with this →</a></div>
        </div>
        <div class="pkg-compact__item" data-pkg="terrace">
          <button type="button" class="pkg-compact__toggle" aria-expanded="false"><span class="pkg-compact__name">Private terrace event</span><span class="pkg-compact__price">IDR 12.7M</span></button>
          <div class="pkg-compact__panel" hidden><span class="pkg-compact__summary">20 guests · private terrace · photozone · dessert station · masterclass</span><a class="pkg-compact__cta" href="<?php echo $builder_terrace; ?>">Build with this →</a></div>
        </div>
      </div>
      <p class="packages__legal" id="packages-legal">Extra guests +150k per person on weekdays, +300k on weekends, up to each package's maximum. Every party runs 3 hours. Weekday starting rates shown; weekend rates are higher. All prices in IDR, subject to government tax &amp; service. Custom combinations available on request.</p>
    </section>

    <section class="pdf-block cake-promo tasting-promo" id="tasting" aria-labelledby="tasting-heading">
      <div class="pdf-block__copy">
        <div class="eyebrow">Free cake tasting</div>
        <h2 id="tasting-heading">Book a free cake tasting</h2>
        <p>Tour the venue, taste the cake, and walk away with a tailored quote. No deposit, no obligation.</p>
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
          <a class="btn" href="<?php echo esc_url($wa); ?>" target="_blank" rel="noopener noreferrer" data-wa="tasting_book">Book tasting</a>
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
            ["What's included in the price?", 'Every package covers the cake, themed decor, food and play-area access. Larger packages add a photozone, piñata, dessert station and masterclass activities.'],
            ['Is the cake tasting really free?', 'Yes. The cake tasting is free, with no deposit and no obligation to book. Come try the cake, meet the team, and see the terrace.'],
            ['Can you do a specific theme or character?', "Yes. Tell us what your child loves — dinosaurs, unicorns, the sea, or a favourite character — and we build the decor and cake around it."],
            ['Do you offer allergy-friendly cakes?', 'We bake on site and can prepare gluten-free and no-added-sugar options. Share any allergies when you message us so we can plan the right cake.'],
            ['How many guests can you host?', "Packages start from 5 guests and scale up to 30 on the private terrace. Extra guests can be added within each package’s maximum — see the notes under Packages."],
            ['How far in advance should we book?', 'We recommend booking 3–4 weeks ahead for weekend dates. Weekdays are often more flexible — message us with your preferred date and we’ll check availability.'],
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
        <article class="review-card review-card--hide-mobile">
          <span class="stars" aria-hidden="true">★★★★★</span>
          <p>"Tiny offers a warm and welcoming atmosphere perfect for families. The staff are incredibly friendly and patient with kids, and the space feels safe and comfortable for little ones."</p>
          <span class="review-card__by">Mela Resti · Google review</span>
        </article>
        <article class="review-card">
          <span class="stars" aria-hidden="true">★★★★★</span>
          <p>"We celebrated our daughter's 6th birthday on the terrace and it was completely stress-free — decor, cake and entertainment were all handled. The kids were thrilled and didn't want to leave."</p>
          <span class="review-card__by">Anna · birthday on the terrace</span>
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
        <p>Book a free cake tasting, tour the terrace, and walk away with a tailored quote. No deposit, no pressure, no cost.</p>
        <div class="closing__actions">
          <a class="btn btn--lg btn--white" href="<?php echo esc_url($wa); ?>" target="_blank" rel="noopener noreferrer" data-wa="closing_tasting">Book a free cake tasting</a>
          <a class="link-text" href="<?php echo esc_url($wa_q); ?>" target="_blank" rel="noopener noreferrer" data-wa="closing_question">Just have a question? Write to us on WhatsApp</a>
        </div>
      </div>
      <ul class="closing__points">
        <li>Free, no obligation</li>
        <li>Meet the team &amp; see the venue</li>
        <li>Book 3–4 weeks ahead for weekend dates</li>
        <li>No deposit, cancel any time</li>
      </ul>
    </section>

    <div class="mobile-sticky" id="mobile-sticky" aria-label="Quick actions">
      <a class="btn" href="<?php echo $builder_url; ?>">Build your party</a>
      <a class="btn btn--outline" href="<?php echo esc_url($wa); ?>" target="_blank" rel="noopener noreferrer" data-wa="sticky_tasting">Book tasting</a>
    </div>
    <?php
    return ob_get_clean();
}
