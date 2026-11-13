<?php

namespace App\Http\Middleware;

use App\Enums\Permission;
use App\Models\User;
use App\Services\AdminSurgeryService;
use App\Services\ClinicScheduleService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user === null ? null : [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'roles' => $user->getRoleNames()->values()->all(),
                    'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
                ],
            ],
            'flash' => [
                'toast' => $request->session()->get('toast'),
            ],
            'surgeryNavCounts' => $this->surgeryNavCounts($user),
            'clinic' => app(ClinicScheduleService::class)->share(),
        ];
    }

    /**
     * Staff catalog.view → global counts. Own view → scoped to the actor's professional.
     * Staff wins if both (should not happen). Patient / no perm → null.
     *
     * @return array{pending: int, requested: int, approved: int, history: int}|null
     */
    private function surgeryNavCounts(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        $surgeries = app(AdminSurgeryService::class);

        if (Permission::SurgeriesCatalogView->allows($user)) {
            return $surgeries->counts();
        }

        if (! Permission::OwnSurgeriesView->allows($user)) {
            return null;
        }

        $professionalId = $user->professional?->id;

        return $professionalId === null
            ? ['pending' => 0, 'requested' => 0, 'approved' => 0, 'history' => 0]
            : $surgeries->counts($professionalId);
    }
}
