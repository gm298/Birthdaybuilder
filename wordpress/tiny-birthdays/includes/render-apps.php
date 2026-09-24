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

function tiny_birthdays_render_events() {
    $hero = 'https://tinyhealthycafe.com/birthdays/builder/img/decor/terrace.jpg';
    return '<div id="events-app" data-hero="' . esc_url($hero) . '"></div>';
}
