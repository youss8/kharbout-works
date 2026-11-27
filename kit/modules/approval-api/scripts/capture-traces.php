<?php

declare(strict_types=1);

use ApprovalApiTests\Support\Fixture;
use Illuminate\Foundation\Application;

require __DIR__.'/../vendor/autoload.php';

function source(string $file, string $fragment): array
{
    foreach (file(__DIR__.'/../'.$file, FILE_IGNORE_NEW_LINES) as $index => $line) {
        if (str_contains($line, $fragment)) {
            return ['path' => 'kit/modules/approval-api/'.$file, 'line' => $index + 1];
        }
    }

    throw new RuntimeException("Could not find trace source in {$file}: {$fragment}");
}

function step(string $id, string $title, string $detail, array $source, array $data): array
{
    return compact('id', 'title', 'detail', 'source', 'data');
}

$race = Fixture::race(keys: ['shared-example-key', 'shared-example-key']);
$retry = Fixture::retry();
$statuses = array_column($race['responses'], 'status');
sort($statuses);

if ($statuses !== [200, 409] || $race['after']['auditEventCount'] !== 1
    || $retry['first']['status'] !== 200 || $retry['second'] !== array_replace($retry['first'], ['replayed' => true])
    || $retry['committed'] !== $retry['after'] || $retry['after']['auditEventCount'] !== 1
) {
    throw new RuntimeException('The API observations did not match the approval trace contract.');
}

$reviewers = ['Samira Noor', 'Aaron Lin'];
$winningIndex = array_search(200, array_column($race['responses'], 'status'), true);
$staleIndex = 1 - $winningIndex;
$action = 'app/ApproveRequest.php';
$auth = 'app/Http/AuthenticateFixtureActor.php';
$testFile = 'tests/ApprovalTest.php';
$path = '/api/requests/REQ-1042/approve';

$scenarios = [
    [
        'id' => 'concurrent-approval',
        'title' => 'Two reviewers, one approval',
        'description' => 'Two PHP processes send the same observed version to independent Laravel HTTP kernels and share one SQLite database.',
        'steps' => [
            step('open', 'Both reviewers see version 1', 'Each process starts from the same request version. The browser view is replaying a recorded run.',
                source('tests/Support/Fixture.php', 'public static function race('), $race['before']),
            step('send', 'Send both approval requests', 'The two processes wait at a shared start barrier and then submit independently. Their equal key strings belong to different authenticated actors.',
                source('scripts/approve-once.php', 'echo json_encode'), [
                    'method' => 'POST', 'path' => $path, 'actors' => $reviewers,
                    'idempotencyKey' => 'shared-example-key', 'body' => ['expectedVersion' => $race['before']['version']],
                ]),
            step('authorize', 'Resolve identity on the server', 'Laravel looks up each actor from the bearer token. The approval action requires a reviewer in the request branch and checks that the actor did not author the request.',
                source($auth, "where('token_hash'"), ['role' => 'reviewer', 'branch' => 'north', 'author' => 'Casey Reed']),
            step('commit', 'One update matches version 1', 'The winner updates the request and writes the approval event and response receipt in the same database transaction.',
                source($action, "->where('version',"), ['actor' => $reviewers[$winningIndex]] + $race['responses'][$winningIndex]),
            step('conflict', 'The other request sees version 2', 'The second update cannot match the version predicate. The response reports the current version and the request remains approved.',
                source($action, "'stale_version'"), ['actor' => $reviewers[$staleIndex]] + $race['responses'][$staleIndex]),
            step('verify', 'Verify the durable result', 'The test reads the request and its audit records from the database after both processes finish.',
                source($testFile, 'accepts only one of two independent reviewers'), $race['after']),
        ],
        'result' => $race['after'],
    ],
    [
        'id' => 'lost-response-retry',
        'title' => 'A lost response, one approval',
        'description' => 'The first call commits. A second Laravel application instance retries against the same database with the same actor, key and payload.',
        'steps' => [
            step('open', 'The reviewer sees version 1', 'The retried request carries that same observed version, even after the first approval commits.',
                source('tests/Support/Fixture.php', '$first = self::approve('), $retry['before']),
            step('send', 'Submit the first request', 'The caller identifies this operation with an idempotency key. The server derives the actor from the bearer token.',
                source('app/Http/ApproveRequestController.php', "header('Idempotency-Key')"), [
                    'method' => 'POST', 'path' => $path, 'actor' => 'Samira Noor', 'idempotencyKey' => 'retry-key',
                    'body' => ['expectedVersion' => $retry['before']['version']],
                ]),
            step('commit', 'The database commits before the response is lost', 'The test captures the first response after commit. The replay treats that response as lost to the client.',
                source($action, '$receipts->update('), $retry['first']),
            step('retry', 'Retry with the same actor and key', 'The matching actor, key and request fingerprint yield the stored response. The replay header identifies the reuse.',
                source($action, "'Idempotency-Replayed'"), $retry['second']),
            step('verify', 'Verify one approval and one audit event', 'The durable state and event count are identical before and after the retry.',
                source($testFile, 'returns the stored result after a lost response'), $retry['after']),
        ],
        'result' => $retry['after'],
    ],
];

$trace = [
    'schemaVersion' => 1,
    'runtime' => ['php' => PHP_VERSION, 'laravel' => Application::VERSION, 'database' => 'SQLite'],
    'scenarios' => $scenarios,
];

$directory = __DIR__.'/../traces';
if (! is_dir($directory) && ! mkdir($directory)) {
    throw new RuntimeException('Could not create the trace directory.');
}

if (file_put_contents($directory.'/approval-api.json', json_encode($trace, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)."\n") === false) {
    throw new RuntimeException('Could not write the approval trace.');
}

echo "Recorded {$race['after']['auditEventCount']} approval audit event after the race and {$retry['after']['auditEventCount']} after the retry.\n";
