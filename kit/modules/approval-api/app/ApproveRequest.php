<?php

declare(strict_types=1);

namespace ApprovalApi;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use stdClass;

final class ApproveRequest
{
    public function run(stdClass $actor, string $reference, int $expectedVersion, string $key): JsonResponse
    {
        abort_unless($actor->role === 'reviewer', 403, 'A reviewer is required.');

        $fingerprint = hash('sha256', json_encode(['approve', $reference, $expectedVersion], JSON_THROW_ON_ERROR));

        return DB::transaction(function () use ($actor, $reference, $expectedVersion, $key, $fingerprint): JsonResponse {
            // Reserve the key before reading request state so concurrent SQLite writes can queue behind this transaction.
            $receipts = DB::table('approval_receipts')->where('actor_id', $actor->id)->where('key', $key);
            $reserved = DB::table('approval_receipts')->insertOrIgnore([
                'actor_id' => $actor->id,
                'key' => $key,
                'fingerprint' => $fingerprint,
            ]);

            $request = DB::table('approval_requests')
                ->where('reference', $reference)
                ->where('branch', $actor->branch)
                ->first();
            abort_if($request === null, 404, 'Request was not found.');
            abort_if((int) $request->author_id === (int) $actor->id, 403, 'The author cannot approve this request.');

            if ($reserved === 0) {
                $receipt = $receipts->firstOrFail();

                if (! hash_equals($receipt->fingerprint, $fingerprint)) {
                    return response()->json(['error' => 'idempotency_conflict'], 409);
                }

                return response()->json(
                    json_decode($receipt->response, true, 512, JSON_THROW_ON_ERROR),
                    (int) $receipt->status,
                    ['Idempotency-Replayed' => 'true'],
                );
            }

            $updated = DB::table('approval_requests')
                ->where('id', $request->id)
                ->where('state', 'in_review')
                ->where('version', $expectedVersion)
                ->update(['state' => 'approved', 'version' => $expectedVersion + 1]);

            if ($updated === 1) {
                DB::table('approval_events')->insert([
                    'request_id' => $request->id,
                    'actor_id' => $actor->id,
                    'type' => 'approved',
                    'from_version' => $expectedVersion,
                    'to_version' => $expectedVersion + 1,
                ]);

                $status = 200;
                $body = ['reference' => $reference, 'state' => 'approved', 'version' => $expectedVersion + 1];
            } else {
                $status = 409;
                $body = [
                    'error' => $expectedVersion !== (int) $request->version ? 'stale_version' : 'invalid_state',
                    'reference' => $reference,
                    'state' => $request->state,
                    'version' => (int) $request->version,
                ];
            }

            $receipts->update(['status' => $status, 'response' => json_encode($body, JSON_THROW_ON_ERROR)]);

            return response()->json($body, $status);
        });
    }
}
