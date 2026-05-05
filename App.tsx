
import React, { useState, useEffect } from 'react';
import { AppView, CandidateData, CandidateStatus, CandidateEvaluation, InterviewQuestions, PreScreeningResult } from './types';
import { Dashboard } from './components/Dashboard';
import { Uploader } from './components/Uploader';
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

import { PublicPortal } from './components/PublicPortal';

const App: React.FC = () => {
  const getInitialView = () => {
      const pathname = window.location.pathname;
      if (pathname === '/apply' || pathname === '/apply/') {
          return AppView.PUBLIC_PORTAL;
      }
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'portal') {
          return AppView.PUBLIC_PORTAL;
      }
      return db.isCloudEnabled() ? AppView.HOME : AppView.LOGIN;
  };

  const [currentView, setCurrentView] = useState<AppView>(getInitialView());
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [comparisonCandidates, setComparisonCandidates] = useState<CandidateData[]>([]);
  const [isLoading, setIsLoading] = useState(db.isCloudEnabled());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [prescreenCandidateId, setPrescreenCandidateId] = useState<string | null>(null);
  const [headhunterQuery, setHeadhunterQuery] = useState<string>('');
  const [detailsSourceView, setDetailsSourceView] = useState<AppView>(AppView.DASHBOARD);

  // Dashboard Persistent Search State
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [dashboardRankedIds, setDashboardRankedIds] = useState<string[] | null>(null);

  const [projectDnaDesc, setProjectDnaDesc] = useState('');
  const [projectDnaResults, setProjectDnaResults] = useState<any[] | null>(null);
  const [isProjectDnaAnalyzing, setIsProjectDnaAnalyzing] = useState(false);

  useEffect(() => {
    const init = async () => {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('prescreen_id');
      const view = params.get('view');

      if (id) {
          setPrescreenCandidateId(id);
          setCurrentView(AppView.PRE_SCREEN_FORM);
      }

      // Do NOT fetch all data if the user is just looking at the public portal.
      if (view === 'portal' || (!db.isCloudEnabled() && !id)) {
          setIsLoading(false);
          return;
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
      const exists = candidates.some(c => c.id === newC.id);
      if (exists) {
        // Assume already updated in DB, or we can update it here.
        // Actually, Uploader.tsx ALREADY called db.updateOffer(), so we just update state.
        setCandidates(prev => prev.map(c => c.id === newC.id ? newC : c));
      } else {
        await db.addOffer(newC as any);
        setCandidates(prev => [newC, ...prev]);
      }
      setDetailsSourceView(AppView.DASHBOARD);
      setSelectedCandidate(newC);
      setCurrentView(AppView.DETAILS);
    } catch (e: any) {
      console.error(e);
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

  useEffect(() => {
    let active = true;
    const processUnanalyzed = async () => {
        // Find unanalyzed candidates
        const unanalyzed = candidates.filter(c => c.isAnalyzed === false && c.cvUrl);
        if (unanalyzed.length === 0) return;

        // Process only when on Dashboard, Home, etc (not on Public Portal)
        if (currentView === AppView.PUBLIC_PORTAL || currentView === AppView.PRE_SCREEN_FORM || currentView === AppView.LOGIN) return;

        try {
            const { analyzeCvPdf } = await import('./services/geminiService');
            const { normalizePhone, normalizeNationality, normalizeName } = await import('./services/db');

            for (const c of unanalyzed) {
                if (!active) break;
                try {
                    // Fetch the file as blob
                    const res = await fetch(c.cvUrl!);
                    if (!res.ok) throw new Error("Failed to fetch PDF");
                    const blob = await res.blob();
                    const file = new File([blob], c.fileName || 'cv.pdf', { type: 'application/pdf' });
                    
                    // Analyze
                    const result = await analyzeCvPdf(file);
                    
                    if (result.isCV === false) {
                        await db.deleteOffers([c.id]);
                        setCandidates(prev => prev.filter(x => x.id !== c.id));
                        continue;
                    }

                    // Check for duplicates
                    result.info.fullName = normalizeName(result.info.fullName);
                    result.info.nationality = normalizeNationality(result.info.nationality);
                    const rawEmail = result.info.email?.toLowerCase().trim();
                    const rEmail = rawEmail || '';
                    const rPhoneFingerprint = normalizePhone(result.info.phone);
                    const rName = result.info.fullName;

                    const duplicateCandidate = candidates.find(existing => {
                        if (existing.id === c.id) return false;
                        if (existing.isAnalyzed === false) return false;
                        
                        const cEmail = existing.info?.email?.toLowerCase()?.trim() || '';
                        const cPhoneFingerprint = normalizePhone(existing.info?.phone || '');
                        const cName = normalizeName(existing.info?.fullName || '');
                        
                        const emailMatch = rEmail && cEmail && rEmail === cEmail;
                        const phoneMatch = rPhoneFingerprint && cPhoneFingerprint && rPhoneFingerprint === cPhoneFingerprint;
                        const nameMatch = rName && cName && rName === cName;
                        return emailMatch || phoneMatch || nameMatch;
                    });

                    if (duplicateCandidate) {
                        // Duplicate found, delete the new one
                        await db.deleteOffers([c.id]);
                        setCandidates(prev => prev.filter(x => x.id !== c.id));
                    } else {
                        // Safe to update
                        const updated = {
                            ...c,
                            ...result,
                            isAnalyzed: true,
                            status: 'Under Review' as CandidateStatus
                        };
                        await db.updateOffer(updated as any);
                        setCandidates(prev => prev.map(x => x.id === c.id ? updated : x));
                    }
                } catch (e) {
                    console.error("Failed to process unanalyzed candidate", c.id, e);
                }
            }
        } catch(e) {
            console.error("Could not load processor", e);
        }
    };
    
    if (db.isCloudEnabled()) {
        processUnanalyzed();
    }
    return () => { active = false; };
  }, [candidates, currentView]);

  if (currentView === AppView.PUBLIC_PORTAL) {
      return (
          <PublicPortal onGoToLogin={() => setCurrentView(db.isCloudEnabled() ? AppView.HOME : AppView.LOGIN)} />
      );
  }

  if (currentView === AppView.PRE_SCREEN_FORM) {
      if (isLoading && candidates.length === 0) {
          return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-t-blue-600 border-slate-200 rounded-full animate-spin"></div></div>;
      }
      const candidate = candidates.find(c => c.id === prescreenCandidateId);
      if (!candidate) return <div className="min-h-screen flex items-center justify-center p-6 text-center">عذراً، الرابط غير صالح.</div>;
      return <PreScreeningForm candidate={candidate} onSubmit={handlePrescreenSubmit} />;
  }

  return (
    <div className="min-h-screen bg-transparent text-right flex flex-col font-sans text-slate-800" dir="rtl">
      {currentView === AppView.LOGIN && !db.isCloudEnabled() && (
        <LoginView onOpenSettings={() => setIsSettingsOpen(true)} />
      )}
      <header className="ai-header-border sticky top-0 z-50 no-print transition-all duration-300">
        <div className="container mx-auto px-4 md:px-8 py-3 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setCurrentView(AppView.HOME)}>
             <img src="https://i.postimg.cc/ncjVcLhs/Whats-App-Image-2026-01-21-at-4-14-40-PM.jpg" alt="Shahm Logo" className="h-[120px] w-auto object-contain rounded-md transition-transform group-hover:scale-105 shadow-sm" referrerPolicy="no-referrer" />
          </div>
          <div className="flex items-center gap-3">
              <button onClick={() => setCurrentView(AppView.HOME)} className={`p-2 rounded-lg border transition-all duration-200 ${currentView === AppView.HOME ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`} title="الرئيسية">
                  <HomeIcon className="w-5 h-5" />
              </button>
              <button onClick={() => setIsSettingsOpen(true)} className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-all duration-200 ${db.isCloudEnabled() ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}>
                 <CloudIcon className="w-4 h-4" />
                 <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">{db.isCloudEnabled() ? 'Cloud Sync' : 'Local Mode'}</span>
              </button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 md:px-8 py-8 flex-1 relative">
        {isLoading && db.isCloudEnabled() ? (
          <div className="flex flex-col items-center justify-center py-32 animate-fade-in">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium animate-pulse">جاري مزامنة البيانات...</p>
          </div>
        ) : (
          <div className="animate-fade-in w-full h-full">
            {currentView === AppView.HOME && <HomeLaunchpad onNavigate={setCurrentView} totalCandidates={candidates.length} />}
            {currentView === AppView.DASHBOARD && <Dashboard candidates={candidates} aiSearchQuery={dashboardSearchQuery} setAiSearchQuery={setDashboardSearchQuery} aiRankedIds={dashboardRankedIds} setAiRankedIds={setDashboardRankedIds} onViewCandidate={(c) => { setDetailsSourceView(AppView.DASHBOARD); setSelectedCandidate(c); setCurrentView(AppView.DETAILS); }} onCompare={handleCompare} onDelete={handleDelete} onUpdateStatus={handleUpdateStatus} onNavigate={setCurrentView} onExport={() => {}} onRefresh={() => fetchCandidates(true)} />}
            {currentView === AppView.HIRE_FOR_ME && <HireForMeView candidates={candidates} onSaveEvaluation={handleSaveEvaluation} onSaveInterviewQuestions={handleSaveInterviewQuestions} onBack={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.UPLOAD && <Uploader candidates={candidates} onSuccess={handleUploadSuccess} onCancel={() => setCurrentView(AppView.HOME)} onDuplicateUpdated={(updated) => { setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c)); }} />}
            {currentView === AppView.DETAILS && selectedCandidate && <AnalysisView candidate={selectedCandidate} onBack={() => setCurrentView(detailsSourceView)} backLabel={detailsSourceView === AppView.PROJECT_DNA ? "العودة للبحث" : (dashboardRankedIds && detailsSourceView === AppView.DASHBOARD ? "العودة لنتائج البحث" : "العودة للوحة التحكم")} onUpdate={c => { setCandidates(prev => prev.map(o => o.id === c.id ? c : o)); setSelectedCandidate(c); }} onNavigateToHeadhunter={navigateToHeadhunter} />}
            {currentView === AppView.COMPARISON && <ComparisonView candidates={comparisonCandidates} onBack={() => setCurrentView(AppView.DASHBOARD)} />}
            {currentView === AppView.TRUTH_LENS && <TruthLensView candidates={candidates} onBack={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.PSYCHO_PROFILER && <PsychoProfilerView candidates={candidates} onBack={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.SITE_SIMULATOR && <SiteSimulatorView candidates={candidates} onBack={() => setCurrentView(AppView.HOME)} />}
            {currentView === AppView.PROJECT_DNA && <ProjectDNAView candidates={candidates} onBack={() => setCurrentView(AppView.HOME)} onNavigateToHeadhunter={navigateToHeadhunter} onViewCandidate={(c) => { setDetailsSourceView(AppView.PROJECT_DNA); setSelectedCandidate(c); setCurrentView(AppView.DETAILS); }} projectDesc={projectDnaDesc} setProjectDesc={setProjectDnaDesc} results={projectDnaResults} setResults={setProjectDnaResults} isAnalyzing={isProjectDnaAnalyzing} setIsAnalyzing={setIsProjectDnaAnalyzing} />}
            {currentView === AppView.SMART_HEADHUNTER && <SmartHeadhunterView initialQuery={headhunterQuery} onBack={() => { setHeadhunterQuery(''); setCurrentView(AppView.HOME); }} />}
          </div>
        )}
      </main>
      <footer className="py-6 mt-auto border-t border-slate-200/60 text-center no-print">
         <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Shahm Contracting © {new Date().getFullYear()} - Enterprise AI Suite</p>
      </footer>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
};
export default App;
