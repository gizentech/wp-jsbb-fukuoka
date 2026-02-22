
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
}
add_action('rest_api_init', 'jsbb_register_meta_in_rest');
