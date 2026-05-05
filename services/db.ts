
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CandidateData } from '../types';

declare const process: {
  env: {
    API_KEY?: string;
    SUPABASE_URL?: string;
    SUPABASE_KEY?: string;
  }
};

const LOCAL_STORAGE_DB_KEY = 'shahm_offers_db';
const LOCAL_STORAGE_CREDS_KEY = 'shahm_supabase_creds';

let supabase: SupabaseClient | null = null;

const initSupabase = () => {
    let url = typeof process !== 'undefined' ? process.env?.SUPABASE_URL : undefined;
    let key = typeof process !== 'undefined' ? process.env?.SUPABASE_KEY : undefined;

    // Check URL parameters first (used for mobile QR code access)
    try {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const sbUrl = params.get('sb_url');
            const sbKey = params.get('sb_key');
            if (sbUrl && sbKey) {
                url = sbUrl;
                key = sbKey;
                // Save it so we don't have to keep it in the URL on reload
                localStorage.setItem(LOCAL_STORAGE_CREDS_KEY, JSON.stringify({ url, key }));
                // Clean up the URL parameters so it doesn't stay visible
                const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?view=portal";
                window.history.replaceState({path: newUrl}, '', newUrl);
            }
        }
    } catch (e) {}

    if (!url || !key) {
        try {
            const savedCreds = localStorage.getItem(LOCAL_STORAGE_CREDS_KEY);
            if (savedCreds) {
                const parsed = JSON.parse(savedCreds);
                url = parsed.url;
                key = parsed.key;
            }
        } catch (e) {}
    }

    if (url && key && url.trim() !== '' && key.trim() !== '') {
        try {
            let cleanUrl = url.trim();
            if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
                cleanUrl = 'https://' + cleanUrl;
            }
            supabase = createClient(cleanUrl, key.trim(), { auth: { persistSession: false } });
            return true;
        } catch (e) { return false; }
    }
    return false;
};

initSupabase();

/** 
 * Data Normalization Utilities 
 */

export const normalizeNationality = (nat: string): string => {
  if (!nat) return '';
  let n = nat.trim();
  // Remove feminine endings common in Arabic nationalities
  if (n.endsWith('ية')) {
    // Exception for nationalities where removing 'ية' breaks the root, but most follow this pattern:
    // مصرية -> مصري, سعودية -> سعودي, سورية -> سوري
    n = n.substring(0, n.length - 1);
  }
  return n;
};

export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  // Keep only digits
  let cleaned = phone.replace(/\D/g, '');
  // Normalize Saudi numbers (the most common in this app)
  // If starts with 966, keep only the suffix starting from 5
  if (cleaned.startsWith('966')) cleaned = cleaned.substring(3);
  // If starts with 00966, keep only the suffix starting from 5
  if (cleaned.startsWith('00966')) cleaned = cleaned.substring(5);
  // If starts with 05, remove the 0
  if (cleaned.startsWith('05')) cleaned = cleaned.substring(1);
  return cleaned;
};

export const normalizeName = (name: string): string => {
  if (!name) return '';
  return name.trim().replace(/\s+/g, ' ');
};

export const db = {
  isCloudEnabled: () => !!supabase,

  async getOffers(): Promise<CandidateData[]> {
    let rawOffers: CandidateData[] = [];
    if (supabase) {
      try {
        let allData: any[] = [];
        let from = 0;
        const pageSize = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('offers')
            .select('payload')
            .order('created_at', { ascending: false })
            .range(from, from + pageSize - 1);

          if (error) throw error;

          if (data && data.length > 0) {
            allData = [...allData, ...data];
            if (data.length < pageSize) {
              hasMore = false;
            } else {
              from += pageSize;
            }
          } else {
            hasMore = false;
          }
          
          if (allData.length >= 20000) break;
        }

        rawOffers = allData
          .map((row: any) => row.payload)
          .filter(p => p && p.id && p.info) || [];
      } catch (e: any) {
        console.error("Database Fetch Error:", e);
        if (e.message?.includes('fetch') || e.name === 'TypeError') {
            throw new Error(`فشل الاتصال بخادم سوبابيس. يرجى الذهاب إلى لوحة تحكم سوبابيس (Authentication -> URL Configuration) وإضافة الرابط التالي في قائمة Site URL أو CORS allowed origins: \n\n${window.location.origin}\n\nتفاصيل الخطأ: ${e.message}`);
        }
        throw new Error(`خطأ في جلب البيانات: ${e.message}`);
      }
    } else {
      const saved = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      rawOffers = saved ? JSON.parse(saved) : [];
    }

    // --- DATA NORMALIZATION & DEDUPLICATION ---
    const seenMap = new Map<string, CandidateData>();

    rawOffers.forEach(offer => {
      // 1. Clean data fields
      offer.info.fullName = normalizeName(offer.info.fullName);
      offer.info.nationality = normalizeNationality(offer.info.nationality);
      offer.info.email = offer.info.email?.toLowerCase().trim() || '';
      
      // 2. Create Fingerprint for Deduplication (Phone + Email)
      const phoneFingerprint = normalizePhone(offer.info.phone);
      const emailFingerprint = offer.info.email;
      
      let fingerprint = `${phoneFingerprint}|${emailFingerprint}`;
      // If the candidate has no phone or email, we don't want to merge them all together into one blob!
      if (!phoneFingerprint && !emailFingerprint) {
        fingerprint = offer.id || Math.random().toString();
      }

      // 3. Keep the most "complete" or recent version
      if (seenMap.has(fingerprint)) {
        const existing = seenMap.get(fingerprint)!;
        // Basic heuristic: if current has more data (e.g. analysis, evaluation), keep it.
        // Or if it has a better fitness score.
        const existingScore = existing.analysis?.fitnessScore || 0;
        const currentScore = offer.analysis?.fitnessScore || 0;
        
        if (currentScore > existingScore || (offer.preScreening && !existing.preScreening)) {
          seenMap.set(fingerprint, offer);
        }
      } else {
        seenMap.set(fingerprint, offer);
      }
    });

    return Array.from(seenMap.values());
  },

  async addOffer(offer: CandidateData): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase.from('offers').insert([{ payload: offer }]);
        if (error) throw error;
      } catch (e: any) {
        throw new Error(`سوبابيس رفض الحفظ: ${e.message}`);
      }
    } else {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
        const current = saved ? JSON.parse(saved) : [];
        localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify([...current, offer]));
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          throw new Error("ذاكرة المتصفح ممتلئة!");
        }
        throw e;
      }
    }
  },

  async updateOffer(updatedOffer: CandidateData): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase
          .from('offers')
          .update({ payload: updatedOffer })
          .filter('payload->>id', 'eq', updatedOffer.id);
        
        if (error) throw error;
      } catch (e: any) {
        throw new Error(`فشل تحديث البيانات في سوبابيس: ${e.message}`);
      }
    } else {
      const saved = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      if (saved) {
        const current: CandidateData[] = JSON.parse(saved);
        const updated = current.map(o => o.id === updatedOffer.id ? updatedOffer : o);
        localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(updated));
      }
    }
  },

  deleteOffers: async (ids: string[]): Promise<void> => {
    if (supabase) {
      try {
        for (const id of ids) {
          const { error } = await supabase.from('offers').delete().filter('payload->>id', 'eq', id);
          if (error) throw error;
        }
      } catch (e: any) {
        throw new Error(`خطأ أثناء الحذف: ${e.message}`);
      }
    } else {
      const saved = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      if (saved) {
        const current: CandidateData[] = JSON.parse(saved);
        const filtered = current.filter(o => !ids.includes(o.id));
        localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(filtered));
      }
    }
  },

  uploadCvPdf: async (file: File, filename: string): Promise<string | null> => {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.storage
        .from('cvs')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: true
        });
      if (error) throw error;
      
      const { data: publicUrlData } = supabase.storage
        .from('cvs')
        .getPublicUrl(filename);
        
      return publicUrlData.publicUrl;
    } catch (e: any) {
      console.error("فشل رفع ملف السيرة الذاتية:", e);
      return null;
    }
  },

  testConnection: async (url: string, key: string) => {
    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl;
      }
      const tempClient = createClient(cleanUrl, key.trim(), { auth: { persistSession: false } });
      const { error } = await tempClient.from('offers').select('id').limit(1);
      if (error && (error.message?.includes('fetch') || error.message?.includes('TypeError'))) {
          return { success: false, error: `مشكلة في CORS: يرجى الذهاب إلى لوحة تحكم سوبابيس (Authentication -> URL Configuration) وإضافة هذا الرابط (${window.location.origin}) إلى قائمة Site URL أو CORS allowed origins.` };
      }
      return { success: !error, error: error?.message };
    } catch (e: any) { 
        if (e.message?.includes('fetch') || e.message?.includes('TypeError')) {
            return { success: false, error: `مشكلة في CORS: يرجى الذهاب إلى لوحة تحكم سوبابيس (Authentication -> URL Configuration) وإضافة هذا الرابط (${window.location.origin}) إلى قائمة Site URL أو CORS allowed origins.` };
        }
        return { success: false, error: e.message }; 
    }
  },

  saveCredentials: (url: string, key: string) => {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
          cleanUrl = 'https://' + cleanUrl;
      }
      localStorage.setItem(LOCAL_STORAGE_CREDS_KEY, JSON.stringify({ url: cleanUrl, key: key.trim() }));
      window.location.reload();
  },

  clearCredentials: () => {
      localStorage.removeItem(LOCAL_STORAGE_CREDS_KEY);
      window.location.reload();
  },

  subscribe: (callback: (event: { type: 'INSERT' | 'DELETE', payload: CandidateData | string }) => void): () => void => {
    if (!supabase) return () => {};
    const channel = supabase.channel('realtime:offers').on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, (p) => {
        if (p.eventType === 'INSERT' && p.new?.payload) {
            callback({ type: 'INSERT', payload: p.new.payload as CandidateData });
        } else if (p.eventType === 'DELETE' && p.old?.payload?.id) {
            callback({ type: 'DELETE', payload: p.old.payload.id as string });
        }
    }).subscribe();
    return () => supabase.removeChannel(channel);
  }
};
