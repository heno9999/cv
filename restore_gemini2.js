import fs from 'fs';

let content = fs.readFileSync('services/geminiService.ts', 'utf8');

// Replace the getAI helper completely
content = content.replace(/const getAI = \(\) => \{[\s\S]*?\};\n/, `
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
`);

// Replace getAI().models.generateContent with callGeminiProxy
content = content.replace(/await getAI\(\)\.models\.generateContent/g, 'await callGeminiProxy');

fs.writeFileSync('services/geminiService.ts', content, 'utf8');
console.log("Fixed geminiService to use proxy");
