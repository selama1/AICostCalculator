
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GeminiModel, GeminiResponseData, CostEstimate, FileAttachment, ThinkingLevel, ModalityUsage } from '../types';
import { MODEL_PRICING } from '../constants';

export interface ThinkingOptions {
  budget?: number;
  level?: ThinkingLevel;
}

/**
 * Maps abstract thinking levels to concrete token budgets.
 * Gemini 3 and 2.5 models support thinkingBudget.
 */
const getBudgetForLevel = (level: ThinkingLevel, model: GeminiModel): number => {
  const isPro = model.includes('pro');
  switch (level) {
    case 'LOW':
      return 4096;
    case 'MEDIUM':
      return 12288;
    case 'HIGH':
      return isPro ? 32768 : 24576;
    default:
      return 0;
  }
};

export const callGemini = async (
  model: GeminiModel,
  prompt: string,
  attachments: FileAttachment[] = [],
  thinking?: ThinkingOptions
): Promise<GeminiResponseData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  
  if (prompt.trim()) {
    parts.push({ text: prompt });
  }

  attachments.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  const config: any = {};
  
  // Apply thinking configuration only if the model is Gemini 3 or 2.5
  const supportsThinking = model.includes('gemini-3') || model.includes('gemini-2.5');
  
  if (supportsThinking && thinking) {
    if (thinking.budget !== undefined) {
      config.thinkingConfig = { thinkingBudget: thinking.budget };
    } else if (thinking.level && thinking.level !== 'DISABLED') {
      const budget = getBudgetForLevel(thinking.level, model);
      if (budget > 0) {
        config.thinkingConfig = { thinkingBudget: budget };
      }
    }
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: config
  });

  const usage = (response as any).usageMetadata || {};
  const modelPricing = MODEL_PRICING[model];
  
  const inputTokens = usage.promptTokenCount || 0;
  
  // Determine tier for Pro models
  const isHighTier = modelPricing.breakpoint !== undefined && inputTokens > modelPricing.breakpoint;
  const activeTier = (isHighTier && modelPricing.high) ? modelPricing.high : modelPricing.standard;

  // Calculate Input Cost based on Modalitites
  let inputCost = 0;
  const inputBreakdown: ModalityUsage[] = [];
  const promptDetails = usage.promptTokensDetails || [{ modality: 'TEXT', tokenCount: inputTokens }];
  
  promptDetails.forEach((detail: any) => {
    const mod = detail.modality as keyof typeof activeTier.input;
    const rate = activeTier.input[mod] || activeTier.input.TEXT;
    const tokens = detail.tokenCount || 0;
    const cost = (tokens / 1_000_000) * rate;
    
    inputCost += cost;
    inputBreakdown.push({
      modality: mod,
      tokens,
      cost,
      rate
    });
  });

  const textTokens = usage.candidatesTokenCount || 0;
  const thinkingTokens = usage.thoughtsTokenCount || usage.thinkingTokenCount || 0;
  const totalOutputTokens = textTokens + thinkingTokens;

  // Output cost: use tier rate per 1M tokens
  const outputCost = (totalOutputTokens / 1_000_000) * activeTier.output;
  
  let extraCost = 0;
  let imageUrl: string | undefined;

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        // Apply documentation's fixed image price if available
        if (modelPricing.fixedOutputPerImage) {
            extraCost += modelPricing.fixedOutputPerImage;
        }
      }
    }
  }

  const totalCost = inputCost + outputCost + extraCost;

  const estimate: CostEstimate = {
    inputCost,
    outputCost,
    totalCost,
    inputTokens,
    outputTokens: totalOutputTokens,
    thinkingTokens,
    textTokens,
    inputBreakdown,
    outputRate: activeTier.output,
    isHighTier
  };

  return {
    text: response.text,
    imageUrl,
    metadata: response,
    requestConfig: config,
    estimate,
  };
};
