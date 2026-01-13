
import { AIProvider, AIModel, AIResponseData, FileAttachment, ThinkingLevel } from '../types';
import { callGemini, ThinkingOptions as GeminiThinkingOptions } from './geminiService';
import { MODEL_PRICING } from '../constants';

export interface GlobalThinkingOptions {
  budget?: number;
  level?: ThinkingLevel;
}

export const callAI = async (
  model: AIModel,
  prompt: string,
  attachments: FileAttachment[] = [],
  thinking?: GlobalThinkingOptions
): Promise<AIResponseData> => {
  const modelInfo = MODEL_PRICING[model];
  if (!modelInfo) throw new Error(`Pricing info for model ${model} not found.`);

  switch (modelInfo.provider) {
    case AIProvider.GOOGLE:
      // Fixed: Simplified return as callGemini now returns the full AIResponseData interface
      return await callGemini(model as any, prompt, attachments, thinking);

    case AIProvider.OPENAI:
      // Placeholder for OpenAI Implementation
      // In the future, this would use process.env.OPENAI_API_KEY
      throw new Error("OpenAI provider infrastructure is ready. Implementation requires OpenAI SDK integration.");

    case AIProvider.ANTHROPIC:
      // Placeholder for Anthropic Implementation
      // In the future, this would use process.env.ANTHROPIC_API_KEY
      throw new Error("Anthropic provider infrastructure is ready. Implementation requires Anthropic SDK integration.");

    default:
      throw new Error(`Unsupported provider: ${modelInfo.provider}`);
  }
};
