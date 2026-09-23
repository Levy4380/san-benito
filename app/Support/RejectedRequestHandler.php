<?php

namespace App\Support;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class RejectedRequestHandler
{
    public function handle(Response $response, Throwable $e, Request $request): Response
    {
        if (! $this->isRejection($e, $response)) {
            return $response;
        }

        $status = $this->status($e, $response);
        $message = $this->message($e, $status);

        Log::warning('Pedido rechazado: '.$message, [
            'status' => $status,
            'type' => $e::class,
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'user_id' => $request->user()?->id,
            'errors' => $e instanceof ValidationException ? $e->errors() : null,
        ]);

        if ($status === 403 && $this->shouldRedirectHome($request)) {
            return redirect()
                ->to(RoleRedirector::home(), 303)
                ->header('Cache-Control', 'no-store, private');
        }

        if ($this->shouldToast($e, $status) && $response instanceof RedirectResponse) {
            $response->with('toast', [
                'message' => $message,
                'variant' => 'warn',
            ]);
        }

        return $response;
    }

    private function isRejection(Throwable $e, Response $response): bool
    {
        if ($e instanceof ValidationException || $e instanceof AuthenticationException) {
            return true;
        }

        if ($e instanceof HttpExceptionInterface && $e->getStatusCode() < 500) {
            return true;
        }

        $status = $response->getStatusCode();

        return $status >= 400 && $status < 500;
    }

    private function shouldToast(Throwable $e, int $status): bool
    {
        if ($e instanceof ValidationException) {
            return true;
        }

        return $status >= 400 && $status < 500 && $status !== 403 && $status !== 404;
    }

    private function shouldRedirectHome(Request $request): bool
    {
        $user = $request->user();

        if ($user === null || $request->expectsJson()) {
            return false;
        }

        return trim($request->path(), '/') !== trim(RoleRedirector::landing($user), '/');
    }

    private function status(Throwable $e, Response $response): int
    {
        if ($e instanceof ValidationException) {
            return $e->status;
        }

        if ($e instanceof HttpExceptionInterface) {
            return $e->getStatusCode();
        }

        if ($e instanceof AuthenticationException) {
            return 401;
        }

        return $response->getStatusCode();
    }

    private function message(Throwable $e, int $status): string
    {
        if ($e instanceof ValidationException) {
            $errors = collect($e->errors())->flatten()->filter()->implode(' ');

            if ($errors !== '') {
                return $errors;
            }
        }

        $text = trim($e->getMessage());

        return $text !== '' ? $text : "Pedido rechazado ({$status}).";
    }
}
