import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, ChevronRight, Info, Search, HelpCircle, Layout, CreditCard, BarChart2, Zap } from 'lucide-react';

interface HelpCenterProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Section {
    id: string;
    title: string;
    icon: any;
    content: string;
}

export function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState('inicio');

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

    const sections = useMemo(() => {
        if (!content) return [];

        const rawSections = content.split(/^---$/m);
        const processed: Section[] = [
            { id: 'inicio', title: 'Introducción', icon: BookOpen, content: rawSections[0] || '' },
            { id: 'cuentas', title: 'Cuentas y Saldos', icon: CreditCard, content: rawSections.find(s => s.includes('## 1.')) || '' },
            { id: 'transacciones', title: 'Movimientos', icon: Zap, content: rawSections.find(s => s.includes('## 2.')) || '' },
            { id: 'analitica', title: 'Gráficos e Intel', icon: BarChart2, content: rawSections.find(s => s.includes('## 3.')) || '' },
            { id: 'avanzado', title: 'Poder y Control', icon: Layout, content: rawSections.find(s => s.includes('## 5.')) || '' },
        ];
        return processed;
    }, [content]);

    const filteredContent = useMemo(() => {
        if (!searchQuery) {
            const section = sections.find(s => s.id === activeSection);
            return section ? section.content : '';
        }

        // Simple search logic
        const lines = content.split('\n');
        const matches = lines.filter(l => l.toLowerCase().includes(searchQuery.toLowerCase()));
        return matches.length > 0
            ? `### Resultados de búsqueda para "${searchQuery}"\n\n` + matches.join('\n\n')
            : '### No se encontraron resultados.\nIntenta con palabras clave como "gasto", "transferencia" o "runway".';
    }, [searchQuery, activeSection, sections, content]);

    if (!isOpen) return null;

    const format = (text: string) => text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-slate-900 dark:text-white">$1</strong>')
        .replace(/`(.*?)`/g, '<code class="bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono text-xs">$1</code>');

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md pointer-events-auto"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ scale: 0.95, y: 40, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 40, opacity: 0 }}
                    className="relative bg-white dark:bg-slate-900 w-full max-w-6xl h-screen md:h-[85vh] md:rounded-[3rem] shadow-2xl flex flex-col md:flex-row overflow-hidden pointer-events-auto border border-white/10"
                >
                    {/* Sidebar Nav */}
                    <div className="w-full md:w-80 bg-slate-50 dark:bg-white/5 border-r border-slate-100 dark:border-white/5 flex flex-col shrink-0">
                        <div className="p-8 border-b border-slate-100 dark:border-white/5">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                    <HelpCircle className="text-white" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter leading-none">Ayuda</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Centro de Conocimiento</p>
                                </div>
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar temas..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 rounded-xl text-xs font-bold border-none ring-1 ring-slate-100 dark:ring-white/5 focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-4 mb-4">Secciones</h3>
                            {sections.map((section) => {
                                const Icon = section.icon;
                                const isActive = activeSection === section.id && !searchQuery;
                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => { setActiveSection(section.id); setSearchQuery(''); }}
                                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-white dark:hover:bg-white/5'}`}
                                    >
                                        <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                                        <span className="text-xs font-black tracking-tight">{section.title}</span>
                                        {isActive && <ChevronRight className="ml-auto opacity-50" size={14} />}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-6 bg-blue-600/5 mt-auto">
                            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 leading-relaxed">
                                ¿No encuentras algo?<br />
                                <span className="opacity-60 font-medium italic">Estamos construyendo la base de datos más completa para ti.</span>
                            </p>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto bg-white dark:bg-transparent flex flex-col">
                        <div className="p-8 md:p-16 max-w-4xl mx-auto w-full">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-300">
                                    <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                                    <span className="text-xs font-black uppercase tracking-widest">Sincronizando Manual...</span>
                                </div>
                            ) : (
                                <div className="space-y-6 animate-in">
                                    {filteredContent.split('\n').map((line, idx) => {
                                        const trimmed = line.trim();
                                        if (trimmed === '') return <div key={idx} className="h-2" />;

                                        // Headings
                                        if (line.startsWith('# ')) return <h1 key={idx} className="text-5xl font-black text-slate-900 dark:text-white mb-10 tracking-tighter leading-tight">{line.replace('# ', '')}</h1>;
                                        if (line.startsWith('## ')) return <h2 key={idx} className="text-3xl font-black text-slate-800 dark:text-white mt-16 mb-8 tracking-tighter flex items-center gap-4"><div className="w-4 h-4 rounded-full bg-blue-600" /> {line.replace('## ', '')}</h2>;
                                        if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-black text-slate-800 dark:text-white mt-10 mb-5 tracking-tight">{line.replace('### ', '')}</h3>;

                                        // Lists
                                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                                            return (
                                                <div key={idx} className="flex gap-4 ml-2 my-2 items-start group">
                                                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0 group-hover:scale-125 transition-transform" />
                                                    <p className="text-base font-medium text-slate-600 dark:text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: format(trimmed.substring(2)) }} />
                                                </div>
                                            );
                                        }

                                        // Alerts
                                        if (trimmed.startsWith('> ')) {
                                            const cleanText = trimmed.replace('> ', '').trim();
                                            if (!cleanText) return null;
                                            const isImportant = cleanText.includes('[!IMPORTANT]') || cleanText.includes('[!WARNING]');
                                            const labelRemoved = cleanText.replace(/\[!(.*?)\]/g, '').trim();
                                            if (!labelRemoved) return null;

                                            return (
                                                <div key={idx} className={`my-8 p-8 rounded-[2.5rem] border-2 flex gap-6 items-start transition-all hover:scale-[1.01] ${isImportant ? 'bg-rose-500/5 border-rose-500/10 text-rose-600' :
                                                        'bg-blue-600/5 border-blue-600/10 text-blue-600'
                                                    }`}>
                                                    <Info size={24} className="shrink-0 mt-1" />
                                                    <p className="text-base font-bold leading-relaxed" dangerouslySetInnerHTML={{ __html: format(labelRemoved) }} />
                                                </div>
                                            );
                                        }

                                        // Default Paragraph
                                        return (
                                            <p
                                                key={idx}
                                                className="text-slate-600 dark:text-slate-400 text-base md:text-lg leading-relaxed font-medium mb-6"
                                                dangerouslySetInnerHTML={{ __html: format(trimmed) }}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Close Button Mobile */}
                    <button
                        onClick={onClose}
                        className="fixed top-6 right-6 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center md:hidden z-[110]"
                    >
                        <X size={24} />
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
