<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enquiries', function (Blueprint $table) {
            $table->id();
            $table->string('enquiry_number')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('type')->default('enquiry');
            $table->string('status')->default('processing');
            $table->json('contact')->nullable();
            $table->json('items')->nullable();
            $table->decimal('amount_payable', 12, 2)->nullable();
            $table->decimal('store_credit_used', 12, 2)->default(0);
            $table->json('status_history')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enquiries');
    }
};
