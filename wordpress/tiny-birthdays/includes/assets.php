<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_enqueue_front() {
    if (!tiny_birthdays_is_canvas()) {
        return;
    }

    $type = tiny_birthdays_canvas_type();
    $ver = TINY_BIRTHDAYS_VERSION;
    $config = tiny_birthdays_localize_config();

    wp_enqueue_style(
        'tiny-birthdays-fonts',
        'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Jost:wght@400;500;600;700&family=Tenor+Sans&display=swap',
        [],
        null
    );
    wp_enqueue_style(
        'tiny-birthdays-chrome',
        tiny_birthdays_asset('shared/chrome.css'),
        [],
        $ver
    );
    wp_enqueue_style(
        'tiny-birthdays-canvas',
        TINY_BIRTHDAYS_URL . 'assets/tiny-canvas.css',
        ['tiny-birthdays-chrome'],
        $ver
    );

    if ($type === 'landing' || $type === 'landing-revised') {
        wp_enqueue_style(
            'tiny-birthdays-landing',
            tiny_birthdays_asset('birthdays/css/styles.css'),
            ['tiny-birthdays-chrome'],
            $ver
        );
    }

    if ($type === 'landing-revised') {
        wp_enqueue_style(
            'tiny-birthdays-landing-revised',
            tiny_birthdays_asset('birthdays/about-birthdays-revised/revised.css'),
            ['tiny-birthdays-landing'],
            $ver
        );
    }

    if ($type === 'cakes') {
        wp_enqueue_style(
            'tiny-birthdays-cakes',
            tiny_birthdays_asset('cakes/css/styles.css'),
            ['tiny-birthdays-chrome'],
            $ver
        );
    }

    if ($type === 'builder') {
        wp_enqueue_style(
            'tiny-birthdays-cakes',
            tiny_birthdays_asset('cakes/css/styles.css'),
            ['tiny-birthdays-chrome'],
            $ver
        );
        wp_enqueue_style(
            'tiny-birthdays-builder',
            tiny_birthdays_asset('birthdays/builder/css/styles.css'),
            ['tiny-birthdays-cakes'],
            $ver
        );
    }

    if ($type === 'events') {
        wp_enqueue_style(
            'tiny-birthdays-events',
            tiny_birthdays_asset('events/css/styles.css'),
            ['tiny-birthdays-chrome'],
            $ver
        );
    }

    wp_enqueue_script(
        'tiny-birthdays-analytics',
        tiny_birthdays_asset('shared/analytics.js'),
        [],
        $ver,
        false
    );
    wp_enqueue_script(
        'tiny-birthdays-chrome',
        tiny_birthdays_asset('shared/chrome.js'),
        [],
        $ver,
        true
    );
    wp_localize_script('tiny-birthdays-chrome', 'TINY_WP', $config);

    $needs_supabase = ($type === 'builder' || $type === 'cakes' || $type === 'events');
    if ($needs_supabase) {
        wp_enqueue_script(
            'tiny-birthdays-supabase',
            tiny_birthdays_asset('shared/supabase-config.js'),
            [],
            $ver,
            true
        );
        wp_enqueue_script(
            'tiny-birthdays-submit',
            tiny_birthdays_asset('shared/submit-request.js'),
            ['tiny-birthdays-supabase'],
            $ver,
            true
        );
        wp_enqueue_script(
            'tiny-birthdays-success-modal',
            tiny_birthdays_asset('shared/success-modal.js'),
            ['tiny-birthdays-submit'],
            $ver,
            true
        );
    }

    if ($type === 'landing') {
        wp_enqueue_script(
            'tiny-birthdays-landing',
            tiny_birthdays_asset('birthdays/js/main.js'),
            ['tiny-birthdays-chrome'],
            $ver,
            true
        );
    }

    if ($type === 'landing-revised') {
        wp_enqueue_script(
            'tiny-birthdays-landing-revised',
            tiny_birthdays_asset('birthdays/about-birthdays-revised/revised.js'),
            ['tiny-birthdays-chrome'],
            $ver,
            true
        );
    }

    if ($type === 'cakes') {
        wp_enqueue_script(
            'tiny-birthdays-cakes',
            tiny_birthdays_asset('cakes/js/main.js'),
            ['tiny-birthdays-chrome', 'tiny-birthdays-submit', 'tiny-birthdays-success-modal'],
            $ver,
            true
        );
    }

    if ($type === 'builder') {
        wp_enqueue_script(
            'tiny-birthdays-builder',
            tiny_birthdays_asset('birthdays/builder/js/main.js'),
            ['tiny-birthdays-chrome', 'tiny-birthdays-submit', 'tiny-birthdays-success-modal'],
            $ver,
            true
        );
    }

    if ($type === 'events') {
        wp_enqueue_script(
            'tiny-birthdays-events',
            tiny_birthdays_asset('events/js/main.js'),
            ['tiny-birthdays-chrome', 'tiny-birthdays-supabase'],
            $ver,
            true
        );
    }
}

function tiny_birthdays_strip_theme_assets() {
    if (!tiny_birthdays_is_canvas()) {
        return;
    }

    $keep_style = [
        'tiny-birthdays-fonts',
        'tiny-birthdays-chrome',
        'tiny-birthdays-canvas',
        'tiny-birthdays-landing',
        'tiny-birthdays-landing-revised',
        'tiny-birthdays-cakes',
        'tiny-birthdays-builder',
        'tiny-birthdays-events',
        'admin-bar',
        'dashicons',
    ];
    $keep_script = [
        'tiny-birthdays-analytics',
        'tiny-birthdays-chrome',
        'tiny-birthdays-supabase',
        'tiny-birthdays-submit',
        'tiny-birthdays-success-modal',
        'tiny-birthdays-landing',
        'tiny-birthdays-landing-revised',
        'tiny-birthdays-cakes',
        'tiny-birthdays-builder',
        'tiny-birthdays-events',
        'jquery',
        'jquery-core',
        'jquery-migrate',
        'admin-bar',
        'wp-embed',
    ];

    global $wp_styles, $wp_scripts;
    if ($wp_styles && is_array($wp_styles->queue)) {
        foreach ($wp_styles->queue as $handle) {
            if (!in_array($handle, $keep_style, true) && strpos($handle, 'tiny-birthdays') !== 0) {
                wp_dequeue_style($handle);
                wp_deregister_style($handle);
            }
        }
    }
    if ($wp_scripts && is_array($wp_scripts->queue)) {
        foreach ($wp_scripts->queue as $handle) {
            if (!in_array($handle, $keep_script, true) && strpos($handle, 'tiny-birthdays') !== 0) {
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

    $ver = TINY_BIRTHDAYS_VERSION;
    wp_enqueue_style(
        'tiny-birthdays-fonts',
        'https://fonts.googleapis.com/css2?family=Great+Vibes&family=Jost:wght@400;500;600;700&family=Tenor+Sans&display=swap',
        [],
        null
    );
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
