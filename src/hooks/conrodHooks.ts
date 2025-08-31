// /Users/w/CascadeProjects/erp-globe/src/hooks/conrodHooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConrods, createConrod, deleteConrod, updateConrod } from '@/lib/api'; 
import { Conrod } from '@/types/types';

// Type for the payload needed by createConrod API
type AddConrodPayload = Omit<Conrod, 'id' | 'srNo'>;

// Type for update mutation variables (includes id and rest of Conrod fields except srNo)
type UpdateConrodVariables = Omit<Conrod, 'srNo'>;

/**
 * Fetches the list of conrod definitions.
 */
export const useConrodsQuery = () => {
    return useQuery<Conrod[], Error>({
        queryKey: ['conrods'],
        queryFn: fetchConrods,
        staleTime: Infinity, // Conrod definitions might not change often
    });
};

/**
 * Handles adding a new conrod definition.
 * Invalidates the 'conrods' query on success.
 */
export const useAddConrodMutation = (options?: {
    onSuccess?: (data: Conrod) => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();

    return useMutation<Conrod, Error, AddConrodPayload>({
        mutationFn: createConrod,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['conrods'] });
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};

/**
 * Handles deleting a conrod definition.
 * Invalidates the 'conrods' query on success.
 */
export const useDeleteConrodMutation = (options?: {
    onSuccess?: (data: { id: string }) => void; 
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();

    return useMutation<{ id: string }, Error, string>({
        mutationFn: deleteConrod, 
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['conrods'] });
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};

/**
 * Handles updating an existing conrod definition.
 * Invalidates the 'conrods' query on success.
 */
export const useUpdateConrodMutation = (options?: {
  onSuccess?: (data: Conrod) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  return useMutation<Conrod, Error, UpdateConrodVariables>({
    mutationFn: (variables: UpdateConrodVariables) => {
      const { id, ...payload } = variables;
      return updateConrod(id, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conrods'] });
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      options?.onError?.(error);
    },
  });
};
