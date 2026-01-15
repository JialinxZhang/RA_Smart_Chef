
import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../types";

export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const generateRecipeFromInput = async (input: string, lang: Language, imageBase64?: string) => {
  const ai = getGeminiClient();
  const languagePrompt = lang === 'zh' ? "Respond in Chinese." : "Respond in English.";
  
  const parts: any[] = [{ 
    text: `Based on these ingredients: ${input}, generate a professional recipe in JSON format. 
    ${languagePrompt}
    Include:
    1. A clear title and description.
    2. A category.
    3. Relevant tags.
    4. Enhanced SOP: Each step MUST include the instruction AND an optional specific tip or caution.
    If an image is provided, identify ingredients first. Search for recent culinary trends if relevant.` 
  }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          steps: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                instruction: { type: Type.STRING },
                tip: { type: Type.STRING },
                caution: { type: Type.STRING }
              },
              required: ["instruction"]
            } 
          },
          tips: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["title", "description", "ingredients", "steps", "category", "tags"]
      }
    }
  });

  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks.map((chunk: any) => ({
    title: chunk.web?.title || 'Source',
    uri: chunk.web?.uri || '#'
  })).filter((s: any) => s.uri !== '#');

  return {
    recipe: JSON.parse(response.text || '{}'),
    sources
  };
};

export const generateImageForPrompt = async (prompt: string) => {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: `A high-quality, mouth-watering professional food photography shot of: ${prompt}. Cinematic lighting, shallow depth of field, vibrant colors.` }]
      }
    });

    for (const part of response.candidates?.[0]?.content.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.error("Image generation failed", e);
  }
  return null;
};

export const editFoodImage = async (prompt: string, imageBase64: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType: 'image/jpeg' } },
        { text: prompt }
      ]
    }
  });

  for (const part of response.candidates?.[0]?.content.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return null;
};
