
import React, { useState, useMemo } from 'react';
import { CandidateData, AppView, CandidateStatus } from '../types';
import { UserIcon, BriefcaseIcon, CheckCircleIcon, RefreshIcon, ClockIcon, RobotIcon, TagIcon, ChartIcon, ScaleIcon, UploadIcon } from './Icons';
import { rankCandidates } from '../services/geminiService';

interface DashboardProps {
  candidates: CandidateData[];
  onViewCandidate: (c: CandidateData) => void;
  onCompare: (cs: CandidateData[]) => void;
  onDelete: (ids: string[]) => void;
  onUpdateStatus: (ids: string[], status: CandidateStatus) => void;
  onNavigate: (view: AppView) => void;
  onExport: () => void;
  onRefresh: () => void;
  aiSearchQuery: string;
  setAiSearchQuery: (s: string) => void;
  aiRankedIds: string[] | null;
  setAiRankedIds: (ids: string[] | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    candidates, onViewCandidate, onDelete, onUpdateStatus, onNavigate, onExport, onRefresh, onCompare,
    aiSearchQuery, setAiSearchQuery, aiRankedIds, setAiRankedIds
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filterNationality, setFilterNationality] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStability, setFilterStability] = useState('');
  const [filterSource, setFilterSource] = useState('');

  const specialties = ["مدني", "معماري", "كهرباء", "ميكانيكا", "زراعة", "اداري", "مراقب", "مالية", "تكنولوجيا المعلومات", "رسام", "موارد بشرية", "سلسلة امداد"];
  const nationalities = useMemo(() => Array.from(new Set(candidates.map(c => c?.info?.nationality))).filter(Boolean), [candidates]);

  const statusOptions: CandidateStatus[] = [
    'Under Review',
    'غير مناسب',
    'مرشح للعمل كفري لانسر',
    'تمت المقابلة والتقييم',
    'جاري المقابلة',
    'مناسب',
    'تم الرد (فحص أولي)'
  ];

  const getStabilityLevel = (text?: string) => {
    if (!text) return 'unknown';
    if (text.includes('ممتاز') || text.includes('ممتازة')) return 'high';
    if (text.includes('جيد') || text.includes('جيدة')) return 'medium';
    if (text.includes('ضعيف') || text.includes('ضعيفة')) return 'low';
    return 'unknown';
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = aiSearchQuery.trim();
    if (!query) { 
      setAiRankedIds(null); 
      return; 
    }

    const literalMatches = candidates
        .filter(c => c?.info?.fullName?.toLowerCase().includes(query.toLowerCase()))
        .sort((a, b) => {
            const aName = a?.info?.fullName?.toLowerCase() || '';
            const bName = b?.info?.fullName?.toLowerCase() || '';
            const aStarts = aName.startsWith(query.toLowerCase());
            const bStarts = bName.startsWith(query.toLowerCase());
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return 0;
        })
        .map(c => c.id);

    if (literalMatches.length > 0 && query.length <= 15) {
        setAiRankedIds(literalMatches);
        setFilterNationality('');
        setFilterSpecialty('');
        setFilterStatus('');
        setFilterStability('');
        return;
    }

    setIsAiSearching(true);
    setFilterNationality('');
    setFilterSpecialty('');
    setFilterStatus('');
    setFilterStability('');
    
    try {
        const ids = await rankCandidates(candidates, query);
        if (ids && ids.length > 0) {
          setAiRankedIds(ids);
        } else {
          setErrorMsg("لم يعثر شهماوي على نتائج مطابقة.");
          setTimeout(() => setErrorMsg(null), 3000);
          setAiRankedIds(null);
        }
    } catch (err: any) { 
        console.error(err); 
        setErrorMsg(err.message === "API Key is missing" 
          ? "مفتاح API الخاص بـ Gemini مفقود في إعدادات الخادم (Nesting Environment)." 
          : "حدث خطأ في محرك البحث الذكي.");
        setTimeout(() => setErrorMsg(null), 3000);
    } finally { 
        setIsAiSearching(false); 
    }
  };

  const handleCompareClick = () => {
    if (selectedIds.length < 2) {
      setErrorMsg("يرجى اختيار مرشحين اثنين على الأقل للمقارنة.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const selectedCandidates = candidates.filter(c => selectedIds.includes(c.id));
    const firstSpecialty = selectedCandidates[0]?.info?.specialty;
    const sameSpecialty = selectedCandidates.every(c => c?.info?.specialty === firstSpecialty);

    if (!sameSpecialty) {
      setErrorMsg("عذراً بشمهندس، لا يمكن مقارنة تخصصات مختلفة. يرجى اختيار مرشحين من نفس التخصص.");
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    onCompare(selectedCandidates);
  };

  const formatPhoneForCsv = (phone?: string) => {
      if (!phone) return '';
      let cleaned = phone.replace(/\D/g, '');
      if (cleaned.startsWith('05')) {
          cleaned = '009665' + cleaned.substring(2);
      } else if (cleaned.startsWith('5') && cleaned.length === 9) {
          cleaned = '00966' + cleaned;
      } else if (cleaned.startsWith('966')) {
          cleaned = '00' + cleaned;
      } else if (!cleaned.startsWith('00')) {
          if (cleaned.length >= 9) cleaned = '00966' + cleaned.slice(-9);
      }
      return cleaned;
  };

  const isSearchActive = !!(filterNationality || filterSpecialty || filterStatus || filterStability || filterSource || (aiRankedIds && aiRankedIds.length > 0) || aiSearchQuery.trim().length >= 3);

  const handleExportCsvInternal = () => {
    const dataToExport = isSearchActive ? displayedCandidates : candidates;

    if (dataToExport.length === 0) {
        alert("لا توجد بيانات لتصديرها.");
        return;
    }

    const headers = ["الاسم الكامل", "المسمى الوظيفي", "التخصص", "الجنسية", "سنوات الخبرة", "رقم الجوال", "البريد الإلكتروني", "الحالة", "تاريخ الرفع"];
    
    const rows = dataToExport.map(c => [
        c?.info?.fullName || '',
        c?.info?.jobTitle || '',
        c?.info?.specialty || '',
        c?.info?.nationality || '',
        c?.info?.experienceYears || '',
        formatPhoneForCsv(c?.info?.phone),
        c?.info?.email || '',
        (c?.status === 'Under Review' ? 'قيد المراجعة' : c?.status) || '',
        c?.uploadDate || ''
    ]);

    let csvContent = "\uFEFF"; 
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
        csvContent += row.map(cell => `"${cell || ''}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Shahm_Candidates_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayedCandidates = useMemo(() => {
    const query = aiSearchQuery.trim().toLowerCase();
    
    if (!isSearchActive) {
      return [];
    }

    if (aiRankedIds && aiRankedIds.length > 0) {
        return aiRankedIds.map(id => candidates.find(c => c.id === id)).filter(Boolean) as CandidateData[];
    }

    if (query.length >= 3 && !aiRankedIds) {
        return candidates
            .filter(c => c?.info?.fullName?.toLowerCase().includes(query))
            .sort((a, b) => {
                const aName = a?.info?.fullName?.toLowerCase() || '';
                const bName = b?.info?.fullName?.toLowerCase() || '';
                const aStarts = aName.startsWith(query);
                const bStarts = bName.startsWith(query);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return 0;
            });
    }

    let filtered = candidates;
    if (filterNationality) filtered = filtered.filter(c => c?.info?.nationality === filterNationality);
    if (filterSpecialty) filtered = filtered.filter(c => c?.info?.specialty === filterSpecialty);
    if (filterStatus) filtered = filtered.filter(c => c?.status === filterStatus);
    if (filterStability) filtered = filtered.filter(c => getStabilityLevel(c?.info?.jobStability) === filterStability);
    if (filterSource) filtered = filtered.filter(c => filterSource === 'portal' ? c?.source === 'portal' : c?.source !== 'portal');
    
    return filtered;
  }, [candidates, filterNationality, filterSpecialty, filterStatus, filterStability, filterSource, aiRankedIds, isSearchActive, aiSearchQuery]);

  const getStatusStyle = (status?: CandidateStatus) => {
      switch (status) {
          case 'مناسب': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
          case 'غير مناسب': return 'bg-red-50 text-red-700 border-red-100';
          case 'مرشح للعمل كفري لانسر': return 'bg-purple-50 text-purple-700 border-purple-100';
          case 'جاري المقابلة': return 'bg-amber-50 text-amber-700 border-amber-100';
          case 'تمت المقابلة والتقييم': return 'bg-blue-50 text-blue-700 border-blue-100';
          case 'تم الرد (فحص أولي)': return 'bg-cyan-50 text-cyan-700 border-cyan-100';
          default: return 'bg-slate-50 text-slate-500 border-slate-200';
      }
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      <style>{`
        @media print {
            body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-header { display: flex !important; justify-content: flex-end !important; margin-bottom: 1.5rem !important; width: 100% !important; }
            .print-logo { height: 80px !important; width: auto !important; }
            @page { size: A4 portrait; margin: 10mm; }
            /* Force grid for print */
            .print-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; gap: 1rem !important; }
            .break-inside-avoid { break-inside: avoid !important; }
            .shadow-sm, .shadow-lg { box-shadow: none !important; }
        }
        .print-header { display: none; }
      `}</style>

      {/* Print Header */}
      <div className="print-header">
          <img src="https://i.postimg.cc/ncjVcLhs/Whats-App-Image-2026-01-21-at-4-14-40-PM.jpg" alt="Shahm Logo" className="print-logo" referrerPolicy="no-referrer" />
      </div>

      {errorMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-8 py-4 rounded-2xl shadow-2xl font-black text-sm animate-fade-in">
          {errorMsg}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="ai-glow-wrapper w-full max-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
              <h3 className="text-xl font-black mb-4 text-slate-900">حذف السجلات؟</h3>
              <p className="text-slate-500 mb-6 text-sm">سيتم حذف {selectedIds.length} مرشح نهائياً.</p>
              <div className="flex gap-3">
                <button onClick={() => { onDelete(selectedIds); setSelectedIds([]); setShowDeleteConfirm(false); }} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl">تأكيد</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold">إلغاء</button>
              </div>
          </div>
        </div>
      )}

      <div className="ai-glow-wrapper no-print">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[1.4rem] border border-slate-100 shadow-xl">
              <form onSubmit={handleAiSearch} className="relative mb-5">
                  <input 
                    type="text" 
                    value={aiSearchQuery} 
                    onChange={(e) => { 
                        setAiSearchQuery(e.target.value); 
                        if (aiRankedIds) setAiRankedIds(null);
                    }} 
                    placeholder='مثال: ابحث بالاسم أو "مهندس مدني 5 سنوات خبرة"...' 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-12 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-600"><RobotIcon className="w-6 h-6" /></div>
                  <button type="submit" disabled={isAiSearching} className={`absolute left-2 top-1/2 -translate-y-1/2 px-6 py-2 rounded-xl text-white font-black text-sm transition-all shadow-lg ${isAiSearching ? 'bg-slate-400' : 'ai-btn-phosphor'}`}>
                      {isAiSearching ? 'جاري التحليل...' : 'شهماوي، ابحث لي'}
                  </button>
              </form>
              <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">تصفية النتائج:</span>
                  <select value={filterSpecialty} onChange={(e) => { setFilterSpecialty(e.target.value); setAiRankedIds(null); }} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none">
                    <option value="">كل التخصصات</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={filterNationality} onChange={(e) => { setFilterNationality(e.target.value); setAiRankedIds(null); }} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none">
                    <option value="">كل الجنسيات</option>
                    {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setAiRankedIds(null); }} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none">
                    <option value="">كل الحالات</option>
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt === 'Under Review' ? 'قيد المراجعة' : opt}</option>)}
                  </select>
                  <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setAiRankedIds(null); }} className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none">
                    <option value="">طريقة الرفع (الكل)</option>
                    <option value="portal">المتقدم نفسه (QR/رابط)</option>
                    <option value="manual">موظف الشركة</option>
                  </select>
                  <select 
                    value={filterStability} 
                    onChange={(e) => { setFilterStability(e.target.value); setAiRankedIds(null); }} 
                    className={`bg-white border rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none transition-all ${
                      filterStability === 'high' ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 text-emerald-700' :
                      filterStability === 'low' ? 'border-red-500 ring-1 ring-red-500 bg-red-50 text-red-700' :
                      'border-slate-200'
                    }`}
                  >
                    <option value="">مؤشر الاستقرار (الكل)</option>
                    <option value="high">🟢 استقرار عالي (ممتاز)</option>
                    <option value="medium">🟡 استقرار متوسط (جيد)</option>
                    <option value="low">🔴 استقرار منخفض (خطر)</option>
                  </select>
                  <button onClick={() => {setFilterNationality(''); setFilterSpecialty(''); setFilterStatus(''); setFilterStability(''); setAiRankedIds(null); setAiSearchQuery('');}} className="text-red-500 text-[10px] font-black hover:underline uppercase px-2">إعادة تعيين</button>
              </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm gap-4">
          <h2 className="text-xl font-black text-slate-900">إدارة الكفاءات ({isSearchActive ? displayedCandidates.length : candidates.length})</h2>
          <div className="flex flex-wrap gap-2 items-center no-print">
            {selectedIds.length > 1 && (
              <button 
                onClick={handleCompareClick} 
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-indigo-600/20 flex items-center gap-2 hover:bg-indigo-700 transition-all"
              >
                <ScaleIcon className="w-4 h-4" />
                <span>مقارنة المختار ({selectedIds.length})</span>
              </button>
            )}
            
            {selectedIds.length > 0 && <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl text-xs font-black border border-red-100">حذف المختار</button>}
            
            <button onClick={handleExportCsvInternal} className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-black hover:bg-blue-100 transition-colors">
                <ChartIcon className="w-4 h-4" />
                <span>تصدير البيانات (CSV)</span>
            </button>

            <button onClick={onRefresh} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100"><RefreshIcon className="w-4 h-4 text-slate-500" /></button>
          </div>
      </div>

      {/* Select All Bar */}
      {displayedCandidates.length > 0 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-4 no-print">
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
              onChange={(e) => setSelectedIds(e.target.checked ? displayedCandidates.map(c => c.id) : [])} 
              checked={selectedIds.length === displayedCandidates.length && displayedCandidates.length > 0} 
            />
            <span className="text-sm font-bold text-slate-700">تحديد الكل ({displayedCandidates.length})</span>
          </label>
        </div>
      )}

      {/* Candidates Grid */}
      {displayedCandidates.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-24 text-center shadow-sm">
            <div className="flex flex-col items-center gap-6 opacity-40">
                <RobotIcon className="w-16 h-16 text-slate-300" />
                <div className="space-y-2">
                    <p className="text-slate-400 font-black text-lg">
                        {!isSearchActive 
                          ? "بانتظار تعليماتك يا بشمهندس..." 
                          : "لم يتم العثور على نتائج مطابقة."}
                    </p>
                    <p className="text-slate-400 font-bold text-sm">
                        {!isSearchActive 
                          ? "يرجى استخدام محرك شهماوي أو الفلاتر أعلاه." 
                          : "جرب تغيير كلمات البحث أو الفلاتر."}
                    </p>
                </div>
            </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 print-grid">
          {displayedCandidates.map(c => {
              const isAiRanked = aiRankedIds?.includes(c.id);
              const stabilityLevel = getStabilityLevel(c?.info?.jobStability);
              const stabilityDotColor = 
                  stabilityLevel === 'high' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                  stabilityLevel === 'medium' ? 'bg-amber-400' : 
                  stabilityLevel === 'low' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
                  'bg-slate-200';
              
              const hasPrescreen = !!c.preScreening;

              return (
                <div key={c.id} className={`relative bg-white rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg p-6 flex flex-col gap-5 break-inside-avoid ${isAiRanked ? 'border-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.08)]' : 'border-slate-200 shadow-sm'}`}>
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-black shrink-0 ${isAiRanked ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600'}`}>
                        {c?.info?.fullName?.charAt(0) || '?'}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                          {c?.info?.fullName || 'غير معروف'}
                          {isAiRanked && <RobotIcon className="w-4 h-4 text-blue-600" title="موصى به من الذكاء الاصطناعي" />}
                        </h3>
                        <p className="text-xs text-slate-500 font-bold mt-0.5">{c?.info?.jobTitle || 'غير محدد'}</p>
                      </div>
                    </div>
                    <input type="checkbox" className="w-5 h-5 rounded border-slate-300 cursor-pointer shrink-0 no-print" checked={selectedIds.includes(c.id)} onChange={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id])} />
                  </div>

                  {/* Divider */}
                  <div className="h-px w-full bg-slate-100"></div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <BriefcaseIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold truncate">{c?.info?.experienceYears || '0'} سنوات خبرة</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold truncate">{c?.info?.nationality || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <TagIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold truncate">{c?.info?.specialty || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <ClockIcon className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-bold truncate" dir="ltr">{c.uploadDate}</span>
                    </div>
                  </div>

                  {/* Badges / Status */}
                  <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      <div className={`w-2 h-2 rounded-full ${stabilityDotColor}`} title={`الاستقرار: ${c?.info?.jobStability || 'غير محدد'}`}></div>
                      <span className="text-[10px] text-slate-500 font-bold">استقرار الوظيفة</span>
                    </div>
                    {hasPrescreen && <span className="bg-cyan-50 text-cyan-700 border border-cyan-100 text-[10px] px-2.5 py-1 rounded-md font-black">تم الرد</span>}
                    {c.source === 'portal' && <span className="bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100 text-[10px] px-2.5 py-1 rounded-md font-black flex items-center gap-1"><UploadIcon className="w-3 h-3" /> تم الرفع عبر QR</span>}
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center gap-3 mt-2 pt-4 border-t border-slate-100 no-print">
                    <select 
                        value={c.status} 
                        onChange={(e) => onUpdateStatus([c.id], e.target.value as CandidateStatus)}
                        className={`flex-1 text-[11px] font-black px-2 py-2.5 rounded-xl border outline-none transition-all cursor-pointer text-center ${getStatusStyle(c.status)}`}
                    >
                        {statusOptions.map(opt => (
                            <option key={opt} value={opt} className="bg-white text-slate-900 text-right">{opt === 'Under Review' ? 'قيد المراجعة' : opt}</option>
                        ))}
                    </select>
                    {c.cvUrl && (
                        <button onClick={() => window.open(c.cvUrl, '_blank')} className="p-2.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl transition-colors border border-amber-100" title="عرض السيرة الذاتية">
                            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </button>
                    )}
                    <button onClick={() => onViewCandidate(c)} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-black py-2.5 rounded-xl transition-colors shadow-md shadow-slate-900/10">
                      التفاصيل الكاملة
                    </button>
                  </div>
                </div>
              );
          })}
        </div>
      )}
    </div>
  );
};
