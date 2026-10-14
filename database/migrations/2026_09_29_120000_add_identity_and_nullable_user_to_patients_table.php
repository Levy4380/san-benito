<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->string('name')->nullable()->after('user_id');
            $table->string('email')->nullable()->after('name');
            $table->string('phone')->nullable()->after('email');
        });

        DB::table('patients')->orderBy('id')->lazyById()->each(function (object $patient): void {
            $user = DB::table('users')->where('id', $patient->user_id)->first();

            DB::table('patients')->where('id', $patient->id)->update([
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
            ]);
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        DB::statement('ALTER TABLE patients MODIFY user_id BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE patients MODIFY name VARCHAR(255) NOT NULL');
        DB::statement('ALTER TABLE patients MODIFY email VARCHAR(255) NOT NULL');

        Schema::table('patients', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
            $table->unique('email');
        });
    }

    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropUnique(['email']);
        });

        DB::statement('ALTER TABLE patients MODIFY user_id BIGINT UNSIGNED NOT NULL');

        Schema::table('patients', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->dropColumn(['name', 'email', 'phone']);
        });
    }
};
