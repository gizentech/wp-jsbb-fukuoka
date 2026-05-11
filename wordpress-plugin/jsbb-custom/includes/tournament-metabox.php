<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 大会管理: メタボックス
// ==========================================
function jsbb_add_tournament_meta_boxes() {
    // 年度大会
    add_meta_box('tournament_info', '大会情報', 'jsbb_tournament_info_box', 'tournament', 'normal', 'high');
    // 試合
    add_meta_box('match_info', '試合情報', 'jsbb_match_info_box', 'match', 'normal', 'high');
    add_meta_box('match_scores', 'ランニングスコア', 'jsbb_match_scores_box', 'match', 'normal', 'high');
    // 支部
    add_meta_box('branch_info', '支部情報', 'jsbb_branch_info_box', 'branch', 'normal', 'high');
    // チーム
    add_meta_box('team_info', 'チーム情報', 'jsbb_team_info_box', 'team', 'normal', 'high');
    // トーナメント表
    add_meta_box('bracket_info', 'トーナメント表情報', 'jsbb_bracket_info_box', 'tournament_bracket', 'normal', 'high');
    // トーナメント試合データ（インライン入力）
    add_meta_box('bracket_matches', '試合データ（インライン入力）', 'jsbb_bracket_matches_box', 'tournament_bracket', 'normal', 'default');
}
add_action('add_meta_boxes', 'jsbb_add_tournament_meta_boxes');

// ブラケットエディタJS/CSSを管理画面でエンキュー
function jsbb_enqueue_bracket_editor_assets($hook) {
    global $post;
    if (!in_array($hook, array('post.php', 'post-new.php'))) return;
    if (!$post || $post->post_type !== 'tournament_bracket') return;

    wp_enqueue_script(
        'jsbb-bracket-editor',
        JSBB_PLUGIN_URL . 'assets/bracket-editor.js',
        array('jquery'),
        '1.0.0',
        true
    );
}
add_action('admin_enqueue_scripts', 'jsbb_enqueue_bracket_editor_assets');

// --- 年度大会 メタボックス ---
function jsbb_tournament_info_box($post) {
    wp_nonce_field('jsbb_tournament_meta', 'jsbb_tournament_nonce');

    $series_id = get_post_meta($post->ID, '_tournament_series_id', true);
    $year = get_post_meta($post->ID, '_tournament_year', true);
    $number = get_post_meta($post->ID, '_tournament_number', true);
    $term = get_post_meta($post->ID, '_tournament_term', true);
    $tournament_pdfs = get_post_meta($post->ID, '_tournament_pdfs', true);
    $pdf_ids = is_string($tournament_pdfs) ? json_decode($tournament_pdfs, true) : (is_array($tournament_pdfs) ? $tournament_pdfs : array());
    if (!is_array($pdf_ids)) $pdf_ids = array();
    $organizer = get_post_meta($post->ID, '_tournament_organizer', true);
    $co_organizer = get_post_meta($post->ID, '_tournament_co_organizer', true);
    $supervisor = get_post_meta($post->ID, '_tournament_supervisor', true);
    $special_sponsor = get_post_meta($post->ID, '_tournament_special_sponsor', true);
    $supporter = get_post_meta($post->ID, '_tournament_supporter', true);
    $official_ball = get_post_meta($post->ID, '_tournament_official_ball', true);
    $start_date = get_post_meta($post->ID, '_tournament_start_date', true);
    $end_date = get_post_meta($post->ID, '_tournament_end_date', true);
    $participating_teams = get_post_meta($post->ID, '_tournament_participating_teams', true);

    $series_list = get_posts(array('post_type' => 'tournament_series', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish'));
    $selected_teams = is_array($participating_teams) ? $participating_teams : (is_string($participating_teams) ? json_decode($participating_teams, true) : array());
    if (!is_array($selected_teams)) $selected_teams = array();

    // 大会のteam_classタクソノミーからクラスを取得
    $tournament_class_terms = wp_get_post_terms($post->ID, 'team_class', array('fields' => 'ids'));
    $team_query_args = array('post_type' => 'team', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish');
    if (!empty($tournament_class_terms) && !is_wp_error($tournament_class_terms)) {
        $team_query_args['tax_query'] = array(array(
            'taxonomy' => 'team_class',
            'field' => 'term_id',
            'terms' => $tournament_class_terms,
        ));
    }
    $teams_list = get_posts($team_query_args);

    // 支部ごとにグループ化
    $branches_list = get_posts(array('post_type' => 'branch', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish'));
    $branch_map = array();
    foreach ($branches_list as $b) {
        $branch_map[$b->ID] = $b->post_title;
    }
    $teams_by_branch = array();
    $teams_no_branch = array();
    foreach ($teams_list as $t) {
        $bid = get_post_meta($t->ID, '_team_branch_id', true);
        if ($bid && isset($branch_map[intval($bid)])) {
            $teams_by_branch[intval($bid)][] = $t;
        } else {
            $teams_no_branch[] = $t;
        }
    }
    ?>
    <table class="form-table">
        <tr><th><label>大会シリーズ <span style="color:red">*</span></label></th><td>
            <select name="tournament_series_id" style="width:100%">
                <option value="">-- 選択 --</option>
                <?php foreach ($series_list as $s): ?>
                    <option value="<?php echo $s->ID; ?>" <?php selected($series_id, $s->ID); ?>><?php echo esc_html($s->post_title); ?></option>
                <?php endforeach; ?>
            </select>
        </td></tr>
        <tr><th><label>年度 <span style="color:red">*</span></label></th><td>
            <input type="number" name="tournament_year" value="<?php echo esc_attr($year); ?>" min="1900" max="2100" style="width:120px">
        </td></tr>
        <tr><th><label>回数</label></th><td>
            <input type="number" name="tournament_number" value="<?php echo esc_attr($number); ?>" min="1" style="width:120px">
        </td></tr>
        <tr><th><label>期間名称</label></th><td>
            <input type="text" name="tournament_term" value="<?php echo esc_attr($term); ?>" style="width:100%" placeholder="例：春季、秋季">
        </td></tr>
        <tr><th><label>主催</label></th><td>
            <textarea name="tournament_organizer" rows="2" style="width:100%"><?php echo esc_textarea($organizer); ?></textarea>
        </td></tr>
        <tr><th><label>共催</label></th><td>
            <textarea name="tournament_co_organizer" rows="2" style="width:100%"><?php echo esc_textarea($co_organizer); ?></textarea>
        </td></tr>
        <tr><th><label>後援</label></th><td>
            <textarea name="tournament_supervisor" rows="2" style="width:100%"><?php echo esc_textarea($supervisor); ?></textarea>
        </td></tr>
        <tr><th><label>特別協賛</label></th><td>
            <textarea name="tournament_special_sponsor" rows="2" style="width:100%"><?php echo esc_textarea($special_sponsor); ?></textarea>
        </td></tr>
        <tr><th><label>協力</label></th><td>
            <textarea name="tournament_supporter" rows="2" style="width:100%"><?php echo esc_textarea($supporter); ?></textarea>
        </td></tr>
        <tr><th><label>使用球</label></th><td>
            <input type="text" name="tournament_official_ball" value="<?php echo esc_attr($official_ball); ?>" style="width:100%">
        </td></tr>
        <tr><th><label>開始日</label></th><td>
            <input type="date" name="tournament_start_date" value="<?php echo esc_attr($start_date); ?>">
        </td></tr>
        <tr><th><label>終了日</label></th><td>
            <input type="date" name="tournament_end_date" value="<?php echo esc_attr($end_date); ?>">
        </td></tr>
        <tr><th><label>PDF ファイル</label></th><td>
            <div id="jsbb-tournament-pdf-list">
                <?php foreach ($pdf_ids as $pid):
                    $pdf_url = wp_get_attachment_url(intval($pid));
                    $pdf_filename = $pdf_url ? basename($pdf_url) : 'PDF';
                    $thumb_url = wp_get_attachment_image_url(intval($pid), 'medium');
                ?>
                <div class="jsbb-tournament-pdf-item" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px 8px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;">
                    <?php if ($thumb_url): ?>
                        <img src="<?php echo esc_url($thumb_url); ?>" style="width:60px;height:auto;border:1px solid #ccc;" />
                    <?php endif; ?>
                    <input type="hidden" name="tournament_pdfs[]" value="<?php echo intval($pid); ?>" />
                    <a href="<?php echo esc_url($pdf_url); ?>" target="_blank" style="flex:1;word-break:break-all;"><?php echo esc_html(urldecode($pdf_filename)); ?></a>
                    <button type="button" class="button jsbb-tournament-pdf-remove" style="color:#b32d2e;">削除</button>
                </div>
                <?php endforeach; ?>
            </div>
            <button type="button" class="button" id="jsbb-tournament-pdf-add">PDFを追加</button>
            <p class="description">大会関連PDFファイルをアップロードできます（複数可）</p>
            <script>
            jQuery(document).ready(function($) {
                $('#jsbb-tournament-pdf-add').on('click', function(e) {
                    e.preventDefault();
                    var frame = wp.media({
                        title: 'PDFファイルを選択',
                        library: { type: 'application/pdf' },
                        multiple: true,
                        button: { text: '選択' }
                    });
                    frame.on('select', function() {
                        var attachments = frame.state().get('selection').toJSON();
                        attachments.forEach(function(att) {
                            var thumbHtml = '';
                            if (att.icon) {
                                thumbHtml = '<img src="' + att.icon + '" style="width:40px;height:auto;" />';
                            }
                            var html = '<div class="jsbb-tournament-pdf-item" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px 8px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;">'
                                + thumbHtml
                                + '<input type="hidden" name="tournament_pdfs[]" value="' + att.id + '" />'
                                + '<a href="' + att.url + '" target="_blank" style="flex:1;word-break:break-all;">' + att.filename + '</a>'
                                + '<button type="button" class="button jsbb-tournament-pdf-remove" style="color:#b32d2e;">削除</button>'
                                + '</div>';
                            $('#jsbb-tournament-pdf-list').append(html);
                        });
                    });
                    frame.open();
                });
                $(document).on('click', '.jsbb-tournament-pdf-remove', function() {
                    $(this).closest('.jsbb-tournament-pdf-item').remove();
                });
            });
            </script>
        </td></tr>
        <tr><th><label>出場チーム</label></th><td>
            <?php if (!empty($tournament_class_terms)): ?>
                <p class="description" style="margin-bottom:8px;">大会クラスでフィルタ済み（<?php
                    $class_names = wp_get_post_terms($post->ID, 'team_class', array('fields' => 'names'));
                    echo esc_html(implode(', ', $class_names));
                ?>）</p>
            <?php endif; ?>
            <div style="margin-bottom:8px;">
                <button type="button" class="button" id="jsbb-select-all-teams">全選択</button>
                <button type="button" class="button" id="jsbb-deselect-all-teams">全解除</button>
                <span style="margin-left:10px;color:#666;" id="jsbb-team-count"><?php echo count($selected_teams); ?>件選択中</span>
            </div>
            <div style="max-height:400px;overflow-y:auto;border:1px solid #ddd;padding:0;">
                <?php foreach ($branches_list as $b):
                    if (empty($teams_by_branch[$b->ID])) continue;
                    $branch_teams = $teams_by_branch[$b->ID];
                    $branch_selected = 0;
                    foreach ($branch_teams as $t) {
                        if (in_array($t->ID, $selected_teams)) $branch_selected++;
                    }
                ?>
                    <div class="jsbb-branch-group" style="border-bottom:1px solid #eee;">
                        <div class="jsbb-branch-header" style="background:#f0f0f1;padding:8px 10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;" data-branch="<?php echo $b->ID; ?>">
                            <span>
                                <strong><?php echo esc_html($b->post_title); ?></strong>
                                <span style="color:#666;font-size:12px;margin-left:5px;">（<?php echo count($branch_teams); ?>チーム / <span class="jsbb-branch-selected"><?php echo $branch_selected; ?></span>件選択）</span>
                            </span>
                            <span class="jsbb-toggle-icon" style="font-size:18px;">▶</span>
                        </div>
                        <div class="jsbb-branch-teams" style="display:none;padding:5px 10px 5px 25px;">
                            <label style="display:block;margin:2px 0;color:#0073aa;font-weight:bold;cursor:pointer;">
                                <input type="checkbox" class="jsbb-branch-all" data-branch="<?php echo $b->ID; ?>"> この支部を全選択
                            </label>
                            <?php foreach ($branch_teams as $t): ?>
                                <label style="display:block;margin:2px 0;">
                                    <input type="checkbox" name="tournament_participating_teams[]" value="<?php echo $t->ID; ?>" class="jsbb-team-cb" data-branch="<?php echo $b->ID; ?>" <?php checked(in_array($t->ID, $selected_teams)); ?>>
                                    <?php echo esc_html($t->post_title); ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
                <?php if (!empty($teams_no_branch)): ?>
                    <div class="jsbb-branch-group" style="border-bottom:1px solid #eee;">
                        <div class="jsbb-branch-header" style="background:#f0f0f1;padding:8px 10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;" data-branch="none">
                            <span><strong>支部未設定</strong> <span style="color:#666;font-size:12px;margin-left:5px;">（<?php echo count($teams_no_branch); ?>チーム）</span></span>
                            <span class="jsbb-toggle-icon" style="font-size:18px;">▶</span>
                        </div>
                        <div class="jsbb-branch-teams" style="display:none;padding:5px 10px 5px 25px;">
                            <?php foreach ($teams_no_branch as $t): ?>
                                <label style="display:block;margin:2px 0;">
                                    <input type="checkbox" name="tournament_participating_teams[]" value="<?php echo $t->ID; ?>" class="jsbb-team-cb" <?php checked(in_array($t->ID, $selected_teams)); ?>>
                                    <?php echo esc_html($t->post_title); ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
                <?php if (empty($teams_list)): ?>
                    <p style="color:#999;padding:10px;">チームが登録されていません。大会にクラスを設定してから保存してください。</p>
                <?php endif; ?>
            </div>
            <script>
            jQuery(document).ready(function($) {
                // アコーディオン開閉
                $(document).on('click', '.jsbb-branch-header', function() {
                    var $teams = $(this).next('.jsbb-branch-teams');
                    var $icon = $(this).find('.jsbb-toggle-icon');
                    $teams.slideToggle(150);
                    $icon.text($teams.is(':visible') ? '▶' : '▼');
                });

                function updateCount() {
                    var total = $('.jsbb-team-cb:checked').length;
                    $('#jsbb-team-count').text(total + '件選択中');
                    // 各支部の選択数更新
                    $('.jsbb-branch-group').each(function() {
                        var bid = $(this).find('.jsbb-branch-header').data('branch');
                        var sel = $(this).find('.jsbb-team-cb:checked').length;
                        $(this).find('.jsbb-branch-selected').text(sel);
                    });
                }

                // 支部全選択チェックボックス
                $(document).on('change', '.jsbb-branch-all', function() {
                    var bid = $(this).data('branch');
                    var checked = $(this).prop('checked');
                    $('.jsbb-team-cb[data-branch="' + bid + '"]').prop('checked', checked);
                    updateCount();
                });

                // 個別チェック変更時
                $(document).on('change', '.jsbb-team-cb', function() {
                    updateCount();
                });

                // 全選択・全解除
                $('#jsbb-select-all-teams').on('click', function() {
                    $('.jsbb-team-cb').prop('checked', true);
                    $('.jsbb-branch-all').prop('checked', true);
                    updateCount();
                });
                $('#jsbb-deselect-all-teams').on('click', function() {
                    $('.jsbb-team-cb').prop('checked', false);
                    $('.jsbb-branch-all').prop('checked', false);
                    updateCount();
                });
            });
            </script>
        </td></tr>
    </table>
    <?php
}

// --- 試合 メタボックス（基本情報） ---
function jsbb_match_info_box($post) {
    wp_nonce_field('jsbb_match_meta', 'jsbb_match_nonce');

    $tournament_id = get_post_meta($post->ID, '_match_tournament_id', true);
    $match_date = get_post_meta($post->ID, '_match_date', true);
    $venue = get_post_meta($post->ID, '_match_venue', true);
    $round = get_post_meta($post->ID, '_match_round', true);
    $home_team_id = get_post_meta($post->ID, '_match_home_team_id', true);
    $away_team_id = get_post_meta($post->ID, '_match_away_team_id', true);
    $manual_status = get_post_meta($post->ID, '_match_manual_status', true);

    $tournaments = get_posts(array('post_type' => 'tournament', 'posts_per_page' => -1, 'orderby' => 'date', 'order' => 'DESC', 'post_status' => 'publish'));
    $teams = get_posts(array('post_type' => 'team', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish'));
    ?>
    <table class="form-table">
        <tr><th><label>所属大会 <span style="color:red">*</span></label></th><td>
            <select name="match_tournament_id" style="width:100%">
                <option value="">-- 選択 --</option>
                <?php foreach ($tournaments as $t): ?>
                    <option value="<?php echo $t->ID; ?>" <?php selected($tournament_id, $t->ID); ?>><?php echo esc_html($t->post_title); ?></option>
                <?php endforeach; ?>
            </select>
        </td></tr>
        <tr><th><label>試合日時</label></th><td>
            <input type="datetime-local" name="match_date" value="<?php echo esc_attr($match_date); ?>">
        </td></tr>
        <tr><th><label>会場</label></th><td>
            <input type="text" name="match_venue" value="<?php echo esc_attr($venue); ?>" style="width:100%">
        </td></tr>
        <tr><th><label>ラウンド</label></th><td>
            <input type="text" name="match_round" value="<?php echo esc_attr($round); ?>" style="width:100%" placeholder="例：1回戦、準決勝、決勝">
        </td></tr>
        <tr><th><label>ホームチーム <span style="color:red">*</span></label></th><td>
            <select name="match_home_team_id" style="width:100%">
                <option value="">-- 選択 --</option>
                <?php foreach ($teams as $t): ?>
                    <option value="<?php echo $t->ID; ?>" <?php selected($home_team_id, $t->ID); ?>><?php echo esc_html($t->post_title); ?></option>
                <?php endforeach; ?>
            </select>
        </td></tr>
        <tr><th><label>アウェイチーム <span style="color:red">*</span></label></th><td>
            <select name="match_away_team_id" style="width:100%">
                <option value="">-- 選択 --</option>
                <?php foreach ($teams as $t): ?>
                    <option value="<?php echo $t->ID; ?>" <?php selected($away_team_id, $t->ID); ?>><?php echo esc_html($t->post_title); ?></option>
                <?php endforeach; ?>
            </select>
        </td></tr>
        <tr><th><label>手動ステータス</label></th><td>
            <select name="match_manual_status">
                <option value="" <?php selected($manual_status, ''); ?>>未設定（自動判定）</option>
                <option value="試合終了" <?php selected($manual_status, '試合終了'); ?>>試合終了</option>
                <option value="コールド" <?php selected($manual_status, 'コールド'); ?>>コールド</option>
                <option value="中止" <?php selected($manual_status, '中止'); ?>>中止</option>
            </select>
        </td></tr>
    </table>
    <?php
}

// --- 試合 ランニングスコア メタボックス ---
function jsbb_match_scores_box($post) {
    $inning_scores = get_post_meta($post->ID, '_match_inning_scores', true);
    $home_total = get_post_meta($post->ID, '_match_home_total', true);
    $away_total = get_post_meta($post->ID, '_match_away_total', true);

    $scores = array();
    if ($inning_scores) {
        $scores = json_decode($inning_scores, true);
    }
    if (!is_array($scores)) $scores = array();

    $num_innings = max(count($scores), 9);
    ?>
    <style>
        .jsbb-score-table { border-collapse: collapse; width: 100%; }
        .jsbb-score-table th, .jsbb-score-table td { border: 1px solid #ccc; padding: 4px; text-align: center; }
        .jsbb-score-table th { background: #f5f5f5; }
        .jsbb-score-table input[type="text"] { width: 40px; text-align: center; border: 1px solid #ddd; padding: 4px; }
        .jsbb-score-table .total-cell { background: #fff3e0; font-weight: bold; font-size: 16px; }
        .jsbb-score-table .team-cell { text-align: left; padding-left: 8px; font-weight: bold; background: #fafafa; min-width: 80px; }
    </style>
    <p><strong>初期9回、最大20回。各セル: 半角数字 or "x"（サヨナラ）</strong></p>
    <div style="overflow-x:auto;">
        <table class="jsbb-score-table" id="jsbb-inning-table">
            <thead>
                <tr>
                    <th class="team-cell">チーム</th>
                    <?php for ($i = 1; $i <= $num_innings; $i++): ?>
                        <th><?php echo $i; ?></th>
                    <?php endfor; ?>
                    <th style="background:#c8102e;color:#fff;">計</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="team-cell">先攻（Away）</td>
                    <?php for ($i = 0; $i < $num_innings; $i++): ?>
                        <td><input type="text" name="inning_away[]" value="<?php echo esc_attr(isset($scores[$i]) ? $scores[$i]['away'] : ''); ?>" maxlength="2" class="jsbb-inning-input"></td>
                    <?php endfor; ?>
                    <td class="total-cell" id="jsbb-away-total"><?php echo esc_html($away_total ?: '0'); ?></td>
                </tr>
                <tr>
                    <td class="team-cell">後攻（Home）</td>
                    <?php for ($i = 0; $i < $num_innings; $i++): ?>
                        <td><input type="text" name="inning_home[]" value="<?php echo esc_attr(isset($scores[$i]) ? $scores[$i]['home'] : ''); ?>" maxlength="2" class="jsbb-inning-input"></td>
                    <?php endfor; ?>
                    <td class="total-cell" id="jsbb-home-total"><?php echo esc_html($home_total ?: '0'); ?></td>
                </tr>
            </tbody>
        </table>
    </div>
    <p>
        <button type="button" class="button" id="jsbb-add-inning">回を追加</button>
        <button type="button" class="button" id="jsbb-remove-inning">回を削除</button>
        <span id="jsbb-inning-count" style="margin-left:10px;">現在: <?php echo $num_innings; ?>回</span>
    </p>
    <input type="hidden" name="match_inning_scores" id="jsbb-inning-json" value="<?php echo esc_attr($inning_scores); ?>">
    <input type="hidden" name="match_home_total" id="jsbb-home-total-hidden" value="<?php echo esc_attr($home_total); ?>">
    <input type="hidden" name="match_away_total" id="jsbb-away-total-hidden" value="<?php echo esc_attr($away_total); ?>">

    <script>
    jQuery(document).ready(function($) {
        var maxInnings = 20;

        function recalculate() {
            var homeTotal = 0, awayTotal = 0;
            var scores = [];
            var homeInputs = $('input[name="inning_home[]"]');
            var awayInputs = $('input[name="inning_away[]"]');
            var len = homeInputs.length;

            for (var i = 0; i < len; i++) {
                var hVal = homeInputs.eq(i).val().trim();
                var aVal = awayInputs.eq(i).val().trim();

                if (hVal !== '' || aVal !== '') {
                    var hNum = parseInt(hVal.replace(/x/gi, ''), 10);
                    var aNum = parseInt(aVal.replace(/x/gi, ''), 10);
                    if (!isNaN(hNum)) homeTotal += hNum;
                    if (!isNaN(aNum)) awayTotal += aNum;
                }

                scores.push({ inning: i + 1, home: hVal, away: aVal });
            }

            $('#jsbb-home-total').text(homeTotal);
            $('#jsbb-away-total').text(awayTotal);
            $('#jsbb-home-total-hidden').val(homeTotal);
            $('#jsbb-away-total-hidden').val(awayTotal);
            $('#jsbb-inning-json').val(JSON.stringify(scores));
        }

        $(document).on('input', '.jsbb-inning-input', recalculate);

        $('#jsbb-add-inning').on('click', function() {
            var current = $('input[name="inning_home[]"]').length;
            if (current >= maxInnings) {
                alert('最大' + maxInnings + '回までです');
                return;
            }
            var newNum = current + 1;
            var headerRow = $('#jsbb-inning-table thead tr');
            var totalTh = headerRow.find('th:last');
            $('<th>' + newNum + '</th>').insertBefore(totalTh);

            var awayRow = $('#jsbb-inning-table tbody tr:first');
            var awayTotal = awayRow.find('td:last');
            $('<td><input type="text" name="inning_away[]" value="" maxlength="2" class="jsbb-inning-input"></td>').insertBefore(awayTotal);

            var homeRow = $('#jsbb-inning-table tbody tr:last');
            var homeTotal = homeRow.find('td:last');
            $('<td><input type="text" name="inning_home[]" value="" maxlength="2" class="jsbb-inning-input"></td>').insertBefore(homeTotal);

            $('#jsbb-inning-count').text('現在: ' + newNum + '回');
            recalculate();
        });

        $('#jsbb-remove-inning').on('click', function() {
            var current = $('input[name="inning_home[]"]').length;
            if (current <= 9) {
                alert('9回未満にはできません');
                return;
            }
            var headerRow = $('#jsbb-inning-table thead tr');
            headerRow.find('th').eq(-2).remove();

            var awayRow = $('#jsbb-inning-table tbody tr:first');
            awayRow.find('td').eq(-2).remove();

            var homeRow = $('#jsbb-inning-table tbody tr:last');
            homeRow.find('td').eq(-2).remove();

            $('#jsbb-inning-count').text('現在: ' + (current - 1) + '回');
            recalculate();
        });

        // フォーム送信前にJSON更新
        $('form#post').on('submit', function() {
            recalculate();
        });
    });
    </script>
    <?php
}

// --- 支部 メタボックス ---
function jsbb_branch_info_box($post) {
    wp_nonce_field('jsbb_branch_meta', 'jsbb_branch_nonce');
    $address = get_post_meta($post->ID, '_branch_address', true);
    $contact_name = get_post_meta($post->ID, '_branch_contact_name', true);
    $contact_phone = get_post_meta($post->ID, '_branch_contact_phone', true);
    ?>
    <table class="form-table">
        <tr><th><label>住所</label></th><td>
            <textarea name="branch_address" rows="2" style="width:100%"><?php echo esc_textarea($address); ?></textarea>
        </td></tr>
        <tr><th><label>担当者名</label></th><td>
            <input type="text" name="branch_contact_name" value="<?php echo esc_attr($contact_name); ?>" style="width:100%">
        </td></tr>
        <tr><th><label>電話番号</label></th><td>
            <input type="text" name="branch_contact_phone" value="<?php echo esc_attr($contact_phone); ?>" style="width:100%">
        </td></tr>
    </table>
    <?php
}

// --- チーム メタボックス ---
function jsbb_team_info_box($post) {
    wp_nonce_field('jsbb_team_meta', 'jsbb_team_nonce');
    $branch_id = get_post_meta($post->ID, '_team_branch_id', true);
    $founded_year = get_post_meta($post->ID, '_team_founded_year', true);
    $contact_name = get_post_meta($post->ID, '_team_contact_name', true);
    $contact_phone = get_post_meta($post->ID, '_team_contact_phone', true);
    $external_id = get_post_meta($post->ID, '_team_external_id', true);
    $status = get_post_meta($post->ID, '_team_status', true);
    $ball_type = get_post_meta($post->ID, '_team_ball_type', true);
    $team_type = get_post_meta($post->ID, '_team_type', true);
    $school_type = get_post_meta($post->ID, '_team_school_type', true);
    $city = get_post_meta($post->ID, '_team_city', true);
    $registered_date = get_post_meta($post->ID, '_team_registered_date', true);
    $suspension_date = get_post_meta($post->ID, '_team_suspension_date', true);
    $resumption_date = get_post_meta($post->ID, '_team_resumption_date', true);
    $withdrawal_date = get_post_meta($post->ID, '_team_withdrawal_date', true);

    $branches = get_posts(array('post_type' => 'branch', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish'));
    ?>
    <table class="form-table">
        <tr><th><label>チームID</label></th><td>
            <input type="text" name="team_external_id" value="<?php echo esc_attr($external_id); ?>" style="width:120px" readonly>
            <p class="description">外部システムのID（自動設定）</p>
        </td></tr>
        <tr><th><label>ステータス</label></th><td>
            <select name="team_status" style="width:200px">
                <option value="">-- 選択 --</option>
                <option value="活動中" <?php selected($status, '活動中'); ?>>活動中</option>
                <option value="活動休止" <?php selected($status, '活動休止'); ?>>活動休止</option>
                <option value="退会" <?php selected($status, '退会'); ?>>退会</option>
            </select>
        </td></tr>
        <tr><th><label>所属支部</label></th><td>
            <select name="team_branch_id" style="width:100%">
                <option value="">-- 選択 --</option>
                <?php foreach ($branches as $b): ?>
                    <option value="<?php echo $b->ID; ?>" <?php selected($branch_id, $b->ID); ?>><?php echo esc_html($b->post_title); ?></option>
                <?php endforeach; ?>
            </select>
        </td></tr>
        <tr><th><label>ボール種別</label></th><td>
            <select name="team_ball_type" style="width:200px">
                <option value="">-- 選択 --</option>
                <option value="軟式" <?php selected($ball_type, '軟式'); ?>>軟式</option>
                <option value="準硬式" <?php selected($ball_type, '準硬式'); ?>>準硬式</option>
            </select>
        </td></tr>
        <tr><th><label>チーム形態</label></th><td>
            <select name="team_type" style="width:200px">
                <option value="">-- 選択 --</option>
                <option value="企業" <?php selected($team_type, '企業'); ?>>企業</option>
                <option value="クラブチーム" <?php selected($team_type, 'クラブチーム'); ?>>クラブチーム</option>
                <option value="学校" <?php selected($team_type, '学校'); ?>>学校</option>
            </select>
        </td></tr>
        <tr><th><label>学校種別</label></th><td>
            <select name="team_school_type" style="width:200px">
                <option value="">-- 選択 --</option>
                <option value="該当なし" <?php selected($school_type, '該当なし'); ?>>該当なし</option>
                <option value="小学校" <?php selected($school_type, '小学校'); ?>>小学校</option>
                <option value="中学校" <?php selected($school_type, '中学校'); ?>>中学校</option>
                <option value="高校" <?php selected($school_type, '高校'); ?>>高校</option>
            </select>
        </td></tr>
        <tr><th><label>所在市区町村</label></th><td>
            <input type="text" name="team_city" value="<?php echo esc_attr($city); ?>" style="width:100%">
        </td></tr>
        <tr><th><label>設立年</label></th><td>
            <input type="number" name="team_founded_year" value="<?php echo esc_attr($founded_year); ?>" min="1900" max="2100" style="width:120px">
        </td></tr>
        <tr><th><label>代表者名</label></th><td>
            <input type="text" name="team_contact_name" value="<?php echo esc_attr($contact_name); ?>" style="width:100%">
        </td></tr>
        <tr><th><label>電話番号</label></th><td>
            <input type="text" name="team_contact_phone" value="<?php echo esc_attr($contact_phone); ?>" style="width:100%">
        </td></tr>
        <tr><th><label>システム登録日</label></th><td>
            <input type="text" name="team_registered_date" value="<?php echo esc_attr($registered_date); ?>" style="width:200px" placeholder="YYYY/MM/DD">
        </td></tr>
        <tr><th><label>活動休止日</label></th><td>
            <input type="text" name="team_suspension_date" value="<?php echo esc_attr($suspension_date); ?>" style="width:200px" placeholder="YYYY/MM/DD">
        </td></tr>
        <tr><th><label>活動再開日</label></th><td>
            <input type="text" name="team_resumption_date" value="<?php echo esc_attr($resumption_date); ?>" style="width:200px" placeholder="YYYY/MM/DD">
        </td></tr>
        <tr><th><label>退会日</label></th><td>
            <input type="text" name="team_withdrawal_date" value="<?php echo esc_attr($withdrawal_date); ?>" style="width:200px" placeholder="YYYY/MM/DD">
        </td></tr>
    </table>
    <?php
}

// --- トーナメント表 メタボックス ---
function jsbb_bracket_info_box($post) {
    wp_nonce_field('jsbb_bracket_meta', 'jsbb_bracket_nonce');

    $series_id = get_post_meta($post->ID, '_bracket_series_id', true);
    $year = get_post_meta($post->ID, '_bracket_year', true);
    if (!$year) $year = date('Y');
    $number = get_post_meta($post->ID, '_bracket_number', true);
    $name1 = get_post_meta($post->ID, '_bracket_name1', true);
    $name2 = get_post_meta($post->ID, '_bracket_name2', true);
    $name3 = get_post_meta($post->ID, '_bracket_name3', true);
    $abbreviation = get_post_meta($post->ID, '_bracket_abbreviation', true);
    $bracket_teams = get_post_meta($post->ID, '_bracket_teams', true);
    $bracket_pdfs = get_post_meta($post->ID, '_bracket_pdfs', true);
    $pdf_ids = is_string($bracket_pdfs) ? json_decode($bracket_pdfs, true) : (is_array($bracket_pdfs) ? $bracket_pdfs : array());
    if (!is_array($pdf_ids)) $pdf_ids = array();

    $series_list = get_posts(array('post_type' => 'tournament_series', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish'));
    $selected_teams = is_array($bracket_teams) ? $bracket_teams : (is_string($bracket_teams) ? json_decode($bracket_teams, true) : array());
    if (!is_array($selected_teams)) $selected_teams = array();

    // 大会シリーズのteam_classを取得してチームをフィルタ
    $series_class_terms = array();
    if ($series_id) {
        $series_class_terms = wp_get_post_terms(intval($series_id), 'team_class', array('fields' => 'ids'));
        if (is_wp_error($series_class_terms)) $series_class_terms = array();
    }
    // フォールバック: トーナメント表自体のteam_classも確認
    if (empty($series_class_terms)) {
        $own_class_terms = wp_get_post_terms($post->ID, 'team_class', array('fields' => 'ids'));
        if (!is_wp_error($own_class_terms)) $series_class_terms = $own_class_terms;
    }

    $team_query_args = array('post_type' => 'team', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish');
    if (!empty($series_class_terms)) {
        $team_query_args['tax_query'] = array(array(
            'taxonomy' => 'team_class',
            'field' => 'term_id',
            'terms' => $series_class_terms,
        ));
    }
    $teams_list = get_posts($team_query_args);

    // 支部ごとにグループ化
    $branches_list = get_posts(array('post_type' => 'branch', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC', 'post_status' => 'publish'));
    $branch_map = array();
    foreach ($branches_list as $b) {
        $branch_map[$b->ID] = $b->post_title;
    }
    $teams_by_branch = array();
    $teams_no_branch = array();
    foreach ($teams_list as $t) {
        $bid = get_post_meta($t->ID, '_team_branch_id', true);
        if ($bid && isset($branch_map[intval($bid)])) {
            $teams_by_branch[intval($bid)][] = $t;
        } else {
            $teams_no_branch[] = $t;
        }
    }

    // 大会シリーズごとのカテゴリー情報をJSON化（JavaScript用）
    $series_categories = array();
    foreach ($series_list as $s) {
        $cats = wp_get_post_terms($s->ID, 'team_class', array('fields' => 'names'));
        $series_categories[$s->ID] = is_array($cats) ? $cats : array();
    }
    ?>
    <table class="form-table">
        <tr><th><label>大会シリーズ <span style="color:red">*</span></label></th><td>
            <select name="bracket_series_id" id="jsbb-bracket-series" style="width:100%">
                <option value="">-- 選択 --</option>
                <?php foreach ($series_list as $s): ?>
                    <option value="<?php echo $s->ID; ?>" <?php selected($series_id, $s->ID); ?>><?php echo esc_html($s->post_title); ?></option>
                <?php endforeach; ?>
            </select>
            <p class="description" id="jsbb-bracket-category-info" style="margin-top:5px;">
                <?php if ($series_id && !empty($series_class_terms)):
                    $class_names = wp_get_post_terms(intval($series_id), 'team_class', array('fields' => 'names'));
                    if (!is_wp_error($class_names) && !empty($class_names)):
                ?>
                    カテゴリー: <?php echo esc_html(implode(', ', $class_names)); ?>
                <?php endif; endif; ?>
            </p>
        </td></tr>
        <tr><th><label>年度 <span style="color:red">*</span></label></th><td>
            <input type="number" name="bracket_year" value="<?php echo esc_attr($year); ?>" min="1900" max="2100" style="width:120px">
        </td></tr>
        <tr><th><label>大会回数</label></th><td>
            <input type="number" name="bracket_number" value="<?php echo esc_attr($number); ?>" min="1" style="width:120px">
            <p class="description">空の場合は年度が使用されます</p>
        </td></tr>
        <tr><th><label>大会名1 <span style="color:red">*</span></label></th><td>
            <input type="text" name="bracket_name1" value="<?php echo esc_attr($name1); ?>" style="width:100%" placeholder="大会名（必須）">
        </td></tr>
        <tr><th><label>大会名2</label></th><td>
            <input type="text" name="bracket_name2" value="<?php echo esc_attr($name2); ?>" style="width:100%" placeholder="2行目の大会名（任意）">
        </td></tr>
        <tr><th><label>大会名3</label></th><td>
            <input type="text" name="bracket_name3" value="<?php echo esc_attr($name3); ?>" style="width:100%" placeholder="3行目の大会名（任意）">
        </td></tr>
        <tr><th><label>大会略称</label></th><td>
            <input type="text" name="bracket_abbreviation" value="<?php echo esc_attr($abbreviation); ?>" style="width:100%" placeholder="略称（任意）">
        </td></tr>
        <tr><th><label>紐付け大会（試合データ）</label></th><td>
            <?php
            $bracket_tournament_id = get_post_meta($post->ID, '_bracket_tournament_id', true);
            $tournaments_for_bracket = get_posts(array(
                'post_type' => 'tournament',
                'posts_per_page' => -1,
                'orderby' => 'date',
                'order' => 'DESC',
                'post_status' => 'publish',
            ));
            ?>
            <select name="bracket_tournament_id" style="width:100%">
                <option value="">-- 未選択（試合データなし）--</option>
                <?php foreach ($tournaments_for_bracket as $t): ?>
                    <option value="<?php echo $t->ID; ?>" <?php selected($bracket_tournament_id, $t->ID); ?>>
                        <?php echo esc_html($t->post_title); ?>
                    </option>
                <?php endforeach; ?>
            </select>
            <p class="description">このトーナメント表に紐付ける試合データ（年度大会）を選択します。選択すると試合結果がWebに自動反映されます。</p>
        </td></tr>
        <tr><th><label>PDF ファイル</label></th><td>
            <div id="jsbb-bracket-pdf-list">
                <?php foreach ($pdf_ids as $pid):
                    $pdf_url = wp_get_attachment_url(intval($pid));
                    $pdf_filename = $pdf_url ? basename($pdf_url) : 'PDF';
                    $thumb_url = wp_get_attachment_image_url(intval($pid), 'medium');
                ?>
                <div class="jsbb-bracket-pdf-item" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px 8px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;">
                    <?php if ($thumb_url): ?>
                        <img src="<?php echo esc_url($thumb_url); ?>" style="width:60px;height:auto;border:1px solid #ccc;" />
                    <?php endif; ?>
                    <input type="hidden" name="bracket_pdfs[]" value="<?php echo intval($pid); ?>" />
                    <a href="<?php echo esc_url($pdf_url); ?>" target="_blank" style="flex:1;word-break:break-all;"><?php echo esc_html($pdf_filename); ?></a>
                    <button type="button" class="button jsbb-bracket-pdf-remove" style="color:#b32d2e;">削除</button>
                </div>
                <?php endforeach; ?>
            </div>
            <button type="button" class="button" id="jsbb-bracket-pdf-add">PDFを追加</button>
            <p class="description">トーナメント表のPDFファイルをアップロードできます（複数可）</p>
            <script>
            jQuery(document).ready(function($) {
                $('#jsbb-bracket-pdf-add').on('click', function(e) {
                    e.preventDefault();
                    var frame = wp.media({
                        title: 'PDFファイルを選択',
                        library: { type: 'application/pdf' },
                        multiple: true,
                        button: { text: '選択' }
                    });
                    frame.on('select', function() {
                        var attachments = frame.state().get('selection').toJSON();
                        attachments.forEach(function(att) {
                            var thumbHtml = '';
                            if (att.sizes && att.sizes.medium) {
                                thumbHtml = '<img src="' + att.sizes.medium.url + '" style="width:60px;height:auto;border:1px solid #ccc;" />';
                            } else if (att.icon) {
                                thumbHtml = '<img src="' + att.icon + '" style="width:40px;height:auto;" />';
                            }
                            var html = '<div class="jsbb-bracket-pdf-item" style="display:flex;align-items:center;gap:8px;margin-bottom:6px;padding:6px 8px;background:#f9f9f9;border:1px solid #ddd;border-radius:4px;">'
                                + thumbHtml
                                + '<input type="hidden" name="bracket_pdfs[]" value="' + att.id + '" />'
                                + '<a href="' + att.url + '" target="_blank" style="flex:1;word-break:break-all;">' + att.filename + '</a>'
                                + '<button type="button" class="button jsbb-bracket-pdf-remove" style="color:#b32d2e;">削除</button>'
                                + '</div>';
                            $('#jsbb-bracket-pdf-list').append(html);
                        });
                    });
                    frame.open();
                });
                $(document).on('click', '.jsbb-bracket-pdf-remove', function() {
                    $(this).closest('.jsbb-bracket-pdf-item').remove();
                });
            });
            </script>
        </td></tr>
        <tr><th><label>出場チーム</label></th><td>
            <?php if (!empty($series_class_terms)): ?>
                <p class="description" style="margin-bottom:8px;">カテゴリーでフィルタ済み（<?php
                    $class_names = array();
                    foreach ($series_class_terms as $tid) {
                        $term = get_term($tid, 'team_class');
                        if ($term && !is_wp_error($term)) $class_names[] = $term->name;
                    }
                    echo esc_html(implode(', ', $class_names));
                ?>）</p>
            <?php endif; ?>
            <div style="margin-bottom:8px;">
                <button type="button" class="button" id="jsbb-bracket-select-all">全選択</button>
                <button type="button" class="button" id="jsbb-bracket-deselect-all">全解除</button>
                <span style="margin-left:10px;color:#666;" id="jsbb-bracket-team-count"><?php echo count($selected_teams); ?>件選択中</span>
            </div>
            <div style="max-height:400px;overflow-y:auto;border:1px solid #ddd;padding:0;">
                <?php foreach ($branches_list as $b):
                    if (empty($teams_by_branch[$b->ID])) continue;
                    $branch_teams = $teams_by_branch[$b->ID];
                    $branch_selected = 0;
                    foreach ($branch_teams as $t) {
                        if (in_array($t->ID, $selected_teams)) $branch_selected++;
                    }
                ?>
                    <div class="jsbb-bracket-branch-group" style="border-bottom:1px solid #eee;">
                        <div class="jsbb-bracket-branch-header" style="background:#f0f0f1;padding:8px 10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;" data-branch="<?php echo $b->ID; ?>">
                            <span>
                                <strong><?php echo esc_html($b->post_title); ?></strong>
                                <span style="color:#666;font-size:12px;margin-left:5px;">（<?php echo count($branch_teams); ?>チーム / <span class="jsbb-bracket-branch-selected"><?php echo $branch_selected; ?></span>件選択）</span>
                            </span>
                            <span class="jsbb-bracket-toggle-icon" style="font-size:18px;">▶</span>
                        </div>
                        <div class="jsbb-bracket-branch-teams" style="display:none;padding:5px 10px 5px 25px;">
                            <label style="display:block;margin:2px 0;color:#0073aa;font-weight:bold;cursor:pointer;">
                                <input type="checkbox" class="jsbb-bracket-branch-all" data-branch="<?php echo $b->ID; ?>"> この支部を全選択
                            </label>
                            <?php foreach ($branch_teams as $t): ?>
                                <label style="display:block;margin:2px 0;">
                                    <input type="checkbox" name="bracket_teams[]" value="<?php echo $t->ID; ?>" class="jsbb-bracket-team-cb" data-branch="<?php echo $b->ID; ?>" <?php checked(in_array($t->ID, $selected_teams)); ?>>
                                    <?php echo esc_html($t->post_title); ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endforeach; ?>
                <?php if (!empty($teams_no_branch)): ?>
                    <div class="jsbb-bracket-branch-group" style="border-bottom:1px solid #eee;">
                        <div class="jsbb-bracket-branch-header" style="background:#f0f0f1;padding:8px 10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;user-select:none;" data-branch="none">
                            <span><strong>支部未設定</strong> <span style="color:#666;font-size:12px;margin-left:5px;">（<?php echo count($teams_no_branch); ?>チーム）</span></span>
                            <span class="jsbb-bracket-toggle-icon" style="font-size:18px;">▶</span>
                        </div>
                        <div class="jsbb-bracket-branch-teams" style="display:none;padding:5px 10px 5px 25px;">
                            <?php foreach ($teams_no_branch as $t): ?>
                                <label style="display:block;margin:2px 0;">
                                    <input type="checkbox" name="bracket_teams[]" value="<?php echo $t->ID; ?>" class="jsbb-bracket-team-cb" <?php checked(in_array($t->ID, $selected_teams)); ?>>
                                    <?php echo esc_html($t->post_title); ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                    </div>
                <?php endif; ?>
                <?php if (empty($teams_list)): ?>
                    <p style="color:#999;padding:10px;">チームが登録されていません。大会シリーズにカテゴリーを設定してから保存してください。</p>
                <?php endif; ?>
            </div>
            <script>
            jQuery(document).ready(function($) {
                // アコーディオン開閉
                $(document).on('click', '.jsbb-bracket-branch-header', function() {
                    var $teams = $(this).next('.jsbb-bracket-branch-teams');
                    var $icon = $(this).find('.jsbb-bracket-toggle-icon');
                    $teams.slideToggle(150);
                    $icon.text($teams.is(':visible') ? '▶' : '▼');
                });

                function updateBracketCount() {
                    var total = $('.jsbb-bracket-team-cb:checked').length;
                    $('#jsbb-bracket-team-count').text(total + '件選択中');
                    $('.jsbb-bracket-branch-group').each(function() {
                        var sel = $(this).find('.jsbb-bracket-team-cb:checked').length;
                        $(this).find('.jsbb-bracket-branch-selected').text(sel);
                    });
                }

                // 支部全選択
                $(document).on('change', '.jsbb-bracket-branch-all', function() {
                    var bid = $(this).data('branch');
                    var checked = $(this).prop('checked');
                    $('.jsbb-bracket-team-cb[data-branch="' + bid + '"]').prop('checked', checked);
                    updateBracketCount();
                });

                // 個別チェック
                $(document).on('change', '.jsbb-bracket-team-cb', function() {
                    updateBracketCount();
                });

                // 全選択・全解除
                $('#jsbb-bracket-select-all').on('click', function() {
                    $('.jsbb-bracket-team-cb').prop('checked', true);
                    $('.jsbb-bracket-branch-all').prop('checked', true);
                    updateBracketCount();
                });
                $('#jsbb-bracket-deselect-all').on('click', function() {
                    $('.jsbb-bracket-team-cb').prop('checked', false);
                    $('.jsbb-bracket-branch-all').prop('checked', false);
                    updateBracketCount();
                });

                // 大会シリーズ変更時にカテゴリー表示を更新
                var seriesCategories = <?php echo wp_json_encode($series_categories); ?>;
                $('#jsbb-bracket-series').on('change', function() {
                    var sid = $(this).val();
                    var $info = $('#jsbb-bracket-category-info');
                    if (sid && seriesCategories[sid] && seriesCategories[sid].length > 0) {
                        $info.html('カテゴリー: ' + seriesCategories[sid].join(', ') + '<br><span style="color:#d63638;">保存するとチーム一覧がカテゴリーに合わせて更新されます</span>');
                    } else if (sid) {
                        $info.html('<span style="color:#d63638;">この大会シリーズにはカテゴリーが設定されていません</span>');
                    } else {
                        $info.html('');
                    }
                });
            });
            </script>
        </td></tr>
    </table>
    <?php
}

// --- ブラケット試合データ（インライン入力）メタボックス ---
function jsbb_bracket_matches_box($post) {
    $bracket_matches_json = get_post_meta($post->ID, '_bracket_matches', true);
    $bracket_matches = array();
    if ($bracket_matches_json) {
        $bracket_matches = json_decode($bracket_matches_json, true);
        if (!is_array($bracket_matches)) $bracket_matches = array();
    }

    // チーム数を取得（JS用）
    $bracket_teams_json = get_post_meta($post->ID, '_bracket_teams', true);
    $team_ids = is_string($bracket_teams_json) ? json_decode($bracket_teams_json, true) : array();
    if (!is_array($team_ids)) $team_ids = array();
    $team_count = count($team_ids);

    // 紐付け大会が設定されている場合は注意書き
    $bracket_tournament_id = get_post_meta($post->ID, '_bracket_tournament_id', true);
    ?>
    <style>
    #jsbb-bracket-matches-table { border-collapse: collapse; width: 100%; font-size: 13px; }
    #jsbb-bracket-matches-table th { background: #c8102e; color: #fff; padding: 6px 8px; text-align: center; border: 1px solid #a00; white-space: nowrap; }
    #jsbb-bracket-matches-table td { padding: 4px 6px; border: 1px solid #ddd; vertical-align: middle; }
    .jsbb-bm-alt td { background: #fafafa; }
    .jsbb-bm-round { font-weight: bold; font-size: 12px; color: #333; white-space: nowrap; }
    .jsbb-bm-num { text-align: center; color: #666; font-size: 12px; }
    .jsbb-bm-vs { text-align: center; color: #999; font-weight: bold; }
    .jsbb-bm-date { width: 130px; }
    .jsbb-bm-venue { width: 120px; }
    .jsbb-bm-team { width: 140px; }
    .jsbb-bm-score { width: 50px; text-align: center; }
    .jsbb-bm-status { width: 90px; }
    #jsbb-bracket-generate-btn { margin-bottom: 10px; }
    </style>

    <?php if ($bracket_tournament_id): ?>
    <div style="background:#fff3cd;border:1px solid #ffc107;padding:10px 14px;border-radius:4px;margin-bottom:12px;">
        <strong>注意:</strong> 「紐付け大会」が設定されているため、Webサイトでは紐付け大会の試合データが優先されます。ここで入力したデータは紐付け大会が未設定の場合に使用されます。
    </div>
    <?php endif; ?>

    <p>
        <span id="jsbb-bracket-team-count-for-editor" style="margin-right:12px;color:#555;">
            <?php
            $round_count = 0; $cur = $team_count; $total_m = 0;
            while ($cur > 1) { $total_m += floor($cur / 2); $cur = ceil($cur / 2); $round_count++; }
            echo esc_html($team_count . 'チーム（' . $round_count . 'ラウンド / ' . $total_m . '試合）');
            ?>
        </span>
        <button type="button" class="button button-primary" id="jsbb-bracket-generate-btn">ブラケット生成（リセット）</button>
        <span style="color:#666;font-size:12px;margin-left:8px;">※ 出場チームを保存した後に押してください</span>
    </p>

    <input type="hidden" id="jsbb-bracket-team-count-hidden" value="<?php echo esc_attr($team_count); ?>">
    <input type="hidden" name="bracket_matches_json" id="jsbb-bracket-matches-json" value="<?php echo esc_attr($bracket_matches_json ?: ''); ?>">

    <div style="overflow-x:auto;">
        <table id="jsbb-bracket-matches-table">
            <thead>
                <tr>
                    <th>ラウンド</th>
                    <th>#</th>
                    <th>試合日</th>
                    <th>開始時刻</th>
                    <th>会場</th>
                    <th>ホームチーム</th>
                    <th>得点</th>
                    <th></th>
                    <th>得点</th>
                    <th>アウェイチーム</th>
                    <th>ステータス</th>
                </tr>
            </thead>
            <tbody id="jsbb-bracket-matches-tbody">
                <?php if (empty($bracket_matches)): ?>
                <tr><td colspan="10" style="text-align:center;color:#999;padding:20px;">「ブラケット生成」ボタンを押して試合枠を作成してください</td></tr>
                <?php endif; ?>
            </tbody>
        </table>
    </div>
    <?php
}

// ==========================================
// 大会管理: 保存ハンドラ
// ==========================================
function jsbb_save_tournament_meta($post_id) {
    if (!isset($_POST['jsbb_tournament_nonce']) || !wp_verify_nonce($_POST['jsbb_tournament_nonce'], 'jsbb_tournament_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    $fields = array(
        '_tournament_series_id' => 'tournament_series_id',
        '_tournament_year' => 'tournament_year',
        '_tournament_number' => 'tournament_number',
        '_tournament_term' => 'tournament_term',
        '_tournament_organizer' => 'tournament_organizer',
        '_tournament_co_organizer' => 'tournament_co_organizer',
        '_tournament_supervisor' => 'tournament_supervisor',
        '_tournament_special_sponsor' => 'tournament_special_sponsor',
        '_tournament_supporter' => 'tournament_supporter',
        '_tournament_official_ball' => 'tournament_official_ball',
        '_tournament_start_date' => 'tournament_start_date',
        '_tournament_end_date' => 'tournament_end_date',
    );

    foreach ($fields as $meta_key => $post_key) {
        if (isset($_POST[$post_key])) {
            update_post_meta($post_id, $meta_key, sanitize_text_field($_POST[$post_key]));
        }
    }

    // PDFファイル（配列）
    $pdfs = isset($_POST['tournament_pdfs']) ? array_map('intval', $_POST['tournament_pdfs']) : array();
    update_post_meta($post_id, '_tournament_pdfs', wp_json_encode($pdfs));

    // 出場チーム（配列）
    $teams = isset($_POST['tournament_participating_teams']) ? array_map('intval', $_POST['tournament_participating_teams']) : array();
    update_post_meta($post_id, '_tournament_participating_teams', wp_json_encode($teams));

    // タイトル自動生成
    jsbb_auto_generate_tournament_title($post_id);
}
add_action('save_post_tournament', 'jsbb_save_tournament_meta');

function jsbb_save_match_meta($post_id) {
    if (!isset($_POST['jsbb_match_nonce']) || !wp_verify_nonce($_POST['jsbb_match_nonce'], 'jsbb_match_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    $fields = array(
        '_match_tournament_id' => 'match_tournament_id',
        '_match_date' => 'match_date',
        '_match_venue' => 'match_venue',
        '_match_round' => 'match_round',
        '_match_home_team_id' => 'match_home_team_id',
        '_match_away_team_id' => 'match_away_team_id',
        '_match_manual_status' => 'match_manual_status',
    );

    foreach ($fields as $meta_key => $post_key) {
        if (isset($_POST[$post_key])) {
            update_post_meta($post_id, $meta_key, sanitize_text_field($_POST[$post_key]));
        }
    }

    // ランニングスコア
    if (isset($_POST['match_inning_scores'])) {
        $json = wp_unslash($_POST['match_inning_scores']);
        update_post_meta($post_id, '_match_inning_scores', sanitize_text_field($json));
    }

    // 合計スコア自動計算
    jsbb_auto_calculate_scores($post_id);
}
add_action('save_post_match', 'jsbb_save_match_meta');

function jsbb_save_branch_meta($post_id) {
    if (!isset($_POST['jsbb_branch_nonce']) || !wp_verify_nonce($_POST['jsbb_branch_nonce'], 'jsbb_branch_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    update_post_meta($post_id, '_branch_address', sanitize_textarea_field($_POST['branch_address'] ?? ''));
    update_post_meta($post_id, '_branch_contact_name', sanitize_text_field($_POST['branch_contact_name'] ?? ''));
    update_post_meta($post_id, '_branch_contact_phone', sanitize_text_field($_POST['branch_contact_phone'] ?? ''));
}
add_action('save_post_branch', 'jsbb_save_branch_meta');

function jsbb_save_team_meta($post_id) {
    if (!isset($_POST['jsbb_team_nonce']) || !wp_verify_nonce($_POST['jsbb_team_nonce'], 'jsbb_team_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    update_post_meta($post_id, '_team_branch_id', intval($_POST['team_branch_id'] ?? 0));
    update_post_meta($post_id, '_team_founded_year', sanitize_text_field($_POST['team_founded_year'] ?? ''));
    update_post_meta($post_id, '_team_contact_name', sanitize_text_field($_POST['team_contact_name'] ?? ''));
    update_post_meta($post_id, '_team_contact_phone', sanitize_text_field($_POST['team_contact_phone'] ?? ''));
    update_post_meta($post_id, '_team_external_id', sanitize_text_field($_POST['team_external_id'] ?? ''));
    update_post_meta($post_id, '_team_status', sanitize_text_field($_POST['team_status'] ?? ''));
    update_post_meta($post_id, '_team_ball_type', sanitize_text_field($_POST['team_ball_type'] ?? ''));
    update_post_meta($post_id, '_team_type', sanitize_text_field($_POST['team_type'] ?? ''));
    update_post_meta($post_id, '_team_school_type', sanitize_text_field($_POST['team_school_type'] ?? ''));
    update_post_meta($post_id, '_team_city', sanitize_text_field($_POST['team_city'] ?? ''));
    update_post_meta($post_id, '_team_registered_date', sanitize_text_field($_POST['team_registered_date'] ?? ''));
    update_post_meta($post_id, '_team_suspension_date', sanitize_text_field($_POST['team_suspension_date'] ?? ''));
    update_post_meta($post_id, '_team_resumption_date', sanitize_text_field($_POST['team_resumption_date'] ?? ''));
    update_post_meta($post_id, '_team_withdrawal_date', sanitize_text_field($_POST['team_withdrawal_date'] ?? ''));
}
add_action('save_post_team', 'jsbb_save_team_meta');

function jsbb_save_bracket_meta($post_id) {
    if (!isset($_POST['jsbb_bracket_nonce']) || !wp_verify_nonce($_POST['jsbb_bracket_nonce'], 'jsbb_bracket_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    $fields = array(
        '_bracket_series_id' => 'bracket_series_id',
        '_bracket_year' => 'bracket_year',
        '_bracket_number' => 'bracket_number',
        '_bracket_name1' => 'bracket_name1',
        '_bracket_name2' => 'bracket_name2',
        '_bracket_name3' => 'bracket_name3',
        '_bracket_abbreviation' => 'bracket_abbreviation',
    );

    foreach ($fields as $meta_key => $post_key) {
        if (isset($_POST[$post_key])) {
            update_post_meta($post_id, $meta_key, sanitize_text_field($_POST[$post_key]));
        }
    }

    // 紐付け大会
    if (isset($_POST['bracket_tournament_id'])) {
        update_post_meta($post_id, '_bracket_tournament_id', intval($_POST['bracket_tournament_id']));
    }

    // 出場チーム（配列）
    $teams = isset($_POST['bracket_teams']) ? array_map('intval', $_POST['bracket_teams']) : array();
    update_post_meta($post_id, '_bracket_teams', wp_json_encode($teams));

    // PDFファイル（配列）
    $pdfs = isset($_POST['bracket_pdfs']) ? array_map('intval', $_POST['bracket_pdfs']) : array();
    update_post_meta($post_id, '_bracket_pdfs', wp_json_encode($pdfs));

    // インライン試合データ（JSON）
    if (isset($_POST['bracket_matches_json'])) {
        $json = wp_unslash($_POST['bracket_matches_json']);
        // JSONの妥当性チェック
        $decoded = json_decode($json, true);
        if (is_array($decoded)) {
            update_post_meta($post_id, '_bracket_matches', wp_slash($json));
        } elseif ($json === '' || $json === '[]') {
            update_post_meta($post_id, '_bracket_matches', '[]');
        }
    }

    // 大会シリーズのteam_classをトーナメント表にも自動セット
    $series_id = isset($_POST['bracket_series_id']) ? intval($_POST['bracket_series_id']) : 0;
    if ($series_id) {
        $series_terms = wp_get_post_terms($series_id, 'team_class', array('fields' => 'ids'));
        if (!is_wp_error($series_terms) && !empty($series_terms)) {
            wp_set_post_terms($post_id, $series_terms, 'team_class');
        }
    }

    // タイトル自動生成
    jsbb_auto_generate_bracket_title($post_id);
}
add_action('save_post_tournament_bracket', 'jsbb_save_bracket_meta');

function jsbb_auto_generate_bracket_title($post_id) {
    $year = get_post_meta($post_id, '_bracket_year', true);
    $number = get_post_meta($post_id, '_bracket_number', true);
    $name1 = get_post_meta($post_id, '_bracket_name1', true);

    if (!$year || !$name1) return;

    $title = $year . '年度';
    if ($number) {
        $title .= ' 第' . $number . '回';
    }
    $title .= ' ' . $name1;

    remove_action('save_post_tournament_bracket', 'jsbb_save_bracket_meta');
    wp_update_post(array('ID' => $post_id, 'post_title' => $title));
    add_action('save_post_tournament_bracket', 'jsbb_save_bracket_meta');
}

// ==========================================
// 大会管理: 自動計算 & タイトル生成
// ==========================================
function jsbb_auto_calculate_scores($post_id) {
    $inning_scores_json = get_post_meta($post_id, '_match_inning_scores', true);
    if (!$inning_scores_json) return;

    $scores = json_decode($inning_scores_json, true);
    if (!is_array($scores)) return;

    $home_total = 0;
    $away_total = 0;

    foreach ($scores as $inning) {
        $h = isset($inning['home']) ? $inning['home'] : '';
        $a = isset($inning['away']) ? $inning['away'] : '';
        $hNum = intval(preg_replace('/[^0-9]/', '', $h));
        $aNum = intval(preg_replace('/[^0-9]/', '', $a));
        $home_total += $hNum;
        $away_total += $aNum;
    }

    update_post_meta($post_id, '_match_home_total', $home_total);
    update_post_meta($post_id, '_match_away_total', $away_total);
}

function jsbb_auto_generate_tournament_title($post_id) {
    $series_id = get_post_meta($post_id, '_tournament_series_id', true);
    $year = get_post_meta($post_id, '_tournament_year', true);
    $number = get_post_meta($post_id, '_tournament_number', true);

    if (!$series_id || !$year) return;

    $series = get_post($series_id);
    if (!$series) return;

    $title = $year . '年度';
    if ($number) {
        $title .= ' 第' . $number . '回';
    }
    $title .= ' ' . $series->post_title;

    // unhook to prevent infinite loop
    remove_action('save_post_tournament', 'jsbb_save_tournament_meta');
    wp_update_post(array('ID' => $post_id, 'post_title' => $title));
    add_action('save_post_tournament', 'jsbb_save_tournament_meta');
}

// ==========================================
// 大会管理: 試合ステータス判定
// ==========================================
function jsbb_get_match_status($match_id) {
    $manual = get_post_meta($match_id, '_match_manual_status', true);

    // 手動ステータス優先
    if ($manual === '中止') return '中止';
    if ($manual === 'コールド') return 'コールド';
    if ($manual === '試合終了') return '試合終了';

    // 自動判定
    $inning_scores_json = get_post_meta($match_id, '_match_inning_scores', true);
    if (!$inning_scores_json) return '試合前';

    $scores = json_decode($inning_scores_json, true);
    if (!is_array($scores) || empty($scores)) return '試合前';

    // 全て空なら試合前
    $has_value = false;
    foreach ($scores as $inning) {
        $h = isset($inning['home']) ? trim($inning['home']) : '';
        $a = isset($inning['away']) ? trim($inning['away']) : '';
        if ($h !== '' || $a !== '') {
            $has_value = true;
            break;
        }
    }

    if (!$has_value) return '試合前';

    return '試合中';
}

// ==========================================
