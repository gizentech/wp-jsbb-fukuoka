<?php
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
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'),
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
    wp_enqueue_media(); // ← 【追加】エクスプローラーを起動するエンジンをオンにする
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
        $('.add-og-member').on('click', function() { $('#og-members-repeater .repeater-items').append($('#og-member-template').html()); });
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
