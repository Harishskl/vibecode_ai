import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, DetectionResult, BadgeColor } from "../types";

const SYSTEM_INSTRUCTION = `
You are a skeptical AI Media Forensics Investigator with expertise in Computer Vision and Generative Adversarial Networks (GANs).
Your task is to analyze media and determine if it is AI-Generated, Edited, or Original.

**CORE PHILOSOPHY**: "Inconsistency is the key. Real cameras record the world uniformly. Edits introduce local discontinuities. AI often fails at global coherence."

**CLASSIFICATION PROTOCOLS:**

1. 🟥 **AI-GENERATED (Synthetic Media)**
   - **Definition**: Created entirely by algorithms (Midjourney, DALL-E, Flux, Sora, Runway).
   - **CRITICAL VISUAL INDICATORS**:
     - **Text & Glyphs (The "Alien Language" Test)**: Inspect background signs, labels on bottles, or text on clothing. AI often generates gibberish, pseudolatin, or "alien" symbols that resemble letters but aren't.
     - **Anatomical Hallucinations**: Merging limbs, extra fingers, asymmetric eyes/pupils, teeth that blend together.
     - **Texture & Pattern**: Look for "tiled" patterns in grass, foliage, or brickwork. AI often copies and pastes texture patches or creates "painterly" skin that blends into clothes.
     - **Physics & Logic**: Inconsistent shadows (multiple light sources where there should be one), floating objects, illogical reflections (e.g., reflection in a mirror doesn't match the scene).

2. 🟨 **EDITED / MANIPULATED** (Human + AI Assist)
   - **Definition**: Real photography modified by tools like Photoshop, Facetune, Generative Fill, or Magic Eraser.
   - **CRITICAL FORENSIC INDICATORS**:
     - **Noise Discrepancy (The #1 Tell)**: Compare the grain/noise on the subject vs. the background. If the face is smooth but the background is grainy (or vice versa), it is a composite or highly filtered. Real ISO noise is global.
     - **Liquify/Warping**: Inspect straight lines (tiles, doorframes, horizons) near organic shapes (waist, face, muscles). If straight lines subtly bend or curve near the body, it is a shaping edit.
     - **Selective Smoothing**: Skin that lacks pores (plastic look) while eyes/hair remain razor sharp. Real lens blur affects *everything* at a specific depth, it does not selectively smooth skin.
     - **Inpainting Smears**: Look for "smudged" pixels or blurry patches where an object might have been removed.

3. 🟩 **ORIGINAL / AUTHENTIC**
   - **Definition**: Unaltered sensor capture (allowing for standard compression/color grading).
   - **POSITIVE INDICATORS**:
     - **Uniform Sensor Noise**: Consistent, fine-grain ISO noise across the *entire* image (shadows and highlights).
     - **Natural Defects**: Motion blur, slight focus hunting, or lens flare.
     - **Compression Artifacts**: JPEG/MPEG blocking or banding (This is NORMAL for web media, do not flag as AI).
     - **Consistency**: Lighting direction matches on all objects.

**VIDEO / TEMPORAL ANALYSIS PROTOCOLS (FRAME-BY-FRAME):**
   - **Identity Drift**: Does the face shape change? (Deepfake).
   - **Background Warping**: Does the background "breathe" or distort around a moving person? (Filter/Inpainting).
   - **Object Permanence**: Do objects in the background vanish or change shape randomly? (AI Hallucination).
   - **Filter Glitch**: Do beauty filters detach from the face during fast motion?
   - **Distinction**: 
     - *Macroblocking/Pixelation* = **ORIGINAL** (Compression).
     - *Shimmering/Morphing/Flickering* = **AI-GENERATED/EDITED** (Temporal Instability).

**REPORTING GUIDELINES:**
- **Introduction**: Provide an "Executive Summary". Immediately state the likely nature of the media and the strongest evidence.
- **Forensic Breakdown**: Provide specific, technical observations. Use a severity score (0-100) where 0 is natural/benign and 100 is impossible/fake.
   - **CRITICAL**: For every forensic point, you MUST provide specific "cues" or locations.
   - Example: 
     { 
       label: "Noise Analysis", 
       description: "Inconsistent grain structure observed.", 
       severity: 85,
       cues: ["Smooth skin texture vs grainy background", "Digital artifacts around hair line"]
     }

**DECISION MATRIX:**
- Gibberish text = **AI-GENERATED** (High Confidence).
- 6 fingers or merging limbs = **AI-GENERATED** (High Confidence).
- Inconsistent lighting/shadows = **AI-GENERATED** (Medium-High Confidence).
- Mismatched noise levels (Smooth face, noisy bg) = **EDITED**.
- Straight lines bending near body = **EDITED**.
- High Quality + Natural Physics + Consistent Grain = **ORIGINAL**.
- Video with compression artifacts but no warping = **ORIGINAL**.

If evidence is inconclusive, and the image looks physically plausible with *uniform* noise characteristics, lean towards **ORIGINAL / AUTHENTIC**.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    introduction: { type: Type.STRING, description: "Executive summary of the findings." },
    inputSummary: { type: Type.STRING, description: "Technical description of input (e.g., '1080p Video, 4 frames analyzed')." },
    detectionResult: { 
      type: Type.STRING, 
      enum: [
        "AI-Generated",
        "Edited / Manipulated",
        "Original / Authentic"
      ] 
    },
    badgeColor: { 
      type: Type.STRING,
      enum: ["Red", "Yellow", "Green"]
    },
    confidenceScore: { type: Type.INTEGER, description: "Probability percentage 0-100" },
    confidenceJustification: { type: Type.STRING, description: "Why this score was given." },
    detailedExplanation: { type: Type.STRING, description: "Comprehensive narrative weaving together the visual and technical evidence." },
    forensicBreakdown: {
      type: Type.ARRAY,
      description: "List of specific technical forensic points.",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Category (e.g. 'Noise Analysis', 'Lighting Logic', 'Temporal Stability')"},
          description: { type: Type.STRING, description: "Specific observation." },
          severity: { type: Type.INTEGER, description: "0-100 scale of suspiciousness (100 = definitely fake)" },
          cues: {
            type: Type.ARRAY,
            description: "List of specific visual cues or image regions identifying the issue.",
            items: { type: Type.STRING }
          }
        },
        required: ["label", "description", "severity", "cues"]
      }
    },
    metadataAnalysis: { type: Type.STRING, description: "Analysis of EXIF or container metadata." },
    visualIndicators: { type: Type.STRING, description: "Key visual tells for the badge." },
    limitations: { type: Type.STRING, description: "What could not be analyzed." },
    finalVerdict: { type: Type.STRING, description: "One sentence conclusion." },
  },
  required: [
    "introduction", "inputSummary", "detectionResult", "badgeColor", 
    "confidenceScore", "confidenceJustification", "detailedExplanation", 
    "forensicBreakdown", "metadataAnalysis", "visualIndicators", "limitations", "finalVerdict"
  ],
};

// Helper for delay
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retries an API call with exponential backoff if a 429 error occurs.
 */
async function generateWithRetry(
  apiCall: () => Promise<any>,
  retries: number = 6,
  delayTime: number = 2000,
  onRetry?: (delay: number) => void
): Promise<any> {
  try {
    return await apiCall();
  } catch (error: any) {
    // Check for 429 or Quota Exceeded errors
    const isQuota = 
      error.status === 429 || 
      error.code === 429 || 
      (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')));

    if (isQuota && retries > 0) {
      console.warn(`Quota hit. Retrying in ${delayTime}ms... (Attempts left: ${retries})`);
      if (onRetry) onRetry(delayTime);
      await wait(delayTime);
      // Increase delay exponentially (1.5x)
      return generateWithRetry(apiCall, retries - 1, Math.ceil(delayTime * 1.5), onRetry);
    }
    throw error;
  }
}

export const analyzeMedia = async (
  base64Data: string | string[] | null,
  mimeType: string | null,
  textUrl: string | null,
  onRetry?: (delay: number) => void
): Promise<AnalysisResponse> => {
  
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-flash-preview';

  const parts: any[] = [];
  
  if (base64Data) {
    const isVideoSequence = Array.isArray(base64Data);

    if (isVideoSequence) {
        // Handle Video: Add all frames as separate parts
        (base64Data as string[]).forEach((frameBase64) => {
            parts.push({
                inlineData: {
                  data: frameBase64,
                  mimeType: mimeType || 'image/jpeg',
                },
            });
        });
        
        // Add Specific Video Prompt for Temporal Analysis
        parts.push({
            text: `Perform a deep temporal forensic analysis on these sequential video frames.
            
            **OBJECTIVE**: Distinguish between authentic video (with compression), AI generation (Sora/Runway), and deepfakes.

            **CRITICAL CHECKS:**
            
            1. **AI Generation Indicators (Synthetic)**:
               - **Morphing Details**: Watch small details like buttons, jewelry, or background leaves. Do they change shape or disappear between frames?
               - **Physics Hallucinations**: Does smoke, water, or hair move according to gravity and wind, or does it "float" unnaturally?
               - **Text Stability**: If there is text in the background, does it stay readable or shift into "alien" gibberish?

            2. **Manipulation Indicators (Edited/Deepfake)**:
               - **Face Stability**: Does the face jitter or detach from the head?
               - **Background Warping**: Watch background lines near moving people. Do they bend? (Liquify/Slimming artifact).
               - **Inconsistent Lighting**: Do shadows disappear or shift illogically?

            **VERDICT RULE**: 
            - If physics are consistent, lighting is continuous, and noise is natural -> **Original / Authentic**.
            - If background details morph, text is gibberish, or physics are floaty -> **AI-Generated**.
            - If background warps around a person -> **Edited**.`
        });

    } else {
        // Handle Single Image
        parts.push({
          inlineData: {
            data: base64Data as string,
            mimeType: mimeType || 'image/jpeg',
          },
        });
        parts.push({
          text: `Perform a forensic analysis of this image.
          
          **Deep Scan for AI Artifacts (Generative Detection):**
          1. **Text & Data**: Zoom in on background text, logos, or newspapers. Are they coherent English (or source language) or "alien" gibberish? -> **AI-Generated**.
          2. **Texture Logic**: Look at complex textures like hair, fur, or grass. Does it turn into a blurry mess or a repeating pattern? -> **AI-Generated**.
          3. **Lighting & Reflection**: Check eyes and mirrors. Do reflections match the world? Do shadows fall consistently?
          
          **Detecting Edits & Manipulation (The "Uncanny Valley" of Photos):**
          1. **Noise Analysis**: Look for **inconsistent noise**. Is the face perfectly smooth but the background grainy? Is one object sharper than the rest of the focal plane? -> **Edited**.
          2. **Geometric Warping**: Check straight lines (walls, tiles) behind the subject. Are they slightly curved? -> **Edited** (Liquify tool).
          
          **Decision Logic**:
          - Physically plausible + Uniform Noise = **Original**.
          - Warped background + Smooth Skin = **Edited**.
          - Gibberish text + Anatomical errors (6 fingers) + Illogical lighting = **AI-Generated**.`
        });
    }
  } else if (textUrl) {
    parts.push({
      text: `Analyze the media content found at this URL for authenticity: ${textUrl}. 
      Use your knowledge or search tools to identify if this is a known viral fake, deepfake, or authentic footage. 
      Analyze context, source credibility, and reported metadata.`
    });
  }

  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
  };

  if (textUrl) {
    config.tools = [{ googleSearch: {} }];
    parts.push({
      text: `\n\nReturn the analysis in valid JSON format matching this schema exactly: ${JSON.stringify(RESPONSE_SCHEMA)}. Do not use Markdown code blocks.`
    });
  } else {
    config.responseMimeType = "application/json";
    config.responseSchema = RESPONSE_SCHEMA;
  }

  try {
    const response = await generateWithRetry(async () => {
      return await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: config
      });
    }, 6, 2000, onRetry);

    let text = response.text;
    if (!text) throw new Error("No response from AI");

    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(text) as AnalysisResponse;
    return json;

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};