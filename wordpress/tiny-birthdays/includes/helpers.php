<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_asset($relative) {
    $relative = ltrim(str_replace('\\', '/', $relative), '/');
    return TINY_BIRTHDAYS_URL . 'assets/' . $relative;
}

function tiny_birthdays_canvas_type($post_id = 0) {
    $post_id = $post_id ? (int) $post_id : (int) get_queried_object_id();
    if (!$post_id) {
        return '';
    }
    $type = get_post_meta($post_id, TINY_BIRTHDAYS_META, true);
    return in_array($type, ['landing', 'landing-revised', 'builder', 'cakes', 'events'], true) ? $type : '';
}

function tiny_birthdays_is_canvas($post_id = 0) {
    return (bool) tiny_birthdays_canvas_type($post_id);
}

function tiny_birthdays_page_id($type) {
    $pages = get_option('tiny_birthdays_pages', []);
    return isset($pages[$type]) ? (int) $pages[$type] : 0;
}

function tiny_birthdays_page_url($type) {
    $id = tiny_birthdays_page_id($type);
    if ($id) {
        $link = get_permalink($id);
        if ($link) {
            return $link;
        }
    }
    $map = [
        'landing' => home_url('/birthdays/'),
        'landing-revised' => home_url('/birthdays/about-birthdays-revised/'),
        'builder' => home_url('/birthdays/builder/'),
        'cakes' => home_url('/cakes/'),
        'events' => home_url('/events/'),
    ];
    return $map[$type] ?? home_url('/');
}

function tiny_birthdays_wa_tasting() {
    return 'https://wa.me/6282147830142?text=' . rawurlencode("Hi Tiny! I'd like to book a free cake tasting.");
}

function tiny_birthdays_wa_question() {
    return 'https://wa.me/6282147830142?text=' . rawurlencode('Hi Tiny! I have a question about birthday packages.');
}

function tiny_birthdays_text($attrs, $key, $default = '') {
    if (!isset($attrs[$key])) {
        return $default;
    }
    $value = $attrs[$key];
    if ($value === null || $value === '') {
        return $default;
    }
    return $value;
}

function tiny_birthdays_list($attrs, $key, $default) {
    if (empty($attrs[$key]) || !is_array($attrs[$key])) {
        return $default;
    }
    return array_values($attrs[$key]);
}

function tiny_birthdays_esc($value) {
    return esc_html($value);
}

function tiny_birthdays_html($value) {
    return wp_kses_post($value);
}

function tiny_birthdays_url_or($value, $fallback) {
    $value = is_string($value) ? trim($value) : '';
    return esc_url($value !== '' ? $value : $fallback);
}

function tiny_birthdays_li_list($items, $class = '') {
    $class_attr = $class !== '' ? ' class="' . esc_attr($class) . '"' : '';
    $html = '<ul' . $class_attr . '>';
    foreach ((array) $items as $item) {
        if ($item === '' || $item === null) {
            continue;
        }
        $html .= '<li>' . tiny_birthdays_html($item) . '</li>';
    }
    $html .= '</ul>';
    return $html;
}

function tiny_birthdays_localize_config() {
    return [
        'birthdaysUrl' => tiny_birthdays_page_url('landing'),
        'revisedUrl' => tiny_birthdays_page_url('landing-revised'),
        'builderUrl' => tiny_birthdays_page_url('builder'),
        'cakesUrl' => tiny_birthdays_page_url('cakes'),
        'reserveUrl' => home_url('/reserve/'),
        'bookingUrl' => home_url('/booking/'),
        'eventsUrl' => tiny_birthdays_page_url('events'),
        'logoDark' => tiny_birthdays_asset('birthdays/img/logo-dark.png'),
        'logoLight' => tiny_birthdays_asset('birthdays/img/logo-light.png'),
        'cakesAssetBase' => tiny_birthdays_asset('cakes/'),
        'builderAssetBase' => tiny_birthdays_asset('birthdays/builder/'),
        'packagesJson' => tiny_birthdays_asset('birthdays/data/packages.json'),
        'partyJson' => tiny_birthdays_asset('birthdays/builder/data/party.json'),
        'cakesJson' => tiny_birthdays_asset('cakes/data/cakes.json'),
    ];
}

function tiny_birthdays_front_defaults() {
    $config = tiny_birthdays_localize_config();
    return [
        'assets' => [
            'birthdays' => tiny_birthdays_asset('birthdays/'),
            'cakes' => tiny_birthdays_asset('cakes/'),
            'builder' => tiny_birthdays_asset('birthdays/builder/'),
            'shared' => tiny_birthdays_asset('shared/'),
        ],
        'urls' => $config,
        'waTasting' => tiny_birthdays_wa_tasting(),
        'waQuestion' => tiny_birthdays_wa_question(),
        'googleReviews' => 'https://maps.app.goo.gl/Sftcte5sWdBqkguJ8',
    ];
}
