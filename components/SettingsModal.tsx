
import React, { useState } from 'react';
import { db } from '../services/db';
import { CloudIcon, CheckCircleIcon, AlertIcon } from './Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const isConnected = db.isCloudEnabled();
  
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  
  if (!isOpen) return null;

  const handleSave = async () => {
    if (!url || !key) {
        alert("يرجى تعبئة جميع الحقول");
        return;
    }

    setIsTesting(true);
    setTestError(null);

    const result = await db.testConnection(url.trim(), key.trim());

    if (result.success) {
        db.saveCredentials(url.trim(), key.trim());
        setIsSaved(true);
    } else {
        setTestError(result.error || "حدث خطأ غير معروف");
        setIsTesting(false);
    }
  };

  const handleDisconnect = () => {
      if (confirm("هل أنت متأكد من قطع الاتصال؟ ستعود للوضع المحلي.")) {
          db.clearCredentials();
      }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fade-in my-8">
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-slate-200">
            <h3 className="text-slate-900 font-bold flex items-center gap-2">
                <CloudIcon className="w-5 h-5 text-amber-500" />
                إعدادات السحابة (Supabase)
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">✕</button>
        </div>

        <div className="p-6">
            {isSaved ? (
                <div className="text-center py-8">
                    <CheckCircleIcon className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                    <h4 className="text-xl font-bold text-slate-900">تم الاتصال والحفظ بنجاح!</h4>
                    <p className="text-slate-500 mt-2">جاري إعادة تحميل التطبيق...</p>
                </div>
            ) : (
                <>
                    {isConnected && (
                        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3">
                            <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                            <span className="text-emerald-700 text-sm font-medium">التطبيق متصل حالياً بالسحابة</span>
                        </div>
                    )}

                    {testError && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 animate-fade-in">
                            <AlertIcon className="w-5 h-5 text-red-500 mt-0.5" />
                            <div className="flex-1">
                                <span className="text-red-600 text-sm font-bold block mb-1">فشل الاتصال:</span>
                                <span className="text-red-500 text-sm">{testError}</span>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4 text-right">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Project URL</label>
                            <input 
                                type="text" 
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://xyz.supabase.co"
                                className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left ltr"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Anon / Public Key</label>
                            <input 
                                type="password" 
                                value={key}
                                onChange={(e) => setKey(e.target.value)}
                                placeholder="Enter your anon/public key"
                                className="w-full px-4 py-2 bg-white border border-slate-300 text-slate-900 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-left ltr"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3 pt-4">
                        <button 
                            onClick={handleSave}
                            disabled={isTesting}
                            className={`flex-1 text-white font-bold py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2
                                ${isTesting ? 'bg-blue-600/50 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}
                            `}
                        >
                            {isTesting ? (
                                <>
                                   <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                   جاري الاتصال...
                                </>
                            ) : (
                                isConnected ? 'تحديث الاتصال' : 'اتصال وحفظ'
                            )}
                        </button>
                        {isConnected && !isTesting && (
                             <button 
                                onClick={handleDisconnect}
                                className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                قطع الاتصال
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
