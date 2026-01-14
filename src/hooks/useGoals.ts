import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Goal } from '../types';

export function useGoals() {
    const queryClient = useQueryClient();

    const { data: goals, isLoading, error } = useQuery({
        queryKey: ['goals'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Goal[];
        },
    });

    const createGoal = useMutation({
        mutationFn: async (newGoal: Omit<Goal, 'id' | 'user_id' | 'created_at'>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No user');

            const { data, error } = await supabase
                .from('goals')
                .insert([{ ...newGoal, user_id: user.id }])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });

    const updateGoal = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<Goal> }) => {
            const { data, error } = await supabase
                .from('goals')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });

    const deleteGoal = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('goals')
                .delete()
                .eq('id', id);

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['goals'] });
        },
    });

    return {
        goals: goals || [],
        isLoading,
        error,
        createGoal,
        updateGoal,
        deleteGoal,
    };
}
