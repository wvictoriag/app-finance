import React, { useState, memo } from 'react';
import { Pencil, Trash2, ArrowRightLeft, Filter, X, Download } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Transaction } from '../../types';
import { exportTransactionsToCSV } from '../../utils/exportUtils';
import { useDashboard } from '../../contexts/DashboardContext';
import { useDashboardUI } from '../../contexts/DashboardUIContext';

interface TransactionsPanelProps {
    onEdit: (transaction: Transaction) => void;
}

import { ListItemSkeleton } from '../ui/Skeleton';

const TransactionsPanelComponent: React.FC<TransactionsPanelProps> = ({
    onEdit
}) => {
    const {
        searchQuery,
        setSearchQuery,
        filterType,
        setFilterType,
        selectedAccount,
        setSelectedAccount,
        dateRange,
        setDateRange,
        filterCategory,
        setFilterCategory,
        amountRange,
        setAmountRange
    } = useDashboardUI();

    const {
        filteredTransactions: transactions,
        deleteTransaction: onDelete,
        deleteTransactions: onBulkDelete,
        categories,
        loadingRecent
    } = useDashboard();

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const onClearAccountFilter = () => setSelectedAccount(null);
    const [showFilters, setShowFilters] = useState(false);

    const activeFiltersCount = [
        dateRange.from, dateRange.to, filterCategory, amountRange.min, amountRange.max
    ].filter(Boolean).length;

    const clearFilters = () => {
        setDateRange({ from: '', to: '' });
        setFilterCategory('');
        setAmountRange({ min: '', max: '' });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(transactions.map(tx => tx.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleToggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (window.confirm(`¿Estás seguro de eliminar ${selectedIds.length} transacciones?`)) {
            try {
                await onBulkDelete(selectedIds);
                setSelectedIds([]);
            } catch (err: any) {
                console.error(err);
            }
        }
    };

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
                                        <X size={10} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{selectedAccount ? 'Mostrando historial de cuenta' : 'Historial Reciente'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIds.length > 0 && (
                            <button
                                onClick={handleBulkDelete}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-widest"
                            >
                                <Trash2 size={12} />
                                Borrar ({selectedIds.length})
                            </button>
                        )}
                        <button
                            onClick={() => exportTransactionsToCSV(transactions)}
                            className="p-2 text-slate-400 hover:text-emerald-500 transition-colors"
                            title="Exportar a CSV"
                        >
                            <Download size={16} />
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-4 px-1">
                    <input
                        type="checkbox"
                        checked={transactions.length > 0 && selectedIds.length === transactions.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Todo</span>
                </div>

                <div className="flex gap-2">
                    <div className="relative group flex-1">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition-all font-medium"
                        />
                        <svg className="absolute left-3.5 top-3 w-4 h-4 text-slate-300 dark:text-slate-600 group-focus-within:text-accent-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2.5 rounded-xl transition-all flex items-center justify-center relative ${showFilters || activeFiltersCount > 0 ? 'bg-accent-primary text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white'}`}
                    >
                        <Filter size={18} />
                        {activeFiltersCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
                                {activeFiltersCount}
                            </div>
                        )}
                    </button>
                </div>

                {/* Advanced Filters Panel */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtros Avanzados</h3>
                            {activeFiltersCount > 0 && (
                                <button onClick={clearFilters} className="text-[10px] font-bold text-rose-500 hover:text-rose-600">
                                    Limpiar Todo
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 ml-1">Desde</label>
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                    className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 ml-1">Hasta</label>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                    className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 ml-1">Categoría</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                            >
                                <option value="">Todas</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 ml-1">Monto Mín</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={amountRange.min}
                                    onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                                    className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-400 ml-1">Monto Máx</label>
                                <input
                                    type="number"
                                    placeholder="Sin límite"
                                    value={amountRange.max}
                                    onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                                    className="w-full p-2 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                                />
                            </div>
                        </div>
                    </div>
                )}

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
                {loadingRecent ? (
                    <>
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                        <ListItemSkeleton />
                    </>
                ) : transactions.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        <ArrowRightLeft className="w-8 h-8 text-slate-200 dark:text-slate-800 mb-4" />
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">Sin movimientos</p>
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className={`group flex justify-between items-center p-2.5 rounded-xl transition-all duration-300 cursor-default ${selectedIds.includes(tx.id) ? 'bg-blue-50/50 dark:bg-blue-500/10 shadow-sm border border-blue-500/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'}`}>
                            <div className="flex items-center gap-4 min-w-0">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(tx.id)}
                                    onChange={() => handleToggleSelect(tx.id)}
                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 opacity-0 group-hover:opacity-100 checked:opacity-100 transition-opacity"
                                />
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

export const TransactionsPanel = memo(TransactionsPanelComponent);
