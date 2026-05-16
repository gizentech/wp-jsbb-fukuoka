<?php
require __DIR__ . '/auth.php';
require_auth();

$pdo = db();
$id  = (int)($_GET['id'] ?? 0);
$row = null;
$msg = '';

if ($id) {
    $st = $pdo->prepare("SELECT * FROM jsbb_tournaments WHERE id=?");
    $st->execute([$id]);
    $row = $st->fetch();
    if (!$row) { header('Location: index.php'); exit; }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name      = trim($_POST['name'] ?? '');
    $form_type = $_POST['form_type'] ?? 'prefecture';
    $sort      = (int)($_POST['sort_order'] ?? 0);
    $active    = isset($_POST['is_active']) ? 1 : 0;
    $deadline_raw = trim($_POST['entry_deadline'] ?? '');
    // datetime-local → MySQL DATETIME（例: "2026-05-31T23:59" → "2026-05-31 23:59:00"）
    $deadline  = $deadline_raw ? str_replace('T', ' ', $deadline_raw) . ':00' : null;

    if (!$name) {
        $msg = '大会名を入力してください';
    } else {
        if ($id) {
            $pdo->prepare("UPDATE jsbb_tournaments SET name=?,form_type=?,sort_order=?,is_active=?,entry_deadline=? WHERE id=?")
                ->execute([$name, $form_type, $sort, $active, $deadline, $id]);
        } else {
            $pdo->prepare("INSERT INTO jsbb_tournaments (name,form_type,sort_order,is_active,entry_deadline) VALUES (?,?,?,?,?)")
                ->execute([$name, $form_type, $sort, $active, $deadline]);
        }
        header('Location: index.php');
        exit;
    }
}

$name      = $_POST['name']      ?? ($row['name'] ?? '');
$form_type = $_POST['form_type'] ?? ($row['form_type'] ?? 'prefecture');
$sort      = $_POST['sort_order'] ?? ($row['sort_order'] ?? 0);
$active    = isset($_POST['is_active']) ? (bool)$_POST['is_active'] : (($row['is_active'] ?? 1) == 1);
// DB値 "2026-05-31 23:59:00" → datetime-local入力値 "2026-05-31T23:59"
$deadline_db  = $row['entry_deadline'] ?? '';
$deadline_val = $deadline_db ? substr(str_replace(' ', 'T', $deadline_db), 0, 16) : '';
?>
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title><?= $id ? '大会編集' : '大会追加' ?> | JSBB 福岡</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Meiryo',sans-serif;background:#f0f2f5;color:#222;font-size:14px}
header{background:#1a3a70;color:#fff;padding:12px 20px}
header h1{font-size:16px;font-weight:700}
.wrap{max-width:600px;margin:30px auto;padding:0 16px}
.card{background:#fff;border-radius:8px;padding:24px;box-shadow:0 1px 4px rgba(0,0,0,.1)}
.card h2{font-size:15px;font-weight:700;color:#1a3a70;border-left:3px solid #1a3a70;padding-left:8px;margin-bottom:20px}
.field{margin-bottom:16px}
label{display:block;font-size:12px;font-weight:600;color:#555;margin-bottom:5px}
input[type=text],input[type=number],select{width:100%;border:1px solid #d0d5dd;border-radius:5px;padding:9px 12px;font-size:14px;font-family:inherit}
input[type=text]:focus,input[type=number]:focus,select:focus{outline:none;border-color:#1a3a70}
.check-row{display:flex;align-items:center;gap:8px}
input[type=checkbox]{width:18px;height:18px;cursor:pointer}
.actions{display:flex;gap:10px;margin-top:20px}
.btn{padding:10px 24px;border-radius:5px;border:none;cursor:pointer;font-size:14px;font-family:inherit;font-weight:600}
.btn-primary{background:#1a3a70;color:#fff}
.btn-secondary{background:#fff;color:#555;border:1px solid #ccc}
.msg{background:#f8d7da;border:1px solid #f5c6cb;color:#721c24;padding:10px 14px;border-radius:4px;margin-bottom:16px}
.note{font-size:11px;color:#888;margin-top:4px}
</style>
</head>
<body>
<header><h1>JSBB 福岡 エントリー管理</h1></header>
<div class="wrap">
  <div class="card">
    <h2><?= $id ? '大会を編集' : '大会を追加' ?></h2>
    <?php if ($msg): ?><div class="msg"><?= htmlspecialchars($msg) ?></div><?php endif ?>
    <form method="post">
      <div class="field">
        <label>大会名 *</label>
        <input type="text" name="name" value="<?= htmlspecialchars($name) ?>" placeholder="例：第10回福岡県学童軟式野球秋季大会" required>
      </div>
      <div class="field">
        <label>様式（フォームの種類）</label>
        <select name="form_type">
          <option value="prefecture" <?= $form_type==='prefecture'?'selected':'' ?>>県大会（現在の申込書形式）</option>
          <option value="city"       <?= $form_type==='city'?'selected':'' ?>>市大会（準備中）</option>
        </select>
        <p class="note">県大会：現在の申込書フォームを使用。市大会は今後追加予定。</p>
      </div>
      <div class="field">
        <label>表示順（小さい順に表示）</label>
        <input type="number" name="sort_order" value="<?= (int)$sort ?>" min="0" style="max-width:100px">
      </div>
      <div class="field">
        <label>申込期限（この日時を過ぎると一覧から自動非表示）</label>
        <input type="datetime-local" name="entry_deadline" value="<?= htmlspecialchars($deadline_val) ?>">
        <p class="note">空欄 = 期限なし（手動で「公開中」チェックを外すまで表示）</p>
      </div>
      <div class="field">
        <div class="check-row">
          <input type="checkbox" name="is_active" id="is_active" <?= $active?'checked':'' ?>>
          <label for="is_active" style="margin:0;cursor:pointer">公開中（申込フォームに表示する）</label>
        </div>
      </div>
      <div class="actions">
        <button type="submit" class="btn btn-primary">保存する</button>
        <a href="index.php" class="btn btn-secondary">キャンセル</a>
      </div>
    </form>
  </div>
</div>
</body>
</html>
