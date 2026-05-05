import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import multer from 'multer';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

// CV Analysis Schema
const CV_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    isCV: { type: Type.BOOLEAN, description: "True if the document is a professional CV or Resume, False otherwise." },
    info: {
      type: Type.OBJECT,
      properties: {
        fullName: { type: Type.STRING },
        jobTitle: { type: Type.STRING },
        specialty: { type: Type.STRING },
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

// Multer Config
const upload = multer({ 
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Validate file type PDF/DOC/DOCX
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOC, and DOCX are allowed."));
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  
  // Health check endpoint
  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'shahm-cv-analyzer' }));

  // New HR Backend Endpoint for CV Upload
  app.post('/api/public-upload-cv', upload.single('cv'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No CV file provided." });
      }

      // 1. Get candidate details from FormData
      const { name, email, phone, jobTitle } = req.body;
      if (!name || !email || !phone || !jobTitle) {
        return res.status(400).json({ error: "Missing candidate details." });
      }

      // 2. Call Gemini
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) throw new Error("Server missing Gemini API key.");

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `حلل السيرة الذاتية المرفقة بدقة بالغة. تأكد من توحيد صيغة الجنسية للمذكر. 
معلومات المرشح المدخلة يدوياً للمطابقة (استخدمها إن لم تجدها في السيرة):
الاسم: ${name}
الإيميل: ${email}
الجوال: ${phone}
الوظيفة المطلوبة: ${jobTitle}
`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          prompt,
          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: req.file.buffer.toString("base64")
            }
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: CV_ANALYSIS_SCHEMA,
        }
      });

      const resultText = response.text || "{}";
      const parsedResult = JSON.parse(resultText);

      if (!parsedResult.isCV) {
        return res.status(400).json({ error: "File does not appear to be a CV.", parsed: parsedResult });
      }

      // 3. Store the result
      let cvUrl = null;
      let finalCandidate: any = null;
      if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY, { auth: { persistSession: false } });
        
        // Upload file to storage
        const timestamp = new Date().getTime();
        const safeName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${safeName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(filename, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: true
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage.from('cvs').getPublicUrl(filename);
          cvUrl = publicUrlData.publicUrl;
        }

        // Generate ID
        const generateId = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };

        // Create Payload
        finalCandidate = {
          id: generateId(),
          fileName: req.file.originalname,
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'Under Review',
          source: 'portal',
          isAnalyzed: true,
          cvUrl: cvUrl,
          info: { ...parsedResult.info, fullName: name, email, phone, jobTitle }, // Merge with manual entry
          analysis: parsedResult.analysis
        };

        // Insert into Supabase
        const { error: dbError } = await supabase.from('offers').insert([{ payload: finalCandidate }]);
        if (dbError) {
          console.error("Database save error:", dbError);
        }
      } else {
        console.warn("Supabase credentials not found, analysis completed but not saved.");
        finalCandidate = { info: parsedResult.info, analysis: parsedResult.analysis, unsaved: true };
      }

      // 4. Return JSON response only
      res.json({ success: true, message: "CV successfully processed and saved.", candidate: finalCandidate });

    } catch (e: any) {
      console.error("Endpoint Error:", e);
      res.status(500).json({ error: e.message || "Internal server error" });
    }
  });

  app.post('/api/gemini', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "Server missing API key" });
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent(req.body);
      const jsonResponse = JSON.parse(JSON.stringify(response));
      // Extract the text safely
      try {
        jsonResponse.text = response.text;
      } catch (e) {
        // Fallback or ignore
      }
      res.json(jsonResponse);
    } catch (e: any) {
      console.error("Gemini Proxy Error:", e);
      res.status(500).json({ error: e.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
