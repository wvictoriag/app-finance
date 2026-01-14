import React from 'react';
import { UseFormRegister, FieldErrors } from 'react-hook-form';
import { TransactionFormData } from '../../lib/schemas';
import type { Account, Category } from '../../types';

interface TransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    register: UseFormRegister<TransactionFormData>;
    errors: FieldErrors<TransactionFormData>;
    accounts: Account[];
    categories: Category[];
    txType: 'income' | 'expense' | 'transfer';
    isEditing: boolean;
}

export function TransactionModal({
    isOpen,
    onClose,
    onSubmit,
    register,
    errors,
    accounts,
    categories,
    txType,
    isEditing
}: TransactionModalProps) {
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
                        {isEditing ? 'Editar' : 'Nueva'} Transacción
                    </h3>
                    <button
                        onClick={onClose}
                        className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
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
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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
