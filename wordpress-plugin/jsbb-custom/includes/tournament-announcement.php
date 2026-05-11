<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 大会実施判断 カスタム投稿タイプ & REST API
// ==========================================

add_action('init', function () {
    register_post_type('tournament_ann', array(
        'labels' => array(
            'name'               => '大会実施判断',
            'singular_name'      => '大会実施判断',
            'add_new'            => '新規追加',
            'add_new_item'       => '大会実施判断を追加',
            'edit_item'          => '大会実施判断を編集',
            'view_item'          => '表示',
            'all_items'          => '一覧',
            'search_items'       => '検索',
            'not_found'          => '見つかりません',
        ),
        'public'            => false,
        'show_ui'           => true,
        'show_in_menu'      => true,
        'show_in_rest'      => true,
        'supports'          => array('title', 'editor'),
        'capability_type'   => 'post',
        'menu_icon'         => 'dashicons-megaphone',
        'menu_position'     => 6,
    ));
});

// REST API エンドポイント
add_action('rest_api_init', function () {

    // GET: 公開（表示=publish）のお知らせ一覧（認証不要）
    register_rest_route('jsbb/v1', '/announcements', array(
        'methods'             => 'GET',
        'callback'            => 'jsbb_get_announcements_public',
        'permission_callback' => '__return_true',
    ));

    // GET: 全件（下書き含む）一覧（認証必要）
    register_rest_route('jsbb/v1', '/announcements/all', array(
        'methods'             => 'GET',
        'callback'            => 'jsbb_get_announcements_all',
        'permission_callback' => 'jsbb_ann_auth',
    ));

    // POST: 新規作成
    register_rest_route('jsbb/v1', '/announcements', array(
        'methods'             => 'POST',
        'callback'            => 'jsbb_create_announcement',
        'permission_callback' => 'jsbb_ann_auth',
    ));

    // PUT: 更新
    register_rest_route('jsbb/v1', '/announcements/(?P<id>\d+)', array(
        'methods'             => 'PUT',
        'callback'            => 'jsbb_update_announcement',
        'permission_callback' => 'jsbb_ann_auth',
    ));

    // DELETE: 削除
    register_rest_route('jsbb/v1', '/announcements/(?P<id>\d+)', array(
        'methods'             => 'DELETE',
        'callback'            => 'jsbb_delete_announcement',
        'permission_callback' => 'jsbb_ann_auth',
    ));
});

function jsbb_ann_auth() {
    return current_user_can('edit_posts');
}

function jsbb_ann_format($post) {
    return array(
        'id'       => $post->ID,
        'title'    => $post->post_title,
        'content'  => $post->post_content,
        'visible'  => $post->post_status === 'publish',
        'date'     => $post->post_date,
        'modified' => $post->post_modified,
    );
}

function jsbb_get_announcements_public($request) {
    $posts = get_posts(array(
        'post_type'      => 'tournament_ann',
        'post_status'    => 'publish',
        'posts_per_page' => 50,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ));
    return array_map('jsbb_ann_format', $posts);
}

function jsbb_get_announcements_all($request) {
    $posts = get_posts(array(
        'post_type'      => 'tournament_ann',
        'post_status'    => array('publish', 'draft'),
        'posts_per_page' => 100,
        'orderby'        => 'date',
        'order'          => 'DESC',
    ));
    return array_map('jsbb_ann_format', $posts);
}

function jsbb_create_announcement($request) {
    $data    = $request->get_json_params();
    $visible = isset($data['visible']) ? (bool) $data['visible'] : true;

    $post_id = wp_insert_post(array(
        'post_type'    => 'tournament_ann',
        'post_title'   => sanitize_text_field($data['title'] ?? '無題'),
        'post_content' => wp_kses_post($data['content'] ?? ''),
        'post_status'  => $visible ? 'publish' : 'draft',
    ));

    if (is_wp_error($post_id)) {
        return new WP_Error('create_failed', '作成に失敗しました', array('status' => 500));
    }
    return jsbb_ann_format(get_post($post_id));
}

function jsbb_update_announcement($request) {
    $id   = intval($request['id']);
    $data = $request->get_json_params();

    $post = get_post($id);
    if (!$post || $post->post_type !== 'tournament_ann') {
        return new WP_Error('not_found', '見つかりません', array('status' => 404));
    }

    $update = array('ID' => $id);
    if (array_key_exists('title', $data))   $update['post_title']   = sanitize_text_field($data['title']);
    if (array_key_exists('content', $data)) $update['post_content'] = wp_kses_post($data['content']);
    if (array_key_exists('visible', $data)) $update['post_status']  = $data['visible'] ? 'publish' : 'draft';

    $result = wp_update_post($update, true);
    if (is_wp_error($result)) {
        return new WP_Error('update_failed', '更新に失敗しました', array('status' => 500));
    }
    return jsbb_ann_format(get_post($id));
}

function jsbb_delete_announcement($request) {
    $id   = intval($request['id']);
    $post = get_post($id);
    if (!$post || $post->post_type !== 'tournament_ann') {
        return new WP_Error('not_found', '見つかりません', array('status' => 404));
    }
    wp_delete_post($id, true);
    return array('success' => true, 'id' => $id);
}
