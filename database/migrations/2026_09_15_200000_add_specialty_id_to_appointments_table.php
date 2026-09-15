<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('appointments')->exists()) {
            throw new RuntimeException(
                'Cannot add appointments.specialty_id: existing reservations have no specialty to backfill.',
            );
        }

        Schema::table('appointments', function (Blueprint $table) {
            $table->foreignId('specialty_id')->after('patient_id')->constrained('specialties')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('specialty_id');
        });
    }
};
