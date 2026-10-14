<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('doctors', 'professionals');
        Schema::rename('doctor_patient', 'professional_patient');
        Schema::rename('doctor_specialty', 'professional_specialty');
        Schema::rename('doctor_health_insurance', 'professional_health_insurance');

        foreach ([
            'appointments',
            'availability_windows',
            'professional_patient',
            'professional_specialty',
            'professional_health_insurance',
        ] as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->renameColumn('doctor_id', 'professional_id');
            });
        }

        DB::table('roles')->where('name', 'doctor')->update(['name' => 'professional']);

        foreach ([
            'doctors.browse' => 'professionals.browse',
            'doctors.catalog.view' => 'professionals.catalog.view',
            'doctors.create' => 'professionals.create',
        ] as $from => $to) {
            DB::table('permissions')->where('name', $from)->update(['name' => $to]);
        }
    }

    public function down(): void
    {
        foreach ([
            'professionals.browse' => 'doctors.browse',
            'professionals.catalog.view' => 'doctors.catalog.view',
            'professionals.create' => 'doctors.create',
        ] as $from => $to) {
            DB::table('permissions')->where('name', $from)->update(['name' => $to]);
        }

        DB::table('roles')->where('name', 'professional')->update(['name' => 'doctor']);

        foreach ([
            'appointments',
            'availability_windows',
            'professional_patient',
            'professional_specialty',
            'professional_health_insurance',
        ] as $table) {
            Schema::table($table, function (Blueprint $blueprint): void {
                $blueprint->renameColumn('professional_id', 'doctor_id');
            });
        }

        Schema::rename('professional_health_insurance', 'doctor_health_insurance');
        Schema::rename('professional_specialty', 'doctor_specialty');
        Schema::rename('professional_patient', 'doctor_patient');
        Schema::rename('professionals', 'doctors');
    }
};
