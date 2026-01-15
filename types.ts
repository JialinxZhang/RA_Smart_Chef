
export type Language = 'en' | 'zh';

export interface RecipeStep {
  instruction: string;
  tip?: string;
  caution?: string;
  image?: string; // Base64 or URL
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: RecipeStep[];
  tips: string[];
  category: string;
  tags: string[];
  dateSaved?: number;
  mainImage?: string; // Base64 or URL
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export enum AppTab {
  RECIPES = 'recipes',
  COLLECTION = 'collection',
  VOICE = 'voice',
  IMAGE_LAB = 'image_lab',
  VIDEO_MAGIC = 'video_magic'
}

export interface TranscriptionItem {
  role: 'user' | 'model';
  text: string;
}

export const translations = {
  en: {
    appTitle: "RA Group Smart Chef",
    tabCreate: "Create",
    tabBook: "Book",
    tabVoice: "Voice",
    tabLab: "Lab",
    tabMagic: "Magic",
    inputPlaceholder: "Type your ingredients here (e.g., egg, tomato, beef...)",
    uploadPhoto: "Upload Photo",
    generateBtn: "Generate Recipe",
    generating: "Cooking up your recipe...",
    saveBtn: "Save to Collection",
    saved: "Saved",
    ingredients: "Ingredients",
    sop: "Preparation (SOP)",
    proTips: "Pro Tips",
    overallTips: "Overall Tips",
    searchPlaceholder: "Search recipes or tags...",
    noRecipes: "No recipes found",
    noRecipesSub: "Generate and save some delicious meals to see them here!",
    stylingLab: "AI Food Styling Lab",
    stylingBtn: "Apply AI Styling",
    videoMagic: "Recipe Animation (Veo)",
    videoBtn: "Generate Cinematic Animation",
    langToggle: "中文"
  },
  zh: {
    appTitle: "RA集团 灵动主厨",
    tabCreate: "生成菜谱",
    tabBook: "我的收藏",
    tabVoice: "语音助手",
    tabLab: "美食实验室",
    tabMagic: "魔法视频",
    inputPlaceholder: "输入你的食材（例如：鸡蛋，西红柿，牛肉...）",
    uploadPhoto: "上传照片",
    generateBtn: "生成菜谱",
    generating: "正在为你烹饪菜谱...",
    saveBtn: "保存到收藏",
    saved: "已保存",
    ingredients: "所需食材",
    sop: "烹饪步骤 (SOP)",
    proTips: "烹饪小贴士",
    overallTips: "综合提示",
    searchPlaceholder: "搜索菜谱或标签...",
    noRecipes: "未找到菜谱",
    noRecipesSub: "快去生成并保存一些美味佳肴吧！",
    stylingLab: "AI 美食实验室",
    stylingBtn: "应用 AI 样式",
    videoMagic: "菜谱动画 (Veo)",
    videoBtn: "生成电影级动画",
    langToggle: "EN"
  }
};
