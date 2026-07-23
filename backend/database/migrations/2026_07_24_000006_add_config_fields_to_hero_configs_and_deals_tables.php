<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hero_configs', function (Blueprint $table) {
            $table->boolean('enabled')->default(true);
            $table->integer('autoplay_ms')->default(6000);
            $table->json('slides')->nullable();
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->boolean('enabled')->default(false);
            $table->boolean('header_cta_enabled')->default(true);
        });
    }

    public function down(): void
    {
        Schema::table('hero_configs', function (Blueprint $table) {
            $table->dropColumn(['enabled', 'autoplay_ms', 'slides']);
        });

        Schema::table('deals', function (Blueprint $table) {
            $table->dropColumn(['enabled', 'header_cta_enabled']);
        });
    }
};
