import fs from 'fs';

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// remove the proxy mock
content = content.replace(/async function callGeminiProxy[\s\S]*?\}\n/g, '');

content = content.replace(/import { Type } from "@google\/genai";/, "import { GoogleGenAI, Type } from \"@google/genai\";\n\nlet cachedApiKey: string | null = null;\nexport const getGeminiApiKey = async () => {\n  if (!cachedApiKey) {\n    try {\n      const res = await fetch('/api/config');\n      const data = await res.json();\n      if (data.apiKey) cachedApiKey = data.apiKey;\n    } catch(e){}\n  }\n  return cachedApiKey || '';\n};\n");

// Replace callGeminiProxy with direct call but with api key
content = content.replace(/await callGeminiProxy\(([\s\S]*?)\)/g, "await (new GoogleGenAI({ apiKey: await getGeminiApiKey() })).models.generateContent($1)");

fs.writeFileSync('services/geminiService.ts', content, 'utf8');
console.log('Restored');
