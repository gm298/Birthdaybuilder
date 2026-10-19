<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_asset($relative) {
    $relative = ltrim(str_replace('\\', '/', $relative), '/');
    return TINY_CAFE_URL . 'assets/' . $relative;
}

/**
 * Page template file => canvas type.
 * To add a layout later: create page-templates/canvas-foo.php, then add it here.
 */
function tiny_cafe_page_templates() {
    return [
        'page-templates/canvas-birthdays.php' => 'landing',
        'page-templates/canvas-builder.php' => 'builder',
        'page-templates/canvas-cakes.php' => 'cakes',
        'page-templates/canvas-events.php' => 'events',
        'page-templates/canvas-reserve.php' => 'reserve',
        'page-templates/canvas-booking.php' => 'booking',
        'page-templates/canvas-location.php' => 'location',
        'page-templates/canvas-menu.php' => 'menu',
    ];
}

function tiny_cafe_template_for_type($type) {
    foreach (tiny_cafe_page_templates() as $file => $canvas) {
        if ($canvas === $type) {
            return $file;
        }
    }
    return '';
}

function tiny_birthdays_canvas_types() {
    return array_values(array_unique(array_values(tiny_cafe_page_templates())));
}

function tiny_birthdays_canvas_type($post_id = 0) {
    $post_id = $post_id ? (int) $post_id : (int) get_queried_object_id();
    if (!$post_id) {
        return '';
    }
    $type = get_post_meta($post_id, TINY_CAFE_META, true);
    if (in_array($type, tiny_birthdays_canvas_types(), true)) {
        return $type;
    }
    $slug = get_page_template_slug($post_id);
    $map = tiny_cafe_page_templates();
    return isset($map[$slug]) ? $map[$slug] : '';
}

function tiny_birthdays_is_canvas($post_id = 0) {
    return (bool) tiny_birthdays_canvas_type($post_id);
}

function tiny_cafe_data_page() {
    if (is_front_page() && !tiny_birthdays_is_canvas()) {
        return 'home';
    }
    $type = tiny_birthdays_canvas_type();
    return $type !== '' ? $type : 'page';
}

function tiny_birthdays_page_id($type) {
    $pages = get_option('tiny_cafe_pages', []);
    if (empty($pages)) {
        $pages = get_option('tiny_birthdays_pages', []);
    }
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
        'builder' => home_url('/birthdays/builder/'),
        'cakes' => home_url('/cakes/'),
        'events' => home_url('/events/'),
        'reserve' => home_url('/reserve/'),
        'booking' => home_url('/booking/'),
        'location' => home_url('/location/'),
        'menu' => home_url('/menu/'),
        'home' => home_url('/'),
    ];
    return $map[$type] ?? home_url('/');
}

function tiny_birthdays_wa_tasting() {
    return 'https://wa.me/6282147830142?text=' . rawurlencode("Hi Tiny! I'd like to request a free cake tasting. Preferred day: . Party date if I know it: .");
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
        'homeUrl' => home_url('/'),
        'birthdaysUrl' => tiny_birthdays_page_url('landing'),
        'builderUrl' => tiny_birthdays_page_url('builder'),
        'cakesUrl' => tiny_birthdays_page_url('cakes'),
        'reserveUrl' => tiny_birthdays_page_url('reserve'),
        'bookingUrl' => tiny_birthdays_page_url('booking'),
        'eventsUrl' => tiny_birthdays_page_url('events'),
        'menuUrl' => tiny_birthdays_page_url('menu'),
        'locationUrl' => tiny_birthdays_page_url('location'),
        'reserveImgBase' => tiny_birthdays_asset('reserve/img/'),
        'menuAssetBase' => tiny_birthdays_asset('menu/'),
        'menuSeedJson' => tiny_birthdays_asset('menu/data/menu-seed.json'),
        'homeAssetBase' => tiny_birthdays_asset('home/'),
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
            'home' => tiny_birthdays_asset('home/'),
        ],
        'urls' => $config,
        'waTasting' => tiny_birthdays_wa_tasting(),
        'waQuestion' => tiny_birthdays_wa_question(),
        'googleReviews' => 'https://maps.app.goo.gl/Sftcte5sWdBqkguJ8',
    ];
}
