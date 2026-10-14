<?php

use App\Enums\Permission;
use App\Http\Controllers\Admin\AdminController as AdminAdminController;
use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Admin\HealthInsuranceController as AdminHealthInsuranceController;
use App\Http\Controllers\Admin\PatientController as AdminPatientController;
use App\Http\Controllers\Admin\ProfessionalController as AdminProfessionalController;
use App\Http\Controllers\Admin\ProfessionalHealthInsuranceController as AdminProfessionalHealthInsuranceController;
use App\Http\Controllers\Admin\ProfessionalPatientController as AdminProfessionalPatientController;
use App\Http\Controllers\Admin\ProfessionalSpecialtyController as AdminProfessionalSpecialtyController;
use App\Http\Controllers\Admin\ProfessionalWindowController as AdminProfessionalWindowController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\SpecialtyController as AdminSpecialtyController;
use App\Http\Controllers\AgendaAssignController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AgendaProgramController;
use App\Http\Controllers\AppointmentBookingController;
use App\Http\Controllers\AppointmentCancellationController;
use App\Http\Controllers\AvailabilityWindowController;
use App\Http\Controllers\BookingWizardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MyAppointmentsController;
use App\Http\Controllers\MyPatientProfileController;
use App\Http\Controllers\MyPatientsController;
use App\Http\Controllers\PatientHomeController;
use App\Http\Controllers\ProfessionalHomeController;
use App\Http\Controllers\ProfessionalProfileController;
use App\Http\Controllers\ProfessionalSearchController;
use App\Http\Controllers\ProfessionalSlotsController;
use App\Http\Controllers\Settings\ProfessionalAgendaSettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/home', [HomeController::class, 'index']);

Route::middleware('auth')->group(function () {
    Route::delete('/appointments/{appointment}', [AppointmentCancellationController::class, 'destroy'])
        ->middleware(Permission::middleware(Permission::OwnAppointmentsCancel, Permission::AppointmentsCancel))
        ->name('appointments.destroy');

    Route::middleware(Permission::middleware(Permission::AppointmentsBook, Permission::AppointmentsAssign))->group(function () {
        Route::post('/professionals/{professional}/appointments', [AppointmentBookingController::class, 'store'])
            ->name('professionals.appointments.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnAvailabilityCreate))->group(function () {
        Route::post('/agenda/windows', [AvailabilityWindowController::class, 'store'])->name('agenda.windows.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnAvailabilityDelete))->group(function () {
        Route::delete('/agenda/windows/{window}', [AvailabilityWindowController::class, 'destroy'])->name('agenda.windows.destroy');
    });

    Route::middleware(Permission::middleware(Permission::OwnAppointmentsAssign))->group(function () {
        Route::get('/agenda/assign-options', [AgendaAssignController::class, 'options'])->name('agenda.assign-options');
        Route::post('/agenda/appointments', [AgendaAssignController::class, 'store'])->name('agenda.appointments.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnAvailabilityProgram))->group(function () {
        Route::post('/agenda/program', [AgendaProgramController::class, 'store'])->name('agenda.program.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnPatientsLink))->group(function () {
        Route::post('/my-patients', [MyPatientsController::class, 'store'])->name('my-patients.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnAgendaSettingsUpdate))->group(function () {
        Route::patch('/agenda/settings', [ProfessionalAgendaSettingsController::class, 'update'])->name('agenda.settings.update');
    });

    Route::middleware(Permission::middleware(Permission::ProfessionalsCreate))->group(function () {
        Route::get('/professionals/create', [AdminProfessionalController::class, 'create'])->name('admin.professionals.create');
        Route::post('/professionals', [AdminProfessionalController::class, 'store'])->name('admin.professionals.store');
    });

    Route::middleware(Permission::middleware(Permission::AvailabilityCreate))->group(function () {
        Route::post('/professionals/{professional}/windows', [AdminProfessionalWindowController::class, 'store'])->name('admin.professionals.windows.store');
    });

    Route::middleware(Permission::middleware(Permission::AvailabilityProgram))->group(function () {
        Route::post('/professionals/{professional}/windows/program', [AdminProfessionalWindowController::class, 'program'])->name('admin.professionals.windows.program');
    });

    Route::middleware(Permission::middleware(Permission::PatientsLink))->group(function () {
        Route::post('/professionals/{professional}/patients', [AdminProfessionalPatientController::class, 'store'])->name('admin.professionals.patients.store');
    });

    Route::middleware(Permission::middleware(Permission::SpecialtiesManage))->group(function () {
        Route::patch('/professionals/{professional}/specialties', [AdminProfessionalSpecialtyController::class, 'update'])->name('admin.professionals.specialties.update');
        Route::post('/specialties', [AdminSpecialtyController::class, 'store'])->name('specialties.store');
        Route::patch('/specialties/{specialty}', [AdminSpecialtyController::class, 'update'])->name('specialties.update');
        Route::delete('/specialties/{specialty}', [AdminSpecialtyController::class, 'destroy'])->name('specialties.destroy');
    });

    Route::middleware(Permission::middleware(Permission::HealthInsurancesManage))->group(function () {
        Route::patch('/professionals/{professional}/health-insurances', [AdminProfessionalHealthInsuranceController::class, 'update'])->name('admin.professionals.health-insurances.update');
        Route::post('/health-insurances', [AdminHealthInsuranceController::class, 'store'])->name('health-insurances.store');
        Route::patch('/health-insurances/{healthInsurance}', [AdminHealthInsuranceController::class, 'update'])->name('health-insurances.update');
        Route::delete('/health-insurances/{healthInsurance}', [AdminHealthInsuranceController::class, 'destroy'])->name('health-insurances.destroy');
        Route::patch('/patients/{patient}/health-insurance', [AdminPatientController::class, 'updateHealthInsurance'])
            ->whereNumber('patient')
            ->name('patients.health-insurance.update');
    });

    Route::middleware(Permission::middleware(Permission::PatientsCreate))->group(function () {
        Route::get('/patients/create', [AdminPatientController::class, 'create'])->name('patients.create');
        Route::post('/patients', [AdminPatientController::class, 'store'])->name('patients.store');
    });

    Route::middleware(Permission::middleware(Permission::AdminsManage))->group(function () {
        Route::post('/admins', [AdminAdminController::class, 'store'])->name('admins.store');
    });

    Route::prefix('paciente')->name('paciente.')->group(function () {
        Route::get('/', [PatientHomeController::class, 'index'])
            ->middleware(Permission::middleware(Permission::PortalHome))
            ->name('home');

        Route::middleware(Permission::middleware(Permission::AppointmentsBook))->group(function () {
            Route::get('/reserva', [BookingWizardController::class, 'index'])->name('book');
        });

        Route::middleware(Permission::middleware(Permission::OwnAppointmentsView))->group(function () {
            Route::get('/mis-turnos', [MyAppointmentsController::class, 'index'])->name('my-appointments');
            Route::get('/mis-turnos/historial', [MyAppointmentsController::class, 'history'])->name('my-appointments.history');
        });

        Route::middleware(Permission::middleware(Permission::ProfessionalsBrowse))->group(function () {
            Route::get('/profesionales', [ProfessionalSearchController::class, 'index'])->name('professionals.index');
            Route::get('/profesionales/{professional}', [ProfessionalProfileController::class, 'show'])->name('professionals.show');
            Route::get('/profesionales/{professional}/horarios', [ProfessionalSlotsController::class, 'index'])->name('professionals.slots');
        });
    });

    Route::prefix('profesional')->name('professional.')->group(function () {
        Route::get('/', [ProfessionalHomeController::class, 'index'])
            ->middleware(Permission::middleware(Permission::PortalHome))
            ->name('home');

        Route::middleware(Permission::middleware(Permission::OwnAgendaView))->group(function () {
            Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');
        });

        Route::middleware(Permission::middleware(Permission::OwnAvailabilityProgram))->group(function () {
            Route::get('/programar', [AgendaProgramController::class, 'create'])->name('agenda.program');
        });

        Route::middleware(Permission::middleware(Permission::OwnPatientsView))->group(function () {
            Route::get('/mis-pacientes', [MyPatientsController::class, 'index'])->name('my-patients.index');
            Route::get('/mis-pacientes/{patient}', [MyPatientProfileController::class, 'show'])->name('my-patients.show');
        });

        Route::middleware(Permission::middleware(Permission::OwnAgendaSettingsUpdate))->group(function () {
            Route::get('/configuracion/agenda', [ProfessionalAgendaSettingsController::class, 'edit'])->name('settings.agenda.edit');
        });
    });

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('/', fn () => redirect()->route('admin.appointments.index'))->name('home');

        Route::middleware(Permission::middleware(Permission::AppointmentsCatalogView))->group(function () {
            Route::get('/reservas', [AdminAppointmentController::class, 'index'])->name('appointments.index');
            Route::get('/profesionales/{professional}/horarios', [ProfessionalSlotsController::class, 'index'])->name('professionals.slots');
        });

        Route::middleware(Permission::middleware(Permission::ProfessionalsCatalogView))->group(function () {
            Route::get('/profesionales', [AdminProfessionalController::class, 'index'])->name('professionals.index');
            Route::get('/profesionales/{professional}', [ProfessionalProfileController::class, 'show'])->name('professionals.show');
        });

        Route::middleware(Permission::middleware(Permission::AdminsManage))->group(function () {
            Route::get('/administradores', [AdminAdminController::class, 'index'])->name('admins.index');
            Route::get('/administradores/crear', [AdminAdminController::class, 'create'])->name('admins.create');
        });

        Route::middleware(Permission::middleware(Permission::PatientsCatalogView))->group(function () {
            Route::get('/pacientes', [AdminPatientController::class, 'index'])->name('patients.index');
            Route::get('/pacientes/{patient}', [AdminPatientController::class, 'show'])
                ->whereNumber('patient')
                ->name('patients.show');
        });

        Route::middleware(Permission::middleware(Permission::SpecialtiesManage))->group(function () {
            Route::get('/configuracion', [AdminSettingsController::class, 'index'])->name('settings.index');
            Route::get('/configuracion/especialidades', [AdminSpecialtyController::class, 'index'])->name('settings.specialties.index');
            Route::get('/configuracion/especialidades/crear', [AdminSpecialtyController::class, 'create'])->name('settings.specialties.create');
            Route::get('/configuracion/especialidades/{specialty}/editar', [AdminSpecialtyController::class, 'edit'])->name('settings.specialties.edit');
            Route::get('/profesionales/{professional}/especialidades', [ProfessionalProfileController::class, 'specialties'])->name('professionals.specialties');
        });

        Route::middleware(Permission::middleware(Permission::HealthInsurancesManage))->group(function () {
            Route::get('/configuracion/obras-sociales', [AdminHealthInsuranceController::class, 'index'])->name('settings.health-insurances.index');
            Route::get('/configuracion/obras-sociales/crear', [AdminHealthInsuranceController::class, 'create'])->name('settings.health-insurances.create');
            Route::get('/configuracion/obras-sociales/{healthInsurance}/editar', [AdminHealthInsuranceController::class, 'edit'])->name('settings.health-insurances.edit');
            Route::get('/profesionales/{professional}/obras-sociales', [ProfessionalProfileController::class, 'healthInsurances'])->name('professionals.health-insurances');
        });
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
