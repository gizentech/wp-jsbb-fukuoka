
// ==========================================
// カスタムREST APIエンドポイント（確実版）
// jsbb-custom.php の最後に追加してください
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/member/(?P<slug>[a-zA-Z0-9-]+)', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_member_by_slug',
        'permission_callback' => '__return_true'
    ));

    register_rest_route('jsbb/v1', '/members', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_all_members',
        'permission_callback' => '__return_true'
    ));
});

function jsbb_get_member_by_slug($request) {
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

function jsbb_get_all_members($request) {
    $args = array(
        'post_type' => 'member_profile',
        'post_status' => 'publish',
        'posts_per_page' => 100,
        'orderby' => 'date',
        'order' => 'DESC'
    );

    $query = new WP_Query($args);
    $members = array();

    foreach ($query->posts as $post) {
        $post_id = $post->ID;
        $featured_image = get_the_post_thumbnail_url($post_id, 'full');

        $members[] = array(
            'id' => $post_id,
            'slug' => $post->post_name,
            'title' => array('rendered' => $post->post_title),
            'featured_image' => $featured_image,
            'meta' => array(
                '_member_name_en' => get_post_meta($post_id, '_member_name_en', true),
                '_member_role' => get_post_meta($post_id, '_member_role', true),
                '_member_organization' => get_post_meta($post_id, '_member_organization', true),
                '_member_join_year' => get_post_meta($post_id, '_member_join_year', true),
                '_member_join_month' => get_post_meta($post_id, '_member_join_month', true)
            )
        );
    }

    return $members;
}
