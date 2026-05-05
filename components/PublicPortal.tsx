import React, { useState, useRef } from 'react';
import { UploadIcon, CheckCircleIcon, AlertIcon } from './Icons';

interface PublicPortalProps {
    onGoToLogin: () => void;
}

export const PublicPortal: React.FC<PublicPortalProps> = ({ onGoToLogin }) => {
    const [view, setView] = useState<'landing' | 'upload' | 'success' | 'error'>('landing');
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [jobTitle, setJobTitle] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(selectedFile.type) && !selectedFile.name.toLowerCase().match(/\.(pdf|doc|docx)$/)) {
            alert('عذراً، النظام يقبل ملفات PDF و DOC و DOCX فقط.');
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            alert('حجم الملف يجب أن لا يتجاوز 10 ميجابايت.');
            return;
        }

        setFile(selectedFile);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name || !email || !phone || !jobTitle || !file) {
            alert('يرجى تعبئة جميع الحقول وإرفاق السيرة الذاتية.');
            return;
        }

        setIsUploading(true);
        setErrorMessage('');

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);
            formData.append('phone', phone);
            formData.append('jobTitle', jobTitle);
            formData.append('cv', file);

            // HR Backend URL: Production Cloud Run Endpoint
            const backendUrl = '/api/public-upload-cv';

            const response = await fetch(backendUrl, {
                method: 'POST',
                // Note: Do NOT set Content-Type header manually when using FormData
                body: formData
            });

            if (!response.ok) {
                let errorText = 'حدث خطأ غير متوقع';
                try {
                    const result = await response.json();
                    errorText = result.error || errorText;
                } catch (e) {
                    errorText = await response.text();
                }
                throw new Error(errorText);
            }

            const result = await response.json();
            setView('success');
        } catch (error: any) {
            console.error('Upload failed', error);
            setErrorMessage(error.message || 'حدث خطأ في الاتصال بالخادم.');
            setView('error');
        } finally {
            setIsUploading(false);
        }
    };

    if (view === 'success') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
                <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-xl border border-emerald-100 flex flex-col items-center">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                        <CheckCircleIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4">تم التقديم بنجاح!</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        شكراً لاهتمامك بالانضمام إلى فريق شهم للمقاولات. تم استلام طلبك وسيرتك الذاتية بنجاح. سيتم التواصل معك قريباً.
                    </p>
                    <button 
                        onClick={() => {
                            setView('landing');
                            setName(''); setEmail(''); setPhone(''); setJobTitle(''); setFile(null);
                        }}
                        className="w-full bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        تقديم طلب آخر
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'error') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center" dir="rtl">
                <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-xl border border-red-100 flex flex-col items-center">
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <AlertIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-4">حدث خطأ!</h2>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        عذراً، لم نتمكن من معالجة طلبك: {errorMessage}
                    </p>
                    <button 
                        onClick={() => setView('upload')}
                        className="w-full bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
                    >
                        العودة للمحاولة مرة أخرى
                    </button>
                </div>
            </div>
        );
    }

    if (view === 'upload') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6" dir="rtl">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-black text-slate-900 mb-2 mt-4 tracking-tight">بوابة التوظيف</h1>
                    <p className="text-slate-500">شركة شهم للمقاولات - ارتقِ بمسيرتك المهنية</p>
                </div>

                <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-lg border border-slate-200 relative overflow-hidden">
                    {isUploading && (
                        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <div className="w-12 h-12 border-4 border-[#41b6e6] border-t-transparent rounded-full animate-spin mb-4"></div>
                            <p className="text-[#41b6e6] font-bold text-lg">جاري إرسال الطلب...</p>
                            <p className="text-slate-500 text-sm mt-2">يرجى الانتظار ولا تغلق الصفحة</p>
                        </div>
                    )}
                    
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">البيانات الشخصية</h2>
                    
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل *</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#41b6e6] focus:border-[#41b6e6] outline-none" placeholder="الاسم الرباعي" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني *</label>
                            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#41b6e6] focus:border-[#41b6e6] outline-none" placeholder="example@email.com" dir="ltr" style={{ textAlign: "right" }} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">رقم الجوال *</label>
                            <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#41b6e6] focus:border-[#41b6e6] outline-none" placeholder="05xxxxxxxx" dir="ltr" style={{ textAlign: "right" }} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">المسمى الوظيفي المتقدم عليه *</label>
                            <input type="text" required value={jobTitle} onChange={e => setJobTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#41b6e6] focus:border-[#41b6e6] outline-none" placeholder="مثال: مهندس مدني، محاسب..." />
                        </div>
                    </div>

                    <label className="cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-8 bg-slate-50 hover:bg-[#41b6e6]/10 hover:border-[#41b6e6] transition-all">
                        <div className="text-slate-400 group-hover:text-[#41b6e6] mb-2 transition-colors">
                            <UploadIcon />
                        </div>
                        <span className="text-slate-900 font-bold text-md mb-1 group-hover:text-[#41b6e6]">
                            {file ? file.name : "اضغط هنا لاختيار ملف السيرة الذاتية (PDF, DOCX)"}
                        </span>
                        {!file && <span className="text-slate-500 text-xs">أو قم بسحب وإفلات الملف هنا</span>}
                        <input 
                            type="file" 
                            accept=".pdf,.doc,.docx" 
                            className="hidden" 
                            onChange={handleFile}
                            disabled={isUploading}
                            ref={fileInputRef}
                        />
                    </label>

                    <button 
                        type="submit"
                        className="w-full mt-6 text-white px-8 py-4 rounded-xl font-bold text-lg transition-colors shadow-md flex items-center justify-center gap-2"
                        style={{ backgroundColor: file && name && phone && email && jobTitle ? '#41b6e6' : '#94a3b8' }}
                        disabled={!file || !name || !phone || !email || !jobTitle || isUploading}
                    >
                        إرسال الطلب
                    </button>

                    <button 
                        type="button"
                        onClick={() => setView('landing')}
                        className="w-full mt-4 text-slate-500 font-medium hover:text-slate-700 underline underline-offset-4 text-center"
                        disabled={isUploading}
                    >
                        تراجع
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col text-center" style={{ backgroundColor: '#425563' }} dir="rtl">
            <header className="p-6 border-b border-white/10 flex justify-between items-center" style={{ backgroundColor: '#425563' }}>
                <img src="https://i.postimg.cc/ncjVcLhs/Whats-App-Image-2026-01-21-at-4-14-40-PM.jpg" alt="Shahm Logo" className="h-16 w-auto object-contain rounded-lg" referrerPolicy="no-referrer" />
                <button 
                    onClick={onGoToLogin}
                    className="text-slate-300 hover:text-white font-medium text-sm transition-colors"
                >
                    دخول الموظفين
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent pointer-events-none"></div>
                
                <div className="relative z-10 max-w-3xl">
                    <span className="inline-block py-1.5 px-4 rounded-full bg-white/10 border border-white/20 font-bold mb-6" style={{ color: '#41b6e6' }}>
                        انضم إلى فريق الخبراء
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
                        نبني المستقبل،
                    </h1>
                    <h2 className="text-4xl md:text-6xl font-black mb-8" style={{ color: '#41b6e6' }}>
                        ونستثمر في كفاءتك.
                    </h2>
                    <p className="text-xl mb-12 max-w-2xl mx-auto leading-relaxed" style={{ color: '#c4d1d9' }}>
                        نحن دائماً نبحث عن المواهب الاستثنائية. تقدم بطلبك الآن بخطوة واحدة ودعنا نتعرف على ما يمكنك تقديمه لشركة شهم للمقاولات.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => setView('upload')}
                            className="text-white px-8 py-4 rounded-2xl font-black text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#41b6e6' }}
                        >
                            تقدم الآن <span className="text-2xl">🚀</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
};
