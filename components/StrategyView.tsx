
import React from 'react';

const StrategyView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12 pb-20 overflow-y-auto h-full no-scrollbar bg-white">
      <section>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-2xl shadow-xl shadow-blue-200">
             <i className="fas fa-lightbulb"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-none">Mahsulot Strategiyasi</h2>
            <p className="text-slate-500 text-sm mt-2">Bozor an'analarini texnologiya bilan birlashtiramiz.</p>
          </div>
        </div>
      </section>

      {/* Problem & Solution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
          <h3 className="text-rose-900 font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-exclamation-triangle"></i> Muammo
          </h3>
          <p className="text-sm text-rose-800 leading-relaxed">Sotuvchilar murakkab tizimlardan qochadi, mahsulotlar tez o'zgaradi va narxlar bozor konyunkturasi asosida kelishiladi.</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
          <h3 className="text-blue-900 font-bold mb-3 flex items-center gap-2">
            <i className="fas fa-check-circle"></i> Yechim
          </h3>
          <p className="text-sm text-blue-800 leading-relaxed">Telegram bot orqali 10 soniyada katalog yaratish, AI yordamida narx tavsiya qilish va veb-katalog orqali xaridorlarga mahsulotni ko'rsatish.</p>
        </div>
      </div>

      {/* Savdolashish mexanikasi */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Savdolashish Tizimi (MVP)</h3>
        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
          <div className="flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 font-bold text-xs">1</div>
              <div>
                <h4 className="font-bold text-slate-900">Deep-Link Muloqot</h4>
                <p className="text-xs text-slate-500 mt-1">Xaridor saytda mahsulotni tanlaydi va botga o'tib avtomatik taklif yuboradi.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 font-bold text-xs">2</div>
              <div>
                <h4 className="font-bold text-slate-900">Sotuvchi Kontroli</h4>
                <p className="text-xs text-slate-500 mt-1">Sotuvchi narxni qabul qiladi, rad etadi yoki o'zining qarshi taklifini yuboradi.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600 font-bold text-xs">3</div>
              <div>
                <h4 className="font-bold text-slate-900">Final va Olib ketish</h4>
                <p className="text-xs text-slate-500 mt-1">Narx kelishilgach, bot rasta manzilini va QR-kodni yuboradi. To'lov — joyida!</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RoadMap Update */}
      <section className="space-y-4">
        <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.2em]">Rivojlanish Rejasi</h3>
        <div className="grid gap-3">
          {[
            { t: 'AI Sifat Kontroli', d: 'Suratdagi kamchiliklarni AI aniqlaydi va yaxshiroq burchakdan suratga olishni maslahat beradi.', i: 'fa-wand-magic-sparkles' },
            { t: 'Rastalar Xaritasi', d: 'Bozor ichida do\'konni oson topish uchun interaktiv xarita.', i: 'fa-map-location-dot' },
            { t: 'Kuryer Integratsiyasi', d: 'Kelishilgan narxga yetkazib berish xizmatini bir tugma bilan qo\'shish.', i: 'fa-truck-fast' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 flex gap-4 items-center shadow-sm hover:border-blue-100 transition-colors cursor-default">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:text-blue-500">
                <i className={`fas ${item.i} text-lg`}></i>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{item.t}</h4>
                <p className="text-[11px] text-slate-400 leading-tight mt-1">{item.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Strategy */}
      <section className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-blue-200">
        <h3 className="text-xl font-black mb-4">Bizning Missiyamiz</h3>
        <p className="text-blue-50 text-sm leading-relaxed opacity-90">
          Biz offline sotuvchilarni onlayn olamga o'tkazishda ularning kundalik odatlarini o'zgartirmaymiz. 
          Biz texnologiyani ularning xizmatiga qo'yamiz, aksincha emas.
        </p>
      </section>
    </div>
  );
};

export default StrategyView;
