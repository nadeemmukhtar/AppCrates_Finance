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
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->string('reference')->unique();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('lender_id')->constrained('lenders')->cascadeOnDelete();
            $table->date('loan_date');
            $table->decimal('original_amount', 15, 2);
            $table->decimal('interest_rate', 5, 2)->default(0.00);
            $table->decimal('interest_amount', 15, 2)->default(0.00);
            $table->date('due_date')->nullable();
            $table->enum('payment_frequency', ['one_time', 'monthly', 'quarterly', 'yearly', 'custom'])->default('one_time');
            $table->string('purpose')->nullable();
            $table->text('notes')->nullable();
            $table->string('attachment_path')->nullable();
            $table->foreignId('destination_account_id')->nullable()->constrained('financial_accounts')->nullOnDelete();
            $table->enum('status', ['active', 'partially_paid', 'fully_paid', 'overdue', 'cancelled'])->default('active');
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('cancellation_reason')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_deleted')->default(false);
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
