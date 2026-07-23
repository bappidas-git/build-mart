<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('careers_pages', function (Blueprint $table) {
            $table->boolean('enabled')->default(true);
            $table->json('seo')->nullable();
            $table->json('hero')->nullable();
            $table->json('why_join_us')->nullable();
            $table->json('culture')->nullable();
            $table->json('benefits')->nullable();
            $table->json('growth')->nullable();
            $table->json('life')->nullable();
            $table->json('hiring_process')->nullable();
            $table->json('faqs')->nullable();
            $table->json('cta')->nullable();
            $table->json('openings')->nullable();
            $table->json('thank_you')->nullable();
            $table->json('notifications')->nullable();
        });

        Schema::table('testimonial_pages', function (Blueprint $table) {
            $table->boolean('enabled')->default(true);
            $table->json('seo')->nullable();
            $table->json('hero')->nullable();
            $table->json('home')->nullable();
            $table->json('product_page')->nullable();
            $table->json('page')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('careers_pages', function (Blueprint $table) {
            $table->dropColumn([
                'enabled', 'seo', 'hero', 'why_join_us', 'culture', 'benefits',
                'growth', 'life', 'hiring_process', 'faqs', 'cta', 'openings',
                'thank_you', 'notifications',
            ]);
        });

        Schema::table('testimonial_pages', function (Blueprint $table) {
            $table->dropColumn(['enabled', 'seo', 'hero', 'home', 'product_page', 'page']);
        });
    }
};
