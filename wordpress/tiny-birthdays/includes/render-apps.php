<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_cake_app_attributes() {
    return [
        'galleryHeadline' => tiny_birthdays_string_attr('Cakes we bake'),
        'eyebrow' => tiny_birthdays_string_attr('Build your cake'),
        'headline' => tiny_birthdays_string_attr('Make your own cake'),
        'copy' => tiny_birthdays_string_attr('Size, sponge flavours and a design — either one of ours or your own photo. It all goes to our WhatsApp in one message.'),
    ];
}

function tiny_birthdays_render_party_builder() {
    ob_start();
    include TINY_BIRTHDAYS_DIR . 'templates/partials/party-builder.php';
    return ob_get_clean();
}

function tiny_birthdays_render_cake_app($attrs) {
    $gallery_headline = tiny_birthdays_text($attrs, 'galleryHeadline', 'Cakes we bake');
    $eyebrow = tiny_birthdays_text($attrs, 'eyebrow', 'Build your cake');
    $headline = tiny_birthdays_text($attrs, 'headline', 'Make your own cake');
    $copy = tiny_birthdays_text($attrs, 'copy', 'Size, sponge flavours and a design — either one of ours or your own photo. It all goes to our WhatsApp in one message.');
    $birthdays_url = tiny_birthdays_page_url('landing');
    ob_start();
    include TINY_BIRTHDAYS_DIR . 'templates/partials/cake-app.php';
    return ob_get_clean();
}

function tiny_birthdays_render_reserve() {
    ob_start();
    include TINY_BIRTHDAYS_DIR . 'templates/partials/reserve.php';
    return ob_get_clean();
}

function tiny_birthdays_render_booking() {
    ob_start();
    include TINY_BIRTHDAYS_DIR . 'templates/partials/booking.php';
    return ob_get_clean();
}

function tiny_birthdays_render_location() {
    ob_start();
    include TINY_BIRTHDAYS_DIR . 'templates/partials/location.php';
    return tiny_birthdays_link_static_pages(ob_get_clean());
}

function tiny_birthdays_render_menu() {
    ob_start();
    include TINY_BIRTHDAYS_DIR . 'templates/partials/menu.php';
    $html = str_replace('href="pdf/', 'href="' . esc_url(tiny_birthdays_asset('menu/pdf/')), ob_get_clean());
    return tiny_birthdays_link_static_pages($html);
}

/** Swap the static site's relative page links (../reserve/ etc.) for WordPress page URLs. */
function tiny_birthdays_link_static_pages($html) {
    $pages = [
        'birthdays' => 'landing',
        'cakes' => 'cakes',
        'events' => 'events',
        'reserve' => 'reserve',
        'menu' => 'menu',
        'location' => 'location',
    ];
    return preg_replace_callback('#href="\.\./(birthdays|cakes|events|reserve|menu|location)/"#', function ($m) use ($pages) {
        return 'href="' . esc_url(tiny_birthdays_page_url($pages[$m[1]])) . '"';
    }, $html);
}

function tiny_birthdays_render_events() {
    $hero = 'https://tinyhealthycafe.com/birthdays/builder/img/decor/terrace.jpg';
    $video = tiny_birthdays_asset('events/video/cooking-class.mp4');
    $logo = tiny_birthdays_asset('birthdays/img/logo-dark.png');
    return '<div id="events-app" data-hero="' . esc_url($hero) . '" data-video="' . esc_url($video) . '" data-logo="' . esc_url($logo) . '"></div>';
}
