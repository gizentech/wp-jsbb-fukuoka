<?php
if (!defined('ABSPATH')) exit;

/**
 * ① ダッシュボードに専用メニューを表示
 */
add_action('wp_dashboard_setup', function() {
    wp_add_dashboard_widget(
        'jsbb_quick_menu',
        '【福岡県軟式野球連盟】クイックメニュー',
        function() {
            ?>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px;">
                <a href="post-new.php" class="button button-primary" style="text-align:center; padding: 10px 0; display: block;">お知らせを投稿</a>
                <a href="edit.php?post_type=tournament" class="button button-primary" style="text-align:center; padding: 10px 0; display: block;">トーナメント一覧</a>
                <a href="post-new.php?post_type=tournament" class="button" style="text-align:center; padding: 10px 0; display: block;">新規大会登録</a>
                <a href="edit.php?post_type=interview" class="button" style="text-align:center; padding: 10px 0; display: block;">インタビュー管理</a>
            </div>
            <?php
        }
    );
});

/**
 * ② トーナメント一覧のタイトルを「大会名1+2+3」にする（優先度を上げて修正）
 */
add_filter('the_title', function($title, $id = null) {
    // 管理画面の「tournament」投稿タイプの一覧ページである場合のみ実行
    if ( is_admin() && $id && in_array(get_post_type($id), array('tournament', 'tournament_bracket'), true) ) {
        
        // 各カスタムフィールドの値を取得（Smart Custom Fields等の名前に合わせて調整してください）
        $name1 = get_post_meta($id, 'tournament_name1', true); // 大会名1
        $name2 = get_post_meta($id, 'tournament_name2', true); // 大会名2
        $name3 = get_post_meta($id, 'tournament_name3', true); // 大会名3
        
        // もし大会名が入力されていれば、連結して表示
        if ($name1 || $name2 || $name3) {
            $full_name = trim($name1 . ' ' . $name2 . ' ' . $name3);
            return $full_name;
        }
    }
    return $title;
}, 100, 2); // 優先度を100に上げて他のプラグイン等の干渉を防ぐ

/**
 * トーナメント表の一覧: タイトル列を大会名列に置き換え
 */
add_filter('manage_tournament_bracket_posts_columns', function($columns) {
    $new_columns = array();
    foreach($columns as $key => $value) {
        if($key === 'title') {
            $new_columns['bracket_fullname'] = '大会名';
            continue;
        }
        $new_columns[$key] = $value;
    }
    return $new_columns;
});

add_action('manage_tournament_bracket_posts_custom_column', function($column, $post_id) {
    if ($column === 'bracket_fullname') {
        $name1 = get_post_meta($post_id, '_bracket_name1', true);
        $name2 = get_post_meta($post_id, '_bracket_name2', true);
        $name3 = get_post_meta($post_id, '_bracket_name3', true);
        $fullname = trim($name1 . ' ' . $name2 . ' ' . $name3);
        $edit_url = get_edit_post_link($post_id);
        echo '<strong><a class="row-title" href="' . esc_url($edit_url) . '">' . esc_html($fullname) . '</a></strong>';
    }
}, 10, 2);
