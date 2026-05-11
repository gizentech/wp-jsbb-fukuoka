<?php
if (!defined('ABSPATH')) exit;

/**
 * ブラケット組み合わせデータ挿入スクリプト
 * 対象: tournament_bracket 投稿ID 1846
 *       (2026年度 第46回 マクドナルドトーナメント)
 *
 * WP管理画面 → ツール → 組み合わせインポート(1846)
 */

add_action('admin_menu', function () {
    add_management_page(
        '組み合わせインポート(1846)',
        '組み合わせインポート(1846)',
        'manage_options',
        'jsbb-bracket-import-1846',
        'jsbb_bracket_import_1846_page'
    );
});

function jsbb_bracket_import_1846_page() {
    $bracket_post_id = 1846;
    $message = '';

    if (
        isset($_POST['jsbb_do_import_1846'])
        && isset($_POST['_wpnonce'])
        && wp_verify_nonce($_POST['_wpnonce'], 'jsbb_import_1846')
    ) {
        $matches = jsbb_build_bracket_matches_1846();
        $json    = wp_json_encode($matches, JSON_UNESCAPED_UNICODE);
        update_post_meta($bracket_post_id, '_bracket_matches', wp_slash($json));

        $saved   = get_post_meta($bracket_post_id, '_bracket_matches', true);
        $decoded = json_decode($saved, true);
        $count   = is_array($decoded) ? count($decoded) : 0;

        if ($count > 0) {
            $message = '<div class="notice notice-success is-dismissible"><p>✅ インポート完了！ ' . $count . ' 件の試合データを保存しました。</p></div>';
        } else {
            $message = '<div class="notice notice-error is-dismissible"><p>❌ 保存に失敗しました。</p><pre>' . esc_html(substr($json, 0, 500)) . '</pre></div>';
        }
    }

    $current_meta    = get_post_meta($bracket_post_id, '_bracket_matches', true);
    $current_decoded = json_decode($current_meta ?: '', true);
    $current_count   = is_array($current_decoded) ? count($current_decoded) : 0;
    ?>
    <div class="wrap">
        <h1>組み合わせインポート（ブラケット投稿ID: <?php echo $bracket_post_id; ?>）</h1>
        <p>2026年度 第46回 マクドナルドトーナメントの組み合わせデータをWPに挿入します。</p>
        <p>現在: <strong><?php echo $current_count > 0 ? $current_count . ' 試合 登録済み' : 'データなし'; ?></strong></p>
        <p><strong>注意:</strong> 実行すると <code>_bracket_matches</code> を上書きします。</p>
        <?php echo $message; ?>
        <form method="post" action="">
            <?php wp_nonce_field('jsbb_import_1846'); ?>
            <input type="hidden" name="jsbb_do_import_1846" value="1">
            <p><input type="submit" class="button button-primary button-large" value="組み合わせデータをインポートする"></p>
        </form>
    </div>
    <?php
}

function jsbb_build_bracket_matches_1846(): array {
    $matches = [];

    // ラウンドごとの match_idx カウンター（0始まり）
    $round_counters = [];

    // datetime ヘルパー: '2026-05-23' + '09:30' → '2026-05-23T09:30:00'
    $dt = fn(string $date, string $time): string => $date . 'T' . $time . ':00';

    $make = function (
        int    $ri,
        string $round,
        string $datetime,
        string $venue,
        string $home_name,
        string $away_name
    ) use (&$round_counters): array {
        if (!isset($round_counters[$ri])) $round_counters[$ri] = 0;
        $mi = $round_counters[$ri]++;
        return [
            'id'         => 'r' . $ri . 'm' . $mi,
            'round'      => $round,
            'round_idx'  => $ri,
            'match_idx'  => $mi,
            'date'       => $datetime,
            'venue'      => $venue,
            'home_name'  => $home_name,
            'away_name'  => $away_name,
            'home_score' => null,
            'away_score' => null,
            'status'     => '試合前',
        ];
    };

    // 会場名定数
    $市 = '久留米市野球場';
    $A  = '新宝満川野球場A';
    $B  = '新宝満川野球場B';
    $中 = '中干出公園グラウンド';
    $山 = '山本運動広場';

    // =====================
    // ri=0: 1回戦 (5/23)  16試合
    // 市：①9:30 ②11:00 ③12:30 ④14:00
    // 他：①10:00 ②11:30 ③13:00 ④14:30
    // =====================
    $d1 = '2026-05-23';

    // 久留米市野球場
    $matches[] = $make(0, '1回戦', $dt($d1, '09:30'), $市, '池田スラッガーズ',       '小笹少年野球クラブ');
    $matches[] = $make(0, '1回戦', $dt($d1, '11:00'), $市, '若久団地少年野球部',     '筑穂ヤングファイターズ');
    $matches[] = $make(0, '1回戦', $dt($d1, '12:30'), $市, '金川ベアーズ',           '味坂クラブ');
    $matches[] = $make(0, '1回戦', $dt($d1, '14:00'), $市, '吉田レグルス',           '安武ジュニアクラブ');

    // 新宝満川野球場B
    $matches[] = $make(0, '1回戦', $dt($d1, '10:00'), $B, '大牟田サンボーイズ',     '福岡ライナーズ');
    $matches[] = $make(0, '1回戦', $dt($d1, '11:30'), $B, '城少レッドスターズ',     '庄内ジャガーズ');
    $matches[] = $make(0, '1回戦', $dt($d1, '13:00'), $B, '津福わかわし',           '宮若ホワイトファイターズ');
    $matches[] = $make(0, '1回戦', $dt($d1, '14:30'), $B, '下広スターボーイズ',     '筑紫ビッキーズ');

    // 新宝満川野球場A
    $matches[] = $make(0, '1回戦', $dt($d1, '10:00'), $A, '山本スカイヤーズ',       '片縄ビクトリー');
    $matches[] = $make(0, '1回戦', $dt($d1, '11:30'), $A, '合川少年野球クラブ',     '中井フェニックス');
    $matches[] = $make(0, '1回戦', $dt($d1, '13:00'), $A, '直方南エンゼルス',       '三国クラブ');
    $matches[] = $make(0, '1回戦', $dt($d1, '14:30'), $A, '北野少年野球クラブ',     '須恵リトルベアーズ');

    // 中干出公園グラウンド
    $matches[] = $make(0, '1回戦', $dt($d1, '10:00'), $中, '前原南少年野球クラブ',  '木屋瀬バンブーズ');
    $matches[] = $make(0, '1回戦', $dt($d1, '11:30'), $中, '糸田ジュニアクラブ',    '本分クラブ');
    $matches[] = $make(0, '1回戦', $dt($d1, '13:00'), $中, '宗像クラブライオンズ',  '三潴シアターズ');
    $matches[] = $make(0, '1回戦', $dt($d1, '14:30'), $中, 'みやこlotus',           '大川リトルホープ');

    // =====================
    // ri=1: 2回戦 (5/24)  8試合
    // ①8:30 ②10:00 ③11:30 ④13:00
    // =====================
    $d2 = '2026-05-24';
    // 新宝満川野球場B
    $matches[] = $make(1, '2回戦', $dt($d2, '08:30'), $B, '', '');
    $matches[] = $make(1, '2回戦', $dt($d2, '10:00'), $B, '', '');
    $matches[] = $make(1, '2回戦', $dt($d2, '11:30'), $B, '', '');
    $matches[] = $make(1, '2回戦', $dt($d2, '13:00'), $B, '', '');
    // 久留米市野球場
    $matches[] = $make(1, '2回戦', $dt($d2, '08:30'), $市, '', '');
    $matches[] = $make(1, '2回戦', $dt($d2, '10:00'), $市, '', '');
    $matches[] = $make(1, '2回戦', $dt($d2, '11:30'), $市, '', '');
    $matches[] = $make(1, '2回戦', $dt($d2, '13:00'), $市, '', '');

    // =====================
    // ri=2: 3回戦 (5/30)  4試合 at 新宝満川野球場B
    // =====================
    $matches[] = $make(2, '3回戦', '2026-05-30', $B, '', '');
    $matches[] = $make(2, '3回戦', '2026-05-30', $B, '', '');
    $matches[] = $make(2, '3回戦', '2026-05-30', $B, '', '');
    $matches[] = $make(2, '3回戦', '2026-05-30', $B, '', '');

    // =====================
    // ri=3: 準決勝 (5/31)  2試合 at 久留米市野球場
    // =====================
    $matches[] = $make(3, '準決勝', '2026-05-31', $市, '', '');
    $matches[] = $make(3, '準決勝', '2026-05-31', $市, '', '');

    // =====================
    // ri=4: 決勝 (5/31)  1試合 at 久留米市野球場
    // =====================
    $matches[] = $make(4, '決勝', '2026-05-31', $市, '', '');

    return $matches;
}
