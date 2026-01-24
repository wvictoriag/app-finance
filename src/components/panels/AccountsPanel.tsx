import React, { memo } from 'react';
import { Plus, Pencil, Trash2, CheckCircle2, AlertCircle, Scale } from 'lucide-react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import type { Account } from '../../types';
import { Tooltip } from '../ui/Tooltip';
import { CardSkeleton } from '../ui/Skeleton';
import { useRegion } from '../../contexts/RegionContext';
import { useDashboard } from '../../contexts/DashboardContext';
import { useDashboardUI } from '../../contexts/DashboardUIContext';

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
        loadingAccs,
        transactionSums,
        deleteAccount
    } = useDashboard();

    const onSelectAccount = (acc: Account) => {
        setSelectedAccount(selectedAccount?.id === acc.id ? null : acc);
    };

    const onDeleteAccount = async (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar esta cuenta? SE ELIMINARÁN TODAS LAS TRANSACCIONES ASOCIADAS. Esta acción no se puede deshacer.')) {
            await deleteAccount(id);
            if (selectedAccount?.id === id) {
                setSelectedAccount(null);
            }
        }
    };

    const selectedAccountId = selectedAccount?.id;
    const totalEquity = accounts.reduce((sum: number, acc: Account) => {
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
                {loadingAccs ? (
                    <>
                        <CardSkeleton />
                        <CardSkeleton />
                        <CardSkeleton />
                    </>
                ) : accounts.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-slate-200 dark:border-white/10">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No hay cuentas</p>
                    </div>
                ) : (
                    accounts.map(acc => {
                        const sums = transactionSums?.[acc.id] || 0;
                        const initial = Number(acc.initial_balance) || 0;
                        const expected = initial + sums;
                        const current = Number(acc.balance);
                        const diff = current - expected;
                        const isSquared = Math.round(current) === Math.round(expected);

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
                                className={`group relative p-3 md:p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${isSelected
                                    ? 'bg-white dark:bg-white/10 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.01] md:scale-[1.02] z-10'
                                    : 'bg-white/40 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2 md:mb-4">
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2 mb-0.5 md:mb-1">
                                            <div className="bg-blue-600 dark:bg-blue-500 px-1.5 md:px-2 py-0.5 rounded-md shrink-0">
                                                <span className="text-[8px] md:text-[9px] font-black text-white uppercase tracking-widest">{typeTag}</span>
                                            </div>
                                            <h3 className="font-black text-slate-900 dark:text-white text-xs md:text-sm lg:text-base tracking-tight truncate">
                                                {acc.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-[120px] md:max-w-[150px]">
                                                {mainLabel} {acc.account_number && `• ${acc.account_number}`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0 ml-2 md:ml-4">
                                        <div className={`text-sm md:text-base lg:text-lg font-black tracking-tighter whitespace-nowrap ${(isCreditLine && (Number(acc.credit_limit || 0) + Number(acc.balance)) < 0) ||
                                            (isCreditCard && Number(acc.balance) < 0) ? 'text-rose-500' : 'text-slate-900 dark:text-white'
                                            }`}>
                                            {formatCurrency(amountValue)}
                                        </div>
                                        {subInfo && (
                                            <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-0.5 md:mt-1">
                                                {subInfo}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 md:pt-3 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex flex-col">
                                        {!isSquared ? (
                                            <div className="flex items-center gap-1.5 md:gap-2">
                                                <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 md:px-2 py-0.5 rounded-full">
                                                    <AlertCircle size={10} strokeWidth={3} />
                                                    <span className="text-[7px] md:text-[9px] font-black uppercase tracking-tighter">Descuadrada</span>
                                                </div>
                                                <span className="text-[8px] md:text-[10px] font-black text-amber-600 dark:text-amber-500">
                                                    Dif: {formatCurrency(diff)}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 md:gap-1.5 text-emerald-500">
                                                <CheckCircle2 size={12} strokeWidth={3} />
                                                <span className="text-[7px] md:text-[9px] font-black uppercase tracking-tighter">Cuadrada</span>
                                            </div>
                                        )}
                                        <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5 md:mt-1">
                                            {acc.last_update ? `Actualizado: ${formatDate(acc.last_update)}` : 'Sin fecha'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1 md:gap-1.5 opacity-0 group-hover:opacity-100 transition-all scale-90 md:scale-95 group-hover:scale-100">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onReconcile(acc); }}
                                            className="p-1.5 md:p-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
                                            title="Reconciliar Saldo Real"
                                        >
                                            <Scale size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditAccount(acc); }}
                                            className="p-1.5 md:p-2 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-blue-500 rounded-lg transition-all"
                                            title="Editar Cuenta"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteAccount(acc.id); }}
                                            className="p-1.5 md:p-2 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
                                            title="Eliminar Cuenta"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="bg-slate-100 dark:bg-slate-900/60 p-3 md:p-4 rounded-3xl mt-2 relative overflow-hidden group shrink-0">
                <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-accent-primary/5 blur-2xl transition-all"></div>
                <span className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] relative z-10 leading-none">Total Patrimonio</span>
                <div className="text-xl md:text-2xl lg:text-3xl font-black mt-1 tracking-tighter relative z-10 text-slate-900 dark:text-white leading-none">
                    {formatCurrency(totalEquity)}
                </div>
            </div>
        </div>
    );
};

export const AccountsPanel = memo(AccountsPanelComponent);
