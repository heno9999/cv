
import React from 'react';
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
    return (
        <div className="min-h-[80vh] flex flex-col animate-fade-in pb-20">
            <div className="py-12 mb-8 text-center relative">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                    منصة شهم <span className="text-blue-600 relative inline-block">الذكية</span>
                </h1>
                <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto leading-relaxed px-4">
                    نظام مركزي مدعوم بالذكاء الاصطناعي لإدارة واستقطاب الكفاءات الهندسية لشركة شهم.
                </p>
                <div className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 bg-white text-slate-600 rounded-full text-xs font-black border border-slate-200 shadow-sm">
                    قاعدة البيانات النشطة: <span className="text-slate-900 font-black">{totalCandidates}</span> مرشح
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
                    <div className="lg:col-span-4">
                        <ServiceCard 
                            title="الرفع الجماعي (Bulk)"
                            description="رفع وتحليل حتى 50 سيرة ذاتية في وقت واحد."
                            icon={<UploadIcon />}
                            onClick={() => onNavigate(AppView.BULK_UPLOAD)}
                            tag="إنتاجية عالية"
                            gradient="from-emerald-600 to-teal-700"
                            isUpload={true}
                        />
                    </div>
                    <div className="lg:col-span-4">
                        <ServiceCard 
                            title="رادار الاستقطاب الذكي"
                            description="اصطياد الكفاءات من الويب بناءً على المشاريع."
                            icon={<RobotIcon className="w-6 h-6" />}
                            onClick={() => onNavigate(AppView.SMART_HEADHUNTER)}
                            tag="Headhunting"
                            gradient="from-blue-600 to-cyan-600"
                        />
                    </div>
                    <div className="lg:col-span-4">
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
    );
};
