-- Affordable Housing Cameroon (AHC) local database bootstrap
--
-- Run from the project root after creating the MySQL account described in
-- LOCAL_SETUP.md. This file deliberately loads the versioned Drizzle
-- migrations rather than duplicating schema statements. It creates an empty
-- local application database; run `node scripts/seed-temporary-demo.mjs`
-- afterwards only if you want the clearly labelled non-production demo data.
--
-- Command example:
--   mysql -u ahc_user -p < database/ahc_local_bootstrap.sql

CREATE DATABASE IF NOT EXISTS ahc_local
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE ahc_local;

SOURCE drizzle/0000_mature_captain_britain.sql;
SOURCE drizzle/0001_outstanding_hercules.sql;
SOURCE drizzle/0002_sloppy_pixie.sql;
SOURCE drizzle/0003_lush_ultimo.sql;
SOURCE drizzle/0004_lumpy_malcolm_colcord.sql;
SOURCE drizzle/0005_complex_echo.sql;
SOURCE drizzle/0006_long_freak.sql;
SOURCE drizzle/0007_flawless_scrambler.sql;
SOURCE drizzle/0008_flat_obadiah_stane.sql;
SOURCE drizzle/0009_sturdy_rictor.sql;
SOURCE drizzle/0010_sticky_jetstream.sql;
SOURCE drizzle/0011_loose_phantom_reporter.sql;
SOURCE drizzle/0012_loving_patch.sql;
SOURCE drizzle/0013_dusty_pandemic.sql;
SOURCE drizzle/0014_productive_firelord.sql;
