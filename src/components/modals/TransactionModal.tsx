import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, type TransactionFormData } from '../../lib/schemas';
import type { Account, Category, Transaction } from '../../types';
import { useTransactions } from '../../hooks/useTransactions';
import { useRegion } from '../../contexts/RegionContext';
import toast from 'react-hot-toast';

import { useDashboard } from '../../contexts/DashboardContext';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTransaction: Transaction | null;
}

export function TransactionModal({
    isOpen,
    onClose,
    editingTransaction
}: TransactionModalProps) {
    const { settings } = useRegion();
    const { accounts, categories, deleteTransaction } = useDashboard(); // Using existing hook if it has categories
    const { addTransaction, updateTransaction } = useTransactions(100);

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            type: 'expense',
            amount: 0
        }
    });

    const txType = watch('type');

    useEffect(() => {
        if (editingTransaction) {
            let type: 'income' | 'expense' | 'transfer' = 'expense';
            if (editingTransaction.destination_account_id) type = 'transfer';
            else if (Number(editingTransaction.amount) > 0) type = 'income';

            reset({
                account_id: editingTransaction.account_id,
                destination_account_id: editingTransaction.destination_account_id || '',
                date: editingTransaction.date,
                category_id: editingTransaction.category_id || '',
                amount: Math.abs(editingTransaction.amount),
                description: editingTransaction.description || '',
                type: type
            });
        } else {
            reset({
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                amount: 0,
                account_id: '',
                category_id: '',
                description: ''
            });
        }
    }, [editingTransaction, reset, isOpen]);

    const onSubmit = async (data: TransactionFormData) => {
        try {
            let finalAmount = Math.abs(data.amount);
            if (data.type === 'expense') {
                finalAmount = -finalAmount;
            }

            const payload = {
                account_id: data.account_id,
                date: data.date,
                amount: finalAmount,
                description: data.description,
                category_id: data.type === 'transfer' ? null : data.category_id,
                destination_account_id: data.type === 'transfer' ? data.destination_account_id : null
            };

            if (editingTransaction) {
                await updateTransaction({ id: editingTransaction.id, updates: payload });
                toast.success('Transacción actualizada');
            } else {
                await addTransaction(payload);

                // 4x1000 Tax Logic (Colombia Only)
                if (settings.countryCode === 'CO' && (data.type === 'expense' || data.type === 'transfer')) {
                    const sourceAccount = accounts.find(a => a.id === data.account_id);
                    if (sourceAccount) {
                        const taxAmount = Math.round(Number(Math.abs(data.amount)) * 0.004);
                        if (taxAmount > 0) {
                            await addTransaction({
                                account_id: data.account_id,
                                date: data.date,
                                amount: -taxAmount,
                                description: 'Impuesto GMF (4x1000)',
                                category_id: categories.find(c => c.name.includes('Gastos Fijos') || c.type === 'Gastos Fijos')?.id,
                                destination_account_id: null
                            });
                            toast('Impuesto 4x1000 aplicado', { icon: '💸' });
                        }
                    }
                }
                toast.success('Transacción creada');
            }
            onClose();
        } catch (error: any) {
            toast.error('Error al guardar: ' + error.message);
        }
    };
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transaction-modal-title"
        >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3
                        id="transaction-modal-title"
                        className="text-xl font-bold text-slate-800 dark:text-white"
                    >
                        {editingTransaction ? 'Editar' : 'Nueva'} Transacción
                    </h3>
                    <button
                        onClick={onClose}
                        className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
                    <div>
                        <label htmlFor="account_id" className="sr-only">Cuenta</label>
                        <select
                            id="account_id"
                            {...register('account_id')}
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3"
                            aria-invalid={!!errors.account_id}
                            aria-describedby={errors.account_id ? 'account-error' : undefined}
                        >
                            <option value="">Cuenta...</option>
                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                        {errors.account_id && (
                            <p
                                id="account-error"
                                className="text-rose-500 text-[10px] uppercase font-bold px-2 mt-1"
                                role="alert"
                            >
                                {errors.account_id.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="sr-only">Fecha</label>
                            <input
                                id="date"
                                type="date"
                                {...register('date')}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3"
                            />
                        </div>
                        <div>
                            <label htmlFor="type" className="sr-only">Tipo</label>
                            <select
                                id="type"
                                {...register('type')}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3"
                            >
                                <option value="expense">Egreso</option>
                                <option value="income">Ingreso</option>
                                <option value="transfer">Transferencia</option>
                            </select>
                        </div>
                    </div>

                    {txType === 'transfer' ? (
                        <div>
                            <label htmlFor="destination_account_id" className="sr-only">Cuenta Destino</label>
                            <select
                                id="destination_account_id"
                                {...register('destination_account_id')}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3"
                            >
                                <option value="">Cuenta Destino...</option>
                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="category_id" className="sr-only">Categoría</label>
                            <select
                                id="category_id"
                                {...register('category_id')}
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3"
                            >
                                <option value="">Categoría...</option>
                                {categories
                                    .filter(c => txType === 'income' ? c.type === 'Ingresos' : c.type !== 'Ingresos')
                                    .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                                }
                            </select>
                        </div>
                    )}

                    <div>
                        <label htmlFor="amount" className="sr-only">Monto</label>
                        <input
                            id="amount"
                            type="number"
                            step="any"
                            {...register('amount')}
                            placeholder="Monto"
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-4 text-xl font-bold"
                            aria-invalid={!!errors.amount}
                            aria-describedby={errors.amount ? 'amount-error' : undefined}
                        />
                        {errors.amount && (
                            <p
                                id="amount-error"
                                className="text-rose-500 text-[10px] uppercase font-bold px-2 mt-1"
                                role="alert"
                            >
                                {errors.amount.message}
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="description" className="sr-only">Descripción</label>
                        <input
                            id="description"
                            {...register('description')}
                            placeholder="Descripción"
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 hover:bg-blue-700"
                    >
                        Guardar
                    </button>
                </form>
            </div>
        </div>
    );
}
