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

        // ヒーロー画像設定
        update_option('jsbb_hero_custom_enabled', isset($_POST['hero_custom_enabled']) ? '1' : '0');
        update_option('jsbb_hero_pc_image', sanitize_url($_POST['hero_pc_image'] ?? ''));
        update_option('jsbb_hero_sp_image', sanitize_url($_POST['hero_sp_image'] ?? ''));

        // Instagramトークン保存
        if (!empty($_POST['instagram_access_token'])) {
            $new_token = sanitize_text_field($_POST['instagram_access_token']);
            update_option('jsbb_instagram_access_token', $new_token);
            // トークンを新規保存した場合、有効期限をリセット（60日後）
            update_option('jsbb_instagram_token_expires_at', time() + 5183944);
            // キャッシュクリア
            delete_transient('jsbb_instagram_posts_v2');
        }

        echo '<div class="updated"><p>設定を保存しました。</p></div>';
    }

    $ig_token      = get_option('jsbb_instagram_access_token', '');
    $ig_expires_at = get_option('jsbb_instagram_token_expires_at', 0);
    $ig_days_left  = $ig_expires_at ? ceil(($ig_expires_at - time()) / 86400) : null;
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

            <h2>Instagram</h2>
            <table class="form-table">
                <tr>
                    <th>アクセストークン</th>
                    <td>
                        <input type="password" id="instagram_access_token" name="instagram_access_token"
                            value=""
                            style="width:100%"
                            placeholder="<?php echo empty($ig_token) ? 'トークンを入力してください' : '●●●●●●（変更する場合のみ入力）'; ?>">
                        <p class="description">
                            <?php if (!empty($ig_token)): ?>
                                ✅ トークン設定済み
                                <?php if ($ig_days_left !== null): ?>
                                    ／ 有効期限まで残り <strong><?php echo (int)$ig_days_left; ?>日</strong>
                                    （<?php echo date('Y年m月d日', $ig_expires_at); ?>）
                                    <?php if ($ig_days_left <= 14): ?>
                                        <span style="color:red; font-weight:bold;"> ⚠️ まもなく期限切れです。下の「トークンを60日延長」ボタンで更新してください。</span>
                                    <?php endif; ?>
                                <?php endif; ?>
                            <?php else: ?>
                                ⚠️ トークン未設定
                            <?php endif; ?>
                        </p>
                    </td>
                </tr>
                <tr>
                    <th>トークン操作</th>
                    <td>
                        <button type="button" id="jsbb-ig-refresh" class="button button-primary"
                            <?php echo empty($ig_token) ? 'disabled' : ''; ?>>
                            🔄 トークンを60日延長
                        </button>
                        &nbsp;
                        <button type="button" id="jsbb-ig-clear-cache" class="button">
                            🗑️ キャッシュをクリア
                        </button>
                        <span id="jsbb-ig-status" style="margin-left:12px; font-weight:bold;"></span>
                    </td>
                </tr>
            </table>

            <h2>ヒーロー画像設定</h2>
            <p class="description">チェックを入れると、トップページのヒーローにカスタム画像を表示します。チェックを外すと通常の統計表示に戻ります。</p>
            <table class="form-table">
                <tr>
                    <th>カスタムヒーローを表示</th>
                    <td>
                        <label>
                            <input type="checkbox" name="hero_custom_enabled" value="1"
                                <?php checked('1', get_option('jsbb_hero_custom_enabled', '0')); ?>>
                            有効にする
                        </label>
                    </td>
                </tr>
                <tr>
                    <th>PC用画像URL</th>
                    <td>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <input type="url" id="hero_pc_image" name="hero_pc_image"
                                value="<?php echo esc_attr(get_option('jsbb_hero_pc_image', '')); ?>"
                                style="width:100%" placeholder="https://...">
                            <button type="button" class="button jsbb-media-select" data-target="hero_pc_image" data-preview="hero_pc_preview">画像を選択</button>
                        </div>
                        <div id="hero_pc_preview" style="margin-top:8px;">
                            <?php $pc = get_option('jsbb_hero_pc_image', ''); if ($pc): ?>
                                <img src="<?php echo esc_url($pc); ?>" style="max-width:400px;max-height:120px;object-fit:cover;border:1px solid #ddd;">
                            <?php endif; ?>
                        </div>
                        <p class="description">横長（16:9など）推奨。PCとタブレットで表示されます。</p>
                    </td>
                </tr>
                <tr>
                    <th>SP（スマホ）用画像URL</th>
                    <td>
                        <div style="display:flex;gap:8px;align-items:center;">
                            <input type="url" id="hero_sp_image" name="hero_sp_image"
                                value="<?php echo esc_attr(get_option('jsbb_hero_sp_image', '')); ?>"
                                style="width:100%" placeholder="https://...">
                            <button type="button" class="button jsbb-media-select" data-target="hero_sp_image" data-preview="hero_sp_preview">画像を選択</button>
                        </div>
                        <div id="hero_sp_preview" style="margin-top:8px;">
                            <?php $sp = get_option('jsbb_hero_sp_image', ''); if ($sp): ?>
                                <img src="<?php echo esc_url($sp); ?>" style="max-width:200px;max-height:160px;object-fit:cover;border:1px solid #ddd;">
                            <?php endif; ?>
                        </div>
                        <p class="description">縦長（3:4など）推奨。スマートフォンで表示されます。</p>
                    </td>
                </tr>
            </table>

            <?php submit_button('設定を保存'); ?>
        </form>
    </div>

    <script>
    (function() {
        const nonce = '<?php echo wp_create_nonce('wp_rest'); ?>';
        const apiBase = '<?php echo esc_js(rest_url('jsbb/v1/instagram')); ?>';

        document.getElementById('jsbb-ig-refresh')?.addEventListener('click', function() {
            const btn = this;
            const status = document.getElementById('jsbb-ig-status');
            btn.disabled = true;
            status.textContent = '更新中...';
            status.style.color = '#666';

            fetch(apiBase + '/refresh-token', {
                method: 'POST',
                headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }
            })
            .then(r => r.json())
            .then(data => {
                if (data.success) {
                    status.textContent = '✅ ' + data.message + '（有効期限: ' + data.expires_at + '）';
                    status.style.color = 'green';
                    setTimeout(() => location.reload(), 2000);
                } else {
                    status.textContent = '❌ エラー: ' + (data.error || '不明');
                    status.style.color = 'red';
                    btn.disabled = false;
                }
            })
            .catch(() => {
                status.textContent = '❌ 通信エラー';
                status.style.color = 'red';
                btn.disabled = false;
            });
        });

        document.getElementById('jsbb-ig-clear-cache')?.addEventListener('click', function() {
            const btn = this;
            const status = document.getElementById('jsbb-ig-status');
            btn.disabled = true;
            status.textContent = 'クリア中...';
            status.style.color = '#666';

            fetch(apiBase + '/clear-cache', {
                method: 'POST',
                headers: { 'X-WP-Nonce': nonce, 'Content-Type': 'application/json' }
            })
            .then(r => r.json())
            .then(data => {
                status.textContent = data.success ? '✅ ' + data.message : '❌ ' + (data.error || '不明');
                status.style.color = data.success ? 'green' : 'red';
                btn.disabled = false;
            })
            .catch(() => {
                status.textContent = '❌ 通信エラー';
                status.style.color = 'red';
                btn.disabled = false;
            });
        });

        // メディアアップローダー
        document.querySelectorAll('.jsbb-media-select').forEach(function(btn) {
            btn.addEventListener('click', function() {
                const targetId = this.dataset.target;
                const previewId = this.dataset.preview;
                const frame = wp.media({
                    title: '画像を選択',
                    button: { text: 'この画像を使用' },
                    multiple: false,
                    library: { type: 'image' }
                });
                frame.on('select', function() {
                    const attachment = frame.state().get('selection').first().toJSON();
                    document.getElementById(targetId).value = attachment.url;
                    const preview = document.getElementById(previewId);
                    preview.innerHTML = '<img src="' + attachment.url + '" style="max-width:400px;max-height:160px;object-fit:cover;border:1px solid #ddd;">';
                });
                frame.open();
            });
        });
    })();
    </script>
    <?php
}

// ==========================================
// ヒーロー設定 REST API エンドポイント
// ==========================================
add_action('rest_api_init', function() {
    register_rest_route('jsbb/v1', '/hero-settings', array(
        'methods'             => 'GET',
        'callback'            => 'jsbb_get_hero_settings',
        'permission_callback' => '__return_true',
    ));
});

function jsbb_get_hero_settings($request) {
    return rest_ensure_response(array(
        'enabled'  => get_option('jsbb_hero_custom_enabled', '0') === '1',
        'pc_image' => get_option('jsbb_hero_pc_image', ''),
        'sp_image' => get_option('jsbb_hero_sp_image', ''),
    ));
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
