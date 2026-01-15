
import React, { useState, useEffect } from 'react';
import { Recipe, Language, translations } from '../types';

export const TabCollection: React.FC<{ lang: Language }> = ({ lang }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');

  const t = translations[lang];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('smart_chef_recipes') || '[]');
    setRecipes(saved);
  }, []);

  const deleteRecipe = (id: string) => {
    const filtered = recipes.filter(r => r.id !== id);
    setRecipes(filtered);
    localStorage.setItem('smart_chef_recipes', JSON.stringify(filtered));
  };

  const categories = ['All', ...new Set(recipes.map(r => r.category))];

  const filteredRecipes = recipes.filter(r => {
    const matchesCategory = selectedCategory === 'All' || r.category === selectedCategory;
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || 
                         r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <i className="fas fa-book-heart text-orange-500"></i>
            {t.tabBook}
          </h2>
          <p className="text-slate-500">{lang === 'zh' ? '你精心策划的私人食谱库' : 'Your curated personal cookbook'}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input 
              type="text" 
              placeholder={t.searchPlaceholder}
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(c => <option key={c} value={c}>{c === 'All' ? (lang === 'zh' ? '全部' : 'All') : c}</option>)}
          </select>
        </div>
      </header>

      {filteredRecipes.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <i className="fas fa-utensils-alt text-5xl text-slate-200 mb-4"></i>
          <h3 className="text-xl font-bold text-slate-400">{t.noRecipes}</h3>
          <p className="text-slate-300">{t.noRecipesSub}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div key={recipe.id} className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="relative aspect-video bg-slate-100">
                {recipe.mainImage ? (
                  <img src={recipe.mainImage} className="w-full h-full object-cover" alt={recipe.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-200">
                    <i className="fas fa-image text-3xl"></i>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); recipe.id && deleteRecipe(recipe.id); }}
                    className="w-8 h-8 bg-white/80 backdrop-blur text-red-500 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <i className="fas fa-trash-alt text-xs"></i>
                  </button>
                </div>
              </div>
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-orange-50 text-orange-600 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">
                    {recipe.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{recipe.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4 flex-grow">{recipe.description}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {recipe.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="bg-slate-50 text-slate-400 text-[10px] px-2 py-0.5 rounded">#{tag}</span>
                  ))}
                </div>

                <button className="w-full py-2 bg-slate-50 text-slate-600 font-bold rounded-xl group-hover:bg-orange-500 group-hover:text-white transition-all">
                  {lang === 'zh' ? '查看详情' : 'View Full Recipe'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
