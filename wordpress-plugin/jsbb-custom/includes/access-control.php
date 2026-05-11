<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// CORS設定: フロントエンド（静的サイト）からのAPI呼び出し許可
// ==========================================
add_action('rest_api_init', function () {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function ($value) {
        $origin = get_http_origin();
        $allowed = array(
            'https://jsbb-fukuoka.com',
            'https://www.jsbb-fukuoka.com',
            'http://localhost:3000',
        );
        if (in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Portal-Key');
            header('Access-Control-Allow-Credentials: true');
        }
        return $value;
    });
}, 15);

// OPTIONS プリフライトリクエスト対応
add_action('init', function () {
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
        $allowed = array(
            'https://jsbb-fukuoka.com',
            'https://www.jsbb-fukuoka.com',
            'http://localhost:3000',
        );
        if (in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . esc_url_raw($origin));
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization, X-Portal-Key');
            header('Access-Control-Max-Age: 86400');
        }
        status_header(204);
        exit;
    }
});

// ==========================================
// 権限管理: ユーザーごとのアクセス制御
// ==========================================

/**
 * ユーザー名に基づいた権限判定
 * @param string $level 'full' | 'org' | 'almighty'
 *   full     = open / admin のみ
 *   org      = open / admin / aoki / fukuoka
 *   almighty = ログイン済み全員
 */
function jsbb_check_user_access($level = 'full') {
    $user = wp_get_current_user();
    if (!$user || !$user->exists()) return false;

    $username = $user->user_login;

    // open / admin は常に全アクセス可
    if (in_array($username, array('open', 'admin'), true)) {
        return true;
    }

    switch ($level) {
        case 'almighty':
            return current_user_can('edit_posts');
        case 'org':
            return in_array($username, array('aoki', 'fukuoka'), true);
        case 'full':
        default:
            return false;
    }
}

/**
 * aoki / fukuoka に編集・削除権限を動的に付与
 */
add_filter('user_has_cap', function($allcaps, $caps, $args, $user) {
    if (!in_array($user->user_login, array('aoki', 'fukuoka'), true)) {
        return $allcaps;
    }

    $grant_caps = array(
        'edit_posts',
        'edit_others_posts',
        'edit_published_posts',
        'delete_posts',
        'delete_others_posts',
        'delete_published_posts',
        'publish_posts',
        'read',
        'upload_files',
        'edit_pages',
        'edit_others_pages',
        'edit_published_pages',
        'delete_pages',
        'delete_others_pages',
        'delete_published_pages',
        'publish_pages',
    );

    foreach ($grant_caps as $cap) {
        $allcaps[$cap] = true;
    }

    return $allcaps;
}, 10, 4);

/**
 * 管理メニューの表示制御
 *
 * アクセス権限表:
 * ─────────────────────────────────────────────────────────
 * メニュー              open/admin  aoki  fukuoka  その他
 * ─────────────────────────────────────────────────────────
 * 固定ページ              ✅        ✅      ❌      ❌
 * お知らせ（投稿）         ✅        ✅      ✅      ✅
 * 年度大会                ✅        ✅      ✅      ✅
 * 大会シリーズ             ✅        ✅      ✅      ✅
 * 試合                   ✅        ❌      ✅      ✅
 * トーナメント表           ✅        ✅      ✅      ✅
 * 支部                   ✅        ✅      ✅      ❌
 * 役員グループ             ✅        ✅      ✅      ❌
 * チーム一覧              ✅        ❌      ❌      ❌
 * ┗ クラス一括設定         ✅        ❌      ❌      ❌
 * ┗ 加盟チーム一覧         ✅        ✅      ❌      ❌
 * ┗ チーム新規追加         ✅        ✅      ❌      ❌
 * メンバー                ✅        ✅      ❌      ❌
 * インタビュー             ✅        ✅      ❌      ❌
 * JSBB大会設定            ✅        ❌      ❌      ❌
 * ─────────────────────────────────────────────────────────
 */
function jsbb_apply_access_control() {
    $user = wp_get_current_user();
    if (!$user || !$user->exists()) return;
    $username = $user->user_login;

    // open / admin は全表示
    if (in_array($username, array('open', 'admin'), true)) return;

    // --- JSBB大会設定 (open/admin のみ) ---
    remove_submenu_page('options-general.php', 'jsbb-tournament-settings');

    // --- メディアライブラリ (open/admin のみ) ---
    remove_menu_page('upload.php');

    if ($username === 'aoki') {
        // aoki: 試合は非表示
        remove_menu_page('edit.php?post_type=match');
        // aoki: チーム一覧とクラス一括設定は非表示、カンバンと新規追加はOK
        remove_submenu_page('edit.php?post_type=team', 'edit.php?post_type=team');
        remove_submenu_page('edit.php?post_type=team', 'jsbb-team-class-manager');

    } elseif ($username === 'fukuoka') {
        // fukuoka: メンバー・インタビュー非表示
        remove_menu_page('edit.php?post_type=member_profile');
        remove_menu_page('edit.php?post_type=interview');
        // fukuoka: 支部・役員グループ・試合・年度大会非表示
        remove_menu_page('edit.php?post_type=branch');
        remove_menu_page('edit.php?post_type=officer_group');
        remove_menu_page('edit.php?post_type=match');
        remove_menu_page('edit.php?post_type=tournament');
        // fukuoka: 固定ページ・コメント非表示
        remove_menu_page('edit.php?post_type=page');
        remove_menu_page('edit-comments.php');
        // fukuoka: チーム関連は一切非表示
        remove_menu_page('edit.php?post_type=team');

    } else {
        // その他: 支部・役員・チーム・メンバー・インタビュー・固定ページ全て非表示
        remove_menu_page('edit.php?post_type=officer_group');
        remove_menu_page('edit.php?post_type=branch');
        remove_menu_page('edit.php?post_type=team');
        remove_menu_page('edit.php?post_type=member_profile');
        remove_menu_page('edit.php?post_type=interview');
        remove_menu_page('edit.php?post_type=page');
    }
}
add_action('admin_menu', 'jsbb_apply_access_control', 999);

/**
 * 投稿タイプ直接アクセスのブロック（URL直打ち対策）
 */
function jsbb_block_direct_access() {
    global $pagenow, $typenow;
    if (!in_array($pagenow, array('edit.php', 'post.php', 'post-new.php'), true)) return;

    $user = wp_get_current_user();
    if (!$user || !$user->exists()) return;
    $username = $user->user_login;

    // open / admin は全許可
    if (in_array($username, array('open', 'admin'), true)) return;

    // aoki: 試合ブロック
    if ($username === 'aoki' && $typenow === 'match') {
        wp_die('この投稿タイプへのアクセス権がありません。', 'アクセス拒否', array('response' => 403));
    }

    // メンバー・インタビュー → open/admin/aoki のみ
    if (in_array($typenow, array('member_profile', 'interview'), true)) {
        if ($username !== 'aoki') {
            wp_die('この投稿タイプへのアクセス権がありません。', 'アクセス拒否', array('response' => 403));
        }
    }

    // fukuoka: 支部・役員・試合・年度大会・固定ページブロック
    if ($username === 'fukuoka' && in_array($typenow, array('branch', 'officer_group', 'match', 'tournament', 'page'), true)) {
        wp_die('この投稿タイプへのアクセス権がありません。', 'アクセス拒否', array('response' => 403));
    }

    // その他ユーザー: 固定ページブロック
    if (!in_array($username, array('aoki', 'fukuoka'), true) && $typenow === 'page') {
        wp_die('この投稿タイプへのアクセス権がありません。', 'アクセス拒否', array('response' => 403));
    }

    // 役員・支部 → open/admin/aoki のみ（fukuokaは上でブロック済み）
    if (in_array($typenow, array('officer_group', 'branch'), true)) {
        if (!in_array($username, array('aoki', 'fukuoka'), true)) {
            wp_die('この投稿タイプへのアクセス権がありません。', 'アクセス拒否', array('response' => 403));
        }
    }

    // チーム → ユーザーごとに制御
    if ($typenow === 'team') {
        $page = isset($_GET['page']) ? $_GET['page'] : '';

        if ($username === 'aoki') {
            // aoki: カンバンと新規追加のみ許可、チーム一覧はブロック
            if ($pagenow === 'edit.php' && $page !== 'jsbb-team-kanban') {
                wp_die('この画面へのアクセス権がありません。', 'アクセス拒否', array('response' => 403));
            }
        } else {
            // fukuoka・その他: チーム関連は全てブロック
            wp_die('この投稿タイプへのアクセス権がありません。', 'アクセス拒否', array('response' => 403));
        }
    }
}
add_action('admin_init', 'jsbb_block_direct_access');
