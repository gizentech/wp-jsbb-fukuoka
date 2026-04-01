<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ポータル書類 CPT & REST API
// ==========================================

// --- 書類テンプレート（管理者がアップロード）---
add_action('init', function () {
    register_post_type('portal_document', array(
        'labels' => array(
            'name'          => 'ポータル書類',
            'singular_name' => 'ポータル書類',
        ),
        'public'       => false,
        'show_ui'      => false,
        'show_in_rest' => false,
        'supports'     => array('title'),
    ));
});

// --- 提出書類（チームがアップロード）---
add_action('init', function () {
    register_post_type('portal_submission', array(
        'labels' => array(
            'name'          => 'ポータル提出書類',
            'singular_name' => 'ポータル提出書類',
        ),
        'public'       => false,
        'show_ui'      => false,
        'show_in_rest' => false,
        'supports'     => array('title'),
    ));
});

// ==========================================
// REST API
// ==========================================
add_action('rest_api_init', function () {

    // -----------------------------------------------
    // 書類テンプレート CRUD
    // -----------------------------------------------

    // GET /portal/tournaments/{id}/documents
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/documents', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $tournament_id = (int) $request['id'];
            $post = get_post($tournament_id);
            if (!$post || $post->post_type !== 'portal_tournament') {
                return new WP_Error('not_found', '大会が見つかりません', array('status' => 404));
            }

            $posts = get_posts(array(
                'post_type'      => 'portal_document',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
                'meta_query'     => array(
                    array('key' => '_portal_doc_tournament_id', 'value' => $tournament_id),
                ),
                'orderby'  => 'meta_value_num',
                'meta_key' => '_portal_doc_sort_order',
                'order'    => 'ASC',
            ));

            $documents = array();
            foreach ($posts as $p) {
                $documents[] = jsbb_build_portal_document($p->ID);
            }

            return rest_ensure_response($documents);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // POST /portal/tournaments/{id}/documents
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/documents', array(
        'methods'  => 'POST',
        'callback' => function ($request) {
            $tournament_id = (int) $request['id'];
            $post = get_post($tournament_id);
            if (!$post || $post->post_type !== 'portal_tournament') {
                return new WP_Error('not_found', '大会が見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();
            $name = isset($params['name']) ? sanitize_text_field($params['name']) : '';
            if (!$name) {
                return new WP_Error('bad_request', '書類名が必要です', array('status' => 400));
            }

            $post_id = wp_insert_post(array(
                'post_title'  => $name,
                'post_type'   => 'portal_document',
                'post_status' => 'publish',
            ));

            if (is_wp_error($post_id)) {
                return new WP_Error('create_error', '作成に失敗しました', array('status' => 500));
            }

            update_post_meta($post_id, '_portal_doc_tournament_id', $tournament_id);
            update_post_meta($post_id, '_portal_doc_file_url', isset($params['file_url']) ? esc_url_raw($params['file_url']) : '');
            update_post_meta($post_id, '_portal_doc_category', isset($params['category']) ? sanitize_text_field($params['category']) : '');
            update_post_meta($post_id, '_portal_doc_description', isset($params['description']) ? wp_kses_post($params['description']) : '');
            update_post_meta($post_id, '_portal_doc_sort_order', isset($params['sort_order']) ? (int) $params['sort_order'] : 0);
            update_post_meta($post_id, '_portal_doc_created_at', current_time('mysql'));

            return rest_ensure_response(jsbb_build_portal_document($post_id));
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));

    // PUT /portal/documents/{id}
    register_rest_route('jsbb/v1', '/portal/documents/(?P<id>\d+)', array(
        'methods'  => 'PUT',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_document') {
                return new WP_Error('not_found', '書類が見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();

            if (isset($params['name'])) {
                wp_update_post(array('ID' => $post_id, 'post_title' => sanitize_text_field($params['name'])));
            }
            if (isset($params['file_url'])) {
                update_post_meta($post_id, '_portal_doc_file_url', esc_url_raw($params['file_url']));
            }
            if (isset($params['category'])) {
                update_post_meta($post_id, '_portal_doc_category', sanitize_text_field($params['category']));
            }
            if (isset($params['description'])) {
                update_post_meta($post_id, '_portal_doc_description', wp_kses_post($params['description']));
            }
            if (isset($params['sort_order'])) {
                update_post_meta($post_id, '_portal_doc_sort_order', (int) $params['sort_order']);
            }

            return rest_ensure_response(jsbb_build_portal_document($post_id));
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));

    // DELETE /portal/documents/{id}
    register_rest_route('jsbb/v1', '/portal/documents/(?P<id>\d+)', array(
        'methods'  => 'DELETE',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_document') {
                return new WP_Error('not_found', '書類が見つかりません', array('status' => 404));
            }

            wp_delete_post($post_id, true);
            return rest_ensure_response(array('success' => true, 'deleted_id' => $post_id));
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));

    // -----------------------------------------------
    // 提出書類 CRUD
    // -----------------------------------------------

    // GET /portal/tournaments/{id}/submissions
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/submissions', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $tournament_id = (int) $request['id'];
            $team_id = $request->get_param('team_id');

            $meta_query = array(
                array('key' => '_portal_sub_tournament_id', 'value' => $tournament_id),
            );
            if ($team_id) {
                $meta_query[] = array('key' => '_portal_sub_team_id', 'value' => (int) $team_id);
            }

            $posts = get_posts(array(
                'post_type'      => 'portal_submission',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
                'meta_query'     => $meta_query,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ));

            $submissions = array();
            foreach ($posts as $p) {
                $submissions[] = jsbb_build_portal_submission($p->ID);
            }

            return rest_ensure_response($submissions);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // POST /portal/tournaments/{id}/submissions
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/submissions', array(
        'methods'  => 'POST',
        'callback' => function ($request) {
            $tournament_id = (int) $request['id'];
            $params = $request->get_json_params();
            $team_id = isset($params['team_id']) ? (int) $params['team_id'] : 0;
            $doc_type = isset($params['document_type']) ? sanitize_text_field($params['document_type']) : '';
            $file_url = isset($params['file_url']) ? esc_url_raw($params['file_url']) : '';

            if (!$team_id || !$file_url) {
                return new WP_Error('bad_request', 'チームIDとファイルが必要です', array('status' => 400));
            }

            $team_post = get_post($team_id);
            $team_name = $team_post ? $team_post->post_title : 'チーム';

            $post_id = wp_insert_post(array(
                'post_title'  => $team_name . ' - ' . ($doc_type ?: '書類提出'),
                'post_type'   => 'portal_submission',
                'post_status' => 'publish',
            ));

            if (is_wp_error($post_id)) {
                return new WP_Error('create_error', '作成に失敗しました', array('status' => 500));
            }

            update_post_meta($post_id, '_portal_sub_tournament_id', $tournament_id);
            update_post_meta($post_id, '_portal_sub_team_id', $team_id);
            update_post_meta($post_id, '_portal_sub_document_type', $doc_type);
            update_post_meta($post_id, '_portal_sub_file_url', $file_url);
            update_post_meta($post_id, '_portal_sub_file_name', isset($params['file_name']) ? sanitize_text_field($params['file_name']) : '');
            update_post_meta($post_id, '_portal_sub_comment', isset($params['comment']) ? sanitize_textarea_field($params['comment']) : '');
            update_post_meta($post_id, '_portal_sub_status', 'pending');
            update_post_meta($post_id, '_portal_sub_admin_comment', '');
            update_post_meta($post_id, '_portal_sub_created_at', current_time('mysql'));

            // 履歴記録
            jsbb_portal_log_activity($tournament_id, $team_id, 'submission_upload', $team_name . 'が書類を提出しました: ' . ($doc_type ?: '書類'), 'team');

            return rest_ensure_response(jsbb_build_portal_submission($post_id));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key();
        },
    ));

    // PUT /portal/submissions/{id}/status
    register_rest_route('jsbb/v1', '/portal/submissions/(?P<id>\d+)/status', array(
        'methods'  => 'PUT',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_submission') {
                return new WP_Error('not_found', '提出書類が見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();
            $status = isset($params['status']) ? sanitize_text_field($params['status']) : '';
            $admin_comment = isset($params['admin_comment']) ? sanitize_textarea_field($params['admin_comment']) : '';

            $valid_statuses = array('pending', 'approved', 'rejected', 'cancelled');
            if (!in_array($status, $valid_statuses)) {
                return new WP_Error('bad_request', '無効なステータスです', array('status' => 400));
            }

            update_post_meta($post_id, '_portal_sub_status', $status);
            if ($admin_comment) {
                update_post_meta($post_id, '_portal_sub_admin_comment', $admin_comment);
            }

            // 履歴記録
            $tournament_id = get_post_meta($post_id, '_portal_sub_tournament_id', true);
            $team_id = get_post_meta($post_id, '_portal_sub_team_id', true);
            $status_labels = array('approved' => '承認', 'rejected' => '差し戻し', 'cancelled' => '取消', 'pending' => '保留');
            $label = isset($status_labels[$status]) ? $status_labels[$status] : $status;
            jsbb_portal_log_activity($tournament_id, $team_id, 'submission_' . $status, '書類が' . $label . 'されました', 'admin');

            return rest_ensure_response(jsbb_build_portal_submission($post_id));
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));

    // GET /portal/admin/submissions - 全提出書類一覧（管理者用）
    register_rest_route('jsbb/v1', '/portal/admin/submissions', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $tournament_id = $request->get_param('tournament_id');
            $status = $request->get_param('status');

            $meta_query = array();
            if ($tournament_id) {
                $meta_query[] = array('key' => '_portal_sub_tournament_id', 'value' => (int) $tournament_id);
            }
            if ($status) {
                $meta_query[] = array('key' => '_portal_sub_status', 'value' => $status);
            }

            $args = array(
                'post_type'      => 'portal_submission',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
                'orderby'        => 'date',
                'order'          => 'DESC',
            );
            if (!empty($meta_query)) {
                $args['meta_query'] = $meta_query;
            }

            $posts = get_posts($args);
            $submissions = array();
            foreach ($posts as $p) {
                $sub = jsbb_build_portal_submission($p->ID);
                // 管理者用にチーム名と大会名も付与
                $team_post = get_post($sub['team_id']);
                $tournament_post = get_post($sub['tournament_id']);
                $sub['team_name'] = $team_post ? $team_post->post_title : '';
                $sub['tournament_name'] = $tournament_post ? $tournament_post->post_title : '';
                $submissions[] = $sub;
            }

            return rest_ensure_response($submissions);
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));
});

// ==========================================
// ヘルパー関数
// ==========================================

function jsbb_build_portal_document($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'portal_document') return null;

    return array(
        'id'            => $post->ID,
        'name'          => $post->post_title,
        'tournament_id' => (int) get_post_meta($post_id, '_portal_doc_tournament_id', true),
        'file_url'      => get_post_meta($post_id, '_portal_doc_file_url', true) ?: '',
        'category'      => get_post_meta($post_id, '_portal_doc_category', true) ?: '',
        'description'   => get_post_meta($post_id, '_portal_doc_description', true) ?: '',
        'sort_order'    => (int) get_post_meta($post_id, '_portal_doc_sort_order', true),
        'created_at'    => get_post_meta($post_id, '_portal_doc_created_at', true) ?: '',
    );
}

function jsbb_build_portal_submission($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'portal_submission') return null;

    return array(
        'id'            => $post->ID,
        'tournament_id' => (int) get_post_meta($post_id, '_portal_sub_tournament_id', true),
        'team_id'       => (int) get_post_meta($post_id, '_portal_sub_team_id', true),
        'document_type' => get_post_meta($post_id, '_portal_sub_document_type', true) ?: '',
        'file_url'      => get_post_meta($post_id, '_portal_sub_file_url', true) ?: '',
        'file_name'     => get_post_meta($post_id, '_portal_sub_file_name', true) ?: '',
        'comment'       => get_post_meta($post_id, '_portal_sub_comment', true) ?: '',
        'status'        => get_post_meta($post_id, '_portal_sub_status', true) ?: 'pending',
        'admin_comment' => get_post_meta($post_id, '_portal_sub_admin_comment', true) ?: '',
        'created_at'    => get_post_meta($post_id, '_portal_sub_created_at', true) ?: '',
    );
}
