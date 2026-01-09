import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, RefreshCcw, Landmark, ShoppingBag, Plus, Trash2, ChevronRight, Info } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import type { Account, Transaction, Category } from '../types';

interface SimulationScenario {
    id: string;
    name: string;
    type: 'purchase' | 'income_change' | 'extra_savings';
    amount: number;
    startMonth: number;
    duration?: number; // months, 0 = permanent
}

interface ProjectionsViewProps {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
}

export default function ProjectionsView({ transactions, accounts, categories }: ProjectionsViewProps) {
    const [horizon, setHorizon] = useState<'3y' | '10y'>('3y');
    const [scenarios, setScenarios] = useState<SimulationScenario[]>([]);
    const [showSimModal, setShowSimModal] = useState(false);
    const [newSim, setNewSim] = useState<Partial<SimulationScenario>>({ type: 'purchase', amount: 0, startMonth: 1 });

    // 1. Data-Driven Base Engine (Zero Friction)
    // We calculate averages from the last 6 months of data
    const baseStats = useMemo(() => {
        if (transactions.length === 0) return { income: 0, fixed: 0, variable: 0, savings: 0 };

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const recentTxs = transactions.filter(tx => new Date(tx.date) >= sixMonthsAgo);

        // Group by month to get per-month averages
        const monthsData: Record<string, { income: number, fixed: number, variable: number, savings: number }> = {};

        recentTxs.forEach(tx => {
            const m = tx.date.slice(0, 7);
            if (!monthsData[m]) monthsData[m] = { income: 0, fixed: 0, variable: 0, savings: 0 };

            const amount = Math.abs(Number(tx.amount));
            const isIncome = Number(tx.amount) > 0 && !tx.destination_account_id;

            if (isIncome) {
                monthsData[m].income += amount;
            } else if (Number(tx.amount) < 0 && tx.category_id) {
                const cat = categories.find(c => c.id === tx.category_id);
                if (cat?.type === 'Gastos Fijos') monthsData[m].fixed += amount;
                else if (cat?.type === 'Gastos Variables') monthsData[m].variable += amount;
                else if (cat?.type === 'Ahorro') monthsData[m].savings += amount;
            }
        });

        const numMonths = Object.keys(monthsData).length || 1;
        const sums = Object.values(monthsData).reduce((acc, curr) => ({
            income: acc.income + curr.income,
            fixed: acc.fixed + curr.fixed,
            variable: acc.variable + curr.variable,
            savings: acc.savings + curr.savings
        }), { income: 0, fixed: 0, variable: 0, savings: 0 });

        return {
            income: Math.round(sums.income / numMonths),
            fixed: Math.round(sums.fixed / numMonths),
            variable: Math.round(sums.variable / numMonths),
            savings: Math.round(sums.savings / numMonths)
        };
    }, [transactions, categories]);

    // 2. Projection Engine
    const projectionData = useMemo(() => {
        const totalMonths = horizon === '3y' ? 36 : 120;
        const currentEquity = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

        let data: any[] = [];
        let runningWealth = currentEquity;
        let simulatedWealth = currentEquity;

        for (let m = 1; m <= totalMonths; m++) {
            // Base Logic
            const baseExpenses = baseStats.fixed + baseStats.variable;
            const baseOperational = baseStats.income - baseExpenses;
            const baseContribution = Math.max(0, Math.min(baseOperational, baseStats.savings));

            runningWealth += baseContribution;

            // Simulated Logic
            let simIncome = baseStats.income;
            let simExpenses = baseExpenses;
            let simOneTime = 0;

            scenarios.forEach(s => {
                if (m >= s.startMonth && (s.duration === 0 || m < s.startMonth + (s.duration || 0))) {
                    if (s.type === 'purchase') {
                        if (m === s.startMonth) simOneTime += s.amount;
                    } else if (s.type === 'income_change') {
                        simIncome += s.amount;
                    } else if (s.type === 'extra_savings') {
                        // handled in contribution
                    }
                }
            });

            const simOperational = simIncome - simExpenses;
            const extraSavings = scenarios
                .filter(s => s.type === 'extra_savings' && m >= s.startMonth && (s.duration === 0 || m < s.startMonth + (s.duration || 0)))
                .reduce((sum, s) => sum + s.amount, 0);

            const simContribution = Math.max(0, Math.min(simOperational, baseStats.savings + extraSavings));
            simulatedWealth += simContribution - simOneTime;

            if (horizon === '3y' || (horizon === '10y' && m % 12 === 0)) {
                data.push({
                    index: m,
                    label: horizon === '3y' ? `Mes ${m}` : `Año ${m / 12}`,
                    Patrimonio: Math.round(runningWealth),
                    Simulado: Math.round(simulatedWealth),
                    Ahorro: simContribution
                });
            }
        }
        return data;
    }, [horizon, baseStats, scenarios, accounts]);

    const addScenario = () => {
        if (!newSim.name || !newSim.amount) return;
        setScenarios([...scenarios, { ...newSim, id: Date.now().toString() } as SimulationScenario]);
        setShowSimModal(false);
        setNewSim({ type: 'purchase', amount: 0, startMonth: 1 });
    };

    return (
        <div className="flex flex-col h-full bg-transparent overflow-hidden">
            {/* Simple Header */}
            <div className="px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/40 dark:bg-white/5 border-b border-slate-100 dark:border-white/5 shrink-0">
                <div>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Capacidad Real Detectada</h2>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Ingreso Avg.</span>
                            <span className="text-sm font-black text-emerald-500 tracking-tight">{formatCurrency(baseStats.income)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Gasto Avg.</span>
                            <span className="text-sm font-black text-rose-500 tracking-tight">{formatCurrency(baseStats.fixed + baseStats.variable)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Ahorro Avg.</span>
                            <span className="text-sm font-black text-blue-500 tracking-tight">{formatCurrency(baseStats.savings)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
                    <button
                        onClick={() => setHorizon('3y')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${horizon === '3y' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        3 Años
                    </button>
                    <button
                        onClick={() => setHorizon('10y')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${horizon === '10y' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        10 Años
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Simulator Sidebar */}
                <aside className="hidden lg:flex w-80 flex-col bg-white/20 dark:bg-transparent border-r border-slate-100 dark:border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Simulador Financiero</h3>
                        <button
                            onClick={() => setShowSimModal(true)}
                            className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center hover:scale-110 transition-all"
                        >
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                        {scenarios.length === 0 ? (
                            <div className="py-10 text-center px-4">
                                <Info size={24} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">¿Qué pasaría si...?<br />Agrega un escenario para simular cambios.</p>
                            </div>
                        ) : (
                            scenarios.map(s => (
                                <div key={s.id} className="bg-white dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-50 dark:border-white/5 group shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase mb-0.5">{s.type === 'purchase' ? 'Compra' : s.type === 'income_change' ? 'Ingreso' : 'Ahorro Extra'}</span>
                                            <span className="text-sm font-black text-slate-800 dark:text-white tracking-tight leading-tight">{s.name}</span>
                                        </div>
                                        <button onClick={() => setScenarios(scenarios.filter(sc => sc.id !== s.id))} className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <span className={`text-[11px] font-black ${s.type === 'purchase' ? 'text-rose-500' : 'text-emerald-500'}`}>{formatCurrency(s.amount)}</span>
                                        <span className="text-[9px] font-bold text-slate-400">Mes {s.startMonth}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Plot Area */}
                <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scrollbar-hide">
                    <div className="relative h-[450px] w-full bg-white dark:bg-slate-900/20 rounded-[2.5rem] p-8 border border-white dark:border-white/5 shadow-premium">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Proyección Logarítmica</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Escenario Base vs Simulado</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Base</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Simulado</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={projectionData}>
                                    <defs>
                                        <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        stroke="#94a3b8"
                                        fontSize={9}
                                        fontWeight={900}
                                        tickLine={false}
                                        axisLine={false}
                                        dy={10}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={9}
                                        fontWeight={900}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '24px', backgroundColor: '#fff', border: 'none', padding: '24px', boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.15)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: '900' }}
                                        formatter={(value: any) => formatCurrency(value)}
                                    />
                                    <Area type="monotone" dataKey="Patrimonio" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorBase)" />
                                    <Area type="monotone" dataKey="Simulado" stroke="#f43f5e" strokeWidth={4} fillOpacity={1} fill="url(#colorSim)" strokeDasharray="10 5" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Milestones / Future Wealth */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {projectionData.filter((_, i) => i === projectionData.length - 1 || i === Math.floor(projectionData.length / 2) || i === 0).map((point, idx) => (
                            <div key={idx} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 block">Patrimonio en {point.label}</span>
                                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{formatCurrency(point.Simulado)}</div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${point.Simulado >= point.Patrimonio ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                        {point.Simulado >= point.Patrimonio ? '+' : '-'} {formatCurrency(Math.abs(point.Simulado - point.Patrimonio))}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">vs. Escenario Base</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>

            {/* Simulation Modal */}
            <AnimatePresence>
                {showSimModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8"
                        >
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter mb-2">Nuevo Escenario</h3>
                            <p className="text-xs text-slate-400 mb-8 font-medium">Define un cambio en tu realidad financiera para ver cómo impacta tus proyecciones a largo plazo.</p>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">¿Qué quieres simular?</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'purchase', label: 'Compra', icon: ShoppingBag },
                                            { id: 'income_change', label: 'Ingreso', icon: Landmark },
                                            { id: 'extra_savings', label: 'Ahorro', icon: RefreshCcw },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => setNewSim({ ...newSim, type: t.id as any })}
                                                className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${newSim.type === t.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-500'}`}
                                            >
                                                <t.icon size={18} />
                                                <span className="text-[9px] font-black uppercase">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <input
                                    placeholder="Nombre: Ej. Compra de Auto"
                                    className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-blue-500/20"
                                    onChange={e => setNewSim({ ...newSim, name: e.target.value })}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto ($)</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm font-black border-none"
                                            onChange={e => setNewSim({ ...newSim, amount: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mes Inicio</label>
                                        <input
                                            type="number"
                                            placeholder="1"
                                            className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm font-black border-none"
                                            onChange={e => setNewSim({ ...newSim, startMonth: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        onClick={() => setShowSimModal(false)}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={addScenario}
                                        className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30"
                                    >
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
