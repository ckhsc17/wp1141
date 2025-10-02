import { AntiqueItem } from './antique';

export interface CartItem extends AntiqueItem {
  quantity: number;
}

export interface PurchaseItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface PurchaseRecord {
  id: number;
  date: string;
  items: PurchaseItem[];
  total: number;
}