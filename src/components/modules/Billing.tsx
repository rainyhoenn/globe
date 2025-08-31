import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProductionRecord, Customer, Bill } from '@/types/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useProductionRecordsQuery } from '@/hooks/productionHooks';
import { useCustomersQuery } from '@/hooks/customerHooks';
import { useCreateBillMutation } from '@/hooks/billHooks';
import { useConrodsQuery } from '@/hooks/conrodHooks';
import { useUpdateProductionMutation } from '@/hooks/productionHooks';

const Billing: React.FC = () => {
  // Form state
  const [invoiceNo, setInvoiceNo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [lineItems, setLineItems] = useState<{ productId: string; quantity: number; amount: string }[]>([{ productId: '', quantity: 1, amount: '' }]);
  const navigate = useNavigate();

  // React Query hooks
  const { 
    data: productions = [], 
    isLoading: isLoadingProductions, 
    error: productionsError 
  } = useProductionRecordsQuery();
  
  const { 
    data: customers = [], 
    isLoading: isLoadingCustomers, 
    error: customersError 
  } = useCustomersQuery();
  
  const { 
    data: conrods = [], 
    isLoading: isLoadingConrods,
    error: conrodsError 
  } = useConrodsQuery();
  
  const createBillMutation = useCreateBillMutation({
    onSuccess: () => {
      toast.success('Bills created successfully');
      navigate('/billing-history');
    },
    onError: (error) => {
      toast.error(`Failed to create bill: ${error.message}`);
    }
  });
  
  const updateProductionMutation = useUpdateProductionMutation();
  
  // Check for any loading or error states
  const isLoading = isLoadingProductions || isLoadingCustomers || isLoadingConrods;
  const error = productionsError || customersError || conrodsError;

  const addLineItem = () => setLineItems(prev => [...prev, { productId: '', quantity: 1, amount: '' }]);
  const updateLineItem = (index: number, field: 'productId' | 'quantity' | 'amount', value: any) => {
    setLineItems(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };
  const removeLineItem = (index: number) => setLineItems(prev => prev.filter((_, idx) => idx !== index));

  // Calculate rate (per unit price) and total amount
  const calculateTotalAmount = (amount: string, quantity: number) => {
    const ratePerUnit = parseFloat(amount || '0');
    return ratePerUnit * quantity;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form inputs
    if (!invoiceNo) {
      toast.error('Please enter an invoice number');
      return;
    }
    
    if (lineItems.some(item => !item.productId || item.quantity <= 0 || !item.amount)) {
      toast.error('Please fill in all product details');
      return;
    }
    
    // Process each line item
    lineItems.forEach((item, index) => {
      // Create bill payload
      const billPayload: Omit<Bill, 'id'> = {
        invoiceNo,
        productId: item.productId,
        quantity: item.quantity,
        amount: calculateTotalAmount(item.amount, item.quantity),
        date: new Date().toISOString(),
      };
      
      // Add customerId only if selected
      if (customerId) {
        billPayload.customerId = customerId;
      }
      
      // Use create bill mutation
      createBillMutation.mutate(billPayload, {
        onSuccess: () => {
          // After bill is created, update production record quantity
          const rec = productions.find(r => r.id === item.productId);
          if (rec) {
            updateProductionMutation.mutate({
              id: rec.id,
              quantity: Math.max(0, rec.quantity - item.quantity)
            });
          }
        }
      });
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-lg">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || 'Failed to load billing data. Please try again.'}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Billing</h2>
      <Card>
        <CardHeader>
          <CardTitle>Create Bill</CardTitle>
          <CardDescription>Fill in details to create a new invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="invoiceNo">Invoice No</Label>
                <Input id="invoiceNo" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="customer">Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(customer => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {lineItems.map((item, idx) => (
              <div key={idx} className="space-y-2 border border-neutral-200 bg-gray-50 p-4 rounded-md">
                <div className="flex space-x-4">
                  <div>
                    <Label htmlFor={`product-select-${idx}`}>Product</Label>
                    <Select value={item.productId} onValueChange={val => updateLineItem(idx, 'productId', val)}>
                      <SelectTrigger id={`product-select-${idx}`}>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productions.map(r => {
                          const c = conrods.find(c => c.id === r.conrodId);
                          return (
                            <SelectItem key={r.id} value={r.id}>
                              {c?.name || ''}{r.size ? ` (Size: ${r.size})` : ''}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`quantity-${idx}`}>Quantity</Label>
                    <Input id={`quantity-${idx}`} type="number" min={1} value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', Number(e.target.value))} />
                  </div>
                  <div>
                    <Label htmlFor={`amount-${idx}`}>Amount (per unit)</Label>
                    <Input id={`amount-${idx}`} type="number" step="0.01" value={item.amount} onChange={e => updateLineItem(idx, 'amount', e.target.value)} />
                  </div>
                  {idx > 0 && (
                    <div className="flex items-end">
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeLineItem(idx)}>Remove</Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center mt-4">
              <Button type="button" variant="outline" onClick={addLineItem}>+ Add Product</Button>
              <Button 
                type="submit" 
                disabled={createBillMutation.isPending}
              >
                {createBillMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Bill
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;
