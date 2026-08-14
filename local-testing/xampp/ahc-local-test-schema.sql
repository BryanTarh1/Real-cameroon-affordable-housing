CREATE DATABASE IF NOT EXISTS ahc_local_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ahc_local_test;

CREATE TABLE IF NOT EXISTS sanitized_listings (
  listing_id VARCHAR(32) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  neighborhood VARCHAR(100) NOT NULL,
  landmark VARCHAR(500) NOT NULL,
  property_type VARCHAR(80) NOT NULL,
  bedrooms INT NULL,
  household_fit VARCHAR(255) NULL,
  available_from DATETIME NOT NULL,
  last_reconfirmed DATETIME NOT NULL,
  approximate_latitude DECIMAL(10,7) NOT NULL,
  approximate_longitude DECIMAL(10,7) NOT NULL,
  map_radius_m INT NOT NULL,
  is_featured TINYINT(1) NOT NULL,
  verification_status VARCHAR(64) NOT NULL,
  photos_count INT NOT NULL,
  has_published_walkthrough TINYINT(1) NOT NULL,
  neighborhood_essentials_json JSON NULL,
  trust_json JSON NULL,
  costs_json JSON NOT NULL,
  snapshot_generated_at DATETIME NOT NULL
);
