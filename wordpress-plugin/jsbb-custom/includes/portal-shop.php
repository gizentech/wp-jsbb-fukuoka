<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ポータルショップ CPT & REST API
// ==========================================

// SMTP設定（wp-config.php に定数を定義することを推奨）
if (!defined('JSBB_SMTP_HOST'))       define('JSBB_SMTP_HOST',       'sv13316.xserver.jp');
if (!defined('JSBB_SMTP_PORT'))       define('JSBB_SMTP_PORT',       465);
if (!defined('JSBB_SMTP_USER'))       define('JSBB_SMTP_USER',       'shop@jsbb-fukuoka.com');
if (!defined('JSBB_SMTP_PASS'))       define('JSBB_SMTP_PASS',       'open2000');
if (!defined('JSBB_ORDER_NOTIFY_TO')) define('JSBB_ORDER_NOTIFY_TO', 'notification@jsbb-fukuoka.com');

// SMTP設定フック
add_action('phpmailer_init', function ($phpmailer) {
    // ショップ注文メール送信時のみSMTP設定（from が shop@ の場合）
    if (strpos($phpmailer->From, 'shop@jsbb-fukuoka.com') !== false) {
        $phpmailer->isSMTP();
        $phpmailer->Host       = JSBB_SMTP_HOST;
        $phpmailer->SMTPAuth   = true;
        $phpmailer->Port       = JSBB_SMTP_PORT;
        $phpmailer->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        $phpmailer->Username   = JSBB_SMTP_USER;
        $phpmailer->Password   = JSBB_SMTP_PASS;
    }
});

// --- 商品 ---
add_action('init', function () {
    register_post_type('portal_product', array(
        'labels' => array(
            'name'          => 'ポータル商品',
            'singular_name' => 'ポータル商品',
        ),
        'public'       => false,
        'show_ui'      => false,
        'show_in_rest' => false,
        'supports'     => array('title'),
    ));
});

// --- 注文 ---
add_action('init', function () {
    register_post_type('portal_order', array(
        'labels' => array(
            'name'          => 'ポータル注文',
            'singular_name' => 'ポータル注文',
        ),
        'public'       => false,
        'show_ui'      => false,
        'show_in_rest' => false,
        'supports'     => array('title'),
    ));
});

// ==========================================
// REST API
// ==========================================
add_action('rest_api_init', function () {

    // -----------------------------------------------
    // 商品 CRUD
    // -----------------------------------------------

    // GET /portal/tournaments/{id}/products
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/products', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $tournament_id = (int) $request['id'];

            $posts = get_posts(array(
                'post_type'      => 'portal_product',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
                'meta_query'     => array(
                    array('key' => '_portal_prod_tournament_id', 'value' => $tournament_id),
                ),
                'orderby'  => 'meta_value_num',
                'meta_key' => '_portal_prod_sort_order',
                'order'    => 'ASC',
            ));

            $products = array();
            foreach ($posts as $p) {
                $products[] = jsbb_build_portal_product($p->ID);
            }

            return rest_ensure_response($products);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // POST /portal/tournaments/{id}/products
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/products', array(
        'methods'  => 'POST',
        'callback' => function ($request) {
            $tournament_id = (int) $request['id'];
            $params = $request->get_json_params();
            $name = isset($params['name']) ? sanitize_text_field($params['name']) : '';

            if (!$name) {
                return new WP_Error('bad_request', '商品名が必要です', array('status' => 400));
            }

            $post_id = wp_insert_post(array(
                'post_title'  => $name,
                'post_type'   => 'portal_product',
                'post_status' => 'publish',
            ));

            if (is_wp_error($post_id)) {
                return new WP_Error('create_error', '作成に失敗しました', array('status' => 500));
            }

            jsbb_save_portal_product_meta($post_id, $tournament_id, $params);
            return rest_ensure_response(jsbb_build_portal_product($post_id));
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));

    // PUT /portal/products/{id}
    register_rest_route('jsbb/v1', '/portal/products/(?P<id>\d+)', array(
        'methods'  => 'PUT',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_product') {
                return new WP_Error('not_found', '商品が見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();
            if (isset($params['name'])) {
                wp_update_post(array('ID' => $post_id, 'post_title' => sanitize_text_field($params['name'])));
            }
            jsbb_save_portal_product_meta($post_id, null, $params);
            return rest_ensure_response(jsbb_build_portal_product($post_id));
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));

    // DELETE /portal/products/{id}
    register_rest_route('jsbb/v1', '/portal/products/(?P<id>\d+)', array(
        'methods'  => 'DELETE',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_product') {
                return new WP_Error('not_found', '商品が見つかりません', array('status' => 404));
            }
            wp_delete_post($post_id, true);
            return rest_ensure_response(array('success' => true, 'deleted_id' => $post_id));
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));

    // -----------------------------------------------
    // 注文 CRUD
    // -----------------------------------------------

    // POST /portal/tournaments/{id}/orders
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/orders', array(
        'methods'  => 'POST',
        'callback' => function ($request) {
            $tournament_id = (int) $request['id'];
            $params = $request->get_json_params();
            $team_id = isset($params['team_id']) ? (int) $params['team_id'] : 0;
            $items   = isset($params['items']) ? $params['items'] : array();

            if (!$team_id || empty($items)) {
                return new WP_Error('bad_request', 'チームIDと注文内容が必要です', array('status' => 400));
            }

            // 合計金額計算（本体 + ネーム代）
            $total      = 0;
            $body_total = 0;
            $name_total = 0;
            foreach ($items as &$item) {
                $product = get_post($item['product_id']);
                if (!$product || $product->post_type !== 'portal_product') continue;

                $price      = (int) get_post_meta($item['product_id'], '_portal_prod_price', true);
                $name_price = (int) get_post_meta($item['product_id'], '_portal_prod_name_price', true);
                $has_name   = !empty($item['has_name']);
                $quantity   = (int) $item['quantity'];

                $item['price']        = $price;
                $item['name_price']   = $has_name ? $name_price : 0;
                $item['product_name'] = $product->post_title;
                $item['subtotal']     = ($price + ($has_name ? $name_price : 0)) * $quantity;

                $body_total += $price * $quantity;
                if ($has_name) $name_total += $name_price * $quantity;
                $total += $item['subtotal'];
            }
            unset($item);

            $team_post  = get_post($team_id);
            $team_name  = $team_post ? $team_post->post_title : 'チーム';
            $team_email = get_post_meta($team_id, '_portal_team_email', true) ?: '';

            $post_id = wp_insert_post(array(
                'post_title'  => $team_name . ' - 注文',
                'post_type'   => 'portal_order',
                'post_status' => 'publish',
            ));

            if (is_wp_error($post_id)) {
                return new WP_Error('create_error', '作成に失敗しました', array('status' => 500));
            }

            update_post_meta($post_id, '_portal_order_tournament_id', $tournament_id);
            update_post_meta($post_id, '_portal_order_team_id', $team_id);
            update_post_meta($post_id, '_portal_order_items', wp_slash(json_encode($items, JSON_UNESCAPED_UNICODE)));
            update_post_meta($post_id, '_portal_order_total', $total);
            update_post_meta($post_id, '_portal_order_body_total', $body_total);
            update_post_meta($post_id, '_portal_order_name_total', $name_total);
            update_post_meta($post_id, '_portal_order_status', 'confirmed');
            update_post_meta($post_id, '_portal_order_created_at', current_time('mysql'));

            $history = array(array(
                'action' => 'created',
                'date'   => current_time('mysql'),
                'items'  => $items,
                'total'  => $total,
            ));
            update_post_meta($post_id, '_portal_order_history', wp_slash(json_encode($history, JSON_UNESCAPED_UNICODE)));

            // 活動ログ
            jsbb_portal_log_activity($tournament_id, $team_id, 'order_placed',
                $team_name . 'が注文しました（合計: ¥' . number_format($total) . '）', 'team');

            // メール通知
            $tournament_post = get_post($tournament_id);
            $tournament_name = $tournament_post ? $tournament_post->post_title : '';
            jsbb_send_order_email(
                $post_id, $team_name, $team_email, $tournament_name,
                $items, $total, $body_total, $name_total, 'placed'
            );

            return rest_ensure_response(jsbb_build_portal_order($post_id));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key();
        },
    ));

    // PUT /portal/orders/{id} - 注文変更・キャンセル
    register_rest_route('jsbb/v1', '/portal/orders/(?P<id>\d+)', array(
        'methods'  => 'PUT',
        'callback' => function ($request) {
            $post_id = (int) $request['id'];
            $post    = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_order') {
                return new WP_Error('not_found', '注文が見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();
            $action = isset($params['action']) ? $params['action'] : '';

            // セキュリティ: team_id が送られている場合は注文の所有者と照合
            $stored_team_id = (int) get_post_meta($post_id, '_portal_order_team_id', true);
            if (isset($params['team_id']) && (int) $params['team_id'] !== $stored_team_id) {
                return new WP_Error('forbidden', '権限がありません', array('status' => 403));
            }

            // 期限チェック
            $tournament_id = (int) get_post_meta($post_id, '_portal_order_tournament_id', true);
            $tournament    = get_post($tournament_id);
            if ($tournament) {
                $deadline = get_post_meta($tournament_id, '_portal_tournament_deadline', true);
                if ($deadline && strtotime($deadline) < time()) {
                    return new WP_Error('expired', '編集期限を過ぎています', array('status' => 403));
                }
            }

            $team_id    = (int) get_post_meta($post_id, '_portal_order_team_id', true);
            $team_post  = get_post($team_id);
            $team_name  = $team_post ? $team_post->post_title : 'チーム';
            $team_email = get_post_meta($team_id, '_portal_team_email', true) ?: '';

            $history_json = get_post_meta($post_id, '_portal_order_history', true);
            $history      = $history_json ? json_decode($history_json, true) : array();
            if (!is_array($history)) $history = array();

            $tournament_post = get_post($tournament_id);
            $tournament_name = $tournament_post ? $tournament_post->post_title : '';

            if ($action === 'cancel') {
                $old_items = json_decode(get_post_meta($post_id, '_portal_order_items', true), true) ?: array();
                $old_total = (int) get_post_meta($post_id, '_portal_order_total', true);

                update_post_meta($post_id, '_portal_order_status', 'cancelled');
                $history[] = array(
                    'action' => 'cancelled',
                    'date'   => current_time('mysql'),
                    'items'  => $old_items,
                    'total'  => $old_total,
                );
                update_post_meta($post_id, '_portal_order_history', wp_slash(json_encode($history, JSON_UNESCAPED_UNICODE)));
                jsbb_portal_log_activity($tournament_id, $team_id, 'order_cancelled',
                    $team_name . 'が注文をキャンセルしました', 'team');

            } elseif ($action === 'update' && isset($params['items'])) {
                $items      = $params['items'];
                $old_items  = json_decode(get_post_meta($post_id, '_portal_order_items', true), true) ?: array();
                $old_total  = (int) get_post_meta($post_id, '_portal_order_total', true);

                $total      = 0;
                $body_total = 0;
                $name_total = 0;
                foreach ($items as &$item) {
                    $product = get_post($item['product_id']);
                    if (!$product || $product->post_type !== 'portal_product') continue;
                    $price      = (int) get_post_meta($item['product_id'], '_portal_prod_price', true);
                    $name_price = (int) get_post_meta($item['product_id'], '_portal_prod_name_price', true);
                    $has_name   = !empty($item['has_name']);
                    $quantity   = (int) $item['quantity'];

                    $item['price']        = $price;
                    $item['name_price']   = $has_name ? $name_price : 0;
                    $item['product_name'] = $product->post_title;
                    $item['subtotal']     = ($price + ($has_name ? $name_price : 0)) * $quantity;

                    $body_total += $price * $quantity;
                    if ($has_name) $name_total += $name_price * $quantity;
                    $total += $item['subtotal'];
                }
                unset($item);

                $history[] = array(
                    'action'     => 'updated',
                    'date'       => current_time('mysql'),
                    'old_items'  => $old_items,
                    'old_total'  => $old_total,
                    'new_items'  => $items,
                    'new_total'  => $total,
                );
                update_post_meta($post_id, '_portal_order_history', wp_slash(json_encode($history, JSON_UNESCAPED_UNICODE)));
                update_post_meta($post_id, '_portal_order_items', wp_slash(json_encode($items, JSON_UNESCAPED_UNICODE)));
                update_post_meta($post_id, '_portal_order_total', $total);
                update_post_meta($post_id, '_portal_order_body_total', $body_total);
                update_post_meta($post_id, '_portal_order_name_total', $name_total);
                update_post_meta($post_id, '_portal_order_status', 'confirmed');
                jsbb_portal_log_activity($tournament_id, $team_id, 'order_updated',
                    $team_name . 'が注文を変更しました（合計: ¥' . number_format($total) . '）', 'team');

                jsbb_send_order_email(
                    $post_id, $team_name, $team_email, $tournament_name,
                    $items, $total, $body_total, $name_total, 'updated', $old_items
                );
            } else {
                return new WP_Error('bad_request', '無効なアクションです', array('status' => 400));
            }

            return rest_ensure_response(jsbb_build_portal_order($post_id));
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // GET /portal/tournaments/{id}/orders
    register_rest_route('jsbb/v1', '/portal/tournaments/(?P<id>\d+)/orders', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $tournament_id = (int) $request['id'];
            $team_id       = $request->get_param('team_id');

            $meta_query = array(
                array('key' => '_portal_order_tournament_id', 'value' => $tournament_id),
            );
            if ($team_id) {
                $meta_query[] = array('key' => '_portal_order_team_id', 'value' => (int) $team_id);
            }

            $posts = get_posts(array(
                'post_type'      => 'portal_order',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
                'meta_query'     => $meta_query,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ));

            $orders = array();
            foreach ($posts as $p) {
                $order               = jsbb_build_portal_order($p->ID);
                $team_post           = get_post($order['team_id']);
                $tournament_post     = get_post($order['tournament_id']);
                $order['team_name']       = $team_post ? $team_post->post_title : '';
                $order['tournament_name'] = $tournament_post ? $tournament_post->post_title : '';
                $orders[] = $order;
            }

            return rest_ensure_response($orders);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // GET /portal/admin/orders - 全注文一覧（管理者用）
    register_rest_route('jsbb/v1', '/portal/admin/orders', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $tournament_id  = $request->get_param('tournament_id');
            $team_post_id   = $request->get_param('team_post_id');

            $args = array(
                'post_type'      => 'portal_order',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
                'orderby'        => 'date',
                'order'          => 'DESC',
            );
            $meta_query = array();
            if ($tournament_id) {
                $meta_query[] = array('key' => '_portal_order_tournament_id', 'value' => (int) $tournament_id);
            }
            if ($team_post_id) {
                $meta_query[] = array('key' => '_portal_order_team_id', 'value' => (int) $team_post_id);
            }
            if (!empty($meta_query)) {
                $args['meta_query'] = $meta_query;
            }

            $posts  = get_posts($args);
            $orders = array();
            foreach ($posts as $p) {
                $order               = jsbb_build_portal_order($p->ID);
                $team_post           = get_post($order['team_id']);
                $tournament_post     = get_post($order['tournament_id']);
                $team_email          = get_post_meta($order['team_id'], '_portal_team_email', true) ?: '';
                $order['team_name']          = $team_post ? $team_post->post_title : '';
                $order['team_email']         = $team_email;
                $order['team_region_branch'] = get_post_meta($order['team_id'], '_portal_team_region_branch', true) ?: '';
                $order['tournament_name']    = $tournament_post ? $tournament_post->post_title : '';
                $orders[] = $order;
            }

            return rest_ensure_response($orders);
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));

    // -----------------------------------------------
    // GET /portal/admin/receipts - 領収書発行履歴
    // POST /portal/admin/receipts - 領収書発行（連番付与）
    // -----------------------------------------------
    register_rest_route('jsbb/v1', '/portal/admin/receipts', array(
        array(
            'methods'  => 'GET',
            'callback' => function () {
                $history = json_decode(get_option('jsbb_receipt_history', '[]'), true);
                return rest_ensure_response(array_values(array_reverse((array) $history)));
            },
            'permission_callback' => function () {
                return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
            },
        ),
        array(
            'methods'  => 'POST',
            'callback' => function ($request) {
                $params     = $request->get_json_params();
                $order_id   = isset($params['order_id'])   ? intval($params['order_id'])                   : 0;
                $team_name  = isset($params['team_name'])  ? sanitize_text_field($params['team_name'])     : '';
                $branch     = isset($params['branch'])     ? sanitize_text_field($params['branch'])        : '';
                $title_text = isset($params['title'])      ? sanitize_text_field($params['title'])         : '';
                $amount     = isset($params['amount'])     ? intval($params['amount'])                     : 0;

                // 連番カウンター（年度リセット対応: YYYY-NNNN 形式）
                $year        = (int) date('Y');
                $counter_key = 'jsbb_receipt_counter_' . $year;
                $counter     = (int) get_option($counter_key, 0) + 1;
                update_option($counter_key, $counter);

                $receipt_no = $year . '-' . str_pad($counter, 4, '0', STR_PAD_LEFT);
                $issued_at  = current_time('mysql');

                // 履歴保存
                $history = json_decode(get_option('jsbb_receipt_history', '[]'), true);
                if (!is_array($history)) $history = array();
                $history[] = array(
                    'receipt_no' => $receipt_no,
                    'order_id'   => $order_id,
                    'team_name'  => $team_name,
                    'branch'     => $branch,
                    'title'      => $title_text,
                    'amount'     => $amount,
                    'issued_at'  => $issued_at,
                );
                update_option('jsbb_receipt_history', wp_json_encode($history));

                return rest_ensure_response(array(
                    'receipt_no' => $receipt_no,
                    'issued_at'  => $issued_at,
                ));
            },
            'permission_callback' => function () {
                return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
            },
        ),
    ));
});

// ==========================================
// ヘルパー関数
// ==========================================

function jsbb_save_portal_product_meta($post_id, $tournament_id, $params) {
    if ($tournament_id !== null) {
        update_post_meta($post_id, '_portal_prod_tournament_id', $tournament_id);
    }

    $simple_meta = array(
        'price'           => '_portal_prod_price',
        'has_name'        => '_portal_prod_has_name',
        'name_price'      => '_portal_prod_name_price',
        'name_max_chars'  => '_portal_prod_name_max_chars',
        'min_quantity'    => '_portal_prod_min_quantity',
        'image_url'       => '_portal_prod_image_url',
        'description'     => '_portal_prod_description',
        'sort_order'      => '_portal_prod_sort_order',
        'cancel_deadline' => '_portal_prod_cancel_deadline',
    );
    foreach ($simple_meta as $key => $meta_key) {
        if (isset($params[$key])) {
            update_post_meta($post_id, $meta_key, $params[$key]);
        }
    }
    foreach (array('sizes', 'colors', 'images') as $json_field) {
        if (isset($params[$json_field])) {
            update_post_meta($post_id, "_portal_prod_{$json_field}",
                wp_slash(json_encode($params[$json_field], JSON_UNESCAPED_UNICODE)));
        }
    }
    if (!get_post_meta($post_id, '_portal_prod_created_at', true)) {
        update_post_meta($post_id, '_portal_prod_created_at', current_time('mysql'));
    }
}

function jsbb_build_portal_product($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'portal_product') return null;

    $decode = function($meta_key) use ($post_id) {
        $json = get_post_meta($post_id, $meta_key, true);
        return $json ? json_decode($json, true) : array();
    };

    return array(
        'id'              => $post->ID,
        'name'            => $post->post_title,
        'tournament_id'   => (int) get_post_meta($post_id, '_portal_prod_tournament_id', true),
        'price'           => (int) get_post_meta($post_id, '_portal_prod_price', true),
        'name_price'      => (int) get_post_meta($post_id, '_portal_prod_name_price', true),
        'name_max_chars'  => (int) get_post_meta($post_id, '_portal_prod_name_max_chars', true) ?: 20,
        'sizes'           => $decode('_portal_prod_sizes'),
        'colors'          => $decode('_portal_prod_colors'),
        'images'          => $decode('_portal_prod_images'),
        'has_name'        => (bool) get_post_meta($post_id, '_portal_prod_has_name', true),
        'min_quantity'    => (int) get_post_meta($post_id, '_portal_prod_min_quantity', true) ?: 1,
        'image_url'       => get_post_meta($post_id, '_portal_prod_image_url', true) ?: '',
        'description'     => get_post_meta($post_id, '_portal_prod_description', true) ?: '',
        'cancel_deadline' => get_post_meta($post_id, '_portal_prod_cancel_deadline', true) ?: '',
        'sort_order'      => (int) get_post_meta($post_id, '_portal_prod_sort_order', true),
        'created_at'      => get_post_meta($post_id, '_portal_prod_created_at', true) ?: '',
    );
}

function jsbb_build_portal_order($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'portal_order') return null;

    $items_json   = get_post_meta($post_id, '_portal_order_items', true);
    $history_json = get_post_meta($post_id, '_portal_order_history', true);
    $items        = $items_json ? json_decode($items_json, true) : array();

    // 壊れたデータの自動修復
    if (!$items && $items_json) {
        $repaired = preg_replace('/(?<![\\\\])u([0-9a-fA-F]{4})/', '\\u$1', $items_json);
        $items    = json_decode($repaired, true);
        if ($items) {
            update_post_meta($post_id, '_portal_order_items', wp_slash(json_encode($items, JSON_UNESCAPED_UNICODE)));
        } else {
            $items = array();
        }
    }

    return array(
        'id'            => $post->ID,
        'tournament_id' => (int) get_post_meta($post_id, '_portal_order_tournament_id', true),
        'team_id'       => (int) get_post_meta($post_id, '_portal_order_team_id', true),
        'items'         => $items ?: array(),
        'total'         => (int) get_post_meta($post_id, '_portal_order_total', true),
        'body_total'    => (int) get_post_meta($post_id, '_portal_order_body_total', true),
        'name_total'    => (int) get_post_meta($post_id, '_portal_order_name_total', true),
        'status'        => get_post_meta($post_id, '_portal_order_status', true) ?: 'confirmed',
        'history'       => $history_json ? json_decode($history_json, true) : array(),
        'created_at'    => get_post_meta($post_id, '_portal_order_created_at', true) ?: '',
    );
}

// ==========================================
// メール送信
// ==========================================

function jsbb_send_order_email($order_id, $team_name, $team_email, $tournament_name, $items, $total, $body_total, $name_total, $action = 'placed', $old_items = null) {
    $ts         = current_time('Y-m-d H:i:s');
    $ts_stamp   = str_replace(array('-', ':', ' '), '', current_time('YmdHis'));
    $action_label = $action === 'updated' ? '注文変更' : '注文完了';
    $subject    = "【{$tournament_name}】{$action_label}_{$team_name}_{$ts_stamp}";

    // チームIDを注文メタから取得
    $team_id = (int) get_post_meta($order_id, '_portal_order_team_id', true);

    $sizes_order = array('120', '130', '140', '150', 'SS', 'S', 'M', 'L', 'LL', '3L', '4L', '5L');

    // アイテムを has_name で分割
    $no_name_items   = array();
    $with_name_items = array();
    $names_used      = array();
    foreach ($items as $item) {
        if (!empty($item['has_name'])) {
            $with_name_items[] = $item;
            if (!empty($item['name'])) $names_used[] = $item['name'];
        } else {
            $no_name_items[] = $item;
        }
    }
    $names_used = array_unique($names_used);

    // 変更差分HTML
    $diff_html = '';
    if ($action === 'updated' && is_array($old_items) && !empty($old_items)) {
        $diff_html = jsbb_build_order_diff_html($old_items, $items);
    }

    $html = jsbb_build_order_email_html(
        $ts, $team_name, $team_email, $tournament_name,
        $no_name_items, $with_name_items, $names_used,
        $sizes_order, $body_total, $name_total, $total, $action_label, $diff_html, $team_id
    );

    // ヘッダー
    $from    = 'shop@jsbb-fukuoka.com';
    $headers = array(
        'Content-Type: text/html; charset=UTF-8',
        "From: 福岡県軟式野球連盟ポータル <{$from}>",
    );

    // 管理者へ通知
    wp_mail(JSBB_ORDER_NOTIFY_TO, $subject, $html, $headers);

    // 注文者へ控えメール
    if ($team_email) {
        $customer_headers = array(
            'Content-Type: text/html; charset=UTF-8',
            "From: 福岡県軟式野球連盟ポータル <{$from}>",
        );
        $customer_subject = "[注文控え] {$subject}";
        $customer_html    = '<p>このメールは注文完了のお知らせです。以下の内容でご注文を承りました。</p>' . $html;
        wp_mail($team_email, $customer_subject, $customer_html, $customer_headers);
    }
}

// ==========================================
// 注文変更差分HTML
// ==========================================
function jsbb_build_order_diff_html($old_items, $new_items) {
    // キー: color|size|has_name
    $key = function($item) {
        return ($item['color'] ?? '') . '|' . ($item['size'] ?? '') . '|' . (!empty($item['has_name']) ? '1' : '0');
    };
    $label = function($item) {
        $s = ($item['color'] ?? '') . ' ' . ($item['size'] ?? '') . ' ';
        $s .= !empty($item['has_name']) ? 'ネームあり' : 'ネームなし';
        if (!empty($item['has_name']) && !empty($item['name'])) $s .= ' 「' . $item['name'] . '」';
        return $s;
    };

    $old_map = array();
    foreach ($old_items as $item) $old_map[$key($item)] = $item;
    $new_map = array();
    foreach ($new_items as $item) $new_map[$key($item)] = $item;

    $rows = '';

    // 追加・変更
    foreach ($new_map as $k => $ni) {
        if (!isset($old_map[$k])) {
            $rows .= '<tr><td style="padding:4px 8px;color:#c8102e;font-weight:700;">追加</td>'
                   . '<td style="padding:4px 8px;color:#c8102e;">' . esc_html($label($ni)) . '</td>'
                   . '<td style="padding:4px 8px;color:#c8102e;text-align:right;">×' . (int)$ni['quantity'] . '枚</td></tr>';
        } elseif ((int)$old_map[$k]['quantity'] !== (int)$ni['quantity']) {
            $rows .= '<tr><td style="padding:4px 8px;color:#e65100;font-weight:700;">変更</td>'
                   . '<td style="padding:4px 8px;color:#e65100;">' . esc_html($label($ni)) . '</td>'
                   . '<td style="padding:4px 8px;color:#e65100;text-align:right;">'
                   . (int)$old_map[$k]['quantity'] . '枚 → ' . (int)$ni['quantity'] . '枚</td></tr>';
        }
    }

    // 削除
    foreach ($old_map as $k => $oi) {
        if (!isset($new_map[$k])) {
            $rows .= '<tr><td style="padding:4px 8px;color:#666;font-weight:700;">削除</td>'
                   . '<td style="padding:4px 8px;color:#666;text-decoration:line-through;">' . esc_html($label($oi)) . '</td>'
                   . '<td style="padding:4px 8px;color:#666;text-align:right;text-decoration:line-through;">×' . (int)$oi['quantity'] . '枚</td></tr>';
        }
    }

    if (!$rows) return '';

    return '<div style="margin:16px 0;padding:12px;border:1px solid #fcc;background:#fff8f8;">'
         . '<p style="margin:0 0 8px;font-weight:700;font-size:14px;color:#c8102e;">【変更内容】</p>'
         . '<table style="border-collapse:collapse;width:100%;font-size:13px;">' . $rows . '</table>'
         . '</div>';
}

function jsbb_build_order_email_html(
    $ts, $team_name, $team_email, $tournament_name,
    $no_name_items, $with_name_items, $names_used,
    $sizes_order, $body_total, $name_total, $total, $action_label, $diff_html = '', $team_id = 0
) {
    $table_style    = 'border-collapse:collapse;margin:8px 0;width:100%;';
    $th_style       = 'padding:6px 12px;border:1px solid #ddd;background:#f5f5f5;text-align:center;font-size:14px;';
    $td_style       = 'padding:5px 10px;border:1px solid #ddd;text-align:center;font-size:14px;';
    $td_size        = 'padding:5px 10px;border:1px solid #ddd;text-align:left;font-size:14px;';
    $team_id_display = sprintf('%08d', $team_id);

    function build_size_table($items, $sizes_order, $table_style, $th_style, $td_style, $td_size) {
        $grid = array();
        $total_navy = 0; $total_white = 0;
        foreach ($items as $item) {
            $size  = $item['size'] ?? '';
            $color = $item['color'] ?? '';
            $qty   = (int)($item['quantity'] ?? 0);
            if (!isset($grid[$size])) $grid[$size] = array('ネイビー' => 0, 'ホワイト' => 0);
            if (isset($grid[$size][$color])) $grid[$size][$color] += $qty;
        }
        if (empty($grid)) return array('html' => '', 'navy' => 0, 'white' => 0);

        $rows = '';
        foreach ($sizes_order as $size) {
            if (!isset($grid[$size])) continue;
            $navy  = $grid[$size]['ネイビー'];
            $white = $grid[$size]['ホワイト'];
            if ($navy === 0 && $white === 0) continue;
            $total_navy  += $navy;
            $total_white += $white;
            $rows .= "<tr><td style='{$td_size}'>{$size}</td>"
                   . "<td style='{$td_style}'>" . ($navy ?: '') . "</td>"
                   . "<td style='{$td_style}'>" . ($white ?: '') . "</td></tr>";
        }
        if (!$rows) return array('html' => '', 'navy' => 0, 'white' => 0);

        $html = "<table style='{$table_style}'>"
              . "<thead><tr>"
              . "<th style='{$th_style}'>サイズ</th>"
              . "<th style='{$th_style}'>ネイビー</th>"
              . "<th style='{$th_style}'>ホワイト</th>"
              . "</tr></thead><tbody>{$rows}"
              . "<tr style='font-weight:700;background:#fafafa;'>"
              . "<td style='{$td_size}'>合計</td>"
              . "<td style='{$td_style}'>{$total_navy}枚</td>"
              . "<td style='{$td_style}'>{$total_white}枚</td>"
              . "</tr></tbody></table>";

        return array('html' => $html, 'navy' => $total_navy, 'white' => $total_white);
    }

    $no_table   = build_size_table($no_name_items, $sizes_order, $table_style, $th_style, $td_style, $td_size);
    $with_table = build_size_table($with_name_items, $sizes_order, $table_style, $th_style, $td_style, $td_size);

    // ネームなし小計
    $no_name_count = ($no_table['navy'] + $no_table['white']);
    // ネームあり小計（単価は items から取得）
    $sample_price  = 0;
    if (!empty($no_name_items[0]['price'])) $sample_price = (int)$no_name_items[0]['price'];
    if (!$sample_price && !empty($with_name_items[0]['price'])) $sample_price = (int)$with_name_items[0]['price'];

    $html = <<<HTML
<div style="font-family:'Hiragino Kaku Gothic ProN','メイリオ',sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#fff;">
  <div style="background:#c8102e;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;margin-bottom:0;">
    <h2 style="margin:0;font-size:18px;">【{$tournament_name}】{$action_label}</h2>
  </div>
  <div style="border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <table style="width:100%;margin-bottom:16px;">
      <tr><td style="color:#666;width:120px;padding:4px 0;font-size:14px;">タイムスタンプ</td><td style="font-size:14px;">{$ts}</td></tr>
      <tr><td style="color:#666;padding:4px 0;font-size:14px;">チーム名</td><td style="font-size:14px;">{$team_name}</td></tr>
      <tr><td style="color:#666;padding:4px 0;font-size:14px;">メールアドレス</td><td style="font-size:14px;">{$team_email}</td></tr>
    </table>
HTML;

    // 変更差分セクション
    if ($diff_html) {
        $html .= $diff_html;
    }

    if ($no_table['html']) {
        $no_body = $body_total - ($name_total > 0 ? 0 : 0); // 本体のみ（ネームなし分）
        $html .= <<<HTML
    <h3 style="background:#f5f5f5;padding:10px 14px;border-left:4px solid #c8102e;margin:20px 0 8px;font-size:15px;">【ネームなし】</h3>
    {$no_table['html']}
HTML;
    }

    if ($with_table['html']) {
        $names_str = implode('、', $names_used);
        $html .= <<<HTML
    <h3 style="background:#f5f5f5;padding:10px 14px;border-left:4px solid #c8102e;margin:20px 0 8px;font-size:15px;">【ネームあり】</h3>
    <p style="font-size:14px;margin:4px 0 8px;">ネーム指定：<strong>{$names_str}</strong></p>
    {$with_table['html']}
HTML;
    }

    $formatted_body  = number_format($body_total);
    $formatted_name  = number_format($name_total);
    $formatted_total = number_format($total);

    $html .= <<<HTML
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px;margin-top:20px;">
      <table style="width:100%;">
        <tr><td style="font-size:14px;color:#555;">本体代金</td><td style="text-align:right;font-size:14px;">¥{$formatted_body}</td></tr>
HTML;
    if ($name_total > 0) {
        $html .= "<tr><td style='font-size:14px;color:#555;'>ネーム代金</td><td style='text-align:right;font-size:14px;'>¥{$formatted_name}</td></tr>";
    }
    $html .= <<<HTML
        <tr style="border-top:1px solid #ffe082;">
          <td style="font-size:16px;font-weight:700;padding-top:8px;">お支払い合計</td>
          <td style="text-align:right;font-size:16px;font-weight:700;color:#c8102e;padding-top:8px;">¥{$formatted_total}</td>
        </tr>
      </table>
      <p style="font-size:12px;color:#888;margin:8px 0 0;">※お支払いは大会受付にてお渡し時にお願いします</p>
    </div>
    <p style="font-size:12px;color:#aaa;margin-top:24px;text-align:center;">福岡県軟式野球連盟 チームポータル</p>
    <p style="font-size:10px;color:#ccc;margin-top:8px;text-align:center;letter-spacing:0.5px;">{$ts} / Team ID: {$team_id_display}</p>
  </div>
</div>
HTML;

    return $html;
}

// ==========================================
// 領収証お知らせ CPT
// ==========================================
add_action('init', function () {
    register_post_type('portal_rcpt_notice', array(
        'public'       => false,
        'show_ui'      => false,
        'show_in_rest' => false,
        'supports'     => array('title'),
    ));
});

// ==========================================
// 領収証お知らせ REST API
// ==========================================
add_action('rest_api_init', function () {

    // GET /portal/admin/receipt-notices
    register_rest_route('jsbb/v1', '/portal/admin/receipt-notices', array(
        'methods'             => 'GET',
        'callback'            => function ($request) {
            $portal_key = $request->get_param('portal_key');
            if ($portal_key !== (defined('JSBB_PORTAL_KEY') ? JSBB_PORTAL_KEY : 'open2000')) {
                return new WP_Error('forbidden', '認証エラー', array('status' => 403));
            }
            $tournament_id = (int) $request->get_param('tournament_id');
            $meta_query = array(array('key' => '_rcpt_notice_status', 'value' => 'active'));
            if ($tournament_id) {
                $meta_query[] = array('key' => '_rcpt_notice_tournament_id', 'value' => $tournament_id);
            }
            $posts = get_posts(array(
                'post_type'      => 'portal_rcpt_notice',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
                'meta_query'     => $meta_query,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ));
            $result = array();
            foreach ($posts as $p) {
                $amounts_raw = get_post_meta($p->ID, '_rcpt_notice_amounts', true);
                $result[] = array(
                    'id'            => $p->ID,
                    'team_id'       => (int) get_post_meta($p->ID, '_rcpt_notice_team_id', true),
                    'team_name'     => get_post_meta($p->ID, '_rcpt_notice_team_name', true),
                    'team_email'    => get_post_meta($p->ID, '_rcpt_notice_team_email', true),
                    'tournament_id' => (int) get_post_meta($p->ID, '_rcpt_notice_tournament_id', true),
                    'tournament_name' => get_post_meta($p->ID, '_rcpt_notice_tournament_name', true),
                    'amounts'       => $amounts_raw ? json_decode($amounts_raw, true) : array(),
                    'order_total'   => (int) get_post_meta($p->ID, '_rcpt_notice_order_total', true),
                    'created_at'    => get_post_meta($p->ID, '_rcpt_notice_created_at', true),
                );
            }
            return rest_ensure_response($result);
        },
        'permission_callback' => '__return_true',
    ));

    // POST /portal/admin/receipt-notices
    register_rest_route('jsbb/v1', '/portal/admin/receipt-notices', array(
        'methods'             => 'POST',
        'callback'            => function ($request) {
            $portal_key = $request->get_param('portal_key');
            if ($portal_key !== (defined('JSBB_PORTAL_KEY') ? JSBB_PORTAL_KEY : 'open2000')) {
                return new WP_Error('forbidden', '認証エラー', array('status' => 403));
            }
            $body = $request->get_json_params();
            $notices = $body['notices'] ?? array();
            if (empty($notices)) {
                return new WP_Error('invalid', 'noticesが必要です', array('status' => 400));
            }
            $created = array();
            $now = current_time('Y-m-d H:i:s');
            foreach ($notices as $n) {
                $post_id = wp_insert_post(array(
                    'post_type'   => 'portal_rcpt_notice',
                    'post_status' => 'publish',
                    'post_title'  => '領収証お知らせ_' . ($n['team_name'] ?? '') . '_' . date('YmdHis'),
                ));
                if (is_wp_error($post_id)) continue;
                update_post_meta($post_id, '_rcpt_notice_team_id',        (int)($n['team_id'] ?? 0));
                update_post_meta($post_id, '_rcpt_notice_team_name',      sanitize_text_field($n['team_name'] ?? ''));
                update_post_meta($post_id, '_rcpt_notice_team_email',     sanitize_email($n['team_email'] ?? ''));
                update_post_meta($post_id, '_rcpt_notice_tournament_id',  (int)($n['tournament_id'] ?? 0));
                update_post_meta($post_id, '_rcpt_notice_tournament_name', sanitize_text_field($n['tournament_name'] ?? ''));
                update_post_meta($post_id, '_rcpt_notice_amounts',        json_encode(array_map('intval', $n['amounts'] ?? array())));
                update_post_meta($post_id, '_rcpt_notice_order_total',    (int)($n['order_total'] ?? 0));
                update_post_meta($post_id, '_rcpt_notice_status',         'active');
                update_post_meta($post_id, '_rcpt_notice_created_at',     $now);
                // メール送信
                if (!empty($n['team_email'])) {
                    jsbb_send_receipt_notice_email(
                        $n['team_name'] ?? '',
                        $n['team_email'],
                        $n['tournament_name'] ?? '',
                        array_map('intval', $n['amounts'] ?? array()),
                        (int)($n['team_id'] ?? 0),
                        $now
                    );
                }
                $created[] = $post_id;
            }
            return rest_ensure_response(array('created' => count($created)));
        },
        'permission_callback' => '__return_true',
    ));

    // DELETE /portal/admin/receipt-notices/{id}
    register_rest_route('jsbb/v1', '/portal/admin/receipt-notices/(?P<id>\d+)', array(
        'methods'             => 'DELETE',
        'callback'            => function ($request) {
            $portal_key = $request->get_param('portal_key');
            if ($portal_key !== (defined('JSBB_PORTAL_KEY') ? JSBB_PORTAL_KEY : 'open2000')) {
                return new WP_Error('forbidden', '認証エラー', array('status' => 403));
            }
            $post_id = (int) $request['id'];
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_rcpt_notice') {
                return new WP_Error('not_found', '見つかりません', array('status' => 404));
            }
            update_post_meta($post_id, '_rcpt_notice_status', 'deleted');
            return rest_ensure_response(array('deleted' => true));
        },
        'permission_callback' => '__return_true',
    ));

    // GET /portal/team/{team_id}/receipt-notices
    register_rest_route('jsbb/v1', '/portal/team/(?P<team_id>\d+)/receipt-notices', array(
        'methods'             => 'GET',
        'callback'            => function ($request) {
            $portal_key = $request->get_param('portal_key');
            if ($portal_key !== (defined('JSBB_PORTAL_KEY') ? JSBB_PORTAL_KEY : 'open2000')) {
                return new WP_Error('forbidden', '認証エラー', array('status' => 403));
            }
            $team_id = (int) $request['team_id'];
            $posts = get_posts(array(
                'post_type'      => 'portal_rcpt_notice',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
                'meta_query'     => array(
                    array('key' => '_rcpt_notice_team_id',  'value' => $team_id),
                    array('key' => '_rcpt_notice_status',   'value' => 'active'),
                ),
                'orderby' => 'date',
                'order'   => 'DESC',
            ));
            $result = array();
            foreach ($posts as $p) {
                $amounts_raw = get_post_meta($p->ID, '_rcpt_notice_amounts', true);
                $result[] = array(
                    'id'              => $p->ID,
                    'tournament_id'   => (int) get_post_meta($p->ID, '_rcpt_notice_tournament_id', true),
                    'tournament_name' => get_post_meta($p->ID, '_rcpt_notice_tournament_name', true),
                    'amounts'         => $amounts_raw ? json_decode($amounts_raw, true) : array(),
                    'order_total'     => (int) get_post_meta($p->ID, '_rcpt_notice_order_total', true),
                    'created_at'      => get_post_meta($p->ID, '_rcpt_notice_created_at', true),
                );
            }
            return rest_ensure_response($result);
        },
        'permission_callback' => '__return_true',
    ));
});

// ==========================================
// 領収証お知らせメール送信
// ==========================================
function jsbb_send_receipt_notice_email($team_name, $team_email, $tournament_name, $amounts, $team_id, $ts) {
    $from    = 'shop@jsbb-fukuoka.com';
    $headers = array(
        'Content-Type: text/html; charset=UTF-8',
        "From: 福岡県軟式野球連盟ポータル <{$from}>",
    );
    $subject = "【{$tournament_name}】領収証のご用意ができました";

    $team_id_display = sprintf('%08d', $team_id);
    $amounts_html = '';
    if (count($amounts) === 1) {
        $amounts_html = '<p style="font-size:16px;font-weight:700;color:#c8102e;">¥' . number_format($amounts[0]) . '</p>';
    } else {
        $amounts_html = '<ul style="padding-left:20px;">';
        foreach ($amounts as $i => $amt) {
            $amounts_html .= '<li style="font-size:14px;">第' . ($i + 1) . '領収証：¥' . number_format($amt) . '</li>';
        }
        $amounts_html .= '</ul>';
    }

    $html = <<<HTML
<div style="font-family:'Hiragino Kaku Gothic ProN','メイリオ',sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#fff;">
  <div style="background:#c8102e;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">
    <h2 style="margin:0;font-size:18px;">領収証のご用意ができました</h2>
  </div>
  <div style="border:1px solid #e0e0e0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
    <p style="font-size:15px;">{$team_name} 様</p>
    <p style="font-size:14px;color:#333;">
      下記大会の領収証が発行されました。<br>
      ポータルサイトのマイページにログイン後、対象大会の「領収証」タブより印刷・ダウンロードが可能です。
    </p>
    <table style="width:100%;margin:16px 0;">
      <tr><td style="color:#666;width:120px;font-size:14px;padding:4px 0;">大会名</td><td style="font-size:14px;">{$tournament_name}</td></tr>
      <tr><td style="color:#666;font-size:14px;padding:4px 0;">金額</td><td>{$amounts_html}</td></tr>
    </table>
    <div style="background:#f5f5f5;border-radius:6px;padding:14px 18px;margin-top:16px;">
      <p style="font-size:13px;color:#555;margin:0;">マイページURL: https://jsbb-fukuoka.com/portal/mypage/</p>
    </div>
    <p style="font-size:12px;color:#aaa;margin-top:24px;text-align:center;">福岡県軟式野球連盟 チームポータル</p>
    <p style="font-size:10px;color:#ccc;margin-top:8px;text-align:center;">{$ts} / Team ID: {$team_id_display}</p>
  </div>
</div>
HTML;

    wp_mail($team_email, $subject, $html, $headers);
}
