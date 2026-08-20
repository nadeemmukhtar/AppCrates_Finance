<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('salary_periods', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->smallInteger('salary_year');
            $table->tinyInteger('salary_month');
            $table->decimal('salary_amount', 15, 2);
            $table->enum('status', ['pending', 'partial', 'paid'])->default('pending');
            $table->boolean('is_deleted')->default(false);
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['employee_id', 'salary_year', 'salary_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('salary_periods');
    }
};
