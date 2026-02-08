
import React, { useState, useMemo, useRef } from 'react';
import { SHOPS } from '../constants';
import { Order, Product, ChatMessage } from '../types';
import { geminiService } from '../services/geminiService';

interface SellerViewProps {
  products: Product[];
  orders: Order[];
  onAddProduct: (product: Product) => void;
}

const SellerView: React.FC<SellerViewProps> = ({ products, orders, onAddProduct }) => {
  const myShop = SHOPS[0];
  const myProducts = products.filter(p => p.shopId === myShop.id);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
    stockCount: '20'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const dailyOrders = orders.filter(o => o.timestamp >= startOfDay);
    const dailyRevenue = dailyOrders.reduce((sum, o) => sum + parseInt(o.price.replace('$', '')), 0);

    const monthlyOrders = orders.filter(o => o.timestamp >= startOfMonth);
    const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + parseInt(o.price.replace('$', '')), 0);

    return { 
      dailyRevenue, 
      monthlyRevenue, 
      totalOrders: orders.length,
      dailyCount: dailyOrders.length 
    };
  }, [orders]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (base64) {
        try {
          const result = await geminiService.describeProduct(base64);
          setNewProductForm({
            name: result.name || '',
            price: result.estimatedPrice || '',
            category: result.category || '',
            description: result.description || '',
            imageUrl: e.target?.result?.toString() || newProductForm.imageUrl,
            stockCount: '20'
          });
          setIsAddModalOpen(true);
        } catch (err) { alert("AI Analysis failed"); } finally { setIsProcessing(false); }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddProductSubmit = () => {
    if (!newProductForm.name || !newProductForm.price) return alert("Name and price are required!");
    
    const priceNum = parseInt(newProductForm.price.replace('$', ''));
    const newProduct: Product = {
      id: 'p-' + Date.now(),
      name: newProductForm.name,
      price: newProductForm.price.startsWith('$') ? newProductForm.price : `$${newProductForm.price}`,
      minPrice: Math.floor(priceNum * 0.92),
      description: newProductForm.description,
      imageUrl: newProductForm.imageUrl,
      category: newProductForm.category,
      shopId: myShop.id,
      stockStatus: parseInt(newProductForm.stockCount) < 10 ? 'Low Stock' : 'In Stock',
      stockCount: parseInt(newProductForm.stockCount),
      isNegotiable: true
    };

    onAddProduct(newProduct);
    setIsAddModalOpen(false);
    setNewProductForm({
      name: '', price: '', category: '', description: '', 
      imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      stockCount: '20'
    });
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar bg-slate-50 p-6 md:p-12 space-y-10 pb-32 relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900">{myShop.name}</h2>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            <i className="fas fa-location-dot mr-1 text-blue-500"></i> {myShop.location} • {myShop.marketName}
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => fileInputRef.current?.click()} 
            className="flex-1 md:flex-none bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 hover:border-blue-500 hover:text-blue-500"
          >
            {isProcessing ? <i className="fas fa-circle-notch animate-spin"></i> : <i className="fas fa-camera"></i>}
            AI Scanner
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <i className="fas fa-plus"></i> Add Product
          </button>
          <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-2">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Revenue</span>
           <span className="text-4xl font-black text-slate-900">${stats.dailyRevenue}</span>
           <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold">
              <i className="fas fa-check-circle"></i> {stats.dailyCount} sales completed
           </div>
        </div>
        
        <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white flex flex-col gap-2">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Revenue</span>
           <span className="text-4xl font-black">${stats.monthlyRevenue}</span>
           <div className="mt-4 flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-widest">Current Month</div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-2">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Sales</span>
           <span className="text-4xl font-black text-slate-900">{stats.totalOrders}</span>
           <div className="mt-4 flex items-center gap-2 text-blue-500 text-xs font-bold">
              <i className="fas fa-handshake"></i> AI Haggling Active
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8 px-2">
             <h3 className="text-2xl font-black">Inventory</h3>
             <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1.5 rounded-full uppercase">{myProducts.length} Products</span>
          </div>
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-slate-50">
                <th className="pb-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Product</th>
                <th className="pb-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Price</th>
                <th className="pb-6 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Stock</th>
              </tr>
            </thead>
            <tbody>
              {myProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-5 flex items-center gap-4">
                    <img src={p.imageUrl} className="w-10 h-10 rounded-xl object-cover shadow-inner" />
                    <span className="font-bold text-slate-700 text-sm">{p.name}</span>
                  </td>
                  <td className="py-5 font-black text-slate-900 text-center text-sm">{p.price}</td>
                  <td className="py-5 text-right">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase ${p.stockCount < 10 ? 'bg-rose-50 text-rose-500' : 'bg-green-50 text-green-500'}`}>
                      {p.stockCount} units
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8 px-2">
            <h3 className="text-2xl font-black">Negotiation History</h3>
            <span className="text-[10px] font-black text-green-500 bg-green-50 px-3 py-1.5 rounded-full uppercase">Recent Deals</span>
          </div>
          <div className="space-y-4">
            {orders.slice(0, 10).map(order => (
              <div key={order.id} onClick={() => setSelectedOrder(order)} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-500 hover:bg-white transition-all cursor-pointer group">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
                      <i className="fas fa-handshake"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{order.productName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Customer: {order.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-blue-600">{order.price}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 group-hover:text-blue-500">View Details <i className="fas fa-arrow-right ml-1"></i></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-up">
           <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-8 border-b bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">Order Details</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-3 tracking-widest">ID: {selectedOrder.id}</p>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm active:scale-90 transition-all">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer Name</p>
                    <p className="text-xl font-bold text-slate-800">{selectedOrder.customerName}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phone Number</p>
                    <p className="text-xl font-bold text-blue-600">{selectedOrder.phone}</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Delivery Address</p>
                    <p className="text-lg font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">{selectedOrder.address}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Agreed Price</p>
                    <p className="text-3xl font-black text-slate-900">{selectedOrder.price}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payment Method</p>
                    <p className="text-lg font-bold text-slate-800 uppercase flex items-center gap-2">
                      <i className={`fas ${selectedOrder.paymentMethod === 'cash' ? 'fa-money-bill-wave text-green-500' : 'fa-credit-card text-blue-500'}`}></i>
                      {selectedOrder.paymentMethod}
                    </p>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-50 flex gap-4">
                  <a href={`tel:${selectedOrder.phone}`} className="flex-1 bg-slate-900 text-white h-16 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <i className="fas fa-phone"></i> Call Customer
                  </a>
                  <button onClick={() => setSelectedOrder(null)} className="flex-1 bg-slate-100 text-slate-500 h-16 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                    Done
                  </button>
                </div>
              </div>
           </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-8 border-b flex items-center justify-between">
                <h3 className="text-2xl font-black">Add New Product</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="flex justify-center">
                  <div className="w-40 h-40 rounded-[2rem] overflow-hidden shadow-inner border-4 border-slate-50">
                    <img src={newProductForm.imageUrl} className="w-full h-full object-cover" />
                  </div>
                </div>
                <input type="text" value={newProductForm.name} onChange={e=>setNewProductForm({...newProductForm, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm font-bold" placeholder="Product Name (e.g., Red Roses)" />
                <input type="text" value={newProductForm.price} onChange={e=>setNewProductForm({...newProductForm, price: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm font-bold" placeholder="Price (e.g., 500)" />
                <textarea value={newProductForm.description} onChange={e=>setNewProductForm({...newProductForm, description: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm font-bold h-32" placeholder="Catchy description..." />
              </div>
              <div className="p-8 border-t flex gap-4">
                 <button onClick={() => setIsAddModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-5 rounded-2xl font-black text-xs uppercase">Cancel</button>
                 <button onClick={handleAddProductSubmit} className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase shadow-xl">List to Catalog</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SellerView;
