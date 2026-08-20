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
        Schema::create('money_in_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->date('received_date');
            $table->string('received_from');
            $table->enum('received_from_type', ['client', 'customer', 'company', 'individual', 'other'])->default('client');
            $table->foreignId('category_id')->constrained('money_in_categories')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('financial_accounts')->cascadeOnDelete();
            $table->enum('payment_method', ['cash', 'bank_transfer', 'cheque', 'online_transfer', 'other'])->default('bank_transfer');
            $table->decimal('amount', 15, 2);
            $table->string('external_reference')->nullable();
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->string('attachment_path')->nullable();
            $table->enum('status', ['posted', 'voided'])->default('posted');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('voided_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('voided_at')->nullable();
            $table->text('void_reason')->nullable();
            $table->boolean('is_deleted')->default(false);
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['reference', 'received_date', 'status']);
            $table->index('category_id');
            $table->index('account_id');
            $table->index('created_by');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('money_in_transactions');
    }
};
