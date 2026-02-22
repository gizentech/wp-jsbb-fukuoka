<?php
/**
 * Plugin Name: JSBB福岡 カスタム投稿タイプ
 * Description: メンバーとインタビューのカスタム投稿タイプと管理画面
 * Version: 1.0.0
 * Author: JSBB福岡
 */

if (!defined('ABSPATH')) exit;

// ==========================================
// カスタム投稿タイプ: インタビュー
// ==========================================
function jsbb_register_interview_post_type() {
    $labels = array(
        'name' => 'インタビュー',
        'singular_name' => 'インタビュー',
        'add_new' => '新規追加',
        'add_new_item' => '新しいインタビューを追加',
        'edit_item' => 'インタビューを編集',
        'all_items' => 'すべてのインタビュー'
    );

    register_post_type('interview', array(
        'labels' => $labels,
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'interview',
        'menu_icon' => 'dashicons-microphone',
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
    ));
}
add_action('init', 'jsbb_register_interview_post_type');

// ==========================================
// カスタム投稿タイプ: メンバー
// ==========================================
function jsbb_register_member_post_type() {
    $labels = array(
        'name' => 'メンバー',
        'singular_name' => 'メンバー',
        'add_new' => '新規追加',
        'add_new_item' => '新しいメンバーを追加',
        'edit_item' => 'メンバーを編集',
        'all_items' => 'すべてのメンバー'
    );

    register_post_type('member_profile', array(
        'labels' => $labels,
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'member_profile',
        'menu_icon' => 'dashicons-groups',
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
    ));
}
add_action('init', 'jsbb_register_member_post_type');

// ==========================================
// メタボックス追加
// ==========================================
function jsbb_add_meta_boxes() {
    // インタビュー用
    add_meta_box('interview_member', '関連メンバー', 'jsbb_interview_member_box', 'interview', 'side', 'default');

    // メンバー用
    add_meta_box('member_info', '基本情報', 'jsbb_member_info_box', 'member_profile', 'normal', 'high');
    add_meta_box('member_affiliations', '所属組織', 'jsbb_affiliations_box', 'member_profile', 'normal');
    add_meta_box('member_sns', 'SNSリンク', 'jsbb_sns_box', 'member_profile', 'normal');
    add_meta_box('member_federation', '連盟活動', 'jsbb_federation_activities_box', 'member_profile', 'normal');
    add_meta_box('member_umpire', '審判活動', 'jsbb_umpire_activities_box', 'member_profile', 'normal');
    add_meta_box('member_broadcast', '放送活動', 'jsbb_broadcast_activities_box', 'member_profile', 'normal');
    add_meta_box('member_team', 'チーム活動', 'jsbb_team_activities_box', 'member_profile', 'normal');
    add_meta_box('member_awards', '表彰', 'jsbb_awards_box', 'member_profile', 'normal');
    add_meta_box('member_scoreboard', '電光掲示板実績', 'jsbb_scoreboard_box', 'member_profile', 'normal');
}
add_action('add_meta_boxes', 'jsbb_add_meta_boxes');

// インタビュー: 関連メンバー
function jsbb_interview_member_box($post) {
    wp_nonce_field('jsbb_interview_meta', 'jsbb_interview_nonce');
    $selected_members = get_post_meta($post->ID, '_interview_members', true) ?: array();

    // メンバー一覧を取得
    $members = get_posts(array(
        'post_type' => 'member_profile',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC'
    ));
    ?>
    <div style="max-height:300px;overflow-y:auto;">
        <?php foreach ($members as $member): ?>
            <label style="display:block;margin:5px 0;">
                <input type="checkbox" name="interview_members[]" value="<?php echo $member->ID; ?>" <?php checked(in_array($member->ID, $selected_members)); ?>>
                <?php echo esc_html($member->post_title); ?>
            </label>
        <?php endforeach; ?>
    </div>
    <?php
}

// 基本情報
function jsbb_member_info_box($post) {
    wp_nonce_field('jsbb_meta', 'jsbb_nonce');
    $data = array(
        'name_en' => get_post_meta($post->ID, '_member_name_en', true),
        'role' => get_post_meta($post->ID, '_member_role', true),
        'org' => get_post_meta($post->ID, '_member_organization', true),
        'join_year' => get_post_meta($post->ID, '_member_join_year', true),
        'join_month' => get_post_meta($post->ID, '_member_join_month', true),
        'education' => get_post_meta($post->ID, '_member_education', true),
        'birth' => get_post_meta($post->ID, '_member_birth_date', true),
        'gender' => get_post_meta($post->ID, '_member_gender', true),
    );
    ?>
    <table class="form-table">
        <tr><th>名前（英語）</th><td><input type="text" name="member_name_en" value="<?php echo esc_attr($data['name_en']); ?>" class="regular-text" placeholder="SHIRAISHI Ryo"></td></tr>
        <tr><th>役職</th><td><input type="text" name="member_role" value="<?php echo esc_attr($data['role']); ?>" class="regular-text"></td></tr>
        <tr><th>所属組織</th><td><input type="text" name="member_organization" value="<?php echo esc_attr($data['org']); ?>" class="regular-text"></td></tr>
        <tr><th>入局</th><td><input type="number" name="member_join_year" value="<?php echo esc_attr($data['join_year']); ?>" style="width:80px;">年 <input type="number" name="member_join_month" value="<?php echo esc_attr($data['join_month']); ?>" style="width:60px;">月</td></tr>
        <tr><th>経歴</th><td><input type="text" name="member_education" value="<?php echo esc_attr($data['education']); ?>" class="regular-text"></td></tr>
        <tr><th>生年月日</th><td><input type="text" name="member_birth_date" value="<?php echo esc_attr($data['birth']); ?>" class="regular-text" placeholder="2000年11月24日"></td></tr>
        <tr><th>性別</th><td><select name="member_gender"><option value="">選択</option><option value="男性" <?php selected($data['gender'], '男性'); ?>>男性</option><option value="女性" <?php selected($data['gender'], '女性'); ?>>女性</option></select></td></tr>
    </table>
    <?php
}

// 所属組織
function jsbb_affiliations_box($post) {
    $affiliations = get_post_meta($post->ID, '_member_affiliations', true) ?: array();
    ?>
    <div id="affiliations-repeater">
        <div class="repeater-items">
            <?php foreach ($affiliations as $aff): ?>
                <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
                    <div style="margin-bottom:5px;">
                        <input type="text" name="affiliation_period[]" value="<?php echo esc_attr($aff['period'] ?? ''); ?>" style="width:150px;" placeholder="期間 (例: 2019-)">
                        <input type="text" name="affiliation_organization[]" value="<?php echo esc_attr($aff['organization'] ?? $aff); ?>" class="regular-text" placeholder="組織名">
                    </div>
                    <div>
                        <input type="text" name="affiliation_role[]" value="<?php echo esc_attr($aff['role'] ?? ''); ?>" class="large-text" placeholder="役職 (例: 理事)">
                    </div>
                    <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button add-affiliation">＋ 追加</button>
    </div>
    <script type="text/template" id="affiliation-template">
        <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <div style="margin-bottom:5px;">
                <input type="text" name="affiliation_period[]" value="" style="width:150px;" placeholder="期間 (例: 2019-)">
                <input type="text" name="affiliation_organization[]" value="" class="regular-text" placeholder="組織名">
            </div>
            <div>
                <input type="text" name="affiliation_role[]" value="" class="large-text" placeholder="役職 (例: 理事)">
            </div>
            <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
        </div>
    </script>
    <?php
}

// SNSリンク
function jsbb_sns_box($post) {
    $sns = get_post_meta($post->ID, '_member_sns_links', true) ?: array();
    ?>
    <div id="sns-repeater">
        <div class="repeater-items">
            <?php foreach ($sns as $link): ?>
                <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
                    <select name="member_sns_platform[]" style="width:150px;">
                        <option value="instagram" <?php selected($link['platform'], 'instagram'); ?>>Instagram</option>
                        <option value="twitter" <?php selected($link['platform'], 'twitter'); ?>>Twitter</option>
                        <option value="facebook" <?php selected($link['platform'], 'facebook'); ?>>Facebook</option>
                    </select>
                    <input type="text" name="member_sns_label[]" value="<?php echo esc_attr($link['label']); ?>" placeholder="@username" style="width:150px;">
                    <input type="url" name="member_sns_url[]" value="<?php echo esc_url($link['url']); ?>" placeholder="URL" class="regular-text">
                    <button type="button" class="button remove-item">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button add-sns">＋ 追加</button>
    </div>
    <script type="text/template" id="sns-template">
        <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <select name="member_sns_platform[]" style="width:150px;"><option value="instagram">Instagram</option><option value="twitter">Twitter</option><option value="facebook">Facebook</option></select>
            <input type="text" name="member_sns_label[]" value="" placeholder="@username" style="width:150px;">
            <input type="url" name="member_sns_url[]" value="" placeholder="URL" class="regular-text">
            <button type="button" class="button remove-item">削除</button>
        </div>
    </script>
    <?php
}

// 電光掲示板実績
function jsbb_scoreboard_box($post) {
    $records = get_post_meta($post->ID, '_member_scoreboard_records', true) ?: array();
    ?>
    <div id="scoreboard-repeater">
        <div class="repeater-items">
            <?php foreach ($records as $rec): ?>
                <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
                    <input type="text" name="scoreboard_category[]" value="<?php echo esc_attr($rec['category']); ?>" placeholder="カテゴリ" style="width:150px;">
                    <input type="text" name="scoreboard_title[]" value="<?php echo esc_attr($rec['title']); ?>" placeholder="大会名" class="regular-text">
                    <button type="button" class="button remove-item">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button add-scoreboard">＋ 追加</button>
    </div>
    <script type="text/template" id="scoreboard-template">
        <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <input type="text" name="scoreboard_category[]" value="" placeholder="カテゴリ" style="width:150px;">
            <input type="text" name="scoreboard_title[]" value="" placeholder="大会名" class="regular-text">
            <button type="button" class="button remove-item">削除</button>
        </div>
    </script>
    <?php
}

// 連盟活動
function jsbb_federation_activities_box($post) {
    $activities = get_post_meta($post->ID, '_member_federation_activities', true) ?: array();
    ?>
    <div id="federation-repeater">
        <div class="repeater-items">
            <?php foreach ($activities as $act): ?>
                <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
                    <div style="margin-bottom:5px;">
                        <input type="text" name="federation_date[]" value="<?php echo esc_attr($act['date'] ?? ''); ?>" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                        <input type="text" name="federation_title[]" value="<?php echo esc_attr($act['title'] ?? $act); ?>" class="regular-text" placeholder="活動名">
                    </div>
                    <div>
                        <textarea name="federation_description[]" class="large-text" rows="2" placeholder="活動内容の詳細"><?php echo esc_textarea($act['description'] ?? ''); ?></textarea>
                    </div>
                    <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button add-federation">＋ 追加</button>
    </div>
    <script type="text/template" id="federation-template">
        <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <div style="margin-bottom:5px;">
                <input type="text" name="federation_date[]" value="" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                <input type="text" name="federation_title[]" value="" class="regular-text" placeholder="活動名">
            </div>
            <div>
                <textarea name="federation_description[]" class="large-text" rows="2" placeholder="活動内容の詳細"></textarea>
            </div>
            <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
        </div>
    </script>
    <?php
}

// 審判活動
function jsbb_umpire_activities_box($post) {
    $activities = get_post_meta($post->ID, '_member_umpire_activities', true) ?: array();
    ?>
    <div id="umpire-repeater">
        <div class="repeater-items">
            <?php foreach ($activities as $act): ?>
                <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
                    <div style="margin-bottom:5px;">
                        <input type="text" name="umpire_date[]" value="<?php echo esc_attr($act['date'] ?? ''); ?>" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                        <input type="text" name="umpire_title[]" value="<?php echo esc_attr($act['title'] ?? ''); ?>" class="regular-text" placeholder="大会名・活動名">
                    </div>
                    <div>
                        <textarea name="umpire_description[]" class="large-text" rows="2" placeholder="審判内容の詳細"><?php echo esc_textarea($act['description'] ?? ''); ?></textarea>
                    </div>
                    <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button add-umpire">＋ 追加</button>
    </div>
    <script type="text/template" id="umpire-template">
        <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <div style="margin-bottom:5px;">
                <input type="text" name="umpire_date[]" value="" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                <input type="text" name="umpire_title[]" value="" class="regular-text" placeholder="大会名・活動名">
            </div>
            <div>
                <textarea name="umpire_description[]" class="large-text" rows="2" placeholder="審判内容の詳細"></textarea>
            </div>
            <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
        </div>
    </script>
    <?php
}

// 放送活動
function jsbb_broadcast_activities_box($post) {
    $activities = get_post_meta($post->ID, '_member_broadcast_activities', true) ?: array();
    ?>
    <div id="broadcast-repeater">
        <div class="repeater-items">
            <?php foreach ($activities as $act): ?>
                <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
                    <div style="margin-bottom:5px;">
                        <input type="text" name="broadcast_date[]" value="<?php echo esc_attr($act['date'] ?? ''); ?>" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                        <input type="text" name="broadcast_title[]" value="<?php echo esc_attr($act['title'] ?? ''); ?>" class="regular-text" placeholder="番組名・放送名">
                    </div>
                    <div>
                        <textarea name="broadcast_description[]" class="large-text" rows="2" placeholder="放送内容の詳細"><?php echo esc_textarea($act['description'] ?? ''); ?></textarea>
                    </div>
                    <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button add-broadcast">＋ 追加</button>
    </div>
    <script type="text/template" id="broadcast-template">
        <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <div style="margin-bottom:5px;">
                <input type="text" name="broadcast_date[]" value="" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                <input type="text" name="broadcast_title[]" value="" class="regular-text" placeholder="番組名・放送名">
            </div>
            <div>
                <textarea name="broadcast_description[]" class="large-text" rows="2" placeholder="放送内容の詳細"></textarea>
            </div>
            <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
        </div>
    </script>
    <?php
}

// チーム活動
function jsbb_team_activities_box($post) {
    $activities = get_post_meta($post->ID, '_member_team_activities', true) ?: array();
    ?>
    <div id="team-repeater">
        <div class="repeater-items">
            <?php foreach ($activities as $act): ?>
                <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
                    <div style="margin-bottom:5px;">
                        <input type="text" name="team_date[]" value="<?php echo esc_attr($act['date'] ?? ''); ?>" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                        <input type="text" name="team_title[]" value="<?php echo esc_attr($act['title'] ?? ''); ?>" class="regular-text" placeholder="チーム名・活動名">
                    </div>
                    <div>
                        <textarea name="team_description[]" class="large-text" rows="2" placeholder="チーム活動の詳細"><?php echo esc_textarea($act['description'] ?? ''); ?></textarea>
                    </div>
                    <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button add-team">＋ 追加</button>
    </div>
    <script type="text/template" id="team-template">
        <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <div style="margin-bottom:5px;">
                <input type="text" name="team_date[]" value="" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                <input type="text" name="team_title[]" value="" class="regular-text" placeholder="チーム名・活動名">
            </div>
            <div>
                <textarea name="team_description[]" class="large-text" rows="2" placeholder="チーム活動の詳細"></textarea>
            </div>
            <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
        </div>
    </script>
    <?php
}

// 表彰
function jsbb_awards_box($post) {
    $awards = get_post_meta($post->ID, '_member_awards', true) ?: array();
    ?>
    <div id="awards-repeater">
        <div class="repeater-items">
            <?php foreach ($awards as $award): ?>
                <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
                    <div style="margin-bottom:5px;">
                        <input type="text" name="award_date[]" value="<?php echo esc_attr($award['date'] ?? ''); ?>" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                        <input type="text" name="award_title[]" value="<?php echo esc_attr($award['title'] ?? ''); ?>" class="regular-text" placeholder="賞名">
                    </div>
                    <div>
                        <textarea name="award_description[]" class="large-text" rows="2" placeholder="表彰内容の詳細"><?php echo esc_textarea($award['description'] ?? ''); ?></textarea>
                    </div>
                    <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button add-award">＋ 追加</button>
    </div>
    <script type="text/template" id="award-template">
        <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <div style="margin-bottom:5px;">
                <input type="text" name="award_date[]" value="" style="width:150px;" placeholder="日付 (例: 2024-01-15)">
                <input type="text" name="award_title[]" value="" class="regular-text" placeholder="賞名">
            </div>
            <div>
                <textarea name="award_description[]" class="large-text" rows="2" placeholder="表彰内容の詳細"></textarea>
            </div>
            <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
        </div>
    </script>
    <?php
}

// 保存処理（メンバー）
function jsbb_save_meta($post_id) {
    if (!isset($_POST['jsbb_nonce']) || !wp_verify_nonce($_POST['jsbb_nonce'], 'jsbb_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    // 基本情報
    $fields = array('member_name_en', 'member_role', 'member_organization', 'member_join_year', 'member_join_month', 'member_education', 'member_birth_date', 'member_gender');
    foreach ($fields as $f) {
        if (isset($_POST[$f])) update_post_meta($post_id, '_' . $f, sanitize_text_field($_POST[$f]));
    }

    // 所属組織
    if (isset($_POST['affiliation_organization'])) {
        $affiliations = array();
        for ($i = 0; $i < count($_POST['affiliation_organization']); $i++) {
            if (!empty($_POST['affiliation_organization'][$i])) {
                $affiliations[] = array(
                    'period' => sanitize_text_field($_POST['affiliation_period'][$i] ?? ''),
                    'organization' => sanitize_text_field($_POST['affiliation_organization'][$i]),
                    'role' => sanitize_text_field($_POST['affiliation_role'][$i] ?? '')
                );
            }
        }
        update_post_meta($post_id, '_member_affiliations', $affiliations);
    }

    // SNS
    if (isset($_POST['member_sns_platform'])) {
        $sns = array();
        for ($i = 0; $i < count($_POST['member_sns_platform']); $i++) {
            if (!empty($_POST['member_sns_url'][$i])) {
                $sns[] = array(
                    'platform' => sanitize_text_field($_POST['member_sns_platform'][$i]),
                    'label' => sanitize_text_field($_POST['member_sns_label'][$i]),
                    'url' => esc_url_raw($_POST['member_sns_url'][$i])
                );
            }
        }
        update_post_meta($post_id, '_member_sns_links', $sns);
    }

    // 連盟活動
    if (isset($_POST['federation_title'])) {
        $activities = array();
        for ($i = 0; $i < count($_POST['federation_title']); $i++) {
            if (!empty($_POST['federation_title'][$i])) {
                $activities[] = array(
                    'date' => sanitize_text_field($_POST['federation_date'][$i] ?? ''),
                    'title' => sanitize_text_field($_POST['federation_title'][$i]),
                    'description' => sanitize_textarea_field($_POST['federation_description'][$i] ?? '')
                );
            }
        }
        update_post_meta($post_id, '_member_federation_activities', $activities);
    }

    // 審判活動
    if (isset($_POST['umpire_title'])) {
        $activities = array();
        for ($i = 0; $i < count($_POST['umpire_title']); $i++) {
            if (!empty($_POST['umpire_title'][$i])) {
                $activities[] = array(
                    'date' => sanitize_text_field($_POST['umpire_date'][$i] ?? ''),
                    'title' => sanitize_text_field($_POST['umpire_title'][$i]),
                    'description' => sanitize_textarea_field($_POST['umpire_description'][$i] ?? '')
                );
            }
        }
        update_post_meta($post_id, '_member_umpire_activities', $activities);
    }

    // 放送活動
    if (isset($_POST['broadcast_title'])) {
        $activities = array();
        for ($i = 0; $i < count($_POST['broadcast_title']); $i++) {
            if (!empty($_POST['broadcast_title'][$i])) {
                $activities[] = array(
                    'date' => sanitize_text_field($_POST['broadcast_date'][$i] ?? ''),
                    'title' => sanitize_text_field($_POST['broadcast_title'][$i]),
                    'description' => sanitize_textarea_field($_POST['broadcast_description'][$i] ?? '')
                );
            }
        }
        update_post_meta($post_id, '_member_broadcast_activities', $activities);
    }

    // チーム活動
    if (isset($_POST['team_title'])) {
        $activities = array();
        for ($i = 0; $i < count($_POST['team_title']); $i++) {
            if (!empty($_POST['team_title'][$i])) {
                $activities[] = array(
                    'date' => sanitize_text_field($_POST['team_date'][$i] ?? ''),
                    'title' => sanitize_text_field($_POST['team_title'][$i]),
                    'description' => sanitize_textarea_field($_POST['team_description'][$i] ?? '')
                );
            }
        }
        update_post_meta($post_id, '_member_team_activities', $activities);
    }

    // 表彰
    if (isset($_POST['award_title'])) {
        $awards = array();
        for ($i = 0; $i < count($_POST['award_title']); $i++) {
            if (!empty($_POST['award_title'][$i])) {
                $awards[] = array(
                    'date' => sanitize_text_field($_POST['award_date'][$i] ?? ''),
                    'title' => sanitize_text_field($_POST['award_title'][$i]),
                    'description' => sanitize_textarea_field($_POST['award_description'][$i] ?? '')
                );
            }
        }
        update_post_meta($post_id, '_member_awards', $awards);
    }

    // 電光掲示板
    if (isset($_POST['scoreboard_category'])) {
        $records = array();
        for ($i = 0; $i < count($_POST['scoreboard_category']); $i++) {
            if (!empty($_POST['scoreboard_title'][$i])) {
                $records[] = array(
                    'category' => sanitize_text_field($_POST['scoreboard_category'][$i]),
                    'title' => sanitize_text_field($_POST['scoreboard_title'][$i])
                );
            }
        }
        update_post_meta($post_id, '_member_scoreboard_records', $records);
    }
}
add_action('save_post_member_profile', 'jsbb_save_meta');

// 保存処理（インタビュー）
function jsbb_save_interview_meta($post_id) {
    if (!isset($_POST['jsbb_interview_nonce']) || !wp_verify_nonce($_POST['jsbb_interview_nonce'], 'jsbb_interview_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    // 関連メンバー
    $members = isset($_POST['interview_members']) ? array_map('intval', $_POST['interview_members']) : array();
    update_post_meta($post_id, '_interview_members', $members);
}
add_action('save_post_interview', 'jsbb_save_interview_meta');

// JavaScript読み込み
function jsbb_admin_scripts() {
    $screen = get_current_screen();
    if (!$screen || !in_array($screen->base, array('post', 'post-new'))) return;
    ?>
    <script>
    jQuery(document).ready(function($) {
        $('.add-affiliation').on('click', function() { $('#affiliations-repeater .repeater-items').append($('#affiliation-template').html()); });
        $('.add-sns').on('click', function() { $('#sns-repeater .repeater-items').append($('#sns-template').html()); });
        $('.add-scoreboard').on('click', function() { $('#scoreboard-repeater .repeater-items').append($('#scoreboard-template').html()); });
        $('.add-federation').on('click', function() { $('#federation-repeater .repeater-items').append($('#federation-template').html()); });
        $('.add-umpire').on('click', function() { $('#umpire-repeater .repeater-items').append($('#umpire-template').html()); });
        $('.add-broadcast').on('click', function() { $('#broadcast-repeater .repeater-items').append($('#broadcast-template').html()); });
        $('.add-team').on('click', function() { $('#team-repeater .repeater-items').append($('#team-template').html()); });
        $('.add-award').on('click', function() { $('#awards-repeater .repeater-items').append($('#award-template').html()); });
        $(document).on('click', '.remove-item', function() { $(this).closest('.repeater-item').remove(); });
    });
    </script>
    <style>
    .repeater-item { position: relative; margin-bottom: 10px; padding: 10px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; }
    .repeater-item input, .repeater-item select, .repeater-item textarea { margin-right: 10px; margin-bottom: 5px; }
    .remove-item { background: #dc3232; border-color: #dc3232; color: #fff; }
    .remove-item:hover { background: #a00; border-color: #a00; }
    </style>
    <?php
}
add_action('admin_head', 'jsbb_admin_scripts');

// ==========================================
// プラグイン有効化時の処理
// ==========================================
function jsbb_activate_plugin() {
    // パーマリンク設定をフラッシュするだけ
    flush_rewrite_rules();
    // 初期データ作成フラグを設定
    add_option('jsbb_need_init_data', '1');
}
register_activation_hook(__FILE__, 'jsbb_activate_plugin');

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
    register_rest_route('jsbb/v1', '/member/(?P<slug>[a-zA-Z0-9-]+)', array(
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

function jsbb_get_all_members_custom($request) {
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