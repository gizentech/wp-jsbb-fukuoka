<?php
// テーブル初期化スクリプト（初回のみアクセス）
require __DIR__ . '/config.php';
$pdo = db();

$pdo->exec("CREATE TABLE IF NOT EXISTS jsbb_tournaments (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    form_type  VARCHAR(50)  NOT NULL DEFAULT 'prefecture' COMMENT 'prefecture=県大会, city=市大会',
    is_active  TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order INT          NOT NULL DEFAULT 0,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

$pdo->exec("CREATE TABLE IF NOT EXISTS jsbb_entries (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    entry_code     VARCHAR(30)  NOT NULL UNIQUE,
    tournament_id  INT          NOT NULL,
    form_data      LONGTEXT     NOT NULL COMMENT 'JSON',
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tournament (tournament_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

// サンプル大会（存在しない場合のみ挿入）
$cnt = $pdo->query("SELECT COUNT(*) FROM jsbb_tournaments")->fetchColumn();
if ($cnt == 0) {
    $pdo->exec("INSERT INTO jsbb_tournaments (name, form_type, sort_order) VALUES
        ('福岡トヨタ杯第10回記念福岡県学童軟式野球春季大会', 'prefecture', 1)");
}

echo "✅ Tables initialized OK";
