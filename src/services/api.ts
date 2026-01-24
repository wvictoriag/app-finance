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
        const now = new Date().toISOString();
        console.log(`[API] Updating account ${id} with last_update: ${now}`);
        const { data, error } = await supabase
            .from('accounts')
            .update({ ...updates, last_update: now })
            .eq('id', id)
            .select();
        if (error) {
            console.error(`[API] Error updating account ${id}:`, error);
            throw error;
        }
        console.log(`[API] Account ${id} updated successfully:`, data?.[0]?.last_update);
        return data || [];
    },

    deleteAccount: async (id: string): Promise<boolean> => {
        // Manual cascade for transactions if not handled by DB
        const { error: txError1 } = await supabase.from('transactions').delete().eq('account_id', id);
        const { error: txError2 } = await supabase.from('transactions').delete().eq('destination_account_id', id);

        if (txError1) throw txError1;
        if (txError2) throw txError2;

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

        // Force update last_update on account
        if (transaction.account_id) {
            await supabase.from('accounts').update({ last_update: new Date().toISOString() }).eq('id', transaction.account_id);
        }
        if (transaction.destination_account_id) {
            await supabase.from('accounts').update({ last_update: new Date().toISOString() }).eq('id', transaction.destination_account_id);
        }

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

        // Force update last_update on account
        if (data?.[0]?.account_id) {
            await supabase.from('accounts').update({ last_update: new Date().toISOString() }).eq('id', data[0].account_id);
        }
        if (data?.[0]?.destination_account_id) {
            await supabase.from('accounts').update({ last_update: new Date().toISOString() }).eq('id', data[0].destination_account_id);
        }

        return data || [];
    },

    deleteTransaction: async (id: string): Promise<boolean> => {
        // Fetch transaction first to know which accounts to update metadata for
        const { data: tx } = await supabase.from('transactions').select('account_id, destination_account_id').eq('id', id).single();

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;

        // Update accounts metadata
        if (tx?.account_id) {
            await supabase.from('accounts').update({ last_update: new Date().toISOString() }).eq('id', tx.account_id);
        }
        if (tx?.destination_account_id) {
            await supabase.from('accounts').update({ last_update: new Date().toISOString() }).eq('id', tx.destination_account_id);
        }

        return true;
    },

    deleteTransactions: async (ids: string[]): Promise<boolean> => {
        // Fetch transactions first to get affected accounts
        const { data: txs } = await supabase.from('transactions').select('account_id, destination_account_id').in('id', ids);

        const { error } = await supabase
            .from('transactions')
            .delete()
            .in('id', ids);

        if (error) throw error;

        // Collect unique account IDs
        const affectedAccounts = new Set<string>();
        txs?.forEach(tx => {
            if (tx.account_id) affectedAccounts.add(tx.account_id);
            if (tx.destination_account_id) affectedAccounts.add(tx.destination_account_id);
        });

        // Update all unique affected accounts
        const now = new Date().toISOString();
        for (const accountId of affectedAccounts) {
            await supabase.from('accounts').update({ last_update: now }).eq('id', accountId);
        }

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
