<?php
if (!defined('ABSPATH')) {
    exit;
}

require_once TINY_BIRTHDAYS_DIR . 'includes/render-landing.php';
require_once TINY_BIRTHDAYS_DIR . 'includes/render-landing-revised.php';
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
        'tiny/hero' => [
            'title' => 'Tiny Hero',
            'render_callback' => 'tiny_birthdays_render_hero',
            'attributes' => tiny_birthdays_hero_attributes(),
        ],
        'tiny/included' => [
            'title' => 'Tiny Included',
            'render_callback' => 'tiny_birthdays_render_included',
            'attributes' => tiny_birthdays_included_attributes(),
        ],
        'tiny/gallery' => [
            'title' => 'Tiny Gallery',
            'render_callback' => 'tiny_birthdays_render_gallery',
            'attributes' => tiny_birthdays_gallery_attributes(),
        ],
        'tiny/reviews' => [
            'title' => 'Tiny Reviews',
            'render_callback' => 'tiny_birthdays_render_reviews',
            'attributes' => tiny_birthdays_reviews_attributes(),
        ],
        'tiny/packages' => [
            'title' => 'Tiny Packages',
            'render_callback' => 'tiny_birthdays_render_packages',
            'attributes' => tiny_birthdays_packages_attributes(),
        ],
        'tiny/cake-promo' => [
            'title' => 'Tiny Cake Promo',
            'render_callback' => 'tiny_birthdays_render_cake_promo',
            'attributes' => tiny_birthdays_cake_promo_attributes(),
        ],
        'tiny/faq' => [
            'title' => 'Tiny FAQ',
            'render_callback' => 'tiny_birthdays_render_faq',
            'attributes' => tiny_birthdays_faq_attributes(),
        ],
        'tiny/closing' => [
            'title' => 'Tiny Closing',
            'render_callback' => 'tiny_birthdays_render_closing',
            'attributes' => tiny_birthdays_closing_attributes(),
        ],
        'tiny/sticky-bar' => [
            'title' => 'Tiny Sticky Bar',
            'render_callback' => 'tiny_birthdays_render_sticky',
            'attributes' => tiny_birthdays_sticky_attributes(),
        ],
        'tiny/landing-revised' => [
            'title' => 'Tiny About Birthdays Revised',
            'render_callback' => 'tiny_birthdays_render_landing_revised',
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

    register_block_pattern('tiny-birthdays/landing', [
        'title' => 'Tiny Birthdays landing',
        'categories' => ['tiny-birthdays'],
        'description' => 'Current Tiny birthday landing page, with editable copy and locked layout.',
        'content' => tiny_birthdays_default_landing_content(),
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
