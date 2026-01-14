import React from 'react';
import { formatCurrency } from '../../utils/formatters';
import type { Account } from '../../types';

interface ReconcileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReconcile: () => void;
    account: Account | null;
    reconcileValue: string;
    setReconcileValue: (value: string) => void;
}

export function ReconcileModal({
    isOpen,
    onClose,
    onReconcile,
    account,
    reconcileValue,
    setReconcileValue
}: ReconcileModalProps) {
    if (!isOpen || !account) return null;

    const difference = Number(reconcileValue) - account.balance;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reconcile-modal-title"
        >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6">
                <h3
                    id="reconcile-modal-title"
                    className="text-xl font-bold text-slate-800 dark:text-white mb-2 tracking-tighter"
                >
                    Reconciliar Saldo
                </h3>
                <p className="text-xs text-slate-400 mb-4">
                    Ingresa el saldo real reportado por tu institución para{' '}
                    <span className="font-bold text-slate-600 dark:text-slate-300">
                        {account.name}
                    </span>.
                </p>

                <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Saldo Actual en App
                        </span>
                        <div className="text-lg font-bold text-slate-600 dark:text-slate-400">
                            {formatCurrency(account.balance)}
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="reconcile-value"
                            className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2"
                        >
                            Nuevo Saldo Real
                        </label>
                        <input
                            id="reconcile-value"
                            type="number"
                            step="any"
                            value={reconcileValue}
                            onChange={(e) => setReconcileValue(e.target.value)}
                            className="w-full rounded-2xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-4 text-2xl font-black tracking-tighter"
                            autoFocus
                            aria-describedby="reconcile-difference"
                        />
                    </div>

                    {difference !== 0 && (
                        <div
                            id="reconcile-difference"
                            className={`p-3 rounded-xl text-sm font-bold ${difference > 0
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400'
                                }`}
                            role="status"
                            aria-live="polite"
                        >
                            Diferencia: {formatCurrency(Math.abs(difference))}
                            {difference > 0 ? ' a favor' : ' en contra'}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onReconcile}
                            className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors"
                        >
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
