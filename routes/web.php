<?php

use App\Http\Controllers\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Admin\DoctorController as AdminDoctorController;
use App\Http\Controllers\Admin\DoctorPatientController as AdminDoctorPatientController;
use App\Http\Controllers\Admin\DoctorSlotController as AdminDoctorSlotController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\AgendaController;
use App\Http\Controllers\AgendaSlotController;
use App\Http\Controllers\AppointmentBookingController;
use App\Http\Controllers\AppointmentCancellationController;
use App\Http\Controllers\DoctorSearchController;
use App\Http\Controllers\DoctorSlotsController;
use App\Http\Controllers\MyAppointmentsController;
use App\Http\Controllers\MyPatientsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::post('appointments/{appointment}/cancel', [AppointmentCancellationController::class, 'store'])
        ->name('appointments.cancel');

    Route::middleware(['role:patient'])->group(function () {
        Route::get('doctors', [DoctorSearchController::class, 'index'])->name('doctors.index');
        Route::get('doctors/{doctor}/slots', [DoctorSlotsController::class, 'index'])->name('doctors.slots');
        Route::post('appointments/{appointment}/book', [AppointmentBookingController::class, 'store'])
            ->name('appointments.book');
        Route::get('my-appointments', [MyAppointmentsController::class, 'index'])->name('my-appointments.index');
    });

    Route::middleware(['role:doctor'])->group(function () {
        Route::get('agenda', [AgendaController::class, 'index'])->name('agenda.index');
        Route::post('agenda/slots', [AgendaSlotController::class, 'store'])->name('agenda.slots.store');
        Route::delete('agenda/slots/{appointment}', [AgendaSlotController::class, 'destroy'])
            ->name('agenda.slots.destroy');
        Route::get('my-patients', [MyPatientsController::class, 'index'])->name('my-patients.index');
        Route::post('my-patients', [MyPatientsController::class, 'store'])->name('my-patients.store');
    });

    Route::middleware(['role:admin|super_admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('appointments', [AdminAppointmentController::class, 'index'])->name('appointments.index');
        Route::get('doctors', [AdminDoctorController::class, 'index'])->name('doctors.index');
        Route::post('doctors', [AdminDoctorController::class, 'store'])->name('doctors.store');
        Route::post('doctors/{doctor}/slots', [AdminDoctorSlotController::class, 'store'])->name('doctors.slots.store');
        Route::post('doctors/{doctor}/patients', [AdminDoctorPatientController::class, 'store'])
            ->name('doctors.patients.store');
    });

    Route::middleware(['role:super_admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('users', [AdminUserController::class, 'index'])->name('users.index');
        Route::post('users', [AdminUserController::class, 'store'])->name('users.store');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
