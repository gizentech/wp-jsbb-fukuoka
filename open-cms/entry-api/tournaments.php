<?php
require __DIR__ . '/config.php';
cors();

$rows = db()
    ->query("SELECT id, name, form_type FROM jsbb_tournaments WHERE is_active=1 ORDER BY sort_order, id")
    ->fetchAll();

json_out($rows);
