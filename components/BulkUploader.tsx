
import React, { useState, useRef } from 'react';
import { UploadIcon, RefreshIcon, CheckCircleIcon, AlertIcon } from './Icons';
import { analyzeCvPdf } from '../services/geminiService';
import { CandidateData } from '../types';

interface FileProgress {
    file: File;
    status: 'pending' | 'processing' | 'success' | 'duplicate' | 'not_cv' | 'error';
    error?: string;
}

interface BulkUploaderProps {
    candidates: CandidateData[];
    onSuccessBulk: (data: CandidateData[]) => Promise<void>;
    onBack: () => void;
}

export const BulkUploader: React.FC<BulkUploaderProps> = ({ candidates, onSuccessBulk, onBack }) => {
    const [fileQueue, setFileQueue] = useState<FileProgress[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedCount, setCompletedCount] = useState(0);
    const [acceptedCandidates, setAcceptedCandidates] = useState<CandidateData[]>([]);
    const [showResults, setShowResults] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const MAX_FILES = 50;
    const CONCURRENCY = 3;

    const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Fix: Explicitly type 'files' as File[] to avoid 'unknown' or '{}' type inference error in Array.from
        const files: File[] = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (files.length > MAX_FILES) {
            alert(`يا بشمهندس، الحد الأقصى هو ${MAX_FILES} ملف في المرة الواحدة.`);
            return;
        }

        const newQueue: FileProgress[] = files.map(file => ({
            file,
            status: 'pending'
        }));

        setFileQueue(newQueue);
        setCompletedCount(0);
        setAcceptedCandidates([]);
        setShowResults(false);
    };

    const processQueue = async () => {
        if (fileQueue.length === 0) return;
        setIsProcessing(true);
        const results: CandidateData[] = [];
        const currentQueue = [...fileQueue];

        // Worker function to process files in parallel with limit
        let index = 0;
        const processFile = async (): Promise<void> => {
            if (index >= currentQueue.length) return;
            
            const currentIndex = index++;
            const item = currentQueue[currentIndex];
            
            // UI Update: Processing
            setFileQueue(prev => prev.map((p, i) => i === currentIndex ? { ...p, status: 'processing' } : p));

            try {
                // 1. Analyze with Gemini
                const result = await analyzeCvPdf(item.file);

                if (!result.isCV) {
                    setFileQueue(prev => prev.map((p, i) => i === currentIndex ? { ...p, status: 'not_cv' } : p));
                } else {
                    // 2. Check Duplicates (Internal batch + Global DB)
                    const rEmail = result.info?.email?.toLowerCase()?.trim();
                    const rPhone = result.info?.phone?.replace(/\s/g, '');

                    const isDuplicate = candidates.some(c => {
                        const cEmail = c.info?.email?.toLowerCase()?.trim();
                        const cPhone = c.info?.phone?.replace(/\s/g, '');
                        return (rEmail && cEmail && rEmail === cEmail) || (rPhone && cPhone && rPhone === cPhone);
                    }) || results.some(c => {
                        const cEmail = c.info?.email?.toLowerCase()?.trim();
                        const cPhone = c.info?.phone?.replace(/\s/g, '');
                        return (rEmail && cEmail && rEmail === cEmail) || (rPhone && cPhone && rPhone === cPhone);
                    });

                    if (isDuplicate) {
                        setFileQueue(prev => prev.map((p, i) => i === currentIndex ? { ...p, status: 'duplicate' } : p));
                    } else {
                        // 3. Valid Candidate
                        const newCandidate: CandidateData = {
                            ...result,
                            id: crypto.randomUUID(),
                            fileName: item.file.name,
                            uploadDate: new Date().toLocaleDateString('ar-EG'),
                            status: 'Under Review'
                        } as CandidateData;
                        
                        results.push(newCandidate);
                        setFileQueue(prev => prev.map((p, i) => i === currentIndex ? { ...p, status: 'success' } : p));
                    }
                }
            } catch (err: any) {
                setFileQueue(prev => prev.map((p, i) => i === currentIndex ? { ...p, status: 'error', error: err.message } : p));
            } finally {
                setCompletedCount(prev => prev + 1);
                await processFile(); // Get next in line
            }
        };

        // Start initial workers
        const workers = Array(Math.min(CONCURRENCY, currentQueue.length)).fill(null).map(() => processFile());
        await Promise.all(workers);

        setAcceptedCandidates(results);
        setIsProcessing(false);
        setShowResults(true);
    };

    const handleSaveAndFinish = async () => {
        if (acceptedCandidates.length > 0) {
            await onSuccessBulk(acceptedCandidates);
        }
        onBack();
    };

    const progressPercentage = Math.round((completedCount / fileQueue.length) * 100) || 0;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            <div className="flex items-center justify-between mb-8">
                <button onClick={onBack} className="text-slate-400 font-black text-xs uppercase hover:text-emerald-600 transition-colors">← العودة</button>
                <div className="flex items-center gap-2 text-emerald-600">
                    <UploadIcon />
                    <h2 className="text-xl font-black mr-2">الرفع الجماعي للسير الذاتية (Bulk)</h2>
                </div>
            </div>

            {!showResults && fileQueue.length === 0 && (
                <div 
                    className="bg-white border-[3px] border-dashed border-slate-200 rounded-[3rem] p-20 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        multiple 
                        accept=".pdf" 
                        className="hidden" 
                        ref={fileInputRef} 
                        onChange={handleFilesSelected}
                    />
                    <div className="group-hover:scale-110 transition-transform duration-300 text-slate-300 flex justify-center mb-6">
                        <UploadIcon />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">اختر ملفات الـ CV</h3>
                    <p className="text-slate-500 font-bold max-w-sm mx-auto">يمكنك رفع حتى 50 ملف PDF في المرة الواحدة. سيقوم شهماوي بفرزهم واستبعاد المكرر تلقائياً.</p>
                </div>
            )}

            {fileQueue.length > 0 && !showResults && (
                <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex flex-col">
                                <span className="text-sm font-black text-slate-900">جاري معالجة الدفعة...</span>
                                <span className="text-xs font-bold text-slate-400 mt-1">تم إنجاز {completedCount} من أصل {fileQueue.length} ملف</span>
                            </div>
                            <div className="text-2xl font-black text-emerald-600 tracking-tighter">{progressPercentage}%</div>
                        </div>
                        
                        <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500 ease-out"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        {fileQueue.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-200">
                                        <div className="scale-50 opacity-40"><UploadIcon /></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-700 truncate max-w-[250px]">{item.file.name}</span>
                                        <span className="text-[9px] font-black text-slate-400 uppercase">{(item.file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    {item.status === 'pending' && <span className="text-[10px] font-black text-slate-400">في الانتظار...</span>}
                                    {item.status === 'processing' && (
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-[10px] font-black">يحلل حالياً...</span>
                                        </div>
                                    )}
                                    {item.status === 'success' && (
                                        <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                            <CheckCircleIcon className="w-3 h-3" />
                                            <span className="text-[10px] font-black">جاهز</span>
                                        </div>
                                    )}
                                    {item.status === 'duplicate' && (
                                        <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                            <AlertIcon className="w-3 h-3" />
                                            <span className="text-[10px] font-black">مكرر</span>
                                        </div>
                                    )}
                                    {item.status === 'not_cv' && (
                                        <div className="flex items-center gap-1.5 text-red-500 bg-red-50 px-3 py-1 rounded-full border border-red-100">
                                            <span className="text-[10px] font-black">ليس CV</span>
                                        </div>
                                    )}
                                    {item.status === 'error' && (
                                        <div className="flex items-center gap-1.5 text-red-700">
                                            <span className="text-[10px] font-black">فشل التحليل</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {!isProcessing && completedCount === 0 && (
                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button 
                                onClick={processQueue}
                                className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                <RefreshIcon className="w-5 h-5" />
                                <span>ابدأ تحليل الدفعة</span>
                            </button>
                            <button 
                                onClick={() => setFileQueue([])}
                                className="px-8 py-4 border border-slate-200 text-slate-400 font-bold rounded-2xl hover:bg-white hover:text-slate-600"
                            >
                                إلغاء
                            </button>
                        </div>
                    )}
                </div>
            )}

            {showResults && (
                <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-xl text-center animate-fade-in">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600">
                        <CheckCircleIcon className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 mb-2">اكتملت المعالجة بنجاح!</h3>
                    <p className="text-slate-500 font-bold mb-8">إليك ملخص الدفعة المرفوعة:</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                        <ResultStat label="إجمالي الملفات" value={fileQueue.length} color="slate" />
                        <ResultStat label="سير مقبولة" value={acceptedCandidates.length} color="emerald" />
                        <ResultStat label="سير مكررة" value={fileQueue.filter(f => f.status === 'duplicate').length} color="amber" />
                        <ResultStat label="ملفات مستبعدة" value={fileQueue.filter(f => f.status === 'not_cv' || f.status === 'error').length} color="red" />
                    </div>

                    <button 
                        onClick={handleSaveAndFinish}
                        className="w-full max-w-sm py-5 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-2xl shadow-slate-900/30 hover:bg-slate-800 transition-all"
                    >
                        حفظ {acceptedCandidates.length} مرشح والعودة
                    </button>
                </div>
            )}
        </div>
    );
};

const ResultStat = ({ label, value, color }: { label: string, value: number, color: 'slate' | 'emerald' | 'amber' | 'red' }) => {
    const colors = {
        slate: 'bg-slate-50 text-slate-600 border-slate-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        red: 'bg-red-50 text-red-600 border-red-100'
    };
    return (
        <div className={`p-6 rounded-3xl border ${colors[color]} flex flex-col items-center`}>
            <span className="text-3xl font-black mb-1">{value}</span>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
        </div>
    );
};
