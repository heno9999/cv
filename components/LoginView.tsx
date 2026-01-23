
import React from 'react';
import { CloudIcon } from './Icons';

interface LoginViewProps {
  onOpenSettings: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onOpenSettings }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white text-center p-6">
      {/* Background Decorative Element */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="ai-voice-orb absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03] blur-[120px]"></div>
      </div>

      <div className="relative z-10 space-y-8 animate-fade-in">
        <div className="space-y-2">
          <p className="text-slate-400 font-black text-sm uppercase tracking-[0.4em] mb-4">نظام تحليل الكفاءات الذكي</p>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-tight mb-2">
            <span className="ai-text-shimmer block mb-4 pb-4">بوابة التوظيف</span>
            <span className="ai-text-shimmer opacity-80 pb-2">شركة شهم للمقاولات</span>
          </h1>
        </div>

        <div className="pt-10 flex flex-col items-center gap-6">
          <button 
            onClick={onOpenSettings}
            className="ai-btn-phosphor px-12 py-5 rounded-[2rem] text-lg font-black shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all flex items-center gap-3"
          >
            <CloudIcon className="w-6 h-6" />
            <span>تسجيل الدخول عبر السحابة</span>
          </button>
          
          <p className="text-slate-400 font-bold text-sm max-w-sm leading-relaxed">
            للوصول إلى لوحة التحكم والخدمات الذكية، يرجى تهيئة إعدادات السحابة (Supabase) الخاصة بالشركة.
          </p>
        </div>
      </div>

      <footer className="absolute bottom-10 opacity-30">
        <p className="text-[10px] font-black tracking-[0.5em] text-slate-400">SHAHM CONTRACTING - SECURE GATEWAY v6.0</p>
      </footer>
    </div>
  );
};
