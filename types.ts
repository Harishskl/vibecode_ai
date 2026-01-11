export enum DetectionResult {
  AI_GENERATED = "AI-Generated",
  EDITED = "Edited / Manipulated",
  ORIGINAL = "Original / Authentic"
}

export enum BadgeColor {
  RED = "Red",
  YELLOW = "Yellow",
  GREEN = "Green"
}

export interface ForensicDetail {
  label: string;
  description: string;
  severity: number; // 0 (Benign) to 100 (Highly Suspicious)
  cues: string[]; // Specific cues or locations observed
}

export interface AnalysisResponse {
  introduction: string;
  inputSummary: string;
  detectionResult: DetectionResult;
  badgeColor: BadgeColor;
  confidenceScore: number;
  confidenceJustification: string;
  detailedExplanation: string;
  forensicBreakdown: ForensicDetail[];
  metadataAnalysis: string;
  visualIndicators: string;
  limitations: string;
  finalVerdict: string;
}

export interface MediaState {
  file: File | null;
  url: string | null;
  previewUrl: string | null;
  type: 'image' | 'video' | 'url' | null;
  base64Data?: string;
  mimeType?: string;
}