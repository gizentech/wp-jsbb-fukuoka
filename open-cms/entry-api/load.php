<?php
require __DIR__ . '/config.php';
cors();

$code = strtoupper(trim($_GET['code'] ?? ''));
if (!$code) json_out(['error' => 'code required'], 400);

$st = db()->prepare("
    SELECT e.entry_code, e.tournament_id, e.form_data, e.created_at, e.updated_at,
           t.name AS tournament_name, t.form_type
    FROM jsbb_entries e
    JOIN jsbb_tournaments t ON t.id = e.tournament_id
    WHERE e.entry_code = ?
");
$st->execute([$code]);
$row = $st->fetch();

if (!$row) json_out(['error' => 'Entry not found'], 404);

$row['form_data'] = json_decode($row['form_data'], true);
json_out($row);
