<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * The theme home page (and its footer) link to Google Maps and the Google Drive
 * menu folder. Point those links at the Tiny Location and Menu pages instead.
 */
function tiny_birthdays_theme_links($block_content, $block) {
    if (is_admin() || tiny_birthdays_is_canvas() || stripos($block_content, '<a') === false) {
        return $block_content;
    }
    return preg_replace_callback('#<a\b[^>]*>#i', 'tiny_birthdays_rewrite_theme_link', $block_content);
}

function tiny_birthdays_theme_link_target($href) {
    $href = html_entity_decode($href);
    if (preg_match('#google\.[a-z.]+/maps/place/Tiny#i', $href)) {
        return tiny_birthdays_page_url('location');
    }
    if (strpos($href, 'drive.google.com/drive/folders/1-Ubm3u3EvXdcDY-TdVo_sA4bPH5s5ARI') !== false) {
        return tiny_birthdays_page_url('menu');
    }
    $menu_files = [
        '18dgwWbtZp4z5MdMcVhl5wQ02Xy6OyOxA' => 'food',
        '1Caj7nlgsHa64RMRe-3O4IGnzyfuY6xbV' => 'food',
        '1UsLRDpT79rGejO9AM0OR8RC-KFxF01Kn' => 'drinks',
        '1sFX4Vs4DZ5SW0JVD62-1tRSudEIoy_xD' => 'nights',
    ];
    foreach ($menu_files as $file_id => $menu) {
        if (strpos($href, '/file/d/' . $file_id) !== false) {
            return trailingslashit(tiny_birthdays_page_url('menu')) . '#' . $menu;
        }
    }
    return '';
}

function tiny_birthdays_rewrite_theme_link($match) {
    $tag = $match[0];
    if (!preg_match('#\shref=(["\'])(.*?)\1#i', $tag, $href)) {
        return $tag;
    }
    $target = tiny_birthdays_theme_link_target($href[2]);
    if ($target === '') {
        return $tag;
    }
    $tag = str_replace($href[0], ' href="' . esc_url($target) . '"', $tag);
    return preg_replace('#\s(target|rel)=(["\'])[^"\']*\2#i', '', $tag);
}
