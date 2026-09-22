<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_health_insurance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('health_insurance_id')->constrained('health_insurances')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['doctor_id', 'health_insurance_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doctor_health_insurance');
    }
};
