<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// ページビュートラッキング用REST API
// ==========================================
add_action('rest_api_init', function () {
    // POST /wp-json/jsbb/v1/track-view
    register_rest_route('jsbb/v1', '/track-view', array(
        'methods'             => 'POST',
        'callback'            => 'jsbb_track_page_view',
        'permission_callback' => '__return_true',
    ));

    // GET /wp-json/jsbb/v1/page-views
    register_rest_route('jsbb/v1', '/page-views', array(
        'methods'             => 'GET',
        'callback'            => 'jsbb_get_page_views',
        'permission_callback' => '__return_true',
    ));
});

function jsbb_track_page_view($request) {
    $page = sanitize_key($request->get_param('page'));

    if (empty($page)) {
        return new WP_Error('invalid_page', 'page parameter is required', array('status' => 400));
    }

    $option_key = 'jsbb_views_' . $page;
    $current    = (int) get_option($option_key, 0);
    update_option($option_key, $current + 1, false);

    return array(
        'page'  => $page,
        'views' => $current + 1,
    );
}

function jsbb_get_page_views() {
    $pages = array(
        'umpire-media',
    );

    $result = array();
    foreach ($pages as $page) {
        $result[$page] = (int) get_option('jsbb_views_' . $page, 0);
    }

    return $result;
}
