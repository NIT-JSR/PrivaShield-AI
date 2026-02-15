import React from 'react';
import RiskBadge from './RiskBadge';

const RisksTab = ({ data }) => {
  if (!data || !data.risks) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-sm">No risk analysis available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.risks.map((risk, index) => (
        <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-gray-800 text-sm">{risk.title}</h4>
            <RiskBadge level={risk.level} />
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{risk.description}</p>
          {risk.clause && (
            <div className="mt-3 p-2 bg-gray-50 rounded border-l-4 border-yellow-400">
              <p className="text-xs text-gray-700 italic">"{risk.clause}"</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default RisksTab;
