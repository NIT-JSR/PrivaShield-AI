import React from 'react';

const Tabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'summary', label: 'Summary', icon: '📄' },
    { id: 'risks', label: 'Risks', icon: '⚠️' },
    { id: 'permissions', label: 'Permissions', icon: '🔐' },
    { id: 'chat', label: 'Chat', icon: '💬' },
  ];

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors duration-200 ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;
