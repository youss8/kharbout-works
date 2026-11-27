<?php

declare(strict_types=1);

use ApprovalApiTests\Support\Fixture;

it('validates the actor on the server and enforces branch scope and separation of duties', function (): void {
    $app = Fixture::app(':memory:');

    expect(Fixture::approve($app, null, 'request-a')['status'])->toBe(401)
        ->and(Fixture::approve($app, 'fake-token', 'request-a')['status'])->toBe(401)
        ->and(Fixture::approve($app, 'fixture-casey', 'request-a', extra: ['role' => 'reviewer'])['status'])->toBe(403)
        ->and(Fixture::approve($app, 'fixture-robin', 'request-a', extra: ['branch' => 'north'])['status'])->toBe(404)
        ->and(Fixture::approve($app, 'fixture-samira', 'request-a', reference: 'REQ-1043')['status'])->toBe(403)
        ->and(Fixture::approve($app, 'fixture-samira', '', 1)['status'])->toBe(422)
        ->and(Fixture::approve($app, 'fixture-samira', 'request-a', 0)['status'])->toBe(422)
        ->and(Fixture::snapshot($app))->toMatchArray(['state' => 'in_review', 'version' => 1, 'auditEventCount' => 0, 'receiptCount' => 0]);
});

it('accepts only one of two independent reviewers with the same version', function (): void {
    $race = Fixture::race(keys: ['same-key', 'same-key']);
    $responses = array_column($race['responses'], null, 'status');

    expect($responses)->toHaveKeys([200, 409])
        ->and($responses[200])->toBe([
            'status' => 200,
            'body' => ['reference' => 'REQ-1042', 'state' => 'approved', 'version' => 2],
            'replayed' => false,
        ])
        ->and($responses[409])->toBe([
            'status' => 409,
            'body' => ['error' => 'stale_version', 'reference' => 'REQ-1042', 'state' => 'approved', 'version' => 2],
            'replayed' => false,
        ])
        ->and($race['after'])->toMatchArray(['state' => 'approved', 'version' => 2, 'auditEventCount' => 1, 'receiptCount' => 2])
        ->and($race['after']['events'][0]['actor'])->toBe($race['responses'][0]['status'] === 200 ? 'Samira Noor' : 'Aaron Lin');
});

it('returns the stored result after a lost response even though the original version is stale', function (): void {
    $retry = Fixture::retry();

    expect($retry['first']['status'])->toBe(200)
        ->and($retry['first']['replayed'])->toBeFalse()
        ->and($retry['second'])->toBe(array_replace($retry['first'], ['replayed' => true]))
        ->and($retry['committed'])->toBe($retry['after'])
        ->and($retry['after'])->toMatchArray(['state' => 'approved', 'version' => 2, 'auditEventCount' => 1, 'receiptCount' => 1]);
});

it('rejects reusing an actor’s key for a different request fingerprint', function (): void {
    $app = Fixture::app(':memory:');

    expect(Fixture::approve($app, 'fixture-samira', 'request-a')['status'])->toBe(200)
        ->and(Fixture::approve($app, 'fixture-samira', 'request-a', 2)['body'])->toBe(['error' => 'idempotency_conflict'])
        ->and(Fixture::snapshot($app))->toMatchArray(['state' => 'approved', 'version' => 2, 'auditEventCount' => 1, 'receiptCount' => 1]);
});

it('rechecks current branch scope before replaying a receipt', function (): void {
    $app = Fixture::app(':memory:');

    expect(Fixture::approve($app, 'fixture-samira', 'request-a')['status'])->toBe(200);
    $app['db']->table('approval_actors')->where('id', 2)->update(['branch' => 'south']);

    expect(Fixture::approve($app, 'fixture-samira', 'request-a')['status'])->toBe(404)
        ->and(Fixture::snapshot($app))->toMatchArray(['state' => 'approved', 'version' => 2, 'auditEventCount' => 1, 'receiptCount' => 1]);
});

it('serializes simultaneous retries of one actor and key into a single effect', function (): void {
    $race = Fixture::race(reviewers: ['fixture-samira', 'fixture-samira'], keys: ['retry-key', 'retry-key']);
    $responses = array_column($race['responses'], null, 'replayed');

    expect($responses[0]['body'])->toBe($responses[1]['body'])
        ->and(array_column($race['responses'], 'status'))->toBe([200, 200])
        ->and($race['after'])->toMatchArray(['state' => 'approved', 'version' => 2, 'auditEventCount' => 1, 'receiptCount' => 1]);
});

it('rolls back the request and the reserved key if the audit write fails', function (): void {
    $app = Fixture::app(':memory:');
    $app['db']->statement("CREATE TRIGGER demo_audit_failure BEFORE INSERT ON approval_events BEGIN SELECT RAISE(ABORT, 'fixture failure'); END");

    expect(Fixture::approve($app, 'fixture-samira', 'request-a')['status'])->toBe(500)
        ->and(Fixture::snapshot($app))->toMatchArray(['state' => 'in_review', 'version' => 1, 'auditEventCount' => 0, 'receiptCount' => 0]);

    $app['db']->statement('DROP TRIGGER demo_audit_failure');

    expect(Fixture::approve($app, 'fixture-samira', 'request-a')['status'])->toBe(200)
        ->and(Fixture::snapshot($app))->toMatchArray(['state' => 'approved', 'version' => 2, 'auditEventCount' => 1, 'receiptCount' => 1]);
});
