import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import type { Category, Transaction } from '../../types';

interface StatsOverviewProps {
    transactions: Transaction[];
    categories: Category[];
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ transactions, categories }) => {

    // 1. Expense by Category (Pie Chart)
    const categoryData = useMemo(() => {
        const expenses = transactions.filter(t => (t as any).type === 'expense' || (Number(t.amount) < 0 && !t.destination_account_id));
        const catMap = new Map<string, number>();

        expenses.forEach(tx => {
            const catName = categories.find(c => c.id === tx.category_id)?.name || 'Sin Categoría';
            const amount = Math.abs(Number(tx.amount));
            catMap.set(catName, (catMap.get(catName) || 0) + amount);
        });

        return Array.from(catMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .filter(item => item.value > 0);
    }, [transactions, categories]);

    // 2. Income vs Expense (Bar/Area Chart - Last 6 Months Mock/Real)
    // Since we only have 'transactions', we'll group by month.
    const monthlyTrend = useMemo(() => {
        const monthMap = new Map<string, { income: number, expense: number }>();

        transactions.forEach(tx => {
            const date = new Date(tx.date);
            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthMap.has(key)) monthMap.set(key, { income: 0, expense: 0 });
            const entry = monthMap.get(key)!;

            const val = Number(tx.amount);
            if (val > 0 && !tx.destination_account_id) entry.income += val;
            if (val < 0 && !tx.destination_account_id) entry.expense += Math.abs(val);
        });

        // Convert and sort
        return Array.from(monthMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [transactions]);

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    if (transactions.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400 font-medium">
                No hay suficientes datos para mostrar estadísticas.
            </div>
        );
    }

    return (
        <div className="p-6 h-full overflow-y-auto space-y-8 scrollbar-hide pb-24">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">Estadísticas Financieras</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Gastos por Categoría */}
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Gastos por Categoría</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: number | string | undefined) => formatCurrency(Number(value || 0))}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Ingresos vs Gastos */}
                <div className="bg-white dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Flujo de Caja Mensual</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `$${val / 1000}k`} />
                                <Tooltip
                                    formatter={(value: number | string | undefined) => formatCurrency(Number(value || 0))}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend />
                                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expense" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </div>
    );
};
