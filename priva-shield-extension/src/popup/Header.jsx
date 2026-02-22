import React from 'react';

const Header = () => {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
          <span className="text-2xl">🛡️</span>
        </div>
        <h1 className="text-xl font-bold">PrivaShield</h1>
      </div>
      <p className="text-xs mt-1 text-blue-100">Privacy Policy Analyzer</p>
    </div>
  );
};

export default Header;
