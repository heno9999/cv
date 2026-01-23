
import React, { useState } from 'react';
import { CandidateData } from '../types';
import { BrainIcon, UserIcon } from './Icons';
import { analyzePsychometric } from '../services/geminiService';

interface PsychoProfilerViewProps {
    candidates: CandidateData[];
    onBack: () => void;
}

export const PsychoProfilerView: React.FC<PsychoProfilerViewProps> = ({ candidates, onBack }) => {
    const [selectedId, setSelectedId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [result, setResult] = useState<{ archetype: string, traits: string[], analysis: string } | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const filteredCandidates = candidates.filter(c => 
        c.info.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.info.jobTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAnalyze = async () => {
        const candidate = candidates.find(c => c.id === selectedId);
        if (!candidate) return;
        setIsAnalyzing(true);
        try {
            const res = await analyzePsychometric(candidate);
            setResult(res);
        } catch (e) {
            alert("فشل التحليل");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="text-slate-400 font-black text-xs uppercase hover:text-purple-600 transition-colors">← العودة للقائمة الرئيسية</button>
                <div className="flex items-center gap-2 text-purple-600">
                    <BrainIcon className="w-6 h-6" />
                    <h2 className="text-xl font-black">Psychometric AI Profiler</h2>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 text-center mb-8">
                <h3 className="text-2xl font-black text-slate-900 mb-4">تحليل الشخصية القيادية</h3>
                <div className="flex flex-col md:flex-row gap-3 max-w-xl mx-auto">
                    <div className="relative flex-1">
                        <input 
                            type="text" 
                            placeholder="ابحث باسم المرشح..."
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setIsDropdownOpen(true); }}
                            onFocus={() => setIsDropdownOpen(true)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
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
                                                setResult(null);
                                            }}
                                            className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 text-right"
                                        >
                                            <div className="font-black text-slate-900 text-sm">{c.info.fullName}</div>
                                            <div className="text-xs text-slate-400 font-bold">{c.info.jobTitle}</div>
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
                        className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black hover:bg-purple-700 disabled:opacity-50 transition-all"
                    >
                        {isAnalyzing ? 'جاري التحليل...' : 'تحليل'}
                    </button>
                </div>
            </div>

            {result && (
                <div className="animate-fade-in grid gap-6">
                    <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] text-center relative overflow-hidden shadow-2xl">
                         <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                         <h4 className="text-xs font-black text-purple-300 uppercase tracking-[0.3em] mb-4">Archetype (النمط الشخصي)</h4>
                         <h2 className="text-4xl font-black mb-6">{result.archetype}</h2>
                         <p className="text-sm font-bold text-slate-300 leading-relaxed max-w-lg mx-auto">{result.analysis}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {result.traits.map((trait, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm text-center">
                                <span className="text-3xl mb-2 block">🧠</span>
                                <span className="font-black text-slate-700">{trait}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
