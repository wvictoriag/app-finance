import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { api } from '../services/api';
import {
    LogOut, Pencil, Trash2, ArrowRightLeft, Scale,
    Moon, Sun, LayoutGrid, BarChart3, PieChart,
    Plus, Settings, User as UserIcon, Loader2,
    RefreshCw, Wifi, WifiOff, CheckCircle2, AlertCircle, X, ExternalLink
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

// Modular Components
import { AccountsPanel } from '../components/panels/AccountsPanel';
import { TransactionsPanel } from '../components/panels/TransactionsPanel';
import { MonthlyControl } from '../components/panels/MonthlyControl';
import ProjectionsView from './ProjectionsView';

export default function Dashboard({ view = 'dashboard' }) {
    const { user } = useAuth();
    const [currentView, setCurrentView] = useState(view);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [monthlyControl, setMonthlyControl] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [transactionSums, setTransactionSums] = useState({});
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('checking'); // 'online', 'offline', 'checking'
    const [showModal, setShowModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);

    // Reconciliation State
    const [showReconcileModal, setShowReconcileModal] = useState(false);
    const [reconcileBalance, setReconcileBalance] = useState('');
    const [viewingAccount, setViewingAccount] = useState(null);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);

    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);

    // Month/Year Navigation
    const [selectedDate, setSelectedDate] = useState(new Date());
    const selectedMonth = selectedDate.getMonth() + 1;
    const selectedYear = selectedDate.getFullYear();

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

    // Search and Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');

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
        const interval = setInterval(checkConnection, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    const [formData, setFormData] = useState({
        account_id: '', destination_account_id: '',
        date: new Date().toISOString().split('T')[0],
        category_id: '', user_id: user?.id || 'mock-id',
        amount: '', description: '', type: 'expense'
    });

    const [categoryForm, setCategoryForm] = useState({ name: '', type: 'Gastos Variables', monthly_budget: '' });
    const [accountForm, setAccountForm] = useState({ name: '', bank: '', account_number: '', type: 'Debit', balance: '', credit_limit: '', initial_balance: '' });

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    useEffect(() => {
        setCurrentView(view);
    }, [view]);

    const fetchData = async () => {
        setLoading(accounts.length === 0);
        setFetchError(null);
        try {
            const results = await Promise.allSettled([
                api.getAccounts(),
                api.getCategories(),
                api.getTransactionsByMonth(selectedMonth, selectedYear),
                api.getTransactions(100),
                api.getTransactionSums()
            ]);

            const [accs, cats, monthTx, recentTx, sumsTx] = results;

            if (accs.status === 'fulfilled') {
                const sortedAccs = (accs.value || []).sort((a, b) => new Date(a.last_update || 0) - new Date(b.last_update || 0));
                setAccounts(sortedAccs);
            }
            if (cats.status === 'fulfilled') setCategories(cats.value || []);
            if (monthTx.status === 'fulfilled') {
                // Determine if we need to update transactions based on which view we are in
                // For now, let's keep the existing logic of using recentTx for the main list
            }
            if (recentTx.status === 'fulfilled') setTransactions(recentTx.value || []);
            if (sumsTx.status === 'fulfilled') setTransactionSums(sumsTx.value || {});

            if (accs.status === 'fulfilled' && cats.status === 'fulfilled') {
                calculateMonthlyControl(cats.value || [], monthTx.status === 'fulfilled' ? monthTx.value : []);
            }

            // If critical data fails
            if (accs.status === 'rejected') {
                setFetchError('No se pudieron cargar las cuentas. Revisa tu conexión.');
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            setFetchError('Error inesperado al cargar los datos.');
        } finally {
            setLoading(false);
        }
    };

    const calculateMonthlyControl = (cats, txs) => {
        const totals = txs.reduce((acc, tx) => {
            if (tx.category_id) {
                acc[tx.category_id] = (acc[tx.category_id] || 0) + Number(tx.amount);
            }
            return acc;
        }, {});

        const control = cats.map(cat => ({
            ...cat,
            real: totals[cat.id] || 0,
            difference: (totals[cat.id] || 0) - (Number(cat.monthly_budget) || 0)
        }));
        setMonthlyControl(control);
    };

    const handleLogout = async () => { await supabase.auth.signOut(); };

    const handleOpenAddModal = () => {
        setEditingTransaction(null);
        setFormData({
            account_id: '', destination_account_id: '',
            date: new Date().toISOString().split('T')[0],
            category_id: '', user_id: user?.id,
            amount: '', description: '', type: 'expense'
        });
        setShowModal(true);
    };

    const handleOpenEditModal = (tx) => {
        setEditingTransaction(tx);
        let type = 'expense';
        if (tx.destination_account_id) type = 'transfer';
        else if (Number(tx.amount) > 0) type = 'income';

        setFormData({
            account_id: tx.account_id,
            destination_account_id: tx.destination_account_id || '',
            date: tx.date,
            category_id: tx.category_id || '',
            user_id: user?.id,
            amount: Math.abs(tx.amount),
            description: tx.description || '',
            type: type
        });
        setShowModal(true);
    };

    const handleDeleteTransaction = async (id) => {
        if (!confirm('¿Eliminar transacción?')) return;
        try {
            await api.deleteTransaction(id);
            fetchData();
        } catch (error) {
            console.error("Delete error:", error);
            alert("Error al eliminar: " + (error.message || JSON.stringify(error)));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            let finalAmount = Math.abs(formData.amount);
            if (formData.type === 'expense') finalAmount = -finalAmount;

            const payload = {
                user_id: user.id,
                account_id: formData.account_id,
                date: formData.date,
                amount: finalAmount,
                description: formData.description,
                category_id: formData.type === 'transfer' ? null : formData.category_id,
                destination_account_id: formData.type === 'transfer' ? formData.destination_account_id : null
            };

            console.log("Saving transaction payload:", payload);
            if (editingTransaction) await api.updateTransaction(editingTransaction.id, payload);
            else await api.addTransaction(payload);

            setShowModal(false);
            setEditingTransaction(null);
            fetchData();
        } catch (error) {
            console.error("Transaction save error:", error);
            alert("Error TRANSACCIÓN: " + (error.message || JSON.stringify(error)));
        }
    };

    const handleReconcile = async (e) => {
        e.preventDefault();
        try {
            const diff = Number(reconcileBalance) - Number(viewingAccount.balance);
            if (diff !== 0) {
                await api.addTransaction({
                    user_id: user.id,
                    account_id: viewingAccount.id,
                    date: new Date().toISOString().split('T')[0],
                    amount: diff,
                    description: '⚠️ Ajuste Reconciliación',
                    category_id: null,
                    destination_account_id: null
                });
            }
            setShowReconcileModal(false);
            setViewingAccount(null);
            fetchData();
        } catch (err) { alert("Error al reconciliar"); }
    };

    const filteredTransactions = transactions.filter(tx => {
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

    const handleEditAccount = (acc) => {
        setEditingAccount(acc);
        setAccountForm({
            name: acc.name,
            bank: acc.bank || '',
            account_number: acc.account_number || '',
            type: acc.type,
            balance: acc.balance,
            credit_limit: acc.credit_limit || '',
            initial_balance: acc.initial_balance || ''
        });
        setShowAccountModal(true);
    };

    const handleDeleteAccount = async (id) => {
        if (confirm('¿Estás seguro de eliminar esta cuenta? Se perderán las transacciones asociadas.')) {
            try {
                await api.deleteAccount(id);
                fetchData();
            } catch (err) {
                alert('Error al eliminar cuenta');
            }
        }
    };

    if (loading && accounts.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-accent-primary animate-spin mb-4" />
                <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Sincronizando tus finanzas...</p>
            </div>
        );
    }

    if (fetchError && accounts.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl max-w-md border border-slate-100 dark:border-slate-800">
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <WifiOff className="text-rose-500" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Problema de Conexión</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">{fetchError}</p>
                    <button
                        onClick={fetchData}
                        className="w-full py-4 bg-accent-primary hover:bg-accent-secondary text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw size={18} />
                        Reintentar Carga
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:flex-row h-screen bg-white dark:bg-carbon text-slate-900 dark:text-slate-100 font-sans overflow-hidden selection:bg-indigo-500/30">
            {/* Sidebar (Desktop) / Bottom Nav (Mobile) */}
            <nav className="fixed bottom-0 left-0 w-full lg:relative lg:w-24 bg-white dark:bg-carbon border-t lg:border-t-0 lg:border-r border-slate-100 dark:border-white/5 flex lg:flex-col items-center justify-around lg:justify-start py-4 lg:py-10 lg:gap-10 z-30 shrink-0">
                <div
                    className="hidden lg:flex w-10 h-10 bg-accent-primary rounded-xl items-center justify-center shadow-things hover:scale-105 transition-all cursor-pointer group"
                    onClick={() => setCurrentView('dashboard')}
                >
                    <LayoutGrid size={20} className="text-white" />
                </div>

                <div className="flex lg:flex-col gap-2 lg:gap-6">
                    <button
                        onClick={() => setCurrentView('dashboard')}
                        className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'bg-slate-100 dark:bg-white/5 text-accent-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                        title="Dashboard"
                    >
                        <LayoutGrid size={22} />
                        <span className="lg:hidden text-[9px] font-bold uppercase tracking-tighter">Inicio</span>
                    </button>
                    <button
                        onClick={() => setCurrentView('projections')}
                        className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentView === 'projections' ? 'bg-slate-100 dark:bg-white/5 text-emerald-500' : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                        title="Simulaciones"
                    >
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
                                }`} title={connectionStatus === 'online' ? 'Conectado' : 'Sin conexión'} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Guapacha Finance Control</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end mr-2">
                            <span className={`text-[9px] font-black uppercase tracking-widest ${connectionStatus === 'online' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {connectionStatus === 'online' ? 'Sistema Online' : 'Falla de Red'}
                            </span>
                        </div>
                        <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 shadow-sm overflow-hidden">
                            <UserIcon size={18} />
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto lg:overflow-hidden p-4">
                    {currentView === 'dashboard' ? (
                        <div className="flex flex-col lg:flex-row h-full w-full gap-6">
                            {/* Panel Izquierdo: Cuentas */}
                            <aside className="w-full lg:w-[300px] shrink-0 things-surface p-2 order-2 lg:order-1">
                                <AccountsPanel
                                    accounts={accounts}
                                    transactionSums={transactionSums}
                                    onAddAccount={() => { setEditingAccount(null); setAccountForm({ name: '', bank: '', type: 'Debit', balance: '', credit_limit: '', initial_balance: '' }); setShowAccountModal(true); }}
                                    onSelectAccount={(acc) => setViewingAccount(acc)}
                                    onEditAccount={handleEditAccount}
                                    onDeleteAccount={handleDeleteAccount}
                                />
                            </aside>

                            {/* Panel Central: Control Mensual */}
                            <section className="flex-1 min-w-full lg:min-w-[500px] things-card relative flex flex-col overflow-hidden bg-white dark:bg-slate-900/40 order-1 lg:order-2">
                                <MonthlyControl
                                    monthlyControl={monthlyControl}
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                />
                                <button
                                    onClick={handleOpenAddModal}
                                    className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 h-14 w-14 bg-accent-primary rounded-full shadow-xl shadow-indigo-500/20 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all z-20 group"
                                >
                                    <Plus size={24} strokeWidth={3} />
                                </button>
                            </section>

                            {/* Panel Derecho: Transacciones */}
                            <aside className="w-full lg:w-[360px] shrink-0 things-surface p-2 order-3">
                                <TransactionsPanel
                                    transactions={filteredTransactions}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    filterType={filterType}
                                    setFilterType={setFilterType}
                                    onEdit={handleOpenEditModal}
                                    onDelete={handleDeleteTransaction}
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

            {/* Account Modal */}
            {showAccountModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingAccount ? 'Editar' : 'Nueva'} Cuenta</h3>
                            <button onClick={() => { setShowAccountModal(false); setEditingAccount(null); }} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
                        </div>
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            try {
                                const payload = {
                                    user_id: user.id,
                                    name: accountForm.name,
                                    bank: accountForm.bank,
                                    account_number: accountForm.account_number,
                                    type: accountForm.type,
                                    balance: Number(accountForm.balance),
                                    credit_limit: Number(accountForm.credit_limit) || 0,
                                    initial_balance: Number(accountForm.initial_balance) || 0,
                                    last_update: new Date().toISOString()
                                };
                                if (editingAccount) await api.updateAccount(editingAccount.id, payload);
                                else await api.createAccount(payload);
                                setShowAccountModal(false);
                                setEditingAccount(null);
                                fetchData();
                            } catch (err) {
                                console.error("Account save error:", err);
                                alert("Error CUENTA: " + (err.message || JSON.stringify(err)));
                            }
                        }} className="space-y-4">
                            <input placeholder="Nombre Cuenta" required className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-slate-700 dark:text-white" value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} />
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Banco" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-slate-700 dark:text-white" value={accountForm.bank} onChange={e => setAccountForm({ ...accountForm, bank: e.target.value })} />
                                <input placeholder="N° Cuenta" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-slate-700 dark:text-white" value={accountForm.account_number} onChange={e => setAccountForm({ ...accountForm, account_number: e.target.value })} />
                            </div>
                            <select className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-slate-700 dark:text-white" value={accountForm.type} onChange={e => setAccountForm({ ...accountForm, type: e.target.value })}>
                                <option value="Debit">Débito</option>
                                <option value="Credit">Tarjeta de Crédito</option>
                                <option value="CreditLine">Línea de Crédito</option>
                                <option value="Receivable">Cuenta por Cobrar</option>
                                <option value="Cash">Efectivo</option>
                                <option value="Investment">Inversión</option>
                            </select>
                            {(accountForm.type === 'Credit' || accountForm.type === 'CreditLine') && (
                                <input type="number" placeholder="Cupo / Límite de Crédito" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold text-slate-800 dark:text-white" value={accountForm.credit_limit} onChange={e => setAccountForm({ ...accountForm, credit_limit: e.target.value })} />
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Saldo Inicial</label>
                                    <input type="number" placeholder="0" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold text-slate-800 dark:text-white" value={accountForm.initial_balance} onChange={e => setAccountForm({ ...accountForm, initial_balance: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Saldo Banco</label>
                                    <input type="number" placeholder="0" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold text-slate-800 dark:text-white" value={accountForm.balance} onChange={e => setAccountForm({ ...accountForm, balance: e.target.value })} />
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
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gestionar Categorías</h3>
                            <button onClick={() => { setShowCategoryModal(false); setEditingCategory(null); }} className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors">✕</button>
                        </div>
                        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                            <div className="flex-1 overflow-y-auto p-4 border-r border-slate-100 dark:border-slate-700 space-y-4">
                                {['Ingresos', 'Gastos Fijos', 'Gastos Variables', 'Ahorro'].map(type => (
                                    <div key={type}>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">{type}</h4>
                                        <div className="grid grid-cols-1 gap-1">
                                            {categories.filter(c => c.type === type).map(cat => (
                                                <button key={cat.id} onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, type: cat.type, monthly_budget: cat.monthly_budget }); }} className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all flex justify-between items-center ${editingCategory?.id === cat.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
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
                                    try {
                                        let b = Number(categoryForm.monthly_budget);
                                        if (['Gastos Fijos', 'Gastos Variables', 'Ahorro'].includes(categoryForm.type)) b = -Math.abs(b);
                                        const payload = { user_id: user.id, name: categoryForm.name, type: categoryForm.type, monthly_budget: b };
                                        if (editingCategory) await api.updateCategory(editingCategory.id, payload);
                                        else await api.createCategory(payload);
                                        setEditingCategory(null);
                                        setCategoryForm({ name: '', type: 'Gastos Variables', monthly_budget: '' });
                                        fetchData();
                                    } catch (error) {
                                        console.error("Category save error:", error);
                                        alert("Error CATEGORIA: " + (error.message || JSON.stringify(error)));
                                    }
                                }} className="space-y-4">
                                    <input placeholder="Nombre" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                                    <select className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm" value={categoryForm.type} onChange={e => setCategoryForm({ ...categoryForm, type: e.target.value })}>
                                        <option value="Ingresos">Ingreso</option>
                                        <option value="Gastos Fijos">Gasto Fijo</option>
                                        <option value="Gastos Variables">Gasto Variable</option>
                                        <option value="Ahorro">Ahorro</option>
                                    </select>
                                    <input type="number" placeholder="Presupuesto" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm" value={Math.abs(categoryForm.monthly_budget)} onChange={e => setCategoryForm({ ...categoryForm, monthly_budget: e.target.value })} />
                                    <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Guardar</button>
                                    {editingCategory && <button type="button" onClick={async () => { if (confirm('Eliminar?')) { await api.deleteCategory(editingCategory.id); setEditingCategory(null); fetchData(); } }} className="w-full py-3 text-rose-500 font-bold border border-rose-100 dark:border-rose-900 rounded-xl">Eliminar</button>}
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Simple Transaction Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingTransaction ? 'Editar' : 'Nueva'} Transacción</h3>
                            <button onClick={() => setShowModal(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <select required className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" value={formData.account_id} onChange={e => setFormData({ ...formData, account_id: e.target.value })}>
                                <option value="">Cuenta...</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" required className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                                <select className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="expense">Egreso</option>
                                    <option value="income">Ingreso</option>
                                    <option value="transfer">Transferencia</option>
                                </select>
                            </div>
                            {formData.type === 'transfer' && (
                                <select required className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" value={formData.destination_account_id} onChange={e => setFormData({ ...formData, destination_account_id: e.target.value })}>
                                    <option value="">Cuenta Destino...</option>
                                    {accounts.filter(a => a.id !== formData.account_id).map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            )}
                            {formData.type !== 'transfer' && (
                                <select required className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                                    <option value="">Categoría...</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}
                            <input type="number" required placeholder="Monto" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-4 text-xl font-bold" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} />
                            <input placeholder="Descripción" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Guardar</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Reconciliation Quick View */}
            {
                viewingAccount && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
                            <div className="p-8 bg-slate-800 text-white relative shrink-0">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold">{viewingAccount.name}</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">{viewingAccount.bank || 'Efectivo'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setReconcileBalance(viewingAccount.balance); setShowReconcileModal(true); }} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"><Scale size={16} /></button>
                                        <button onClick={() => setViewingAccount(null)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors">✕</button>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <span className="text-xs text-slate-500 uppercase font-bold tracking-widest">Saldo Actual</span>
                                    <div className="text-4xl font-black mt-1">{formatCurrency(viewingAccount.balance)}</div>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900 font-mono text-xs">
                                <div className="space-y-1">
                                    {transactions
                                        .filter(t => t.account_id === viewingAccount.id || t.destination_account_id === viewingAccount.id)
                                        .map(tx => {
                                            const isDestination = tx.destination_account_id === viewingAccount.id;
                                            const displayAmount = isDestination ? Math.abs(tx.amount) : (tx.destination_account_id ? -Math.abs(tx.amount) : tx.amount);

                                            return (
                                                <div key={tx.id} className="flex justify-between border-b border-slate-100 dark:border-slate-800 py-2">
                                                    <span className="text-slate-500">{formatDate(tx.date)}</span>
                                                    <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{tx.description || (tx.destination_account_id ? 'Transferencia' : 'Sin desc')}</span>
                                                    <span className={`font-bold ${Number(displayAmount) < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {formatCurrency(displayAmount)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Reconcile Input Modal */}
            {
                showReconcileModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Reconciliar Saldo</h3>
                            <p className="text-xs text-slate-500 mb-6">Ingresa el saldo que ves en tu cartola bancaria para ajustar el sistema.</p>
                            <form onSubmit={handleReconcile} className="space-y-4">
                                <input type="number" required className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-4 text-xl font-bold" value={reconcileBalance} onChange={e => setReconcileBalance(e.target.value)} autoFocus />
                                <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg">Ajustar Saldo</button>
                                <button type="button" onClick={() => setShowReconcileModal(false)} className="w-full py-2 text-slate-400 text-xs font-bold uppercase">Cerrar</button>
                            </form>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
