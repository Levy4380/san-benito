<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained()->cascadeOnDelete();
            $table->foreignId('patient_id')->nullable()->constrained()->nullOnDelete();
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->enum('status', ['available', 'booked'])->default('available');
            $table->timestamps();

            $table->unique(['doctor_id', 'starts_at']);
            $table->index(['status', 'starts_at']);
            $table->index('patient_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};
