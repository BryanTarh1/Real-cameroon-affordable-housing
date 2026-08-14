# AHC Local XAMPP Test Interface

This is a **local, read-only user-interface test package**. It is intentionally not a replacement for the full Node.js/React AHC application. It reads only the six (or later refreshed) records in the local `ahc_local_test.sanitized_listings` table produced by the protected snapshot importer.

## What is included

| File | Purpose |
|---|---|
| `index.html` | Responsive local test interface with filters, cost seals, and safe listing detail dialog |
| `styles.css` | Courtyard Atlas local-test visual system |
| `app.js` | Client-side local filtering and formatted property-detail view |
| `api/listings.php` | Reads only the local sanitised snapshot table |
| `api/bootstrap.php` | Loads a private config placed outside `htdocs` |

## Installation on Windows XAMPP

1. Copy the entire `site` directory to:
   ```text
   C:\xampp\htdocs\ahc-local-test
   ```
2. Create the private directory:
   ```text
   C:\xampp\private\ahc-local-test
   ```
3. Copy your working local config:
   ```text
   C:\ahc-local-sync\config.local.php
   ```
   into the private directory above. **Do not copy the config into `htdocs`.**
4. In the copied config, retain the working local MySQL settings:
   ```php
   'host' => '127.0.0.1',
   'port' => 3307,
   'database' => 'ahc_local_test',
   'username' => 'root',
   ```
   The temporary local-root fallback is permitted only while the broken local XAMPP privilege tables are rebuilt. It never connects to the production database.
5. Start **Apache** and **MySQL** in XAMPP.
6. Open:
   ```text
   http://localhost/ahc-local-test/
   ```

## Refreshing local data

The interface never downloads data directly. Refresh the local snapshot using the existing importer:

```bat
set AHC_LOCAL_TEST_CONFIG=C:\ahc-local-sync\config.local.php
C:\xampp\php\php.exe C:\ahc-local-sync\pull-sanitized-snapshot.php
```

The protected export allows one request every **60 seconds**. The local page reads the refreshed table automatically on its next load.

## Explicit local-test boundary

The package contains no Agent or owner identities, phone numbers, WhatsApp links, accounts, passwords, payment references, payment orders, tenancy records, field evidence, audits, private images, exact compound doors, or direct production database credentials. It cannot create, update, or delete a production record.
