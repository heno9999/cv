import React, { useState } from 'react';
import { UploadIcon, RefreshIcon, AlertIcon } from './Icons';
import { analyzeCvPdf } from '../services/geminiService';
import { CandidateData } from '../types';

const PhosphorescentSphereAnalysis = () => (
    <div className="relative py-20 flex flex-col items-center">
      <style>{`
        @keyframes sphere-float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
        @keyframes rotate-gradient {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        .sphere {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4285F4, #9B72CB, #D96570, #F4AF40, #4285F4);
          background-size: 200% 200%;
          animation: sphere-float 3s ease-in-out infinite, rotate-gradient 4s linear infinite;
          box-shadow: 0 0 40px rgba(66, 133, 244, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.3);
          position: relative;
        }
      `}</style>
      
      <div className="sphere"></div>
      
      <div className="mt-12 text-center">
        <p className="ai-text-shimmer font-black text-2xl">شهماوي يحلل السيرة الذاتية...</p>
        <p className="text-slate-400 font-bold text-sm mt-3 tracking-wide">استخراج الخبرات والمهارات</p>
      </div>
    </div>
);

const SadRobotError = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
  <div className="py-12 flex flex-col items-center animate-fade-in">
    <div className="text-8xl mb-6 animate-pulse">🤖❌</div>
    <h3 className="text-2xl font-black text-slate-900 mb-4">{message}</h3>
    <div className="bg-red-50 border border-red-100 p-6 rounded-2xl max-w-md text-center">
      <p className="text-red-500 font-bold text-lg leading-relaxed">يا بشمهندس، يرجى التأكد من الملف المرفوع.</p>
    </div>
    <button 
      onClick={onRetry}
      className="mt-8 bg-slate-100 text-slate-700 px-8 py-3 rounded-xl font-black hover:bg-slate-200 transition-all flex items-center gap-2 border border-slate-200"
    >
      <RefreshIcon className="w-5 h-5" />
      <span>جرب ملف تاني يا بشمهندس</span>
    </button>
  </div>
);

const DuplicateAlert = ({ onRetry }: { onRetry: () => void }) => (
  <div className="py-12 flex flex-col items-center animate-fade-in">
    <div className="text-8xl mb-6 animate-bounce">🧐</div>
    <h3 className="text-2xl font-black text-slate-900 mb-4">هذه تم تحليلها من قبل 🤖</h3>
    <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] max-w-md text-center shadow-lg shadow-amber-200/20">
      <p className="text-amber-700 font-black text-xl leading-relaxed">
        يا بشمهندس! شهماوي وجد أن هذا المرشح موجود مسبقاً في النظام.
      </p>
      <p className="text-slate-500 font-bold text-sm mt-4">
        تم العثور على تطابق في البيانات الأساسية (رقم الجوال أو البريد الإلكتروني).
      </p>
    </div>
    <button 
      onClick={onRetry}
      className="mt-10 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center gap-3 shadow-xl"
    >
      <RefreshIcon className="w-5 h-5" />
      <span>فهمت، سأختار ملفاً آخر</span>
    </button>
  </div>
);

export const Uploader: React.FC<{ 
    candidates: CandidateData[], 
    onSuccess: (d: CandidateData) => void, 
    onCancel: () => void 
}> = ({ candidates, onSuccess, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError("الرجاء رفع ملف بصيغة PDF فقط");
      return;
    }
    setIsProcessing(true);
    setError(null);
    setRejectionReason(null);
    setIsDuplicate(false);

    try {
      const result = await analyzeCvPdf(file);
      
      // 1. تحقق أولاً إذا كان الملف سيرة ذاتية
      if (result.isCV === false) {
        setRejectionReason("هذه ليست سيرة ذاتية 🤖");
        setIsProcessing(false);
        return;
      }

      // 2. تحقق من جودة استخراج البيانات
      if (!result.info || !result.info.fullName) {
          setRejectionReason("يا بشمهندس 🤖، تعذر استخراج البيانات من الملف.");
          setIsProcessing(false);
          return;
      }

      // 3. تحقق من التكرار بشكل آمن
      const rEmail = result.info.email?.toLowerCase()?.trim();
      const rPhone = result.info.phone?.replace(/\s/g, '');

      const duplicateExists = candidates.some(c => {
        const cEmail = c.info?.email?.toLowerCase()?.trim();
        const cPhone = c.info?.phone?.replace(/\s/g, '');
        
        const emailMatch = rEmail && cEmail && rEmail === cEmail;
        const phoneMatch = rPhone && cPhone && rPhone === cPhone;

        return emailMatch || phoneMatch;
      });

      if (duplicateExists) {
        setIsDuplicate(true);
        setIsProcessing(false);
        return;
      }

      // 4. النجاح
      const newCandidate: CandidateData = {
        ...result,
        id: crypto.randomUUID(),
        fileName: file.name,
        uploadDate: new Date().toLocaleDateString('ar-EG'),
        status: 'Under Review'
      } as CandidateData;
      
      onSuccess(newCandidate);
    } catch (err: any) {
      // في حال وجود خطأ في الاتصال أو API
      setError(err.message || "فشل تحليل الملف");
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setRejectionReason(null);
    setError(null);
    setIsDuplicate(false);
    setIsProcessing(false);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="bg-white rounded-3xl p-10 border border-slate-200 overflow-hidden relative min-h-[500px] flex flex-col justify-center shadow-sm">
        {isProcessing && <div className="scanner-laser absolute top-0 left-0 w-full z-20"></div>}
        
        {!rejectionReason && !isDuplicate && !isProcessing && (
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black mb-3 text-slate-900">تحليل السيرة الذاتية</h2>
            <p className="text-slate-500 font-bold">ارفع ملف الـ CV وسيقوم شهماوي باستخلاص المهارات والخبرة فوراً.</p>
          </div>
        )}

        {isProcessing ? (
          <PhosphorescentSphereAnalysis />
        ) : isDuplicate ? (
          <DuplicateAlert onRetry={handleRetry} />
        ) : rejectionReason ? (
          <SadRobotError message={rejectionReason} onRetry={handleRetry} />
        ) : (
          <div
            className="border-[3px] border-dashed border-slate-100 rounded-[2.5rem] p-20 text-center hover:border-blue-300 hover:bg-slate-50 transition-all cursor-pointer group"
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input 
              id="fileInput" 
              type="file" 
              accept=".pdf" 
              className="hidden" 
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} 
            />
            <div className="group-hover:scale-110 transition-transform duration-300 text-slate-300">
              <UploadIcon />
            </div>
            <p className="text-xl font-black text-slate-900 mt-4">انقر أو اسحب ملف الـ CV هنا (PDF فقط)</p>
          </div>
        )}

        {error && !rejectionReason && !isDuplicate && !isProcessing && (
          <div className="mt-6 p-4 bg-red-50 text-red-500 rounded-xl text-center font-bold border border-red-100">
            {error}
          </div>
        )}
        
        {!isProcessing && (
          <button onClick={onCancel} className="mt-8 text-slate-400 font-bold hover:text-slate-600 transition-all text-sm uppercase tracking-widest">
            إلغاء العملية
          </button>
        )}
      </div>
    </div>
  );
};