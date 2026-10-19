<?php
if (!defined('ABSPATH')) {
    exit;
}

function tiny_birthdays_register_meta() {
    register_post_meta('page', TINY_CAFE_META, [
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
        'post_status' => ['publish', 'draft', 'private', 'pending'],
        'posts_per_page' => 1,
        'no_found_rows' => true,
    ]);
    $page = $query->have_posts() ? $query->posts[0] : null;
    wp_reset_postdata();
    return $page;
}

/**
 * Create or update a Tiny page. New pages are drafts so you can edit before publishing.
 * Existing pages keep their current status (draft/publish).
 */
function tiny_cafe_upsert_page($args) {
    $slug = $args['slug'];
    $parent_id = isset($args['parent']) ? (int) $args['parent'] : 0;
    $existing = tiny_birthdays_find_page($slug, $parent_id);
    $payload = [
        'post_title' => $args['title'],
        'post_name' => $slug,
        'post_type' => 'page',
        'post_parent' => $parent_id,
        'post_excerpt' => $args['excerpt'],
        'comment_status' => 'closed',
        'ping_status' => 'closed',
    ];

    if ($existing) {
        $payload['ID'] = $existing->ID;
        $payload['post_status'] = $existing->post_status;
        $marker = isset($args['require_block']) ? $args['require_block'] : 'wp:tiny/';
        if (strpos((string) $existing->post_content, $marker) === false) {
            $payload['post_content'] = $args['content'];
        }
        $id = wp_update_post($payload, true);
    } else {
        $payload['post_status'] = 'draft';
        $payload['post_content'] = $args['content'];
        $id = wp_insert_post($payload, true);
    }

    if (is_wp_error($id) || !$id) {
        return 0;
    }

    update_post_meta($id, TINY_CAFE_META, $args['type']);
    $template = tiny_cafe_template_for_type($args['type']);
    if ($template !== '') {
        update_post_meta($id, '_wp_page_template', $template);
    }
    return (int) $id;
}

function tiny_cafe_ensure_pages() {
    $home_id = tiny_cafe_upsert_home_page();

    $landing_id = tiny_cafe_upsert_page([
        'slug' => 'birthdays',
        'title' => 'About Birthdays | Tiny Healthy Cafe',
        'excerpt' => 'Dream birthday for your child at Tiny in Berawa, Bali — cake, food, decor and entertainment. See packages, build your party, or book a free cake tasting.',
        'type' => 'landing',
        'content' => tiny_birthdays_default_landing_content(),
        'require_block' => 'wp:tiny/about-birthdays',
    ]);

    $builder_id = tiny_cafe_upsert_page([
        'slug' => 'builder',
        'parent' => $landing_id,
        'title' => 'Build Your Birthday | Tiny Healthy Cafe',
        'excerpt' => 'Build your Tiny birthday in Berawa, Bali — package, decorations, cake, add-ons and food, then send the plan to WhatsApp.',
        'type' => 'builder',
        'content' => "<!-- wp:tiny/party-builder /-->\n",
        'require_block' => 'wp:tiny/party-builder',
    ]);

    $retired = tiny_birthdays_find_page('about-birthdays-revised', $landing_id);
    if ($retired) {
        delete_post_meta($retired->ID, TINY_CAFE_META);
        wp_trash_post($retired->ID);
    }

    $cakes_id = tiny_cafe_upsert_page([
        'slug' => 'cakes',
        'title' => 'Custom Birthday Cakes in Berawa, Bali | Tiny Healthy Cafe',
        'excerpt' => 'Custom birthday cakes baked at Tiny in Berawa, Bali — any theme, with flourless and no-added-sugar sponges available. Order at least 2 days ahead.',
        'type' => 'cakes',
        'content' => tiny_birthdays_default_cakes_content(),
        'require_block' => 'wp:tiny/cake-app',
    ]);

    $events_id = tiny_cafe_upsert_page([
        'slug' => 'events',
        'title' => 'Events | Tiny Healthy Cafe',
        'excerpt' => 'Workshops, gatherings and happenings at Tiny Healthy Cafe in Berawa, Bali. See what’s on this week and join the guest list.',
        'type' => 'events',
        'content' => "<!-- wp:tiny/events /-->\n",
        'require_block' => 'wp:tiny/events',
    ]);

    $reserve_id = tiny_cafe_upsert_page([
        'slug' => 'reserve',
        'title' => 'Reserve a Table | Tiny Healthy Cafe',
        'excerpt' => 'Book a table at Tiny Healthy Cafe in Berawa, Bali. Pick date, time and a table, then send the request on WhatsApp.',
        'type' => 'reserve',
        'content' => "<!-- wp:tiny/reserve /-->\n",
        'require_block' => 'wp:tiny/reserve',
    ]);

    $booking_id = tiny_cafe_upsert_page([
        'slug' => 'booking',
        'title' => 'Your booking | Tiny Healthy Cafe',
        'excerpt' => 'View and manage your Tiny Healthy Cafe reservation or birthday booking in Berawa, Bali.',
        'type' => 'booking',
        'content' => "<!-- wp:tiny/booking /-->\n",
        'require_block' => 'wp:tiny/booking',
    ]);

    $location_id = tiny_cafe_upsert_page([
        'slug' => 'location',
        'title' => 'Our Location | Tiny Healthy Cafe',
        'excerpt' => 'Find Tiny Healthy Family Cafe in Berawa, Bali. Open every day 8:30am to 8pm. Get directions on Google Maps.',
        'type' => 'location',
        'content' => "<!-- wp:tiny/location /-->\n",
        'require_block' => 'wp:tiny/location',
    ]);

    $menu_id = tiny_cafe_upsert_page([
        'slug' => 'menu',
        'title' => 'Our Menu | Tiny Healthy Cafe',
        'excerpt' => 'Tiny Healthy Cafe menus in Berawa, Bali: food, drinks and nights menu. View online or download the PDF.',
        'type' => 'menu',
        'content' => "<!-- wp:tiny/menu /-->\n",
        'require_block' => 'wp:tiny/menu',
    ]);

    update_option('tiny_cafe_pages', [
        'home' => $home_id,
        'landing' => $landing_id,
        'builder' => $builder_id,
        'cakes' => $cakes_id,
        'events' => $events_id,
        'reserve' => $reserve_id,
        'booking' => $booking_id,
        'location' => $location_id,
        'menu' => $menu_id,
    ]);

    // Prefer Tiny Home as the static front page once it exists (works for drafts too in WP).
    if ($home_id) {
        update_option('show_on_front', 'page');
        update_option('page_on_front', $home_id);
    }
}

function tiny_cafe_upsert_home_page() {
    $existing = tiny_birthdays_find_page('home', 0);
    $content = "<!-- wp:tiny/home /-->\n";
    $payload = [
        'post_title' => 'Home | Tiny Healthy Cafe',
        'post_name' => 'home',
        'post_type' => 'page',
        'post_parent' => 0,
        'post_excerpt' => 'Tiny Healthy Cafe in Berawa, Bali: wholesome food without refined sugar, plus a safe play area for kids.',
        'comment_status' => 'closed',
        'ping_status' => 'closed',
    ];

    if ($existing) {
        $payload['ID'] = $existing->ID;
        $payload['post_status'] = $existing->post_status;
        if (strpos((string) $existing->post_content, 'wp:tiny/home') === false) {
            $payload['post_content'] = $content;
        }
        $id = wp_update_post($payload, true);
    } else {
        $payload['post_status'] = 'draft';
        $payload['post_content'] = $content;
        $id = wp_insert_post($payload, true);
    }

    if (is_wp_error($id) || !$id) {
        return 0;
    }
    delete_post_meta($id, TINY_CAFE_META);
    update_post_meta($id, '_wp_page_template', 'default');
    return (int) $id;
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

function tiny_birthdays_disable_wpautop() {
    if (!tiny_birthdays_is_canvas() && !is_front_page()) {
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
        if ($type === 'builder') {
            $classes[] = 'is-wizard';
        }
        if ($type === 'menu') {
            $classes[] = 'dm-page';
        }
    }
    return $classes;
}

function tiny_birthdays_allowed_blocks($allowed, $context) {
    $post = isset($context->post) ? $context->post : null;
    if (!$post || $post->post_type !== 'page') {
        return $allowed;
    }
    $type = tiny_birthdays_canvas_type($post->ID);
    $is_home = (int) get_option('page_on_front') === (int) $post->ID
        || $post->post_name === 'home';
    if (!$type && !$is_home) {
        return $allowed;
    }
    $blocks = [
        'tiny/home',
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
        'core/paragraph',
        'core/heading',
        'core/image',
        'core/spacer',
    ];
    return $blocks;
}

function tiny_cafe_admin_notice() {
    if (!current_user_can('switch_themes')) {
        return;
    }
    if (!get_option('tiny_cafe_show_notice')) {
        return;
    }
    if (isset($_GET['tiny_cafe_notice']) && $_GET['tiny_cafe_notice'] === 'dismiss') {
        check_admin_referer('tiny_cafe_notice');
        delete_option('tiny_cafe_show_notice');
        return;
    }
    $dismiss = wp_nonce_url(
        add_query_arg('tiny_cafe_notice', 'dismiss'),
        'tiny_cafe_notice'
    );
    $pages_url = admin_url('edit.php?post_type=page');
    echo '<div class="notice notice-info is-dismissible"><p><strong>Tiny Cafe</strong> created Home, Birthdays, Builder, Cakes, Events, Reservations, Booking, Location and Menu as <em>drafts</em>. Open <a href="' . esc_url($pages_url) . '">Pages</a>, edit and Preview, then Publish when ready. Home is set as the front page — publish it to show it to visitors. On Hostinger, rename physical <code>public_html/birthdays</code>, <code>cakes</code>, <code>events</code>, <code>reserve</code>, <code>booking</code>, <code>location</code> and <code>menu</code> folders so WordPress owns those URLs. Keep <code>/staff/</code>. Then Settings → Permalinks → Save. Deactivate the old Tiny Birthdays plugin if it is installed. <a href="' . esc_url($dismiss) . '">Dismiss</a></p></div>';
}
