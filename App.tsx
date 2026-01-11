
import React from 'react';
import FileUpload from './components/FileUpload';
import UrlInput from './components/UrlInput';
import AnalysisReport from './components/AnalysisReport';
import { useAnalysis } from './hooks/useAnalysis';

const App: React.FC = () => {
  const {
    mediaState,
    isAnalyzing,
    retryStatus,
    analysisResult,
    error,
    handleFileSelect,
    handleUrlSubmit,
    retryAnalysis,
    resetState
  } = useAnalysis();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-neon-blue selection:text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-gradient-to-tr from-neon-blue to-neon-green flex items-center justify-center">
               <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
               </svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-neon-blue">ai Detector</h1>
          </div>
          <div className="text-xs text-slate-500 font-mono"></div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Intro Section */}
        {!analysisResult && !isAnalyzing && !mediaState.file && !mediaState.url && (
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Media Authenticity <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-green">Verification</span>
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Upload an image, video, or provide a social media URL. Our multimodal AI engine analyzes artifacts, metadata, and semantic consistency to detect manipulation.
            </p>
            
            {/* Initial Bot Message */}
             <div className="mt-8 p-4 bg-slate-900/50 border border-slate-800 rounded-lg max-w-2xl mx-auto text-left flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex-shrink-0 flex items-center justify-center text-xl">🤖</div>
                <div className="text-sm text-slate-300">
                    <p className="mb-2 font-semibold text-neon-blue">System Message:</p>
                    <p>Welcome! I am an AI-powered Media Authenticity Analyzer. You can upload an image, upload a video, or provide a social media link from YouTube, Facebook, X, or Instagram.</p>
                    <p className="mt-2 text-xs text-slate-500">Please note: results are probabilistic and not absolute proof.</p>
                </div>
             </div>
          </div>
        )}

        {/* Input Section */}
        {!analysisResult && !isAnalyzing && (
          <div className="animate-fade-in space-y-8">
            {!mediaState.file && !mediaState.url && (
              <>
                <FileUpload onFileSelect={handleFileSelect} />
                <div className="flex items-center justify-center space-x-4 text-slate-600">
                  <span className="h-px w-16 bg-slate-800"></span>
                  <span className="text-sm uppercase tracking-wider">OR DETECT VIA URL</span>
                  <span className="h-px w-16 bg-slate-800"></span>
                </div>
                <UrlInput onUrlSubmit={handleUrlSubmit} />
              </>
            )}
          </div>
        )}

        {/* Loading State */}
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-8 relative">
            <div className="relative w-64 h-64 border-2 border-slate-800 rounded-lg overflow-hidden bg-slate-900">
                {mediaState.previewUrl && mediaState.type === 'image' && (
                    <img src={mediaState.previewUrl} alt="Analyzing" className="w-full h-full object-cover opacity-50 filter grayscale" />
                )}
                {mediaState.type === 'video' && mediaState.previewUrl && (
                     <video src={mediaState.previewUrl} className="w-full h-full object-cover opacity-50 filter grayscale" />
                )}
                {mediaState.type === 'url' && (
                    <div className="flex items-center justify-center h-full text-slate-600">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    </div>
                )}
                <div className="scan-line"></div>
                <div className="absolute inset-0 border-2 border-neon-blue opacity-30 animate-pulse rounded-lg"></div>
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-xl font-mono text-white animate-pulse">
                  {retryStatus ? 'RETRYING...' : (mediaState.type === 'video' ? 'ANALYZING TEMPORAL DATA...' : 'ANALYZING ARTIFACTS...')}
                </h3>
                <p className="text-slate-500 text-sm">
                  {retryStatus || (mediaState.type === 'video' ? 'Processing frames for motion consistency' : 'Processing semantic coherence and metadata')}
                </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
            <div className="max-w-xl mx-auto mt-8 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-center animate-fade-in">
                <div className="flex items-center justify-center mb-2">
                   <svg className="w-6 h-6 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                   <p className="font-bold text-lg">Analysis Failed</p>
                </div>
                
                <p className="text-sm text-red-100/80 mb-4">
                  {error.includes("429") || error.includes("quota") || error.includes("RESOURCE_EXHAUSTED") ? (
                    <span>
                      High traffic on the AI model. We retried automatically, but the servers are still busy.<br/>
                      <span className="font-semibold text-white">Please wait 30-60 seconds before trying again.</span>
                    </span>
                  ) : (
                    error
                  )}
                </p>

                <div className="flex justify-center gap-4">
                  <button 
                    onClick={resetState} 
                    className="px-6 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-full text-sm font-medium transition-colors"
                  >
                    Select New File
                  </button>
                  {/* If we have state, allow immediate retry */}
                  {(mediaState.file || mediaState.url) && (
                      <button 
                        onClick={retryAnalysis} 
                        className="px-6 py-2 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 rounded-full text-sm font-medium transition-colors"
                      >
                        Try Again Now
                      </button>
                  )}
                </div>
            </div>
        )}

        {/* Results */}
        {analysisResult && (
          <AnalysisReport data={analysisResult} onReset={resetState} />
        )}

      </main>

      <footer className="border-t border-slate-800 bg-slate-950 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <p className="text-slate-600 text-sm">
             ai Detector is Powered by Vibecode.ai
           </p>
           <p className="text-slate-700 text-xs mt-2">
             This tool is for demonstration purposes only. The results are probabilistic estimations.
           </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
