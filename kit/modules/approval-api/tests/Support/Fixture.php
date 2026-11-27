<?php

declare(strict_types=1);

namespace ApprovalApiTests\Support;

use Illuminate\Contracts\Console\Kernel as ConsoleKernel;
use Illuminate\Contracts\Http\Kernel as HttpKernel;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Bootstrap\HandleExceptions;
use Illuminate\Http\Request;
use RuntimeException;
use Symfony\Component\Process\Process;

final class Fixture
{
    public static function app(string $database, bool $seed = true): Application
    {
        $app = require __DIR__.'/../../bootstrap/app.php';
        $app->loadEnvironmentFrom('.env.example');
        $app->afterBootstrapping(HandleExceptions::class, static function (): void {
            restore_error_handler();
            restore_exception_handler();
        });
        $artisan = $app->make(ConsoleKernel::class);
        $artisan->bootstrap();
        $app['config']->set('database.connections.sqlite.database', $database);

        if ($seed && $artisan->call('migrate', ['--seed' => true, '--force' => true]) !== 0) {
            throw new RuntimeException($artisan->output());
        }

        return $app;
    }

    public static function approve(
        Application $app,
        ?string $token,
        string $key,
        int $version = 1,
        string $reference = 'REQ-1042',
        array $extra = [],
    ): array {
        $headers = [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_ACCEPT' => 'application/json',
            'HTTP_IDEMPOTENCY_KEY' => $key,
        ];
        if ($token !== null) {
            $headers['HTTP_AUTHORIZATION'] = "Bearer {$token}";
        }

        $request = Request::create(
            "/api/requests/{$reference}/approve",
            'POST',
            server: $headers,
            content: json_encode(['expectedVersion' => $version] + $extra, JSON_THROW_ON_ERROR),
        );
        $kernel = $app->make(HttpKernel::class);
        $response = $kernel->handle($request);
        $kernel->terminate($request, $response);

        return [
            'status' => $response->getStatusCode(),
            'body' => json_decode($response->getContent(), true, 512, JSON_THROW_ON_ERROR),
            'replayed' => $response->headers->get('Idempotency-Replayed') === 'true',
        ];
    }

    public static function snapshot(Application $app, string $reference = 'REQ-1042'): array
    {
        $db = $app['db'];
        $request = $db->table('approval_requests')->where('reference', $reference)->first();
        $events = $db->table('approval_events')
            ->join('approval_actors', 'approval_actors.id', '=', 'approval_events.actor_id')
            ->where('approval_events.request_id', $request->id)
            ->orderBy('approval_events.id')
            ->get(['approval_actors.name as actor', 'type', 'from_version as fromVersion', 'to_version as toVersion'])
            ->all();

        return [
            'reference' => $reference,
            'state' => $request->state,
            'version' => (int) $request->version,
            'approvalCount' => count(array_filter($events, fn (object $event): bool => $event->type === 'approved')),
            'auditEventCount' => count($events),
            'events' => array_map(fn (object $event): array => (array) $event, $events),
            'receiptCount' => $db->table('approval_receipts')->count(),
        ];
    }

    public static function retry(): array
    {
        $database = tempnam(sys_get_temp_dir(), 'approval-retry-');
        if ($database === false) {
            throw new RuntimeException('Could not create the approval retry database.');
        }

        $app = null;
        try {
            $app = self::app($database);
            $before = self::snapshot($app);
            $first = self::approve($app, 'fixture-samira', 'retry-key');
            $committed = self::snapshot($app);
            $app['db']->disconnect();

            $app = self::app($database, seed: false);
            $second = self::approve($app, 'fixture-samira', 'retry-key');

            return [
                'before' => $before,
                'first' => $first,
                'committed' => $committed,
                'second' => $second,
                'after' => self::snapshot($app),
            ];
        } finally {
            $app?->make('db')->disconnect();
            unlink($database);
        }
    }

    public static function race(array $reviewers = ['fixture-samira', 'fixture-aaron'], array $keys = ['review-a', 'review-b']): array
    {
        $directory = sys_get_temp_dir().DIRECTORY_SEPARATOR.'approval-api-'.bin2hex(random_bytes(12));
        if (! mkdir($directory, 0700)) {
            throw new RuntimeException('Could not create the approval test directory.');
        }

        $database = $directory.DIRECTORY_SEPARATOR.'approval.sqlite';
        touch($database);
        $workers = [];
        $app = null;

        try {
            $app = self::app($database);
            $before = self::snapshot($app);
            $app['db']->disconnect();

            foreach (['a', 'b'] as $index => $workerId) {
                $worker = new Process([
                    PHP_BINARY, __DIR__.'/../../scripts/approve-once.php', $database, $directory,
                    $workerId, $reviewers[$index], $keys[$index], (string) $before['version'],
                ]);
                $worker->setTimeout(15);
                $worker->start();
                $workers[] = $worker;
            }

            $deadline = microtime(true) + 10;
            $readyA = $directory.DIRECTORY_SEPARATOR.'a.ready';
            $readyB = $directory.DIRECTORY_SEPARATOR.'b.ready';

            while (! is_file($readyA) || ! is_file($readyB)) {
                if (microtime(true) > $deadline || ! $workers[0]->isRunning() || ! $workers[1]->isRunning()) {
                    throw new RuntimeException('Review workers failed at the start barrier: '.$workers[0]->getErrorOutput().$workers[1]->getErrorOutput());
                }

                usleep(10000);
            }

            touch($directory.DIRECTORY_SEPARATOR.'go');
            $responses = [];
            foreach ($workers as $worker) {
                if ($worker->wait() !== 0) {
                    throw new RuntimeException('Approval worker failed: '.$worker->getErrorOutput());
                }

                $responses[] = json_decode($worker->getOutput(), true, 512, JSON_THROW_ON_ERROR);
            }

            return ['before' => $before, 'responses' => $responses, 'after' => self::snapshot($app)];
        } finally {
            foreach ($workers as $worker) {
                if ($worker->isRunning()) {
                    $worker->stop(0);
                }
            }

            $app?->make('db')->disconnect();
            foreach (['approval.sqlite', 'approval.sqlite-journal', 'a.ready', 'b.ready', 'go'] as $name) {
                $path = $directory.DIRECTORY_SEPARATOR.$name;
                if (is_file($path)) {
                    unlink($path);
                }
            }
            rmdir($directory);
        }
    }
}
