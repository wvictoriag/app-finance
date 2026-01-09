import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Transaction } from '../types';

export const useTransactions = (limit: number = 50) => {
    const queryClient = useQueryClient();

    const transactionsQuery = useQuery({
        queryKey: ['transactions', { limit }],
        queryFn: () => api.getTransactions(limit),
    });

    const addTransactionMutation = useMutation({
        mutationFn: (newTx: Partial<Transaction>) => api.addTransaction(newTx),
        // Optimistic Update
        onMutate: async (newTx) => {
            await queryClient.cancelQueries({ queryKey: ['transactions'] });
            const previousTransactions = queryClient.getQueryData(['transactions', { limit }]);

            queryClient.setQueryData(['transactions', { limit }], (old: Transaction[] | undefined) => [
                { ...newTx, id: 'temp-' + Date.now() } as Transaction,
                ...(old || []),
            ]);

            return { previousTransactions };
        },
        onError: (err, newTx, context) => {
            queryClient.setQueryData(['transactions', { limit }], context?.previousTransactions);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transaction-sums'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] }); // Balance changed
        },
    });

    const updateTransactionMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Transaction> }) =>
            api.updateTransaction(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transaction-sums'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });

    const deleteTransactionMutation = useMutation({
        mutationFn: (id: string) => api.deleteTransaction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['transaction-sums'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });

    return {
        transactions: transactionsQuery.data || [],
        isLoading: transactionsQuery.isLoading,
        error: transactionsQuery.error,
        addTransaction: addTransactionMutation.mutateAsync,
        updateTransaction: updateTransactionMutation.mutateAsync,
        deleteTransaction: deleteTransactionMutation.mutateAsync,
    };
};

export const useMonthlyTransactions = (month: number, year: number) => {
    return useQuery({
        queryKey: ['transactions', { month, year }],
        queryFn: () => api.getTransactionsByMonth(month, year),
    });
};
