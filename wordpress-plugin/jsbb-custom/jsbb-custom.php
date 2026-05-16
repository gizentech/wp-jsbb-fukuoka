<?php
/**
 * Plugin Name: JSBB福岡 カスタム投稿タイプ
 * Description: メンバーとインタビューのカスタム投稿タイプと管理画面
 * Version: 2.0.0
 * Author: JSBB福岡
 */

if (!defined('ABSPATH')) exit;

define('JSBB_PLUGIN_URL', plugin_dir_url(__FILE__));
define('JSBB_PLUGIN_PATH', plugin_dir_path(__FILE__));

$jsbb_includes = array(
    'member-interview',
    'officer-group',
    'initial-data',
    'rest-meta',
    'tournament-cpt',
    'tournament-metabox',
    'tournament-api',
    'x-integration',
    'settings',
    'achievements',
    'import',
    'team-fix',
    'team-admin',
    'team-profile',
    'access-control',
    'news',
    'tournament-announcement',
    'admin-ui',
    'media-folder',
    'migration-helper',
    'portal-cpt',
    'portal-otp',
    'portal-api',
    'portal-activity',
    'portal-documents',
    'portal-shop',
    'portal-product-admin',
    'portal-seed-chikugogawa',
    'portal-admin-menu',
    'entry-tournament',
    'entry-api',
    'entry-submit',
    'chikugogawa-api',
    'bracket-import-1846',
    'contact-form',
    'calendar-proxy',
    'instagram-proxy',
    'page-views',
);

foreach ($jsbb_includes as $file) {
    require_once plugin_dir_path(__FILE__) . 'includes/' . $file . '.php';
}

// プラグイン有効化時の処理
register_activation_hook(__FILE__, 'jsbb_activate_plugin');
