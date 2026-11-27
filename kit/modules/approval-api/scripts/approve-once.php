<?php

declare(strict_types=1);

use ApprovalApiTests\Support\Fixture;

require __DIR__.'/../vendor/autoload.php';

[, $database, $directory, $worker, $token, $key, $version] = $argv;
$app = Fixture::app($database, seed: false);
touch($directory.DIRECTORY_SEPARATOR.$worker.'.ready');

$deadline = microtime(true) + 12;
while (! is_file($directory.DIRECTORY_SEPARATOR.'go')) {
    if (microtime(true) > $deadline) {
        throw new RuntimeException('The approval start barrier timed out.');
    }

    usleep(10000);
}

echo json_encode(Fixture::approve($app, $token, $key, (int) $version), JSON_THROW_ON_ERROR);
