<?php
declare(strict_types=1);

/**
 * Local test-site bootstrap. The private config must never live under htdocs.
 * Set AHC_LOCAL_TEST_CONFIG_PATH in Apache's environment, or place config at the
 * Windows-only fallback shown below. This endpoint never contacts AHC production.
 */
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, private');

$defaultConfigPath = 'C:\\xampp\\private\\ahc-local-test\\config.local.php';
$configPath = getenv('AHC_LOCAL_TEST_CONFIG_PATH') ?: $defaultConfigPath;

if (!is_file($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Private local configuration was not found outside htdocs.']);
    exit;
}

$config = require $configPath;
if (!is_array($config) || !isset($config['mysql']) || !is_array($config['mysql'])) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Private local configuration is invalid.']);
    exit;
}

function localTestConnection(array $config): mysqli {
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    $mysql = $config['mysql'];
    return new mysqli(
        (string)($mysql['host'] ?? '127.0.0.1'),
        (string)($mysql['username'] ?? ''),
        (string)($mysql['password'] ?? ''),
        (string)($mysql['database'] ?? 'ahc_local_test'),
        (int)($mysql['port'] ?? 3306),
    );
}
