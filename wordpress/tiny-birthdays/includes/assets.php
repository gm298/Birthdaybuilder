<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_fonts_url() {
    return 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Jost:wght@400;500;600;700&family=Tenor+Sans&display=swap';
}

/**
 * Page stylesheets per canvas type, in load order. They load before chrome.css,
 * matching the static pages (booking is the exception and loads after it).
 */
function tiny_birthdays_page_styles($type) {
    $map = [
        'landing' => ['tiny-birthdays-landing' => 'birthdays/css/styles.css'],
        'cakes' => ['tiny-birthdays-cakes' => 'cakes/css/styles.css'],
        'builder' => [
            'tiny-birthdays-cakes' => 'cakes/css/styles.css',
            'tiny-birthdays-builder' => 'birthdays/builder/css/styles.css',
        ],
        'events' => ['tiny-birthdays-events' => 'events/css/styles.css'],
        'reserve' => ['tiny-birthdays-reserve' => 'reserve/css/styles.css'],
        'location' => ['tiny-birthdays-info' => 'shared/info-page.css'],
        'menu' => ['tiny-birthdays-info' => 'shared/info-page.css'],
    ];
    return $map[$type] ?? [];
}

function tiny_birthdays_enqueue_front() {
    if (!tiny_birthdays_is_canvas()) {
        return;
    }

    $type = tiny_birthdays_canvas_type();
    $ver = TINY_BIRTHDAYS_VERSION;

    wp_enqueue_style('tiny-birthdays-fonts', tiny_birthdays_fonts_url(), [], null);

    $deps = [];
    foreach (tiny_birthdays_page_styles($type) as $handle => $path) {
        wp_enqueue_style($handle, tiny_birthdays_asset($path), $deps, $ver);
        $deps = [$handle];
    }
    wp_enqueue_style('tiny-birthdays-chrome', tiny_birthdays_asset('shared/chrome.css'), $deps, $ver);
    if ($type === 'booking') {
        wp_enqueue_style('tiny-birthdays-booking', tiny_birthdays_asset('booking/css/styles.css'), ['tiny-birthdays-chrome'], $ver);
    }
    wp_enqueue_style('tiny-birthdays-canvas', TINY_BIRTHDAYS_URL . 'assets/tiny-canvas.css', ['tiny-birthdays-chrome'], $ver);

    wp_enqueue_script('tiny-birthdays-analytics', tiny_birthdays_asset('shared/analytics.js'), [], $ver, false);
    wp_enqueue_script('tiny-birthdays-chrome', tiny_birthdays_asset('shared/chrome.js'), [], $ver, true);
    wp_localize_script('tiny-birthdays-chrome', 'TINY_WP', tiny_birthdays_localize_config());

    $app_deps = ['tiny-birthdays-chrome'];
    if (in_array($type, ['builder', 'cakes', 'events', 'reserve', 'booking'], true)) {
        wp_enqueue_script('tiny-birthdays-supabase', tiny_birthdays_asset('shared/supabase-config.js'), [], $ver, true);
        wp_enqueue_script('tiny-birthdays-submit', tiny_birthdays_asset('shared/submit-request.js'), ['tiny-birthdays-supabase'], $ver, true);
        wp_enqueue_script('tiny-birthdays-success-modal', tiny_birthdays_asset('shared/success-modal.js'), ['tiny-birthdays-submit'], $ver, true);
        $app_deps = ['tiny-birthdays-chrome', 'tiny-birthdays-supabase', 'tiny-birthdays-submit', 'tiny-birthdays-success-modal'];
    }
    if (in_array($type, ['builder', 'reserve', 'booking'], true)) {
        wp_enqueue_script('tiny-birthdays-reserve-tables', tiny_birthdays_asset('shared/reserve-tables.js'), [], $ver, true);
        $app_deps[] = 'tiny-birthdays-reserve-tables';
    }

    $app_scripts = [
        'landing' => ['tiny-birthdays-landing', 'birthdays/js/main.js'],
        'cakes' => ['tiny-birthdays-cakes', 'cakes/js/main.js'],
        'builder' => ['tiny-birthdays-builder', 'birthdays/builder/js/main.js'],
        'events' => ['tiny-birthdays-events', 'events/js/main.js'],
        'reserve' => ['tiny-birthdays-reserve', 'reserve/js/main.js'],
        'booking' => ['tiny-birthdays-booking', 'booking/js/main.js'],
        'menu' => ['tiny-birthdays-menu', 'menu/js/main.js'],
    ];
    if (isset($app_scripts[$type])) {
        list($handle, $path) = $app_scripts[$type];
        wp_enqueue_script($handle, tiny_birthdays_asset($path), $app_deps, $ver, true);
    }
}

function tiny_birthdays_strip_theme_assets() {
    if (!tiny_birthdays_is_canvas()) {
        return;
    }

    $keep = ['admin-bar', 'dashicons', 'jquery', 'jquery-core', 'jquery-migrate', 'wp-embed'];

    global $wp_styles, $wp_scripts;
    if ($wp_styles && is_array($wp_styles->queue)) {
        foreach ($wp_styles->queue as $handle) {
            if (!in_array($handle, $keep, true) && strpos($handle, 'tiny-birthdays') !== 0) {
                wp_dequeue_style($handle);
                wp_deregister_style($handle);
            }
        }
    }
    if ($wp_scripts && is_array($wp_scripts->queue)) {
        foreach ($wp_scripts->queue as $handle) {
            if (!in_array($handle, $keep, true) && strpos($handle, 'tiny-birthdays') !== 0) {
                wp_dequeue_script($handle);
                wp_deregister_script($handle);
            }
        }
    }
}

function tiny_birthdays_is_home_chrome() {
    return is_front_page() && !tiny_birthdays_is_canvas();
}

/** Theme home page keeps its content; only the header is swapped for the Tiny one. */
function tiny_birthdays_enqueue_home_chrome() {
    if (!tiny_birthdays_is_home_chrome()) {
        return;
    }
    $ver = TINY_BIRTHDAYS_VERSION;
    wp_enqueue_style('tiny-birthdays-fonts', tiny_birthdays_fonts_url(), [], null);
    wp_enqueue_style('tiny-birthdays-chrome', tiny_birthdays_asset('shared/chrome.css'), [], $ver);
    wp_enqueue_style('tiny-birthdays-home', TINY_BIRTHDAYS_URL . 'assets/tiny-home.css', ['tiny-birthdays-chrome'], $ver);
    wp_enqueue_script('tiny-birthdays-chrome', tiny_birthdays_asset('shared/chrome.js'), [], $ver, true);
    wp_localize_script('tiny-birthdays-chrome', 'TINY_WP', tiny_birthdays_localize_config());
    wp_add_inline_script('tiny-birthdays-chrome', 'document.body.setAttribute("data-page","home");', 'before');
}

function tiny_birthdays_home_header_host() {
    if (tiny_birthdays_is_home_chrome()) {
        echo '<div id="site-chrome-header"></div>';
    }
}

function tiny_birthdays_home_body_class($classes) {
    if (tiny_birthdays_is_home_chrome()) {
        $classes[] = 'tiny-home-chrome';
    }
    return $classes;
}

function tiny_birthdays_enqueue_editor() {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || $screen->post_type !== 'page') {
        return;
    }

    $ver = TINY_BIRTHDAYS_VERSION;
    wp_enqueue_style('tiny-birthdays-fonts', tiny_birthdays_fonts_url(), [], null);
    wp_enqueue_style(
        'tiny-birthdays-editor-front',
        tiny_birthdays_asset('birthdays/css/styles.css'),
        [],
        $ver
    );
    wp_enqueue_style(
        'tiny-birthdays-editor-cakes',
        tiny_birthdays_asset('cakes/css/styles.css'),
        [],
        $ver
    );
    wp_enqueue_style(
        'tiny-birthdays-editor',
        TINY_BIRTHDAYS_URL . 'blocks/editor.css',
        ['tiny-birthdays-editor-front'],
        $ver
    );
    wp_enqueue_script(
        'tiny-birthdays-blocks',
        TINY_BIRTHDAYS_URL . 'blocks/editor.js',
        ['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-data', 'wp-server-side-render'],
        $ver,
        true
    );
    wp_localize_script('tiny-birthdays-blocks', 'tinyBirthdaysEditor', tiny_birthdays_front_defaults());
}
