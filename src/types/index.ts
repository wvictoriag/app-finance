export type AccountType = 'Checking' | 'Vista' | 'Savings' | 'Credit' | 'CreditLine' | 'Cash' | 'Receivable' | 'Payable' | 'Investment' | 'Asset';

export interface Account {
    id: string;
    user_id: string;
    name: string;
    bank?: string;
    account_number?: string;
    type: AccountType;
    balance: number;
    credit_limit?: number;
    initial_balance?: number;
    last_update?: string;
    created_at?: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
    id: string;
    user_id: string;
    account_id: string;
    destination_account_id?: string | null;
    category_id?: string | null;
    amount: number;
    description?: string;
    date: string;
    tags?: string[] | null;
    created_at?: string;

    // Joined fields
    accounts?: { name: string };
    destination_account?: { name: string };
    categories?: {
        id: string;
        name: string;
        type: string;
        monthly_budget?: number;
    };
}

export type CategoryType = 'Ingresos' | 'Gastos Fijos' | 'Gastos Variables' | 'Ahorro';

export interface Category {
    id: string;
    user_id: string;
    name: string;
    type: CategoryType;
    monthly_budget: number;
    created_at?: string;
}

export interface MonthlyControlItem extends Category {
    real: number;
    difference: number;
}

export interface Goal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline?: string;
    color: string;
    icon: string;
    created_at?: string;
}
