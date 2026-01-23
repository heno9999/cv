
import React, { useState, useMemo } from 'react';
import { CandidateData, CandidateEvaluation, InterviewQuestions } from '../types';
import { 
    UserIcon, 
    CheckCircleIcon, 
    RobotIcon, 
    ChartIcon, 
    AlertIcon, 
    ClockIcon, 
    BriefcaseIcon, 
    ShieldIcon, 
    RefreshIcon, 
    FileTextIcon, 
    CalendarIcon,
    PrinterIcon
} from './Icons';
import { generateInterviewQuestions } from '../services/geminiService';

interface HireForMeViewProps {
  candidates: CandidateData[];
  onSaveEvaluation: (id: string, evalData: CandidateEvaluation) => Promise<void>;
  onSaveInterviewQuestions: (id: string, questions: InterviewQuestions) => Promise<void>;
  onBack: () => void;
}

const KPICard = ({ label, value, subtitle, icon, isPrint = false }: { label: string, value: string | number, subtitle: string, icon: React.ReactNode, isPrint?: boolean }) => {
    return (
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-1 ${isPrint ? 'p-2 border-slate-200 shadow-none' : 'p-6'}`}>
            <div className="flex items-center justify-between mb-0.5">
                <span className={`${isPrint ? 'text-[7.5px]' : 'text-[9px]'} font-black text-slate-400 uppercase tracking-widest`}>{label}</span>
                <div className={`rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center ${isPrint ? 'w-5 h-5 print-icon-wrapper' : 'p-1 scale-75'}`}>
                    <div className={isPrint ? 'print-icon' : ''}>
                        {icon}
                    </div>
                </div>
            </div>
            <div className={`${isPrint ? 'text-lg' : 'text-3xl'} font-black text-slate-900 tracking-tighter`}>{value}</div>
            <div className={`font-bold text-slate-400 leading-tight ${isPrint ? 'text-[7px]' : 'text-[9px]'}`}>{subtitle}</div>
        </div>
    );
};

const DonutChart = ({ data, title, isPrint = false }: { data: { label: string, value: number, color: string }[], title: string, isPrint?: boolean }) => {
  const total = data.reduce((acc, curr) => acc + curr.value, 0);
  let cumulativePercent = 0;
  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };
  return (
    <div className={`bg-white rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col items-center ${isPrint ? 'p-3 border-slate-200 shadow-none' : 'p-6'}`}>
      <h3 className={`font-black text-slate-900 self-start uppercase tracking-widest border-r-4 border-blue-600 pr-2 ${isPrint ? 'text-[8.5px] mb-2' : 'text-[10px] mb-4'}`}>{title}</h3>
      <div className={`relative ${isPrint ? 'w-24 h-24' : 'w-40 h-40'}`}>
        <svg viewBox="-1 -1 2 2" className={`w-full h-full -rotate-90 ${isPrint ? 'chart-svg' : ''}`}>
          {total === 0 ? (
            <circle cx="0" cy="0" r="1" fill="#f1f5f9" />
          ) : (
            data.map((slice, i) => {
              const startPercent = cumulativePercent;
              const slicePercent = slice.value / total;
              cumulativePercent += slicePercent;
              const [startX, startY] = getCoordinatesForPercent(startPercent);
              const [endX, endY] = getCoordinatesForPercent(cumulativePercent);
              const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
              const pathData = [`M ${startX} ${startY}`, `A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`, `L 0 0`].join(' ');
              return <path key={i} d={pathData} fill={slice.color} />;
            })
          )}
          <circle cx="0" cy="0" r="0.65" fill="white" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className={`${isPrint ? 'text-[11px]' : 'text-lg'} font-black text-slate-900`}>{total}</span>
          <span className={`${isPrint ? 'text-[5px]' : 'text-[7px]'} font-bold text-slate-400 uppercase`}>مرشح</span>
        </div>
      </div>
      <div className={`w-full space-y-0.5 ${isPrint ? 'mt-2 px-1' : 'mt-4'}`}>
        {data.map((item, i) => (
          <div key={i} className={`flex items-center justify-between font-bold ${isPrint ? 'text-[7.5px]' : 'text-[9px]'}`}>
            <div className="flex items-center gap-2">
              <div className="w-1 h-1 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-slate-600 truncate max-w-[80px]">{item.label}</span>
            </div>
            <span className="text-slate-900 font-black">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const BarChart = ({ data, title, horizontal = false, isPrint = false }: { data: { label: string, value: number, color: string }[], title: string, horizontal?: boolean, isPrint?: boolean }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className={`bg-white rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col h-full ${isPrint ? 'p-3 border-slate-200 shadow-none' : 'p-6'}`}>
      <h3 className={`font-black text-slate-900 uppercase tracking-widest border-r-4 border-emerald-500 pr-2 ${isPrint ? 'text-[8.5px] mb-2' : 'text-[10px] mb-4'}`}>{title}</h3>
      <div className={`flex-1 flex ${horizontal ? 'flex-col gap-1.5 justify-center' : 'items-end justify-around gap-2'}`}>
        {data.map((item, i) => {
          const size = (item.value / max) * 100;
          if (horizontal) {
            return (
              <div key={i} className="space-y-0.5">
                <div className={`flex justify-between items-center font-black text-slate-500 ${isPrint ? 'text-[7.5px]' : 'text-[8px]'} mb-0.5`}>
                  <span className="truncate max-w-[150px]">{item.label}</span>
                  <span className="text-slate-900">{item.value}</span>
                </div>
                <div className={`${isPrint ? 'h-1' : 'h-1.5'} bg-slate-50 rounded-full overflow-hidden border border-slate-100`}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${size}%`, backgroundColor: item.color }}></div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div className={`w-full bg-slate-50 rounded-t-lg overflow-hidden relative border-x border-t border-slate-100 flex items-end ${isPrint ? 'h-16' : 'h-32'}`}>
                <div 
                  className="w-full transition-all duration-1000 ease-out" 
                  style={{ height: `${size}%`, backgroundColor: item.color }}
                ></div>
                <span className={`absolute top-0.5 left-1/2 -translate-x-1/2 font-black text-slate-900 ${isPrint ? 'text-[6.5px]' : 'text-[8px]'}`}>{item.value}</span>
              </div>
              <span className={`font-black text-slate-400 text-center leading-tight uppercase tracking-tighter h-2.5 flex items-center ${isPrint ? 'text-[6.5px]' : 'text-[7px]'}`}>{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const HireForMeView: React.FC<HireForMeViewProps> = ({ candidates, onSaveEvaluation, onSaveInterviewQuestions, onBack }) => {
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [interviewQuestionsCandidateId, setInterviewQuestionsCandidateId] = useState<string | null>(null);
  const [interviewSessionCandidateId, setInterviewSessionCandidateId] = useState<string | null>(null);
  const [printReportCandidateId, setPrintReportCandidateId] = useState<string | null>(null);
  const [showDashboardExport, setShowDashboardExport] = useState(false);

  const handleOpenEvaluation = (id: string) => setEditingCandidateId(id);
  const handleCloseEvaluation = () => setEditingCandidateId(null);
  
  const handleOpenInterviewQuestions = (id: string) => setInterviewQuestionsCandidateId(id);
  const handleCloseInterviewQuestions = () => setInterviewQuestionsCandidateId(null);

  const handleOpenInterviewSession = (id: string) => setInterviewSessionCandidateId(id);
  const handleCloseInterviewSession = () => setInterviewSessionCandidateId(null);

  const handleOpenPrintReport = (id: string) => setPrintReportCandidateId(id);
  const handleClosePrintReport = () => setPrintReportCandidateId(null);
  
  const [sortOrder, setSortOrder] = useState<'default' | 'highestScore'>('default');
  const [filterName, setFilterName] = useState<string>('');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('');
  const [filterKsaExp, setFilterKsaExp] = useState<'all' | 'under2' | '2-5' | 'above5'>('all');
  const [filterShortlist, setFilterShortlist] = useState<'all' | 'qualified' | 'notQualified'>('all');
  const [filterEvalStatus, setFilterEvalStatus] = useState<'all' | 'evaluated' | 'notEvaluated'>('all');
  const [filterStability, setFilterStability] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const specialties = useMemo(() => {
    const unique = new Set(candidates.map(c => c.info.specialty).filter(Boolean));
    return Array.from(unique).sort();
  }, [candidates]);

  const getNumFromStr = (raw?: string): number => {
    if (!raw) return -1;
    if (raw.includes('أقل من سنة')) return 0.5;
    const match = raw.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : -1;
  };

  const getStabilityLevel = (text: string) => {
    if (!text) return 'unknown';
    if (text.includes('ممتاز') || text.includes('ممتازة')) return 'high';
    if (text.includes('جيد') || text.includes('جيدة')) return 'medium';
    if (text.includes('ضعيف') || text.includes('ضعيفة')) return 'low';
    return 'unknown';
  };

  const filteredAndSortedCandidates = useMemo(() => {
    let result = [...candidates];
    if (filterName) {
      result = result.filter(c => c.info.fullName.toLowerCase().includes(filterName.toLowerCase()));
    }
    if (filterSpecialty) result = result.filter(c => c.info.specialty === filterSpecialty);
    if (filterKsaExp !== 'all') {
      result = result.filter(c => {
        const num = getNumFromStr(c.info.ksaExperience);
        if (num === -1) return false;
        if (filterKsaExp === 'under2') return num < 2;
        if (filterKsaExp === '2-5') return num >= 2 && num <= 5;
        if (filterKsaExp === 'above5') return num > 5;
        return true;
      });
    }
    if (filterShortlist !== 'all') {
      const qualifiedStatuses = ['جاري المقابلة', 'تمت المقابلة والتقييم', 'مناسب'];
      result = result.filter(c => {
        const isQualified = qualifiedStatuses.includes(c.status);
        return filterShortlist === 'qualified' ? isQualified : !isQualified;
      });
    }
    if (filterEvalStatus !== 'all') {
      result = result.filter(c => {
        const hasEval = !!c.evaluation && (c.evaluation.score > 0 || !!c.evaluation.finalEvaluation);
        return filterEvalStatus === 'evaluated' ? hasEval : !hasEval;
      });
    }
    if (filterStability !== 'all') {
      result = result.filter(c => getStabilityLevel(c.info.jobStability) === filterStability);
    }
    if (sortOrder === 'highestScore') {
      result.sort((a, b) => (b.evaluation?.score || 0) - (a.evaluation?.score || 0));
    }
    return result;
  }, [candidates, sortOrder, filterName, filterSpecialty, filterKsaExp, filterShortlist, filterEvalStatus, filterStability]);

  const analytics = useMemo(() => {
    const natCounts: Record<string, number> = {};
    filteredAndSortedCandidates.forEach(c => {
      const n = c.info.nationality || 'غير محدد';
      natCounts[n] = (natCounts[n] || 0) + 1;
    });
    const sortedNats = Object.entries(natCounts).sort((a, b) => b[1] - a[1]);
    const topNats = sortedNats.slice(0, 4);
    const otherCount = sortedNats.slice(4).reduce((acc, curr) => acc + curr[1], 0);
    const nationalityData = topNats.map(([label, value], i) => ({
      label, value, color: ['#4285F4', '#9B72CB', '#D96570', '#F4AF40'][i]
    }));
    if (otherCount > 0) nationalityData.push({ label: 'أخرى', value: otherCount, color: '#94a3b8' });
    const expBands = { '0-2': 0, '2-5': 0, '5-10': 0, '10+': 0 };
    filteredAndSortedCandidates.forEach(c => {
      const num = getNumFromStr(c.info.experienceYears);
      if (num < 2) expBands['0-2']++;
      else if (num <= 5) expBands['2-5']++;
      else if (num <= 10) expBands['5-10']++;
      else expBands['10+']++;
    });
    const experienceData = [{ label: '0-2 سنوات', value: expBands['0-2'], color: '#3b82f6' }, { label: '2-5 سنوات', value: expBands['2-5'], color: '#6366f1' }, { label: '5-10 سنوات', value: expBands['5-10'], color: '#8b5cf6' }, { label: 'أكثر من 10 سنوات', value: expBands['10+'], color: '#10b981' }];
    const specCounts: Record<string, number> = {};
    filteredAndSortedCandidates.forEach(c => {
      const s = c.info.specialty || 'غير محدد';
      specCounts[s] = (specCounts[s] || 0) + 1;
    });
    const topSpecialties = Object.entries(specCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label, value]) => ({ label, value, color: '#4f46e5' }));
    return { nationalityData, experienceData, topSpecialties };
  }, [filteredAndSortedCandidates]);

  const stats = useMemo(() => {
    const total = candidates.length;
    const qualifiedStatuses = ['جاري المقابلة', 'تمت المقابلة والتقييم', 'مناسب'];
    const shortlistedCount = candidates.filter(c => qualifiedStatuses.includes(c.status)).length;
    const evaluationsWithScore = candidates.filter(c => c.evaluation?.score !== undefined);
    const avgScoreNum = evaluationsWithScore.length ? Math.round(evaluationsWithScore.reduce((sum, c) => sum + (c.evaluation?.score || 0), 0) / evaluationsWithScore.length) : 0;
    const suitableCount = candidates.filter(c => c.status === 'مناسب' || c.analysis.fitnessForShahm.includes("مناسب جدًا")).length;
    const suitabilityPctNum = total > 0 ? Math.round((suitableCount / total) * 100) : 0;
    return { 
      total, 
      shortlistedCount, 
      avgScoreNum,
      avgScore: `${avgScoreNum}%`, 
      suitabilityPctNum,
      suitabilityPct: `${suitabilityPctNum}%` 
    };
  }, [candidates]);

  const resetFilters = () => {
    setSortOrder('default');
    setFilterName('');
    setFilterSpecialty('');
    setFilterKsaExp('all');
    setFilterShortlist('all');
    setFilterEvalStatus('all');
    setFilterStability('all');
  };

  const editingCandidate = candidates.find(c => c.id === editingCandidateId);
  const interviewQuestionsCandidate = candidates.find(c => c.id === interviewQuestionsCandidateId);
  const interviewSessionCandidate = candidates.find(c => c.id === interviewSessionCandidateId);
  const printReportCandidate = candidates.find(c => c.id === printReportCandidateId);

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
      <div className="text-center py-6 no-print">
        <h1 className="text-4xl font-black tracking-tighter relative inline-block">
          <span className="ai-text-shimmer neon-glow">شهماوي وظِّف لي</span>
          <div className="absolute -inset-1 blur-lg opacity-20 bg-blue-500 rounded-full animate-pulse"></div>
        </h1>
        <style>{`.neon-glow { filter: drop-shadow(0 0 5px rgba(66, 133, 244, 0.5)); }`}</style>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
        <KPICard label="إجمالي السير الذاتية" value={stats.total} subtitle="عدد كل المرشحين في قاعدة البيانات" icon={<ChartIcon className="w-5 h-5" />} />
        <KPICard label="مرشحون للمقابلة" value={stats.shortlistedCount} subtitle="مرشحون جاهزون لمرحلة المقابلات" icon={<ClockIcon className="w-5 h-5" />} />
        <KPICard label="متوسط درجة التقييم" value={stats.avgScore} subtitle="بعد فحص الموارد البشرية والفني" icon={<ShieldIcon className="w-5 h-5" />} />
        <KPICard label="نسبة الكفاءات المناسبة" value={stats.suitabilityPct} subtitle="نسبة المرشحين الذين يوصي بهم شهماوي" icon={<CheckCircleIcon className="w-5 h-5" />} />
      </div>

      <div className="space-y-6 no-print">
        <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
                <ChartIcon className="w-6 h-6 text-indigo-600" />
                <h2 className="text-xl font-black text-slate-900">تحليلات المرشحين (Talent Analytics)</h2>
            </div>
            <button 
                onClick={() => setShowDashboardExport(true)}
                className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
            >
                <PrinterIcon className="w-4 h-4" />
                <span>تصدير لوحة التحكم</span>
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4 h-full"><DonutChart title="توزيع الجنسيات" data={analytics.nationalityData} /></div>
          <div className="md:col-span-4 h-full"><BarChart title="توزيع سنوات الخبرة" data={analytics.experienceData} /></div>
          <div className="md:col-span-4 h-full"><BarChart title="أكثر التخصصات تكرارًا" data={analytics.topSpecialties} horizontal={true} /></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 no-print">
        <div className="flex items-center gap-3 mb-2">
            <RobotIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900">محرك التصفية الذكي</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-slate-400 mr-1 uppercase">بحث بالاسم</label>
            <input 
              type="text" 
              value={filterName} 
              onChange={(e) => setFilterName(e.target.value)} 
              placeholder="ابحث عن مرشح..." 
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 mr-1 uppercase">الترتيب</label>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="default">الترتيب الافتراضي</option>
              <option value="highestScore">الأعلى تقييمًا أولاً</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 mr-1 uppercase">التخصص</label>
            <select value={filterSpecialty} onChange={(e) => setFilterSpecialty(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[140px]">
              <option value="">كل التخصصات</option>
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 mr-1 uppercase">خبرة المملكة</label>
            <select value={filterKsaExp} onChange={(e) => setFilterKsaExp(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="all">الكل</option>
              <option value="under2">أقل من سنتين</option>
              <option value="2-5">من 2 إلى 5 سنوات</option>
              <option value="above5">أكثر من 5 سنوات</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 mr-1 uppercase">حالة الترشيح</label>
            <select value={filterShortlist} onChange={(e) => setFilterShortlist(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="all">الكل</option>
              <option value="qualified">مؤهل للمقابلة</option>
              <option value="notQualified">غير مؤهل للمقابلة</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 mr-1 uppercase">حالة التقييم</label>
            <select value={filterEvalStatus} onChange={(e) => setFilterEvalStatus(e.target.value as any)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20">
              <option value="all">الكل</option>
              <option value="evaluated">تم التقييم</option>
              <option value="notEvaluated">لم يتم التقييم بعد</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-slate-400 mr-1 uppercase">مؤشر الاستقرار</label>
            <select 
              value={filterStability} 
              onChange={(e) => setFilterStability(e.target.value as any)} 
              className={`border rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                filterStability === 'high' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 text-emerald-700' :
                filterStability === 'low' ? 'border-red-500 ring-1 ring-red-500 bg-red-50 text-red-700' :
                filterStability === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                'bg-slate-50 border-slate-200'
              }`}
            >
              <option value="all">الكل</option>
              <option value="high">🟢 استقرار عالي (ممتاز)</option>
              <option value="medium">🟡 استقرار متوسط (جيد)</option>
              <option value="low">🔴 استقرار منخفض (خطر)</option>
            </select>
          </div>
          <button onClick={resetFilters} className="mt-6 text-red-500 text-[10px] font-black hover:bg-red-50 px-3 py-2 rounded-xl transition-all">إعادة تعيين</button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden min-h-[400px] no-print">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-900">تقييم المرشحين ({filteredAndSortedCandidates.length})</h2>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-right ltr">
                <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <tr>
                        <th className="p-6">المرشح</th>
                        <th className="p-6">الوظيفة / التخصص</th>
                        <th className="p-6">خبرة المملكة</th>
                        <th className="p-6">الدرجة (%)</th>
                        <th className="p-6">حالة الترشيح</th>
                        <th className="p-6 text-center">الإجراءات</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredAndSortedCandidates.map(c => {
                        const hasInterviewed = c.evaluation && (c.evaluation.score > 0 || !!c.evaluation.finalEvaluation);
                        return (
                            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-6">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-900 text-sm">{c.info.fullName}</span>
                                            {hasInterviewed && (
                                                <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">تمت المقابلة</span>
                                            )}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1 font-mono">#{c.id.split('-')[0]}</div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <div className="text-xs font-bold text-slate-600">{c.info.jobTitle}</div>
                                    <div className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">{c.info.specialty}</div>
                                </td>
                                <td className="p-6"><div className="text-xs font-black text-slate-700">{c.info.ksaExperience || 'غير متوفر'}</div></td>
                                <td className="p-6">
                                    {c.evaluation?.score !== undefined && c.evaluation.score > 0 ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${c.evaluation.score}%` }}></div></div>
                                            <span className="text-xs font-black text-slate-900">{c.evaluation.score}%</span>
                                        </div>
                                    ) : <span className="text-[10px] text-slate-300 italic">بدون تقييم</span>}
                                </td>
                                <td className="p-6">
                                    <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${['جاري المقابلة', 'تمت المقابلة والتقييم', 'مناسب'].includes(c.status) ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                        {c.status === 'Under Review' ? 'قيد المراجعة' : c.status}
                                    </span>
                                </td>
                                <td className="p-6 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleOpenInterviewSession(c.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm">
                                            <CalendarIcon className="w-3.5 h-3.5" />
                                            <span>بدء جلسة المقابلة</span>
                                        </button>
                                        <button onClick={() => handleOpenEvaluation(c.id)} className="bg-slate-50 text-slate-600 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-white hover:border-blue-500 hover:text-blue-600 transition-all flex items-center gap-1.5">
                                            <ShieldIcon className="w-3.5 h-3.5" />
                                            <span>تقييم سريع</span>
                                        </button>
                                        <button onClick={() => handleOpenInterviewQuestions(c.id)} className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5">
                                            <RobotIcon className="w-3.5 h-3.5" />
                                            <span>تجهيز أسئلة</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {filteredAndSortedCandidates.length === 0 && (
                        <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold italic"><div className="flex flex-col items-center gap-4 opacity-40"><AlertIcon className="w-12 h-12" /><span>لا توجد سير ذاتية مطابقة لمعايير البحث الحالية.</span></div></td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>

      {editingCandidate && <EvaluationModal candidate={editingCandidate} onClose={handleCloseEvaluation} onSave={async (data) => { await onSaveEvaluation(editingCandidate.id, data); handleCloseEvaluation(); }} />}
      {interviewQuestionsCandidate && <InterviewQuestionsModal candidate={interviewQuestionsCandidate} onClose={handleCloseInterviewQuestions} onSave={onSaveInterviewQuestions} />}
      {interviewSessionCandidate && (
          <InterviewSessionDrawer 
            candidate={interviewSessionCandidate} 
            onClose={handleCloseInterviewSession} 
            onExportReport={() => handleOpenPrintReport(interviewSessionCandidate.id)}
            onSave={async (evalData) => {
                await onSaveEvaluation(interviewSessionCandidate.id, evalData);
                handleCloseInterviewSession();
            }} 
          />
      )}
      {printReportCandidate && (
          <InterviewReportView 
            candidate={printReportCandidate} 
            onClose={handleClosePrintReport} 
          />
      )}
      {showDashboardExport && (
          <DashboardExportView 
            stats={stats}
            analytics={analytics}
            specialties={specialties}
            onClose={() => setShowDashboardExport(false)}
          />
      )}
    </div>
  );
};

const EvaluationModal = ({ candidate, onClose, onSave }: { candidate: CandidateData, onClose: () => void, onSave: (data: CandidateEvaluation) => void }) => {
    const [formData, setFormData] = useState<CandidateEvaluation>(candidate.evaluation || { 
        score: 0, 
        hrScore: undefined, 
        techScore: undefined, 
        finalScore: undefined, 
        hrEvaluation: '', 
        technicalEvaluation: '', 
        finalEvaluation: '',
        recruitmentDoctorPass: undefined
    });
    const [isSaving, setIsSaving] = useState(false);

    const calculateTotal = (hr?: number, tech?: number, final?: number) => {
        const h = Number(hr) || 0;
        const t = Number(tech) || 0;
        const f = Number(final) || 0;
        const total = h + t + f;
        return Math.round((total / 225) * 100);
    };

    const handleSubScoreChange = (field: 'hrScore' | 'techScore' | 'finalScore', val?: number) => {
        let clamped = val;
        if (val !== undefined) {
            clamped = Math.min(75, Math.max(0, val));
        }
        
        const newFormData = { ...formData, [field]: clamped };
        const newTotalScore = calculateTotal(
            field === 'hrScore' ? clamped : (formData.hrScore),
            field === 'techScore' ? clamped : (formData.techScore),
            field === 'finalScore' ? clamped : (formData.finalScore)
        );
        setFormData({ ...newFormData, score: newTotalScore });
    };

    const handleSubmit = async (e: React.FormEvent) => { 
        e.preventDefault(); 
        setIsSaving(true); 
        try { 
            await onSave(formData); 
        } finally { 
            setIsSaving(false); 
        } 
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-end bg-slate-900/40 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white w-full max-w-lg h-full rounded-[2.5rem] shadow-2xl flex flex-col animate-fade-in border-l border-slate-100" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex flex-col text-right">
                        <h3 className="text-xl font-black text-slate-900">تقييم سريع</h3>
                        <span className="text-sm font-bold text-blue-600">{candidate.info.fullName}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} type="button" className="p-3 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-all">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                    
                    <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100 space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-xs font-black text-blue-900 uppercase tracking-widest">إجمالي التقييم (%)</label>
                            <div className="text-xl font-black text-blue-900">{formData.score}%</div>
                        </div>
                        <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${formData.score}%` }}></div>
                        </div>
                        <div className="flex justify-center">
                            <span className="text-[10px] font-bold text-slate-400">({(Number(formData.hrScore) || 0) + (Number(formData.techScore) || 0) + (Number(formData.finalScore) || 0)} من 225)</span>
                        </div>
                    </div>

                    {/* Updated: Recruitment Doctor Section */}
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">تقييم دكتور التوظيف</label>
                        <div className="flex flex-wrap items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.recruitmentDoctorPass === undefined} 
                                        onChange={() => setFormData({...formData, recruitmentDoctorPass: undefined})}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded-md transition-all flex items-center justify-center ${formData.recruitmentDoctorPass === undefined ? 'bg-slate-400 border-slate-400' : 'bg-white border-slate-300 group-hover:border-slate-500'}`}>
                                        {formData.recruitmentDoctorPass === undefined && <ClockIcon className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                                <span className={`text-sm font-bold ${formData.recruitmentDoctorPass === undefined ? 'text-slate-700' : 'text-slate-500'}`}>لم يتم التقييم بعد</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.recruitmentDoctorPass === true} 
                                        onChange={() => setFormData({...formData, recruitmentDoctorPass: true})}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded-md transition-all flex items-center justify-center ${formData.recruitmentDoctorPass === true ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300 group-hover:border-emerald-500'}`}>
                                        {formData.recruitmentDoctorPass === true && <CheckCircleIcon className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                                <span className={`text-sm font-bold ${formData.recruitmentDoctorPass === true ? 'text-emerald-700' : 'text-slate-500'}`}>اجتاز</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.recruitmentDoctorPass === false} 
                                        onChange={() => setFormData({...formData, recruitmentDoctorPass: false})}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded-md transition-all flex items-center justify-center ${formData.recruitmentDoctorPass === false ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300 group-hover:border-red-400'}`}>
                                        {formData.recruitmentDoctorPass === false && <span className="text-white text-[10px] font-black">×</span>}
                                    </div>
                                </div>
                                <span className={`text-sm font-bold ${formData.recruitmentDoctorPass === false ? 'text-red-700' : 'text-slate-500'}`}>لم يجتاز</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">تقييم الموارد البشرية (0-75)</label>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="75" 
                                        value={formData.hrScore ?? ''} 
                                        onChange={(e) => handleSubScoreChange('hrScore', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                        placeholder="-"
                                        className="w-12 bg-transparent border-b border-slate-300 text-center font-black text-slate-900 outline-none focus:border-blue-600"
                                    />
                                    <span className="text-[10px] text-slate-400 font-bold">/ 75</span>
                                </div>
                            </div>
                            <textarea value={formData.hrEvaluation} onChange={(e) => setFormData({ ...formData, hrEvaluation: e.target.value })} placeholder="مرئيات الموارد البشرية..." className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none resize-none" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">التقييم الفني (0-75)</label>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="75" 
                                        value={formData.techScore ?? ''} 
                                        onChange={(e) => handleSubScoreChange('techScore', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                        placeholder="-"
                                        className="w-12 bg-transparent border-b border-slate-300 text-center font-black text-slate-900 outline-none focus:border-blue-600"
                                    />
                                    <span className="text-[10px] text-slate-400 font-bold">/ 75</span>
                                </div>
                            </div>
                            <textarea value={formData.technicalEvaluation} onChange={(e) => setFormData({ ...formData, technicalEvaluation: e.target.value })} placeholder="مرئيات التقييم الفني..." className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none resize-none" />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-black text-emerald-600 uppercase tracking-widest">التقييم النهائي (0-75)</label>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="75" 
                                        value={formData.finalScore ?? ''} 
                                        onChange={(e) => handleSubScoreChange('finalScore', e.target.value === '' ? undefined : parseInt(e.target.value))}
                                        placeholder="-"
                                        className="w-12 bg-transparent border-b border-emerald-300 text-center font-black text-emerald-700 outline-none focus:border-emerald-600"
                                    />
                                    <span className="text-[10px] text-emerald-400 font-bold">/ 75</span>
                                </div>
                            </div>
                            <textarea value={formData.finalEvaluation} onChange={(e) => setFormData({ ...formData, finalEvaluation: e.target.value })} placeholder="التوصية والقرار النهائي..." className="w-full min-h-[80px] p-3 bg-emerald-50/30 border border-emerald-100 rounded-xl text-xs font-bold text-slate-900 outline-none resize-none" />
                        </div>
                    </div>
                </form>
                <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex gap-3">
                    <button type="submit" onClick={handleSubmit} disabled={isSaving} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">{isSaving ? 'جاري الحفظ...' : 'حفظ التقييم'}</button>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} type="button" className="px-8 py-4 border border-slate-200 text-slate-400 font-bold rounded-2xl hover:bg-white hover:text-slate-600 transition-all">إلغاء</button>
                </div>
            </div>
        </div>
    );
};

const InterviewQuestionsModal = ({ candidate, onClose, onSave }: { candidate: CandidateData, onClose: () => void, onSave: (id: string, q: InterviewQuestions) => Promise<void> }) => {
    const [questions, setQuestions] = useState<InterviewQuestions | null>(candidate.interviewQuestions || null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const result = await generateInterviewQuestions(candidate);
            setQuestions(result);
        } catch (e) {
            alert("حدث خطأ أثناء توليد الأسئلة.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!questions) return;
        setIsSaving(true);
        try {
            await onSave(candidate.id, questions);
            onClose();
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyAll = () => {
        if (!questions) return;
        const text = [
            "الأسئلة السلوكية والدوافع:", ...questions.behavioral,
            "\nالأسئلة الفنية:", ...questions.technical,
            "\nأسئلة المخاطر والفجوات:", ...questions.risk,
            "\nالملاءمة مع ثقافة شهم:", ...questions.culture
        ].join('\n- ');
        navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
    };

    return (
        <div className="fixed inset-0 z-[210] flex items-center justify-end bg-slate-900/60 backdrop-blur-md p-4 no-print" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl h-full rounded-[2.5rem] shadow-2xl flex flex-col animate-fade-in border-l border-slate-100 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-indigo-50/30">
                    <div className="flex flex-col text-right">
                        <div className="flex items-center gap-2">
                            <RobotIcon className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-xl font-black text-slate-900">Interview Co-pilot</h3>
                        </div>
                        <span className="text-xs font-bold text-slate-500 mt-1">أسئلة مقابلة المرشح: {candidate.info.fullName}</span>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} type="button" className="p-3 bg-white rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 shadow-sm transition-all">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    {!questions && !isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
                                <RobotIcon className="w-10 h-10" />
                            </div>
                            <div className="max-w-xs">
                                <h4 className="text-lg font-black text-slate-900">جاهز لمساعدة HR شهم؟</h4>
                                <p className="text-sm font-bold text-slate-400 mt-2">سيقوم شهماوي بتوليد أسئلة مخصصة لهذا المرشح بناءً على تخصصه ونقاط الضعف المكتشفة في استقراره الوظيفي.</p>
                            </div>
                            <button onClick={handleGenerate} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all">تجهيز الأسئلة الآن</button>
                        </div>
                    ) : isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-6">
                            <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="ai-text-shimmer font-black text-xl">شهماوي يقرأ السيرة ويصيغ الأسئلة...</p>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-fade-in">
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">أسئلة مقابلة مقترحة</span>
                                <button onClick={handleGenerate} className="text-[10px] font-black text-indigo-600 hover:underline">تحديث / إعادة توليد</button>
                            </div>

                            <QuestionSection title="الأسئلة السلوكية والدوافع" questions={questions.behavioral} icon={<UserIcon className="w-4 h-4" />} />
                            <QuestionSection title="الأسئلة الفنية" questions={questions.technical} icon={<BriefcaseIcon className="w-4 h-4" />} variant="blue" />
                            <QuestionSection title="أسئلة المخاطر والفجوات" questions={questions.risk} icon={<AlertIcon className="w-4 h-4" />} variant="amber" />
                            <QuestionSection title="الملاءمة مع ثقافة شهم" questions={questions.culture} icon={<ShieldIcon className="w-4 h-4" />} variant="emerald" />
                        </div>
                    )}
                </div>

                {questions && (
                    <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-3">
                        <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all">{isSaving ? 'جاري الحفظ...' : 'حفظ الأسئلة'}</button>
                        <button onClick={handleCopyAll} className="px-6 py-4 border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-white transition-all flex items-center gap-2">
                            {copyFeedback ? <CheckCircleIcon className="w-4 h-4 text-emerald-500" /> : <FileTextIcon className="w-4 h-4" />}
                            <span>{copyFeedback ? 'تم النسخ' : 'نسخ الكل'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const QuestionSection = ({ title, questions, icon, variant = "indigo" }: { title: string, questions: string[], icon: any, variant?: string }) => {
    const vClasses: Record<string, string> = {
        indigo: "text-indigo-600 bg-indigo-50",
        blue: "text-blue-600 bg-blue-50",
        amber: "text-amber-600 bg-amber-50",
        emerald: "text-emerald-600 bg-emerald-50"
    };
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
                <div className={`p-1.5 rounded-lg ${vClasses[variant]} scale-90`}>{icon}</div>
                <h4 className="text-sm font-black text-slate-900">{title}</h4>
            </div>
            <div className="space-y-2">
                {questions.map((q, i) => (
                    <div key={i} className="p-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold text-slate-700 leading-relaxed flex items-start gap-3 hover:border-indigo-200 transition-all">
                        <span className="w-5 h-5 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                        <span>{q}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const InterviewSessionDrawer = ({ candidate, onClose, onSave, onExportReport }: { candidate: CandidateData, onClose: () => void, onSave: (data: CandidateEvaluation) => Promise<void>, onExportReport: () => void }) => {
    const [formData, setFormData] = useState<CandidateEvaluation>(candidate.evaluation || { 
        score: 0, 
        hrScore: undefined,
        techScore: undefined,
        finalScore: undefined,
        hrEvaluation: '', 
        technicalEvaluation: '', 
        finalEvaluation: '',
        interviewDate: new Date().toISOString().split('T')[0],
        interviewType: 'حضورية',
        interviewerName: '',
        recruitmentDoctorPass: undefined
    });
    const [isSaving, setIsSaving] = useState(false);

    const calculateTotal = (hr?: number, tech?: number, final?: number) => {
        const h = Number(hr) || 0;
        const t = Number(tech) || 0;
        const f = Number(final) || 0;
        const total = h + t + f;
        return Math.round((total / 225) * 100);
    };

    const handleFormChange = (updates: Partial<CandidateEvaluation>) => {
        const merged = { ...formData, ...updates };
        
        if (merged.hrScore !== undefined) merged.hrScore = Math.min(75, Math.max(0, merged.hrScore));
        if (merged.techScore !== undefined) merged.techScore = Math.min(75, Math.max(0, merged.techScore));
        if (merged.finalScore !== undefined) merged.finalScore = Math.min(75, Math.max(0, merged.finalScore));

        if ('hrScore' in updates || 'techScore' in updates || 'finalScore' in updates) {
            merged.score = calculateTotal(merged.hrScore, merged.techScore, merged.finalScore);
        }

        setFormData(merged);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-end bg-slate-900/60 backdrop-blur-md p-0 md:p-4 no-print" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl h-full md:rounded-[2.5rem] shadow-2xl flex flex-col animate-fade-in border-l border-slate-100 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-8 border-b border-slate-100 bg-emerald-50/20">
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col text-right">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="w-6 h-6 text-emerald-600" />
                                <h3 className="text-2xl font-black text-slate-900">جلسة مقابلة المرشّح</h3>
                            </div>
                            <span className="text-sm font-bold text-slate-500 mt-1">{candidate.info.fullName} (التخصص: {candidate.info.specialty})</span>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); onClose(); }} type="button" className="p-3 bg-white rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-900 shadow-sm transition-all">✕</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
                    <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                        <div className="relative z-10 flex items-center justify-between">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي تقييم المقابلة</span>
                                <div className="text-4xl font-black text-emerald-400">{formData.score}%</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-slate-200">{(Number(formData.hrScore) || 0) + (Number(formData.techScore) || 0) + (Number(formData.finalScore) || 0)}</div>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">من إجمالي 225 درجة</span>
                            </div>
                        </div>
                        <div className="mt-6 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all duration-500" style={{ width: `${formData.score}%` }}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase mr-1">تاريخ المقابلة</label>
                            <input 
                                type="date" 
                                value={formData.interviewDate} 
                                onChange={(e) => handleFormChange({ interviewDate: e.target.value })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 outline-none" 
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase mr-1">نوع المقابلة</label>
                            <select 
                                value={formData.interviewType}
                                onChange={(e) => handleFormChange({ interviewType: e.target.value as any })}
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 outline-none" 
                            >
                                <option value="حضورية">حضورية</option>
                                <option value="عن بُعد (أونلاين)">عن بُعد (أونلاين)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase mr-1">اسم المقيِّم / المحاوِر</label>
                            <input 
                                type="text" 
                                value={formData.interviewerName}
                                onChange={(e) => handleFormChange({ interviewerName: e.target.value })}
                                placeholder="ادخل اسم الشخص أو اللجنة القائمة بالمقابلة"
                                className="w-full px-4 py-2 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 outline-none" 
                            />
                        </div>
                    </div>

                    {/* Updated: Recruitment Doctor Assessment Section */}
                    <div className="p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm space-y-4">
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest border-r-4 border-slate-900 pr-3">تقييم دكتور التوظيف</label>
                        <div className="flex flex-wrap items-center gap-8">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.recruitmentDoctorPass === undefined} 
                                        onChange={() => handleFormChange({ recruitmentDoctorPass: undefined })}
                                        className="sr-only"
                                    />
                                    <div className={`w-6 h-6 border-2 rounded-lg transition-all flex items-center justify-center ${formData.recruitmentDoctorPass === undefined ? 'bg-slate-400 border-slate-400 shadow-lg shadow-slate-100' : 'bg-slate-50 border-slate-200 group-hover:border-slate-400'}`}>
                                        {formData.recruitmentDoctorPass === undefined && <ClockIcon className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                                <span className={`text-sm font-black transition-colors ${formData.recruitmentDoctorPass === undefined ? 'text-slate-700' : 'text-slate-400 group-hover:text-slate-600'}`}>لم يتم التقييم بعد</span>
                            </label>

                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.recruitmentDoctorPass === true} 
                                        onChange={() => handleFormChange({ recruitmentDoctorPass: true })}
                                        className="sr-only"
                                    />
                                    <div className={`w-6 h-6 border-2 rounded-lg transition-all flex items-center justify-center ${formData.recruitmentDoctorPass === true ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-200' : 'bg-slate-50 border-slate-200 group-hover:border-emerald-500'}`}>
                                        {formData.recruitmentDoctorPass === true && <CheckCircleIcon className="w-4 h-4 text-white" />}
                                    </div>
                                </div>
                                <span className={`text-sm font-black transition-colors ${formData.recruitmentDoctorPass === true ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-600'}`}>اجتاز التقييم</span>
                            </label>
                            
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative">
                                    <input 
                                        type="checkbox" 
                                        checked={formData.recruitmentDoctorPass === false} 
                                        onChange={() => handleFormChange({ recruitmentDoctorPass: false })}
                                        className="sr-only"
                                    />
                                    <div className={`w-6 h-6 border-2 rounded-lg transition-all flex items-center justify-center ${formData.recruitmentDoctorPass === false ? 'bg-red-500 border-red-500 shadow-lg shadow-red-100' : 'bg-slate-50 border-slate-200 group-hover:border-red-400'}`}>
                                        {formData.recruitmentDoctorPass === false && <span className="text-white text-base font-black">×</span>}
                                    </div>
                                </div>
                                <span className={`text-sm font-black transition-colors ${formData.recruitmentDoctorPass === false ? 'text-red-700' : 'text-slate-400 group-hover:text-slate-600'}`}>لم يجتاز التقييم</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="flex items-center gap-2 border-r-4 border-emerald-500 pr-3">
                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">تفاصيل التقييم (من 225)</h4>
                        </div>
                        
                        <div className="space-y-3 p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-black text-slate-900">1. تقييم الموارد البشرية (0 - 75)</label>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="75" 
                                        value={formData.hrScore ?? ''} 
                                        onChange={(e) => handleFormChange({ hrScore: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                                        placeholder="-"
                                        className="w-16 bg-transparent border-b border-slate-300 text-center font-black text-blue-600 outline-none focus:border-blue-600 text-xl"
                                    />
                                    <span className="text-xs text-slate-400 font-bold">/ 75</span>
                                </div>
                            </div>
                            <textarea 
                                value={formData.hrEvaluation}
                                onChange={(e) => handleFormChange({ hrEvaluation: e.target.value })}
                                placeholder="نقاط القوة السلوكية، الدوافع، والملاحظات العامة..."
                                className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 resize-none"
                            />
                        </div>

                        <div className="space-y-3 p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-black text-slate-900">2. التقييم الفني (0 - 75)</label>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="75" 
                                        value={formData.techScore ?? ''} 
                                        onChange={(e) => handleFormChange({ techScore: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                                        placeholder="-"
                                        className="w-16 bg-transparent border-b border-slate-300 text-center font-black text-indigo-600 outline-none focus:border-indigo-600 text-xl"
                                    />
                                    <span className="text-xs text-slate-400 font-bold">/ 75</span>
                                </div>
                            </div>
                            <textarea 
                                value={formData.technicalEvaluation}
                                onChange={(e) => handleFormChange({ technicalEvaluation: e.target.value })}
                                placeholder="تقييم العمق المعرفي والمهارات التخصصية..."
                                className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/10 resize-none"
                            />
                        </div>

                        <div className="space-y-3 p-6 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-xs font-black text-emerald-700">3. التقييم النهائي والتوصية (0 - 75)</label>
                                <div className="flex items-center gap-1">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max="75" 
                                        value={formData.finalScore ?? ''} 
                                        onChange={(e) => handleFormChange({ finalScore: e.target.value === '' ? undefined : parseInt(e.target.value) })}
                                        placeholder="-"
                                        className="w-16 bg-transparent border-b border-emerald-300 text-center font-black text-emerald-600 outline-none focus:border-emerald-600 text-xl"
                                    />
                                    <span className="text-xs text-slate-400 font-bold">/ 75</span>
                                </div>
                            </div>
                            <textarea 
                                value={formData.finalEvaluation}
                                onChange={(e) => handleFormChange({ finalEvaluation: e.target.value })}
                                placeholder="القرار النهائي (مناسب للتوظيف، احتياط، غير مناسب حالياً)..."
                                className="w-full min-h-[100px] p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500/10 resize-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-100 bg-slate-50/30 flex flex-col gap-3">
                    <div className="flex gap-3">
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSaving} 
                            className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                        >
                            {isSaving ? 'جاري الحفظ...' : 'حفظ تقييم المقابلة'}
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onExportReport(); }}
                            type="button"
                            className="flex-1 bg-white border border-emerald-600 text-emerald-600 py-4 rounded-2xl font-black text-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                        >
                            <PrinterIcon className="w-4 h-4" />
                            <span>تصدير تقرير المقابلة</span>
                        </button>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onClose(); }} 
                        type="button"
                        className="w-full py-4 border border-slate-200 text-slate-400 font-bold rounded-2xl hover:bg-white hover:text-slate-600 transition-all"
                    >
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

const InterviewReportView = ({ candidate, onClose }: { candidate: CandidateData, onClose: () => void }) => {
    const handlePrint = () => window.print();

    return (
        <div className="fixed inset-0 z-[300] bg-white flex flex-col items-center overflow-y-auto">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; margin: 0 !important; }
                    .print-container { width: 100% !important; max-width: 100% !important; padding: 0 !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
                    @page { size: A4 portrait; margin: 15mm; }
                }
            `}</style>
            
            <div className="no-print sticky top-0 w-full bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg z-[310]">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs transition-all flex items-center gap-2">
                        ← العودة
                    </button>
                </div>
                <button onClick={handlePrint} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/40">
                    <PrinterIcon className="w-4 h-4" />
                    <span>طباعة / حفظ كملف PDF</span>
                </button>
            </div>

            <div className="print-container w-full max-w-[21cm] bg-white p-[1.5cm] md:my-8 md:border md:border-slate-100 md:shadow-2xl text-right animate-fade-in" dir="rtl">
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="flex flex-col text-right">
                        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Shahm CV Analyzer – شهماوي</h1>
                        <h2 className="text-xl font-bold text-slate-600 mt-1">تقرير جلسة المقابلة التفصيلي</h2>
                    </div>
                </div>

                <div className="mb-10">
                    <h3 className="text-lg font-black text-slate-900 mb-4 bg-slate-100 p-2 border-r-4 border-slate-900">بيانات المرشّح</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">اسم المرشّح</span>
                            <span className="font-bold border-b border-slate-100 pb-1">{candidate.info.fullName}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">المسمّى الوظيفي / التخصّص</span>
                            <span className="font-bold border-b border-slate-100 pb-1">{candidate.info.jobTitle} / {candidate.info.specialty}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">إجمالي الخبرة</span>
                            <span className="font-bold border-b border-slate-100 pb-1">{candidate.info.experienceYears}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">الجنسية</span>
                            <span className="font-bold border-b border-slate-100 pb-1">{candidate.info.nationality}</span>
                        </div>
                    </div>
                </div>

                <div className="mb-10">
                    <h3 className="text-lg font-black text-slate-900 mb-4 bg-slate-100 p-2 border-r-4 border-slate-900">بيانات جلسة المقابلة</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">تاريخ المقابلة</span>
                            <span className="font-bold border-b border-slate-100 pb-1">{candidate.evaluation?.interviewDate || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">نوع المقابلة</span>
                            <span className="font-bold border-b border-slate-100 pb-1">{candidate.evaluation?.interviewType || 'حضورية'}</span>
                        </div>
                        <div className="flex flex-col col-span-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase">اسم المقيّم / المحاوِر</span>
                            <span className="font-bold border-b border-slate-100 pb-1">{candidate.evaluation?.interviewerName || 'غير محدد'}</span>
                        </div>
                    </div>
                </div>

                {/* Updated: Recruitment Doctor Print Section */}
                <div className="mb-10">
                    <h3 className="text-lg font-black text-slate-900 mb-4 bg-slate-100 p-2 border-r-4 border-slate-900">تقييم دكتور التوظيف</h3>
                    <div className="flex flex-wrap items-center gap-6 p-4 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center ${candidate.evaluation?.recruitmentDoctorPass === undefined ? 'bg-slate-400 border-slate-400' : 'bg-white border-slate-300'}`}>
                                {candidate.evaluation?.recruitmentDoctorPass === undefined && <ClockIcon className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-sm font-black ${candidate.evaluation?.recruitmentDoctorPass === undefined ? 'text-slate-900' : 'text-slate-400'}`}>لم يتم التقييم بعد</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center ${candidate.evaluation?.recruitmentDoctorPass === true ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300'}`}>
                                {candidate.evaluation?.recruitmentDoctorPass === true && <CheckCircleIcon className="w-3 h-3 text-white" />}
                            </div>
                            <span className={`text-sm font-black ${candidate.evaluation?.recruitmentDoctorPass === true ? 'text-slate-900' : 'text-slate-400'}`}>اجتاز</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center ${candidate.evaluation?.recruitmentDoctorPass === false ? 'bg-red-500 border-red-500' : 'bg-white border-slate-300'}`}>
                                {candidate.evaluation?.recruitmentDoctorPass === false && <span className="text-white text-[10px] font-black">×</span>}
                            </div>
                            <span className={`text-sm font-black ${candidate.evaluation?.recruitmentDoctorPass === false ? 'text-slate-900' : 'text-slate-400'}`}>لم يجتاز</span>
                        </div>
                    </div>
                </div>

                <div className="mb-10">
                    <h3 className="text-lg font-black text-slate-900 mb-6 bg-slate-100 p-2 border-r-4 border-slate-900 flex justify-between items-center">
                        <span>نتائج تقييم المقابلة (من 225 درجة)</span>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black opacity-40">المجموع:</span>
                                <span className="text-2xl font-black text-emerald-600">{(Number(candidate.evaluation?.hrScore) || 0) + (Number(candidate.evaluation?.techScore) || 0) + (Number(candidate.evaluation?.finalScore) || 0)}</span>
                                <span className="text-xs font-black text-slate-400">/ 225</span>
                            </div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">النسبة المئوية: {candidate.evaluation?.score || 0}%</div>
                        </div>
                    </h3>
                    
                    <div className="space-y-8">
                        <div className="p-5 border border-slate-100 rounded-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black text-blue-600 uppercase tracking-widest">1. تقييم الموارد البشرية</span>
                                <span className="text-sm font-black text-slate-900">الدرجة: {candidate.evaluation?.hrScore || 0} / 75</span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{candidate.evaluation?.hrEvaluation || 'لا توجد ملاحظات مسجلة.'}</p>
                        </div>

                        <div className="p-5 border border-slate-100 rounded-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">2. التقييم الفني</span>
                                <span className="text-sm font-black text-slate-900">الدرجة: {candidate.evaluation?.techScore || 0} / 75</span>
                            </div>
                            <p className="text-xs font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">{candidate.evaluation?.technicalEvaluation || 'لا توجد ملاحظات مسجلة.'}</p>
                        </div>

                        <div className="p-6 bg-emerald-50/30 border border-emerald-100 rounded-2xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">3. القرار النهائي والتوصية</span>
                                <span className="text-sm font-black text-slate-900">الدرجة: {candidate.evaluation?.finalScore || 0} / 75</span>
                            </div>
                            <p className="text-sm font-black text-slate-900 leading-relaxed whitespace-pre-wrap">{candidate.evaluation?.finalEvaluation || 'لا توجد توصية مسجلة.'}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col items-center">
                    <div className="text-center px-12 py-6 bg-slate-900 text-white rounded-[2rem] shadow-xl w-full max-lg">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60 block mb-2">القرار النهائي للجنة التوظيف</span>
                        <p className="text-lg font-black leading-tight">
                            {candidate.evaluation?.finalEvaluation ? candidate.evaluation.finalEvaluation.split('\n')[0] : 'في انتظار القرار النهائي'}
                        </p>
                    </div>
                </div>

                <div className="mt-16 text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] text-center border-t border-slate-50 pt-4">
                    SHAHM CONTRACTING – AI TALENT REPORT ENGINE v6.0
                </div>
            </div>
        </div>
    );
};

const DashboardExportView = ({ stats, analytics, specialties, onClose }: { stats: any, analytics: any, specialties: string[], onClose: () => void }) => {
    const handlePrint = () => window.print();
    const currentDate = new Date().toLocaleString('ar-EG', { dateStyle: 'long', timeStyle: 'short' });
    
    const topNationality = analytics.nationalityData[0]?.label || 'متنوعة';
    const topExpRange = analytics.experienceData.slice().sort((a: any, b: any) => b.value - a.value)[0]?.label || 'متنوعة';
    const topSpecialty = analytics.topSpecialties[0]?.label || 'متنوعة';

    return (
        <div className="fixed inset-0 z-[400] bg-white flex flex-col items-center overflow-y-auto dashboard-export-overlay" onClick={onClose}>
            <style>{`
                @media print {
                    @page { 
                        size: A4 landscape; 
                        margin: 0; 
                    }
                    
                    body * { visibility: hidden !important; }
                    .dashboard-export-overlay, .dashboard-export-overlay * { visibility: visible !important; }
                    
                    .dashboard-export-overlay {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        height: auto !important;
                        overflow: visible !important;
                        background: white !important;
                    }

                    .print-container { 
                        position: relative !important;
                        width: 297mm !important; 
                        max-width: 297mm !important;
                        height: 210mm !important; 
                        padding: 8mm 12mm !important; 
                        margin: 0 auto !important;
                        border: none !important;
                        box-shadow: none !important;
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        display: flex !important;
                        flex-direction: column !important;
                        overflow: hidden !important;
                    }

                    .report-section { 
                        break-inside: avoid !important;
                        margin-bottom: 4px !important; 
                        width: 100% !important;
                    }

                    .print-container .print-icon-wrapper svg {
                        width: 13px !important;
                        height: 13px !important;
                        min-width: 13px !important;
                        min-height: 13px !important;
                        max-width: 13px !important;
                        max-height: 13px !important;
                    }

                    .print-container .chart-svg { 
                        width: 100% !important; 
                        height: 100% !important; 
                    }
                    
                    .print-container .w-24.h-24 { width: 110px !important; height: 110px !important; }
                    .print-container .h-16 { height: 60px !important; }
                    
                    .print-container .text-2xl { font-size: 20px !important; }
                    .print-container .text-lg { font-size: 16px !important; }
                    .print-container .text-[8.5px] { font-size: 9px !important; }
                    .print-container .text-[10.5px] { font-size: 10px !important; line-height: 1.3 !important; }
                    .print-container .text-[10px] { font-size: 9.5px !important; }
                    
                    .grid { gap: 8px !important; }
                    
                    .no-print { display: none !important; visibility: hidden !important; }
                    .bg-white { background-color: white !important; }
                    .bg-slate-50 { background-color: #f8fafc !important; }
                    .bg-blue-50\/30 { background-color: rgba(239, 246, 255, 0.3) !important; }
                    .bg-emerald-50\/20 { background-color: rgba(16, 185, 129, 0.05) !important; }
                    .bg-slate-900 { background-color: #0f172a !important; color: white !important; }
                    
                    .print-icon { transform: none !important; }
                    
                    .p-4 { padding: 0.6rem !important; }
                    .p-3 { padding: 0.5rem !important; }
                    .mb-4 { margin-bottom: 6px !important; }
                }
            `}</style>
            
            <div className="no-print sticky top-0 w-full bg-slate-900 text-white p-4 flex justify-between items-center shadow-lg z-[410]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4">
                    <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-xs transition-all flex items-center gap-2">← رجوع</button>
                    <span className="text-xs font-black tracking-widest uppercase opacity-50">تصدير تحليلات المواهب (Landscape Mode)</span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); handlePrint(); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl font-black text-xs transition-all flex items-center gap-2 shadow-lg">
                    <PrinterIcon className="w-4 h-4" />
                    <span>طباعة التقرير العرضي / PDF</span>
                </button>
            </div>

            <div className="print-container w-full max-w-[29cm] bg-white p-[1.5cm] md:my-6 md:border md:border-slate-100 md:shadow-2xl text-right animate-fade-in" dir="rtl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-3 report-section">
                    <div className="flex flex-col text-right">
                        <h1 className="text-2xl font-black text-slate-900 tracking-tighter">تقرير تحليلات المواهب الاستراتيجي – شهماوي وظّف لي</h1>
                        <span className="text-[10px] font-bold text-slate-400 block italic">تاريخ الاستخراج: {currentDate} | SHAHM AI-POWERED ANALYTICS</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-left leading-none">
                            <p className="text-[10px] font-black text-slate-900">شهم للمقاولات</p>
                            <p className="text-[8px] font-bold text-slate-400">إدارة الموارد البشرية</p>
                        </div>
                        <div className="w-10 h-10 border-2 border-slate-900 flex items-center justify-center font-black text-[6px] text-center p-1 rounded-lg">SHAHM</div>
                    </div>
                </div>

                <div className="mb-3 report-section">
                    <div className="grid grid-cols-6 gap-3">
                        <KPICard label="السير المُحلَّلة" value={stats.total} subtitle="إجمالي قاعدة البيانات" icon={<FileTextIcon />} isPrint />
                        <KPICard label="مؤهلون للمقابلة" value={stats.shortlistedCount} subtitle="تجاوزوا الفرز الذكي" icon={<CheckCircleIcon />} isPrint />
                        <KPICard label="نسبة الملاءمة" value={stats.suitabilityPct} subtitle="توصية شهماوي" icon={<RobotIcon />} isPrint />
                        <KPICard label="درجة التقييم" value={stats.avgScore} subtitle="متوسط المقابلات" icon={<ShieldIcon />} isPrint />
                        <KPICard label="عائلات وظيفية" value={specialties.length} subtitle="تنوع التخصصات" icon={<BriefcaseIcon />} isPrint />
                        <KPICard label="تخصص ذروة" value={topSpecialty} subtitle="الأعلى توفراً" icon={<ChartIcon />} isPrint />
                    </div>
                </div>

                <div className="report-section mb-3">
                    <div className="p-3 bg-blue-50/30 border border-blue-100 rounded-2xl">
                        <h3 className="text-[11px] font-black text-slate-900 mb-1 uppercase tracking-widest border-r-4 border-slate-900 pr-3">رؤية المحلل الذكي (AI Executive Insight)</h3>
                        <p className="text-[10.5px] font-bold text-slate-700 leading-relaxed text-justify">
                            بناءً على تحليل البيانات المجمعة، نلاحظ وفرة نوعية في تخصص <b>{topSpecialty}</b> بنسبة ملاءمة استراتيجية بلغت <b>{stats.suitabilityPct}</b>. يتميز السوق حالياً بتنافسية عالية في فئة خبرات <b>{topExpRange}</b>، مما يعطي "شهم" أفضلية في اختيار الكوادر الأكثر استقراراً وملاءمة لثقافة الشركة. نوصي بتسريع وتيرة المقابلات للمرشحين في هذه الفئة لضمان استقطاب النخبة قبل المنافسين.
                        </p>
                    </div>
                </div>

                <div className="report-section grid grid-cols-12 gap-3 mb-3">
                    <div className="col-span-4">
                        <DonutChart title="توزيع الجنسيات (٪)" data={analytics.nationalityData} isPrint />
                    </div>
                    <div className="col-span-4">
                        <BarChart title="سنوات الخبرة المهنية" data={analytics.experienceData} isPrint />
                    </div>
                    <div className="col-span-4 flex flex-col justify-center gap-2 px-4 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 p-3">
                        <h4 className="text-[11px] font-black text-slate-900 underline decoration-blue-500 decoration-2 underline-offset-4">التحليل الديموغرافي:</h4>
                        <ul className="text-[10px] font-bold text-slate-600 space-y-1.5 list-disc list-inside">
                            <li>الجنسية المهيمنة: <b>{topNationality}</b> (تتطلب موازنة استراتيجية).</li>
                            <li>توزيع الخبرات: يتركز العرض في فئة <b>{topExpRange}</b>.</li>
                            <li>بيئة العمل: التنوع الثقافي الحالي يعزز الابتكار الفني.</li>
                            <li>الاستقرار: فئة الخبرات المتوسطة تظهر أعلى درجات الولاء.</li>
                        </ul>
                    </div>
                </div>

                <div className="report-section mb-3">
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-9">
                            <BarChart title="كثافة التخصصات التقنية (Top 5 Specialties)" data={analytics.topSpecialties} horizontal isPrint />
                        </div>
                        <div className="col-span-3 p-3 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex flex-col justify-center">
                            <h4 className="text-[11px] font-black text-emerald-700 mb-1.5 underline underline-offset-4">ملاحظات التخصص:</h4>
                            <p className="text-[10px] font-bold text-slate-600 leading-relaxed text-justify">
                                يتصدر <b>{topSpecialty}</b> المشهد بوضوح. يجب توجيه فرق الاستقطاب للبحث النشط في التخصصات الأقل كثافة لسد الاحتياجات.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="report-section">
                    <div className="p-3 bg-slate-900 text-white rounded-[2rem] shadow-xl">
                        <h3 className="text-[11px] font-black mb-2 uppercase tracking-widest border-r-4 border-emerald-500 pr-3">التوصيات الاستراتيجية للموارد البشرية (Strategic HR Actions)</h3>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                            {[
                                { t: "تعزيز الاستقطاب النوعي", d: `التركيز على الكفاءات القيادية في تخصص ${topSpecialty}.` },
                                { t: "إدارة مخزون المواهب", d: "أرشفة المرشحين المميزين كـ 'مواهب جاهزة'." },
                                { t: "تحسين معايير القبول", d: "رفع درجة الملاءمة المطلوبة إلى 85% لضمان الجودة." },
                                { t: "تفعيل التقرير الرقمي", d: "استخدام مخرجات شهماوي كأساس في لجان التوظيف." }
                            ].map((rec, idx) => (
                                <div key={idx} className="flex items-start gap-2 border-r border-white/10 pr-3">
                                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0 shadow-[0_0_8px_#34d399]"></div>
                                    <p className="text-[10px] font-bold text-slate-200 leading-tight"><b className="text-white">{rec.t}:</b> {rec.d}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-auto pt-2 text-[8px] font-black text-slate-300 uppercase tracking-[0.5em] text-center border-t border-slate-50 flex justify-between items-center w-full">
                    <span>SHAHM CONTRACTING – AI TALENT REPORT ENGINE v6.0</span>
                    <span className="tracking-widest">AI TALENT ANALYTICS v6.0</span>
                    <span>PRODUCED BY SHAHM AI ENGINE</span>
                </div>
            </div>
        </div>
    );
};
