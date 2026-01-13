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
    selectedAccount?: any;
    onClearAccountFilter?: () => void;
}

export const TransactionsPanel: React.FC<TransactionsPanelProps> = ({
    transactions,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    onEdit,
    onDelete,
    selectedAccount,
    onClearAccountFilter
}) => {
    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="mb-6 px-4">
                <div className="flex justify-between items-center mb-6 px-1">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <h2 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em]">Movimientos</h2>
                            {selectedAccount && (
                                <div className="flex items-center gap-1.5 bg-blue-500/10 text-blue-500 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20">
                                    <span className="text-[9px] font-black uppercase tracking-tighter shrink-0">Filtrado por: {selectedAccount.name}</span>
                                    <button onClick={(e) => { e.stopPropagation(); onClearAccountFilter?.(); }} className="hover:text-blue-600 dark:hover:text-blue-300">
                                        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"></path></svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{selectedAccount ? 'Mostrando historial de cuenta' : 'Historial Reciente'}</p>
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
