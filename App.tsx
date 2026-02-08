
import React, { useState } from 'react';
import { Order, ChatMessage, Product } from './types';
import CustomerView from './components/CustomerView';
import SellerView from './components/SellerView';
import { PRODUCTS } from './constants';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<'customer' | 'seller' | null>(null);
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  
  const mockChat = (pName: string, pPrice: string, finalPrice: string, cName: string): ChatMessage[] => [
    { id: '1', role: 'bot', text: `Hello! Interested in the ${pName}? Listed price is ${pPrice}. What is your best offer?` },
    { id: '2', role: 'user', text: `Hi, can you do $${parseInt(finalPrice.replace('$','')) - 5}?` },
    { id: '3', role: 'bot', text: `That's a bit low. How about we meet at ${finalPrice}? Deal?` },
    { id: '4', role: 'user', text: `Okay, let's do it. $${finalPrice} is fine.` },
    { id: '5', role: 'bot', text: `Deal! Please fill out the delivery details now.` }
  ];

  const initialOrders: Order[] = [
    {
      id: 'ord-1',
      productId: 'p1',
      productName: PRODUCTS[0]?.name || 'Premium Rice',
      shopId: 's1',
      price: '$45', 
      customerName: 'Alex Tolipov',
      phone: '+998 90 123 45 67',
      address: 'Tashkent, Chilonzor 5',
      paymentMethod: 'cash',
      timestamp: Date.now() - 3600000,
      negotiationHistory: mockChat(PRODUCTS[0]?.name || 'Rice', '$50', '$45', 'Alex')
    }
  ];

  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const addProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  if (!userRole) {
    return (
      <div className="h-screen-safe bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-up">
          <button 
            onClick={() => setUserRole('customer')}
            className="group bg-white p-12 rounded-[3.5rem] shadow-2xl border-4 border-transparent hover:border-blue-500 transition-all flex flex-col items-center text-center gap-6"
          >
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
              <i className="fas fa-shopping-bag"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">I'm a Customer</h2>
              <p className="text-slate-500 font-medium">Browse local markets and haggle for the best deals</p>
            </div>
            <div className="mt-4 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest">
              Enter Catalog
            </div>
          </button>

          <button 
            onClick={() => setUserRole('seller')}
            className="group bg-slate-900 p-12 rounded-[3.5rem] shadow-2xl border-4 border-transparent hover:border-indigo-500 transition-all flex flex-col items-center text-center gap-6"
          >
            <div className="w-24 h-24 bg-indigo-500/20 text-indigo-400 rounded-3xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">
              <i className="fas fa-store"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white mb-2">I'm a Seller</h2>
              <p className="text-slate-400 font-medium">Manage products, inventory and customer negotiations</p>
            </div>
            <div className="mt-4 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest">
              Enter Dashboard
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen-safe bg-slate-50 flex flex-col items-center overflow-hidden">
      <div className="hidden lg:flex fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 flex-col p-8 z-[100] shadow-sm">
         <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-200">
                <i className="fas fa-bridge text-white text-xl"></i>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter">MarketBridge</h1>
         </div>
         <div className="flex flex-col gap-2">
            <button className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm bg-blue-600 text-white shadow-xl">
              <i className={userRole === 'customer' ? 'fas fa-store' : 'fas fa-chart-line'}></i> 
              {userRole === 'customer' ? 'Catalog' : 'Dashboard'}
            </button>
            <button onClick={() => setUserRole(null)} className="flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-sm text-slate-400 hover:bg-slate-50 transition-all mt-4">
              <i className="fas fa-right-from-bracket"></i> Exit
            </button>
         </div>
      </div>
      <div className="w-full lg:pl-72 h-full flex flex-col relative overflow-hidden">
        <nav className="glass-nav sticky top-0 z-[60] border-b border-slate-100 px-6 py-4 lg:hidden flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center"><i className="fas fa-bridge text-white text-xs"></i></div>
            <span className="font-black text-lg tracking-tight">MarketBridge</span>
          </div>
          <button onClick={() => setUserRole(null)} className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500"><i className="fas fa-sign-out-alt"></i></button>
        </nav>
        <main className="flex-1 relative overflow-hidden flex flex-col w-full">
          {userRole === 'customer' ? (
            <CustomerView products={products} orders={orders} onAddOrder={addOrder} />
          ) : (
            <SellerView products={products} onAddProduct={addProduct} orders={orders} />
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
