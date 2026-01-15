
import React, { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { encode, decode, decodeAudioData } from '../utils/helpers';
import { TranscriptionItem } from '../types';

export const TabVoice: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<TranscriptionItem[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptionRef = useRef({ user: '', model: '' });

  const stopSession = useCallback(() => {
    setIsActive(false);
    sessionRef.current?.close();
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioContextRef.current?.close();
    outputContextRef.current?.close();
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
  }, []);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: 'You are a professional chef. Help the user with recipes, cooking techniques, and kitchen safety. Keep answers concise and human-like.',
          inputAudioTranscription: {},
          outputAudioTranscription: {}
        },
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then(s => s.sendRealtimeInput({
                media: { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' }
              }));
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            // Handle Interrupts
            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            // Handle Transcription
            if (msg.serverContent?.inputTranscription) {
              transcriptionRef.current.user += msg.serverContent.inputTranscription.text;
            }
            if (msg.serverContent?.outputTranscription) {
              transcriptionRef.current.model += msg.serverContent.outputTranscription.text;
            }
            if (msg.serverContent?.turnComplete) {
              setHistory(prev => [
                ...prev,
                { role: 'user', text: transcriptionRef.current.user },
                { role: 'model', text: transcriptionRef.current.model }
              ]);
              transcriptionRef.current = { user: '', model: '' };
            }
          },
          onerror: (e) => {
            console.error('Live API Error:', e);
            stopSession();
          },
          onclose: () => stopSession()
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
      alert('Could not start voice session. Check microphone permissions.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 h-[calc(100vh-200px)] flex flex-col">
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100 flex-1 flex flex-col overflow-hidden">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-microphone-alt text-red-500"></i>
          Live Voice Chef
        </h2>

        <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-hide">
          {history.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-8">
              <i className="fas fa-comment-dots text-4xl mb-4 opacity-20"></i>
              <p>Start a conversation to get real-time cooking guidance. Hands-free help for the kitchen!</p>
            </div>
          )}
          {history.map((item, i) => (
            <div key={i} className={`flex ${item.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                item.role === 'user' ? 'bg-orange-500 text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'
              }`}>
                <p className="text-sm font-medium opacity-70 mb-1">{item.role === 'user' ? 'You' : 'Chef AI'}</p>
                <p>{item.text || "..."}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl active:scale-95 ${
              isActive 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {isConnecting ? (
              <i className="fas fa-spinner fa-spin text-2xl"></i>
            ) : isActive ? (
              <i className="fas fa-stop text-2xl"></i>
            ) : (
              <i className="fas fa-microphone text-2xl"></i>
            )}
          </button>
          <p className="text-sm font-semibold text-slate-400">
            {isConnecting ? 'Establishing secure connection...' : isActive ? 'Listening... Speak now' : 'Tap to start talking'}
          </p>
        </div>
      </div>
    </div>
  );
};
