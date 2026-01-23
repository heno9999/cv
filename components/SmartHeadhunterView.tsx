import React, { useState, useEffect } from 'react';
import { RobotIcon, ChartIcon, ShieldIcon, BriefcaseIcon } from './Icons';
import { searchWebForCandidates } from '../services/geminiService';

interface SmartHeadhunterViewProps {
    initialQuery?: string;
    onBack: () => void;
}

export const SmartHeadhunterView: React.FC<SmartHeadhunterViewProps> = ({ initialQuery = '', onBack }) => {
    const [query, setQuery] = useState(initialQuery);
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<{ answer: string, sources: { title: string, uri: string }[] } | null>(null);

    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

    const handleSearch = async (searchQuery: string = query) => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await searchWebForCandidates(searchQuery);
            setResults(res);
        } catch (e) {
            alert("فشل في استرجاع النتائج من الويب.");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="text-slate-400 font-black text-xs uppercase hover:text-blue-600 transition-colors">← العودة</button>
                <div className="flex items-center gap-2 text-blue-600">
                    <RobotIcon className="w-6 h-6" />
                    <h2 className="text-xl font-black">رادار الاستقطاب الذكي (Web Sourcing)</h2>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 mb-8">
                <h3 className="text-xl font-black text-slate-900 mb-4">ابحث في فضاء الإنترنت عن الكفاءات</h3>
                <div className="relative">
                    <textarea 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="صف المرشح أو المشروع الذي تبحث له عن متخصصين..."
                        className="w-full h-32 p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none mb-4"
                    />
                    <button 
                        onClick={() => handleSearch()}
                        disabled={isSearching || !query.trim()}
                        className={`w-full py-4 rounded-xl font-black text-white shadow-lg transition-all flex items-center justify-center gap-2 ${isSearching ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {isSearching ? 'جاري المسح الرقمي للويب...' : 'بدء رحلة الاستقطاب'}
                    </button>
                </div>
            </div>

            {isSearching && (
                <div className="py-20 flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="ai-text-shimmer font-black text-xl">شهماوي يتصفح الويب بحثاً عن النخبة...</p>
                </div>
            )}

            {results && !isSearching && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <ShieldIcon className="w-4 h-4 text-emerald-500" />
                            <span>تقرير شهماوي الاستقصائي</span>
                        </h4>
                        <div className="text-slate-700 font-bold leading-relaxed whitespace-pre-wrap text-sm text-justify">
                            {results.answer}
                        </div>
                    </div>

                    {results.sources.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mr-2">المصادر والروابط المستخرجة</h4>
                            <div className="grid gap-3">
                                {results.sources.map((source, i) => (
                                    <a 
                                        key={i} 
                                        href={source.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-blue-400 transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                <BriefcaseIcon className="w-5 h-5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-900 group-hover:text-blue-600">{source.title}</span>
                                                <span className="text-[10px] text-slate-400 truncate max-w-md">{source.uri}</span>
                                            </div>
                                        </div>
                                        <div className="text-blue-400 group-hover:translate-x-[-4px] transition-transform">←</div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};