<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ポータル更新履歴 CPT & REST API
// ==========================================

add_action('init', function () {
    register_post_type('portal_activity', array(
        'labels' => array(
            'name'          => 'ポータル履歴',
            'singular_name' => 'ポータル履歴',
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

    // GET /portal/team/{id}/activities
    register_rest_route('jsbb/v1', '/portal/team/(?P<id>\d+)/activities', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $team_id = (int) $request['id'];
            $tournament_id = $request->get_param('tournament_id');
            $limit = $request->get_param('limit') ?: 50;

            $meta_query = array(
                array('key' => '_portal_act_team_id', 'value' => $team_id),
            );
            if ($tournament_id) {
                $meta_query[] = array('key' => '_portal_act_tournament_id', 'value' => (int) $tournament_id);
            }

            $posts = get_posts(array(
                'post_type'      => 'portal_activity',
                'posts_per_page' => (int) $limit,
                'post_status'    => 'publish',
                'meta_query'     => $meta_query,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ));

            $activities = array();
            foreach ($posts as $p) {
                $activities[] = jsbb_build_portal_activity($p->ID);
            }

            return rest_ensure_response($activities);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key();
        },
    ));

    // GET /portal/tournaments/{id}/activities（管理者用）
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/activities', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $tournament_id = (int) $request['id'];
            $limit = $request->get_param('limit') ?: 100;

            $posts = get_posts(array(
                'post_type'      => 'portal_activity',
                'posts_per_page' => (int) $limit,
                'post_status'    => 'publish',
                'meta_query'     => array(
                    array('key' => '_portal_act_tournament_id', 'value' => $tournament_id),
                ),
                'orderby' => 'date',
                'order'   => 'DESC',
            ));

            $activities = array();
            foreach ($posts as $p) {
                $act = jsbb_build_portal_activity($p->ID);
                $team_post = get_post($act['team_id']);
                $act['team_name'] = $team_post ? $team_post->post_title : '';
                $activities[] = $act;
            }

            return rest_ensure_response($activities);
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));
});

// ==========================================
// 履歴記録関数（他ファイルから呼ばれる）
// ==========================================

function jsbb_portal_log_activity($tournament_id, $team_id, $action_type, $description, $actor = 'system') {
    $post_id = wp_insert_post(array(
        'post_title'  => $description,
        'post_type'   => 'portal_activity',
        'post_status' => 'publish',
    ));

    if (is_wp_error($post_id)) return false;

    update_post_meta($post_id, '_portal_act_tournament_id', (int) $tournament_id);
    update_post_meta($post_id, '_portal_act_team_id', (int) $team_id);
    update_post_meta($post_id, '_portal_act_action_type', sanitize_text_field($action_type));
    update_post_meta($post_id, '_portal_act_description', sanitize_text_field($description));
    update_post_meta($post_id, '_portal_act_actor', sanitize_text_field($actor));
    update_post_meta($post_id, '_portal_act_created_at', current_time('mysql'));

    return $post_id;
}

function jsbb_build_portal_activity($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'portal_activity') return null;

    return array(
        'id'            => $post->ID,
        'tournament_id' => (int) get_post_meta($post_id, '_portal_act_tournament_id', true),
        'team_id'       => (int) get_post_meta($post_id, '_portal_act_team_id', true),
        'action_type'   => get_post_meta($post_id, '_portal_act_action_type', true) ?: '',
        'description'   => get_post_meta($post_id, '_portal_act_description', true) ?: '',
        'actor'         => get_post_meta($post_id, '_portal_act_actor', true) ?: 'system',
        'created_at'    => get_post_meta($post_id, '_portal_act_created_at', true) ?: $post->post_date,
    );
}
