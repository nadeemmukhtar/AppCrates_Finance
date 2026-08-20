<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('money_in_transactions', function (Blueprint $table) {
            $table->foreignId('media_id')->nullable()->after('attachment_path')->constrained('media')->nullOnDelete();
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->foreignId('media_id')->nullable()->after('attachment_path')->constrained('media')->nullOnDelete();
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->foreignId('media_id')->nullable()->after('attachment_path')->constrained('media')->nullOnDelete();
        });

        Schema::table('loan_repayments', function (Blueprint $table) {
            $table->foreignId('media_id')->nullable()->after('attachment_path')->constrained('media')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('money_in_transactions', function (Blueprint $table) {
            $table->dropForeign(['media_id']);
            $table->dropColumn('media_id');
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->dropForeign(['media_id']);
            $table->dropColumn('media_id');
        });

        Schema::table('loans', function (Blueprint $table) {
            $table->dropForeign(['media_id']);
            $table->dropColumn('media_id');
        });

        Schema::table('loan_repayments', function (Blueprint $table) {
            $table->dropForeign(['media_id']);
            $table->dropColumn('media_id');
        });
    }
};
