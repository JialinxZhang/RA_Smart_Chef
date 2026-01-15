
import React, { useState, useRef } from 'react';
import { editFoodImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';

export const TabImageEdit: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [original, setOriginal] = useState<string | null>(null);
  const [edited, setEdited] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setOriginal(`data:image/jpeg;base64,${base64}`);
      setEdited(null);
    }
  };

  const handleEdit = async () => {
    if (!original || !prompt) return;
    setLoading(true);
    try {
      const base64 = original.split(',')[1];
      const result = await editFoodImage(prompt, base64);
      setEdited(result);
    } catch (error) {
      console.error(error);
      alert('Error editing image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <section className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-magic text-purple-500"></i>
          AI Food Styling Lab
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="relative group aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center">
              {original ? (
                <img src={original} className="w-full h-full object-cover" alt="Original" />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <i className="fas fa-cloud-upload-alt text-4xl mb-2"></i>
                  <p>Upload a food photo to start styling</p>
                </div>
              )}
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity font-bold"
              >
                Change Photo
              </button>
            </div>
            
            <textarea
              className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              rows={3}
              placeholder="E.g., 'Make it look like high-end restaurant photography' or 'Add a vintage aesthetic'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button
              onClick={handleEdit}
              disabled={loading || !original || !prompt}
              className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white font-bold rounded-2xl transition-all shadow-lg shadow-purple-200"
            >
              {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-wand-sparkles mr-2"></i>}
              Apply AI Styling
            </button>
          </div>

          <div className="space-y-4">
            <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-slate-200 flex items-center justify-center relative">
              {loading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                  <p className="text-slate-500 font-medium">Styling your dish...</p>
                </div>
              ) : edited ? (
                <img src={edited} className="w-full h-full object-cover" alt="Edited" />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <i className="fas fa-image text-4xl mb-2 opacity-20"></i>
                  <p>Styled image will appear here</p>
                </div>
              )}
              {edited && !loading && (
                <a 
                  href={edited} 
                  download="styled-food.png" 
                  className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-3 rounded-full shadow-lg text-purple-600 hover:bg-white"
                >
                  <i className="fas fa-download"></i>
                </a>
              )}
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl text-sm text-slate-500">
              <p><i className="fas fa-info-circle mr-1"></i> Use text prompts to change lighting, background, or add artistic filters to your food photos.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
