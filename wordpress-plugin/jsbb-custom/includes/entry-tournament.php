<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 大会申込管理（申込フォーム用）
// テーブル: jsbb_tournaments / jsbb_entries
// ==========================================

// ─── テーブル作成 ──────────────────────────────────────────────────────────

function jsbb_entry_create_tables(): void {
    global $wpdb;
    $charset = $wpdb->get_charset_collate();

    $wpdb->query("CREATE TABLE IF NOT EXISTS jsbb_tournaments (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        name           VARCHAR(255) NOT NULL,
        form_type      VARCHAR(50)  NOT NULL DEFAULT 'prefecture',
        is_active      TINYINT(1)   NOT NULL DEFAULT 1,
        sort_order     INT          NOT NULL DEFAULT 0,
        entry_deadline DATETIME     NULL,
        created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB {$charset}");

    $col = $wpdb->get_results("SHOW COLUMNS FROM jsbb_tournaments LIKE 'entry_deadline'");
    if (empty($col)) {
        $wpdb->query("ALTER TABLE jsbb_tournaments ADD COLUMN entry_deadline DATETIME NULL AFTER sort_order");
    }

    $wpdb->query("CREATE TABLE IF NOT EXISTS jsbb_entries (
        id             INT AUTO_INCREMENT PRIMARY KEY,
        entry_code     VARCHAR(30)  NOT NULL,
        tournament_id  INT          NULL,
        form_data      LONGTEXT     NOT NULL,
        created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_code (entry_code),
        INDEX idx_tournament (tournament_id)
    ) ENGINE=InnoDB {$charset}");

    // 既存テーブルの tournament_id を NULL 許容に変更
    $col = $wpdb->get_results("SHOW COLUMNS FROM jsbb_entries LIKE 'tournament_id'");
    if (!empty($col) && isset($col[0]->Null) && $col[0]->Null === 'NO') {
        $wpdb->query("ALTER TABLE jsbb_entries MODIFY COLUMN tournament_id INT NULL");
    }
}

// 初回 admin アクセス時に自動マイグレーション
add_action('admin_init', function () {
    if (get_option('jsbb_entry_schema_v2') === '1') return;
    jsbb_entry_create_tables();
    update_option('jsbb_entry_schema_v2', '1');
});

// ─── 管理メニュー ──────────────────────────────────────────────────────────

add_action('admin_menu', function () {
    add_menu_page(
        '大会申込管理', '大会申込管理', 'edit_posts',
        'jsbb-entry-tournament', 'jsbb_entry_admin_page',
        'dashicons-edit-page', 31
    );
    add_submenu_page(
        'jsbb-entry-tournament',
        '大会一覧・エントリー', '大会一覧・エントリー',
        'edit_posts', 'jsbb-entry-tournament', 'jsbb_entry_admin_page'
    );
    add_submenu_page(
        'jsbb-entry-tournament',
        '大会を追加・編集', '大会を追加',
        'edit_posts', 'jsbb-entry-tournament-add', 'jsbb_entry_tournament_form_page'
    );
    remove_submenu_page('jsbb-entry-tournament', 'jsbb-entry-tournament');
});

// ─── スタイル ──────────────────────────────────────────────────────────────

add_action('admin_head', function () {
    $screen = get_current_screen();
    if (!$screen || strpos($screen->id, 'jsbb-entry') === false) return;
    ?>
    <style>
    .jsbb-e-card{background:#fff;border:1px solid #c3c4c7;padding:20px;margin-bottom:20px;border-radius:3px}
    .jsbb-e-card h2{font-size:14px;font-weight:700;color:#1a3a70;border-left:3px solid #1a3a70;padding-left:8px;margin:0 0 14px}
    .jsbb-e-table{width:100%;border-collapse:collapse;font-size:13px}
    .jsbb-e-table th{background:#1a3a70;color:#fff;padding:8px 10px;text-align:left;white-space:nowrap}
    .jsbb-e-table td{padding:7px 10px;border-bottom:1px solid #e8e8e8;vertical-align:middle}
    .jsbb-e-table tr:hover td{background:#f8f9ff}
    .jsbb-e-badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700}
    .jsbb-e-badge-active {background:#cce5ff;color:#004085}
    .jsbb-e-badge-expired{background:#fff3cd;color:#856404}
    .jsbb-e-badge-off    {background:#f8d7da;color:#721c24}
    .jsbb-e-badge-city   {background:#d4edda;color:#155724}
    .jsbb-e-code{font-family:monospace;font-weight:700;letter-spacing:1px;color:#1a3a70;font-size:13px}
    .jsbb-e-filter{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
    .jsbb-e-filter a{padding:4px 12px;border-radius:4px;text-decoration:none;font-size:12px;border:1px solid #ccc;color:#444}
    .jsbb-e-filter a.active{background:#1a3a70;color:#fff;border-color:#1a3a70}
    </style>
    <?php
});

// ==========================================
// admin_post_ ハンドラー（出力前に実行 → wp_redirect が安全）
// ==========================================

// ── 大会 保存（追加・編集）──────────────────────────────────────────────────
add_action('admin_post_jsbb_entry_save_tournament', function () {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');
    check_admin_referer('jsbb_entry_save_tournament');

    global $wpdb;
    $id        = (int)($_POST['tournament_id'] ?? 0);
    $name      = sanitize_text_field(trim($_POST['name'] ?? ''));
    $form_type = in_array($_POST['form_type'] ?? '', ['prefecture', 'city']) ? $_POST['form_type'] : 'prefecture';
    $sort      = (int)($_POST['sort_order'] ?? 0);
    $active    = isset($_POST['is_active']) ? 1 : 0;
    $dl_raw    = trim($_POST['entry_deadline'] ?? '');
    $deadline  = $dl_raw ? str_replace('T', ' ', $dl_raw) . ':00' : null;

    if (!$name) {
        $redirect = admin_url('admin.php?page=jsbb-entry-tournament-add' . ($id ? "&id={$id}" : '') . '&error=noname');
        wp_safe_redirect($redirect);
        exit;
    }

    $data = [
        'name'           => $name,
        'form_type'      => $form_type,
        'sort_order'     => $sort,
        'is_active'      => $active,
        'entry_deadline' => $deadline,
    ];

    if ($id) {
        $wpdb->update('jsbb_tournaments', $data, ['id' => $id]);
    } else {
        $wpdb->insert('jsbb_tournaments', $data);
    }

    wp_safe_redirect(admin_url('admin.php?page=jsbb-entry-tournament&saved=1'));
    exit;
});

// ── 大会 非公開 ────────────────────────────────────────────────────────────
add_action('admin_post_jsbb_entry_deactivate', function () {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');
    check_admin_referer('jsbb_entry_deactivate');
    global $wpdb;
    $wpdb->update('jsbb_tournaments', ['is_active' => 0], ['id' => (int)$_POST['id']]);
    wp_safe_redirect(admin_url('admin.php?page=jsbb-entry-tournament&msg=deactivated'));
    exit;
});

// ── 大会 公開 ──────────────────────────────────────────────────────────────
add_action('admin_post_jsbb_entry_activate', function () {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');
    check_admin_referer('jsbb_entry_activate');
    global $wpdb;
    $wpdb->update('jsbb_tournaments', ['is_active' => 1], ['id' => (int)$_POST['id']]);
    wp_safe_redirect(admin_url('admin.php?page=jsbb-entry-tournament&msg=activated'));
    exit;
});

// ── エントリー削除 ─────────────────────────────────────────────────────────
add_action('admin_post_jsbb_entry_delete_entry', function () {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');
    check_admin_referer('jsbb_entry_delete');
    global $wpdb;
    $code = sanitize_text_field($_POST['code'] ?? '');
    $wpdb->delete('jsbb_entries', ['entry_code' => $code]);
    $back = admin_url('admin.php?page=jsbb-entry-tournament&msg=entry_deleted&code=' . urlencode($code));
    wp_safe_redirect($back);
    exit;
});

// ==========================================
// 管理画面ページ描画
// ==========================================

// ── 大会一覧・エントリー一覧 ──────────────────────────────────────────────

function jsbb_entry_admin_page(): void {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');

    global $wpdb;

    // メッセージ
    $msg_map = [
        'saved'        => '大会情報を保存しました',
        'deactivated'  => '大会を非公開にしました',
        'activated'    => '大会を公開しました',
        'entry_deleted'=> 'エントリーを削除しました',
    ];
    $msg = $msg_map[$_GET['msg'] ?? ''] ?? '';

    $tournaments = $wpdb->get_results("
        SELECT *, (entry_deadline IS NOT NULL AND entry_deadline <= NOW()) AS is_expired
        FROM jsbb_tournaments
        ORDER BY sort_order, id
    ", ARRAY_A);

    $filter_tid = (int)($_GET['tid'] ?? 0);
    $where_sql  = $filter_tid ? $wpdb->prepare("WHERE e.tournament_id = %d", $filter_tid) : '';
    $entries    = $wpdb->get_results("
        SELECT e.entry_code, e.tournament_id, e.created_at, e.updated_at,
               COALESCE(t.name, '—') AS tournament_name,
               JSON_UNQUOTE(JSON_EXTRACT(e.form_data, '$.form.team_name')) AS team_name
        FROM jsbb_entries e
        LEFT JOIN jsbb_tournaments t ON t.id = e.tournament_id
        {$where_sql}
        ORDER BY e.updated_at DESC
        LIMIT 200
    ", ARRAY_A);

    $TYPE_LABEL = ['prefecture' => '県大会', 'city' => '市大会'];
    $admin_post = esc_url(admin_url('admin-post.php'));
    ?>
    <div class="wrap">
        <h1>大会申込管理</h1>

        <?php if ($msg): ?>
        <div class="notice notice-success is-dismissible"><p><?= esc_html($msg) ?></p></div>
        <?php endif ?>

        <!-- 大会一覧 -->
        <div class="jsbb-e-card">
            <h2>大会一覧</h2>
            <p style="margin-bottom:12px">
                <a href="<?= esc_url(admin_url('admin.php?page=jsbb-entry-tournament-add')) ?>"
                   class="button button-primary">＋ 大会を追加</a>
            </p>
            <table class="jsbb-e-table">
                <thead>
                    <tr><th>ID</th><th>大会名</th><th>様式</th><th>状態</th><th>申込期限</th><th>操作</th></tr>
                </thead>
                <tbody>
                <?php if (empty($tournaments)): ?>
                <tr><td colspan="6" style="text-align:center;color:#999;padding:20px">大会が登録されていません</td></tr>
                <?php endif ?>
                <?php foreach ($tournaments as $t):
                    $is_expired = (bool)$t['is_expired'];
                    $is_active  = (bool)$t['is_active'];
                ?>
                <tr>
                    <td><?= (int)$t['id'] ?></td>
                    <td><strong><?= esc_html($t['name']) ?></strong></td>
                    <td>
                        <span class="jsbb-e-badge <?= $t['form_type'] === 'city' ? 'jsbb-e-badge-city' : 'jsbb-e-badge-active' ?>">
                            <?= esc_html($TYPE_LABEL[$t['form_type']] ?? $t['form_type']) ?>
                        </span>
                    </td>
                    <td>
                        <?php if (!$is_active): ?>
                            <span class="jsbb-e-badge jsbb-e-badge-off">非公開</span>
                        <?php elseif ($is_expired): ?>
                            <span class="jsbb-e-badge jsbb-e-badge-expired">期限切れ</span>
                        <?php else: ?>
                            <span class="jsbb-e-badge jsbb-e-badge-active">公開中</span>
                        <?php endif ?>
                    </td>
                    <td style="font-size:12px;white-space:nowrap<?= $is_expired ? ';color:#856404;font-weight:600' : '' ?>">
                        <?= $t['entry_deadline']
                            ? esc_html(substr($t['entry_deadline'], 0, 16))
                            : '<span style="color:#999">—（期限なし）</span>' ?>
                    </td>
                    <td style="white-space:nowrap">
                        <a class="button button-small"
                           href="<?= esc_url(admin_url('admin.php?page=jsbb-entry-tournament-add&id=' . (int)$t['id'])) ?>">編集</a>
                        &nbsp;
                        <?php if ($is_active): ?>
                        <form method="post" action="<?= $admin_post ?>" style="display:inline"
                              onsubmit="return confirm('この大会を非公開にしますか？')">
                            <?php wp_nonce_field('jsbb_entry_deactivate') ?>
                            <input type="hidden" name="action" value="jsbb_entry_deactivate">
                            <input type="hidden" name="id" value="<?= (int)$t['id'] ?>">
                            <button class="button button-small" style="color:#c00">非公開</button>
                        </form>
                        <?php else: ?>
                        <form method="post" action="<?= $admin_post ?>" style="display:inline">
                            <?php wp_nonce_field('jsbb_entry_activate') ?>
                            <input type="hidden" name="action" value="jsbb_entry_activate">
                            <input type="hidden" name="id" value="<?= (int)$t['id'] ?>">
                            <button class="button button-small">公開する</button>
                        </form>
                        <?php endif ?>
                    </td>
                </tr>
                <?php endforeach ?>
                </tbody>
            </table>
        </div>

        <!-- エントリー一覧 -->
        <div class="jsbb-e-card">
            <h2>エントリー一覧</h2>
            <div class="jsbb-e-filter">
                <span style="font-size:12px;color:#666">絞り込み：</span>
                <a href="<?= esc_url(admin_url('admin.php?page=jsbb-entry-tournament')) ?>"
                   class="<?= !$filter_tid ? 'active' : '' ?>">すべて</a>
                <?php foreach ($tournaments as $t): ?>
                <a href="<?= esc_url(admin_url('admin.php?page=jsbb-entry-tournament&tid=' . (int)$t['id'])) ?>"
                   class="<?= $filter_tid == $t['id'] ? 'active' : '' ?>"><?= esc_html($t['name']) ?></a>
                <?php endforeach ?>
            </div>
            <table class="jsbb-e-table">
                <thead>
                    <tr><th>保存コード</th><th>チーム名</th><th>大会</th><th>保存日時</th><th>更新日時</th><th>操作</th></tr>
                </thead>
                <tbody>
                <?php if (empty($entries)): ?>
                <tr><td colspan="6" style="text-align:center;color:#999;padding:20px">エントリーがありません</td></tr>
                <?php endif ?>
                <?php foreach ($entries as $e): ?>
                <tr>
                    <td><span class="jsbb-e-code"><?= esc_html($e['entry_code']) ?></span></td>
                    <td><?= esc_html($e['team_name'] ?? '（未入力）') ?></td>
                    <td><?= esc_html($e['tournament_name']) ?></td>
                    <td style="font-size:12px"><?= esc_html($e['created_at']) ?></td>
                    <td style="font-size:12px"><?= esc_html($e['updated_at']) ?></td>
                    <td>
                        <form method="post" action="<?= $admin_post ?>" style="display:inline"
                              onsubmit="return confirm('<?= esc_js($e['entry_code']) ?> を削除しますか？')">
                            <?php wp_nonce_field('jsbb_entry_delete') ?>
                            <input type="hidden" name="action" value="jsbb_entry_delete_entry">
                            <input type="hidden" name="code" value="<?= esc_attr($e['entry_code']) ?>">
                            <button class="button button-small" style="color:#c00">削除</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach ?>
                </tbody>
            </table>
        </div>
    </div>
    <?php
}

// ── 大会 追加・編集フォーム ────────────────────────────────────────────────

function jsbb_entry_tournament_form_page(): void {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');

    global $wpdb;
    $id  = (int)($_GET['id'] ?? 0);
    $row = $id ? $wpdb->get_row($wpdb->prepare("SELECT * FROM jsbb_tournaments WHERE id = %d", $id), ARRAY_A) : null;

    // エラーメッセージ
    $err = ($_GET['error'] ?? '') === 'noname' ? '大会名を入力してください' : '';

    // 表示値（編集時は DB 値をデフォルトに）
    $name      = $row['name']       ?? '';
    $form_type = $row['form_type']  ?? 'prefecture';
    $sort      = (int)($row['sort_order'] ?? 0);
    $active    = ($row['is_active'] ?? 1) == 1;
    $dl_db     = $row['entry_deadline'] ?? '';
    $dl_val    = $dl_db ? substr(str_replace(' ', 'T', $dl_db), 0, 16) : '';

    $admin_post = esc_url(admin_url('admin-post.php'));
    ?>
    <div class="wrap" style="max-width:720px">
        <h1><?= $id ? '大会を編集' : '大会を追加' ?></h1>

        <?php if ($err): ?>
        <div class="notice notice-error is-dismissible"><p><?= esc_html($err) ?></p></div>
        <?php endif ?>

        <form method="post" action="<?= $admin_post ?>">
            <?php wp_nonce_field('jsbb_entry_save_tournament') ?>
            <input type="hidden" name="action" value="jsbb_entry_save_tournament">
            <input type="hidden" name="tournament_id" value="<?= $id ?>">

            <div class="jsbb-e-card">
                <h2>大会情報</h2>
                <table class="form-table">
                    <tr>
                        <th><label for="entry_name">大会名 <span style="color:#c00">*</span></label></th>
                        <td>
                            <input type="text" id="entry_name" name="name"
                                   value="<?= esc_attr($name) ?>" class="large-text" required
                                   placeholder="例：第10回福岡県学童軟式野球秋季大会">
                        </td>
                    </tr>
                    <tr>
                        <th><label for="entry_form_type">様式</label></th>
                        <td>
                            <select id="entry_form_type" name="form_type">
                                <option value="prefecture" <?= $form_type === 'prefecture' ? 'selected' : '' ?>>県大会（現在の申込書形式）</option>
                                <option value="city"       <?= $form_type === 'city'       ? 'selected' : '' ?>>市大会（準備中）</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="entry_sort">表示順</label></th>
                        <td>
                            <input type="number" id="entry_sort" name="sort_order"
                                   value="<?= (int)$sort ?>" min="0" style="width:80px">
                            <p class="description">数字が小さい順に表示されます</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="entry_deadline">申込期限</label></th>
                        <td>
                            <input type="datetime-local" id="entry_deadline" name="entry_deadline"
                                   value="<?= esc_attr($dl_val) ?>">
                            <p class="description">
                                この日時を過ぎると申込フォームの一覧から<strong>自動非表示</strong>になります。<br>
                                空欄 = 期限なし
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <th>公開設定</th>
                        <td>
                            <label>
                                <input type="checkbox" name="is_active" <?= $active ? 'checked' : '' ?>>
                                公開中（申込フォームの一覧に表示する）
                            </label>
                        </td>
                    </tr>
                </table>
            </div>

            <p>
                <button type="submit" class="button button-primary button-large">保存する</button>
                &nbsp;
                <a href="<?= esc_url(admin_url('admin.php?page=jsbb-entry-tournament')) ?>"
                   class="button button-large">キャンセル</a>
            </p>
        </form>
    </div>
    <?php
}
