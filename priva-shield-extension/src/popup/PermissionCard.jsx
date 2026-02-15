import React from 'react';

const PermissionCard = ({ permission }) => {
  const getIconForPermission = (type) => {
    const icons = {
      location: '📍',
      camera: '📷',
      microphone: '🎤',
      contacts: '👥',
      storage: '💾',
      notifications: '🔔',
      default: '🔐',
    };
    return icons[type] || icons.default;
  };

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIconForPermission(permission.type)}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-800 text-sm mb-1">
            {permission.name}
          </h4>
          <p className="text-xs text-gray-600 leading-relaxed mb-2">
            {permission.description}
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Purpose:</span>
            <span className="text-xs text-gray-700 font-medium">
              {permission.purpose}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionCard;
