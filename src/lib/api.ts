import { Product, Conrod, ProductionRecord, Bill, Customer } from '@/types/types';

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch('http://localhost:4000/api/products');
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json();
}

export async function createProduct(product: Omit<Product, 'id'>): Promise<Product> {
  const res = await fetch('http://localhost:4000/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json();
}

export async function fetchConrods(): Promise<Conrod[]> {
  const res = await fetch('http://localhost:4000/api/conrods');
  if (!res.ok) throw new Error('Failed to fetch conrods');
  return res.json();
}

export async function createConrod(conrod: Omit<Conrod, 'id' | 'srNo'>): Promise<Conrod> {
  const res = await fetch('http://localhost:4000/api/conrods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conrod),
  });
  if (!res.ok) throw new Error('Failed to create conrod');
  return res.json();
}

// Update an existing conrod definition
export async function updateConrod(id: string, conrod: Omit<Conrod, 'id' | 'srNo'>): Promise<Conrod> {
  const res = await fetch(`http://localhost:4000/api/conrods/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(conrod),
  });
  if (!res.ok) throw new Error('Failed to update conrod');
  return res.json();
}

export async function updateProductQuantity(id: string, quantity: number): Promise<Product> {
  const res = await fetch(`http://localhost:4000/api/products/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity }),
  });
  if (!res.ok) throw new Error('Failed to update product quantity');
  return res.json();
}

export async function fetchProduction(): Promise<ProductionRecord[]> {
  const res = await fetch('http://localhost:4000/api/production');
  if (!res.ok) throw new Error('Failed to fetch production records');
  return res.json();
}

export async function createProduction(record: Omit<ProductionRecord, 'id'>): Promise<ProductionRecord> {
  // Use the standard endpoint - we handle component deduction in the UI
  const res = await fetch('http://localhost:4000/api/production', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to create production record');
  }
  
  return res.json();
}

export async function updateProduction(id: string, quantity: number, size?: string): Promise<ProductionRecord> {
  const updateData: { quantity: number; size?: string } = { quantity };
  
  // Only include size in the payload if it's provided
  if (size !== undefined) {
    updateData.size = size;
  }
  
  const res = await fetch(`http://localhost:4000/api/production/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!res.ok) throw new Error('Failed to update production record');
  return res.json();
}

export async function deleteProduction(id: string): Promise<{ id: string }> {
  const res = await fetch(`http://localhost:4000/api/production/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete production record');
  return res.json();
}

export async function fetchBills(): Promise<Bill[]> {
  const res = await fetch('http://localhost:4000/api/bills');
  if (!res.ok) throw new Error('Failed to fetch bills');
  return res.json();
}

export async function createBill(bill: Omit<Bill, 'id'>): Promise<Bill> {
  const res = await fetch('http://localhost:4000/api/bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(bill),
  });
  if (!res.ok) throw new Error('Failed to create bill');
  return res.json();
}

export async function deleteBill(id: string): Promise<{ deletedBillId: string; updatedProductionRecord: ProductionRecord | null }> {
  const res = await fetch(`http://localhost:4000/api/bills/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete bill');
  return res.json();
}

// Customer APIs
export async function fetchCustomers(): Promise<Customer[]> {
  const res = await fetch('http://localhost:4000/api/customers');
  if (!res.ok) throw new Error('Failed to fetch customers');
  return res.json();
}

export async function createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
  const res = await fetch('http://localhost:4000/api/customers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(customer),
  });
  if (!res.ok) throw new Error('Failed to create customer');
  return res.json();
}

export async function deleteCustomer(id: string): Promise<{ id: string }> {
  const res = await fetch(`http://localhost:4000/api/customers/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete customer');
  return res.json();
}

export async function deleteProduct(id: string): Promise<{ id: string }> {
  const res = await fetch(`http://localhost:4000/api/products/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

export async function deleteConrod(id: string): Promise<{ id: string }> {
  const res = await fetch(`http://localhost:4000/api/conrods/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete conrod');
  return res.json();
}
