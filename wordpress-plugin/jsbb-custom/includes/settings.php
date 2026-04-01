<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 大会管理: 設定ページ
// ==========================================
function jsbb_add_settings_page() {
    add_options_page(
        'JSBB大会設定',
        'JSBB大会設定',
        'manage_options',
        'jsbb-tournament-settings',
        'jsbb_tournament_settings_page'
    );
}
add_action('admin_menu', 'jsbb_add_settings_page');

function jsbb_tournament_settings_page() {
    if (isset($_POST['jsbb_settings_nonce']) && wp_verify_nonce($_POST['jsbb_settings_nonce'], 'jsbb_save_settings')) {
        update_option('jsbb_nextjs_revalidate_url', sanitize_url($_POST['revalidate_url'] ?? ''));
        update_option('jsbb_nextjs_revalidate_secret', sanitize_text_field($_POST['revalidate_secret'] ?? ''));
        update_option('jsbb_nextjs_site_url', sanitize_url($_POST['site_url'] ?? ''));
        update_option('jsbb_x_api_key', sanitize_text_field($_POST['x_api_key'] ?? ''));
        update_option('jsbb_x_api_secret', sanitize_text_field($_POST['x_api_secret'] ?? ''));
        update_option('jsbb_x_access_token', sanitize_text_field($_POST['x_access_token'] ?? ''));
        update_option('jsbb_x_access_token_secret', sanitize_text_field($_POST['x_access_token_secret'] ?? ''));
        echo '<div class="updated"><p>設定を保存しました。</p></div>';
    }
    ?>
    <div class="wrap">
        <h1>JSBB大会設定</h1>
        <form method="post">
            <?php wp_nonce_field('jsbb_save_settings', 'jsbb_settings_nonce'); ?>
            <h2>Next.js連携</h2>
            <table class="form-table">
                <tr><th>再生成API URL</th><td>
                    <input type="url" name="revalidate_url" value="<?php echo esc_attr(get_option('jsbb_nextjs_revalidate_url', '')); ?>" style="width:100%" placeholder="https://your-site.com/api/revalidate">
                </td></tr>
                <tr><th>再生成シークレット</th><td>
                    <input type="text" name="revalidate_secret" value="<?php echo esc_attr(get_option('jsbb_nextjs_revalidate_secret', '')); ?>" style="width:100%">
                </td></tr>
                <tr><th>サイトURL</th><td>
                    <input type="url" name="site_url" value="<?php echo esc_attr(get_option('jsbb_nextjs_site_url', '')); ?>" style="width:100%" placeholder="https://your-site.com">
                </td></tr>
            </table>
            <h2>X（Twitter）API</h2>
            <table class="form-table">
                <tr><th>API Key</th><td>
                    <input type="text" name="x_api_key" value="<?php echo esc_attr(get_option('jsbb_x_api_key', '')); ?>" style="width:100%">
                </td></tr>
                <tr><th>API Secret</th><td>
                    <input type="password" name="x_api_secret" value="<?php echo esc_attr(get_option('jsbb_x_api_secret', '')); ?>" style="width:100%">
                </td></tr>
                <tr><th>Access Token</th><td>
                    <input type="text" name="x_access_token" value="<?php echo esc_attr(get_option('jsbb_x_access_token', '')); ?>" style="width:100%">
                </td></tr>
                <tr><th>Access Token Secret</th><td>
                    <input type="password" name="x_access_token_secret" value="<?php echo esc_attr(get_option('jsbb_x_access_token_secret', '')); ?>" style="width:100%">
                </td></tr>
            </table>
            <?php submit_button('設定を保存'); ?>
        </form>
    </div>
    <?php
}

function jsbb_get_all_members_custom($request) {
    $args = array(
        'post_type' => 'member_profile',
        'post_status' => 'publish',
        'posts_per_page' => 100,
        'orderby' => 'date',
        'order' => 'DESC'
    );

    $query = new WP_Query($args);
    $members = array();

    foreach ($query->posts as $post) {
        $post_id = $post->ID;
        $featured_image = get_the_post_thumbnail_url($post_id, 'full');

        $members[] = array(
            'id' => $post_id,
            'slug' => $post->post_name,
            'title' => array('rendered' => $post->post_title),
            'featured_image' => $featured_image,
            'meta' => array(
                '_member_name_en' => get_post_meta($post_id, '_member_name_en', true),
                '_member_role' => get_post_meta($post_id, '_member_role', true),
                '_member_organization' => get_post_meta($post_id, '_member_organization', true),
                '_member_join_year' => get_post_meta($post_id, '_member_join_year', true),
                '_member_join_month' => get_post_meta($post_id, '_member_join_month', true)
            )
        );
    }

    return $members;
}

// ==========================================
// 全カスタム投稿タイプ: スラッグを英数字ランダムに強制
// ==========================================
function jsbb_force_alphanumeric_slug($data, $postarr) {
    $custom_types = array(
        'tournament_series', 'tournament', 'match',
        'branch', 'team', 'member_profile', 'interview', 'officer_group'
    );

    if (!in_array($data['post_type'], $custom_types)) {
        return $data;
    }

    // 新規投稿 or スラッグが日本語（非ASCII）の場合にランダム生成
    $slug = $data['post_name'];
    $needs_random = empty($slug)
        || $slug === sanitize_title($data['post_title'])
        || preg_match('/[^\x20-\x7E]/', urldecode($slug));

    if ($needs_random) {
        $random = substr(bin2hex(random_bytes(6)), 0, 12);
        $data['post_name'] = $data['post_type'] . '-' . $random;
    }

    return $data;
}
add_filter('wp_insert_post_data', 'jsbb_force_alphanumeric_slug', 10, 2);
