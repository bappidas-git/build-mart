<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->string('type', 20)->default('text');
            $table->string('status', 20)->default('draft')->index();
            $table->boolean('featured')->default(false);
            $table->integer('sort_order')->default(0)->index();
            $table->string('customer_name', 150)->nullable();
            $table->string('designation', 150)->nullable();
            $table->string('company', 150)->nullable();
            $table->string('avatar_url')->nullable();
            $table->unsignedTinyInteger('rating')->nullable();
            $table->string('title')->nullable();
            $table->text('body')->nullable();
            $table->date('review_date')->nullable();
            $table->boolean('verified')->default(false);
            $table->json('media')->nullable();
            $table->json('product_ids')->nullable();
            $table->json('category_ids')->nullable();
            $table->json('placements')->nullable();
            $table->json('tags')->nullable();
            $table->string('source', 30)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('testimonials', function (Blueprint $table) {
            $table->dropColumn([
                'type', 'status', 'featured', 'sort_order', 'customer_name',
                'designation', 'company', 'avatar_url', 'rating', 'title', 'body',
                'review_date', 'verified', 'media', 'product_ids', 'category_ids',
                'placements', 'tags', 'source',
            ]);
        });
    }
};
