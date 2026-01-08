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
import { transactionSchema, accountSchema, type TransactionFormData, type AccountFormData } from '../lib/schemas';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions, useMonthlyTransactions } from '../hooks/useTransactions';
import { useCategories } from '../hooks/useCategories';
import toast from 'react-hot-toast';

// Modular Components
import { AccountsPanel } from '../components/panels/AccountsPanel';
import { TransactionsPanel } from '../components/panels/TransactionsPanel';
import { MonthlyControl } from '../components/panels/MonthlyControl';
import ProjectionsView from './ProjectionsView';
import type { Account, Category, Transaction, MonthlyControlItem } from '../types';

export default function Dashboard({ view = 'dashboard' }: { view?: string }) {
    const { user } = useAuth();
    const [currentView, setCurrentView] = useState(view);
    const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');

    // Month/Year Navigation
    const [selectedDate, setSelectedDate] = useState(new Date());
    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedYear = selectedDate.getFullYear();

    // TanStack Query Hooks
    const { accounts, isLoading: loadingAccs, createAccount, updateAccount, deleteAccount } = useAccounts();
    const { transactions, isLoading: loadingRecent, addTransaction, updateTransaction, deleteTransaction } = useTransactions(100);
    const { categories, isLoading: loadingCats, createCategory, updateCategory, deleteCategory } = useCategories();
    const { data: monthTx, isLoading: loadingMonth } = useMonthlyTransactions(selectedMonth, selectedYear);

    // Local UI State
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [showReconcileModal, setShowReconcileModal] = useState(false);
    const [reconcileBalance, setReconcileBalance] = useState('');
    const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
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

    const txType = watch('type');

    // Computed Data
    const transactionSums = useMemo(() => {
        const sums: Record<string, number> = {};
        transactions.forEach(tx => {
            const amt = Number(tx.amount);
            sums[tx.account_id] = (sums[tx.account_id] || 0) + (tx.destination_account_id ? -Math.abs(amt) : amt);
            if (tx.destination_account_id) {
                sums[tx.destination_account_id] = (sums[tx.destination_account_id] || 0) + Math.abs(amt);
            }
        });
        return sums;
    }, [transactions]);

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

            return matchesSearch && matchesType;
        });
    }, [transactions, searchQuery, filterType]);

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
                user_id: user?.id,
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
                toast.success('Transacción creada');
            }

            setShowModal(false);
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        }
    });

    const handleReconcile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewingAccount) return;
        try {
            const diff = Number(reconcileBalance) - Number(viewingAccount.balance);
            if (diff !== 0) {
                await addTransaction({
                    user_id: user?.id,
                    account_id: viewingAccount.id,
                    date: new Date().toISOString().split('T')[0],
                    amount: diff,
                    description: '⚠️ Ajuste Reconciliación',
                    category_id: null,
                    destination_account_id: null
                });
                toast.success('Saldo ajustado');
            }
            setShowReconcileModal(false);
            setViewingAccount(null);
        } catch (err) { toast.error("Error al reconciliar"); }
    };

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
                <header className="h-20 lg:h-24 flex items-center justify-between px-6 lg:px-12 shrink-0">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="font-extrabold text-3xl tracking-tight text-slate-900 dark:text-white">
                                {currentView === 'dashboard' ? 'Hola, ' + (user?.user_metadata?.alias || user?.email?.split('@')[0]) : 'Simulaciones'}
                            </h1>
                            <div className={`h-2.5 w-2.5 rounded-full mt-1 ${connectionStatus === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse' :
                                connectionStatus === 'offline' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                    'bg-amber-500 animate-pulse'
                                }`} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Guapacha Finance Control</p>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto lg:overflow-hidden p-4">
                    {currentView === 'dashboard' ? (
                        <div className="flex flex-col lg:flex-row h-full w-full gap-6">
                            <aside className="w-full lg:w-[300px] shrink-0 things-surface p-2 order-2 lg:order-1">
                                <AccountsPanel
                                    accounts={accounts}
                                    transactionSums={transactionSums}
                                    onAddAccount={() => { setEditingAccount(null); setShowAccountModal(true); }}
                                    onSelectAccount={(acc) => setViewingAccount(acc)}
                                    onEditAccount={(acc) => { setEditingAccount(acc); setShowAccountModal(true); }}
                                    onDeleteAccount={deleteAccount}
                                />
                            </aside>

                            <section className="flex-1 min-w-full lg:min-w-[500px] things-card relative flex flex-col overflow-hidden bg-white dark:bg-slate-900/40 order-1 lg:order-2">
                                <MonthlyControl
                                    monthlyControl={monthlyControl}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                />
                                <button onClick={handleOpenAddModal} className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 h-14 w-14 bg-accent-primary rounded-full shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white hover:scale-105 transition-all z-20">
                                    <Plus size={24} strokeWidth={3} />
                                </button>
                            </section>

                            <aside className="w-full lg:w-[360px] shrink-0 things-surface p-2 order-3">
                                <TransactionsPanel
                                    transactions={filteredTransactions}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    filterType={filterType}
                                    setFilterType={setFilterType}
                                    onEdit={handleOpenEditModal}
                                    onDelete={deleteTransaction}
                                />
                            </aside>
                        </div>
                    ) : (
                        <div className="h-full things-card overflow-hidden">
                            <ProjectionsView transactions={transactions} accounts={accounts} categories={categories} />
                        </div>
                    )}
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
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const payload = {
                                user_id: user?.id,
                                name: formData.get('name') as string,
                                bank: formData.get('bank') as string,
                                account_number: formData.get('account_number') as string,
                                type: formData.get('type') as any,
                                balance: Number(formData.get('balance')),
                                credit_limit: Number(formData.get('credit_limit')) || 0,
                                initial_balance: Number(formData.get('initial_balance')) || 0,
                                last_update: new Date().toISOString()
                            };
                            try {
                                if (editingAccount) await updateAccount({ id: editingAccount.id, updates: payload });
                                else await createAccount(payload);
                                setShowAccountModal(false);
                                setEditingAccount(null);
                                toast.success('Cuenta guardada');
                            } catch (err: any) { toast.error(err.message); }
                        }} className="space-y-4">
                            <input name="name" defaultValue={editingAccount?.name} placeholder="Nombre Cuenta" required className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" />
                            <div className="grid grid-cols-2 gap-4">
                                <input name="bank" defaultValue={editingAccount?.bank || ''} placeholder="Banco" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" />
                                <input name="account_number" defaultValue={editingAccount?.account_number || ''} placeholder="N° Cuenta" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" />
                            </div>
                            <select name="type" defaultValue={editingAccount?.type || 'Debit'} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3">
                                <option value="Debit">Débito</option>
                                <option value="Credit">Tarjeta de Crédito</option>
                                <option value="CreditLine">Línea de Crédito</option>
                                <option value="Receivable">Cuenta por Cobrar</option>
                                <option value="Cash">Efectivo</option>
                                <option value="Investment">Inversión</option>
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Saldo Inicial</label>
                                    <input name="initial_balance" type="number" step="any" defaultValue={editingAccount?.initial_balance || 0} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Saldo Actual</label>
                                    <input name="balance" type="number" step="any" defaultValue={editingAccount?.balance || 0} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold" />
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
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const type = formData.get('type') as string;
                                    let b = Number(formData.get('monthly_budget'));
                                    if (['Gastos Fijos', 'Gastos Variables', 'Ahorro'].includes(type)) b = -Math.abs(b);
                                    const payload = {
                                        user_id: user?.id,
                                        name: formData.get('name') as string,
                                        type: formData.get('type') as any, // Cast to any to avoid enum mismatch
                                        monthly_budget: b
                                    };
                                    try {
                                        if (editingCategory) await updateCategory({ id: editingCategory.id, updates: payload });
                                        else await createCategory(payload);
                                        setEditingCategory(null);
                                        toast.success('Categoría guardada');
                                    } catch (err: any) { toast.error(err.message); }
                                }} className="space-y-4">
                                    <input name="name" defaultValue={editingCategory?.name} placeholder="Nombre" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm" required />
                                    <select name="type" defaultValue={editingCategory?.type || 'Gastos Variables'} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm">
                                        <option value="Ingresos">Ingreso</option>
                                        <option value="Gastos Fijos">Gasto Fijo</option>
                                        <option value="Gastos Variables">Gasto Variable</option>
                                        <option value="Ahorro">Ahorro</option>
                                    </select>
                                    <input name="monthly_budget" step="any" type="number" defaultValue={editingCategory ? Math.abs(editingCategory.monthly_budget) : ''} placeholder="Presupuesto" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm" />
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

            {/* Reconcile Input Modal */}
            {showReconcileModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Reconciliar Saldo</h3>
                        <p className="text-xs text-slate-500 mb-6 font-medium">Ingresa el saldo que ves en tu cartola bancaria para ajustar el sistema automáticamente.</p>
                        <form onSubmit={handleReconcile} className="space-y-4">
                            <input type="number" step="any" required className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-4 text-xl font-bold" value={reconcileBalance} onChange={e => setReconcileBalance(e.target.value)} autoFocus />
                            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg transition-all">Ajustar Saldo</button>
                            <button type="button" onClick={() => setShowReconcileModal(false)} className="w-full py-2 text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Cancelar</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
