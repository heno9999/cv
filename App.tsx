
import React, { useState, useEffect } from 'react';
import { AppView, CandidateData, CandidateStatus, CandidateEvaluation, InterviewQuestions, PreScreeningResult } from './types';
import { Dashboard } from './components/Dashboard';
import { Uploader } from './components/Uploader';
import { BulkUploader } from './components/BulkUploader';
import { AnalysisView } from './components/AnalysisView';
import { ComparisonView } from './components/ComparisonView';
import { HireForMeView } from './components/HireForMeView';
import { SettingsModal } from './components/SettingsModal';
import { LoginView } from './components/LoginView';
import { HomeLaunchpad } from './components/HomeLaunchpad';
import { TruthLensView } from './components/TruthLensView';
import { PsychoProfilerView } from './components/PsychoProfilerView';
import { SiteSimulatorView } from './components/SiteSimulatorView';
import { ProjectDNAView } from './components/ProjectDNAView';
import { SmartHeadhunterView } from './components/SmartHeadhunterView';
import { PreScreeningForm } from './components/PreScreeningForm';
import { db } from './services/db';
import { CloudIcon, HomeIcon } from './components/Icons';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(db.isCloudEnabled() ? AppView.HOME : AppView.LOGIN);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [comparisonCandidates, setComparisonCandidates] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(db.isCloudEnabled());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [prescreenCandidateId, setPrescreenCandidateId] = useState<string | null>(null);
  const [headhunterQuery, setHeadhunterQuery] = useState<string>('');
  const [detailsSourceView, setDetailsSourceView] = useState<AppView>(AppView.DASHBOARD);

  const [projectDnaDesc, setProjectDnaDesc] = useState('');
  const [projectDnaResults, setProjectDnaResults] = useState<any[] | null>(null);
  const [isProjectDnaAnalyzing, setIsProjectDnaAnalyzing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('prescreen_id');
      if (id) {
          setPrescreenCandidateId(id);
          setCurrentView(AppView.PRE_SCREEN_FORM);
      }
      if (db.isCloudEnabled() || !!id) {
        setIsLoading(true);
        try {
          const data = await db.getOffers();
          setCandidates(data as unknown as CandidateData[]);
        } catch (e: any) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      }
    };
    init();
  }, []);

  const fetchCandidates = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const data = await db.getOffers(); 
      setCandidates(data as unknown as CandidateData[]);
    } catch (e: any) {
      console.error(e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleUploadSuccess = async (newC: CandidateData) => {
    try {
      await db.addOffer(newC as any);
      setCandidates(prev => [newC, ...prev]);
      setDetailsSourceView(AppView.DASHBOARD);
      setSelectedCandidate(newC);
      setCurrentView(AppView.DETAILS);
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleBulkSuccess = async (newCandidates: CandidateData[]) => {
    try {
      // Add all new candidates to DB
      for (const c of newCandidates) {
          await db.addOffer(c as any);
      }
      setCandidates(prev => [...newCandidates, ...prev]);
    } catch (e: any) {
      console.error(e);
      throw e;
    }
  };

  const handleDelete = async (ids: string[]) => {
    try {
      await db.deleteOffers(ids);
      setCandidates(prev => prev.filter(c => !ids.includes(c.id)));
    } catch (e: any) {}
  };

  const handleUpdateStatus = async (ids: string[], status: CandidateStatus) => {
    try {
      for (const id of ids) {
        const found = candidates.find(c => c.id === id);
        if (found) {
            const updated = { ...found, status };
            await db.updateOffer(updated as any);
        }
      }
      setCandidates(prev => prev.map(c => ids.includes(c.id) ? { ...c, status } : c));
    } catch (e: any) {}
  };

  const handleSaveEvaluation = async (candidateId: string, evaluation: CandidateEvaluation) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      try {
        const updated = { ...candidate, evaluation };
        await db.updateOffer(updated as any);
        setCandidates(prev => prev.map(c => c.id === candidateId ? updated : c));
      } catch (e: any) {}
    }
  };

  const handleSaveInterviewQuestions = async (candidateId: string, interviewQuestions: InterviewQuestions) => {
    const candidate = candidates.find(c => c.id === candidateId);
    if (candidate) {
      try {
        const updated = { ...candidate, interviewQuestions };
        await db.updateOffer(updated as any);
        setCandidates(prev => prev.map(c => c.id === candidateId ? updated : c));
      } catch (e: any) {}
    }
  };

  const handlePrescreenSubmit = async (result: PreScreeningResult) => {
      if (!prescreenCandidateId) return;
      const candidate = candidates.find(c => c.id === prescreenCandidateId);
      if (candidate) {
          try {
              const newStatus: CandidateStatus = result.iqamaTransfer === 'No' ? 'غير مناسب' : 'تم الرد (فحص أولي)';
              const updated = { ...candidate, status: newStatus, preScreening: result };
              await db.updateOffer(updated as any);
              setCandidates(prev => prev.map(c => c.id === prescreenCandidateId ? updated : c));
          } catch (e: any) {}
      }
  };

  const handleCompare = (selected: CandidateData[]) => {
    setComparisonCandidates(selected);
    setCurrentView(AppView.COMPARISON);
  };

  const navigateToHeadhunter = (query: string) => {
    setHeadhunterQuery(query);
    setCurrentView(AppView.SMART_HEADHUNTER);
  };

  if (currentView === AppView.PRE_SCREEN_FORM) {
      if (isLoading && candidates.length === 0) {
          return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-t-blue-600 border-slate-200 rounded-full animate-spin"></div></div>;
      }
      const candidate = candidates.find(c => c.id === prescreenCandidateId);
      if (!candidate) return <div className="min-h-screen flex items-center justify-center p-6 text-center">عذراً، الرابط غير صالح.</div>;
      return <PreScreeningForm candidate={candidate} onSubmit={handlePrescreenSubmit} />;
  }

  return (
    <div className="min-h-screen bg-white text-right flex flex-col" dir="rtl">
      {currentView === AppView.LOGIN && !db.isCloudEnabled() && (
        <LoginView onOpenSettings={() => setIsSettingsOpen(true)} />
      )}
      <header className="ai-header-border text-slate-900 shadow-sm sticky top-0 z-50 no-print">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6 cursor-pointer" onClick={() => setCurrentView(AppView.HOME)}>
             <div className="ai-voice-orb"></div>
             <h1 className="text-xl font-black tracking-tighter" dir="ltr">
                <span className="ai-text-shimmer">SHAHM HR MANAGEMENT</span>
             </h1>
          </div>
          <div className="flex items-center gap-4">
              <button onClick={() => setCurrentView(AppView.HOME)} className={`p-2.5 rounded-xl border ${currentView === AppView.HOME ? 'bg-slate-100 border-slate-300' : 'bg-white border-transparent hover:bg-slate-50'}`}>
                  <HomeIcon className="w-5 h-5 text-slate-600" />
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className="bg-emerald-50 text-emerald-600 text-[10px] px-3 py-2.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 hover:bg-emerald-100 transition-all">
                 <CloudIcon className="w-3.5 h-3.5" />
                 <span className="font-black uppercase tracking-tighter hidden md:inline">{db.isCloudEnabled() ? 'Cloud' : 'Offline'}</span>
              </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8 flex-1 relative">
        {isLoading && db.isCloudEnabled() ? (
          <div className="flex flex-col items-center justify-center py-32"><div className="w-10 h-10 border-4 border-t-blue-600 border-slate-100 rounded-full animate-spin"></div></div>
        ) : (
          <>
            {currentView === AppView.HOME && <HomeLaunchpad onNavigate={setCurrentView} totalCandidates={candidates.length} />}
            {currentView === AppView.DASHBOARD && <Dashboard candidates={candidates} onViewCandidate={(c) => { setDetailsSourceView(AppView.DASHBOARD); setSelectedCandidate(c); setCurrentView(AppView.DETAILS); }} onCompare={handleCompare} onDelete={handleDelete} onUpdateStatus={handleUpdateStatus} onNavigate={setCurrentView} onExport={() => {}} onRefresh={() => fetchCandidates(true)} />}
            {currentView === AppView.HIRE_FOR_ME && <HireForMeView candidates={candidates} onSaveEvaluation={handleSaveEvaluation} onSaveInterviewQuestions={handleSaveInterviewQuestions} onBack={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.UPLOAD && <Uploader candidates={candidates} onSuccess={handleUploadSuccess} onCancel={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.BULK_UPLOAD && <BulkUploader candidates={candidates} onSuccessBulk={handleBulkSuccess} onBack={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.DETAILS && selectedCandidate && <AnalysisView candidate={selectedCandidate} onBack={() => setCurrentView(detailsSourceView)} backLabel={detailsSourceView === AppView.PROJECT_DNA ? "العودة للبحث" : "العودة للوحة التحكم"} onUpdate={c => { setCandidates(prev => prev.map(o => o.id === c.id ? c : o)); setSelectedCandidate(c); }} onNavigateToHeadhunter={navigateToHeadhunter} />}
            {currentView === AppView.COMPARISON && <ComparisonView candidates={comparisonCandidates} onBack={() => setCurrentView(AppView.DASHBOARD)} />}
            {currentView === AppView.TRUTH_LENS && <TruthLensView candidates={candidates} onBack={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.PSYCHO_PROFILER && <PsychoProfilerView candidates={candidates} onBack={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.SITE_SIMULATOR && <SiteSimulatorView candidates={candidates} onBack={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.PROJECT_DNA && <ProjectDNAView candidates={candidates} onBack={() => setCurrentView(AppView.HOME)} onNavigateToHeadhunter={navigateToHeadhunter} onViewCandidate={(c) => { setDetailsSourceView(AppView.PROJECT_DNA); setSelectedCandidate(c); setCurrentView(AppView.DETAILS); }} projectDesc={projectDnaDesc} setProjectDesc={setProjectDnaDesc} results={projectDnaResults} setResults={setProjectDnaResults} isAnalyzing={isProjectDnaAnalyzing} setIsAnalyzing={setIsProjectDnaAnalyzing} />}
            {currentView === AppView.SMART_HEADHUNTER && <SmartHeadhunterView initialQuery={headhunterQuery} onBack={() => { setHeadhunterQuery(''); setCurrentView(AppView.HOME); }} />}
          </>
        )}
      </main>
      <footer className="py-8 border-t border-slate-100 text-center no-print opacity-50">
         <p className="text-[9px] text-slate-400 font-black tracking-widest uppercase">SHAHM CONTRACTING - AI SUITE v6.5</p>
      </footer>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
export default App;
