<?php
if (!defined('ABSPATH')) {
    exit;
}
get_header();
?>
<main>
  <?php if (have_posts()) : ?>
    <?php while (have_posts()) : the_post(); ?>
      <article <?php post_class('tiny-page'); ?>>
        <div class="tiny-page__inner">
          <h1><?php the_title(); ?></h1>
          <?php the_content(); ?>
        </div>
      </article>
    <?php endwhile; ?>
  <?php else : ?>
    <article class="tiny-page">
      <div class="tiny-page__inner">
        <h1><?php esc_html_e('Nothing here yet', 'tiny-cafe'); ?></h1>
      </div>
    </article>
  <?php endif; ?>
</main>
<?php
get_footer();
