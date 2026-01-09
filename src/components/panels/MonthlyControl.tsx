import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatters';
import type { MonthlyControlItem } from '../../types';

interface MonthlyControlProps {
    monthlyControl: MonthlyControlItem[];
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
}

export const MonthlyControl: React.FC<MonthlyControlProps> = ({
    monthlyControl,
    selectedDate,
    setSelectedDate
}) => {
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'Ingresos': true,
        'Gastos Fijos': true,
        'Gastos Variables': true,
        'Ahorro': true
    });

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-1 pt-4">
                <div className="pl-6">
                    <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ejecución</h2>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Control Mensual</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50/50 dark:bg-white/5 p-1 rounded-2xl mr-6">
                    <button
                        onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
                        className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Mes anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-black px-2 py-1 text-slate-900 dark:text-white min-w-[140px] text-center uppercase tracking-[0.2em]">
                        {format(selectedDate, 'MMMM yyyy', { locale: es })}
                    </span>
                    <button
                        onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
                        className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        title="Mes siguiente"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 space-y-8 scrollbar-hide pb-6">
                {['Ingresos', 'Gastos Fijos', 'Gastos Variables', 'Ahorro'].map((groupType) => {
                    const groupItems = monthlyControl
                        .filter(item => item.type === groupType)
                        .filter(item => Math.abs(Number(item.real)) > 0 || Math.abs(Number(item.monthly_budget)) > 0);

                    if (groupItems.length === 0) return null;

                    const totalReal = groupItems.reduce((sum, item) => sum + Number(item.real), 0);
                    const isExpanded = expandedGroups[groupType];

                    return (
                        <div key={groupType} className="space-y-4">
                            <div
                                onClick={() => toggleGroup(groupType)}
                                className="flex items-center justify-between cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors">{groupType}</h3>
                                    <div className={`text-xs font-black tabular-nums transition-all ${totalReal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {formatCurrency(totalReal)}
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full transition-all ${isExpanded ? 'bg-accent-primary scale-125' : 'bg-slate-200 dark:bg-white/10'}`}></div>
                            </div>

                            {isExpanded && (
                                <div className="space-y-4 pl-1">
                                    {groupItems.map(item => {
                                        const real = Math.abs(Number(item.real));
                                        const budget = Math.abs(Number(item.monthly_budget));
                                        const percent = budget > 0 ? (real / budget) * 100 : 0;

                                        return (
                                            <div key={item.id} className="space-y-2 group/item">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{item.name}</p>
                                                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                                                            Presupuesto: {formatCurrency(item.monthly_budget)}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-black tabular-nums text-slate-900 dark:text-white">{formatCurrency(item.real)}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{Math.round(percent)}%</p>
                                                    </div>
                                                </div>
                                                <div className="h-1 w-full bg-slate-50 dark:bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${groupType === 'Ingresos' || groupType === 'Ahorro'
                                                            ? 'bg-emerald-500'
                                                            : (percent > 100 ? 'bg-rose-500' : 'bg-accent-primary')
                                                            }`}
                                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
