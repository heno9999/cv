
import { GoogleGenAI, Type } from "@google/genai";


async function callGeminiProxy(payload: any) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Proxy error");
  return data;
}







import { CandidateData, InterviewQuestions, NegotiationStrategy } from '../types';

const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64Content = base64Data.split(',')[1];
      resolve({
        inlineData: {
          data: base64Content,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const CV_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isCV: { type: Type.BOOLEAN, description: "True if the document is a professional CV or Resume, False otherwise." },
    info: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        jobTitle: { type: Type.STRING },
        specialty: { type: Type.STRING, description: "Must be one of: مدني, معماري, كهرباء, ميكانيكا, زراعة, اداري, مراقب, مالية, تكنولوجيا المعلومات, رسام, موارد بشرية, سلسلة امداد" },
        nationality: { type: Type.STRING },
        experienceYears: { type: Type.STRING },
        ksaExperience: { type: Type.STRING },
        age: { type: Type.STRING },
        education: { type: Type.STRING },
        jobStability: { type: Type.STRING },
        phone: { type: Type.STRING },
        email: { type: Type.STRING }
      },
      required: ["fullName", "jobTitle", "specialty", "nationality", "experienceYears", "phone", "email"]
    },
    analysis: {
      type: Type.OBJECT,
      properties: {
        professionalOpinion: { type: Type.STRING },
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        fitnessForShahm: { type: Type.STRING },
        fitnessScore: { type: Type.INTEGER },
        keySkills: { type: Type.ARRAY, items: { type: Type.STRING } },
        certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
        majorCompaniesExperience: { type: Type.STRING }
      },
      required: ["professionalOpinion", "fitnessScore", "fitnessForShahm"]
    }
  },
  required: ["isCV"]
};

const SYSTEM_INSTRUCTION = `
أنت خبير توظيف فني لشركة "شهم للمقاولات". مهمتك تحليل السير الذاتية بدقة عالية جداً.
يجب عليك الالتزام بالقواعد الصارمة التالية لضمان جودة البيانات:
1. تحديد ما إذا كان الملف سيرة ذاتية (CV/Resume) أم لا.
2. استخراج كافة البيانات باللغة العربية حصراً.
3. التخصص (specialty): يجب أن يطابق تماماً القائمة المحددة في الـ Schema.
4. الجنسية (nationality): يجب استخراجها دائماً بصيغة المذكر الموحدة (مثال: اكتب "مصري" حتى لو كانت السيرة لامرأة، "سعودي" بدلاً من "سعودية"، "أردني" بدلاً من "أردنية").
5. الأسماء (fullName): نظف الاسم من أي ألقاب (مثل م/، مهندس، Mr.) واكتفِ بالاسم الثلاثي أو الرباعي كما هو.
6. خبرة المملكة (ksaExperience): استخرج عدد السنوات فقط كرقم. قاعدة هامة: إذا كانت الجنسية "سعودي"، افترض أن خبرة المملكة تساوي إجمالي سنوات الخبرة ما لم يذكر بوضوح تام أنه عمل خارج المملكة.
7. الاستقرار الوظيفي (jobStability): قيّمه بناءً على مدة البقاء في الشركات [ممتاز, جيد, متوسط, ضعيف] مع شرح موجز.
8. بيانات التواصل: استخرج رقم الجوال والبريد الإلكتروني بدقة تقنية، وتأكد من كتابة البريد الإلكتروني بأحرف صغيرة (lowercase).
`;

export const analyzeCvPdf = async (file: File): Promise<any> => {
  const model = "gemini-3-flash-preview"; 
  const filePart = await fileToGenerativePart(file);
  const response = await callGeminiProxy({
    model: model,
    contents: { parts: [filePart, { text: "حلل السيرة الذاتية المرفقة بدقة بالغة مع الالتزام بتوحيد صيغة الجنسية للمذكر." }] },
    config: { 
      systemInstruction: SYSTEM_INSTRUCTION, 
      responseMimeType: "application/json",
      responseSchema: CV_ANALYSIS_SCHEMA
    }
  });
  
  try {
    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return parsed;
  } catch (e) {
    console.error("JSON Parsing Error:", response.text);
    throw new Error("فشل في معالجة بيانات السيرة الذاتية 🤖");
  }
};

export const rankCandidates = async (candidates: CandidateData[], query: string): Promise<string[]> => {
  const model = "gemini-3-flash-preview";

  const slimCandidates = candidates
    .filter(c => c && c.info) 
    .map(c => ({
      id: c.id,
      name: c.info?.fullName || 'غير معروف',
      job: c.info?.jobTitle || 'غير محدد',
      skills: c.analysis?.keySkills || [],
      exp: c.info?.experienceYears || '0',
      opinion: c.analysis?.professionalOpinion || ''
    }));

  if (slimCandidates.length === 0) return [];

  const prompt = `أنت محرك بحث ذكي لشركة شهم للمقاولات.
  الطلب: "${query}"
  قم بتحليل قائمة المرشحين المرفقة واختر أفضل المطابقات (بحد أقصى 10).
  يجب أن تعتمد في قرارك على البيانات باللغة العربية.
  أرجع فقط JSON يحتوي على مصفوفة "bestCandidateIds".
  البيانات: ${JSON.stringify(slimCandidates)}`;
  
  const response = await callGeminiProxy({ 
    model, 
    contents: prompt, 
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          bestCandidateIds: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["bestCandidateIds"]
      }
    } 
  });
  
  try {
    const result = JSON.parse(response.text || '{"bestCandidateIds":[]}');
    return result.bestCandidateIds || [];
  } catch (e) {
    console.error("Rank Parse Error", e);
    return [];
  }
};

export const generateInterviewQuestions = async (candidate: CandidateData): Promise<InterviewQuestions> => {
  const model = "gemini-3-flash-preview";
  const prompt = `توليد أسئلة مقابلة مخصصة لهذا المرشح باللغة العربية حصراً: ${JSON.stringify(candidate.info)}. ركز على نقاط القوة والضعف المذكورة في تحليله: ${JSON.stringify(candidate.analysis)}. يجب أن تكون الأسئلة احترافية وباللغة العربية الفصحى.`;
  const response = await callGeminiProxy({ 
    model, 
    contents: prompt, 
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          behavioral: { type: Type.ARRAY, items: { type: Type.STRING } },
          technical: { type: Type.ARRAY, items: { type: Type.STRING } },
          risk: { type: Type.ARRAY, items: { type: Type.STRING } },
          culture: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["behavioral", "technical", "risk", "culture"]
      }
    } 
  });
  return JSON.parse(response.text || '{}') as InterviewQuestions;
};

export const analyzeTruthLens = async (candidate: CandidateData): Promise<{ score: number, report: string, flags: string[] }> => {
    const response = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: `قم بالتدقيق الجنائي للسيرة الذاتية التالية بحثاً عن مبالغات أو تناقضات تاريخية. يجب أن يكون التقرير وجميع النتائج باللغة العربية حصراً وبصيغة مهنية: ${JSON.stringify(candidate)}`,
        config: { 
          responseMimeType: "application/json",
          seed: 42, 
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER },
              report: { type: Type.STRING },
              flags: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["score", "report", "flags"]
          }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const analyzePsychometric = async (candidate: CandidateData): Promise<{ archetype: string, traits: string[], analysis: string }> => {
    const response = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: `قم بتحليل النمط النفسي والقيادي باللغة العربية حصراً بناءً على المسيرة المهنية لهذا المرشح: ${JSON.stringify(candidate)}`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              archetype: { type: Type.STRING },
              traits: { type: Type.ARRAY, items: { type: Type.STRING } },
              analysis: { type: Type.STRING }
            },
            required: ["archetype", "traits", "analysis"]
          }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const generateNegotiationStrategy = async (candidate: CandidateData): Promise<NegotiationStrategy> => {
    const response = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: `توليد استراتيجية تفاوض مالية لمرشح في السوق السعودي باللغة العربية حصراً: ${JSON.stringify(candidate.info)}`,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estimatedMarketSalary: {
                type: Type.OBJECT,
                properties: {
                  min: { type: Type.NUMBER },
                  max: { type: Type.NUMBER },
                  currency: { type: Type.STRING }
                },
                required: ["min", "max", "currency"]
              },
              negotiationLevers: { type: Type.ARRAY, items: { type: Type.STRING } },
              candidateSellingPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              marketDemand: { type: Type.STRING }
            },
            required: ["estimatedMarketSalary", "negotiationLevers", "candidateSellingPoints", "marketDemand"]
          }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const generateManagerBrief = async (candidate: CandidateData): Promise<string> => {
    const response = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: `اكتب ملخصاً تنفيذياً لمدير التوظيف حول هذا المرشح باللغة العربية حصراً، يبرز أهم النقاط في دقيقة واحدة: ${JSON.stringify(candidate)}`
    });
    return response.text || '';
};

export const generateSiteScenario = async (candidate: CandidateData, scenarioType: string): Promise<{ prediction: string, confidence: number, challengeQuestions: string[] }> => {
    const prompt = `أنت خبير محاكاة ميدانية. بناءً على سيرة المرشح: ${JSON.stringify(candidate.info)}. قم بمحاكاة رد فعله في سيناريو: "${scenarioType}" في موقع إنشائي لشركة شهم. يجب أن يكون التوقع والأسئلة باللغة العربية حصراً.`;
    const response = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              prediction: { type: Type.STRING },
              confidence: { type: Type.INTEGER },
              challengeQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["prediction", "confidence", "challengeQuestions"]
          }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const analyzeProjectDNA = async (projectDesc: string, candidates: CandidateData[]): Promise<any[]> => {
    const prompt = `أنت خبير تشكيل فرق هندسية لمشاريع المقاولات لشركة شهم للمقاولات. بناءً على وصف المشروع: "${projectDesc}". قم باختيار الفريق الأمثل من المرشحين باللغة العربية حصراً: ${JSON.stringify(candidates.map(c => ({ id: c.id, name: c.info.fullName, job: c.info.jobTitle })))}`;
    
    const response = await callGeminiProxy({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              roles: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    candidateId: { type: Type.STRING },
                    roleName: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["candidateId", "roleName", "reason"]
                }
              }
            },
            required: ["roles"]
          }
        }
    });
    const parsed = JSON.parse(response.text || '{"roles":[]}');
    return parsed.roles;
};

export const searchWebForCandidates = async (query: string): Promise<{ answer: string, sources: { title: string, uri: string }[] }> => {
    const response = await callGeminiProxy({
      model: "gemini-3-flash-preview",
      contents: `أنت خبير استقطاب (Headhunter) متقدم للبحث عن الكفاءات لحساب شركة شهم للمقاولات.
الطلب من المستخدم: "${query}"

يجب عليك إجراء بحث دقيق عبر محرك Google للعثور على أقوى المرشحين في السعودية الذين يتطابقون تماماً مع الطلب.
للحصول على دقة عالية، الرجاء استخدام تقنيات X-Ray search (مثل إضافة site:linkedin.com/in/ أو site:bayt.com/ar/saudi-arabia/profile/ إلى كلمات البحث).

تعليمات التعامل مع النتائج:
1. استخلص فقط الأشخاص الحقيقيين (Profiles) وتجاهل إعلانات الوظائف (Jobs) وصفحات الشركات (Companies).
2. يجب أن يحمل الشخص المسمى الوظيفي المطلوب والخبرات المطابقة، ويُفضل أن يكون داخل السعودية.
3. التزم بالدقة المتناهية: لا تقم بتأليف أو اختراع أي أسماء أو معلومات، اعتمد حصراً وبشكل تام على النتائج التي حصلت عليها من بحث Google.
4. قدم تقريراً احترافياً باللغة العربية يسرد أهم المرشحين المحتملين الذين تم العثور عليهم من نتائج البحث الحقيقية. اذكر اسم المرشح والوظيفة أو الشركة الحالية لمعرفة مطابقته.
5. لا تقم بتضمين الروابط داخل النص أبداً (الروابط ستضاف تلقائياً في واجهة المستخدم من مصادرك).
6. يجب أن يكون التقرير مباشراً، واضحاً، واحترافياً. وإذا لم تجد نتائج مطابقة بدقة، اعتذر ووضح ذلك.`,
      config: {
        tools: [{googleSearch: {}}],
        temperature: 0.1,
      },
    });

    const sources: { title: string, uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        chunks.forEach((chunk: any) => {
            if (chunk.web && chunk.web.uri) {
                const uriValue = chunk.web.uri.toLowerCase();
                // Filter out non-profile links
                const isIrrelevant = uriValue.includes('/jobs/') || uriValue.includes('/job/') || uriValue.includes('/company/');
                
                if (!isIrrelevant) {
                    // avoid duplicates
                    if (!sources.find(s => s.uri === chunk.web.uri)) {
                        sources.push({
                            title: chunk.web.title || "ملف مرشح",
                            uri: chunk.web.uri
                        });
                    }
                }
            }
        });
    }

    return {
        answer: response.text || "لم يتم العثور على نتائج مفصلة باللغة العربية.",
        sources: sources
    };
};
