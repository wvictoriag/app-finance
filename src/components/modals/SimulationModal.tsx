import React, { useState, useMemo } from 'react';
import { formatCurrency } from '../../utils/formatters';
import { TrendingUp, RefreshCcw, Landmark, ShoppingBag, Plus, Trash2, ChevronRight, Info, CreditCard, Wallet, ArrowRightLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import type { Account, Transaction, Category, AccountType } from '../../types';

interface SimulationScenario {
    id: string;
    name: string;
    type: 'purchase' | 'income_change' | 'extra_savings';
    amount: number;
    startMonth: number;
    duration?: number; // months, 0 = permanent
}

interface Installment {
    id: string;
    name: string;
    amount: number;
    remainingMonths: number;
}

interface ProjectionsViewProps {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
}

interface SimModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (scenario: Partial<SimulationScenario>) => void;
    initialData: Partial<SimulationScenario>;
    keyId: string;
}

interface SimulationModalProps {
    initialData: Partial<SimulationScenario>;
    onClose: () => void;
    onSave: (data: Partial<SimulationScenario>) => void;
}

function SimulationModal({ initialData, onClose, onSave }: SimulationModalProps) {
    const [data, setData] = useState<Partial<SimulationScenario>>(initialData);

    // Force sync if props change while open
    React.useEffect(() => {
        console.log('SimulationModal: Syncing data from props:', initialData);
        setData(initialData);
    }, [initialData]);

    console.log('SimulationModal: Rendering. Current code version: 3.1');
    console.log('SimulationModal: Field data:', data);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-md w-full p-8"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Nuevo Escenario</h3>
                        <span className="text-[8px] font-bold text-slate-300">v3.1</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-8 font-medium">Define un cambio futuro (compra grande o cambio de sueldo).</p>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'purchase', label: 'Compra/Gasto', icon: ShoppingBag },
                                    { id: 'income_change', label: 'Nuevo Ingreso', icon: Landmark },
                                    { id: 'extra_savings', label: 'Ahorro/Cut', icon: RefreshCcw }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setData({ ...data, type: t.id as any })}
                                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${data.type === t.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-50 dark:bg-white/5 border-transparent text-slate-500'}`}
                                    >
                                        <t.icon size={18} />
                                        <span className="text-[9px] font-black uppercase text-center leading-none">{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre</label>
                            <input
                                autoFocus
                                placeholder="Nombre del plan"
                                className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm font-bold border-none outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white"
                                value={data.name || ''}
                                onChange={e => setData({ ...data, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monto ($)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm font-black border-none outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white"
                                    value={data.amount || 0}
                                    onChange={e => setData({ ...data, amount: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mes Inicio</label>
                                <input
                                    type="number"
                                    placeholder="1"
                                    className="w-full bg-slate-50 dark:bg-slate-700/50 rounded-2xl p-4 text-sm font-black border-none outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white"
                                    value={data.startMonth || 1}
                                    onChange={e => setData({ ...data, startMonth: Number(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => onSave(data)}
                                className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30"
                            >
                                Agregar
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

export { SimulationModal };
