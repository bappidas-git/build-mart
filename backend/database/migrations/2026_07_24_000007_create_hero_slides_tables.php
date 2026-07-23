<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_slides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hero_config_id')->constrained()->cascadeOnDelete();
            $table->string('slide_key', 60)->nullable();
            $table->string('type', 30)->default('showcase');
            $table->boolean('enabled')->default(true);
            $table->string('eyebrow')->nullable();
            $table->string('eyebrow_color', 30)->nullable();
            $table->string('logo')->nullable();
            $table->string('title')->nullable();
            $table->string('subtitle', 500)->nullable();
            $table->string('align', 20)->nullable();
            $table->string('media_type', 20)->nullable();
            $table->string('media_url')->nullable();
            $table->string('media_poster')->nullable();
            $table->string('primary_cta_label')->nullable();
            $table->string('primary_cta_to')->nullable();
            $table->string('secondary_cta_label')->nullable();
            $table->string('secondary_cta_to')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('hero_slide_gallery_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hero_slide_id')->constrained()->cascadeOnDelete();
            $table->string('label')->nullable();
            $table->string('link')->nullable();
            $table->string('image')->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_slide_gallery_items');
        Schema::dropIfExists('hero_slides');
    }
};
