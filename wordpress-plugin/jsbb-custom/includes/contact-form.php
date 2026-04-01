<?php
if (!defined('ABSPATH')) exit;

// ==========================================
// お問い合わせフォーム → Slack送信
// ==========================================
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/contact', array(
        'methods' => 'POST',
        'callback' => 'jsbb_handle_contact',
        'permission_callback' => '__return_true',
    ));
});

function jsbb_handle_contact($request) {
    $data = $request->get_json_params();

    $category = sanitize_text_field($data['category'] ?? '');
    $name     = sanitize_text_field($data['name'] ?? '');
    $branch   = sanitize_text_field($data['branch'] ?? '');
    $team     = sanitize_text_field($data['team'] ?? '');
    $email    = sanitize_email($data['email'] ?? '');
    $phone    = sanitize_text_field($data['phone'] ?? '');
    $message  = sanitize_textarea_field($data['message'] ?? '');

    if (empty($category) || empty($name) || empty($email) || empty($phone) || empty($message)) {
        return new WP_Error('missing_fields', '必須項目を入力してください', array('status' => 400));
    }

    $timestamp = wp_date('Y年m月d日 H:i:s');

    $slack_message = array(
        'username' => 'お問い合わせ通知',
        'icon_emoji' => ':envelope:',
        'text' => '新しいお問い合わせが届きました',
        'blocks' => array(
            array(
                'type' => 'header',
                'text' => array(
                    'type' => 'plain_text',
                    'text' => '📩 新しいお問い合わせ',
                ),
            ),
            array(
                'type' => 'section',
                'fields' => array(
                    array('type' => 'mrkdwn', 'text' => "*お問い合わせ種別:*\n{$category}"),
                    array('type' => 'mrkdwn', 'text' => "*お名前:*\n{$name}"),
                    array('type' => 'mrkdwn', 'text' => "*所属支部:*\n" . ($branch ?: '未選択')),
                    array('type' => 'mrkdwn', 'text' => "*チーム名:*\n" . ($team ?: '未入力')),
                    array('type' => 'mrkdwn', 'text' => "*メールアドレス:*\n{$email}"),
                    array('type' => 'mrkdwn', 'text' => "*電話番号:*\n{$phone}"),
                ),
            ),
            array(
                'type' => 'section',
                'text' => array(
                    'type' => 'mrkdwn',
                    'text' => "*お問い合わせ内容:*\n{$message}",
                ),
            ),
            array(
                'type' => 'context',
                'elements' => array(
                    array('type' => 'mrkdwn', 'text' => "受信日時: {$timestamp}"),
                ),
            ),
        ),
    );

    $webhook_url = defined('JSBB_SLACK_WEBHOOK_URL')
        ? JSBB_SLACK_WEBHOOK_URL
        : 'https://hooks.slack.com/services/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';

    $response = wp_remote_post($webhook_url, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body'    => wp_json_encode($slack_message),
        'timeout' => 10,
    ));

    if (is_wp_error($response)) {
        return new WP_Error('slack_error', '送信に失敗しました', array('status' => 500));
    }

    $status_code = wp_remote_retrieve_response_code($response);
    if ($status_code !== 200) {
        return new WP_Error('slack_error', '送信に失敗しました', array('status' => 500));
    }

    return new WP_REST_Response(array('success' => true), 200);
}
