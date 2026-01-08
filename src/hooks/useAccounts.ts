import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Account } from '../types';

export const useAccounts = () => {
    const queryClient = useQueryClient();

    const accountsQuery = useQuery({
        queryKey: ['accounts'],
        queryFn: api.getAccounts,
    });

    const createAccountMutation = useMutation({
        mutationFn: (newAccount: Partial<Account>) => api.createAccount(newAccount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });

    const updateAccountMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Account> }) =>
            api.updateAccount(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });

    const deleteAccountMutation = useMutation({
        mutationFn: (id: string) => api.deleteAccount(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
        },
    });

    return {
        accounts: accountsQuery.data || [],
        isLoading: accountsQuery.isLoading,
        error: accountsQuery.error,
        createAccount: createAccountMutation.mutateAsync,
        updateAccount: updateAccountMutation.mutateAsync,
        deleteAccount: deleteAccountMutation.mutateAsync,
    };
};
