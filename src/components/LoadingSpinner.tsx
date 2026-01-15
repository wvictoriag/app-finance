import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner() {
    return (
        <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
            </div>
        </div>
    );
}
