import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatCurrency } from '../../utils/formatters';
import type { Category } from '../../types';
import { categorySchema, type CategoryFormData } from '../../lib/schemas';
import { useCategories } from '../../hooks/useCategories';
import toast from 'react-hot-toast';

interface CategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    editingCategory: Category | null;
    setEditingCategory: (cat: Category | null) => void;
}

export function CategoryModal({
    isOpen,
    onClose,
    categories,
    editingCategory,
    setEditingCategory
}: CategoryModalProps) {
    const { createCategory, updateCategory, deleteCategory } = useCategories();

    const { register, handleSubmit, reset, formState: { errors } } = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema) as any
    });

    useEffect(() => {
        if (editingCategory) {
            reset({
                name: editingCategory.name,
                type: editingCategory.type as any,
                monthly_budget: Math.abs(editingCategory.monthly_budget)
            });
        } else {
            reset({
                name: '',
                type: 'Gastos Variables',
                monthly_budget: 0
            });
        }
    }, [editingCategory, reset, isOpen]);

    const onSubmit = async (data: CategoryFormData) => {
        try {
            let b = data.monthly_budget;
            if (['Gastos Fijos', 'Gastos Variables', 'Ahorro'].includes(data.type)) {
                b = -Math.abs(b);
            }
            const payload = { ...data, monthly_budget: b };

            if (editingCategory) {
                await updateCategory({ id: editingCategory.id, updates: payload });
                toast.success('Categoría actualizada');
            } else {
                await createCategory(payload);
                toast.success('Categoría creada');
            }
            setEditingCategory(null);
            reset();
        } catch (err: any) {
            toast.error(err.message || 'Error al guardar la categoría');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteCategory(id);
            toast.success('Categoría eliminada');
            setEditingCategory(null);
        } catch (err: any) {
            toast.error(err.message || 'Error al eliminar la categoría');
        }
    };
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
        >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center shrink-0">
                    <h3
                        id="category-modal-title"
                        className="text-xl font-bold text-slate-800 dark:text-white"
                    >
                        Gestionar Categorías
                    </h3>
                    <button
                        onClick={() => { onClose(); setEditingCategory(null); }}
                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                        aria-label="Cerrar modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* Category List */}
                    <div
                        className="flex-1 overflow-y-auto p-4 border-r border-slate-100 dark:border-slate-700 space-y-4"
                        role="list"
                        aria-label="Lista de categorías"
                    >
                        {['Ingresos', 'Gastos Fijos', 'Gastos Variables', 'Ahorro'].map(type => (
                            <div key={type} role="listitem">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">
                                    {type}
                                </h4>
                                <div className="grid grid-cols-1 gap-1">
                                    {categories.filter(c => c.type === type).map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setEditingCategory(cat)}
                                            className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all flex justify-between items-center ${editingCategory?.id === cat.id
                                                ? 'bg-blue-600 text-white'
                                                : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                }`}
                                            aria-label={`Editar categoría ${cat.name}`}
                                            aria-pressed={editingCategory?.id === cat.id}
                                        >
                                            <span>{cat.name}</span>
                                            <span className="text-[10px] opacity-70">
                                                {formatCurrency(cat.monthly_budget)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Category Form */}
                    <div className="w-full md:w-80 p-6 bg-slate-50 dark:bg-slate-900/50 shrink-0">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4">
                            {editingCategory ? 'Editar' : 'Nueva'} Categoría
                        </h4>

                        <form onSubmit={handleSubmit(onSubmit) as any} className="space-y-4">
                            <div>
                                <label htmlFor="category-name" className="sr-only">Nombre de la categoría</label>
                                <input
                                    id="category-name"
                                    {...register('name')}
                                    placeholder="Nombre"
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm"
                                    aria-invalid={!!errors.name}
                                    aria-describedby={errors.name ? 'category-name-error' : undefined}
                                />
                                {errors.name && (
                                    <p
                                        id="category-name-error"
                                        className="text-rose-500 text-[10px] uppercase font-bold px-2 mt-1"
                                        role="alert"
                                    >
                                        {errors.name.message}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="category-type" className="sr-only">Tipo de categoría</label>
                                <select
                                    id="category-type"
                                    {...register('type')}
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm"
                                >
                                    <option value="Ingresos">Ingreso</option>
                                    <option value="Gastos Fijos">Gasto Fijo</option>
                                    <option value="Gastos Variables">Gasto Variable</option>
                                    <option value="Ahorro">Ahorro</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="category-budget" className="sr-only">Presupuesto mensual</label>
                                <input
                                    id="category-budget"
                                    {...register('monthly_budget')}
                                    step="any"
                                    type="number"
                                    placeholder="Presupuesto"
                                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-white dark:bg-slate-800 p-3 text-sm"
                                    aria-invalid={!!errors.monthly_budget}
                                    aria-describedby={errors.monthly_budget ? 'budget-error' : undefined}
                                />
                                {errors.monthly_budget && (
                                    <p
                                        id="budget-error"
                                        className="text-rose-500 text-[10px] uppercase font-bold px-2 mt-1"
                                        role="alert"
                                    >
                                        {errors.monthly_budget.message}
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
                            >
                                Guardar
                            </button>

                            {editingCategory && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (confirm('¿Eliminar esta categoría?')) {
                                            handleDelete(editingCategory.id);
                                            setEditingCategory(null);
                                        }
                                    }}
                                    className="w-full py-3 text-rose-500 font-bold border border-rose-100 dark:border-rose-900 rounded-xl mt-2 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                    aria-label={`Eliminar categoría ${editingCategory.name}`}
                                >
                                    Eliminar
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
