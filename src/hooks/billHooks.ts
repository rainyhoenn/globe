import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchBills, createBill, deleteBill } from '@/lib/api';
import { Bill } from '@/types/types';

/**
 * Hook to fetch all bills
 */
export const useBillsQuery = () => {
  return useQuery<Bill[], Error>({
    queryKey: ['bills'],
    queryFn: fetchBills,
    retry: 2,
    refetchOnWindowFocus: false
  });
};

/**
 * Hook to create a new bill
 */
export const useCreateBillMutation = (options?: {
  onSuccess?: (data: Bill) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<Bill, Error, Omit<Bill, 'id'>>({
    mutationFn: createBill,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    }
  });
};

/**
 * Hook to delete a bill
 */
export const useDeleteBillMutation = (options?: {
  onSuccess?: (data: { deletedBillId: string; updatedProductionRecord: any }) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<{ deletedBillId: string; updatedProductionRecord: any }, Error, string>({
    mutationFn: deleteBill,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['production'] });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    }
  });
};
