import React, { useState, useEffect, useMemo, lazy, Suspense, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    LogOut, Pencil, Trash2, ArrowRightLeft, Scale,
    Moon, Sun, LayoutGrid, BarChart3, PieChart,
    Plus, Settings, User as UserIcon, Loader2,
    RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle, X, ExternalLink, Info, HelpCircle
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions, useMonthlyTransactions } from '../hooks/useTransactions';
import { useTransactionSums } from '../hooks/useTransactionSums';
import { useCategories } from '../hooks/useCategories';
import toast from 'react-hot-toast';
import { RegionSelector } from '../components/RegionSelector';
import { useRegion } from '../contexts/RegionContext';

// Modular Components (Lazy loaded for better performance)
const AccountsPanel = lazy(() => import('../components/panels/AccountsPanel').then(m => ({ default: m.AccountsPanel })));
const TransactionsPanel = lazy(() => import('../components/panels/TransactionsPanel').then(m => ({ default: m.TransactionsPanel })));
const MonthlyControl = lazy(() => import('../components/panels/MonthlyControl').then(m => ({ default: m.MonthlyControl })));

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

const BreakdownModal = lazy(() => import('../components/modals/BreakdownModal').then(m => ({ default: m.BreakdownModal })));

import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { DashboardProvider, useDashboard } from '../contexts/DashboardContext';
import { DashboardUIProvider, useDashboardUI } from '../contexts/DashboardUIContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useModal } from '../contexts/ModalContext';
import { useDashboardModals } from '../hooks/useDashboardModals';
const HelpCenter = lazy(() => import('../components/help/HelpCenter').then(m => ({ default: m.HelpCenter })));
import { BottomNav } from '../components/navigation/BottomNav';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';

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

    const [showHelpModal, setShowHelpModal] = useState(false);

    // Calculate Runway (Financial Autonomy)
    const runwayData = useMemo(() => {
        if (transactions.length === 0) return { months: 0, burn: 0 };

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentExpenses = transactions.filter(tx =>
            new Date(tx.date) >= sixMonthsAgo &&
            Number(tx.amount) < 0 &&
            !tx.destination_account_id
        );

        if (recentExpenses.length === 0) return { months: 99, burn: 0 };

        const totalSpent = recentExpenses.reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

        // Find unique months in the transaction set to get a real average
        const uniqueMonths = new Set(recentExpenses.map(tx => tx.date.slice(0, 7))).size || 1;
        const averageBurn = totalSpent / uniqueMonths;

        // Liquidity: accounts that are not Receivable/Debt
        const liquidBalance = accounts
            .filter(a => !['Receivable', 'Payable', 'Credit', 'CreditLine'].includes(a.type))
            .reduce((sum, a) => sum + Number(a.balance), 0);

        const months = averageBurn > 0 ? (liquidBalance / averageBurn) : 99;

        return {
            months: Math.min(Math.round(months * 10) / 10, 99),
            burn: Math.round(averageBurn)
        };
    }, [transactions, accounts]);

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
        <div className="flex flex-col lg:flex-row min-h-[100dvh] bg-white dark:bg-carbon text-slate-900 dark:text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30">
            {/* Desktop Sidebar Navigation */}
            <nav className="premium-sidebar">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-12 shadow-xl shadow-blue-500/20">
                    <LayoutGrid className="text-white" size={24} />
                </div>

                <div className="flex flex-col gap-8">
                    <button onClick={() => setCurrentView('dashboard')} aria-label="Ver Dashboard" className={`p-3 rounded-xl transition-all duration-300 ${currentView === 'dashboard' ? 'bg-slate-100 dark:bg-white/5 text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <LayoutGrid size={22} aria-hidden="true" />
                    </button>
                    <button onClick={() => setCurrentView('projections')} aria-label="Ver Simulaciones y Proyecciones" className={`p-3 rounded-xl transition-all duration-300 ${currentView === 'projections' ? 'bg-slate-100 dark:bg-white/5 text-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <BarChart3 size={22} aria-hidden="true" />
                    </button>
                    <button onClick={() => setCurrentView('stats')} aria-label="Ver Estadísticas" className={`p-3 rounded-xl transition-all duration-300 ${currentView === 'stats' ? 'bg-slate-100 dark:bg-white/5 text-purple-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <PieChart size={22} aria-hidden="true" />
                    </button>
                    <button onClick={() => setCurrentView('calendar')} aria-label="Ver Calendario de transacciones" className={`p-3 rounded-xl transition-all duration-300 ${currentView === 'calendar' ? 'bg-slate-100 dark:bg-white/5 text-orange-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </button>
                    <button onClick={() => setCurrentView('goals')} aria-label="Ver Metas de ahorro" className={`p-3 rounded-xl transition-all duration-300 ${currentView === 'goals' ? 'bg-slate-100 dark:bg-white/5 text-pink-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}>
                        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-2c1 .5 1.6 1 2 1 2.2 0 4-1.8 4-5.6 0-1.1-.2-4.9-5-7.3l-1-.6c.3-1.2.9-3.5-3-3.6Z" /><path d="M6 14v4" /><path d="M10 13a2 2 0 1 0 4 0" /></svg>
                    </button>
                </div>

                <div className="mt-auto flex flex-col gap-6">
                    <button onClick={() => setDarkMode(!darkMode)} aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"} className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all">
                        {darkMode ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
                    </button>
                    <button onClick={() => setShowCategoryModal(true)} aria-label="Abrir ajustes de categorías" className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all">
                        <Settings size={20} aria-hidden="true" />
                    </button>
                    <button onClick={handleLogout} aria-label="Cerrar sesión" className="p-3 text-rose-500/50 hover:text-rose-500 transition-all">
                        <LogOut size={20} aria-hidden="true" />
                    </button>
                    <div className="flex flex-col items-center pb-4">
                        <span className="text-[7px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest leading-none">Global</span>
                        <span className="text-[8px] font-black text-blue-500 tracking-tighter">v3.9</span>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex-col lg:pl-24 overflow-hidden safe-area-bottom flex">
                <header className="flex flex-col lg:flex-row lg:items-center justify-between px-6 lg:px-10 py-6 lg:py-8 bg-white/50 dark:bg-transparent border-b border-slate-100 dark:border-white/5 gap-4 safe-area-top safe-area-left safe-area-right">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="fluid-text-2xl font-black text-slate-900 dark:text-white tracking-tighter truncate max-w-[200px] md:max-w-none">
                                {currentView === 'dashboard' ? 'Hola, ' + (user?.user_metadata?.alias || user?.email?.split('@')[0]) :
                                    currentView === 'projections' ? 'Simulaciones' : 'Estadísticas'}
                            </h1>
                            <div className={`h-2.5 w-2.5 rounded-full mt-1 shrink-0 ${connectionStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' :
                                connectionStatus === 'offline' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                    'bg-amber-500 animate-pulse'
                                }`} />
                        </div>
                        <p className="fluid-text-2xs font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Guapacha Intelligence <span className="text-slate-300 dark:text-slate-600 ml-1">v3.9 Stable</span></p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 lg:gap-8 overflow-visible relative">
                        <div className="flex flex-wrap items-center gap-4 lg:gap-8 overflow-visible scrollbar-hide">
                            <div className="flex flex-col shrink-0">
                                <div
                                    className="flex items-center gap-1.5 group cursor-pointer relative mb-0.5 hover:text-blue-500 transition-colors"
                                    onClick={openBreakdown}
                                    role="button"
                                    aria-label="Ver desglose de patrimonio"
                                    tabIndex={0}
                                    onKeyDown={(e) => e.key === 'Enter' && openBreakdown()}
                                >
                                    <span className="fluid-text-2xs font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-blue-500">Patrimonio Neto</span>
                                    <Info size={14} className="text-blue-600" aria-hidden="true" />
                                </div>
                                <span className="fluid-text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {formatCurrency(netWorth)}
                                </span>
                            </div>
                            <div className="flex flex-col shrink-0">
                                <span className="fluid-text-2xs font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Ingresos Mes</span>
                                <span className="fluid-text-xl font-black text-emerald-500 tracking-tighter">
                                    {formatCurrency(monthIncome)}
                                </span>
                            </div>
                            <div className="flex flex-col shrink-0">
                                <span className="fluid-text-2xs font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Gastos Mes</span>
                                <span className="fluid-text-xl font-black text-rose-500 tracking-tighter">
                                    {formatCurrency(monthExpenses)}
                                </span>
                            </div>
                            <div className="flex flex-col shrink-0 px-4 md:px-6 border-l border-slate-100 dark:border-white/5 bg-blue-50/20 dark:bg-white/5 py-2 rounded-2xl">
                                <div className="flex items-center gap-1.5 mb-0.5 group cursor-help relative">
                                    <span className="fluid-text-2xs font-black text-blue-500 uppercase tracking-[0.2em]">Autonomía</span>
                                    <span className="fluid-text-xs font-black text-slate-400 opacity-50">Runway</span>
                                    <div className="absolute top-full mt-2 left-0 bg-slate-900 text-white p-3 rounded-2xl text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-all z-[60] shadow-2xl w-48 pointer-events-none">
                                        Basado en un gasto promedio de <span className="text-emerald-400">{formatCurrency(runwayData.burn)}/mes</span> (últimos 6 meses).
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className={`fluid-text-xl font-black tracking-tighter ${runwayData.months < 3 ? 'text-rose-500' :
                                        runwayData.months < 6 ? 'text-amber-500' : 'text-blue-600'
                                        }`}>
                                        {runwayData.months}
                                    </span>
                                    <span className="fluid-text-xs font-black text-slate-400 uppercase">Meses</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 border-l border-slate-200 dark:border-white/5 pl-4 lg:pl-12 shrink-0">
                            <button
                                onClick={() => setShowHelpModal(true)}
                                aria-label="Abrir centro de ayuda"
                                className="w-10 h-10 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all group relative"
                            >
                                <HelpCircle size={20} aria-hidden="true" />
                                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] font-black py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-all pointer-events-none uppercase">Ayuda</span>
                            </button>
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

                <main className="flex-1 min-w-0 bg-white/50 dark:bg-transparent lg:overflow-hidden overflow-y-auto flex flex-col pt-4 relative">
                    <AnimatePresence mode="wait">
                        {currentView === 'dashboard' ? (
                            <motion.div
                                key="dashboard"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 grid grid-cols-1 lg:grid-cols-12 lg:overflow-hidden gap-0"
                            >
                                {/* Column 1: Accounts */}
                                <div className="lg:col-span-3 flex flex-col lg:overflow-hidden border-r border-slate-100 dark:border-white/5 min-h-[500px] lg:min-h-0">
                                    <ErrorBoundary>
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <AccountsPanel
                                                onAddAccount={handleAddAccount}
                                                onEditAccount={handleEditAccount}
                                                onReconcile={handleOpenReconcile}
                                            />
                                        </Suspense>
                                    </ErrorBoundary>
                                </div>

                                {/* Column 2: Monthly Control */}
                                <div className="lg:col-span-4 flex flex-col lg:overflow-hidden border-r border-slate-100 dark:border-white/5 min-h-[500px] lg:min-h-0">
                                    <ErrorBoundary>
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <MonthlyControl />
                                        </Suspense>
                                    </ErrorBoundary>
                                </div>

                                {/* Column 3: Transactions */}
                                <div className="lg:col-span-5 flex flex-col lg:overflow-hidden min-h-[500px] lg:min-h-0">
                                    <ErrorBoundary>
                                        <Suspense fallback={<LoadingSpinner />}>
                                            <TransactionsPanel
                                                onEdit={handleEditTransaction}
                                            />
                                        </Suspense>
                                    </ErrorBoundary>
                                    <button onClick={handleAddTransaction} aria-label="Agregar nueva transacción" className="fixed lg:absolute bottom-28 lg:bottom-10 right-6 lg:right-10 h-16 w-16 bg-accent-primary text-white rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30">
                                        <Plus size={32} strokeWidth={3} aria-hidden="true" />
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
                <Suspense fallback={null}>
                    <BreakdownModal
                        isOpen={isBreakdownOpen}
                        onClose={closeBreakdown}
                        data={breakdownData}
                    />
                </Suspense>
            </ErrorBoundary>

            {/* Help Center 2.0 */}
            <ErrorBoundary>
                <Suspense fallback={null}>
                    <HelpCenter
                        isOpen={showHelpModal}
                        onClose={() => setShowHelpModal(false)}
                    />
                </Suspense>
            </ErrorBoundary>

            {/* Mobile Bottom Navigation */}
            <BottomNav />

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
        </div>
    );
}
