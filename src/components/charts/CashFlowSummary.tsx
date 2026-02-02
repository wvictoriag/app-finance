import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import type { MonthlyControlItem } from '../../types';

interface CashFlowSummaryProps {
    items: MonthlyControlItem[];
}

export const CashFlowSummary: React.FC<CashFlowSummaryProps> = ({ items }) => {
    const totalIncome = items
        .filter(item => item.type === 'Ingresos')
        .reduce((sum, item) => sum + Number(item.real), 0);

    const totalExpenses = items
        .filter(item => item.type === 'Gastos Fijos' || item.type === 'Gastos Variables')
        .reduce((sum, item) => sum + Math.abs(Number(item.real)), 0);

    const data = [
        { name: 'Ingresos', value: totalIncome, color: '#10b981' },
        { name: 'Gastos', value: totalExpenses, color: '#ef4444' }
    ];

    return (
        <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={data} layout="vertical" margin={{ left: -20, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }} />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px'
                        }}
                        formatter={(value: any) => formatCurrency(Number(value))}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};
