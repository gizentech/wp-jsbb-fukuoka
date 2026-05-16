<?php
if (!defined('ABSPATH')) exit;

// ============================================================
// 申込書提出エンドポイント
//
// POST /wp-json/jsbb/v1/entry/submit
//   body: { form_data, tournament_name, entry_code?,
//           submitter_name, submitter_email, submitter_phone }
//
// 1. 提出者へ控えPDF付きメール
// 2. 事務局へ通知メール（PDF添付）
// ============================================================

// ── SMTP 設定 ──────────────────────────────────────────────────────────────
if (!defined('JSBB_SMTP_HOST'))    define('JSBB_SMTP_HOST',    'sv13316.xserver.jp');
if (!defined('JSBB_SMTP_PORT'))    define('JSBB_SMTP_PORT',    465);
if (!defined('JSBB_SMTP_USER'))    define('JSBB_SMTP_USER',    'shop@jsbb-fukuoka.com');
if (!defined('JSBB_SMTP_PASS'))    define('JSBB_SMTP_PASS',    'open2000');
if (!defined('JSBB_SMTP_FROM'))    define('JSBB_SMTP_FROM',    'shop@jsbb-fukuoka.com');
if (!defined('JSBB_SMTP_FNAME'))   define('JSBB_SMTP_FNAME',   '福岡県軟式野球連盟');
if (!defined('JSBB_ENTRY_NOTIFY')) define('JSBB_ENTRY_NOTIFY', 'info@jsbb-fukuoka.com');
if (!defined('JSBB_ENTRY_CC'))     define('JSBB_ENTRY_CC',     'shiraishi@jsbb-fukuoka.com');

// ── REST ルート ────────────────────────────────────────────────────────────
add_action('rest_api_init', function () {
    register_rest_route('jsbb/v1', '/entry/submit', [
        'methods'             => 'POST',
        'callback'            => 'jsbb_entry_api_submit',
        'permission_callback' => '__return_true',
    ]);
});

// ── コールバック ────────────────────────────────────────────────────────────
function jsbb_entry_api_submit(WP_REST_Request $request): WP_REST_Response|WP_Error {
    $body = $request->get_json_params();
    if (!$body) return new WP_Error('bad_request', 'Invalid JSON', ['status' => 400]);

    $form_data       = $body['form_data']       ?? null;
    $tournament_name = sanitize_text_field($body['tournament_name'] ?? '');
    $entry_code      = sanitize_text_field($body['entry_code']      ?? '');
    $submitter_name  = sanitize_text_field($body['submitter_name']  ?? '');
    $submitter_email = sanitize_email(     $body['submitter_email'] ?? '');
    $submitter_phone = sanitize_text_field($body['submitter_phone'] ?? '');

    if (!$submitter_email || !is_email($submitter_email))
        return new WP_Error('bad_request', 'valid email required', ['status' => 400]);
    if (!$submitter_name)
        return new WP_Error('bad_request', 'submitter_name required', ['status' => 400]);
    if (!$form_data)
        return new WP_Error('bad_request', 'form_data required', ['status' => 400]);

    $form      = $form_data['form']    ?? [];
    $players   = $form_data['players'] ?? [];
    $team_name = $form['team_name']    ?? '';

    $subject  = '【ENTRY】' . $tournament_name . '_' . $team_name;
    $pdf_name = ($tournament_name ?: '申込書') . '_' . ($team_name ?: 'チーム') . '.pdf';

    // PDF生成
    $pdf_path = jsbb_entry_build_pdf($form, $players, $tournament_name);

    // 1. 提出者への控えメール
    jsbb_entry_mailer(
        $submitter_email,
        $subject,
        jsbb_entry_submitter_body($tournament_name, $team_name, $submitter_name, $entry_code),
        $pdf_path,
        $pdf_name
    );

    // 2. 事務局への通知メール（CC あり）
    jsbb_entry_mailer(
        JSBB_ENTRY_NOTIFY,
        $subject,
        jsbb_entry_admin_body($form, $players, $tournament_name, $submitter_name, $submitter_email, $submitter_phone, $entry_code),
        $pdf_path,
        $pdf_name,
        JSBB_ENTRY_CC
    );

    // 一時ファイル削除
    if ($pdf_path && file_exists($pdf_path)) @unlink($pdf_path);

    return new WP_REST_Response(['success' => true], 200);
}

// ── PHPMailer 送信 ──────────────────────────────────────────────────────────
function jsbb_entry_mailer(
    string  $to,
    string  $subject,
    string  $html_body,
    ?string $pdf_path,
    string  $pdf_name,
    string  $cc = ''
): bool {
    require_once ABSPATH . WPINC . '/PHPMailer/PHPMailer.php';
    require_once ABSPATH . WPINC . '/PHPMailer/SMTP.php';
    require_once ABSPATH . WPINC . '/PHPMailer/Exception.php';

    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = JSBB_SMTP_HOST;
        $mail->SMTPAuth   = true;
        $mail->Port       = JSBB_SMTP_PORT;
        $mail->Username   = JSBB_SMTP_USER;
        $mail->Password   = JSBB_SMTP_PASS;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;
        $mail->CharSet    = 'UTF-8';
        $mail->Encoding   = 'base64';
        $mail->setFrom(JSBB_SMTP_FROM, JSBB_SMTP_FNAME);
        $mail->addAddress($to);
        if ($cc) $mail->addCC($cc);
        $mail->Subject = $subject;
        $mail->isHTML(true);
        $mail->Body    = $html_body;
        $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $html_body));
        if ($pdf_path && file_exists($pdf_path)) {
            $mail->addAttachment($pdf_path, $pdf_name);
        }
        $mail->send();
        return true;
    } catch (\Exception $e) {
        error_log('JSBB entry mailer: ' . $e->getMessage());
        return false;
    }
}

// ── PDF 生成（Dompdf） ─────────────────────────────────────────────────────
// composer install が必要: cd wordpress-plugin/jsbb-custom && composer install
function jsbb_entry_build_pdf(array $form, array $players, string $tournament_name): ?string {
    $autoload = plugin_dir_path(dirname(__FILE__)) . 'vendor/autoload.php';
    if (!file_exists($autoload)) {
        error_log('JSBB entry: Dompdf not found. Run composer install in plugin directory.');
        return null;
    }
    require_once $autoload;

    try {
        $options = new \Dompdf\Options();
        $options->setDefaultFont('DejaVu Sans');
        $options->setIsRemoteEnabled(false);

        $dompdf = new \Dompdf\Dompdf($options);
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml(jsbb_entry_pdf_html($form, $players, $tournament_name), 'UTF-8');
        $dompdf->render();

        $tmp = sys_get_temp_dir() . '/jsbb_' . uniqid() . '.pdf';
        file_put_contents($tmp, $dompdf->output());
        return $tmp;
    } catch (\Exception $e) {
        error_log('JSBB entry PDF: ' . $e->getMessage());
        return null;
    }
}

// ── PDF HTML テンプレート ───────────────────────────────────────────────────
function jsbb_entry_pdf_html(array $form, array $players, string $tournament_name): string {
    $e = fn($v) => htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');

    $title = $e($tournament_name) . '　申込書';

    // 選手行
    $player_rows = '';
    foreach ($players as $i => $p) {
        if (empty(trim($p['name'] ?? ''))) continue;
        $jersey = ($i === 0) ? '10' : $e($p['jersey'] ?? '');
        $cap    = ($i === 0) ? '<br><small style="font-size:6pt">主将</small>' : '';
        $player_rows .= sprintf(
            '<tr><td class="c">%d</td><td class="c">%s%s</td><td class="c">%s</td><td>%s</td><td class="c">%s年</td><td>%s</td></tr>',
            $i + 1,
            $jersey, $cap,
            $e($p['pos']   ?? ''),
            $e($p['name']  ?? ''),
            $e($p['grade'] ?? ''),
            $e($p['kana']  ?? '')
        );
    }

    // スタッフ行
    $staff_rows = '';
    foreach ([
        ['監督（背番号 30）',   'kantoku',  'qual_1a', 'qual_1b'],
        ['コーチ（背番号 29）', 'coach1',   'qual_2a', 'qual_2b'],
        ['コーチ（背番号 28）', 'coach2',   'qual_3a', 'qual_3b'],
        ['マネージャー（1名）', 'manager',  'qual_ma', 'qual_mb'],
    ] as [$label, $key, $qa, $qb]) {
        $staff_rows .= sprintf(
            '<tr><td class="h">%s</td><td>%s　%s歳</td><td>%s</td><td>%s</td></tr>',
            $label,
            $e($form[$key . '_name'] ?? ''),
            $e($form[$key . '_age']  ?? ''),
            $e($form[$qa] ?? ''),
            $e($form[$qb] ?? '')
        );
    }

    return <<<HTML
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><style>
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'DejaVu Sans',sans-serif; font-size:9pt; color:#000; padding:15pt; }
h1 { font-size:16pt; text-align:center; padding:6pt 0 8pt; border-bottom:2pt solid #000; margin-bottom:10pt; }
h2 { font-size:10pt; background:#ddd; padding:3pt 8pt; margin:8pt 0 3pt; }
table { width:100%; border-collapse:collapse; margin-bottom:6pt; }
td { border:1pt solid #999; padding:3pt 5pt; font-size:8.5pt; vertical-align:middle; }
.h { background:#f0f0f0; font-weight:bold; width:28%; }
.c { text-align:center; }
</style></head>
<body>
<h1>{$title}</h1>

<h2>チーム情報</h2>
<table>
  <tr><td class="h">チーム名</td><td>{$e($form['team_name']??'')}</td><td class="h">フリガナ</td><td>{$e($form['team_kana']??'')}</td></tr>
  <tr><td class="h">所属支部</td><td>{$e($form['branch']??'')}支部</td><td class="h">郵便番号</td><td>〒{$e($form['postal']??'')}</td></tr>
  <tr><td class="h">住所</td><td colspan="3">{$e($form['address']??'')}</td></tr>
  <tr><td class="h">TEL（自宅）</td><td>{$e($form['tel_home']??'')}</td><td class="h">TEL（携帯）</td><td>{$e($form['tel_mobile']??'')}</td></tr>
</table>

<h2>指導者・スタッフ</h2>
<table>
  <tr style="background:#ddd"><td class="h c">役職</td><td class="h">氏名・年齢</td><td class="h">指導者資格</td><td class="h">資格登録番号</td></tr>
  {$staff_rows}
</table>

<h2>選手名簿</h2>
<table>
  <tr style="background:#ddd">
    <td class="c" style="width:20pt">No.</td>
    <td class="c" style="width:36pt">背番号</td>
    <td class="c" style="width:48pt">守備位置</td>
    <td>氏名</td>
    <td class="c" style="width:28pt">学年</td>
    <td>フリガナ</td>
  </tr>
  {$player_rows}
</table>

<h2>チーム紹介</h2>
<table><tr><td style="min-height:28pt">{$e($form['team_intro']??'')}</td></tr></table>

<h2>署名</h2>
<table>
  <tr><td class="h">チーム代表者</td><td>{$e($form['rep_name']??'')}</td><td class="h">申込日</td><td>{$e($form['date_year']??'')}年 {$e($form['date_month']??'')}月 {$e($form['date_day']??'')}日</td></tr>
  <tr><td class="h">所属支部</td><td colspan="3">（一社）福岡県軟式野球連盟　{$e($form['branch']??'')}支部</td></tr>
</table>
</body></html>
HTML;
}

// ── メール本文（提出者向け） ────────────────────────────────────────────────
function jsbb_entry_submitter_body(string $tournament_name, string $team_name, string $submitter_name, string $entry_code): string {
    $e = fn($v) => htmlspecialchars($v, ENT_QUOTES, 'UTF-8');
    $code_row = $entry_code
        ? '<tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>保存ID</strong></td><td style="padding:6px 12px">' . $e($entry_code) . '</td></tr>'
        : '';
    return '
<p>' . $e($submitter_name) . ' 様</p><br>
<p>以下の内容で申込書を受け付けました。<br>控えのPDFを添付しておりますのでご確認ください。</p><br>
<table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>大会名</strong></td><td style="padding:6px 12px">' . $e($tournament_name) . '</td></tr>
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>チーム名</strong></td><td style="padding:6px 12px">' . $e($team_name) . '</td></tr>
  ' . $code_row . '
</table><br>
<p style="color:#888;font-size:12px">（一社）福岡県軟式野球連盟</p>';
}

// ── メール本文（事務局向け） ────────────────────────────────────────────────
function jsbb_entry_admin_body(
    array  $form,
    array  $players,
    string $tournament_name,
    string $submitter_name,
    string $submitter_email,
    string $submitter_phone,
    string $entry_code
): string {
    $e = fn($v) => htmlspecialchars((string)($v ?? ''), ENT_QUOTES, 'UTF-8');
    $player_count = count(array_filter($players, fn($p) => !empty(trim($p['name'] ?? ''))));
    $code_row = $entry_code
        ? '<tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>保存ID</strong></td><td style="padding:6px 12px">' . $e($entry_code) . '</td></tr>'
        : '';
    return '
<p>申込書の提出がありました。添付のPDFをご確認ください。</p><br>
<h3 style="font-size:14px;margin-bottom:6px">■ 提出者情報</h3>
<table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:16px">
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>提出者名</strong></td><td style="padding:6px 12px">' . $e($submitter_name) . '</td></tr>
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>メール</strong></td><td style="padding:6px 12px">' . $e($submitter_email) . '</td></tr>
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>電話番号</strong></td><td style="padding:6px 12px">' . $e($submitter_phone) . '</td></tr>
</table>
<h3 style="font-size:14px;margin-bottom:6px">■ 申込内容</h3>
<table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>大会名</strong></td><td style="padding:6px 12px">' . $e($tournament_name) . '</td></tr>
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>チーム名</strong></td><td style="padding:6px 12px">' . $e($form['team_name'] ?? '') . '</td></tr>
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>所属支部</strong></td><td style="padding:6px 12px">' . $e($form['branch'] ?? '') . '支部</td></tr>
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>監督</strong></td><td style="padding:6px 12px">' . $e($form['kantoku_name'] ?? '') . '</td></tr>
  <tr><td style="background:#f5f5f5;padding:6px 12px;white-space:nowrap"><strong>登録選手数</strong></td><td style="padding:6px 12px">' . $player_count . '名</td></tr>
  ' . $code_row . '
</table>';
}
