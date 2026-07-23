<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wishlist_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->unsignedBigInteger('product_id')->index();
            $table->string('slug')->nullable();
            $table->string('name')->nullable();
            $table->string('image')->nullable();
            $table->string('brand')->nullable();
            $table->decimal('price', 12, 2)->nullable();
            $table->decimal('compare_price', 12, 2)->nullable();
            $table->decimal('rating', 3, 1)->nullable();
            $table->integer('total_reviews')->nullable();
            $table->string('short_description', 500)->nullable();
            $table->json('variants')->nullable();
            $table->integer('stock')->nullable();
            $table->boolean('trending')->default(false);
            $table->boolean('hot')->default(false);
            $table->timestamp('added_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlist_items');
    }
};
