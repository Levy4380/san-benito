<?php

namespace App\Support;

use App\Models\Professional;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class ProfessionalCatalogReturn
{
    public static function to(Request $request, Professional $professional, string $message): RedirectResponse
    {
        $profile = route('admin.professionals.show', $professional);
        $referer = $request->headers->get('referer');
        $catalog = url('/admin/profesionales');
        $target = $profile;

        if (is_string($referer) && str_starts_with($referer, $catalog)) {
            $path = parse_url($referer, PHP_URL_PATH);

            if ($path === '/admin/profesionales') {
                $target = $referer;
            }
        }

        return redirect()->to($target)->with('toast', [
            'message' => $message,
            'variant' => 'ok',
        ]);
    }
}
