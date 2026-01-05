/**
 * AI Orchestrator
 * Multi-model restoration pipeline coordinator
 *
 * Feature flag: ENABLE_MULTI_MODEL
 * - When disabled (default): Uses direct SwinIR restoration (faster, cheaper)
 * - When enabled: Uses AI triage to route to different models (requires ANTHROPIC_API_KEY)
 */

import sharp from 'sharp';
import type {
  RestorationResult,
  RestorationOptions,
  ImageAnalysis,
  ModelType,
} from './types';
import { restoreImage as restoreWithSwinIR } from './restore';
import { validateQuality } from './quality-validator';
import { logger } from '@/lib/observability/logger';

// Feature flag for multi-model orchestration
// Disabled by default until other providers are implemented
const ENABLE_MULTI_MODEL = process.env.ENABLE_MULTI_MODEL === 'true';

/**
 * Create default analysis when triage is disabled or unavailable
 */
function createDefaultAnalysis(reasoning: string): ImageAnalysis {
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
    confidence: 1.0,
    reasoning,
    recommended_model: 'replicate_swinir',
  };
}

export async function orchestrateRestoration(
  imageUrl: string,
  options: RestorationOptions = {}
): Promise<RestorationResult> {
  const startTime = Date.now();

  logger.debug('Starting restoration pipeline', {
    imageUrl,
    multiModelEnabled: ENABLE_MULTI_MODEL
  });

  try {
    let analysis: ImageAnalysis;

    // Step 1: Triage (skip when multi-model is disabled for faster processing)
    if (ENABLE_MULTI_MODEL && (options.model === 'auto' || !options.model)) {
      logger.debug('Starting image triage and analysis', { imageUrl });
      try {
        // Dynamic import to avoid loading Anthropic SDK when not needed
        const { analyzeImageForRouting } = await import('./triage');
        analysis = await analyzeImageForRouting(imageUrl);
      } catch (error) {
        logger.warn('Triage failed, using direct SwinIR', {
          imageUrl,
          error: error instanceof Error ? error.message : String(error)
        });
        analysis = createDefaultAnalysis('Triage failed, using direct model');
      }
    } else if (options.model && options.model !== 'auto') {
      // User specified a model
      analysis = createDefaultAnalysis('User-specified model');
      analysis.recommended_model = options.model as ModelType;
    } else {
      // Multi-model disabled - use direct SwinIR (fastest path)
      logger.debug('Using direct SwinIR (multi-model disabled)', { imageUrl });
      analysis = createDefaultAnalysis('Direct SwinIR mode');
    }

    // Get actual image metadata
    const imageBuffer = await fetch(imageUrl).then((r) => r.arrayBuffer());
    const metadata = await sharp(Buffer.from(imageBuffer)).metadata();
    analysis.resolution = {
      width: metadata.width || 0,
      height: metadata.height || 0,
      short_edge: Math.min(metadata.width || 0, metadata.height || 0),
    };

    logger.debug('Analysis complete', {
      imageUrl,
      content_type: analysis.content_type,
      recommended_model: analysis.recommended_model,
      resolution: analysis.resolution,
    });

    // Step 2: Primary restoration using selected model
    logger.debug('Starting primary restoration', { imageUrl });
    const selectedModel = options.force_model
      ? (options.model as ModelType)
      : analysis.recommended_model;

    let restoredUrl: string;

    // All routes currently go through SwinIR (other providers not implemented)
    switch (selectedModel) {
      case 'openai_gpt5_thinking':
      case 'google_gemini_pro_2_5':
      case 'xai_grok4_fast':
        // These providers are not yet implemented
        logger.debug('Model not implemented, using SwinIR', { imageUrl, selectedModel });
        restoredUrl = await restoreWithSwinIR(imageUrl);
        break;

      case 'replicate_swinir':
      default:
        // Use proven SwinIR model
        restoredUrl = await restoreWithSwinIR(imageUrl);
        break;
    }

    logger.debug('Restoration complete', { imageUrl, restoredUrl });

    // Step 3: Quality validation
    logger.debug('Starting quality validation', { imageUrl });
    const qualityReport = await validateQuality(restoredUrl, analysis);

    logger.debug('Quality report generated', {
      imageUrl,
      fadgi_score: qualityReport.fadgi_score,
      grade: qualityReport.grade,
      recommendation: qualityReport.recommendation,
    });

    // Step 4: Calculate cost breakdown (if requested)
    let costBreakdown;
    if (options.return_metadata) {
      const baseCost = ENABLE_MULTI_MODEL ? 0.02 : 0; // Triage cost
      costBreakdown = {
        triage: baseCost,
        primary_model: 0.05, // SwinIR cost
        upscaling: 0.05,
        validation: 0.01,
        total: baseCost + 0.11,
      };
    }

    const result: RestorationResult = {
      restored_url: restoredUrl,
      model_used: selectedModel,
      processing_time_ms: Date.now() - startTime,
      quality_report: qualityReport,
      analysis,
      cost_breakdown: costBreakdown,
    };

    logger.info('Restoration pipeline complete', {
      imageUrl,
      processing_time_ms: result.processing_time_ms,
      model_used: result.model_used,
      quality_score: result.quality_report.fadgi_score,
    });

    return result;
  } catch (error) {
    logger.error('Restoration pipeline failed', {
      imageUrl,
      error: error instanceof Error ? error.message : String(error)
    });
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
  logger.info('Starting batch restoration', { totalPhotos: imageUrls.length });

  const results: RestorationResult[] = [];

  // Process sequentially to avoid overwhelming external APIs
  for (let i = 0; i < imageUrls.length; i++) {
    logger.debug('Processing batch photo', {
      current: i + 1,
      total: imageUrls.length,
      imageUrl: imageUrls[i]
    });

    try {
      const result = await orchestrateRestoration(imageUrls[i], options);
      results.push(result);
    } catch (error) {
      logger.error('Batch photo failed', {
        current: i + 1,
        total: imageUrls.length,
        imageUrl: imageUrls[i],
        error: error instanceof Error ? error.message : String(error)
      });

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
        analysis: createDefaultAnalysis('Processing failed'),
      });
    }
  }

  logger.info('Batch restoration complete', {
    total: results.length,
    successful: results.filter((r) => r.quality_report.recommendation !== 'REJECT').length,
    failed: results.filter((r) => r.quality_report.recommendation === 'REJECT').length,
  });

  return results;
}
