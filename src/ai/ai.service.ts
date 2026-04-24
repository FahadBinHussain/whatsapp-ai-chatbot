import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from 'src/gemini/gemini.service';
import { OpenaiService } from 'src/openai/openai.service';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly openaiService: OpenaiService,
    private readonly geminiService: GeminiService,
  ) {}

  async generateResponse(prompt: string, history?: ChatMessage[]): Promise<string> {
    const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase().trim();

    this.logger.log(`Using AI provider: ${provider}`);

    if (provider === 'gemini') {
      return this.geminiService.generateGeminiResponse(prompt, history);
    }

    if (provider !== 'openai') {
      this.logger.warn(`Unknown AI_PROVIDER "${provider}", falling back to OpenAI.`);
    }

    return this.openaiService.generateOpenAIResponse(prompt, history);
  }
}
