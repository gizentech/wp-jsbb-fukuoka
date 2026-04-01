<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// REST APIにメタフィールドを公開
// ==========================================
function jsbb_register_meta_in_rest() {
    // シンプルな文字列フィールド
    $simple_fields = array(
        '_member_name_en',
        '_member_role',
        '_member_organization',
        '_member_join_year',
        '_member_join_month',
        '_member_education',
        '_member_birth_date',
        '_member_gender'
    );

    foreach ($simple_fields as $field) {
        register_post_meta('member_profile', $field, array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string'
        ));
    }

    // 配列/オブジェクトフィールド
    $array_fields = array(
        '_member_affiliations',
        '_member_sns_links',
        '_member_federation_activities',
        '_member_umpire_activities',
        '_member_broadcast_activities',
        '_member_team_activities',
        '_member_awards',
        '_member_scoreboard_records'
    );

    foreach ($array_fields as $field) {
        register_post_meta('member_profile', $field, array(
            'show_in_rest' => array(
                'schema' => array(
                    'type' => 'array',
                    'items' => array(
                        'type' => 'object'
                    )
                )
            ),
            'single' => true,
            'type' => 'array'
        ));
    }

    // インタビュー用メタフィールド
    register_post_meta('interview', '_interview_members', array(
        'show_in_rest' => array(
            'schema' => array(
                'type' => 'array',
                'items' => array(
                    'type' => 'integer'
                )
            )
        ),
        'single' => true,
        'type' => 'array'
    ));

    // 年度大会メタフィールド（REST API書き込み対応）
    $tournament_fields = array(
        '_tournament_series_id',
        '_tournament_year',
        '_tournament_number',
        '_tournament_term',
        '_tournament_organizer',
        '_tournament_co_organizer',
        '_tournament_supervisor',
        '_tournament_special_sponsor',
        '_tournament_supporter',
        '_tournament_official_ball',
        '_tournament_start_date',
        '_tournament_end_date',
        '_tournament_pdfs',
        '_migration_source',
        '_migration_old_id',
        '_migration_section',
        '_migration_pdf_urls',
    );

    foreach ($tournament_fields as $field) {
        register_post_meta('tournament', $field, array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() { return current_user_can('edit_posts'); },
        ));
    }

    // トーナメント表メタフィールド（REST API書き込み対応）
    $bracket_fields = array(
        '_bracket_series_id',
        '_bracket_year',
        '_bracket_number',
        '_bracket_name1',
        '_bracket_name2',
        '_bracket_name3',
        '_bracket_abbreviation',
        '_bracket_pdfs',
        '_bracket_teams',
    );

    foreach ($bracket_fields as $field) {
        register_post_meta('tournament_bracket', $field, array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() { return current_user_can('edit_posts'); },
        ));
    }
}
add_action('rest_api_init', 'jsbb_register_meta_in_rest');

// チームプロフィール用メタフィールド登録
function jsbb_register_team_profile_meta() {
    $fields = array(
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
    foreach ($fields as $field) {
        register_post_meta('team', $field, array(
            'show_in_rest' => true,
            'single' => true,
            'type' => 'string',
            'auth_callback' => function() { return current_user_can('edit_posts'); },
        ));
    }
}
add_action('rest_api_init', 'jsbb_register_team_profile_meta');


// カスタムREST APIエンドポイント
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/member/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_member_with_meta',
        'permission_callback' => '__return_true'
    ));
});

function jsbb_get_member_with_meta($request) {
    $post_id = $request['id'];
    $post = get_post($post_id);
    
    if (!$post || $post->post_type !== 'member_profile') {
        return new WP_Error('not_found', 'Member not found', array('status' => 404));
    }
    
    $meta = array();
    $meta_keys = array(
        '_member_name_en', '_member_role', '_member_organization',
        '_member_join_year', '_member_join_month', '_member_education',
        '_member_birth_date', '_member_gender', '_member_affiliations',
        '_member_sns_links', '_member_federation_activities',
        '_member_umpire_activities', '_member_broadcast_activities',
        '_member_team_activities', '_member_awards', '_member_scoreboard_records'
    );
    
    foreach ($meta_keys as $key) {
        $value = get_post_meta($post_id, $key, true);
        if ($value) {
            $meta[$key] = $value;
        }
    }
    
    return array(
        'id' => $post->ID,
        'slug' => $post->post_name,
        'title' => array('rendered' => $post->post_title),
        'meta' => $meta
    );
}


// ==========================================
// カスタムREST APIエンドポイント（確実版）
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/member/(?P<slug>[a-zA-Z0-9_-]+)', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_member_by_slug_custom',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('jsbb/v1', '/members', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_all_members_custom',
        'permission_callback' => '__return_true'
    ));
});

function jsbb_get_member_by_slug_custom($request) {
    $slug = $request['slug'];

    $args = array(
        'post_type' => 'member_profile',
        'name' => $slug,
        'post_status' => 'publish',
        'posts_per_page' => 1
    );

    $query = new WP_Query($args);

    if (!$query->have_posts()) {
        return new WP_Error('not_found', 'Member not found', array('status' => 404));
    }

    $post = $query->posts[0];
    $post_id = $post->ID;

    // メタデータを取得
    $meta = array(
        '_member_name_en' => get_post_meta($post_id, '_member_name_en', true),
        '_member_role' => get_post_meta($post_id, '_member_role', true),
        '_member_organization' => get_post_meta($post_id, '_member_organization', true),
        '_member_join_year' => get_post_meta($post_id, '_member_join_year', true),
        '_member_join_month' => get_post_meta($post_id, '_member_join_month', true),
        '_member_education' => get_post_meta($post_id, '_member_education', true),
        '_member_birth_date' => get_post_meta($post_id, '_member_birth_date', true),
        '_member_gender' => get_post_meta($post_id, '_member_gender', true),
        '_member_affiliations' => get_post_meta($post_id, '_member_affiliations', true),
        '_member_sns_links' => get_post_meta($post_id, '_member_sns_links', true),
        '_member_federation_activities' => get_post_meta($post_id, '_member_federation_activities', true),
        '_member_umpire_activities' => get_post_meta($post_id, '_member_umpire_activities', true),
        '_member_broadcast_activities' => get_post_meta($post_id, '_member_broadcast_activities', true),
        '_member_team_activities' => get_post_meta($post_id, '_member_team_activities', true),
        '_member_awards' => get_post_meta($post_id, '_member_awards', true),
        '_member_scoreboard_records' => get_post_meta($post_id, '_member_scoreboard_records', true)
    );

    // アイキャッチ画像を取得
    $featured_image = get_the_post_thumbnail_url($post_id, 'full');

    return array(
        'id' => $post_id,
        'slug' => $post->post_name,
        'title' => array('rendered' => $post->post_title),
        'featured_image' => $featured_image,
        'meta' => $meta
    );
}

// ==========================================
// カスタムREST APIエンドポイント: 役員一覧
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/officers', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_officers',
        'permission_callback' => '__return_true'
    ));
});

function jsbb_get_officers() {
    $args = array(
        'post_type' => 'officer_group',
        'post_status' => 'publish',
        'posts_per_page' => 100,
        'meta_key' => '_og_sort_order',
        'orderby' => 'meta_value_num',
        'order' => 'ASC'
    );

    $query = new WP_Query($args);
    $prefecture = array();
    $branch = array();

    foreach ($query->posts as $post) {
        $post_id = $post->ID;
        $section = get_post_meta($post_id, '_og_section', true) ?: 'prefecture';
        $sort_order = (int) (get_post_meta($post_id, '_og_sort_order', true) ?: 0);

        if ($section === 'prefecture') {
            $members = get_post_meta($post_id, '_og_members', true) ?: array();
            $prefecture[] = array(
                'id' => $post_id,
                'title' => $post->post_title,
                'sort_order' => $sort_order,
                'members' => $members
            );
        } else {
            $branch[] = array(
                'id' => $post_id,
                'title' => $post->post_title,
                'sort_order' => $sort_order,
                'president' => get_post_meta($post_id, '_og_branch_president', true) ?: '',
                'director' => get_post_meta($post_id, '_og_branch_director', true) ?: '',
                'secretary' => get_post_meta($post_id, '_og_branch_secretary', true) ?: ''
            );
        }
    }

    return array(
        'prefecture' => $prefecture,
        'branch' => $branch
    );
}

// ==========================================
// 役員データ一括投入用エンドポイント（シード）
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/officer-seed', array(
        'methods' => 'POST',
        'callback' => 'jsbb_officer_seed',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));
});

function jsbb_officer_seed($request) {
    $post_id = intval($request->get_param('post_id'));
    if (!$post_id || !get_post($post_id)) {
        return new WP_Error('invalid', 'Invalid post_id', array('status' => 400));
    }

    $section = sanitize_text_field($request->get_param('section') ?: 'prefecture');
    $sort_order = sanitize_text_field($request->get_param('sort_order') ?: '0');

    update_post_meta($post_id, '_og_section', $section);
    update_post_meta($post_id, '_og_sort_order', $sort_order);

    if ($section === 'prefecture') {
        $members_raw = $request->get_param('members') ?: array();
        $members = array();
        foreach ($members_raw as $m) {
            $members[] = array(
                'name' => sanitize_text_field($m['name'] ?? ''),
                'role_note' => sanitize_text_field($m['role_note'] ?? '')
            );
        }
        update_post_meta($post_id, '_og_members', $members);
    } else {
        update_post_meta($post_id, '_og_branch_president', sanitize_text_field($request->get_param('president') ?: ''));
        update_post_meta($post_id, '_og_branch_director', sanitize_text_field($request->get_param('director') ?: ''));
        update_post_meta($post_id, '_og_branch_secretary', sanitize_text_field($request->get_param('secretary') ?: ''));
    }

    return array('success' => true, 'post_id' => $post_id);
}

// ==========================================
