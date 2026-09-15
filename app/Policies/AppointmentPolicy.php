<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function cancel(User $user, Appointment $appointment): bool
    {
        if (Permission::AppointmentsCancel->allows($user)) {
            return true;
        }

        if (! Permission::OwnAppointmentsCancel->allows($user)) {
            return false;
        }

        return $user->patient?->id === $appointment->patient_id
            || $user->doctor?->id === $appointment->doctor_id;
    }
}
