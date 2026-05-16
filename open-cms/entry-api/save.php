<?php
require __DIR__ . '/config.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['error' => 'POST only'], 405);

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) json_out(['error' => 'Invalid JSON'], 400);

$tid  = (int)($body['tournament_id'] ?? 0);
$data = $body['form_data'] ?? null;
$code = strtoupper(trim($body['entry_code'] ?? ''));

if (!$tid)  json_out(['error' => 'tournament_id required'], 400);
if (!$data) json_out(['error' => 'form_data required'], 400);

// 大会存在確認
$t = db()->prepare("SELECT id FROM jsbb_tournaments WHERE id=? AND is_active=1");
$t->execute([$tid]);
if (!$t->fetch()) json_out(['error' => 'Tournament not found'], 404);

$fd = json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$pdo = db();

if ($code) {
    // 既存コードで更新
    $st = $pdo->prepare("UPDATE jsbb_entries SET form_data=?, tournament_id=?, updated_at=NOW() WHERE entry_code=?");
    $st->execute([$fd, $tid, $code]);
    if ($st->rowCount() === 0) json_out(['error' => 'Entry code not found'], 404);
} else {
    // 新規コード発行
    do {
        $code = substr(strtoupper(bin2hex(random_bytes(4))), 0, 8);
        $chk = $pdo->prepare("SELECT id FROM jsbb_entries WHERE entry_code=?");
        $chk->execute([$code]);
    } while ($chk->fetch());

    $st = $pdo->prepare("INSERT INTO jsbb_entries (entry_code, tournament_id, form_data) VALUES (?,?,?)");
    $st->execute([$code, $tid, $fd]);
}

json_out(['success' => true, 'entry_code' => $code]);
