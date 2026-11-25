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
            || $user->professional?->id === $appointment->professional_id;
    }

    /** Staff any appointment; the professional only the ones of their own agenda (d51). Patients never. */
    public function reschedule(User $user, Appointment $appointment): bool
    {
        if (Permission::AppointmentsReschedule->allows($user)) {
            return true;
        }

        return Permission::OwnAppointmentsReschedule->allows($user)
            && $user->professional?->id === $appointment->professional_id;
    }

    public function markAttendance(User $user, Appointment $appointment): bool
    {
        if (Permission::AppointmentsAttendance->allows($user)) {
            return true;
        }

        return Permission::OwnAppointmentsAttendance->allows($user)
            && $user->professional?->id === $appointment->professional_id;
    }
}
