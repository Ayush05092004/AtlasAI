import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

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

  /**
   * Sends a prompt to Gemini and returns the raw text response. Retries a
   * few times with a short delay if the service reports itself overloaded
   * (503) - the free tier is sometimes deprioritized under load, and a
   * brief retry resolves it more often than not.
   */
  async generateText(prompt: string): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const model = this.client.getGenerativeModel({
          model: 'gemini-3.6-flash',
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        lastError = error;
        const isOverloaded =
          error instanceof Error && error.message.includes('503');

        if (isOverloaded && attempt < MAX_RETRIES) {
          this.logger.warn(
            `Gemini overloaded, retrying (${attempt}/${MAX_RETRIES})...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_DELAY_MS * attempt),
          );
          continue;
        }
        break;
      }
    }

    this.logger.error(
      'Gemini API call failed after retries',
      lastError instanceof Error ? lastError.stack : String(lastError),
    );
    throw new InternalServerErrorException(
      'The AI is currently busy. Please try again in a moment.',
    );
  }
}
