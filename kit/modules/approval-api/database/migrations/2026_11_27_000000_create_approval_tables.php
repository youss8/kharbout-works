<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_actors', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('branch');
            $table->string('role');
            $table->string('token_hash', 64)->unique();
        });

        Schema::create('approval_requests', function (Blueprint $table): void {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('author_id')->constrained('approval_actors');
            $table->string('branch');
            $table->string('state');
            $table->unsignedInteger('version');
        });

        Schema::create('approval_events', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('request_id')->constrained('approval_requests');
            $table->foreignId('actor_id')->constrained('approval_actors');
            $table->string('type');
            $table->unsignedInteger('from_version');
            $table->unsignedInteger('to_version');
            $table->timestamp('created_at')->useCurrent();
            $table->unique(['request_id', 'to_version']);
        });

        Schema::create('approval_receipts', function (Blueprint $table): void {
            $table->foreignId('actor_id')->constrained('approval_actors');
            $table->string('key', 128);
            $table->string('fingerprint', 64);
            $table->unsignedSmallInteger('status')->nullable();
            $table->text('response')->nullable();
            $table->primary(['actor_id', 'key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_receipts');
        Schema::dropIfExists('approval_events');
        Schema::dropIfExists('approval_requests');
        Schema::dropIfExists('approval_actors');
    }
};
