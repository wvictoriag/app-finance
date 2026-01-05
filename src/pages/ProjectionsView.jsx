import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, Plus, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProjectionsView({ transactions, accounts, categories }) {
    const [subView, setSubView] = useState('5y'); // '5y' or '30y'

    // Shared State for Financial Parameters
    const [avgIncome, setAvgIncome] = useState(0);
    const [avgFixed, setAvgFixed] = useState(0);
    const [avgVariable, setAvgVariable] = useState(0);
    const [monthlySavings, setMonthlySavings] = useState(0);
    const [investmentReturnRate, setInvestmentReturnRate] = useState(7);
    const [inflationRate, setInflationRate] = useState(3);
    const [loans, setLoans] = useState([]);
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
        let data = [];
        let accumulatedWealth = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

        const monthlyReturnRate = (investmentReturnRate / 100) / 12;
        const monthlyCreditInterest = creditLineInterest / 100;

        for (let i = 1; i <= months; i++) {
            const year = Math.floor((i - 1) / 12);

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
                // Apply credit line interest if in debt
                accumulatedWealth += accumulatedWealth * monthlyCreditInterest;
            }

            // Real wealth adjusted by inflation
            const realWealth = accumulatedWealth / Math.pow(1 + (inflationRate / 100), i / 12);

            data.push({
                index: i,
                month: i,
                year: year + 1,
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
            <header className="px-12 py-10 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-10">
                    <div>
                        <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Proyecciones</h2>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Pronóstico Financiero</h3>
                    </div>

                    <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-2xl">
                        <button
                            onClick={() => setSubView('5y')}
                            className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${subView === '5y' ? 'bg-white dark:bg-white/10 text-accent-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            5 Años
                        </button>
                        <button
                            onClick={() => setSubView('30y')}
                            className={`px-6 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all ${subView === '30y' ? 'bg-white dark:bg-white/10 text-accent-primary shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            Largo Plazo
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Control Sidebar */}
                <aside className="w-[320px] p-12 overflow-y-auto space-y-12 shrink-0 scrollbar-hide">
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
                                <input type="number" step="0.5" value={investmentReturnRate} onChange={e => setInvestmentReturnRate(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-emerald-500 font-black text-sm tabular-nums outline-none transition-all focus:bg-white dark:focus:bg-white/10" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Inflación (%)</label>
                                <input type="number" step="0.5" value={inflationRate} onChange={e => setInflationRate(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-rose-500 font-black text-sm tabular-nums outline-none transition-all focus:bg-white dark:focus:bg-white/10" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Int. Línea (%)</label>
                                <input type="number" step="0.5" value={creditLineInterest} onChange={e => setCreditLineInterest(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-xl px-4 py-3 text-rose-400 font-black text-sm tabular-nums outline-none transition-all focus:bg-white dark:focus:bg-white/10" title="Interés mensual de la línea de crédito" />
                            </div>
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Pasivos Aplicados</h3>
                            <button onClick={() => setIsLoanModalOpen(true)} className="p-2 text-slate-400 hover:text-accent-primary transition-colors"><Plus size={18} /></button>
                        </div>
                        <div className="space-y-3">
                            {loans.map((loan, idx) => (
                                <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-white/5 rounded-2xl group/loan">
                                    <div className="min-w-0">
                                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{loan.name}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest">{formatCurrency(loan.monthlyPayment)} · {loan.remainingInstallments}m</p>
                                    </div>
                                    <button onClick={() => setLoans(loans.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/loan:opacity-100 transition-all p-2"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>

                {/* Main Visualization Area */}
                <main className="flex-1 overflow-hidden flex flex-col p-12 space-y-12">
                    <div className="flex-1 min-h-[400px] flex flex-col relative">
                        <div className="flex justify-between items-end mb-12">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">
                                    {subView === '5y' ? 'Dinámica de Flujo y Patrimonio' : 'Curva de Crecimiento Patrimonial'}
                                </h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em]">Poder Adquisitivo Nominal vs Real (Ajustado)</p>
                            </div>
                            <div className="flex gap-10">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${subView === '5y' ? 'bg-accent-primary' : 'bg-emerald-500'}`}></div>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nominal</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 border border-slate-300 dark:border-slate-700 rounded-full"></div>
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Real</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 group">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={subView === '5y' ? data5Y : data30Y}>
                                    <defs>
                                        <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={subView === '5y' ? '#6366f1' : '#10b981'} stopOpacity={0.2} />
                                            <stop offset="95%" stopColor={subView === '5y' ? '#6366f1' : '#10b981'} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#00000005" dark:stroke="#ffffff05" vertical={false} />
                                    <XAxis
                                        dataKey={subView === '5y' ? 'month' : 'year'}
                                        stroke="#94a3b8"
                                        fontSize={9}
                                        fontWeight={900}
                                        tickLine={false}
                                        axisLine={false}
                                        tick={{ fill: '#94a3b8', dy: 15 }}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={9}
                                        fontWeight={900}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`}
                                        tick={{ fill: '#94a3b8' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '24px', backgroundColor: '#fff', darkBackgroundColor: '#1a1a1a', border: 'none', padding: '24px', boxShadow: '0 30px 60px -12px rgba(0, 0, 0, 0.15)' }}
                                        itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#1a1a1a' }}
                                        labelStyle={{ color: '#6366f1', fontSize: '9px', marginBottom: '12px', textTransform: 'uppercase', fontWeight: '900', letterSpacing: '0.2em' }}
                                        formatter={(value) => formatCurrency(value)}
                                        cursor={{ stroke: '#00000008', darkStroke: '#ffffff08', strokeWidth: 40 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="wealth"
                                        stroke={subView === '5y' ? '#6366f1' : '#10b981'}
                                        strokeWidth={4}
                                        fillOpacity={1}
                                        fill="url(#colorProg)"
                                        animationDuration={1500}
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

                    {/* Milestones Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 shrink-0 pb-12">
                        {(subView === '5y' ? [12, 24, 48, 60] : [5, 10, 20, 30]).map(val => {
                            const point = subView === '5y' ? data5Y[val - 1] : data30Y.find(d => d.year === val);
                            if (!point) return null;
                            return (
                                <div key={val} className="bg-slate-50 dark:bg-white/5 p-8 rounded-[2rem] hover:scale-[1.02] transition-all duration-500 cursor-default">
                                    <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.2em] mb-3">
                                        {subView === '5y' ? `Mes ${val}` : `Año ${val}`}
                                    </p>
                                    <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter tabular-nums mb-3">{formatCurrency(point.wealth)}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[11px] text-slate-400 font-black uppercase">Valor Real:</span>
                                        <span className={`text-xs font-black tabular-nums ${subView === '5y' ? 'text-accent-primary' : 'text-emerald-500'}`}>{formatCurrency(point.realWealth)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </main>
            </div>

            {isLoanModalOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-50 p-6">
                    <div className="glass-panel p-10 w-full max-w-md animate-in zoom-in duration-300 border-white/5">
                        <div className="mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                                <Plus size={24} className="text-indigo-500" />
                                Agregar Apalancamiento / Deuda
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Integración de Pasivos</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Descripción</label>
                                <input placeholder="e.g. Mortgage, Car Loan" className="w-full bg-white/5 border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-indigo-500 transition-all font-bold"
                                    value={newLoan.name} onChange={e => setNewLoan({ ...newLoan, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Costo Mensual</label>
                                    <input type="number" placeholder="0" className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 rounded-2xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-black text-sm tabular-nums"
                                        value={newLoan.monthlyPayment} onChange={e => setNewLoan({ ...newLoan, monthlyPayment: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Plazo (Meses)</label>
                                    <input type="number" placeholder="0" className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-200 dark:border-white/5 p-4 rounded-2xl text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-all font-black text-sm tabular-nums"
                                        value={newLoan.remainingInstallments} onChange={e => setNewLoan({ ...newLoan, remainingInstallments: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setIsLoanModalOpen(false)} className="flex-1 btn-secondary text-sm">Cancelar</button>
                            <button onClick={() => {
                                if (newLoan.name && newLoan.monthlyPayment) {
                                    setLoans([...loans, newLoan]);
                                    setIsLoanModalOpen(false);
                                    setNewLoan({ name: '', monthlyPayment: '', remainingInstallments: '' });
                                }
                            }} className="flex-1 btn-primary text-sm shadow-indigo-500/20 shadow-xl">Desplegar Pasivo</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
