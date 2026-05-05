
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
    PrinterIcon,
    TagIcon
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
        <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between ${isPrint ? 'p-4 border-slate-300 shadow-none' : 'p-6 h-32'}`}>
            <div className="flex items-center justify-between mb-2">
                <span className={`${isPrint ? 'text-[9px]' : 'text-[10px]'} font-black text-slate-500 uppercase tracking-widest`}>{label}</span>
                <div className={`rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center ${isPrint ? 'w-6 h-6 p-1 bg-slate-100' : 'p-2'}`}>
                    <div className={isPrint ? 'text-slate-800' : ''}>
                        {icon}
                    </div>
                </div>
            </div>
            <div>
                <div className={`${isPrint ? 'text-2xl' : 'text-3xl'} font-black text-slate-900 tracking-tighter mb-1`}>{value}</div>
                <div className={`font-bold text-slate-400 leading-tight ${isPrint ? 'text-[8px]' : 'text-[9px]'}`}>{subtitle}</div>
            </div>
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
    <div className={`bg-white rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col ${isPrint ? 'p-4 border-slate-300 shadow-none' : 'p-6 h-[340px]'}`}>
      <h3 className={`font-black text-slate-900 uppercase tracking-widest border-r-4 border-blue-600 pr-3 ${isPrint ? 'text-[9px] mb-3' : 'text-xs mb-6'}`}>{title}</h3>
      
      <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className={`relative ${isPrint ? 'w-24 h-24' : 'w-40 h-40'} shrink-0`}>
            <svg viewBox="-1 -1 2 2" className={`w-full h-full -rotate-90 ${isPrint ? 'print-chart' : ''}`}>
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
                  return <path key={i} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.02" />;
                })
              )}
              <circle cx="0" cy="0" r="0.65" fill="white" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className={`${isPrint ? 'text-[12px]' : 'text-2xl'} font-black text-slate-900`}>{total}</span>
              <span className={`${isPrint ? 'text-[6px]' : 'text-[9px]'} font-bold text-slate-400 uppercase`}>مرشح</span>
            </div>
          </div>
      </div>

      <div className={`w-full space-y-2 mt-6 overflow-y-auto custom-scrollbar max-h-[100px] px-1`}>
        {data.map((item, i) => (
          <div key={i} className={`flex items-center justify-between font-bold ${isPrint ? 'text-[8px]' : 'text-[10px]'}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color, printColorAdjust: 'exact' }}></div>
              <span className="text-slate-600 truncate">{item.label}</span>
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
    <div className={`bg-white rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col ${isPrint ? 'p-4 border-slate-300 shadow-none' : 'p-6 h-[340px]'}`}>
      <h3 className={`font-black text-slate-900 uppercase tracking-widest border-r-4 border-emerald-500 pr-3 ${isPrint ? 'text-[9px] mb-3' : 'text-xs mb-6'}`}>{title}</h3>
      
      <div className={`flex-1 flex ${horizontal ? 'flex-col justify-center gap-3' : 'items-end justify-around gap-2'}`}>
        {data.map((item, i) => {
          const size = (item.value / max) * 100;
          if (horizontal) {
            return (
              <div key={i} className="space-y-1 w-full">
                <div className={`flex justify-between items-center font-black text-slate-500 ${isPrint ? 'text-[8px]' : 'text-[10px]'}`}>
                  <span className="truncate max-w-[180px]">{item.label}</span>
                  <span className="text-slate-900 bg-slate-100 px-1.5 rounded text-[9px]">{item.value}</span>
                </div>
                <div className={`${isPrint ? 'h-2' : 'h-2.5'} bg-slate-50 rounded-full overflow-hidden border border-slate-100`}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${size}%`, backgroundColor: item.color, printColorAdjust: 'exact' }}></div>
                </div>
              </div>
            );
          }
          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group">
              <div className={`w-full bg-slate-50 rounded-t-lg overflow-hidden relative border-x border-t border-slate-100 flex items-end transition-all duration-300 group-hover:bg-slate-100 ${isPrint ? 'h-full' : 'h-full'}`}>
                <div 
                  className="w-full transition-all duration-700 ease-out" 
                  style={{ height: `${size}%`, backgroundColor: item.color, printColorAdjust: 'exact' }}
                ></div>
                <span className={`absolute top-1 left-1/2 -translate-x-1/2 font-black text-slate-900 ${isPrint ? 'text-[7px]' : 'text-[10px]'}`}>{item.value}</span>
              </div>
              <span className={`font-black text-slate-400 text-center leading-tight uppercase tracking-tighter h-8 flex items-center justify-center w-full ${isPrint ? 'text-[7px]' : 'text-[9px]'}`}>{item.label}</span>
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
  const [filterNationality, setFilterNationality] = useState<string>('');
  const [filterKsaExp, setFilterKsaExp] = useState<'all' | 'under2' | '2-5' | 'above5'>('all');
  const [filterShortlist, setFilterShortlist] = useState<'all' | 'qualified' | 'notQualified'>('all');
  const [filterEvalStatus, setFilterEvalStatus] = useState<'all' | 'evaluated' | 'notEvaluated'>('all');
  const [filterStability, setFilterStability] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const specialties = useMemo(() => {
    const unique = new Set(candidates.map(c => c?.info?.specialty).filter(Boolean));
    return Array.from(unique).sort();
  }, [candidates]);

  const nationalities = useMemo(() => {
    const unique = new Set(candidates.map(c => c?.info?.nationality).filter(Boolean));
    return Array.from(unique).sort();
  }, [candidates]);

  const getNumFromStr = (raw?: string): number => {
    if (!raw) return -1;
    if (raw.includes('أقل من سنة')) return 0.5;
    const match = raw.match(/(\d+(\.\d+)?)/);
    return match ? parseFloat(match[1]) : -1;
  };

  const getStabilityLevel = (text?: string) => {
    if (!text) return 'unknown';
    if (text.includes('ممتاز') || text.includes('ممتازة')) return 'high';
    if (text.includes('جيد') || text.includes('جيدة')) return 'medium';
    if (text.includes('ضعيف') || text.includes('ضعيفة')) return 'low';
    return 'unknown';
  };

  const isSearchActive = !!(filterName.trim().length >= 3 || filterSpecialty || filterNationality || filterKsaExp !== 'all' || filterShortlist !== 'all' || filterEvalStatus !== 'all' || filterStability !== 'all');

  const filteredAndSortedCandidates = useMemo(() => {
    let result = [...candidates];
    
    if (filterName.trim()) {
      const q = filterName.toLowerCase().trim();
      result = result.filter(c => c?.info?.fullName?.toLowerCase().includes(q));
      
      result.sort((a, b) => {
        const aStarts = a?.info?.fullName?.toLowerCase().startsWith(q);
        const bStarts = b?.info?.fullName?.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return (a?.info?.fullName || '').localeCompare(b?.info?.fullName || '');
      });
    }

    if (filterSpecialty) result = result.filter(c => c?.info?.specialty === filterSpecialty);
    if (filterNationality) result = result.filter(c => c?.info?.nationality === filterNationality);
    if (filterKsaExp !== 'all') {
      result = result.filter(c => {
        const num = getNumFromStr(c?.info?.ksaExperience);
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
        const isQualified = qualifiedStatuses.includes(c?.status || '');
        return filterShortlist === 'qualified' ? isQualified : !isQualified;
      });
    }
    if (filterEvalStatus !== 'all') {
      result = result.filter(c => {
        const hasEval = !!c?.evaluation && ((c.evaluation.score || 0) > 0 || !!c.evaluation.finalEvaluation);
        return filterEvalStatus === 'evaluated' ? hasEval : !hasEval;
      });
    }
    if (filterStability !== 'all') {
      result = result.filter(c => getStabilityLevel(c?.info?.jobStability) === filterStability);
    }
    
    if (!filterName.trim() && sortOrder === 'highestScore') {
      result.sort((a, b) => (b.evaluation?.score || 0) - (a.evaluation?.score || 0));
    }
    
    return result;
  }, [candidates, sortOrder, filterName, filterSpecialty, filterNationality, filterKsaExp, filterShortlist, filterEvalStatus, filterStability]);

  const analytics = useMemo(() => {
    const targetData = isSearchActive ? filteredAndSortedCandidates : candidates;
    
    const natCounts: Record<string, number> = {};
    targetData.forEach(c => {
      const n = c?.info?.nationality || 'غير محدد';
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
    targetData.forEach(c => {
      const num = getNumFromStr(c?.info?.experienceYears);
      if (num < 2) expBands['0-2']++;
      else if (num <= 5) expBands['2-5']++;
      else if (num <= 10) expBands['5-10']++;
      else expBands['10+']++;
    });
    const experienceData = [
      { label: '0-2 سنوات', value: expBands['0-2'], color: '#3b82f6' },
      { label: '2-5 سنوات', value: expBands['2-5'], color: '#6366f1' },
      { label: '5-10 سنوات', value: expBands['5-10'], color: '#8b5cf6' },
      { label: 'أكثر من 10 سنوات', value: expBands['10+'], color: '#10b981' }
    ];

    const specCounts: Record<string, number> = {};
    targetData.forEach(c => {
      const s = c?.info?.specialty || 'غير محدد';
      specCounts[s] = (specCounts[s] || 0) + 1;
    });
    const topSpecialties = Object.entries(specCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, value]) => ({ label, value, color: '#4f46e5' }));

    return { nationalityData, experienceData, topSpecialties };
  }, [filteredAndSortedCandidates, candidates, isSearchActive]);

  const stats = useMemo(() => {
    const targetData = isSearchActive ? filteredAndSortedCandidates : candidates;
    const total = targetData.length;
    const qualifiedStatuses = ['جاري المقابلة', 'تمت المقابلة والتقييم', 'مناسب'];
    const shortlistedCount = targetData.filter(c => qualifiedStatuses.includes(c?.status || '')).length;
    const evaluationsWithScore = targetData.filter(c => c?.evaluation?.score !== undefined);
    const avgScoreNum = evaluationsWithScore.length ? Math.round(evaluationsWithScore.reduce((sum, c) => sum + (c.evaluation?.score || 0), 0) / evaluationsWithScore.length) : 0;
    const suitableCount = targetData.filter(c => (c?.status === 'مناسب') || (c?.analysis?.fitnessForShahm?.includes("مناسب جدًا"))).length;
    const suitabilityPctNum = total > 0 ? Math.round((suitableCount / total) * 100) : 0;
    return { 
      total, 
      shortlistedCount, 
      avgScoreNum,
      avgScore: `${avgScoreNum}%`, 
      suitabilityPctNum,
      suitabilityPct: `${suitabilityPctNum}%` 
    };
  }, [filteredAndSortedCandidates, candidates, isSearchActive]);

  const resetFilters = () => {
    setSortOrder('default');
    setFilterName('');
    setFilterSpecialty('');
    setFilterNationality('');
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
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20">
      <div className="text-center py-6 no-print">
        <h1 className="text-4xl font-black tracking-tighter relative inline-block">
          <span className="ai-text-shimmer neon-glow">شهماوي وظِّف لي</span>
          <div className="absolute -inset-1 blur-lg opacity-20 bg-blue-500 rounded-full animate-pulse"></div>
        </h1>
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-full"><DonutChart title="توزيع الجنسيات" data={analytics.nationalityData} /></div>
          <div className="h-full"><BarChart title="توزيع سنوات الخبرة" data={analytics.experienceData} /></div>
          <div className="h-full"><BarChart title="أكثر التخصصات تكرارًا" data={analytics.topSpecialties} horizontal={true} /></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 no-print">
        <div className="flex items-center gap-3 mb-2">
            <RobotIcon className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-black text-slate-900">محرك التصفية الذكي</h3>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
            <label className="text-[10px] font-black text-slate-400 mr-1 uppercase">البحث بالاسم (حرفي)</label>
            <input 
              type="text" 
              value={filterName} 
              onChange={(e) => setFilterName(e.target.value)} 
              placeholder="اكتب الاسم بدقة..." 
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
            <label className="text-[10px] font-black text-slate-400 mr-1 uppercase">الجنسية</label>
            <select value={filterNationality} onChange={(e) => setFilterNationality(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[140px]">
              <option value="">كل الجنسيات</option>
              {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
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
            <h2 className="text-xl font-black text-slate-900">تقييم المرشحين ({isSearchActive ? filteredAndSortedCandidates.length : 0})</h2>
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
                    {!isSearchActive ? (
                        <tr>
                            <td colSpan={6} className="p-24 text-center">
                                <div className="flex flex-col items-center gap-6 opacity-40">
                                    <RobotIcon className="w-16 h-16 text-slate-300" />
                                    <div className="space-y-2">
                                        <p className="text-slate-400 font-black text-lg">بانتظار تعليماتك يا بشمهندس...</p>
                                        <p className="text-slate-400 font-bold text-sm">يرجى استخدام محرك الفلترة الذكي أو البحث بالاسم لعرض أسماء المرشحين.</p>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    ) : filteredAndSortedCandidates.length === 0 ? (
                        <tr><td colSpan={6} className="p-20 text-center text-slate-400 font-bold italic"><div className="flex flex-col items-center gap-4 opacity-40"><AlertIcon className="w-12 h-12" /><span>لا توجد سير ذاتية مطابقة لمعايير البحث الحالية.</span></div></td></tr>
                    ) : (
                        filteredAndSortedCandidates.map(c => {
                            const hasInterviewed = c?.evaluation && ((c.evaluation.score || 0) > 0 || !!c.evaluation.finalEvaluation);
                            return (
                                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-6">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 text-sm">{c?.info?.fullName || 'غير معروف'}</span>
                                                {hasInterviewed && (
                                                    <span className="bg-emerald-100 text-emerald-700 text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">تمت المقابلة</span>
                                                )}
                                            </div>
                                            <div className="text-[10px] text-slate-400 mt-1 font-mono">#{c.id.split('-')[0]}</div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <div className="text-xs font-bold text-slate-600">{c?.info?.jobTitle || 'غير محدد'}</div>
                                        <div className="text-[9px] text-slate-400 font-black mt-1 uppercase tracking-widest">{c?.info?.specialty || 'غير محدد'}</div>
                                    </td>
                                    <td className="p-6"><div className="text-xs font-black text-slate-700">{c?.info?.ksaExperience || 'غير متوفر'}</div></td>
                                    <td className="p-6">
                                        {c?.evaluation?.score !== undefined && c.evaluation.score > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-600" style={{ width: `${c.evaluation.score}%` }}></div></div>
                                                <span className="text-xs font-black text-slate-900">{c.evaluation.score}%</span>
                                            </div>
                                        ) : <span className="text-[10px] text-slate-300 italic">بدون تقييم</span>}
                                    </td>
                                    <td className="p-6">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg border ${['جاري المقابلة', 'تمت المقابلة والتقييم', 'مناسب'].includes(c?.status || '') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                            {c?.status === 'Under Review' ? 'قيد المراجعة' : (c?.status || 'مراجعة')}
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
                        })
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
                        <span className="text-sm font-bold text-blue-600">{candidate?.info?.fullName || 'مرشح'}</span>
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
                        <span className="text-xs font-bold text-slate-500 mt-1">أسئلة مقابلة المرشح: {candidate?.info?.fullName || 'مرشح'}</span>
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
                            <span className="text-sm font-bold text-slate-500 mt-1">{candidate?.info?.fullName || 'مرشح'} (التخصص: {candidate?.info?.specialty || 'غير محدد'})</span>
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
    const evalData = candidate?.evaluation;

    return (
        <div className="fixed inset-0 z-[300] bg-white overflow-y-auto" dir="rtl">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .print-container { padding: 0 !important; width: 100% !important; }
                    @page { size: A4; margin: 15mm; }
                }
            `}</style>
            
            <div className="max-w-4xl mx-auto p-8 print-container">
                <div className="flex justify-between items-center mb-10 no-print border-b border-slate-100 pb-4">
                    <button onClick={onClose} className="text-slate-400 font-black text-xs uppercase hover:text-slate-900 transition-colors">← إغلاق التقرير</button>
                    <button onClick={handlePrint} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-slate-800 transition-all">
                        <PrinterIcon className="w-4 h-4" />
                        <span>طباعة التقرير</span>
                    </button>
                </div>

                <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1">تقرير نتيجة مقابلة</h1>
                        <p className="text-xs font-bold text-slate-400 tracking-widest uppercase">SHAHM CONTRACTING - INTERVIEW REPORT</p>
                    </div>
                    <div className="text-left ltr">
                        <div className="text-xl font-black text-slate-900">SHAHM</div>
                        <div className="text-[8px] font-black text-slate-400">ENGINEERING EXCELLENCE</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-100 py-2">
                            <span className="text-xs font-black text-slate-400">اسم المرشح:</span>
                            <span className="text-sm font-black text-slate-900">{candidate?.info?.fullName || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 py-2">
                            <span className="text-xs font-black text-slate-400">التخصص:</span>
                            <span className="text-sm font-black text-slate-900">{candidate?.info?.specialty || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 py-2">
                            <span className="text-xs font-black text-slate-400">الوظيفة المتقدم لها:</span>
                            <span className="text-sm font-black text-slate-900">{candidate?.info?.jobTitle || '-'}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between border-b border-slate-100 py-2">
                            <span className="text-xs font-black text-slate-400">تاريخ المقابلة:</span>
                            <span className="text-sm font-black text-slate-900">{evalData?.interviewDate || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 py-2">
                            <span className="text-xs font-black text-slate-400">اسم المحاور:</span>
                            <span className="text-sm font-black text-slate-900">{evalData?.interviewerName || '-'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 py-2">
                            <span className="text-xs font-black text-slate-400">نتيجة الفحص الطبي:</span>
                            <span className={`text-sm font-black ${evalData?.recruitmentDoctorPass ? 'text-emerald-600' : 'text-red-600'}`}>
                                {evalData?.recruitmentDoctorPass === true ? 'اجتاز' : evalData?.recruitmentDoctorPass === false ? 'لم يجتاز' : 'قيد الانتظار'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 mb-10 text-center">
                    <div className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي درجة التقييم</div>
                    <div className="text-6xl font-black text-slate-900">{evalData?.score || 0}%</div>
                    <div className="mt-4 flex justify-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">HR</span>
                            <span className="text-lg font-black">{evalData?.hrScore || 0}/75</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Technical</span>
                            <span className="text-lg font-black">{evalData?.techScore || 0}/75</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase">Final</span>
                            <span className="text-lg font-black">{evalData?.finalScore || 0}/75</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 mb-20">
                    <div className="space-y-2">
                        <h3 className="text-sm font-black text-slate-900 border-r-4 border-slate-900 pr-3">مرئيات الموارد البشرية (HR Feedback)</h3>
                        <p className="p-4 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 leading-relaxed min-h-[60px]">{evalData?.hrEvaluation || '-'}</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-black text-slate-900 border-r-4 border-slate-900 pr-3">التقييم الفني (Technical Evaluation)</h3>
                        <p className="p-4 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 leading-relaxed min-h-[60px]">{evalData?.technicalEvaluation || '-'}</p>
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-sm font-black text-slate-900 border-r-4 border-slate-900 pr-3">التوصية النهائية والقرار (Final Decision)</h3>
                        <p className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-xl text-xs font-black text-slate-900 leading-relaxed min-h-[60px]">{evalData?.finalEvaluation || '-'}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-10 mt-20 pt-10 border-t border-slate-200 text-center">
                    <div className="space-y-8">
                        <div className="text-xs font-black text-slate-400">توقيع الموارد البشرية</div>
                        <div className="h-px bg-slate-200 mx-4"></div>
                        <div className="text-[10px] font-bold text-slate-300">التاريخ: .....................</div>
                    </div>
                    <div className="space-y-8">
                        <div className="text-xs font-black text-slate-400">توقيع المسؤول الفني</div>
                        <div className="h-px bg-slate-200 mx-4"></div>
                        <div className="text-[10px] font-bold text-slate-300">التاريخ: .....................</div>
                    </div>
                    <div className="space-y-8">
                        <div className="text-xs font-black text-slate-400">اعتماد الإدارة العليا</div>
                        <div className="h-px bg-slate-200 mx-4"></div>
                        <div className="text-[10px] font-bold text-slate-300">التاريخ: .....................</div>
                    </div>
                </div>

                <div className="mt-20 text-center opacity-30">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em]">Internal Document • Confidential • Shahm Contracting Co.</p>
                </div>
            </div>
        </div>
    );
};

const DashboardExportView = ({ stats, analytics, specialties, onClose }: { stats: any, analytics: any, specialties: string[], onClose: () => void }) => {
    const handlePrint = () => window.print();

    const topNationality = analytics?.nationalityData?.[0]?.label || "غير محدد";
    const topSpecialty = analytics?.topSpecialties?.[0]?.label || "عام";
    const hiringHealth = stats?.avgScoreNum > 60 ? "ممتازة" : stats?.avgScoreNum > 40 ? "جيدة" : "تحتاج تحسين";

    return (
        <div className="fixed inset-0 z-[300] bg-white overflow-y-auto" dir="rtl">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
                    .print-container { padding: 0 !important; width: 100% !important; margin: 0 !important; }
                    @page { size: A4 landscape; margin: 10mm; }
                    .print-chart { max-width: 150px !important; margin: 0 auto; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
            
            <div className="max-w-6xl mx-auto p-10 print-container">
                <div className="flex justify-between items-center mb-10 no-print border-b border-slate-100 pb-4">
                    <button onClick={onClose} className="text-slate-400 font-black text-xs uppercase hover:text-slate-900 transition-colors">← إغلاق لوحة التصدير</button>
                    <button onClick={handlePrint} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-xl hover:bg-emerald-700 transition-all">
                        <PrinterIcon className="w-4 h-4" />
                        <span>طباعة لوحة المؤشرات (PDF)</span>
                    </button>
                </div>

                <div className="flex justify-between items-start mb-10 border-b-2 border-slate-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1">لوحة مؤشرات التوظيف الذكي</h1>
                        <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">SHAHM AI - RECRUITMENT KPI DASHBOARD</p>
                    </div>
                    <div className="text-left">
                        <div className="text-sm font-black text-slate-300">التاريخ: {new Date().toLocaleDateString('ar-EG')}</div>
                        <div className="text-sm font-black text-slate-300">الإصدار: v6.5</div>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-10">
                    <KPICard label="إجمالي السير" value={stats?.total || 0} subtitle="مرشح مسجل" icon={<ChartIcon />} isPrint={true} />
                    <KPICard label="مؤهل للمقابلة" value={stats?.shortlistedCount || 0} subtitle="مرشح في القائمة" icon={<ClockIcon />} isPrint={true} />
                    <KPICard label="متوسط التقييم" value={stats?.avgScore || '0%'} subtitle="بناءً على النتائج" icon={<ShieldIcon />} isPrint={true} />
                    <KPICard label="نسبة الكفاءة" value={stats?.suitabilityPct || '0%'} subtitle="توصية شهماوي" icon={<CheckCircleIcon />} isPrint={true} />
                </div>

                <div className="grid grid-cols-3 gap-6 mb-10">
                    <DonutChart title="توزيع الجنسيات" data={analytics?.nationalityData || []} isPrint={true} />
                    <BarChart title="توزيع سنوات الخبرة" data={analytics?.experienceData || []} isPrint={true} />
                    <BarChart title="أكثر التخصصات تكراراً" data={analytics?.topSpecialties || []} horizontal={true} isPrint={true} />
                </div>

                <div className="grid grid-cols-2 gap-8 mb-10">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-200 pb-2">
                             <RobotIcon className="w-4 h-4 text-blue-600" />
                             التحليل الذكي (AI Insights)
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                                    القوة العاملة المهيمنة حالياً من الجنسية <span className="text-slate-900 font-black">({topNationality})</span>، مما يشير إلى نمط استقطاب محدد قد يحتاج للتنويع.
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                                    أعلى تخصص متوفر في قاعدة البيانات هو <span className="text-slate-900 font-black">({topSpecialty})</span>، مما يعزز الجاهزية للمشاريع ذات الطابع بهذا التخصص.
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                                    صحة التوظيف العامة (Recruitment Health): <span className={`font-black ${(stats?.avgScoreNum || 0) > 50 ? 'text-emerald-600' : 'text-amber-600'}`}>{hiringHealth}</span> بناءً على متوسط التقييمات الحالية.
                                </p>
                            </li>
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                             <BriefcaseIcon className="w-4 h-4 text-emerald-600" />
                             توصيات استراتيجية (Strategy)
                        </h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                                    ينصح بالتركيز على استقطاب كفاءات في التخصصات النادرة لزيادة التنوع الفني في المشاريع القادمة.
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                                    زيادة عدد المقابلات للمرشحين ذوي الخبرة "أكثر من 5 سنوات" لرفع جودة المشاريع الكبرى وتقليل المخاطر.
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                                    تسريع إجراءات التعيين للمرشحين الحاصلين على تقييم أعلى من 75% لضمان عدم تسربهم للمنافسين.
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center">
                    <div className="flex gap-10">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase mb-1">عدد التخصصات</span>
                            <span className="text-sm font-black">{specialties?.length || 0}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-slate-400 uppercase mb-1">سرعة التوظيف</span>
                            <span className="text-sm font-black text-emerald-600">High Velocity</span>
                        </div>
                    </div>
                    <div className="text-left">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-[0.4em]">Shahm Contracting Co. • Talent Acquisition Unit</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
