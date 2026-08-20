export type LenderType = 'individual' | 'company' | 'bank' | 'other';
export type LoanStatus = 'active' | 'partially_paid' | 'fully_paid' | 'overdue' | 'cancelled';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque' | 'other';
export type AccountType = 'cash' | 'bank' | 'other';

export interface Lender {
    id: number;
    name: string;
    type: LenderType;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
    created_at: string;
}

export interface FinancialAccount {
    id: number;
    name: string;
    type: AccountType;
    account_number?: string | null;
    bank_name?: string | null;
    opening_balance: number;
    current_balance: number;
    is_active: boolean;
    ledger_entries?: LedgerEntry[];
}

export interface LoanPayment {
    id: number;
    loan_id: number;
    loan?: Loan;
    reference: string;
    payment_date: string;
    amount: number;
    payment_method: PaymentMethod;
    account_id: number;
    account?: FinancialAccount;
    transaction_reference?: string | null;
    notes?: string | null;
    attachment_path?: string | null;
    media_id?: number | null;
    media?: { id: number; display_name?: string | null; url: string; file_name: string } | null;
    is_reversed: boolean;
    reversed_at?: string | null;
    reversal_reason?: string | null;
    created_by?: number | null;
    creator?: { id: number; name: string };
    reverser?: { id: number; name: string };
    created_at: string;
}

export interface LedgerEntry {
    id: number;
    reference: string;
    transaction_date: string;
    account_id?: number | null;
    account?: FinancialAccount | null;
    debit: number;
    credit: number;
    transaction_type: string;
    description: string;
    created_at: string;
    creator?: { id: number; name: string };
}

export interface Loan {
    id: number;
    reference: string;
    user_id: number;
    lender_id: number;
    lender?: Lender;
    loan_date: string;
    original_amount: number;
    interest_rate: number;
    interest_amount: number;
    due_date?: string | null;
    payment_frequency: string;
    purpose?: string | null;
    notes?: string | null;
    attachment_path?: string | null;
    media_id?: number | null;
    media?: { id: number; display_name?: string | null; url: string; file_name: string } | null;
    destination_account_id?: number | null;
    destination_account?: FinancialAccount | null;
    status: LoanStatus;
    total_repaid: number;
    remaining_balance: number;
    repayment_progress: number;
    computed_status: LoanStatus;
    cancelled_at?: string | null;
    cancellation_reason?: string | null;
    creator?: { id: number; name: string };
    canceller?: { id: number; name: string };
    payments?: LoanPayment[];
    ledger_entries?: LedgerEntry[];
    created_at: string;
    updated_at: string;
}

export interface LoanStats {
    total_borrowed: number;
    total_repaid: number;
    total_outstanding: number;
    active_loans: number;
    cleared_loans: number;
    overdue_loans: number;
}
