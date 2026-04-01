<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// チームプロフィール REST API
// ==========================================

// チームプロフィールの全メタキー
function jsbb_team_profile_meta_keys() {
    return array(
        '_team_representative',
        '_team_location',
        '_team_sns_links',
        '_team_website_url',
        '_team_recruiting',
        '_team_fee',
        '_team_email',
        '_team_eligibility',
        '_team_age_range',
        '_team_school_district',
        '_team_members',
        '_team_gallery_images',
        '_team_edit_password',
        '_team_profile_updated_at',
    );
}

// チームプロフィールデータを組み立てる
function jsbb_build_team_profile($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'team') return null;

    $meta_keys = jsbb_team_profile_meta_keys();
    $profile = array(
        'id' => $post->ID,
        'name' => $post->post_title,
    );

    foreach ($meta_keys as $key) {
        if ($key === '_team_edit_password') continue; // パスワードは返さない
        $val = get_post_meta($post->ID, $key, true);
        $short = str_replace('_team_', '', $key);
        $profile[$short] = $val ?: '';
    }

    // アイキャッチ画像
    $thumb_id = get_post_thumbnail_id($post->ID);
    $profile['featured_image'] = $thumb_id ? array(
        'id' => (int) $thumb_id,
        'url' => wp_get_attachment_url($thumb_id),
    ) : null;

    // ギャラリー画像URL展開
    $gallery_ids = json_decode($profile['gallery_images'] ?: '[]', true);
    $gallery = array();
    if (is_array($gallery_ids)) {
        foreach ($gallery_ids as $gid) {
            $url = wp_get_attachment_url($gid);
            if ($url) $gallery[] = array('id' => (int) $gid, 'url' => $url);
        }
    }
    $profile['gallery'] = $gallery;

    // クラス・支部情報
    $terms = wp_get_post_terms($post->ID, 'team_class', array('fields' => 'names'));
    $profile['team_class'] = (!is_wp_error($terms) && !empty($terms)) ? $terms : array();

    $branch_id = get_post_meta($post->ID, '_team_branch_id', true);
    $profile['branch'] = $branch_id ? array('id' => (int) $branch_id, 'name' => get_the_title($branch_id)) : null;

    return $profile;
}

// GET /jsbb/v1/team-profile/<id> - チームプロフィール取得
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/team-profile/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => function ($request) {
            $profile = jsbb_build_team_profile($request['id']);
            if (!$profile) {
                return new WP_Error('not_found', 'チームが見つかりません', array('status' => 404));
            }
            return rest_ensure_response($profile);
        },
        'permission_callback' => '__return_true',
    ));
});

// POST /jsbb/v1/team-profile/<id> - チームプロフィール更新
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/team-profile/(?P<id>\d+)', array(
        'methods' => 'POST',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'team') {
                return new WP_Error('not_found', 'チームが見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();

            // 認証: Cookie認証（管理画面）またはパスワード認証（フロントエンド）
            $authenticated = false;
            if (current_user_can('edit_posts')) {
                $authenticated = true;
            } else {
                $password = isset($params['password']) ? $params['password'] : '';
                $stored = get_post_meta($post_id, '_team_edit_password', true);
                if ($stored && $password === $stored) {
                    // レート制限チェック
                    $rate_key = 'team_edit_rate_' . $post_id;
                    $attempts = (int) get_transient($rate_key);
                    if ($attempts >= 5) {
                        return new WP_Error('rate_limit', 'リクエストが多すぎます。1分後に再試行してください。', array('status' => 429));
                    }
                    set_transient($rate_key, $attempts + 1, 60);
                    $authenticated = true;
                }
            }

            if (!$authenticated) {
                return new WP_Error('unauthorized', '認証に失敗しました', array('status' => 401));
            }

            // 更新可能なフィールド
            $updatable = array(
                'representative' => '_team_representative',
                'location' => '_team_location',
                'sns_links' => '_team_sns_links',
                'website_url' => '_team_website_url',
                'recruiting' => '_team_recruiting',
                'fee' => '_team_fee',
                'email' => '_team_email',
                'eligibility' => '_team_eligibility',
                'age_range' => '_team_age_range',
                'school_district' => '_team_school_district',
                'members' => '_team_members',
                'gallery_images' => '_team_gallery_images',
            );

            foreach ($updatable as $param_key => $meta_key) {
                if (isset($params[$param_key])) {
                    $value = $params[$param_key];
                    // JSON配列フィールドはjson_encodeして保存
                    if (in_array($meta_key, array('_team_sns_links', '_team_members', '_team_gallery_images')) && is_array($value)) {
                        $value = wp_json_encode($value);
                    }
                    update_post_meta($post_id, $meta_key, sanitize_text_field($value));
                }
            }

            // アイキャッチ画像
            if (isset($params['featured_image_id'])) {
                $img_id = (int) $params['featured_image_id'];
                if ($img_id > 0) {
                    set_post_thumbnail($post_id, $img_id);
                } else {
                    delete_post_thumbnail($post_id);
                }
            }

            // 最終更新日時
            update_post_meta($post_id, '_team_profile_updated_at', current_time('mysql'));

            return rest_ensure_response(jsbb_build_team_profile($post_id));
        },
        'permission_callback' => '__return_true',
    ));
});

// POST /jsbb/v1/team-upload-image - 画像アップロード
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/team-upload-image', array(
        'methods' => 'POST',
        'callback' => function ($request) {
            // 認証
            $authenticated = false;
            if (current_user_can('upload_files')) {
                $authenticated = true;
            } else {
                $team_id = isset($_POST['team_id']) ? (int) $_POST['team_id'] : 0;
                $password = isset($_POST['password']) ? $_POST['password'] : '';
                if ($team_id > 0) {
                    $stored = get_post_meta($team_id, '_team_edit_password', true);
                    if ($stored && $password === $stored) {
                        $authenticated = true;
                    }
                }
            }

            if (!$authenticated) {
                return new WP_Error('unauthorized', '認証に失敗しました', array('status' => 401));
            }

            if (empty($_FILES['file'])) {
                return new WP_Error('no_file', 'ファイルがありません', array('status' => 400));
            }

            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';

            $file = $_FILES['file'];

            // ファイルタイプ検証
            $allowed = array('image/jpeg', 'image/png', 'image/gif', 'image/webp');
            if (!in_array($file['type'], $allowed)) {
                return new WP_Error('invalid_type', '許可されていないファイルタイプです', array('status' => 400));
            }

            // サイズ制限 (5MB)
            if ($file['size'] > 5 * 1024 * 1024) {
                return new WP_Error('too_large', 'ファイルサイズは5MB以下にしてください', array('status' => 400));
            }

            $upload = wp_handle_upload($file, array('test_form' => false));
            if (isset($upload['error'])) {
                return new WP_Error('upload_error', $upload['error'], array('status' => 500));
            }

            $attachment = array(
                'post_mime_type' => $upload['type'],
                'post_title' => sanitize_file_name(pathinfo($upload['file'], PATHINFO_FILENAME)),
                'post_content' => '',
                'post_status' => 'inherit',
            );

            $attach_id = wp_insert_attachment($attachment, $upload['file']);
            if (is_wp_error($attach_id)) {
                return new WP_Error('attach_error', 'メディア登録に失敗しました', array('status' => 500));
            }

            $metadata = wp_generate_attachment_metadata($attach_id, $upload['file']);
            wp_update_attachment_metadata($attach_id, $metadata);

            return rest_ensure_response(array(
                'id' => $attach_id,
                'url' => wp_get_attachment_url($attach_id),
            ));
        },
        'permission_callback' => '__return_true',
    ));
});

// POST /jsbb/v1/team-password/<id> - パスワード生成・リセット
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/team-password/(?P<id>\d+)', array(
        'methods' => 'POST',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'team') {
                return new WP_Error('not_found', 'チームが見つかりません', array('status' => 404));
            }

            $password = wp_generate_password(8, false);
            update_post_meta($post_id, '_team_edit_password', $password);

            return rest_ensure_response(array(
                'team_id' => $post_id,
                'password' => $password,
            ));
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ));
});

// POST /jsbb/v1/team-profile-bulk - 複数チーム一括更新（管理画面用）
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/team-profile-bulk', array(
        'methods' => 'POST',
        'callback' => function ($request) {
            $params = $request->get_json_params();
            $team_ids = isset($params['team_ids']) ? $params['team_ids'] : array();
            $data = isset($params['data']) ? $params['data'] : array();

            if (empty($team_ids) || empty($data)) {
                return new WP_Error('bad_request', 'team_idsとdataが必要です', array('status' => 400));
            }

            $updatable = array(
                'representative' => '_team_representative',
                'location' => '_team_location',
                'sns_links' => '_team_sns_links',
                'website_url' => '_team_website_url',
                'recruiting' => '_team_recruiting',
                'fee' => '_team_fee',
                'email' => '_team_email',
                'eligibility' => '_team_eligibility',
                'age_range' => '_team_age_range',
                'school_district' => '_team_school_district',
                'members' => '_team_members',
            );

            $updated = 0;
            foreach ($team_ids as $tid) {
                $tid = (int) $tid;
                $post = get_post($tid);
                if (!$post || $post->post_type !== 'team') continue;

                foreach ($updatable as $param_key => $meta_key) {
                    if (isset($data[$param_key]) && $data[$param_key] !== '') {
                        $value = $data[$param_key];
                        if (in_array($meta_key, array('_team_sns_links', '_team_members')) && is_array($value)) {
                            $value = wp_json_encode($value);
                        }
                        update_post_meta($tid, $meta_key, sanitize_text_field($value));
                    }
                }
                update_post_meta($tid, '_team_profile_updated_at', current_time('mysql'));
                $updated++;
            }

            return rest_ensure_response(array(
                'message' => $updated . '件のチームを更新しました',
                'updated' => $updated,
            ));
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        },
    ));
});
