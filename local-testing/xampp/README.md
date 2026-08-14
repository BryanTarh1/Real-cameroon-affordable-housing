# AHC local XAMPP pull setup

This folder receives a **sanitised marketplace snapshot only**. It does not connect XAMPP directly to the live cloud database and cannot write to production.

1. Create a local MySQL user limited to the `ahc_local_test` database and run `ahc-local-test-schema.sql` once in phpMyAdmin.
2. Copy `config.local.php.example` to a folder **outside** `C:\xampp\htdocs`, rename it `config.local.php`, and add the export token supplied through the protected project settings.
3. Set the Windows environment variable `AHC_LOCAL_TEST_CONFIG` to that configuration file’s full path.
4. Run `C:\xampp\php\php.exe pull-sanitized-snapshot.php` from this directory. Do not run it through a public browser URL.
5. Only after a successful manual pull should you schedule the same local command. A failed pull does not alter the prior local data because the import is transactional.

The export excludes credentials, passwords, login state, payment references, contact details, exact locations, private evidence, commissions, reports, and audit records.
