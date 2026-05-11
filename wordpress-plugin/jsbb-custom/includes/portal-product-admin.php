<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ポータル商品マスタ 管理ページ
// ==========================================

// ============================================================
// POST ハンドラ（admin-post.php 経由 → ヘッダー送信前に実行）
// ============================================================
add_action('admin_post_jsbb_product_save', 'jsbb_handle_product_save');
function jsbb_handle_product_save() {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');
    check_admin_referer('jsbb_product_save');

    $filter_tid = (int)($_POST['filter_tid'] ?? 0);

    // 削除
    if (isset($_POST['delete_product_id'])) {
        $del_id = (int)$_POST['delete_product_id'];
        if (get_post_type($del_id) === 'portal_product') {
            wp_delete_post($del_id, true);
        }
        wp_redirect(admin_url('admin.php?page=portal-products&deleted=1' . ($filter_tid ? '&tournament_id=' . $filter_tid : '')));
        exit;
    }

    // 新規 / 更新
    if (!empty($_POST['product_name'])) {
        $pid  = (int)($_POST['product_id'] ?? 0);
        $name = sanitize_text_field($_POST['product_name']);

        if ($pid && get_post_type($pid) === 'portal_product') {
            wp_update_post(['ID' => $pid, 'post_title' => $name, 'post_status' => 'publish']);
        } else {
            $pid = wp_insert_post([
                'post_title'  => $name,
                'post_type'   => 'portal_product',
                'post_status' => 'publish',
            ]);
        }

        if (!is_wp_error($pid)) {
            $tid = (int)($_POST['tournament_id'] ?? 0);

            $colors_raw = isset($_POST['colors']) ? (array)$_POST['colors'] : [];
            $colors     = array_values(array_filter(array_map('sanitize_text_field', $colors_raw)));

            $sizes_raw = sanitize_text_field($_POST['sizes_text'] ?? '');
            $sizes     = array_values(array_filter(array_map('trim', explode(',', $sizes_raw))));

            $images = [];
            for ($i = 1; $i <= 4; $i++) {
                $img = esc_url_raw($_POST["image_{$i}"] ?? '');
                if ($img) $images[] = $img;
            }

            jsbb_save_portal_product_meta($pid, $tid ?: null, [
                'price'           => (int)($_POST['price'] ?? 0),
                'name_price'      => (int)($_POST['name_price'] ?? 0),
                'name_max_chars'  => (int)($_POST['name_max_chars'] ?? 20),
                'has_name'        => !empty($_POST['has_name']),
                'colors'          => $colors,
                'sizes'           => $sizes,
                'images'          => $images,
                'cancel_deadline' => sanitize_text_field($_POST['cancel_deadline'] ?? ''),
                'description'     => sanitize_textarea_field($_POST['description'] ?? ''),
                'sort_order'      => (int)($_POST['sort_order'] ?? 0),
            ]);

            wp_redirect(admin_url('admin.php?page=portal-products&saved=1' . ($tid ? '&tournament_id=' . $tid : '')));
            exit;
        }
    }

    // フォールバック
    wp_redirect(admin_url('admin.php?page=portal-products&error=1' . ($filter_tid ? '&tournament_id=' . $filter_tid : '')));
    exit;
}

// ============================================================
// 商品マスタ 一覧・フォーム ページ
// ============================================================
function jsbb_portal_products_page() {
    if (!current_user_can('edit_posts')) wp_die('権限がありません');

    wp_enqueue_media();

    $action     = sanitize_text_field($_GET['action'] ?? '');
    $product_id = (int)($_GET['id'] ?? 0);

    // ── 大会一覧（フィルター・セレクト用）──
    $tournaments = get_posts([
        'post_type'      => 'portal_tournament',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
        'orderby'        => 'date',
        'order'          => 'DESC',
    ]);
    $filter_tid = (int)($_GET['tournament_id'] ?? 0);

    ?>
    <div class="wrap">
        <h1 class="wp-heading-inline">商品マスタ</h1>
        <a href="<?php echo esc_url(admin_url('admin.php?page=portal-products&action=new')); ?>"
           class="page-title-action">新規追加</a>
        <hr class="wp-header-end">

        <?php if (isset($_GET['saved'])): ?>
        <div class="notice notice-success is-dismissible"><p>商品を保存しました。</p></div>
        <?php endif; ?>
        <?php if (isset($_GET['deleted'])): ?>
        <div class="notice notice-success is-dismissible"><p>商品を削除しました。</p></div>
        <?php endif; ?>
        <?php if (isset($_GET['error'])): ?>
        <div class="notice notice-error is-dismissible"><p>保存に失敗しました。</p></div>
        <?php endif; ?>

        <?php if (in_array($action, ['new', 'edit'])): ?>
        <?php // ============================================================
              // 追加 / 編集フォーム
              // ============================================================
            $ep = [];
            if ($action === 'edit' && $product_id) {
                $ep = jsbb_build_portal_product($product_id) ?: [];
            }
            $f_tid   = $ep['tournament_id'] ?? $filter_tid;
            $f_imgs  = $ep['images'] ?? ['', '', '', ''];
            while (count($f_imgs) < 4) $f_imgs[] = '';
        ?>

        <style>
        .jsbb-prod-form table.form-table th { width: 180px; }
        .jsbb-prod-form .img-preview {
            width: 80px; height: 80px; object-fit: cover;
            border: 1px solid #ddd; display: block; margin-top: 4px;
            background: #f5f5f5;
        }
        .jsbb-prod-form .img-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 8px; }
        .jsbb-prod-form .img-row input[type=text] { flex: 1; }
        .jsbb-prod-form .color-grid { display: flex; flex-wrap: wrap; gap: 10px; }
        .jsbb-prod-form .color-item { display: flex; align-items: center; gap: 6px;
            padding: 6px 14px; border: 1.5px solid #ddd; background: #fff; cursor: pointer; }
        .jsbb-prod-form .color-item input { margin: 0; }
        .jsbb-prod-form .section-head {
            font-size: 0.85rem; font-weight: 700; text-transform: uppercase;
            letter-spacing: .05em; color: #888; margin: 24px 0 4px; border-bottom: 1px solid #eee; padding-bottom: 4px;
        }
        </style>

        <div class="jsbb-prod-form" style="max-width:780px;margin-top:16px;">
            <div style="background:#fff;border:1px solid #ddd;padding:24px 28px;">
                <h2 style="margin-top:0"><?php echo $action === 'edit' ? '商品を編集' : '新規商品追加'; ?></h2>

                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
                    <?php wp_nonce_field('jsbb_product_save'); ?>
                    <input type="hidden" name="action" value="jsbb_product_save">
                    <input type="hidden" name="product_id" value="<?php echo esc_attr($ep['id'] ?? ''); ?>">
                    <input type="hidden" name="filter_tid" value="<?php echo esc_attr($filter_tid); ?>">

                    <!-- ── 基本情報 ── -->
                    <p class="section-head">基本情報</p>
                    <table class="form-table">
                        <tr>
                            <th><label for="product_name">商品名 <span style="color:#c00">*</span></label></th>
                            <td><input type="text" id="product_name" name="product_name"
                                    value="<?php echo esc_attr($ep['name'] ?? ''); ?>"
                                    style="width:100%;max-width:400px" required /></td>
                        </tr>
                        <tr>
                            <th><label for="tournament_id">対象大会</label></th>
                            <td>
                                <select id="tournament_id" name="tournament_id" style="width:100%;max-width:400px">
                                    <option value="">─ 大会を選択 ─</option>
                                    <?php foreach ($tournaments as $t): ?>
                                    <option value="<?php echo $t->ID; ?>" <?php selected($f_tid, $t->ID); ?>>
                                        <?php echo esc_html($t->post_title); ?>
                                    </option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="description">商品説明</label></th>
                            <td><textarea id="description" name="description" rows="3"
                                    style="width:100%;max-width:500px"><?php echo esc_textarea($ep['description'] ?? ''); ?></textarea></td>
                        </tr>
                        <tr>
                            <th><label for="sort_order">表示順</label></th>
                            <td>
                                <input type="number" id="sort_order" name="sort_order"
                                    value="<?php echo esc_attr($ep['sort_order'] ?? 0); ?>"
                                    style="width:80px" min="0" />
                                <span class="description">数値が小さい順に表示</span>
                            </td>
                        </tr>
                    </table>

                    <!-- ── 価格 ── -->
                    <p class="section-head">価格</p>
                    <table class="form-table">
                        <tr>
                            <th><label for="price">本体価格（円/枚）</label></th>
                            <td>
                                <input type="number" id="price" name="price"
                                    value="<?php echo esc_attr($ep['price'] ?? 2000); ?>"
                                    min="0" style="width:120px" />
                                <span class="description">円</span>
                            </td>
                        </tr>
                        <tr>
                            <th>バックプリント（ネーム）</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="has_name" value="1"
                                        <?php checked(!empty($ep['has_name'])); ?>>
                                    ネームあり注文を受け付ける
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="name_price">ネーム代金（円/枚）</label></th>
                            <td>
                                <input type="number" id="name_price" name="name_price"
                                    value="<?php echo esc_attr($ep['name_price'] ?? 800); ?>"
                                    min="0" style="width:120px" />
                                <span class="description">円</span>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="name_max_chars">ネーム文字数上限</label></th>
                            <td>
                                <input type="number" id="name_max_chars" name="name_max_chars"
                                    value="<?php echo esc_attr($ep['name_max_chars'] ?? 20); ?>"
                                    min="1" max="50" style="width:80px" />
                                <span class="description">文字（半角大文字英字・数字）</span>
                            </td>
                        </tr>
                    </table>

                    <!-- ── カラー・サイズ ── -->
                    <p class="section-head">カラー・サイズ</p>
                    <table class="form-table">
                        <tr>
                            <th>カラー</th>
                            <td>
                                <div class="color-grid">
                                <?php
                                $cur_colors = $ep['colors'] ?? [];
                                $color_opts = [
                                    'ネイビー'     => '#1a237e',
                                    'ホワイト'     => '#e0e0e0',
                                    'レッド'       => '#c62828',
                                    'ブラック'     => '#212121',
                                    'グレー'       => '#757575',
                                    'スカイブルー' => '#0288d1',
                                    'グリーン'     => '#2e7d32',
                                ];
                                foreach ($color_opts as $co => $hex): ?>
                                <label class="color-item">
                                    <input type="checkbox" name="colors[]" value="<?php echo esc_attr($co); ?>"
                                        <?php checked(in_array($co, $cur_colors)); ?>>
                                    <span style="display:inline-block;width:14px;height:14px;background:<?php echo esc_attr($hex); ?>;border:1px solid #999;flex-shrink:0;"></span>
                                    <?php echo esc_html($co); ?>
                                </label>
                                <?php endforeach; ?>
                                </div>
                                <p class="description" style="margin-top:6px">チェックしたカラーの入力欄がポータルに表示されます</p>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="sizes_text">サイズ（カンマ区切り）</label></th>
                            <td>
                                <input type="text" id="sizes_text" name="sizes_text"
                                    value="<?php echo esc_attr(implode(',', $ep['sizes'] ?? ['120','130','140','150','SS','S','M','L','LL','3L','4L','5L'])); ?>"
                                    style="width:100%;max-width:500px" />
                                <p class="description">例: 120,130,140,150,SS,S,M,L,LL,3L,4L,5L　　順番通りに表示されます</p>
                            </td>
                        </tr>
                    </table>

                    <!-- ── 画像 ── -->
                    <p class="section-head">商品画像（最大4枚）</p>
                    <table class="form-table">
                        <tr>
                            <th>画像URL</th>
                            <td>
                                <?php for ($i = 0; $i < 4; $i++):
                                    $img_val = $f_imgs[$i] ?? '';
                                    $idx = $i + 1;
                                ?>
                                <div class="img-row">
                                    <input type="text" id="image_<?php echo $idx; ?>" name="image_<?php echo $idx; ?>"
                                        value="<?php echo esc_attr($img_val); ?>"
                                        placeholder="https://wp.jsbb-fukuoka.com/wp-content/uploads/..."
                                        class="jsbb-img-input" />
                                    <button type="button" class="button jsbb-media-btn"
                                        data-target="image_<?php echo $idx; ?>"
                                        data-preview="preview_<?php echo $idx; ?>">
                                        メディアから選択
                                    </button>
                                    <?php if ($img_val): ?>
                                    <img id="preview_<?php echo $idx; ?>" src="<?php echo esc_url($img_val); ?>"
                                        class="img-preview" />
                                    <?php else: ?>
                                    <img id="preview_<?php echo $idx; ?>" src="" class="img-preview"
                                        style="display:none" />
                                    <?php endif; ?>
                                </div>
                                <?php endfor; ?>
                                <p class="description">WordPressメディアライブラリの画像を選択するか、URLを直接入力してください</p>
                            </td>
                        </tr>
                    </table>

                    <!-- ── キャンセル期限 ── -->
                    <p class="section-head">注文設定</p>
                    <table class="form-table">
                        <tr>
                            <th><label for="cancel_deadline">変更・キャンセル期限</label></th>
                            <td>
                                <input type="datetime-local" id="cancel_deadline" name="cancel_deadline"
                                    value="<?php echo esc_attr($ep['cancel_deadline'] ?? ''); ?>" />
                                <p class="description">この日時を過ぎるとチームはキャンセル・変更できなくなります</p>
                            </td>
                        </tr>
                    </table>

                    <p style="margin-top:24px;">
                        <button type="submit" class="button button-primary button-large">保存する</button>
                        <a href="<?php echo esc_url(admin_url('admin.php?page=portal-products' . ($filter_tid ? '&tournament_id=' . $filter_tid : ''))); ?>"
                           class="button button-large" style="margin-left:8px;">キャンセル</a>
                    </p>
                </form>
            </div>
        </div>

        <script>
        jQuery(function($) {
            $('.jsbb-media-btn').on('click', function() {
                var btn     = $(this);
                var inputId = btn.data('target');
                var prevId  = btn.data('preview');

                var frame = wp.media({
                    title: '画像を選択',
                    button: { text: 'この画像を使用' },
                    multiple: false,
                    library: { type: 'image' }
                });

                frame.on('select', function() {
                    var attachment = frame.state().get('selection').first().toJSON();
                    $('#' + inputId).val(attachment.url);
                    var $prev = $('#' + prevId);
                    $prev.attr('src', attachment.url).show();
                });

                frame.open();
            });

            $('.jsbb-img-input').on('change', function() {
                var idx = $(this).attr('id').replace('image_', '');
                var url = $(this).val();
                var $prev = $('#preview_' + idx);
                if (url) {
                    $prev.attr('src', url).show();
                } else {
                    $prev.hide();
                }
            });
        });
        </script>

        <?php else: ?>

        <?php // ============================================================
              // 商品一覧
              // ============================================================ ?>

        <!-- 大会フィルター -->
        <form method="get" style="margin:16px 0;display:flex;align-items:center;gap:8px;">
            <input type="hidden" name="page" value="portal-products">
            <label style="font-weight:600;">大会:</label>
            <select name="tournament_id" onchange="this.form.submit()" style="min-width:200px">
                <option value="">全大会</option>
                <?php foreach ($tournaments as $t): ?>
                <option value="<?php echo $t->ID; ?>" <?php selected($filter_tid, $t->ID); ?>>
                    <?php echo esc_html($t->post_title); ?>
                </option>
                <?php endforeach; ?>
            </select>
            <noscript><button type="submit" class="button">絞り込み</button></noscript>
        </form>

        <?php
        $prod_query = [
            'post_type'      => 'portal_product',
            'posts_per_page' => -1,
            'post_status'    => 'any',
            'orderby'        => 'date',
            'order'          => 'ASC',
        ];
        if ($filter_tid) {
            $prod_query['meta_query'] = [['key' => '_portal_prod_tournament_id', 'value' => $filter_tid]];
        }
        $products = get_posts($prod_query);

        usort($products, function($a, $b) {
            $sa = (int) get_post_meta($a->ID, '_portal_prod_sort_order', true);
            $sb = (int) get_post_meta($b->ID, '_portal_prod_sort_order', true);
            return $sa <=> $sb;
        });
        ?>

        <table class="wp-list-table widefat fixed striped">
            <thead>
                <tr>
                    <th style="width:30px">順</th>
                    <th>商品名</th>
                    <th style="width:160px">大会</th>
                    <th style="width:180px">価格</th>
                    <th style="width:140px">カラー</th>
                    <th style="width:60px;text-align:center">サイズ数</th>
                    <th style="width:50px;text-align:center">ネーム</th>
                    <th style="width:100px">期限</th>
                    <th style="width:120px">操作</th>
                </tr>
            </thead>
            <tbody>
                <?php if (empty($products)): ?>
                <tr>
                    <td colspan="9" style="text-align:center;color:#888;padding:40px;">
                        商品がありません。「新規追加」から登録してください。
                    </td>
                </tr>
                <?php endif; ?>

                <?php foreach ($products as $p):
                    $pd     = jsbb_build_portal_product($p->ID);
                    $t_post = get_post($pd['tournament_id']);
                    $t_name = $t_post ? $t_post->post_title : '─';
                    $thumb  = $pd['images'][0] ?? '';
                    $edit_url = admin_url("admin.php?page=portal-products&action=edit&id={$p->ID}" . ($filter_tid ? "&tournament_id={$filter_tid}" : ''));
                ?>
                <tr>
                    <td style="color:#888;font-size:0.85rem"><?php echo (int)($pd['sort_order'] ?? 0); ?></td>
                    <td>
                        <div style="display:flex;align-items:center;gap:10px;">
                            <?php if ($thumb): ?>
                            <img src="<?php echo esc_url($thumb); ?>"
                                style="width:40px;height:40px;object-fit:cover;flex-shrink:0;border:1px solid #ddd;" />
                            <?php else: ?>
                            <div style="width:40px;height:40px;background:#f5f5f5;border:1px solid #ddd;flex-shrink:0;"></div>
                            <?php endif; ?>
                            <div>
                                <strong><?php echo esc_html($pd['name']); ?></strong>
                                <?php if ($pd['description']): ?>
                                <div style="font-size:0.8rem;color:#888;margin-top:2px;"><?php echo esc_html(mb_substr($pd['description'], 0, 50)); ?></div>
                                <?php endif; ?>
                            </div>
                        </div>
                    </td>
                    <td><?php echo esc_html($t_name); ?></td>
                    <td>
                        ¥<?php echo number_format($pd['price']); ?>
                        <?php if ($pd['name_price']): ?>
                        <br><small style="color:#888">+¥<?php echo number_format($pd['name_price']); ?> (ネーム)</small>
                        <?php endif; ?>
                    </td>
                    <td style="font-size:0.85rem"><?php echo esc_html(implode('・', $pd['colors'] ?: []) ?: '─'); ?></td>
                    <td style="text-align:center"><?php echo count($pd['sizes'] ?: []); ?>種</td>
                    <td style="text-align:center"><?php echo $pd['has_name'] ? '<span style="color:#2e7d32;font-weight:700">✓</span>' : '─'; ?></td>
                    <td style="font-size:0.82rem;color:#888"><?php echo esc_html(substr($pd['cancel_deadline'] ?? '', 0, 10) ?: '─'); ?></td>
                    <td>
                        <a href="<?php echo esc_url($edit_url); ?>" class="button button-small">編集</a>
                        <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>"
                              style="display:inline;"
                              onsubmit="return confirm('「<?php echo esc_js($pd['name']); ?>」を削除しますか？')">
                            <?php wp_nonce_field('jsbb_product_save'); ?>
                            <input type="hidden" name="action" value="jsbb_product_save">
                            <input type="hidden" name="filter_tid" value="<?php echo esc_attr($filter_tid); ?>">
                            <input type="hidden" name="delete_product_id" value="<?php echo $p->ID; ?>">
                            <button type="submit" class="button button-small" style="color:#a00;margin-top:4px;">削除</button>
                        </form>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>

        <?php endif; ?>
    </div>
    <?php
}
