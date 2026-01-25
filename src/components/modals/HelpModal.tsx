import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, ChevronRight, Info, HelpCircle } from 'lucide-react';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetch('/USER_MANUAL.md')
                .then(res => res.text())
                .then(text => {
                    setContent(text);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Error loading manual:', err);
                    setContent('Error al cargar el manual de usuario.');
                    setLoading(false);
                });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md pointer-events-auto"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    className="relative bg-white dark:bg-slate-900 w-full max-w-4xl h-[80vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden pointer-events-auto border border-white/10"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <BookOpen className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">Centro de Ayuda</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Guapacha Finance Knowledge Base</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl flex items-center justify-center transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide bg-slate-50/50 dark:bg-transparent">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
                                <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                <span className="text-xs font-black uppercase tracking-widest">Cargando Manual...</span>
                            </div>
                        ) : (
                            <div className="prose prose-slate dark:prose-invert max-w-none">
                                {/* Simple Markdown interpretation (manually for better visual style) */}
                                {content.split('---').map((section, idx) => (
                                    <div key={idx} className="mb-12 last:mb-0">
                                        {section.trim().split('\n').map((line, lIdx) => {
                                            if (line.startsWith('# ')) return <h1 key={lIdx} className="text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">{line.replace('# ', '')}</h1>;
                                            if (line.startsWith('## ')) return <h2 key={lIdx} className="text-2xl font-black text-slate-800 dark:text-white mt-12 mb-6 tracking-tighter flex items-center gap-3"><ChevronRight className="text-blue-600" size={20} strokeWidth={3} /> {line.replace('## ', '')}</h2>;
                                            if (line.startsWith('### ')) return <h3 key={lIdx} className="text-lg font-black text-slate-800 dark:text-white mt-8 mb-4 tracking-tight">{line.replace('### ', '')}</h3>;
                                            if (line.startsWith('|')) return null; // Skip tables for now or handle them
                                            if (line.startsWith('> ')) {
                                                const tipType = line.includes('IMPORTANT') ? 'important' : line.includes('NOTE') ? 'note' : 'tip';
                                                return (
                                                    <div key={lIdx} className={`my-6 p-6 rounded-[2rem] border ${tipType === 'important' ? 'bg-rose-500/5 border-rose-500/10 text-rose-600' :
                                                            'bg-blue-600/5 border-blue-600/10 text-blue-600'
                                                        } flex gap-4 items-start`}>
                                                        <Info size={20} className="shrink-0 mt-1" />
                                                        <p className="text-sm font-bold leading-relaxed">{line.replace('> ', '').replace(/\[!(.*?)\]/g, '')}</p>
                                                    </div>
                                                );
                                            }
                                            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={lIdx} className="text-slate-600 dark:text-slate-400 mb-2 list-none flex gap-3 text-sm font-medium"><div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mt-2 shrink-0" /> {line.substring(2)}</li>;
                                            if (line.trim() === '') return <br key={lIdx} />;

                                            // Bold text
                                            const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-800 dark:text-white">$1</strong>');

                                            return (
                                                <p
                                                    key={lIdx}
                                                    className="text-slate-600 dark:text-slate-400 mb-4 text-sm leading-relaxed font-medium"
                                                    dangerouslySetInnerHTML={{ __html: formattedLine }}
                                                />
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 shrink-0 flex justify-center">
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Entendido, ¡Gracias!
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
