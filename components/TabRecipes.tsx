
import React, { useState, useRef, useMemo } from 'react';
import { generateRecipeFromInput, generateImageForPrompt } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import { Recipe, GroundingSource, Language, translations } from '../types';

export const TabRecipes: React.FC<{ lang: Language }> = ({ lang }) => {
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState('');
  const [result, setResult] = useState<{ recipe: Recipe; sources: GroundingSource[] } | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = translations[lang];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await fileToBase64(file);
      setPreview(`data:image/jpeg;base64,${base64}`);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setIsSaved(false);
    setResult(null);
    try {
      const imageBase64 = preview ? preview.split(',')[1] : undefined;
      const data = await generateRecipeFromInput(ingredients, lang, imageBase64);
      
      // Step 1: Initial result without images
      setResult(data);

      // Step 2: Generate main dish image
      const mainImage = await generateImageForPrompt(data.recipe.title);
      setResult(prev => prev ? { ...prev, recipe: { ...prev.recipe, mainImage } } : null);

      // Step 3: Generate images for each step sequentially to avoid overloading
      const updatedSteps = [...data.recipe.steps];
      for (let i = 0; i < updatedSteps.length; i++) {
        const stepImg = await generateImageForPrompt(`${data.recipe.title} preparation: ${updatedSteps[i].instruction}`);
        if (stepImg) {
          updatedSteps[i] = { ...updatedSteps[i], image: stepImg };
          setResult(prev => prev ? { 
            ...prev, 
            recipe: { ...prev.recipe, steps: [...updatedSteps] } 
          } : null);
        }
      }

    } catch (error) {
      console.error(error);
      alert('Error generating recipe. Please check your API key and input.');
    } finally {
      setLoading(false);
    }
  };

  const saveToCollection = () => {
    if (!result) return;
    const existing = JSON.parse(localStorage.getItem('smart_chef_recipes') || '[]');
    const newRecipe = { 
      ...result.recipe, 
      id: Date.now().toString(), 
      dateSaved: Date.now() 
    };
    localStorage.setItem('smart_chef_recipes', JSON.stringify([newRecipe, ...existing]));
    setIsSaved(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <section className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-3xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="fas fa-utensils text-orange-500"></i>
          {t.generateBtn}
        </h2>
        
        <div className="space-y-4">
          <textarea
            className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            rows={3}
            placeholder={t.inputPlaceholder}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
          />

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <i className="fas fa-camera"></i>
              {t.uploadPhoto}
            </button>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            
            <button
              onClick={handleGenerate}
              disabled={loading || (!ingredients && !preview)}
              className="w-full sm:w-auto px-10 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-orange-200 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-magic"></i>}
              {loading ? t.generating : t.generateBtn}
            </button>
          </div>

          {preview && (
            <div className="mt-4 relative inline-block">
              <img src={preview} alt="Preview" className="h-32 rounded-xl border border-slate-200" />
              <button 
                onClick={() => setPreview(null)}
                className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}
        </div>
      </section>

      {result && (
        <article className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 border border-slate-100 relative">
          
          {/* Main Dish Image */}
          {result.recipe.mainImage ? (
             <div className="w-full h-80 overflow-hidden relative">
               <img src={result.recipe.mainImage} className="w-full h-full object-cover" alt={result.recipe.title} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
               <div className="absolute bottom-6 left-8 text-white">
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
                      {result.recipe.category}
                    </span>
                  </div>
                  <h1 className="text-4xl font-black">{result.recipe.title}</h1>
               </div>
             </div>
          ) : (
             <div className="p-8 pb-0">
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md">
                    {result.recipe.category}
                  </span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 mb-2">{result.recipe.title}</h1>
             </div>
          )}

          <div className="p-8">
            <div className="absolute top-8 right-8 flex gap-2 z-10">
              <button 
                onClick={saveToCollection}
                disabled={isSaved}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all shadow-lg ${
                  isSaved 
                  ? 'bg-green-100 text-green-600 cursor-default shadow-none' 
                  : 'bg-white text-slate-600 hover:bg-orange-500 hover:text-white'
                }`}
              >
                <i className={`fas ${isSaved ? 'fa-check' : 'fa-bookmark'}`}></i>
                {isSaved ? t.saved : t.saveBtn}
              </button>
            </div>

            <header className="mb-8 pr-24">
              <p className="text-slate-600 text-lg italic">{result.recipe.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {result.recipe.tags.map(tag => (
                  <span key={tag} className="bg-slate-100 text-slate-500 text-xs font-medium px-2 py-1 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </header>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="md:col-span-1">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <i className="fas fa-list-ul text-orange-500"></i> {t.ingredients}
                </h3>
                <ul className="space-y-2">
                  {result.recipe.ingredients.map((ing, i) => (
                    <li key={i} className="flex items-center gap-2 text-slate-700">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full"></span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                  <i className="fas fa-tasks text-orange-500"></i> {t.sop}
                </h3>
                <ol className="space-y-12">
                  {result.recipe.steps.map((step, i) => (
                    <li key={i} className="space-y-4">
                      <div className="flex gap-4 items-start">
                        <span className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 font-bold rounded-full flex items-center justify-center mt-1">
                          {i + 1}
                        </span>
                        <div className="flex-1 space-y-3">
                          <p className="text-slate-700 leading-relaxed font-semibold text-lg">{step.instruction}</p>
                          
                          {/* Step Image */}
                          <div className="w-full aspect-video bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                            {step.image ? (
                              <img src={step.image} className="w-full h-full object-cover animate-in fade-in duration-700" alt={`Step ${i+1}`} />
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-slate-300">
                                <i className="fas fa-spinner fa-spin text-xl"></i>
                                <span className="text-xs uppercase font-bold tracking-widest">Generating Step Visual...</span>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            {step.tip && (
                              <div className="p-3 bg-blue-50 border-l-2 border-blue-400 rounded-r-lg text-sm text-blue-700">
                                <i className="fas fa-lightbulb mr-2 opacity-70"></i>
                                <span className="italic">{step.tip}</span>
                              </div>
                            )}
                            {step.caution && (
                              <div className="p-3 bg-red-50 border-l-2 border-red-400 rounded-r-lg text-sm text-red-700">
                                <i className="fas fa-exclamation-triangle mr-2 opacity-70"></i>
                                <span className="font-semibold">Note: </span>{step.caution}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>

                {result.recipe.tips && result.recipe.tips.length > 0 && (
                  <div className="mt-8 p-6 bg-slate-50 rounded-2xl border-l-4 border-orange-500">
                    <h4 className="font-bold text-slate-800 mb-2">{t.overallTips}:</h4>
                    <ul className="list-disc list-inside text-slate-600 space-y-1">
                      {result.recipe.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {result.sources.length > 0 && (
              <footer className="mt-12 pt-8 border-t border-slate-100">
                <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Powered by Google Search:</h4>
                <div className="flex flex-wrap gap-3">
                  {result.sources.map((source, i) => (
                    <a
                      key={i}
                      href={source.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      <i className="fas fa-external-link-alt mr-1"></i>
                      {source.title}
                    </a>
                  ))}
                </div>
              </footer>
            )}
          </div>
        </article>
      )}
    </div>
  );
};
