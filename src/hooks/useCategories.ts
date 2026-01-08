import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Category } from '../types';

export const useCategories = () => {
    const queryClient = useQueryClient();

    const categoriesQuery = useQuery({
        queryKey: ['categories'],
        queryFn: api.getCategories,
    });

    const createCategoryMutation = useMutation({
        mutationFn: (newCategory: Partial<Category>) => api.createCategory(newCategory),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const updateCategoryMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Category> }) =>
            api.updateCategory(id, updates),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    const deleteCategoryMutation = useMutation({
        mutationFn: (id: string) => api.deleteCategory(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
    });

    return {
        categories: categoriesQuery.data || [],
        isLoading: categoriesQuery.isLoading,
        error: categoriesQuery.error,
        createCategory: createCategoryMutation.mutateAsync,
        updateCategory: updateCategoryMutation.mutateAsync,
        deleteCategory: deleteCategoryMutation.mutateAsync,
    };
};
