import React, { useState } from 'react';
import { CandidateData } from '../types';
import { DNAIcon, UserIcon, BriefcaseIcon, RobotIcon } from './Icons';
import { analyzeProjectDNA } from '../services/geminiService';

interface ProjectDNAViewProps {
    candidates: CandidateData[];
    onBack: () => void;
    onNavigateToHeadhunter?: (projectQuery: string) => void;
    onViewCandidate: (candidate: CandidateData) => void;
    projectDesc: string;
    setProjectDesc: (val: string) => void;
    results: any[] | null;
    setResults: (val: any[] | null) => void;
    isAnalyzing: boolean;
    setIsAnalyzing: (val: boolean) => void;
}

export const ProjectDNAView: React.FC<ProjectDNAViewProps> = ({ candidates, onBack, onNavigateToHeadhunter, onViewCandidate, projectDesc, setProjectDesc, results, setResults, isAnalyzing, setIsAnalyzing }) => {
    const handleAnalyze = async () => {
        if (!projectDesc.trim()) return;
        setIsAnalyzing(true);
        try {
            const roles = await analyzeProjectDNA(projectDesc, candidates);
            setResults(roles);
        } catch (e) {
            alert("حدث خطأ في تحليل المشروع");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSearchWeb = () => {
        if (!projectDesc.trim()) {
            alert("يرجى إدخال وصف المشروع أولاً.");
            return;
        }
        const query = `أريد البحث عن أفضل المهندسين المتخصصين في السعودية والخليج للعمل في هذا المشروع: ${projectDesc}. ابحث عن خبراء لديهم تجارب مشابهة في مشاريع كبرى.`;
        if (onNavigateToHeadhunter) onNavigateToHeadhunter(query);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="text-slate-400 font-black text-xs uppercase hover:text-emerald-600 transition-colors">← العودة للقائمة الرئيسية</button>
                <div className="flex items-center gap-2 text-emerald-600">
                    <DNAIcon className="w-6 h-6" />
                    <h2 className="text-xl font-black">Project DNA Matcher</h2>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-xl mb-8 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-600"></div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">وصف المشروع</h3>
                <p className="text-slate-500 font-bold text-sm mb-6">قم بلصق وصف المشروع، المتطلبات الفنية، أو جزء من كراسة الشروط، وسيقوم شهماوي بتشكيل الفريق الأمثل.</p>
                
                <textarea 
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    placeholder="مثال: مشروع برج سكني 40 طابق في الرياض، يتطلب مدير مشروع خبرة 15 سنة، ومهندسين موقع مدني ومعماري، ومشرفين سلامة..."
                    className="w-full h-40 p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500/20 outline-none resize-none mb-6"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={handleAnalyze} 
                        disabled={isAnalyzing || !projectDesc.trim()}
                        className={`py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 ${isAnalyzing ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.01]'}`}
                    >
                        {isAnalyzing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>جاري تحليل الحمض النووي للمشروع...</span>
                            </>
                        ) : (
                            <>
                                <RobotIcon className="w-5 h-5" />
                                <span>استخراج فريق العمل (Dream Team)</span>
                            </>
                        )}
                    </button>

                    <button 
                        onClick={handleSearchWeb}
                        disabled={isAnalyzing || !projectDesc.trim()}
                        className="py-4 rounded-2xl font-black text-slate-900 border-2 border-slate-900 shadow-xl hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3"
                    >
                        <DNAIcon className="w-5 h-5" />
                        <span>بحث في الويب عن متخصصين</span>
                    </button>
                </div>
            </div>

            {results && (
                <div className="space-y-6 animate-fade-in">
                    <h3 className="text-xl font-black text-slate-900 text-center mb-4">الفريق المقترح للمشروع</h3>
                    <div className="grid gap-4">
                        {results.map((role, idx) => {
                            const candidate = candidates.find(c => c.id === role.candidateId);
                            return (
                                <div key={idx} className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-md transition-shadow">
                                    <div className="bg-emerald-50 w-16 h-16 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                                        <BriefcaseIcon className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1 block">{role.roleName}</span>
                                        <h4 className="text-lg font-black text-slate-900 mb-1">{candidate?.info.fullName || 'مرشح غير موجود'}</h4>
                                        <p className="text-xs font-bold text-slate-500">{candidate?.info.jobTitle}</p>
                                    </div>
                                    <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <span className="text-[9px] font-black text-slate-400 uppercase mb-1 block">سبب الاختيار</span>
                                        <p className="text-[10px] font-bold text-slate-700 leading-relaxed">{role.reason}</p>
                                    </div>
                                    <button 
                                        onClick={() => candidate && onViewCandidate(candidate)}
                                        className="px-4 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800"
                                    >
                                        عرض الملف
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};