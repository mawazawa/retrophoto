/**
 * AI Triage System
 * Uses Anthropic Claude Sonnet 4.5 for image analysis and model routing
 *
 * NOTE: This module is optional and only used when ENABLE_MULTI_MODEL=true
 * The @anthropic-ai/sdk package is optional - install with: npm install @anthropic-ai/sdk
 */

import type { ImageAnalysis, ImageContentType, DamageProfile, ModelType } from './types';

// Lazy load Anthropic SDK to avoid build errors when not installed
// The SDK is optional - only needed when ENABLE_MULTI_MODEL=true
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let anthropicClient: any = null;

async function getAnthropicClient(): Promise<any | null> {
  if (!anthropicClient) {
    try {
      // Use dynamic require to avoid TypeScript checking the optional dependency
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Anthropic = require('@anthropic-ai/sdk').default;
      anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      });
    } catch {
      console.warn('[TRIAGE] Anthropic SDK not installed. Install with: npm install @anthropic-ai/sdk');
      return null;
    }
  }
  return anthropicClient;
}

export async function analyzeImageForRouting(imageUrl: string): Promise<ImageAnalysis> {
  try {
    console.log('[TRIAGE] Starting image analysis for:', imageUrl);

    // Get Anthropic client (lazy loaded)
    const client = await getAnthropicClient();
    if (!client) {
      throw new Error('Anthropic SDK not available');
    }

    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: `Analyze this photo for restoration. Provide a JSON response with the following structure:

{
  "content_type": "portrait|landscape|document|group_photo|mixed",
  "damage_assessment": {
    "fading": 0.0-1.0,
    "tears": 0.0-1.0,
    "stains": 0.0-1.0,
    "scratches": 0.0-1.0,
    "noise": 0.0-1.0,
    "text_detected": true|false
  },
  "faces_detected": 0-10,
  "resolution_estimate": {
    "quality": "low|medium|high"
  },
  "reasoning": "Brief explanation of damage and content type"
}

Rules:
- "portrait": Single person, face visible, close-up or medium shot
- "landscape": Outdoor scenes, nature, cityscapes, buildings
- "document": Text-heavy, letters, certificates, newspapers
- "group_photo": Multiple people (2+), family photos, events
- "mixed": Combination of categories

Damage scores:
- 0.0 = No damage
- 0.3 = Light damage
- 0.6 = Moderate damage
- 0.9 = Severe damage
- 1.0 = Extreme damage

Be precise and analytical. Return ONLY the JSON, no other text.`,
            },
          ],
        },
      ],
    });

    // Parse Claude's response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    console.log('[TRIAGE] Raw response:', responseText);

    const analysisData = JSON.parse(responseText);

    // Convert to our internal format
    const damageProfile: DamageProfile = {
      fading: analysisData.damage_assessment.fading,
      tears: analysisData.damage_assessment.tears,
      stains: analysisData.damage_assessment.stains,
      scratches: analysisData.damage_assessment.scratches,
      noise: analysisData.damage_assessment.noise,
      text_detected: analysisData.damage_assessment.text_detected,
    };

    // Route to optimal model based on analysis
    const recommendedModel = selectOptimalModel(
      analysisData.content_type,
      damageProfile,
      analysisData.faces_detected
    );

    const analysis: ImageAnalysis = {
      content_type: analysisData.content_type as ImageContentType,
      damage_profile: damageProfile,
      resolution: {
        width: 0, // Will be filled by actual image metadata
        height: 0,
        short_edge: 0,
      },
      faces_detected: analysisData.faces_detected || 0,
      confidence: 0.9, // Claude is highly confident in vision analysis
      reasoning: analysisData.reasoning,
      recommended_model: recommendedModel,
    };

    console.log('[TRIAGE] Analysis complete:', {
      content_type: analysis.content_type,
      recommended_model: recommendedModel,
      faces: analysis.faces_detected,
    });

    return analysis;
  } catch (error) {
    console.error('[TRIAGE] Error:', error);

    // Fallback to SwinIR if triage fails
    return {
      content_type: 'unknown',
      damage_profile: {
        fading: 0.5,
        tears: 0.3,
        stains: 0.2,
        scratches: 0.3,
        noise: 0.4,
        text_detected: false,
      },
      resolution: { width: 0, height: 0, short_edge: 0 },
      faces_detected: 0,
      confidence: 0.3,
      reasoning: 'Triage failed, using fallback model',
      recommended_model: 'replicate_swinir',
    };
  }
}

/**
 * Select optimal model based on image analysis
 */
function selectOptimalModel(
  contentType: string,
  damageProfile: DamageProfile,
  facesDetected: number
): ModelType {
  // Rule 1: High-detail portraits → OpenAI GPT-5 Thinking
  if (contentType === 'portrait' && damageProfile.fading > 0.5) {
    return 'openai_gpt5_thinking';
  }

  // Rule 2: Portraits with multiple faces → OpenAI GPT-5 Thinking
  if (facesDetected >= 1 && damageProfile.fading > 0.4) {
    return 'openai_gpt5_thinking';
  }

  // Rule 3: Landscapes with color fading → Google Gemini Pro 2.5
  if (contentType === 'landscape' && damageProfile.fading > 0.4) {
    return 'google_gemini_pro_2_5';
  }

  // Rule 4: Documents or text-heavy → X.ai Grok 4 Fast Reasoning
  if (contentType === 'document' || damageProfile.text_detected) {
    return 'xai_grok4_fast';
  }

  // Rule 5: Mixed content or group photos → Ensemble (if high damage)
  if ((contentType === 'mixed' || contentType === 'group_photo') && damageProfile.fading > 0.7) {
    // Ensemble is expensive, only use for severe damage
    // For now, route to most versatile model
    return 'replicate_swinir';
  }

  // Default: Replicate SwinIR (proven reliable, good balance)
  return 'replicate_swinir';
}

/**
 * Estimate processing cost based on selected model
 */
export function estimateProcessingCost(analysis: ImageAnalysis): number {
  const triageCost = 0.02;

  let primaryModelCost = 0;
  switch (analysis.recommended_model) {
    case 'openai_gpt5_thinking':
      primaryModelCost = 0.08;
      break;
    case 'google_gemini_pro_2_5':
      primaryModelCost = 0.05;
      break;
    case 'xai_grok4_fast':
      primaryModelCost = 0.04;
      break;
    case 'replicate_swinir':
      primaryModelCost = 0.05;
      break;
    case 'ensemble':
      primaryModelCost = 0.18;
      break;
    default:
      primaryModelCost = 0.05;
  }

  const upscalingCost = 0.05; // SwinIR always runs for final enhancement
  const validationCost = 0.01; // Groq Kimi K2 quality check

  return triageCost + primaryModelCost + upscalingCost + validationCost;
}
