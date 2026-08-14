<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');

try {
    $connection = localTestConnection($config);
    $connection->set_charset('utf8mb4');
    $result = $connection->query(
        'SELECT listing_id, title, city, neighborhood, landmark, property_type, bedrooms, household_fit, available_from, last_reconfirmed, approximate_latitude, approximate_longitude, map_radius_m, is_featured, verification_status, photos_count, has_published_walkthrough, neighborhood_essentials_json, trust_json, costs_json, snapshot_generated_at FROM sanitized_listings ORDER BY is_featured DESC, last_reconfirmed DESC, listing_id ASC'
    );
    $listings = [];
    $latest = null;
    while ($row = $result->fetch_assoc()) {
        $latest = $latest === null || $row['snapshot_generated_at'] > $latest ? $row['snapshot_generated_at'] : $latest;
        $listings[] = $row;
    }
    echo json_encode(['classification' => 'sanitized-local-testing-only', 'snapshot' => ['generated_at' => $latest], 'listings' => $listings], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
} catch (Throwable $exception) {
    http_response_code(500);
    echo json_encode(['error' => 'Local snapshot database is unavailable.']);
}
