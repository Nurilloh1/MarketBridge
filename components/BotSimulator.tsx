
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Product, Order } from '../types';
import { geminiService } from '../services/geminiService';
import { MARKETS, SHOPS, PRODUCTS } from '../constants';

interface BotSimulatorProps {
  mode: 'customer' | 'seller';
  orders?: Order[];
}

const BotSimulator: React.FC<BotSimulatorProps> = ({ mode, orders = [] }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentNegotiationProduct, setCurrentNegotiationProduct] = useState<Product | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Boshlang'ich salomlashish
    const greeting: ChatMessage = mode === 'customer' 
      ? {
          id: '1',
          role: 'bot',
          text: "👋 MarketBridge-ga xush kelibsiz!\n\nMen sizga bozorlardan mahsulot topishda va sotuvchilar bilan eng yaxshi narxni kelishishda yordam beraman.\n\nQidirayotgan mahsulotingiz bormi yoki bozorni tanlaysizmi?",
          buttons: ["🔍 Mahsulot qidirish", "🏢 Bozorlar ro'yxati", "💡 Qanday savdolashish mumkin?"]
        }
      : {
          id: '1',
          role: 'bot',
          text: "🏪 Sotuvchi Boshqaruv Paneli\n\nAssalomu alaykum! MarketBridge orqali savdolarni boshqarishga tayyormisiz? Mahsulot qo'shishingiz yoki mijozlar takliflarini ko'rishingiz mumkin.",
          buttons: ["📸 Yangi mahsulot", "📦 Buyurtmalar", "💰 Takliflar", "📊 Hisobot"]
        };
    setMessages([greeting]);
  }, [mode]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  };

  const handleAction = async (action: string) => {
    if (!action.trim()) return;

    addMessage({ id: Date.now().toString(), role: 'user', text: action });
    setIsTyping(true);

    // AI simulyatsiyasi uchun biroz kechikish
    setTimeout(async () => {
      if (mode === 'customer') {
        if (action === "🏢 Bozorlar ro'yxati") {
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: "Mana hozirda tizimga ulangan bozorlarimiz:",
            buttons: MARKETS.map(m => m.name)
          });
        } else if (action === "🔍 Mahsulot qidirish") {
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: "Qanday mahsulot qidiryapsiz? Nomini yozing, men eng arzonini topib beraman."
          });
        } else if (action === "💡 Qanday savdolashish mumkin?") {
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: "Juda oson! Mahsulotni tanlang va o'z narxingizni yozing. Masalan: '950'. Men sotuvchi nomidan savdolashaman. Agar narx ma'qul bo'lsa, kelishamiz! ✅",
            buttons: ["🔍 Mahsulot qidirish"]
          });
        } else if (MARKETS.some(m => m.name === action)) {
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: `${action} bozoridagi eng mashhur do'konlar:`,
            buttons: SHOPS.filter(s => s.marketName.includes(action)).map(s => `Do'kon: ${s.name}`)
          });
        } else if (action.startsWith("Do'kon: ")) {
          const shopName = action.replace("Do'kon: ", "");
          const shop = SHOPS.find(s => s.name === shopName);
          const shopProducts = PRODUCTS.filter(p => p.shopId === shop?.id);
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: `${shopName} do'konidagi mahsulotlar:\n\n` + 
                  shopProducts.map(p => `• ${p.name} (${p.price})`).join('\n'),
            buttons: shopProducts.map(p => `Ko'rish: ${p.name}`)
          });
        } else if (action.startsWith("Ko'rish: ")) {
          const pName = action.replace("Ko'rish: ", "");
          const product = PRODUCTS.find(p => p.name === pName);
          if (product) {
            setCurrentNegotiationProduct(product);
            addMessage({
              id: Date.now().toString(),
              role: 'bot',
              text: `Ajoyib tanlov! ${product.name} narxi ${product.price}. Siz qancha berasiz? (Narxni yozing, masalan: 980)`,
              product: product
            });
          }
        } else if (/^\d+$/.test(action.replace('$', '').trim())) {
          const offer = parseInt(action.replace('$', '').trim());
          if (currentNegotiationProduct) {
            const aiReply = await geminiService.negotiateOffer(
              currentNegotiationProduct.name,
              currentNegotiationProduct.price,
              currentNegotiationProduct.minPrice || 0,
              offer
            );
            addMessage({
              id: Date.now().toString(),
              role: 'bot',
              text: aiReply || "Sotuvchi o'ylab ko'rmoqda..."
            });
          }
        } else {
          const aiReply = await geminiService.marketChat(
            action, 
            [], 
            "Siz o'zbek bozoridagi samimiy va tajribali bozor yordamchisi (MarketBridge AI) botisiz. Foydalanuvchilarga bozorlar, do'konlar va mahsulotlar haqida o'zbek tilida ma'lumot bering."
          );
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: aiReply || "Tushunmadim, qaytadan yozing."
          });
        }
      } else {
        // Seller mode logic
        if (action === "📦 Buyurtmalar") {
          if (orders.length === 0) {
            addMessage({
              id: Date.now().toString(),
              role: 'bot',
              text: "Hozircha yangi buyurtmalar yo'q. Katalogingizni ijtimoiy tarmoqlarda ulashing! 📈"
            });
          } else {
            const ordersText = orders.map((o, idx) => 
                `${idx + 1}. 📦 ${o.productName}\n👤 Mijoz: ${o.customerName}\n📞 Tel: ${o.phone}\n📍 Manzil: ${o.address}\n💰 Narx: ${o.price}\n💳 To'lov: ${o.paymentMethod === 'cash' ? 'Naqd' : 'Karta'}`
            ).join('\n\n');
            addMessage({
              id: Date.now().toString(),
              role: 'bot',
              text: `🔔 Yangi buyurtmalar keldi!\n\n${ordersText}\n\nBuyurtmalar bilan tanishib chiqib, mijozlarga qo'ng'iroq qiling. ✅`
            });
          }
        } else if (action === "💰 Takliflar") {
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: "🔔 Yangi taklif keldi!\n\nMahsulot: iPhone 15 Pro Max\nXaridor taklifi: $1,020\n\nNima deb javob beramiz?",
            buttons: ["✅ Qabul qilish", "💬 Qarshi taklif", "❌ Rad etish"]
          });
        } else if (action === "📊 Hisobot") {
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: `📈 Bugungi natijalar:\n• Do'konga kirishlar: 245\n• Yangi buyurtmalar: ${orders.length}\n• Savdo: ${orders.length} mahsulot\n\nBugun savdongiz barakali bo'lyapti! ✨`
          });
        } else if (action === "📸 Yangi mahsulot") {
            addMessage({
                id: Date.now().toString(),
                role: 'bot',
                text: "Yangi mahsulotni qo'shish uchun uning suratini yuboring. AI uni avtomatik tahlil qilib katalogingizga qo'shadi."
            });
        } else {
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: "Tushunarli. Yana nima yordam bera olaman?",
            buttons: ["📸 Yangi mahsulot", "📦 Buyurtmalar", "💰 Takliflar", "📊 Hisobot"]
          });
        }
      }
      setIsTyping(false);
    }, 800);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result?.toString().split(',')[1];
      if (base64) {
        addMessage({ 
          id: Date.now().toString(), 
          role: 'user', 
          text: "Mahsulot surati yuborildi", 
          image: event.target?.result?.toString() 
        });
        setIsTyping(true);
        try {
          const aiResult = await geminiService.describeProduct(base64);
          addMessage({
            id: Date.now().toString(),
            role: 'bot',
            text: `🤖 AI mahsulotni aniqladi:\n\n🏷️ Nomi: ${aiResult.name}\n💰 Tavsiya etilgan narx: ${aiResult.estimatedPrice}\n📝 Tavsif: ${aiResult.description}\n\nKatalogga qo'shamizmi?`,
            buttons: ["✅ Tasdiqlash", "✏️ Tahrirlash"]
          });
        } catch (err) {
          addMessage({ id: 'err', role: 'bot', text: "Afsuski, suratni tahlil qilib bo'lmadi. Iltimos, qaytadan urinib ko'ring." });
        } finally {
          setIsTyping(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] overflow-hidden">
      {/* Simulation Header */}
      <div className="bg-white p-4 flex items-center gap-3 border-b border-slate-100 shadow-sm z-10 flex-shrink-0">
        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
          <i className="fas fa-headset text-lg"></i>
        </div>
        <div>
          <h3 className="font-black text-slate-800 text-sm leading-none">MarketBridge {mode === 'seller' ? 'Sotuvchi' : 'Yordamchi'}</h3>
          <p className="text-[10px] text-green-500 font-bold flex items-center gap-1.5 mt-1.5">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> onlayn muloqot
          </p>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar bg-[#eef1f4]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100' 
                : 'bg-white text-slate-800 rounded-tl-none border border-white'
            }`}>
              {msg.image && <img src={msg.image} className="w-full h-48 object-cover rounded-xl mb-3 shadow-inner" alt="Product" />}
              <div className="text-[14px] font-medium leading-relaxed whitespace-pre-wrap">{msg.text}</div>
              <div className={`text-[9px] mt-2 text-right font-bold ${msg.role === 'user' ? 'text-white/60' : 'text-slate-300'}`}>
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-up">
            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm flex gap-1.5">
              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 bg-blue-300 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      {/* Input & Quick Actions Area */}
      <div className="p-4 bg-white border-t border-slate-100 flex-shrink-0 safe-area-bottom">
        <div className="grid grid-cols-2 gap-2 mb-4">
          {messages[messages.length - 1]?.buttons?.map((btn) => (
            <button
              key={btn}
              onClick={() => handleAction(btn)}
              className="bg-slate-50 hover:bg-blue-600 hover:text-white text-slate-600 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-wider border border-slate-200/50 transition-all active:scale-95 shadow-sm"
            >
              {btn}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3 bg-slate-100 rounded-[1.5rem] px-4 py-1.5 border border-slate-200/50 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <button onClick={() => fileInputRef.current?.click()} className="w-10 h-10 rounded-full text-slate-400 hover:text-blue-600 hover:bg-white transition-all">
            <i className="fas fa-camera text-lg"></i>
          </button>
          <input 
            type="text" 
            placeholder="Xabaringiz..." 
            className="flex-1 bg-transparent py-3 text-sm font-bold focus:outline-none text-slate-800"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.currentTarget.value) {
                handleAction(e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <button 
            onClick={(e) => {
              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
              if (input.value) {
                handleAction(input.value);
                input.value = '';
              }
            }}
            className="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 flex items-center justify-center active:scale-90 transition-all"
          >
            <i className="fas fa-paper-plane text-xs"></i>
          </button>
        </div>
      </div>
      
      <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
    </div>
  );
};

export default BotSimulator;
