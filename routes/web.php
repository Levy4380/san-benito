<?php

use App\Enums\Permission;
use App\Http\Controllers\Admin\AdminController as AdminAdminController;
use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Admin\DoctorController as AdminDoctorController;
use App\Http\Controllers\Admin\DoctorHealthInsuranceController as AdminDoctorHealthInsuranceController;
use App\Http\Controllers\Admin\DoctorPatientController as AdminDoctorPatientController;
use App\Http\Controllers\Admin\DoctorSpecialtyController as AdminDoctorSpecialtyController;
use App\Http\Controllers\Admin\DoctorWindowController as AdminDoctorWindowController;
use App\Http\Controllers\Admin\HealthInsuranceController as AdminHealthInsuranceController;
use App\Http\Controllers\Admin\PatientController as AdminPatientController;
use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\SpecialtyController as AdminSpecialtyController;
use App\Http\Controllers\AgendaAssignController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AgendaProgramController;
use App\Http\Controllers\AppointmentBookingController;
use App\Http\Controllers\AppointmentCancellationController;
use App\Http\Controllers\AvailabilityWindowController;
use App\Http\Controllers\BookingWizardController;
use App\Http\Controllers\DoctorProfileController;
use App\Http\Controllers\DoctorSearchController;
use App\Http\Controllers\DoctorSlotsController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\MyAppointmentsController;
use App\Http\Controllers\MyPatientProfileController;
use App\Http\Controllers\MyPatientsController;
use App\Http\Controllers\Settings\DoctorAgendaSettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/home', [HomeController::class, 'index']);

Route::middleware('auth')->group(function () {
    Route::delete('/appointments/{appointment}', [AppointmentCancellationController::class, 'destroy'])
        ->middleware(Permission::middleware(Permission::OwnAppointmentsCancel, Permission::AppointmentsCancel))
        ->name('appointments.destroy');

    Route::middleware(Permission::middleware(Permission::AppointmentsBook))->group(function () {
        Route::get('/book', [BookingWizardController::class, 'index'])->name('book');
        Route::post('/doctors/{doctor}/appointments', [AppointmentBookingController::class, 'store'])
            ->name('doctors.appointments.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnAppointmentsView))->group(function () {
        Route::get('/my-appointments', [MyAppointmentsController::class, 'index'])->name('my-appointments');
        Route::get('/my-appointments/history', [MyAppointmentsController::class, 'history'])->name('my-appointments.history');
    });

    Route::middleware(Permission::middleware(Permission::DoctorsBrowse))->group(function () {
        Route::get('/doctors', [DoctorSearchController::class, 'index'])->name('doctors.index');
        Route::get('/doctors/{doctor}', [DoctorProfileController::class, 'show'])->name('doctors.show');
        Route::get('/doctors/{doctor}/slots', [DoctorSlotsController::class, 'index'])->name('doctors.slots');
    });

    Route::middleware(Permission::middleware(Permission::SpecialtiesManage))->group(function () {
        Route::get('/doctors/{doctor}/specialties', [DoctorProfileController::class, 'specialties'])
            ->name('doctors.specialties');
    });

    Route::middleware(Permission::middleware(Permission::HealthInsurancesManage))->group(function () {
        Route::get('/doctors/{doctor}/health-insurances', [DoctorProfileController::class, 'healthInsurances'])
            ->name('doctors.health-insurances');
    });

    Route::middleware(Permission::middleware(Permission::OwnAgendaView))->group(function () {
        Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');
    });

    Route::middleware(Permission::middleware(Permission::OwnAvailabilityCreate))->group(function () {
        Route::post('/agenda/windows', [AvailabilityWindowController::class, 'store'])->name('agenda.windows.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnAvailabilityDelete))->group(function () {
        Route::delete('/agenda/windows/{window}', [AvailabilityWindowController::class, 'destroy'])->name('agenda.windows.destroy');
    });

    Route::middleware(Permission::middleware(Permission::OwnAppointmentsAssign))->group(function () {
        Route::post('/agenda/appointments', [AgendaAssignController::class, 'store'])->name('agenda.appointments.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnAvailabilityProgram))->group(function () {
        Route::get('/agenda/program', [AgendaProgramController::class, 'create'])->name('agenda.program');
        Route::post('/agenda/program', [AgendaProgramController::class, 'store'])->name('agenda.program.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnPatientsView))->group(function () {
        Route::get('/my-patients', [MyPatientsController::class, 'index'])->name('my-patients.index');
        Route::get('/my-patients/{patient}', [MyPatientProfileController::class, 'show'])->name('my-patients.show');
    });

    Route::middleware(Permission::middleware(Permission::OwnPatientsLink))->group(function () {
        Route::post('/my-patients', [MyPatientsController::class, 'store'])->name('my-patients.store');
    });

    Route::middleware(Permission::middleware(Permission::OwnAgendaSettingsUpdate))->group(function () {
        Route::get('/settings/agenda', [DoctorAgendaSettingsController::class, 'edit'])->name('settings.agenda.edit');
        Route::patch('/settings/agenda', [DoctorAgendaSettingsController::class, 'update'])->name('settings.agenda.update');
    });

    Route::prefix('admin')->name('admin.')->group(function () {
        Route::middleware(Permission::middleware(Permission::AppointmentsCatalogView))->group(function () {
            Route::get('/appointments', [AdminAppointmentController::class, 'index'])->name('appointments.index');
        });

        Route::middleware(Permission::middleware(Permission::DoctorsCatalogView))->group(function () {
            Route::get('/doctors', [AdminDoctorController::class, 'index'])->name('doctors.index');
        });

        Route::middleware(Permission::middleware(Permission::DoctorsCreate))->group(function () {
            Route::get('/doctors/create', [AdminDoctorController::class, 'create'])->name('doctors.create');
            Route::post('/doctors', [AdminDoctorController::class, 'store'])->name('doctors.store');
        });

        Route::middleware(Permission::middleware(Permission::AvailabilityCreate))->group(function () {
            Route::post('/doctors/{doctor}/windows', [AdminDoctorWindowController::class, 'store'])->name('doctors.windows.store');
        });

        Route::middleware(Permission::middleware(Permission::AvailabilityProgram))->group(function () {
            Route::post('/doctors/{doctor}/windows/program', [AdminDoctorWindowController::class, 'program'])->name('doctors.windows.program');
        });

        Route::middleware(Permission::middleware(Permission::PatientsLink))->group(function () {
            Route::post('/doctors/{doctor}/patients', [AdminDoctorPatientController::class, 'store'])->name('doctors.patients.store');
        });

        Route::middleware(Permission::middleware(Permission::AdminsManage))->group(function () {
            Route::get('/admins', [AdminAdminController::class, 'index'])->name('admins.index');
            Route::get('/admins/create', [AdminAdminController::class, 'create'])->name('admins.create');
            Route::post('/admins', [AdminAdminController::class, 'store'])->name('admins.store');
        });

        Route::middleware(Permission::middleware(Permission::PatientsCreate))->group(function () {
            Route::get('/patients/create', [AdminPatientController::class, 'create'])->name('patients.create');
            Route::post('/patients', [AdminPatientController::class, 'store'])->name('patients.store');
        });

        Route::middleware(Permission::middleware(Permission::PatientsCatalogView))->group(function () {
            Route::get('/patients', [AdminPatientController::class, 'index'])->name('patients.index');
            Route::get('/patients/{patient}', [AdminPatientController::class, 'show'])
                ->whereNumber('patient')
                ->name('patients.show');
        });

        Route::middleware(Permission::middleware(Permission::SpecialtiesManage))->group(function () {
            Route::get('/settings', [AdminSettingsController::class, 'index'])->name('settings.index');
            Route::get('/settings/specialties', [AdminSpecialtyController::class, 'index'])->name('settings.specialties.index');
            Route::get('/settings/specialties/create', [AdminSpecialtyController::class, 'create'])->name('settings.specialties.create');
            Route::get('/settings/specialties/{specialty}/edit', [AdminSpecialtyController::class, 'edit'])->name('settings.specialties.edit');
            Route::post('/settings/specialties', [AdminSpecialtyController::class, 'store'])->name('settings.specialties.store');
            Route::patch('/settings/specialties/{specialty}', [AdminSpecialtyController::class, 'update'])->name('settings.specialties.update');
            Route::delete('/settings/specialties/{specialty}', [AdminSpecialtyController::class, 'destroy'])->name('settings.specialties.destroy');
            Route::patch('/doctors/{doctor}/specialties', [AdminDoctorSpecialtyController::class, 'update'])->name('doctors.specialties.update');
        });

        Route::middleware(Permission::middleware(Permission::HealthInsurancesManage))->group(function () {
            Route::get('/settings/health-insurances', [AdminHealthInsuranceController::class, 'index'])->name('settings.health-insurances.index');
            Route::get('/settings/health-insurances/create', [AdminHealthInsuranceController::class, 'create'])->name('settings.health-insurances.create');
            Route::get('/settings/health-insurances/{healthInsurance}/edit', [AdminHealthInsuranceController::class, 'edit'])->name('settings.health-insurances.edit');
            Route::post('/settings/health-insurances', [AdminHealthInsuranceController::class, 'store'])->name('settings.health-insurances.store');
            Route::patch('/settings/health-insurances/{healthInsurance}', [AdminHealthInsuranceController::class, 'update'])->name('settings.health-insurances.update');
            Route::delete('/settings/health-insurances/{healthInsurance}', [AdminHealthInsuranceController::class, 'destroy'])->name('settings.health-insurances.destroy');
            Route::patch('/doctors/{doctor}/health-insurances', [AdminDoctorHealthInsuranceController::class, 'update'])->name('doctors.health-insurances.update');
            Route::patch('/patients/{patient}/health-insurance', [AdminPatientController::class, 'updateHealthInsurance'])
                ->whereNumber('patient')
                ->name('patients.health-insurance.update');
        });
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
