import React, { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useRegion, Region, RegionalSettings } from '../contexts/RegionContext';

export const RegionSelector = () => {
    const { settings, setRegion } = useRegion();
    const [isOpen, setIsOpen] = useState(false);

    const regions: { code: Region; label: string; flag: string }[] = [
        { code: 'CL', label: 'Chile (CLP)', flag: '🇨🇱' },
        { code: 'CO', label: 'Colombia (COP)', flag: '🇨🇴' }
    ];

    const handleSelect = (code: Region) => {
        setRegion(code);
        setIsOpen(false);
        // Force reload to apply changes globally
        window.location.reload();
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                title="Cambiar Región / Moneda"
            >
                <Globe size={18} className="text-slate-400 hover:text-indigo-500 transition-colors" />
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">
                    {settings.countryCode}
                </span>
            </button>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5 mb-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Configuración Regional</p>
                        </div>
                        <div className="space-y-1">
                            {regions.map((region) => (
                                <button
                                    key={region.code}
                                    onClick={() => handleSelect(region.code)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors ${settings.countryCode === region.code
                                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                            : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">{region.flag}</span>
                                        <span className="text-xs font-bold">{region.label}</span>
                                    </div>
                                    {settings.countryCode === region.code && (
                                        <Check size={14} className="text-indigo-500" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
