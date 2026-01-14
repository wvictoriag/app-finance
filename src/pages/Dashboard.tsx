import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    LogOut, Pencil, Trash2, ArrowRightLeft, Scale,
    Moon, Sun, LayoutGrid, BarChart3, PieChart,
    Plus, Settings, User as UserIcon, Loader2,
    RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle, X, ExternalLink
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, accountSchema, categorySchema, type TransactionFormData, type AccountFormData, type CategoryFormData } from '../lib/schemas';
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
import ProjectionsView from './ProjectionsView';
import { StatsOverview } from '../components/charts/StatsOverview';
import { CalendarView } from '../components/views/CalendarView';
import { SavingsGoals } from '../components/views/SavingsGoals';
import type { Account, Category, Transaction, MonthlyControlItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard({ view = 'dashboard' }: { view?: string }) {
    const { user } = useAuth();
    const { settings } = useRegion();
    const [currentView, setCurrentView] = useState(view);
    const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    // Month/Year Navigation
    const [selectedDate, setSelectedDate] = useState(new Date());
    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedYear = selectedDate.getFullYear();

    // TanStack Query Hooks
    const { accounts, isLoading: loadingAccs, createAccount, updateAccount, deleteAccount } = useAccounts();
    const { transactions, isLoading: loadingRecent, addTransaction, updateTransaction, deleteTransaction } = useTransactions(100);
    const { data: transactionSumsData, isLoading: loadingSums } = useTransactionSums();
    const { categories, isLoading: loadingCats, createCategory, updateCategory, deleteCategory } = useCategories();
    const { data: monthTx, isLoading: loadingMonth } = useMonthlyTransactions(selectedMonth, selectedYear);

    // Local UI State
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [showReconcileModal, setShowReconcileModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [reconcilingAccount, setReconcilingAccount] = useState<Account | null>(null);
    const [reconcileValue, setReconcileValue] = useState<string>('');
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Forms
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            amount: 0
        }
    });

    const { register: regAcc, handleSubmit: handleAccSubmit, reset: resetAcc, formState: { errors: errorsAcc } } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema) as any
    });

    const { register: regCat, handleSubmit: handleCatSubmit, reset: resetCat, formState: { errors: errorsCat } } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema) as any
    });

    const txType = watch('type');

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

    // Advanced Filters State
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [filterCategory, setFilterCategory] = useState('');
    const [amountRange, setAmountRange] = useState({ min: '', max: '' });

    const filteredTransactions = useMemo(() => {
        return transactions.filter(tx => {
            const s = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                tx.description?.toLowerCase().includes(s) ||
                tx.categories?.name?.toLowerCase().includes(s) ||
                tx.accounts?.name?.toLowerCase().includes(s);

            const matchesType = filterType === 'all' ||
                (filterType === 'income' && Number(tx.amount) > 0 && !tx.destination_account_id) ||
                (filterType === 'expense' && Number(tx.amount) < 0 && !tx.destination_account_id) ||
                (filterType === 'transfer' && tx.destination_account_id);

            const matchesAccount = !selectedAccount ||
                tx.account_id === selectedAccount.id ||
                tx.destination_account_id === selectedAccount.id;

            // Advanced Filters
            const txDate = tx.date;
            const matchesDate = (!dateRange.from || txDate >= dateRange.from) &&
                (!dateRange.to || txDate <= dateRange.to);

            const matchesCategory = !filterCategory || tx.category_id === filterCategory;

            const absAmount = Math.abs(Number(tx.amount));
            const matchesAmount = (!amountRange.min || absAmount >= Number(amountRange.min)) &&
                (!amountRange.max || absAmount <= Number(amountRange.max));

            return matchesSearch && matchesType && matchesAccount && matchesDate && matchesCategory && matchesAmount;
        });
    }, [transactions, searchQuery, filterType, selectedAccount, dateRange, filterCategory, amountRange]);

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

    // Selection handlers
    useEffect(() => { setCurrentView(view); }, [view]);

    const handleReconcile = async () => {
        if (!reconcilingAccount || reconcileValue === '') return;
        try {
            await updateAccount({
                id: reconcilingAccount.id,
                updates: { balance: Number(reconcileValue) } as any
            });
            setShowReconcileModal(false);
            setReconcilingAccount(null);
            setReconcileValue('');
            toast.success('Saldo reconciliado');
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const handleLogout = async () => { await supabase.auth.signOut(); };

    const handleOpenAddModal = () => {
        setEditingTransaction(null);
        reset({
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            amount: 0,
            account_id: '',
            category_id: '',
            description: ''
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (tx: Transaction) => {
        setEditingTransaction(tx);
        let type: 'income' | 'expense' | 'transfer' = 'expense';
        if (tx.destination_account_id) type = 'transfer';
        else if (Number(tx.amount) > 0) type = 'income';

        reset({
            account_id: tx.account_id,
            destination_account_id: tx.destination_account_id || '',
            date: tx.date,
            category_id: tx.category_id || '',
            amount: Math.abs(tx.amount),
            description: tx.description || '',
            type: type
        });
        setShowModal(true);
    };

    const onSubmitTransaction = handleSubmit(async (data: TransactionFormData) => {
        try {
            let finalAmount = Math.abs(data.amount);
            if (data.type === 'expense' || data.type === 'transfer') {
                finalAmount = -finalAmount;
            }

            const payload = {
                account_id: data.account_id,
                date: data.date,
                amount: finalAmount,
                description: data.description,
                category_id: data.type === 'transfer' ? null : data.category_id,
                destination_account_id: data.type === 'transfer' ? data.destination_account_id : null
            };

            if (editingTransaction) {
                await updateTransaction({ id: editingTransaction.id, updates: payload });
                toast.success('Transacción actualizada');
            } else {
                await addTransaction(payload);

                // 4x1000 Tax Logic (Colombia Only)
                if (settings.countryCode === 'CO' && (data.type === 'expense' || data.type === 'transfer')) {
                    const sourceAccount = accounts.find(a => a.id === data.account_id);
                    if (sourceAccount && !sourceAccount.is_tax_exempt) {
                        const taxAmount = Math.round(Number(Math.abs(data.amount)) * 0.004);
                        if (taxAmount > 0) {
                            await addTransaction({
                                account_id: data.account_id,
                                date: data.date,
                                amount: -taxAmount,
                                description: 'Impuesto GMF (4x1000)',
                                category_id: categories.find(c => c.name.includes('Gastos Fijos') || c.type === 'Gastos Fijos')?.id,
                                destination_account_id: null
                            });
                            toast('Impuesto 4x1000 aplicado', { icon: '💸' });
                        }
                    }
                }

                toast.success('Transacción creada');
            }

            setShowModal(false);
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        }
    });


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
                <header className="flex flex-col lg:flex-row lg:items-center justify-between px-6 lg:px-10 py-6 lg:py-8 bg-white/50 dark:bg-transparent border-b border-slate-100 dark:border-white/5 gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                                {currentView === 'dashboard' ? 'Hola, ' + (user?.user_metadata?.alias || user?.email?.split('@')[0]) :
                                    currentView === 'projections' ? 'Simulaciones' : 'Estadísticas'}
                            </h1>
                            <div className={`h-2.5 w-2.5 rounded-full mt-1 ${connectionStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' :
                                connectionStatus === 'offline' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                    'bg-amber-500 animate-pulse'
                                }`} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Guapacha Finance Intelligence <span className="text-emerald-500 ml-2">v2.0</span></p>
                    </div>

                    <div className="flex items-center gap-6 lg:gap-12">
                        <div className="flex items-center gap-6 lg:gap-12 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                            <div className="flex flex-col shrink-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Patrimonio Neto</span>
                                <span className="text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {formatCurrency(accounts.reduce((sum, acc) => sum + Number(acc.balance), 0))}
                                </span>
                            </div>
                            <div className="flex flex-col shrink-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Ingresos Mes</span>
                                <span className="text-lg lg:text-xl font-black text-emerald-500 tracking-tighter">
                                    {formatCurrency(monthTx?.filter(tx => Number(tx.amount) > 0 && !tx.destination_account_id).reduce((sum, tx) => sum + Number(tx.amount), 0) || 0)}
                                </span>
                            </div>
                            <div className="flex flex-col shrink-0">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Gastos Mes</span>
                                <span className="text-lg lg:text-xl font-black text-rose-500 tracking-tighter">
                                    {formatCurrency(Math.abs(monthTx?.filter(tx => Number(tx.amount) < 0 && !tx.destination_account_id).reduce((sum, tx) => sum + Number(tx.amount), 0) || 0))}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 border-l border-slate-200 dark:border-white/5 pl-6 lg:pl-12">
                            <RegionSelector />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 text-slate-400 hover:text-rose-500 transition-colors group"
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block group-hover:underline decoration-2 underline-offset-4">Cerrar Sesión</span>
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
                                        accounts={accounts}
                                        transactionSums={transactionSums}
                                        selectedAccountId={selectedAccount?.id}
                                        onAddAccount={() => setShowAccountModal(true)}
                                        onSelectAccount={(acc) => setSelectedAccount(selectedAccount?.id === acc.id ? null : acc)}
                                        onEditAccount={(acc: Account) => { setEditingAccount(acc); resetAcc(acc as any); setShowAccountModal(true); }}
                                        onDeleteAccount={deleteAccount}
                                        onReconcile={(acc) => { setReconcilingAccount(acc); setReconcileValue(acc.balance.toString()); setShowReconcileModal(true); }}
                                    />
                                </div>

                                {/* Column 2: Monthly Control */}
                                <div className="lg:col-span-4 flex flex-col overflow-hidden border-r border-slate-100 dark:border-white/5">
                                    <MonthlyControl
                                        monthlyControl={monthlyControl}
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                    />
                                </div>

                                {/* Column 3: Transactions */}
                                <div className="lg:col-span-5 flex flex-col overflow-hidden">
                                    <TransactionsPanel
                                        transactions={filteredTransactions}
                                        selectedAccount={selectedAccount}
                                        categories={categories}
                                        onClearAccountFilter={() => setSelectedAccount(null)}
                                        onEdit={(tx: Transaction) => {
                                            setEditingTransaction(tx);
                                            reset({
                                                ...tx,
                                                category_id: tx.category_id || undefined,
                                                destination_account_id: tx.destination_account_id || undefined
                                            });
                                            setShowModal(true);
                                        }}
                                        onDelete={deleteTransaction}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        filterType={filterType}
                                        setFilterType={setFilterType}

                                        // Advanced Filter Props
                                        dateRange={dateRange}
                                        setDateRange={setDateRange}
                                        filterCategory={filterCategory}
                                        setFilterCategory={setFilterCategory}
                                        amountRange={amountRange}
                                        setAmountRange={setAmountRange}
                                    />
                                    <button onClick={() => { setEditingTransaction(null); reset({ date: new Date().toISOString().split('T')[0], type: 'expense', amount: 0 }); setShowModal(true); }} className="absolute bottom-10 right-10 h-16 w-16 bg-accent-primary text-white rounded-full shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30">
                                        <Plus size={32} strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        ) : currentView === 'projections' ? (
                            <motion.div
                                key="projections"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 overflow-hidden"
                            >
                                <ProjectionsView
                                    transactions={transactions}
                                    accounts={accounts}
                                    categories={categories}
                                />
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
                                <CalendarView
                                    transactions={filteredTransactions}
                                />
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
                                <SavingsGoals />
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
                                <StatsOverview
                                    transactions={transactions}
                                    categories={categories}
                                />
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </main>
            </div>

            {/* Transaction Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingTransaction ? 'Editar' : 'Nueva'} Transacción</h3>
                            <button onClick={() => setShowModal(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full">✕</button>
                        </div>
                        <form onSubmit={onSubmitTransaction} className="space-y-4">
                            <select {...register('account_id')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3">
                                <option value="">Cuenta...</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                            {errors.account_id && <p className="text-rose-500 text-[10px] uppercase font-bold px-2">{errors.account_id.message}</p>}

                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" {...register('date')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" />
                                <select {...register('type')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3">
                                    <option value="expense">Egreso</option>
                                    <option value="income">Ingreso</option>
                                    <option value="transfer">Transferencia</option>
                                </select>
                            </div>

                            {txType === 'transfer' ? (
                                <select {...register('destination_account_id')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3">
                                    <option value="">Cuenta Destino...</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            ) : (
                                <select {...register('category_id')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3">
                                    <option value="">Categoría...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}

                            <input type="number" step="any" {...register('amount')} placeholder="Monto" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-4 text-xl font-bold" />
                            {errors.amount && <p className="text-rose-500 text-[10px] uppercase font-bold px-2">{errors.amount.message}</p>}

                            <input {...register('description')} placeholder="Descripción" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" />

                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95">Guardar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Account Modal */}
            {showAccountModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingAccount ? 'Editar' : 'Nueva'} Cuenta</h3>
                            <button onClick={() => { setShowAccountModal(false); setEditingAccount(null); }} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
                        </div>
                        <form onSubmit={handleAccSubmit(async (data: AccountFormData) => {
                            try {
                                if (editingAccount) await updateAccount({ id: editingAccount.id, updates: data });
                                else await createAccount(data);
                                setShowAccountModal(false);
                                setEditingAccount(null);
                                toast.success('Cuenta guardada');
                            } catch (err: any) { toast.error(err.message); }
                        })} className="space-y-4">
                            <input {...regAcc('name')} placeholder="Nombre Cuenta" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" />
                            {errorsAcc.name && <p className="text-rose-500 text-[10px] uppercase font-bold px-2">{errorsAcc.name.message}</p>}
                            <div className="grid grid-cols-2 gap-4">
                                <input {...regAcc('bank')} placeholder="Banco" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" />
                                <input {...regAcc('account_number')} placeholder="N° Cuenta" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" />
                            </div>

                            {/* Tax Exemption (CO) */}
                            {settings.countryCode === 'CO' && (
                                <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 mb-4">
                                    <input type="checkbox" id="is_tax_exempt" {...regAcc('is_tax_exempt')} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                                    <label htmlFor="is_tax_exempt" className="text-xs font-bold text-indigo-700 dark:text-indigo-400 select-none cursor-pointer">Cuenta Exenta 4x1000</label>
                                </div>
                            )}

                            <select {...regAcc('type')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm">
                                <option value="Checking">Cuenta Corriente (CC)</option>
                                <option value="Vista">Cuenta Vista (CV)</option>
                                <option value="Savings">Cuenta de Ahorros (CA)</option>
                                <option value="Credit">Tarjeta de Crédito (TC)</option>
                                <option value="CreditLine">Línea de Crédito (LC)</option>
                                <option value="Cash">Efectivo</option>
                                <option value="Receivable">Cuenta por Cobrar</option>
                                <option value="Payable">Cuenta por Pagar</option>
                                <option value="Investment">Inversión (Acciones/Crypto)</option>
                                <option value="Asset">Activo (Vehículo/Propiedad)</option>
                            </select>
                            {errorsAcc.type && <p className="text-rose-500 text-[10px] uppercase font-bold px-2">{errorsAcc.type.message}</p>}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Saldo Inicial</label>
                                    <input {...regAcc('initial_balance')} type="number" step="any" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Saldo Actual</label>
                                    <input {...regAcc('balance')} type="number" step="any" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all">Guardar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gestionar Categorías</h3>
                            <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center">✕</button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            <div className="flex-1 overflow-y-auto p-4 border-r border-slate-100 dark:border-slate-700 space-y-4">
                                {['Ingresos', 'Gastos Fijos', 'Gastos Variables', 'Ahorro'].map(type => (
                                    <div key={type}>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">{type}</h4>
                                        <div className="grid grid-cols-1 gap-1">
                                            {categories.filter(c => c.type === type).map(cat => (
                                                <button key={cat.id} onClick={() => { setEditingCategory(cat); }} className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all flex justify-between items-center ${editingCategory?.id === cat.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                    <span>{cat.name}</span>
                                                    <span className="text-[10px] opacity-70">{formatCurrency(cat.monthly_budget)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="w-full md:w-80 p-6 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">{editingCategory ? 'Editar' : 'Nueva'} Categoría</h4>
                                <form onSubmit={handleCatSubmit(async (data: CategoryFormData) => {
                                    try {
                                        let b = data.monthly_budget;
                                        if (['Gastos Fijos', 'Gastos Variables', 'Ahorro'].includes(data.type)) b = -Math.abs(b);
                                        const payload = { ...data, monthly_budget: b };

                                        if (editingCategory) await updateCategory({ id: editingCategory.id, updates: payload });
                                        else await createCategory(payload);
                                        setEditingCategory(null);
                                        resetCat();
                                        toast.success('Categoría guardada');
                                    } catch (err: any) { toast.error(err.message); }
                                })} className="space-y-4">
                                    <input {...regCat('name')} placeholder="Nombre" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm" />
                                    {errorsCat.name && <p className="text-rose-500 text-[10px] uppercase font-bold px-2">{errorsCat.name.message}</p>}
                                    <select {...regCat('type')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm">
                                        <option value="Ingresos">Ingreso</option>
                                        <option value="Gastos Fijos">Gasto Fijo</option>
                                        <option value="Gastos Variables">Gasto Variable</option>
                                        <option value="Ahorro">Ahorro</option>
                                    </select>
                                    <input {...regCat('monthly_budget')} step="any" type="number" placeholder="Presupuesto" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm" />
                                    {errorsCat.monthly_budget && <p className="text-rose-500 text-[10px] uppercase font-bold px-2">{errorsCat.monthly_budget.message}</p>}
                                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Guardar</button>
                                    {editingCategory && (
                                        <button type="button" onClick={() => { if (confirm('Eliminar?')) deleteCategory(editingCategory.id); setEditingCategory(null); }} className="w-full py-3 text-rose-500 font-bold border border-rose-100 dark:border-rose-900 rounded-xl mt-2">Eliminar</button>
                                    )}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Reconcile Modal */}
            {showReconcileModal && reconcilingAccount && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 tracking-tighter">Reconciliar Saldo</h3>
                        <p className="text-xs text-slate-400 mb-4">Ingresa el saldo real reportado por tu institución para <span className="font-bold text-slate-600 dark:text-slate-300">{reconcilingAccount.name}</span>.</p>

                        <div className="space-y-4">
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Actual en App</span>
                                <div className="text-lg font-bold text-slate-600 dark:text-slate-400">{formatCurrency(reconcilingAccount.balance)}</div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nuevo Saldo Real</label>
                                <input
                                    type="number"
                                    step="any"
                                    value={reconcileValue}
                                    onChange={(e) => setReconcileValue(e.target.value)}
                                    className="w-full rounded-2xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-4 text-2xl font-black tracking-tighter"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowReconcileModal(false)}
                                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReconcile}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30"
                                >
                                    Actualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
