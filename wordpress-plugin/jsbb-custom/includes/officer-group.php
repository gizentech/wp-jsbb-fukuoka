<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// カスタム投稿タイプ: 役員グループ
// ==========================================
function jsbb_register_officer_group_post_type() {
    $labels = array(
        'name' => '役員グループ',
        'singular_name' => '役員グループ',
        'add_new' => '新規追加',
        'add_new_item' => '新しい役員グループを追加',
        'edit_item' => '役員グループを編集',
        'all_items' => 'すべての役員グループ'
    );

    register_post_type('officer_group', array(
        'labels' => $labels,
        'public' => true,
        'show_in_rest' => true,
        'rest_base' => 'officer_group',
        'menu_icon' => 'dashicons-businessman',
        'supports' => array('title', 'custom-fields'),
    ));
}
add_action('init', 'jsbb_register_officer_group_post_type');

// 役員グループ: メタボックス
function jsbb_add_officer_group_meta_boxes() {
    add_meta_box('og_settings', '基本設定', 'jsbb_og_settings_box', 'officer_group', 'normal', 'high');
    add_meta_box('og_members', 'メンバー一覧（県連盟役員用）', 'jsbb_og_members_box', 'officer_group', 'normal');
    add_meta_box('og_branch', '支部役員（支部用）', 'jsbb_og_branch_box', 'officer_group', 'normal');
}
add_action('add_meta_boxes', 'jsbb_add_officer_group_meta_boxes');

function jsbb_og_settings_box($post) {
    wp_nonce_field('jsbb_og_meta', 'jsbb_og_nonce');
    $section = get_post_meta($post->ID, '_og_section', true) ?: 'prefecture';
    $sort_order = get_post_meta($post->ID, '_og_sort_order', true) ?: '0';
    ?>
    <table class="form-table">
        <tr>
            <th>区分</th>
            <td>
                <select name="og_section">
                    <option value="prefecture" <?php selected($section, 'prefecture'); ?>>県連盟役員</option>
                    <option value="branch" <?php selected($section, 'branch'); ?>>支部役員</option>
                </select>
                <p class="description">県連盟役員の場合は「メンバー一覧」、支部役員の場合は「支部役員」欄を使用してください。</p>
            </td>
        </tr>
        <tr>
            <th>表示順</th>
            <td>
                <input type="number" name="og_sort_order" value="<?php echo esc_attr($sort_order); ?>" style="width:80px;">
                <p class="description">数値が小さいほど上に表示されます。</p>
            </td>
        </tr>
    </table>
    <?php
}

function jsbb_og_members_box($post) {
    $members = get_post_meta($post->ID, '_og_members', true) ?: array();
    ?>
    <p class="description">県連盟役員グループの場合にこちらを使用します。投稿タイトルが役職名になります（例: 顧問、会長）</p>
    <div id="og-members-repeater">
        <div class="repeater-items">
            <?php foreach ($members as $m): ?>
                <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
                    <input type="text" name="og_member_name[]" value="<?php echo esc_attr($m['name'] ?? ''); ?>" class="regular-text" placeholder="氏名">
                    <input type="text" name="og_member_role_note[]" value="<?php echo esc_attr($m['role_note'] ?? ''); ?>" class="regular-text" placeholder="役割注記（任意）例: 全日本軟式野球連盟 相談役">
                    <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
                </div>
            <?php endforeach; ?>
        </div>
        <button type="button" class="button add-og-member">＋ メンバー追加</button>
    </div>
    <script type="text/template" id="og-member-template">
        <div class="repeater-item" style="margin-bottom:10px;padding:10px;background:#f9f9f9;border:1px solid #ddd;">
            <input type="text" name="og_member_name[]" value="" class="regular-text" placeholder="氏名">
            <input type="text" name="og_member_role_note[]" value="" class="regular-text" placeholder="役割注記（任意）例: 全日本軟式野球連盟 相談役">
            <button type="button" class="button remove-item" style="margin-top:5px;">削除</button>
        </div>
    </script>
    <?php
}

function jsbb_og_branch_box($post) {
    $president = get_post_meta($post->ID, '_og_branch_president', true) ?: '';
    $director = get_post_meta($post->ID, '_og_branch_director', true) ?: '';
    $secretary = get_post_meta($post->ID, '_og_branch_secretary', true) ?: '';
    ?>
    <p class="description">支部の場合にこちらを使用します。投稿タイトルが支部名になります（例: 行橋支部）</p>
    <table class="form-table">
        <tr><th>支部長</th><td><input type="text" name="og_branch_president" value="<?php echo esc_attr($president); ?>" class="regular-text"></td></tr>
        <tr><th>理事長</th><td><input type="text" name="og_branch_director" value="<?php echo esc_attr($director); ?>" class="regular-text"></td></tr>
        <tr><th>事務局</th><td><input type="text" name="og_branch_secretary" value="<?php echo esc_attr($secretary); ?>" class="regular-text"></td></tr>
    </table>
    <?php
}

// 保存処理（役員グループ）
function jsbb_save_officer_group_meta($post_id) {
    if (!isset($_POST['jsbb_og_nonce']) || !wp_verify_nonce($_POST['jsbb_og_nonce'], 'jsbb_og_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    // 基本設定
    if (isset($_POST['og_section'])) {
        update_post_meta($post_id, '_og_section', sanitize_text_field($_POST['og_section']));
    }
    if (isset($_POST['og_sort_order'])) {
        update_post_meta($post_id, '_og_sort_order', sanitize_text_field($_POST['og_sort_order']));
    }

    // メンバー一覧
    if (isset($_POST['og_member_name'])) {
        $members = array();
        for ($i = 0; $i < count($_POST['og_member_name']); $i++) {
            if (!empty($_POST['og_member_name'][$i])) {
                $members[] = array(
                    'name' => sanitize_text_field($_POST['og_member_name'][$i]),
                    'role_note' => sanitize_text_field($_POST['og_member_role_note'][$i] ?? '')
                );
            }
        }
        update_post_meta($post_id, '_og_members', $members);
    }

    // 支部役員
    if (isset($_POST['og_branch_president'])) {
        update_post_meta($post_id, '_og_branch_president', sanitize_text_field($_POST['og_branch_president']));
    }
    if (isset($_POST['og_branch_director'])) {
        update_post_meta($post_id, '_og_branch_director', sanitize_text_field($_POST['og_branch_director']));
    }
    if (isset($_POST['og_branch_secretary'])) {
        update_post_meta($post_id, '_og_branch_secretary', sanitize_text_field($_POST['og_branch_secretary']));
    }
}
add_action('save_post_officer_group', 'jsbb_save_officer_group_meta');
