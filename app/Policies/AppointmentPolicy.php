<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function book(User $user, Appointment $appointment): bool
    {
        return $user->hasRole('patient');
    }

    public function cancel(User $user, Appointment $appointment): bool
    {
        if ($user->hasAnyRole(['admin', 'super_admin'])) {
            return true;
        }

        if ($user->hasRole('doctor') && $user->doctor?->id === $appointment->doctor_id) {
            return true;
        }

        if ($user->hasRole('patient') && $user->patient?->id === $appointment->patient_id) {
            return true;
        }

        return false;
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        if ($user->hasAnyRole(['admin', 'super_admin'])) {
            return true;
        }

        return $user->hasRole('doctor') && $user->doctor?->id === $appointment->doctor_id;
    }
}
