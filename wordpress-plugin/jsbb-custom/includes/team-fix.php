<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// チームteam_class一括修正API
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/fix-team-classes', array(
        'methods' => 'POST',
        'callback' => 'jsbb_fix_team_classes',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));
});

function jsbb_fix_team_classes($request) {
    $items = $request->get_json_params();
    if (!is_array($items)) {
        return new WP_Error('invalid_data', 'データは配列で送信してください', array('status' => 400));
    }

    $updated = 0;
    $skipped = 0;

    foreach ($items as $item) {
        $external_id = sanitize_text_field($item['external_id'] ?? '');

        if (empty($external_id)) {
            $skipped++;
            continue;
        }

        $existing = get_posts(array(
            'post_type' => 'team',
            'meta_key' => '_team_external_id',
            'meta_value' => $external_id,
            'posts_per_page' => 1,
            'post_status' => 'any',
        ));

        if (empty($existing)) {
            $skipped++;
            continue;
        }

        $post_id = $existing[0]->ID;
        $did_update = false;

        // team_classタクソノミー（階層的なのでwp_set_object_termsを使用）
        $team_class = sanitize_text_field($item['team_class'] ?? '');
        if ($team_class) {
            $result = wp_set_object_terms($post_id, array($team_class), 'team_class');
            if ($result && !is_wp_error($result)) $did_update = true;
        }

        // 都道府県タクソノミー（階層的なのでwp_set_object_termsを使用）
        $prefecture = sanitize_text_field($item['prefecture'] ?? '');
        if ($prefecture) {
            $result = wp_set_object_terms($post_id, array($prefecture), 'prefecture');
            if ($result && !is_wp_error($result)) $did_update = true;
        }

        // メタデータ更新
        $meta_fields = array(
            'status' => '_team_status',
            'ball_type' => '_team_ball_type',
            'team_type' => '_team_type',
            'school_type' => '_team_school_type',
            'city' => '_team_city',
            'registered_date' => '_team_registered_date',
            'suspension_date' => '_team_suspension_date',
            'resumption_date' => '_team_resumption_date',
            'withdrawal_date' => '_team_withdrawal_date',
        );

        foreach ($meta_fields as $json_key => $meta_key) {
            $value = sanitize_text_field($item[$json_key] ?? '');
            if ($value !== '') {
                update_post_meta($post_id, $meta_key, $value);
                $did_update = true;
            }
        }

        if ($did_update) {
            $updated++;
        } else {
            $skipped++;
        }
    }

    return new WP_REST_Response(array(
        'message' => "チーム修正: {$updated}件更新, {$skipped}件スキップ",
        'updated' => $updated,
        'skipped' => $skipped,
    ), 200);
}

// ==========================================
// チームWP ID指定 一括更新API
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/update-teams-by-id', array(
        'methods' => 'POST',
        'callback' => 'jsbb_update_teams_by_id',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));
});

function jsbb_update_teams_by_id($request) {
    $items = $request->get_json_params();
    if (!is_array($items)) {
        return new WP_Error('invalid_data', 'データは配列で送信してください', array('status' => 400));
    }

    $updated = 0;
    $skipped = 0;

    // 支部キャッシュ
    $branch_cache = array();
    $all_branches = get_posts(array(
        'post_type' => 'branch',
        'posts_per_page' => -1,
        'post_status' => 'any',
    ));
    foreach ($all_branches as $b) {
        $branch_cache[$b->post_title] = $b->ID;
    }

    foreach ($items as $item) {
        $wp_id = intval($item['id'] ?? 0);
        if (!$wp_id) {
            $skipped++;
            continue;
        }

        $post = get_post($wp_id);
        if (!$post || $post->post_type !== 'team') {
            $skipped++;
            continue;
        }

        $did_update = false;

        // チーム名更新
        $name = sanitize_text_field($item['name'] ?? '');
        if ($name && $name !== $post->post_title) {
            wp_update_post(array('ID' => $wp_id, 'post_title' => $name));
            $did_update = true;
        }

        // team_classタクソノミー
        $team_class = sanitize_text_field($item['team_class'] ?? '');
        if ($team_class) {
            $result = wp_set_object_terms($wp_id, array($team_class), 'team_class');
            if ($result && !is_wp_error($result)) $did_update = true;
        }

        // 支部紐付け
        $branch_name = sanitize_text_field($item['branch'] ?? '');
        if ($branch_name && isset($branch_cache[$branch_name])) {
            update_post_meta($wp_id, '_team_branch_id', $branch_cache[$branch_name]);
            $did_update = true;
        }

        // 都道府県
        $prefecture = sanitize_text_field($item['prefecture'] ?? '');
        if ($prefecture) {
            wp_set_object_terms($wp_id, array($prefecture), 'prefecture');
            $did_update = true;
        }

        if ($did_update) {
            $updated++;
        } else {
            $skipped++;
        }
    }

    return new WP_REST_Response(array(
        'message' => "チーム更新: {$updated}件更新, {$skipped}件スキップ",
        'updated' => $updated,
        'skipped' => $skipped,
    ), 200);
}

// ==========================================
