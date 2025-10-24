/**
 * AI Model Types and Interfaces
 * Multi-model photo restoration architecture
 */

export type ModelType =
  | 'anthropic_sonnet_4_5'    // Triage and analysis
  | 'openai_gpt5_thinking'     // Portrait restoration
  | 'google_gemini_pro_2_5'    // Landscape restoration
  | 'xai_grok4_fast'           // Document restoration
  | 'groq_kimi_k2'             // Quality validation
  | 'replicate_swinir'         // Super-resolution (fallback)
  | 'ensemble';                 // Multi-model average

export type ImageContentType =
  | 'portrait'
  | 'landscape'
  | 'document'
  | 'group_photo'
  | 'mixed'
  | 'unknown';

export interface DamageProfile {
  fading: number;           // 0.0 - 1.0
  tears: number;            // 0.0 - 1.0
  stains: number;           // 0.0 - 1.0
  scratches: number;        // 0.0 - 1.0
  noise: number;            // 0.0 - 1.0
  text_detected: boolean;
}

export interface ImageAnalysis {
  content_type: ImageContentType;
  damage_profile: DamageProfile;
  resolution: {
    width: number;
    height: number;
    short_edge: number;
  };
  faces_detected: number;
  confidence: number;       // 0.0 - 1.0
  reasoning: string;
  recommended_model: ModelType;
}

export interface QualityReport {
  fadgi_score: number;      // 0-100 (Federal Agencies Digital Guidelines Initiative)
  grade: 'fail' | '1-star' | '2-star' | '3-star' | '4-star';
  face_detection?: {
    faces_found: number;
    confidence: number[];
  };
  resolution_check: {
    width: number;
    height: number;
    short_edge: number;
    meets_minimum: boolean; // Min 1200px on short edge
  };
  quality_issues: string[];
  recommendation: 'APPROVED' | 'WARN' | 'REJECT';
  processing_notes?: string;
}

export interface RestorationResult {
  restored_url: string;
  model_used: ModelType;
  processing_time_ms: number;
  quality_report: QualityReport;
  analysis: ImageAnalysis;
  cost_breakdown?: {
    triage: number;
    primary_model: number;
    upscaling: number;
    validation: number;
    total: number;
  };
}

export interface RestorationOptions {
  quality?: 'standard' | 'high' | 'ultra';
  upscale?: '1x' | '2x' | '4x';
  model?: ModelType | 'auto';
  force_model?: boolean;      // Override auto-routing
  return_metadata?: boolean;
  webhook_url?: string;
}

export interface ModelConfig {
  name: string;
  provider: 'anthropic' | 'openai' | 'google' | 'xai' | 'groq' | 'replicate';
  model_id: string;
  api_endpoint: string;
  capabilities: string[];
  average_latency_ms: number;
  cost_per_call: number;
  max_retries: number;
}

export const MODEL_CONFIGS: Record<ModelType, ModelConfig> = {
  anthropic_sonnet_4_5: {
    name: 'Anthropic Claude Sonnet 4.5',
    provider: 'anthropic',
    model_id: 'claude-sonnet-4-5-20250929',
    api_endpoint: 'https://api.anthropic.com/v1/messages',
    capabilities: ['vision', 'analysis', 'triage'],
    average_latency_ms: 1500,
    cost_per_call: 0.02,
    max_retries: 2,
  },
  openai_gpt5_thinking: {
    name: 'OpenAI GPT-5 Thinking',
    provider: 'openai',
    model_id: 'gpt-5-thinking-2025', // Hypothetical latest model
    api_endpoint: 'https://api.openai.com/v1/chat/completions',
    capabilities: ['portrait', 'facial_detail', 'restoration'],
    average_latency_ms: 5200,
    cost_per_call: 0.08,
    max_retries: 2,
  },
  google_gemini_pro_2_5: {
    name: 'Google Gemini Pro 2.5',
    provider: 'google',
    model_id: 'gemini-2.5-pro', // Hypothetical latest model
    api_endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent',
    capabilities: ['landscape', 'scene', 'color_restoration'],
    average_latency_ms: 5800,
    cost_per_call: 0.05,
    max_retries: 2,
  },
  xai_grok4_fast: {
    name: 'X.ai Grok 4 Fast Reasoning',
    provider: 'xai',
    model_id: 'grok-4-fast-reasoning', // Hypothetical latest model
    api_endpoint: 'https://api.x.ai/v1/chat/completions',
    capabilities: ['document', 'text', 'fast_processing'],
    average_latency_ms: 3400,
    cost_per_call: 0.04,
    max_retries: 2,
  },
  groq_kimi_k2: {
    name: 'Groq Cloud Kimi K2',
    provider: 'groq',
    model_id: 'kimi-k2-vision', // Hypothetical latest model
    api_endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    capabilities: ['quality_assessment', 'fast_validation'],
    average_latency_ms: 500,
    cost_per_call: 0.01,
    max_retries: 1,
  },
  replicate_swinir: {
    name: 'Replicate SwinIR',
    provider: 'replicate',
    model_id: 'jingyunliang/swinir',
    api_endpoint: 'https://api.replicate.com/v1/predictions',
    capabilities: ['super_resolution', 'upscaling', 'fallback'],
    average_latency_ms: 4600,
    cost_per_call: 0.05,
    max_retries: 1,
  },
  ensemble: {
    name: 'Multi-Model Ensemble',
    provider: 'replicate', // Uses multiple providers
    model_id: 'ensemble',
    api_endpoint: 'internal',
    capabilities: ['high_quality', 'multi_model_averaging'],
    average_latency_ms: 12000,
    cost_per_call: 0.18,
    max_retries: 1,
  },
};

export interface ModelPerformanceMetrics {
  model: ModelType;
  portrait_score: number;
  landscape_score: number;
  document_score: number;
  avg_speed_ms: number;
  cost_per_call: number;
}

export const MODEL_BENCHMARKS: ModelPerformanceMetrics[] = [
  {
    model: 'openai_gpt5_thinking',
    portrait_score: 95,
    landscape_score: 85,
    document_score: 78,
    avg_speed_ms: 5200,
    cost_per_call: 0.08,
  },
  {
    model: 'google_gemini_pro_2_5',
    portrait_score: 87,
    landscape_score: 94,
    document_score: 82,
    avg_speed_ms: 5800,
    cost_per_call: 0.05,
  },
  {
    model: 'xai_grok4_fast',
    portrait_score: 83,
    landscape_score: 81,
    document_score: 92,
    avg_speed_ms: 3400,
    cost_per_call: 0.04,
  },
  {
    model: 'replicate_swinir',
    portrait_score: 88,
    landscape_score: 88,
    document_score: 85,
    avg_speed_ms: 4600,
    cost_per_call: 0.05,
  },
];
