<?php

declare(strict_types=1);

namespace ApprovalApi\Http;

use ApprovalApi\ApproveRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class ApproveRequestController
{
    public function __invoke(Request $request, string $reference, ApproveRequest $approve): JsonResponse
    {
        $validated = $request->validate(['expectedVersion' => ['required', 'integer', 'between:1,2147483646']]);
        $key = $request->header('Idempotency-Key');

        if (! is_string($key) || ! preg_match('/\A[A-Za-z0-9._-]{1,128}\z/', $key)) {
            throw ValidationException::withMessages(['idempotencyKey' => 'A valid Idempotency-Key header is required.']);
        }

        $actor = $request->attributes->get('approval_actor');

        return $approve->run($actor, $reference, (int) $validated['expectedVersion'], $key);
    }
}
