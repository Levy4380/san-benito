<?php

use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Admin\DoctorController as AdminDoctorController;
use App\Http\Controllers\Admin\DoctorPatientController as AdminDoctorPatientController;
use App\Http\Controllers\Admin\DoctorWindowController as AdminDoctorWindowController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
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
        ->name('appointments.destroy');
});

Route::middleware(['auth', 'role:patient'])->group(function () {
    Route::get('/book', [BookingWizardController::class, 'index'])->name('book');
    Route::post('/doctors/{doctor}/appointments', [AppointmentBookingController::class, 'store'])
        ->name('doctors.appointments.store');
    Route::get('/my-appointments', [MyAppointmentsController::class, 'index'])->name('my-appointments');
    Route::get('/my-appointments/history', [MyAppointmentsController::class, 'history'])->name('my-appointments.history');
});

Route::middleware(['auth', 'role:patient|admin|super_admin'])->group(function () {
    Route::get('/doctors', [DoctorSearchController::class, 'index'])->name('doctors.index');
    Route::get('/doctors/{doctor}', [DoctorProfileController::class, 'show'])->name('doctors.show');
    Route::get('/doctors/{doctor}/slots', [DoctorSlotsController::class, 'index'])->name('doctors.slots');
});

Route::middleware(['auth', 'role:doctor'])->group(function () {
    Route::get('/agenda', [AgendaController::class, 'index'])->name('agenda');
    Route::post('/agenda/windows', [AvailabilityWindowController::class, 'store'])->name('agenda.windows.store');
    Route::delete('/agenda/windows/{window}', [AvailabilityWindowController::class, 'destroy'])->name('agenda.windows.destroy');
    Route::post('/agenda/appointments', [AgendaAssignController::class, 'store'])->name('agenda.appointments.store');
    Route::get('/agenda/program', [AgendaProgramController::class, 'create'])->name('agenda.program');
    Route::post('/agenda/program', [AgendaProgramController::class, 'store'])->name('agenda.program.store');
    Route::get('/my-patients', [MyPatientsController::class, 'index'])->name('my-patients.index');
    Route::post('/my-patients', [MyPatientsController::class, 'store'])->name('my-patients.store');
    Route::get('/my-patients/{patient}', [MyPatientProfileController::class, 'show'])->name('my-patients.show');
    Route::get('/settings/agenda', [DoctorAgendaSettingsController::class, 'edit'])->name('settings.agenda.edit');
    Route::patch('/settings/agenda', [DoctorAgendaSettingsController::class, 'update'])->name('settings.agenda.update');
});

Route::middleware(['auth', 'role:admin|super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/appointments', [AdminAppointmentController::class, 'index'])->name('appointments.index');
    Route::get('/doctors', [AdminDoctorController::class, 'index'])->name('doctors.index');
    Route::post('/doctors', [AdminDoctorController::class, 'store'])->name('doctors.store');
    Route::post('/doctors/{doctor}/windows', [AdminDoctorWindowController::class, 'store'])->name('doctors.windows.store');
    Route::post('/doctors/{doctor}/windows/program', [AdminDoctorWindowController::class, 'program'])->name('doctors.windows.program');
    Route::post('/doctors/{doctor}/patients', [AdminDoctorPatientController::class, 'store'])->name('doctors.patients.store');
});

Route::middleware(['auth', 'role:super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
    Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
