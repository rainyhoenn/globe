// /Users/w/CascadeProjects/erp-globe/src/hooks/productionHooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchProduction, // Fetches all production records
    createProduction, // Creates a new production record
    deleteProduction, // Deletes a production record by ID
    updateProduction // Updates an existing production record
} from '@/lib/api';
import { ProductionRecord } from '@/types/types'; // Assuming ProductionRecord type exists

// Type for the data expected by the createProduction API function
// Ensure this matches the actual structure your API expects
type CreateProductionPayload = {
    conrodId: string; // ID of the conrod being produced
    quantity: number;
    size?: string; // Optional size field for the conrod
    date: string; // Should match the format expected by the API
};

/**
 * Fetches the list of production records.
 */
export const useProductionRecordsQuery = () => {
    return useQuery<ProductionRecord[], Error>({
        queryKey: ['productionRecords'],
        queryFn: fetchProduction,
        // Optional: Add staleTime or cacheTime if needed
    });
};

/**
 * Handles creating a new production record.
 * Assumes the backend API handles updating related inventory (products).
 * Invalidates 'productionRecords' and 'products' queries on success.
 */
export const useCreateProductionMutation = (options?: {
    onSuccess?: (data: ProductionRecord) => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();

    return useMutation<ProductionRecord, Error, CreateProductionPayload>({
        mutationFn: createProduction,
        onSuccess: (data) => {
            // Invalidate relevant queries to refetch updated data
            queryClient.invalidateQueries({ queryKey: ['productionRecords'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Invalidate products too, as creation likely affects inventory
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};

/**
 * Handles deleting a production record.
 * Assumes the backend API handles any inventory adjustments if necessary.
 * Invalidates 'productionRecords' and 'products' queries on success.
 */
/**
 * Handles updating a production record's quantity or size.
 * Invalidates 'productionRecords' query on success.
 */
export const useUpdateProductionMutation = (options?: {
    onSuccess?: (data: ProductionRecord) => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();
    
    return useMutation<
        ProductionRecord,
        Error,
        { id: string; quantity: number; size?: string }
    >({
        mutationFn: ({ id, quantity, size }) => updateProduction(id, quantity, size),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['productionRecords'] });
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};

/**
 * Handles deleting a production record.
 * Assumes the backend API handles any inventory adjustments if necessary.
 * Invalidates 'productionRecords' and 'products' queries on success.
 */
export const useDeleteProductionMutation = (options?: {
    onSuccess?: (data: { id: string }) => void; // Expect {id: string} on success
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();

    return useMutation<{ id: string }, Error, string>({
        mutationFn: deleteProduction,
        onSuccess: (data) => {
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: ['productionRecords'] });
            queryClient.invalidateQueries({ queryKey: ['products'] }); // Also invalidate products if deletion affects inventory
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};
