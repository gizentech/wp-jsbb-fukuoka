<?php
require __DIR__ . '/config.php';
cors();

$rows = db()
    ->query("SELECT id, name, form_type, entry_deadline FROM jsbb_tournaments WHERE is_active=1 AND (entry_deadline IS NULL OR entry_deadline > NOW()) ORDER BY sort_order, id")
    ->fetchAll();

json_out($rows);
