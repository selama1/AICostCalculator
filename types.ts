
export enum GeminiModel {
  FLASH_3 = 'gemini-3-flash-preview',
  PRO_3 = 'gemini-3-pro-preview',
  FLASH_LITE = 'gemini-flash-lite-latest',
  FLASH_IMAGE_2_5 = 'gemini-2.5-flash-image',
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
}

export interface ModelPricing {
  standard: TierPricing;
  high?: TierPricing; // For models with > 200k prompt tier
  breakpoint?: number; // Usually 200,000
  fixedOutputPerImage?: number;
}

export interface ModalityUsage {
  modality: string;
  tokens: number;
  cost: number;
  rate: number;
}

export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
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

export interface GeminiResponseData {
  text?: string;
  imageUrl?: string;
  metadata: any;
  requestConfig: any;
  estimate: CostEstimate;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  model: GeminiModel;
  prompt: string;
  attachments: FileAttachment[];
  thinkingMode: 'NONE' | 'BUDGET' | 'LEVEL';
  thinkingBudget: number;
  thinkingLevel: ThinkingLevel;
  result: GeminiResponseData;
}
