import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, RefreshCcw, Landmark, ShoppingBag, Plus, Trash2, ChevronRight, Info, CreditCard, Wallet, ArrowRightLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import type { Account, Transaction, Category, AccountType } from '../types';
import { SimulationModal } from '../components/modals/SimulationModal';

interface SimulationScenario {
    id: string;
    name: string;
    type: 'purchase' | 'income_change' | 'extra_savings';
    amount: number;
    startMonth: number;
    duration?: number; // months, 0 = permanent
}

interface Installment {
    id: string;
    name: string;
    amount: number;
    remainingMonths: number;
}

interface ProjectionsViewProps {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
}

interface SimModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (scenario: Partial<SimulationScenario>) => void;
    initialData: Partial<SimulationScenario>;
    keyId: string;
}

export default function ProjectionsView({ transactions, accounts, categories }: ProjectionsViewProps) {
    const [horizon, setHorizon] = useState<'3y' | '10y'>('3y');
    const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
    const [installments, setInstallments] = useState<Installment[]>([]);

    // Modals
    const [showSimModal, setShowSimModal] = useState(false);
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);

    // Form State
    const [modalData, setModalData] = useState<Partial<SimulationScenario> | null>(null);
    const [newInstallment, setNewInstallment] = useState<Partial<Installment>>({ amount: 0, remainingMonths: 1 });

    const handlePlanItem = (account: Account) => {
        const isDebt = ['Payable', 'Credit', 'CreditLine'].includes(account.type);
        const amount = Math.abs(Number(account.balance)) || 0;

        // Pass data DIRECTLY to modal - no shared state
        setModalData({
            name: `Liquidar: ${account.name}`,
            type: isDebt ? 'purchase' : 'income_change',
            amount: amount,
            startMonth: 1
        });
        setShowSimModal(true); // CRITICAL: Actually open the modal!
    };

    const handleAddScenario = (data: Partial<SimulationScenario>) => {
        if (!data.name || !data.amount) return;
        setScenarios([...scenarios, { ...data, id: Date.now().toString() } as SimulationScenario]);
        setModalData(null);
        setShowSimModal(false); // Close modal properly
    };

    // 1. Data-Driven Base Engine
    const baseStats = useMemo(() => {
        if (transactions.length === 0) return { income: 0, fixed: 0, variable: 0, expenses: 0 };

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentTxs = transactions.filter(tx => new Date(tx.date) >= sixMonthsAgo);

        const monthsData: Record<string, { income: number, fixed: number, variable: number }> = {};

        recentTxs.forEach(tx => {
            const m = tx.date.slice(0, 7);
            if (!monthsData[m]) monthsData[m] = { income: 0, fixed: 0, variable: 0 };

            const amount = Math.abs(Number(tx.amount));
            // Logic: Income is +amount, Expenses are -amount.
            // But we want to sum magnitudes for 'fixed' and 'variable'

            if (Number(tx.amount) > 0 && !tx.destination_account_id) {
                monthsData[m].income += amount;
            } else if (Number(tx.amount) < 0 && !tx.destination_account_id) {
                const cat = categories.find(c => c.id === tx.category_id);
                // We treat Savings category as 'Variable' or 'Fixed' expense in terms of cash flow out of main accounts,
                // BUT for Net Worth projection, transfers to savings (if accounts include savings) shouldn't be expenses.
                // Assuming 'transactions' includes all accounts.
                // If I transfer from Checking (Account A) to Savings (Account B), it's a transfer.
                // If I spend on "Netflix" (Category Fixed), it's an expense.

                if (cat?.type === 'Gastos Fijos') monthsData[m].fixed += amount;
                else monthsData[m].variable += amount;
            }
        });

        const numMonths = Object.keys(monthsData).length || 1;
        const sums = Object.values(monthsData).reduce((acc, curr) => ({
            income: acc.income + curr.income,
            fixed: acc.fixed + curr.fixed,
            variable: acc.variable + curr.variable,
        }), { income: 0, fixed: 0, variable: 0 });

        return {
            income: Math.round(sums.income / numMonths),
            fixed: Math.round(sums.fixed / numMonths),
            variable: Math.round(sums.variable / numMonths),
            expenses: Math.round((sums.fixed + sums.variable) / numMonths)
        };
    }, [transactions, categories]);

    // 2. Projection Engine
    const projectionData = useMemo(() => {
        const totalMonths = horizon === '3y' ? 36 : 120;

        // Initial values
        const currentEquity = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
        const liquidTypes: AccountType[] = ['Checking', 'Savings', 'Vista', 'Cash'];
        const currentCash = accounts
            .filter(a => liquidTypes.includes(a.type))
            .reduce((sum, acc) => sum + Number(acc.balance), 0);

        // Calculate Core Fixed Expenses
        const totalCurrentInstallmentPayment = installments.reduce((sum, i) => sum + i.amount, 0);
        const coreFixedBase = Math.max(0, baseStats.fixed - totalCurrentInstallmentPayment);

        let data: any[] = [];
        let runningWealth = currentEquity;
        let runningCash = currentCash;

        let simulatedWealth = currentEquity;
        let simulatedCash = currentCash;

        // --- Mes 0: Hoy ---
        data.push({
            index: 0,
            label: 'Hoy',
            Patrimonio: Math.round(runningWealth),
            Liquidez: Math.round(runningCash),
            Simulado: Math.round(simulatedWealth),
            Simulado_Liquidez: Math.round(simulatedCash)
        });

        for (let m = 1; m <= totalMonths; m++) {
            const activeInstallmentsAmount = installments
                .filter(i => m <= i.remainingMonths)
                .reduce((sum, i) => sum + i.amount, 0);

            const monthlyFixed = coreFixedBase + activeInstallmentsAmount;
            const monthlyExpenses = monthlyFixed + baseStats.variable;
            const monthlyNet = baseStats.income - monthlyExpenses;

            // Wealth includes growth/loss from income - all expenses
            runningWealth += monthlyNet;
            // Cash also changes by the same net for the base case
            runningCash += monthlyNet;

            // --- Simulated Scenario ---
            let simIncome = baseStats.income;
            let simExpenses = monthlyExpenses;
            let simWealthImpact = 0; // Immediate wealth changes (one-time buy/sell)
            let simCashImpact = 0;   // Immediate cash changes (receivable collected or debt paid)

            scenarios.forEach(s => {
                const isActive = m >= s.startMonth && (s.duration === 0 || m < s.startMonth + (s.duration || 0));

                if (isActive) {
                    if (s.type === 'purchase') {
                        if (m === s.startMonth) {
                            simWealthImpact -= s.amount;
                            simCashImpact -= s.amount;
                        }
                    } else if (s.type === 'income_change') {
                        // If it's a liquidation (receiving money we already have as 'Receivable')
                        if (s.name.includes('Liquidar:')) {
                            if (m === s.startMonth) {
                                // Wealth doesn't change (asset changed form), but cash does
                                simCashImpact += s.amount;
                            }
                        } else {
                            simIncome += s.amount;
                        }
                    } else if (s.type === 'extra_savings') {
                        simExpenses -= s.amount;
                    }
                }
            });

            const simNet = simIncome - simExpenses;
            simulatedWealth += simNet + simWealthImpact;
            simulatedCash += simNet + simCashImpact;

            if (horizon === '3y' || (horizon === '10y' && m % 12 === 0)) {
                data.push({
                    index: m,
                    label: horizon === '3y' ? `Mes ${m}` : `Año ${m / 12}`,
                    Patrimonio: Math.round(runningWealth),
                    Liquidez: Math.round(runningCash),
                    Simulado: Math.round(simulatedWealth),
                    Simulado_Liquidez: Math.round(simulatedCash)
                });
            }
        }
        return data;
    }, [horizon, baseStats, scenarios, installments, accounts]);

    const addScenario = (scenarioData: Partial<SimulationScenario>) => {
        if (!scenarioData.name || !scenarioData.amount) return;
        setScenarios([...scenarios, { ...scenarioData, id: Date.now().toString() } as SimulationScenario]);
        setShowSimModal(false);
    };

    const addInstallment = () => {
        if (!newInstallment.name || !newInstallment.amount || !newInstallment.remainingMonths) return;
        setInstallments([...installments, { ...newInstallment, id: Date.now().toString() } as Installment]);
        setShowInstallmentModal(false);
        setNewInstallment({ amount: 0, remainingMonths: 1 });
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Simple Header */}
            <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 shrink-0">
                <div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Flujo de Caja Mensual Corriente</h2>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Ingresos</span>
                            <span className="text-sm font-black text-emerald-500 tracking-tight">{formatCurrency(baseStats.income)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Gastos</span>
                            <span className="text-sm font-black text-rose-500 tracking-tight">{formatCurrency(baseStats.expenses)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Patrimonio Neto Hoy</span>
                            <div className="flex items-center gap-1.5 group cursor-help" aria-label="Detalles del patrimonio neto">
                                <span className={`text-sm font-black tracking-tight text-blue-500`}>
                                    {formatCurrency(accounts.reduce((sum, acc) => sum + Number(acc.balance), 0))}
                                </span>
                                <Info size={12} className="text-slate-300" aria-hidden="true" />
                                <div className="absolute top-20 left-8 bg-slate-900 text-white p-3 rounded-2xl text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-2xl pointer-events-none">
                                    <div className="flex justify-between gap-4 mb-1">
                                        <span className="text-slate-400">Cuentas:</span>
                                        <span>{formatCurrency(accounts.filter(a => a.type !== 'Receivable' && a.type !== 'Payable' && a.type !== 'Credit' && a.type !== 'CreditLine').reduce((s, a) => s + Number(a.balance), 0))}</span>
                                    </div>
                                    <div className="flex justify-between gap-4 mb-1">
                                        <span className="text-emerald-400">Por Cobrar:</span>
                                        <span>{formatCurrency(accounts.filter(a => a.type === 'Receivable').reduce((s, a) => s + Number(a.balance), 0))}</span>
                                    </div>
                                    <div className="flex justify-between gap-4">
                                        <span className="text-rose-400">Deudas:</span>
                                        <span>{formatCurrency(accounts.filter(a => a.type === 'Payable' || a.type === 'Credit' || a.type === 'CreditLine').reduce((s, a) => s + Number(a.balance), 0))}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
                    <button onClick={() => setHorizon('3y')} aria-label="Ver proyección a 3 años" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${horizon === '3y' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}>3 Años</button>
                    <button onClick={() => setHorizon('10y')} aria-label="Ver proyección a 10 años" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${horizon === '10y' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}>10 Años</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Simulator Sidebar */}
                <aside className="hidden lg:flex w-80 flex-col bg-white/20 dark:bg-transparent border-r border-slate-100 dark:border-white/5 overflow-hidden">
                    {/* Section 1: Current Balances to Liquidate (PENDING ITEMS) */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0 border-b border-slate-100 dark:border-white/5">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Saldos por Liquidar (Validación)</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                            {accounts.filter(a => a.type === 'Receivable' || a.type === 'Payable' || a.type === 'Credit' || a.type === 'CreditLine').map(a => {
                                const isDebt = a.type === 'Payable' || a.type === 'Credit' || a.type === 'CreditLine';
                                const balance = Math.abs(Number(a.balance));
                                return (
                                    <div key={a.id} className="bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-50 dark:border-white/5 group relative">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                {isDebt ? <CreditCard size={12} className="text-rose-500" /> : <Wallet size={12} className="text-emerald-500" />}
                                                <span className="text-[9px] font-black text-slate-400 uppercase">{isDebt ? 'Deuda' : 'Por Cobrar'}</span>
                                            </div>
                                            <button
                                                onClick={() => handlePlanItem(a)}
                                                className="p-1 px-2 bg-blue-500/10 text-blue-600 rounded-lg text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white"
                                                title="Planificar Cobro/Pago"
                                                aria-label={`Planificar ${isDebt ? 'pago' : 'cobro'} de ${a.name}`}
                                            >
                                                Planear
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-slate-800 dark:text-white truncate max-w-[120px]">{a.name}</span>
                                            <span className={`text-[10px] font-black ${isDebt ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(balance)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 2: Simulations (MODIFIED PLANS) */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0 border-b border-slate-100 dark:border-white/5">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Planes de Validación</h3>
                            <button
                                onClick={() => setModalData({ type: 'purchase', amount: 0, startMonth: 1 })}
                                aria-label="Agregar nuevo plan de gasto"
                                className="w-6 h-6 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:scale-110 transition-all"
                            >
                                <Plus size={14} strokeWidth={3} aria-hidden="true" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                            {scenarios.map(s => (
                                <div key={s.id} className="bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-50 dark:border-white/5 group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase mb-0.5">{s.type === 'purchase' ? 'Gasto Planificado' : s.type === 'income_change' ? 'Ingreso Planificado' : 'Ahorro Extra'}</span>
                                            <span className="text-xs font-black text-slate-800 dark:text-white">{s.name}</span>
                                        </div>
                                        <button onClick={() => setScenarios(scenarios.filter(sc => sc.id !== s.id))} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 absolute top-3 right-3" aria-label={`Eliminar plan ${s.name}`}><Trash2 size={12} aria-hidden="true" /></button>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className={`text-[10px] font-black ${s.type === 'purchase' ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(s.amount)}</span>
                                        <span className="text-[9px] font-bold text-slate-400">Mes {s.startMonth}</span>
                                    </div>
                                </div>
                            ))}
                            {scenarios.length === 0 && <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-4">Sin planes de validación</p>}
                        </div>
                    </div>

                    {/* Section 3: Fixed Debts / Installments */}
                    <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deudas Fijas / Cuotas</h3>
                            <button onClick={() => setShowInstallmentModal(true)} aria-label="Registrar nueva deuda" className="w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center hover:scale-110 transition-all"><Plus size={14} strokeWidth={3} aria-hidden="true" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                            {installments.map(i => (
                                <div key={i.id} className="bg-white dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-50 dark:border-white/5 group relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Cuota Mensual</span>
                                            <span className="text-xs font-black text-slate-800 dark:text-white">{i.name}</span>
                                        </div>
                                        <button onClick={() => setInstallments(installments.filter(ins => ins.id !== i.id))} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 absolute top-3 right-3"><Trash2 size={12} /></button>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] font-black text-rose-500">{formatCurrency(i.amount)}</span>
                                        <span className="text-[9px] font-bold text-slate-400">Quedan {i.remainingMonths} ms</span>
                                    </div>
                                </div>
                            ))}
                            {installments.length === 0 && <p className="text-[9px] font-bold text-slate-300 uppercase text-center py-4">Sin cuotas registradas</p>}
                        </div>
                    </div>
                </aside>

                {/* Plot Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scrollbar-hide">
                    <div className="relative h-[480px] w-full bg-white dark:bg-slate-900/20 rounded-[2.5rem] p-8 border border-white dark:border-white/5 shadow-premium">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Validador de Planes Patrimoniales</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Comparativa de Patrimonio vs. Liquidez (Efectivo)</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Patrimonio (Tengo)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Liquidez (Caja)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Plan (Simulado)</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[340px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={projectionData}>
                                    <defs>
                                        <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={9} fontWeight={900} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis stroke="#94a3b8" fontSize={9} fontWeight={900} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '24px', backgroundColor: '#fff', border: 'none', padding: '24px', boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.15)' }}
                                        itemStyle={{ fontSize: '11px', fontWeight: '900' }}
                                        formatter={(value: any, name?: string) => [formatCurrency(value), name || '']}
                                    />
                                    <Area type="monotone" dataKey="Patrimonio" name="Patrimonio Base" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorWealth)" />
                                    <Area type="monotone" dataKey="Liquidez" name="Liquidez Base" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCash)" />
                                    <Area type="monotone" dataKey="Simulado" name="Patrimonio Plan" stroke="#2563eb" strokeWidth={3} fillOpacity={0} strokeDasharray="5 5" />
                                    <Area type="monotone" dataKey="Simulado_Liquidez" name="Liquidez Plan" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorSim)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Milestones */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {projectionData.filter((_, i) => i === projectionData.length - 1 || i === Math.floor(projectionData.length / 2) || i === 0).map((point, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Liquidez en {point.label}</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{formatCurrency(point.Simulado_Liquidez)}</div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${point.Simulado_Liquidez >= point.Liquidez ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {point.Simulado_Liquidez >= point.Liquidez ? '+' : '-'} {formatCurrency(Math.abs(point.Simulado_Liquidez - point.Liquidez))}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">vs. Base</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Simulation Modal - Direct Props with Force Remount Key */}
            {showSimModal && modalData && (
                <SimulationModal
                    key={`sim-modal-${modalData.name}-${modalData.amount}`}
                    initialData={modalData}
                    onClose={() => { setModalData(null); setShowSimModal(false); }}
                    onSave={handleAddScenario}
                />
            )}

            {/* Installment Modal */}
            <AnimatePresence>
                {showInstallmentModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8">
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">Registrar Deuda Actual</h3>
                            <p className="text-xs text-slate-400 mb-8 font-medium">Registra compras en cuotas o créditos activos para ajustar tu capacidad de ahorro real cuando estos terminen.</p>
                            <div className="space-y-6">
                                <input
                                    autoFocus
                                    placeholder="Nombre: Ej. Visa Cuotas, Crédito Auto"
                                    className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-rose-500/20"
                                    value={newInstallment.name || ''}
                                    onChange={e => setNewInstallment({ ...newInstallment, name: e.target.value })}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cuota Mensual</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm font-black border-none outline-none focus:ring-2 ring-rose-500/20"
                                            value={newInstallment.amount || ''}
                                            onChange={e => setNewInstallment({ ...newInstallment, amount: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meses Restantes</label>
                                        <input
                                            type="number"
                                            placeholder="1"
                                            className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm font-black border-none outline-none focus:ring-2 ring-rose-500/20"
                                            value={newInstallment.remainingMonths || ''}
                                            onChange={e => setNewInstallment({ ...newInstallment, remainingMonths: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setShowInstallmentModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest">Cancelar</button>
                                    <button onClick={addInstallment} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-rose-500/30">Agregar Deuda</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
