
import { Market, Shop, Product } from './types';

export const MARKETS: Market[] = [
  {
    id: 'm1',
    name: "Orikzor Market",
    type: 'Wholesale & Retail',
    location: 'Zangiota District',
    totalShops: 500,
    image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'm2',
    name: 'Malika Electronics',
    type: 'Electronics & Gadgets',
    location: 'Labzak, Tashkent',
    totalShops: 250,
    image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'm3',
    name: 'Tashkent Flowers',
    type: 'Flowers & Plants',
    location: 'Shaykhontohur District',
    totalShops: 120,
    image: 'https://images.unsplash.com/photo-1560717789-0ac7c58ac90a?auto=format&fit=crop&w=800&q=80'
  }
];

const shopData: Record<string, { shops: string[], products: string[], images: string[] }> = {
  "Orikzor Market": {
    shops: ["Wholesale Trade Hub", "Food World", "Baraka Food", "Sarbon Market", "National Treasures"],
    products: ["Rice 5kg", "Cooking Oil 5L", "Sugar 10kg"],
    images: ["https://images.unsplash.com/photo-1583258292688-d0213dc5a3a8"]
  },
  "Malika Electronics": {
    shops: ["Apple Premium", "Samsung Plaza", "Xiaomi Official", "Laptop Center", "Smart Gadgets"],
    products: ["iPhone 15 Pro", "Samsung Galaxy S24", "MacBook Air M3"],
    images: ["https://images.unsplash.com/photo-1611186871348-b1ce696e52c9"]
  },
  "Tashkent Flowers": {
    shops: ["Eram Flowers", "Orchid World", "Rose Valley", "Tulip Garden", "Bouquet Art"],
    products: ["Premium Red Roses", "Exotic White Orchids", "Mixed Summer Bouquet", "Potted Violet", "Spring Tulips (15pcs)"],
    images: [
      "https://images.unsplash.com/photo-1560717789-0ac7c58ac90a", // Violets
      "https://images.unsplash.com/photo-1548013146-72479768bada", // Red Roses
      "https://images.unsplash.com/photo-1526047932273-341f2a7631f9", // Fresh Flowers
      "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3", // Gift Bouquet
      "https://images.unsplash.com/photo-1455587734955-081b22074882"  // Tulips
    ]
  }
};

export const SHOPS: Shop[] = [];
export const PRODUCTS: Product[] = [];

let shopIdCounter = 1;
let productIdCounter = 1;

MARKETS.forEach(market => {
  const data = shopData[market.name];
  if (!data) return;

  data.shops.forEach((shopName, shopIndex) => {
    const shopId = `s${shopIdCounter++}`;
    const coverImg = market.name === "Tashkent Flowers" 
      ? data.images[shopIndex % data.images.length] 
      : data.images[0];

    SHOPS.push({
      id: shopId,
      name: shopName,
      marketName: market.name,
      category: market.type,
      rating: 4.2 + (Math.random() * 0.8),
      location: `Row ${shopIndex + 1}, Shop ${shopIndex * 4 + 10}`,
      telegramHandle: `@${shopName.toLowerCase().replace(/\s+/g, '_')}`,
      logo: `${coverImg}?w=100`,
      coverImage: `${coverImg}?w=800`
    });

    data.products.forEach((pName, pIndex) => {
      let priceVal;
      // Adjusted price ranges based on product category for realism
      if (market.name === 'Malika Electronics') {
        priceVal = 200 + Math.floor(Math.random() * 1300);
      } else if (market.name === 'Orikzor Market') {
        priceVal = 5 + Math.floor(Math.random() * 55); // Rice/Oil/Sugar around $5-$60
      } else {
        priceVal = 10 + Math.floor(Math.random() * 90); // Flowers around $10-$100
      }

      const stock = 5 + Math.floor(Math.random() * 50);
      const prodImg = market.name === "Tashkent Flowers" 
        ? `${data.images[(shopIndex + pIndex) % data.images.length]}?w=600`
        : `${data.images[0]}?w=600`;

      PRODUCTS.push({
        id: `p${productIdCounter++}`,
        name: `${pName}`,
        price: `$${priceVal}`,
        minPrice: Math.floor(priceVal * 0.92),
        description: `${pName} - Handpicked and premium quality product direct from the vendor.`,
        imageUrl: prodImg,
        category: market.type,
        shopId: shopId,
        stockStatus: stock < 10 ? 'Low Stock' : 'In Stock',
        stockCount: stock,
        isNegotiable: true
      });
    });
  });
});
