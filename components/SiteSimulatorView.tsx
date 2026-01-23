import React, { useState } from 'react';
import { CandidateData } from '../types';
import { BriefcaseIcon, AlertIcon, RobotIcon, UserIcon } from './Icons';
import { generateSiteScenario } from '../services/geminiService';

interface SiteSimulatorViewProps {
    candidates: CandidateData[];
    onBack: () => void;
}

const SCENARIOS = [
    { id: 'delay', title: 'تأخر توريد الخرسانة', desc: 'صبة أساسات حرجة مع تعطل المورد الرئيسي.', icon: '🏗️' },
    { id: 'safety', title: 'خطر سقوط (سلامة)', desc: 'اكتشاف عمال يعملون بدون أحزمة في دور مرتفع.', icon: '⚠️' },
    { id: 'conflict', title: 'نزاع بين مقاولين', desc: 'اشتباك لفظي بين مقاول السباكة ومقاول الكهرباء.', icon: '🤝' },
    { id: 'client', title: 'ضغط الاستشاري', desc: 'رفض الاستشاري لعمل تم إنجازه بالكامل ومطالبة بالإزالة.', icon: '📋' }
];

export const SiteSimulatorView: React.FC<SiteSimulatorViewProps> = ({ candidates, onBack }) => {
    const [selectedCandidateId, setSelectedCandidateId] = useState('');
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<{ prediction: string, confidence: number, challengeQuestions: string[] } | null>(null);

    const handleSimulate = async () => {
        const candidate = candidates.find(c => c.id === selectedCandidateId);
        const scenario = SCENARIOS.find(s => s.id === selectedScenario);
        if (!candidate || !scenario) return;

        setIsAnalyzing(true);
        try {
            const res = await generateSiteScenario(candidate, scenario.title);
            setResult(res);
        } catch (e) {
            alert("فشل المحاكاة");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="text-slate-400 font-black text-xs uppercase hover:text-emerald-600 transition-colors">← رجوع</button>
                <div className="flex items-center gap-2 text-emerald-600">
                    <BriefcaseIcon className="w-6 h-6" />
                    <h2 className="text-xl font-black">محاكي شهم الميداني (Simulator)</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">1. اختر المرشح</label>
                        <select 
                            value={selectedCandidateId} 
                            onChange={(e) => setSelectedCandidateId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 outline-none text-xs"
                        >
                            <option value="">اختر من القائمة...</option>
                            {candidates.map(c => (
                                <option key={c.id} value={c.id}>{c.info.fullName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">2. نوع الأزمة الميدانية</label>
                        <div className="space-y-2">
                            {SCENARIOS.map(s => (
                                <button 
                                    key={s.id}
                                    onClick={() => setSelectedScenario(s.id)}
                                    className={`w-full p-3 rounded-2xl border text-right transition-all flex items-center gap-3 ${selectedScenario === s.id ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-slate-50 border-slate-100 hover:bg-white text-slate-600'}`}
                                >
                                    <span className="text-xl">{s.icon}</span>
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black">{s.title}</span>
                                        <span className={`text-[8px] font-bold ${selectedScenario === s.id ? 'text-emerald-100' : 'text-slate-400'}`}>{s.desc}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleSimulate}
                        disabled={!selectedCandidateId || !selectedScenario || isAnalyzing}
                        className="w-full py-4 bg-slate-900 text-white rounded-[2rem] font-black shadow-xl hover:bg-slate-800 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? 'جاري محاكاة الواقعة...' : 'بدء المحاكاة الميدانية'}
                    </button>
                </div>

                <div className="md:col-span-2">
                    {result ? (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-1 bg-emerald-500" style={{ width: `${result.confidence}%` }}></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-900">توقع رد الفعل السلوكي</h3>
                                    <div className="text-right">
                                        <span className="text-[8px] font-black text-slate-400 uppercase block">مؤشر كفاءة المواجهة</span>
                                        <span className="text-xl font-black text-emerald-600">{result.confidence}%</span>
                                    </div>
                                </div>
                                <p className="text-slate-600 font-bold leading-relaxed text-sm text-justify">
                                    {result.prediction}
                                </p>
                            </div>

                            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl">
                                <h4 className="flex items-center gap-2 text-emerald-400 font-black mb-6">
                                    <RobotIcon className="w-5 h-5" />
                                    <span>أسئلة اختبار "الثبات الميداني"</span>
                                </h4>
                                <div className="space-y-4">
                                    {result.challengeQuestions.map((q, i) => (
                                        <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-start gap-3">
                                            <span className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                                            <p className="text-sm font-bold text-slate-300 leading-relaxed">{q}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem] p-12 text-center opacity-40">
                            <BriefcaseIcon className="w-16 h-16 text-slate-300 mb-4" />
                            <p className="text-xl font-black text-slate-400">اختر مرشحاً وسيناريو لرؤية التوقع الميداني</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};