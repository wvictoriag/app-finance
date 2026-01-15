import React, { createContext, useContext, useMemo, useEffect, ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions, useMonthlyTransactions } from '../hooks/useTransactions';
import { useTransactionSums } from '../hooks/useTransactionSums';
import { useCategories } from '../hooks/useCategories';
import type { Account, Category, Transaction, MonthlyControlItem } from '../types';
import { useDashboardUI } from './DashboardUIContext';

interface DashboardContextType {
    // Data
    accounts: Account[];
    transactions: Transaction[];
    categories: Category[];
    monthTx: Transaction[];
    transactionSums: Record<string, number>;
    monthlyControl: MonthlyControlItem[];
    filteredTransactions: Transaction[];
    monthIncome: number;
    monthExpenses: number;
    netWorth: number;

    // Loading States
    loadingAccs: boolean;
    loadingRecent: boolean;
    loadingCats: boolean;
    loadingMonth: boolean;
    loadingSums: boolean;

    // Mutations
    deleteAccount: (id: string) => Promise<boolean>;
    deleteTransaction: (id: string) => Promise<boolean>;
    deleteTransactions: (ids: string[]) => Promise<boolean>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) throw new Error('useDashboard must be used within a DashboardProvider');
    return context;
};

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
    const [searchParams] = useSearchParams();
    const {
        selectedDate,
        selectedAccount,
        setSelectedAccount,
        searchQuery,
        filterType,
        dateRange,
        filterCategory,
        amountRange
    } = useDashboardUI();

    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedYear = selectedDate.getFullYear();

    // TanStack Query Hooks
    const { accounts, isLoading: loadingAccs, deleteAccount } = useAccounts();
    const { transactions, isLoading: loadingRecent, deleteTransaction, deleteTransactions } = useTransactions(100);
    const { data: transactionSumsData, isLoading: loadingSums } = useTransactionSums();
    const { categories, isLoading: loadingCats } = useCategories();
    const { data: monthTx, isLoading: loadingMonth } = useMonthlyTransactions(selectedMonth, selectedYear);

    // Initial selectedAccount FROM URL (Only once on mount/accounts load)
    useEffect(() => {
        const accountId = searchParams.get('account');
        if (accountId && accounts.length > 0 && !selectedAccount) {
            const acc = accounts.find(a => a.id === accountId);
            if (acc) setSelectedAccount(acc);
        }
    }, [accounts, searchParams, setSelectedAccount, selectedAccount]);

    const transactionSums = transactionSumsData || {};

    const monthlyControl = useMemo((): MonthlyControlItem[] => {
        if (!categories || !monthTx) return [];
        const totals = (monthTx || []).reduce((acc: Record<string, number>, tx) => {
            if (tx.category_id) {
                acc[tx.category_id] = (acc[tx.category_id] || 0) + Number(tx.amount);
            }
            return acc;
        }, {});

        return categories.map(cat => ({
            ...cat,
            real: totals[cat.id] || 0,
            difference: (totals[cat.id] || 0) - (Number(cat.monthly_budget) || 0)
        }));
    }, [categories, monthTx]);

    const { monthIncome, monthExpenses } = useMemo(() => {
        if (!monthTx || !Array.isArray(monthTx)) return { monthIncome: 0, monthExpenses: 0 };
        return monthTx.reduce((acc, tx) => {
            const amt = Number(tx?.amount || 0);
            if (!tx?.destination_account_id) {
                if (amt > 0) acc.monthIncome += amt;
                else acc.monthExpenses += Math.abs(amt);
            }
            return acc;
        }, { monthIncome: 0, monthExpenses: 0 });
    }, [monthTx]);

    const netWorth = useMemo(() => {
        return accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
    }, [accounts]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const matchesSearch = (tx.description || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchesType = filterType === 'all' ||
                (filterType === 'income' && Number(tx.amount) > 0) ||
                (filterType === 'expense' && Number(tx.amount) < 0 && !tx.destination_account_id) ||
                (filterType === 'transfer' && tx.destination_account_id);
            const matchesAccount = !selectedAccount || tx.account_id === selectedAccount.id || tx.destination_account_id === selectedAccount.id;

            // Advanced Filters
            const matchesDate = (!dateRange.from || tx.date >= dateRange.from) && (!dateRange.to || tx.date <= dateRange.to);
            const matchesCategory = !filterCategory || tx.category_id === filterCategory;
            const matchesAmount = (!amountRange.min || Math.abs(Number(tx.amount)) >= Number(amountRange.min)) &&
                (!amountRange.max || Math.abs(Number(tx.amount)) <= Number(amountRange.max));

            return matchesSearch && matchesType && matchesAccount && matchesDate && matchesCategory && matchesAmount;
        });
    }, [transactions, searchQuery, filterType, selectedAccount, dateRange, filterCategory, amountRange]);

    const value = {
        accounts,
        transactions,
        categories,
        monthTx: monthTx || [],
        transactionSums,
        monthlyControl,
        filteredTransactions,
        monthIncome,
        monthExpenses,
        netWorth,
        loadingAccs,
        loadingRecent,
        loadingCats,
        loadingMonth,
        loadingSums,
        deleteAccount,
        deleteTransaction,
        deleteTransactions
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
