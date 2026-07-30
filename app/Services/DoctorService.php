<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DoctorService
{
    public function listWithRelations()
    {
        return Doctor::query()->with(['user', 'specialty'])->orderBy('id')->get();
    }

    public function listWithUser()
    {
        return Doctor::query()->with('user')->orderBy('id')->get();
    }

    /**
     * @param  array{name: string, email: string, password: string, phone?: string|null, specialty_id: int, license_number: string}  $data
     */
    public function createDoctor(array $data): Doctor
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
            ]);

            $user->assignRole('doctor');

            return Doctor::query()->create([
                'user_id' => $user->id,
                'specialty_id' => $data['specialty_id'],
                'license_number' => $data['license_number'],
            ]);
        });
    }

    public function updateSlotDuration(Doctor $doctor, int $minutes): Doctor
    {
        return $this->updateAgendaSettings($doctor, $minutes);
    }

    /**
     * @param  list<array{weekday: int, start: string, end: string}>|null  $weeklyAvailability
     */
    public function updateAgendaSettings(
        Doctor $doctor,
        int $minutes,
        ?array $weeklyAvailability = null,
    ): Doctor {
        $attributes = [
            'slot_duration_minutes' => $minutes,
        ];

        if ($weeklyAvailability !== null) {
            $attributes['weekly_availability'] = array_values(array_map(
                fn (array $band): array => [
                    'weekday' => (int) $band['weekday'],
                    'start' => $band['start'],
                    'end' => $band['end'],
                ],
                $weeklyAvailability,
            ));
        }

        $doctor->update($attributes);

        return $doctor->refresh();
    }

    public function searchByName(?string $name = null, ?int $specialtyId = null): Collection
    {
        if ($specialtyId === null && ($name === null || $name === '')) {
            return new Collection;
        }

        return Doctor::query()
            ->with(['user', 'specialty'])
            ->when($specialtyId, fn ($query) => $query->where('specialty_id', $specialtyId))
            ->when($name, function ($query) use ($name) {
                $query->whereHas('user', function ($userQuery) use ($name) {
                    $userQuery->where('name', 'like', '%'.$name.'%');
                });
            })
            ->orderBy(
                User::query()
                    ->select('name')
                    ->whereColumn('users.id', 'doctors.user_id')
                    ->limit(1)
            )
            ->get();
    }

    /**
     * @param  array{name: string, email: string, password: string, phone?: string|null, role: string}  $data
     */
    public function createAdminUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
            ]);

            $user->assignRole($data['role']);

            return $user;
        });
    }
}
