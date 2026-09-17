<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_hero_defaults() {
    $img = tiny_birthdays_asset('birthdays/img/');
    return [
        'eyebrow' => 'Tiny · Kids birthdays in Bali',
        'headline' => 'Where precious<br>moments<br>become<br>memories',
        'sub' => 'All-inclusive celebrations on our private tropical terrace — decor, cake, food &amp; entertainment, up to 30 guests.',
        'checks' => [
            'All-inclusive: decor, cake, food & play',
            'Any budget · starting from IDR 2.3M',
            'Private tropical terrace · up to 30 guests',
        ],
        'primaryLabel' => 'Book a free cake tasting',
        'primaryUrl' => tiny_birthdays_wa_tasting(),
        'secondaryLabel' => "See what's included",
        'secondaryUrl' => '#included',
        'note' => 'Free cake tasting — we usually reply within the hour',
        'rating' => '4.8 on Google Maps · 100+ celebrations hosted',
        'poster' => $img . 'pdf-gal-03.webp',
        'video' => tiny_birthdays_asset('birthdays/video/hero-main-birthday.mp4'),
        'logo' => $img . 'logo-dark.png',
    ];
}

function tiny_birthdays_hero_attributes() {
    $d = tiny_birthdays_hero_defaults();
    return [
        'eyebrow' => tiny_birthdays_string_attr($d['eyebrow']),
        'headline' => tiny_birthdays_string_attr($d['headline']),
        'sub' => tiny_birthdays_string_attr($d['sub']),
        'checks' => tiny_birthdays_array_attr($d['checks']),
        'primaryLabel' => tiny_birthdays_string_attr($d['primaryLabel']),
        'primaryUrl' => tiny_birthdays_string_attr($d['primaryUrl']),
        'secondaryLabel' => tiny_birthdays_string_attr($d['secondaryLabel']),
        'secondaryUrl' => tiny_birthdays_string_attr($d['secondaryUrl']),
        'note' => tiny_birthdays_string_attr($d['note']),
        'rating' => tiny_birthdays_string_attr($d['rating']),
        'poster' => tiny_birthdays_string_attr($d['poster']),
        'video' => tiny_birthdays_string_attr($d['video']),
        'logo' => tiny_birthdays_string_attr($d['logo']),
    ];
}

function tiny_birthdays_render_hero($attrs) {
    $d = tiny_birthdays_hero_defaults();
    $eyebrow = tiny_birthdays_esc(tiny_birthdays_text($attrs, 'eyebrow', $d['eyebrow']));
    $headline = tiny_birthdays_html(tiny_birthdays_text($attrs, 'headline', $d['headline']));
    $sub = tiny_birthdays_html(tiny_birthdays_text($attrs, 'sub', $d['sub']));
    $checks = tiny_birthdays_list($attrs, 'checks', $d['checks']);
    $primary_label = tiny_birthdays_esc(tiny_birthdays_text($attrs, 'primaryLabel', $d['primaryLabel']));
    $primary_url = tiny_birthdays_url_or($attrs['primaryUrl'] ?? '', $d['primaryUrl']);
    $secondary_label = tiny_birthdays_esc(tiny_birthdays_text($attrs, 'secondaryLabel', $d['secondaryLabel']));
    $secondary_url = tiny_birthdays_url_or($attrs['secondaryUrl'] ?? '', $d['secondaryUrl']);
    $note = tiny_birthdays_esc(tiny_birthdays_text($attrs, 'note', $d['note']));
    $rating = tiny_birthdays_esc(tiny_birthdays_text($attrs, 'rating', $d['rating']));
    $poster = tiny_birthdays_url_or($attrs['poster'] ?? '', $d['poster']);
    $video = tiny_birthdays_url_or($attrs['video'] ?? '', $d['video']);
    $logo = tiny_birthdays_url_or($attrs['logo'] ?? '', $d['logo']);
    $secondary_target = strpos($secondary_url, 'http') === 0
        ? ' target="_blank" rel="noopener noreferrer"'
        : '';
    $primary_target = strpos($primary_url, 'wa.me') !== false
        ? ' target="_blank" rel="noopener noreferrer" data-wa="hero_tasting"'
        : '';

    ob_start();
    ?>
    <section class="hero" aria-label="Hero">
      <div class="hero__copy">
        <div class="eyebrow"><?php echo $eyebrow; ?></div>
        <h1><?php echo $headline; ?></h1>
        <p class="hero__sub"><?php echo $sub; ?></p>
        <?php echo tiny_birthdays_li_list($checks, 'hero__checks'); ?>
        <div class="hero__actions">
          <a class="btn btn--lg btn--dark" href="<?php echo $primary_url; ?>"<?php echo $primary_target; ?>><?php echo $primary_label; ?></a>
          <a class="btn btn--lg btn--outline-dark" href="<?php echo $secondary_url; ?>"<?php echo $secondary_target; ?>><?php echo $secondary_label; ?></a>
        </div>
        <p class="hero__note"><?php echo $note; ?></p>
        <div class="hero__rating">
          <span class="stars" aria-hidden="true">★</span>
          <span><?php echo $rating; ?></span>
        </div>
      </div>
      <div class="hero__media">
        <div class="hero__video-card">
          <video id="hero-video-desktop" poster="<?php echo $poster; ?>" playsinline muted loop preload="metadata">
            <source src="<?php echo $video; ?>" type="video/mp4">
          </video>
          <img class="hero__video-logo" src="<?php echo $logo; ?>" alt="" width="36" height="36" aria-hidden="true">
        </div>
      </div>
      <div class="hero__video-mobile-wrap">
        <video id="hero-video-mobile" class="hero__video-mobile" poster="<?php echo $poster; ?>" playsinline muted loop preload="metadata">
          <source src="<?php echo $video; ?>" type="video/mp4">
        </video>
      </div>
    </section>
    <?php
    return ob_get_clean();
}

function tiny_birthdays_included_defaults() {
    return [
        'eyebrow' => 'The real offer',
        'headline' => "A birthday is three weeks of your life. Here it's one message.",
        'lead' => "Ten things get done for your child's party. Nine of them are ours.",
        'items' => [
            'Theme &amp; decor concept',
            'Balloons &amp; photozone',
            'Cake, baked here',
            'Food for kids &amp; adults',
            'Games &amp; masterclass',
            'Supervised playground',
            'Setting up beforehand',
            'Clearing everything after',
        ],
        'itemsMobile' => [
            'Theme, decor &amp; photozone',
            'Cake, baked here',
            'Food for kids &amp; adults',
            'Games, masterclass, playground',
            'Setting up and clearing away',
        ],
        'cardTitle' => 'All you have to do',
        'steps' => [
            'Open the Builder',
            'Fill out your details and pick your package',
            'Arrive 10 minutes early',
        ],
        'footer' => 'Then just be in the photos.',
        'background' => tiny_birthdays_asset('birthdays/img/pdf-gal-06.webp'),
        'backgroundAlt' => 'Kids on the decorated terrace',
    ];
}

function tiny_birthdays_included_attributes() {
    $d = tiny_birthdays_included_defaults();
    return [
        'eyebrow' => tiny_birthdays_string_attr($d['eyebrow']),
        'headline' => tiny_birthdays_string_attr($d['headline']),
        'lead' => tiny_birthdays_string_attr($d['lead']),
        'items' => tiny_birthdays_array_attr($d['items']),
        'itemsMobile' => tiny_birthdays_array_attr($d['itemsMobile']),
        'cardTitle' => tiny_birthdays_string_attr($d['cardTitle']),
        'steps' => tiny_birthdays_array_attr($d['steps']),
        'footer' => tiny_birthdays_string_attr($d['footer']),
        'background' => tiny_birthdays_string_attr($d['background']),
        'backgroundAlt' => tiny_birthdays_string_attr($d['backgroundAlt']),
    ];
}

function tiny_birthdays_render_included($attrs) {
    $d = tiny_birthdays_included_defaults();
    $steps = tiny_birthdays_list($attrs, 'steps', $d['steps']);
    $bg = tiny_birthdays_url_or($attrs['background'] ?? '', $d['background']);
    ob_start();
    ?>
    <section class="included" id="included">
      <img class="included__bg" src="<?php echo $bg; ?>" alt="<?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'backgroundAlt', $d['backgroundAlt'])); ?>" width="1440" height="660" loading="lazy">
      <div class="included__overlay" aria-hidden="true"></div>
      <div class="included__inner">
        <div>
          <div class="eyebrow"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'eyebrow', $d['eyebrow'])); ?></div>
          <h2><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'headline', $d['headline'])); ?></h2>
          <p class="included__lead"><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'lead', $d['lead'])); ?></p>
          <?php echo tiny_birthdays_li_list(tiny_birthdays_list($attrs, 'items', $d['items']), 'included__list'); ?>
          <?php echo tiny_birthdays_li_list(tiny_birthdays_list($attrs, 'itemsMobile', $d['itemsMobile']), 'included__list-mobile'); ?>
        </div>
        <div class="included__card-wrap">
          <div class="included__card">
            <h3><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'cardTitle', $d['cardTitle'])); ?></h3>
            <?php foreach ($steps as $i => $step) : ?>
              <div class="step">
                <span class="step__num"><?php echo esc_html(str_pad((string) ($i + 1), 2, '0', STR_PAD_LEFT)); ?></span>
                <div>
                  <div class="step__title"><?php echo tiny_birthdays_html($step); ?></div>
                </div>
              </div>
            <?php endforeach; ?>
            <div class="included__card-footer"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'footer', $d['footer'])); ?></div>
          </div>
        </div>
      </div>
    </section>
    <?php
    return ob_get_clean();
}

function tiny_birthdays_gallery_defaults() {
    $img = tiny_birthdays_asset('birthdays/img/');
    return [
        'images' => [
            ['url' => $img . 'pdf-gal-01.webp', 'alt' => 'Unicorn photozone'],
            ['url' => $img . 'pdf-gal-06.webp', 'alt' => 'Custom under-the-sea cake'],
            ['url' => $img . 'pdf-gal-04.webp', 'alt' => 'Hands-on kids masterclass'],
            ['url' => $img . 'pdf-gal-11.webp', 'alt' => 'Parent and child celebrating'],
        ],
    ];
}

function tiny_birthdays_gallery_attributes() {
    return [
        'images' => tiny_birthdays_array_attr(tiny_birthdays_gallery_defaults()['images'], 'object'),
    ];
}

function tiny_birthdays_render_gallery($attrs) {
    $images = tiny_birthdays_list($attrs, 'images', tiny_birthdays_gallery_defaults()['images']);
    ob_start();
    echo '<section class="gallery" id="gallery" aria-label="Gallery">';
    foreach ($images as $image) {
        $url = is_array($image) ? ($image['url'] ?? '') : $image;
        $alt = is_array($image) ? ($image['alt'] ?? '') : '';
        if (!$url) {
            continue;
        }
        echo '<img src="' . esc_url($url) . '" alt="' . tiny_birthdays_esc($alt) . '" width="360" height="250" loading="lazy">';
    }
    echo '</section>';
    return ob_get_clean();
}

function tiny_birthdays_reviews_defaults() {
    return [
        'headline' => 'What families say',
        'googleLabel' => 'Read all reviews on Google →',
        'googleUrl' => 'https://maps.app.goo.gl/Sftcte5sWdBqkguJ8',
        'items' => [
            [
                'quote' => '"Tiny offers a warm and welcoming atmosphere perfect for families. The staff are incredibly friendly and patient with kids, and the space feels safe and comfortable for little ones."',
                'by' => 'Mela Resti · Google review',
                'hideMobile' => true,
            ],
            [
                'quote' => '"We celebrated our daughter\'s 6th birthday on the terrace and it was completely stress-free — decor, cake and entertainment were all handled. The kids were thrilled and didn\'t want to leave."',
                'by' => 'Anna · birthday on the terrace',
                'hideMobile' => false,
            ],
            [
                'quote' => '"The unicorn cake was beautiful and actually healthy — gluten-free and no added sugar. Everything was set up perfectly when we arrived. Best birthday decision we made."',
                'by' => 'Olga · mum of two',
                'hideMobile' => false,
            ],
        ],
    ];
}

function tiny_birthdays_reviews_attributes() {
    $d = tiny_birthdays_reviews_defaults();
    return [
        'headline' => tiny_birthdays_string_attr($d['headline']),
        'googleLabel' => tiny_birthdays_string_attr($d['googleLabel']),
        'googleUrl' => tiny_birthdays_string_attr($d['googleUrl']),
        'items' => tiny_birthdays_array_attr($d['items'], 'object'),
    ];
}

function tiny_birthdays_render_reviews($attrs) {
    $d = tiny_birthdays_reviews_defaults();
    $items = tiny_birthdays_list($attrs, 'items', $d['items']);
    $google = tiny_birthdays_url_or($attrs['googleUrl'] ?? '', $d['googleUrl']);
    $label = tiny_birthdays_esc(tiny_birthdays_text($attrs, 'googleLabel', $d['googleLabel']));
    ob_start();
    ?>
    <section class="reviews" id="reviews">
      <div class="reviews__head">
        <h2><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'headline', $d['headline'])); ?></h2>
        <a class="link-text" href="<?php echo $google; ?>" target="_blank" rel="noopener noreferrer"><?php echo $label; ?></a>
      </div>
      <div class="reviews__grid">
        <?php foreach ($items as $item) :
            $class = 'review-card';
            if (!empty($item['hideMobile'])) {
                $class .= ' review-card--hide-mobile';
            }
            ?>
          <article class="<?php echo esc_attr($class); ?>">
            <span class="stars" aria-hidden="true">★★★★★</span>
            <p><?php echo tiny_birthdays_html($item['quote'] ?? ''); ?></p>
            <span class="review-card__by"><?php echo tiny_birthdays_esc($item['by'] ?? ''); ?></span>
          </article>
        <?php endforeach; ?>
      </div>
      <a class="link-text reviews__google-mobile" href="<?php echo $google; ?>" target="_blank" rel="noopener noreferrer"><?php echo $label; ?></a>
    </section>
    <?php
    return ob_get_clean();
}

function tiny_birthdays_packages_defaults() {
    $builder = tiny_birthdays_page_url('builder');
    return [
        'eyebrow' => 'Three ways to celebrate',
        'headline' => 'One price, everything handled',
        'note' => 'Every package includes cake, decor, food and play. Three hours, fully set up before you arrive.',
        'legal' => "Extra guests +150k per person on weekdays, +300k on weekends, up to each package's maximum. Every party runs 3 hours. Weekday starting rates shown; weekend rates are higher. All prices in IDR, subject to government tax &amp; service. Custom combinations available on request.",
        'legalMobile' => 'Extra guests +150k weekdays / +300k weekends. Every party runs 3 hours, subject to tax &amp; service.',
        'cta' => 'Build with this →',
        'packages' => [
            [
                'id' => 'simple',
                'name' => 'Simple celebration',
                'shortName' => 'Simple celebration',
                'guests' => '5 guests included · add up to 9',
                'price' => 'IDR 2.3M',
                'featured' => false,
                'badge' => '',
                'features' => [
                    'Birthday cake · 15cm, 2 layers',
                    'Requested themed party',
                    'Table decor (no flowers)',
                    'Simple balloon decor',
                    'Food & play-area deposit',
                ],
                'mobileSummary' => '5 guests · cake 15cm · themed party · table & balloon decor',
            ],
            [
                'id' => 'signature',
                'name' => 'Signature themed party',
                'shortName' => 'Signature themed party',
                'guests' => '10 guests included · add up to 20',
                'price' => 'IDR 5.3M',
                'featured' => true,
                'badge' => 'Most popular',
                'features' => [
                    'Birthday cake · 18cm, 2 layers',
                    'Requested themed party',
                    'Medium balloon decor',
                    'Photozone',
                    'Food & play-area deposit',
                ],
                'mobileSummary' => '10 guests · cake 18cm · themed decor · medium balloons · photozone',
            ],
            [
                'id' => 'terrace',
                'name' => 'Private terrace event',
                'shortName' => 'Private terrace',
                'guests' => '20 guests included · add up to 30',
                'price' => 'IDR 12.7M',
                'featured' => false,
                'badge' => '',
                'features' => [
                    'Whole private terrace',
                    'Full terrace balloon decor',
                    'Photozone & piñata',
                    'Dessert station',
                    'Masterclass for 10 kids',
                ],
                'mobileSummary' => '20 guests · private terrace · photozone · dessert station · masterclass',
            ],
        ],
        'builderUrl' => $builder,
    ];
}

function tiny_birthdays_packages_attributes() {
    $d = tiny_birthdays_packages_defaults();
    return [
        'eyebrow' => tiny_birthdays_string_attr($d['eyebrow']),
        'headline' => tiny_birthdays_string_attr($d['headline']),
        'note' => tiny_birthdays_string_attr($d['note']),
        'legal' => tiny_birthdays_string_attr($d['legal']),
        'legalMobile' => tiny_birthdays_string_attr($d['legalMobile']),
        'cta' => tiny_birthdays_string_attr($d['cta']),
        'packages' => tiny_birthdays_array_attr($d['packages'], 'object'),
    ];
}

function tiny_birthdays_package_href($pkg) {
    $base = tiny_birthdays_page_url('builder');
    $id = isset($pkg['id']) ? $pkg['id'] : '';
    $sep = (strpos($base, '?') === false) ? (substr($base, -1) === '/' ? '?' : '/?') : '&';
    if (substr($base, -1) === '/' && $sep === '/?') {
        $sep = '?';
    }
    $href = rtrim($base, '/') . '/?package=' . rawurlencode($id);
    return esc_url($href);
}

function tiny_birthdays_render_packages($attrs) {
    $d = tiny_birthdays_packages_defaults();
    $packages = tiny_birthdays_list($attrs, 'packages', $d['packages']);
    $cta = tiny_birthdays_esc(tiny_birthdays_text($attrs, 'cta', $d['cta']));
    $featured = null;
    foreach ($packages as $pkg) {
        if (!empty($pkg['featured'])) {
            $featured = $pkg;
            break;
        }
    }
    $compact = $packages;
    if ($featured) {
        $compact = array_values(array_filter($packages, function ($pkg) use ($featured) {
            return ($pkg['id'] ?? '') !== ($featured['id'] ?? '');
        }));
        array_unshift($compact, $featured);
    }
    ob_start();
    ?>
    <section class="packages" id="packages">
      <div class="packages__head">
        <div>
          <div class="eyebrow"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'eyebrow', $d['eyebrow'])); ?></div>
          <h2><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'headline', $d['headline'])); ?></h2>
        </div>
        <p class="packages__note"><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'note', $d['note'])); ?></p>
      </div>
      <div class="packages__grid" id="packages-grid" data-wp-managed="1">
        <?php foreach ($packages as $pkg) :
            $class = 'pkg' . (!empty($pkg['featured']) ? ' pkg--featured' : '');
            ?>
          <a class="<?php echo esc_attr($class); ?>" href="<?php echo tiny_birthdays_package_href($pkg); ?>">
            <?php if (!empty($pkg['featured'])) : ?>
              <span class="pkg__badge"><?php echo tiny_birthdays_esc($pkg['badge'] ?? 'Most popular'); ?></span>
            <?php endif; ?>
            <h3><?php echo tiny_birthdays_esc($pkg['name'] ?? ''); ?></h3>
            <div class="pkg__guests"><?php echo tiny_birthdays_esc($pkg['guests'] ?? ''); ?></div>
            <div class="pkg__price"><?php echo tiny_birthdays_esc($pkg['price'] ?? ''); ?></div>
            <?php echo tiny_birthdays_li_list($pkg['features'] ?? [], 'pkg__features'); ?>
            <div class="pkg__cta"><?php echo $cta; ?></div>
          </a>
        <?php endforeach; ?>
      </div>
      <div class="pkg-compact" id="packages-compact">
        <?php foreach ($compact as $index => $pkg) :
            $open = $index === 0;
            $item_class = 'pkg-compact__item' . ($open ? ' is-open' : '') . (!empty($pkg['featured']) ? ' is-featured' : '');
            ?>
          <div class="<?php echo esc_attr($item_class); ?>" data-pkg="<?php echo esc_attr($pkg['id'] ?? ''); ?>">
            <button type="button" class="pkg-compact__toggle" aria-expanded="<?php echo $open ? 'true' : 'false'; ?>">
              <?php if (!empty($pkg['featured'])) : ?>
                <span class="pkg-compact__badge"><?php echo tiny_birthdays_esc($pkg['badge'] ?? 'Most popular'); ?></span>
              <?php endif; ?>
              <span class="pkg-compact__name"><?php echo tiny_birthdays_esc($pkg['shortName'] ?? $pkg['name'] ?? ''); ?></span>
              <span class="pkg-compact__price"><?php echo tiny_birthdays_esc($pkg['price'] ?? ''); ?></span>
            </button>
            <div class="pkg-compact__panel"<?php echo $open ? '' : ' hidden'; ?>>
              <span class="pkg-compact__summary"><?php echo tiny_birthdays_esc($pkg['mobileSummary'] ?? ''); ?></span>
              <a class="pkg-compact__cta" href="<?php echo tiny_birthdays_package_href($pkg); ?>"><?php echo $cta; ?></a>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
      <p class="packages__legal" id="packages-legal" data-legal="<?php echo esc_attr(wp_strip_all_tags(html_entity_decode(tiny_birthdays_text($attrs, 'legal', $d['legal']), ENT_QUOTES, 'UTF-8'))); ?>" data-legal-mobile="<?php echo esc_attr(wp_strip_all_tags(html_entity_decode(tiny_birthdays_text($attrs, 'legalMobile', $d['legalMobile']), ENT_QUOTES, 'UTF-8'))); ?>"><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'legal', $d['legal'])); ?></p>
    </section>
    <?php
    return ob_get_clean();
}

function tiny_birthdays_cake_promo_defaults() {
    $cakes = tiny_birthdays_page_url('cakes');
    return [
        'eyebrow' => 'Just want a cake?',
        'headline' => 'Build a custom birthday cake or choose from our catalog',
        'copy' => 'Not planning a full party? Pick a design from our gallery or build your own flavour, size and theme.',
        'cardTitle' => 'Custom birthday cakes',
        'cardMeta' => 'Build your own · or pick from the gallery',
        'thumb' => tiny_birthdays_asset('birthdays/img/pdf-gal-06.webp'),
        'buildLabel' => 'Build your cake',
        'buildUrl' => $cakes . '#build',
        'browseLabel' => 'Browse catalog',
        'browseUrl' => $cakes . '#gallery',
    ];
}

function tiny_birthdays_cake_promo_attributes() {
    $d = tiny_birthdays_cake_promo_defaults();
    return [
        'eyebrow' => tiny_birthdays_string_attr($d['eyebrow']),
        'headline' => tiny_birthdays_string_attr($d['headline']),
        'copy' => tiny_birthdays_string_attr($d['copy']),
        'cardTitle' => tiny_birthdays_string_attr($d['cardTitle']),
        'cardMeta' => tiny_birthdays_string_attr($d['cardMeta']),
        'thumb' => tiny_birthdays_string_attr($d['thumb']),
        'buildLabel' => tiny_birthdays_string_attr($d['buildLabel']),
        'buildUrl' => tiny_birthdays_string_attr($d['buildUrl']),
        'browseLabel' => tiny_birthdays_string_attr($d['browseLabel']),
        'browseUrl' => tiny_birthdays_string_attr($d['browseUrl']),
    ];
}

function tiny_birthdays_render_cake_promo($attrs) {
    $d = tiny_birthdays_cake_promo_defaults();
    ob_start();
    ?>
    <section class="pdf-block cake-promo" id="cakes-only" aria-labelledby="cakes-only-heading">
      <div class="pdf-block__copy">
        <div class="eyebrow"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'eyebrow', $d['eyebrow'])); ?></div>
        <h2 id="cakes-only-heading"><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'headline', $d['headline'])); ?></h2>
        <p><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'copy', $d['copy'])); ?></p>
      </div>
      <div class="pdf-card">
        <div class="pdf-card__file">
          <img class="cake-promo__thumb" src="<?php echo tiny_birthdays_url_or($attrs['thumb'] ?? '', $d['thumb']); ?>" alt="" width="46" height="58" loading="lazy">
          <div>
            <div class="pdf-card__file-title"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'cardTitle', $d['cardTitle'])); ?></div>
            <div class="pdf-card__file-meta"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'cardMeta', $d['cardMeta'])); ?></div>
          </div>
        </div>
        <div class="cake-promo__actions">
          <a class="btn" href="<?php echo tiny_birthdays_url_or($attrs['buildUrl'] ?? '', $d['buildUrl']); ?>"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'buildLabel', $d['buildLabel'])); ?></a>
          <a class="btn btn--outline" href="<?php echo tiny_birthdays_url_or($attrs['browseUrl'] ?? '', $d['browseUrl']); ?>"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'browseLabel', $d['browseLabel'])); ?></a>
        </div>
      </div>
    </section>
    <?php
    return ob_get_clean();
}

function tiny_birthdays_faq_defaults() {
    return [
        'eyebrow' => 'Good to know',
        'headline' => 'Frequently asked questions',
        'intro' => 'Anything else — just message us on WhatsApp.',
        'items' => [
            [
                'question' => "What's included in the price?",
                'answer' => 'Every package covers the cake, themed decor, food and play-area access. Larger packages add a photozone, piñata, dessert station and masterclass activities.',
            ],
            [
                'question' => 'Is the cake tasting really free?',
                'answer' => 'Yes. The cake tasting is free, with no deposit and no obligation to book. Come try the cake, meet the team, and see the terrace.',
            ],
            [
                'question' => 'Can you do a specific theme or character?',
                'answer' => "Yes. Tell us what your child loves — dinosaurs, unicorns, the sea, or a favourite character — and we build the decor and cake around it.",
            ],
            [
                'question' => 'Do you offer allergy-friendly cakes?',
                'answer' => 'We bake on site and can prepare gluten-free and no-added-sugar options. Share any allergies when you message us so we can plan the right cake.',
            ],
            [
                'question' => 'How many guests can you host?',
                'answer' => 'Packages start from 5 guests and scale up to 30 on the private terrace. Extra guests can be added within each package’s maximum — see the notes under Packages.',
            ],
            [
                'question' => 'How far in advance should we book?',
                'answer' => 'We recommend booking 3–4 weeks ahead for weekend dates. Weekdays are often more flexible — message us with your preferred date and we’ll check availability.',
            ],
        ],
    ];
}

function tiny_birthdays_faq_attributes() {
    $d = tiny_birthdays_faq_defaults();
    return [
        'eyebrow' => tiny_birthdays_string_attr($d['eyebrow']),
        'headline' => tiny_birthdays_string_attr($d['headline']),
        'intro' => tiny_birthdays_string_attr($d['intro']),
        'items' => tiny_birthdays_array_attr($d['items'], 'object'),
    ];
}

function tiny_birthdays_render_faq($attrs) {
    $d = tiny_birthdays_faq_defaults();
    $items = tiny_birthdays_list($attrs, 'items', $d['items']);
    ob_start();
    ?>
    <section class="faq" id="faq">
      <div class="faq__intro">
        <div class="eyebrow"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'eyebrow', $d['eyebrow'])); ?></div>
        <h2><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'headline', $d['headline'])); ?></h2>
        <p><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'intro', $d['intro'])); ?></p>
      </div>
      <div class="faq__list">
        <?php foreach ($items as $i => $item) :
            $open = $i === 0;
            ?>
          <div class="faq__item<?php echo $open ? ' is-open' : ''; ?>">
            <button class="faq__trigger" type="button" aria-expanded="<?php echo $open ? 'true' : 'false'; ?>">
              <span><?php echo tiny_birthdays_esc($item['question'] ?? ''); ?></span>
              <span class="faq__marker" aria-hidden="true"><?php echo $open ? '–' : '+'; ?></span>
            </button>
            <div class="faq__panel">
              <div class="faq__panel-inner">
                <p><?php echo tiny_birthdays_html($item['answer'] ?? ''); ?></p>
              </div>
            </div>
          </div>
        <?php endforeach; ?>
      </div>
    </section>
    <?php
    return ob_get_clean();
}

function tiny_birthdays_closing_defaults() {
    return [
        'headline' => 'Still deciding? Taste first.',
        'copy' => 'Book a free cake tasting, tour the terrace, and walk away with a tailored quote. No deposit, no pressure, no cost.',
        'primaryLabel' => 'Book a free cake tasting',
        'primaryUrl' => tiny_birthdays_wa_tasting(),
        'secondaryLabel' => 'Just have a question? Write to us on WhatsApp',
        'secondaryUrl' => tiny_birthdays_wa_question(),
        'points' => [
            'Free, no obligation',
            'Meet the team &amp; see the venue',
            'Book 3–4 weeks ahead for weekend dates',
            'No deposit, cancel any time',
        ],
    ];
}

function tiny_birthdays_closing_attributes() {
    $d = tiny_birthdays_closing_defaults();
    return [
        'headline' => tiny_birthdays_string_attr($d['headline']),
        'copy' => tiny_birthdays_string_attr($d['copy']),
        'primaryLabel' => tiny_birthdays_string_attr($d['primaryLabel']),
        'primaryUrl' => tiny_birthdays_string_attr($d['primaryUrl']),
        'secondaryLabel' => tiny_birthdays_string_attr($d['secondaryLabel']),
        'secondaryUrl' => tiny_birthdays_string_attr($d['secondaryUrl']),
        'points' => tiny_birthdays_array_attr($d['points']),
    ];
}

function tiny_birthdays_render_closing($attrs) {
    $d = tiny_birthdays_closing_defaults();
    $primary = tiny_birthdays_url_or($attrs['primaryUrl'] ?? '', $d['primaryUrl']);
    $secondary = tiny_birthdays_url_or($attrs['secondaryUrl'] ?? '', $d['secondaryUrl']);
    ob_start();
    ?>
    <section class="closing" aria-labelledby="closing-heading">
      <div class="closing__copy">
        <h2 id="closing-heading"><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'headline', $d['headline'])); ?></h2>
        <p><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'copy', $d['copy'])); ?></p>
        <div class="closing__actions">
          <a class="btn btn--lg btn--white" href="<?php echo $primary; ?>" target="_blank" rel="noopener noreferrer" data-wa="closing_tasting"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'primaryLabel', $d['primaryLabel'])); ?></a>
          <a class="link-text" href="<?php echo $secondary; ?>" target="_blank" rel="noopener noreferrer" data-wa="closing_question"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'secondaryLabel', $d['secondaryLabel'])); ?></a>
        </div>
      </div>
      <?php echo tiny_birthdays_li_list(tiny_birthdays_list($attrs, 'points', $d['points']), 'closing__points'); ?>
    </section>
    <?php
    return ob_get_clean();
}

function tiny_birthdays_sticky_defaults() {
    return [
        'variant' => 'landing',
        'primaryLabel' => 'Build your party',
        'primaryUrl' => tiny_birthdays_page_url('builder'),
        'secondaryLabel' => 'Book tasting',
        'secondaryUrl' => tiny_birthdays_wa_tasting(),
    ];
}

function tiny_birthdays_sticky_attributes() {
    $d = tiny_birthdays_sticky_defaults();
    return [
        'variant' => tiny_birthdays_string_attr($d['variant']),
        'primaryLabel' => tiny_birthdays_string_attr($d['primaryLabel']),
        'primaryUrl' => tiny_birthdays_string_attr($d['primaryUrl']),
        'secondaryLabel' => tiny_birthdays_string_attr($d['secondaryLabel']),
        'secondaryUrl' => tiny_birthdays_string_attr($d['secondaryUrl']),
    ];
}

function tiny_birthdays_render_sticky($attrs) {
    $d = tiny_birthdays_sticky_defaults();
    $variant = tiny_birthdays_text($attrs, 'variant', 'landing');
    if ($variant === 'cakes') {
        $primary_label = tiny_birthdays_text($attrs, 'primaryLabel', 'Make your own cake');
        $primary_url = tiny_birthdays_text($attrs, 'primaryUrl', '#build');
        $secondary_label = tiny_birthdays_text($attrs, 'secondaryLabel', 'Gallery');
        $secondary_url = tiny_birthdays_text($attrs, 'secondaryUrl', '#gallery');
        $secondary_extra = '';
        $primary_extra = '';
    } else {
        $primary_label = tiny_birthdays_text($attrs, 'primaryLabel', $d['primaryLabel']);
        $primary_url = tiny_birthdays_text($attrs, 'primaryUrl', $d['primaryUrl']);
        $secondary_label = tiny_birthdays_text($attrs, 'secondaryLabel', $d['secondaryLabel']);
        $secondary_url = tiny_birthdays_text($attrs, 'secondaryUrl', $d['secondaryUrl']);
        $primary_extra = '';
        $secondary_extra = ' target="_blank" rel="noopener noreferrer" data-wa="sticky_tasting"';
    }
    ob_start();
    ?>
    <div class="mobile-sticky" id="mobile-sticky" aria-label="Quick actions">
      <a class="btn" href="<?php echo esc_url($primary_url); ?>"<?php echo $primary_extra; ?>><?php echo tiny_birthdays_esc($primary_label); ?></a>
      <a class="btn btn--outline" href="<?php echo esc_url($secondary_url); ?>"<?php echo $secondary_extra; ?>><?php echo tiny_birthdays_esc($secondary_label); ?></a>
    </div>
    <?php
    return ob_get_clean();
}

function tiny_birthdays_cakes_hero_defaults() {
    $img = tiny_birthdays_asset('cakes/img/photos/');
    return [
        'eyebrow' => 'Cakes at Tiny · Berawa, Bali',
        'headline' => "The cake they'll remember longer than the presents",
        'sub' => "Baked here, decorated around your child's favourite thing. Any cake can be made gluten-free or with no added sugar as a paid add-on.",
        'primaryLabel' => 'Make your own cake',
        'primaryUrl' => '#build',
        'secondaryLabel' => 'See the cakes',
        'secondaryUrl' => '#gallery',
        'image' => $img . 'hero-candles-wide.jpg',
        'imageAlt' => 'A family lighting the candles on a Tiny birthday cake',
        'inset' => $img . 'hero-cutting.jpg',
        'insetAlt' => 'Cutting the first slice',
    ];
}

function tiny_birthdays_cakes_hero_attributes() {
    $d = tiny_birthdays_cakes_hero_defaults();
    return [
        'eyebrow' => tiny_birthdays_string_attr($d['eyebrow']),
        'headline' => tiny_birthdays_string_attr($d['headline']),
        'sub' => tiny_birthdays_string_attr($d['sub']),
        'primaryLabel' => tiny_birthdays_string_attr($d['primaryLabel']),
        'primaryUrl' => tiny_birthdays_string_attr($d['primaryUrl']),
        'secondaryLabel' => tiny_birthdays_string_attr($d['secondaryLabel']),
        'secondaryUrl' => tiny_birthdays_string_attr($d['secondaryUrl']),
        'image' => tiny_birthdays_string_attr($d['image']),
        'imageAlt' => tiny_birthdays_string_attr($d['imageAlt']),
        'inset' => tiny_birthdays_string_attr($d['inset']),
        'insetAlt' => tiny_birthdays_string_attr($d['insetAlt']),
    ];
}

function tiny_birthdays_render_cakes_hero($attrs) {
    $d = tiny_birthdays_cakes_hero_defaults();
    $image = tiny_birthdays_url_or($attrs['image'] ?? '', $d['image']);
    $inset = tiny_birthdays_url_or($attrs['inset'] ?? '', $d['inset']);
    ob_start();
    ?>
    <section class="hero" aria-label="Hero">
      <div class="hero__copy">
        <div class="eyebrow"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'eyebrow', $d['eyebrow'])); ?></div>
        <h1><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'headline', $d['headline'])); ?></h1>
        <p class="hero__sub"><?php echo tiny_birthdays_html(tiny_birthdays_text($attrs, 'sub', $d['sub'])); ?></p>
        <div class="hero__actions">
          <a class="btn btn--lg" href="<?php echo tiny_birthdays_url_or($attrs['primaryUrl'] ?? '', $d['primaryUrl']); ?>"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'primaryLabel', $d['primaryLabel'])); ?></a>
          <a class="link-text" href="<?php echo tiny_birthdays_url_or($attrs['secondaryUrl'] ?? '', $d['secondaryUrl']); ?>"><?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'secondaryLabel', $d['secondaryLabel'])); ?></a>
        </div>
      </div>
      <div class="hero__media">
        <img src="<?php echo $image; ?>" alt="<?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'imageAlt', $d['imageAlt'])); ?>" width="760" height="720">
        <div class="hero__inset">
          <img src="<?php echo $inset; ?>" alt="<?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'insetAlt', $d['insetAlt'])); ?>" width="250" height="310">
        </div>
      </div>
      <img class="hero__media-mobile" src="<?php echo $image; ?>" alt="<?php echo tiny_birthdays_esc(tiny_birthdays_text($attrs, 'imageAlt', $d['imageAlt'])); ?>" width="390" height="320">
    </section>
    <?php
    return ob_get_clean();
}

function tiny_birthdays_cakes_facts_defaults() {
    return [
        'items' => [
            ['title' => 'Baked here', 'text' => 'fresh, in our own kitchen'],
            ['title' => 'Any theme', 'text' => "send a picture, we'll match it"],
            ['title' => 'Gluten-free', 'text' => 'and no added sugar — a paid add-on'],
            ['title' => '2 days', 'text' => 'notice is all we need'],
        ],
    ];
}

function tiny_birthdays_cakes_facts_attributes() {
    return [
        'items' => tiny_birthdays_array_attr(tiny_birthdays_cakes_facts_defaults()['items'], 'object'),
    ];
}

function tiny_birthdays_render_cakes_facts($attrs) {
    $items = tiny_birthdays_list($attrs, 'items', tiny_birthdays_cakes_facts_defaults()['items']);
    ob_start();
    echo '<section class="facts" aria-label="Cake facts">';
    foreach ($items as $item) {
        echo '<div class="facts__cell"><strong>' . tiny_birthdays_esc($item['title'] ?? '') . '</strong><span>' . tiny_birthdays_esc($item['text'] ?? '') . '</span></div>';
    }
    echo '</section>';
    return ob_get_clean();
}
