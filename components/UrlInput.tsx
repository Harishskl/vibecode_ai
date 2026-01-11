import React, { useState } from 'react';

interface UrlInputProps {
  onUrlSubmit: (url: string) => void;
}

const UrlInput: React.FC<UrlInputProps> = ({ onUrlSubmit }) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto mt-6">
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <input
          type="url"
          className="block w-full p-4 pl-10 text-sm text-white border border-slate-700 rounded-lg bg-slate-900 focus:ring-neon-blue focus:border-neon-blue placeholder-slate-500"
          placeholder="Paste URL (YouTube, X, Instagram, Facebook)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="submit"
          disabled={!url.trim()}
          className="absolute right-2.5 bottom-2.5 bg-slate-700 hover:bg-slate-600 focus:ring-4 focus:outline-none focus:ring-slate-800 font-medium rounded-lg text-sm px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Analyze
        </button>
      </div>
    </form>
  );
};

export default UrlInput;