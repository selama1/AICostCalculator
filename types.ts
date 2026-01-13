
export enum AIProvider {
  GOOGLE = 'GOOGLE',
  OPENAI = 'OPENAI',
  ANTHROPIC = 'ANTHROPIC',
}

export enum PricingUnit {
  TOKENS = 'TOKENS',
  SECONDS = 'SECONDS',
  COUNT = 'COUNT',
}

export type AIModel = string;

export enum GeminiModel {
  // Gemini 3
  FLASH_3 = 'gemini-3-flash-preview',
  PRO_3 = 'gemini-3-pro-preview',
  PRO_IMAGE_3 = 'gemini-3-pro-image-preview',
  
  // Gemini 2.5
  FLASH_2_5 = 'gemini-2.5-flash',
  PRO_2_5 = 'gemini-2.5-pro',
  FLASH_LITE_2_5 = 'gemini-2.5-flash-lite',
  FLASH_IMAGE_2_5 = 'gemini-2.5-flash-image',
  NATIVE_AUDIO_2_5 = 'gemini-2.5-flash-native-audio-preview-12-2025',
  TTS_FLASH_2_5 = 'gemini-2.5-flash-preview-tts',
  TTS_PRO_2_5 = 'gemini-2.5-pro-preview-tts',

  // Gemini 2.0
  FLASH_2_0 = 'gemini-2.0-flash',
  FLASH_LITE_2_0 = 'gemini-2.0-flash-lite',
  
  // Specialty / Embeddings
  EMBEDDING = 'gemini-embedding-001',

  // Video Generation (Veo)
  VEO_3_1_STANDARD = 'veo-3.1-generate-preview',
  VEO_3_1_FAST = 'veo-3.1-fast-generate-preview',
  VEO_2 = 'veo-2.0-generate-001',

  // Image Generation (Imagen)
  IMAGEN_4_FAST = 'imagen-4.0-fast-generate-001',
  IMAGEN_4_STANDARD = 'imagen-4.0-generate-001',
  IMAGEN_4_ULTRA = 'imagen-4.0-ultra-generate-001',
  IMAGEN_3 = 'imagen-3.0-generate-002'
}

export type ThinkingLevel = 'DISABLED' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface ModalityPricing {
  TEXT: number;
  AUDIO: number;
  VIDEO: number;
  IMAGE?: number;
}

export interface TierPricing {
  input: ModalityPricing;
  output: number;
  outputUnit: PricingUnit;
  outputImage?: number; // Special rate for generated images inside a multi-modal stream
}

export interface ModelPricing {
  provider: AIProvider;
  standard: TierPricing;
  high?: TierPricing;
  breakpoint?: number;
  fixedOutputPerImage?: number;
}

export interface ModalityUsage {
  modality: string;
  tokens: number;
  cost: number;
  rate: number;
  unit: PricingUnit;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number; // For Gemini this is tokens, for Veo it's seconds, for Imagen it's count
  outputUnit: PricingUnit;
  thinkingTokens: number;
  textTokens: number;
  inputBreakdown: ModalityUsage[];
  outputRate: number;
  isHighTier: boolean;
}

export interface FileAttachment {
  name: string;
  mimeType: string;
  data: string; // base64
  previewUrl: string;
}

export interface MediaPart {
  type: 'image' | 'audio' | 'video';
  mimeType: string;
  url: string;
  name: string;
}

export interface AIResponseData {
  text?: string;
  mediaParts: MediaPart[];
  metadata: any;
  requestConfig: any;
  estimate: CostEstimate;
  provider: AIProvider;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  provider: AIProvider;
  model: AIModel;
  title?: string;
  prompt: string;
  attachments: FileAttachment[];
  thinkingMode: 'NONE' | 'BUDGET' | 'LEVEL';
  thinkingBudget: number;
  thinkingLevel: ThinkingLevel;
  result: AIResponseData;
}
