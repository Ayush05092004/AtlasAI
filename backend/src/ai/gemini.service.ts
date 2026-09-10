import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenerativeAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set - AI features will fail until configured',
      );
    }
    this.client = new GoogleGenerativeAI(apiKey ?? '');
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({
        model: 'gemini-3.6-flash',
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      this.logger.error(
        'Gemini API call failed',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'AI request failed. Please try again.',
      );
    }
  }
}
