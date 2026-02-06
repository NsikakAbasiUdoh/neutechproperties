
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // Safe environment variable retrieval
  let apiKey = '';
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      apiKey = (import.meta as any).env.VITE_GOOGLE_API_KEY || (import.meta as any).env.GOOGLE_API_KEY || '';
    }
  } catch (e) {}

  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.API_KEY || '';
  }
  
  // Hardcoded fallback for demo purposes if needed, or throw
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    // Return a dummy client or handle error gracefully
    // throwing here might crash the app if unhandled
  }
  
  return new GoogleGenAI({ apiKey: apiKey || 'dummy-key' }); 
};

export const generatePropertyDescription = async (
  title: string,
  type: string,
  location: string,
  features: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // We use gemini-3-flash-preview for fast, creative text generation
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a compelling, professional, and attractive real estate description (max 80 words) for a property with the following details:
      Title: ${title}
      Type: ${type}
      Location: ${location}
      Key Features: ${features}
      
      The tone should be persuasive and invite potential buyers or renters.
      `,
    });

    return response.text || "Could not generate description.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "Failed to generate description using AI. Please try again.";
  }
};
