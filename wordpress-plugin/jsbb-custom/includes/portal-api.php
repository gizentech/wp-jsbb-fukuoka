<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ポータル REST API エンドポイント
// ※ チームは portal_team CPT（既存teamとは独立）
// ==========================================

add_action('rest_api_init', function () {

    // -----------------------------------------------
    // POST /jsbb/v1/portal/otp/send - OTP生成
    // 初回: メール未登録 → 任意のメールでOTP送信（検証後に登録）
    // 2回目以降: 登録済みメールと一致必須
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/otp/send', array(
        'methods'  => 'POST',
        'callback' => function ($request) {
            $params  = $request->get_json_params();
            $team_id = isset($params['team_id']) ? (int) $params['team_id'] : 0;
            $email   = isset($params['email']) ? sanitize_email($params['email']) : '';

            if (!$team_id || !$email) {
                return new WP_Error('bad_request', 'team_idとemailが必要です', array('status' => 400));
            }

            // ポータルチーム存在確認
            $post = get_post($team_id);
            if (!$post || $post->post_type !== 'portal_team') {
                return new WP_Error('not_found', 'チームが見つかりません', array('status' => 404));
            }

            // メール確認: 登録済みなら一致チェック、未登録なら初回登録フロー
            $stored_email = get_post_meta($team_id, '_portal_team_email', true);
            $is_first_login = empty($stored_email);

            if (!$is_first_login && strtolower($stored_email) !== strtolower($email)) {
                return new WP_Error('email_mismatch', '登録されたメールアドレスと一致しません', array('status' => 401));
            }

            // OTP生成
            $result = jsbb_portal_generate_otp($team_id, $email);
            if (is_wp_error($result)) {
                return $result;
            }

            return rest_ensure_response(array(
                'success'        => true,
                'otp_code'       => $result,
                'team_name'      => $post->post_title,
                'is_first_login' => $is_first_login,
            ));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key();
        },
    ));

    // -----------------------------------------------
    // POST /jsbb/v1/portal/otp/verify - OTP検証
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/otp/verify', array(
        'methods'  => 'POST',
        'callback' => function ($request) {
            $params  = $request->get_json_params();
            $team_id = isset($params['team_id']) ? (int) $params['team_id'] : 0;
            $email   = isset($params['email']) ? sanitize_email($params['email']) : '';
            $code    = isset($params['code']) ? sanitize_text_field($params['code']) : '';

            if (!$team_id || !$email || !$code) {
                return new WP_Error('bad_request', '必須項目が不足しています', array('status' => 400));
            }

            $result = jsbb_portal_verify_otp($team_id, $email, $code);
            if (is_wp_error($result)) {
                return $result;
            }

            // 初回ログイン: メールアドレスを登録
            $stored_email = get_post_meta($team_id, '_portal_team_email', true);
            $is_first_login = empty($stored_email);
            if ($is_first_login) {
                update_post_meta($team_id, '_portal_team_email', $email);
            }

            $post = get_post($team_id);
            $team_name = $post ? $post->post_title : '';
            $tournament_ids = jsbb_portal_get_team_tournaments($team_id);

            return rest_ensure_response(array(
                'valid'          => true,
                'team_id'        => $team_id,
                'team_name'      => $team_name,
                'email'          => $email,
                'tournament_ids' => $tournament_ids,
                'is_first_login' => $is_first_login,
            ));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key();
        },
    ));

    // -----------------------------------------------
    // 大会 CRUD（変更なし）
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/tournaments', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $visibility = $request->get_param('visibility');
            $status     = $request->get_param('status');

            $args = array(
                'post_type'      => 'portal_tournament',
                'posts_per_page' => -1,
                'orderby'        => 'date',
                'order'          => 'DESC',
                'post_status'    => 'publish',
            );

            $meta_query = array();
            if ($visibility) {
                $meta_query[] = array('key' => '_portal_tournament_visibility', 'value' => $visibility);
            }
            if ($status) {
                $meta_query[] = array('key' => '_portal_tournament_status', 'value' => $status);
            }
            if (!empty($meta_query)) {
                $args['meta_query'] = $meta_query;
            }

            $posts = get_posts($args);
            $tournaments = array();
            foreach ($posts as $p) {
                $tournaments[] = jsbb_build_portal_tournament($p->ID);
            }

            return rest_ensure_response($tournaments);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    register_rest_route('jsbb/v1', '/portal/tournaments', array(
        'methods'  => 'POST',
        'callback' => function ($request) {
            $params = $request->get_json_params();
            $name   = isset($params['name']) ? sanitize_text_field($params['name']) : '';

            if (!$name) {
                return new WP_Error('bad_request', '大会名が必要です', array('status' => 400));
            }

            $post_id = wp_insert_post(array(
                'post_title'  => $name,
                'post_type'   => 'portal_tournament',
                'post_status' => 'publish',
            ));

            if (is_wp_error($post_id)) {
                return new WP_Error('create_error', '作成に失敗しました', array('status' => 500));
            }

            $meta_fields = array(
                'description'     => '_portal_tournament_description',
                'deadline'        => '_portal_tournament_deadline',
                'visibility'      => '_portal_tournament_visibility',
                'status'          => '_portal_tournament_status',
                'tournament_type' => '_portal_tournament_type',
            );
            foreach ($meta_fields as $key => $meta_key) {
                $value = isset($params[$key]) ? sanitize_text_field($params[$key]) : '';
                if ($key === 'visibility' && !$value) $value = 'private';
                if ($key === 'status' && !$value) $value = 'draft';
                update_post_meta($post_id, $meta_key, $value);
            }

            update_post_meta($post_id, '_portal_tournament_created_at', current_time('mysql'));
            update_post_meta($post_id, '_portal_tournament_team_ids', wp_json_encode(array()));

            return rest_ensure_response(jsbb_build_portal_tournament($post_id));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)', array(
        'methods'  => 'PUT',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_tournament') {
                return new WP_Error('not_found', '大会が見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();

            if (isset($params['name'])) {
                wp_update_post(array(
                    'ID'         => $post_id,
                    'post_title' => sanitize_text_field($params['name']),
                ));
            }

            $meta_fields = array(
                'description'     => '_portal_tournament_description',
                'deadline'        => '_portal_tournament_deadline',
                'visibility'      => '_portal_tournament_visibility',
                'status'          => '_portal_tournament_status',
                'tournament_type' => '_portal_tournament_type',
            );
            foreach ($meta_fields as $key => $meta_key) {
                if (isset($params[$key])) {
                    update_post_meta($post_id, $meta_key, sanitize_text_field($params[$key]));
                }
            }

            return rest_ensure_response(jsbb_build_portal_tournament($post_id));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)', array(
        'methods'  => 'DELETE',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_tournament') {
                return new WP_Error('not_found', '大会が見つかりません', array('status' => 404));
            }

            wp_delete_post($post_id, true);
            return rest_ensure_response(array('success' => true, 'deleted_id' => $post_id));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // -----------------------------------------------
    // 大会チーム割当（portal_team参照）
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/teams', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_tournament') {
                return new WP_Error('not_found', '大会が見つかりません', array('status' => 404));
            }

            $team_ids_json = get_post_meta($post_id, '_portal_tournament_team_ids', true);
            $team_ids = $team_ids_json ? json_decode($team_ids_json, true) : array();

            $teams = array();
            foreach ($team_ids as $tid) {
                $data = jsbb_build_portal_team($tid);
                if ($data) $teams[] = $data;
            }

            return rest_ensure_response($teams);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/teams', array(
        'methods'  => 'POST',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_tournament') {
                return new WP_Error('not_found', '大会が見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();
            $team_ids = isset($params['team_ids']) ? array_map('intval', $params['team_ids']) : array();

            $valid_ids = array();
            foreach ($team_ids as $tid) {
                $team_post = get_post($tid);
                if ($team_post && $team_post->post_type === 'portal_team') {
                    $valid_ids[] = $tid;
                }
            }

            update_post_meta($post_id, '_portal_tournament_team_ids', wp_json_encode($valid_ids));

            return rest_ensure_response(array(
                'success'    => true,
                'team_count' => count($valid_ids),
                'team_ids'   => $valid_ids,
            ));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // -----------------------------------------------
    // チームの大会一覧
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/team/(?P<id>\d+)/tournaments', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $team_id = (int) $request['id'];
            $tournaments = jsbb_portal_get_team_tournaments($team_id);

            $result = array();
            foreach ($tournaments as $tid) {
                $data = jsbb_build_portal_tournament($tid);
                if ($data) $result[] = $data;
            }

            return rest_ensure_response($result);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key();
        },
    ));

    // -----------------------------------------------
    // 公開大会一覧（認証不要）
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/tournaments/public', array(
        'methods'  => 'GET',
        'callback' => function () {
            $args = array(
                'post_type'      => 'portal_tournament',
                'posts_per_page' => -1,
                'orderby'        => 'date',
                'order'          => 'DESC',
                'post_status'    => 'publish',
                'meta_query'     => array(
                    array('key' => '_portal_tournament_status', 'value' => 'active'),
                ),
            );

            $posts = get_posts($args);
            $tournaments = array();
            foreach ($posts as $p) {
                $tournaments[] = array(
                    'id'   => $p->ID,
                    'name' => $p->post_title,
                );
            }

            return rest_ensure_response($tournaments);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key();
        },
    ));

    // -----------------------------------------------
    // ポータルチーム CRUD（独立したportal_team CPT）
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/teams', array(
        'methods'  => 'GET',
        'callback' => function () {
            $posts = get_posts(array(
                'post_type'      => 'portal_team',
                'posts_per_page' => -1,
                'orderby'        => 'title',
                'order'          => 'ASC',
                'post_status'    => 'publish',
            ));

            $teams = array();
            foreach ($posts as $p) {
                $teams[] = jsbb_build_portal_team($p->ID);
            }

            return rest_ensure_response($teams);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    register_rest_route('jsbb/v1', '/portal/teams', array(
        'methods'  => 'POST',
        'callback' => function ($request) {
            $params = $request->get_json_params();
            $name   = isset($params['name']) ? sanitize_text_field($params['name']) : '';

            if (!$name) {
                return new WP_Error('bad_request', 'チーム名が必要です', array('status' => 400));
            }

            $post_id = wp_insert_post(array(
                'post_title'  => $name,
                'post_type'   => 'portal_team',
                'post_status' => 'publish',
            ));

            if (is_wp_error($post_id)) {
                return new WP_Error('create_error', '作成に失敗しました', array('status' => 500));
            }

            $meta_fields = array(
                'email'           => '_portal_team_email',
                'representative'  => '_portal_team_representative',
                'phone'           => '_portal_team_phone',
                'region'          => '_portal_team_region',
                'region_national' => '_portal_team_region_national',
                'region_branch'   => '_portal_team_region_branch',
                'note'            => '_portal_team_note',
            );
            foreach ($meta_fields as $key => $meta_key) {
                if (isset($params[$key])) {
                    update_post_meta($post_id, $meta_key, sanitize_text_field($params[$key]));
                }
            }

            // 8桁ユニークチームID生成
            update_post_meta($post_id, '_portal_team_id', jsbb_generate_team_id());
            update_post_meta($post_id, '_portal_team_created_at', current_time('mysql'));

            return rest_ensure_response(jsbb_build_portal_team($post_id));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    register_rest_route('jsbb/v1', '/portal/teams/(?P<id>\d+)', array(
        'methods'  => 'PUT',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_team') {
                return new WP_Error('not_found', 'チームが見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();

            // 変更前の値を取得（履歴用）
            $old_name = $post->post_title;
            $old_values = array(
                'email'           => get_post_meta($post_id, '_portal_team_email', true),
                'representative'  => get_post_meta($post_id, '_portal_team_representative', true),
                'phone'           => get_post_meta($post_id, '_portal_team_phone', true),
                'region'          => get_post_meta($post_id, '_portal_team_region', true),
                'region_national' => get_post_meta($post_id, '_portal_team_region_national', true),
                'region_branch'   => get_post_meta($post_id, '_portal_team_region_branch', true),
                'note'            => get_post_meta($post_id, '_portal_team_note', true),
            );

            if (isset($params['name'])) {
                wp_update_post(array(
                    'ID'         => $post_id,
                    'post_title' => sanitize_text_field($params['name']),
                ));
            }

            $meta_fields = array(
                'email'           => '_portal_team_email',
                'representative'  => '_portal_team_representative',
                'phone'           => '_portal_team_phone',
                'region'          => '_portal_team_region',
                'region_national' => '_portal_team_region_national',
                'region_branch'   => '_portal_team_region_branch',
                'note'            => '_portal_team_note',
            );
            foreach ($meta_fields as $key => $meta_key) {
                if (isset($params[$key])) {
                    update_post_meta($post_id, $meta_key, sanitize_text_field($params[$key]));
                }
            }

            // チームID未設定 or 8桁でない場合は自動生成
            $current_team_id = get_post_meta($post_id, '_portal_team_id', true);
            if (!$current_team_id || strlen($current_team_id) !== 8 || !ctype_digit($current_team_id)) {
                update_post_meta($post_id, '_portal_team_id', jsbb_generate_team_id());
            }

            // 変更履歴を記録
            $changes = array();
            $labels = array(
                'name'            => 'チーム名',
                'email'           => 'メールアドレス',
                'representative'  => '代表者名',
                'phone'           => '電話番号',
                'region'          => '代表地域',
                'region_national' => '全国大会代表',
                'region_branch'   => '県大会代表',
                'note'            => '備考',
            );
            if (isset($params['name']) && $params['name'] !== $old_name) {
                $changes[] = $labels['name'];
            }
            foreach ($old_values as $key => $old_val) {
                if (isset($params[$key]) && $params[$key] !== ($old_val ?: '')) {
                    $changes[] = $labels[$key];
                }
            }
            if (!empty($changes)) {
                $team_name = isset($params['name']) ? sanitize_text_field($params['name']) : $old_name;
                $desc = $team_name . 'の情報を変更しました（' . implode('、', $changes) . '）';
                // チームに紐づく全大会に履歴を記録
                $tournament_ids = jsbb_portal_get_team_tournaments($post_id);
                if (!empty($tournament_ids)) {
                    foreach ($tournament_ids as $tid) {
                        jsbb_portal_log_activity($tid, $post_id, 'team_updated', $desc, 'admin');
                    }
                } else {
                    jsbb_portal_log_activity(0, $post_id, 'team_updated', $desc, 'admin');
                }
            }

            return rest_ensure_response(jsbb_build_portal_team($post_id));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    register_rest_route('jsbb/v1', '/portal/teams/(?P<id>\d+)', array(
        'methods'  => 'DELETE',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_team') {
                return new WP_Error('not_found', 'チームが見つかりません', array('status' => 404));
            }

            wp_delete_post($post_id, true);
            return rest_ensure_response(array('success' => true, 'deleted_id' => $post_id));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // -----------------------------------------------
    // チームID一括再生成（8桁でないIDを修正）
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/teams/regenerate-ids', array(
        'methods'  => 'POST',
        'callback' => function () {
            $posts = get_posts(array(
                'post_type'      => 'portal_team',
                'posts_per_page' => -1,
                'post_status'    => 'any',
            ));

            $fixed = 0;
            foreach ($posts as $p) {
                $current_id = get_post_meta($p->ID, '_portal_team_id', true);
                if (!$current_id || strlen($current_id) !== 8 || !ctype_digit($current_id)) {
                    update_post_meta($p->ID, '_portal_team_id', jsbb_generate_team_id());
                    $fixed++;
                }
            }

            return rest_ensure_response(array(
                'success' => true,
                'total'   => count($posts),
                'fixed'   => $fixed,
            ));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // -----------------------------------------------
    // マスタ管理
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/masters', array(
        'methods'  => 'GET',
        'callback' => function () {
            $prefectures   = get_option('jsbb_portal_master_prefectures', '');
            $branches      = get_option('jsbb_portal_master_branches', '');
            $document_types = get_option('jsbb_portal_master_document_types', '');

            return rest_ensure_response(array(
                'prefectures'    => $prefectures ? json_decode($prefectures, true) : jsbb_default_prefectures(),
                'branches'       => $branches ? json_decode($branches, true) : array(),
                'document_types' => $document_types ? json_decode($document_types, true) : array('メンバー表', '参加申込書', '申請書', 'その他'),
            ));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    register_rest_route('jsbb/v1', '/portal/masters', array(
        'methods'  => 'PUT',
        'callback' => function ($request) {
            $params = $request->get_json_params();
            $type   = isset($params['type']) ? sanitize_text_field($params['type']) : '';
            $items  = isset($params['items']) ? $params['items'] : array();

            $valid_types = array('prefectures', 'branches', 'document_types');
            if (!in_array($type, $valid_types)) {
                return new WP_Error('bad_request', '無効なマスタ種別です', array('status' => 400));
            }

            $sanitized = array_map('sanitize_text_field', $items);
            update_option('jsbb_portal_master_' . $type, wp_json_encode($sanitized));

            return rest_ensure_response(array(
                'success' => true,
                'type'    => $type,
                'items'   => $sanitized,
            ));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // -----------------------------------------------
    // チーム情報参照（ログイン用・8桁チームIDで検索）
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/team-lookup/(?P<team_id>[0-9]{8})', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $team_id = sanitize_text_field($request['team_id']);

            // 8桁チームIDでメタ検索
            $posts = get_posts(array(
                'post_type'   => 'portal_team',
                'meta_key'    => '_portal_team_id',
                'meta_value'  => $team_id,
                'post_status' => 'publish',
                'numberposts' => 1,
            ));

            if (empty($posts)) {
                return new WP_Error('not_found', 'チームが見つかりません', array('status' => 404));
            }

            $post = $posts[0];
            $stored_email = get_post_meta($post->ID, '_portal_team_email', true);

            return rest_ensure_response(array(
                'id'             => $post->ID,
                'team_id'        => $team_id,
                'name'           => $post->post_title,
                'has_email'      => !empty($stored_email),
            ));
        },
        'permission_callback' => '__return_true',
    ));
});

// ==========================================
// ヘルパー関数
// ==========================================

function jsbb_portal_verify_api_key() {
    $api_key = '';

    // 1. ヘッダーから取得（getallheaders）
    if (function_exists('getallheaders')) {
        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'x-portal-key') {
                $api_key = $value;
                break;
            }
        }
    }

    // 2. $_SERVER から取得（Apache/Nginx フォールバック）
    if (!$api_key && isset($_SERVER['HTTP_X_PORTAL_KEY'])) {
        $api_key = $_SERVER['HTTP_X_PORTAL_KEY'];
    }

    // 3. クエリパラメータから取得（ヘッダーが削除される環境用）
    if (!$api_key && isset($_GET['portal_key'])) {
        $api_key = $_GET['portal_key'];
    }

    if (!$api_key) return false;

    // 保存済みキーと比較
    $stored_key = defined('PORTAL_API_KEY') ? PORTAL_API_KEY : get_option('jsbb_portal_api_key', 'open2000');

    return hash_equals($stored_key, $api_key);
}

function jsbb_default_prefectures() {
    return array(
        '北海道',
        '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
        '岐阜県', '静岡県', '愛知県',
        '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
        '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県',
        '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
        '中華人民共和国',
    );
}

function jsbb_portal_get_team_tournaments($team_id) {
    $posts = get_posts(array(
        'post_type'      => 'portal_tournament',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
    ));

    $tournament_ids = array();
    foreach ($posts as $p) {
        $team_ids_json = get_post_meta($p->ID, '_portal_tournament_team_ids', true);
        $team_ids = $team_ids_json ? json_decode($team_ids_json, true) : array();
        if (is_array($team_ids) && in_array((int) $team_id, $team_ids)) {
            $tournament_ids[] = $p->ID;
        }
    }

    return $tournament_ids;
}
