
import React, { useState } from 'react';
import { CandidateData } from '../types';
import { EyeIcon, AlertIcon, CheckCircleIcon } from './Icons';
import { analyzeTruthLens } from '../services/geminiService';
import { db } from '../services/db';

interface TruthLensViewProps {
    candidates: CandidateData[];
    onBack: () => void;
}

export const TruthLensView: React.FC<TruthLensViewProps> = ({ candidates, onBack }) => {
    const [selectedId, setSelectedId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [result, setResult] = useState<{ score: number, report: string, flags: string[] } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const filteredCandidates = candidates.filter(c => 
        c.info.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.info.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAnalyze = async () => {
        const candidate = candidates.find(c => c.id === selectedId);
        if (!candidate) return;

        // 1. Check if we already have a fixed result saved for this candidate
        if (candidate.truthLens) {
            setResult(candidate.truthLens);
            return;
        }

        setIsAnalyzing(true);
        try {
            // 2. Perform analysis
            const res = await analyzeTruthLens(candidate);
            setResult(res);
            
            // 3. Save result to DB to make it permanent for this candidate
            const updatedCandidate = { ...candidate, truthLens: res };
            await db.updateOffer(updatedCandidate as any);
            
            // Force local update if possible or assume DB sync handles it for next time
            candidate.truthLens = res; 
        } catch (e) {
            alert("فشل التحليل");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="text-slate-400 font-black text-xs uppercase hover:text-amber-600 transition-colors">← العودة للقائمة الرئيسية</button>
                <div className="flex items-center gap-2 text-amber-600">
                    <EyeIcon className="w-6 h-6" />
                    <h2 className="text-xl font-black">Truth Lens (كاشف المصداقية)</h2>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-4">من تريد فحصه اليوم؟</h3>
                <div className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="ابحث باسم المرشح أو الوظيفة..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                        {isDropdownOpen && searchQuery && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 animate-fade-in">
                                {filteredCandidates.length > 0 ? (
                                    filteredCandidates.map(c => (
                                        <div 
                                            key={c.id} 
                                            onClick={() => { 
                                                setSelectedId(c.id); 
                                                setSearchQuery(c.info.fullName); 
                                                setIsDropdownOpen(false); 
                                                // If result already exists, show it immediately when selected
                                                setResult(c.truthLens || null);
                                            }}
                                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 text-right"
                                        >
                                            <div className="font-black text-slate-900 text-sm">{c.info.fullName}</div>
                                            <div className="text-xs text-slate-400 font-bold">{c.info.jobTitle}</div>
                                            {c.truthLens && <div className="text-[10px] text-emerald-500 font-black">تم الفحص مسبقاً ✓</div>}
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-slate-400 font-bold text-xs">لا توجد نتائج</div>
                                )}
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleAnalyze} 
                        disabled={!selectedId || isAnalyzing}
                        className="bg-amber-500 text-white px-8 py-3 rounded-xl font-black hover:bg-amber-600 disabled:opacity-50 transition-all"
                    >
                        {isAnalyzing ? 'جاري الفحص...' : 'فحص'}
                    </button>
                </div>
            </div>

            {result && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-2 ${result.score > 80 ? 'bg-emerald-500' : result.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}></div>
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">مؤشر المصداقية</h4>
                        <div className={`text-6xl font-black mb-4 ${result.score > 80 ? 'text-emerald-600' : result.score > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {result.score}%
                        </div>
                        <p className="text-slate-600 font-bold leading-relaxed max-w-lg mx-auto text-sm">{result.report}</p>
                    </div>

                    <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100">
                        <h4 className="flex items-center gap-2 text-red-600 font-black mb-4">
                            <AlertIcon className="w-5 h-5" />
                            <span>إشارات حمراء (Red Flags)</span>
                        </h4>
                        <ul className="space-y-3">
                            {result.flags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700">
                                    <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 shrink-0"></span>
                                    {flag}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};
