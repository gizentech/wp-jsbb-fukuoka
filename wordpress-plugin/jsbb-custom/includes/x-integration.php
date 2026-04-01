<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// X連携: テスト用APIエンドポイント（管理者のみ）
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/x-test', array(
        'methods' => 'GET',
        'callback' => 'jsbb_x_test_endpoint',
        'permission_callback' => '__return_true',
    ));
});

function jsbb_x_test_endpoint($request) {
    // 再生成シークレットで認証
    $secret = $request->get_param('secret');
    $revalidate_secret = get_option('jsbb_nextjs_revalidate_secret', '');
    if (!$secret || $secret !== $revalidate_secret) {
        return new WP_Error('forbidden', '認証エラー', array('status' => 403));
    }

    $x_api_key = get_option('jsbb_x_api_key', '');
    $x_api_secret = get_option('jsbb_x_api_secret', '');
    $x_access_token = get_option('jsbb_x_access_token', '');
    $x_access_secret = get_option('jsbb_x_access_token_secret', '');
    $site_url = get_option('jsbb_nextjs_site_url', '');

    $result = array(
        'settings' => array(
            'api_key' => $x_api_key ? 'SET (' . strlen($x_api_key) . '文字)' : 'EMPTY',
            'api_secret' => $x_api_secret ? 'SET (' . strlen($x_api_secret) . '文字)' : 'EMPTY',
            'access_token' => $x_access_token ? 'SET (' . strlen($x_access_token) . '文字)' : 'EMPTY',
            'access_secret' => $x_access_secret ? 'SET (' . strlen($x_access_secret) . '文字)' : 'EMPTY',
            'site_url' => $site_url ?: 'EMPTY',
        ),
    );

    // すべて設定済みなら実際にテスト投稿
    if ($x_api_key && $x_api_secret && $x_access_token && $x_access_secret) {
        $test_text = "X連携テスト " . wp_date('Y-m-d H:i:s');
        $response = jsbb_x_api_post($test_text, null, $x_api_key, $x_api_secret, $x_access_token, $x_access_secret);
        $result['test_post'] = array(
            'text' => $test_text,
            'response' => $response,
        );
    } else {
        $result['test_post'] = 'APIキーが不足しているためテスト投稿をスキップ';
    }

    return $result;
}

// ==========================================
// 大会管理: Webhook（公開時差分配信）
// ==========================================
function jsbb_get_match_hash($match_id) {
    $data = array(
        'home_team' => get_post_meta($match_id, '_match_home_team_id', true),
        'away_team' => get_post_meta($match_id, '_match_away_team_id', true),
        'inning_scores' => get_post_meta($match_id, '_match_inning_scores', true),
        'manual_status' => get_post_meta($match_id, '_match_manual_status', true),
        'home_total' => get_post_meta($match_id, '_match_home_total', true),
        'away_total' => get_post_meta($match_id, '_match_away_total', true),
    );
    return md5(wp_json_encode($data));
}

function jsbb_trigger_distribution($post_id, $post) {
    if ($post->post_type !== 'match' || $post->post_status !== 'publish') return;

    $current_hash = jsbb_get_match_hash($post_id);
    $previous_hash = get_post_meta($post_id, '_match_last_distributed_hash', true);

    if ($current_hash === $previous_hash) return;

    // ハッシュ更新
    update_post_meta($post_id, '_match_last_distributed_hash', $current_hash);
    update_post_meta($post_id, '_match_last_distributed_at', current_time('mysql'));

    // Next.js再生成API呼出
    $revalidate_url = get_option('jsbb_nextjs_revalidate_url', '');
    $revalidate_secret = get_option('jsbb_nextjs_revalidate_secret', '');

    if ($revalidate_url && $revalidate_secret) {
        $tournament_id = get_post_meta($post_id, '_match_tournament_id', true);

        wp_remote_post($revalidate_url, array(
            'body' => wp_json_encode(array(
                'secret' => $revalidate_secret,
                'type' => 'match',
                'id' => $post_id,
                'parent' => intval($tournament_id),
            )),
            'headers' => array('Content-Type' => 'application/json'),
            'timeout' => 10,
            'blocking' => false,
        ));
    }

    // X（Twitter）投稿
    $status = jsbb_get_match_status($post_id);
    $postable = in_array($status, array('試合終了', 'コールド', '中止'));

    if ($postable) {
        jsbb_post_match_to_x($post_id);
    }
}
add_action('save_post', 'jsbb_trigger_distribution', 20, 2);

// ==========================================
// WordPress ページ/投稿 更新時のキャッシュ再検証
// ==========================================
function jsbb_revalidate_on_page_save($post_id, $post) {
    // matchはjsbb_trigger_distributionで処理済み
    if ($post->post_type === 'match') return;
    if ($post->post_status !== 'publish') return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;

    $revalidate_url = get_option('jsbb_nextjs_revalidate_url', '');
    $revalidate_secret = get_option('jsbb_nextjs_revalidate_secret', '');
    if (!$revalidate_url || !$revalidate_secret) return;

    // 投稿タイプに応じてtypeを設定
    $type = $post->post_type === 'page' ? 'page' : 'post';

    wp_remote_post($revalidate_url, array(
        'body' => wp_json_encode(array(
            'secret' => $revalidate_secret,
            'type'   => $type,
            'id'     => $post_id,
        )),
        'headers' => array('Content-Type' => 'application/json'),
        'timeout' => 10,
        'blocking' => false,
    ));
}
add_action('save_post', 'jsbb_revalidate_on_page_save', 25, 2);

// ==========================================
// 大会管理: X（Twitter）自動投稿
// ==========================================
function jsbb_post_match_to_x($match_id) {
    $x_api_key = get_option('jsbb_x_api_key', '');
    $x_api_secret = get_option('jsbb_x_api_secret', '');
    $x_access_token = get_option('jsbb_x_access_token', '');
    $x_access_secret = get_option('jsbb_x_access_token_secret', '');

    if (!$x_api_key || !$x_access_token) return;

    $tournament_id = get_post_meta($match_id, '_match_tournament_id', true);
    if (!$tournament_id) return;

    $tournament = get_post(intval($tournament_id));
    if (!$tournament) return;

    $home_team = get_post(intval(get_post_meta($match_id, '_match_home_team_id', true)));
    $away_team = get_post(intval(get_post_meta($match_id, '_match_away_team_id', true)));
    $home_total = get_post_meta($match_id, '_match_home_total', true);
    $away_total = get_post_meta($match_id, '_match_away_total', true);
    $round = get_post_meta($match_id, '_match_round', true);
    $status = jsbb_get_match_status($match_id);

    $site_url = get_option('jsbb_nextjs_site_url', home_url());

    // 大会親ポストを確認・作成
    $x_root_post_id = get_post_meta(intval($tournament_id), '_tournament_x_root_post_id', true);

    if (!$x_root_post_id) {
        // 大会親投稿
        $tournament_text = $tournament->post_title . "\n\n";
        $tournament_text .= "大会結果はこちら\n";
        $tournament_text .= $site_url . '/tournaments/';

        $root_response = jsbb_x_api_post($tournament_text, null, $x_api_key, $x_api_secret, $x_access_token, $x_access_secret);

        if ($root_response && isset($root_response['data']['id'])) {
            $x_root_post_id = $root_response['data']['id'];
            update_post_meta(intval($tournament_id), '_tournament_x_root_post_id', $x_root_post_id);
            update_post_meta(intval($tournament_id), '_tournament_x_posted_at', current_time('mysql'));
        }
    }

    // 試合リプライ投稿
    if ($x_root_post_id) {
        $match_text = '';
        if ($round) $match_text .= $round . "\n";
        $match_text .= ($home_team ? $home_team->post_title : '未定') . ' ' . $home_total . ' - ' . $away_total . ' ' . ($away_team ? $away_team->post_title : '未定');
        if ($status === '中止') $match_text .= "\n【中止】";
        elseif ($status === 'コールド') $match_text .= "\n【コールド】";
        $match_text .= "\n\n詳細はこちら\n" . $site_url . '/tournaments/' . $match_id;

        $current_hash = jsbb_get_match_hash($match_id);
        $x_last_hash = get_post_meta($match_id, '_match_x_last_hash', true);

        if ($current_hash !== $x_last_hash) {
            $reply_response = jsbb_x_api_post($match_text, $x_root_post_id, $x_api_key, $x_api_secret, $x_access_token, $x_access_secret);

            if ($reply_response && isset($reply_response['data']['id'])) {
                update_post_meta($match_id, '_match_x_reply_post_id', $reply_response['data']['id']);
                update_post_meta($match_id, '_match_x_posted_at', current_time('mysql'));
                update_post_meta($match_id, '_match_x_last_hash', $current_hash);
            }
        }
    }
}

function jsbb_x_api_post($text, $reply_to_id = null, $api_key, $api_secret, $access_token, $access_secret) {
    $url = 'https://api.twitter.com/2/tweets';

    $body = array('text' => $text);
    if ($reply_to_id) {
        $body['reply'] = array('in_reply_to_tweet_id' => $reply_to_id);
    }

    // OAuth 1.0a署名生成
    $oauth = array(
        'oauth_consumer_key' => $api_key,
        'oauth_nonce' => wp_generate_password(32, false),
        'oauth_signature_method' => 'HMAC-SHA1',
        'oauth_timestamp' => time(),
        'oauth_token' => $access_token,
        'oauth_version' => '1.0',
    );

    $base_params = $oauth;
    ksort($base_params);
    $base_string = 'POST&' . rawurlencode($url) . '&' . rawurlencode(http_build_query($base_params, '', '&', PHP_QUERY_RFC3986));
    $signing_key = rawurlencode($api_secret) . '&' . rawurlencode($access_secret);
    $oauth['oauth_signature'] = base64_encode(hash_hmac('sha1', $base_string, $signing_key, true));

    $auth_header = 'OAuth ';
    $auth_parts = array();
    foreach ($oauth as $k => $v) {
        $auth_parts[] = rawurlencode($k) . '="' . rawurlencode($v) . '"';
    }
    $auth_header .= implode(', ', $auth_parts);

    $response = wp_remote_post($url, array(
        'headers' => array(
            'Authorization' => $auth_header,
            'Content-Type' => 'application/json',
        ),
        'body' => wp_json_encode($body),
        'timeout' => 15,
    ));

    if (is_wp_error($response)) {
        error_log('JSBB X API Error: ' . $response->get_error_message());
        return null;
    }

    return json_decode(wp_remote_retrieve_body($response), true);
}

// ==========================================
// 日次スレッド管理（同日の投稿をリプライにまとめる）
// ==========================================
function jsbb_get_daily_root_tweet_id() {
    $today = wp_date('Y-m-d');
    $stored_date = get_option('jsbb_x_daily_root_date', '');
    if ($stored_date === $today) {
        return get_option('jsbb_x_daily_root_id', '');
    }
    return null;
}

function jsbb_set_daily_root_tweet_id($tweet_id) {
    update_option('jsbb_x_daily_root_id', $tweet_id);
    update_option('jsbb_x_daily_root_date', wp_date('Y-m-d'));
}

/**
 * X投稿共通処理（日次スレッド対応）
 * 同日の最初の投稿 → 新規ツイート＆ルートとして保存
 * 同日2件目以降 → ルートツイートへのリプライ
 */
function jsbb_post_to_x_with_daily_thread($text) {
    $x_api_key = get_option('jsbb_x_api_key', '');
    $x_api_secret = get_option('jsbb_x_api_secret', '');
    $x_access_token = get_option('jsbb_x_access_token', '');
    $x_access_secret = get_option('jsbb_x_access_token_secret', '');

    error_log('JSBB X DEBUG: api_key=' . ($x_api_key ? 'SET' : 'EMPTY') . ', access_token=' . ($x_access_token ? 'SET' : 'EMPTY'));

    if (!$x_api_key || !$x_access_token) {
        error_log('JSBB X DEBUG: APIキーが未設定のためスキップ');
        return null;
    }

    $daily_root = jsbb_get_daily_root_tweet_id();
    $reply_to = $daily_root ?: null;

    error_log('JSBB X DEBUG: 投稿テキスト=' . $text);
    error_log('JSBB X DEBUG: reply_to=' . ($reply_to ?: 'null'));

    $response = jsbb_x_api_post($text, $reply_to, $x_api_key, $x_api_secret, $x_access_token, $x_access_secret);

    error_log('JSBB X DEBUG: APIレスポンス=' . wp_json_encode($response));

    if ($response && isset($response['data']['id'])) {
        $tweet_id = $response['data']['id'];
        if (!$daily_root) {
            jsbb_set_daily_root_tweet_id($tweet_id);
        }
        return $tweet_id;
    }

    return null;
}

// ==========================================
// 大会情報: X（Twitter）自動投稿（追加・更新時）
// ==========================================
function jsbb_get_tournament_display_names($post_id, $post_type) {
    if ($post_type === 'tournament_bracket') {
        $name1 = get_post_meta($post_id, '_bracket_name1', true);
        $name2 = get_post_meta($post_id, '_bracket_name2', true);
        $name3 = get_post_meta($post_id, '_bracket_name3', true);
    } else {
        $name1 = get_post_meta($post_id, 'tournament_name1', true);
        $name2 = get_post_meta($post_id, 'tournament_name2', true);
        $name3 = get_post_meta($post_id, 'tournament_name3', true);
    }

    $names = array_filter(array($name1, $name2, $name3));
    return $names ? implode('+', $names) : get_the_title($post_id);
}

function jsbb_trigger_tournament_x_post($post_id, $post) {
    error_log('JSBB X DEBUG: jsbb_trigger_tournament_x_post called - post_id=' . $post_id . ', type=' . $post->post_type . ', status=' . $post->post_status);
    if ($post->post_status !== 'publish') { error_log('JSBB X DEBUG: スキップ（status=' . $post->post_status . '）'); return; }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) { error_log('JSBB X DEBUG: スキップ（AUTOSAVE）'); return; }
    if (wp_is_post_revision($post_id)) { error_log('JSBB X DEBUG: スキップ（revision）'); return; }

    $site_url = get_option('jsbb_nextjs_site_url', home_url());

    // ハッシュで重複投稿防止
    $current_hash = md5($post->post_title . $post->post_modified);
    $last_hash = get_post_meta($post_id, '_tournament_info_x_last_hash', true);
    if ($current_hash === $last_hash) return;

    $names = jsbb_get_tournament_display_names($post_id, $post->post_type);

    $text  = "【大会情報】\n";
    $text .= $names . "\n\n";
    $text .= "大会情報が更新されました！\n";
    $text .= $site_url . '/tournaments/' . $post_id . "\n\n";
    $text .= "#福岡県 #福岡県軟式野球連盟 #jsbb";

    $tweet_id = jsbb_post_to_x_with_daily_thread($text);

    if ($tweet_id) {
        update_post_meta($post_id, '_tournament_info_x_last_hash', $current_hash);
        update_post_meta($post_id, '_tournament_info_x_tweet_id', $tweet_id);
        update_post_meta($post_id, '_tournament_info_x_posted_at', current_time('mysql'));
    }
}
add_action('save_post_tournament', 'jsbb_trigger_tournament_x_post', 30, 2);
add_action('save_post_tournament_bracket', 'jsbb_trigger_tournament_x_post', 30, 2);

// ==========================================
// お知らせ: X（Twitter）自動投稿（新規公開時のみ）
// ==========================================
function jsbb_trigger_news_x_post($new_status, $old_status, $post) {
    error_log('JSBB X DEBUG: jsbb_trigger_news_x_post called - post_id=' . $post->ID . ', type=' . $post->post_type . ', old=' . $old_status . ', new=' . $new_status);
    if ($post->post_type !== 'post') return;
    if ($new_status !== 'publish') return;
    if ($old_status === 'publish') { error_log('JSBB X DEBUG: スキップ（既にpublish済み=更新）'); return; }
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;

    // 二重投稿防止
    $already_posted = get_post_meta($post->ID, '_news_x_posted', true);
    if ($already_posted) return;

    $site_url = get_option('jsbb_nextjs_site_url', home_url());

    $text  = "【お知らせ】\n";
    $text .= "お知らせが更新されました。\n";
    $text .= $post->post_title . "\n";
    $text .= $site_url . '/news/' . $post->ID . "\n\n";
    $text .= "#福岡県 #福岡県軟式野球連盟 #jsbb";

    $tweet_id = jsbb_post_to_x_with_daily_thread($text);

    if ($tweet_id) {
        update_post_meta($post->ID, '_news_x_posted', '1');
        update_post_meta($post->ID, '_news_x_tweet_id', $tweet_id);
        update_post_meta($post->ID, '_news_x_posted_at', current_time('mysql'));
    }
}
add_action('transition_post_status', 'jsbb_trigger_news_x_post', 30, 3);
