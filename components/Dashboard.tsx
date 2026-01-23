
import React, { useState, useMemo } from 'react';
import { CandidateData, AppView, CandidateStatus } from '../types';
import { UserIcon, BriefcaseIcon, CheckCircleIcon, RefreshIcon, ClockIcon, RobotIcon, TagIcon, ChartIcon, ScaleIcon } from './Icons';
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
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    candidates, onViewCandidate, onDelete, onUpdateStatus, onNavigate, onExport, onRefresh, onCompare
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiRankedIds, setAiRankedIds] = useState<string[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filterNationality, setFilterNationality] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStability, setFilterStability] = useState('');

  const specialties = ["مدني", "معماري", "كهرباء", "ميكانيكا", "زراعة", "اداري", "مراقب", "مالية", "تكنولوجيا المعلومات", "رسام", "موارد بشرية", "سلسلة امداد"];
  const nationalities = useMemo(() => Array.from(new Set(candidates.map(c => c.info.nationality))).filter(Boolean), [candidates]);

  const statusOptions: CandidateStatus[] = [
    'Under Review',
    'غير مناسب',
    'مرشح للعمل كفري لانسر',
    'تمت المقابلة والتقييم',
    'جاري المقابلة',
    'مناسب',
    'تم الرد (فحص أولي)'
  ];

  const getStabilityLevel = (text: string) => {
    if (!text) return 'unknown';
    if (text.includes('ممتاز') || text.includes('ممتازة')) return 'high';
    if (text.includes('جيد') || text.includes('جيدة')) return 'medium';
    if (text.includes('ضعيف') || text.includes('ضعيفة')) return 'low';
    return 'unknown';
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) { 
      setAiRankedIds(null); 
      return; 
    }
    setIsAiSearching(true);
    // Clear other filters to show AI results clearly
    setFilterNationality('');
    setFilterSpecialty('');
    setFilterStatus('');
    setFilterStability('');
    
    try {
        const ids = await rankCandidates(candidates, aiSearchQuery);
        if (ids && ids.length > 0) {
          setAiRankedIds(ids);
        } else {
          setErrorMsg("لم يعثر شهماوي على نتائج مطابقة.");
          setTimeout(() => setErrorMsg(null), 3000);
          setAiRankedIds(null);
        }
    } catch (err) { 
        console.error(err); 
        setErrorMsg("حدث خطأ في محرك البحث الذكي.");
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
    const firstSpecialty = selectedCandidates[0].info.specialty;
    const sameSpecialty = selectedCandidates.every(c => c.info.specialty === firstSpecialty);

    if (!sameSpecialty) {
      setErrorMsg("عذراً بشمهندس، لا يمكن مقارنة تخصصات مختلفة. يرجى اختيار مرشحين من نفس التخصص (مثال: مدني مع مدني).");
      setTimeout(() => setErrorMsg(null), 5000);
      return;
    }

    onCompare(selectedCandidates);
  };

  // Standardize phone format for CSV
  const formatPhoneForCsv = (phone: string) => {
      if (!phone) return '';
      // Remove all non-digits
      let cleaned = phone.replace(/\D/g, '');
      
      // If it starts with 05 (KSA local), replace with 009665
      if (cleaned.startsWith('05')) {
          cleaned = '009665' + cleaned.substring(2);
      } else if (cleaned.startsWith('5') && cleaned.length === 9) {
          cleaned = '00966' + cleaned;
      } else if (cleaned.startsWith('966')) {
          cleaned = '00' + cleaned;
      } else if (!cleaned.startsWith('00')) {
          // Default to 00966 if suspecting Saudi number without prefix
          if (cleaned.length >= 9) cleaned = '00966' + cleaned.slice(-9);
      }
      
      return cleaned;
  };

  const handleExportCsvInternal = () => {
    if (displayedCandidates.length === 0) {
        alert("لا توجد بيانات لتصديرها.");
        return;
    }

    const headers = ["الاسم الكامل", "المسمى الوظيفي", "التخصص", "الجنسية", "سنوات الخبرة", "رقم الجوال", "البريد الإلكتروني", "الحالة", "تاريخ الرفع"];
    
    const rows = displayedCandidates.map(c => [
        c.info.fullName,
        c.info.jobTitle,
        c.info.specialty,
        c.info.nationality,
        c.info.experienceYears,
        formatPhoneForCsv(c.info.phone),
        c.info.email,
        c.status === 'Under Review' ? 'قيد المراجعة' : c.status,
        c.uploadDate
    ]);

    // Construct CSV content with BOM for Arabic support in Excel
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
    if (aiRankedIds && aiRankedIds.length > 0) {
        // When AI search is active, ONLY show AI results to verify they are found
        return aiRankedIds.map(id => candidates.find(c => c.id === id)).filter(Boolean) as CandidateData[];
    }

    let filtered = candidates;
    if (filterNationality) filtered = filtered.filter(c => c.info.nationality === filterNationality);
    if (filterSpecialty) filtered = filtered.filter(c => c.info.specialty === filterSpecialty);
    if (filterStatus) filtered = filtered.filter(c => c.status === filterStatus);
    if (filterStability) filtered = filtered.filter(c => getStabilityLevel(c.info.jobStability) === filterStability);
    
    return filtered;
  }, [candidates, filterNationality, filterSpecialty, filterStatus, filterStability, aiRankedIds]);

  const getStatusStyle = (status: CandidateStatus) => {
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

      {/* AI Search & Global Filters */}
      <div className="ai-glow-wrapper">
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[1.4rem] border border-slate-100 shadow-xl">
              <form onSubmit={handleAiSearch} className="relative mb-5">
                  <input type="text" value={aiSearchQuery} onChange={(e) => setAiSearchQuery(e.target.value)} placeholder='مثال: "مهندس مدني 5 سنوات خبرة"...' className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-12 text-slate-900 font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
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

      {/* Desktop Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-5 rounded-3xl border border-slate-200 shadow-sm gap-4">
          <h2 className="text-xl font-black text-slate-900">إدارة الكفاءات ({displayedCandidates.length})</h2>
          <div className="flex flex-wrap gap-2 items-center">
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

      {/* Main Data Table */}
      <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right ltr">
              <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="p-6 w-10"><input type="checkbox" className="w-5 h-5 rounded border-slate-300" onChange={(e) => setSelectedIds(e.target.checked ? displayedCandidates.map(c => c.id) : [])} checked={selectedIds.length === displayedCandidates.length && displayedCandidates.length > 0} /></th>
                  <th className="p-6">المرشح</th>
                  <th className="p-6">التخصص</th>
                  <th className="p-6">الوظيفة</th>
                  <th className="p-6">الخبرة</th>
                  <th className="p-6">الجنسية</th>
                  <th className="p-6">الإجراء</th>
                  <th className="p-6 text-center">التفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedCandidates.map(c => {
                  const isAiRanked = aiRankedIds?.includes(c.id);
                  const stabilityLevel = getStabilityLevel(c.info.jobStability);
                  const stabilityDotColor = 
                    stabilityLevel === 'high' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 
                    stabilityLevel === 'medium' ? 'bg-amber-400' : 
                    stabilityLevel === 'low' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 
                    'bg-slate-200';
                  
                  const hasPrescreen = !!c.preScreening;

                  return (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-blue-50/30 transition-all ${isAiRanked ? 'bg-blue-50/70 border-r-4 border-blue-600 shadow-[inset_4px_0_0_0_#2563eb]' : ''}`}
                    >
                      <td className="p-6"><input type="checkbox" className="w-5 h-5 rounded border-slate-300" checked={selectedIds.includes(c.id)} onChange={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id])} /></td>
                      <td className="p-6">
                          <div className="flex items-center gap-2">
                              {isAiRanked && <RobotIcon className="w-4 h-4 text-blue-600" />}
                              <div className={`w-2 h-2 rounded-full shrink-0 ${stabilityDotColor}`} title={`الاستقرار: ${c.info.jobStability}`}></div>
                              <div className="font-bold text-slate-900 text-sm">{c.info.fullName}</div>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                              {c.uploadDate}
                              {hasPrescreen && <span className="bg-cyan-100 text-cyan-700 text-[8px] px-1 rounded font-black">تم الرد</span>}
                          </div>
                      </td>
                      <td className="p-6"><span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[11px] font-black border border-amber-100">{c.info.specialty}</span></td>
                      <td className="p-6 text-slate-600 text-xs font-bold">{c.info.jobTitle}</td>
                      <td className="p-6 text-slate-900 font-black text-xs">{c.info.experienceYears}</td>
                      <td className="p-6 text-slate-600 text-xs font-bold">{c.info.nationality}</td>
                      <td className="p-6">
                          <select 
                              value={c.status} 
                              onChange={(e) => onUpdateStatus([c.id], e.target.value as CandidateStatus)}
                              className={`text-[10px] font-black px-4 py-2 rounded-xl border outline-none transition-all cursor-pointer min-w-[160px] ${getStatusStyle(c.status)}`}
                          >
                              {statusOptions.map(opt => (
                                  <option key={opt} value={opt} className="bg-white text-slate-900">{opt === 'Under Review' ? 'قيد المراجعة' : opt}</option>
                              ))}
                          </select>
                      </td>
                      <td className="p-6 text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button onClick={() => onViewCandidate(c)} className="text-blue-600 text-xs font-black underline hover:text-blue-800 underline-offset-4 decoration-blue-500/30">عرض</button>
                          </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
};
