<?php
declare(strict_types=1);

/**
 * Run from the command line, not a browser:
 *   C:\xampp\php\php.exe pull-sanitized-snapshot.php
 *
 * Set AHC_LOCAL_TEST_CONFIG to a config.local.php path outside htdocs.
 * This script only opens a local MySQL connection and never contains or uses
 * production database credentials.
 */

$configPath = getenv('AHC_LOCAL_TEST_CONFIG');
if (!$configPath || !is_file($configPath)) {
    fwrite(STDERR, "Set AHC_LOCAL_TEST_CONFIG to config.local.php outside htdocs.\n");
    exit(1);
}
$config = require $configPath;

if (!extension_loaded('curl') || !extension_loaded('mysqli')) {
    fwrite(STDERR, "Enable PHP curl and mysqli in XAMPP before running this script.\n");
    exit(1);
}

$curl = curl_init($config['export_url']);
curl_setopt_array($curl, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_HTTPHEADER => [
        'Accept: application/json',
        'Authorization: Bearer ' . $config['bearer_token'],
    ],
]);
$body = curl_exec($curl);
$status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
$error = curl_error($curl);
curl_close($curl);

if ($body === false || $status !== 200) {
    fwrite(STDERR, "Snapshot download failed (HTTP {$status}): {$error}\n");
    exit(1);
}

$snapshot = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
if (($snapshot['schemaVersion'] ?? null) !== 1 || ($snapshot['classification'] ?? '') !== 'sanitized-local-testing-only' || !isset($snapshot['listings']) || !is_array($snapshot['listings'])) {
    fwrite(STDERR, "Unexpected or unsafe snapshot format. Nothing was imported.\n");
    exit(1);
}

$mysql = $config['mysql'];
$db = new mysqli($mysql['host'], $mysql['username'], $mysql['password'], $mysql['database'], (int) $mysql['port']);
if ($db->connect_errno) {
    fwrite(STDERR, "Local MySQL connection failed: {$db->connect_error}\n");
    exit(1);
}
$db->set_charset('utf8mb4');
$db->begin_transaction();

try {
    $db->query('DELETE FROM sanitized_listings');
    $statement = $db->prepare(
        'INSERT INTO sanitized_listings (listing_id, title, city, neighborhood, landmark, property_type, bedrooms, household_fit, available_from, last_reconfirmed, approximate_latitude, approximate_longitude, map_radius_m, is_featured, verification_status, photos_count, has_published_walkthrough, neighborhood_essentials_json, trust_json, costs_json, snapshot_generated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    foreach ($snapshot['listings'] as $listing) {
        $map = $listing['approximateMap'];
        $essentials = json_encode($listing['neighborhoodEssentials'], JSON_THROW_ON_ERROR);
        $trust = json_encode($listing['trust'], JSON_THROW_ON_ERROR);
        $costs = json_encode($listing['costs'], JSON_THROW_ON_ERROR);
        $generatedAt = $snapshot['generatedAt'];
        $statement->bind_param(
            'ssssssisssddiisiissss',
            $listing['id'], $listing['title'], $listing['city'], $listing['neighborhood'], $listing['landmark'], $listing['propertyType'],
            $listing['bedrooms'], $listing['householdFit'], $listing['availableFrom'], $listing['lastReconfirmed'],
            $map['latitude'], $map['longitude'], $map['radiusM'], $listing['featured'], $listing['verificationStatus'],
            $listing['photosCount'], $listing['hasPublishedWalkthrough'], $essentials, $trust, $costs, $generatedAt,
        );
        $statement->execute();
    }
    $db->commit();
    echo 'Imported ' . count($snapshot['listings']) . " sanitised listing(s) generated at {$snapshot['generatedAt']}.\n";
} catch (Throwable $exception) {
    $db->rollback();
    fwrite(STDERR, "Local import rolled back: {$exception->getMessage()}\n");
    exit(1);
}
