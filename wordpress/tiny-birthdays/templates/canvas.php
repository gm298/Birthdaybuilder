<?php
if (!defined('ABSPATH')) {
    exit;
}

$type = tiny_birthdays_canvas_type();
if (!$type) {
    $type = 'landing';
}

$data_page = $type === 'builder' ? 'builder' : ($type === 'cakes' ? 'cakes' : 'landing');
$body_classes = ['tiny-canvas', 'tiny-canvas--' . $type];
if ($type === 'builder') {
    $body_classes[] = 'is-wizard';
}
if (is_admin_bar_showing()) {
    $body_classes[] = 'admin-bar';
}

$post_id = get_queried_object_id();
$title = wp_get_document_title();
$description = get_post_field('post_excerpt', $post_id);
if ($description === '') {
    $description = wp_strip_all_tags(get_post_meta($post_id, '_yoast_wpseo_metadesc', true));
}
$canonical = get_permalink($post_id);
$og_image = $type === 'cakes'
    ? tiny_birthdays_asset('cakes/img/og-cakes.jpg')
    : tiny_birthdays_asset('birthdays/img/og-birthdays.webp');
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
  <meta charset="<?php bloginfo('charset'); ?>">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title><?php echo esc_html($title); ?></title>
  <?php if ($description) : ?>
    <meta name="description" content="<?php echo esc_attr($description); ?>">
  <?php endif; ?>
  <link rel="canonical" href="<?php echo esc_url($canonical); ?>">
  <meta property="og:type" content="website">
  <meta property="og:url" content="<?php echo esc_url($canonical); ?>">
  <meta property="og:title" content="<?php echo esc_attr($title); ?>">
  <?php if ($description) : ?>
    <meta property="og:description" content="<?php echo esc_attr($description); ?>">
  <?php endif; ?>
  <meta property="og:image" content="<?php echo esc_url($og_image); ?>">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <?php wp_head(); ?>
</head>
<body data-page="<?php echo esc_attr($data_page); ?>" class="<?php echo esc_attr(implode(' ', $body_classes)); ?>"<?php echo $type === 'builder' ? ' data-builder-step="intro"' : ''; ?>>
  <div id="site-chrome-header"></div>
  <main>
    <?php
    while (have_posts()) {
        the_post();
        echo apply_filters('the_content', get_the_content());
    }
    ?>
  </main>
  <div id="site-chrome-footer"></div>
  <?php wp_footer(); ?>
</body>
</html>
