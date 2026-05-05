
export type CandidateStatus = 
    | 'Under Review' 
    | 'غير مناسب' 
    | 'مرشح للعمل كفري لانسر' 
    | 'تمت المقابلة والتقييم' 
    | 'جاري المقابلة' 
    | 'مناسب'
    | 'تم الرد (فحص أولي)'
    | 'ملف جديد (بوابة التقديم)';

export interface CandidateInfo {
    fullName: string;
    jobTitle: string;
    specialty: string;
    nationality: string;
    experienceYears: string;
    ksaExperience?: string;
    age: string;
    education: string;
    jobStability: string;
    phone: string;
    email: string;
}

export interface CandidateAnalysis {
    professionalOpinion: string;
    strengths: string[];
    fitnessForShahm: string;
    fitnessScore: number;
    keySkills: string[];
    certifications: string[];
    majorCompaniesExperience: string;
}

export interface CandidateEvaluation {
    score: number;
    hrScore?: number;
    techScore?: number;
    finalScore?: number;
    hrEvaluation: string;
    technicalEvaluation: string;
    finalEvaluation: string;
    interviewDate?: string;
    interviewType?: 'حضورية' | 'عن بُعد (أونلاين)';
    interviewerName?: string;
    recruitmentDoctorPass?: boolean;
}

export interface InterviewQuestions {
    behavioral: string[];
    technical: string[];
    risk: string[];
    culture: string[];
}

export interface PreScreeningResult {
    iqamaTransfer: 'Yes' | 'No';
    noticePeriod: string;
    currentSalary: string;
    expectedSalary: string;
    submittedAt: string;
}

export interface NegotiationStrategy {
    estimatedMarketSalary: {
        min: number;
        max: number;
        currency: string;
    };
    negotiationLevers: string[];
    candidateSellingPoints: string[];
    marketDemand: 'High' | 'Medium' | 'Low';
}

export interface CandidateData {
    id: string;
    fileName: string;
    uploadDate: string;
    status: CandidateStatus;
    info: CandidateInfo;
    analysis: CandidateAnalysis;
    evaluation?: CandidateEvaluation;
    interviewQuestions?: InterviewQuestions;
    preScreening?: PreScreeningResult;
    negotiationStrategy?: NegotiationStrategy;
    truthLens?: {
        score: number;
        report: string;
        flags: string[];
    };
    rawText?: string;
    cvUrl?: string;
    source?: 'portal' | 'manual';
    isAnalyzed?: boolean;
}

export enum AppView {
    PUBLIC_PORTAL = 'PUBLIC_PORTAL',
    PUBLIC_UPLOAD = 'PUBLIC_UPLOAD',
    LOGIN = 'LOGIN',
    HOME = 'HOME',
    DASHBOARD = 'DASHBOARD',
    UPLOAD = 'UPLOAD',
    DETAILS = 'DETAILS',
    COMPARISON = 'COMPARISON',
    HIRE_FOR_ME = 'HIRE_FOR_ME',
    TRUTH_LENS = 'TRUTH_LENS',
    PSYCHO_PROFILER = 'PSYCHO_PROFILER',
    SITE_SIMULATOR = 'SITE_SIMULATOR',
    PRE_SCREEN_FORM = 'PRE_SCREEN_FORM',
    PROJECT_DNA = 'PROJECT_DNA',
    SMART_HEADHUNTER = 'SMART_HEADHUNTER'
}
