
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { CandidateData } from '../types';
import { MicrophoneIcon } from './Icons';

interface LiveAssistantProps {
  candidates: CandidateData[];
  onBack: () => void;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const LiveAssistant: React.FC<LiveAssistantProps> = ({ candidates, onBack }) => {
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [currentModelText, setCurrentModelText] = useState('');
  const [currentUserText, setCurrentUserText] = useState('');
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking'>('idle');
  const [volumeLevel, setVolumeLevel] = useState(0); 
  const [isGated, setIsGated] = useState(true); // لمعرفة هل الصوت مقطوع حالياً أم لا

  const audioContextInputRef = useRef<AudioContext | null>(null);
  const audioContextOutputRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);

  // إعدادات حساسية الميكروفون
  // رفعنا القيمة من 0.015 إلى 0.03 لتجاهل الضوضاء الخلفية بشكل أفضل
  const NOISE_THRESHOLD = 0.03; 

  const cleanup = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    
    if (audioContextInputRef.current) {
      try { audioContextInputRef.current.close(); } catch (e) {}
      audioContextInputRef.current = null;
    }
    if (audioContextOutputRef.current) {
      try { audioContextOutputRef.current.close(); } catch (e) {}
      audioContextOutputRef.current = null;
    }

    setIsActive(false);
    setStatus('idle');
    setCurrentModelText('');
    setCurrentUserText('');
    setVolumeLevel(0);
    setIsGated(true);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  const startSession = async () => {
    cleanup();
    setStatus('connecting');
    setIsActive(true);

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("API Key missing.");
      cleanup();
      return;
    }

    const ai = new GoogleGenAI({ apiKey });
    
    try {
      audioContextInputRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextOutputRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      // Ensure context is running
      await audioContextInputRef.current.resume();
      await audioContextOutputRef.current.resume();

      streamRef.current = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
    } catch (e) {
      console.error("Microphone error:", e);
      alert("يرجى السماح بالوصول للميكروفون.");
      cleanup();
      return;
    }

    // Limit candidates in prompt to prevent huge header size causing Network Error
    const candidatesSummary = candidates.slice(0, 15).map(c => ({
      name: c.info.fullName,
      title: c.info.jobTitle,
      score: c.analysis.fitnessScore,
      exp: c.info.experienceYears
    }));

    const instruction = `أنت "شهماوي"، مدير توظيف ذكي لشركة شهم للمقاولات. لديك بيانات هؤلاء المرشحين (أهم 15): ${JSON.stringify(candidatesSummary)}. 
    مهمتك: إدارة حوار تفاعلي مستمر وسريع مع المستخدم. 
    قواعدك الصارمة:
    1. تحدث بلهجة سعودية مهنية ومختصرة جداً.
    2. بمجرد أن يصمت المستخدم، اعتبر ذلك نهاية دوره ورد فوراً.
    3. لا تنتظر طويلاً، كن سريع البديهة.`;

    try {
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('listening');
            if (!audioContextInputRef.current || !streamRef.current) return;

            const source = audioContextInputRef.current.createMediaStreamSource(streamRef.current);
            const scriptProcessor = audioContextInputRef.current.createScriptProcessor(4096, 1, 1); 
            
            scriptProcessor.onaudioprocess = (e) => {
              if (!isActive) return;
              const inputData = e.inputBuffer.getChannelData(0);
              
              // --- Noise Gate Logic ---
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                  sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolumeLevel(rms); 

              // إذا كان الصوت أقل من الحد المسموح، نرسل صمتاً تاماً
              if (rms < NOISE_THRESHOLD) {
                  setIsGated(true);
                  // إرسال مصفوفة أصفار
                  const silence = new Float32Array(inputData.length).fill(0);
                  const pcmBlob = createBlob(silence);
                  sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob })).catch(err => console.error("Send error", err));
              } else {
                  setIsGated(false);
                  // إرسال الصوت الحقيقي
                  const pcmBlob = createBlob(inputData);
                  sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob })).catch(err => console.error("Send error", err));
              }
            };

            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextInputRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setCurrentModelText(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            if (message.serverContent?.inputTranscription) {
              setCurrentUserText(prev => prev + message.serverContent!.inputTranscription!.text);
            }

            if (message.serverContent?.turnComplete) {
              setHistory((prev: ChatMessage[]) => [
                  ...prev.slice(-4), 
                  { role: 'user', text: currentUserText } as ChatMessage,
                  { role: 'model', text: currentModelText } as ChatMessage
              ].filter(m => m.text.trim()));
              setCurrentUserText('');
              setCurrentModelText('');
              setStatus('listening');
            }

            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setStatus('speaking');
              const ctx = audioContextOutputRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              
              source.addEventListener('ended', () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setStatus('listening');
              });

              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => { try { s.stop(); } catch(e){} });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setStatus('listening');
            }
          },
          onerror: (e) => {
            console.error("Live Assistant Error", e);
            alert("حدث خطأ في الاتصال (Network Error). يرجى المحاولة مرة أخرى.");
            cleanup();
          },
          onclose: () => cleanup()
        },
        config: {
          responseModalities: ['AUDIO'], // Use string literal to avoid enum import issues
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          systemInstruction: instruction,
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (e) {
      console.error("Connection failed", e);
      alert("فشل الاتصال بالخادم.");
      cleanup();
    }
  };

  function decode(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function encode(bytes: Uint8Array) {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  }

  function createBlob(data: Float32Array): Blob {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden animate-fade-in" dir="rtl">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-10 blur-[150px] bg-gradient-to-tr from-blue-600 via-emerald-500 to-indigo-600 animate-pulse"></div>
      
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center h-full max-h-[90vh]">
        <button onClick={onBack} className="absolute top-0 right-0 p-4 text-slate-500 hover:text-white transition-all font-black text-xs uppercase tracking-widest">
            إنهاء الجلسة ×
        </button>

        <div className="mt-8 space-y-2">
            <h2 className="text-3xl font-black tracking-tighter ai-text-shimmer">شهماوي اللايف</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">نظام الحوار الصوتي المستمر</p>
        </div>

        {/* Conversation History */}
        <div className="flex-1 w-full overflow-y-auto my-8 px-4 space-y-4 custom-scrollbar flex flex-col-reverse">
            <div className="space-y-4">
                {history.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm font-bold shadow-sm ${msg.role === 'user' ? 'bg-white/5 border border-white/10 text-slate-300' : 'bg-blue-600/20 border border-blue-500/30 text-white'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                
                {/* Real-time feedback */}
                {currentUserText && (
                    <div className="flex justify-start opacity-60">
                         <div className="bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-bold text-slate-400 italic">
                            {currentUserText}...
                        </div>
                    </div>
                )}
                {currentModelText && (
                    <div className="flex justify-end animate-pulse">
                         <div className="bg-blue-600/20 border border-blue-500/30 p-4 rounded-2xl text-sm font-bold text-blue-400">
                            {currentModelText}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Dynamic Orb Indicator */}
        <div className="relative mb-12" onClick={isActive ? cleanup : startSession}>
          
          {/* Main Orb */}
          <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-2xl relative z-10 overflow-hidden
            ${status === 'speaking' ? 'bg-blue-500 shadow-[0_0_80px_rgba(59,130,246,0.6)] scale-110' : 
              status === 'listening' ? 'bg-emerald-500 shadow-[0_0_60px_rgba(16,185,129,0.4)]' : 
              'bg-slate-800 border-2 border-slate-700 hover:scale-105'}
          `}>
             
             {/* Volume Visualizer */}
             {status === 'listening' && isActive && (
                 <>
                    {/* Ring showing Threshold level */}
                    <div className="absolute inset-0 border-2 border-white/10 rounded-full z-0"></div>
                    
                    {/* Dynamic Circle based on volume */}
                    <div className={`absolute inset-0 rounded-full transition-transform duration-75 z-0 ${isGated ? 'bg-red-500/20' : 'bg-emerald-300/40'}`}
                        style={{ transform: `scale(${1 + volumeLevel * 8})` }}>
                    </div>
                 </>
             )}

            {status === 'connecting' ? (
                <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin relative z-20"></div>
            ) : (
                <MicrophoneIcon className={`w-12 h-12 transition-all relative z-20 ${isActive ? 'text-white' : 'text-slate-600'}`} />
            )}
          </div>
          
          {/* Status Text & Gated Indicator */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap flex flex-col items-center gap-1">
              <span className={`text-[10px] font-black uppercase tracking-[0.4em] transition-all
                ${status === 'idle' ? 'text-slate-500' : 'text-blue-400 animate-pulse'}
              `}>
                {status === 'idle' ? 'اضغط لبدء الحوار' : 
                 status === 'connecting' ? 'جاري الاتصال...' : 
                 status === 'listening' ? (isGated ? 'تحدث الآن (صوت منخفض)' : 'جاري الاستماع...') : 'يتحدث إليك...'}
              </span>
              
              {status === 'listening' && (
                  <div className="flex gap-1 items-center">
                    <div className={`w-1.5 h-1.5 rounded-full ${isGated ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                    <span className="text-[8px] text-slate-500">{isGated ? 'صمت (يتم التجاهل)' : 'صوت مسموع'}</span>
                  </div>
              )}
          </div>
        </div>
      </div>

      <footer className="absolute bottom-6 opacity-20">
        <p className="text-[8px] font-black tracking-[0.5em] text-slate-500 uppercase">Live Session • High Noise Threshold</p>
      </footer>
    </div>
  );
};
