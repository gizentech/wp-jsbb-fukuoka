<?php
require __DIR__ . '/auth.php';
require_auth();

$pdo = db();
$msg = '';

// 大会削除
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete_tournament') {
    $id = (int)($_POST['id'] ?? 0);
    $pdo->prepare("UPDATE jsbb_tournaments SET is_active=0 WHERE id=?")->execute([$id]);
    $msg = '大会を削除しました';
}

// エントリー削除
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'delete_entry') {
    $code = $_POST['code'] ?? '';
    $pdo->prepare("DELETE FROM jsbb_entries WHERE entry_code=?")->execute([$code]);
    $msg = "エントリー {$code} を削除しました";
}

$tournaments = $pdo->query("SELECT *, (entry_deadline IS NOT NULL AND entry_deadline <= NOW()) AS is_expired FROM jsbb_tournaments ORDER BY sort_order, id")->fetchAll();

// フィルター
$filter_tid = (int)($_GET['tid'] ?? 0);
$where = $filter_tid ? "WHERE e.tournament_id=$filter_tid" : "";
$entries = $pdo->query("
    SELECT e.entry_code, e.tournament_id, e.created_at, e.updated_at,
           t.name AS tournament_name,
           JSON_UNQUOTE(JSON_EXTRACT(e.form_data, '$.form.team_name')) AS team_name
    FROM jsbb_entries e
    JOIN jsbb_tournaments t ON t.id=e.tournament_id
    $where
    ORDER BY e.updated_at DESC
    LIMIT 200
")->fetchAll();

$TYPE_LABEL = ['prefecture' => '県大会', 'city' => '市大会'];
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>エントリー管理 | JSBB 福岡</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Meiryo',sans-serif;background:#f0f2f5;color:#222;font-size:14px}
.wrap{max-width:1100px;margin:0 auto;padding:20px 16px}
header{background:#1a3a70;color:#fff;padding:12px 20px;display:flex;align-items:center;justify-content:space-between}
header h1{font-size:16px;font-weight:700}
header small{font-size:12px;opacity:.7}
.msg{background:#d4edda;border:1px solid #c3e6cb;color:#155724;padding:10px 16px;border-radius:4px;margin-bottom:16px}
.card{background:#fff;border-radius:8px;padding:20px;margin-bottom:20px;box-shadow:0 1px 4px rgba(0,0,0,.1)}
.card h2{font-size:14px;font-weight:700;color:#1a3a70;border-left:3px solid #1a3a70;padding-left:8px;margin-bottom:14px}
.btn{display:inline-block;padding:7px 16px;border-radius:4px;border:none;cursor:pointer;font-size:13px;font-family:inherit;text-decoration:none}
.btn-primary{background:#1a3a70;color:#fff}
.btn-sm{padding:4px 10px;font-size:12px}
.btn-danger{background:#dc3545;color:#fff}
.btn-secondary{background:#6c757d;color:#fff}
table{width:100%;border-collapse:collapse;font-size:13px}
th{background:#1a3a70;color:#fff;padding:8px 10px;text-align:left;white-space:nowrap}
td{padding:7px 10px;border-bottom:1px solid #e8e8e8;vertical-align:middle}
tr:hover td{background:#f8f9ff}
.badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:11px;font-weight:700}
.badge-p{background:#cce5ff;color:#004085}
.badge-c{background:#d4edda;color:#155724}
.badge-off{background:#f8d7da;color:#721c24}
.filter{display:flex;gap:8px;align-items:center;margin-bottom:12px;flex-wrap:wrap}
.filter a{padding:5px 12px;border-radius:4px;text-decoration:none;font-size:12px;border:1px solid #ccc;color:#444}
.filter a.active{background:#1a3a70;color:#fff;border-color:#1a3a70}
.code{font-family:monospace;font-weight:700;letter-spacing:1px;color:#1a3a70;font-size:14px}
</style>
</head>
<body>
<header>
  <h1>JSBB 福岡 エントリー管理</h1>
  <small><?= date('Y/m/d H:i') ?></small>
</header>
<div class="wrap">

<?php if ($msg): ?>
<div class="msg"><?= htmlspecialchars($msg) ?></div>
<?php endif ?>

<!-- 大会一覧 -->
<div class="card">
  <h2>大会一覧</h2>
  <div style="margin-bottom:12px">
    <a class="btn btn-primary btn-sm" href="tournament-form.php">+ 大会を追加</a>
  </div>
  <table>
    <thead><tr><th>ID</th><th>大会名</th><th>様式</th><th>状態</th><th>申込期限</th><th>操作</th></tr></thead>
    <tbody>
    <?php foreach ($tournaments as $t): ?>
    <tr>
      <td><?= $t['id'] ?></td>
      <td><?= htmlspecialchars($t['name']) ?></td>
      <td><span class="badge <?= $t['form_type']==='prefecture'?'badge-p':'badge-c' ?>"><?= $TYPE_LABEL[$t['form_type']] ?? $t['form_type'] ?></span></td>
      <td>
        <?php if (!$t['is_active']): ?>
          <span class="badge badge-off">非公開</span>
        <?php elseif ($t['is_expired']): ?>
          <span class="badge badge-off">期限切れ</span>
        <?php else: ?>
          <span class="badge badge-p">公開中</span>
        <?php endif ?>
      </td>
      <td style="white-space:nowrap;font-size:12px">
        <?= $t['entry_deadline'] ? htmlspecialchars(substr($t['entry_deadline'], 0, 16)) : '<span style="color:#999">—</span>' ?>
      </td>
      <td style="white-space:nowrap">
        <a class="btn btn-secondary btn-sm" href="tournament-form.php?id=<?= $t['id'] ?>">編集</a>
        &nbsp;
        <form method="post" style="display:inline" onsubmit="return confirm('削除しますか？')">
          <input type="hidden" name="action" value="delete_tournament">
          <input type="hidden" name="id" value="<?= $t['id'] ?>">
          <button class="btn btn-danger btn-sm">削除</button>
        </form>
      </td>
    </tr>
    <?php endforeach ?>
    </tbody>
  </table>
</div>

<!-- エントリー一覧 -->
<div class="card">
  <h2>エントリー一覧</h2>
  <div class="filter">
    <span style="font-size:12px;color:#666">絞り込み：</span>
    <a href="index.php" class="<?= !$filter_tid?'active':'' ?>">すべて</a>
    <?php foreach ($tournaments as $t): ?>
    <a href="index.php?tid=<?= $t['id'] ?>" class="<?= $filter_tid==$t['id']?'active':'' ?>"><?= htmlspecialchars($t['name']) ?></a>
    <?php endforeach ?>
  </div>
  <table>
    <thead><tr><th>保存コード</th><th>チーム名</th><th>大会</th><th>保存日時</th><th>更新日時</th><th>操作</th></tr></thead>
    <tbody>
    <?php if (!$entries): ?>
    <tr><td colspan="6" style="text-align:center;color:#999;padding:20px">エントリーがありません</td></tr>
    <?php endif ?>
    <?php foreach ($entries as $e): ?>
    <tr>
      <td><span class="code"><?= htmlspecialchars($e['entry_code']) ?></span></td>
      <td><?= htmlspecialchars($e['team_name'] ?? '（未入力）') ?></td>
      <td><?= htmlspecialchars($e['tournament_name']) ?></td>
      <td><?= $e['created_at'] ?></td>
      <td><?= $e['updated_at'] ?></td>
      <td>
        <form method="post" style="display:inline" onsubmit="return confirm('削除しますか？')">
          <input type="hidden" name="action" value="delete_entry">
          <input type="hidden" name="code" value="<?= htmlspecialchars($e['entry_code']) ?>">
          <button class="btn btn-danger btn-sm">削除</button>
        </form>
      </td>
    </tr>
    <?php endforeach ?>
    </tbody>
  </table>
</div>

</div>
</body>
</html>
