<?php
if (!defined('ABSPATH')) {
    exit;
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
