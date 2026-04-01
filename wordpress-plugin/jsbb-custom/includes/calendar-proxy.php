<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// Google Calendar プロキシ API
// wp-config.php に以下を定義:
//   define('JSBB_GOOGLE_CALENDAR_CLIENT_EMAIL', '...');
//   define('JSBB_GOOGLE_CALENDAR_PRIVATE_KEY', '...');
//   define('JSBB_GOOGLE_CALENDAR_ID', '...');
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/calendar', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_calendar_events',
        'permission_callback' => '__return_true',
    ));
});

function jsbb_get_calendar_events() {
    $client_email = defined('JSBB_GOOGLE_CALENDAR_CLIENT_EMAIL') ? JSBB_GOOGLE_CALENDAR_CLIENT_EMAIL : '';
    $private_key  = defined('JSBB_GOOGLE_CALENDAR_PRIVATE_KEY') ? JSBB_GOOGLE_CALENDAR_PRIVATE_KEY : '';
    $calendar_id  = defined('JSBB_GOOGLE_CALENDAR_ID')
        ? JSBB_GOOGLE_CALENDAR_ID
        : '7a96188de1254966ec76720552e75c9b03a75c5bb8f5da84ef1529a6b44f2497@group.calendar.google.com';

    if (empty($client_email) || empty($private_key)) {
        return new WP_Error('config_error', 'Google Calendar credentials not configured', array('status' => 500));
    }

    // キャッシュ確認（10分間）
    $cache_key = 'jsbb_calendar_events';
    $cached = get_transient($cache_key);
    if ($cached !== false) {
        return new WP_REST_Response($cached, 200);
    }

    // JWTトークン生成
    $now = time();
    $header = base64url_encode(wp_json_encode(array('alg' => 'RS256', 'typ' => 'JWT')));
    $claim = base64url_encode(wp_json_encode(array(
        'iss'   => $client_email,
        'scope' => 'https://www.googleapis.com/auth/calendar.readonly',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'exp'   => $now + 3600,
        'iat'   => $now,
    )));

    $signature_input = $header . '.' . $claim;
    $private_key = str_replace('\\n', "\n", $private_key);
    $key_resource = openssl_pkey_get_private($private_key);
    if (!$key_resource) {
        return new WP_Error('key_error', 'Invalid private key', array('status' => 500));
    }

    openssl_sign($signature_input, $signature, $key_resource, OPENSSL_ALGO_SHA256);
    $jwt = $signature_input . '.' . base64url_encode($signature);

    // アクセストークン取得
    $token_response = wp_remote_post('https://oauth2.googleapis.com/token', array(
        'body' => array(
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ),
        'timeout' => 10,
    ));

    if (is_wp_error($token_response)) {
        return new WP_Error('token_error', 'Failed to get access token', array('status' => 500));
    }

    $token_data = json_decode(wp_remote_retrieve_body($token_response), true);
    $access_token = $token_data['access_token'] ?? '';
    if (empty($access_token)) {
        return new WP_Error('token_error', 'No access token returned', array('status' => 500));
    }

    // カレンダーイベント取得
    $now_iso = gmdate('Y-m-d\TH:i:s\Z');
    $three_months = gmdate('Y-m-d\TH:i:s\Z', strtotime('+3 months'));

    $api_url = sprintf(
        'https://www.googleapis.com/calendar/v3/calendars/%s/events?timeMin=%s&timeMax=%s&orderBy=startTime&singleEvents=true&maxResults=100',
        urlencode($calendar_id),
        urlencode($now_iso),
        urlencode($three_months)
    );

    $events_response = wp_remote_get($api_url, array(
        'headers' => array('Authorization' => 'Bearer ' . $access_token),
        'timeout' => 10,
    ));

    if (is_wp_error($events_response)) {
        return new WP_Error('calendar_error', 'Failed to fetch events', array('status' => 500));
    }

    $events_data = json_decode(wp_remote_retrieve_body($events_response), true);
    $items = $events_data['items'] ?? array();

    $events = array();
    foreach ($items as $item) {
        $events[] = array(
            'id'          => $item['id'] ?? '',
            'summary'     => $item['summary'] ?? '',
            'location'    => $item['location'] ?? null,
            'description' => $item['description'] ?? null,
            'start'       => array(
                'dateTime' => $item['start']['dateTime'] ?? null,
                'date'     => $item['start']['date'] ?? null,
            ),
            'end' => array(
                'dateTime' => $item['end']['dateTime'] ?? null,
                'date'     => $item['end']['date'] ?? null,
            ),
        );
    }

    // 10分間キャッシュ
    set_transient($cache_key, $events, 600);

    return new WP_REST_Response($events, 200);
}

// base64url エンコード
if (!function_exists('base64url_encode')) {
    function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
