# WordPress データベース確認とデバッグ手順

## 1. データベースで実際のメタデータを確認

### phpMyAdmin または MySQL コマンドラインで以下のSQLを実行

```sql
-- メンバー投稿の確認
SELECT
    p.ID,
    p.post_title,
    p.post_name as slug,
    p.post_type,
    p.post_status
FROM wp_posts p
WHERE p.post_type = 'member_profile'
AND p.post_status = 'publish'
ORDER BY p.post_date DESC;
```

```sql
-- 特定のメンバー（ryoshiraishi）のメタデータを確認
SELECT
    p.ID,
    p.post_title,
    p.post_name as slug,
    pm.meta_key,
    pm.meta_value
FROM wp_posts p
LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
WHERE p.post_type = 'member_profile'
AND p.post_name = 'ryoshiraishi'
AND p.post_status = 'publish'
ORDER BY pm.meta_key;
```

```sql
-- すべてのメンバーメタフィールドを確認
SELECT
    pm.meta_key,
    COUNT(*) as count
FROM wp_postmeta pm
INNER JOIN wp_posts p ON pm.post_id = p.ID
WHERE p.post_type = 'member_profile'
AND pm.meta_key LIKE '_member_%'
GROUP BY pm.meta_key
ORDER BY pm.meta_key;
```

## 2. プラグインの状態を確認

### WordPress管理画面で確認

1. `https://jsbb-fukuoka.com/CMS/wp-admin/plugins.php` にアクセス
2. 「JSBB福岡 カスタム投稿タイプ」プラグインが有効化されているか確認
3. 有効化されている場合、一度無効化→再有効化

### プラグインファイルが正しくアップロードされているか確認

FTPまたはサーバーのファイルマネージャーで以下を確認：
- ファイルパス: `/wp-content/plugins/jsbb-custom/jsbb-custom.php`
- ファイルサイズ: 約20-30KB（REST API登録コードを含む場合）
- 最終更新日時: 最近アップロードした日時

## 3. REST API メタフィールド登録の確認

### WordPress のデバッグモードを有効化

`wp-config.php` に以下を追加（既に追加されている場合は確認）:

```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

### プラグインにデバッグコードを追加

`jsbb-custom.php` の `jsbb_register_meta_in_rest()` 関数の最初に以下を追加:

```php
function jsbb_register_meta_in_rest() {
    error_log('JSBB: REST API meta registration started');

    // 既存のコード...

    error_log('JSBB: REST API meta registration completed');
}
```

デバッグログの確認:
- サーバーの `/wp-content/debug.log` ファイルを確認
- "JSBB: REST API meta registration" というログが存在するか確認

## 4. REST API エンドポイントのテスト

### ブラウザまたはcurlで以下をテスト

```bash
# メンバー一覧（メタフィールドなし）
curl "https://jsbb-fukuoka.com/CMS/wp-json/wp/v2/member_profile"

# メンバー一覧（メタフィールドあり - contextパラメータ使用）
curl "https://jsbb-fukuoka.com/CMS/wp-json/wp/v2/member_profile?context=edit"

# 特定メンバー（ryoshiraishi）
curl "https://jsbb-fukuoka.com/CMS/wp-json/wp/v2/member_profile?slug=ryoshiraishi&_embed"

# REST API スキーマ確認（どのフィールドが利用可能か）
curl "https://jsbb-fukuoka.com/CMS/wp-json/wp/v2/member_profile/schema"
```

### REST API スキーマでメタフィールドが登録されているか確認

上記の `/schema` エンドポイントのレスポンスに以下が含まれているか確認:

```json
{
  "schema": {
    "properties": {
      "meta": {
        "type": "object",
        "properties": {
          "_member_name_en": { ... },
          "_member_role": { ... },
          // その他のメタフィールド
        }
      }
    }
  }
}
```

## 5. 考えられる問題と解決策

### 問題A: プラグインファイルがアップロードされていない
- **確認**: サーバーのファイル更新日時を確認
- **解決**: FTPまたはWordPress管理画面からファイルをアップロード

### 問題B: プラグインが有効化されていない
- **確認**: WordPress管理画面 → プラグイン で有効化状態を確認
- **解決**: プラグインを有効化

### 問題C: register_post_meta() が実行されていない
- **確認**: デバッグログに "JSBB: REST API meta registration" が存在するか
- **解決**: プラグインを無効化→再有効化

### 問題D: メタデータがデータベースに存在しない
- **確認**: SQLクエリでメタデータの存在を確認
- **解決**: WordPress管理画面でメンバー投稿を編集し、カスタムフィールドを保存

### 問題E: REST APIの権限問題
- **確認**: `?context=edit` パラメータで認証付きアクセスを試す
- **解決**: `auth_callback` を調整、または `show_in_rest` の設定を確認

### 問題F: WordPressのバージョンが古い
- **確認**: WordPress バージョンが 4.7 以降か確認
- **解決**: WordPressをアップデート

## 6. 緊急対応: 代替API作成

プラグイン修正がうまくいかない場合、カスタムREST APIエンドポイントを作成:

```php
// jsbb-custom.php に追加
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/member/(?P<slug>[a-zA-Z0-9-]+)', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_member_with_meta',
        'permission_callback' => '__return_true'
    ));
});

function jsbb_get_member_with_meta($request) {
    $slug = $request['slug'];

    $args = array(
        'post_type' => 'member_profile',
        'name' => $slug,
        'post_status' => 'publish',
        'posts_per_page' => 1
    );

    $query = new WP_Query($args);

    if (!$query->have_posts()) {
        return new WP_Error('not_found', 'Member not found', array('status' => 404));
    }

    $post = $query->posts[0];

    // すべてのメタデータを取得
    $meta = get_post_meta($post->ID);

    // アンダースコア付きメタフィールドのみ抽出
    $member_meta = array();
    foreach ($meta as $key => $value) {
        if (strpos($key, '_member_') === 0) {
            $member_meta[$key] = maybe_unserialize($value[0]);
        }
    }

    return array(
        'id' => $post->ID,
        'slug' => $post->post_name,
        'title' => array('rendered' => $post->post_title),
        'meta' => $member_meta
    );
}
```

使用方法:
```javascript
// wp-api.js を変更
const API_URL_CUSTOM = "https://jsbb-fukuoka.com/CMS/wp-json/jsbb/v1";

export async function fetchMemberBySlug(slug) {
  const url = `${API_URL_CUSTOM}/member/${slug}`;
  const res = await fetch(url);
  // ...
}
```
