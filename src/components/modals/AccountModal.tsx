import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRegion } from '../../contexts/RegionContext';
import { accountSchema, type AccountFormData } from '../../lib/schemas';
import { useAccounts } from '../../hooks/useAccounts';
import type { Account } from '../../types';
import toast from 'react-hot-toast';

import { useDashboard } from '../../contexts/DashboardContext';

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingAccount: Account | null;
}

export function AccountModal({
    isOpen,
    onClose,
    editingAccount
}: AccountModalProps) {
    const { settings } = useRegion();
    const { deleteAccount } = useDashboard(); // Just for consistency
    const { createAccount, updateAccount } = useAccounts();

    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AccountFormData>({
        resolver: zodResolver(accountSchema) as any
    });

    useEffect(() => {
        if (editingAccount) {
            reset(editingAccount as any);
        } else {
            reset({
                name: '',
                bank: '',
                account_number: '',
                type: 'Checking',
                initial_balance: 0,
                balance: 0,
                credit_limit: 0
            });
        }
    }, [editingAccount, reset, isOpen]);

    const onSubmit = async (data: AccountFormData) => {
        try {
            if (editingAccount) {
                await updateAccount({ id: editingAccount.id, updates: data });
                toast.success('Cuenta actualizada');
            } else {
                await createAccount(data);
                toast.success('Cuenta creada');
            }
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar la cuenta');
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="account-modal-title"
        >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-sm w-full p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3
                        id="account-modal-title"
                        className="text-xl font-bold text-slate-800 dark:text-white"
                    >
                        {editingAccount ? 'Editar' : 'Nueva'} Cuenta
                    </h3>
                    <button
                        onClick={onClose}
                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
                    <div>
                        <label htmlFor="account-name" className="sr-only">Nombre de la cuenta</label>
                        <input
                            id="account-name"
                            {...register('name')}
                            placeholder="Nombre Cuenta"
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3"
                            aria-invalid={!!errors.name}
                            aria-describedby={errors.name ? 'name-error' : undefined}
                        />
                        {errors.name && (
                            <p
                                id="name-error"
                                className="text-rose-500 text-[10px] uppercase font-bold px-2 mt-1"
                                role="alert"
                            >
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="bank" className="sr-only">Banco</label>
                            <input
                                id="bank"
                                {...register('bank')}
                                placeholder="Banco"
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3"
                            />
                        </div>
                        <div>
                            <label htmlFor="account-number" className="sr-only">Número de cuenta</label>
                            <input
                                id="account-number"
                                {...register('account_number')}
                                placeholder="N° Cuenta"
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3"
                            />
                        </div>
                    </div>


                    <div>
                        <label htmlFor="account-type" className="sr-only">Tipo de cuenta</label>
                        <select
                            id="account-type"
                            {...register('type')}
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm"
                            aria-invalid={!!errors.type}
                            aria-describedby={errors.type ? 'type-error' : undefined}
                        >
                            <option value="Checking">Cuenta Corriente (CC)</option>
                            <option value="Vista">Cuenta Vista (CV)</option>
                            <option value="Savings">Cuenta de Ahorros (CA)</option>
                            <option value="Credit">Tarjeta de Crédito (TC)</option>
                            <option value="CreditLine">Línea de Crédito (LC)</option>
                            <option value="Cash">Efectivo</option>
                            <option value="Receivable">Cuenta por Cobrar</option>
                            <option value="Payable">Cuenta por Pagar</option>
                            <option value="Investment">Inversión (Acciones/Crypto)</option>
                            <option value="Asset">Activo (Vehículo/Propiedad)</option>
                        </select>
                        {errors.type && (
                            <p
                                id="type-error"
                                className="text-rose-500 text-[10px] uppercase font-bold px-2 mt-1"
                                role="alert"
                            >
                                {errors.type.message}
                            </p>
                        )}
                        {watch('type') === 'Receivable' && (
                            <p className="text-[10px] text-blue-500 font-bold px-2 mt-2 leading-tight">
                                💡 Ingresa un saldo POSITIVO (es dinero que te deben y suma a tu patrimonio).
                            </p>
                        )}
                        {watch('type') === 'Payable' && (
                            <p className="text-[10px] text-rose-500 font-bold px-2 mt-2 leading-tight">
                                💡 Ingresa un saldo NEGATIVO (es dinero que tú debes y resta de tu patrimonio).
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="credit-limit" className="text-[9px] font-black text-slate-400 uppercase ml-2">Cupo / Límite Crédito</label>
                        <input
                            id="credit-limit"
                            {...register('credit_limit')}
                            type="number"
                            step="any"
                            placeholder="Ej: 1000000"
                            className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label
                                htmlFor="initial-balance"
                                className="text-[9px] font-black text-slate-400 uppercase ml-2"
                            >
                                Saldo Inicial
                            </label>
                            <input
                                id="initial-balance"
                                {...register('initial_balance')}
                                type="number"
                                step="any"
                                readOnly={!!editingAccount}
                                className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm font-bold ${editingAccount ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-700'}`}
                            />
                        </div>
                        <div className="space-y-1">
                            <label
                                htmlFor="current-balance"
                                className="text-[9px] font-black text-slate-400 uppercase ml-2"
                            >
                                Saldo Actual
                            </label>
                            <input
                                id="current-balance"
                                {...register('balance')}
                                type="number"
                                step="any"
                                readOnly={!!editingAccount}
                                className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm font-bold ${editingAccount ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-700'}`}
                            />
                        </div>
                    </div>
                    {editingAccount && (
                        <p className="text-[10px] text-slate-400 px-2 mt-1 leading-tight italic">
                            💡 Los saldos solo se pueden cambiar mediante transacciones o conciliación para mantener la integridad de los datos.
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all"
                    >
                        Guardar
                    </button>
                </form>
            </div>
        </div>
    );
}
