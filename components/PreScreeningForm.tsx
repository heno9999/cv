
import React, { useState } from 'react';
import { CandidateData, PreScreeningResult } from '../types';

interface PreScreeningFormProps {
    candidate: CandidateData;
    onSubmit: (result: PreScreeningResult) => void;
}

export const PreScreeningForm: React.FC<PreScreeningFormProps> = ({ candidate, onSubmit }) => {
    const [iqamaTransfer, setIqamaTransfer] = useState<'Yes' | 'No' | ''>('');
    const [noticePeriod, setNoticePeriod] = useState('');
    const [currentSalary, setCurrentSalary] = useState('');
    const [expectedSalary, setExpectedSalary] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!iqamaTransfer) {
            alert('الرجاء اختيار حالة الإقامة');
            return;
        }
        setIsSubmitting(true);
        setTimeout(() => {
            onSubmit({
                iqamaTransfer,
                noticePeriod,
                currentSalary,
                expectedSalary,
                submittedAt: new Date().toISOString()
            });
            setIsSuccess(true);
            setIsSubmitting(false);
        }, 1000);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fade-in" dir="rtl">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h1 className="text-2xl font-black text-slate-900 mb-2">تم استلام ردك بنجاح</h1>
                <p className="text-slate-500 font-bold mb-8">شكراً لك، سيقوم فريق التوظيف في شهم بمراجعة بياناتك والتواصل معك قريباً.</p>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">SHAHM RECRUITMENT</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8" dir="rtl">
            <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl overflow-hidden border border-slate-100 animate-fade-in">
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                     <h1 className="text-2xl font-black text-white relative z-10">SHAHM</h1>
                     <p className="text-xs font-bold text-slate-400 mt-1 relative z-10">نموذج الفحص الأولي للمرشحين</p>
                </div>

                <div className="p-8">
                    <div className="mb-6 text-center">
                        <p className="text-sm font-bold text-slate-600">مرحباً <span className="text-blue-600 font-black">{candidate.info.fullName}</span>،</p>
                        <p className="text-xs text-slate-500 mt-2">يرجى الإجابة على الأسئلة التالية لاستكمال طلب التوظيف لوظيفة <br/> <span className="font-black text-slate-800">{candidate.info.jobTitle}</span>.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-900 block">هل إقامتك قابلة للنقل؟</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setIqamaTransfer('Yes')}
                                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${iqamaTransfer === 'Yes' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    نعم، قابلة للنقل
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIqamaTransfer('No')}
                                    className={`py-3 rounded-xl text-sm font-bold border transition-all ${iqamaTransfer === 'No' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                >
                                    لا / غير متوفر
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-slate-900 block">متى تستطيع مباشرة العمل (فترة الإنذار)؟</label>
                            <input 
                                type="text"
                                required
                                placeholder="مثال: فوراً، شهر، شهرين..."
                                value={noticePeriod}
                                onChange={(e) => setNoticePeriod(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-900 block">الراتب الحالي</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="SAR"
                                    value={currentSalary}
                                    onChange={(e) => setCurrentSalary(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-900 block">الراتب المتوقع</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="SAR"
                                    value={expectedSalary}
                                    onChange={(e) => setExpectedSalary(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? 'جاري الإرسال...' : 'إرسال الإجابات'}
                        </button>
                    </form>
                </div>
            </div>
            <div className="mt-8 text-[9px] font-black text-slate-300 uppercase tracking-widest">POWERED BY SHAHM AI</div>
        </div>
    );
};
