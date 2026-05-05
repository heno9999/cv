
import React, { useState } from 'react';
import { CandidateData, AppView } from '../types';
import { 
    UserIcon, 
    ShieldIcon, 
    BriefcaseIcon, 
    TagIcon, 
    ClockIcon, 
    PrinterIcon, 
    RobotIcon, 
    ScaleIcon, 
    CheckCircleIcon, 
    FileTextIcon, 
    WhatsAppIcon,
    UploadIcon
} from './Icons';
import { generateManagerBrief } from '../services/geminiService';

interface AnalysisViewProps {
  candidate: CandidateData;
  onBack: () => void;
  backLabel?: string;
  onUpdate?: (updated: CandidateData) => void;
  onNavigateToHeadhunter?: (seedQuery: string) => void;
}

const InfoBadge = ({ label, value, icon, variant = "blue", className = "" }: { label: string, value: string | React.ReactNode, icon: any, variant?: "blue" | "emerald" | "amber" | "indigo", className?: string }) => {
    const variants = {
        blue: "bg-blue-50/50 text-blue-700 border-blue-100/30",
        emerald: "bg-emerald-50/50 text-emerald-700 border-emerald-100/30",
        amber: "bg-amber-50/50 text-amber-700 border-amber-100/30",
        indigo: "bg-indigo-50/50 text-indigo-800 border-indigo-100/30"
    };
    return (
        <div className={`px-4 py-3 rounded-xl border ${variants[variant]} flex items-center gap-2 transition-all cursor-default ${className}`}>
            <div className="opacity-60 shrink-0 scale-[0.6]">{icon}</div>
            <div className="flex flex-col text-right flex-1 min-w-0">
                <span className="text-[8px] font-black uppercase tracking-wider opacity-50 leading-none mb-1">{label}</span>
                <div className="text-sm font-black leading-tight break-words">{value}</div>
            </div>
        </div>
    );
};

// Helper to clean numeric strings from old data
const cleanNumber = (val: string | undefined) => {
    if (!val) return '0';
    const match = val.match(/(\d+(\.\d+)?)/);
    return match ? match[0] : '0';
};

const ExperienceSplitBadge = ({ label, total, ksa }: { label: string, total: string, ksa: string }) => (
    <div className="px-4 py-3 rounded-xl border bg-emerald-50/50 text-emerald-700 border-emerald-100/30 flex items-center gap-2 transition-all cursor-default">
        <div className="opacity-60 shrink-0 scale-[0.6]"><ClockIcon /></div>
        <div className="flex flex-col text-right flex-1 min-w-0">
            <span className="text-[8px] font-black uppercase tracking-wider opacity-50 leading-none mb-1">{label}</span>
            <div className="flex items-center gap-3">
                <div className="flex items-end gap-1">
                    <span className="text-sm font-black leading-tight">{cleanNumber(total)}</span>
                    <span className="text-[8px] opacity-70 mb-0.5 font-bold">إجمالي</span>
                </div>
                <div className="w-px h-3 bg-emerald-700/20"></div>
                <div className="flex items-end gap-1">
                    <span className="text-sm font-black leading-tight">{cleanNumber(ksa)}</span>
                    <span className="text-[8px] opacity-70 mb-0.5 font-bold">داخل المملكة</span>
                </div>
            </div>
        </div>
    </div>
);

const ShahmawiGauge = ({ score }: { score: number }) => {
    const getStatusText = (s: number) => {
        if (s >= 76) return "مناسب جداً";
        if (s >= 31) return "مناسب";
        return "غير مناسب";
    };

    const getStatusColor = (s: number) => {
        if (s >= 76) return "bg-emerald-500";
        if (s >= 31) return "bg-amber-500";
        return "bg-red-500";
    };

    return (
        <div className="w-full space-y-2">
            <div className="flex justify-between items-end mb-0.5 px-1">
                <span className="text-[7px] font-black text-slate-400">غير مناسب</span>
                <span className="text-[7px] font-black text-slate-400">مناسب</span>
                <span className="text-[7px] font-black text-slate-400">مناسب جداً</span>
            </div>
            <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden flex border border-slate-200 gauge-bar">
                <div 
                    className={`h-full ${getStatusColor(score)} transition-all duration-1000 ease-out relative shadow-sm gauge-bar`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>
            <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(score)} gauge-bar`}></div>
                <span className="text-[10px] font-black text-slate-800">النتيجة: {getStatusText(score)}</span>
                <span className="text-[9px] font-bold text-slate-400 mr-auto tracking-tighter" dir="ltr">{score}/100</span>
            </div>
        </div>
    );
};

export const AnalysisView: React.FC<AnalysisViewProps> = ({ candidate, onBack, backLabel, onUpdate, onNavigateToHeadhunter }) => {
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const handlePrint = () => {
      const originalTitle = document.title;
      document.title = `تحليل سيرة ذاتية ${candidate.info.fullName}`;
      window.print();
      // Small delay to ensure the print dialog catches the title before reverting
      setTimeout(() => {
          document.title = originalTitle;
      }, 100);
  };

  const handleCopyManagerBrief = async () => {
    setIsGeneratingBrief(true);
    try {
        const brief = await generateManagerBrief(candidate);
        navigator.clipboard.writeText(brief);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 3000);
    } catch (e) {
        alert("فشل توليد الملخص");
    } finally {
        setIsGeneratingBrief(false);
    }
  };

  const handleFindSimilar = () => {
      const query = `أريد مهندسين يشبهون في خبراتهم هذا المرشح: ${candidate.info.fullName}، الذي يعمل كـ ${candidate.info.jobTitle} بخبرة ${candidate.info.experienceYears} ولديه مهارات في ${candidate.analysis.keySkills.join(', ')}. ابحث عن بروفايلات مماثلة في السعودية.`;
      if (onNavigateToHeadhunter) onNavigateToHeadhunter(query);
  };

  return (
    <div id="technical-report" className="space-y-6 max-w-5xl mx-auto pb-16 animate-fade-in relative" dir="rtl">
      <style>{`
        @media print {
            body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            #technical-report { padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; background: white !important; }
            .no-print { display: none !important; }
            .print-header { display: flex !important; margin-bottom: 1rem !important; }
            
            /* Force Grid Layout for Print to fit A4 */
            .print-main-grid { display: grid !important; grid-template-columns: 2fr 1fr !important; gap: 1rem !important; align-items: start !important; }
            .print-col-main { display: flex !important; flex-direction: column !important; gap: 0.75rem !important; margin: 0 !important; }
            .print-col-side { display: flex !important; flex-direction: column !important; gap: 0.75rem !important; margin: 0 !important; }
            .print-inner-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 0.75rem !important; }
            
            /* Compact Cards to save vertical space */
            .hero-mesh { background: #ffffff !important; border: 1px solid #f1f5f9 !important; padding: 1rem !important; border-radius: 0.75rem !important; margin-bottom: 0 !important; box-shadow: none !important; }
            .section-box { break-inside: avoid; border: 1px solid #f1f5f9 !important; padding: 0.75rem !important; border-radius: 0.75rem !important; background: white !important; margin-bottom: 0 !important; }
            .sidebar-box { break-inside: avoid; border: 1px solid #f1f5f9 !important; padding: 0.75rem !important; border-radius: 0.75rem !important; margin-bottom: 0 !important; }
            
            /* Typography Adjustments for Print */
            h1.tool-title { text-align: left !important; width: auto !important; font-size: 1.25rem !important; margin: 0 !important; }
            .print-logo { height: 60px !important; width: auto !important; }
            .candidate-name { text-align: center !important; width: 100% !important; font-size: 1.5rem !important; margin-bottom: 0.25rem !important; }
            .text-blue-600 { color: #2563eb !important; font-size: 1rem !important; margin-bottom: 0.5rem !important; }
            p { font-size: 10px !important; line-height: 1.4 !important; margin: 0 !important; }
            h3 { font-size: 11px !important; margin-bottom: 0.5rem !important; }
            .text-sm { font-size: 11px !important; }
            .text-base { font-size: 12px !important; }
            
            /* Card Grid inside Hero */
            .card-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 0.5rem !important; }
            .card-grid > div { padding: 0.5rem !important; }
            
            .gauge-bar { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            
            @page { size: A4 portrait; margin: 10mm; }
            svg { width: 12px !important; height: 12px !important; }
            
            /* Hide unnecessary spacing */
            .space-y-6 > * + * { margin-top: 0 !important; }
            .mb-8 { margin-bottom: 0.75rem !important; }
            .mt-5 { margin-top: 0.75rem !important; }
            .pb-16 { padding-bottom: 0 !important; }
        }
        .print-header { display: none; }
      `}</style>

      {/* Print Header - Top Right Aligned */}
      <div className="print-header flex justify-between items-center mb-6 w-full border-b border-slate-100 pb-3">
          <img src="https://i.postimg.cc/ncjVcLhs/Whats-App-Image-2026-01-21-at-4-14-40-PM.jpg" alt="Shahm Logo" className="print-logo h-[60px] w-auto object-contain" referrerPolicy="no-referrer" />
          <div className="flex flex-col items-end text-right">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter tool-title">Shahm CV Analyzer</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">محلل السير الذاتية الذكي</p>
          </div>
      </div>

      {/* Screen Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between no-print px-2 pb-4 gap-4">
          <button onClick={onBack} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-colors self-start sm:self-auto">← {backLabel || 'العودة للوحة التحكم'}</button>
          <div className="flex flex-wrap gap-3 justify-end w-full sm:w-auto">
              <div className="flex items-center gap-2">
                  {candidate.cvUrl ? (
                      <button 
                          onClick={() => window.open(candidate.cvUrl, '_blank')}
                          className="bg-amber-50 text-amber-700 px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 border border-amber-100 hover:bg-amber-100 transition-all shadow-sm"
                      >
                          <FileTextIcon className="w-4 h-4" />
                          <span>عرض السيرة الذاتية</span>
                      </button>
                  ) : (
                      <label className="bg-amber-50 cursor-pointer text-amber-700 px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 border border-amber-100 hover:bg-amber-100 transition-all shadow-sm">
                          <UploadIcon className="w-4 h-4" />
                          <span>إرفاق السيرة الذاتية</span>
                          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file && onUpdate) {
                                  const { db } = await import('../services/db');
                                  if (db.isCloudEnabled()) {
                                      const timestamp = new Date().getTime();
                                      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                                      const filename = `${timestamp}_${safeName}`;
                                      const url = await db.uploadCvPdf(file, filename);
                                      if (url) {
                                          const updated = { ...candidate, cvUrl: url };
                                          await db.updateOffer(updated);
                                          onUpdate(updated);
                                          alert('تم رفع السيرة الذاتية بنجاح.');
                                      } else {
                                          alert('حدث خطأ أثناء رفع الملف.');
                                      }
                                  } else {
                                      alert('لا يمكن رفع الملف. التخزين السحابي غير مفعل.');
                                  }
                              }
                          }} />
                      </label>
                  )}
              </div>
              <button 
                onClick={handleFindSimilar}
                className="bg-indigo-50 text-indigo-600 px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm"
              >
                  <RobotIcon className="w-4 h-4" />
                  <span>ابحث عن مرشحين مشابهين</span>
              </button>
              <button 
                  onClick={handleCopyManagerBrief} 
                  disabled={isGeneratingBrief}
                  className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg transition-all ${
                      copyFeedback 
                      ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                  {isGeneratingBrief ? (
                      <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
                  ) : copyFeedback ? (
                      <CheckCircleIcon className="w-4 h-4" />
                  ) : (
                      <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
                  )}
                  <span>{copyFeedback ? 'تم النسخ للمدير' : 'نسخ ملخص للمدير'}</span>
              </button>
              <button onClick={handlePrint} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all">
                  <PrinterIcon className="w-4 h-4" />
                  <span>تصدير التقرير الفني (PDF)</span>
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print-main-grid">
        {/* Main Analysis Column */}
        <div className="lg:col-span-8 space-y-6 print-col-main">
            {/* Hero Card */}
            <div className="hero-mesh p-8 md:p-10 rounded-[2rem] border border-slate-100 bg-white shadow-sm relative overflow-hidden">
                <div className="relative z-10 text-center">
                    <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter candidate-name flex items-center justify-center gap-3">
                        {candidate.info.fullName}
                        {candidate.source === 'portal' && <span className="bg-fuchsia-100 text-fuchsia-700 text-xs px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 border border-fuchsia-200"><UploadIcon className="w-4 h-4" /> عن طريق الـ QR</span>}
                    </h1>
                    <p className="text-blue-600 font-black text-lg mb-8">{candidate.info.jobTitle}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 card-grid">
                        <InfoBadge label="الجنسية" value={candidate.info.nationality} icon={<TagIcon />} />
                        
                        <ExperienceSplitBadge 
                            label="سجل الخبرات"
                            total={candidate.info.experienceYears} 
                            ksa={candidate.info.ksaExperience || '0'} 
                        />
                        
                        <InfoBadge label="المؤهل الدراسي" value={candidate.info.education || '-'} icon={<FileTextIcon />} variant="indigo" />
                        
                        <InfoBadge label="العمر" value={candidate.info.age || '-'} icon={<UserIcon />} variant="amber" />
                    </div>

                    <div className="mt-5">
                         <div className="bg-indigo-50/30 border border-indigo-100/30 p-4 rounded-xl flex items-start gap-3">
                            <div className="p-1.5 bg-indigo-600 rounded-lg text-white shadow-sm shrink-0 scale-[0.6]">
                                <ScaleIcon />
                            </div>
                            <div className="flex flex-col text-right">
                                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 mb-0.5">تحليل الاستقرار الوظيفي</span>
                                <p className="text-indigo-900 font-bold text-[11px] leading-relaxed">
                                    {candidate.info.jobStability}
                                </p>
                            </div>
                         </div>
                    </div>
                </div>
            </div>
            
            {/* Professional Opinion & Major Companies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-inner-grid">
                <div className="section-box bg-white p-6 rounded-[1.25rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-blue-600 rounded-lg text-white shadow-sm scale-[0.6]"><RobotIcon /></div>
                        <h3 className="text-sm font-black text-slate-900">الرأي المهني</h3>
                    </div>
                    <p className="text-slate-600 font-bold leading-relaxed text-[10px] text-justify">{candidate.analysis.professionalOpinion}</p>
                </div>

                <div className="section-box bg-slate-50/30 p-6 rounded-[1.25rem] border border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 bg-slate-800 rounded-lg text-white shadow-sm scale-[0.6]"><BriefcaseIcon /></div>
                        <h3 className="text-sm font-black text-slate-900">الخبرة في الشركات الكبرى</h3>
                    </div>
                    <p className="text-slate-600 font-bold leading-relaxed text-[10px]">
                        {candidate.analysis.majorCompaniesExperience}
                    </p>
                </div>
            </div>

            {/* رأي شهماوي */}
            <div className="section-box bg-white p-6 rounded-[1.25rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-emerald-500 rounded-lg text-white shadow-sm scale-[0.6]"><ShieldIcon /></div>
                    <h3 className="text-sm font-black text-slate-900">رأي شهماوي</h3>
                </div>
                
                <div className="mb-4 p-4 bg-slate-50/30 rounded-xl border border-slate-100">
                    <ShahmawiGauge score={candidate.analysis.fitnessScore || 50} />
                </div>

                <p className="text-slate-600 font-bold leading-relaxed text-[10px] text-justify">
                    {candidate.analysis.fitnessForShahm}
                </p>
            </div>
        </div>
        
        {/* Sidebar Column */}
        <div className="lg:col-span-4 space-y-6 print-col-side">
            {/* Certifications Card */}
            <div className="sidebar-box bg-indigo-950 p-6 rounded-[1.25rem] text-white shadow-sm relative overflow-hidden">
                <h3 className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-5 flex items-center justify-end gap-2">
                    <span>الشهادات والعضويات</span>
                    <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
                </h3>
                <div className="space-y-1.5">
                    {candidate.analysis.certifications?.length > 0 ? (
                        candidate.analysis.certifications.map((cert, i) => (
                            <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5 text-[9px] font-black flex items-start gap-2">
                                <span className="w-1 h-1 bg-emerald-400 rounded-full mt-1.5 shrink-0"></span>
                                <span className="leading-tight">{cert}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-[9px] opacity-30 italic text-center py-2">لا توجد شهادات مرصودة</p>
                    )}
                </div>
            </div>

            {/* Skills */}
            <div className="sidebar-box bg-white p-6 rounded-[1.25rem] border border-slate-100 shadow-sm text-right">
                <h3 className="text-sm font-black text-slate-900 mb-5 flex items-center justify-end gap-2">
                    <span>المهارات الفنية</span>
                    <div className="text-blue-600 scale-[0.6]"><FileTextIcon /></div>
                </h3>
                <div className="flex flex-wrap justify-end gap-1 mb-5">
                    {candidate.analysis.keySkills?.map((skill, i) => (
                        <span key={i} className="px-2 py-1 bg-blue-50/50 text-[8px] font-black rounded text-blue-800 border border-blue-100/50">
                            {skill}
                        </span>
                    ))}
                </div>
                <div className="border-t border-slate-50 pt-5">
                    <h4 className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">أبرز المميزات</h4>
                    <ul className="space-y-2">
                        {candidate.analysis.strengths?.slice(0, 5).map((s, i) => (
                            <li key={i} className="text-[9px] font-bold text-slate-600 flex items-start justify-end gap-2">
                                <span className="leading-tight">{s}</span>
                                <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Contact Card */}
            <div className="sidebar-box bg-slate-900 p-6 rounded-[1.25rem] text-white shadow-sm">
                <div className="space-y-4 text-right">
                    <div>
                        <span className="text-[8px] font-bold text-slate-500 block mb-0.5 uppercase tracking-widest">البريد الإلكتروني</span>
                        <span className="text-[10px] font-black break-all">{candidate.info.email || 'غير متوفر'}</span>
                    </div>
                    <div>
                        <span className="text-[8px] font-bold text-slate-500 block mb-0.5 uppercase tracking-widest">رقم الجوال</span>
                        <span className="text-base font-black tracking-tight" dir="ltr">{candidate.info.phone || 'غير متوفر'}</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Footer Print */}
      <div className="print-header mt-8 border-t border-slate-100 pt-3 flex justify-between items-center w-full">
          <p className="text-[7px] text-slate-300 font-black uppercase tracking-widest">SHAHM CV ANALYZER – SHAHM CONTRACTING</p>
          <p className="text-[7px] text-slate-300 font-black">AI REPORT ENGINE v6.0</p>
      </div>
    </div>
  );
};
