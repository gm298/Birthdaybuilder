<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_register_meta() {
    register_post_meta('page', TINY_BIRTHDAYS_META, [
        'type' => 'string',
        'single' => true,
        'show_in_rest' => true,
        'auth_callback' => function () {
            return current_user_can('edit_pages');
        },
    ]);
}

function tiny_birthdays_find_page($slug, $parent_id = 0) {
    $query = new WP_Query([
        'post_type' => 'page',
        'name' => $slug,
        'post_parent' => (int) $parent_id,
        'post_status' => ['publish', 'draft', 'private'],
        'posts_per_page' => 1,
        'no_found_rows' => true,
    ]);
    $page = $query->have_posts() ? $query->posts[0] : null;
    wp_reset_postdata();
    return $page;
}

function tiny_birthdays_upsert_page($args) {
    $slug = $args['slug'];
    $parent_id = isset($args['parent']) ? (int) $args['parent'] : 0;
    $existing = tiny_birthdays_find_page($slug, $parent_id);
    $payload = [
        'post_title' => $args['title'],
        'post_name' => $slug,
        'post_status' => 'publish',
        'post_type' => 'page',
        'post_parent' => $parent_id,
        'post_excerpt' => $args['excerpt'],
        'comment_status' => 'closed',
        'ping_status' => 'closed',
    ];

    if ($existing) {
        $payload['ID'] = $existing->ID;
        $marker = isset($args['require_block']) ? $args['require_block'] : 'wp:tiny/';
        if (strpos((string) $existing->post_content, $marker) === false) {
            $payload['post_content'] = $args['content'];
        }
        $id = wp_update_post($payload, true);
    } else {
        $payload['post_content'] = $args['content'];
        $id = wp_insert_post($payload, true);
    }

    if (is_wp_error($id) || !$id) {
        return 0;
    }

    update_post_meta($id, TINY_BIRTHDAYS_META, $args['type']);
    return (int) $id;
}

function tiny_birthdays_ensure_pages() {
    $landing_id = tiny_birthdays_upsert_page([
        'slug' => 'birthdays',
        'title' => 'About Birthdays | Tiny Healthy Cafe',
        'excerpt' => 'Dream birthday for your child at Tiny in Berawa, Bali — cake, food, decor and entertainment. See packages, build your party, or book a free cake tasting.',
        'type' => 'landing',
        'content' => tiny_birthdays_default_landing_content(),
        'require_block' => 'wp:tiny/about-birthdays',
    ]);

    $builder_id = tiny_birthdays_upsert_page([
        'slug' => 'builder',
        'parent' => $landing_id,
        'title' => 'Build Your Birthday | Tiny Healthy Cafe',
        'excerpt' => 'Build your Tiny birthday in Berawa, Bali — package, decorations, cake, add-ons and food, then send the plan to WhatsApp.',
        'type' => 'builder',
        'content' => "<!-- wp:tiny/party-builder /-->\n",
    ]);

    $retired = tiny_birthdays_find_page('about-birthdays-revised', $landing_id);
    if ($retired) {
        delete_post_meta($retired->ID, TINY_BIRTHDAYS_META);
        wp_trash_post($retired->ID);
    }

    $cakes_id = tiny_birthdays_upsert_page([
        'slug' => 'cakes',
        'title' => 'Custom Birthday Cakes in Berawa, Bali | Tiny Healthy Cafe',
        'excerpt' => 'Custom birthday cakes baked at Tiny in Berawa, Bali — any theme, gluten-free or no added sugar as a paid add-on. Order 2 days ahead via WhatsApp.',
        'type' => 'cakes',
        'content' => tiny_birthdays_default_cakes_content(),
    ]);

    $events_id = tiny_birthdays_upsert_page([
        'slug' => 'events',
        'title' => 'Events | Tiny Healthy Cafe',
        'excerpt' => 'Workshops, gatherings and happenings at Tiny Healthy Cafe in Berawa, Bali. See what’s on this week and join the guest list.',
        'type' => 'events',
        'content' => "<!-- wp:tiny/events /-->\n",
    ]);

    $reserve_id = tiny_birthdays_upsert_page([
        'slug' => 'reserve',
        'title' => 'Reserve a Table | Tiny Healthy Cafe',
        'excerpt' => 'Book a table at Tiny Healthy Cafe in Berawa, Bali. Pick date, time and a table, then send the request on WhatsApp.',
        'type' => 'reserve',
        'content' => "<!-- wp:tiny/reserve /-->\n",
        'require_block' => 'wp:tiny/reserve',
    ]);

    $booking_id = tiny_birthdays_upsert_page([
        'slug' => 'booking',
        'title' => 'Your booking | Tiny Healthy Cafe',
        'excerpt' => 'View and manage your Tiny Healthy Cafe reservation or birthday booking in Berawa, Bali.',
        'type' => 'booking',
        'content' => "<!-- wp:tiny/booking /-->\n",
        'require_block' => 'wp:tiny/booking',
    ]);

    $location_id = tiny_birthdays_upsert_page([
        'slug' => 'location',
        'title' => 'Our Location | Tiny Healthy Cafe',
        'excerpt' => 'Find Tiny Healthy Family Cafe in Berawa, Bali. Open every day 8:30am to 8pm. Get directions on Google Maps.',
        'type' => 'location',
        'content' => "<!-- wp:tiny/location /-->\n",
        'require_block' => 'wp:tiny/location',
    ]);

    $menu_id = tiny_birthdays_upsert_page([
        'slug' => 'menu',
        'title' => 'Our Menu | Tiny Healthy Cafe',
        'excerpt' => 'Tiny Healthy Cafe menus in Berawa, Bali: food, drinks and nights menu. View online or download the PDF.',
        'type' => 'menu',
        'content' => "<!-- wp:tiny/menu /-->\n",
        'require_block' => 'wp:tiny/menu',
    ]);

    update_option('tiny_birthdays_pages', [
        'landing' => $landing_id,
        'builder' => $builder_id,
        'cakes' => $cakes_id,
        'events' => $events_id,
        'reserve' => $reserve_id,
        'booking' => $booking_id,
        'location' => $location_id,
        'menu' => $menu_id,
    ]);

    update_option('tiny_birthdays_show_notice', 1);
}

function tiny_birthdays_maybe_upgrade() {
    if (get_option('tiny_birthdays_version') === TINY_BIRTHDAYS_VERSION) {
        return;
    }
    tiny_birthdays_ensure_pages();
    update_option('tiny_birthdays_version', TINY_BIRTHDAYS_VERSION);
    flush_rewrite_rules(false);
}

function tiny_birthdays_redirect_retired() {
    if (!is_404()) {
        return;
    }
    $path = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
    if (preg_match('#(^|/)birthdays/about-birthdays-revised$#', $path)) {
        wp_safe_redirect(tiny_birthdays_page_url('landing'), 301);
        exit;
    }
}

function tiny_birthdays_default_landing_content() {
    return "<!-- wp:tiny/about-birthdays /-->\n";
}

function tiny_birthdays_default_cakes_content() {
    return implode("\n", [
        '<!-- wp:tiny/cakes-hero /-->',
        '<!-- wp:tiny/cakes-facts /-->',
        '<!-- wp:tiny/cake-app /-->',
        '<!-- wp:tiny/sticky-bar {"variant":"cakes"} /-->',
        '',
    ]);
}

function tiny_birthdays_template_include($template) {
    if (!is_singular('page')) {
        return $template;
    }
    if (!tiny_birthdays_is_canvas()) {
        return $template;
    }
    return TINY_BIRTHDAYS_DIR . 'templates/canvas.php';
}

function tiny_birthdays_disable_wpautop() {
    if (!tiny_birthdays_is_canvas()) {
        return;
    }
    remove_filter('the_content', 'wpautop');
    remove_filter('the_excerpt', 'wpautop');
    remove_filter('the_content', 'wptexturize');
}

function tiny_birthdays_body_class($classes) {
    $type = tiny_birthdays_canvas_type();
    if ($type) {
        $classes[] = 'tiny-canvas';
        $classes[] = 'tiny-canvas--' . $type;
    }
    return $classes;
}

function tiny_birthdays_allowed_blocks($allowed, $context) {
    $post = isset($context->post) ? $context->post : null;
    if (!$post || $post->post_type !== 'page') {
        return $allowed;
    }
    $type = tiny_birthdays_canvas_type($post->ID);
    if (!$type) {
        return $allowed;
    }
    $blocks = [
        'tiny/about-birthdays',
        'tiny/sticky-bar',
        'tiny/party-builder',
        'tiny/cakes-hero',
        'tiny/cakes-facts',
        'tiny/cake-app',
        'tiny/events',
        'tiny/reserve',
        'tiny/booking',
        'tiny/location',
        'tiny/menu',
    ];
    return $blocks;
}

function tiny_birthdays_admin_notice() {
    if (!current_user_can('activate_plugins')) {
        return;
    }
    if (!get_option('tiny_birthdays_show_notice')) {
        return;
    }
    if (isset($_GET['tiny_birthdays_notice']) && $_GET['tiny_birthdays_notice'] === 'dismiss') {
        check_admin_referer('tiny_birthdays_notice');
        delete_option('tiny_birthdays_show_notice');
        return;
    }
    $dismiss = wp_nonce_url(
        add_query_arg('tiny_birthdays_notice', 'dismiss'),
        'tiny_birthdays_notice'
    );
    echo '<div class="notice notice-info is-dismissible"><p><strong>Tiny Birthdays</strong> set up About Birthdays, Birthday Builder, Cakes, Events, Reservations, Your booking, Location and Menu pages. On Hostinger, rename or remove the physical <code>public_html/birthdays</code>, <code>cakes</code>, <code>events</code>, <code>reserve</code>, <code>booking</code>, <code>location</code> and <code>menu</code> folders so WordPress can serve those URLs. Keep <code>/staff/</code> and the Supabase backend as they are. Then Settings → Permalinks → Save. <a href="' . esc_url($dismiss) . '">Dismiss</a></p></div>';
}
