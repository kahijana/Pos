export interface Product {
  id: string;
  kodeBarang: string;
  kodeBarcode: string;
  nama: string;
  kategori: string;
  supplier?: string;
  tanggalBeli?: string;
  isi: number; // Ratio: 1 Satuan 2 = isi * Satuan 1
  satuan1: string; // e.g. "PCS", "MTR", "LBR"
  satuan2: string; // e.g. "PACK", "ROL", "BALL"
  stokToko: number; // In Satuan 1
  stokGudang?: number;
  // Selling prices only (HPP/Modal strictly hidden from UI)
  hargaRetail1: number;
  hargaRetail2: number;
  hargaGrosir1?: number;
  hargaGrosir2?: number;
  hargaCabang1?: number;
  hargaCabang2?: number;
}

export type PriceTier = 'retail' | 'grosir';

export interface CartItemUnitBreakdown {
  qty1: number; // Qty in Satuan 1
  qty2: number; // Qty in Satuan 2
}

export interface CartItem {
  product: Product;
  priceTier: PriceTier;
  qty1: number; // Quantity in Satuan 1
  qty2: number; // Quantity in Satuan 2
  price1: number; // Unit 1 price at checkout
  price2: number; // Unit 2 price at checkout
  subtotal: number;
}

export interface Transaction {
  id: string;
  receiptNumber: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  discount: number; // In Rp
  total: number;
  paymentMethod: 'tunai' | 'qris' | 'transfer' | 'bon';
  cashReceived: number;
  change: number;
  customerName?: string;
  notes?: string;
}
