import React, { memo } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, Scale } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account } from '../../types';
import { useDashboard } from '../../contexts/DashboardContext';
import { useDashboardUI } from '../../contexts/DashboardUIContext';
import { useRegion } from '../../contexts/RegionContext';

interface AccountsPanelProps {
    onAddAccount: () => void;
    onEditAccount: (account: Account) => void;
    onReconcile: (account: Account) => void;
}

const AccountsPanelComponent: React.FC<AccountsPanelProps> = ({
    onAddAccount,
    onEditAccount,
    onReconcile
}) => {
    const {
        selectedAccount,
        setSelectedAccount
    } = useDashboardUI();

    const {
        accounts,
        transactionSums,
        deleteAccount
    } = useDashboard();

    const onSelectAccount = (acc: Account) => {
        setSelectedAccount(selectedAccount?.id === acc.id ? null : acc);
    };

    const onDeleteAccount = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar esta cuenta?')) {
            await deleteAccount(id);
        }
    };

    const selectedAccountId = selectedAccount?.id;
    const totalEquity = accounts.reduce((sum, acc) => {
        return sum + Number(acc.balance);
    }, 0);

    return (
        <div className="h-full flex flex-col overflow-hidden p-2 lg:p-4">
            <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Cuentas</h2>
                <button
                    onClick={onAddAccount}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                    title="Agregar Cuenta"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pb-4 pr-1 scrollbar-hide">
                {accounts.map(acc => {
                    const sums = transactionSums?.[acc.id] || 0;
                    const initial = Number(acc.initial_balance) || 0;
                    const isSquared = Math.round(Number(acc.balance)) === Math.round(initial + sums);

                    const isCreditLine = acc.type === 'CreditLine';
                    const isCreditCard = acc.type === 'Credit';
                    const isReceivable = acc.type === 'Receivable';

                    // Display Values
                    let mainLabel = acc.bank || 'Institución';
                    let amountValue = Number(acc.balance);
                    let subInfo: string | null = null;
                    let typeTag = '';

                    switch (acc.type) {
                        case 'Checking':
                            typeTag = 'CC';
                            mainLabel = acc.bank || 'Cta. Corriente';
                            break;
                        case 'Vista':
                            typeTag = 'CV';
                            mainLabel = acc.bank || 'Cta. Vista';
                            break;
                        case 'Savings':
                            typeTag = 'CA';
                            mainLabel = acc.bank || 'Cta. Ahorro';
                            break;
                        case 'CreditLine':
                            typeTag = 'LC';
                            mainLabel = 'Línea Disponible';
                            const usageLC = amountValue < 0 ? Math.abs(amountValue) : 0;
                            amountValue = Number(acc.credit_limit || 0) + Number(acc.balance);
                            subInfo = `Uso: ${formatCurrency(usageLC)}`;
                            break;
                        case 'Credit':
                            typeTag = 'TC';
                            mainLabel = 'Deuda Tarjeta';
                            const debt = amountValue < 0 ? Math.abs(amountValue) : 0;
                            const available = Number(acc.credit_limit || 0) - debt;
                            amountValue = debt;
                            subInfo = `Libre: ${formatCurrency(available)}`;
                            break;
                        case 'Receivable':
                            typeTag = 'CXC';
                            mainLabel = 'Por Cobrar';
                            break;
                        case 'Payable':
                            typeTag = 'CXP';
                            mainLabel = 'Por Pagar';
                            break;
                        case 'Investment':
                            typeTag = 'INV';
                            mainLabel = 'Inversión';
                            break;
                        case 'Asset':
                            typeTag = 'ACT';
                            mainLabel = 'Activo / Bien';
                            break;
                        case 'Cash':
                            typeTag = 'EFV';
                            mainLabel = 'Efectivo';
                            break;
                    }
                    const isSelected = selectedAccountId === acc.id;

                    return (
                        <div
                            key={acc.id}
                            onClick={() => onSelectAccount(acc)}
                            className={`group relative p-3 rounded-xl border transition-all duration-300 cursor-pointer ${isSelected
                                ? 'bg-white dark:bg-white/10 border-blue-500/50 shadow-lg shadow-blue-500/10'
                                : 'bg-white/40 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 shadow-sm'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex flex-col min-w-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-bold text-slate-900 dark:text-white text-xs lg:text-sm tracking-tight truncate">{acc.name}</span>
                                        {!isSquared && (
                                            <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full animate-pulse">
                                                <AlertCircle size={10} strokeWidth={3} />
                                                <span className="text-[8px] font-black uppercase tracking-tighter">Descuadrada</span>
                                            </div>
                                        )}
                                        {isSquared && <CheckCircle2 size={12} className="text-emerald-500" />}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <div className="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                                            <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{typeTag}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">
                                            {mainLabel} {acc.account_number && `• ${acc.account_number}`}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0 ml-2">
                                    <div className={`text-xs lg:text-sm font-black tracking-tighter whitespace-nowrap ${(isCreditLine && (Number(acc.credit_limit || 0) + Number(acc.balance)) < 0) ||
                                        (isCreditCard && Number(acc.balance) < 0) ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                                        }`}>
                                        {formatCurrency(amountValue)}
                                    </div>
                                    {subInfo && (
                                        <span className="text-[8px] lg:text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">
                                            {subInfo}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                    {acc.last_update ? `Act: ${formatDate(acc.last_update)}` : 'Sin fecha'}
                                    {(isCreditLine || isCreditCard) && ` • Cupo: ${formatCurrency(acc.credit_limit || 0)}`}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onReconcile(acc); }}
                                        className="text-slate-400 hover:text-amber-500 transition-colors"
                                        title="Reconciliar Saldo"
                                    >
                                        <Scale size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEditAccount(acc); }}
                                        className="text-slate-400 hover:text-accent-primary transition-colors"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteAccount(acc.id); }}
                                        className="text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-slate-100 dark:bg-slate-900/60 p-4 rounded-3xl mt-2 relative overflow-hidden group shrink-0">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-accent-primary/5 blur-2xl transition-all"></div>
                <span className="text-[10px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10">Total Patrimonio</span>
                <div className="text-2xl lg:text-3xl font-black mt-1 tracking-tighter relative z-10 text-slate-900 dark:text-white">
                    {formatCurrency(totalEquity)}
                </div>
            </div>
        </div>
    );
};

export const AccountsPanel = memo(AccountsPanelComponent);
