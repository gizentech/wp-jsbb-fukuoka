<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// チーム一括クラス設定 管理ページ
// ==========================================
function jsbb_add_team_class_manager_page() {
    add_submenu_page(
        'edit.php?post_type=team',
        'チームクラス一括設定',
        'クラス一括設定',
        'edit_posts',
        'jsbb-team-class-manager',
        'jsbb_team_class_manager_page'
    );
}
add_action('admin_menu', 'jsbb_add_team_class_manager_page');

function jsbb_team_class_manager_page() {
    // 保存処理
    if (isset($_POST['jsbb_bulk_class_nonce']) && wp_verify_nonce($_POST['jsbb_bulk_class_nonce'], 'jsbb_bulk_class_action')) {
        $target_class = sanitize_text_field($_POST['bulk_team_class'] ?? '');
        $team_ids = isset($_POST['bulk_team_ids']) ? array_map('intval', $_POST['bulk_team_ids']) : array();

        if ($target_class && !empty($team_ids)) {
            $count = 0;
            foreach ($team_ids as $tid) {
                $result = wp_set_object_terms($tid, array($target_class), 'team_class');
                if ($result && !is_wp_error($result)) $count++;
            }
            echo '<div class="updated"><p>' . $count . '件のチームに「' . esc_html($target_class) . '」を設定しました。</p></div>';
        }
    }

    // データ取得
    $class_terms = get_terms(array('taxonomy' => 'team_class', 'hide_empty' => false));
    $branches = get_posts(array('post_type' => 'branch', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish'));

    // フィルタ
    $filter_branch = isset($_GET['filter_branch']) ? intval($_GET['filter_branch']) : 0;
    $filter_class = isset($_GET['filter_class']) ? sanitize_text_field($_GET['filter_class']) : '';

    // チーム取得
    $team_args = array('post_type' => 'team', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish');
    if ($filter_class) {
        $team_args['tax_query'] = array(array('taxonomy' => 'team_class', 'field' => 'name', 'terms' => $filter_class));
    }
    $all_teams = get_posts($team_args);

    // 支部ごとにグループ化
    $teams_by_branch = array();
    $teams_no_branch = array();
    foreach ($all_teams as $t) {
        $bid = intval(get_post_meta($t->ID, '_team_branch_id', true));
        if ($filter_branch && $bid !== $filter_branch) continue;
        if ($bid) {
            $teams_by_branch[$bid][] = $t;
        } else {
            $teams_no_branch[] = $t;
        }
    }

    $branch_map = array();
    foreach ($branches as $b) {
        $branch_map[$b->ID] = $b->post_title;
    }
    ?>
    <div class="wrap">
        <h1>チームクラス一括設定</h1>
        <p>支部ごとにチームを選択して、クラス（学童・A級・B級・C級・少年等）を一括で設定できます。</p>

        <!-- フィルタ -->
        <form method="get" style="margin-bottom:20px;padding:15px;background:#fff;border:1px solid #ccd0d4;">
            <input type="hidden" name="post_type" value="team">
            <input type="hidden" name="page" value="jsbb-team-class-manager">
            <label><strong>支部で絞り込み:</strong>
                <select name="filter_branch">
                    <option value="0">すべての支部</option>
                    <?php foreach ($branches as $b): ?>
                        <option value="<?php echo $b->ID; ?>" <?php selected($filter_branch, $b->ID); ?>><?php echo esc_html($b->post_title); ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
            <label style="margin-left:15px;"><strong>クラスで絞り込み:</strong>
                <select name="filter_class">
                    <option value="">すべてのクラス</option>
                    <?php foreach ($class_terms as $ct): ?>
                        <option value="<?php echo esc_attr($ct->name); ?>" <?php selected($filter_class, $ct->name); ?>><?php echo esc_html($ct->name); ?> (<?php echo $ct->count; ?>)</option>
                    <?php endforeach; ?>
                </select>
            </label>
            <button type="submit" class="button" style="margin-left:10px;">絞り込み</button>
        </form>

        <!-- 一括設定フォーム -->
        <form method="post">
            <?php wp_nonce_field('jsbb_bulk_class_action', 'jsbb_bulk_class_nonce'); ?>

            <div style="position:sticky;top:32px;z-index:100;background:#fff;padding:12px 15px;border:1px solid #0073aa;margin-bottom:15px;display:flex;align-items:center;gap:15px;">
                <label><strong>設定するクラス:</strong>
                    <select name="bulk_team_class" style="font-size:14px;padding:5px;">
                        <option value="">-- 選択 --</option>
                        <?php foreach ($class_terms as $ct): ?>
                            <option value="<?php echo esc_attr($ct->name); ?>"><?php echo esc_html($ct->name); ?></option>
                        <?php endforeach; ?>
                    </select>
                </label>
                <button type="submit" class="button button-primary" style="font-size:14px;padding:5px 20px;">選択したチームに一括設定</button>
                <button type="button" class="button" id="jsbb-bulk-select-all">全選択</button>
                <button type="button" class="button" id="jsbb-bulk-deselect-all">全解除</button>
                <span id="jsbb-bulk-count" style="color:#666;">0件選択中</span>
            </div>

            <?php foreach ($branches as $b):
                if (empty($teams_by_branch[$b->ID])) continue;
                if ($filter_branch && $filter_branch !== $b->ID) continue;
                $branch_teams = $teams_by_branch[$b->ID];
            ?>
                <div class="jsbb-bulk-branch" style="margin-bottom:15px;border:1px solid #ddd;">
                    <div class="jsbb-bulk-branch-header" style="background:#f0f0f1;padding:10px 15px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;" data-branch="<?php echo $b->ID; ?>">
                        <span>
                            <strong><?php echo esc_html($b->post_title); ?></strong>
                            <span style="color:#666;margin-left:8px;">(<?php echo count($branch_teams); ?>チーム)</span>
                        </span>
                        <span>
                            <label style="margin-right:15px;color:#0073aa;font-weight:bold;" onclick="event.stopPropagation();">
                                <input type="checkbox" class="jsbb-bulk-branch-all" data-branch="<?php echo $b->ID; ?>"> この支部全選択
                            </label>
                            <span class="jsbb-bulk-toggle" style="font-size:18px;">▶</span>
                        </span>
                    </div>
                    <div class="jsbb-bulk-branch-teams" style="display:none;padding:10px 15px;">
                        <table class="widefat striped" style="margin:0;">
                            <thead>
                                <tr>
                                    <th style="width:30px;"><input type="checkbox" class="jsbb-bulk-branch-all-table" data-branch="<?php echo $b->ID; ?>"></th>
                                    <th>チーム名</th>
                                    <th>現在のクラス</th>
                                    <th>ステータス</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($branch_teams as $t):
                                    $current_classes = wp_get_post_terms($t->ID, 'team_class', array('fields' => 'names'));
                                    $current_class_str = is_array($current_classes) && !empty($current_classes) ? implode(', ', $current_classes) : '<span style="color:#999;">未設定</span>';
                                    $team_status = get_post_meta($t->ID, '_team_status', true);
                                ?>
                                    <tr>
                                        <td><input type="checkbox" name="bulk_team_ids[]" value="<?php echo $t->ID; ?>" class="jsbb-bulk-team-cb" data-branch="<?php echo $b->ID; ?>"></td>
                                        <td><a href="<?php echo get_edit_post_link($t->ID); ?>"><?php echo esc_html($t->post_title); ?></a></td>
                                        <td><?php echo $current_class_str; ?></td>
                                        <td><?php echo esc_html($team_status ?: '-'); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            <?php endforeach; ?>

            <?php if (!empty($teams_no_branch) && !$filter_branch): ?>
                <div class="jsbb-bulk-branch" style="margin-bottom:15px;border:1px solid #ddd;">
                    <div class="jsbb-bulk-branch-header" style="background:#f0f0f1;padding:10px 15px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;" data-branch="none">
                        <span><strong>支部未設定</strong> <span style="color:#666;margin-left:8px;">(<?php echo count($teams_no_branch); ?>チーム)</span></span>
                        <span class="jsbb-bulk-toggle" style="font-size:18px;">▶</span>
                    </div>
                    <div class="jsbb-bulk-branch-teams" style="display:none;padding:10px 15px;">
                        <table class="widefat striped" style="margin:0;">
                            <thead><tr><th style="width:30px;"></th><th>チーム名</th><th>現在のクラス</th><th>ステータス</th></tr></thead>
                            <tbody>
                                <?php foreach ($teams_no_branch as $t):
                                    $current_classes = wp_get_post_terms($t->ID, 'team_class', array('fields' => 'names'));
                                    $current_class_str = is_array($current_classes) && !empty($current_classes) ? implode(', ', $current_classes) : '<span style="color:#999;">未設定</span>';
                                    $team_status = get_post_meta($t->ID, '_team_status', true);
                                ?>
                                    <tr>
                                        <td><input type="checkbox" name="bulk_team_ids[]" value="<?php echo $t->ID; ?>" class="jsbb-bulk-team-cb"></td>
                                        <td><a href="<?php echo get_edit_post_link($t->ID); ?>"><?php echo esc_html($t->post_title); ?></a></td>
                                        <td><?php echo $current_class_str; ?></td>
                                        <td><?php echo esc_html($team_status ?: '-'); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            <?php endif; ?>
        </form>
    </div>

    <script>
    jQuery(document).ready(function($) {
        // アコーディオン
        $(document).on('click', '.jsbb-bulk-branch-header', function(e) {
            if ($(e.target).is('input,label')) return;
            var $teams = $(this).next('.jsbb-bulk-branch-teams');
            var $icon = $(this).find('.jsbb-bulk-toggle');
            $teams.slideToggle(150);
            $icon.text($teams.is(':visible') ? '▶' : '▼');
        });

        function updateBulkCount() {
            var count = $('.jsbb-bulk-team-cb:checked').length;
            $('#jsbb-bulk-count').text(count + '件選択中');
        }

        // 支部全選択（ヘッダー）
        $(document).on('change', '.jsbb-bulk-branch-all', function() {
            var bid = $(this).data('branch');
            var checked = $(this).prop('checked');
            $('.jsbb-bulk-team-cb[data-branch="' + bid + '"]').prop('checked', checked);
            // テーブルヘッダーのチェックも同期
            $('.jsbb-bulk-branch-all-table[data-branch="' + bid + '"]').prop('checked', checked);
            updateBulkCount();
        });

        // 支部全選択（テーブルヘッダー）
        $(document).on('change', '.jsbb-bulk-branch-all-table', function() {
            var bid = $(this).data('branch');
            var checked = $(this).prop('checked');
            $('.jsbb-bulk-team-cb[data-branch="' + bid + '"]').prop('checked', checked);
            $('.jsbb-bulk-branch-all[data-branch="' + bid + '"]').prop('checked', checked);
            updateBulkCount();
        });

        $(document).on('change', '.jsbb-bulk-team-cb', function() {
            updateBulkCount();
        });

        $('#jsbb-bulk-select-all').on('click', function() {
            $('.jsbb-bulk-team-cb').prop('checked', true);
            $('.jsbb-bulk-branch-all, .jsbb-bulk-branch-all-table').prop('checked', true);
            updateBulkCount();
        });

        $('#jsbb-bulk-deselect-all').on('click', function() {
            $('.jsbb-bulk-team-cb').prop('checked', false);
            $('.jsbb-bulk-branch-all, .jsbb-bulk-branch-all-table').prop('checked', false);
            updateBulkCount();
        });
    });
    </script>
    <?php
}

// ==========================================
// 加盟チーム一覧（カンバンボード）
// ==========================================
function jsbb_add_team_kanban_page() {
    add_submenu_page(
        'edit.php?post_type=team',
        '加盟チーム一覧',
        '加盟チーム一覧',
        'edit_posts',
        'jsbb-team-kanban',
        'jsbb_team_kanban_page'
    );
}
add_action('admin_menu', 'jsbb_add_team_kanban_page');

function jsbb_team_kanban_page() {
    wp_enqueue_script('jquery-ui-sortable');
    wp_enqueue_script('jquery-ui-draggable');
    wp_enqueue_script('jquery-ui-droppable');
    wp_enqueue_media();

    // 保存処理
    if (isset($_POST['jsbb_kanban_nonce']) && wp_verify_nonce($_POST['jsbb_kanban_nonce'], 'jsbb_kanban_save')) {
        $moves = json_decode(wp_unslash($_POST['jsbb_kanban_moves'] ?? '[]'), true);
        $count = 0;
        if (is_array($moves)) {
            foreach ($moves as $move) {
                $team_id = intval($move['team_id'] ?? 0);
                $new_class = sanitize_text_field($move['new_class'] ?? '');
                if ($team_id) {
                    if ($new_class === '__none__') {
                        wp_set_object_terms($team_id, array(), 'team_class');
                    } else {
                        wp_set_object_terms($team_id, array($new_class), 'team_class');
                    }
                    $count++;
                }
            }
        }
        if ($count > 0) {
            echo '<div class="updated"><p>' . $count . '件のチームクラスを更新しました。</p></div>';
        }
    }

    // カラム定義
    $class_columns = array(
        '__none__' => '未設定',
        '学童' => '学童',
        '少年（中学）' => '少年',
        'A級' => 'A級',
        'B級' => 'B級',
        'C級' => 'C級',
        '一般' => '一般',
        'ガールズ' => 'ガールズ',
    );

    $col_colors = array(
        '__none__' => '#fce4ec',
        '学童' => '#e8f5e9',
        '少年（中学）' => '#e3f2fd',
        'A級' => '#fff3e0',
        'B級' => '#f3e5f5',
        'C級' => '#e0f7fa',
        '一般' => '#fafafa',
        'ガールズ' => '#fce4ec',
    );

    // フィルタ
    $filter_branch = isset($_GET['filter_branch']) ? intval($_GET['filter_branch']) : 0;

    // データ取得
    $branches = get_posts(array('post_type' => 'branch', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish'));
    $all_teams = get_posts(array('post_type' => 'team', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish'));

    $branch_map = array();
    foreach ($branches as $b) $branch_map[$b->ID] = $b->post_title;

    // 支部×クラスでグループ化
    $data = array();
    foreach ($all_teams as $t) {
        $bid = intval(get_post_meta($t->ID, '_team_branch_id', true));
        if ($filter_branch && $bid !== $filter_branch) continue;

        $terms = wp_get_post_terms($t->ID, 'team_class', array('fields' => 'names'));
        $class_key = '__none__';
        if (!empty($terms) && !is_wp_error($terms)) {
            foreach ($class_columns as $ck => $cv) {
                if ($ck !== '__none__' && in_array($ck, $terms)) {
                    $class_key = $ck;
                    break;
                }
            }
        }
        $bk = $bid ?: 0;
        $data[$bk][$class_key][] = $t;
    }

    // 支部ソート
    $branch_ids = array_keys($data);
    usort($branch_ids, function($a, $b) use ($branch_map) {
        if ($a === 0) return 1;
        if ($b === 0) return -1;
        return strcmp($branch_map[$a] ?? '', $branch_map[$b] ?? '');
    });
    ?>
    <div class="wrap">
        <h1>加盟チーム一覧</h1>
        <p>チームカードをドラッグ&ドロップでクラス間を移動。<strong>Ctrl+クリック</strong>で複数選択→まとめて移動。</p>

        <form method="get" style="margin-bottom:12px;">
            <input type="hidden" name="post_type" value="team">
            <input type="hidden" name="page" value="jsbb-team-kanban">
            <label><strong>支部:</strong>
                <select name="filter_branch" onchange="this.form.submit()">
                    <option value="0">すべての支部</option>
                    <?php foreach ($branches as $b): ?>
                        <option value="<?php echo $b->ID; ?>" <?php selected($filter_branch, $b->ID); ?>><?php echo esc_html($b->post_title); ?></option>
                    <?php endforeach; ?>
                </select>
            </label>
        </form>

        <form method="post" id="jsbb-kanban-form">
            <?php wp_nonce_field('jsbb_kanban_save', 'jsbb_kanban_nonce'); ?>
            <input type="hidden" name="jsbb_kanban_moves" id="jsbb-kanban-moves" value="[]">

            <div style="position:sticky;top:32px;z-index:100;background:#fff;padding:10px 15px;border:1px solid #0073aa;margin-bottom:15px;display:flex;align-items:center;gap:15px;flex-wrap:wrap;">
                <button type="submit" class="button button-primary" id="jsbb-kanban-save" disabled>変更を保存</button>
                <span id="jsbb-kanban-change-count" style="color:#666;">変更なし</span>
                <button type="button" class="button" id="jsbb-edit-profile-btn" style="margin-left:auto;" disabled>チーム情報編集</button>
                <span id="jsbb-selected-count" style="color:#666;font-size:12px;"></span>
                <?php
                $current_user = wp_get_current_user();
                if (in_array($current_user->user_login, array('open', 'admin'), true)):
                ?>
                <button type="button" class="button" id="jsbb-password-list-btn">ID・パスワード一覧</button>
                <?php endif; ?>
            </div>

            <?php foreach ($branch_ids as $bid):
                $branch_name = $bid ? ($branch_map[$bid] ?? '支部ID:' . $bid) : '支部未設定';
                $branch_data = $data[$bid];
                $total = 0;
                foreach ($branch_data as $ts) $total += count($ts);
            ?>
                <div class="jsbb-kb-branch" style="margin-bottom:20px;">
                    <div class="jsbb-kb-branch-hd" style="background:#23282d;color:#fff;padding:8px 15px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;border-radius:4px 4px 0 0;">
                        <span style="font-size:14px;font-weight:bold;"><?php echo esc_html($branch_name); ?> <span style="font-weight:normal;opacity:0.7;">(<?php echo $total; ?>)</span></span>
                        <span class="jsbb-kb-tog">▼</span>
                    </div>
                    <div class="jsbb-kb-board" style="display:flex;gap:0;border:1px solid #ccc;border-top:none;overflow-x:auto;">
                        <?php foreach ($class_columns as $ck => $cv):
                            $teams_in = isset($branch_data[$ck]) ? $branch_data[$ck] : array();
                            $bg = $col_colors[$ck] ?? '#f0f0f1';
                        ?>
                            <div class="jsbb-kb-col" style="flex:1;min-width:120px;border-right:1px solid #ddd;background:<?php echo $bg; ?>;">
                                <div class="jsbb-kb-col-hd" style="padding:6px 8px;font-weight:bold;text-align:center;border-bottom:1px solid #ddd;font-size:12px;background:<?php echo $bg; ?>;">
                                    <?php echo esc_html($cv); ?>
                                    <span class="jsbb-kb-col-count" style="font-weight:normal;color:#666;">(<?php echo count($teams_in); ?>)</span>
                                </div>
                                <div class="jsbb-kb-list" data-class="<?php echo esc_attr($ck); ?>" data-branch="<?php echo $bid; ?>" style="min-height:40px;padding:4px;">
                                    <?php foreach ($teams_in as $t): ?>
                                        <div class="jsbb-kb-card" data-team-id="<?php echo $t->ID; ?>" data-orig="<?php echo esc_attr($ck); ?>" title="<?php echo esc_attr($t->post_title); ?>">
                                            <?php echo esc_html(mb_strimwidth($t->post_title, 0, 18, '…')); ?>
                                        </div>
                                    <?php endforeach; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            <?php endforeach; ?>

            <?php if (empty($data)): ?>
                <p style="color:#999;">表示するチームがありません。</p>
            <?php endif; ?>
        </form>
    </div>

    <!-- チーム情報編集モーダル -->
    <div id="jsbb-profile-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:100000;background:rgba(0,0,0,0.6);">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;width:90%;max-width:800px;max-height:85vh;overflow-y:auto;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,0.3);">
            <div style="position:sticky;top:0;background:#fff;padding:15px 20px;border-bottom:1px solid #ddd;display:flex;align-items:center;justify-content:space-between;z-index:1;">
                <h2 id="jsbb-modal-title" style="margin:0;font-size:18px;">チーム情報編集</h2>
                <button type="button" id="jsbb-modal-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">&times;</button>
            </div>
            <div style="padding:20px;" id="jsbb-modal-body">
                <div id="jsbb-modal-loading" style="text-align:center;padding:40px;color:#666;">読み込み中...</div>
                <div id="jsbb-modal-form" style="display:none;">
                    <table class="form-table">
                        <tr><th>代表者名</th><td><input type="text" id="jsbb-pf-representative" class="regular-text" style="width:100%;"></td></tr>
                        <tr><th>活動場所</th><td><input type="text" id="jsbb-pf-location" class="regular-text" style="width:100%;"></td></tr>
                        <tr><th>WebサイトURL</th><td><input type="url" id="jsbb-pf-website_url" class="regular-text" style="width:100%;"></td></tr>
                        <tr><th>メールアドレス</th><td><input type="email" id="jsbb-pf-email" class="regular-text" style="width:100%;"></td></tr>
                        <tr><th>SNSリンク</th><td>
                            <div id="jsbb-pf-sns-wrap"></div>
                            <button type="button" class="button button-small" id="jsbb-pf-sns-add">+ SNS追加</button>
                        </td></tr>
                        <tr><th>募集状況</th><td>
                            <select id="jsbb-pf-recruiting" style="min-width:150px;">
                                <option value="">未設定</option>
                                <option value="yes">募集中</option>
                                <option value="no">募集なし</option>
                            </select>
                        </td></tr>
                        <tr><th>部費（月額）</th><td><input type="text" id="jsbb-pf-fee" class="regular-text" placeholder="例: 3,000円" style="width:100%;"></td></tr>
                        <tr><th>入部資格</th><td><input type="text" id="jsbb-pf-eligibility" class="regular-text" style="width:100%;"></td></tr>
                        <tr><th>年齢層</th><td><input type="text" id="jsbb-pf-age_range" class="regular-text" placeholder="例: 20代〜50代" style="width:100%;"></td></tr>
                        <tr><th>学区</th><td><input type="text" id="jsbb-pf-school_district" class="regular-text" style="width:100%;"></td></tr>
                        <tr><th>メンバー</th><td><textarea id="jsbb-pf-members" rows="3" style="width:100%;" placeholder="メンバー名をカンマ区切りまたは改行区切りで入力"></textarea></td></tr>
                        <tr><th>アイキャッチ画像</th><td>
                            <div id="jsbb-pf-featured-preview" style="margin-bottom:8px;"></div>
                            <input type="hidden" id="jsbb-pf-featured_image_id" value="">
                            <button type="button" class="button" id="jsbb-pf-featured-select">画像を選択</button>
                            <button type="button" class="button" id="jsbb-pf-featured-remove" style="display:none;">削除</button>
                        </td></tr>
                        <tr><th>ギャラリー画像（最大3枚）</th><td>
                            <div id="jsbb-pf-gallery-preview" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;"></div>
                            <input type="hidden" id="jsbb-pf-gallery_images" value="[]">
                            <button type="button" class="button" id="jsbb-pf-gallery-select">画像を追加</button>
                        </td></tr>
                        <tr><th>編集パスワード</th><td>
                            <code id="jsbb-pf-password-display" style="font-size:14px;padding:4px 8px;background:#f0f0f1;"></code>
                            <button type="button" class="button button-small" id="jsbb-pf-password-gen" style="margin-left:8px;">再生成</button>
                            <p class="description">フロントエンドからの編集に使用するパスワードです。</p>
                        </td></tr>
                    </table>
                </div>
            </div>
            <div style="position:sticky;bottom:0;background:#fff;padding:12px 20px;border-top:1px solid #ddd;text-align:right;">
                <span id="jsbb-modal-status" style="color:#666;margin-right:15px;"></span>
                <button type="button" class="button" id="jsbb-modal-cancel">キャンセル</button>
                <button type="button" class="button button-primary" id="jsbb-modal-save" style="margin-left:8px;">保存</button>
            </div>
        </div>
    </div>

    <?php if (in_array($current_user->user_login, array('open', 'admin'), true)): ?>
    <!-- ID・パスワード一覧モーダル -->
    <div id="jsbb-pwlist-modal" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;z-index:100001;background:rgba(0,0,0,0.6);">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;width:90%;max-width:900px;max-height:85vh;overflow-y:auto;border-radius:8px;box-shadow:0 8px 40px rgba(0,0,0,0.3);">
            <div style="position:sticky;top:0;background:#fff;padding:15px 20px;border-bottom:1px solid #ddd;display:flex;align-items:center;justify-content:space-between;z-index:1;">
                <h2 style="margin:0;font-size:18px;">チームID・パスワード一覧</h2>
                <button type="button" id="jsbb-pwlist-close" style="background:none;border:none;font-size:24px;cursor:pointer;color:#666;">&times;</button>
            </div>
            <div style="padding:20px;" id="jsbb-pwlist-body">
                <p style="color:#666;margin-bottom:15px;">フロントエンド編集用のパスワード一覧です。パスワード未設定のチームには「生成」ボタンで新規パスワードを発行できます。</p>
                <div style="margin-bottom:12px;display:flex;gap:10px;align-items:center;">
                    <button type="button" class="button" id="jsbb-pwlist-generate-all">未設定すべてにパスワード生成</button>
                    <button type="button" class="button" id="jsbb-pwlist-copy-csv">CSVコピー</button>
                    <span id="jsbb-pwlist-status" style="color:#46b450;font-size:13px;"></span>
                </div>
                <table class="widefat striped" id="jsbb-pwlist-table">
                    <thead>
                        <tr>
                            <th style="width:60px;">ID</th>
                            <th>チーム名</th>
                            <th>支部</th>
                            <th style="width:140px;">パスワード</th>
                            <th style="width:120px;">編集URL</th>
                            <th style="width:80px;">操作</th>
                        </tr>
                    </thead>
                    <tbody id="jsbb-pwlist-tbody">
                        <tr><td colspan="6" style="text-align:center;color:#999;">読み込み中...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <style>
    .jsbb-kb-card {
        background: #fff;
        border: 1px solid #ccc;
        border-radius: 3px;
        padding: 4px 7px;
        margin: 2px 0;
        cursor: grab;
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        user-select: none;
        transition: box-shadow 0.1s, border-color 0.1s;
    }
    .jsbb-kb-card:hover { border-color: #0073aa; }
    .jsbb-kb-card.jsbb-sel { border-color: #0073aa; background: #e5f0ff; box-shadow: 0 0 0 2px rgba(0,115,170,0.3); }
    .jsbb-kb-card.jsbb-chg { border-left: 3px solid #d63638; }
    .jsbb-kb-card.ui-sortable-helper { box-shadow: 0 4px 12px rgba(0,0,0,0.25); transform: rotate(1deg); z-index: 9999; }
    .jsbb-kb-card.jsbb-ghost { opacity: 0.35; }
    .jsbb-kb-placeholder { height: 26px; margin: 2px 0; border: 2px dashed #0073aa; border-radius: 3px; background: rgba(0,115,170,0.05); }
    .jsbb-multi-badge { position: absolute; top: -6px; right: -6px; background: #d63638; color: #fff; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; line-height: 18px; text-align: center; font-weight: bold; }
    </style>

    <script>
    jQuery(document).ready(function($) {
        var changes = {};
        var $sel = $();

        // アコーディオン
        $(document).on('click', '.jsbb-kb-branch-hd', function() {
            var $b = $(this).next('.jsbb-kb-board');
            $b.slideToggle(200);
            $(this).find('.jsbb-kb-tog').text($b.is(':visible') ? '▼' : '▶');
        });

        // 複数選択
        $(document).on('mousedown', '.jsbb-kb-card', function(e) {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                $(this).toggleClass('jsbb-sel');
            } else if (e.shiftKey) {
                e.preventDefault();
                var $list = $(this).closest('.jsbb-kb-list');
                var $cards = $list.find('.jsbb-kb-card');
                var $last = $list.find('.jsbb-kb-card.jsbb-sel').last();
                if ($last.length) {
                    var a = $cards.index($last), b = $cards.index($(this));
                    $cards.slice(Math.min(a,b), Math.max(a,b)+1).addClass('jsbb-sel');
                } else {
                    $(this).addClass('jsbb-sel');
                }
            } else {
                if (!$(this).hasClass('jsbb-sel')) {
                    $('.jsbb-kb-card.jsbb-sel').removeClass('jsbb-sel');
                    $(this).addClass('jsbb-sel');
                }
            }
            $sel = $('.jsbb-kb-card.jsbb-sel');
        });

        // 同じ支部内のカラムだけ接続
        $('.jsbb-kb-branch').each(function() {
            var $lists = $(this).find('.jsbb-kb-list');
            $lists.sortable({
                connectWith: $lists,
                placeholder: 'jsbb-kb-placeholder',
                tolerance: 'pointer',
                cursor: 'grabbing',
                revert: 60,
                helper: function(e, item) {
                    if (!item.hasClass('jsbb-sel')) {
                        $('.jsbb-kb-card.jsbb-sel').removeClass('jsbb-sel');
                        item.addClass('jsbb-sel');
                    }
                    $sel = $('.jsbb-kb-card.jsbb-sel');
                    $sel.not(item).addClass('jsbb-ghost');
                    var $h = item.clone();
                    if ($sel.length > 1) {
                        $h.css('position', 'relative');
                        $h.append('<span class="jsbb-multi-badge">' + $sel.length + '</span>');
                    }
                    return $h;
                },
                stop: function(e, ui) {
                    var newClass = ui.item.closest('.jsbb-kb-list').data('class');
                    var moved = $sel.length > 0 ? $sel : ui.item;

                    moved.each(function() {
                        var $c = $(this);
                        var tid = $c.data('team-id');
                        var orig = $c.data('orig');

                        if (this !== ui.item.get(0)) {
                            $c.detach().insertAfter(ui.item);
                        }
                        $c.removeClass('jsbb-ghost');

                        if (String(newClass) !== String(orig)) {
                            changes[tid] = newClass;
                            $c.addClass('jsbb-chg');
                        } else {
                            delete changes[tid];
                            $c.removeClass('jsbb-chg');
                        }
                    });

                    $('.jsbb-kb-card.jsbb-sel').removeClass('jsbb-sel');
                    $sel = $();
                    syncUI();
                }
            });
        });

        function syncUI() {
            var n = Object.keys(changes).length;
            $('#jsbb-kanban-change-count').text(n > 0 ? n + '件の変更あり' : '変更なし').css('color', n > 0 ? '#d63638' : '#666');
            $('#jsbb-kanban-save').prop('disabled', n === 0);

            var moves = [];
            for (var tid in changes) moves.push({ team_id: parseInt(tid), new_class: changes[tid] });
            $('#jsbb-kanban-moves').val(JSON.stringify(moves));

            // カラムカウント更新
            $('.jsbb-kb-list').each(function() {
                var c = $(this).find('.jsbb-kb-card').length;
                $(this).closest('.jsbb-kb-col').find('.jsbb-kb-col-count').text('(' + c + ')');
            });

            // 選択数とeditボタン更新
            var selCount = $('.jsbb-kb-card.jsbb-sel').length;
            $('#jsbb-edit-profile-btn').prop('disabled', selCount === 0);
            $('#jsbb-selected-count').text(selCount > 0 ? selCount + '件選択中' : '');
        }

        // ===== チーム情報編集モーダル =====
        var wpApiBase = '<?php echo esc_url(rest_url('jsbb/v1')); ?>';
        var wpNonce = '<?php echo wp_create_nonce('wp_rest'); ?>';
        var editingTeamIds = [];

        // 選択更新時にsyncUI呼ぶ
        $(document).on('mouseup', '.jsbb-kb-card', function() {
            setTimeout(syncUI, 10);
        });

        // 編集ボタンクリック
        $('#jsbb-edit-profile-btn').on('click', function() {
            var $selected = $('.jsbb-kb-card.jsbb-sel');
            if ($selected.length === 0) return;

            editingTeamIds = [];
            $selected.each(function() { editingTeamIds.push($(this).data('team-id')); });

            if (editingTeamIds.length === 1) {
                openSingleEdit(editingTeamIds[0]);
            } else {
                openBulkEdit(editingTeamIds);
            }
        });

        function openModal(title) {
            $('#jsbb-modal-title').text(title);
            $('#jsbb-modal-loading').show();
            $('#jsbb-modal-form').hide();
            $('#jsbb-modal-status').text('');
            $('#jsbb-profile-modal').fadeIn(200);
            $('body').css('overflow', 'hidden');
        }

        function closeModal() {
            $('#jsbb-profile-modal').fadeOut(200);
            $('body').css('overflow', '');
        }

        $('#jsbb-modal-close, #jsbb-modal-cancel').on('click', closeModal);
        $('#jsbb-profile-modal').on('click', function(e) {
            if (e.target === this) closeModal();
        });

        // 単一チーム編集
        function openSingleEdit(teamId) {
            openModal('チーム情報編集');
            $.ajax({
                url: wpApiBase + '/team-profile/' + teamId,
                headers: { 'X-WP-Nonce': wpNonce },
                success: function(data) {
                    fillForm(data);
                    $('#jsbb-modal-loading').hide();
                    $('#jsbb-modal-form').show();
                },
                error: function() {
                    $('#jsbb-modal-loading').text('データの取得に失敗しました。');
                }
            });
        }

        // 複数チーム一括編集
        function openBulkEdit(ids) {
            openModal(ids.length + '件のチーム一括編集');
            clearForm();
            // 一括編集時はパスワード・画像セクションを非表示
            $('#jsbb-pf-featured-select, #jsbb-pf-featured-remove, #jsbb-pf-featured-preview').closest('tr').hide();
            $('#jsbb-pf-gallery-select, #jsbb-pf-gallery-preview').closest('tr').hide();
            $('#jsbb-pf-password-display').closest('tr').hide();
            $('#jsbb-modal-loading').hide();
            $('#jsbb-modal-form').show();
        }

        function clearForm() {
            $('#jsbb-pf-representative, #jsbb-pf-location, #jsbb-pf-website_url, #jsbb-pf-email, #jsbb-pf-fee, #jsbb-pf-eligibility, #jsbb-pf-age_range, #jsbb-pf-school_district').val('');
            $('#jsbb-pf-recruiting').val('');
            $('#jsbb-pf-members').val('');
            $('#jsbb-pf-sns-wrap').empty();
            $('#jsbb-pf-featured_image_id').val('');
            $('#jsbb-pf-featured-preview').empty();
            $('#jsbb-pf-featured-remove').hide();
            $('#jsbb-pf-gallery_images').val('[]');
            $('#jsbb-pf-gallery-preview').empty();
            $('#jsbb-pf-password-display').text('');
            // 全行表示
            $('#jsbb-modal-form tr').show();
        }

        function fillForm(data) {
            clearForm();
            $('#jsbb-pf-representative').val(data.representative || '');
            $('#jsbb-pf-location').val(data.location || '');
            $('#jsbb-pf-website_url').val(data.website_url || '');
            $('#jsbb-pf-email').val(data.email || '');
            $('#jsbb-pf-recruiting').val(data.recruiting || '');
            $('#jsbb-pf-fee').val(data.fee || '');
            $('#jsbb-pf-eligibility').val(data.eligibility || '');
            $('#jsbb-pf-age_range').val(data.age_range || '');
            $('#jsbb-pf-school_district').val(data.school_district || '');

            // メンバー
            var members = data.members || '';
            try { var m = JSON.parse(members); if (Array.isArray(m)) members = m.join('\n'); } catch(e) {}
            $('#jsbb-pf-members').val(members);

            // SNS
            var sns = [];
            try { sns = JSON.parse(data.sns_links || '[]'); } catch(e) {}
            if (Array.isArray(sns)) {
                sns.forEach(function(s) { addSnsField(s); });
            }

            // アイキャッチ
            if (data.featured_image && data.featured_image.id) {
                $('#jsbb-pf-featured_image_id').val(data.featured_image.id);
                $('#jsbb-pf-featured-preview').html('<img src="' + data.featured_image.url + '" style="max-width:200px;max-height:150px;border:1px solid #ddd;border-radius:4px;">');
                $('#jsbb-pf-featured-remove').show();
            }

            // ギャラリー
            if (data.gallery && data.gallery.length > 0) {
                var ids = [];
                data.gallery.forEach(function(g) {
                    ids.push(g.id);
                    $('#jsbb-pf-gallery-preview').append('<div style="position:relative;"><img src="' + g.url + '" style="width:120px;height:90px;object-fit:cover;border:1px solid #ddd;border-radius:4px;"><button type="button" class="jsbb-gallery-remove" data-id="' + g.id + '" style="position:absolute;top:-6px;right:-6px;background:#d63638;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;line-height:20px;">&times;</button></div>');
                });
                $('#jsbb-pf-gallery_images').val(JSON.stringify(ids));
            }

            // パスワード
            loadPassword(editingTeamIds[0]);
        }

        // SNSフィールド追加
        function addSnsField(val) {
            var $row = $('<div style="display:flex;gap:6px;margin-bottom:4px;"><input type="text" class="regular-text jsbb-sns-input" style="flex:1;" placeholder="https://..." value="' + (val || '') + '"><button type="button" class="button button-small jsbb-sns-remove">&times;</button></div>');
            $('#jsbb-pf-sns-wrap').append($row);
        }
        $('#jsbb-pf-sns-add').on('click', function() { addSnsField(''); });
        $(document).on('click', '.jsbb-sns-remove', function() { $(this).closest('div').remove(); });

        // パスワード読み込み
        function loadPassword(teamId) {
            $.ajax({
                url: wpApiBase + '/team-profile/' + teamId,
                headers: { 'X-WP-Nonce': wpNonce },
                success: function(data) {
                    // パスワードはREST APIでは返さないので、AJAX経由で取得
                    $.post(ajaxurl, {
                        action: 'jsbb_get_team_password',
                        team_id: teamId,
                        _wpnonce: '<?php echo wp_create_nonce('jsbb_team_password'); ?>'
                    }, function(res) {
                        if (res.success) {
                            $('#jsbb-pf-password-display').text(res.data.password || '未設定');
                        }
                    });
                }
            });
        }

        // パスワード再生成
        $('#jsbb-pf-password-gen').on('click', function() {
            if (!confirm('パスワードを再生成しますか？既存のパスワードは無効になります。')) return;
            var teamId = editingTeamIds[0];
            $.ajax({
                url: wpApiBase + '/team-password/' + teamId,
                method: 'POST',
                headers: { 'X-WP-Nonce': wpNonce },
                success: function(data) {
                    $('#jsbb-pf-password-display').text(data.password);
                },
                error: function() { alert('パスワード生成に失敗しました。'); }
            });
        });

        // アイキャッチ画像選択
        $('#jsbb-pf-featured-select').on('click', function() {
            var frame = wp.media({ title: 'アイキャッチ画像を選択', multiple: false, library: { type: 'image' } });
            frame.on('select', function() {
                var att = frame.state().get('selection').first().toJSON();
                $('#jsbb-pf-featured_image_id').val(att.id);
                $('#jsbb-pf-featured-preview').html('<img src="' + (att.sizes.medium ? att.sizes.medium.url : att.url) + '" style="max-width:200px;max-height:150px;border:1px solid #ddd;border-radius:4px;">');
                $('#jsbb-pf-featured-remove').show();
            });
            frame.open();
        });
        $('#jsbb-pf-featured-remove').on('click', function() {
            $('#jsbb-pf-featured_image_id').val('0');
            $('#jsbb-pf-featured-preview').empty();
            $(this).hide();
        });

        // ギャラリー画像選択
        $('#jsbb-pf-gallery-select').on('click', function() {
            var currentIds = JSON.parse($('#jsbb-pf-gallery_images').val() || '[]');
            if (currentIds.length >= 3) { alert('ギャラリーは最大3枚です。'); return; }
            var frame = wp.media({ title: 'ギャラリー画像を追加', multiple: true, library: { type: 'image' } });
            frame.on('select', function() {
                var selection = frame.state().get('selection').toJSON();
                selection.forEach(function(att) {
                    if (currentIds.length >= 3) return;
                    currentIds.push(att.id);
                    var url = att.sizes && att.sizes.medium ? att.sizes.medium.url : att.url;
                    $('#jsbb-pf-gallery-preview').append('<div style="position:relative;"><img src="' + url + '" style="width:120px;height:90px;object-fit:cover;border:1px solid #ddd;border-radius:4px;"><button type="button" class="jsbb-gallery-remove" data-id="' + att.id + '" style="position:absolute;top:-6px;right:-6px;background:#d63638;color:#fff;border:none;border-radius:50%;width:20px;height:20px;cursor:pointer;font-size:12px;line-height:20px;">&times;</button></div>');
                });
                $('#jsbb-pf-gallery_images').val(JSON.stringify(currentIds));
            });
            frame.open();
        });

        // ギャラリー画像削除
        $(document).on('click', '.jsbb-gallery-remove', function() {
            var removeId = parseInt($(this).data('id'));
            var currentIds = JSON.parse($('#jsbb-pf-gallery_images').val() || '[]');
            currentIds = currentIds.filter(function(id) { return id !== removeId; });
            $('#jsbb-pf-gallery_images').val(JSON.stringify(currentIds));
            $(this).closest('div').remove();
        });

        // 保存
        $('#jsbb-modal-save').on('click', function() {
            var $btn = $(this);
            $btn.prop('disabled', true);
            $('#jsbb-modal-status').text('保存中...').css('color', '#0073aa');

            var formData = {};
            var fields = ['representative', 'location', 'website_url', 'email', 'recruiting', 'fee', 'eligibility', 'age_range', 'school_district'];
            fields.forEach(function(f) {
                var val = $('#jsbb-pf-' + f).val();
                if (val !== '' && val !== undefined) formData[f] = val;
            });

            // SNS
            var snsLinks = [];
            $('.jsbb-sns-input').each(function() { var v = $(this).val().trim(); if (v) snsLinks.push(v); });
            if (snsLinks.length > 0) formData.sns_links = snsLinks;

            // メンバー
            var membersVal = $('#jsbb-pf-members').val().trim();
            if (membersVal) {
                var membersList = membersVal.split(/[,\n]/).map(function(s) { return s.trim(); }).filter(Boolean);
                formData.members = membersList;
            }

            if (editingTeamIds.length === 1) {
                // 単一チーム保存
                var featId = $('#jsbb-pf-featured_image_id').val();
                if (featId !== '' && featId !== undefined) formData.featured_image_id = parseInt(featId);

                var galleryIds = JSON.parse($('#jsbb-pf-gallery_images').val() || '[]');
                formData.gallery_images = galleryIds;

                $.ajax({
                    url: wpApiBase + '/team-profile/' + editingTeamIds[0],
                    method: 'POST',
                    headers: { 'X-WP-Nonce': wpNonce },
                    contentType: 'application/json',
                    data: JSON.stringify(formData),
                    success: function() {
                        $('#jsbb-modal-status').text('保存しました').css('color', '#46b450');
                        $btn.prop('disabled', false);
                        setTimeout(closeModal, 1000);
                    },
                    error: function(xhr) {
                        var msg = '保存に失敗しました';
                        try { msg = JSON.parse(xhr.responseText).message || msg; } catch(e) {}
                        $('#jsbb-modal-status').text(msg).css('color', '#d63638');
                        $btn.prop('disabled', false);
                    }
                });
            } else {
                // 一括保存
                $.ajax({
                    url: wpApiBase + '/team-profile-bulk',
                    method: 'POST',
                    headers: { 'X-WP-Nonce': wpNonce },
                    contentType: 'application/json',
                    data: JSON.stringify({ team_ids: editingTeamIds, data: formData }),
                    success: function(res) {
                        $('#jsbb-modal-status').text(res.message || '保存しました').css('color', '#46b450');
                        $btn.prop('disabled', false);
                        setTimeout(closeModal, 1000);
                    },
                    error: function(xhr) {
                        var msg = '保存に失敗しました';
                        try { msg = JSON.parse(xhr.responseText).message || msg; } catch(e) {}
                        $('#jsbb-modal-status').text(msg).css('color', '#d63638');
                        $btn.prop('disabled', false);
                    }
                });
            }
        });

    // ===== ID・パスワード一覧モーダル =====
    <?php if (in_array($current_user->user_login, array('open', 'admin'), true)): ?>
    (function() {
        var $pwModal = $('#jsbb-pwlist-modal');
        var frontUrl = '<?php echo esc_js(home_url()); ?>'.replace(/\/CMS\/?$/, '');
        var wpApiBase = '<?php echo esc_js(rest_url('jsbb/v1')); ?>';

        $('#jsbb-password-list-btn').on('click', function() {
            $pwModal.show();
            loadPasswordList();
        });
        $('#jsbb-pwlist-close').on('click', function() { $pwModal.hide(); });
        $pwModal.on('click', function(e) { if (e.target === this) $pwModal.hide(); });

        function loadPasswordList() {
            $('#jsbb-pwlist-tbody').html('<tr><td colspan="6" style="text-align:center;color:#999;">読み込み中...</td></tr>');
            $.ajax({
                url: ajaxurl,
                method: 'POST',
                data: {
                    action: 'jsbb_get_all_team_passwords',
                    _wpnonce: '<?php echo wp_create_nonce('jsbb_all_team_passwords'); ?>'
                },
                success: function(res) {
                    if (!res.success) {
                        $('#jsbb-pwlist-tbody').html('<tr><td colspan="6" style="color:#d63638;">取得に失敗しました</td></tr>');
                        return;
                    }
                    var html = '';
                    res.data.forEach(function(t) {
                        var editUrl = frontUrl + '/teams/edit/' + t.id;
                        html += '<tr data-team-id="' + t.id + '">';
                        html += '<td>' + t.id + '</td>';
                        html += '<td>' + $('<span>').text(t.name).html() + '</td>';
                        html += '<td>' + $('<span>').text(t.branch || '').html() + '</td>';
                        html += '<td><code class="jsbb-pw-val" style="font-size:13px;">' + (t.password || '<span style="color:#999;">未設定</span>') + '</code></td>';
                        html += '<td><a href="' + editUrl + '" target="_blank" style="font-size:12px;">編集ページ</a></td>';
                        html += '<td>';
                        if (t.password) {
                            html += '<button type="button" class="button button-small jsbb-pw-regen" data-id="' + t.id + '">再生成</button>';
                        } else {
                            html += '<button type="button" class="button button-small jsbb-pw-gen" data-id="' + t.id + '">生成</button>';
                        }
                        html += '</td></tr>';
                    });
                    if (!html) html = '<tr><td colspan="6" style="text-align:center;color:#999;">チームがありません</td></tr>';
                    $('#jsbb-pwlist-tbody').html(html);
                }
            });
        }

        // 個別パスワード生成/再生成
        $(document).on('click', '.jsbb-pw-gen, .jsbb-pw-regen', function() {
            var $btn = $(this);
            var teamId = $btn.data('id');
            $btn.prop('disabled', true).text('...');
            $.ajax({
                url: wpApiBase + '/team-password/' + teamId,
                method: 'POST',
                beforeSend: function(xhr) { xhr.setRequestHeader('X-WP-Nonce', '<?php echo wp_create_nonce('wp_rest'); ?>'); },
                success: function(res) {
                    var $row = $btn.closest('tr');
                    $row.find('.jsbb-pw-val').html(res.password);
                    $btn.replaceWith('<button type="button" class="button button-small jsbb-pw-regen" data-id="' + teamId + '">再生成</button>');
                },
                error: function() {
                    $btn.prop('disabled', false).text('エラー');
                }
            });
        });

        // 未設定すべてにパスワード生成
        $('#jsbb-pwlist-generate-all').on('click', function() {
            var $btns = $('.jsbb-pw-gen');
            if ($btns.length === 0) {
                $('#jsbb-pwlist-status').text('未設定のチームはありません');
                setTimeout(function() { $('#jsbb-pwlist-status').text(''); }, 2000);
                return;
            }
            if (!confirm($btns.length + '件のチームにパスワードを生成しますか？')) return;
            var done = 0;
            $btns.each(function() {
                $(this).trigger('click');
            });
        });

        // CSVコピー
        $('#jsbb-pwlist-copy-csv').on('click', function() {
            var lines = ['ID,チーム名,支部,パスワード,編集URL'];
            $('#jsbb-pwlist-tbody tr').each(function() {
                var $tds = $(this).find('td');
                if ($tds.length < 5) return;
                var id = $tds.eq(0).text();
                var name = $tds.eq(1).text();
                var branch = $tds.eq(2).text();
                var pw = $tds.eq(3).text().trim();
                if (pw === '未設定') pw = '';
                var url = frontUrl + '/teams/edit/' + id;
                lines.push('"' + id + '","' + name.replace(/"/g, '""') + '","' + branch.replace(/"/g, '""') + '","' + pw + '","' + url + '"');
            });
            var csv = lines.join('\n');
            navigator.clipboard.writeText(csv).then(function() {
                $('#jsbb-pwlist-status').text('CSVをコピーしました');
                setTimeout(function() { $('#jsbb-pwlist-status').text(''); }, 2000);
            });
        });
    })();
    <?php endif; ?>

    });
    </script>
    <?php
}

// チーム全パスワード一覧AJAX取得（admin/openのみ）
add_action('wp_ajax_jsbb_get_all_team_passwords', function() {
    check_ajax_referer('jsbb_all_team_passwords');
    $user = wp_get_current_user();
    if (!in_array($user->user_login, array('open', 'admin'), true)) {
        wp_send_json_error(array('message' => '権限がありません'));
    }

    $teams = get_posts(array(
        'post_type' => 'team',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'orderby' => 'title',
        'order' => 'ASC',
    ));

    $result = array();
    foreach ($teams as $t) {
        $password = get_post_meta($t->ID, '_team_edit_password', true);
        $branch_id = get_post_meta($t->ID, '_team_branch_id', true);
        $branch_name = $branch_id ? get_the_title($branch_id) : '';

        $result[] = array(
            'id' => $t->ID,
            'name' => $t->post_title,
            'branch' => $branch_name,
            'password' => $password ?: '',
        );
    }

    wp_send_json_success($result);
});

// チームパスワードAJAX取得（管理画面用）
add_action('wp_ajax_jsbb_get_team_password', function() {
    check_ajax_referer('jsbb_team_password');
    if (!current_user_can('edit_posts')) wp_send_json_error(array('message' => '権限がありません'));
    $team_id = intval($_POST['team_id'] ?? 0);
    if (!$team_id) wp_send_json_error(array('message' => 'IDが不正です'));
    $password = get_post_meta($team_id, '_team_edit_password', true);
    wp_send_json_success(array('password' => $password ?: ''));
});
