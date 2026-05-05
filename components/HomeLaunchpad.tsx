
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { AppView } from '../types';
import { 
    UploadIcon, 
    ChartIcon, 
    UserIcon, 
    EyeIcon,
    BriefcaseIcon,
    BrainIcon,
    DNAIcon,
    RobotIcon
} from './Icons';

interface HomeLaunchpadProps {
    onNavigate: (view: AppView) => void;
    totalCandidates: number;
}

const ServiceCard = ({ 
    title, 
    description, 
    icon, 
    onClick, 
    tag,
    gradient,
    isUpload = false
}: { 
    title: string, 
    description: string, 
    icon: React.ReactNode, 
    onClick: () => void, 
    tag: string,
    gradient: string,
    isUpload?: boolean
}) => (
    <button 
        onClick={onClick}
        className="group relative flex flex-col items-start text-right bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden h-full w-full"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`}></div>
        <div className="flex justify-between items-start w-full mb-6 relative z-10">
            <div className={`p-4 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-300 flex items-center justify-center w-14 h-14`}>
                {isUpload ? (
                    <div className="transform scale-50 brightness-0 invert translate-y-[1px]">
                        {icon}
                    </div>
                ) : (
                    icon
                )}
            </div>
            <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                {tag}
            </span>
        </div>
        <div className="relative z-10 mt-auto w-full">
            <h3 className="text-xl font-black text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                {title}
            </h3>
            <p className="text-[11px] font-bold text-slate-400 leading-relaxed pl-4">
                {description}
            </p>
        </div>
        <div className="absolute bottom-8 left-8 text-slate-200 group-hover:text-blue-600 group-hover:-translate-x-2 transition-all duration-300">
             <svg className="w-6 h-6 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
        </div>
    </button>
);

export const HomeLaunchpad: React.FC<HomeLaunchpadProps> = ({ onNavigate, totalCandidates }) => {
    const [showQR, setShowQR] = useState(false);
    const [portalUrl, setPortalUrl] = useState('');

    useEffect(() => {
        setPortalUrl('https://shahm-cv-analyzer-64289455018.us-west1.run.app/apply');
    }, []);

    const handlePrintQR = () => {
        window.print();
    };

    return (
        <div className="min-h-[80vh] flex flex-col animate-fade-in pb-20 relative">
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .qr-print-container, .qr-print-container * {
                        visibility: visible;
                    }
                    .qr-print-container {
                        position: absolute;
                        left: 50%;
                        top: 50%;
                        transform: translate(-50%, -50%);
                        width: 100%;
                        text-align: center;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>

            {showQR && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative flex flex-col items-center">
                        <button 
                            onClick={() => setShowQR(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 no-print"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        
                        <div className="qr-print-container flex flex-col items-center justify-center w-full bg-white p-6 rounded-2xl">
                            <h2 className="text-3xl font-black text-slate-900 mb-2">بوابة التوظيف</h2>
                            <p className="text-slate-500 mb-8 font-bold">شهم للمقاولات</p>
                            
                            <div className="bg-white p-4 rounded-xl border-4 border-slate-100 shadow-sm mb-6 inline-block">
                                <QRCode value={portalUrl} size={200} level="H" />
                            </div>
                            
                            <p className="text-sm font-bold text-slate-600 mt-4 leading-relaxed max-w-[200px] text-center">
                                امسح الرمز لرفع سيرتك الذاتية والتقديم مباشرة
                            </p>
                        </div>

                        <button 
                            onClick={handlePrintQR}
                            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors no-print flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            طباعة للمكتب
                        </button>
                    </div>
                </div>
            )}

            {/* Full Screen Background Image for Home Only */}
            <div 
                className="fixed top-[150px] inset-x-0 bottom-0 pointer-events-none z-0"
                style={{ 
                    backgroundImage: "url('https://i.postimg.cc/bwb1M6qW/Gemini-Generated-Image-pdwfc0pdwfc0pdwf.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center -180px',
                    backgroundRepeat: 'no-repeat',
                    opacity: 0.20
                }}
            />
            
            <div className="relative z-10 w-full flex flex-col">
                <div className="py-12 mb-8 text-center relative">
                <div className="mb-6 flex flex-col items-center justify-center">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900" dir="ltr">
                        SHAHM <span className="text-blue-600">AI</span>
                    </h2>
                    <span className="text-xs md:text-sm text-slate-500 font-medium tracking-widest uppercase mt-1">
                        Human Resources Intelligence
                    </span>
                </div>
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                    منصة شهم <span className="text-blue-600 relative inline-block">الذكية</span>
                </h1>
                <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto leading-relaxed px-4">
                    نظام مركزي مدعوم بالذكاء الاصطناعي لإدارة واستقطاب الكفاءات الهندسية لشركة شهم.
                </p>
                <div className="mt-8 flex items-center justify-center gap-4 flex-wrap">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-white text-slate-600 rounded-full text-xs font-black border border-slate-200 shadow-sm">
                        قاعدة البيانات النشطة: <span className="text-slate-900 font-black">{totalCandidates}</span> مرشح
                    </div>
                    <button 
                        onClick={() => setShowQR(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-full text-xs font-black hover:bg-slate-800 transition-colors shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                        رمز QR للاستقبال
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-6 w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-8">
                        <ServiceCard 
                            title="إدارة العروض (Dashboard)"
                            description="لوحة التحكم المركزية. فرز وتصفية ومقارنة المرشحين."
                            icon={<ChartIcon className="w-6 h-6" />}
                            onClick={() => onNavigate(AppView.DASHBOARD)}
                            tag="النظام الأساسي"
                            gradient="from-slate-700 to-slate-900"
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <ServiceCard 
                            title="تحليل سيرة واحدة"
                            description="استخلاص البيانات والمهارات فوراً من ملف PDF واحد."
                            icon={<UploadIcon />}
                            onClick={() => onNavigate(AppView.UPLOAD)}
                            tag="إدخال سريع"
                            gradient="from-blue-500 to-indigo-600"
                            isUpload={true}
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <ServiceCard 
                            title="رادار الاستقطاب الذكي"
                            description="اصطياد الكفاءات من الويب بناءً على المشاريع."
                            icon={<RobotIcon className="w-6 h-6" />}
                            onClick={() => onNavigate(AppView.SMART_HEADHUNTER)}
                            tag="Headhunting"
                            gradient="from-blue-600 to-cyan-600"
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <ServiceCard 
                            title="Project DNA Matcher"
                            description="تشكيل فريق العمل الأمثل لكل مشروع."
                            icon={<DNAIcon className="w-6 h-6" />}
                            onClick={() => onNavigate(AppView.PROJECT_DNA)}
                            tag="تشكيل فرق"
                            gradient="from-emerald-500 to-teal-600"
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <ServiceCard 
                            title="كاشف المصداقية"
                            description="التدقيق الجنائي للسير الذاتية وكشف المبالغات."
                            icon={<EyeIcon className="w-6 h-6" />}
                            onClick={() => onNavigate(AppView.TRUTH_LENS)}
                            tag="تدقيق"
                            gradient="from-amber-500 to-orange-600"
                        />
                    </div>
                    <div className="lg:col-span-6">
                        <ServiceCard 
                            title="شهماوي وظِّف لي"
                            description="توليد أسئلة المقابلات وجلسات التقييم الفني للمرشحين."
                            icon={<UserIcon className="w-6 h-6" />}
                            onClick={() => onNavigate(AppView.HIRE_FOR_ME)}
                            tag="HR Copilot"
                            gradient="from-violet-500 to-purple-600"
                        />
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
};
