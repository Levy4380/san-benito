<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class PatientService
{
    /**
     * @param  array{name: string, email: string, password: string, dni: string, birth_date: string, phone?: string|null, health_insurance_id?: int|null}  $data
     */
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => Hash::make($data['password']),
            ]);

            $patient = Patient::query()->create([
                'user_id' => $user->id,
                'dni' => $data['dni'],
                'birth_date' => $data['birth_date'],
            ]);

            $healthInsuranceId = $data['health_insurance_id'] ?? null;

            if ($healthInsuranceId !== null) {
                $patient->healthInsurances()->sync([(int) $healthInsuranceId]);
            }

            $user->assignRole('patient');

            return $user;
        });
    }

    public function syncHealthInsurance(Patient $patient, ?int $healthInsuranceId): Patient
    {
        $patient->healthInsurances()->sync(
            $healthInsuranceId === null ? [] : [$healthInsuranceId],
        );

        return $patient->refresh()->load(['user', 'healthInsurances']);
    }

    public function forUser(User $user): Patient
    {
        $patient = $user->patient;

        if ($patient === null) {
            abort(403);
        }

        return $patient;
    }

    /**
     * @return Collection<int, Patient>
     */
    public function list(?string $term = null)
    {
        $query = Patient::query()
            ->with(['user', 'healthInsurances'])
            ->orderBy('id');

        $term = trim((string) $term);

        if ($term !== '') {
            $query->where(function ($patients) use ($term) {
                $patients->where('dni', 'like', '%'.$term.'%')
                    ->orWhereHas('user', function ($users) use ($term) {
                        $users->where('name', 'like', '%'.$term.'%')
                            ->orWhere('email', 'like', '%'.$term.'%');
                    });
            });
        }

        return $query->get();
    }
}
