
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AIProvider, GeminiModel, AIResponseData, CostEstimate, FileAttachment, ThinkingLevel, ModalityUsage, MediaPart, PricingUnit } from '../types';
import { MODEL_PRICING } from '../constants';

export interface ThinkingOptions {
  budget?: number;
  level?: ThinkingLevel;
}

function createWavBlobUrl(base64Data: string, sampleRate: number): string {
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + bytes.length, true);
  view.setUint32(8, 0x57415645, false); // "WAVE"
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, bytes.length, true);
  const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

const getBudgetForLevel = (level: ThinkingLevel, model: GeminiModel): number => {
  const isPro = model.includes('pro');
  switch (level) {
    case 'LOW': return 4096;
    case 'MEDIUM': return 12288;
    case 'HIGH': return isPro ? 32768 : 24576;
    default: return 0;
  }
};

export const callGemini = async (
  model: GeminiModel,
  prompt: string,
  attachments: FileAttachment[] = [],
  thinking?: ThinkingOptions
): Promise<AIResponseData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelPricing = MODEL_PRICING[model];
  
  // Handle Imagen Models
  if (model.includes('imagen')) {
    const response = await ai.models.generateImages({
      model: model,
      prompt: prompt,
      config: { numberOfImages: 1, aspectRatio: '1:1' }
    });
    
    const mediaParts: MediaPart[] = response.generatedImages.map((img: any, i: number) => ({
      type: 'image',
      mimeType: 'image/png',
      url: `data:image/png;base64,${img.image.imageBytes}`,
      name: `Imagen Generation ${i + 1}`
    }));

    const outputCount = mediaParts.length;
    const outputCost = outputCount * modelPricing.standard.output;

    const estimate: CostEstimate = {
      inputCost: 0,
      outputCost,
      totalCost: outputCost,
      inputTokens: 0,
      outputTokens: outputCount,
      outputUnit: PricingUnit.COUNT,
      thinkingTokens: 0,
      textTokens: 0,
      inputBreakdown: [],
      outputRate: modelPricing.standard.output,
      isHighTier: false
    };

    return { mediaParts, metadata: response, requestConfig: {}, estimate, provider: AIProvider.GOOGLE };
  }

  // Handle Veo Models
  if (model.includes('veo')) {
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);

    // Pricing for Veo is per second. Assume 5s as default for estimation if metadata is sparse.
    const duration = 5; 
    const outputCost = duration * modelPricing.standard.output;

    const estimate: CostEstimate = {
      inputCost: 0,
      outputCost,
      totalCost: outputCost,
      inputTokens: 0,
      outputTokens: duration,
      outputUnit: PricingUnit.SECONDS,
      thinkingTokens: 0,
      textTokens: 0,
      inputBreakdown: [],
      outputRate: modelPricing.standard.output,
      isHighTier: false
    };

    return {
      mediaParts: [{ type: 'video', mimeType: 'video/mp4', url: videoUrl, name: 'Veo Video' }],
      metadata: operation,
      requestConfig: {},
      estimate,
      provider: AIProvider.GOOGLE
    };
  }

  // Handle Standard Gemini Models (GenerateContent)
  const parts: any[] = [];
  if (prompt.trim()) parts.push({ text: prompt });
  attachments.forEach(file => {
    parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
  });

  const config: any = {};
  const supportsThinking = model.includes('gemini-3') || model.includes('gemini-2.5') || model.includes('gemini-2.0');
  if (supportsThinking && thinking) {
    if (thinking.budget !== undefined) {
      config.thinkingConfig = { thinkingBudget: thinking.budget };
    } else if (thinking.level && thinking.level !== 'DISABLED') {
      const budget = getBudgetForLevel(thinking.level, model);
      if (budget > 0) config.thinkingConfig = { thinkingBudget: budget };
    }
  }

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: model,
    contents: { parts },
    config: config
  });

  const usage = (response as any).usageMetadata || {};
  const inputTokens = usage.promptTokenCount || 0;
  const isHighTier = modelPricing.breakpoint !== undefined && inputTokens > modelPricing.breakpoint;
  const activeTier = (isHighTier && modelPricing.high) ? modelPricing.high : modelPricing.standard;

  let inputCost = 0;
  const inputBreakdown: ModalityUsage[] = [];
  const promptDetails = usage.promptTokensDetails || [{ modality: 'TEXT', tokenCount: inputTokens }];
  
  promptDetails.forEach((detail: any) => {
    const mod = detail.modality as keyof typeof activeTier.input;
    const rate = activeTier.input[mod] || activeTier.input.TEXT;
    const tokens = detail.tokenCount || 0;
    const cost = (tokens / 1_000_000) * rate;
    inputCost += cost;
    inputBreakdown.push({ modality: mod, tokens, cost, rate, unit: PricingUnit.TOKENS });
  });

  const textTokens = usage.candidatesTokenCount || 0;
  const thinkingTokens = usage.thoughtsTokenCount || usage.thinkingTokenCount || 0;
  const audioOutputTokens = (usage as any).audioCandidatesTokenCount || 0;
  const totalOutputTokens = textTokens + thinkingTokens + audioOutputTokens;

  let outputCost = 0;
  if (model === GeminiModel.NATIVE_AUDIO_2_5) {
    outputCost += ( (textTokens + thinkingTokens) / 1_000_000) * 2.00;
    outputCost += (audioOutputTokens / 1_000_000) * 12.00;
  } else {
    outputCost = (totalOutputTokens / 1_000_000) * activeTier.output;
  }
  
  let extraCost = 0;
  const mediaParts: MediaPart[] = [];
  let responseText = "";

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.text) responseText += part.text;
      if (part.inlineData) {
        const { mimeType, data: base64Data } = part.inlineData;
        if (mimeType.startsWith('image/')) {
          mediaParts.push({ type: 'image', mimeType, url: `data:${mimeType};base64,${base64Data}`, name: 'Generated Image' });
          if (model === GeminiModel.PRO_IMAGE_3) {
            extraCost += (1120 / 1_000_000) * 120.00; // Standardize to 1120 tokens for estimation if exact is missing
          } else if (modelPricing.fixedOutputPerImage) {
            extraCost += modelPricing.fixedOutputPerImage;
          }
        } else if (mimeType.startsWith('audio/')) {
          let url = `data:${mimeType};base64,${base64Data}`;
          if (mimeType.includes('pcm')) {
            const rate = parseInt(mimeType.match(/rate=(\d+)/)?.[1] || "24000", 10);
            url = createWavBlobUrl(base64Data, rate);
          }
          mediaParts.push({ type: 'audio', mimeType, url, name: 'Generated Audio' });
        } else if (mimeType.startsWith('video/')) {
          mediaParts.push({ type: 'video', mimeType, url: `data:${mimeType};base64,${base64Data}`, name: 'Generated Video' });
        }
      }
    }
  }

  const estimate: CostEstimate = {
    inputCost,
    outputCost: outputCost + extraCost,
    totalCost: inputCost + outputCost + extraCost,
    inputTokens,
    outputTokens: totalOutputTokens,
    outputUnit: PricingUnit.TOKENS,
    thinkingTokens,
    textTokens,
    inputBreakdown,
    outputRate: activeTier.output,
    isHighTier
  };

  return {
    text: responseText || response.text,
    mediaParts,
    metadata: response,
    requestConfig: config,
    estimate,
    provider: AIProvider.GOOGLE,
  };
};
