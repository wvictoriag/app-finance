import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

    // Date State
    const [selectedDate, setSelectedDate] = useState(() => {
        const m = parseInt(searchParams.get('month') || '0');
        const y = parseInt(searchParams.get('year') || '0');
        if (m > 0 && m <= 12 && y > 1900) return new Date(y, m - 1, 1);
        return new Date();
    });

    // Filter States
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [filterType, setFilterType] = useState(searchParams.get('type') || 'all');

    // Advanced Filters State
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [filterCategory, setFilterCategory] = useState('');
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });

    // Sync State TO URL
    useEffect(() => {
        const nextParams = new URLSearchParams(searchParams);

        if (searchQuery) nextParams.set('q', searchQuery);
        else nextParams.delete('q');

        if (filterType !== 'all') nextParams.set('type', filterType);
        else nextParams.delete('type');

        if (selectedAccount) nextParams.set('account', selectedAccount.id);
        else nextParams.delete('account');

        nextParams.set('month', (selectedDate.getMonth() + 1).toString());
        nextParams.set('year', selectedDate.getFullYear().toString());

        if (nextParams.toString() !== searchParams.toString()) {
            setSearchParams(nextParams, { replace: true });
        }
    }, [searchQuery, filterType, selectedAccount, selectedDate, setSearchParams, searchParams]);

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
