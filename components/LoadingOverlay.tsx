
import React from 'react';

interface LoadingOverlayProps {
  text: string;
  progress?: number;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ text, progress }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex flex-col items-center justify-center z-50">
      <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-24 w-24 mb-4 animate-spin" style={{ borderTopColor: '#3d84c6' }}></div>
      <p
        className="text-xl text-white font-semibold text-center px-4"
        dangerouslySetInnerHTML={{ __html: text }}
      ></p>
      {progress !== undefined && (
        <div className="w-4/5 max-w-sm bg-gray-600 rounded-full h-2.5 mt-4 overflow-hidden">
            <div className="bg-[#3d84c6] h-2.5 rounded-full transition-all duration-300 ease-linear" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
};

export default LoadingOverlay;