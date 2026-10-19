<?php
/**
 * Tiny Cafe theme.
 */

if (!defined('ABSPATH')) {
    exit;
}

define('TINY_CAFE_VERSION', '1.0.4');
define('TINY_CAFE_DIR', trailingslashit(get_template_directory()));
define('TINY_CAFE_URL', trailingslashit(get_template_directory_uri()));
define('TINY_CAFE_META', '_tiny_cafe_canvas');

/** Keep legacy constant names so ported include files keep working. */
define('TINY_BIRTHDAYS_VERSION', TINY_CAFE_VERSION);
define('TINY_BIRTHDAYS_DIR', TINY_CAFE_DIR);
define('TINY_BIRTHDAYS_URL', TINY_CAFE_URL);
define('TINY_BIRTHDAYS_META', TINY_CAFE_META);

require_once TINY_CAFE_DIR . 'includes/helpers.php';
require_once TINY_CAFE_DIR . 'includes/pages.php';
require_once TINY_CAFE_DIR . 'includes/assets.php';
require_once TINY_CAFE_DIR . 'includes/blocks.php';

add_action('after_setup_theme', 'tiny_cafe_setup');
add_action('after_switch_theme', 'tiny_cafe_after_switch');
add_action('init', 'tiny_birthdays_register_meta');
add_action('init', 'tiny_cafe_maybe_upgrade', 5);
add_action('init', 'tiny_birthdays_register_blocks', 20);
add_action('admin_notices', 'tiny_cafe_admin_notice');
add_action('template_redirect', 'tiny_birthdays_redirect_retired');

add_filter('body_class', 'tiny_birthdays_body_class');
add_filter('body_class', 'tiny_cafe_home_body_class');
add_filter('allowed_block_types_all', 'tiny_birthdays_allowed_blocks', 10, 2);
add_filter('block_categories_all', 'tiny_birthdays_block_categories');
add_filter('wp_nav_menu_objects', 'tiny_cafe_rename_events_menu');

add_action('wp', 'tiny_birthdays_disable_wpautop');
add_action('wp_enqueue_scripts', 'tiny_birthdays_enqueue_front', 5);
add_action('wp_enqueue_scripts', 'tiny_cafe_enqueue_home', 5);
add_action('wp_enqueue_scripts', 'tiny_cafe_enqueue_generic', 5);
add_action('wp_enqueue_scripts', 'tiny_birthdays_strip_theme_assets', 999);
add_action('enqueue_block_editor_assets', 'tiny_birthdays_enqueue_editor');

function tiny_cafe_setup() {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    add_theme_support('wp-block-styles');
    add_theme_support('responsive-embeds');
    add_theme_support('editor-styles');
}

function tiny_cafe_after_switch() {
    tiny_cafe_ensure_pages();
    update_option('tiny_cafe_version', TINY_CAFE_VERSION);
    update_option('tiny_cafe_show_notice', 1);
    flush_rewrite_rules();
}

function tiny_cafe_maybe_upgrade() {
    if (get_option('tiny_cafe_version') === TINY_CAFE_VERSION) {
        return;
    }
    tiny_cafe_ensure_pages();
    update_option('tiny_cafe_version', TINY_CAFE_VERSION);
    flush_rewrite_rules(false);
}

function tiny_cafe_rename_events_menu($items) {
    if (!is_array($items)) {
        return $items;
    }
    $events_url = tiny_birthdays_page_url('events');
    foreach ($items as $item) {
        $title = isset($item->title) ? html_entity_decode(wp_strip_all_tags($item->title)) : '';
        $url = isset($item->url) ? (string) $item->url : '';
        $is_calendar = (bool) preg_match('/event\s*calendar/i', $title);
        $points_at_events = (bool) preg_match('#/events/?($|\?)#i', $url);
        if (!$is_calendar && !($points_at_events && preg_match('/calendar|event/i', $title))) {
            continue;
        }
        $item->title = 'Events';
        $item->url = $events_url;
    }
    return $items;
}

function tiny_cafe_home_body_class($classes) {
    if (is_front_page() && !tiny_birthdays_is_canvas()) {
        $classes[] = 'tiny-home';
    }
    return $classes;
}
