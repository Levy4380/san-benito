<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection as SupportCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class PatientService
{
    /**
     * @param  array{name: string, email: string, password: string, dni: string, birth_date: string, phone?: string|null, health_insurance_id?: int|null}  $data
     */
    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $chart = Patient::query()
                ->where('email', $data['email'])
                ->lockForUpdate()
                ->first();

            if ($chart !== null) {
                if ($chart->user_id !== null) {
                    throw ValidationException::withMessages([
                        'email' => 'El correo ya está registrado.',
                    ]);
                }

                return $this->attachAccount($chart, $data);
            }

            if (User::query()->where('email', $data['email'])->exists()) {
                throw ValidationException::withMessages([
                    'email' => 'El correo ya está registrado.',
                ]);
            }

            return $this->createAccount($data);
        });
    }

    /**
     * @param  array{name: string, email: string, dni: string, birth_date: string, phone?: string|null, health_insurance_id?: int|null}  $data
     */
    public function createWithoutAccount(array $data): Patient
    {
        return DB::transaction(function () use ($data) {
            $patient = Patient::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'dni' => $data['dni'],
                'birth_date' => $data['birth_date'],
            ]);

            $this->syncOptionalHealthInsurance($patient, $data['health_insurance_id'] ?? null);

            return $patient;
        });
    }

    public function syncIdentity(User $user): void
    {
        $patient = $user->patient;

        if ($patient === null) {
            return;
        }

        $patient->update([
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
        ]);
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
     * @return SupportCollection<int, array{id: int, name: string, dni: string}>
     */
    public function options(): SupportCollection
    {
        return Patient::query()
            ->orderBy('name')
            ->get(['id', 'name', 'dni'])
            ->toBase()
            ->map(fn (Patient $patient) => ['id' => $patient->id, 'name' => $patient->name, 'dni' => $patient->dni]);
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
                    ->orWhere('name', 'like', '%'.$term.'%')
                    ->orWhere('email', 'like', '%'.$term.'%');
            });
        }

        return $query->get();
    }

    /**
     * @param  array{name: string, email: string, password: string, dni: string, birth_date: string, phone?: string|null, health_insurance_id?: int|null}  $data
     */
    private function createAccount(array $data): User
    {
        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
        ]);

        $patient = Patient::query()->create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'dni' => $data['dni'],
            'birth_date' => $data['birth_date'],
        ]);

        $this->syncOptionalHealthInsurance($patient, $data['health_insurance_id'] ?? null);

        $user->assignRole('patient');

        return $user;
    }

    /**
     * @param  array{name: string, email: string, password: string, dni: string, birth_date: string, phone?: string|null}  $data
     */
    private function attachAccount(Patient $patient, array $data): User
    {
        $errors = [];

        if ($patient->dni !== $data['dni']) {
            $errors['dni'] = 'El DNI no coincide con la ficha.';
        }

        $birthDate = $patient->birth_date->toDateString();
        $submitted = Carbon::parse($data['birth_date'])->toDateString();

        if ($birthDate !== $submitted) {
            $errors['birth_date'] = 'La fecha de nacimiento no coincide con la ficha.';
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'password' => Hash::make($data['password']),
        ]);

        $patient->update([
            'user_id' => $user->id,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
        ]);

        $user->assignRole('patient');

        return $user;
    }

    private function syncOptionalHealthInsurance(Patient $patient, mixed $healthInsuranceId): void
    {
        if ($healthInsuranceId === null || $healthInsuranceId === '') {
            return;
        }

        $patient->healthInsurances()->sync([(int) $healthInsuranceId]);
    }
}
