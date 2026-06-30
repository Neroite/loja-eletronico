export interface Product {
  id: string; // SKU code, e.g. #45001-X
  name: string;
  category: string;
  stockLevel: number;
  maxStock: number; // For rendering stock health bar
  status: 'Em Estoque' | 'Estoque Baixo' | 'Crítico';
  costPrice: number;
  salePrice: number;
  imageUrl: string;
}

export type PaymentMethod = 'Cartão Crédito' | 'PIX' | 'Dinheiro' | 'Debito';
export type SaleStatus = 'Pago' | 'Aguard. Retirada' | 'Cancelado';

export interface Client {
  id: string; // e.g. #CLI-001
  name: string;
  contactName?: string; // responsible person / buyer
  doc?: string; // CPF or CNPJ
  email?: string;
  phone?: string;
  createdAt: string; // ISO timestamp
}

export interface SaleItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
}

export type StockMovementType = 'venda' | 'estorno' | 'reposição' | 'ajuste' | 'cadastro';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string; // snapshot, survives product deletion
  type: StockMovementType;
  delta: number; // + entrada / - saída
  resultingStock: number; // stock level after the movement
  reason?: string; // free-text reason for manual adjustments
  createdAt: string; // ISO timestamp
}

export interface Sale {
  id: string; // Order ID, e.g. #BF-10824
  createdAt: string; // ISO timestamp — source of truth for date/time and period filters
  clientId?: string; // link to a registered Client (optional: walk-in customers have none)
  clientName: string;
  clientDoc: string; // CPF or CNPJ snapshot
  seller: string;
  paymentMethod: PaymentMethod;
  totalValue: number;
  status: SaleStatus;
  items: SaleItem[];
}
