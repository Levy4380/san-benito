<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctor_specialty', function (Blueprint $table) {
            $table->id();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->foreignId('specialty_id')->constrained('specialties')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['doctor_id', 'specialty_id']);
        });

        DB::table('doctor_specialty')->insertUsing(
            ['doctor_id', 'specialty_id', 'created_at', 'updated_at'],
            DB::table('doctors')->select('id', 'specialty_id', 'created_at', 'updated_at'),
        );

        Schema::table('doctors', function (Blueprint $table) {
            $table->dropForeign(['specialty_id']);
            $table->dropColumn('specialty_id');
        });
    }

    public function down(): void
    {
        Schema::table('doctors', function (Blueprint $table) {
            $table->unsignedBigInteger('specialty_id')->nullable();
        });

        $firsts = DB::table('doctor_specialty')
            ->select('doctor_id', DB::raw('MIN(specialty_id) as specialty_id'))
            ->groupBy('doctor_id')
            ->get();

        foreach ($firsts as $row) {
            DB::table('doctors')->where('id', $row->doctor_id)->update([
                'specialty_id' => $row->specialty_id,
            ]);
        }

        Schema::table('doctors', function (Blueprint $table) {
            $table->foreign('specialty_id')->references('id')->on('specialties')->restrictOnDelete();
        });

        Schema::dropIfExists('doctor_specialty');
    }
};
