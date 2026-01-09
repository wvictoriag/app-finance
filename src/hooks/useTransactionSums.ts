import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export const useTransactionSums = () => {
    return useQuery({
        queryKey: ['transaction-sums'],
        queryFn: api.getTransactionSums,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
