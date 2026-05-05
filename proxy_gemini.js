import fs from 'fs';

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

const helper = `
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
`;

// Inject helper
content = content.replace(/let cachedApiKey: string \| null = null;[\s\S]*?;\s*\n\};/, helper);
content = content.replace(/export const getGeminiApiKey[\s\S]*?\}\n/, "");

// Replace the GoogleGenAI calls
content = content.replace(/\(new GoogleGenAI\(\{ apiKey: await getGeminiApiKey\(\) \}\)\)\.models\.generateContent/g, 'callGeminiProxy');

fs.writeFileSync('services/geminiService.ts', content, 'utf8');
console.log('Fixed through proxy');
