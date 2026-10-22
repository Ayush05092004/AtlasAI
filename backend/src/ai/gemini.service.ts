import {
  Injectable,
  Logger,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  ModelParams,
} from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-3.6-flash';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client: GoogleGenerativeAI;
  private readonly modelName: string;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY is not set - AI features will fail until configured',
      );
    }
    this.client = new GoogleGenerativeAI(apiKey ?? '');
    this.modelName = this.config.get<string>('GEMINI_MODEL') ?? DEFAULT_MODEL;
  }

  /** Returns a model instance; the agent uses this to attach tools and a system prompt. */
  getModel(params: Omit<ModelParams, 'model'> = {}): GenerativeModel {
    return this.client.getGenerativeModel({ model: this.modelName, ...params });
  }

  /**
   * Runs a Gemini call. Retries temporary 503 "high demand" errors, and turns
   * a 429 (quota used up) into a clear message instead of retrying - retrying
   * a quota error only burns more quota.
   */
  async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const message = error instanceof Error ? error.message : String(error);

        if (message.includes('[429')) {
          this.logger.warn(`Gemini quota exceeded: ${message.slice(0, 400)}`);
          // Best-effort: Google's quota ids mention "PerDay" for daily limits.
          const isDaily = message.includes('PerDay');
          throw new HttpException(
            isDaily
              ? 'The free AI quota for today is used up. It resets daily - please try again later.'
              : 'AI rate limit reached. Please wait a minute and try again.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }

        if (message.includes('[503') && attempt < MAX_RETRIES) {
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

  async generateText(prompt: string): Promise<string> {
    return this.withRetry(async () => {
      const result = await this.getModel().generateContent(prompt);
      return result.response.text();
    });
  }
}
