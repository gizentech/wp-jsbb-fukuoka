<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ポータル OTP認証
// ==========================================

// OTPテーブル作成
function jsbb_portal_create_otp_table() {
    global $wpdb;
    $table = $wpdb->prefix . 'jsbb_otp';
    $charset = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS $table (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        team_id BIGINT UNSIGNED NOT NULL,
        email VARCHAR(255) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        attempts INT DEFAULT 0,
        used TINYINT(1) DEFAULT 0,
        INDEX idx_team_email (team_id, email),
        INDEX idx_expires (expires_at)
    ) $charset;";

    require_once ABSPATH . 'wp-admin/includes/upgrade.php';
    dbDelta($sql);
}

// プラグイン有効化時にテーブル作成
function jsbb_portal_activate() {
    jsbb_portal_create_otp_table();
}

// 既存の jsbb_activate_plugin に追加
add_action('admin_init', function () {
    // テーブルが存在しない場合に作成
    global $wpdb;
    $table = $wpdb->prefix . 'jsbb_otp';
    if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
        jsbb_portal_create_otp_table();
    }
});

// OTP生成
function jsbb_portal_generate_otp($team_id, $email) {
    global $wpdb;
    $table = $wpdb->prefix . 'jsbb_otp';

    // レート制限: 同じチーム+メールで1分以内に再送不可
    $recent = $wpdb->get_var($wpdb->prepare(
        "SELECT COUNT(*) FROM $table WHERE team_id = %d AND email = %s AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE) AND used = 0",
        $team_id, $email
    ));
    if ($recent > 0) {
        return new WP_Error('rate_limit', '1分後に再試行してください', array('status' => 429));
    }

    // 既存の未使用OTPを無効化
    $wpdb->update(
        $table,
        array('used' => 1),
        array('team_id' => $team_id, 'email' => $email, 'used' => 0),
        array('%d'),
        array('%d', '%s', '%d')
    );

    // 6桁OTP生成
    $otp_code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

    $wpdb->insert($table, array(
        'team_id'    => $team_id,
        'email'      => $email,
        'otp_code'   => $otp_code,
        'created_at' => current_time('mysql'),
        'expires_at' => date('Y-m-d H:i:s', strtotime('+10 minutes', current_time('timestamp'))),
        'attempts'   => 0,
        'used'       => 0,
    ), array('%d', '%s', '%s', '%s', '%s', '%d', '%d'));

    return $otp_code;
}

// OTP検証
function jsbb_portal_verify_otp($team_id, $email, $code) {
    global $wpdb;
    $table = $wpdb->prefix . 'jsbb_otp';

    $row = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM $table WHERE team_id = %d AND email = %s AND used = 0 ORDER BY created_at DESC LIMIT 1",
        $team_id, $email
    ));

    if (!$row) {
        return new WP_Error('not_found', '有効な認証コードがありません', array('status' => 400));
    }

    // 有効期限チェック
    if (strtotime($row->expires_at) < current_time('timestamp')) {
        $wpdb->update($table, array('used' => 1), array('id' => $row->id));
        return new WP_Error('expired', '認証コードの有効期限が切れています', array('status' => 400));
    }

    // 試行回数チェック
    if ((int) $row->attempts >= 3) {
        $wpdb->update($table, array('used' => 1), array('id' => $row->id));
        return new WP_Error('max_attempts', '試行回数の上限に達しました。再送信してください。', array('status' => 400));
    }

    // 試行回数インクリメント
    $wpdb->update(
        $table,
        array('attempts' => (int) $row->attempts + 1),
        array('id' => $row->id),
        array('%d'),
        array('%d')
    );

    // コード検証
    if ($row->otp_code !== $code) {
        $remaining = 2 - (int) $row->attempts;
        return new WP_Error('invalid_code', '認証コードが正しくありません（残り' . max(0, $remaining) . '回）', array('status' => 401));
    }

    // 成功: 使用済みにする
    $wpdb->update($table, array('used' => 1), array('id' => $row->id));
    return true;
}

// 期限切れOTPクリーンアップ（cronジョブ）
add_action('jsbb_portal_otp_cleanup', function () {
    global $wpdb;
    $table = $wpdb->prefix . 'jsbb_otp';
    $wpdb->query("DELETE FROM $table WHERE expires_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)");
});

// cronスケジュール登録
add_action('wp', function () {
    if (!wp_next_scheduled('jsbb_portal_otp_cleanup')) {
        wp_schedule_event(time(), 'hourly', 'jsbb_portal_otp_cleanup');
    }
});
