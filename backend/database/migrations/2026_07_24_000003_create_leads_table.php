<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('type', 20)->index();
            $table->string('name', 150)->nullable();
            $table->string('email')->index();
            $table->string('phone', 20)->nullable();
            $table->string('order_number', 40)->nullable();
            $table->string('category', 30)->nullable();
            $table->string('subject')->nullable();
            $table->text('message')->nullable();
            $table->string('status', 20)->default('new')->index();
            $table->string('notes', 500)->nullable()->default('');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
