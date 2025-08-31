// /Users/w/CascadeProjects/erp-globe/src/hooks/productHooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchProducts,
    createProduct,
    deleteProduct,
    updateProductQuantity
} from '@/lib/api';
import { Product } from '@/types/types';

// Type for the data expected by the createProduct API function
type AddProductPayload = Omit<Product, 'id'>;

/**
 * Fetches the list of products.
 */
export const useProductsQuery = () => {
    return useQuery<Product[], Error>({
        queryKey: ['products'],
        queryFn: fetchProducts,
        // Optional: Add staleTime or cacheTime if needed
        // staleTime: 5 * 60 * 1000, // 5 minutes
        // cacheTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Handles adding a new product.
 * Invalidates the 'products' query on success to refetch the list.
 */
export const useAddProductMutation = (options?: {
    onSuccess?: (data: Product) => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();

    return useMutation<Product, Error, AddProductPayload>({
        mutationFn: createProduct, // Use correct function name
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};

/**
 * Handles deleting a product.
 * Invalidates the 'products' query on success to refetch the list.
 */
export const useDeleteProductMutation = (options?: {
    onSuccess?: (data: { id: string }) => void; // Expect {id: string} on success
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();

    return useMutation<{ id: string }, Error, string>({
        mutationFn: deleteProduct,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};

/**
 * Hook for updating the quantity of an existing product.
 * This is particularly useful for inventory management when components
 * are used in assembly or production.
 */
export const useUpdateProductQuantityMutation = (options?: {
    onSuccess?: (data: Product) => void;
    onError?: (error: Error) => void;
}) => {
    const queryClient = useQueryClient();
    
    return useMutation<Product, Error, { id: string; quantity: number }>({
        mutationFn: ({ id, quantity }) => updateProductQuantity(id, quantity),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            options?.onSuccess?.(data);
        },
        onError: (error) => {
            options?.onError?.(error);
        },
    });
};
