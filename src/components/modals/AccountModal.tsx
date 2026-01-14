import React from 'react';
import { UseFormRegister, UseFormHandleSubmit, FieldErrors, UseFormReset } from 'react-hook-form';
import { useRegion } from '../../contexts/RegionContext';

interface AccountFormData {
    name: string;
    bank?: string;
    account_number?: string;
    type: string;
    initial_balance: number;
    balance: number;
    is_tax_exempt?: boolean;
}

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: AccountFormData) => Promise<void>;
    register: UseFormRegister<AccountFormData>;
    handleSubmit: UseFormHandleSubmit<AccountFormData>;
    errors: FieldErrors<AccountFormData>;
    isEditing: boolean;
}

export function AccountModal({
    isOpen,
    onClose,
    onSubmit,
    register,
    handleSubmit,
    errors,
    isEditing
}: AccountModalProps) {
    const { settings } = useRegion();

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
                        {isEditing ? 'Editar' : 'Nueva'} Cuenta
                    </h3>
                    <button
                        onClick={onClose}
                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                    {/* Tax Exemption (CO) */}
                    {settings.countryCode === 'CO' && (
                        <div className="flex items-center gap-2 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20 mb-4">
                            <input
                                type="checkbox"
                                id="is_tax_exempt"
                                {...register('is_tax_exempt')}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                            />
                            <label
                                htmlFor="is_tax_exempt"
                                className="text-xs font-bold text-indigo-700 dark:text-indigo-400 select-none cursor-pointer"
                            >
                                Cuenta Exenta 4x1000
                            </label>
                        </div>
                    )}

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
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold"
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
                                className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 text-sm font-bold"
                            />
                        </div>
                    </div>

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
