
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async describeProduct(base64Image: string) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: "Analyze this product image. Provide a JSON response in English with: 'name', 'estimatedPrice', 'category', and 'description' (short and catchy)." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            estimatedPrice: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "estimatedPrice", "category", "description"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  }

  async negotiateOffer(productName: string, originalPrice: string, minPrice: number, userOffer: number) {
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Buyer offered $${userOffer} for "${productName}". Original price: ${originalPrice}. Your minimum price: $${minPrice}. Act as a friendly but firm local market seller in Uzbekistan. Negotiate in English. If the offer is too low, reject and counter-offer. If acceptable, say "DEAL" enthusiastically.`,
    });
    return response.text;
  }

  async marketChat(query: string, history: { role: 'user' | 'model', parts: [{ text: string }] }[], systemInstruction: string) {
    const chat = this.ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: systemInstruction
      },
      history: history
    });

    const response = await chat.sendMessage({ message: query });
    return response.text;
  }
}

export const geminiService = new GeminiService();
