
import { useState } from 'react';
import { AnalysisResponse, MediaState } from '../types';
import { analyzeMedia } from '../services/geminiService';
import { convertFileToBase64, extractFramesFromVideo } from '../utils/mediaUtils';

export const useAnalysis = () => {
  const [mediaState, setMediaState] = useState<MediaState>({
    file: null,
    url: null,
    previewUrl: null,
    type: null
  });
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setMediaState({ file: null, url: null, previewUrl: null, type: null });
    setAnalysisResult(null);
    setError(null);
    setIsAnalyzing(false);
    setRetryStatus(null);
  };

  const handleFileSelect = async (file: File) => {
    setError(null);
    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');
    
    setMediaState({
      file,
      url: null,
      previewUrl: objectUrl,
      type: isVideo ? 'video' : 'image'
    });

    performAnalysis(file, null);
  };

  const handleUrlSubmit = (url: string) => {
    setError(null);
    setMediaState({
      file: null,
      url,
      previewUrl: null,
      type: 'url'
    });
    performAnalysis(null, url);
  };

  const retryAnalysis = () => {
    if (mediaState.file || mediaState.url) {
      performAnalysis(mediaState.file, mediaState.url);
    }
  };

  const performAnalysis = async (file: File | null, url: string | null) => {
    setIsAnalyzing(true);
    setRetryStatus(null);
    
    try {
      let dataPayload: string | string[] | null = null;
      let mimeType: string | null = null;

      // 1. Pre-process Media
      if (file) {
        if (file.type.startsWith('image/')) {
            dataPayload = await convertFileToBase64(file);
            mimeType = file.type;
        } else if (file.type.startsWith('video/')) {
            // Extract multiple frames for temporal analysis
            dataPayload = await extractFramesFromVideo(file, 4);
            mimeType = 'image/jpeg';
        }
      }

      // 2. Call Service Layer
      const result = await analyzeMedia(
        dataPayload, 
        mimeType, 
        url,
        (delay) => setRetryStatus(`Server busy (Quota). Retrying in ${delay/1000}s...`)
      );
      
      setAnalysisResult(result);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setIsAnalyzing(false);
      setRetryStatus(null);
    }
  };

  return {
    mediaState,
    isAnalyzing,
    retryStatus,
    analysisResult,
    error,
    handleFileSelect,
    handleUrlSubmit,
    retryAnalysis,
    resetState
  };
};
