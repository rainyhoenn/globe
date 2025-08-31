import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCustomers, createCustomer, deleteCustomer } from '@/lib/api';
import { Customer } from '@/types/types';

/**
 * Hook to fetch all customers
 */
export const useCustomersQuery = () => {
  return useQuery<Customer[], Error>({
    queryKey: ['customers'],
    queryFn: fetchCustomers
  });
};

/**
 * Hook to create a new customer
 */
export const useCreateCustomerMutation = (options?: {
  onSuccess?: (data: Customer) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<Customer, Error, Omit<Customer, 'id'>>({
    mutationFn: createCustomer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    }
  });
};

/**
 * Hook to delete a customer
 */
export const useDeleteCustomerMutation = (options?: {
  onSuccess?: (data: { id: string }) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: deleteCustomer,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    }
  });
};
