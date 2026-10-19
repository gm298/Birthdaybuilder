<?php
/**
 * Default page template — use for future simple content pages.
 */
if (!defined('ABSPATH')) {
    exit;
}

if (tiny_birthdays_is_canvas()) {
    include TINY_CAFE_DIR . 'templates/canvas.php';
    return;
}

get_header();
?>
<main>
  <?php while (have_posts()) : the_post(); ?>
    <article <?php post_class('tiny-page'); ?>>
      <div class="tiny-page__inner">
        <h1><?php the_title(); ?></h1>
        <?php the_content(); ?>
      </div>
    </article>
  <?php endwhile; ?>
</main>
<?php
get_footer();
