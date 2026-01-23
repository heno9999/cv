
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
            supabase = createClient(url.trim(), key.trim(), { auth: { persistSession: false } });
            return true;
        } catch (e) { return false; }
    }
    return false;
};

initSupabase();

export const db = {
  isCloudEnabled: () => !!supabase,

  async getOffers(): Promise<CandidateData[]> {
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

        return allData.map((row: any) => row.payload) || [];
      } catch (e: any) {
        if (e.message?.includes('fetch') || e.name === 'TypeError') {
            throw new Error("فشل الاتصال بخادم سوبابيس (Failed to fetch). يرجى التأكد من صحة رابط المشروع (URL) والمفتاح (Key) في الإعدادات.");
        }
        throw new Error(`خطأ في جلب البيانات: ${e.message}`);
      }
    } else {
      const saved = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
      return saved ? JSON.parse(saved) : [];
    }
  },

  async addOffer(offer: CandidateData): Promise<void> {
    if (supabase) {
      try {
        const { error } = await supabase.from('offers').insert([{ payload: offer }]);
        if (error) throw error;
      } catch (e: any) {
        if (e.message?.includes('fetch') || e.name === 'TypeError') {
            throw new Error("فشل الاتصال بخادم سوبابيس أثناء الحفظ. تأكد من إعدادات الشبكة.");
        }
        throw new Error(`سوبابيس رفض الحفظ: ${e.message}`);
      }
    } else {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
        const current = saved ? JSON.parse(saved) : [];
        localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify([...current, offer]));
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          throw new Error("ذاكرة المتصفح ممتلئة! يرجى تفعيل السحابة (Supabase) لحفظ مزيد من البيانات.");
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
        if (e.message?.includes('fetch') || e.name === 'TypeError') {
            throw new Error("فشل الاتصال بخادم سوبابيس أثناء التحديث.");
        }
        throw new Error(`فشل تحديث البيانات في سوبابيس: ${e.message}`);
      }
    } else {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_DB_KEY);
        if (saved) {
          const current: CandidateData[] = JSON.parse(saved);
          const updated = current.map(o => o.id === updatedOffer.id ? updatedOffer : o);
          localStorage.setItem(LOCAL_STORAGE_DB_KEY, JSON.stringify(updated));
        }
      } catch (e: any) {
        if (e.name === 'QuotaExceededError') {
          throw new Error("لا يمكن تحديث السجل؛ ذاكرة المتصفح ممتلئة.");
        }
        throw e;
      }
    }
  },

  async deleteOffers(ids: string[]): Promise<void> {
    if (supabase) {
      try {
        for (const id of ids) {
          const { error } = await supabase.from('offers').delete().filter('payload->>id', 'eq', id);
          if (error) throw error;
        }
      } catch (e: any) {
        if (e.message?.includes('fetch') || e.name === 'TypeError') {
            throw new Error("فشل الاتصال بخادم سوبابيس أثناء الحذف.");
        }
        throw new Error(`خطأ أثناء الحذف من سوبابيس: ${e.message}`);
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

  testConnection: async (url: string, key: string) => {
    try {
      const tempClient = createClient(url.trim(), key.trim(), { auth: { persistSession: false } });
      const { error } = await tempClient.from('offers').select('id').limit(1);
      return { success: !error, error: error?.message };
    } catch (e: any) { return { success: false, error: e.message }; }
  },

  saveCredentials: (url: string, key: string) => {
      localStorage.setItem(LOCAL_STORAGE_CREDS_KEY, JSON.stringify({ url: url.trim(), key: key.trim() }));
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
