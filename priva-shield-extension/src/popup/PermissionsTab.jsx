import React from 'react';
import PermissionCard from './PermissionCard';

const PermissionsTab = ({ data }) => {
  if (!data || !data.permissions) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-4xl mb-3">🔐</p>
        <p className="text-sm">No permission analysis available yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.permissions.map((permission, index) => (
        <PermissionCard key={index} permission={permission} />
      ))}
    </div>
  );
};

export default PermissionsTab;
