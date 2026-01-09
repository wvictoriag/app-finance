import React from 'react';
import { Pencil, Trash2, ArrowRightLeft } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Transaction } from '../../types';

interface TransactionsPanelProps {
    transactions: Transaction[];
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filterType: string;
    setFilterType: (type: string) => void;
    onEdit: (transaction: Transaction) => void;
    onDelete: (id: string) => void;
}

export const TransactionsPanel: React.FC<TransactionsPanelProps> = ({
    transactions,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    onEdit,
    onDelete
}) => {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="mb-6 px-4">
                <div className="flex justify-between items-center mb-6 px-1">
                    <div>
                        <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Movimientos</h2>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Historial Reciente</p>
                    </div>
                </div>

                <div className="relative group mx-1">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all font-medium"
                    />
                    <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-accent-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>

                <div className="flex gap-4 mt-6 px-1">
                    {['all', 'income', 'expense', 'transfer'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`text-[11px] font-black uppercase tracking-[0.2em] transition-all ${filterType === type
                                ? 'text-accent-primary'
                                : 'text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400'
                                }`}
                        >
                            {type === 'all' ? 'Todo' : type === 'income' ? 'Ingresos' : type === 'expense' ? 'Egresos' : 'Transf'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-0.5 pr-1 scrollbar-hide px-4">
                {transactions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <ArrowRightLeft className="w-8 h-8 text-slate-200 dark:text-slate-800 mb-4" />
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Sin movimientos</p>
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="group flex justify-between items-center p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 cursor-default">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-1 h-6 rounded-full shrink-0 ${tx.destination_account_id ? 'bg-blue-400' :
                                    Number(tx.amount) < 0 ? 'bg-rose-500' : 'bg-emerald-500'
                                    }`}></div>
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                        {tx.destination_account_id ? (
                                            <span className="flex items-center gap-2">
                                                {tx.description || 'Transferencia'}
                                            </span>
                                        ) : (
                                            tx.description || tx.categories?.name || 'Varios'
                                        )}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-2 mt-0.5">
                                        <span className="truncate max-w-[120px]">
                                            {tx.destination_account_id ? (
                                                <span className="flex items-center gap-1">
                                                    {tx.accounts?.name} <ArrowRightLeft size={10} className="text-blue-400" /> {tx.destination_account?.name}
                                                </span>
                                            ) : (
                                                tx.accounts?.name
                                            )}
                                        </span>
                                        <span className="opacity-30">•</span>
                                        <span>{formatDate(tx.date)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className={`font-black text-xs tabular-nums text-right min-w-[100px] ${tx.destination_account_id ? 'text-blue-500' :
                                    Number(tx.amount) < 0 ? 'text-rose-500' : 'text-emerald-500'
                                    }`}>
                                    {formatCurrency(tx.amount)}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                                    <button onClick={() => onEdit(tx)} className="p-1.5 text-slate-300 hover:text-slate-600 dark:hover:text-white transition-colors"><Pencil size={12} /></button>
                                    <button onClick={() => onDelete(tx.id)} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
