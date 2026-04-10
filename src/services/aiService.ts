import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const getEventRecommendations = async (userInterests: string[], allEvents: any[]) => {
  if (!process.env.GEMINI_API_KEY) return [];
  
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  const prompt = `
    User Interests: ${userInterests.join(", ")}
    Available Events: ${allEvents.map(e => `${e.id}: ${e.title} (${e.category})`).join("\n")}
    
    Task: Recommend the top 3 event IDs that match the user's interests.
    Return ONLY a JSON array of event IDs.
  `;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.match(/\[.*\]/s)?.[0] || "[]";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("AI Recommendation Error:", e);
    return [];
  }
};
