<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// お知らせ（通常投稿）用REST APIエンドポイント
// ==========================================
add_action('rest_api_init', function () {
    // お知らせ一覧
    register_rest_route('jsbb/v1', '/news', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_news_list',
        'permission_callback' => '__return_true'
    ));

    // お知らせ詳細
    register_rest_route('jsbb/v1', '/news/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_news_detail',
        'permission_callback' => '__return_true'
    ));
});

function jsbb_get_news_list($request) {
    $per_page = $request->get_param('per_page') ?: 100;
    $category_slug = $request->get_param('category');

    $args = array(
        'post_type' => 'post',
        'post_status' => 'publish',
        'posts_per_page' => intval($per_page),
        'orderby' => 'date',
        'order' => 'DESC',
    );

    // カテゴリーフィルター
    if ($category_slug) {
        $args['category_name'] = sanitize_text_field($category_slug);
    }

    $query = new WP_Query($args);
    $news = array();

    foreach ($query->posts as $post) {
        $categories = wp_get_post_categories($post->ID, array('fields' => 'all'));
        $cat_slugs = array_map(function($cat) { return $cat->slug; }, $categories);
        $cat_names = array_map(function($cat) { return $cat->name; }, $categories);

        // "important" カスタムフィールド
        $important = get_post_meta($post->ID, '_news_important', true);

        $news[] = array(
            'id' => $post->ID,
            'title' => $post->post_title,
            'date' => $post->post_date,
            'categories' => $cat_slugs,
            'categoryNames' => $cat_names,
            'important' => $important === '1',
        );
    }

    return $news;
}

function jsbb_get_news_detail($request) {
    $post_id = intval($request['id']);
    $post = get_post($post_id);

    if (!$post || $post->post_type !== 'post' || $post->post_status !== 'publish') {
        return new WP_Error('not_found', 'News not found', array('status' => 404));
    }

    $categories = wp_get_post_categories($post->ID, array('fields' => 'all'));
    $cat_slugs = array_map(function($cat) { return $cat->slug; }, $categories);
    $cat_names = array_map(function($cat) { return $cat->name; }, $categories);
    $important = get_post_meta($post->ID, '_news_important', true);

    // 添付ファイル
    $attachments = get_posts(array(
        'post_type' => 'attachment',
        'post_parent' => $post->ID,
        'posts_per_page' => -1,
        'orderby' => 'menu_order',
        'order' => 'ASC',
    ));

    $files = array();
    foreach ($attachments as $att) {
        $files[] = array(
            'id' => $att->ID,
            'fileName' => basename(get_attached_file($att->ID)),
            'url' => wp_get_attachment_url($att->ID),
            'fileSize' => filesize(get_attached_file($att->ID)) ?: 0,
        );
    }

    return array(
        'id' => $post->ID,
        'title' => $post->post_title,
        'content' => apply_filters('the_content', $post->post_content),
        'date' => $post->post_date,
        'categories' => $cat_slugs,
        'categoryNames' => $cat_names,
        'important' => $important === '1',
        'files' => $files,
    );
}

// お知らせ投稿の「重要」フラグ メタボックス
function jsbb_add_news_meta_boxes() {
    add_meta_box('news_important', '重要フラグ', 'jsbb_news_important_box', 'post', 'side', 'high');
}
add_action('add_meta_boxes', 'jsbb_add_news_meta_boxes');

function jsbb_news_important_box($post) {
    wp_nonce_field('jsbb_news_meta', 'jsbb_news_nonce');
    $important = get_post_meta($post->ID, '_news_important', true);
    ?>
    <label>
        <input type="checkbox" name="news_important" value="1" <?php checked($important, '1'); ?>>
        このお知らせを「重要」として表示する
    </label>
    <?php
}

function jsbb_save_news_meta($post_id) {
    if (!isset($_POST['jsbb_news_nonce']) || !wp_verify_nonce($_POST['jsbb_news_nonce'], 'jsbb_news_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
    if (!current_user_can('edit_post', $post_id)) return;

    $important = isset($_POST['news_important']) ? '1' : '0';
    update_post_meta($post_id, '_news_important', $important);
}
add_action('save_post_post', 'jsbb_save_news_meta');
