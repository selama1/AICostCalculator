
import { GeminiModel, ModelPricing } from './types';

/**
 * Gemini Pricing based on December 2025 Documentation
 * Prices are in USD per 1,000,000 tokens.
 */
export const MODEL_PRICING: Record<GeminiModel, ModelPricing> = {
  [GeminiModel.FLASH_3]: {
    standard: {
      input: { TEXT: 0.50, AUDIO: 1.00, VIDEO: 0.50, IMAGE: 0.50 },
      output: 3.00,
    }
  },
  [GeminiModel.PRO_3]: {
    breakpoint: 200000,
    standard: {
      input: { TEXT: 2.00, AUDIO: 2.00, VIDEO: 2.00, IMAGE: 2.00 },
      output: 12.00,
    },
    high: {
      input: { TEXT: 4.00, AUDIO: 4.00, VIDEO: 4.00, IMAGE: 4.00 },
      output: 18.00,
    }
  },
  [GeminiModel.FLASH_LITE]: { // Using 2.5 Flash Lite data from doc
    standard: {
      input: { TEXT: 0.10, AUDIO: 0.30, VIDEO: 0.10, IMAGE: 0.10 },
      output: 0.40,
    }
  },
  [GeminiModel.FLASH_IMAGE_2_5]: {
    standard: {
      input: { TEXT: 0.30, AUDIO: 1.00, VIDEO: 0.30, IMAGE: 0.30 },
      output: 0.30, // Doc says priced same as 2.5 Flash
    },
    fixedOutputPerImage: 0.039, // Doc page 11: $0.039 per image
  },
};

export const MODEL_LABELS: Record<GeminiModel, string> = {
  [GeminiModel.FLASH_3]: 'Gemini 3 Flash (Preview)',
  [GeminiModel.PRO_3]: 'Gemini 3 Pro (Preview)',
  [GeminiModel.FLASH_LITE]: 'Gemini 2.5 Flash Lite',
  [GeminiModel.FLASH_IMAGE_2_5]: 'Gemini 2.5 Flash Image',
};
