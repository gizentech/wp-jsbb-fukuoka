<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// プラグイン有効化時の処理
// ==========================================
function jsbb_activate_plugin() {
    // パーマリンク設定をフラッシュするだけ
    flush_rewrite_rules();
    // 初期データ作成フラグを設定
    add_option('jsbb_need_init_data', '1');
}
// ==========================================
// 初回アクセス時に既存データを作成
// ==========================================
function jsbb_create_initial_data() {
    // フラグがない場合は何もしない
    if (get_option('jsbb_need_init_data') !== '1') {
        return;
    }

    // 既存の「白石 稜」データが存在しない場合のみ作成
    $existing = get_posts(array(
        'post_type' => 'member_profile',
        'meta_key' => '_member_name_en',
        'meta_value' => 'SHIRAISHI Ryo',
        'posts_per_page' => 1
    ));

    if (empty($existing)) {
        // 白石 稜のプロフィールを作成
        $member_id = wp_insert_post(array(
            'post_type' => 'member_profile',
            'post_title' => '白石 稜',
            'post_status' => 'publish',
            'post_content' => '',
        ));

        if ($member_id && !is_wp_error($member_id)) {
            // 基本情報
            update_post_meta($member_id, '_member_name_en', 'SHIRAISHI Ryo');
            update_post_meta($member_id, '_member_role', '電光掲示板・メディア');
            update_post_meta($member_id, '_member_organization', '一般社団法人 福岡県軟式野球連盟');
            update_post_meta($member_id, '_member_join_year', '2019');
            update_post_meta($member_id, '_member_join_month', '2');
            update_post_meta($member_id, '_member_education', '吉備高原学園高等学校');
            update_post_meta($member_id, '_member_birth_date', '2000年11月24日');
            update_post_meta($member_id, '_member_gender', '男性');

            // 所属組織
            update_post_meta($member_id, '_member_affiliations', array(
                array(
                    'period' => '2019-',
                    'organization' => '公益財団法人 全日本軟式野球連盟',
                    'role' => ''
                ),
                array(
                    'period' => '2019-',
                    'organization' => '一般社団法人 全日本野球協会',
                    'role' => ''
                ),
                array(
                    'period' => '',
                    'organization' => '福岡県高等学校野球連盟',
                    'role' => ''
                )
            ));

            // SNSリンク
            update_post_meta($member_id, '_member_sns_links', array(
                array(
                    'platform' => 'instagram',
                    'label' => '@okweb1',
                    'url' => 'https://www.instagram.com/okweb1/'
                ),
                array(
                    'platform' => 'instagram',
                    'label' => '@jsbb.fukuoka.official',
                    'url' => 'https://www.instagram.com/jsbb.fukuoka.official/'
                )
            ));

            // 電光掲示板実績
            $scoreboard_records = array(
                // 市大会
                array('category' => '市大会', 'title' => '久留米市長旗軟式野球大会'),
                array('category' => '市大会', 'title' => 'カネタニ杯 連盟会長旗学童軟式野球大会'),
                array('category' => '市大会', 'title' => '筑後信用金庫旗 久留米近圏中学校軟式野球大会'),
                array('category' => '市大会', 'title' => '筑邦銀行旗 久留米近圏学童軟式野球大会'),
                array('category' => '市大会', 'title' => '高円宮賜杯 全日本学童軟式野球久留米大会 マクドナルド・トーナメント'),
                array('category' => '市大会', 'title' => '駅前不動産旗 久留米近圏秋季学童軟式野球大会'),
                array('category' => '市大会', 'title' => 'くーみんテレビ・はっぴとすビジョン旗 クロスロード学童軟式野球大会'),
                // 県大会
                array('category' => '県大会', 'title' => '福岡トヨタ杯 福岡県学童軟式野球春季大会'),
                array('category' => '県大会', 'title' => '高円宮賜杯 全日本学童軟式野球福岡県大会 マクドナルド・トーナメント'),
                // 九州大会
                array('category' => '九州大会', 'title' => 'モダンプロジェカップ 全九州学童軟式野球大会'),
                // 全国大会
                array('category' => '全国大会', 'title' => '筑後川旗西日本学童軟式野球大会'),
                array('category' => '全国大会', 'title' => '高松宮賜杯全日本軟式野球大会1部'),
                // 社会人
                array('category' => '社会人', 'title' => '久留米ＲＥＸパワーズ主催試合'),
                // 式典・卒業・卒部
                array('category' => '式典・卒業・卒部', 'title' => '久留米市立南筑高等学校　野球部卒部'),
                array('category' => '式典・卒業・卒部', 'title' => '下広スターボーイズ　卒部制作'),
                array('category' => '式典・卒業・卒部', 'title' => 'WEDDING PHOTO　2件'),
                // メディア
                array('category' => 'メディア', 'title' => '牧原大成選手 久留米ふるさと大使任命式'),
                array('category' => 'メディア', 'title' => '久留米市議会だより第200号記念（2021年2月1日号）'),
            );
            update_post_meta($member_id, '_member_scoreboard_records', $scoreboard_records);

            // 連盟活動
            update_post_meta($member_id, '_member_federation_activities', array(
                array(
                    'date' => '2024-09-01',
                    'title' => 'U-15福岡県選抜 遠征サポート',
                    'description' => 'U-15福岡県選抜の四国遠征に同行し、記録・メディア業務を担当'
                ),
                array(
                    'date' => '2024',
                    'title' => '福岡県軟式野球連盟　ホームページ制作',
                    'description' => '一般社団法人福岡県軟式野球連盟の公式ホームページをNext.jsで制作'
                ),
                array(
                    'date' => '2024',
                    'title' => '福岡県軟式野球連盟公式インスタグラム運営',
                    'description' => '公式インスタグラムアカウントの運営・投稿管理'
                ),
                array(
                    'date' => '',
                    'title' => '久留米球場であそぼっ！野球感謝祭',
                    'description' => '野球感謝祭イベントの企画・運営サポート'
                )
            ));
        }
    }

    // フラグを削除（1回のみ実行）
    delete_option('jsbb_need_init_data');
}
add_action('init', 'jsbb_create_initial_data');
