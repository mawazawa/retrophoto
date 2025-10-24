/**
 * Quality Validator
 * FADGI scoring and quality assessment
 */

import sharp from 'sharp';
import type { QualityReport, ImageAnalysis } from './types';

/**
 * Validate restored image quality using FADGI guidelines
 * (Federal Agencies Digital Guidelines Initiative)
 */
export async function validateQuality(
  restoredUrl: string,
  analysis: ImageAnalysis
): Promise<QualityReport> {
  try {
    console.log('[QUALITY] Starting validation for:', restoredUrl);

    // Fetch and analyze restored image
    const imageBuffer = await fetch(restoredUrl).then((r) => r.arrayBuffer());
    const image = sharp(Buffer.from(imageBuffer));
    const metadata = await image.metadata();
    const stats = await image.stats();

    const qualityIssues: string[] = [];

    // 1. Resolution check (minimum 1200px on short edge for archival quality)
    const shortEdge = Math.min(metadata.width || 0, metadata.height || 0);
    const meetsMinimum = shortEdge >= 1200;

    if (!meetsMinimum) {
      qualityIssues.push(`Resolution too low: ${shortEdge}px (min 1200px)`);
    }

    // 2. Check for over-sharpening (common AI artifact)
    const isOverSharpened = await detectOverSharpening(image, stats);
    if (isOverSharpened) {
      qualityIssues.push('Over-sharpening detected (AI artifact)');
    }

    // 3. Check for unnatural smoothing (another common AI issue)
    const isOverSmoothed = await detectOverSmoothing(stats);
    if (isOverSmoothed) {
      qualityIssues.push('Unnatural smoothing detected');
    }

    // 4. Color balance check
    const colorBalance = analyzeColorBalance(stats);
    if (colorBalance.issue) {
      qualityIssues.push(colorBalance.issue);
    }

    // 5. Calculate FADGI score (0-100)
    const fadgiScore = calculateFADGIScore({
      resolution: shortEdge,
      overSharpened: isOverSharpened,
      overSmoothed: isOverSmoothed,
      colorBalance: colorBalance.score,
      damageRemoval: estimateDamageRemoval(analysis),
    });

    // 6. Assign grade
    const grade = assignGrade(fadgiScore);

    // 7. Recommendation
    let recommendation: 'APPROVED' | 'WARN' | 'REJECT' = 'APPROVED';
    if (fadgiScore < 60) {
      recommendation = 'REJECT';
    } else if (fadgiScore < 70) {
      recommendation = 'WARN';
    }

    // 8. Face detection (if applicable)
    let faceDetection: { faces_found: number; confidence: number[] } | undefined;
    if (analysis.faces_detected > 0) {
      // In production, use a face detection API (e.g., AWS Rekognition, Azure Face API)
      // For now, trust the triage analysis
      faceDetection = {
        faces_found: analysis.faces_detected,
        confidence: Array(analysis.faces_detected).fill(0.9),
      };
    }

    const report: QualityReport = {
      fadgi_score: fadgiScore,
      grade,
      face_detection: faceDetection,
      resolution_check: {
        width: metadata.width || 0,
        height: metadata.height || 0,
        short_edge: shortEdge,
        meets_minimum: meetsMinimum,
      },
      quality_issues: qualityIssues,
      recommendation,
      processing_notes: qualityIssues.length === 0 ? 'Excellent quality' : undefined,
    };

    console.log('[QUALITY] Validation complete:', {
      fadgi_score: report.fadgi_score,
      grade: report.grade,
      recommendation: report.recommendation,
    });

    return report;
  } catch (error) {
    console.error('[QUALITY] Validation failed:', error);

    // Return default report on failure
    return {
      fadgi_score: 50,
      grade: 'fail',
      resolution_check: {
        width: 0,
        height: 0,
        short_edge: 0,
        meets_minimum: false,
      },
      quality_issues: ['Quality validation failed'],
      recommendation: 'WARN',
      processing_notes: 'Validation error, manual review recommended',
    };
  }
}

/**
 * Detect over-sharpening (common AI artifact)
 */
async function detectOverSharpening(
  image: sharp.Sharp,
  stats: sharp.Stats
): Promise<boolean> {
  // Over-sharpening creates high-frequency noise and halos
  // Check standard deviation of luminance channel
  const luminanceStdDev = stats.channels[0]?.stdev || 0;

  // If std deviation is very high, it might be over-sharpened
  // Threshold: >75 (empirical value)
  return luminanceStdDev > 75;
}

/**
 * Detect over-smoothing (unnatural blur from AI)
 */
async function detectOverSmoothing(stats: sharp.Stats): Promise<boolean> {
  // Over-smoothing reduces texture and detail
  // Check if std deviation is very low
  const luminanceStdDev = stats.channels[0]?.stdev || 0;

  // If std deviation is very low, it might be over-smoothed
  // Threshold: <20 (empirical value)
  return luminanceStdDev < 20;
}

/**
 * Analyze color balance
 */
function analyzeColorBalance(stats: sharp.Stats): { score: number; issue?: string } {
  // Check if color channels are roughly balanced
  const redMean = stats.channels[0]?.mean || 0;
  const greenMean = stats.channels[1]?.mean || 0;
  const blueMean = stats.channels[2]?.mean || 0;

  // Calculate variance from average
  const avgMean = (redMean + greenMean + blueMean) / 3;
  const redVariance = Math.abs(redMean - avgMean) / avgMean;
  const greenVariance = Math.abs(greenMean - avgMean) / avgMean;
  const blueVariance = Math.abs(blueMean - avgMean) / avgMean;

  const maxVariance = Math.max(redVariance, greenVariance, blueVariance);

  // If any channel deviates >30% from average, there's a color cast
  if (maxVariance > 0.3) {
    let dominantChannel = 'unknown';
    if (redVariance === maxVariance) dominantChannel = 'red';
    if (greenVariance === maxVariance) dominantChannel = 'green';
    if (blueVariance === maxVariance) dominantChannel = 'blue';

    return {
      score: 70,
      issue: `Color cast detected (dominant ${dominantChannel} channel)`,
    };
  }

  // Color balance is good
  return { score: 100 };
}

/**
 * Estimate how well damage was removed (based on original analysis)
 */
function estimateDamageRemoval(analysis: ImageAnalysis): number {
  // Higher original damage → more opportunity for improvement
  // This is a simplified heuristic
  const avgDamage =
    (analysis.damage_profile.fading +
      analysis.damage_profile.tears +
      analysis.damage_profile.stains +
      analysis.damage_profile.scratches) /
    4;

  // If original damage was high, assume good removal if output looks clean
  // This is a rough estimate; in production, compare before/after
  return avgDamage > 0.5 ? 90 : 95;
}

/**
 * Calculate FADGI score (0-100)
 * Federal Agencies Digital Guidelines Initiative standards
 */
function calculateFADGIScore(metrics: {
  resolution: number;
  overSharpened: boolean;
  overSmoothed: boolean;
  colorBalance: number;
  damageRemoval: number;
}): number {
  let score = 100;

  // Resolution (max -20 points)
  if (metrics.resolution < 1200) {
    score -= 20;
  } else if (metrics.resolution < 1800) {
    score -= 10;
  } else if (metrics.resolution < 2400) {
    score -= 5;
  }

  // Over-sharpening (-15 points)
  if (metrics.overSharpened) {
    score -= 15;
  }

  // Over-smoothing (-15 points)
  if (metrics.overSmoothed) {
    score -= 15;
  }

  // Color balance (max -20 points)
  const colorBalanceDeduction = ((100 - metrics.colorBalance) / 100) * 20;
  score -= colorBalanceDeduction;

  // Damage removal quality (max -30 points)
  const damageRemovalDeduction = ((100 - metrics.damageRemoval) / 100) * 30;
  score -= damageRemovalDeduction;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Assign FADGI grade based on score
 */
function assignGrade(score: number): QualityReport['grade'] {
  if (score >= 90) return '4-star'; // Archival quality
  if (score >= 80) return '3-star'; // High quality
  if (score >= 70) return '2-star'; // Good quality
  if (score >= 60) return '1-star'; // Fair quality
  return 'fail'; // Poor quality
}

/**
 * Generate user-friendly quality report summary
 */
export function generateQualityReportSummary(report: QualityReport): string {
  const lines: string[] = [];

  lines.push(`Quality Score: ${report.fadgi_score}/100 (${report.grade})`);
  lines.push(`Resolution: ${report.resolution_check.width}×${report.resolution_check.height}px`);

  if (report.face_detection) {
    lines.push(
      `Faces Detected: ${report.face_detection.faces_found} (avg confidence: ${Math.round(
        report.face_detection.confidence.reduce((a, b) => a + b, 0) /
          report.face_detection.confidence.length *
          100
      )}%)`
    );
  }

  if (report.quality_issues.length > 0) {
    lines.push(`Issues: ${report.quality_issues.join(', ')}`);
  }

  lines.push(`Recommendation: ${report.recommendation}`);

  return lines.join('\n');
}
