<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// Instagram プロキシ API
// トークンはWordPress管理画面 > 設定 > JSBB大会設定で管理
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/instagram', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_instagram_posts',
        'permission_callback' => '__return_true',
    ));
    register_rest_route('jsbb/v1', '/instagram/refresh-token', array(
        'methods' => 'POST',
        'callback' => 'jsbb_refresh_instagram_token',
        'permission_callback' => function() { return current_user_can('manage_options'); },
    ));
    register_rest_route('jsbb/v1', '/instagram/clear-cache', array(
        'methods' => 'POST',
        'callback' => 'jsbb_clear_instagram_cache',
        'permission_callback' => function() { return current_user_can('manage_options'); },
    ));
    // デバッグ用：生データ確認（管理者のみ）
    register_rest_route('jsbb/v1', '/instagram/debug', array(
        'methods' => 'GET',
        'callback' => 'jsbb_debug_instagram_posts',
        'permission_callback' => function() { return current_user_can('manage_options'); },
    ));
});

function jsbb_get_instagram_token() {
    // 優先順位: WPオプション > wp-config定数
    $token = get_option('jsbb_instagram_access_token', '');
    if (empty($token) && defined('JSBB_INSTAGRAM_ACCESS_TOKEN')) {
        $token = JSBB_INSTAGRAM_ACCESS_TOKEN;
    }
    return $token;
}

function jsbb_get_instagram_posts() {
    $token = jsbb_get_instagram_token();

    if (empty($token)) {
        return new WP_REST_Response(array(), 200);
    }

    // キャッシュ確認（30分間）
    $cache_key = 'jsbb_instagram_posts_v2';
    $cached = get_transient($cache_key);
    if ($cached !== false) {
        return new WP_REST_Response($cached, 200);
    }

    // Instagram Graph API で投稿取得
    $ig_url = sprintf(
        'https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count&limit=10&access_token=%s',
        urlencode($token)
    );

    $response = wp_remote_get($ig_url, array('timeout' => 10));

    if (is_wp_error($response)) {
        return new WP_REST_Response(array(), 200);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);
    $data = $body['data'] ?? array();

    // IMAGE / CAROUSEL_ALBUM のみ抽出、最大5件
    $filtered = array();
    foreach ($data as $post) {
        if (in_array($post['media_type'], array('IMAGE', 'CAROUSEL_ALBUM'), true)) {
            $filtered[] = $post;
        }
        if (count($filtered) >= 5) break;
    }

    // 各投稿のreach（閲覧数）を取得
    $posts = array();
    foreach ($filtered as $post) {
        $impressions = 0;
        $insights_url = sprintf(
            'https://graph.instagram.com/%s/insights?metric=reach&access_token=%s',
            $post['id'],
            urlencode($token)
        );
        $insights_response = wp_remote_get($insights_url, array('timeout' => 5));
        if (!is_wp_error($insights_response)) {
            $insights_body = json_decode(wp_remote_retrieve_body($insights_response), true);
            if (isset($insights_body['data'][0]['values'][0]['value'])) {
                $impressions = (int) $insights_body['data'][0]['values'][0]['value'];
            }
        }

        $posts[] = array(
            'id'          => $post['id'],
            'image'       => $post['media_url'],
            'media_url'   => $post['media_url'],
            'media_type'  => $post['media_type'],
            'caption'     => $post['caption'] ?? '',
            'permalink'   => $post['permalink'],
            'timestamp'   => $post['timestamp'],
            'likeCount'   => $post['like_count'] ?? 0,
            'impressions' => $impressions,
        );
    }

    // 30分間キャッシュ
    set_transient($cache_key, $posts, 1800);

    return new WP_REST_Response($posts, 200);
}

// トークンをInstagram APIで60日延長
function jsbb_refresh_instagram_token() {
    $token = jsbb_get_instagram_token();

    if (empty($token)) {
        return new WP_REST_Response(array('error' => 'トークンが設定されていません'), 400);
    }

    $refresh_url = sprintf(
        'https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=%s',
        urlencode($token)
    );

    $response = wp_remote_get($refresh_url, array('timeout' => 15));

    if (is_wp_error($response)) {
        return new WP_REST_Response(array('error' => $response->get_error_message()), 500);
    }

    $body = json_decode(wp_remote_retrieve_body($response), true);

    if (!empty($body['access_token'])) {
        update_option('jsbb_instagram_access_token', sanitize_text_field($body['access_token']));
        $expires_in = $body['expires_in'] ?? 5183944;
        $expires_at = time() + (int)$expires_in;
        update_option('jsbb_instagram_token_expires_at', $expires_at);

        // キャッシュもクリア
        delete_transient('jsbb_instagram_posts_v2');

        return new WP_REST_Response(array(
            'success'    => true,
            'message'    => 'トークンを更新しました',
            'expires_at' => date('Y年m月d日', $expires_at),
        ), 200);
    }

    $error_msg = $body['error']['message'] ?? '不明なエラー';
    return new WP_REST_Response(array('error' => $error_msg), 400);
}

// キャッシュクリア
function jsbb_clear_instagram_cache() {
    delete_transient('jsbb_instagram_posts_v2');
    return new WP_REST_Response(array('success' => true, 'message' => 'キャッシュをクリアしました'), 200);
}
