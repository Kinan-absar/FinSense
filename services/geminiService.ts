
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, BehavioralInsight, BudgetGoal } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getBehavioralInsights = async (
  transactions: Transaction[],
  goals: BudgetGoal[],
  lang: 'en' | 'ar' = 'en'
): Promise<BehavioralInsight[]> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analyze the following personal finance transactions and budget goals. 
    Provide 3 to 5 factual, neutral behavioral insights. 
    IMPORTANT: Provide the response in ${lang === 'ar' ? 'Arabic (العربية)' : 'English'}.
    
    Focus on:
    1. Patterns related to time (e.g., late night spending).
    2. Psychological connections (e.g., spending correlated with mood).
    3. Budget comparison (e.g., specific category exceeding goals).
    
    Data:
    Transactions: ${JSON.stringify(transactions)}
    Budget Goals: ${JSON.stringify(goals)}

    Be precise. Instead of "You spend a lot on food", say "Food delivery spending increases after 9pm".
    Instead of "You shop when sad", say "Transaction volume for 'Shopping' is 30% higher on days marked as 'Stressed'".
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              severity: { 
                type: Type.STRING, 
                description: 'Values: neutral, warning, positive' 
              },
              type: { 
                type: Type.STRING, 
                description: 'Values: pattern, budget, psychology' 
              }
            },
            required: ["title", "description", "severity", "type"]
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result;
  } catch (error) {
    console.error("Error fetching insights:", error);
    return [{
      title: lang === 'ar' ? "تحليل البيانات متوقف مؤقتاً" : "Data Analysis Paused",
      description: lang === 'ar' ? "نواجه مشكلة في الوصول للذكاء الاصطناعي. حاول مرة أخرى." : "We're having trouble reaching the AI. Try again in a moment.",
      severity: "neutral",
      type: "pattern"
    }];
  }
};
