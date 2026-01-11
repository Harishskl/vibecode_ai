import React from 'react';
import { AnalysisResponse, BadgeColor, DetectionResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';

interface AnalysisReportProps {
  data: AnalysisResponse;
  onReset: () => void;
}

const AnalysisReport: React.FC<AnalysisReportProps> = ({ data, onReset }) => {
  const getBadgeStyles = () => {
    // Explicitly enforce red styling for AI-Generated results
    if (data.detectionResult === DetectionResult.AI_GENERATED) {
      return {
        classes: 'bg-red-500/20 text-red-400 border-red-500/50',
        color: '#ef4444'
      };
    }

    switch (data.badgeColor) {
      case BadgeColor.RED: return { classes: 'bg-red-500/20 text-red-400 border-red-500/50', color: '#ef4444' };
      case BadgeColor.YELLOW: return { classes: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50', color: '#eab308' };
      case BadgeColor.GREEN: return { classes: 'bg-green-500/20 text-green-400 border-green-500/50', color: '#22c55e' };
      default: return { classes: 'bg-slate-500/20 text-slate-400 border-slate-500/50', color: '#64748b' };
    }
  };

  const styles = getBadgeStyles();

  const chartData = [
    { name: 'Confidence', value: data.confidenceScore },
    { name: 'Uncertainty', value: 100 - data.confidenceScore }
  ];

  // Helper to determine severity color for breakdown items
  const getSeverityColor = (score: number) => {
      if (score < 30) return 'text-green-400 border-green-500/30 bg-green-500/10';
      if (score < 70) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
      return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Header Badge */}
      <div className="flex flex-col items-center mb-8">
        <div className={`px-6 py-2 rounded-full border ${styles.classes} font-bold text-xl mb-4 tracking-wide uppercase shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
          {data.detectionResult}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Confidence Score</h3>
            <div className="h-48 w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell key="confidence" fill={styles.color} />
                    <Cell key="uncertainty" fill="#1e293b" />
                    <Label 
                        value={`${data.confidenceScore}%`} 
                        position="center" 
                        fill="white" 
                        style={{ fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace' }}
                    />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">{data.confidenceJustification}</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Input Summary</h3>
             <p className="text-sm text-slate-300 leading-relaxed">{data.inputSummary}</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
             <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Metadata Check</h3>
             <p className="text-sm text-slate-300 font-mono leading-relaxed">{data.metadataAnalysis}</p>
          </div>
        </div>

        {/* Right Column: Detailed Text */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Main Analysis Narrative */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
             
             <h3 className="text-neon-blue text-sm font-bold uppercase tracking-wider mb-3">Executive Summary</h3>
             <p className="text-slate-200 mb-6 leading-relaxed font-medium">{data.introduction}</p>

             <h3 className="text-neon-blue text-sm font-bold uppercase tracking-wider mb-3">Detailed Reasoning</h3>
             <p className="text-slate-300 mb-2 leading-relaxed whitespace-pre-wrap">{data.detailedExplanation}</p>
          </div>

          {/* Forensic Evidence Log (Structured) */}
          {data.forensicBreakdown && data.forensicBreakdown.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
               <h3 className="text-neon-blue text-sm font-bold uppercase tracking-wider mb-4 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Forensic Evidence Log
               </h3>
               <div className="space-y-3">
                 {data.forensicBreakdown.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors">
                       <div className="flex-1 space-y-2">
                          <div>
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-wide block mb-1">{item.label}</span>
                              <span className="text-sm text-slate-300 font-medium">{item.description}</span>
                          </div>

                          {/* Specific Cues Section */}
                          {item.cues && item.cues.length > 0 && (
                              <div className="bg-slate-900/50 rounded p-3 border border-slate-800/50 mt-2">
                                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2 tracking-wider">Detected Artifacts & Locations</span>
                                  <ul className="grid grid-cols-1 gap-2">
                                      {item.cues.map((cue, i) => (
                                          <li key={i} className="text-xs text-slate-400 flex items-start">
                                              <span className="mr-2 text-neon-blue mt-0.5">•</span>
                                              {cue}
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                       </div>
                       
                       <div className="sm:text-right flex sm:flex-col justify-between sm:justify-start items-center sm:items-end min-w-[100px] border-t sm:border-t-0 border-slate-800 pt-3 sm:pt-0 mt-2 sm:mt-0">
                          <span className="text-[10px] uppercase text-slate-500 font-bold mb-1 mr-2 sm:mr-0">Severity Impact</span>
                          <span className={`px-3 py-1 rounded text-sm font-bold border ${getSeverityColor(item.severity)}`}>
                            {item.severity}%
                          </span>
                       </div>
                    </div>
                 ))}
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Limitations</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{data.limitations}</p>
             </div>
             <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Final Verdict</h3>
                <p className="text-sm text-white font-medium leading-relaxed">{data.finalVerdict}</p>
             </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-12">
        <button 
          onClick={onReset}
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700"
        >
          Analyze Another File
        </button>
      </div>
    </div>
  );
};

export default AnalysisReport;