<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_fonts_url() {
    return 'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Jost:wght@400;500;600;700&family=Oswald:wght@400;500&family=Tenor+Sans&display=swap';
}

/**
 * Page stylesheets per canvas type, in load order. They load before chrome.css,
 * matching the static pages (booking is the exception and loads after it).
 */
function tiny_birthdays_page_styles($type) {
    $map = [
        'landing' => ['tiny-cafe-landing' => 'birthdays/css/styles.css'],
        'cakes' => ['tiny-cafe-cakes' => 'cakes/css/styles.css'],
        'builder' => [
            'tiny-cafe-cakes' => 'cakes/css/styles.css',
            'tiny-cafe-builder' => 'birthdays/builder/css/styles.css',
        ],
        'events' => ['tiny-cafe-events' => 'events/css/styles.css'],
        'reserve' => ['tiny-cafe-reserve' => 'reserve/css/styles.css'],
        'location' => ['tiny-cafe-info' => 'shared/info-page.css'],
        'menu' => ['tiny-cafe-menu-css' => 'menu/css/menu.css'],
    ];
    return $map[$type] ?? [];
}

function tiny_cafe_menu_fonts_url() {
    return 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Hanken+Grotesk:wght@400;500;600;700&family=Tenor+Sans&display=swap';
}

function tiny_birthdays_enqueue_front() {
    if (!tiny_birthdays_is_canvas()) {
        return;
    }

    $type = tiny_birthdays_canvas_type();
    $ver = TINY_CAFE_VERSION;

    wp_enqueue_style(
        'tiny-cafe-fonts',
        $type === 'menu' ? tiny_cafe_menu_fonts_url() : tiny_birthdays_fonts_url(),
        [],
        null
    );

    $deps = [];
    $page_styles = tiny_birthdays_page_styles($type);
    // Menu CSS must load after chrome so full-bleed header/footer + FAB overrides win.
    if ($type === 'menu') {
        wp_enqueue_style('tiny-cafe-chrome', tiny_birthdays_asset('shared/chrome.css'), [], $ver);
        foreach ($page_styles as $handle => $path) {
            wp_enqueue_style($handle, tiny_birthdays_asset($path), ['tiny-cafe-chrome'], $ver);
            $deps = [$handle];
        }
    } else {
        foreach ($page_styles as $handle => $path) {
            wp_enqueue_style($handle, tiny_birthdays_asset($path), $deps, $ver);
            $deps = [$handle];
        }
        wp_enqueue_style('tiny-cafe-chrome', tiny_birthdays_asset('shared/chrome.css'), $deps, $ver);
        $deps = ['tiny-cafe-chrome'];
    }
    if ($type === 'booking') {
        wp_enqueue_style('tiny-cafe-booking', tiny_birthdays_asset('booking/css/styles.css'), ['tiny-cafe-chrome'], $ver);
    }
    $canvas_deps = $type === 'menu' ? (array_keys($page_styles) ?: ['tiny-cafe-chrome']) : ['tiny-cafe-chrome'];
    wp_enqueue_style('tiny-cafe-canvas', TINY_CAFE_URL . 'assets/tiny-canvas.css', $canvas_deps, $ver);

    wp_enqueue_script('tiny-cafe-analytics', tiny_birthdays_asset('shared/analytics.js'), [], $ver, false);
    wp_enqueue_script('tiny-cafe-chrome', tiny_birthdays_asset('shared/chrome.js'), [], $ver, true);
    wp_localize_script('tiny-cafe-chrome', 'TINY_WP', tiny_birthdays_localize_config());

    $app_deps = ['tiny-cafe-chrome'];
    if (in_array($type, ['builder', 'cakes', 'events', 'reserve', 'booking', 'menu'], true)) {
        wp_enqueue_script('tiny-cafe-supabase', tiny_birthdays_asset('shared/supabase-config.js'), [], $ver, true);
        $app_deps = ['tiny-cafe-chrome', 'tiny-cafe-supabase'];
    }
    if (in_array($type, ['builder', 'cakes', 'events', 'reserve', 'booking'], true)) {
        wp_enqueue_script('tiny-cafe-submit', tiny_birthdays_asset('shared/submit-request.js'), ['tiny-cafe-supabase'], $ver, true);
        wp_enqueue_script('tiny-cafe-success-modal', tiny_birthdays_asset('shared/success-modal.js'), ['tiny-cafe-submit'], $ver, true);
        $app_deps = ['tiny-cafe-chrome', 'tiny-cafe-supabase', 'tiny-cafe-submit', 'tiny-cafe-success-modal'];
    }
    if (in_array($type, ['builder', 'reserve', 'booking'], true)) {
        wp_enqueue_script('tiny-cafe-reserve-tables', tiny_birthdays_asset('shared/reserve-tables.js'), [], $ver, true);
        $app_deps[] = 'tiny-cafe-reserve-tables';
    }
    if (in_array($type, ['builder', 'reserve', 'events'], true)) {
        wp_enqueue_style('tiny-cafe-guest-stepper', tiny_birthdays_asset('shared/guest-stepper.css'), ['tiny-cafe-chrome'], $ver);
        wp_enqueue_script('tiny-cafe-guest-stepper', tiny_birthdays_asset('shared/guest-stepper.js'), [], $ver, true);
        $app_deps[] = 'tiny-cafe-guest-stepper';
    }

    if ($type === 'menu') {
        wp_enqueue_script('tiny-cafe-menu-api', tiny_birthdays_asset('menu/js/menu-api.js'), $app_deps, $ver, true);
        wp_enqueue_script('tiny-cafe-menu-render', tiny_birthdays_asset('menu/js/render.js'), ['tiny-cafe-menu-api'], $ver, true);
        wp_enqueue_script('tiny-cafe-menu', tiny_birthdays_asset('menu/js/main.js'), ['tiny-cafe-menu-render'], $ver, true);
        return;
    }

    $app_scripts = [
        'landing' => ['tiny-cafe-landing', 'birthdays/js/main.js'],
        'cakes' => ['tiny-cafe-cakes', 'cakes/js/main.js'],
        'builder' => ['tiny-cafe-builder', 'birthdays/builder/js/main.js'],
        'events' => ['tiny-cafe-events', 'events/js/main.js'],
        'reserve' => ['tiny-cafe-reserve', 'reserve/js/main.js'],
        'booking' => ['tiny-cafe-booking', 'booking/js/main.js'],
    ];
    if (isset($app_scripts[$type])) {
        list($handle, $path) = $app_scripts[$type];
        wp_enqueue_script($handle, tiny_birthdays_asset($path), $app_deps, $ver, true);
    }
}

function tiny_cafe_enqueue_home() {
    if (!is_front_page() || tiny_birthdays_is_canvas()) {
        return;
    }
    $ver = TINY_CAFE_VERSION;
    wp_enqueue_style('tiny-cafe-fonts', tiny_birthdays_fonts_url(), [], null);
    wp_enqueue_style('tiny-cafe-info', tiny_birthdays_asset('shared/info-page.css'), [], $ver);
    wp_enqueue_style('tiny-cafe-home', tiny_birthdays_asset('home/css/home.css'), ['tiny-cafe-info'], $ver);
    wp_enqueue_style('tiny-cafe-chrome', tiny_birthdays_asset('shared/chrome.css'), ['tiny-cafe-home'], $ver);
    wp_enqueue_script('tiny-cafe-analytics', tiny_birthdays_asset('shared/analytics.js'), [], $ver, false);
    wp_enqueue_script('tiny-cafe-chrome', tiny_birthdays_asset('shared/chrome.js'), [], $ver, true);
    wp_localize_script('tiny-cafe-chrome', 'TINY_WP', tiny_birthdays_localize_config());
}

function tiny_cafe_enqueue_generic() {
    if (is_front_page() || tiny_birthdays_is_canvas() || is_admin()) {
        return;
    }
    if (!is_singular('page') && !is_singular('post')) {
        return;
    }
    $ver = TINY_CAFE_VERSION;
    wp_enqueue_style('tiny-cafe-fonts', tiny_birthdays_fonts_url(), [], null);
    wp_enqueue_style('tiny-cafe-info', tiny_birthdays_asset('shared/info-page.css'), [], $ver);
    wp_enqueue_style('tiny-cafe-chrome', tiny_birthdays_asset('shared/chrome.css'), ['tiny-cafe-info'], $ver);
    wp_enqueue_style('tiny-cafe-page', TINY_CAFE_URL . 'assets/tiny-page.css', ['tiny-cafe-chrome'], $ver);
    wp_enqueue_script('tiny-cafe-analytics', tiny_birthdays_asset('shared/analytics.js'), [], $ver, false);
    wp_enqueue_script('tiny-cafe-chrome', tiny_birthdays_asset('shared/chrome.js'), [], $ver, true);
    wp_localize_script('tiny-cafe-chrome', 'TINY_WP', tiny_birthdays_localize_config());
}

function tiny_birthdays_strip_theme_assets() {
    if (!tiny_birthdays_is_canvas() && !is_front_page()) {
        return;
    }

    $keep = ['admin-bar', 'dashicons', 'jquery', 'jquery-core', 'jquery-migrate', 'wp-embed'];

    global $wp_styles, $wp_scripts;
    if ($wp_styles && is_array($wp_styles->queue)) {
        foreach ($wp_styles->queue as $handle) {
            if (!in_array($handle, $keep, true) && strpos($handle, 'tiny-cafe') !== 0 && strpos($handle, 'tiny-birthdays') !== 0) {
                wp_dequeue_style($handle);
                wp_deregister_style($handle);
            }
        }
    }
    if ($wp_scripts && is_array($wp_scripts->queue)) {
        foreach ($wp_scripts->queue as $handle) {
            if (!in_array($handle, $keep, true) && strpos($handle, 'tiny-cafe') !== 0 && strpos($handle, 'tiny-birthdays') !== 0) {
                wp_dequeue_script($handle);
                wp_deregister_script($handle);
            }
        }
    }
}

function tiny_birthdays_enqueue_editor() {
    $screen = function_exists('get_current_screen') ? get_current_screen() : null;
    if (!$screen || $screen->post_type !== 'page') {
        return;
    }

    $ver = TINY_CAFE_VERSION;
    wp_enqueue_style('tiny-cafe-fonts', tiny_birthdays_fonts_url(), [], null);
    wp_enqueue_style(
        'tiny-cafe-editor-front',
        tiny_birthdays_asset('birthdays/css/styles.css'),
        [],
        $ver
    );
    wp_enqueue_style(
        'tiny-cafe-editor-cakes',
        tiny_birthdays_asset('cakes/css/styles.css'),
        [],
        $ver
    );
    wp_enqueue_style(
        'tiny-cafe-editor',
        TINY_CAFE_URL . 'blocks/editor.css',
        ['tiny-cafe-editor-front'],
        $ver
    );
    wp_enqueue_script(
        'tiny-cafe-blocks',
        TINY_CAFE_URL . 'blocks/editor.js',
        ['wp-blocks', 'wp-element', 'wp-block-editor', 'wp-components', 'wp-i18n', 'wp-data', 'wp-server-side-render'],
        $ver,
        true
    );
    wp_localize_script('tiny-cafe-blocks', 'tinyBirthdaysEditor', tiny_birthdays_front_defaults());
}
