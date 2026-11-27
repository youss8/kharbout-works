# Laravel approval API

Run a small approval endpoint and verify what it writes when reviewers race or repeat an approval. The data and credentials are fictional. Use the seed credentials against this local application.

## Run the checks

Use PHP 8.4 or later with PDO SQLite enabled and Composer 2. Pest also needs the DOM, mbstring, XML and XMLWriter extensions. Run these commands from the extracted directory.

```sh
composer install
composer test
composer capture
```

`composer test` exercises actor authentication, branch and author restrictions, stale versions, simultaneous retries and rollback after a failed audit write. `composer capture` writes `traces/approval-api.json` from fresh Laravel HTTP responses and SQLite queries. The two reviewers can finish in either order. The capture records which process won and the test requires exactly one successful approval.

For the concurrent case, two separate PHP processes start their HTTP kernels and wait for the same signal. Both send version 1 against one database file. For the retry case, a second application instance reads the stored response from the same file. The captured browser replay treats the first response as lost to the client.

## Try the endpoint locally

```sh
php -r "file_exists('.env') || copy('.env.example', '.env');"
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan migrate --seed
php -S 127.0.0.1:8094 -t public public/index.php
```

From a second terminal in this directory, send version 1 as Samira. In Windows PowerShell, use `curl.exe`.

```sh
curl -i --json "@examples/approve.json" -H "Authorization: Bearer fixture-samira" -H "Idempotency-Key: local-demo-1" http://127.0.0.1:8094/api/requests/REQ-1042/approve
```

The result is `200` with `state: approved` and `version: 2`. Repeat that exact command to get the same body with `Idempotency-Replayed: true`. Then issue the command with `fixture-aaron` instead. His own key is independent, and his version 1 request returns `409 stale_version`. Use `php artisan migrate:fresh --seed` to reset the demo database.

The seed also includes `fixture-robin`, a reviewer from another branch, and `fixture-casey`, the request author. The server determines the actor from the fixture token. The request JSON supplies the expected version.

## Adapt the pattern

- `app/Http/AuthenticateFixtureActor.php` resolves the actor. Use your application's authenticator to supply the real actor, role and record scope.
- `app/ApproveRequest.php` reserves the actor's idempotency key and checks the request scope. The version predicate is part of the update, so two callers reading the same version cannot both apply the change.
- The same database transaction commits the state change, audit event and response receipt. After a lost response, a matching actor, key and payload recover the prior result. Decide how long your application needs to retain those receipts.
- `tests/ApprovalTest.php` asserts outcomes through the Laravel HTTP kernel and reads the resulting rows. Run these cases against the database engine you choose for your application.

Licensed under MIT. See `LICENSE`.
