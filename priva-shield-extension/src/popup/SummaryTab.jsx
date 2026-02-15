import React from 'react';

const SummaryTab = ({ data }) => {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-3">🔍</p>
        <p className="text-sm">Click "Analyze Privacy Policy" to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2">Policy Summary</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          {data.summary || 'No summary available'}
        </p>
      </div>
      
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-2">Key Points</h3>
        <ul className="space-y-2">
          {data.keyPoints?.map((point, index) => (
            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>{point}</span>
            </li>
          )) || <li className="text-sm text-gray-500">No key points available</li>}
        </ul>
      </div>
    </div>
  );
};

export default SummaryTab;
