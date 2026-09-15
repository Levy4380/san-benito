<?php

use App\Http\Controllers\Admin\AdminController as AdminAdminController;
use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Admin\DoctorController as AdminDoctorController;
use App\Http\Controllers\Admin\DoctorPatientController as AdminDoctorPatientController;
use App\Http\Controllers\Admin\DoctorSpecialtyController as AdminDoctorSpecialtyController;
use App\Http\Controllers\Admin\DoctorWindowController as AdminDoctorWindowController;
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

Route::get('/', function () {
    return redirect()->route('login');
})->name('welcome');

Route::middleware('auth')->group(function () {
    Route::get('/home', [HomeController::class, 'index'])->name('home');
    Route::delete('/appointments/{appointment}', [AppointmentCancellationController::class, 'destroy'])
        ->middleware('permission:own.appointments.cancel|appointments.cancel')
        ->name('appointments.destroy');
});

Route::middleware(['auth', 'permission:appointments.book'])->group(function () {
    Route::get('/book', [BookingWizardController::class, 'index'])->name('book');
    Route::post('/doctors/{doctor}/appointments', [AppointmentBookingController::class, 'store'])
        ->name('doctors.appointments.store');
});

Route::middleware(['auth', 'permission:own.appointments.view'])->group(function () {
    Route::get('/my-appointments', [MyAppointmentsController::class, 'index'])->name('my-appointments');
    Route::get('/my-appointments/history', [MyAppointmentsController::class, 'history'])->name('my-appointments.history');
});

Route::middleware(['auth', 'permission:doctors.browse'])->group(function () {
    Route::get('/doctors', [DoctorSearchController::class, 'index'])->name('doctors.index');
    Route::get('/doctors/{doctor}', [DoctorProfileController::class, 'show'])->name('doctors.show');
    Route::get('/doctors/{doctor}/slots', [DoctorSlotsController::class, 'index'])->name('doctors.slots');
});

Route::middleware(['auth', 'permission:own.agenda.view'])->group(function () {
    Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');
});

Route::middleware(['auth', 'permission:own.availability.create'])->group(function () {
    Route::post('/agenda/windows', [AvailabilityWindowController::class, 'store'])->name('agenda.windows.store');
});

Route::middleware(['auth', 'permission:own.availability.delete'])->group(function () {
    Route::delete('/agenda/windows/{window}', [AvailabilityWindowController::class, 'destroy'])->name('agenda.windows.destroy');
});

Route::middleware(['auth', 'permission:own.appointments.assign'])->group(function () {
    Route::post('/agenda/appointments', [AgendaAssignController::class, 'store'])->name('agenda.appointments.store');
});

Route::middleware(['auth', 'permission:own.availability.program'])->group(function () {
    Route::get('/agenda/program', [AgendaProgramController::class, 'create'])->name('agenda.program');
    Route::post('/agenda/program', [AgendaProgramController::class, 'store'])->name('agenda.program.store');
});

Route::middleware(['auth', 'permission:own.patients.view'])->group(function () {
    Route::get('/my-patients', [MyPatientsController::class, 'index'])->name('my-patients.index');
    Route::get('/my-patients/{patient}', [MyPatientProfileController::class, 'show'])->name('my-patients.show');
});

Route::middleware(['auth', 'permission:own.patients.link'])->group(function () {
    Route::post('/my-patients', [MyPatientsController::class, 'store'])->name('my-patients.store');
});

Route::middleware(['auth', 'permission:own.agenda.settings.update'])->group(function () {
    Route::get('/settings/agenda', [DoctorAgendaSettingsController::class, 'edit'])->name('settings.agenda.edit');
    Route::patch('/settings/agenda', [DoctorAgendaSettingsController::class, 'update'])->name('settings.agenda.update');
});

Route::middleware(['auth', 'permission:appointments.view-all'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/appointments', [AdminAppointmentController::class, 'index'])->name('appointments.index');
});

Route::middleware(['auth', 'permission:doctors.catalog.view'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/doctors', [AdminDoctorController::class, 'index'])->name('doctors.index');
});

Route::middleware(['auth', 'permission:doctors.create'])->prefix('admin')->name('admin.')->group(function () {
    Route::post('/doctors', [AdminDoctorController::class, 'store'])->name('doctors.store');
});

Route::middleware(['auth', 'permission:availability.create'])->prefix('admin')->name('admin.')->group(function () {
    Route::post('/doctors/{doctor}/windows', [AdminDoctorWindowController::class, 'store'])->name('doctors.windows.store');
});

Route::middleware(['auth', 'permission:availability.program'])->prefix('admin')->name('admin.')->group(function () {
    Route::post('/doctors/{doctor}/windows/program', [AdminDoctorWindowController::class, 'program'])->name('doctors.windows.program');
});

Route::middleware(['auth', 'permission:patients.link'])->prefix('admin')->name('admin.')->group(function () {
    Route::post('/doctors/{doctor}/patients', [AdminDoctorPatientController::class, 'store'])->name('doctors.patients.store');
});

Route::middleware(['auth', 'permission:staff.admins.manage'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/admins', [AdminAdminController::class, 'index'])->name('admins.index');
    Route::post('/admins', [AdminAdminController::class, 'store'])->name('admins.store');
});

Route::middleware(['auth', 'permission:staff.users.directory'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/patients', [AdminPatientController::class, 'index'])->name('patients.index');
    Route::get('/patients/{patient}', [AdminPatientController::class, 'show'])->name('patients.show');
});

Route::middleware(['auth', 'permission:patients.create'])->prefix('admin')->name('admin.')->group(function () {
    Route::post('/patients', [AdminPatientController::class, 'store'])->name('patients.store');
});

Route::middleware(['auth', 'permission:specialties.manage'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/settings', [AdminSettingsController::class, 'index'])->name('settings.index');
    Route::get('/settings/specialties', [AdminSpecialtyController::class, 'index'])->name('settings.specialties.index');
    Route::get('/settings/specialties/{specialty}/edit', [AdminSpecialtyController::class, 'edit'])->name('settings.specialties.edit');
    Route::post('/settings/specialties', [AdminSpecialtyController::class, 'store'])->name('settings.specialties.store');
    Route::patch('/settings/specialties/{specialty}', [AdminSpecialtyController::class, 'update'])->name('settings.specialties.update');
    Route::delete('/settings/specialties/{specialty}', [AdminSpecialtyController::class, 'destroy'])->name('settings.specialties.destroy');
    Route::patch('/doctors/{doctor}/specialties', [AdminDoctorSpecialtyController::class, 'update'])->name('doctors.specialties.update');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
