import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    LogOut, Pencil, Trash2, ArrowRightLeft, Scale,
    Moon, Sun, LayoutGrid, BarChart3, PieChart,
    Plus, Settings, User as UserIcon, Loader2,
    RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle, X, ExternalLink, Info
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions, useMonthlyTransactions } from '../hooks/useTransactions';
import { useTransactionSums } from '../hooks/useTransactionSums';
import { useCategories } from '../hooks/useCategories';
import toast from 'react-hot-toast';
import { RegionSelector } from '../components/RegionSelector';
import { useRegion } from '../contexts/RegionContext';

// Modular Components
import { AccountsPanel } from '../components/panels/AccountsPanel';
import { TransactionsPanel } from '../components/panels/TransactionsPanel';
import { MonthlyControl } from '../components/panels/MonthlyControl';
import type { Account, Category, Transaction, MonthlyControlItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

// Lazy-loaded Views (Code Splitting)
const ProjectionsView = lazy(() => import('./ProjectionsView'));
const CalendarView = lazy(() => import('../components/views/CalendarView').then(m => ({ default: m.CalendarView })));
const SavingsGoals = lazy(() => import('../components/views/SavingsGoals').then(m => ({ default: m.SavingsGoals })));
const StatsOverview = lazy(() => import('../components/charts/StatsOverview').then(m => ({ default: m.StatsOverview })));

// Lazy-loaded Modals
const TransactionModal = lazy(() => import('../components/modals/TransactionModal').then(m => ({ default: m.TransactionModal })));
const AccountModal = lazy(() => import('../components/modals/AccountModal').then(m => ({ default: m.AccountModal })));
const CategoryModal = lazy(() => import('../components/modals/CategoryModal').then(m => ({ default: m.CategoryModal })));
const ReconcileModal = lazy(() => import('../components/modals/ReconcileModal').then(m => ({ default: m.ReconcileModal })));

import { BreakdownModal } from '../components/modals/BreakdownModal';

import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardProvider, useDashboard } from '../contexts/DashboardContext';
import { DashboardUIProvider, useDashboardUI } from '../contexts/DashboardUIContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useModal } from '../contexts/ModalContext';
import { useDashboardModals } from '../hooks/useDashboardModals';

export default function Dashboard({ view = 'dashboard' }: { view?: string }) {
    return (
        <DashboardUIProvider initialView={view}>
            <DashboardProvider>
                <DashboardContent />
            </DashboardProvider>
        </DashboardUIProvider>
    );
}

function DashboardContent() {
    const { user } = useAuth();
    const { settings } = useRegion();
    const {
        currentView, setCurrentView,
        selectedDate, setSelectedDate,
        selectedAccount, setSelectedAccount,
        searchQuery, setSearchQuery,
        filterType, setFilterType,
        dateRange, setDateRange,
        filterCategory, setFilterCategory,
        amountRange, setAmountRange
    } = useDashboardUI();

    const {
        accounts, loadingAccs, deleteAccount,
        transactions, loadingRecent, deleteTransaction,
        categories, loadingCats,
        loadingMonth,
        transactionSums,
        monthlyControl,
        filteredTransactions,
        monthIncome, monthExpenses, netWorth
    } = useDashboard();

    const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    // Phase 3 Improvements: Centralized Modal Management & Memoization
    const { openBreakdown, isBreakdownOpen, closeBreakdown } = useModal();
    const {
        showTransactionModal, showAccountModal, showCategoryModal, showReconcileModal,
        editingTransaction, editingAccount, editingCategory, reconcilingAccount,
        handleAddTransaction, handleEditTransaction, handleAddAccount, handleEditAccount,
        handleOpenReconcile, handleAddCategory, handleEditCategory, closeAllModals,
        setShowCategoryModal, setEditingCategory
    } = useDashboardModals();

    const breakdownData = useMemo(() => ({
        liquid: accounts.filter(a => ['Checking', 'Vista', 'Savings', 'Cash', 'Investment', 'Asset'].includes(a.type)).reduce((s, a) => s + Number(a.balance), 0),
        receivable: accounts.filter(a => a.type === 'Receivable').reduce((s, a) => s + Number(a.balance), 0),
        debt: accounts.filter(a => ['Payable', 'Credit', 'CreditLine'].includes(a.type)).reduce((s, a) => s + Number(a.balance), 0),
        total: netWorth
    }), [accounts, netWorth]);

    // Keyboard Shortcuts
    const shortcuts = useMemo(() => ({
        'n': handleAddTransaction,
        'a': handleAddAccount,
        'c': handleAddCategory,
        '/': () => {
            const searchInput = document.querySelector('input[placeholder="Buscar..."]') as HTMLInputElement;
            searchInput?.focus();
        },
        'Escape': () => {
            closeAllModals();
            closeBreakdown();
        }
    }), [handleAddTransaction, handleAddAccount, handleAddCategory, closeAllModals, closeBreakdown]);

    useKeyboardShortcuts(shortcuts);

    // Dark Mode
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        if (darkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [darkMode]);

    // Connection check
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const { error } = await supabase.from('accounts').select('id').limit(1);
                setConnectionStatus(error ? 'offline' : 'online');
            } catch {
                setConnectionStatus('offline');
            }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleSelectAccount = useCallback((acc: Account) => setSelectedAccount(selectedAccount?.id === acc.id ? null : acc), [selectedAccount, setSelectedAccount]);
    const handleLogout = useCallback(async () => { await supabase.auth.signOut(); }, []);


    if (loadingAccs && accounts.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Sincronizando tus finanzas...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-white dark:bg-carbon text-slate-900 dark:text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30">
            {/* Nav */}
            <nav className="fixed bottom-0 left-0 w-full lg:relative lg:w-24 bg-white dark:bg-carbon border-t lg:border-t-0 lg:border-r border-slate-100 dark:border-white/5 flex lg:flex-col items-center justify-around lg:justify-start py-4 lg:py-10 lg:gap-10 z-30 shrink-0">
                <div className="hidden lg:flex w-10 h-10 bg-accent-primary rounded-xl items-center justify-center shadow-things hover:scale-105 transition-all cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
                    <LayoutGrid size={20} className="text-white" />
                </div>
                <div className="flex lg:flex-col gap-2 lg:gap-6">
                    <button onClick={() => setCurrentView('dashboard')} className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'bg-slate-100 dark:bg-white/5 text-accent-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <LayoutGrid size={22} />
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-tighter">Inicio</span>
                    </button>
                    <button onClick={() => setCurrentView('projections')} className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentView === 'projections' ? 'bg-slate-100 dark:bg-white/5 text-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <BarChart3 size={22} />
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-tighter">Simula</span>
                    </button>


                    <button onClick={() => setCurrentView('stats')} className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentView === 'stats' ? 'bg-slate-100 dark:bg-white/5 text-purple-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <PieChart size={22} />
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-tighter">Stats</span>
                    </button>
                    <button onClick={() => setCurrentView('calendar')} className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentView === 'calendar' ? 'bg-slate-100 dark:bg-white/5 text-orange-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-tighter">Agenda</span>
                    </button>
                    <button onClick={() => setCurrentView('goals')} className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentView === 'goals' ? 'bg-slate-100 dark:bg-white/5 text-pink-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-2c1 .5 1.6 1 2 1 2.2 0 4-1.8 4-5.6 0-1.1-.2-4.9-5-7.3l-1-.6c.3-1.2.9-3.5-3-3.6Z" /><path d="M6 14v4" /><path d="M10 13a2 2 0 1 0 4 0" /></svg>
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-tighter">Metas</span>
                    </button>
                </div>
                <div className="flex lg:flex-col lg:mt-auto gap-2 lg:gap-6">
                    <button onClick={() => setDarkMode(!darkMode)} className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all flex flex-col items-center gap-1">
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-tighter">Modo</span>
                    </button>
                    <button onClick={() => setShowCategoryModal(true)} className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all flex flex-col items-center gap-1">
                        <Settings size={20} />
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-tighter">Ajustes</span>
                    </button>
                    <button onClick={handleLogout} className="p-3 text-rose-500/50 hover:text-rose-500 transition-all flex flex-col items-center gap-1">
                        <LogOut size={20} />
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-tighter">Salir</span>
                    </button>
                </div>
            </nav>

            <div className="flex-1 flex flex-col overflow-hidden pb-20 lg:pb-0">
                <header className="flex flex-col lg:flex-row lg:items-center justify-between px-4 lg:px-10 py-4 lg:py-8 bg-white/50 dark:bg-transparent border-b border-slate-100 dark:border-white/5 gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter truncate max-w-[200px] md:max-w-none">
                                {currentView === 'dashboard' ? 'Hola, ' + (user?.user_metadata?.alias || user?.email?.split('@')[0]) :
                                    currentView === 'projections' ? 'Simulaciones' : 'Estadísticas'}
                            </h1>
                            <div className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${connectionStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' :
                                connectionStatus === 'offline' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                    'bg-amber-500 animate-pulse'
                                }`} />
                        </div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Guapacha Intelligence <span className="text-emerald-500 ml-1">v2.1 Canary</span></p>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-12 overflow-visible relative">
                        <div className="flex items-center gap-4 lg:gap-12 overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                            <div className="flex flex-col shrink-0">
                                <div
                                    className="flex items-center gap-1.5 group cursor-pointer relative mb-0.5 hover:text-blue-500 transition-colors"
                                    onClick={openBreakdown}
                                >
                                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-500">Patrimonio Neto</span>
                                    <Info size={14} className="text-blue-600" />
                                </div>
                                <span className="text-base md:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {formatCurrency(netWorth)}
                                </span>
                            </div>
                            <div className="flex flex-col shrink-0">
                                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Ingresos Mes</span>
                                <span className="text-base md:text-lg lg:text-xl font-black text-emerald-500 tracking-tighter">
                                    {formatCurrency(monthIncome)}
                                </span>
                            </div>
                            <div className="flex flex-col shrink-0">
                                <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Gastos Mes</span>
                                <span className="text-base md:text-lg lg:text-xl font-black text-rose-500 tracking-tighter">
                                    {formatCurrency(monthExpenses)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-white/5 pl-4 lg:pl-12 shrink-0">
                            <RegionSelector />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block group-hover:underline decoration-2 underline-offset-4">Salir</span>
                                <LogOut size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 min-w-0 bg-white/50 dark:bg-transparent overflow-hidden flex flex-col pt-4 relative">
                    <AnimatePresence mode="wait">
                        {currentView === 'dashboard' ? (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden gap-0"
                            >
                                {/* Column 1: Accounts */}
                                <div className="lg:col-span-3 flex flex-col overflow-hidden border-r border-slate-100 dark:border-white/5">
                                    <AccountsPanel
                                        onAddAccount={handleAddAccount}
                                        onEditAccount={handleEditAccount}
                                        onReconcile={handleOpenReconcile}
                                    />
                                </div>

                                {/* Column 2: Monthly Control */}
                                <div className="lg:col-span-4 flex flex-col overflow-hidden border-r border-slate-100 dark:border-white/5">
                                    <MonthlyControl />
                                </div>

                                {/* Column 3: Transactions */}
                                <div className="lg:col-span-5 flex flex-col overflow-hidden">
                                    <TransactionsPanel
                                        onEdit={handleEditTransaction}
                                    />
                                    <button onClick={handleAddTransaction} className="absolute bottom-10 right-10 h-16 w-16 bg-accent-primary text-white rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30">
                                        <Plus size={32} strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        ) : currentView === 'projections' ? (
                            <motion.div
                                key="projections"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900/50"
                            >
                                <ErrorBoundary>
                                    <Suspense fallback={<LoadingSpinner />}>
                                        <ProjectionsView
                                            transactions={transactions}
                                            accounts={accounts}
                                            categories={categories}
                                        />
                                    </Suspense>
                                </ErrorBoundary>
                            </motion.div>
                        ) : currentView === 'calendar' ? (
                            <motion.div
                                key="calendar"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 overflow-hidden"
                            >
                                <ErrorBoundary>
                                    <Suspense fallback={<LoadingSpinner />}>
                                        <CalendarView
                                            transactions={filteredTransactions}
                                        />
                                    </Suspense>
                                </ErrorBoundary>
                            </motion.div>
                        ) : currentView === 'goals' ? (
                            <motion.div
                                key="goals"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 overflow-hidden bg-slate-50 dark:bg-slate-900/50"
                            >
                                <ErrorBoundary>
                                    <Suspense fallback={<LoadingSpinner />}>
                                        <SavingsGoals />
                                    </Suspense>
                                </ErrorBoundary>
                            </motion.div>
                        ) : currentView === 'stats' ? (
                            <motion.div
                                key="stats"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 overflow-hidden"
                            >
                                <ErrorBoundary>
                                    <Suspense fallback={<LoadingSpinner />}>
                                        <StatsOverview
                                            transactions={transactions}
                                            categories={categories}
                                        />
                                    </Suspense>
                                </ErrorBoundary>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </main>
            </div >

            {/* Transaction Modal */}
            <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                    <TransactionModal
                        isOpen={showTransactionModal}
                        onClose={closeAllModals}
                        editingTransaction={editingTransaction}
                    />
                </Suspense>
            </ErrorBoundary>

            {/* Account Modal */}
            <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                    <AccountModal
                        isOpen={showAccountModal}
                        onClose={closeAllModals}
                        editingAccount={editingAccount}
                    />
                </Suspense>
            </ErrorBoundary>

            {/* Category Modal */}
            <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                    <CategoryModal
                        isOpen={showCategoryModal}
                        onClose={closeAllModals}
                        editingCategory={editingCategory}
                        setEditingCategory={setEditingCategory}
                    />
                </Suspense>
            </ErrorBoundary>

            {/* Quick Reconcile Modal */}
            <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                    <ReconcileModal
                        isOpen={showReconcileModal}
                        onClose={closeAllModals}
                        account={reconcilingAccount}
                    />
                </Suspense>
            </ErrorBoundary>
            {/* Breakdown Modal */}
            <ErrorBoundary>
                <BreakdownModal
                    isOpen={isBreakdownOpen}
                    onClose={closeBreakdown}
                    data={breakdownData}
                />
            </ErrorBoundary>
        </div>
    );
}
