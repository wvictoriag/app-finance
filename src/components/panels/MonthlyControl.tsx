import React, { useState, memo } from 'react';
import { ChevronLeft, ChevronRight, PieChart as PieIcon, List, AlertTriangle, AlertCircle, FileText } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../../utils/formatters';
import type { MonthlyControlItem } from '../../types';
import { CategoryChart } from '../charts/CategoryChart';
import { CashFlowSummary } from '../charts/CashFlowSummary';
import { useDashboard } from '../../contexts/DashboardContext';
import { useDashboardUI } from '../../contexts/DashboardUIContext';

interface MonthlyControlProps {
}

import { CardSkeleton } from '../ui/Skeleton';

const MonthlyControlComponent: React.FC<MonthlyControlProps> = () => {
    const {
        selectedDate,
        setSelectedDate
    } = useDashboardUI();

    const {
        monthlyControl,
        loadingMonth
    } = useDashboard();
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        'Ingresos': true,
        'Gastos Fijos': true,
        'Gastos Variables': true,
        'Ahorro': true
    });
    const [showChart, setShowChart] = useState(true);

    const toggleGroup = (group: string) => {
        setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
    };

    const handleExportPDF = () => {
        window.print();
    };

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-1 pt-4">
                <div className="pl-6">
                    <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ejecución</h2>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Control Mensual</p>
                        <div className="flex items-center gap-1 print:hidden">
                            <button
                                onClick={() => setShowChart(!showChart)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-all text-slate-400"
                                title={showChart ? "Ver Lista" : "Ver Gráfico"}
                            >
                                {showChart ? <List size={14} /> : <PieIcon size={14} />}
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-all text-slate-400"
                                title="Exportar PDF"
                            >
                                <FileText size={14} />
                            </button>
                        </div>
                    </div>
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
                {loadingMonth ? (
                    <div className="space-y-6">
                        <CardSkeleton />
                        <CardSkeleton />
                    </div>
                ) : showChart && (
                    <div className="space-y-4">
                        <div className="bg-slate-50/50 dark:bg-white/5 rounded-3xl p-4 border border-slate-100 dark:border-white/5">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Distribución de Gastos</h4>
                            <CategoryChart items={monthlyControl} />
                        </div>
                        <div className="bg-slate-50/50 dark:bg-white/5 rounded-3xl p-4 border border-slate-100 dark:border-white/5">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Resumen Flujo</h4>
                            <CashFlowSummary items={monthlyControl} />
                        </div>
                    </div>
                )}
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

                                        // Determine color based on percent
                                        let colorClass = 'bg-emerald-500';
                                        if (percent > 100) colorClass = 'bg-rose-600 animate-pulse';
                                        else if (percent > 90) colorClass = 'bg-rose-500';
                                        else if (percent > 70) colorClass = 'bg-amber-400';

                                        return (
                                            <div key={item.id} className={`p-3 rounded-2xl border transition-all duration-300 ${percent > 100 ? 'bg-rose-50/50 dark:bg-rose-500/5 border-rose-200/50 dark:border-rose-500/20' : 'bg-transparent border-transparent'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                                                            {percent > 100 && (
                                                                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 animate-bounce">
                                                                    <AlertTriangle size={12} strokeWidth={3} />
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Excedido</span>
                                                                </div>
                                                            )}
                                                            {percent > 90 && percent <= 100 && (
                                                                <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                                                                    <AlertCircle size={12} strokeWidth={3} />
                                                                    <span className="text-[8px] font-black uppercase tracking-tighter">Límite</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <span className={`text-[10px] font-bold ${real > budget ? 'text-rose-500' : 'text-slate-400'}`}>
                                                            {formatCurrency(real)} / {formatCurrency(budget)}
                                                        </span>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-4">
                                                        <p className={`text-sm font-black tabular-nums ${real > budget ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                                            {formatCurrency(item.real)}
                                                        </p>
                                                        <p className={`text-[10px] font-black uppercase tracking-widest ${percent > 100 ? 'text-rose-500' : 'text-slate-400'}`}>
                                                            {Math.round(percent)}%
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="h-2 bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                                                        style={{ width: `${Math.min(percent, 100)}%` }}
                                                    />
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

export const MonthlyControl = memo(MonthlyControlComponent);
