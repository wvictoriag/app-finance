import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Account, Transaction, Category } from '../types';

interface Loan {
    name: string;
    monthlyPayment: number;
    remainingInstallments: number;
}

interface ProjectionsViewProps {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
}

export default function ProjectionsView({ transactions, accounts, categories }: ProjectionsViewProps) {
    const [subView, setSubView] = useState<'5y' | '30y'>('5y');

    // Shared State for Financial Parameters
    const [avgIncome, setAvgIncome] = useState(0);
    const [avgFixed, setAvgFixed] = useState(0);
    const [avgVariable, setAvgVariable] = useState(0);
    const [monthlySavings, setMonthlySavings] = useState(0);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(7);
    const [inflationRate, setInflationRate] = useState(3);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [creditLineInterest, setCreditLineInterest] = useState(2.5); // Monthly interest rate
    const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
    const [newLoan, setNewLoan] = useState({ name: '', monthlyPayment: '', remainingInstallments: '' });

    // Initial Data Loading
    useEffect(() => {
        if (transactions.length > 0) {
            const sortedTxs = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
            const lastMonth = sortedTxs[0].date.slice(0, 7);
            const monthTxs = transactions.filter(tx => tx.date.startsWith(lastMonth));

            let income = 0;
            let fixed = 0;
            let variable = 0;
            let savings = 0;

            monthTxs.forEach(tx => {
                const amount = Math.abs(Number(tx.amount));
                if (Number(tx.amount) > 0 && !tx.destination_account_id) {
                    income += amount;
                } else if (Number(tx.amount) < 0 && tx.category_id) {
                    const cat = categories.find(c => c.id === tx.category_id);
                    if (cat?.type === 'Gastos Fijos') fixed += amount;
                    else if (cat?.type === 'Gastos Variables') variable += amount;
                    else if (cat?.type === 'Ahorro') savings += amount;
                }
            });

            setAvgIncome(income);
            setAvgFixed(fixed);
            setAvgVariable(variable);
            setMonthlySavings(savings);
        }
    }, [transactions, categories]);

    // Unified Projection Logic
    const projectionData = useMemo(() => {
        const months = 360; // Up to 30 years
        let data: any[] = [];
        let accumulatedWealth = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

        const monthlyReturnRate = (investmentReturnRate / 100) / 12;
        const monthlyCreditInterest = creditLineInterest / 100;

        for (let i = 1; i <= months; i++) {
            const yearIndex = Math.floor((i - 1) / 12);

            // 5Y specific: active loans
            const activeLoansPayment = loans
                .filter(l => Number(l.remainingInstallments) >= i)
                .reduce((sum, l) => sum + Number(l.monthlyPayment), 0);

            const totalExpenses = avgFixed + activeLoansPayment + avgVariable;
            const operationalCash = avgIncome - totalExpenses;

            let realContribution = 0;
            if (operationalCash < 0) {
                accumulatedWealth += operationalCash;
            } else {
                realContribution = Math.min(operationalCash, monthlySavings);
                accumulatedWealth += realContribution;
            }

            if (accumulatedWealth > 0) {
                accumulatedWealth += accumulatedWealth * monthlyReturnRate;
            } else if (accumulatedWealth < 0) {
                accumulatedWealth += accumulatedWealth * monthlyCreditInterest;
            }

            // Real wealth adjusted by inflation
            const realWealth = accumulatedWealth / Math.pow(1 + (inflationRate / 100), i / 12);

            data.push({
                index: i,
                month: i,
                year: yearIndex + 1,
                income: avgIncome,
                expenses: totalExpenses,
                loanPayments: activeLoansPayment,
                savingsContribution: realContribution,
                wealth: Math.round(accumulatedWealth),
                realWealth: Math.round(realWealth)
            });
        }
        return data;
    }, [avgIncome, avgFixed, avgVariable, monthlySavings, investmentReturnRate, inflationRate, loans, accounts]);

    const data5Y = projectionData.slice(0, 60);
    const data30Y = projectionData.filter((_, i) => (i + 1) % 12 === 0 || i === 0);

    return (
        <div className="flex flex-col h-full overflow-hidden bg-transparent">
            {/* Header */}
            <header className="px-6 lg:px-12 py-10 flex flex-col lg:flex-row justify-between lg:items-center gap-6 shrink-0">
                <div className="flex items-center gap-4 lg:gap-10">
                    <div>
                        <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Proyecciones</h2>
                        <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Pronóstico Financiero</h3>
                    </div>

                    <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-2xl">
                        <button
                            onClick={() => setSubView('5y')}
                            className={`px-4 lg:px-6 py-2 rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] transition-all ${subView === '5y' ? 'bg-white dark:bg-white/10 text-accent-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            5 Años
                        </button>
                        <button
                            onClick={() => setSubView('30y')}
                            className={`px-4 lg:px-6 py-2 rounded-xl text-[10px] lg:text-[11px] font-black uppercase tracking-[0.2em] transition-all ${subView === '30y' ? 'bg-white dark:bg-white/10 text-accent-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            Largo Plazo
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Control Sidebar */}
                <aside className="hidden lg:block w-[320px] p-12 overflow-y-auto space-y-12 shrink-0 scrollbar-hide border-r border-slate-100 dark:border-white/5">
                    <section>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Base de Ejecución</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'Ingresos Mensuales', val: avgIncome, set: setAvgIncome, color: 'text-emerald-500' },
                                { label: 'Gastos Fijos', val: avgFixed, set: setAvgFixed, color: 'text-accent-primary' },
                                { label: 'Gastos Variables', val: avgVariable, set: setAvgVariable, color: 'text-rose-500' },
                                { label: 'Capacidad Ahorro', val: monthlySavings, set: setMonthlySavings, color: 'text-amber-500' },
                            ].map(field => (
                                <div key={field.label}>
                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{field.label}</label>
                                    <input
                                        type="number"
                                        value={field.val}
                                        onChange={e => field.set(Number(e.target.value))}
                                        className={`w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 ${field.color} font-black text-sm tabular-nums outline-none transition-all focus:bg-white dark:focus:bg-white/10`}
                                    />
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Variables Mercado</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Retorno (%)</label>
                                <input type="number" step="0.5" value={investmentReturnRate} onChange={e => setInvestmentReturnRate(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-emerald-500 font-black text-sm tabular-nums outline-none" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Inflación (%)</label>
                                <input type="number" step="0.5" value={inflationRate} onChange={e => setInflationRate(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-rose-500 font-black text-sm tabular-nums outline-none" />
                            </div>
                        </div>
                    </section>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-hidden flex flex-col p-6 lg:p-12 space-y-12">
                    <div className="flex-1 min-h-[400px] flex flex-col relative">
                        <div className="flex justify-between items-end mb-8 lg:mb-12">
                            <div>
                                <h3 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
                                    {subView === '5y' ? 'Dinámica de Flujo y Patrimonio' : 'Curva de Crecimiento Patrimonial'}
                                </h3>
                                <p className="text-[10px] lg:text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Poder Adquisitivo Nominal vs Real</p>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={subView === '5y' ? data5Y : data30Y}>
                                    <defs>
                                        <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={subView === '5y' ? '#6366f1' : '#10b981'} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={subView === '5y' ? '#6366f1' : '#10b981'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#00000005" vertical={false} />
                                    <XAxis
                                        dataKey={subView === '5y' ? 'month' : 'year'}
                                        stroke="#94a3b8"
                                        fontSize={9}
                                        fontWeight={900}
                                        tickLine={false}
                                        axisLine={false}
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
                                    <Area
                                        type="monotone"
                                        dataKey="wealth"
                                        stroke={subView === '5y' ? '#6366f1' : '#10b981'}
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorProg)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="realWealth"
                                        stroke="#475569"
                                        strokeWidth={2}
                                        fillOpacity={0}
                                        strokeDasharray="8 8"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 overflow-x-auto pb-4 lg:pb-0">
                        {(subView === '5y' ? [12, 24, 48, 60] : [5, 10, 20, 30]).map(val => {
                            const point = subView === '5y' ? data5Y[val - 1] : data30Y.find(d => d.year === val);
                            if (!point) return null;
                            return (
                                <div key={val} className="bg-slate-50 dark:bg-white/5 p-6 lg:p-8 rounded-[2rem] min-w-[160px]">
                                    <p className="text-[10px] lg:text-[12px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">
                                        {subView === '5y' ? `Mes ${val}` : `Año ${val}`}
                                    </p>
                                    <p className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white mb-2">{formatCurrency(point.wealth)}</p>
                                    <p className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ajustado: {formatCurrency(point.realWealth)}</p>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}
