<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventStalePageCache
{
    public const COOKIE = 'sb_uid';

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('Cache-Control', 'no-store, private');
        $response->headers->setCookie(cookie(
            self::COOKIE,
            (string) ($request->user()?->id ?? '0'),
            0,
            '/',
            null,
            $request->isSecure(),
            false,
            false,
            'lax',
        ));

        return $response;
    }
}
