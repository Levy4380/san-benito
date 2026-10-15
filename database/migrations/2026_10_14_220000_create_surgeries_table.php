<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('surgeries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('patient_id')->constrained('patients')->restrictOnDelete();
            $table->foreignId('professional_id')->constrained('professionals')->cascadeOnDelete();
            $table->foreignId('health_insurance_id')->nullable()->constrained('health_insurances')->restrictOnDelete();
            $table->foreignId('requested_by_user_id')->constrained('users')->restrictOnDelete();
            $table->string('status');
            $table->text('note');
            $table->dateTime('starts_at')->nullable();
            $table->dateTime('ends_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'starts_at']);
        });

        DB::statement(<<<'SQL'
            ALTER TABLE surgeries
            ADD CONSTRAINT surgeries_status_times_check CHECK (
                (status = 'scheduled' AND starts_at IS NOT NULL AND ends_at IS NOT NULL AND ends_at > starts_at)
                OR
                (status <> 'scheduled' AND starts_at IS NULL AND ends_at IS NULL)
            )
        SQL);
    }

    public function down(): void
    {
        Schema::dropIfExists('surgeries');
    }
};
