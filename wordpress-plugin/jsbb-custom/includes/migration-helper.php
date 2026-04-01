<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// マイグレーション用ヘルパー: 旧DB読み取り & PDFアップロード
// ==========================================

add_action('rest_api_init', function () {
    // old_wp-content内のPDFファイル一覧を取得
    register_rest_route('jsbb/v1', '/migration/scan-pdfs', array(
        'methods' => 'GET',
        'callback' => 'jsbb_scan_old_pdfs',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));

    // 旧DBから投稿とPDFの紐づけを取得
    register_rest_route('jsbb/v1', '/migration/scan-old-db', array(
        'methods' => 'GET',
        'callback' => 'jsbb_scan_old_db',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));

    // old_wp-contentからPDFをメディアライブラリにアップロード
    register_rest_route('jsbb/v1', '/migration/upload-pdf', array(
        'methods' => 'POST',
        'callback' => 'jsbb_upload_old_pdf',
        'permission_callback' => function () {
            return current_user_can('upload_files');
        }
    ));

    // 一括マイグレーション実行
    register_rest_route('jsbb/v1', '/migration/run', array(
        'methods' => 'POST',
        'callback' => 'jsbb_run_migration',
        'permission_callback' => function () {
            return current_user_can('edit_posts');
        }
    ));
});

/**
 * old_wp-contentのベースディレクトリを探す
 */
function jsbb_find_old_uploads_dir() {
    $candidates = array(
        ABSPATH . '../old_wp-content/uploads',
        ABSPATH . 'old_wp-content/uploads',
        dirname(ABSPATH) . '/old_wp-content/uploads',
    );
    foreach ($candidates as $dir) {
        if (is_dir($dir)) return $dir;
    }
    return null;
}

/**
 * 旧wp-config.phpを探してDB情報を取得
 */
function jsbb_get_old_db_config() {
    // 旧サイトのwp-config.phpの場所候補
    $candidates = array(
        dirname(ABSPATH) . '/../public_html/wp-config.php',      // /jsbb-fukuoka.com/public_html/wp-config.php
        dirname(ABSPATH) . '/../public_html/CMS/wp-config.php',  // /jsbb-fukuoka.com/public_html/CMS/wp-config.php
        ABSPATH . '../../public_html/wp-config.php',
        ABSPATH . '../wp-config.php',
    );

    foreach ($candidates as $path) {
        $real = realpath($path);
        if ($real && file_exists($real)) {
            $content = file_get_contents($real);
            $config = array();

            // DB_NAME
            if (preg_match("/define\s*\(\s*['\"]DB_NAME['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)/", $content, $m)) {
                $config['DB_NAME'] = $m[1];
            }
            if (preg_match("/define\s*\(\s*['\"]DB_USER['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)/", $content, $m)) {
                $config['DB_USER'] = $m[1];
            }
            if (preg_match("/define\s*\(\s*['\"]DB_PASSWORD['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)/", $content, $m)) {
                $config['DB_PASSWORD'] = $m[1];
            }
            if (preg_match("/define\s*\(\s*['\"]DB_HOST['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)/", $content, $m)) {
                $config['DB_HOST'] = $m[1];
            }
            // テーブルプレフィックス
            if (preg_match('/\$table_prefix\s*=\s*[\'"]([^\'"]+)[\'"]/', $content, $m)) {
                $config['table_prefix'] = $m[1];
            } else {
                $config['table_prefix'] = 'wp_';
            }

            if (!empty($config['DB_NAME'])) {
                $config['config_path'] = $real;
                return $config;
            }
        }
    }

    return null;
}

/**
 * old_wp-content/uploads/ 内のPDFファイルをスキャン
 */
function jsbb_scan_old_pdfs($request) {
    $base_dir = jsbb_find_old_uploads_dir();
    if (!$base_dir) {
        return new WP_Error('not_found', 'old_wp-content/uploads が見つかりません。ABSPATH: ' . ABSPATH, array('status' => 404));
    }

    $pdfs = array();
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($base_dir, RecursiveDirectoryIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
        if ($file->isFile() && strtolower($file->getExtension()) === 'pdf') {
            $relative_path = str_replace($base_dir . '/', '', $file->getPathname());
            $relative_path = str_replace($base_dir . '\\', '', $relative_path);
            $pdfs[] = array(
                'filename' => $file->getFilename(),
                'path' => $relative_path,
                'size' => $file->getSize(),
                'modified' => date('Y-m-d H:i:s', $file->getMTime()),
                'url' => site_url('/old_wp-content/uploads/' . str_replace('\\', '/', $relative_path)),
            );
        }
    }

    usort($pdfs, function ($a, $b) {
        return strcmp($a['filename'], $b['filename']);
    });

    return array(
        'base_dir' => $base_dir,
        'total' => count($pdfs),
        'pdfs' => $pdfs,
    );
}

/**
 * 旧DBからPDFと投稿の紐づけを取得
 */
function jsbb_scan_old_db($request) {
    $old_config = jsbb_get_old_db_config();

    if ($old_config) {
        $old_db = new wpdb(
            $old_config['DB_USER'],
            $old_config['DB_PASSWORD'],
            $old_config['DB_NAME'],
            $old_config['DB_HOST']
        );
        $old_db->set_charset($old_db->dbh, 'utf8mb4');
        $prefix = $old_config['table_prefix'];
    } else {
        global $wpdb;
        $old_db = $wpdb;
        $prefix = $wpdb->prefix;

        $alt_prefix = ($prefix === 'wp_') ? 'wp2_' : 'wp_';
        $test = $old_db->get_var("SHOW TABLES LIKE '{$alt_prefix}posts'");
        if ($test) {
            $prefix = $alt_prefix;
        }
    }

    $query = "
        SELECT
            a.ID as attachment_id,
            a.guid as pdf_url,
            a.post_title as pdf_title,
            a.post_parent as parent_id,
            p.post_title as post_title,
            p.post_type as post_type,
            p.post_date as post_date
        FROM {$prefix}posts a
        LEFT JOIN {$prefix}posts p ON a.post_parent = p.ID
        WHERE a.post_type = 'attachment'
        AND a.post_mime_type = 'application/pdf'
        ORDER BY p.post_date DESC, a.post_title ASC
    ";

    $results = $old_db->get_results($query, ARRAY_A);

    if ($old_db->last_error) {
        return new WP_Error('db_error', 'DBエラー: ' . $old_db->last_error . ' (prefix: ' . $prefix . ')', array('status' => 500));
    }

    // 親投稿ごとにグループ化
    $posts_map = array();
    $orphans = array();

    foreach ($results as $row) {
        $filename = basename($row['pdf_url']);

        if ($row['parent_id'] && $row['post_title']) {
            $parent_key = $row['parent_id'];
            if (!isset($posts_map[$parent_key])) {
                $posts_map[$parent_key] = array(
                    'post_id' => $row['parent_id'],
                    'title' => $row['post_title'],
                    'post_type' => $row['post_type'],
                    'date' => $row['post_date'],
                    'pdfs' => array(),
                );
            }
            $posts_map[$parent_key]['pdfs'][] = array(
                'attachment_id' => $row['attachment_id'],
                'filename' => $filename,
                'url' => $row['pdf_url'],
                'title' => $row['pdf_title'],
            );
        } else {
            $orphans[] = array(
                'attachment_id' => $row['attachment_id'],
                'filename' => $filename,
                'url' => $row['pdf_url'],
                'title' => $row['pdf_title'],
            );
        }
    }

    return array(
        'message' => '旧DB読み取り完了',
        'config_found' => $old_config ? true : false,
        'config_path' => $old_config ? $old_config['config_path'] : null,
        'db_name' => $old_config ? $old_config['DB_NAME'] : 'current',
        'prefix' => $prefix,
        'total_pdfs' => count($results),
        'total_posts' => count($posts_map),
        'total_orphans' => count($orphans),
        'posts' => array_values($posts_map),
        'orphans' => $orphans,
    );
}

/**
 * old_wp-content内の指定PDFをメディアライブラリにアップロード
 */
function jsbb_upload_old_pdf($request) {
    $path = $request->get_param('path');
    if (!$path) {
        return new WP_Error('missing_path', 'path パラメータが必要です', array('status' => 400));
    }

    $base_dir = jsbb_find_old_uploads_dir();
    if (!$base_dir) {
        return new WP_Error('not_found', 'old_wp-content/uploads が見つかりません', array('status' => 404));
    }

    $full_path = $base_dir . '/' . $path;

    // パストラバーサル防止
    $real_base = realpath($base_dir);
    $real_path = realpath($full_path);
    if (!$real_path || strpos($real_path, $real_base) !== 0) {
        return new WP_Error('invalid_path', '不正なパスです', array('status' => 400));
    }

    if (!file_exists($full_path)) {
        return new WP_Error('not_found', 'ファイルが見つかりません: ' . $path, array('status' => 404));
    }

    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';

    $filename = basename($full_path);
    $upload_dir = wp_upload_dir();

    $dest_name = wp_unique_filename($upload_dir['path'], $filename);
    $dest_full = $upload_dir['path'] . '/' . $dest_name;

    if (!copy($full_path, $dest_full)) {
        return new WP_Error('copy_failed', 'ファイルのコピーに失敗しました', array('status' => 500));
    }

    $attachment = array(
        'post_mime_type' => 'application/pdf',
        'post_title' => preg_replace('/\.[^.]+$/', '', $filename),
        'post_content' => '',
        'post_status' => 'inherit',
    );

    $attach_id = wp_insert_attachment($attachment, $dest_full);
    if (is_wp_error($attach_id)) return $attach_id;

    $attach_data = wp_generate_attachment_metadata($attach_id, $dest_full);
    wp_update_attachment_metadata($attach_id, $attach_data);

    return array(
        'success' => true,
        'attachment_id' => $attach_id,
        'url' => wp_get_attachment_url($attach_id),
        'filename' => $filename,
    );
}

/**
 * 一括マイグレーション: 旧DBの投稿単位でtournamentを作成
 */
function jsbb_run_migration($request) {
    $dry_run = $request->get_param('dry_run') !== false && $request->get_param('dry_run') !== 'false';
    $limit = intval($request->get_param('limit')) ?: 0;

    // 旧DBスキャン
    $db_result = jsbb_scan_old_db($request);
    if (is_wp_error($db_result)) return $db_result;

    $old_posts = $db_result['posts'];
    $uploads_dir = jsbb_find_old_uploads_dir();

    if ($dry_run) {
        $preview = array();
        foreach ($old_posts as $post) {
            $preview[] = array(
                'old_id' => $post['post_id'],
                'title' => $post['title'],
                'type' => $post['post_type'],
                'date' => $post['date'] ? substr($post['date'], 0, 10) : '',
                'year' => $post['date'] ? substr($post['date'], 0, 4) : '',
                'pdf_count' => count($post['pdfs']),
                'pdfs' => array_map(function ($p) {
                    return $p['filename'];
                }, $post['pdfs']),
            );
        }

        return array(
            'message' => 'ドライラン: 旧DB投稿一覧',
            'total_posts' => count($old_posts),
            'total_orphans' => $db_result['total_orphans'],
            'db_name' => $db_result['db_name'],
            'prefix' => $db_result['prefix'],
            'posts' => $preview,
        );
    }

    // 実行モード: 旧投稿1件 = 新tournament 1件
    $created = 0;
    $skipped = 0;
    $uploaded = 0;
    $errors = 0;
    $results = array();
    $count = 0;

    foreach ($old_posts as $post) {
        if ($limit > 0 && $count >= $limit) break;
        $count++;

        $title = $post['title'];
        $year = $post['date'] ? substr($post['date'], 0, 4) : '';

        // 既存チェック（同タイトル）
        $existing = get_posts(array(
            'post_type' => 'tournament',
            'post_status' => 'any',
            'title' => $title,
            'posts_per_page' => 1,
        ));
        // タイトル完全一致チェック
        $found = false;
        foreach ($existing as $ex) {
            if ($ex->post_title === $title) {
                $found = true;
                break;
            }
        }
        if ($found) {
            $skipped++;
            $results[] = array('title' => $title, 'action' => 'skipped', 'reason' => '既存');
            continue;
        }

        // PDFをアップロード
        $attach_ids = array();
        foreach ($post['pdfs'] as $pdf_info) {
            // PDFのファイルパスを特定（旧URLからuploads/以下の相対パスを抽出）
            $pdf_url = $pdf_info['url'];
            $relative_path = '';

            // URL から uploads/ 以下を抽出
            if (preg_match('#/wp-content/uploads/(.+)$#', $pdf_url, $m)) {
                $relative_path = $m[1];
            } elseif (preg_match('#/CMS/wp-content/uploads/(.+)$#', $pdf_url, $m)) {
                $relative_path = $m[1];
            }

            if (!$relative_path || !$uploads_dir) {
                // ファイル名でold_wp-content内を検索
                $filename = $pdf_info['filename'];
                $found_path = jsbb_find_pdf_in_uploads($uploads_dir, $filename);
                if ($found_path) {
                    $relative_path = $found_path;
                } else {
                    $errors++;
                    continue;
                }
            }

            // ファイルが存在するか確認
            $full_path = $uploads_dir . '/' . $relative_path;
            if (!file_exists($full_path)) {
                // ファイル名で検索
                $filename = basename($relative_path);
                $found_path = jsbb_find_pdf_in_uploads($uploads_dir, $filename);
                if ($found_path) {
                    $relative_path = $found_path;
                } else {
                    $errors++;
                    continue;
                }
            }

            $upload_request = new WP_REST_Request('POST');
            $upload_request->set_param('path', $relative_path);
            $upload_result = jsbb_upload_old_pdf($upload_request);

            if (!is_wp_error($upload_result)) {
                $attach_ids[] = $upload_result['attachment_id'];
                $uploaded++;
            } else {
                $errors++;
            }
        }

        // tournament作成（PDFが0件でも投稿は作る）
        $tournament_id = wp_insert_post(array(
            'post_type' => 'tournament',
            'post_title' => $title,
            'post_status' => 'publish',
            'post_date' => $post['date'] ?: '',
        ));

        if (is_wp_error($tournament_id)) {
            $errors++;
            $results[] = array('title' => $title, 'action' => 'error', 'error' => $tournament_id->get_error_message());
            continue;
        }

        update_post_meta($tournament_id, '_tournament_year', $year);
        update_post_meta($tournament_id, '_tournament_pdfs', wp_json_encode($attach_ids));
        update_post_meta($tournament_id, '_migration_source', 'old-wp-content');
        update_post_meta($tournament_id, '_migration_old_id', strval($post['post_id']));

        $created++;
        $results[] = array(
            'title' => $title,
            'action' => 'created',
            'tournament_id' => $tournament_id,
            'year' => $year,
            'pdfs' => count($attach_ids),
        );
    }

    return array(
        'message' => 'マイグレーション完了',
        'created' => $created,
        'skipped' => $skipped,
        'pdf_uploaded' => $uploaded,
        'errors' => $errors,
        'results' => $results,
    );
}

/**
 * uploads ディレクトリ内でファイル名からパスを検索
 */
function jsbb_find_pdf_in_uploads($uploads_dir, $filename) {
    if (!$uploads_dir || !is_dir($uploads_dir)) return null;

    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($uploads_dir, RecursiveDirectoryIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getFilename() === $filename) {
            $path = str_replace($uploads_dir . '/', '', $file->getPathname());
            $path = str_replace($uploads_dir . '\\', '', $path);
            return $path;
        }
    }

    return null;
}
