import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Centrally manages the visibility of the Breakdown Modal.
 * Can be extended to manage all app modals.
 */
interface ModalContextType {
    isBreakdownOpen: boolean;
    openBreakdown: () => void;
    closeBreakdown: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

export const ModalProvider = ({ children }: { children: ReactNode }) => {
    const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

    const openBreakdown = useCallback(() => setIsBreakdownOpen(true), []);
    const closeBreakdown = useCallback(() => setIsBreakdownOpen(false), []);

    return (
        <ModalContext.Provider value={{ isBreakdownOpen, openBreakdown, closeBreakdown }}>
            {children}
        </ModalContext.Provider>
    );
};
