import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/formatters';
import type { MonthlyControlItem } from '../../types';

interface CategoryChartProps {
    items: MonthlyControlItem[];
}

const COLORS = [
    '#6366f1', // Indigo
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
];

export const CategoryChart: React.FC<CategoryChartProps> = ({ items }) => {
    // Only show expenses for this specific pie chart
    const data = items
        .filter(item => (item.type === 'Gastos Fijos' || item.type === 'Gastos Variables') && Math.abs(item.real) > 0)
        .map(item => ({
            name: item.name,
            value: Math.abs(item.real)
        }))
        .sort((a, b) => b.value - a.value);

    if (data.length === 0) {
        return (
            <div className="h-48 flex items-center justify-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                Sin datos de gastos
            </div>
        );
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            border: 'none',
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 'bold'
                        }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: any) => formatCurrency(Number(value || 0))}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};
