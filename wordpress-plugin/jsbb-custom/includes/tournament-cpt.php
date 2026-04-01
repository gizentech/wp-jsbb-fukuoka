<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 大会管理システム: カスタムタクソノミー
// ==========================================
function jsbb_register_team_class_taxonomy() {
    register_taxonomy('team_class', array('team', 'tournament'), array(
        'labels' => array(
            'name' => 'チームクラス',
            'singular_name' => 'チームクラス',
            'add_new_item' => '新しいクラスを追加',
            'search_items' => 'クラスを検索',
        ),
        'hierarchical' => true,
        'show_in_rest' => true,
        'rest_base' => 'team_class',
        'public' => true,
        'show_admin_column' => true,
    ));
}
add_action('init', 'jsbb_register_team_class_taxonomy');

function jsbb_register_prefecture_taxonomy() {
    register_taxonomy('prefecture', array('branch', 'team'), array(
        'labels' => array(
            'name' => '都道府県',
            'singular_name' => '都道府県',
            'search_items' => '都道府県を検索',
        ),
        'hierarchical' => true,
        'show_in_rest' => true,
        'rest_base' => 'prefecture',
        'public' => true,
        'show_admin_column' => true,
    ));
}
add_action('init', 'jsbb_register_prefecture_taxonomy');

function jsbb_create_default_terms() {
    $team_classes = array('一般', 'A級', 'B級', 'C級', '少年（中学）', '学童', 'ガールズ', 'その他');
    foreach ($team_classes as $class) {
        if (!term_exists($class, 'team_class')) {
            wp_insert_term($class, 'team_class');
        }
    }

    $prefectures = array(
        '北海道','青森県','岩手県','宮城県','秋田県','山形県','福島県',
        '茨城県','栃木県','群馬県','埼玉県','千葉県','東京都','神奈川県',
        '新潟県','富山県','石川県','福井県','山梨県','長野県',
        '岐阜県','静岡県','愛知県','三重県',
        '滋賀県','京都府','大阪府','兵庫県','奈良県','和歌山県',
        '鳥取県','島根県','岡山県','広島県','山口県',
        '徳島県','香川県','愛媛県','高知県',
        '福岡県','佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県'
    );
    foreach ($prefectures as $pref) {
        if (!term_exists($pref, 'prefecture')) {
            wp_insert_term($pref, 'prefecture');
        }
    }
}
add_action('init', 'jsbb_create_default_terms', 20);

// ==========================================
// 大会管理: カスタム投稿タイプ
// ==========================================
function jsbb_register_tournament_series_post_type() {
    register_post_type('tournament_series', array(
        'labels' => array(
            'name' => '大会シリーズ',
            'singular_name' => '大会シリーズ',
            'add_new' => '新規追加',
            'add_new_item' => '新しい大会シリーズを追加',
            'edit_item' => '大会シリーズを編集',
            'all_items' => 'すべての大会シリーズ',
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'tournament_series',
        'menu_icon' => 'dashicons-awards',
        'supports' => array('title', 'custom-fields'),
        'has_archive' => false,
        'taxonomies' => array('team_class'),
    ));
}
add_action('init', 'jsbb_register_tournament_series_post_type');

function jsbb_register_tournament_post_type() {
    register_post_type('tournament', array(
        'labels' => array(
            'name' => '年度大会',
            'singular_name' => '年度大会',
            'add_new' => '新規追加',
            'add_new_item' => '新しい年度大会を追加',
            'edit_item' => '年度大会を編集',
            'all_items' => 'すべての年度大会',
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'tournaments',
        'menu_icon' => 'dashicons-calendar-alt',
        'supports' => array('title', 'editor', 'custom-fields'),
        'has_archive' => false,
        'taxonomies' => array('team_class'),
    ));
}
add_action('init', 'jsbb_register_tournament_post_type');

function jsbb_register_match_post_type() {
    register_post_type('match', array(
        'labels' => array(
            'name' => '試合',
            'singular_name' => '試合',
            'add_new' => '新規追加',
            'add_new_item' => '新しい試合を追加',
            'edit_item' => '試合を編集',
            'all_items' => 'すべての試合',
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'matches',
        'menu_icon' => 'dashicons-performance',
        'supports' => array('title', 'custom-fields'),
        'has_archive' => false,
    ));
}
add_action('init', 'jsbb_register_match_post_type');

function jsbb_register_branch_post_type() {
    register_post_type('branch', array(
        'labels' => array(
            'name' => '支部',
            'singular_name' => '支部',
            'add_new' => '新規追加',
            'add_new_item' => '新しい支部を追加',
            'edit_item' => '支部を編集',
            'all_items' => 'すべての支部',
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'branches',
        'menu_icon' => 'dashicons-location',
        'supports' => array('title', 'custom-fields'),
        'has_archive' => false,
        'taxonomies' => array('prefecture'),
    ));
}
add_action('init', 'jsbb_register_branch_post_type');

function jsbb_register_team_post_type() {
    register_post_type('team', array(
        'labels' => array(
            'name' => 'チーム',
            'singular_name' => 'チーム',
            'add_new' => '新規追加',
            'add_new_item' => '新しいチームを追加',
            'edit_item' => 'チームを編集',
            'all_items' => 'すべてのチーム',
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'teams',
        'menu_icon' => 'dashicons-groups',
        'supports' => array('title', 'custom-fields', 'thumbnail'),
        'has_archive' => false,
        'taxonomies' => array('team_class', 'prefecture'),
    ));
}
add_action('init', 'jsbb_register_team_post_type');

function jsbb_register_tournament_bracket_post_type() {
    register_post_type('tournament_bracket', array(
        'labels' => array(
            'name' => 'トーナメント表',
            'singular_name' => 'トーナメント表',
            'add_new' => '新規追加',
            'add_new_item' => '新しいトーナメント表を追加',
            'edit_item' => 'トーナメント表を編集',
            'all_items' => 'すべてのトーナメント表',
        ),
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'tournament_brackets',
        'menu_icon' => 'dashicons-networking',
        'supports' => array('title', 'custom-fields'),
        'has_archive' => false,
        'taxonomies' => array('team_class'),
    ));
}
add_action('init', 'jsbb_register_tournament_bracket_post_type');
