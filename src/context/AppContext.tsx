import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Conrod, ProductionRecord, Bill } from '@/types/types';
import { 
  fetchProducts, 
  createProduct, 
  fetchConrods, 
  createConrod, 
  updateProductQuantity as apiUpdateProductQuantity,
  deleteProduct as apiDeleteProduct,
  deleteConrod as apiDeleteConrod,
  fetchProduction,
  createProduction,
  updateProduction,
  deleteProduction as apiDeleteProduction,
  fetchBills,
  createBill,
  deleteBill as apiDeleteBill
} from '@/lib/api';
import { toast } from 'sonner';

interface AppContextType {
  products: Product[];
  conrods: Conrod[];
  productionRecords: ProductionRecord[];
  bills: Bill[];
  activeModule: string;
  setActiveModule: (module: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  addConrod: (conrod: Omit<Conrod, 'id' | 'srNo'>) => void;
  updateProductQuantity: (id: string, quantity: number) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  deleteConrod: (id: string) => Promise<void>;
  addProductionRecord: (record: Omit<ProductionRecord, 'id'>) => Promise<void>;
  updateProductionRecordQuantity: (id: string, quantity: number) => Promise<void>;
  deleteProductionRecord: (id: string) => Promise<void>;
  addBill: (bill: Omit<Bill, 'id'>) => Promise<void>;
  deleteBill: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [conrods, setConrods] = useState<Conrod[]>([]);
  const [productionRecords, setProductionRecords] = useState<ProductionRecord[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [activeModule, setActiveModule] = useState<string>('pre-production');

  useEffect(() => {
    fetchProducts().then(setProducts).catch(err => console.error('Failed to fetch products:', err));
    fetchConrods().then(setConrods).catch(err => console.error('Failed to fetch conrods:', err));
    fetchProduction().then(setProductionRecords).catch(err => console.error('Failed to fetch production:', err));
    fetchBills().then(setBills).catch(err => console.error('Failed to fetch bills:', err));
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    try {
      const newProduct = await createProduct(product);
      setProducts(prev => [...prev, newProduct]);
      toast.success('Product added successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add product');
    }
  };

  const addConrod = async (conrod: Omit<Conrod, 'id' | 'srNo'>) => {
    try {
      const newConrod = await createConrod(conrod);
      setConrods(prev => [...prev, newConrod]);
      toast.success('Conrod added successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add conrod');
    }
  };

  const updateProductQuantity = async (id: string, quantity: number) => {
    try {
      const updated = await apiUpdateProductQuantity(id, quantity);
      setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
      toast.success('Inventory updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update inventory');
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await apiDeleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete product');
    }
  };

  const deleteConrod = async (id: string) => {
    try {
      await apiDeleteConrod(id);
      setConrods(prev => prev.filter(c => c.id !== id));
      toast.success('Conrod deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete conrod');
    }
  };

  const addProductionRecord = async (record: Omit<ProductionRecord, 'id'>) => {
    try {
      const newRecord = await createProduction(record);
      setProductionRecords(prev => [...prev, newRecord]);
      toast.success('Production record added');
      // Deduct from raw material inventory (products)
      const product = products.find(p => p.productName === 'Conrod Assembly'); // Assuming a specific product name
      if (product) {
        await updateProductQuantity(product.id, product.quantity - record.quantity);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to add production record');
    }
  };

  const updateProductionRecordQuantity = async (id: string, quantity: number) => {
    try {
      const updated = await updateProduction(id, quantity);
      setProductionRecords(prev => prev.map(p => (p.id === id ? updated : p)));
      toast.success('Production quantity updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update production quantity');
    }
  };

  const deleteProductionRecord = async (id: string) => {
    try {
      await apiDeleteProduction(id);
      setProductionRecords(prev => prev.filter(p => p.id !== id));
      toast.success('Production record deleted');
      // Note: No automatic inventory adjustment here as creation didn't deduct
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete production record');
    }
  };

  const addBill = async (bill: Omit<Bill, 'id'>) => {
    try {
      const newBill = await createBill(bill);
      setBills(prev => [...prev, newBill]);
      // The backend already handles deducting from production, just update state
      setProductionRecords(prev => prev.map(p => 
        p.id === bill.productId ? { ...p, quantity: p.quantity - bill.quantity } : p
      ));
      toast.success('Bill created and production updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create bill');
    }
  };

  const deleteBill = async (id: string) => {
    try {
      const { deletedBillId, updatedProductionRecord } = await apiDeleteBill(id);
      setBills(prev => prev.filter(b => b.id !== deletedBillId));
      if (updatedProductionRecord) {
        setProductionRecords(prev => prev.map(p => 
          p.id === updatedProductionRecord.id ? updatedProductionRecord : p
        ));
      }
      toast.success('Bill deleted and production reverted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete bill');
    }
  };

  return (
    <AppContext.Provider
      value={{
        products,
        conrods,
        productionRecords,
        bills,
        activeModule,
        setActiveModule,
        addProduct,
        addConrod,
        updateProductQuantity,
        deleteProduct,
        deleteConrod,
        addProductionRecord,
        updateProductionRecordQuantity,
        deleteProductionRecord,
        addBill,
        deleteBill
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
