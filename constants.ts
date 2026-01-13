
import { AIProvider, AIModel, ModelPricing, GeminiModel, PricingUnit } from './types';

export const MODEL_PRICING: Record<AIModel, ModelPricing> = {
  // --- Gemini 3 Series ---
  [GeminiModel.FLASH_3]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0.50, AUDIO: 1.00, VIDEO: 0.50, IMAGE: 0.50 },
      output: 3.00,
      outputUnit: PricingUnit.TOKENS
    }
  },
  [GeminiModel.PRO_3]: {
    provider: AIProvider.GOOGLE,
    breakpoint: 200000,
    standard: {
      input: { TEXT: 2.00, AUDIO: 2.00, VIDEO: 2.00, IMAGE: 2.00 },
      output: 12.00,
      outputUnit: PricingUnit.TOKENS
    },
    high: {
      input: { TEXT: 4.00, AUDIO: 4.00, VIDEO: 4.00, IMAGE: 4.00 },
      output: 18.00,
      outputUnit: PricingUnit.TOKENS
    }
  },
  [GeminiModel.PRO_IMAGE_3]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 2.00, AUDIO: 2.00, VIDEO: 2.00, IMAGE: 2.00 },
      output: 12.00,
      outputUnit: PricingUnit.TOKENS,
      outputImage: 120.00, // $120/1M tokens
    }
  },

  // --- Gemini 2.5 Series ---
  [GeminiModel.PRO_2_5]: {
    provider: AIProvider.GOOGLE,
    breakpoint: 200000,
    standard: {
      input: { TEXT: 1.25, AUDIO: 1.25, VIDEO: 1.25, IMAGE: 1.25 },
      output: 10.00,
      outputUnit: PricingUnit.TOKENS
    },
    high: {
      input: { TEXT: 2.50, AUDIO: 2.50, VIDEO: 2.50, IMAGE: 2.50 },
      output: 15.00,
      outputUnit: PricingUnit.TOKENS
    }
  },
  [GeminiModel.FLASH_2_5]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0.30, AUDIO: 1.00, VIDEO: 0.30, IMAGE: 0.30 },
      output: 2.50,
      outputUnit: PricingUnit.TOKENS
    }
  },
  [GeminiModel.FLASH_LITE_2_5]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0.10, AUDIO: 0.30, VIDEO: 0.10, IMAGE: 0.10 },
      output: 0.40,
      outputUnit: PricingUnit.TOKENS
    }
  },
  [GeminiModel.FLASH_IMAGE_2_5]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0.30, AUDIO: 1.00, VIDEO: 0.30, IMAGE: 0.30 },
      output: 0.30,
      outputUnit: PricingUnit.TOKENS
    },
    fixedOutputPerImage: 0.039,
  },
  [GeminiModel.NATIVE_AUDIO_2_5]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0.50, AUDIO: 3.00, VIDEO: 3.00, IMAGE: 0.50 },
      output: 2.00,
      outputUnit: PricingUnit.TOKENS
    }
  },
  [GeminiModel.TTS_FLASH_2_5]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0.50, AUDIO: 1.00, VIDEO: 0.50, IMAGE: 0.50 },
      output: 10.00,
      outputUnit: PricingUnit.TOKENS
    }
  },
  [GeminiModel.TTS_PRO_2_5]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 1.00, AUDIO: 1.00, VIDEO: 1.00, IMAGE: 1.00 },
      output: 20.00,
      outputUnit: PricingUnit.TOKENS
    }
  },

  // --- Gemini 2.0 Series ---
  [GeminiModel.FLASH_2_0]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0.10, AUDIO: 0.70, VIDEO: 0.10, IMAGE: 0.10 },
      output: 0.40,
      outputUnit: PricingUnit.TOKENS
    }
  },
  [GeminiModel.FLASH_LITE_2_0]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0.075, AUDIO: 0.30, VIDEO: 0.075, IMAGE: 0.075 },
      output: 0.30,
      outputUnit: PricingUnit.TOKENS
    }
  },

  // --- Video (Veo) ---
  [GeminiModel.VEO_3_1_STANDARD]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0, AUDIO: 0, VIDEO: 0, IMAGE: 0 },
      output: 0.40,
      outputUnit: PricingUnit.SECONDS
    }
  },
  [GeminiModel.VEO_3_1_FAST]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0, AUDIO: 0, VIDEO: 0, IMAGE: 0 },
      output: 0.15,
      outputUnit: PricingUnit.SECONDS
    }
  },
  [GeminiModel.VEO_2]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0, AUDIO: 0, VIDEO: 0, IMAGE: 0 },
      output: 0.35,
      outputUnit: PricingUnit.SECONDS
    }
  },

  // --- Image (Imagen) ---
  [GeminiModel.IMAGEN_4_FAST]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0, AUDIO: 0, VIDEO: 0, IMAGE: 0 },
      output: 0.02,
      outputUnit: PricingUnit.COUNT
    }
  },
  [GeminiModel.IMAGEN_4_STANDARD]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0, AUDIO: 0, VIDEO: 0, IMAGE: 0 },
      output: 0.04,
      outputUnit: PricingUnit.COUNT
    }
  },
  [GeminiModel.IMAGEN_4_ULTRA]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0, AUDIO: 0, VIDEO: 0, IMAGE: 0 },
      output: 0.06,
      outputUnit: PricingUnit.COUNT
    }
  },
  [GeminiModel.IMAGEN_3]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0, AUDIO: 0, VIDEO: 0, IMAGE: 0 },
      output: 0.03,
      outputUnit: PricingUnit.COUNT
    }
  },

  // --- Specialty ---
  [GeminiModel.EMBEDDING]: {
    provider: AIProvider.GOOGLE,
    standard: {
      input: { TEXT: 0.15, AUDIO: 0.15, VIDEO: 0.15, IMAGE: 0.15 },
      output: 0,
      outputUnit: PricingUnit.TOKENS
    }
  },
  
  // OpenAI Placeholder
  'gpt-4o': {
    provider: AIProvider.OPENAI,
    standard: { 
      input: { TEXT: 5.00, AUDIO: 5.00, VIDEO: 5.00, IMAGE: 5.00 }, 
      output: 15.00,
      outputUnit: PricingUnit.TOKENS
    }
  }
};

export const MODEL_LABELS: Record<AIModel, string> = {
  [GeminiModel.FLASH_3]: 'Gemini 3 Flash (Preview)',
  [GeminiModel.PRO_3]: 'Gemini 3 Pro (Preview)',
  [GeminiModel.PRO_IMAGE_3]: 'Gemini 3 Pro Image (Preview)',
  
  [GeminiModel.PRO_2_5]: 'Gemini 2.5 Pro',
  [GeminiModel.FLASH_2_5]: 'Gemini 2.5 Flash',
  [GeminiModel.FLASH_LITE_2_5]: 'Gemini 2.5 Flash Lite',
  [GeminiModel.FLASH_IMAGE_2_5]: 'Gemini 2.5 Flash Image',
  [GeminiModel.NATIVE_AUDIO_2_5]: 'Gemini 2.5 Flash Native Audio (Live)',
  [GeminiModel.TTS_FLASH_2_5]: 'Gemini 2.5 Flash TTS',
  [GeminiModel.TTS_PRO_2_5]: 'Gemini 2.5 Pro TTS',

  [GeminiModel.FLASH_2_0]: 'Gemini 2.0 Flash',
  [GeminiModel.FLASH_LITE_2_0]: 'Gemini 2.0 Flash Lite',

  [GeminiModel.VEO_3_1_STANDARD]: 'Veo 3.1 Standard (Video)',
  [GeminiModel.VEO_3_1_FAST]: 'Veo 3.1 Fast (Video)',
  [GeminiModel.VEO_2]: 'Veo 2.0 (Video)',

  [GeminiModel.IMAGEN_4_FAST]: 'Imagen 4 Fast (Image)',
  [GeminiModel.IMAGEN_4_STANDARD]: 'Imagen 4 Standard (Image)',
  [GeminiModel.IMAGEN_4_ULTRA]: 'Imagen 4 Ultra (Image)',
  [GeminiModel.IMAGEN_3]: 'Imagen 3 (Image)',
  
  [GeminiModel.EMBEDDING]: 'Gemini Embedding 001',
  'gpt-4o': 'GPT-4o (OpenAI Placeholder)',
};

export const PROVIDER_CONFIG = {
  [AIProvider.GOOGLE]: {
    name: 'Google Gemini',
    color: 'indigo',
    iconColor: '#4f46e5',
  },
  [AIProvider.OPENAI]: {
    name: 'OpenAI',
    color: 'emerald',
    iconColor: '#10b981',
  },
  [AIProvider.ANTHROPIC]: {
    name: 'Anthropic',
    color: 'amber',
    iconColor: '#f59e0b',
  }
};
