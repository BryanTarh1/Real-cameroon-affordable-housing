# AHC local XAMPP pull setup

This folder receives a **sanitised marketplace snapshot only**. It does not connect XAMPP directly to the live cloud database and cannot write to production.

1. Run `ahc-local-test-schema.sql` once in phpMyAdmin to create the separate local `ahc_local_test` database.
2. Prefer a local MySQL user limited to that database. If a local XAMPP/MariaDB system-table problem prevents that account from being granted, the existing local `root` account may be used **temporarily only** for `ahc_local_test`, provided `config.local.php` stays outside `C:\xampp\htdocs` and is never shared. Rebuild the local privilege tables before using the machine for any broader local work.
3. Copy `config.local.php.example` to a folder **outside** `C:\xampp\htdocs`, rename it `config.local.php`, and add the snapshot token supplied through protected project settings. Keep the local port aligned with XAMPP (for example, `3307` if shown in the XAMPP Control Panel).
4. In Command Prompt, set the configuration path and run the importer:
   ```bat
   set AHC_LOCAL_TEST_CONFIG=C:\ahc-local-sync\config.local.php
   C:\xampp\php\php.exe C:\ahc-local-sync\pull-sanitized-snapshot.php
   ```
   Do not run the importer through a public browser URL.
5. Wait at least 60 seconds between successful snapshot requests. Only after a successful manual pull should you schedule the same local command. A failed pull does not alter the prior local data because the import is transactional.

The export excludes credentials, passwords, login state, payment references, contact details, exact locations, private evidence, commissions, reports, and audit records.
