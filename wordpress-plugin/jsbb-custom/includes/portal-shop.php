<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ポータルショップ CPT & REST API
// ==========================================

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

            update_post_meta($post_id, '_portal_prod_tournament_id', $tournament_id);
            update_post_meta($post_id, '_portal_prod_price', isset($params['price']) ? (int) $params['price'] : 0);
            update_post_meta($post_id, '_portal_prod_sizes', isset($params['sizes']) ? wp_slash(json_encode($params['sizes'], JSON_UNESCAPED_UNICODE)) : '[]');
            update_post_meta($post_id, '_portal_prod_has_name', isset($params['has_name']) ? (bool) $params['has_name'] : false);
            update_post_meta($post_id, '_portal_prod_min_quantity', isset($params['min_quantity']) ? (int) $params['min_quantity'] : 1);
            update_post_meta($post_id, '_portal_prod_image_url', isset($params['image_url']) ? esc_url_raw($params['image_url']) : '');
            update_post_meta($post_id, '_portal_prod_description', isset($params['description']) ? sanitize_textarea_field($params['description']) : '');
            update_post_meta($post_id, '_portal_prod_sort_order', isset($params['sort_order']) ? (int) $params['sort_order'] : 0);
            update_post_meta($post_id, '_portal_prod_created_at', current_time('mysql'));

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

            $meta_map = array(
                'price'        => '_portal_prod_price',
                'has_name'     => '_portal_prod_has_name',
                'min_quantity' => '_portal_prod_min_quantity',
                'image_url'    => '_portal_prod_image_url',
                'description'  => '_portal_prod_description',
                'sort_order'   => '_portal_prod_sort_order',
            );

            foreach ($meta_map as $key => $meta_key) {
                if (isset($params[$key])) {
                    update_post_meta($post_id, $meta_key, $params[$key]);
                }
            }
            if (isset($params['sizes'])) {
                update_post_meta($post_id, '_portal_prod_sizes', wp_slash(json_encode($params['sizes'], JSON_UNESCAPED_UNICODE)));
            }

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
            $items = isset($params['items']) ? $params['items'] : array();

            if (!$team_id || empty($items)) {
                return new WP_Error('bad_request', 'チームIDと注文内容が必要です', array('status' => 400));
            }

            // 合計金額計算 & 商品名を最新から取得
            $total = 0;
            foreach ($items as &$item) {
                $product = get_post($item['product_id']);
                if (!$product || $product->post_type !== 'portal_product') continue;
                $price = (int) get_post_meta($item['product_id'], '_portal_prod_price', true);
                $quantity = (int) $item['quantity'];
                $item['price'] = $price;
                $item['product_name'] = $product->post_title;
                $item['subtotal'] = $price * $quantity;
                $total += $item['subtotal'];
            }
            unset($item);

            $team_post = get_post($team_id);
            $team_name = $team_post ? $team_post->post_title : 'チーム';

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
            update_post_meta($post_id, '_portal_order_status', 'confirmed');
            update_post_meta($post_id, '_portal_order_created_at', current_time('mysql'));
            // 変更履歴の初期化
            $history = array(array(
                'action' => 'created',
                'date' => current_time('mysql'),
                'items' => $items,
                'total' => $total,
            ));
            update_post_meta($post_id, '_portal_order_history', wp_slash(json_encode($history, JSON_UNESCAPED_UNICODE)));

            // 履歴記録
            jsbb_portal_log_activity($tournament_id, $team_id, 'order_placed', $team_name . 'が注文しました（合計: ¥' . number_format($total) . '）', 'team');

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
            $post = get_post($post_id);
            if (!$post || $post->post_type !== 'portal_order') {
                return new WP_Error('not_found', '注文が見つかりません', array('status' => 404));
            }

            $params = $request->get_json_params();
            $action = isset($params['action']) ? $params['action'] : '';

            // 期限チェック
            $tournament_id = (int) get_post_meta($post_id, '_portal_order_tournament_id', true);
            $tournament = get_post($tournament_id);
            if ($tournament) {
                $deadline = get_post_meta($tournament_id, '_portal_tournament_deadline', true);
                if ($deadline && strtotime($deadline) < time()) {
                    return new WP_Error('expired', '編集期限を過ぎています', array('status' => 403));
                }
            }

            $team_id = (int) get_post_meta($post_id, '_portal_order_team_id', true);
            $team_post = get_post($team_id);
            $team_name = $team_post ? $team_post->post_title : 'チーム';

            // 既存の変更履歴を取得
            $history_json = get_post_meta($post_id, '_portal_order_history', true);
            $history = $history_json ? json_decode($history_json, true) : array();
            if (!is_array($history)) $history = array();

            if ($action === 'cancel') {
                $old_items_json = get_post_meta($post_id, '_portal_order_items', true);
                $old_items = $old_items_json ? json_decode($old_items_json, true) : array();
                $old_total = (int) get_post_meta($post_id, '_portal_order_total', true);

                update_post_meta($post_id, '_portal_order_status', 'cancelled');

                $history[] = array(
                    'action' => 'cancelled',
                    'date' => current_time('mysql'),
                    'items' => $old_items,
                    'total' => $old_total,
                );
                update_post_meta($post_id, '_portal_order_history', wp_slash(json_encode($history, JSON_UNESCAPED_UNICODE)));
                jsbb_portal_log_activity($tournament_id, $team_id, 'order_cancelled', $team_name . 'が注文をキャンセルしました', 'team');

            } elseif ($action === 'update' && isset($params['items'])) {
                $items = $params['items'];
                $old_items_json = get_post_meta($post_id, '_portal_order_items', true);
                $old_items = $old_items_json ? json_decode($old_items_json, true) : array();
                $old_total = (int) get_post_meta($post_id, '_portal_order_total', true);

                $total = 0;
                foreach ($items as &$item) {
                    $product = get_post($item['product_id']);
                    if (!$product || $product->post_type !== 'portal_product') continue;
                    $price = (int) get_post_meta($item['product_id'], '_portal_prod_price', true);
                    $quantity = (int) $item['quantity'];
                    $item['price'] = $price;
                    $item['product_name'] = $product->post_title;
                    $item['subtotal'] = $price * $quantity;
                    $total += $item['subtotal'];
                }
                unset($item);

                $history[] = array(
                    'action' => 'updated',
                    'date' => current_time('mysql'),
                    'old_items' => $old_items,
                    'old_total' => $old_total,
                    'new_items' => $items,
                    'new_total' => $total,
                );
                update_post_meta($post_id, '_portal_order_history', wp_slash(json_encode($history, JSON_UNESCAPED_UNICODE)));
                update_post_meta($post_id, '_portal_order_items', wp_slash(json_encode($items, JSON_UNESCAPED_UNICODE)));
                update_post_meta($post_id, '_portal_order_total', $total);
                update_post_meta($post_id, '_portal_order_status', 'confirmed');
                jsbb_portal_log_activity($tournament_id, $team_id, 'order_updated', $team_name . 'が注文を変更しました（合計: ¥' . number_format($total) . '）', 'team');
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
            $team_id = $request->get_param('team_id');

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
                $order = jsbb_build_portal_order($p->ID);
                // チーム名・大会名付与
                $team_post = get_post($order['team_id']);
                $tournament_post = get_post($order['tournament_id']);
                $order['team_name'] = $team_post ? $team_post->post_title : '';
                $order['tournament_name'] = $tournament_post ? $tournament_post->post_title : '';
                $orders[] = $order;
            }

            return rest_ensure_response($orders);
        },
        'permission_callback' => function () {
            return jsbb_portal_verify_api_key() || current_user_can('edit_posts');
        },
    ));

    // GET /portal/admin/orders - 全注文一覧
    register_rest_route('jsbb/v1', '/portal/admin/orders', array(
        'methods'  => 'GET',
        'callback' => function ($request) {
            $tournament_id = $request->get_param('tournament_id');

            $args = array(
                'post_type'      => 'portal_order',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
                'orderby'        => 'date',
                'order'          => 'DESC',
            );
            if ($tournament_id) {
                $args['meta_query'] = array(
                    array('key' => '_portal_order_tournament_id', 'value' => (int) $tournament_id),
                );
            }

            $posts = get_posts($args);
            $orders = array();
            foreach ($posts as $p) {
                $order = jsbb_build_portal_order($p->ID);
                $team_post = get_post($order['team_id']);
                $tournament_post = get_post($order['tournament_id']);
                $order['team_name'] = $team_post ? $team_post->post_title : '';
                $order['tournament_name'] = $tournament_post ? $tournament_post->post_title : '';
                $orders[] = $order;
            }

            return rest_ensure_response($orders);
        },
        'permission_callback' => function () {
            return current_user_can('edit_posts') || jsbb_portal_verify_api_key();
        },
    ));
});

// ==========================================
// ヘルパー関数
// ==========================================

function jsbb_build_portal_product($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'portal_product') return null;

    $sizes_json = get_post_meta($post_id, '_portal_prod_sizes', true);

    return array(
        'id'            => $post->ID,
        'name'          => $post->post_title,
        'tournament_id' => (int) get_post_meta($post_id, '_portal_prod_tournament_id', true),
        'price'         => (int) get_post_meta($post_id, '_portal_prod_price', true),
        'sizes'         => $sizes_json ? json_decode($sizes_json, true) : array(),
        'has_name'      => (bool) get_post_meta($post_id, '_portal_prod_has_name', true),
        'min_quantity'  => (int) get_post_meta($post_id, '_portal_prod_min_quantity', true) ?: 1,
        'image_url'     => get_post_meta($post_id, '_portal_prod_image_url', true) ?: '',
        'description'   => get_post_meta($post_id, '_portal_prod_description', true) ?: '',
        'sort_order'    => (int) get_post_meta($post_id, '_portal_prod_sort_order', true),
        'created_at'    => get_post_meta($post_id, '_portal_prod_created_at', true) ?: '',
    );
}

function jsbb_build_portal_order($post_id) {
    $post = get_post($post_id);
    if (!$post || $post->post_type !== 'portal_order') return null;

    $items_json = get_post_meta($post_id, '_portal_order_items', true);
    $history_json = get_post_meta($post_id, '_portal_order_history', true);

    $items = $items_json ? json_decode($items_json, true) : array();

    // 壊れたデータの自動修復: uXXXX → \uXXXX に復元してデコード
    if (!$items && $items_json) {
        $repaired = preg_replace('/(?<![\\\\])u([0-9a-fA-F]{4})/', '\\u$1', $items_json);
        $items = json_decode($repaired, true);
        if ($items) {
            // 修復成功: 正しい形式で再保存
            update_post_meta($post_id, '_portal_order_items', wp_slash(json_encode($items, JSON_UNESCAPED_UNICODE)));
        } else {
            $items = array();
        }
    }

    // product_name が壊れている場合も修復（json_decodeは成功したがuXXXXが文字列中に残っている）
    if (is_array($items)) {
        $needs_resave = false;
        foreach ($items as &$item) {
            if (isset($item['product_name']) && preg_match('/u[0-9a-fA-F]{4}/', $item['product_name'])) {
                $repaired_name = preg_replace('/u([0-9a-fA-F]{4})/', '\\u$1', $item['product_name']);
                $decoded = json_decode('"' . $repaired_name . '"');
                if ($decoded) {
                    $item['product_name'] = $decoded;
                    $needs_resave = true;
                }
            }
        }
        unset($item);
        if ($needs_resave) {
            update_post_meta($post_id, '_portal_order_items', wp_slash(json_encode($items, JSON_UNESCAPED_UNICODE)));
        }
    }

    return array(
        'id'            => $post->ID,
        'tournament_id' => (int) get_post_meta($post_id, '_portal_order_tournament_id', true),
        'team_id'       => (int) get_post_meta($post_id, '_portal_order_team_id', true),
        'items'         => $items,
        'total'         => (int) get_post_meta($post_id, '_portal_order_total', true),
        'status'        => get_post_meta($post_id, '_portal_order_status', true) ?: 'confirmed',
        'history'       => $history_json ? json_decode($history_json, true) : array(),
        'created_at'    => get_post_meta($post_id, '_portal_order_created_at', true) ?: '',
    );
}
