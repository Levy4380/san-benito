<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_specialty', function (Blueprint $table) {
            $table->dropForeign(['specialty_id']);
        });

        Schema::table('doctor_specialty', function (Blueprint $table) {
            $table->foreign('specialty_id')->references('id')->on('specialties')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('doctor_specialty', function (Blueprint $table) {
            $table->dropForeign(['specialty_id']);
        });

        Schema::table('doctor_specialty', function (Blueprint $table) {
            $table->foreign('specialty_id')->references('id')->on('specialties')->restrictOnDelete();
        });
    }
};
