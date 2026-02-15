import React from 'react';

const RiskBadge = ({ level }) => {
  const getStyles = () => {
    switch (level.toLowerCase()) {
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLabel = () => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStyles()}`}
    >
      {getLabel()}
    </span>
  );
};

export default RiskBadge;
