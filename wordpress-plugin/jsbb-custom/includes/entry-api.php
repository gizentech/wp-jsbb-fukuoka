<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 大会申込 REST API エンドポイント
//
// GET  /wp-json/jsbb/v1/entry/tournaments
//      → 公開中かつ申込期限内の大会一覧
//
// POST /wp-json/jsbb/v1/entry/save
//      body: { tournament_id, form_data, entry_code? }
//      → 保存コード発行 or 上書き
//
// GET  /wp-json/jsbb/v1/entry/load?code=XXXXXXXX
//      → 保存データ返却
// ==========================================

add_action('rest_api_init', function () {

    // ── 大会一覧 ──────────────────────────────────────────────────
    register_rest_route('jsbb/v1', '/entry/tournaments', [
        'methods'             => 'GET',
        'callback'            => 'jsbb_entry_api_tournaments',
        'permission_callback' => '__return_true',
    ]);

    // ── 保存 ──────────────────────────────────────────────────────
    register_rest_route('jsbb/v1', '/entry/save', [
        'methods'             => 'POST',
        'callback'            => 'jsbb_entry_api_save',
        'permission_callback' => '__return_true',
    ]);

    // ── 呼び出し ──────────────────────────────────────────────────
    register_rest_route('jsbb/v1', '/entry/load', [
        'methods'             => 'GET',
        'callback'            => 'jsbb_entry_api_load',
        'permission_callback' => '__return_true',
    ]);
});

// ── CORS ──────────────────────────────────────────────────────────────────
// jsbb-fukuoka.com と localhost からのアクセスを許可
add_filter('rest_pre_serve_request', function ($served, $result, $request) {
    $route = $request->get_route();
    if (strpos($route, '/jsbb/v1/entry') === false) return $served;

    $origin  = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = ['https://jsbb-fukuoka.com', 'http://localhost:3000', 'http://localhost'];
    if (in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    return $served;
}, 10, 3);

// ── 大会一覧コールバック ──────────────────────────────────────────────────

function jsbb_entry_api_tournaments(WP_REST_Request $request): WP_REST_Response {
    global $wpdb;

    // entry_deadline カラムの有無を確認してクエリを組み立てる
    $has_deadline = (bool) $wpdb->get_results(
        "SHOW COLUMNS FROM jsbb_tournaments LIKE 'entry_deadline'"
    );

    if ($has_deadline) {
        $rows = $wpdb->get_results("
            SELECT id, name, form_type, entry_deadline
            FROM jsbb_tournaments
            WHERE is_active = 1
              AND (entry_deadline IS NULL OR entry_deadline > NOW())
            ORDER BY sort_order, id
        ", ARRAY_A);
    } else {
        $rows = $wpdb->get_results("
            SELECT id, name, form_type
            FROM jsbb_tournaments
            WHERE is_active = 1
            ORDER BY sort_order, id
        ", ARRAY_A);
    }

    return new WP_REST_Response($rows ?: [], 200);
}

// ── 保存コールバック ──────────────────────────────────────────────────────

function jsbb_entry_api_save(WP_REST_Request $request): WP_REST_Response|WP_Error {
    global $wpdb;

    $body = $request->get_json_params();
    if (!$body) {
        return new WP_Error('bad_request', 'Invalid JSON', ['status' => 400]);
    }

    $data  = $body['form_data'] ?? null;
    $code  = strtoupper(trim($body['entry_code'] ?? ''));

    if (!$data) return new WP_Error('bad_request', 'form_data required', ['status' => 400]);

    $fd = wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($code) {
        // 既存コードで上書き
        $updated = $wpdb->update(
            'jsbb_entries',
            ['form_data' => $fd, 'updated_at' => current_time('mysql')],
            ['entry_code' => $code]
        );
        if ($updated === 0) {
            return new WP_Error('not_found', 'Entry code not found', ['status' => 404]);
        }
    } else {
        // 新規コード発行：英大文字2文字 + 数字6桁（重複しないまで試行）
        $alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        do {
            $code = $alpha[random_int(0, 25)] . $alpha[random_int(0, 25)]
                  . str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $exists = $wpdb->get_var($wpdb->prepare(
                "SELECT id FROM jsbb_entries WHERE entry_code = %s", $code
            ));
        } while ($exists);

        $wpdb->insert('jsbb_entries', [
            'entry_code' => $code,
            'form_data'  => $fd,
        ]);
    }

    return new WP_REST_Response(['success' => true, 'entry_code' => $code], 200);
}

// ── 呼び出しコールバック ──────────────────────────────────────────────────

function jsbb_entry_api_load(WP_REST_Request $request): WP_REST_Response|WP_Error {
    global $wpdb;

    $code = strtoupper(trim($request->get_param('code') ?? ''));
    if (!$code) {
        return new WP_Error('bad_request', 'code required', ['status' => 400]);
    }

    $row = $wpdb->get_row($wpdb->prepare("
        SELECT e.entry_code, e.tournament_id, e.form_data, e.created_at, e.updated_at,
               t.name AS tournament_name, t.form_type
        FROM jsbb_entries e
        LEFT JOIN jsbb_tournaments t ON t.id = e.tournament_id
        WHERE e.entry_code = %s
    ", $code), ARRAY_A);

    if (!$row) {
        return new WP_Error('not_found', 'Entry not found', ['status' => 404]);
    }

    $row['form_data'] = json_decode($row['form_data'], true);
    return new WP_REST_Response($row, 200);
}
