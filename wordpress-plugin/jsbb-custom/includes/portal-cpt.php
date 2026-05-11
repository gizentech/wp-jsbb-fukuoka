<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ポータル大会 カスタム投稿タイプ
// ==========================================

add_action('init', function () {
    register_post_type('portal_tournament', array(
        'labels' => array(
            'name'               => 'ポータル大会',
            'singular_name'      => 'ポータル大会',
            'add_new'            => '新規追加',
            'add_new_item'       => 'ポータル大会を追加',
            'edit_item'          => 'ポータル大会を編集',
            'view_item'          => 'ポータル大会を表示',
            'search_items'       => 'ポータル大会を検索',
            'not_found'          => 'ポータル大会が見つかりません',
        ),
        'public'             => false,
        'show_ui'            => true,
        'show_in_menu'       => 'portal-management',
        'menu_icon'          => 'dashicons-clipboard',
        'supports'           => array('title'),
        'show_in_rest'       => false,
    ));
});

// ポータル大会のメタキー一覧
function jsbb_portal_tournament_meta_keys() {
    return array(
        '_portal_tournament_description',
        '_portal_tournament_deadline',
        '_portal_tournament_visibility',  // public / private
        '_portal_tournament_status',      // active / closed / draft
        '_portal_tournament_team_ids',    // JSON array
        '_portal_tournament_type',        // national / prefectural
        '_portal_tournament_created_at',
    );
}

// メタボックス追加
add_action('add_meta_boxes', function () {
    add_meta_box(
        'portal_tournament_settings',
        'ポータル大会設定',
        'jsbb_portal_tournament_metabox',
        'portal_tournament',
        'normal',
        'high'
    );
});

function jsbb_portal_tournament_metabox($post) {
    wp_nonce_field('portal_tournament_save', 'portal_tournament_nonce');

    $description     = get_post_meta($post->ID, '_portal_tournament_description', true) ?: '';
    $deadline        = get_post_meta($post->ID, '_portal_tournament_deadline', true) ?: '';
    $visibility      = get_post_meta($post->ID, '_portal_tournament_visibility', true) ?: 'private';
    $status          = get_post_meta($post->ID, '_portal_tournament_status', true) ?: 'draft';
    $tournament_type = get_post_meta($post->ID, '_portal_tournament_type', true) ?: 'prefectural';
    ?>
    <table class="form-table">
        <tr>
            <th><label for="portal_tournament_type">大会種別</label></th>
            <td>
                <select id="portal_tournament_type" name="portal_tournament_type">
                    <option value="prefectural" <?php selected($tournament_type, 'prefectural'); ?>>県大会</option>
                    <option value="national" <?php selected($tournament_type, 'national'); ?>>全国大会</option>
                </select>
                <p class="description">県大会: 代表は「支部」から選択 / 全国大会: 代表は「都道府県」から選択</p>
            </td>
        </tr>
        <tr>
            <th><label for="portal_description">大会説明</label></th>
            <td><textarea id="portal_description" name="portal_description" rows="5" style="width:100%"><?php echo esc_textarea($description); ?></textarea></td>
        </tr>
        <tr>
            <th><label for="portal_deadline">申込編集期限</label></th>
            <td><input type="datetime-local" id="portal_deadline" name="portal_deadline" value="<?php echo esc_attr($deadline); ?>" /></td>
        </tr>
        <tr>
            <th><label for="portal_visibility">公開設定</label></th>
            <td>
                <select id="portal_visibility" name="portal_visibility">
                    <option value="public" <?php selected($visibility, 'public'); ?>>公開</option>
                    <option value="private" <?php selected($visibility, 'private'); ?>>非公開</option>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="portal_status">ステータス</label></th>
            <td>
                <select id="portal_status" name="portal_status">
                    <option value="draft" <?php selected($status, 'draft'); ?>>下書き</option>
                    <option value="active" <?php selected($status, 'active'); ?>>受付中</option>
                    <option value="closed" <?php selected($status, 'closed'); ?>>終了</option>
                </select>
            </td>
        </tr>
    </table>
    <?php
}

add_action('save_post_portal_tournament', function ($post_id) {
    if (!isset($_POST['portal_tournament_nonce']) || !wp_verify_nonce($_POST['portal_tournament_nonce'], 'portal_tournament_save')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    $fields = array(
        'portal_description'     => '_portal_tournament_description',
        'portal_deadline'        => '_portal_tournament_deadline',
        'portal_visibility'      => '_portal_tournament_visibility',
        'portal_status'          => '_portal_tournament_status',
        'portal_tournament_type' => '_portal_tournament_type',
    );

    foreach ($fields as $post_key => $meta_key) {
        if (isset($_POST[$post_key])) {
            update_post_meta($post_id, $meta_key, sanitize_text_field($_POST[$post_key]));
        }
    }

    // 初回保存時に作成日時を設定
    if (!get_post_meta($post_id, '_portal_tournament_created_at', true)) {
        update_post_meta($post_id, '_portal_tournament_created_at', current_time('mysql'));
    }
});

// ==========================================
// ポータルチーム カスタム投稿タイプ（既存teamとは独立）
// ==========================================

add_action('init', function () {
    register_post_type('portal_team', array(
        'labels' => array(
            'name'               => 'ポータルチーム',
            'singular_name'      => 'ポータルチーム',
            'add_new'            => '新規追加',
            'add_new_item'       => 'ポータルチームを追加',
            'edit_item'          => 'ポータルチームを編集',
            'view_item'          => 'ポータルチームを表示',
            'search_items'       => 'ポータルチームを検索',
            'not_found'          => 'ポータルチームが見つかりません',
        ),
        'public'             => false,
        'show_ui'            => true,
        'show_in_menu'       => 'portal-management',
        'menu_icon'          => 'dashicons-groups',
        'supports'           => array('title'),
        'show_in_rest'       => false,
    ));
});

// ポータルチームのメタキー一覧
function jsbb_portal_team_meta_keys() {
    return array(
        '_portal_team_id',              // 8桁ユニークID
        '_portal_team_email',           // 代表者メールアドレス
        '_portal_team_representative',  // 代表者名
        '_portal_team_phone',           // 連絡先電話番号
        '_portal_team_region',          // 代表地域（旧・互換用）
        '_portal_team_region_national', // 全国大会用 代表（都道府県）
        '_portal_team_region_branch',   // 県大会用 代表（支部）
        '_portal_team_note',            // 備考
        '_portal_team_created_at',
    );
}

// 8桁ユニークチームIDを生成
function jsbb_generate_team_id() {
    $max_attempts = 100;
    for ($i = 0; $i < $max_attempts; $i++) {
        $team_id = str_pad(mt_rand(10000000, 99999999), 8, '0', STR_PAD_LEFT);

        // 重複チェック
        $existing = get_posts(array(
            'post_type'   => 'portal_team',
            'meta_key'    => '_portal_team_id',
            'meta_value'  => $team_id,
            'post_status' => 'any',
            'numberposts' => 1,
        ));

        if (empty($existing)) {
            return $team_id;
        }
    }

    // フォールバック: タイムスタンプベース
    return substr(time() . mt_rand(100, 999), -8);
}

// メタボックス追加
add_action('add_meta_boxes', function () {
    add_meta_box(
        'portal_team_settings',
        'ポータルチーム設定',
        'jsbb_portal_team_metabox',
        'portal_team',
        'normal',
        'high'
    );
});

function jsbb_portal_team_metabox($post) {
    wp_nonce_field('portal_team_save', 'portal_team_nonce');

    $team_id          = get_post_meta($post->ID, '_portal_team_id', true) ?: '';
    $email            = get_post_meta($post->ID, '_portal_team_email', true) ?: '';
    $representative   = get_post_meta($post->ID, '_portal_team_representative', true) ?: '';
    $phone            = get_post_meta($post->ID, '_portal_team_phone', true) ?: '';
    $region_national  = get_post_meta($post->ID, '_portal_team_region_national', true) ?: '';
    $region_branch    = get_post_meta($post->ID, '_portal_team_region_branch', true) ?: '';
    $note             = get_post_meta($post->ID, '_portal_team_note', true) ?: '';

    // 参加大会
    $tournament_ids_json = get_post_meta($post->ID, '_portal_team_tournament_ids', true);
    $selected_tournament_ids = $tournament_ids_json ? json_decode($tournament_ids_json, true) : array();
    if (!is_array($selected_tournament_ids)) $selected_tournament_ids = array();

    $all_tournaments = get_posts(array(
        'post_type'   => 'portal_tournament',
        'post_status' => 'publish',
        'numberposts' => -1,
        'orderby'     => 'title',
        'order'       => 'ASC',
    ));
    ?>
    <table class="form-table">
        <tr>
            <th><label>チームID</label></th>
            <td><code style="font-size:1.2em"><?php echo esc_html($team_id ?: '（保存時に自動生成）'); ?></code></td>
        </tr>
        <tr>
            <th><label>参加大会</label></th>
            <td>
                <?php if (empty($all_tournaments)): ?>
                    <p class="description">大会が登録されていません。先にポータル大会を作成してください。</p>
                <?php else: ?>
                    <div style="max-height:150px;overflow-y:auto;border:1px solid #ddd;padding:6px 10px;background:#fff;">
                    <?php foreach ($all_tournaments as $t): ?>
                        <label style="display:block;margin-bottom:4px;">
                            <input type="checkbox" name="portal_team_tournament_ids[]"
                                value="<?php echo esc_attr($t->ID); ?>"
                                <?php checked(in_array((string)$t->ID, array_map('strval', $selected_tournament_ids))); ?> />
                            <?php echo esc_html($t->post_title); ?>
                        </label>
                    <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </td>
        </tr>
        <tr>
            <th><label for="portal_team_email">代表者メール</label></th>
            <td><input type="email" id="portal_team_email" name="portal_team_email" value="<?php echo esc_attr($email); ?>" style="width:100%" /></td>
        </tr>
        <tr>
            <th><label for="portal_team_representative">代表者名</label></th>
            <td><input type="text" id="portal_team_representative" name="portal_team_representative" value="<?php echo esc_attr($representative); ?>" style="width:100%" /></td>
        </tr>
        <tr>
            <th><label for="portal_team_region_national">全国大会 代表（都道府県）</label></th>
            <td><input type="text" id="portal_team_region_national" name="portal_team_region_national" value="<?php echo esc_attr($region_national); ?>" style="width:100%" placeholder="例: 福岡県" /></td>
        </tr>
        <tr>
            <th><label for="portal_team_region_branch">県大会 代表（支部）</label></th>
            <td><input type="text" id="portal_team_region_branch" name="portal_team_region_branch" value="<?php echo esc_attr($region_branch); ?>" style="width:100%" placeholder="例: 筑後支部" /></td>
        </tr>
        <tr>
            <th><label for="portal_team_phone">電話番号</label></th>
            <td><input type="text" id="portal_team_phone" name="portal_team_phone" value="<?php echo esc_attr($phone); ?>" style="width:100%" /></td>
        </tr>
        <tr>
            <th><label for="portal_team_note">備考</label></th>
            <td><textarea id="portal_team_note" name="portal_team_note" rows="3" style="width:100%"><?php echo esc_textarea($note); ?></textarea></td>
        </tr>
    </table>
    <?php
}

add_action('save_post_portal_team', function ($post_id) {
    if (!isset($_POST['portal_team_nonce']) || !wp_verify_nonce($_POST['portal_team_nonce'], 'portal_team_save')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    $fields = array(
        'portal_team_email'           => '_portal_team_email',
        'portal_team_representative'  => '_portal_team_representative',
        'portal_team_phone'           => '_portal_team_phone',
        'portal_team_region_national' => '_portal_team_region_national',
        'portal_team_region_branch'   => '_portal_team_region_branch',
        'portal_team_note'            => '_portal_team_note',
    );

    foreach ($fields as $post_key => $meta_key) {
        if (isset($_POST[$post_key])) {
            update_post_meta($post_id, $meta_key, sanitize_text_field($_POST[$post_key]));
        }
    }

    // 参加大会チェックボックス（双方向同期）
    $new_tournament_ids = isset($_POST['portal_team_tournament_ids']) ? array_map('intval', (array) $_POST['portal_team_tournament_ids']) : array();
    update_post_meta($post_id, '_portal_team_tournament_ids', wp_json_encode($new_tournament_ids));

    // 各大会の _portal_tournament_team_ids にもこのチームを双方向で同期
    $all_t = get_posts(array('post_type' => 'portal_tournament', 'posts_per_page' => -1, 'post_status' => 'publish'));
    foreach ($all_t as $t) {
        $t_ids_json = get_post_meta($t->ID, '_portal_tournament_team_ids', true);
        $t_ids = $t_ids_json ? json_decode($t_ids_json, true) : array();
        if (!is_array($t_ids)) $t_ids = array();
        $t_ids = array_map('intval', $t_ids);

        if (in_array($t->ID, $new_tournament_ids)) {
            if (!in_array($post_id, $t_ids)) {
                $t_ids[] = $post_id;
                update_post_meta($t->ID, '_portal_tournament_team_ids', wp_json_encode(array_values($t_ids)));
            }
        } else {
            $t_ids_filtered = array_values(array_filter($t_ids, function($tid) use ($post_id) { return (int)$tid !== (int)$post_id; }));
            update_post_meta($t->ID, '_portal_tournament_team_ids', wp_json_encode($t_ids_filtered));
        }
    }

    // チームID未設定 or 8桁でない場合は自動生成
    $current_team_id = get_post_meta($post_id, '_portal_team_id', true);
    if (!$current_team_id || strlen($current_team_id) !== 8 || !ctype_digit($current_team_id)) {
        update_post_meta($post_id, '_portal_team_id', jsbb_generate_team_id());
    }

    if (!get_post_meta($post_id, '_portal_team_created_at', true)) {
        update_post_meta($post_id, '_portal_team_created_at', current_time('mysql'));
    }
});

// ポータルチームデータを組み立てる
function jsbb_build_portal_team($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'portal_team') return null;

    $t_ids_json = get_post_meta($post_id, '_portal_team_tournament_ids', true);
    $tournament_ids = $t_ids_json ? json_decode($t_ids_json, true) : array();

    return array(
        'id'              => $post->ID,
        'team_id'         => get_post_meta($post_id, '_portal_team_id', true) ?: '',
        'name'            => $post->post_title,
        'email'           => get_post_meta($post_id, '_portal_team_email', true) ?: '',
        'representative'  => get_post_meta($post_id, '_portal_team_representative', true) ?: '',
        'phone'           => get_post_meta($post_id, '_portal_team_phone', true) ?: '',
        'region'          => get_post_meta($post_id, '_portal_team_region', true) ?: '',
        'region_national' => get_post_meta($post_id, '_portal_team_region_national', true) ?: '',
        'region_branch'   => get_post_meta($post_id, '_portal_team_region_branch', true) ?: '',
        'note'            => get_post_meta($post_id, '_portal_team_note', true) ?: '',
        'tournament_ids'  => is_array($tournament_ids) ? $tournament_ids : array(),
        'created_at'      => get_post_meta($post_id, '_portal_team_created_at', true) ?: '',
    );
}

// ポータル大会データを組み立てる
function jsbb_build_portal_tournament($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'portal_tournament') return null;

    $team_ids_json = get_post_meta($post_id, '_portal_tournament_team_ids', true);
    $team_ids = $team_ids_json ? json_decode($team_ids_json, true) : array();

    return array(
        'id'              => $post->ID,
        'name'            => $post->post_title,
        'description'     => get_post_meta($post_id, '_portal_tournament_description', true) ?: '',
        'deadline'        => get_post_meta($post_id, '_portal_tournament_deadline', true) ?: '',
        'visibility'      => get_post_meta($post_id, '_portal_tournament_visibility', true) ?: 'private',
        'status'          => get_post_meta($post_id, '_portal_tournament_status', true) ?: 'draft',
        'tournament_type' => get_post_meta($post_id, '_portal_tournament_type', true) ?: 'prefectural',
        'team_ids'        => is_array($team_ids) ? $team_ids : array(),
        'team_count'      => is_array($team_ids) ? count($team_ids) : 0,
        'created_at'      => get_post_meta($post_id, '_portal_tournament_created_at', true) ?: '',
    );
}
