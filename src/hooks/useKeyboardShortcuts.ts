import { useEffect } from 'react';

interface ShortcutConfig {
    [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig) {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (
                event.target instanceof HTMLInputElement ||
                event.target instanceof HTMLTextAreaElement ||
                event.target instanceof HTMLSelectElement
            ) {
                if (event.key === 'Escape') {
                    shortcuts['Escape']?.();
                }
                return;
            }

            const handler = shortcuts[event.key] || shortcuts[event.key.toLowerCase()];
            if (handler) {
                event.preventDefault();
                handler();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}
