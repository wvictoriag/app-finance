import React, { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, startOfWeek, endOfWeek, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import type { Transaction } from '../../types';

interface CalendarViewProps {
    transactions: Transaction[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ transactions }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = useMemo(() => {
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [startDate, endDate]);

    const getDayData = (day: Date) => {
        const dayTransactions = transactions.filter(tx => isSameDay(new Date(tx.date), day));
        const income = dayTransactions
            .filter(tx => Number(tx.amount) > 0 && !tx.destination_account_id)
            .reduce((sum, tx) => sum + Number(tx.amount), 0);
        const expense = dayTransactions
            .filter(tx => Number(tx.amount) < 0 && !tx.destination_account_id)
            .reduce((sum, tx) => sum + Math.abs(Number(tx.amount)), 0);

        return { income, expense, count: dayTransactions.length };
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    return (
        <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Calendario</h2>
                <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
                    <button onClick={prevMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors">
                        <ChevronLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 w-32 text-center uppercase tracking-widest">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </span>
                    <button onClick={nextMonth} className="p-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl transition-colors">
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-white/5 rounded-[2.5rem] p-6 shadow-xl border border-slate-100 dark:border-white/5 flex flex-col overflow-hidden">
                {/* Headers */}
                <div className="grid grid-cols-7 mb-4">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                        <div key={day} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex-1 grid grid-cols-7 grid-rows-6 gap-2">
                    {calendarDays.map((day, idx) => {
                        const { income, expense, count } = getDayData(day);
                        const isCurrentMonth = isSameMonth(day, monthStart);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={idx}
                                className={`
                                    relative rounded-2xl p-2 transition-all group border
                                    ${!isCurrentMonth ? 'opacity-30 bg-slate-50/50 dark:bg-white/5 border-transparent' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-indigo-400/30'}
                                    ${isToday ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
                                `}
                            >
                                <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-500' : 'text-slate-400'} block mb-1`}>
                                    {format(day, 'd')}
                                </span>

                                {count > 0 && (
                                    <div className="space-y-1">
                                        {income > 0 && (
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md truncate">
                                                <TrendingUp size={10} className="shrink-0" />
                                                <span className="truncate">{formatCurrency(income)}</span>
                                            </div>
                                        )}
                                        {expense > 0 && (
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md truncate">
                                                <TrendingDown size={10} className="shrink-0" />
                                                <span className="truncate">{formatCurrency(expense)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
