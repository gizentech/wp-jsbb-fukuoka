<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// Instagram プロキシ API
// wp-config.php に以下を定義:
//   define('JSBB_INSTAGRAM_ACCESS_TOKEN', '...');
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/instagram', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_instagram_posts',
        'permission_callback' => '__return_true',
    ));
});

function jsbb_get_instagram_posts() {
    $token = defined('JSBB_INSTAGRAM_ACCESS_TOKEN') ? JSBB_INSTAGRAM_ACCESS_TOKEN : '';

    if (empty($token)) {
        return new WP_REST_Response(array(), 200);
    }

    // キャッシュ確認（30分間）
    $cache_key = 'jsbb_instagram_posts';
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
