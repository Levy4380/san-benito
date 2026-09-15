<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function cancel(User $user, Appointment $appointment): bool
    {
        if ($user->can('appointments.cancel')) {
            return true;
        }

        if (! $user->can('own.appointments.cancel')) {
            return false;
        }

        return $user->patient?->id === $appointment->patient_id
            || $user->doctor?->id === $appointment->doctor_id;
    }
}
