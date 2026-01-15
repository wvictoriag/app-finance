import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Account } from '../types';

interface DashboardUIContextType {
    // Nav & View
    currentView: string;
    setCurrentView: (view: string) => void;

    // Month/Year Navigation
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;

    // Filters
    selectedAccount: Account | null;
    setSelectedAccount: (acc: Account | null) => void;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    filterType: string;
    setFilterType: (type: string) => void;

    // Advanced Filters
    dateRange: { from: string; to: string };
    setDateRange: (range: { from: string; to: string }) => void;
    filterCategory: string;
    setFilterCategory: (cat: string) => void;
    amountRange: { min: string; max: string };
    setAmountRange: (range: { min: string; max: string }) => void;
}

const DashboardUIContext = createContext<DashboardUIContextType | undefined>(undefined);

export const useDashboardUI = () => {
    const context = useContext(DashboardUIContext);
    if (!context) throw new Error('useDashboardUI must be used within a DashboardUIProvider');
    return context;
};

export const DashboardUIProvider = ({ children, initialView = 'dashboard' }: { children: ReactNode, initialView?: string }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentView, setCurrentView] = useState(initialView);

    // Date State - Derived from URL to prevent sync issues
    const paramsMonth = parseInt(searchParams.get('month') || '0', 10);
    const paramsYear = parseInt(searchParams.get('year') || '0', 10);

    const selectedDate = useMemo(() => {
        if (paramsMonth >= 1 && paramsMonth <= 12 && paramsYear > 1900) {
            return new Date(paramsYear, paramsMonth - 1, 1);
        }
        return new Date();
    }, [paramsMonth, paramsYear]);

    const setSelectedDate = (date: Date) => {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('month', (date.getMonth() + 1).toString());
        nextParams.set('year', date.getFullYear().toString());
        setSearchParams(nextParams, { replace: true });
    };

    // Filter States
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');

    // Advanced Filters State
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [filterCategory, setFilterCategory] = useState('');
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });

    // Sync State TO URL (only for non-essential UI filters)
    useEffect(() => {
        const nextParams = new URLSearchParams(searchParams);

        if (searchQuery) nextParams.set('q', searchQuery);
        else nextParams.delete('q');

        if (filterType !== 'all') nextParams.set('type', filterType);
        else nextParams.delete('type');

        if (selectedAccount) nextParams.set('account', selectedAccount.id);
        else nextParams.delete('account');

        if (nextParams.toString() !== searchParams.toString()) {
            setSearchParams(nextParams, { replace: true });
        }
    }, [searchQuery, filterType, selectedAccount]);

    return (
        <DashboardUIContext.Provider value={{
            currentView, setCurrentView,
            selectedDate, setSelectedDate,
            selectedAccount, setSelectedAccount,
            searchQuery, setSearchQuery,
            filterType, setFilterType,
            dateRange, setDateRange,
            filterCategory, setFilterCategory,
            amountRange, setAmountRange
        }}>
            {children}
        </DashboardUIContext.Provider>
    );
};
