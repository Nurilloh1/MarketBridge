
export interface Product {
  id: string;
  name: string;
  price: string;
  minPrice?: number;
  description: string;
  imageUrl: string;
  category: string;
  shopId: string;
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock';
  stockCount: number;
  isNegotiable: boolean;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  shopId: string;
  price: string; 
  customerName: string;
  phone: string;
  address: string;
  paymentMethod: 'cash' | 'card';
  timestamp: number;
  negotiationHistory?: ChatMessage[]; // Savdolashish chat tarixi
}

export interface Shop {
  id: string;
  name: string;
  marketName: string;
  category: string;
  rating: number;
  location: string;
  telegramHandle: string;
  logo: string;
  coverImage: string;
}

export interface Market {
  id: string;
  name: string;
  type: string;
  location: string;
  totalShops: number;
  image: string;
}

export interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  image?: string;
  buttons?: string[];
  type?: 'text' | 'image' | 'product' | 'order' | 'negotiation' | 'advice' | 'order-form';
  product?: Product;
}

export type CatalogRoute = 
  | { type: 'home' }
  | { type: 'market'; marketId: string }
  | { type: 'shop'; shopId: string }
  | { type: 'product'; productId: string }
  | { type: 'my-offers' }
  | { type: 'favorites' }
  | { type: 'profile' }
  | { type: 'ai-assistant' };
