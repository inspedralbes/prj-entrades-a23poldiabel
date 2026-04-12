<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CorsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $origins = array_filter(array_map('trim', explode(',', (string) env('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173'))));
        $origin = (string) $request->headers->get('Origin', '');

        $allowOrigin = in_array($origin, $origins, true) ? $origin : ($origins[0] ?? '*');

        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 204);
        } else {
            $response = $next($request);
        }

        $response->headers->set('Access-Control-Allow-Origin', $allowOrigin);
        $response->headers->set('Vary', 'Origin');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Requested-With, Accept, Origin');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

        return $response;
    }
}
