export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string;
  role?: Role;
  permissions: string[];
  createdAt: string;
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  _count?: { users: number };
  createdAt: string;
}

export interface Permission {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  price: number | null;
  createdAt: string;
  stocks?: Stock[];
}

export interface Godown {
  id: string;
  name: string;
  location: string | null;
  createdAt: string;
  stocks?: Stock[];
}

export interface Stock {
  id: string;
  productId: string;
  godownId: string;
  quantity: number;
  product?: Product;
  godown?: Godown;
}

export interface Purchase {
  id: string;
  productId: string;
  godownId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  companyName: string;
  gpNo: string;
  date: string;
  createdById: string;
  createdAt: string;
  product?: Product;
  godown?: Godown;
  createdBy?: { id: string; name: string; email?: string };
}

export interface Sale {
  id: string;
  productId: string;
  godownId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  companyName: string;
  gpNo: string;
  date: string;
  createdById: string;
  createdAt: string;
  product?: Product;
  godown?: Godown;
  createdBy?: { id: string; name: string; email?: string };
}

export interface DashboardSummary {
  totalProducts: number;
  totalGodowns: number;
  totalPurchases: number;
  totalSales: number;
  totalStockQuantity: number;
  totalPurchaseValue: number;
  totalSaleValue: number;
}

export interface StockReport {
  product: Product;
  totalQuantity: number;
  godowns: { godown: Godown; quantity: number }[];
}

export interface ProductReport {
  product: Product;
  totalPurchased: number;
  totalPurchaseValue: number;
  totalSold: number;
  totalSaleValue: number;
  currentStock: number;
  godownBreakdown: { godown: Godown; quantity: number }[];
}

// Inline product creation for purchases
export interface InlineProduct {
  name: string;
  sku?: string;
  unit: string;
  price?: number;
}
