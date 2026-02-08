
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MARKETS, SHOPS } from '../constants';
import { Market, Shop, Product, CatalogRoute, ChatMessage, Order } from '../types';
import { geminiService } from '../services/geminiService';

interface CustomerViewProps {
  products: Product[];
  orders: Order[];
  onAddOrder: (order: Order) => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ products, orders, onAddOrder }) => {
  const [route, setRoute] = useState<CatalogRoute>({ type: 'home' });
  const [showNegotiationChat, setShowNegotiationChat] = useState(false);
  const [isOrderComplete, setIsOrderComplete] = useState(false);
  const [negotiationRound, setNegotiationRound] = useState(0); 
  
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    address: '',
    paymentMethod: 'cash' as 'cash' | 'card'
  });

  const [negotiationMessages, setNegotiationMessages] = useState<ChatMessage[]>([]);
  const [assistantMessages, setAssistantMessages] = useState<ChatMessage[]>([]);
  
  const [negotiationHistory, setNegotiationHistory] = useState<{ role: 'user' | 'model', parts: [{ text: string }] }[]>([]);
  const [negotiationInput, setNegotiationInput] = useState('');
  const [assistantInput, setAssistantInput] = useState('');
  
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeNegotiationProduct, setActiveNegotiationProduct] = useState<Product | null>(null);

  const negotiationEndRef = useRef<HTMLDivElement>(null);
  const assistantEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    if (route.type === 'ai-assistant' && assistantMessages.length === 0) {
      setAssistantMessages([{
        id: 'welcome',
        role: 'bot',
        text: "Hi there! I'm your MarketBridge AI assistant. I can help you find products, compare prices, and identify the most reliable shops in Tashkent markets.",
        buttons: ["Cheapest Roses?", "Best Phone deals?", "Wholesale Market shops"]
      }]);
    }
  }, [route]);

  useEffect(() => {
    negotiationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [negotiationMessages, isAiTyping]);

  useEffect(() => {
    assistantEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assistantMessages, isAiTyping]);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites(prev => prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]);
  };

  const handleAssistantQuery = async (query: string) => {
    if (!query.trim()) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: query };
    setAssistantMessages(prev => [...prev, userMsg]);
    setAssistantInput('');
    setIsAiTyping(true);

    const context = `
      Markets: ${MARKETS.map(m => m.name).join(', ')}.
      Current Products: ${products.map(p => `${p.name} (${p.price}) - Shop: ${SHOPS.find(s => s.id === p.shopId)?.name}`).join('; ')}.
    `;
    const systemInstruction = `You are a helpful MarketBridge Assistant. Recommend specific products from the context. Always use the EXACT product name so I can link it. Speak in English. Keep it concise.`;

    try {
      const response = await geminiService.marketChat(query, [], `Context: ${context}\n\n${systemInstruction}`);
      
      // Find a matching product in the text response to create a deep link button
      const matchedProduct = products.find(p => response.toLowerCase().includes(p.name.toLowerCase()));
      
      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'bot', 
        text: response,
        product: matchedProduct,
        type: matchedProduct ? 'product' : 'text'
      };
      
      setAssistantMessages(prev => [...prev, botMsg]);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsAiTyping(false); 
    }
  };

  const handleNegotiationMessage = async () => {
    if (!negotiationInput.trim() || !activeNegotiationProduct) return;
    
    const currentRound = negotiationRound + 1;
    setNegotiationRound(currentRound);

    const userText = negotiationInput;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: userText };
    setNegotiationMessages(prev => [...prev, userMsg]);
    setNegotiationInput('');
    setIsAiTyping(true);
    
    const shop = SHOPS.find(s => s.id === activeNegotiationProduct.shopId);
    const originalPriceNum = parseInt(activeNegotiationProduct.price.replace('$', '').replace(',', ''));
    const minPriceLimit = Math.ceil(originalPriceNum * 0.92); 

    const systemInstruction = `You are the owner of ${shop?.name}. 
    PRODUCT: ${activeNegotiationProduct.name}. PRICE: ${activeNegotiationProduct.price}. 
    MINIMUM PRICE: $${minPriceLimit}.
    
    NEGOTIATION STRATEGY:
    1. Haggle like a real Tashkent market seller. Use English.
    2. If the user's price is close to your limit, ask: "Okay, my final offer is $${minPriceLimit}. Do we have a deal?"
    3. Only when they agree, say the keyword "DEAL" and tell them to fill out the form.`;

    try {
      const response = await geminiService.marketChat(userText, negotiationHistory, systemInstruction);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'bot', text: response };
      setNegotiationMessages(prev => [...prev, botMsg]);
      setNegotiationHistory(prev => [...prev, { role: 'user', parts: [{ text: userText }] }, { role: 'model', parts: [{ text: response }] }]);
      
      if (["deal", "baraka", "congratulations"].some(k => response.toLowerCase().includes(k))) {
        setTimeout(() => {
          setNegotiationMessages(prev => [...prev, { id: 'f'+Date.now(), role: 'bot', text: "Deal! Please fill out the delivery details:", type: 'order-form' }]);
        }, 1500);
      }
    } catch (err) { console.error(err); } finally { setIsAiTyping(false); }
  };

  const submitOrder = () => {
    if (!orderForm.name || !orderForm.phone || !activeNegotiationProduct) return alert("Please fill all fields!");
    setIsOrderComplete(true);
    const finalPriceMatch = negotiationMessages.filter(m => m.role === 'bot').map(m => m.text.match(/\$\d+/)).filter(m => m !== null).pop();
    const finalPrice = finalPriceMatch ? finalPriceMatch[0] : activeNegotiationProduct.price;
    
    const newOrder: Order = {
      id: 'ord-' + Date.now(),
      productId: activeNegotiationProduct.id,
      productName: activeNegotiationProduct.name,
      shopId: activeNegotiationProduct.shopId,
      price: finalPrice,
      customerName: orderForm.name,
      phone: orderForm.phone,
      address: orderForm.address,
      paymentMethod: orderForm.paymentMethod,
      timestamp: Date.now(),
      negotiationHistory: [...negotiationMessages]
    };
    onAddOrder(newOrder);
    setTimeout(() => {
        setShowNegotiationChat(false);
        setIsOrderComplete(false);
        setRoute({type: 'my-offers'});
        setOrderForm({ name: '', phone: '', address: '', paymentMethod: 'cash' });
    }, 1500);
  };

  const openNegotiation = (product: Product) => {
    setActiveNegotiationProduct(product);
    setNegotiationRound(0); 
    setNegotiationMessages([{ id: 'start', role: 'bot', text: `Hello! Interested in the ${product.name}? Listed price is ${product.price}. What is your best offer? 😊` }]);
    setNegotiationHistory([]);
    setShowNegotiationChat(true);
  };

  const renderContent = () => {
    switch (route.type) {
      case 'home':
        return (
          <div className="space-y-12 p-6 md:p-12 animate-fade-up pb-32">
            <header className="max-w-3xl flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 leading-none tracking-tight">Uzbekistan's Top Markets</h2>
                <p className="text-slate-500 text-lg font-medium">Haggle for anything and get the best local prices.</p>
              </div>
              <button 
                onClick={() => setRoute({type: 'ai-assistant'})}
                className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-200 flex items-center gap-3 active:scale-95 transition-all"
              >
                <i className="fas fa-sparkles"></i> AI Assistance
              </button>
            </header>
            
            <div className="relative group max-w-2xl">
              <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-xl"></i>
              <input type="text" placeholder="Search markets or products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white border border-slate-200 rounded-[2rem] py-6 pl-16 pr-8 text-lg shadow-xl shadow-slate-200/20 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {MARKETS.map(market => (
                <div key={market.id} onClick={() => setRoute({ type: 'market', marketId: market.id })} className="relative h-80 rounded-[3rem] overflow-hidden shadow-2xl cursor-pointer group border-[6px] border-white active:scale-95 transition-all">
                  <img src={market.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-10 flex flex-col justify-end">
                    <h3 className="text-white font-black text-3xl mb-2">{market.name}</h3>
                    <span className="text-white/60 text-xs font-black uppercase tracking-widest">{market.totalShops} Shops • {market.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'market':
        const market = MARKETS.find(m => m.id === (route as any).marketId);
        const shops = SHOPS.filter(s => s.marketName === market?.name);
        return (
          <div className="p-6 md:p-12 animate-fade-up">
            <button onClick={() => setRoute({type:'home'})} className="mb-10 w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg"><i className="fas fa-arrow-left"></i></button>
            <h2 className="text-4xl font-black mb-4">{market?.name}</h2>
            <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.2em] mb-12">{market?.location}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {shops.map(shop => (
                <div key={shop.id} onClick={() => setRoute({ type: 'shop', shopId: shop.id })} className="bg-white p-6 rounded-[3rem] flex items-center gap-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                  <img src={shop.logo} className="w-20 h-20 rounded-3xl object-cover shadow-inner" alt="" />
                  <div className="flex-1">
                    <h3 className="font-black text-slate-900 text-xl group-hover:text-blue-600 transition-colors">{shop.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-1">{shop.location}</p>
                    <div className="flex items-center gap-1 text-amber-400 mt-2">
                      <i className="fas fa-star text-[10px]"></i>
                      <span className="text-xs font-black">{shop.rating.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all">
                    <i className="fas fa-chevron-right"></i>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'shop':
        const currentShop = SHOPS.find(s => s.id === (route as any).shopId);
        const shopProds = products.filter(p => p.shopId === currentShop?.id);
        return (
          <div className="pb-32 animate-fade-up">
            <div className="relative h-[400px] md:h-[500px]">
              <img src={currentShop?.coverImage} className="w-full h-full object-cover" alt="" />
              <div className="absolute top-10 left-10 z-10">
                <button onClick={() => setRoute({type:'market', marketId: MARKETS.find(m => m.name === currentShop?.marketName)?.id || ''})} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl"><i className="fas fa-arrow-left"></i></button>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 p-12 flex flex-col justify-end">
                 <h2 className="text-5xl md:text-7xl font-black text-white leading-none mb-4">{currentShop?.name}</h2>
                 <p className="text-white/70 text-sm font-black uppercase tracking-[0.3em]">{currentShop?.location}</p>
              </div>
            </div>
            <div className="p-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
              {shopProds.map(p => (
                <div key={p.id} onClick={() => setRoute({ type: 'product', productId: p.id })} className="bg-white p-5 rounded-[2.5rem] shadow-xl border border-slate-50 relative group cursor-pointer active:scale-95 transition-all">
                  <div className="aspect-square overflow-hidden rounded-[1.8rem] mb-6 shadow-inner">
                    <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                  </div>
                  <h4 className="font-black text-sm text-slate-900 line-clamp-2 mb-2 px-1">{p.name}</h4>
                  <p className="text-blue-600 font-black text-2xl px-1">{p.price}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'product':
        const prod = products.find(p => p.id === (route as any).productId);
        const owner = SHOPS.find(sh => sh.id === prod?.shopId);
        return (
          <div className="pb-48 animate-fade-up h-full overflow-y-auto no-scrollbar md:flex">
            <div className="md:flex-1 h-[500px] md:h-screen sticky top-0">
              <img src={prod?.imageUrl} className="w-full h-full object-cover" alt="" />
              <button onClick={() => setRoute({type:'shop', shopId: prod?.shopId || ''})} className="absolute top-10 left-10 w-14 h-14 bg-white/90 rounded-2xl flex items-center justify-center shadow-2xl"><i className="fas fa-arrow-left"></i></button>
            </div>
            <div className="flex-1 p-10 md:p-24 bg-white md:rounded-l-[5rem] -mt-24 md:mt-0 relative z-20 shadow-[-50px_0_100px_rgba(0,0,0,0.05)]">
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-tight">{prod?.name}</h2>
              <div className="flex items-center gap-8 mb-12">
                <span className="text-slate-900 font-black text-6xl tracking-tighter">{prod?.price}</span>
                <span className="bg-green-100 text-green-700 text-xs font-black px-6 py-3 rounded-full uppercase border border-green-200">Available</span>
              </div>
              <div onClick={() => setRoute({type: 'shop', shopId: owner?.id || ''})} className="bg-slate-50 p-8 rounded-[3rem] mb-12 flex items-center gap-8 border border-slate-100 cursor-pointer group">
                <img src={owner?.logo} className="w-20 h-20 rounded-3xl object-cover" alt="" />
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 text-2xl leading-none">{owner?.name}</h4>
                  <p className="text-xs text-slate-400 font-bold uppercase mt-3 tracking-widest">{owner?.location}</p>
                </div>
                <i className="fas fa-chevron-right text-slate-200 group-hover:text-blue-500 group-hover:translate-x-2 transition-all"></i>
              </div>
              <p className="text-slate-600 text-xl leading-relaxed font-medium mb-16">{prod?.description}</p>
              <div className="fixed md:relative bottom-0 left-0 right-0 p-8 md:p-0 bg-white/95 backdrop-blur-xl md:bg-transparent z-50 flex gap-6">
                <button onClick={() => prod && openNegotiation(prod)} className="flex-1 bg-white border-4 border-slate-900 text-slate-900 h-20 rounded-[2rem] font-black text-sm active:scale-95 transition-all">🤝 HAGGLE</button>
                <button className="flex-[1.5] bg-slate-900 text-white h-20 rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all">BUY NOW</button>
              </div>
            </div>
          </div>
        );
      
      case 'ai-assistant':
        return (
          <div className="flex flex-col h-full bg-slate-50 animate-fade-up max-w-4xl mx-auto border-x border-slate-100 relative">
            <div className="p-8 border-b bg-white/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl">
                  <i className="fas fa-sparkles text-xl"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800">AI Assistant</h3>
              </div>
              <button onClick={() => setRoute({type: 'home'})} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><i className="fas fa-times"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar pb-40">
              {assistantMessages.map(msg => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-4`}>
                  <div className={`max-w-[80%] p-6 rounded-[2.5rem] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-xl' : 'bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-100'}`}>
                    <p className="text-base font-semibold whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    
                    {/* Deep Link to Product Card */}
                    {msg.product && (
                      <div className="mt-6 bg-slate-50 rounded-[1.8rem] p-4 border border-slate-200 shadow-inner flex items-center gap-4 animate-fade-up">
                         <img src={msg.product.imageUrl} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt="" />
                         <div className="flex-1">
                            <h4 className="text-xs font-black text-slate-900 leading-tight">{msg.product.name}</h4>
                            <p className="text-blue-600 font-black text-sm mt-1">{msg.product.price}</p>
                         </div>
                         <button 
                           onClick={() => setRoute({ type: 'product', productId: msg.product!.id })}
                           className="bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm active:scale-95 transition-all"
                         >
                           View
                         </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={assistantEndRef} />
            </div>
            <div className="p-8 bg-white border-t border-slate-100 sticky bottom-0 z-20 shadow-2xl">
              <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-2">
                 {assistantMessages[assistantMessages.length-1]?.buttons?.map(btn => (
                   <button key={btn} onClick={() => handleAssistantQuery(btn)} className="whitespace-nowrap bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">{btn}</button>
                 ))}
              </div>
              <div className="flex gap-4">
                <input type="text" value={assistantInput} onChange={(e) => setAssistantInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAssistantQuery(assistantInput)} placeholder="Ask about flowers, electronics..." className="flex-1 bg-slate-100 rounded-3xl px-8 py-5 text-base font-bold focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                <button onClick={() => handleAssistantQuery(assistantInput)} className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-xl active:scale-90 transition-all"><i className="fas fa-paper-plane text-xl"></i></button>
              </div>
            </div>
          </div>
        );

      case 'my-offers':
        return (
          <div className="p-8 md:p-16 animate-fade-up pb-32 max-w-5xl mx-auto w-full">
            <h2 className="text-5xl font-black mb-12">My Orders</h2>
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-40 opacity-10">
                <i className="fas fa-receipt text-9xl mb-8"></i>
                <p className="font-black uppercase tracking-[0.4em] text-lg">No orders yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {orders.map(order => (
                  <div key={order.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl flex flex-col gap-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600">
                           <i className="fas fa-box-open"></i>
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900">{order.productName}</h4>
                          <p className="text-xs text-slate-400 font-bold mt-2">{SHOPS.find(s=>s.id===order.shopId)?.name}</p>
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-700 text-[10px] font-black px-4 py-2 rounded-full">Completed</span>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                       <span className="text-xs text-slate-400">{new Date(order.timestamp).toLocaleString()}</span>
                       <span className="text-blue-600 font-black text-3xl">{order.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50 md:flex-row relative">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto no-scrollbar relative">
        {renderContent()}
      </div>

      {route.type !== 'ai-assistant' && !showNegotiationChat && (
        <button 
          onClick={() => setRoute({type: 'ai-assistant'})}
          className="fixed bottom-32 right-8 w-20 h-20 bg-blue-600 text-white rounded-[2.5rem] shadow-2xl shadow-blue-300 flex items-center justify-center text-3xl z-40 animate-bounce active:scale-90 transition-all border-[6px] border-white"
        >
          <i className="fas fa-sparkles"></i>
        </button>
      )}
      
      {showNegotiationChat && activeNegotiationProduct && (
        <div className="fixed inset-0 md:relative md:inset-auto md:w-[450px] bg-black/50 md:bg-white z-[150] flex flex-col animate-fade-up md:border-l border-slate-100 shadow-2xl overflow-hidden">
          <div className="bg-white p-8 flex items-center justify-between border-b sticky top-0 z-20">
            <div className="flex items-center gap-5">
              <button onClick={() => setShowNegotiationChat(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-800"><i className="fas fa-times"></i></button>
              <div>
                <h3 className="font-black text-xl leading-none">{SHOPS.find(s=>s.id===activeNegotiationProduct.shopId)?.name}</h3>
                <p className="text-[10px] text-green-500 font-black uppercase mt-2">Seller Online</p>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50 no-scrollbar">
            {negotiationMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
                {msg.type === 'order-form' ? (
                    <div className="w-full bg-white p-10 rounded-[3rem] shadow-2xl border border-blue-100 flex flex-col gap-8 animate-fade-up">
                        <h4 className="font-black text-2xl">It's a Deal! 🎉</h4>
                        <div className="space-y-5">
                            <input type="text" placeholder="Full Name" value={orderForm.name} onChange={e=>setOrderForm({...orderForm, name: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 transition-all" />
                            <input type="tel" placeholder="Phone Number" value={orderForm.phone} onChange={e=>setOrderForm({...orderForm, phone: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 transition-all" />
                            <textarea placeholder="Delivery Address" value={orderForm.address} onChange={e=>setOrderForm({...orderForm, address: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl py-5 px-8 text-sm font-bold focus:ring-4 focus:ring-blue-500/10 transition-all h-32" />
                        </div>
                        <button onClick={submitOrder} className={`w-full ${isOrderComplete ? 'bg-green-500' : 'bg-slate-900'} text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all`}>
                            {isOrderComplete ? "CONFIRMED ✓" : "SUBMIT ORDER"}
                        </button>
                    </div>
                ) : (
                    <div className={`max-w-[85%] p-6 rounded-[2.5rem] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-xl' : 'bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-200'}`}>
                      <p className="text-base font-semibold leading-relaxed">{msg.text}</p>
                    </div>
                )}
              </div>
            ))}
            {isAiTyping && <div className="flex gap-2 p-4 bg-white rounded-2xl w-fit"><span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce [animation-delay:0.2s]"></span><span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce [animation-delay:0.4s]"></span></div>}
            <div ref={negotiationEndRef} />
          </div>

          {!isOrderComplete && negotiationMessages[negotiationMessages.length - 1]?.type !== 'order-form' && (
            <div className="bg-white p-8 border-t flex gap-4 items-center shadow-inner">
                <input 
                  type="text" 
                  value={negotiationInput} 
                  onChange={(e) => setNegotiationInput(e.target.value)} 
                  placeholder="Enter your price..." 
                  className="flex-1 bg-slate-100 border-none rounded-3xl py-5 px-8 text-base font-bold outline-none" 
                  onKeyDown={(e) => e.key === 'Enter' && handleNegotiationMessage()} 
                />
                <button onClick={handleNegotiationMessage} className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-xl active:scale-90 transition-all"><i className="fas fa-paper-plane"></i></button>
            </div>
          )}
        </div>
      )}

      <div className="lg:hidden glass-nav border-t border-slate-100 h-24 flex items-center justify-around px-8 safe-area-bottom z-[100] fixed bottom-0 left-0 right-0 rounded-t-[3.5rem]">
         <button onClick={() => setRoute({type: 'home'})} className={`${route.type === 'home' ? 'text-blue-600' : 'text-slate-300'} flex flex-col items-center gap-1.5 transition-all`}><i className="fas fa-compass text-2xl"></i><span className="text-[8px] font-black uppercase tracking-widest">Markets</span></button>
         <button onClick={() => setRoute({type: 'my-offers'})} className={`${route.type === 'my-offers' ? 'text-blue-600' : 'text-slate-300'} flex flex-col items-center gap-1.5 transition-all`}><i className="fas fa-receipt text-2xl"></i><span className="text-[8px] font-black uppercase tracking-widest">Orders</span></button>
         <button onClick={() => setRoute({type: 'profile'})} className={`${route.type === 'profile' ? 'text-blue-600' : 'text-slate-300'} flex flex-col items-center gap-1.5 transition-all`}><i className="fas fa-user text-2xl"></i><span className="text-[8px] font-black uppercase tracking-widest">Profile</span></button>
      </div>
    </div>
  );
};

export default CustomerView;
