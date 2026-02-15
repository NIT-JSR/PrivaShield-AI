import React, { useState } from 'react';
import { analyzePolicy } from '../services/api';

const ActionBar = ({ onAnalyze }) => {
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzePolicy();
      onAnalyze(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <span className="animate-spin">⏳</span>
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <span>🔍</span>
            <span>Analyze Privacy Policy</span>
          </>
        )}
      </button>
    </div>
  );
};

export default ActionBar;
