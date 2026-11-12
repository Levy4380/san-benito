<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clinic_schedules', function (Blueprint $table) {
            $table->id();
            $table->json('open_days');
            $table->time('opens_at');
            $table->time('closes_at');
            $table->timestamps();
        });

        $now = now();

        DB::table('clinic_schedules')->insert([
            'open_days' => json_encode([1, 2, 3, 4, 5, 6, 7]),
            'opens_at' => '07:00:00',
            'closes_at' => '21:00:00',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('clinic_schedules');
    }
};
