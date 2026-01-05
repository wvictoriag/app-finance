import { supabase } from '../lib/supabase';

// Helper to update account balance (extracted to avoid 'this' context issues)
const updateAccountBalance = async (accountId, amountChange) => {
    if (!accountId) return;

    const { data: account, error: fetchError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', accountId)
        .single();

    if (fetchError) {
        console.error("Error fetching account for balance update:", fetchError);
        throw fetchError;
    }
    if (!account) throw new Error(`Account with ID ${accountId} not found`);

    const newBalance = Number(account.balance) + Number(amountChange);
    const { error: updateError } = await supabase
        .from('accounts')
        .update({
            balance: newBalance,
            last_update: new Date().toISOString()
        })
        .eq('id', accountId);

    if (updateError) {
        console.error("Error updating account balance:", updateError);
        throw updateError;
    }
};

export const api = {
    // Accounts
    getAccounts: async () => {
        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .order('name');
        if (error) throw error;
        return data || [];
    },

    createAccount: async (account) => {
        const { data, error } = await supabase
            .from('accounts')
            .insert([account])
            .select();
        if (error) throw error;
        return data;
    },

    updateAccount: async (id, updates) => {
        const { data, error } = await supabase
            .from('accounts')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data;
    },

    deleteAccount: async (id) => {
        const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Categories
    getCategories: async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('type', { ascending: false }) // Group by type loosely by order
            .order('name');
        if (error) throw error;
        return data || [];
    },

    createCategory: async (category) => {
        const { data, error } = await supabase
            .from('categories')
            .insert([category])
            .select();
        if (error) throw error;
        return data;
    },

    updateCategory: async (id, updates) => {
        const { data, error } = await supabase
            .from('categories')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) throw error;
        return data;
    },

    deleteCategory: async (id) => {
        const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Transactions
    getTransactions: async (limit = 50) => {
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

    addTransaction: async (transaction) => {
        const { data, error } = await supabase
            .from('transactions')
            .insert([transaction])
            .select();

        if (error) throw error;

        // Balance Logic
        if (transaction.destination_account_id) {
            // Transfer: Deduct from Source, Add to Destination
            await updateAccountBalance(transaction.account_id, -Math.abs(transaction.amount));
            await updateAccountBalance(transaction.destination_account_id, Math.abs(transaction.amount));
        } else {
            // Standard Income/Expense
            await updateAccountBalance(transaction.account_id, transaction.amount);
        }

        return data;
    },

    updateTransaction: async (id, updates) => {
        // 1. Fetch old transaction to reverse its effect
        const { data: oldTx, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Reverse Old Balance
        if (oldTx.destination_account_id) {
            // Reverse Transfer: Add back to Source, Remove from Destination
            await updateAccountBalance(oldTx.account_id, Math.abs(oldTx.amount));
            await updateAccountBalance(oldTx.destination_account_id, -Math.abs(oldTx.amount));
        } else {
            // Reverse Standard: Subtract the amount (if it was neg, we subtract neg = add)
            await updateAccountBalance(oldTx.account_id, -Number(oldTx.amount));
        }

        // 3. Update Transaction
        const { data, error } = await supabase
            .from('transactions')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) throw error;

        // 4. Apply New Balance
        const newTx = { ...oldTx, ...updates };

        if (newTx.destination_account_id) {
            await updateAccountBalance(newTx.account_id, -Math.abs(newTx.amount));
            await updateAccountBalance(newTx.destination_account_id, Math.abs(newTx.amount));
        } else {
            await updateAccountBalance(newTx.account_id, Number(newTx.amount));
        }

        return data;
    },

    deleteTransaction: async (id) => {
        // 1. Fetch to reverse
        const { data: oldTx, error: fetchError } = await supabase
            .from('transactions')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Reverse Balance
        if (oldTx.destination_account_id) {
            await updateAccountBalance(oldTx.account_id, Math.abs(oldTx.amount));
            await updateAccountBalance(oldTx.destination_account_id, -Math.abs(oldTx.amount));
        } else {
            await updateAccountBalance(oldTx.account_id, -Number(oldTx.amount));
        }

        // 3. Delete
        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Monthly Control / Budget View
    getTransactionsByMonth: async (month, year) => {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        // Get last day of month dynamically
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

    getTransactionSums: async () => {
        const { data, error } = await supabase
            .from('transactions')
            .select('amount, account_id, destination_account_id');

        if (error) throw error;

        const sums = {};
        data.forEach(tx => {
            const amt = Number(tx.amount);
            // Source account
            sums[tx.account_id] = (sums[tx.account_id] || 0) + (tx.destination_account_id ? -Math.abs(amt) : amt);
            // Destination account (if transfer)
            if (tx.destination_account_id) {
                sums[tx.destination_account_id] = (sums[tx.destination_account_id] || 0) + Math.abs(amt);
            }
        });
        return sums;
    }
};
