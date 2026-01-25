import React from 'react';
import { X, Info, Landmark, Receipt, CreditCard, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface BreakdownModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        liquid: number;
        receivable: number;
        debt: number;
        total: number;
    };
}

export function BreakdownModal({ isOpen, onClose, data }: BreakdownModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div
                className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-sm w-full overflow-hidden border border-white/20"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-blue-600 p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                        aria-label="Cerrar ventana"
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-white/20 p-2 rounded-xl" aria-hidden="true">
                            <ShieldCheck size={24} />
                        </div>
                        <h3 id="modal-title" className="text-xl font-black tracking-tight">Tu Patrimonio Rico</h3>
                    </div>
                    <p className="text-blue-100 text-sm font-medium opacity-80">Desglose detallado de tu valor neto actual.</p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        {/* Liquid */}
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl">
                            <div className="flex items-center gap-3">
                                <Landmark className="text-slate-400" size={18} />
                                <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Cuentas y Cajas</span>
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                {formatCurrency(data.liquid)}
                            </span>
                        </div>

                        {/* Receivables */}
                        <div className="flex items-center justify-between p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                            <div className="flex items-center gap-3">
                                <Receipt className="text-emerald-500" size={18} />
                                <span className="text-sm font-bold text-emerald-600">Saldos por Cobrar</span>
                            </div>
                            <span className="text-sm font-black text-emerald-600">
                                {formatCurrency(data.receivable)}
                            </span>
                        </div>

                        {/* Debts */}
                        <div className="flex items-center justify-between p-4 bg-rose-500/5 rounded-2xl border border-rose-500/10">
                            <div className="flex items-center gap-3">
                                <CreditCard className="text-rose-500" size={18} />
                                <span className="text-sm font-bold text-rose-500">Deudas y Créditos</span>
                            </div>
                            <span className="text-sm font-black text-rose-600">
                                {formatCurrency(data.debt)}
                            </span>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Total Real</span>
                        <div className="text-3xl font-black text-blue-600 tracking-tighter">
                            {formatCurrency(data.total)}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all active:scale-[0.98]"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>
    );
}
