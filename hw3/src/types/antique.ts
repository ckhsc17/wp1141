export interface AntiqueItem {
  id: number;
  name: string;
  price: number;
  description: string;
  collected_at: string;
  origin: string;
  era: string;
  material: string;
  size: string;
  history: string;
  iframe: string;
  originalId?: number; // 用於 Collection 中的原始 ID 追蹤
}