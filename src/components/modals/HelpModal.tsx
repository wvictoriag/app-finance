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
                            <div className="max-w-none space-y-4">
                                {content.split('\n').map((line, idx) => {
                                    const trimmed = line.trim();

                                    // Empty lines
                                    if (trimmed === '') return <div key={idx} className="h-2" />;

                                    // Horizontal Rule
                                    if (trimmed === '---') return <hr key={idx} className="my-8 border-slate-100 dark:border-white/5" />;

                                    // Headings
                                    if (line.startsWith('# ')) return <h1 key={idx} className="text-4xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">{line.replace('# ', '')}</h1>;
                                    if (line.startsWith('## ')) return <h2 key={idx} className="text-2xl font-black text-slate-800 dark:text-white mt-10 mb-5 tracking-tighter flex items-center gap-3"><ChevronRight className="text-blue-600" size={20} strokeWidth={3} /> {line.replace('## ', '')}</h2>;
                                    if (line.startsWith('### ')) return <h3 key={idx} className="text-lg font-black text-slate-800 dark:text-white mt-6 mb-3 tracking-tight">{line.replace('### ', '')}</h3>;

                                    // Formatter helper for bold and code
                                    const format = (text: string) => text
                                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>')
                                        .replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono text-xs">$1</code>');

                                    // Lists
                                    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                                        return (
                                            <div key={idx} className="flex gap-3 ml-2 my-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                                                <p className="text-sm font-medium text-slate-600 dark:text-slate-400" dangerouslySetInnerHTML={{ __html: format(trimmed.substring(2)) }} />
                                            </div>
                                        );
                                    }

                                    // Alerts (GFM style)
                                    if (trimmed.startsWith('> ')) {
                                        const cleanText = trimmed.replace('> ', '').trim();
                                        if (!cleanText) return null; // Prevent empty red boxes

                                        const isImportant = cleanText.includes('[!IMPORTANT]') || cleanText.includes('[!WARNING]') || cleanText.includes('[!CAUTION]');
                                        const labelRemoved = cleanText.replace(/\[!(.*?)\]/g, '').trim();

                                        return (
                                            <div key={idx} className={`my-4 p-5 rounded-[1.5rem] border flex gap-4 items-start ${isImportant ? 'bg-rose-500/5 border-rose-500/10 text-rose-600' :
                                                    'bg-blue-600/5 border-blue-600/10 text-blue-600'
                                                }`}>
                                                <Info size={18} className="shrink-0 mt-0.5" />
                                                <p className="text-sm font-bold leading-relaxed" dangerouslySetInnerHTML={{ __html: format(labelRemoved) }} />
                                            </div>
                                        );
                                    }

                                    // Table Rows (primitive)
                                    if (trimmed.startsWith('|')) {
                                        if (trimmed.includes('---')) return null;
                                        const cells = trimmed.split('|').filter(c => c.trim() !== '');
                                        return (
                                            <div key={idx} className="flex border-b border-slate-100 dark:border-white/5 py-2 overflow-x-auto">
                                                {cells.map((cell, cIdx) => (
                                                    <div key={cIdx} className="flex-1 min-w-[80px] text-[10px] font-black text-slate-400 uppercase tracking-tighter px-2" dangerouslySetInnerHTML={{ __html: format(cell.trim()) }} />
                                                ))}
                                            </div>
                                        );
                                    }

                                    // Default Paragraph
                                    return (
                                        <p
                                            key={idx}
                                            className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium"
                                            dangerouslySetInnerHTML={{ __html: format(trimmed) }}
                                        />
                                    );
                                })}
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
