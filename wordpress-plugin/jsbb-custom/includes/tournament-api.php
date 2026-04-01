<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// 大会管理: REST APIエンドポイント
// ==========================================
add_action('rest_api_init', function () {
    // 大会シリーズ一覧（配下のtournament含む）
    register_rest_route('jsbb/v1', '/tournament-series', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_tournament_series_list',
        'permission_callback' => '__return_true'
    ));

    // 大会詳細（配下のmatch含む）
    register_rest_route('jsbb/v1', '/tournament/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_tournament_detail',
        'permission_callback' => '__return_true'
    ));

    // 試合詳細
    register_rest_route('jsbb/v1', '/match/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_match_detail',
        'permission_callback' => '__return_true'
    ));

    // チーム一覧
    register_rest_route('jsbb/v1', '/teams', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_teams_list',
        'permission_callback' => '__return_true'
    ));

    // 支部一覧
    register_rest_route('jsbb/v1', '/branches', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_branches_list',
        'permission_callback' => '__return_true'
    ));

    // トーナメント表一覧
    register_rest_route('jsbb/v1', '/tournament-brackets', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_tournament_brackets_list',
        'permission_callback' => '__return_true'
    ));

    // トーナメント表詳細
    register_rest_route('jsbb/v1', '/tournament-bracket/(?P<id>\d+)', array(
        'methods' => 'GET',
        'callback' => 'jsbb_get_tournament_bracket_detail',
        'permission_callback' => '__return_true'
    ));
});

function jsbb_get_tournament_series_list() {
    $series = get_posts(array(
        'post_type' => 'tournament_series',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    ));

    $result = array();
    foreach ($series as $s) {
        // 配下の大会を取得
        $tournaments = get_posts(array(
            'post_type' => 'tournament',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_key' => '_tournament_series_id',
            'meta_value' => strval($s->ID),
            'orderby' => 'date',
            'order' => 'DESC',
        ));

        $tournaments_data = array();
        foreach ($tournaments as $t) {
            // 配下の試合を取得
            $matches = get_posts(array(
                'post_type' => 'match',
                'post_status' => 'publish',
                'posts_per_page' => -1,
                'meta_key' => '_match_tournament_id',
                'meta_value' => $t->ID,
            ));

            $matches_data = array();
            foreach ($matches as $m) {
                $home_team = get_post(intval(get_post_meta($m->ID, '_match_home_team_id', true)));
                $away_team = get_post(intval(get_post_meta($m->ID, '_match_away_team_id', true)));

                $matches_data[] = array(
                    'id' => $m->ID,
                    'date' => get_post_meta($m->ID, '_match_date', true),
                    'round' => get_post_meta($m->ID, '_match_round', true),
                    'venue' => get_post_meta($m->ID, '_match_venue', true),
                    'home_team' => array(
                        'id' => $home_team ? $home_team->ID : null,
                        'name' => $home_team ? $home_team->post_title : '未定',
                    ),
                    'away_team' => array(
                        'id' => $away_team ? $away_team->ID : null,
                        'name' => $away_team ? $away_team->post_title : '未定',
                    ),
                    'home_total' => intval(get_post_meta($m->ID, '_match_home_total', true)),
                    'away_total' => intval(get_post_meta($m->ID, '_match_away_total', true)),
                    'status' => jsbb_get_match_status($m->ID),
                );
            }

            // 日付順にソート
            usort($matches_data, function($a, $b) {
                return strcmp($a['date'] ?: '', $b['date'] ?: '');
            });

            $tournaments_data[] = array(
                'id' => $t->ID,
                'title' => $t->post_title,
                'year' => get_post_meta($t->ID, '_tournament_year', true),
                'start_date' => get_post_meta($t->ID, '_tournament_start_date', true),
                'end_date' => get_post_meta($t->ID, '_tournament_end_date', true),
                'matches' => $matches_data,
            );
        }

        // 配下のトーナメント表を取得
        $brackets = get_posts(array(
            'post_type' => 'tournament_bracket',
            'post_status' => 'publish',
            'posts_per_page' => -1,
            'meta_key' => '_bracket_series_id',
            'meta_value' => strval($s->ID),
            'orderby' => 'date',
            'order' => 'DESC',
        ));

        $brackets_data = array();
        foreach ($brackets as $bk) {
            $teams_json = get_post_meta($bk->ID, '_bracket_teams', true);
            $team_ids = is_string($teams_json) ? json_decode($teams_json, true) : (is_array($teams_json) ? $teams_json : array());
            if (!is_array($team_ids)) $team_ids = array();

            $brackets_data[] = array(
                'id' => $bk->ID,
                'title' => $bk->post_title,
                'year' => get_post_meta($bk->ID, '_bracket_year', true),
                'number' => get_post_meta($bk->ID, '_bracket_number', true),
                'name1' => get_post_meta($bk->ID, '_bracket_name1', true),
                'name2' => get_post_meta($bk->ID, '_bracket_name2', true),
                'name3' => get_post_meta($bk->ID, '_bracket_name3', true),
                'abbreviation' => get_post_meta($bk->ID, '_bracket_abbreviation', true),
                'teams_count' => count($team_ids),
                'modified' => $bk->post_modified,
            );
        }

        $class_terms = wp_get_post_terms($s->ID, 'team_class', array('fields' => 'names'));

        $result[] = array(
            'id' => $s->ID,
            'title' => $s->post_title,
            'class' => is_array($class_terms) ? $class_terms : array(),
            'tournaments' => $tournaments_data,
            'brackets' => $brackets_data,
        );
    }

    return $result;
}

function jsbb_get_tournament_detail($request) {
    $post_id = intval($request['id']);
    $post = get_post($post_id);

    if (!$post || $post->post_type !== 'tournament') {
        return new WP_Error('not_found', 'Tournament not found', array('status' => 404));
    }

    $matches = get_posts(array(
        'post_type' => 'match',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'meta_key' => '_match_tournament_id',
        'meta_value' => $post_id,
    ));

    $matches_data = array();
    foreach ($matches as $m) {
        $home_team = get_post(intval(get_post_meta($m->ID, '_match_home_team_id', true)));
        $away_team = get_post(intval(get_post_meta($m->ID, '_match_away_team_id', true)));

        $matches_data[] = array(
            'id' => $m->ID,
            'date' => get_post_meta($m->ID, '_match_date', true),
            'round' => get_post_meta($m->ID, '_match_round', true),
            'venue' => get_post_meta($m->ID, '_match_venue', true),
            'home_team' => array(
                'id' => $home_team ? $home_team->ID : null,
                'name' => $home_team ? $home_team->post_title : '未定',
            ),
            'away_team' => array(
                'id' => $away_team ? $away_team->ID : null,
                'name' => $away_team ? $away_team->post_title : '未定',
            ),
            'home_total' => intval(get_post_meta($m->ID, '_match_home_total', true)),
            'away_total' => intval(get_post_meta($m->ID, '_match_away_total', true)),
            'status' => jsbb_get_match_status($m->ID),
        );
    }

    usort($matches_data, function($a, $b) {
        return strcmp($a['date'] ?: '', $b['date'] ?: '');
    });

    $series_id = get_post_meta($post_id, '_tournament_series_id', true);
    $series = $series_id ? get_post($series_id) : null;

    // PDF データ
    $pdfs_json = get_post_meta($post_id, '_tournament_pdfs', true);
    $pdf_ids = is_string($pdfs_json) ? json_decode($pdfs_json, true) : (is_array($pdfs_json) ? $pdfs_json : array());
    if (!is_array($pdf_ids)) $pdf_ids = array();

    $pdfs_data = array();
    foreach ($pdf_ids as $pid) {
        $pdf_url = wp_get_attachment_url(intval($pid));
        if (!$pdf_url) continue;
        $pdfs_data[] = array(
            'id' => intval($pid),
            'url' => $pdf_url,
            'filename' => basename($pdf_url),
        );
    }

    return array(
        'id' => $post_id,
        'title' => $post->post_title,
        'year' => get_post_meta($post_id, '_tournament_year', true),
        'number' => get_post_meta($post_id, '_tournament_number', true),
        'start_date' => get_post_meta($post_id, '_tournament_start_date', true),
        'end_date' => get_post_meta($post_id, '_tournament_end_date', true),
        'organizer' => get_post_meta($post_id, '_tournament_organizer', true),
        'co_organizer' => get_post_meta($post_id, '_tournament_co_organizer', true),
        'supervisor' => get_post_meta($post_id, '_tournament_supervisor', true),
        'special_sponsor' => get_post_meta($post_id, '_tournament_special_sponsor', true),
        'supporter' => get_post_meta($post_id, '_tournament_supporter', true),
        'official_ball' => get_post_meta($post_id, '_tournament_official_ball', true),
        'series' => $series ? array('id' => $series->ID, 'title' => $series->post_title) : null,
        'description' => $post->post_content,
        'pdfs' => $pdfs_data,
        'matches' => $matches_data,
    );
}

function jsbb_get_match_detail($request) {
    $post_id = intval($request['id']);
    $post = get_post($post_id);

    if (!$post || $post->post_type !== 'match') {
        return new WP_Error('not_found', 'Match not found', array('status' => 404));
    }

    $home_team = get_post(intval(get_post_meta($post_id, '_match_home_team_id', true)));
    $away_team = get_post(intval(get_post_meta($post_id, '_match_away_team_id', true)));

    $inning_scores_json = get_post_meta($post_id, '_match_inning_scores', true);
    $inning_scores = $inning_scores_json ? json_decode($inning_scores_json, true) : array();

    $tournament_id = get_post_meta($post_id, '_match_tournament_id', true);
    $tournament = $tournament_id ? get_post(intval($tournament_id)) : null;

    $series_id = $tournament ? get_post_meta($tournament->ID, '_tournament_series_id', true) : null;
    $series = $series_id ? get_post(intval($series_id)) : null;

    return array(
        'id' => $post_id,
        'date' => get_post_meta($post_id, '_match_date', true),
        'round' => get_post_meta($post_id, '_match_round', true),
        'venue' => get_post_meta($post_id, '_match_venue', true),
        'home_team' => array(
            'id' => $home_team ? $home_team->ID : null,
            'name' => $home_team ? $home_team->post_title : '未定',
        ),
        'away_team' => array(
            'id' => $away_team ? $away_team->ID : null,
            'name' => $away_team ? $away_team->post_title : '未定',
        ),
        'inning_scores' => is_array($inning_scores) ? $inning_scores : array(),
        'home_total' => intval(get_post_meta($post_id, '_match_home_total', true)),
        'away_total' => intval(get_post_meta($post_id, '_match_away_total', true)),
        'status' => jsbb_get_match_status($post_id),
        'manual_status' => get_post_meta($post_id, '_match_manual_status', true),
        'tournament_id' => $tournament_id ? intval($tournament_id) : null,
        'tournament_title' => $tournament ? $tournament->post_title : '',
        'series_title' => $series ? $series->post_title : '',
    );
}

function jsbb_get_teams_list() {
    $teams = get_posts(array(
        'post_type' => 'team',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    ));

    $result = array();
    foreach ($teams as $t) {
        $class_terms = wp_get_post_terms($t->ID, 'team_class', array('fields' => 'names'));
        $pref_terms = wp_get_post_terms($t->ID, 'prefecture', array('fields' => 'names'));
        $branch_id = get_post_meta($t->ID, '_team_branch_id', true);
        $branch = $branch_id ? get_post(intval($branch_id)) : null;

        $result[] = array(
            'id' => $t->ID,
            'name' => $t->post_title,
            'class' => is_array($class_terms) ? $class_terms : array(),
            'prefecture' => is_array($pref_terms) ? $pref_terms : array(),
            'branch' => $branch ? array('id' => $branch->ID, 'name' => $branch->post_title) : null,
            'founded_year' => get_post_meta($t->ID, '_team_founded_year', true),
        );
    }

    return $result;
}

function jsbb_get_branches_list() {
    $branches = get_posts(array(
        'post_type' => 'branch',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'orderby' => 'title',
        'order' => 'ASC',
    ));

    $result = array();
    foreach ($branches as $b) {
        $pref_terms = wp_get_post_terms($b->ID, 'prefecture', array('fields' => 'names'));
        $result[] = array(
            'id' => $b->ID,
            'name' => $b->post_title,
            'prefecture' => is_array($pref_terms) ? $pref_terms : array(),
            'address' => get_post_meta($b->ID, '_branch_address', true),
            'contact_name' => get_post_meta($b->ID, '_branch_contact_name', true),
            'contact_phone' => get_post_meta($b->ID, '_branch_contact_phone', true),
        );
    }

    return $result;
}

function jsbb_get_tournament_brackets_list() {
    $brackets = get_posts(array(
        'post_type' => 'tournament_bracket',
        'post_status' => 'publish',
        'posts_per_page' => -1,
        'orderby' => 'date',
        'order' => 'DESC',
    ));

    $result = array();
    foreach ($brackets as $bk) {
        $result[] = jsbb_format_bracket_data($bk);
    }

    return $result;
}

function jsbb_get_tournament_bracket_detail($request) {
    $id = intval($request['id']);
    $post = get_post($id);

    if (!$post || $post->post_type !== 'tournament_bracket') {
        return new WP_Error('not_found', 'トーナメント表が見つかりません', array('status' => 404));
    }

    return jsbb_format_bracket_data($post);
}

function jsbb_format_bracket_data($post) {
    $series_id = get_post_meta($post->ID, '_bracket_series_id', true);
    $series = $series_id ? get_post(intval($series_id)) : null;

    $class_terms = wp_get_post_terms($post->ID, 'team_class', array('fields' => 'names'));

    $teams_json = get_post_meta($post->ID, '_bracket_teams', true);
    $team_ids = is_string($teams_json) ? json_decode($teams_json, true) : (is_array($teams_json) ? $teams_json : array());
    if (!is_array($team_ids)) $team_ids = array();

    $teams_data = array();
    foreach ($team_ids as $tid) {
        $team = get_post(intval($tid));
        if (!$team) continue;
        $branch_id = get_post_meta($team->ID, '_team_branch_id', true);
        $branch = $branch_id ? get_post(intval($branch_id)) : null;
        $teams_data[] = array(
            'id' => $team->ID,
            'name' => $team->post_title,
            'branch' => $branch ? $branch->post_title : '',
        );
    }

    // PDF データ
    $pdfs_json = get_post_meta($post->ID, '_bracket_pdfs', true);
    $pdf_ids = is_string($pdfs_json) ? json_decode($pdfs_json, true) : (is_array($pdfs_json) ? $pdfs_json : array());
    if (!is_array($pdf_ids)) $pdf_ids = array();

    $pdfs_data = array();
    foreach ($pdf_ids as $pid) {
        $pdf_url = wp_get_attachment_url(intval($pid));
        if (!$pdf_url) continue;
        $thumb_url = wp_get_attachment_image_url(intval($pid), 'large');
        $pdfs_data[] = array(
            'id' => intval($pid),
            'url' => $pdf_url,
            'thumbnail' => $thumb_url ? $thumb_url : null,
            'filename' => basename($pdf_url),
        );
    }

    return array(
        'id' => $post->ID,
        'title' => $post->post_title,
        'series_id' => $series_id ? intval($series_id) : null,
        'series_title' => $series ? $series->post_title : '',
        'year' => get_post_meta($post->ID, '_bracket_year', true),
        'number' => get_post_meta($post->ID, '_bracket_number', true),
        'name1' => get_post_meta($post->ID, '_bracket_name1', true),
        'name2' => get_post_meta($post->ID, '_bracket_name2', true),
        'name3' => get_post_meta($post->ID, '_bracket_name3', true),
        'abbreviation' => get_post_meta($post->ID, '_bracket_abbreviation', true),
        'categories' => is_array($class_terms) ? $class_terms : array(),
        'teams' => $teams_data,
        'pdfs' => $pdfs_data,
        'modified' => $post->post_modified,
    );
}

// ==========================================
