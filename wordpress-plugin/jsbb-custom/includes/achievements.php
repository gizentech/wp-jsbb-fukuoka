<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 実績（achievements）管理
// ==========================================

// GET: 実績データ取得
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/achievements', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_achievements',
        'permission_callback' => '__return_true'
    ));
});

function jsbb_get_achievements() {
    $data = get_option('jsbb_achievements', array());
    return new WP_REST_Response($data, 200);
}

// POST: 実績データ一括登録
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/achievements', array(
        'methods' => 'POST',
        'callback' => 'jsbb_save_achievements',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));
});

function jsbb_save_achievements($request) {
    $items = $request->get_json_params();

    if (!is_array($items)) {
        return new WP_Error('invalid_data', 'データは配列で送信してください', array('status' => 400));
    }

    $clean = array();
    foreach ($items as $item) {
        if (empty($item['year']) || empty($item['team']) || empty($item['achievement'])) {
            continue;
        }
        $clean[] = array(
            'year'        => sanitize_text_field($item['year']),
            'team'        => sanitize_text_field($item['team']),
            'achievement' => sanitize_text_field($item['achievement']),
        );
    }

    update_option('jsbb_achievements', $clean);

    return new WP_REST_Response(array(
        'message' => count($clean) . '件の実績を登録しました',
        'count'   => count($clean),
    ), 200);
}

// ==========================================
