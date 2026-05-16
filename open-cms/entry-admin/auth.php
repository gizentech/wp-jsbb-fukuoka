<?php
require __DIR__ . '/../entry-api/config.php';

function require_auth(): void {
    $user = $_SERVER['PHP_AUTH_USER'] ?? '';
    $pass = $_SERVER['PHP_AUTH_PW'] ?? '';
    if ($user !== 'admin' || $pass !== ADMIN_PASS) {
        header('WWW-Authenticate: Basic realm="JSBB Entry Admin"');
        http_response_code(401);
        echo '認証が必要です';
        exit;
    }
}
