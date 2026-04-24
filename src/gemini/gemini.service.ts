import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  async generateGeminiResponse(prompt: string, history?: ChatMessage[]): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is missing.');
      return 'Sorry, I could not process your request.';
    }

    const contents = [
      ...(history || []).map((entry) => ({
        role: entry.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: entry.content }],
      })),
      { role: 'user', parts: [{ text: prompt }] },
    ];

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          systemInstruction: {
            parts: [{ text: 'You are a helpful WhatsApp assistant. Keep replies short and clear.' }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
          },
        },
        {
          params: { key: apiKey },
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      const text = response.data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || '')
        .join('')
        .trim();

      return text || 'No response';
    } catch (error) {
      this.logger.error('Gemini error:', error as any);
      return 'Sorry, I could not process your request.';
    }
  }
}
