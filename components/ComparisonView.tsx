
import React from 'react';
import { CandidateData } from '../types';
import { 
    ShieldIcon, 
    ClockIcon, 
    PrinterIcon, 
    ScaleIcon,
    BriefcaseIcon,
    CheckCircleIcon,
    TagIcon,
    UserIcon,
    RobotIcon,
    FileTextIcon
} from './Icons';

interface ComparisonViewProps {
  candidates: CandidateData[];
  onBack: () => void;
}

const ShahmawiGaugeSmall = ({ score }: { score: number }) => {
    const getStatusColor = (s: number) => {
        if (s >= 76) return "bg-emerald-500";
        if (s >= 31) return "bg-amber-500";
        return "bg-red-500";
    };

    return (
        <div className="w-full space-y-1">
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 gauge-bar">
                <div 
                    className={`h-full ${getStatusColor(score)} transition-all gauge-bar`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>
            <div className="flex justify-between items-center px-1">
              <span className="text-[7px] font-black text-slate-400">0</span>
              <span className="text-[8px] font-black text-slate-900">{score}%</span>
              <span className="text-[7px] font-black text-slate-400">100</span>
            </div>
        </div>
    );
};

export const ComparisonView: React.FC<ComparisonViewProps> = ({ candidates, onBack }) => {
  const handlePrint = () => window.print();

  return (
    <div id="comparison-report" className="space-y-6 animate-fade-in pb-16" dir="rtl">
      <style>{`
        @media print {
            body { visibility: hidden; background: white !important; }
            #comparison-report, #comparison-report * { visibility: visible; }
            #comparison-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; background: white !important; color: black !important; }
            .no-print { display: none !important; }
            .print-header { display: flex !important; }
            table { width: 100% !important; border-collapse: collapse !important; border: 1px solid #e2e8f0 !important; }
            th, td { border: 1px solid #e2e8f0 !important; padding: 12px !important; color: black !important; background: white !important; font-size: 10px !important; }
            .gauge-bar { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            @page { size: A4 landscape; margin: 10mm; }
        }
        .print-header { display: none; }
      `}</style>

      {/* Print Header */}
      <div className="print-header flex flex-col items-start mb-6 text-right w-full">
          <div className="w-full flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex flex-col items-start">
                  <h1 className="text-2xl font-black text-blue-600 tracking-tight">Shahm CV Analyzer</h1>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">تقرير مقارنة المرشحين الذكي</p>
              </div>
              <div className="text-left">
                  <p className="text-[8px] text-slate-300 font-black">SHAHM CONTRACTING CO.</p>
                  <p className="text-[8px] text-slate-300 font-black">AI ENGINE v6.0</p>
              </div>
          </div>
      </div>

      <div className="flex items-center justify-between no-print px-4 md:px-0">
          <button onClick={onBack} className="text-slate-400 hover:text-blue-600 flex items-center gap-2 font-black text-[10px] tracking-widest uppercase transition-colors">
            ← الرجوع إلى لوحة التحكم
          </button>
          <div className="flex items-center gap-4">
              <span className="text-[10px] text-slate-400 font-black tracking-widest uppercase">مقارنة {candidates.length} مرشحين (تخصص: {candidates[0]?.info.specialty})</span>
              <button onClick={handlePrint} className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all font-black text-xs">
                <PrinterIcon className="w-4 h-4" />
                <span>تصدير تقرير المقارنة (PDF)</span>
              </button>
          </div>
      </div>

      <div className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="bg-slate-50/50 p-8 border-b border-slate-100 no-print">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-600 rounded-xl shadow-lg">
                      <ScaleIcon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                      <h1 className="text-2xl font-black text-slate-900">تقرير مقارنة الكفاءات</h1>
                      <p className="text-indigo-600 text-[10px] font-bold mt-1 tracking-wider uppercase">SHAHM AI - Talent Benchmarking Report</p>
                  </div>
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                  <thead>
                      <tr className="bg-slate-50/30 border-b border-slate-100">
                          <th className="p-6 w-48 text-slate-400 font-black uppercase text-[9px] tracking-widest">المعيار التقني</th>
                          {candidates.map(candidate => (
                              <th key={candidate.id} className="p-6 min-w-[240px] border-r border-slate-100">
                                  <div className="text-slate-900 text-base font-black tracking-tight">{candidate.info.fullName}</div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-blue-600 mt-1.5 font-black">
                                      <BriefcaseIcon className="w-3.5 h-3.5 scale-75" />
                                      <span>{candidate.info.jobTitle}</span>
                                  </div>
                              </th>
                          ))}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      <tr>
                          <td className="p-6 font-black text-slate-800 bg-slate-50/10">
                              <div className="flex items-center gap-2">
                                  <TagIcon className="w-4 h-4 text-slate-400 scale-75" />
                                  <span className="text-[11px]">البيانات الأساسية</span>
                              </div>
                          </td>
                          {candidates.map(candidate => (
                              <td key={candidate.id} className="p-6 border-r border-slate-100">
                                  <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-slate-400 font-bold">الجنسية:</span>
                                      <span className="font-black">{candidate.info.nationality}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-slate-400 font-bold">العمر:</span>
                                      <span className="font-black">{candidate.info.age || '-'}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-slate-400 font-bold">المؤهل:</span>
                                      <span className="font-black leading-tight text-right">{candidate.info.education || '-'}</span>
                                    </div>
                                  </div>
                              </td>
                          ))}
                      </tr>

                      <tr>
                          <td className="p-6 font-black text-slate-800 bg-slate-50/10">
                              <div className="flex items-center gap-2">
                                  <ClockIcon className="w-4 h-4 text-emerald-600 scale-75" />
                                  <span className="text-[11px]">الخبرة والولاء</span>
                              </div>
                          </td>
                          {candidates.map(candidate => (
                              <td key={candidate.id} className="p-6 border-r border-slate-100">
                                  <div className="mb-2">
                                    <span className="text-base font-black text-slate-900">{candidate.info.experienceYears}</span>
                                    <span className="text-[9px] text-slate-400 mr-2 font-bold">إجمالي الخبرة</span>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[9px] font-bold text-slate-600 leading-relaxed">
                                    {candidate.info.jobStability}
                                  </div>
                              </td>
                          ))}
                      </tr>

                      <tr>
                          <td className="p-6 font-black text-slate-800 bg-slate-50/10">
                              <div className="flex items-center gap-2">
                                  <ShieldIcon className="w-4 h-4 text-indigo-600 scale-75" />
                                  <span className="text-[11px]">الملاءمة (شهماوي)</span>
                              </div>
                          </td>
                          {candidates.map(candidate => (
                              <td key={candidate.id} className="p-6 border-r border-slate-100">
                                  <div className="mb-3">
                                    <ShahmawiGaugeSmall score={candidate.analysis.fitnessScore} />
                                  </div>
                                  <p className="text-[9px] text-slate-600 leading-relaxed text-justify font-bold">
                                      {candidate.analysis.fitnessForShahm}
                                  </p>
                              </td>
                          ))}
                      </tr>

                      <tr>
                          <td className="p-6 font-black text-slate-800 bg-slate-50/10">
                              <div className="flex items-center gap-2">
                                  <CheckCircleIcon className="w-4 h-4 text-emerald-500 scale-75" />
                                  <span className="text-[11px]">الشهادات المهنية</span>
                              </div>
                          </td>
                          {candidates.map(candidate => (
                              <td key={candidate.id} className="p-6 border-r border-slate-100">
                                  <div className="flex flex-wrap gap-1">
                                      {candidate.analysis.certifications?.length > 0 ? (
                                        candidate.analysis.certifications.map((c, i) => (
                                          <div key={i} className="text-[8px] font-black py-1 px-2 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-100">
                                            {c}
                                          </div>
                                        ))
                                      ) : (
                                        <span className="text-[9px] text-slate-300 italic">لا توجد شهادات</span>
                                      )}
                                  </div>
                              </td>
                          ))}
                      </tr>

                      <tr>
                          <td className="p-6 font-black text-slate-800 bg-slate-50/10">
                              <div className="flex items-center gap-2">
                                  <BriefcaseIcon className="w-4 h-4 text-slate-600 scale-75" />
                                  <span className="text-[11px]">الخبرة النوعية</span>
                              </div>
                          </td>
                          {candidates.map(candidate => (
                              <td key={candidate.id} className="p-6 border-r border-slate-100">
                                  <p className="text-[9px] font-bold text-slate-600 leading-relaxed">
                                    {candidate.analysis.majorCompaniesExperience}
                                  </p>
                              </td>
                          ))}
                      </tr>
                  </tbody>
              </table>
          </div>

          <div className="bg-slate-50/50 p-6 text-center border-t border-slate-100">
              <p className="text-slate-400 text-[8px] uppercase font-black tracking-[0.4em]">Shahm Contracting – Talent Benchmarking Insight Report</p>
          </div>
      </div>
    </div>
  );
};
