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
        $has_tiny = strpos((string) $existing->post_content, 'wp:tiny/') !== false;
        if (!$has_tiny) {
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
        'title' => 'Kids Birthdays in Berawa, Bali | Tiny Healthy Cafe',
        'excerpt' => 'All-inclusive kids birthday celebrations on Tiny’s private tropical terrace in Berawa, Bali — cake, decor, food and entertainment. Book a free cake tasting.',
        'type' => 'landing',
        'content' => tiny_birthdays_default_landing_content(),
    ]);

    $builder_id = tiny_birthdays_upsert_page([
        'slug' => 'builder',
        'parent' => $landing_id,
        'title' => 'Build Your Birthday | Tiny Healthy Cafe',
        'excerpt' => 'Build your Tiny birthday in Berawa, Bali — package, decorations, cake, add-ons and food, then send the plan to WhatsApp.',
        'type' => 'builder',
        'content' => "<!-- wp:tiny/party-builder /-->\n",
    ]);

    $revised_id = tiny_birthdays_upsert_page([
        'slug' => 'about-birthdays-revised',
        'parent' => $landing_id,
        'title' => 'About Birthdays Revised | Tiny Healthy Cafe',
        'excerpt' => 'Dream birthday for your child at Tiny — cake, food, decor and entertainment. See packages, build your party, or book a free cake tasting.',
        'type' => 'landing-revised',
        'content' => "<!-- wp:tiny/landing-revised /-->\n",
    ]);

    $cakes_id = tiny_birthdays_upsert_page([
        'slug' => 'cakes',
        'title' => 'Custom Birthday Cakes in Berawa, Bali | Tiny Healthy Cafe',
        'excerpt' => 'Custom birthday cakes baked at Tiny in Berawa, Bali — any theme, gluten-free or no added sugar as a paid add-on. Order 2 days ahead via WhatsApp.',
        'type' => 'cakes',
        'content' => tiny_birthdays_default_cakes_content(),
    ]);

    update_option('tiny_birthdays_pages', [
        'landing' => $landing_id,
        'landing-revised' => $revised_id,
        'builder' => $builder_id,
        'cakes' => $cakes_id,
    ]);

    update_option('tiny_birthdays_show_notice', 1);
}

function tiny_birthdays_default_landing_content() {
    return implode("\n", [
        '<!-- wp:tiny/hero /-->',
        '<!-- wp:tiny/included /-->',
        '<!-- wp:tiny/gallery /-->',
        '<!-- wp:tiny/reviews /-->',
        '<!-- wp:tiny/packages /-->',
        '<!-- wp:tiny/cake-promo /-->',
        '<!-- wp:tiny/faq /-->',
        '<!-- wp:tiny/closing /-->',
        '<!-- wp:tiny/sticky-bar /-->',
        '',
    ]);
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
        'tiny/hero',
        'tiny/included',
        'tiny/gallery',
        'tiny/reviews',
        'tiny/packages',
        'tiny/cake-promo',
        'tiny/faq',
        'tiny/closing',
        'tiny/sticky-bar',
        'tiny/landing-revised',
        'tiny/party-builder',
        'tiny/cakes-hero',
        'tiny/cakes-facts',
        'tiny/cake-app',
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
    echo '<div class="notice notice-info is-dismissible"><p><strong>Tiny Birthdays</strong> created Birthdays, Build your party, and Cakes pages. On Hostinger, rename or remove the physical <code>public_html/birthdays</code> and <code>public_html/cakes</code> folders so WordPress can serve those URLs. Keep <code>/staff/</code> and the Supabase backend as they are. Then Settings → Permalinks → Save. <a href="' . esc_url($dismiss) . '">Dismiss</a></p></div>';
}
