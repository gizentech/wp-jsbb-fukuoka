<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ポータル管理 管理画面メニュー
// ==========================================

add_action('admin_menu', function () {

    // ── 親メニュー ─────────────────────────
    add_menu_page(
        'ポータル管理',
        'ポータル管理',
        'edit_posts',
        'portal-management',
        'jsbb_portal_admin_top',
        'dashicons-building',
        24
    );

    // ── サブ: ポータル大会（CPT一覧へリンク）──
    add_submenu_page(
        'portal-management',
        'ポータル大会',
        'ポータル大会',
        'edit_posts',
        'edit.php?post_type=portal_tournament'
    );

    // ── サブ: ポータルチーム ──
    add_submenu_page(
        'portal-management',
        'ポータルチーム',
        'ポータルチーム',
        'edit_posts',
        'edit.php?post_type=portal_team'
    );

    // ── サブ: 商品マスタ ──
    add_submenu_page(
        'portal-management',
        '商品マスタ',
        '商品マスタ',
        'edit_posts',
        'portal-products',
        'jsbb_portal_products_page'
    );

    // ── サブ: 注文一覧 ──
    add_submenu_page(
        'portal-management',
        '注文一覧',
        '注文一覧',
        'edit_posts',
        'portal-orders',
        'jsbb_portal_orders_page'
    );

    // ── サブ: 書類管理 ──
    add_submenu_page(
        'portal-management',
        '書類管理',
        '書類管理',
        'edit_posts',
        'portal-documents',
        'jsbb_portal_documents_page'
    );

    // ── サブ: 筑後川商品登録（シード）──
    add_submenu_page(
        'portal-management',
        '筑後川商品登録',
        '筑後川商品登録',
        'edit_posts',
        'portal-seed-chikugogawa',
        'jsbb_portal_seed_chikugogawa_page'
    );

    // 最初のサブメニュー（親と同名）を削除
    remove_submenu_page('portal-management', 'portal-management');
});

// ==========================================
// ポータル管理 トップ（ダッシュボード）
// ==========================================
function jsbb_portal_admin_top() {
    $t_count    = wp_count_posts('portal_tournament')->publish ?? 0;
    $team_count = wp_count_posts('portal_team')->publish ?? 0;
    $prod_count = wp_count_posts('portal_product')->publish ?? 0;
    $ord_count  = wp_count_posts('portal_order')->publish ?? 0;
    ?>
    <div class="wrap">
        <h1>ポータル管理</h1>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin-top:24px;">
            <?php
            $boxes = [
                ['label' => 'ポータル大会',   'count' => $t_count,    'url' => 'edit.php?post_type=portal_tournament', 'new' => 'post-new.php?post_type=portal_tournament'],
                ['label' => 'ポータルチーム', 'count' => $team_count, 'url' => 'edit.php?post_type=portal_team',       'new' => 'post-new.php?post_type=portal_team'],
                ['label' => '商品マスタ',     'count' => $prod_count, 'url' => 'admin.php?page=portal-products',       'new' => 'admin.php?page=portal-products&action=new'],
                ['label' => '注文一覧',       'count' => $ord_count,  'url' => 'admin.php?page=portal-orders',         'new' => null],
            ];
            foreach ($boxes as $b): ?>
            <div style="background:#fff;border:1px solid #ddd;padding:20px;">
                <div style="font-size:2rem;font-weight:700;color:#c8102e;"><?php echo $b['count']; ?></div>
                <div style="font-size:0.95rem;margin:4px 0 12px;"><?php echo esc_html($b['label']); ?></div>
                <a href="<?php echo esc_url(admin_url($b['url'])); ?>" class="button">一覧</a>
                <?php if ($b['new']): ?>
                <a href="<?php echo esc_url(admin_url($b['new'])); ?>" class="button button-primary" style="margin-left:6px;">新規</a>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
    <?php
}


// ==========================================
// 注文一覧 管理ページ
// ==========================================
function jsbb_portal_orders_page() {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');

    $msg = '';
    // ── 注文操作 POST ──
    if ($_SERVER['REQUEST_METHOD'] === 'POST' && check_admin_referer('jsbb_order_action')) {
        $order_action = sanitize_text_field($_POST['order_action'] ?? '');
        $order_id     = (int)($_POST['order_id'] ?? 0);
        if ($order_id && get_post_type($order_id) === 'portal_order') {
            if ($order_action === 'cancel') {
                update_post_meta($order_id, '_portal_order_status', 'cancelled');
                $msg = '注文をキャンセルしました。';
            } elseif ($order_action === 'restore') {
                update_post_meta($order_id, '_portal_order_status', 'confirmed');
                $msg = '注文を確定に戻しました。';
            } elseif ($order_action === 'delete') {
                wp_delete_post($order_id, true);
                $msg = '注文を削除しました。';
            }
        }
    }

    $tournaments = get_posts([
        'post_type' => 'portal_tournament',
        'posts_per_page' => -1,
        'post_status' => 'publish',
    ]);
    $filter_tid = (int)($_GET['tournament_id'] ?? $_POST['tournament_id_filter'] ?? 0);

    // 注文一覧取得
    $args = [
        'post_type'      => 'portal_order',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'date',
        'order'          => 'DESC',
    ];
    if ($filter_tid) {
        $args['meta_query'] = [['key' => '_portal_order_tournament_id', 'value' => $filter_tid]];
    }
    $order_posts = get_posts($args);

    // チームごとに集計
    $teams = [];
    foreach ($order_posts as $op) {
        $order     = jsbb_build_portal_order($op->ID);
        $team_id   = $order['team_id'];
        $team_post = get_post($team_id);
        $team_name = $team_post ? $team_post->post_title : '不明';
        $team_email = get_post_meta($team_id, '_portal_team_email', true) ?: '';
        $t_post    = get_post($order['tournament_id']);
        $t_name    = $t_post ? $t_post->post_title : '─';

        if (!isset($teams[$team_id])) {
            $teams[$team_id] = [
                'name'  => $team_name,
                'email' => $team_email,
                'tournament' => $t_name,
                'navy'  => 0, 'white' => 0,
                'body'  => 0, 'name_fee' => 0, 'total' => 0,
                'orders' => [],
            ];
        }
        foreach (($order['items'] ?? []) as $it) {
            if (($it['color'] ?? '') === 'ネイビー') $teams[$team_id]['navy'] += $it['quantity'] ?? 0;
            if (($it['color'] ?? '') === 'ホワイト') $teams[$team_id]['white'] += $it['quantity'] ?? 0;
        }
        if ($order['status'] !== 'cancelled') {
            $teams[$team_id]['body']     += $order['body_total'] ?? 0;
            $teams[$team_id]['name_fee'] += $order['name_total'] ?? 0;
            $teams[$team_id]['total']    += $order['total'] ?? 0;
        }
        $teams[$team_id]['orders'][] = $order;
    }

    // 全体集計
    $grand_navy  = array_sum(array_column($teams, 'navy'));
    $grand_white = array_sum(array_column($teams, 'white'));
    $grand_total = array_sum(array_column($teams, 'total'));

    ?>
    <div class="wrap">
        <h1>注文一覧</h1>

        <?php if ($msg): ?>
        <div class="notice notice-success is-dismissible"><p><?php echo esc_html($msg); ?></p></div>
        <?php endif; ?>

        <!-- フィルター -->
        <form method="get" style="margin:16px 0;">
            <input type="hidden" name="page" value="portal-orders">
            <select name="tournament_id" onchange="this.form.submit()">
                <option value="">全大会</option>
                <?php foreach ($tournaments as $t): ?>
                <option value="<?php echo $t->ID; ?>" <?php selected($filter_tid, $t->ID); ?>>
                    <?php echo esc_html($t->post_title); ?>
                </option>
                <?php endforeach; ?>
            </select>
            <noscript><button type="submit">絞り込み</button></noscript>
        </form>

        <!-- 全体集計バー -->
        <div style="background:#fff8e1;border:1px solid #ffe082;padding:12px 20px;margin-bottom:16px;display:flex;gap:32px;flex-wrap:wrap;">
            <span>チーム数: <strong><?php echo count($teams); ?></strong></span>
            <span>ネイビー計: <strong><?php echo $grand_navy; ?>枚</strong></span>
            <span>ホワイト計: <strong><?php echo $grand_white; ?>枚</strong></span>
            <span style="color:#c8102e;font-weight:700;">合計金額: ¥<?php echo number_format($grand_total); ?></span>
        </div>

        <!-- チームごとテーブル -->
        <table class="wp-list-table widefat fixed striped" id="jsbb-order-table">
            <thead>
                <tr>
                    <th>チーム名</th>
                    <th>大会</th>
                    <th style="text-align:center">ネイビー</th>
                    <th style="text-align:center">ホワイト</th>
                    <th style="text-align:center">総枚数</th>
                    <th style="text-align:right">本体金額</th>
                    <th style="text-align:right">ネーム金額</th>
                    <th style="text-align:right">合計金額</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($teams as $tid => $team): ?>
                <tr style="cursor:pointer;" onclick="jsbbToggleDetail('detail-<?php echo esc_attr($tid); ?>')">
                    <td><strong><?php echo esc_html($team['name']); ?></strong><br>
                        <small style="color:#888"><?php echo esc_html($team['email']); ?></small></td>
                    <td><?php echo esc_html($team['tournament']); ?></td>
                    <td style="text-align:center"><?php echo $team['navy'] ?: '─'; ?>枚</td>
                    <td style="text-align:center"><?php echo $team['white'] ?: '─'; ?>枚</td>
                    <td style="text-align:center;font-weight:700"><?php echo ($team['navy'] + $team['white']); ?>枚</td>
                    <td style="text-align:right">¥<?php echo number_format($team['body']); ?></td>
                    <td style="text-align:right"><?php echo $team['name_fee'] ? '¥'.number_format($team['name_fee']) : '─'; ?></td>
                    <td style="text-align:right;font-weight:700;color:#c8102e">¥<?php echo number_format($team['total']); ?></td>
                    <td>▼</td>
                </tr>
                <tr id="detail-<?php echo esc_attr($tid); ?>" style="display:none;background:#f8f8f8;">
                    <td colspan="9" style="padding:16px;">
                        <?php foreach ($team['orders'] as $ord):
                            $is_cancelled = ($ord['status'] === 'cancelled');
                            $items = $ord['items'] ?? [];
                            $names = array_unique(array_filter(array_column(
                                array_filter($items, fn($i) => !empty($i['has_name'])),
                                'name'
                            )));
                            ?>
                        <div style="margin-bottom:12px;padding:12px;background:#fff;border:1px solid #e0e0e0;<?php echo $is_cancelled ? 'opacity:0.6' : ''; ?>">
                            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap;">
                                <span style="font-size:0.85rem;color:#888"><?php echo esc_html(substr($ord['created_at'], 0, 16)); ?></span>
                                <span style="font-size:0.85rem;padding:2px 8px;background:<?php echo $is_cancelled ? '#f3f4f6' : '#e8f5e9'; ?>;color:<?php echo $is_cancelled ? '#6b7280' : '#2e7d32'; ?>">
                                    <?php echo $is_cancelled ? 'キャンセル済' : '確定'; ?>
                                </span>
                                <strong style="color:#c8102e">¥<?php echo number_format($ord['total']); ?></strong>
                                <span style="margin-left:auto;display:flex;gap:6px;">
                                    <?php if ($is_cancelled): ?>
                                    <form method="post" style="display:inline;">
                                        <?php wp_nonce_field('jsbb_order_action'); ?>
                                        <input type="hidden" name="order_action" value="restore">
                                        <input type="hidden" name="order_id" value="<?php echo esc_attr($ord['id']); ?>">
                                        <?php if ($filter_tid): ?><input type="hidden" name="tournament_id_filter" value="<?php echo esc_attr($filter_tid); ?>"><?php endif; ?>
                                        <button type="submit" class="button button-small" style="color:#2e7d32;">復元</button>
                                    </form>
                                    <?php else: ?>
                                    <form method="post" style="display:inline;" onsubmit="return confirm('この注文をキャンセルしますか？')">
                                        <?php wp_nonce_field('jsbb_order_action'); ?>
                                        <input type="hidden" name="order_action" value="cancel">
                                        <input type="hidden" name="order_id" value="<?php echo esc_attr($ord['id']); ?>">
                                        <?php if ($filter_tid): ?><input type="hidden" name="tournament_id_filter" value="<?php echo esc_attr($filter_tid); ?>"><?php endif; ?>
                                        <button type="submit" class="button button-small" style="color:#c8102e;">キャンセル</button>
                                    </form>
                                    <?php endif; ?>
                                    <form method="post" style="display:inline;" onsubmit="return confirm('この注文を完全に削除しますか？この操作は取り消せません。')">
                                        <?php wp_nonce_field('jsbb_order_action'); ?>
                                        <input type="hidden" name="order_action" value="delete">
                                        <input type="hidden" name="order_id" value="<?php echo esc_attr($ord['id']); ?>">
                                        <?php if ($filter_tid): ?><input type="hidden" name="tournament_id_filter" value="<?php echo esc_attr($filter_tid); ?>"><?php endif; ?>
                                        <button type="submit" class="button button-small" style="color:#a00;">削除</button>
                                    </form>
                                </span>
                            </div>
                            <?php if ($names): ?>
                            <div style="font-size:0.85rem;margin-bottom:8px;">ネーム: <strong><?php echo esc_html(implode('、', $names)); ?></strong></div>
                            <?php endif; ?>
                            <?php echo jsbb_order_detail_table_html($items); ?>
                        </div>
                        <?php endforeach; ?>
                    </td>
                </tr>
            <?php endforeach; ?>
            <?php if (empty($teams)): ?>
            <tr><td colspan="9" style="text-align:center;padding:32px;color:#888;">注文がありません</td></tr>
            <?php endif; ?>
            </tbody>
        </table>
    </div>

    <script>
    function jsbbToggleDetail(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
    }
    </script>
    <?php
}

// 注文詳細テーブルHTML（PHP内部用）
function jsbb_order_detail_table_html($items) {
    if (!$items) return '';
    $sizes  = ['120','130','140','150','SS','S','M','L','LL','3L','4L','5L'];
    $colors = ['ネイビー', 'ホワイト'];
    $grid   = [];
    foreach ($items as $it) {
        $s = $it['size'] ?? '?';
        $c = $it['color'] ?? '?';
        $k = !empty($it['has_name']) ? 'yes' : 'no';
        if (!isset($grid[$s][$c][$k])) $grid[$s][$c][$k] = 0;
        $grid[$s][$c][$k] += $it['quantity'] ?? 0;
    }
    $used = array_intersect($sizes, array_keys($grid));
    if (empty($used)) return '';

    $th = 'padding:3px 8px;border:1px solid #ddd;background:#f5f5f5;font-size:0.8rem;text-align:center;';
    $td = 'padding:3px 8px;border:1px solid #ddd;font-size:0.8rem;text-align:center;';
    $html = "<table style='border-collapse:collapse;'><thead><tr>";
    $html .= "<th style='{$th}'>サイズ</th>";
    foreach ($colors as $c) {
        $html .= "<th style='{$th}' colspan='2'>{$c}</th>";
    }
    $html .= "</tr><tr><th style='{$th}'></th>";
    foreach ($colors as $c) {
        $html .= "<th style='{$th}'>なし</th><th style='{$th}'>あり</th>";
    }
    $html .= "</tr></thead><tbody>";
    foreach ($used as $s) {
        $html .= "<tr><td style='{$td};font-weight:600'>{$s}</td>";
        foreach ($colors as $c) {
            $no  = $grid[$s][$c]['no']  ?? 0;
            $yes = $grid[$s][$c]['yes'] ?? 0;
            $html .= "<td style='{$td}'>" . ($no  ?: '') . "</td>";
            $html .= "<td style='{$td}'>" . ($yes ?: '') . "</td>";
        }
        $html .= "</tr>";
    }
    $html .= "</tbody></table>";
    return $html;
}

// ==========================================
// portal_team / portal_tournament を
// 「ポータル管理」の配下として表示するための調整
// ==========================================

// portal_team 一覧に 8桁ID・大会列を追加
add_filter('manage_portal_team_posts_columns', function ($cols) {
    $new = ['cb' => $cols['cb'], 'title' => 'チーム名'];
    $new['team_id']     = 'チームID';
    $new['team_email']  = 'メール';
    $new['tournament']  = '参加大会';
    $new['date']        = '登録日';
    return $new;
});
add_action('manage_portal_team_posts_custom_column', function ($col, $post_id) {
    switch ($col) {
        case 'team_id':
            $tid = get_post_meta($post_id, '_portal_team_id', true);
            echo '<code style="font-size:1.1em;font-weight:700">' . esc_html($tid ?: '─') . '</code>';
            break;
        case 'team_email':
            echo esc_html(get_post_meta($post_id, '_portal_team_email', true) ?: '─');
            break;
        case 'tournament':
            $tids_json = get_post_meta($post_id, '_portal_team_tournament_ids', true);
            $tids = $tids_json ? json_decode($tids_json, true) : [];
            if ($tids) {
                $names = [];
                foreach ((array)$tids as $tid) {
                    $tp = get_post($tid);
                    if ($tp) $names[] = $tp->post_title;
                }
                echo esc_html(implode('、', $names));
            } else {
                echo '─';
            }
            break;
    }
}, 10, 2);

// portal_tournament 一覧にステータス・チーム数列を追加
add_filter('manage_portal_tournament_posts_columns', function ($cols) {
    $new = ['cb' => $cols['cb'], 'title' => '大会名'];
    $new['t_status']  = 'ステータス';
    $new['t_deadline'] = '締切';
    $new['t_teams']   = 'チーム数';
    $new['date']      = '登録日';
    return $new;
});
add_action('manage_portal_tournament_posts_custom_column', function ($col, $post_id) {
    switch ($col) {
        case 't_status':
            $s = get_post_meta($post_id, '_portal_tournament_status', true) ?: 'draft';
            $labels = ['active' => '受付中', 'closed' => '終了', 'draft' => '準備中'];
            $colors = ['active' => '#2e7d32', 'closed' => '#c62828', 'draft' => '#888'];
            echo '<span style="color:' . esc_attr($colors[$s] ?? '#888') . ';font-weight:600">'
               . esc_html($labels[$s] ?? $s) . '</span>';
            break;
        case 't_deadline':
            $d = get_post_meta($post_id, '_portal_tournament_deadline', true);
            echo $d ? esc_html(substr($d, 0, 10)) : '─';
            break;
        case 't_teams':
            $tids = json_decode(get_post_meta($post_id, '_portal_tournament_team_ids', true) ?: '[]', true);
            echo count((array)$tids) . 'チーム';
            break;
    }
}, 10, 2);

// ==========================================
// 書類管理 admin_post ハンドラー
// ==========================================

// 書類追加・更新
add_action('admin_post_jsbb_doc_save', function () {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');
    check_admin_referer('jsbb_doc_save');

    $tournament_id = (int)($_POST['tournament_id'] ?? 0);
    $doc_id        = (int)($_POST['doc_id'] ?? 0);
    $name          = sanitize_text_field($_POST['doc_name'] ?? '');
    $category      = sanitize_text_field($_POST['doc_category'] ?? '');
    $description   = sanitize_textarea_field($_POST['doc_description'] ?? '');
    $sort_order    = (int)($_POST['doc_sort_order'] ?? 0);

    if (!$name || !$tournament_id) {
        wp_redirect(admin_url('admin.php?page=portal-documents&tournament_id=' . $tournament_id . '&error=1'));
        exit;
    }

    // ファイルアップロード処理
    $file_url = sanitize_url($_POST['doc_file_url_existing'] ?? '');
    if (!empty($_FILES['doc_file']['name'])) {
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';
        $att_id = media_handle_upload('doc_file', 0);
        if (!is_wp_error($att_id)) {
            $file_url = wp_get_attachment_url($att_id);
        }
    }

    if ($doc_id) {
        // 更新
        wp_update_post(['ID' => $doc_id, 'post_title' => $name]);
        update_post_meta($doc_id, '_portal_doc_file_url',    $file_url);
        update_post_meta($doc_id, '_portal_doc_category',    $category);
        update_post_meta($doc_id, '_portal_doc_description', $description);
        update_post_meta($doc_id, '_portal_doc_sort_order',  $sort_order);
    } else {
        // 新規
        $post_id = wp_insert_post([
            'post_title'  => $name,
            'post_type'   => 'portal_document',
            'post_status' => 'publish',
        ]);
        if (!is_wp_error($post_id)) {
            update_post_meta($post_id, '_portal_doc_tournament_id', $tournament_id);
            update_post_meta($post_id, '_portal_doc_file_url',      $file_url);
            update_post_meta($post_id, '_portal_doc_category',      $category);
            update_post_meta($post_id, '_portal_doc_description',   $description);
            update_post_meta($post_id, '_portal_doc_sort_order',    $sort_order);
            update_post_meta($post_id, '_portal_doc_created_at',    current_time('mysql'));
        }
    }

    wp_redirect(admin_url('admin.php?page=portal-documents&tournament_id=' . $tournament_id . '&saved=1'));
    exit;
});

// 書類削除
add_action('admin_post_jsbb_doc_delete', function () {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');
    check_admin_referer('jsbb_doc_delete');
    $doc_id        = (int)($_POST['doc_id'] ?? 0);
    $tournament_id = (int)($_POST['tournament_id'] ?? 0);
    if ($doc_id && get_post_type($doc_id) === 'portal_document') {
        wp_delete_post($doc_id, true);
    }
    wp_redirect(admin_url('admin.php?page=portal-documents&tournament_id=' . $tournament_id . '&deleted=1'));
    exit;
});

// 提出書類ステータス変更
add_action('admin_post_jsbb_sub_status', function () {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');
    check_admin_referer('jsbb_sub_status');
    $sub_id        = (int)($_POST['sub_id'] ?? 0);
    $tournament_id = (int)($_POST['tournament_id'] ?? 0);
    $status        = sanitize_text_field($_POST['sub_status'] ?? '');
    $admin_comment = sanitize_textarea_field($_POST['admin_comment'] ?? '');
    $valid = ['pending', 'approved', 'rejected', 'cancelled'];
    if ($sub_id && in_array($status, $valid) && get_post_type($sub_id) === 'portal_submission') {
        update_post_meta($sub_id, '_portal_sub_status', $status);
        if ($admin_comment !== '') {
            update_post_meta($sub_id, '_portal_sub_admin_comment', $admin_comment);
        }

        // チームへメール通知（pending以外）
        if ($status !== 'pending') {
            $team_id         = (int)get_post_meta($sub_id, '_portal_sub_team_id', true);
            $team_post       = get_post($team_id);
            $team_name       = $team_post ? $team_post->post_title : 'チーム';
            $team_email      = get_post_meta($team_id, '_portal_team_email', true) ?: '';
            $tournament_post = get_post($tournament_id);
            $tournament_name = $tournament_post ? $tournament_post->post_title : '大会';
            $doc_type        = get_post_meta($sub_id, '_portal_sub_document_type', true) ?: '書類';

            $status_labels_mail = ['approved' => '承認', 'rejected' => '差し戻し', 'cancelled' => '取消'];
            $label = $status_labels_mail[$status] ?? $status;

            $subject_map = [
                'approved'  => '【筑後川旗事務局】提出書類の承認のお知らせ',
                'rejected'  => '【筑後川旗事務局】提出書類の差戻のお知らせ',
                'cancelled' => '【筑後川旗事務局】提出書類のキャンセルのお知らせ',
            ];
            $subject = $subject_map[$status] ?? '【筑後川旗事務局】提出書類の審査結果のお知らせ';

            $body = "{$team_name} 御中\n\n"
                  . "いつもお世話になっております。\n"
                  . "ご提出いただいた書類の審査が完了しましたのでお知らせします。\n\n"
                  . "大会: {$tournament_name}\n"
                  . "書類種別: {$doc_type}\n"
                  . "審査結果: {$label}\n";
            if ($admin_comment) {
                $body .= "事務局コメント: {$admin_comment}\n";
            }
            $body .= "\n何かご不明な点がございましたら、大会事務局までご連絡ください。\n\n"
                   . "─────────────────────────\n"
                   . "筑後川旗大会事務局 / 福岡県軟式野球連盟\n"
                   . "https://jsbb-fukuoka.com";

            if ($team_email) {
                wp_mail(
                    $team_email,
                    $subject,
                    $body,
                    ['Content-Type: text/plain; charset=UTF-8', 'From: 福岡県軟式野球連盟ポータル <shop@jsbb-fukuoka.com>']
                );
            }
        }
    }
    wp_redirect(admin_url('admin.php?page=portal-documents&tournament_id=' . $tournament_id . '&updated=1'));
    exit;
});

// ==========================================
// 書類管理ページ
// ==========================================
function jsbb_portal_documents_page() {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');

    $tournaments = get_posts([
        'post_type'      => 'portal_tournament',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);
    $filter_tid = (int)($_GET['tournament_id'] ?? 0);
    if (!$filter_tid && !empty($tournaments)) {
        $filter_tid = $tournaments[0]->ID;
    }

    // メッセージ
    $msgs = [
        'saved'   => '<div class="notice notice-success is-dismissible"><p>保存しました。</p></div>',
        'deleted' => '<div class="notice notice-success is-dismissible"><p>削除しました。</p></div>',
        'updated' => '<div class="notice notice-success is-dismissible"><p>ステータスを更新しました。</p></div>',
        'error'   => '<div class="notice notice-error is-dismissible"><p>書類名と大会を入力してください。</p></div>',
    ];
    foreach ($msgs as $key => $html) {
        if (isset($_GET[$key])) echo $html;
    }

    // 編集対象書類
    $edit_doc_id = (int)($_GET['edit_doc'] ?? 0);
    $edit_doc    = ($edit_doc_id && get_post_type($edit_doc_id) === 'portal_document') ? get_post($edit_doc_id) : null;

    // ダウンロード書類一覧
    $documents = $filter_tid ? get_posts([
        'post_type'      => 'portal_document',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'meta_query'     => [['key' => '_portal_doc_tournament_id', 'value' => $filter_tid]],
        'orderby'        => 'meta_value_num',
        'meta_key'       => '_portal_doc_sort_order',
        'order'          => 'ASC',
    ]) : [];

    // 提出書類一覧
    $submissions = $filter_tid ? get_posts([
        'post_type'      => 'portal_submission',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'meta_query'     => [['key' => '_portal_sub_tournament_id', 'value' => $filter_tid]],
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]) : [];

    $status_labels = ['pending' => '審査中', 'approved' => '承認済', 'rejected' => '差し戻し', 'cancelled' => '取消'];
    $status_colors = ['pending' => '#e65100', 'approved' => '#2e7d32', 'rejected' => '#c62828', 'cancelled' => '#888'];
    ?>
    <div class="wrap">
        <h1>書類管理</h1>

        <!-- 大会フィルター -->
        <form method="get" style="margin:16px 0;">
            <input type="hidden" name="page" value="portal-documents">
            <select name="tournament_id" onchange="this.form.submit()" style="max-width:400px">
                <option value="">大会を選択</option>
                <?php foreach ($tournaments as $t): ?>
                <option value="<?php echo $t->ID; ?>" <?php selected($filter_tid, $t->ID); ?>>
                    <?php echo esc_html($t->post_title); ?>
                </option>
                <?php endforeach; ?>
            </select>
        </form>

        <?php if ($filter_tid): ?>

        <!-- ============ ダウンロード書類 ============ -->
        <h2 style="margin-top:24px;">書類ダウンロード（チームに配布するファイル）</h2>

        <!-- 書類一覧 -->
        <?php if (empty($documents)): ?>
        <p style="color:#888;">まだ書類が登録されていません。</p>
        <?php else: ?>
        <table class="wp-list-table widefat fixed striped" style="margin-bottom:24px;">
            <thead>
                <tr>
                    <th>書類名</th>
                    <th style="width:120px">カテゴリ</th>
                    <th>説明</th>
                    <th style="width:60px;text-align:center">順序</th>
                    <th style="width:80px">ファイル</th>
                    <th style="width:160px"></th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($documents as $doc):
                $file_url = get_post_meta($doc->ID, '_portal_doc_file_url', true);
                $category = get_post_meta($doc->ID, '_portal_doc_category', true);
                $desc     = get_post_meta($doc->ID, '_portal_doc_description', true);
                $sort     = get_post_meta($doc->ID, '_portal_doc_sort_order', true);
            ?>
            <tr>
                <td><strong><?php echo esc_html($doc->post_title); ?></strong></td>
                <td><?php echo esc_html($category ?: '─'); ?></td>
                <td style="font-size:0.85rem;color:#555"><?php echo esc_html($desc ?: '─'); ?></td>
                <td style="text-align:center"><?php echo (int)$sort; ?></td>
                <td>
                    <?php if ($file_url): ?>
                    <a href="<?php echo esc_url($file_url); ?>" target="_blank" class="button button-small">確認</a>
                    <?php else: ?>
                    <span style="color:#888">なし</span>
                    <?php endif; ?>
                </td>
                <td>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=portal-documents&tournament_id=' . $filter_tid . '&edit_doc=' . $doc->ID)); ?>"
                       class="button button-small">編集</a>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>"
                          style="display:inline;" onsubmit="return confirm('この書類を削除しますか？')">
                        <?php wp_nonce_field('jsbb_doc_delete'); ?>
                        <input type="hidden" name="action" value="jsbb_doc_delete">
                        <input type="hidden" name="doc_id" value="<?php echo esc_attr($doc->ID); ?>">
                        <input type="hidden" name="tournament_id" value="<?php echo esc_attr($filter_tid); ?>">
                        <button type="submit" class="button button-small" style="color:#c00">削除</button>
                    </form>
                </td>
            </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>

        <!-- 書類 追加 / 編集フォーム -->
        <div style="background:#fff;border:1px solid #ddd;padding:20px 24px;max-width:640px;margin-bottom:32px;">
            <h3 style="margin-top:0"><?php echo $edit_doc ? '書類を編集' : '書類を追加'; ?></h3>
            <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" enctype="multipart/form-data">
                <?php wp_nonce_field('jsbb_doc_save'); ?>
                <input type="hidden" name="action" value="jsbb_doc_save">
                <input type="hidden" name="tournament_id" value="<?php echo esc_attr($filter_tid); ?>">
                <?php if ($edit_doc): ?>
                <input type="hidden" name="doc_id" value="<?php echo esc_attr($edit_doc->ID); ?>">
                <input type="hidden" name="doc_file_url_existing" value="<?php echo esc_attr(get_post_meta($edit_doc->ID, '_portal_doc_file_url', true)); ?>">
                <?php endif; ?>

                <table class="form-table" style="margin:0">
                    <tr>
                        <th style="width:120px"><label>書類名 *</label></th>
                        <td><input type="text" name="doc_name" class="regular-text"
                            value="<?php echo $edit_doc ? esc_attr($edit_doc->post_title) : ''; ?>" required></td>
                    </tr>
                    <tr>
                        <th><label>カテゴリ</label></th>
                        <td><input type="text" name="doc_category" class="regular-text"
                            value="<?php echo $edit_doc ? esc_attr(get_post_meta($edit_doc->ID, '_portal_doc_category', true)) : ''; ?>"
                            placeholder="例: 申請書類"></td>
                    </tr>
                    <tr>
                        <th><label>説明</label></th>
                        <td><textarea name="doc_description" class="large-text" rows="2"><?php
                            echo $edit_doc ? esc_textarea(get_post_meta($edit_doc->ID, '_portal_doc_description', true)) : '';
                        ?></textarea></td>
                    </tr>
                    <tr>
                        <th><label>ファイル</label></th>
                        <td>
                            <?php if ($edit_doc && get_post_meta($edit_doc->ID, '_portal_doc_file_url', true)): ?>
                            <p style="margin:0 0 6px;">
                                現在: <a href="<?php echo esc_url(get_post_meta($edit_doc->ID, '_portal_doc_file_url', true)); ?>" target="_blank">ファイルを確認</a>
                                （新しいファイルを選択すると上書きされます）
                            </p>
                            <?php endif; ?>
                            <input type="file" name="doc_file" accept=".pdf,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg">
                            <p style="margin:4px 0 0;color:#888;font-size:0.85rem">PDF・Excel・Word・画像（最大20MB）</p>
                        </td>
                    </tr>
                    <tr>
                        <th><label>表示順</label></th>
                        <td><input type="number" name="doc_sort_order" style="width:80px"
                            value="<?php echo $edit_doc ? (int)get_post_meta($edit_doc->ID, '_portal_doc_sort_order', true) : 0; ?>"></td>
                    </tr>
                </table>

                <div style="margin-top:16px;display:flex;gap:8px;">
                    <button type="submit" class="button button-primary"><?php echo $edit_doc ? '更新する' : '追加する'; ?></button>
                    <?php if ($edit_doc): ?>
                    <a href="<?php echo esc_url(admin_url('admin.php?page=portal-documents&tournament_id=' . $filter_tid)); ?>"
                       class="button">キャンセル</a>
                    <?php endif; ?>
                </div>
            </form>
        </div>

        <!-- ============ 提出書類 ============ -->
        <h2 style="border-top:1px solid #ddd;padding-top:24px;">書類提出（チームからの提出一覧）</h2>

        <?php if (empty($submissions)): ?>
        <p style="color:#888;">まだ提出書類がありません。</p>
        <?php else: ?>
        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th>チーム名</th>
                    <th style="width:100px">書類種別</th>
                    <th style="width:140px">提出日時</th>
                    <th style="width:80px;text-align:center">ステータス</th>
                    <th style="width:70px">ファイル</th>
                    <th style="width:220px">管理者コメント / 操作</th>
                </tr>
            </thead>
            <tbody>
            <?php foreach ($submissions as $sub):
                $team_id   = (int)get_post_meta($sub->ID, '_portal_sub_team_id', true);
                $team_post = get_post($team_id);
                $team_name = $team_post ? $team_post->post_title : '不明';
                $doc_type  = get_post_meta($sub->ID, '_portal_sub_document_type', true) ?: '─';
                $file_url  = get_post_meta($sub->ID, '_portal_sub_file_url', true);
                $file_name = get_post_meta($sub->ID, '_portal_sub_file_name', true);
                $comment   = get_post_meta($sub->ID, '_portal_sub_comment', true);
                $a_comment = get_post_meta($sub->ID, '_portal_sub_admin_comment', true);
                $status    = get_post_meta($sub->ID, '_portal_sub_status', true) ?: 'pending';
                $created   = get_post_meta($sub->ID, '_portal_sub_created_at', true);
            ?>
            <tr>
                <td>
                    <strong><?php echo esc_html($team_name); ?></strong>
                    <?php if ($comment): ?>
                    <br><small style="color:#666">コメント: <?php echo esc_html($comment); ?></small>
                    <?php endif; ?>
                </td>
                <td><?php echo esc_html($doc_type); ?></td>
                <td style="font-size:0.85rem"><?php echo esc_html(substr($created, 0, 16)); ?></td>
                <td style="text-align:center">
                    <span style="font-size:0.8rem;font-weight:700;color:<?php echo esc_attr($status_colors[$status] ?? '#888'); ?>">
                        <?php echo esc_html($status_labels[$status] ?? $status); ?>
                    </span>
                </td>
                <td>
                    <?php if ($file_url): ?>
                    <a href="<?php echo esc_url($file_url); ?>" target="_blank" class="button button-small">
                        <?php echo esc_html($file_name ? pathinfo($file_name, PATHINFO_EXTENSION) : '確認'); ?>
                    </a>
                    <?php endif; ?>
                </td>
                <td>
                    <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" style="display:flex;gap:4px;flex-wrap:wrap;align-items:center;">
                        <?php wp_nonce_field('jsbb_sub_status'); ?>
                        <input type="hidden" name="action" value="jsbb_sub_status">
                        <input type="hidden" name="sub_id" value="<?php echo esc_attr($sub->ID); ?>">
                        <input type="hidden" name="tournament_id" value="<?php echo esc_attr($filter_tid); ?>">
                        <select name="sub_status" style="font-size:0.82rem">
                            <?php foreach ($status_labels as $val => $lbl): ?>
                            <option value="<?php echo esc_attr($val); ?>" <?php selected($status, $val); ?>><?php echo esc_html($lbl); ?></option>
                            <?php endforeach; ?>
                        </select>
                        <input type="text" name="admin_comment" placeholder="管理者コメント"
                               value="<?php echo esc_attr($a_comment); ?>" style="width:100%;font-size:0.82rem;margin-top:4px">
                        <button type="submit" class="button button-small" style="margin-top:4px">更新</button>
                    </form>
                </td>
            </tr>
            <?php endforeach; ?>
            </tbody>
        </table>
        <?php endif; ?>

        <?php endif; // $filter_tid ?>
    </div>
    <?php
}
