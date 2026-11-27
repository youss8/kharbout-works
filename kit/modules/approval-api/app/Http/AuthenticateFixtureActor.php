<?php

declare(strict_types=1);

namespace ApprovalApi\Http;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateFixtureActor
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->headers->has('Authorization') ? $request->bearerToken() : null;
        $actor = $token === null || strlen($token) > 128
            ? null
            : DB::table('approval_actors')->where('token_hash', hash('sha256', $token))->first();

        if ($actor === null) {
            return response()->json(['error' => 'unauthenticated'], 401, ['WWW-Authenticate' => 'Bearer']);
        }

        $request->attributes->set('approval_actor', $actor);

        return $next($request);
    }
}
