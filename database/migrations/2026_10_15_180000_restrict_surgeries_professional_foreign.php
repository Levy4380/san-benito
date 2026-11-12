<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('surgeries', function (Blueprint $table) {
            $table->dropForeign(['professional_id']);
            $table->foreign('professional_id')->references('id')->on('professionals')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('surgeries', function (Blueprint $table) {
            $table->dropForeign(['professional_id']);
            $table->foreign('professional_id')->references('id')->on('professionals')->cascadeOnDelete();
        });
    }
};
