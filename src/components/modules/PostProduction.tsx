import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { format } from 'date-fns';
import { Plus, Trash2, Loader2, AlertCircle, Check, Info } from 'lucide-react';
import { toast } from 'sonner';
import { useConrodsQuery } from '@/hooks/conrodHooks';
import { useProductionRecordsQuery, useCreateProductionMutation, useDeleteProductionMutation } from '@/hooks/productionHooks';
import { useProductsQuery, useUpdateProductQuantityMutation } from '@/hooks/productHooks';
import { Conrod, Product } from '@/types/types';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Interface representing a production record for display
interface DisplayProductionRecord {
  id: string;
  conrodName: string;
  size: string;
  quantity: number;
  date: string;
}

// Interface for a component required for conrod assembly
interface RequiredComponent {
  product: Product | null;
  found: boolean;
  sufficientQuantity: boolean;
  requiredName: string; // The name specified in the conrod definition
}

// Interface to track required components for assembly
interface AssemblyComponents {
  pin: RequiredComponent;
  ballBearing: RequiredComponent;
}

// Normalized product types to ensure consistency
type NormalizedProductType = 'Ball Bearing' | 'Pin' | 'Conrod';

// Interface for production form state
interface ProductionFormState {
  conrodId: string;
  quantity: number;
  size: string;
}

// Helper function to normalize product types (ensuring singular form)
const normalizeProductType = (type: string): NormalizedProductType => {
  const normalized = type.toLowerCase();
  if (normalized.includes('ball')) return 'Ball Bearing';
  if (normalized.includes('pin')) return 'Pin';
  return 'Conrod';
};

const PostProduction: React.FC = () => {
  // API data hooks with refetch capabilities
  const { 
    data: conrods = [], 
    isLoading: isLoadingConrods, 
    error: conrodsError,
    refetch: refetchConrods 
  } = useConrodsQuery();
  
  const { 
    data: productionRecords = [], 
    isLoading: isLoadingRecords, 
    error: recordsError,
    refetch: refetchRecords 
  } = useProductionRecordsQuery();
  
  const { 
    data: products = [], 
    isLoading: isLoadingProducts, 
    error: productsError,
    refetch: refetchProducts 
  } = useProductsQuery();

  // Mutations
  const updateProductQuantity = useUpdateProductQuantityMutation();
  const createMutation = useCreateProductionMutation({
    onSuccess: () => {
      toast.success("Conrod production recorded successfully!");
      setFormState({
        conrodId: '',
        quantity: 1,
        size: ''
      });
      setIsDialogOpen(false);
      // Refresh data after successful creation
      refetchRecords();
      refetchProducts();
    },
    onError: (error: Error) => {
      toast.error(`Failed to record production: ${error.message}`);
    }
  });
  
  const deleteMutation = useDeleteProductionMutation({
    onSuccess: () => {
      toast.success("Production record deleted successfully!");
      // Refresh data after successful deletion
      refetchRecords();
      refetchProducts();
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete record: ${error.message}`);
    }
  });

  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state consolidated into a single object
  const [formState, setFormState] = useState<ProductionFormState>({
    conrodId: '',
    quantity: 1,
    size: ''
  });
  
  // Initialize assembly components with required names (fixing the lint errors)
  const [assemblyComponents, setAssemblyComponents] = useState<AssemblyComponents>({
    pin: { 
      product: null, 
      found: false, 
      sufficientQuantity: false,
      requiredName: ''
    },
    ballBearing: { 
      product: null, 
      found: false, 
      sufficientQuantity: false,
      requiredName: ''
    }
  });
  
  // Derived state - selected conrod from form state
  const selectedConrod = useMemo(() => {
    return conrods.find(c => c.id === formState.conrodId) || null;
  }, [conrods, formState.conrodId]);
  
  // Handler for form field changes
  const handleFormChange = (field: keyof ProductionFormState, value: any) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Effect to find and validate required components whenever selected conrod or quantity changes
  useEffect(() => {
    if (!selectedConrod || products.length === 0) {
      setAssemblyComponents({
        pin: { 
          product: null, 
          found: false, 
          sufficientQuantity: false,
          requiredName: ''
        },
        ballBearing: { 
          product: null, 
          found: false, 
          sufficientQuantity: false,
          requiredName: ''
        }
      });
      return;
    }

    // Find components with consistent type normalization
    const findComponent = (requiredName: string, productType: NormalizedProductType): Product | null => {
      // Step 1: Normalize the search parameters
      const normalizedName = requiredName.trim().toLowerCase();
      
      // Step 2: Filter products by normalized type
      const typeFilteredProducts = products.filter(p => 
        normalizeProductType(p.productType) === productType
      );
      
      // Step 3: First attempt an exact name match (case-insensitive)
      const exactMatch = typeFilteredProducts.find(p => 
        p.productName.trim().toLowerCase() === normalizedName
      );
      
      if (exactMatch) return exactMatch;
      
      // Step 4: If exact match fails, try a flexible match (contains)
      const flexibleMatch = typeFilteredProducts.find(p => 
        p.productName.trim().toLowerCase().includes(normalizedName) ||
        normalizedName.includes(p.productName.trim().toLowerCase())
      );
      
      return flexibleMatch || null;
    };
    
    // Find pin and ball bearing components
    const pinProduct = findComponent(selectedConrod.pin, 'Pin');
    const ballBearingProduct = findComponent(selectedConrod.ballBearing, 'Ball Bearing');
    
    // Update state with found components and quantity sufficiency
    setAssemblyComponents({
      pin: { 
        product: pinProduct, 
        found: !!pinProduct, 
        sufficientQuantity: pinProduct ? pinProduct.quantity >= formState.quantity : false,
        requiredName: selectedConrod.pin
      },
      ballBearing: { 
        product: ballBearingProduct, 
        found: !!ballBearingProduct, 
        sufficientQuantity: ballBearingProduct ? ballBearingProduct.quantity >= formState.quantity : false,
        requiredName: selectedConrod.ballBearing
      }
    });
  }, [selectedConrod, products, formState.quantity]);

  /**
   * Handle conrod production record creation
   * This function validates inputs, creates a production record,
   * and updates inventory quantities for components
   */
  const handleCreate = () => {
    // Validation checks
    if (!selectedConrod) {
      toast.error("Please select a conrod.");
      return;
    }
    
    if (formState.quantity <= 0) {
      toast.error("Please enter a valid quantity.");
      return;
    }
    
    if (!assemblyComponents.pin.found || !assemblyComponents.ballBearing.found) {
      toast.error("Required components not found in inventory. Check component names.");
      return;
    }
    
    if (!assemblyComponents.pin.sufficientQuantity || !assemblyComponents.ballBearing.sufficientQuantity) {
      toast.error("Insufficient quantity of components in inventory.");
      return;
    }

    // Non-null assertion is safe here because we've verified products exist above
    const pinProduct = assemblyComponents.pin.product!;
    const ballBearingProduct = assemblyComponents.ballBearing.product!;

    // Create production record
    createMutation.mutate({
      conrodId: formState.conrodId,
      quantity: formState.quantity,
      size: formState.size,
      date: format(new Date(), 'yyyy-MM-dd')
    });
    
    // Log component details
    console.log('Using components:', {
      pin: { id: pinProduct.id, name: pinProduct.productName, qty: formState.quantity },
      ballBearing: { id: ballBearingProduct.id, name: ballBearingProduct.productName, qty: formState.quantity }
    });

    // Update component inventories
    // We use sequential mutations to avoid race conditions
    updateProductQuantity.mutate({
      id: pinProduct.id,
      quantity: Math.max(0, pinProduct.quantity - formState.quantity) // Prevent negative quantities
    }, {
      onSuccess: () => {
        // After pin is updated, update ball bearing
        updateProductQuantity.mutate({
          id: ballBearingProduct.id,
          quantity: Math.max(0, ballBearingProduct.quantity - formState.quantity)
        }, {
          onSuccess: () => {
            // Find and update conrod inventory if it exists in products
            const conrodProduct = products.find(p => 
              p.productType === 'Conrod' && 
              p.productName.toLowerCase() === selectedConrod?.name.toLowerCase()
            );
            
            if (conrodProduct) {
              // After ball bearing is updated, update conrod
              updateProductQuantity.mutate({
                id: conrodProduct.id,
                quantity: Math.max(0, conrodProduct.quantity - formState.quantity)
              });
            } else {
              console.log('No matching conrod found in inventory to deduct');
            }
          }
        });
      }
    });
  };

  /**
   * Handle deletion of a production record
   * Note: This doesn't restore component quantities as we don't track
   * which specific components were used in the deleted record
   */
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this production record? This action cannot be undone and component quantities will not be restored.')) {
      deleteMutation.mutate(id);
    }
  };
  
  /**
   * Get component status for display
   * Returns a tuple of [status text, color class]
   */
  const getComponentStatus = (component: RequiredComponent): [string, string] => {
    if (!component.found) {
      return ["Not found", "text-red-500"];
    }
    
    if (!component.sufficientQuantity) {
      return [`Insufficient (${component.product?.quantity || 0} available)`, "text-amber-500"];
    }
    
    return [`Available (${component.product?.quantity || 0})`, "text-green-500"];
  };

  // Format production records for display with improved error handling
  const formattedRecords = useMemo<DisplayProductionRecord[]>(() => {
    return productionRecords.map(record => ({
      id: record.id,
      conrodName: conrods.find(c => c.id === record.conrodId)?.name || 'Unknown Conrod',
      size: record.size || 'N/A',
      quantity: record.quantity,
      date: format(new Date(record.date), 'PPP')
    }));
  }, [productionRecords, conrods]);
  
  /**
   * Check if all required components are available and sufficient
   * This is used to determine if the production can proceed
   */
  const canProduceConrod = useMemo(() => {
    if (!selectedConrod) return false;
    
    return (
      formState.quantity > 0 &&
      assemblyComponents.pin.found &&
      assemblyComponents.ballBearing.found &&
      assemblyComponents.pin.sufficientQuantity &&
      assemblyComponents.ballBearing.sufficientQuantity
    );
  }, [selectedConrod, formState.quantity, assemblyComponents]);

  const isLoading = isLoadingConrods || isLoadingRecords || isLoadingProducts;
  const queryError = conrodsError || recordsError || productsError;

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span className="text-lg">Loading...</span>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="rounded-md bg-red-50 p-6 text-center text-red-700">
        <p className="text-lg font-semibold">Error loading data</p>
        <p className="text-sm">{queryError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl font-bold">Conrod Assembly</CardTitle>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Production
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {formattedRecords.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <p>No production records found. Click "Record Production" to add a new record.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conrod Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formattedRecords.map(record => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.conrodName}</TableCell>
                    <TableCell>{record.size}</TableCell>
                    <TableCell>{record.quantity}</TableCell>
                    <TableCell>{record.date}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(record.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending && deleteMutation.variables === record.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Conrod</DialogTitle>
            <DialogDescription>
              Select a conrod type and quantity to produce. Required components will be automatically deducted from inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="conrod" className="text-right">Conrod Type</Label>
              <Select 
                value={formState.conrodId} 
                onValueChange={(value) => handleFormChange('conrodId', value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a conrod" />
                </SelectTrigger>
                <SelectContent>
                  {conrods.map(conrod => (
                    <SelectItem key={conrod.id} value={conrod.id}>{conrod.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Size field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="size" className="text-right">Size</Label>
              <Input
                id="size"
                value={formState.size}
                onChange={e => handleFormChange('size', e.target.value)}
                placeholder="Enter size (optional)"
                className="col-span-3"
              />
            </div>
            
            {selectedConrod && (
              <div className="bg-muted p-4 rounded-md">
                <div className="font-medium mb-2">Required Components:</div>
                
                {/* Conrod Component Status */}
                <div className="border rounded-md p-3 bg-white mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">Conrod</span>
                    <Badge variant={products.some(p => 
                      p.productType === 'Conrod' && 
                      p.productName.toLowerCase() === selectedConrod?.name.toLowerCase()
                    ) ? 
                      (products.some(p => 
                        p.productType === 'Conrod' && 
                        p.productName.toLowerCase() === selectedConrod?.name.toLowerCase() && 
                        p.quantity >= formState.quantity
                      ) ? "default" : "destructive") : 
                      "outline"}>
                      {products.some(p => 
                        p.productType === 'Conrod' && 
                        p.productName.toLowerCase() === selectedConrod?.name.toLowerCase()
                      ) ? 
                        (products.some(p => 
                          p.productType === 'Conrod' && 
                          p.productName.toLowerCase() === selectedConrod?.name.toLowerCase() && 
                          p.quantity >= formState.quantity
                        ) ? "Available" : "Insufficient") : 
                        "Not Found"}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1 truncate">
                    Required: <span className="font-medium">{selectedConrod.name}</span>
                  </div>
                  <div className="text-sm">
                    {
                      // Find if conrod exists in inventory
                      (() => {
                        const conrodProduct = products.find(p => 
                          p.productType === 'Conrod' && 
                          p.productName.toLowerCase() === selectedConrod?.name.toLowerCase()
                        );
                        
                        if (conrodProduct) {
                          const isEnough = conrodProduct.quantity >= formState.quantity;
                          return (
                            <>
                              In stock: <span className={isEnough ? "font-medium text-green-600" : "font-medium text-red-600"}>
                                {conrodProduct.quantity}
                              </span>
                              {!isEnough && (
                                <span className="text-red-600"> (need {formState.quantity})</span>
                              )}
                            </>
                          );
                        } else {
                          return (
                            <>In stock: <span className="font-medium text-black">0</span> <span className="text-black">(Not found in inventory)</span></>
                          );
                        }
                      })()
                    }
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Pin Component Status */}
                  <div className="border rounded-md p-3 bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Pin</span>
                      <Badge variant={assemblyComponents.pin.found ? 
                        (assemblyComponents.pin.sufficientQuantity ? "default" : "destructive") : 
                        "outline"}>
                        {assemblyComponents.pin.found ? 
                          (assemblyComponents.pin.sufficientQuantity ? "Available" : "Insufficient") : 
                          "Not Found"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1 truncate">
                      Required: <span className="font-medium">{assemblyComponents.pin.requiredName}</span>
                    </div>
                    {assemblyComponents.pin.found && (
                      <div className="text-sm">
                        In stock: <span className={assemblyComponents.pin.sufficientQuantity ? 
                          "font-medium text-green-600" : 
                          "font-medium text-red-600"}>
                          {assemblyComponents.pin.product?.quantity || 0}
                        </span>
                        {!assemblyComponents.pin.sufficientQuantity && (
                          <span className="text-red-600"> (need {formState.quantity})</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Ball Bearing Component Status */}
                  <div className="border rounded-md p-3 bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Ball Bearing</span>
                      <Badge variant={assemblyComponents.ballBearing.found ? 
                        (assemblyComponents.ballBearing.sufficientQuantity ? "default" : "destructive") : 
                        "outline"}>
                        {assemblyComponents.ballBearing.found ? 
                          (assemblyComponents.ballBearing.sufficientQuantity ? "Available" : "Insufficient") : 
                          "Not Found"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-1 truncate">
                      Required: <span className="font-medium">{assemblyComponents.ballBearing.requiredName}</span>
                    </div>
                    {assemblyComponents.ballBearing.found && (
                      <div className="text-sm">
                        In stock: <span className={assemblyComponents.ballBearing.sufficientQuantity ? 
                          "font-medium text-green-600" : 
                          "font-medium text-red-600"}>
                          {assemblyComponents.ballBearing.product?.quantity || 0}
                        </span>
                        {!assemblyComponents.ballBearing.sufficientQuantity && (
                          <span className="text-red-600"> (need {formState.quantity})</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={formState.quantity}
                onChange={e => handleFormChange('quantity', Math.max(1, Number(e.target.value)))}
                className="col-span-3"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending || !canProduceConrod}
            >
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Conrod
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostProduction;
