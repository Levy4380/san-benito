<?php

namespace App\Enums;

use App\Models\User;

enum Permission: string
{
    case PortalHome = 'portal.home';
    case ProfessionalsBrowse = 'professionals.browse';
    case AppointmentsBook = 'appointments.book';

    case OwnAppointmentsView = 'own.appointments.view';
    case OwnAppointmentsCancel = 'own.appointments.cancel';
    case OwnAppointmentsAssign = 'own.appointments.assign';
    case OwnAgendaView = 'own.agenda.view';
    case OwnAgendaSettingsUpdate = 'own.agenda.settings.update';
    case OwnPatientsView = 'own.patients.view';
    case OwnPatientsLink = 'own.patients.link';
    case OwnAvailabilityCreate = 'own.availability.create';
    case OwnAvailabilityProgram = 'own.availability.program';
    case OwnAvailabilityDelete = 'own.availability.delete';

    case AppointmentsCancel = 'appointments.cancel';
    case AppointmentsAssign = 'appointments.assign';
    case AppointmentsCatalogView = 'appointments.catalog.view';
    case PatientsLink = 'patients.link';
    case AvailabilityCreate = 'availability.create';
    case AvailabilityProgram = 'availability.program';
    case AvailabilityDelete = 'availability.delete';
    case ProfessionalsCatalogView = 'professionals.catalog.view';
    case ProfessionalsCreate = 'professionals.create';
    case SurgeriesCatalogView = 'surgeries.catalog.view';
    case SurgeriesCreate = 'surgeries.create';
    case SurgeriesRequest = 'surgeries.request';
    case SurgeriesApprove = 'surgeries.approve';
    case SurgeriesSchedule = 'surgeries.schedule';
    case PatientsCatalogView = 'patients.catalog.view';
    case PatientsCreate = 'patients.create';
    case AdminsManage = 'admins.manage';
    case SpecialtiesManage = 'specialties.manage';
    case HealthInsurancesManage = 'health_insurances.manage';

    public function allows(?User $user): bool
    {
        return $user !== null && $user->can($this->value);
    }

    public function own(): ?self
    {
        if (str_starts_with($this->value, 'own.')) {
            return $this;
        }

        return self::tryFrom('own.'.$this->value);
    }

    /**
     * @return list<string>
     */
    public static function names(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * @return list<self>
     */
    public static function forRole(string $role): array
    {
        $staff = [
            self::ProfessionalsBrowse,
            self::AppointmentsCancel,
            self::AppointmentsAssign,
            self::PatientsLink,
            self::AvailabilityCreate,
            self::AvailabilityProgram,
            self::AvailabilityDelete,
            self::AppointmentsCatalogView,
            self::ProfessionalsCatalogView,
            self::ProfessionalsCreate,
            self::SurgeriesCatalogView,
            self::SurgeriesCreate,
            self::SurgeriesRequest,
            self::SurgeriesApprove,
            self::SurgeriesSchedule,
        ];

        return match ($role) {
            'patient' => [
                self::PortalHome,
                self::ProfessionalsBrowse,
                self::AppointmentsBook,
                self::OwnAppointmentsView,
                self::OwnAppointmentsCancel,
            ],
            'professional' => [
                self::PortalHome,
                self::OwnAppointmentsCancel,
                self::OwnAgendaView,
                self::OwnAppointmentsAssign,
                self::OwnPatientsView,
                self::OwnPatientsLink,
                self::OwnAgendaSettingsUpdate,
                self::OwnAvailabilityCreate,
                self::OwnAvailabilityProgram,
                self::OwnAvailabilityDelete,
            ],
            'admin' => $staff,
            'super_admin' => [
                ...$staff,
                self::AdminsManage,
                self::PatientsCatalogView,
                self::PatientsCreate,
                self::SpecialtiesManage,
                self::HealthInsurancesManage,
            ],
            default => [],
        };
    }

    /**
     * @return list<string>
     */
    public static function namesForRole(string $role): array
    {
        return array_map(
            fn (self $permission) => $permission->value,
            self::forRole($role),
        );
    }

    /**
     * @return list<string>
     */
    public static function roles(): array
    {
        return ['patient', 'professional', 'admin', 'super_admin'];
    }

    public static function middleware(self $permission, self ...$more): string
    {
        $names = array_map(
            fn (self $item) => $item->value,
            [$permission, ...$more],
        );

        return 'permission:'.implode('|', $names);
    }
}
