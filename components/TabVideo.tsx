
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { fileToBase64 } from '../utils/helpers';

export const TabVideo: React.FC = () => {
  const [hasKey, setHasKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      const selected = await (window as any).aistudio?.hasSelectedApiKey();
      setHasKey(!!selected);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    await (window as any).aistudio?.openSelectKey();
    setHasKey(true);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setImagePreview(`data:image/jpeg;base64,${base64}`);
    }
  };

  const handleGenerate = async () => {
    if (!imagePreview) return;
    setLoading(true);
    setVideoUrl(null);
    setProgressMsg('Initiating Veo video model...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const base64 = imagePreview.split(',')[1];
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Animate this dish in a dynamic culinary style',
        image: {
          imageBytes: base64,
          mimeType: 'image/jpeg'
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      const messages = [
        "Thinking about camera movements...",
        "Applying cinematic lighting...",
        "Simulating realistic physics...",
        "Almost there, finalizing frames...",
        "Packaging your high-quality video..."
      ];
      let msgIdx = 0;

      while (!operation.done) {
        setProgressMsg(messages[msgIdx % messages.length]);
        msgIdx++;
        await new Promise(resolve => setTimeout(resolve, 8000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const fetchUrl = `${downloadLink}&key=${process.env.API_KEY}`;
        setVideoUrl(fetchUrl);
      }
    } catch (error) {
      console.error(error);
      alert('Video generation failed. Please try again or re-select your API key.');
      if (error instanceof Error && error.message.includes('not found')) {
        setHasKey(false);
      }
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  if (!hasKey) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center bg-white rounded-3xl shadow-xl mt-12">
        <i className="fas fa-key text-5xl text-blue-500 mb-6"></i>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Paid API Key Required</h2>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Veo Video Generation requires a selected API key from a paid GCP project. 
          Please visit the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-blue-500 underline">billing documentation</a> for details.
        </p>
        <button
          onClick={handleSelectKey}
          className="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all"
        >
          Select/Manage API Key
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <section className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-video text-pink-500"></i>
          Recipe Animation (Veo)
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center relative">
              {imagePreview ? (
                <img src={imagePreview} className="w-full h-full object-cover" alt="Input" />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <i className="fas fa-image text-4xl mb-2"></i>
                  <p>Upload a starting frame photo</p>
                </div>
              )}
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFile} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-4 right-4 bg-white shadow p-2 rounded-lg text-slate-600"
              >
                Upload
              </button>
            </div>
            
            <input
              type="text"
              className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-pink-500 outline-none transition-all"
              placeholder="Describe the animation (e.g., steam rising, camera zoom)..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button
              onClick={handleGenerate}
              disabled={loading || !imagePreview}
              className="w-full py-4 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg"
            >
              {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-play mr-2"></i>}
              Generate Cinematic Animation
            </button>
          </div>

          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border-2 border-slate-800 flex items-center justify-center relative shadow-2xl">
              {loading ? (
                <div className="flex flex-col items-center gap-4 text-white text-center p-8">
                  <div className="w-12 h-12 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin"></div>
                  <p className="font-medium">{progressMsg}</p>
                  <p className="text-xs text-white/40">Video generation typically takes 1-3 minutes</p>
                </div>
              ) : videoUrl ? (
                <video src={videoUrl} controls autoPlay loop className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-6 text-slate-600">
                  <i className="fas fa-film text-4xl mb-2 opacity-20"></i>
                  <p>Your AI-generated video will play here</p>
                </div>
              )}
            </div>
            <div className="p-4 bg-pink-50 rounded-2xl text-xs text-pink-700">
              <p><i className="fas fa-lightbulb mr-1"></i> Veo generates high-quality 720p landscape video from your recipe photos.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
