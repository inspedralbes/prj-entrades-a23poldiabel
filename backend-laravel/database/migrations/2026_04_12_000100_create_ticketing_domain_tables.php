<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->dateTime('date_time');
            $table->string('venue');
            $table->text('description')->nullable();
            $table->string('image_url')->nullable();
            $table->string('status', 30)->default('active');
            $table->timestamps();
        });

        Schema::create('zones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('zone_key', 120);
            $table->string('zone_name', 120);
            $table->decimal('price', 10, 2);
            $table->string('color', 50)->nullable();
            $table->unique(['event_id', 'zone_key']);
        });

        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('zone_id')->constrained('zones')->cascadeOnDelete();
            $table->string('row', 8);
            $table->unsignedInteger('seat_number');
            $table->string('status', 20)->default('AVAILABLE');
            $table->foreignId('reserved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('sold_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['event_id', 'zone_id', 'row', 'seat_number']);
            $table->index(['event_id', 'status']);
        });

        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seat_id')->constrained('seats')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->string('status', 20)->default('PENDING');
            $table->timestamp('reserved_at')->useCurrent();
            $table->timestamp('expires_at');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->index(['event_id', 'status', 'expires_at']);
            $table->index(['user_id', 'status', 'expires_at']);
        });

        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->decimal('total_price', 10, 2)->default(0);
            $table->string('status', 20)->default('PENDING');
            $table->string('first_name', 120)->nullable();
            $table->string('last_name', 120)->nullable();
            $table->string('email', 180)->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
            $table->index(['event_id', 'status']);
        });

        Schema::create('purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_id')->constrained('purchases')->cascadeOnDelete();
            $table->foreignId('seat_id')->constrained('seats')->cascadeOnDelete();
            $table->string('zone_name', 120)->nullable();
            $table->decimal('price', 10, 2)->default(0);
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['purchase_id', 'seat_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchase_items');
        Schema::dropIfExists('purchases');
        Schema::dropIfExists('reservations');
        Schema::dropIfExists('seats');
        Schema::dropIfExists('zones');
        Schema::dropIfExists('events');
    }
};
