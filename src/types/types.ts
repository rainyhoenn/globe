export interface Product {
  id: string;
  productName: string;
  productType: 'Ball Bearing' | 'Pin' | 'Conrod';
  dimensions: {
    diameter?: number;
    height?: number;
    diameter2?: number;
    smallEndDiameter?: number;
    bigEndDiameter?: number;
    centerDistance?: number;
  };
  quantity: number;
  date: string;
}

export interface Conrod {
  id: string;
  srNo: number;
  name: string;
  dimensions: {
    smallEndDiameter: number;
    bigEndDiameter: number;
    centerDistance: number;
  };
  pin: string;
  ballBearing: string;
}

export interface ProductionRecord {
  id: string;
  conrodId: string;
  quantity: number;
  size?: string; // Optional size field for the conrod
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
}

export interface Bill {
  id: string;
  invoiceNo: string;
  customerId?: string; // Optional link to Customer ID
  productId: string; // This links to ProductionRecord ID
  quantity: number;
  amount: number;
  date: string;
}
