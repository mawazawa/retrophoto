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

  console.log('[ORCHESTRATOR] Starting restoration pipeline');
  console.log('[ORCHESTRATOR] Multi-model enabled:', ENABLE_MULTI_MODEL);

  try {
    let analysis: ImageAnalysis;

    // Step 1: Triage (skip when multi-model is disabled for faster processing)
    if (ENABLE_MULTI_MODEL && (options.model === 'auto' || !options.model)) {
      console.log('[ORCHESTRATOR] Step 1: Image triage and analysis');
      try {
        // Dynamic import to avoid loading Anthropic SDK when not needed
        const { analyzeImageForRouting } = await import('./triage');
        analysis = await analyzeImageForRouting(imageUrl);
      } catch (error) {
        console.warn('[ORCHESTRATOR] Triage failed, using direct SwinIR:', error);
        analysis = createDefaultAnalysis('Triage failed, using direct model');
      }
    } else if (options.model && options.model !== 'auto') {
      // User specified a model
      analysis = createDefaultAnalysis('User-specified model');
      analysis.recommended_model = options.model as ModelType;
    } else {
      // Multi-model disabled - use direct SwinIR (fastest path)
      console.log('[ORCHESTRATOR] Using direct SwinIR (multi-model disabled)');
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

    // All routes currently go through SwinIR (other providers not implemented)
    switch (selectedModel) {
      case 'openai_gpt5_thinking':
      case 'google_gemini_pro_2_5':
      case 'xai_grok4_fast':
        // These providers are not yet implemented
        console.log(`[ORCHESTRATOR] ${selectedModel} not implemented, using SwinIR`);
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
        analysis: createDefaultAnalysis('Processing failed'),
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
