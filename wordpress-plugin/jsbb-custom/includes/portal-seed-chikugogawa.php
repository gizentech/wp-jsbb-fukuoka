<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 筑後川旗 商品データ 自動インポート
// WP管理画面 → ポータル管理 → 筑後川商品登録
// ページを開くだけで自動登録されます
// ==========================================

function jsbb_portal_seed_chikugogawa_page() {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');

    // ============================================================
    // 商品マスタデータ（ここを編集）
    // ============================================================
    $products = [
        [
            'name'           => '筑後川メモリアルTシャツ',
            'colors'         => ['ネイビー', 'ホワイト'],
            'sizes'          => ['120','130','140','150','SS','S','M','L','LL','3L','4L','5L'],
            'price'          => 2000,
            'has_name'       => true,
            'name_price'     => 800,
            'name_max_chars' => 20,
            'cancel_deadline'=> '',   // 例: '2025-06-01T23:59'
            'min_qty'        => 0,
            'sort_order'     => 1,
            'description'    => "筑後川旗第42回西日本学童軟式野球大会へのご出場、誠におめでとう御座います。\n大会出場記念として毎年好評いただいております『筑後川メモリアルTシャツ』を作成致します。\nお土産や記念品としてご購入のチームがございましたら、当注文書にて承ります。\n\nサイトフォームよりチームごとに　●月●日　までに大会マイページよりお申込み下さい。\n出場される全チームの御健闘をお祈りいたします！\n\n各チーム名のバックプリントも可能です。ご要望が御座いましたら下記にご記入下さい。\n一枚あたり別途800円必要となります。（書体については一任願います）",
            'images'         => [],
        ],
    ];

    // ============================================================
    // 筑後川旗 大会を自動検索（タイトルに「筑後川」を含む最新）
    // ============================================================
    $tournaments = get_posts([
        'post_type'      => 'portal_tournament',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'date',
        'order'          => 'DESC',
        's'              => '筑後川',
    ]);

    // 見つからなければ全大会から最新1件
    if (empty($tournaments)) {
        $tournaments = get_posts([
            'post_type'      => 'portal_tournament',
            'posts_per_page' => 1,
            'post_status'    => 'publish',
            'orderby'        => 'date',
            'order'          => 'DESC',
        ]);
    }

    $tournament_id   = !empty($tournaments) ? $tournaments[0]->ID : 0;
    $tournament_name = !empty($tournaments) ? $tournaments[0]->post_title : '（大会未登録）';

    // ============================================================
    // 自動インポート実行
    // ============================================================
    $results = [];

    foreach ($products as $p) {
        // 同名商品が同じ大会に既にあればスキップ
        $existing = get_posts([
            'post_type'   => 'portal_product',
            'post_status' => 'publish',
            'title'       => $p['name'],
            'meta_query'  => $tournament_id ? [[
                'key'   => '_portal_prod_tournament_id',
                'value' => $tournament_id,
            ]] : [],
            'numberposts' => 1,
        ]);

        if (!empty($existing)) {
            $results[] = [
                'name'   => $p['name'],
                'status' => 'skip',
                'id'     => $existing[0]->ID,
                'note'   => '既に登録済みのためスキップしました',
            ];
            continue;
        }

        $post_id = wp_insert_post([
            'post_title'  => $p['name'],
            'post_type'   => 'portal_product',
            'post_status' => 'publish',
        ]);

        if (is_wp_error($post_id)) {
            $results[] = [
                'name'   => $p['name'],
                'status' => 'error',
                'note'   => $post_id->get_error_message(),
            ];
            continue;
        }

        jsbb_save_portal_product_meta($post_id, $tournament_id ?: null, [
            'price'           => $p['price'],
            'name_price'      => $p['name_price'],
            'name_max_chars'  => $p['name_max_chars'],
            'has_name'        => $p['has_name'],
            'colors'          => $p['colors'],
            'sizes'           => $p['sizes'],
            'images'          => $p['images'],
            'cancel_deadline' => $p['cancel_deadline'],
            'description'     => $p['description'],
            'sort_order'      => $p['sort_order'],
        ]);

        if ($p['min_qty'] > 0) {
            update_post_meta($post_id, '_portal_prod_min_qty', $p['min_qty']);
        }

        $results[] = [
            'name'   => $p['name'],
            'status' => 'ok',
            'id'     => $post_id,
            'note'   => '登録しました',
        ];
    }

    // ============================================================
    // 画面表示
    // ============================================================
    ?>
    <div class="wrap">
        <h1>筑後川商品登録 — 実行結果</h1>

        <div style="background:#fff;border:1px solid #ddd;padding:20px 24px;max-width:620px;margin-top:16px;">

            <p><strong>登録先大会:</strong>
                <code><?php echo esc_html($tournament_name); ?></code>
                <?php if ($tournament_id): ?>
                （ID: <?php echo $tournament_id; ?>）
                <?php else: ?>
                <span style="color:#c00">⚠ 大会が見つかりません。先にポータル大会を登録してください。</span>
                <?php endif; ?>
            </p>

            <table class="wp-list-table widefat fixed" style="margin-top:12px;">
                <thead>
                    <tr>
                        <th>商品名</th>
                        <th style="width:80px;text-align:center">結果</th>
                        <th>備考</th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ($results as $r): ?>
                <tr>
                    <td><strong><?php echo esc_html($r['name']); ?></strong></td>
                    <td style="text-align:center">
                        <?php if ($r['status'] === 'ok'): ?>
                            <span style="color:#2e7d32;font-weight:700">✅ 完了</span>
                        <?php elseif ($r['status'] === 'skip'): ?>
                            <span style="color:#888">⏭ スキップ</span>
                        <?php else: ?>
                            <span style="color:#c00">❌ エラー</span>
                        <?php endif; ?>
                    </td>
                    <td style="font-size:0.9rem;color:#555">
                        <?php echo esc_html($r['note']); ?>
                        <?php if (!empty($r['id'])): ?>
                        （ID: <?php echo $r['id']; ?>）
                        <?php endif; ?>
                    </td>
                </tr>
                <?php endforeach; ?>
                </tbody>
            </table>

            <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
                <a href="<?php echo esc_url(admin_url('admin.php?page=portal-products')); ?>"
                   class="button button-primary">商品マスタを確認する</a>
                <a href="<?php echo esc_url(admin_url('admin.php?page=portal-seed-chikugogawa')); ?>"
                   class="button">再実行する</a>
            </div>
        </div>
    </div>
    <?php
}
