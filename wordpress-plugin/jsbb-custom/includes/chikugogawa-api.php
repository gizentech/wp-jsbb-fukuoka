<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 筑後川旗: カスタム投稿タイプ & REST API
// ==========================================

// カスタム投稿タイプ: 筑後川旗ページデータ
add_action('init', function () {
    register_post_type('chikugogawa_page', array(
        'labels' => array(
            'name'          => '筑後川旗ページ',
            'singular_name' => '筑後川旗ページ',
            'add_new'       => '新規追加',
            'add_new_item'  => '新しい筑後川旗ページを追加',
            'edit_item'     => '筑後川旗ページを編集',
            'all_items'     => '一覧',
        ),
        'public'       => false,
        'show_ui'      => true,
        'show_in_menu' => true,
        'show_in_rest' => false,
        'supports'     => array('title'),
        'menu_icon'    => 'dashicons-baseball',
        'menu_position' => 7,
    ));
});

// REST API エンドポイント
add_action('rest_api_init', function () {

    // GET /jsbb/v1/tournaments?type=chikugogawa&latest=true
    // GET /jsbb/v1/tournaments?type=chikugogawa&year={year}
    register_rest_route('jsbb/v1', '/tournaments', array(
        'methods'             => 'GET',
        'callback'            => 'jsbb_chikugogawa_get_tournament',
        'permission_callback' => '__return_true',
    ));

    // GET /jsbb/v1/chikugogawa/history
    register_rest_route('jsbb/v1', '/chikugogawa/history', array(
        'methods'             => 'GET',
        'callback'            => 'jsbb_chikugogawa_get_history',
        'permission_callback' => '__return_true',
    ));

    // POST /jsbb/v1/chikugogawa/seed (管理者専用: 初期データ投入)
    register_rest_route('jsbb/v1', '/chikugogawa/seed', array(
        'methods'             => 'POST',
        'callback'            => 'jsbb_chikugogawa_seed',
        'permission_callback' => function () { return current_user_can('edit_posts'); },
    ));
});

// GET 大会ページデータ
function jsbb_chikugogawa_get_tournament($request) {
    $type = $request->get_param('type');
    if ($type !== 'chikugogawa') {
        return new WP_Error('invalid_type', 'type must be chikugogawa', array('status' => 400));
    }

    $latest = $request->get_param('latest');
    $year   = $request->get_param('year');

    $args = array(
        'post_type'      => 'chikugogawa_page',
        'post_status'    => 'publish',
        'posts_per_page' => 1,
        'orderby'        => 'meta_value_num',
        'meta_key'       => '_chikugogawa_year',
        'order'          => 'DESC',
    );

    if (!$latest && $year) {
        $args['meta_query'] = array(
            array(
                'key'   => '_chikugogawa_year',
                'value' => intval($year),
                'compare' => '=',
                'type'  => 'NUMERIC',
            ),
        );
    }

    $posts = get_posts($args);
    if (empty($posts)) {
        return null;
    }

    return jsbb_chikugogawa_format_page($posts[0]);
}

// GET 歴代優勝
function jsbb_chikugogawa_get_history($request) {
    $history = get_option('jsbb_chikugogawa_history', array());
    if (!is_array($history)) $history = array();
    return $history;
}

// POST シードデータ投入
function jsbb_chikugogawa_seed($request) {
    $params = $request->get_json_params();
    if (!$params) {
        return new WP_Error('no_data', 'Request body required', array('status' => 400));
    }

    $year   = isset($params['year'])   ? intval($params['year'])   : 0;
    $number = isset($params['number']) ? intval($params['number']) : 0;

    if (!$year) {
        return new WP_Error('missing_year', 'year is required', array('status' => 400));
    }

    // 同じ年のページが既にあれば更新
    $existing = get_posts(array(
        'post_type'      => 'chikugogawa_page',
        'post_status'    => array('publish', 'draft'),
        'posts_per_page' => 1,
        'meta_query'     => array(array('key' => '_chikugogawa_year', 'value' => $year, 'compare' => '=', 'type' => 'NUMERIC')),
    ));

    if (!empty($existing)) {
        $post_id = $existing[0]->ID;
    } else {
        $post_id = wp_insert_post(array(
            'post_type'   => 'chikugogawa_page',
            'post_title'  => $year . '年度 第' . $number . '回 筑後川旗',
            'post_status' => 'publish',
        ));
        if (is_wp_error($post_id)) {
            return $post_id;
        }
    }

    // メタ保存
    update_post_meta($post_id, '_chikugogawa_year', $year);
    update_post_meta($post_id, '_chikugogawa_number', $number);

    if (isset($params['hero_image']))       update_post_meta($post_id, '_chikugogawa_hero_image',       sanitize_url($params['hero_image']));
    if (isset($params['bracket_series_id'])) update_post_meta($post_id, '_chikugogawa_bracket_series_id', intval($params['bracket_series_id']));
    if (isset($params['overview_table']))   update_post_meta($post_id, '_chikugogawa_overview_table',   wp_json_encode($params['overview_table']));
    if (isset($params['overview']))         update_post_meta($post_id, '_chikugogawa_overview',         wp_kses_post($params['overview']));
    if (isset($params['messages']))         update_post_meta($post_id, '_chikugogawa_messages',         wp_json_encode($params['messages']));
    if (isset($params['sponsors']))         update_post_meta($post_id, '_chikugogawa_sponsors',         wp_json_encode($params['sponsors']));

    // 歴代データ更新
    if (isset($params['history']) && is_array($params['history'])) {
        $history = get_option('jsbb_chikugogawa_history', array());
        if (!is_array($history)) $history = array();
        foreach ($params['history'] as $row) {
            $row_year = isset($row['year']) ? intval($row['year']) : 0;
            if (!$row_year) continue;
            $found = false;
            foreach ($history as &$h) {
                if (intval($h['year']) === $row_year) {
                    $h = $row;
                    $found = true;
                    break;
                }
            }
            unset($h);
            if (!$found) $history[] = $row;
        }
        update_option('jsbb_chikugogawa_history', $history);
    }

    return array('success' => true, 'post_id' => $post_id);
}

// ページデータを整形して返す
function jsbb_chikugogawa_format_page($post) {
    $id = $post->ID;

    $overview_table_raw = get_post_meta($id, '_chikugogawa_overview_table', true);
    $overview_table = $overview_table_raw ? json_decode($overview_table_raw, true) : null;

    $messages_raw = get_post_meta($id, '_chikugogawa_messages', true);
    $messages = $messages_raw ? json_decode($messages_raw, true) : array();

    $sponsors_raw = get_post_meta($id, '_chikugogawa_sponsors', true);
    $sponsors = $sponsors_raw ? json_decode($sponsors_raw, true) : array();

    $series_id = get_post_meta($id, '_chikugogawa_bracket_series_id', true);

    return array(
        'id'                => $id,
        'year'              => intval(get_post_meta($id, '_chikugogawa_year', true)),
        'number'            => intval(get_post_meta($id, '_chikugogawa_number', true)),
        'hero_image'        => get_post_meta($id, '_chikugogawa_hero_image', true) ?: null,
        'overview_table'    => is_array($overview_table) ? $overview_table : null,
        'overview'          => get_post_meta($id, '_chikugogawa_overview', true) ?: null,
        'messages'          => is_array($messages) ? $messages : array(),
        'sponsors'          => is_array($sponsors) ? $sponsors : array(),
        'bracket_series_id' => $series_id ? intval($series_id) : null,
    );
}

// ==========================================
// 管理画面: メタボックス
// ==========================================
add_action('add_meta_boxes', function () {
    add_meta_box(
        'chikugogawa_page_info',
        '筑後川旗ページ情報',
        'jsbb_chikugogawa_metabox',
        'chikugogawa_page',
        'normal',
        'high'
    );
});

function jsbb_chikugogawa_metabox($post) {
    wp_nonce_field('jsbb_chikugogawa_meta', 'jsbb_chikugogawa_nonce');

    $year              = get_post_meta($post->ID, '_chikugogawa_year', true);
    $number            = get_post_meta($post->ID, '_chikugogawa_number', true);
    $hero_image        = get_post_meta($post->ID, '_chikugogawa_hero_image', true);
    $bracket_series_id = get_post_meta($post->ID, '_chikugogawa_bracket_series_id', true);
    $overview_table    = get_post_meta($post->ID, '_chikugogawa_overview_table', true);
    $overview          = get_post_meta($post->ID, '_chikugogawa_overview', true);
    $messages          = get_post_meta($post->ID, '_chikugogawa_messages', true);
    $sponsors          = get_post_meta($post->ID, '_chikugogawa_sponsors', true);

    $series_list = get_posts(array('post_type' => 'tournament_series', 'post_status' => 'publish', 'posts_per_page' => -1, 'orderby' => 'title', 'order' => 'ASC'));
    ?>
    <table class="form-table">
        <tr>
            <th><label for="chikugogawa_year">年度 <span style="color:red">*</span></label></th>
            <td><input type="number" id="chikugogawa_year" name="chikugogawa_year" value="<?php echo esc_attr($year); ?>" style="width:120px" /></td>
        </tr>
        <tr>
            <th><label for="chikugogawa_number">回数</label></th>
            <td><input type="number" id="chikugogawa_number" name="chikugogawa_number" value="<?php echo esc_attr($number); ?>" style="width:120px" /> 回</td>
        </tr>
        <tr>
            <th><label for="chikugogawa_hero_image">ヒーロー画像URL</label></th>
            <td><input type="url" id="chikugogawa_hero_image" name="chikugogawa_hero_image" value="<?php echo esc_url($hero_image); ?>" style="width:100%" /></td>
        </tr>
        <tr>
            <th><label for="chikugogawa_bracket_series_id">トーナメント表シリーズ</label></th>
            <td>
                <select id="chikugogawa_bracket_series_id" name="chikugogawa_bracket_series_id">
                    <option value="">-- なし --</option>
                    <?php foreach ($series_list as $s): ?>
                        <option value="<?php echo $s->ID; ?>" <?php selected($bracket_series_id, $s->ID); ?>><?php echo esc_html($s->post_title); ?></option>
                    <?php endforeach; ?>
                </select>
            </td>
        </tr>
        <tr>
            <th><label for="chikugogawa_overview_table">大会概要テーブル (JSON)</label></th>
            <td>
                <textarea id="chikugogawa_overview_table" name="chikugogawa_overview_table" rows="20" style="width:100%;font-family:monospace;font-size:12px"><?php echo esc_textarea($overview_table); ?></textarea>
                <p class="description">形式: <code>[{"label":"主催","value":"○○○"},...]</code></p>
            </td>
        </tr>
        <tr>
            <th><label for="chikugogawa_overview">大会概要HTML (フォールバック)</label></th>
            <td><textarea id="chikugogawa_overview" name="chikugogawa_overview" rows="6" style="width:100%"><?php echo esc_textarea($overview); ?></textarea></td>
        </tr>
        <tr>
            <th><label for="chikugogawa_messages">メッセージ (JSON)</label></th>
            <td>
                <textarea id="chikugogawa_messages" name="chikugogawa_messages" rows="10" style="width:100%;font-family:monospace;font-size:12px"><?php echo esc_textarea($messages); ?></textarea>
                <p class="description">形式: <code>{"chairman":{"name":"氏名","title":"役職","text":"本文"},"mayor":{...},"assembly":{...}}</code></p>
            </td>
        </tr>
        <tr>
            <th><label for="chikugogawa_sponsors">スポンサー (JSON)</label></th>
            <td>
                <textarea id="chikugogawa_sponsors" name="chikugogawa_sponsors" rows="6" style="width:100%;font-family:monospace;font-size:12px"><?php echo esc_textarea($sponsors); ?></textarea>
                <p class="description">形式: <code>[{"name":"会社名","logo":"URL","url":"リンク"},...]</code></p>
            </td>
        </tr>
    </table>
    <?php
}

add_action('save_post_chikugogawa_page', function ($post_id) {
    if (!isset($_POST['jsbb_chikugogawa_nonce']) || !wp_verify_nonce($_POST['jsbb_chikugogawa_nonce'], 'jsbb_chikugogawa_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    if (isset($_POST['chikugogawa_year'])) {
        update_post_meta($post_id, '_chikugogawa_year', intval($_POST['chikugogawa_year']));
    }
    if (isset($_POST['chikugogawa_number'])) {
        update_post_meta($post_id, '_chikugogawa_number', intval($_POST['chikugogawa_number']));
    }
    if (isset($_POST['chikugogawa_hero_image'])) {
        update_post_meta($post_id, '_chikugogawa_hero_image', sanitize_url($_POST['chikugogawa_hero_image']));
    }
    if (isset($_POST['chikugogawa_bracket_series_id'])) {
        update_post_meta($post_id, '_chikugogawa_bracket_series_id', intval($_POST['chikugogawa_bracket_series_id']));
    }
    if (isset($_POST['chikugogawa_overview_table'])) {
        // JSONとして有効かチェック
        $json = stripslashes($_POST['chikugogawa_overview_table']);
        $decoded = json_decode($json, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            update_post_meta($post_id, '_chikugogawa_overview_table', wp_json_encode($decoded, JSON_UNESCAPED_UNICODE));
        }
    }
    if (isset($_POST['chikugogawa_overview'])) {
        update_post_meta($post_id, '_chikugogawa_overview', wp_kses_post(stripslashes($_POST['chikugogawa_overview'])));
    }
    if (isset($_POST['chikugogawa_messages'])) {
        $json = stripslashes($_POST['chikugogawa_messages']);
        $decoded = json_decode($json, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            update_post_meta($post_id, '_chikugogawa_messages', wp_json_encode($decoded, JSON_UNESCAPED_UNICODE));
        }
    }
    if (isset($_POST['chikugogawa_sponsors'])) {
        $json = stripslashes($_POST['chikugogawa_sponsors']);
        $decoded = json_decode($json, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            update_post_meta($post_id, '_chikugogawa_sponsors', wp_json_encode($decoded, JSON_UNESCAPED_UNICODE));
        }
    }
});

// ==========================================
// 管理画面: サブメニュー
// ==========================================
add_action('admin_menu', function () {
    add_submenu_page(
        'edit.php?post_type=chikugogawa_page',
        'データ投入',
        'データ投入',
        'edit_posts',
        'chikugogawa-seed',
        'jsbb_chikugogawa_seed_page'
    );
    add_submenu_page(
        'edit.php?post_type=chikugogawa_page',
        '歴代優勝管理',
        '歴代優勝管理',
        'edit_posts',
        'chikugogawa-history',
        'jsbb_chikugogawa_history_page'
    );
});

// ==========================================
// 管理画面: 2026年データ投入ページ
// ==========================================
function jsbb_chikugogawa_seed_page() {
    $message = '';
    $message_type = 'success';

    if (isset($_POST['chikugogawa_seed_nonce']) && wp_verify_nonce($_POST['chikugogawa_seed_nonce'], 'chikugogawa_seed_action')) {
        $result = jsbb_chikugogawa_do_seed_2026();
        if (is_wp_error($result)) {
            $message = 'エラー: ' . $result->get_error_message();
            $message_type = 'error';
        } else {
            $message = '第43回（2026年）大会データを投入しました（投稿ID: ' . $result . '）。<a href="' . get_edit_post_link($result) . '">編集画面を開く</a>';
        }
    }
    ?>
    <div class="wrap">
        <h1>筑後川旗 データ投入</h1>
        <?php if ($message): ?>
            <div class="notice notice-<?php echo $message_type; ?> is-dismissible"><p><?php echo $message; ?></p></div>
        <?php endif; ?>
        <div class="card" style="max-width:600px;padding:20px;margin-top:20px">
            <h2>第43回（2026年）大会データを投入</h2>
            <p>以下のデータを WordPress に登録します。既に同じ年度のデータが存在する場合は上書き更新します。</p>
            <ul style="list-style:disc;margin-left:20px;line-height:2">
                <li>年度: 2026年</li>
                <li>回数: 第43回</li>
                <li>会期: 2026年7月31日〜8月6日</li>
                <li>大会概要テーブル（主催・共催・主管・後援・協賛・会場 など）</li>
            </ul>
            <form method="post" style="margin-top:16px">
                <?php wp_nonce_field('chikugogawa_seed_action', 'chikugogawa_seed_nonce'); ?>
                <input type="submit" class="button button-primary button-large" value="データを投入する" />
            </form>
        </div>
    </div>
    <?php
}

function jsbb_chikugogawa_do_seed_2026() {
    $overview_table = array(
        array('label' => '主催',       'value' => '一般社団法人福岡県軟式野球連盟'),
        array('label' => '共催',       'value' => '久留米市・久留米市教育委員会・（公財）久留米市スポーツと学びの財団'),
        array('label' => '主管',       'value' => '久留米市野球連盟'),
        array('label' => '後援',       'value' => '(公財)全日本軟式野球連盟・国土交通省筑後川河川事務所・朝日新聞社・久留米商工会議所・(公財)久留米観光コンベンション国際交流協会・久留米総合スポーツセンター・(公財)久留米市都市公園管理センター・株式会社ＣＲＣＣメディアくーみんテレビ・ドリームスエフエム放送㈱'),
        array('label' => '協賛',       'value' => '一般社団法人 北部九州河川利用協会・久留米市企業局・マルエス㈱・㈱共同写真企画'),
        array('label' => '協力',       'value' => '久留米市立久留米商業高等学校吹奏楽部'),
        array('label' => '会期',       'value' => '2026年7月31日（金）〜8月6日（木）　予備日 8月7日（金）'),
        array('label' => '会場',       'value' => '久留米市野球場・新宝満川地区野球場ＡＢ・桜花台運動公園野球場・中干出公園野球場・久留米東部運動公園・大島公園野球場・北野体育センター野球場・山本運動広場・三瀦運動広場ほか'),
        array('label' => '出場チーム', 'value' => '第42回優勝チーム・第42回準優勝チーム・九州ブロック・中国ブロック・四国ブロック・近畿ブロック'),
        array('label' => '出場資格',   'value' => '①小学生にて編成されたチームで25名以内　②リトルリーグ・日本少年野球連盟に登録してあるものは出場を認めない　③各県支部長の推薦を得たチームであること'),
        array('label' => '競技規則',   'value' => '2026年度公認野球規則の少年野球に関する事項および別に定める特別規則による'),
        array('label' => '使用球',     'value' => '全日本軟式野球連盟公認球 マルエスＪ号'),
        array('label' => '申込締切',   'value' => '2026年6月24日（水）まで　各都道府県軟式野球連盟を経由して大会事務局へE-mailにて申込'),
        array('label' => '組合せ抽選', 'value' => '2026年6月27日（土）15時00分　久留米市野球場 会議室（主管支部役員立ち会いのうえ代理抽選）'),
        array('label' => '開会式',     'value' => '2026年7月31日（金）17時30分　久留米市野球場<br>〒830-0003 福岡県久留米市東櫛原町173　☎0942-38-8333<br>※雨天時は久留米アリーナにて実施。入場行進は運動靴着用のこと。'),
        array('label' => '表彰',       'value' => '優勝：賞状・優勝旗・盾・メダル（選手25名）　準優勝：賞状・準優勝旗・盾・メダル（選手25名）　第3位：賞状・盾・メダル（選手50名）'),
        array('label' => '事務局',     'value' => '〒830-0003 福岡県久留米市東櫛原町173 久留米市野球場内<br>筑後川旗第43回西日本学童軟式野球大会事務局<br><br>☎0942-38-8333　／　FAX 0942-27-6332<br>E-mail: info@jsbb-fukuoka.com<br><br>事務局営業時間：10時〜16時（日曜・祝日・火曜は休み）'),
    );

    // 同じ年のページが既にあれば更新
    $existing = get_posts(array(
        'post_type'      => 'chikugogawa_page',
        'post_status'    => array('publish', 'draft'),
        'posts_per_page' => 1,
        'meta_query'     => array(array(
            'key'     => '_chikugogawa_year',
            'value'   => 2026,
            'compare' => '=',
            'type'    => 'NUMERIC',
        )),
    ));

    if (!empty($existing)) {
        $post_id = $existing[0]->ID;
        wp_update_post(array(
            'ID'          => $post_id,
            'post_title'  => '2026年度 第43回 筑後川旗西日本学童軟式野球大会',
            'post_status' => 'publish',
        ));
    } else {
        $post_id = wp_insert_post(array(
            'post_type'   => 'chikugogawa_page',
            'post_title'  => '2026年度 第43回 筑後川旗西日本学童軟式野球大会',
            'post_status' => 'publish',
        ));
        if (is_wp_error($post_id)) return $post_id;
    }

    update_post_meta($post_id, '_chikugogawa_year',           2026);
    update_post_meta($post_id, '_chikugogawa_number',         43);
    update_post_meta($post_id, '_chikugogawa_overview_table', wp_json_encode($overview_table, JSON_UNESCAPED_UNICODE));

    return $post_id;
}

// ==========================================
// 管理画面: 歴代優勝データ管理ページ
// ==========================================
function jsbb_chikugogawa_history_page() {
    // 保存処理
    if (isset($_POST['chikugogawa_history_nonce']) && wp_verify_nonce($_POST['chikugogawa_history_nonce'], 'chikugogawa_history_save')) {
        $json = isset($_POST['chikugogawa_history_json']) ? stripslashes($_POST['chikugogawa_history_json']) : '[]';
        $decoded = json_decode($json, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            update_option('jsbb_chikugogawa_history', $decoded);
            echo '<div class="notice notice-success"><p>歴代優勝データを保存しました。</p></div>';
        } else {
            echo '<div class="notice notice-error"><p>JSONの形式が正しくありません。</p></div>';
        }
    }

    $history = get_option('jsbb_chikugogawa_history', array());
    if (!is_array($history)) $history = array();
    usort($history, function($a, $b) { return intval($b['number'] ?? $b['year'] ?? 0) - intval($a['number'] ?? $a['year'] ?? 0); });
    $json = wp_json_encode($history, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    ?>
    <div class="wrap">
        <h1>筑後川旗 歴代優勝管理</h1>
        <p>形式: <code>[{"number":43,"year":2026,"champion":"チーム名","runner_up":"チーム名"},...]</code></p>
        <form method="post">
            <?php wp_nonce_field('chikugogawa_history_save', 'chikugogawa_history_nonce'); ?>
            <textarea name="chikugogawa_history_json" rows="30" style="width:100%;font-family:monospace;font-size:13px"><?php echo esc_textarea($json); ?></textarea>
            <p><input type="submit" class="button button-primary" value="保存" /></p>
        </form>
    </div>
    <?php
}
