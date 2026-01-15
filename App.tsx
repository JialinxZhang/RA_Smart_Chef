
import React, { useState, useMemo } from 'react';
import { AppTab, Language, translations } from './types';
import { TabRecipes } from './components/TabRecipes';
import { TabCollection } from './components/TabCollection';
import { TabVoice } from './components/TabVoice';
import { TabImageEdit } from './components/TabImageEdit';
import { TabVideo } from './components/TabVideo';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.RECIPES);
  const [lang, setLang] = useState<Language>('en');

  const t = useMemo(() => translations[lang], [lang]);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'zh' : 'en');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-slate-200">
              RA
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">{t.appTitle}</h1>
          </div>
          
          <nav className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-[50vw] scrollbar-hide">
            <button
              onClick={() => setActiveTab(AppTab.RECIPES)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === AppTab.RECIPES ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-wand-magic-sparkles mr-2 hidden md:inline"></i>{t.tabCreate}
            </button>
            <button
              onClick={() => setActiveTab(AppTab.COLLECTION)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === AppTab.COLLECTION ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-book-heart mr-2 hidden md:inline"></i>{t.tabBook}
            </button>
            <button
              onClick={() => setActiveTab(AppTab.VOICE)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === AppTab.VOICE ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-microphone mr-2 hidden md:inline"></i>{t.tabVoice}
            </button>
            <button
              onClick={() => setActiveTab(AppTab.IMAGE_LAB)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === AppTab.IMAGE_LAB ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-palette mr-2 hidden md:inline"></i>{t.tabLab}
            </button>
            <button
              onClick={() => setActiveTab(AppTab.VIDEO_MAGIC)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === AppTab.VIDEO_MAGIC ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <i className="fas fa-movie mr-2 hidden md:inline"></i>{t.tabMagic}
            </button>
          </nav>

          <button 
            onClick={toggleLang}
            className="ml-2 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors uppercase"
          >
            {t.langToggle}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4">
        {activeTab === AppTab.RECIPES && <TabRecipes lang={lang} />}
        {activeTab === AppTab.COLLECTION && <TabCollection lang={lang} />}
        {activeTab === AppTab.VOICE && <TabVoice lang={lang} />}
        {activeTab === AppTab.IMAGE_LAB && <TabImageEdit lang={lang} />}
        {activeTab === AppTab.VIDEO_MAGIC && <TabVideo lang={lang} />}
      </main>

      {/* Footer / Info */}
      <footer className="py-8 text-center text-slate-400 text-sm">
        <p>&copy; 2024 {t.appTitle} - Your Personal AI Culinary Assistant</p>
      </footer>
    </div>
  );
};

export default App;
