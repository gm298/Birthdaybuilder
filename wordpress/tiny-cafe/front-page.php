<?php
/**
 * Site home — Tiny home layout (editable via the Tiny Home block on the front page).
 */
if (!defined('ABSPATH')) {
    exit;
}

$type = 'home';
$body_classes = ['tiny-home'];
if (is_admin_bar_showing()) {
    $body_classes[] = 'admin-bar';
}
$post_id = get_queried_object_id();
$title = wp_get_document_title();
$description = $post_id ? (string) get_post_field('post_excerpt', $post_id) : '';
if ($description === '' && $post_id) {
    $description = wp_strip_all_tags(get_post_meta($post_id, '_yoast_wpseo_metadesc', true));
}
if ($description === '') {
    $description = 'Tiny Healthy Cafe in Berawa, Bali: wholesome food without refined sugar, no deep-frying and no bad oils, plus a safe Montessori-inspired play area for kids.';
}
$canonical = home_url('/');
$og_image = tiny_birthdays_asset('home/img/hero.jpg');
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo esc_html($title); ?></title>
  <meta name="description" content="<?php echo esc_attr($description); ?>">
  <link rel="canonical" href="<?php echo esc_url($canonical); ?>">
  <meta property="og:type" content="website">
  <meta property="og:url" content="<?php echo esc_url($canonical); ?>">
  <meta property="og:title" content="<?php echo esc_attr($title); ?>">
  <meta property="og:description" content="<?php echo esc_attr($description); ?>">
  <meta property="og:image" content="<?php echo esc_url($og_image); ?>">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <?php wp_head(); ?>
</head>
<body data-page="<?php echo esc_attr($type); ?>" class="<?php echo esc_attr(implode(' ', $body_classes)); ?>">
<?php wp_body_open(); ?>
  <div id="site-chrome-header"></div>
  <main>
    <?php
    if (have_posts()) {
        while (have_posts()) {
            the_post();
            $content = get_the_content();
            if (strpos((string) $content, 'wp:tiny/home') !== false || has_block('tiny/home')) {
                echo apply_filters('the_content', $content);
            } else {
                echo tiny_cafe_render_home([]);
            }
        }
    } else {
        echo tiny_cafe_render_home([]);
    }
    ?>
  </main>
  <div id="site-chrome-footer"></div>
  <?php wp_footer(); ?>
</body>
</html>
