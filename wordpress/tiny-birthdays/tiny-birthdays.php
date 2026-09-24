<?php
/**
 * Plugin Name: Tiny Birthdays
 * Plugin URI: https://tinyhealthycafe.com/birthdays
 * Description: WordPress canvas for Tiny birthday landing, party builder, and cake pages. Edits copy in the block editor; builders and Supabase stay as they are.
 * Version: 1.0.0
 * Author: Tiny Healthy Cafe
 * Text Domain: tiny-birthdays
 * Requires at least: 6.4
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

define('TINY_BIRTHDAYS_VERSION', '1.0.0');
define('TINY_BIRTHDAYS_FILE', __FILE__);
define('TINY_BIRTHDAYS_DIR', plugin_dir_path(__FILE__));
define('TINY_BIRTHDAYS_URL', plugin_dir_url(__FILE__));
define('TINY_BIRTHDAYS_META', '_tiny_birthdays_canvas');

require_once TINY_BIRTHDAYS_DIR . 'includes/helpers.php';
require_once TINY_BIRTHDAYS_DIR . 'includes/pages.php';
require_once TINY_BIRTHDAYS_DIR . 'includes/assets.php';
require_once TINY_BIRTHDAYS_DIR . 'includes/blocks.php';

register_activation_hook(__FILE__, 'tiny_birthdays_activate');
register_deactivation_hook(__FILE__, 'tiny_birthdays_deactivate');

function tiny_birthdays_activate() {
    tiny_birthdays_ensure_pages();
    flush_rewrite_rules();
}

function tiny_birthdays_maybe_ensure_events() {
    $pages = get_option('tiny_birthdays_pages', []);
    if (empty($pages['events'])) {
        tiny_birthdays_ensure_pages();
    }
}

function tiny_birthdays_deactivate() {
    flush_rewrite_rules();
}

add_action('init', 'tiny_birthdays_register_meta');
add_action('init', 'tiny_birthdays_maybe_ensure_events', 5);
add_action('init', 'tiny_birthdays_register_blocks', 20);
add_action('admin_notices', 'tiny_birthdays_admin_notice');

add_filter('template_include', 'tiny_birthdays_template_include', 99);
add_filter('body_class', 'tiny_birthdays_body_class');
add_filter('allowed_block_types_all', 'tiny_birthdays_allowed_blocks', 10, 2);
add_filter('block_categories_all', 'tiny_birthdays_block_categories');

add_action('wp', 'tiny_birthdays_disable_wpautop');
add_action('wp_enqueue_scripts', 'tiny_birthdays_enqueue_front', 5);
add_action('wp_enqueue_scripts', 'tiny_birthdays_strip_theme_assets', 999);
add_action('enqueue_block_editor_assets', 'tiny_birthdays_enqueue_editor');
