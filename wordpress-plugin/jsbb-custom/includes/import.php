<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// チーム・支部 一括インポートAPI
// ==========================================
add_action('rest_api_init', function () {
    // 支部一括登録
    register_rest_route('jsbb/v1', '/import-branches', array(
        'methods' => 'POST',
        'callback' => 'jsbb_import_branches',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));

    // チーム一括登録
    register_rest_route('jsbb/v1', '/import-teams', array(
        'methods' => 'POST',
        'callback' => 'jsbb_import_teams',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));
});

function jsbb_import_branches($request) {
    $items = $request->get_json_params();
    if (!is_array($items)) {
        return new WP_Error('invalid_data', 'データは配列で送信してください', array('status' => 400));
    }

    $created = 0;
    $skipped = 0;
    $results = array();

    foreach ($items as $item) {
        $name = sanitize_text_field($item['name'] ?? '');
        $external_id = sanitize_text_field($item['external_id'] ?? '');
        $prefecture = sanitize_text_field($item['prefecture'] ?? '');

        if (empty($name)) continue;

        // 既存チェック（external_idで）
        if ($external_id) {
            $existing = get_posts(array(
                'post_type' => 'branch',
                'meta_key' => '_branch_external_id',
                'meta_value' => $external_id,
                'posts_per_page' => 1,
                'post_status' => 'any',
            ));
            if (!empty($existing)) {
                $skipped++;
                $results[] = array('name' => $name, 'id' => $existing[0]->ID, 'action' => 'skipped');
                continue;
            }
        }

        // タイトルでも既存チェック
        $existing_by_title = get_posts(array(
            'post_type' => 'branch',
            'title' => $name,
            'posts_per_page' => 1,
            'post_status' => 'any',
        ));
        if (!empty($existing_by_title)) {
            if ($external_id) {
                update_post_meta($existing_by_title[0]->ID, '_branch_external_id', $external_id);
            }
            $skipped++;
            $results[] = array('name' => $name, 'id' => $existing_by_title[0]->ID, 'action' => 'skipped');
            continue;
        }

        $post_id = wp_insert_post(array(
            'post_type' => 'branch',
            'post_title' => $name,
            'post_status' => 'publish',
        ));

        if ($post_id && !is_wp_error($post_id)) {
            if ($external_id) {
                update_post_meta($post_id, '_branch_external_id', $external_id);
            }
            if ($prefecture) {
                wp_set_object_terms($post_id, array($prefecture), 'prefecture');
            }
            $created++;
            $results[] = array('name' => $name, 'id' => $post_id, 'action' => 'created');
        }
    }

    return new WP_REST_Response(array(
        'message' => "支部: {$created}件作成, {$skipped}件スキップ",
        'created' => $created,
        'skipped' => $skipped,
        'results' => $results,
    ), 200);
}

function jsbb_import_teams($request) {
    $items = $request->get_json_params();
    if (!is_array($items)) {
        return new WP_Error('invalid_data', 'データは配列で送信してください', array('status' => 400));
    }

    $created = 0;
    $skipped = 0;
    $errors = 0;

    // 支部キャッシュ（external_id → post_id）
    $branch_cache = array();
    $all_branches = get_posts(array(
        'post_type' => 'branch',
        'posts_per_page' => -1,
        'post_status' => 'any',
    ));
    foreach ($all_branches as $b) {
        $ext_id = get_post_meta($b->ID, '_branch_external_id', true);
        if ($ext_id) {
            $branch_cache[$ext_id] = $b->ID;
        }
        $branch_cache['name:' . $b->post_title] = $b->ID;
    }

    foreach ($items as $item) {
        $name = sanitize_text_field($item['name'] ?? '');
        $external_id = sanitize_text_field($item['external_id'] ?? '');
        $status = sanitize_text_field($item['status'] ?? '活動');
        $team_class = sanitize_text_field($item['team_class'] ?? '');
        $prefecture = sanitize_text_field($item['prefecture'] ?? '');
        $branch_external_id = sanitize_text_field($item['branch_external_id'] ?? '');
        $branch_name = sanitize_text_field($item['branch_name'] ?? '');
        $ball_type = sanitize_text_field($item['ball_type'] ?? '');
        $team_type = sanitize_text_field($item['team_type'] ?? '');
        $school_type = sanitize_text_field($item['school_type'] ?? '');
        $registered_date = sanitize_text_field($item['registered_date'] ?? '');

        if (empty($name)) continue;

        // 既存チェック（external_idで）
        if ($external_id) {
            $existing = get_posts(array(
                'post_type' => 'team',
                'meta_key' => '_team_external_id',
                'meta_value' => $external_id,
                'posts_per_page' => 1,
                'post_status' => 'any',
            ));
            if (!empty($existing)) {
                $skipped++;
                continue;
            }
        }

        $post_id = wp_insert_post(array(
            'post_type' => 'team',
            'post_title' => $name,
            'post_status' => 'publish',
        ));

        if (!$post_id || is_wp_error($post_id)) {
            $errors++;
            continue;
        }

        // メタデータ保存
        if ($external_id) update_post_meta($post_id, '_team_external_id', $external_id);
        if ($status) update_post_meta($post_id, '_team_status', $status);
        if ($ball_type) update_post_meta($post_id, '_team_ball_type', $ball_type);
        if ($team_type) update_post_meta($post_id, '_team_type', $team_type);
        if ($school_type) update_post_meta($post_id, '_team_school_type', $school_type);
        if ($registered_date) update_post_meta($post_id, '_team_registered_date', $registered_date);

        // 支部紐付け
        $branch_id = 0;
        if ($branch_external_id && isset($branch_cache[$branch_external_id])) {
            $branch_id = $branch_cache[$branch_external_id];
        } elseif ($branch_name && isset($branch_cache['name:' . $branch_name])) {
            $branch_id = $branch_cache['name:' . $branch_name];
        }
        if ($branch_id) {
            update_post_meta($post_id, '_team_branch_id', $branch_id);
        }

        // タクソノミー設定
        if ($team_class) {
            wp_set_object_terms($post_id, array($team_class), 'team_class');
        }
        if ($prefecture) {
            wp_set_object_terms($post_id, array($prefecture), 'prefecture');
        }

        $created++;
    }

    return new WP_REST_Response(array(
        'message' => "チーム: {$created}件作成, {$skipped}件スキップ, {$errors}件エラー",
        'created' => $created,
        'skipped' => $skipped,
        'errors' => $errors,
    ), 200);
}

// ==========================================
