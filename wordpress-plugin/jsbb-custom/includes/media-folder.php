<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// メディアアクセス制御
// aoki/fukuoka は自分がアップロードした画像のみ表示
// open/admin は全画像を表示
// ==========================================

/**
 * open/admin 以外は自分の画像のみに制限すべきか
 */
function jsbb_should_restrict_media() {
    $user = wp_get_current_user();
    if (!$user || !$user->exists()) return false;
    if (in_array($user->user_login, array('open', 'admin'), true)) return false;
    return true;
}

/**
 * メディアライブラリのクエリを制御（リスト表示）
 * 自分がアップロードした画像のみ表示
 */
add_action('pre_get_posts', function($query) {
    if (!is_admin()) return;
    if (!jsbb_should_restrict_media()) return;

    $post_type = $query->get('post_type');
    $is_attachment = is_array($post_type)
        ? in_array('attachment', $post_type, true)
        : ($post_type === 'attachment');
    if (!$is_attachment) return;

    $query->set('author', get_current_user_id());
});

/**
 * メディアモーダル（グリッド表示・投稿画面のメディア追加）にも同じ制限を適用
 */
add_filter('ajax_query_attachments_args', function($query) {
    if (!jsbb_should_restrict_media()) return $query;

    $query['author'] = get_current_user_id();
    return $query;
});
