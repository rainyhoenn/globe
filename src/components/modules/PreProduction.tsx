import React, { useState, useMemo, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { useProductsQuery, useAddProductMutation, useUpdateProductQuantityMutation, useDeleteProductMutation } from '@/hooks/productHooks';
import { useConrodsQuery } from '@/hooks/conrodHooks';
import { Product, Conrod } from '@/types/types';
import { format } from 'date-fns';
import { Plus, Trash2, Loader2, RefreshCw, FileUp, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from "@/components/ui/badge"; 

// Define types for form data structure
interface ProductFormData {
  productName: string;
  productType: 'Ball Bearing' | 'Pin' | 'Conrod' | '';
  dimensions: {
    diameter: string;
    height: string;
    smallEndDiameter: string;
    bigEndDiameter: string;
    centerDistance: string;
  };
  quantity: string;
  date: string;
}

// Clean inventory filter options
type FilterOption = 'all' | 'Ball Bearing' | 'Pin' | 'Conrod';

const PreProduction: React.FC = () => {
  // API data and mutations
  const { data: products = [], isLoading: isLoadingProducts, error: productsError, refetch: refetchProducts } = useProductsQuery();
  const { data: conrods = [], isLoading: isLoadingConrods } = useConrodsQuery();
  const updateQuantityMutation = useUpdateProductQuantityMutation();
  const addProductMutation = useAddProductMutation({
    onSuccess: () => {
      toast.success("Product added successfully!");
      setIsAddDialogOpen(false);
      resetFormData();
    },
    onError: (error: Error) => {
      toast.error(`Failed to add product: ${error.message}`);
    }
  });
  const deleteProductMutation = useDeleteProductMutation({
    onSuccess: () => {
      toast.success("Product deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    }
  });

  // UI state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [sortCriteria, setSortCriteria] = useState<FilterOption>('all');
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const [existingProductId, setExistingProductId] = useState<string | null>(null);

  // Form state with standardized product types
  const [formData, setFormData] = useState<ProductFormData>({
    productName: '',
    productType: '',
    dimensions: {
      diameter: '', 
      height: '', 
      smallEndDiameter: '', 
      bigEndDiameter: '', 
      centerDistance: '',
    },
    quantity: '',
    date: format(new Date(), 'yyyy-MM-dd'),
  });
  
  // For showing available component names from conrod definitions
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  
  // Reset form data to initial state
  const resetFormData = () => {
    setFormData({
      productName: '',
      productType: '',
      dimensions: {
        diameter: '', 
        height: '', 
        smallEndDiameter: '', 
        bigEndDiameter: '', 
        centerDistance: '',
      },
      quantity: '',
      date: format(new Date(), 'yyyy-MM-dd'),
    });
    setIsDuplicateWarningOpen(false);
    setExistingProductId(null);
  };

  // Effect to check for duplicate products when product name or type changes
  useEffect(() => {
    if (formData.productName && formData.productType) {
      const normalizedProductName = formData.productName.trim().toLowerCase();
      const normalizedProductType = formData.productType.toLowerCase();
      
      const existingProduct = products.find(p => 
        p.productName.trim().toLowerCase() === normalizedProductName && 
        p.productType.toLowerCase() === normalizedProductType
      );
      
      if (existingProduct) {
        setIsDuplicateWarningOpen(true);
        setExistingProductId(existingProduct.id);
      } else {
        setIsDuplicateWarningOpen(false);
        setExistingProductId(null);
      }
    }
  }, [formData.productName, formData.productType, products]);

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, dimensions: { ...prev.dimensions, [name]: value } }));
  };
  
  const handleTypeChange = (value: 'Ball Bearing' | 'Pin' | 'Conrod') => {
    setFormData(prev => ({
      ...prev,
      productName: '', // Reset name when type changes
      productType: value,
      dimensions: { diameter: '', height: '', smallEndDiameter: '', bigEndDiameter: '', centerDistance: '' }, 
    }));
    
    // Show the name dropdown if we have any conrods and type is Pin, Ball Bearing, or Conrod
    setShowNameDropdown(conrods.length > 0);
  };
  
  // Get unique component names based on selected type
  const availableComponentNames = useMemo(() => {
    if (!formData.productType || !conrods.length) return [];
    
    if (formData.productType === 'Conrod') {
      // For Conrod type, show all conrod names
      const uniqueNames = [...new Set(
        conrods
          .map(conrod => conrod.name)
          .filter(name => name && name.trim() !== '')
      )];
      return uniqueNames.sort();
    }
    
    // For Pin or Ball Bearing types
    let fieldToExtract: 'pin' | 'ballBearing' | null = null;
    
    if (formData.productType === 'Pin') {
      fieldToExtract = 'pin';
    } else if (formData.productType === 'Ball Bearing') {
      fieldToExtract = 'ballBearing';
    }
    
    if (!fieldToExtract) return [];
    
    // Extract component names from conrods and remove duplicates
    const uniqueNames = [...new Set(
      conrods
        .map(conrod => conrod[fieldToExtract])
        .filter(name => name && name.trim() !== '') // Filter out empty names
    )];
    
    return uniqueNames.sort(); // Sort alphabetically
  }, [conrods, formData.productType]);

  // Handle product submission - with duplicate product detection
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.productType || !formData.quantity) {
      toast.error("Please fill in all required fields.");
      return;
    }

    let dimensions: Product['dimensions'] = {};
    try {
      if (formData.productType === 'Ball Bearing') {
        dimensions = { diameter: parseFloat(formData.dimensions.diameter || '0') };
      } else if (formData.productType === 'Pin') {
        dimensions = { 
          height: parseFloat(formData.dimensions.height || '0'), 
          diameter: parseFloat(formData.dimensions.diameter || '0') 
        };
      } else if (formData.productType === 'Conrod') {
        dimensions = { 
          smallEndDiameter: parseFloat(formData.dimensions.smallEndDiameter || '0'), 
          bigEndDiameter: parseFloat(formData.dimensions.bigEndDiameter || '0'), 
          centerDistance: parseFloat(formData.dimensions.centerDistance || '0') 
        };
      }
      
      if (Object.values(dimensions).some(isNaN)) {
        throw new Error("Invalid dimension value. Please enter numbers.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid dimension format.");
      return;
    }

    // If we found an existing product with the same name/type, update its quantity instead of creating a new one
    if (isDuplicateWarningOpen && existingProductId) {
      const existingProduct = products.find(p => p.id === existingProductId);
      if (existingProduct) {
        const newQuantity = existingProduct.quantity + parseInt(formData.quantity, 10);
        
        updateQuantityMutation.mutate({
          id: existingProductId,
          quantity: newQuantity
        }, {
          onSuccess: () => {
            toast.success(`Updated quantity of existing ${formData.productName} to ${newQuantity}`);
            setIsAddDialogOpen(false);
            resetFormData();
          },
          onError: (error) => {
            toast.error(`Failed to update quantity: ${error.message}`);
          }
        });
      }
    } else {
      // Create a new product
      addProductMutation.mutate({
        productName: formData.productName.trim(),
        productType: formData.productType, // Using standardized types (singular form)
        dimensions,
        quantity: parseInt(formData.quantity, 10),
        date: formData.date,
      });
    }
  };

  // Handle product deletion with confirmation
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      deleteProductMutation.mutate(id);
    }
  };
  
  // Convert plural product types to singular for consistency
  const normalizeProductType = (type: string): 'Ball Bearing' | 'Pin' | 'Conrod' => {
    const normalized = type.toLowerCase();
    if (normalized.includes('ball')) return 'Ball Bearing';
    if (normalized.includes('pin')) return 'Pin';
    return 'Conrod';
  };

  // Filter and sort products based on selected criteria
  const sortedProducts = useMemo(() => {
    // Include products with quantity = 0 to show depleted inventory items
    if (sortCriteria === 'all') return products;
    
    // Filter by normalized product type (accounting for singular/plural variations)
    return products.filter(product => {
      const normalizedType = normalizeProductType(product.productType);
      return normalizedType === sortCriteria;
    });
  }, [products, sortCriteria]);

  if (isLoadingProducts) {
    return <div className="flex justify-center items-center h-64 gap-2"><Loader2 className="h-8 w-8 animate-spin text-primary" /> Loading Products...</div>;
  }

  if (productsError) {
    return <div className="text-destructive text-center p-4 border border-destructive rounded-md">Error loading products: {productsError.message}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory / Raw Materials</h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Filter: {sortCriteria === 'all' ? 'All Types' : sortCriteria}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by Type</DropdownMenuLabel>
              <DropdownMenuGroup>
                 <DropdownMenuItem onSelect={() => setSortCriteria('all')}>All Types</DropdownMenuItem>
                 <DropdownMenuItem onSelect={() => setSortCriteria('Pin')}>Pins</DropdownMenuItem>
                 <DropdownMenuItem onSelect={() => setSortCriteria('Ball Bearing')}>Ball Bearings</DropdownMenuItem>
                 <DropdownMenuItem onSelect={() => setSortCriteria('Conrod')}>Conrods</DropdownMenuItem>
               </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.length > 0 ? (
                sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.productName}</TableCell>
                    <TableCell>{product.productType}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {Object.entries(product.dimensions)
                        .map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}: ${value}`)
                        .join(', ')}
                    </TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{format(new Date(product.date), 'PP')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                        disabled={deleteProductMutation.isPending && deleteProductMutation.variables === product.id}
                        aria-label="Delete product"
                      >
                        {deleteProductMutation.isPending && deleteProductMutation.variables === product.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive hover:text-destructive-foreground" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No products match the current filter.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>
              Enter the details for the new raw material or component.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productType" className="text-right">Type</Label>
              <Select onValueChange={handleTypeChange} value={formData.productType} required>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ball Bearing">Ball Bearing</SelectItem>
                  <SelectItem value="Pin">Pin</SelectItem>
                  <SelectItem value="Conrod">Conrod</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="productName" className="text-right">Name</Label>
              {showNameDropdown && availableComponentNames.length > 0 ? (
                <div className="col-span-3">
                  <Select 
                    value={formData.productName} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, productName: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select component name" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableComponentNames.map(name => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.productType === 'Conrod' 
                      ? "Available conrod names" 
                      : "Component names from conrod definitions"}
                  </p>
                </div>
              ) : (
                <Input 
                  id="productName" 
                  name="productName" 
                  value={formData.productName} 
                  onChange={handleInputChange} 
                  className="col-span-3" 
                  required 
                />
              )}
            </div>

            {/* Conditional dimension fields based on product type */}
            {formData.productType === 'Ball Bearing' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="diameter" className="text-right">Diameter (mm)</Label>
                <Input id="diameter" name="diameter" type="number" step="0.01" value={formData.dimensions.diameter} onChange={handleDimensionChange} className="col-span-3" required />
              </div>
            )}
            
            {formData.productType === 'Pin' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="height" className="text-right">Height (mm)</Label>
                  <Input id="height" name="height" type="number" step="0.01" value={formData.dimensions.height} onChange={handleDimensionChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="diameter" className="text-right">Diameter (mm)</Label>
                  <Input id="diameter" name="diameter" type="number" step="0.01" value={formData.dimensions.diameter} onChange={handleDimensionChange} className="col-span-3" required />
                </div>
              </>
            )}
            
            {formData.productType === 'Conrod' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="smallEndDiameter" className="text-right">Small End Dia. (mm)</Label>
                  <Input id="smallEndDiameter" name="smallEndDiameter" type="number" step="0.01" value={formData.dimensions.smallEndDiameter} onChange={handleDimensionChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="bigEndDiameter" className="text-right">Big End Dia. (mm)</Label>
                  <Input id="bigEndDiameter" name="bigEndDiameter" type="number" step="0.01" value={formData.dimensions.bigEndDiameter} onChange={handleDimensionChange} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="centerDistance" className="text-right">Center Dist. (mm)</Label>
                  <Input id="centerDistance" name="centerDistance" type="number" step="0.01" value={formData.dimensions.centerDistance} onChange={handleDimensionChange} className="col-span-3" required />
                </div>
              </>
            )}
            
            {/* Show warning if duplicate product is detected */}
            {isDuplicateWarningOpen && (
              <div className="flex items-center gap-2 p-3 mb-2 border border-amber-200 bg-amber-50 rounded-md text-amber-800">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">This product already exists in inventory</p>
                  <p className="text-xs">Adding more will update the existing quantity instead of creating a duplicate.</p>
                </div>
              </div>
            )}
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="quantity" className="text-right">Quantity</Label>
               <Input id="quantity" name="quantity" type="number" min="1" value={formData.quantity} onChange={handleInputChange} className="col-span-3" required />
             </div>
             <div className="grid grid-cols-4 items-center gap-4">
               <Label htmlFor="date" className="text-right">Date Added</Label>
               <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} className="col-span-3" required />
             </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={addProductMutation.isPending}>
                {addProductMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PreProduction;
