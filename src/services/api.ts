import { supabase } from '../lib/supabase';
import type { Account, Transaction, Category } from '../types';

export const api = {
    // Accounts
    getAccounts: async (): Promise<Account[]> => {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .order('name');
        if (error) throw error;
        return data || [];
    },

    createAccount: async (account: Partial<Account>): Promise<Account[]> => {
        const { data, error } = await supabase
            .from('accounts')
            .insert([account])
            .select();
        if (error) throw error;
        return data || [];
    },

    updateAccount: async (id: string, updates: Partial<Account>): Promise<Account[]> => {
        const { data, error } = await supabase
            .from('accounts')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data || [];
    },

    deleteAccount: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Categories
    getCategories: async (): Promise<Category[]> => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('type', { ascending: false })
            .order('name');
        if (error) throw error;
        return data || [];
    },

    createCategory: async (category: Partial<Category>): Promise<Category[]> => {
        const { data, error } = await supabase
            .from('categories')
            .insert([category])
            .select();
        if (error) throw error;
        return data || [];
    },

    updateCategory: async (id: string, updates: Partial<Category>): Promise<Category[]> => {
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data || [];
    },

    deleteCategory: async (id: string): Promise<boolean> => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Transactions
    getTransactions: async (limit: number = 50): Promise<Transaction[]> => {
        const { data, error } = await supabase
            .from('transactions')
            .select(`
        *,
        accounts!transactions_account_id_fkey (name),
        destination_account:accounts!transactions_destination_account_id_fkey (name),
        categories (name, type)
      `)
            .order('date', { ascending: false })
            .limit(limit);
        if (error) throw error;
        return data || [];
    },

    addTransaction: async (transaction: Partial<Transaction>): Promise<Transaction[]> => {
        // Note: Balance logic is now handled by DB Triggers
        const { data, error } = await supabase
            .from('transactions')
            .insert([transaction])
            .select();

        if (error) throw error;
        return data || [];
    },

    updateTransaction: async (id: string, updates: Partial<Transaction>): Promise<Transaction[]> => {
        // Note: Balance logic is now handled by DB Triggers
        const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;
        return data || [];
    },

    deleteTransaction: async (id: string): Promise<boolean> => {
        // Note: Balance logic is now handled by DB Triggers
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Monthly Control / Budget View
    getTransactionsByMonth: async (month: number, year: number): Promise<Transaction[]> => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

        const { data, error } = await supabase
            .from('transactions')
            .select(`
        *,
        categories (id, name, type, monthly_budget)
      `)
            .gte('date', startDate)
            .lte('date', endDate);

        if (error) throw error;
        return data || [];
    },

    getTransactionSums: async (): Promise<Record<string, number>> => {
        const { data, error } = await supabase
            .from('transactions')
            .select('amount, account_id, destination_account_id');

        if (error) throw error;

        const sums: Record<string, number> = {};
        (data || []).forEach(tx => {
            const amt = Number(tx.amount);
            sums[tx.account_id] = (sums[tx.account_id] || 0) + (tx.destination_account_id ? -Math.abs(amt) : amt);
            if (tx.destination_account_id) {
                sums[tx.destination_account_id] = (sums[tx.destination_account_id] || 0) + Math.abs(amt);
            }
        });
        return sums;
    }
};
