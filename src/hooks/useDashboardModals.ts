import { useState, useCallback } from 'react';
import type { Account, Category, Transaction } from '../types';

/**
 * Manages all modal states and handlers for the Dashboard view.
 * This extraction makes the main Dashboard component significantly smaller and easier to maintain.
 */
export const useDashboardModals = () => {
    // Transaction States
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Account States
    const [showAccountModal, setShowAccountModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);

    // Category States
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    // Reconcile State
    const [showReconcileModal, setShowReconcileModal] = useState(false);
    const [reconcilingAccount, setReconcilingAccount] = useState<Account | null>(null);

    // Handlers
    const handleAddTransaction = useCallback(() => {
        setEditingTransaction(null);
        setShowTransactionModal(true);
    }, []);

    const handleEditTransaction = useCallback((tx: Transaction) => {
        setEditingTransaction(tx);
        setShowTransactionModal(true);
    }, []);

    const handleAddAccount = useCallback(() => {
        setEditingAccount(null);
        setShowAccountModal(true);
    }, []);

    const handleEditAccount = useCallback((acc: Account) => {
        setEditingAccount(acc);
        setShowAccountModal(true);
    }, []);

    const handleOpenReconcile = useCallback((acc: Account) => {
        setReconcilingAccount(acc);
        setShowReconcileModal(true);
    }, []);

    const handleAddCategory = useCallback(() => {
        setEditingCategory(null);
        setShowCategoryModal(true);
    }, []);

    const handleEditCategory = useCallback((cat: Category) => {
        setEditingCategory(cat);
        setShowCategoryModal(true);
    }, []);

    const closeAllModals = useCallback(() => {
        setShowTransactionModal(false);
        setShowAccountModal(false);
        setShowCategoryModal(false);
        setShowReconcileModal(false);
        setEditingTransaction(null);
        setEditingAccount(null);
        setEditingCategory(null);
    }, []);

    return {
        // Modal Visibility
        showTransactionModal,
        showAccountModal,
        showCategoryModal,
        showReconcileModal,

        // Editing Data
        editingTransaction,
        editingAccount,
        editingCategory,
        reconcilingAccount,

        // Actions
        handleAddTransaction,
        handleEditTransaction,
        handleAddAccount,
        handleEditAccount,
        handleOpenReconcile,
        handleAddCategory,
        handleEditCategory,
        closeAllModals,

        // Setters (if needed directly)
        setEditingCategory,
        setShowTransactionModal,
        setShowAccountModal,
        setShowCategoryModal,
        setShowReconcileModal
    };
};
