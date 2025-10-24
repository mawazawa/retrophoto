/**
 * AI Orchestrator
 * Multi-model restoration pipeline coordinator
 */

import sharp from 'sharp';
import type {
  RestorationResult,
  RestorationOptions,
  ImageAnalysis,
  QualityReport,
  ModelType,
} from './types';
import { analyzeImageForRouting, estimateProcessingCost } from './triage';
import { restoreImage as restoreWithSwinIR } from './restore';
import { validateQuality } from './quality-validator';

// Model-specific providers (to be implemented)
// import { restoreWithOpenAI } from './providers/openai';
// import { restoreWithGemini } from './providers/gemini';
// import { restoreWithGrok } from './providers/xai';

export async function orchestrateRestoration(
  imageUrl: string,
  options: RestorationOptions = {}
): Promise<RestorationResult> {
  const startTime = Date.now();

  console.log('[ORCHESTRATOR] Starting restoration pipeline');
  console.log('[ORCHESTRATOR] Options:', options);

  try {
    // Step 1: Triage (analyze image and route to optimal model)
    console.log('[ORCHESTRATOR] Step 1: Image triage and analysis');
    let analysis: ImageAnalysis;

    if (options.model === 'auto' || !options.model) {
      // Use AI triage to select best model
      analysis = await analyzeImageForRouting(imageUrl);
    } else {
      // User specified a model
      analysis = {
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
        confidence: 1.0,
        reasoning: 'User-specified model',
        recommended_model: options.model as ModelType,
      };
    }

    // Get actual image metadata
    const imageBuffer = await fetch(imageUrl).then((r) => r.arrayBuffer());
    const metadata = await sharp(Buffer.from(imageBuffer)).metadata();
    analysis.resolution = {
      width: metadata.width || 0,
      height: metadata.height || 0,
      short_edge: Math.min(metadata.width || 0, metadata.height || 0),
    };

    console.log('[ORCHESTRATOR] Analysis:', {
      content_type: analysis.content_type,
      recommended_model: analysis.recommended_model,
      resolution: analysis.resolution,
    });

    // Step 2: Primary restoration using selected model
    console.log('[ORCHESTRATOR] Step 2: Primary restoration');
    const selectedModel = options.force_model
      ? (options.model as ModelType)
      : analysis.recommended_model;

    let restoredUrl: string;

    // For now, all routes go through SwinIR until other providers are implemented
    // In production, this would route to different providers based on selectedModel
    switch (selectedModel) {
      case 'openai_gpt5_thinking':
        // TODO: Implement OpenAI provider
        // restoredUrl = await restoreWithOpenAI(imageUrl, analysis);
        console.log('[ORCHESTRATOR] OpenAI provider not yet implemented, using SwinIR fallback');
        restoredUrl = await restoreWithSwinIR(imageUrl);
        break;

      case 'google_gemini_pro_2_5':
        // TODO: Implement Gemini provider
        // restoredUrl = await restoreWithGemini(imageUrl, analysis);
        console.log('[ORCHESTRATOR] Gemini provider not yet implemented, using SwinIR fallback');
        restoredUrl = await restoreWithSwinIR(imageUrl);
        break;

      case 'xai_grok4_fast':
        // TODO: Implement Grok provider
        // restoredUrl = await restoreWithGrok(imageUrl, analysis);
        console.log('[ORCHESTRATOR] Grok provider not yet implemented, using SwinIR fallback');
        restoredUrl = await restoreWithSwinIR(imageUrl);
        break;

      case 'replicate_swinir':
      default:
        // Use proven SwinIR model
        restoredUrl = await restoreWithSwinIR(imageUrl);
        break;
    }

    console.log('[ORCHESTRATOR] Restoration complete:', restoredUrl);

    // Step 3: Quality validation
    console.log('[ORCHESTRATOR] Step 3: Quality validation');
    const qualityReport = await validateQuality(restoredUrl, analysis);

    console.log('[ORCHESTRATOR] Quality report:', {
      fadgi_score: qualityReport.fadgi_score,
      grade: qualityReport.grade,
      recommendation: qualityReport.recommendation,
    });

    // Step 4: Calculate cost breakdown (if requested)
    const costBreakdown = options.return_metadata
      ? {
          triage: 0.02,
          primary_model: estimateProcessingCost(analysis) - 0.02 - 0.05 - 0.01,
          upscaling: 0.05,
          validation: 0.01,
          total: estimateProcessingCost(analysis),
        }
      : undefined;

    const result: RestorationResult = {
      restored_url: restoredUrl,
      model_used: selectedModel,
      processing_time_ms: Date.now() - startTime,
      quality_report: qualityReport,
      analysis,
      cost_breakdown: costBreakdown,
    };

    console.log('[ORCHESTRATOR] Pipeline complete:', {
      processing_time_ms: result.processing_time_ms,
      model_used: result.model_used,
      quality_score: result.quality_report.fadgi_score,
    });

    return result;
  } catch (error) {
    console.error('[ORCHESTRATOR] Pipeline failed:', error);
    throw error;
  }
}

/**
 * Batch restoration with intelligent queuing
 */
export async function orchestrateBatchRestoration(
  imageUrls: string[],
  options: RestorationOptions = {}
): Promise<RestorationResult[]> {
  console.log('[ORCHESTRATOR] Starting batch restoration:', imageUrls.length, 'photos');

  const results: RestorationResult[] = [];

  // Process sequentially to avoid overwhelming external APIs
  // In production, this could use a queue system (BullMQ, etc.)
  for (let i = 0; i < imageUrls.length; i++) {
    console.log(`[ORCHESTRATOR] Processing batch photo ${i + 1}/${imageUrls.length}`);

    try {
      const result = await orchestrateRestoration(imageUrls[i], options);
      results.push(result);
    } catch (error) {
      console.error(`[ORCHESTRATOR] Batch photo ${i + 1} failed:`, error);

      // Create error result
      results.push({
        restored_url: '',
        model_used: 'replicate_swinir',
        processing_time_ms: 0,
        quality_report: {
          fadgi_score: 0,
          grade: 'fail',
          resolution_check: {
            width: 0,
            height: 0,
            short_edge: 0,
            meets_minimum: false,
          },
          quality_issues: [
            error instanceof Error ? error.message : 'Unknown error',
          ],
          recommendation: 'REJECT',
        },
        analysis: {
          content_type: 'unknown',
          damage_profile: {
            fading: 0,
            tears: 0,
            stains: 0,
            scratches: 0,
            noise: 0,
            text_detected: false,
          },
          resolution: { width: 0, height: 0, short_edge: 0 },
          faces_detected: 0,
          confidence: 0,
          reasoning: 'Processing failed',
          recommended_model: 'replicate_swinir',
        },
      });
    }
  }

  console.log('[ORCHESTRATOR] Batch complete:', {
    total: results.length,
    successful: results.filter((r) => r.quality_report.recommendation !== 'REJECT').length,
    failed: results.filter((r) => r.quality_report.recommendation === 'REJECT').length,
  });

  return results;
}
