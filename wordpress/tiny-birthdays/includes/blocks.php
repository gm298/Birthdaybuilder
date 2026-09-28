<?php
if (!defined('ABSPATH')) {
    exit;
}

require_once TINY_BIRTHDAYS_DIR . 'includes/render-sections.php';
require_once TINY_BIRTHDAYS_DIR . 'includes/render-about-birthdays.php';
require_once TINY_BIRTHDAYS_DIR . 'includes/render-apps.php';

function tiny_birthdays_block_categories($categories) {
    array_unshift($categories, [
        'slug' => 'tiny-birthdays',
        'title' => 'Tiny Birthdays',
        'icon' => 'birthday',
    ]);
    return $categories;
}

function tiny_birthdays_register_blocks() {
    $blocks = [
        'tiny/sticky-bar' => [
            'title' => 'Tiny Sticky Bar',
            'render_callback' => 'tiny_birthdays_render_sticky',
            'attributes' => tiny_birthdays_sticky_attributes(),
        ],
        'tiny/about-birthdays' => [
            'title' => 'Tiny About Birthdays',
            'render_callback' => 'tiny_birthdays_render_about_birthdays',
            'attributes' => [],
        ],
        'tiny/party-builder' => [
            'title' => 'Tiny Party Builder',
            'render_callback' => 'tiny_birthdays_render_party_builder',
            'attributes' => [],
        ],
        'tiny/cakes-hero' => [
            'title' => 'Tiny Cakes Hero',
            'render_callback' => 'tiny_birthdays_render_cakes_hero',
            'attributes' => tiny_birthdays_cakes_hero_attributes(),
        ],
        'tiny/cakes-facts' => [
            'title' => 'Tiny Cakes Facts',
            'render_callback' => 'tiny_birthdays_render_cakes_facts',
            'attributes' => tiny_birthdays_cakes_facts_attributes(),
        ],
        'tiny/cake-app' => [
            'title' => 'Tiny Cake Builder',
            'render_callback' => 'tiny_birthdays_render_cake_app',
            'attributes' => tiny_birthdays_cake_app_attributes(),
        ],
        'tiny/events' => [
            'title' => 'Tiny Events',
            'render_callback' => 'tiny_birthdays_render_events',
            'attributes' => [],
        ],
        'tiny/reserve' => [
            'title' => 'Tiny Table Reservations',
            'render_callback' => 'tiny_birthdays_render_reserve',
            'attributes' => [],
        ],
        'tiny/booking' => [
            'title' => 'Tiny Your Booking',
            'render_callback' => 'tiny_birthdays_render_booking',
            'attributes' => [],
        ],
        'tiny/location' => [
            'title' => 'Tiny Location',
            'render_callback' => 'tiny_birthdays_render_location',
            'attributes' => [],
        ],
        'tiny/menu' => [
            'title' => 'Tiny Menu Viewer',
            'render_callback' => 'tiny_birthdays_render_menu',
            'attributes' => [],
        ],
    ];

    foreach ($blocks as $name => $args) {
        register_block_type($name, [
            'api_version' => 3,
            'category' => 'tiny-birthdays',
            'title' => $args['title'],
            'attributes' => $args['attributes'],
            'render_callback' => $args['render_callback'],
            'supports' => [
                'html' => false,
                'align' => false,
                'reusable' => false,
                'className' => false,
                'customClassName' => false,
                'layout' => false,
            ],
        ]);
    }

    register_block_pattern_category('tiny-birthdays', [
        'label' => 'Tiny Birthdays',
    ]);

    register_block_pattern('tiny-birthdays/cakes', [
        'title' => 'Tiny cakes page',
        'categories' => ['tiny-birthdays'],
        'description' => 'Cake marketing copy plus the live cake gallery and order form.',
        'content' => tiny_birthdays_default_cakes_content(),
    ]);
}

function tiny_birthdays_string_attr($default = '') {
    return [
        'type' => 'string',
        'default' => $default,
    ];
}

function tiny_birthdays_array_attr($default = [], $item_type = 'string') {
    return [
        'type' => 'array',
        'default' => $default,
        'items' => [
            'type' => $item_type,
        ],
    ];
}
