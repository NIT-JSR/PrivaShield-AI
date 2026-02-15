import React, { useState } from 'react';
import Header from './Header';
import SiteStatus from './SiteStatus';
import ActionBar from './ActionBar';
import Tabs from './Tabs';
import SummaryTab from './SummaryTab';
import RisksTab from './RisksTab';
import PermissionsTab from './PermissionsTab';
import ChatTab from './ChatTab';

const Popup = () => {
  const [activeTab, setActiveTab] = useState('summary');
  const [analysisData, setAnalysisData] = useState(null);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'summary':
        return <SummaryTab data={analysisData} />;
      case 'risks':
        return <RisksTab data={analysisData} />;
      case 'permissions':
        return <PermissionsTab data={analysisData} />;
      case 'chat':
        return <ChatTab />;
      default:
        return <SummaryTab data={analysisData} />;
    }
  };

  return (
    <div className="w-full h-full bg-gray-50">
      <Header />
      <SiteStatus />
      <ActionBar onAnalyze={setAnalysisData} />
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="p-4">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Popup;
