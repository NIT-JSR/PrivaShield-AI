import React, { useState, useEffect } from 'react';
import RiskBadge from './RiskBadge';

const SiteStatus = () => {
  const [currentSite, setCurrentSite] = useState('');
  const [riskLevel, setRiskLevel] = useState('unknown');

  useEffect(() => {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const url = new URL(tabs[0].url);
        setCurrentSite(url.hostname);
      }
    });
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Current Website</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">{currentSite || 'Loading...'}</p>
        </div>
        <RiskBadge level={riskLevel} />
      </div>
    </div>
  );
};

export default SiteStatus;
