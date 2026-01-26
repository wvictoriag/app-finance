import React from 'react';
import { LayoutGrid, BarChart3, PieChart, Calendar, Target, HelpCircle } from 'lucide-react';
import { useDashboardUI } from '../../contexts/DashboardUIContext';

export function BottomNav() {
    const { currentView, setCurrentView } = useDashboardUI();

    const items = [
        { id: 'dashboard', icon: LayoutGrid, label: 'Inicio' },
        { id: 'projections', icon: BarChart3, label: 'Simula' },
        { id: 'stats', icon: PieChart, label: 'Stats' },
        { id: 'calendar', icon: Calendar, label: 'Agenda' },
        { id: 'goals', icon: Target, label: 'Metas' },
    ];

    return (
        <nav className="bottom-nav">
            {items.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                    <button
                        key={item.id}
                        onClick={() => setCurrentView(item.id)}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 opacity-60'}`}
                    >
                        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </nav>
    );
}
