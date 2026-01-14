import React, { useState } from 'react';
import { useGoals } from '../../hooks/useGoals';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Plus, Target, Trash2, Pencil, PiggyBank, Calendar, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { Goal } from '../../types';

interface GoalFormData {
    name: string;
    target_amount: number;
    current_amount: number;
    deadline?: string;
    color: string;
    icon: string;
}

export const SavingsGoals: React.FC = () => {
    const { goals, isLoading, createGoal, updateGoal, deleteGoal } = useGoals();
    const [showModal, setShowModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

    const { register, handleSubmit, reset, formState: { errors } } = useForm<GoalFormData>();

    const onSubmit = async (data: GoalFormData) => {
        try {
            if (editingGoal) {
                await updateGoal.mutateAsync({ id: editingGoal.id, updates: data });
                toast.success('Meta actualizada');
            } else {
                await createGoal.mutateAsync({ ...data, current_amount: Number(data.current_amount) || 0, color: 'blue', icon: 'piggy' });
                toast.success('Meta creada');
            }
            setShowModal(false);
            setEditingGoal(null);
            reset();
        } catch (error) {
            toast.error('Error al guardar la meta');
        }
    };

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        reset({
            name: goal.name,
            target_amount: goal.target_amount,
            current_amount: goal.current_amount,
            deadline: goal.deadline,
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta meta?')) {
            await deleteGoal.mutateAsync(id);
            toast.success('Meta eliminada');
        }
    };

    const addFunds = async (goal: Goal, amount: number) => {
        const newAmount = Number(goal.current_amount) + amount;
        if (newAmount > Number(goal.target_amount)) {
            toast.error('El monto excede la meta');
            return;
        }
        await updateGoal.mutateAsync({ id: goal.id, updates: { current_amount: newAmount } });
        toast.success(`Abonado ${formatCurrency(amount)}`);
    };

    if (isLoading) return <div className="flex h-full items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>;

    return (
        <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Metas de Ahorro</h2>
                <button
                    onClick={() => { setEditingGoal(null); reset(); setShowModal(true); }}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                >
                    <Plus size={20} />
                    <span className="hidden sm:inline">Nueva Meta</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {goals.map((goal) => {
                    const progress = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
                    return (
                        <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-white/20 dark:border-white/5 relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl text-indigo-500">
                                    <Target size={24} />
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(goal)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(goal.id)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{goal.name}</h3>
                            {goal.deadline && (
                                <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider mb-6">
                                    <Calendar size={12} />
                                    <span>{formatDate(goal.deadline)}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ahorrado</p>
                                        <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{formatCurrency(goal.current_amount)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Meta</p>
                                        <p className="text-base font-bold text-slate-500">{formatCurrency(goal.target_amount)}</p>
                                    </div>
                                </div>

                                <div className="relative h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full"
                                    />
                                </div>
                                <p className="text-right text-xs font-bold text-indigo-500">{Math.round(progress)}% completado</p>

                                <button
                                    onClick={() => {
                                        const amount = Number(prompt('Monto a abonar:'));
                                        if (amount && !isNaN(amount)) addFunds(goal, amount);
                                    }}
                                    className="w-full py-3 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <PiggyBank size={18} />
                                    <span>Abonar Manual</span>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{editingGoal ? 'Editar Meta' : 'Nueva Alcanancía'}</h3>
                                <button onClick={() => setShowModal(false)} className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full hover:bg-slate-200 transition-colors">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Nombre</label>
                                    <input {...register('name', { required: true })} placeholder="Ej: Vacaciones 2024" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 font-bold" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Meta ($)</label>
                                        <input type="number" {...register('target_amount', { required: true })} placeholder="0" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 font-bold" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Fecha Límite</label>
                                        <input type="date" {...register('deadline')} className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 font-bold" />
                                    </div>
                                </div>

                                {!editingGoal && (
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block mb-1">Saldo Inicial</label>
                                        <input type="number" {...register('current_amount')} placeholder="0" className="w-full rounded-xl border-slate-200 dark:border-slate-700 border bg-slate-50 dark:bg-slate-700 p-3 font-bold" />
                                    </div>
                                )}

                                <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95 mt-4">
                                    Guardar Meta
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
