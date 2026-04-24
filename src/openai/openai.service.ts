import { Injectable } from '@nestjs/common';
import { OpenAI } from 'openai';

@Injectable()
export class OpenaiService {
  private openai: OpenAI;

  async generateOpenAIResponse(prompt: string, history?: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
    try {
      const openai = this.openai ?? new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.openai = openai;

      const messages: { role: 'user' | 'assistant' | 'system'; content: string }[] = [
        { role: 'system', content: 'You are a helpful WhatsApp assistant. Keep replies short and clear.' },
      ];
      if (history && history.length) {
        messages.push(...history);
      }
      messages.push({ role: 'user', content: prompt });

      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
      });
      return completion.choices[0].message?.content || 'No response';
    } catch (error) {
      console.error('OpenAI error:', error);
      return 'Sorry, I could not process your request.';
    }
  }
}
